<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import ManageMetricCard from "~/components/manage/ManageMetricCard.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type { AdminDashboardSummary } from "~/types/adminDashboardApi";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.DASHBOARD_VIEW,
});

const auth = useAuth();
const api = usePromptDraftApi();
const { locale, t } = useI18n();
const { width } = useWindowSize({ initialWidth: 1024 });

const summary = ref<AdminDashboardSummary | null>(null);
const generatedAt = ref("");
const loading = ref(false);
const errorMessage = ref("");

const isLaptopUp = computed(() => width.value >= 1024);
const dashboardColumns = computed(() => {
  if (width.value < 640) return 1;
  if (width.value < 1024) return 2;
  return 4;
});

const cards = computed(() => {
  const value = summary.value;
  if (!value) return [];

  return [
    {
      key: "total-users",
      label: t("manage.dashboard.cards.totalUsers.label"),
      value: value.accounts.total,
      icon: "group",
      color: "blue",
      helper: t("manage.dashboard.cards.totalUsers.helper"),
    },
    {
      key: "active-accounts",
      label: t("manage.dashboard.cards.activeAccounts.label"),
      value: value.accounts.active,
      icon: "person_check",
      color: "green",
      helper: t("manage.dashboard.cards.activeAccounts.helper"),
    },
    {
      key: "suspended-accounts",
      label: t("manage.dashboard.cards.suspendedAccounts.label"),
      value: value.accounts.suspended,
      icon: "block",
      color: "red",
      helper: t("manage.dashboard.cards.suspendedAccounts.helper"),
    },
    {
      key: "new-users-today",
      label: t("manage.dashboard.cards.newUsersToday.label"),
      value: value.accounts.newToday,
      icon: "person_add",
      color: "prim",
      helper: t("manage.dashboard.cards.newUsersToday.helper"),
    },
    {
      key: "active-sessions",
      label: t("manage.dashboard.cards.activeSessions.label"),
      value: value.sessions.active,
      icon: "devices",
      color: "orange",
      helper: t("manage.dashboard.cards.activeSessions.helper"),
    },
    {
      key: "cloud-drafts",
      label: t("manage.dashboard.cards.cloudDrafts.label"),
      value: value.cloudDrafts.total,
      icon: "cloud",
      color: "blue",
      helper: t("manage.dashboard.cards.cloudDrafts.helper"),
    },
    {
      key: "drafts-updated-today",
      label: t("manage.dashboard.cards.draftsUpdatedToday.label"),
      value: value.cloudDrafts.updatedToday,
      icon: "cloud_sync",
      color: "prim",
      helper: t("manage.dashboard.cards.draftsUpdatedToday.helper"),
    },
    {
      key: "admin-actions-today",
      label: t("manage.dashboard.cards.adminActionsToday.label"),
      value: value.adminActions.today,
      icon: "admin_panel_settings",
      color: "orange",
      helper: t("manage.dashboard.cards.adminActionsToday.helper"),
    },
  ];
});

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
    second: "2-digit",
  });
});

const dashboardStatusLabel = computed(() => {
  return generatedAtLabel.value
    ? t("manage.dashboard.lastUpdated", { date: generatedAtLabel.value })
    : t("manage.dashboard.liveSummary");
});

function getApiErrorMessage(error: unknown) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string" && value.data.message.trim()
    ? value.data.message
    : t("manage.dashboard.loadError");
}

async function loadSummary() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await api.getAdminDashboardSummary();
    summary.value = response.summary;
    generatedAt.value = response.period.generatedAt;
  } catch (error) {
    console.error("[Prompt Draft] dashboard summary failed", error);
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await auth.initialize();
  await loadSummary();
});
</script>

<template>
  <el-flex rules="ccs" :gap="16" class="w100">
    <el-flex rules="rbc" :gap="12" class="w100">
      <el-text :size="11" color="normal45">
        {{ dashboardStatusLabel }}
      </el-text>

      <el-button
        mode="flat"
        color="normal"
        icon="refresh"
        :label="t('manage.common.actions.refresh')"
        :disable="loading"
        @click="loadSummary"
      />
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
      <el-text color="normal55" :size="13">{{ t("manage.dashboard.loading") }}</el-text>
    </el-flex>

    <el-grid
      v-else-if="summary"
      :cols="dashboardColumns"
      :gap="12"
      align-items="stretch"
      class="w100">
      <ManageMetricCard
        v-for="card in cards"
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
</template>
