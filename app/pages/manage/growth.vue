<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import ManageMetricCard from "~/components/manage/ManageMetricCard.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type {
  AdminGrowthDailyPoint,
  AdminGrowthSummary,
  AdminGrowthTopTag,
  AdminGrowthWindowDays,
} from "~/types/adminGrowthApi";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.SYSTEM_METRICS_VIEW,
});

const auth = useAuth();
const api = usePromptDraftApi();
const { locale, t } = useI18n();
const { width } = useWindowSize({ initialWidth: 1024 });

const days = ref<AdminGrowthWindowDays>(7);
const summary = ref<AdminGrowthSummary | null>(null);
const series = ref<AdminGrowthDailyPoint[]>([]);
const topTags = ref<AdminGrowthTopTag[]>([]);
const generatedAt = ref("");
const loading = ref(false);
const errorMessage = ref("");

const cardColumns = computed(() => {
  if (width.value < 640) return 1;
  if (width.value < 1024) return 2;
  return 4;
});

const isLaptopUp = computed(() => width.value >= 1024);

function percent(value: number) {
  return `${new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function number(value: number) {
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(value);
}

function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(locale.value === "fa" ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

const generatedAtLabel = computed(() => {
  if (!generatedAt.value) return "";
  const date = new Date(generatedAt.value);
  if (Number.isNaN(date.getTime())) return generatedAt.value;

  return date.toLocaleString(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

const audienceCards = computed(() => {
  const value = summary.value;
  if (!value) return [];

  return [
    {
      key: "tracked-visitors",
      label: t("manage.growth.cards.trackedVisitors.label"),
      helper: t("manage.growth.cards.trackedVisitors.helper"),
      value: value.audience.trackedVisitors,
      icon: "visibility",
      color: "blue",
    },
    {
      key: "tracked-authenticated",
      label: t("manage.growth.cards.trackedAuthenticated.label"),
      helper: t("manage.growth.cards.trackedAuthenticated.helper"),
      value: value.audience.trackedAuthenticatedUsers,
      icon: "person_check",
      color: "prim",
    },
    {
      key: "returning-authenticated",
      label: t("manage.growth.cards.returningAuthenticated.label"),
      helper: t("manage.growth.cards.returningAuthenticated.helper"),
      value: value.audience.returningAuthenticatedUsers,
      icon: "replay",
      color: "green",
    },
    {
      key: "new-accounts",
      label: t("manage.growth.cards.newAccounts.label"),
      helper: t("manage.growth.cards.newAccounts.helper"),
      value: value.audience.newAccounts,
      icon: "person_add",
      color: "orange",
    },
  ];
});

const promptCards = computed(() => {
  const value = summary.value;
  if (!value) return [];

  return [
    {
      key: "prompt-views",
      label: t("manage.growth.cards.promptViews.label"),
      helper: t("manage.growth.cards.promptViews.helper"),
      value: value.prompts.views,
      icon: "visibility",
      color: "blue",
    },
    {
      key: "prompt-copies",
      label: t("manage.growth.cards.promptCopies.label"),
      helper: t("manage.growth.cards.promptCopies.helper"),
      value: value.prompts.copies,
      icon: "content_copy",
      color: "prim",
    },
    {
      key: "copy-session-rate",
      label: t("manage.growth.cards.copySessionRate.label"),
      helper: t("manage.growth.cards.copySessionRate.helper"),
      value: percent(value.prompts.copySessionRate),
      icon: "percent",
      color: "green",
    },
    {
      key: "prompt-unlocks",
      label: t("manage.growth.cards.promptUnlocks.label"),
      helper: t("manage.growth.cards.promptUnlocks.helper"),
      value: value.prompts.unlocks,
      icon: "lock_open",
      color: "orange",
    },
  ];
});

const referralCards = computed(() => {
  const value = summary.value;
  if (!value) return [];

  return [
    {
      key: "referral-opens",
      label: t("manage.growth.cards.referralOpens.label"),
      helper: t("manage.growth.cards.referralOpens.helper"),
      value: value.referrals.linkOpens,
      icon: "link",
      color: "blue",
    },
    {
      key: "referral-signups",
      label: t("manage.growth.cards.referralSignups.label"),
      helper: t("manage.growth.cards.referralSignups.helper"),
      value: value.referrals.signups,
      icon: "group_add",
      color: "green",
    },
    {
      key: "referral-share",
      label: t("manage.growth.cards.referralShare.label"),
      helper: t("manage.growth.cards.referralShare.helper"),
      value: percent(value.referrals.shareOfNewAccounts),
      icon: "pie_chart",
      color: "prim",
    },
    {
      key: "referral-ratio",
      label: t("manage.growth.cards.referralRatio.label"),
      helper: t("manage.growth.cards.referralRatio.helper"),
      value: percent(value.referrals.openToSignupRatio),
      icon: "conversion_path",
      color: "orange",
    },
  ];
});

const economyCards = computed(() => {
  const value = summary.value;
  if (!value) return [];

  return [
    {
      key: "goin-issued",
      label: t("manage.growth.cards.goinIssued.label"),
      helper: t("manage.growth.cards.goinIssued.helper"),
      value: value.economy.issued,
      icon: "add_circle",
      color: "green",
    },
    {
      key: "goin-spent",
      label: t("manage.growth.cards.goinSpent.label"),
      helper: t("manage.growth.cards.goinSpent.helper"),
      value: value.economy.spent,
      icon: "remove_circle",
      color: "orange",
    },
    {
      key: "goin-outstanding",
      label: t("manage.growth.cards.goinOutstanding.label"),
      helper: t("manage.growth.cards.goinOutstanding.helper"),
      value: value.economy.outstanding,
      icon: "account_balance_wallet",
      color: "prim",
    },
    {
      key: "active-spenders",
      label: t("manage.growth.cards.activeSpenders.label"),
      helper: t("manage.growth.cards.activeSpenders.helper"),
      value: value.economy.activeSpenders,
      icon: "shopping_cart",
      color: "blue",
    },
  ];
});

function getApiErrorMessage(error: unknown) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string" && value.data.message.trim()
    ? value.data.message
    : t("manage.growth.loadError");
}

async function loadMetrics() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await api.getAdminGrowthSummary(days.value);
    summary.value = response.summary;
    series.value = response.series;
    topTags.value = response.topTags;
    generatedAt.value = response.summary.period.generatedAt;
  } catch (error) {
    console.error("[Prompt Draft] growth metrics failed", error);
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function selectWindow(value: AdminGrowthWindowDays) {
  if (days.value === value) return;
  days.value = value;
  await loadMetrics();
}

onMounted(async () => {
  await auth.initialize();
  await loadMetrics();
});
</script>

<template>
  <el-flex rules="ccs" :gap="20" class="w100">
    <el-flex rules="rbc" :gap="12" class="w100 fw">
      <el-text :size="11" color="normal45">
        {{ generatedAtLabel ? t("manage.growth.lastUpdated", { date: generatedAtLabel }) : "" }}
      </el-text>

      <el-flex rules="rcc" :gap="6">
        <el-button
          :color="days === 7 ? 'prim' : 'normal'"
          :mode="days === 7 ? 'normal' : 'flat'"
          :label="t('manage.growth.window.sevenDays')"
          :disable="loading"
          @click="selectWindow(7)"
        />
        <el-button
          :color="days === 30 ? 'prim' : 'normal'"
          :mode="days === 30 ? 'normal' : 'flat'"
          :label="t('manage.growth.window.thirtyDays')"
          :disable="loading"
          @click="selectWindow(30)"
        />
        <el-button
          mode="flat"
          color="normal"
          icon="refresh"
          :label="t('manage.common.actions.refresh')"
          :disable="loading"
          @click="loadMetrics"
        />
      </el-flex>
    </el-flex>

    <el-flex
      rules="rsc"
      :gap="10"
      class="w100"
      bg="blue10"
      :p="12"
      :radius="10">
      <el-icon icon="info" color="blue" :size="18" />
      <el-flex rules="csc" :gap="3">
        <el-text :size="12" :weight="700">{{ t("manage.growth.measurementTitle") }}</el-text>
        <el-text :size="11" color="normal55">{{ t("manage.growth.measurementNote") }}</el-text>
      </el-flex>
    </el-flex>

    <el-flex
      v-if="errorMessage"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="red10"
      :p="12"
      :radius="10">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">{{ errorMessage }}</el-text>
    </el-flex>

    <el-flex v-if="loading && !summary" rules="ccc" class="w100" :p="24">
      <el-text color="normal55" :size="13">{{ t("manage.growth.loading") }}</el-text>
    </el-flex>

    <template v-else-if="summary">
      <el-flex rules="ccs" :gap="10" class="w100">
        <el-text type="h3" :size="18" :weight="800">{{ t("manage.growth.groups.audience") }}</el-text>
        <el-grid :cols="cardColumns" :gap="12" align-items="stretch" class="w100">
          <ManageMetricCard
            v-for="card in audienceCards"
            :key="card.key"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :color="card.color"
            :helper="card.helper"
            :large="isLaptopUp"
          />
        </el-grid>
      </el-flex>

      <el-flex rules="ccs" :gap="10" class="w100">
        <el-text type="h3" :size="18" :weight="800">{{ t("manage.growth.groups.prompts") }}</el-text>
        <el-grid :cols="cardColumns" :gap="12" align-items="stretch" class="w100">
          <ManageMetricCard
            v-for="card in promptCards"
            :key="card.key"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :color="card.color"
            :helper="card.helper"
            :large="isLaptopUp"
          />
        </el-grid>
      </el-flex>

      <el-flex rules="ccs" :gap="10" class="w100">
        <el-text type="h3" :size="18" :weight="800">{{ t("manage.growth.groups.referrals") }}</el-text>
        <el-grid :cols="cardColumns" :gap="12" align-items="stretch" class="w100">
          <ManageMetricCard
            v-for="card in referralCards"
            :key="card.key"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :color="card.color"
            :helper="card.helper"
            :large="isLaptopUp"
          />
        </el-grid>
      </el-flex>

      <el-flex rules="ccs" :gap="10" class="w100">
        <el-text type="h3" :size="18" :weight="800">{{ t("manage.growth.groups.economy") }}</el-text>
        <el-grid :cols="cardColumns" :gap="12" align-items="stretch" class="w100">
          <ManageMetricCard
            v-for="card in economyCards"
            :key="card.key"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :color="card.color"
            :helper="card.helper"
            :large="isLaptopUp"
          />
        </el-grid>
      </el-flex>

      <el-grid :cols="width < 900 ? 1 : 2" :gap="16" align-items="start" class="w100">
        <el-flex rules="ccs" :gap="12" bg="surface" :p="16" :radius="14" :br="1" bc="normal15" class="w100">
          <el-flex rules="ccs" :gap="3" class="w100">
            <el-text :size="17" :weight="800">{{ t("manage.growth.daily.title") }}</el-text>
            <el-text :size="11" color="normal55">{{ t("manage.growth.daily.description") }}</el-text>
          </el-flex>

          <div class="growth-table-wrap w100">
            <div class="growth-table">
              <el-text :size="11" :weight="700">{{ t("manage.growth.daily.day") }}</el-text>
              <el-text :size="11" :weight="700">{{ t("manage.growth.daily.views") }}</el-text>
              <el-text :size="11" :weight="700">{{ t("manage.growth.daily.copies") }}</el-text>
              <el-text :size="11" :weight="700">{{ t("manage.growth.daily.referralSignups") }}</el-text>
              <el-text :size="11" :weight="700">{{ t("manage.growth.daily.issued") }}</el-text>
              <el-text :size="11" :weight="700">{{ t("manage.growth.daily.spent") }}</el-text>
              <el-text :size="11" :weight="700">{{ t("manage.growth.daily.unlocks") }}</el-text>

              <template v-for="point in series" :key="point.day">
                <el-text :size="11">{{ formatDay(point.day) }}</el-text>
                <el-text :size="11">{{ number(point.promptViews) }}</el-text>
                <el-text :size="11">{{ number(point.promptCopies) }}</el-text>
                <el-text :size="11">{{ number(point.referralSignups) }}</el-text>
                <el-text :size="11">{{ number(point.goinIssued) }}</el-text>
                <el-text :size="11">{{ number(point.goinSpent) }}</el-text>
                <el-text :size="11">{{ number(point.promptUnlocks) }}</el-text>
              </template>
            </div>
          </div>
        </el-flex>

        <el-flex rules="ccs" :gap="12" bg="surface" :p="16" :radius="14" :br="1" bc="normal15" class="w100">
          <el-flex rules="ccs" :gap="3" class="w100">
            <el-text :size="17" :weight="800">{{ t("manage.growth.tags.title") }}</el-text>
            <el-text :size="11" color="normal55">{{ t("manage.growth.tags.description") }}</el-text>
          </el-flex>

          <el-text v-if="!topTags.length" :size="12" color="normal55">
            {{ t("manage.growth.tags.empty") }}
          </el-text>

          <el-flex v-else rules="ccs" :gap="8" class="w100">
            <el-flex
              v-for="tag in topTags"
              :key="tag.slug"
              rules="rbc"
              :gap="12"
              class="w100"
              bg="normal5"
              :p="10"
              :radius="9">
              <el-text :size="12" :weight="700">#{{ tag.slug }}</el-text>
              <el-flex rules="rcc" :gap="8">
                <el-text :size="10" color="normal55">
                  {{ t("manage.growth.tags.views", { count: number(tag.views) }) }}
                </el-text>
                <el-text :size="10" color="prim">
                  {{ t("manage.growth.tags.copies", { count: number(tag.copies) }) }}
                </el-text>
              </el-flex>
            </el-flex>
          </el-flex>
        </el-flex>
      </el-grid>
    </template>
  </el-flex>
</template>

<style scoped>
.growth-table-wrap {
  overflow-x: auto;
}

.growth-table {
  display: grid;
  grid-template-columns: minmax(84px, 1.2fr) repeat(6, minmax(72px, 1fr));
  gap: 8px 12px;
  min-width: 680px;
  align-items: center;
}
</style>
