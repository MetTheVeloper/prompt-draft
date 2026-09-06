<script setup lang="ts">
import ManageMetricCard from "~/components/manage/ManageMetricCard.vue";
import ManageGrowthVisuals from "~/components/manage/ManageGrowthVisuals.vue";
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
const { mobile, tablet, laptop, desktop, wide } = useScreen();

const days = ref<AdminGrowthWindowDays>(7);
const summary = ref<AdminGrowthSummary | null>(null);
const series = ref<AdminGrowthDailyPoint[]>([]);
const topTags = ref<AdminGrowthTopTag[]>([]);
const generatedAt = ref("");
const loading = ref(false);
const errorMessage = ref("");

const cardColumns = computed(() => {
  if (mobile.value) return 1;
  if (tablet.value) return 2;
  return 4;
});

const metricGroupColumns = computed(() => desktop.value || wide.value ? 2 : 1);
const useLargeCards = computed(() => laptop.value);

function percent(value: number) {
  return `${new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
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
      unit: "goin" as const,
    },
    {
      key: "goin-spent",
      label: t("manage.growth.cards.goinSpent.label"),
      helper: t("manage.growth.cards.goinSpent.helper"),
      value: value.economy.spent,
      icon: "remove_circle",
      color: "orange",
      unit: "goin" as const,
    },
    {
      key: "goin-outstanding",
      label: t("manage.growth.cards.goinOutstanding.label"),
      helper: t("manage.growth.cards.goinOutstanding.helper"),
      value: value.economy.outstanding,
      icon: "account_balance_wallet",
      color: "prim",
      unit: "goin" as const,
    },
    {
      key: "active-spenders",
      label: t("manage.growth.cards.activeSpenders.label"),
      helper: t("manage.growth.cards.activeSpenders.helper"),
      value: value.economy.activeSpenders,
      icon: "shopping_cart",
      color: "blue",
      unit: null,
    },
  ];
});

const metricGroups = computed(() => [
  {
    key: "audience",
    title: t("manage.growth.groups.audience"),
    cards: audienceCards.value,
  },
  {
    key: "prompts",
    title: t("manage.growth.groups.prompts"),
    cards: promptCards.value,
  },
  {
    key: "referrals",
    title: t("manage.growth.groups.referrals"),
    cards: referralCards.value,
  },
  {
    key: "economy",
    title: t("manage.growth.groups.economy"),
    cards: economyCards.value,
  },
]);

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
      <el-flex rules="ccs" :gap="3" class="fg100">
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
      <ManageGrowthVisuals :series="series" :top-tags="topTags" />

      <el-grid
        :cols="metricGroupColumns"
        :gap="16"
        align-items="start"
        class="w100">
        <el-flex
          v-for="group in metricGroups"
          :key="group.key"
          rules="ccs"
          :gap="10"
          class="w100">
          <el-text type="h3" :size="18" :weight="800">{{ group.title }}</el-text>
          <el-grid :cols="cardColumns" :gap="12" align-items="stretch" class="w100">
            <ManageMetricCard
              v-for="card in group.cards"
              :key="card.key"
              :label="card.label"
              :value="card.value"
              :icon="card.icon"
              :color="card.color"
              :helper="card.helper"
              :large="useLargeCards"
              :unit="'unit' in card ? card.unit : null"
            />
          </el-grid>
        </el-flex>
      </el-grid>
    </template>
  </el-flex>
</template>
