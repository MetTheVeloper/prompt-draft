<script setup lang="ts">
import ManageMetricCard from "~/components/manage/ManageMetricCard.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type { AdminDashboardSummary } from "~/types/adminDashboardApi";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.DASHBOARD_VIEW,
});

const auth = useAuth();
const api = usePromptDraftApi();
const { locale } = useI18n();

const summary = ref<AdminDashboardSummary | null>(null);
const generatedAt = ref("");
const loading = ref(false);
const errorMessage = ref("");

const cards = computed(() => {
  const value = summary.value;
  if (!value) return [];

  return [
    {
      key: "total-users",
      label: "Total users",
      value: value.accounts.total,
      icon: "group",
      color: "blue",
      helper: "Registered accounts",
    },
    {
      key: "active-accounts",
      label: "Active accounts",
      value: value.accounts.active,
      icon: "person_check",
      color: "green",
      helper: "Accounts allowed to sign in",
    },
    {
      key: "suspended-accounts",
      label: "Suspended accounts",
      value: value.accounts.suspended,
      icon: "block",
      color: "red",
      helper: "Accounts blocked from signing in",
    },
    {
      key: "new-users-today",
      label: "New users today",
      value: value.accounts.newToday,
      icon: "person_add",
      color: "prim",
      helper: "Since 00:00 UTC",
    },
    {
      key: "active-sessions",
      label: "Active sessions",
      value: value.sessions.active,
      icon: "devices",
      color: "orange",
      helper: "Unexpired sessions on active accounts",
    },
    {
      key: "cloud-drafts",
      label: "Cloud drafts",
      value: value.cloudDrafts.total,
      icon: "cloud",
      color: "blue",
      helper: "Drafts currently stored on the server",
    },
    {
      key: "drafts-updated-today",
      label: "Drafts updated today",
      value: value.cloudDrafts.updatedToday,
      icon: "cloud_sync",
      color: "prim",
      helper: "Server updates since 00:00 UTC",
    },
    {
      key: "admin-actions-today",
      label: "Admin actions today",
      value: value.adminActions.today,
      icon: "admin_panel_settings",
      color: "orange",
      helper: "Audited mutations since 00:00 UTC",
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

function getApiErrorMessage(error: unknown) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string" && value.data.message.trim()
    ? value.data.message
    : "Dashboard summary could not be loaded.";
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
        {{ generatedAtLabel ? `Last updated ${generatedAtLabel}` : "Live server summary" }}
      </el-text>

      <el-button
        mode="flat"
        color="normal"
        icon="refresh"
        label="Refresh"
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
      <el-text color="normal55" :size="13">Loading dashboard…</el-text>
    </el-flex>

    <el-grid
      v-else-if="summary"
      cols="repeat(auto-fit, minmax(210px, 1fr))"
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
      />
    </el-grid>
  </el-flex>
</template>
