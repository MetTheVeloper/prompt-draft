<script setup lang="ts">
import type { AdminUserSummary } from "~/types/adminUsersApi";

const props = defineProps<{
  userId: string;
}>();

const api = usePromptDraftApi();
const { locale, t } = useI18n();

const user = ref<AdminUserSummary | null>(null);
const loading = ref(true);
const errorMessage = ref("");

function accountLabel(value: AdminUserSummary) {
  return value.username || value.email || value.id;
}

function roleLabel(value: AdminUserSummary["role"]) {
  if (value === "super_admin") return t("manage.common.roles.superAdmin");
  if (value === "admin") return t("manage.common.roles.admin");
  return t("manage.common.roles.user");
}

function statusLabel(value: AdminUserSummary["status"]) {
  return value === "active"
    ? t("manage.common.statuses.active")
    : t("manage.common.statuses.suspended");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getApiErrorMessage(error: unknown) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string"
    ? value.data.message
    : t("manage.users.information.loadError");
}

onMounted(async () => {
  try {
    user.value = (await api.getAdminUser(props.userId)).user;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <el-flex rules="ccs" :gap="12" class="w100">
    <el-text v-if="loading" color="normal55" :size="13">
      {{ t("manage.users.information.loading") }}
    </el-text>

    <el-flex v-else-if="errorMessage" rules="rsc" :gap="8" bg="red10" :p="12" :radius="10" class="w100">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">{{ errorMessage }}</el-text>
    </el-flex>

    <template v-else-if="user">
      <el-flex rules="rsc" :gap="10" class="w100">
        <el-avatar
          :src="user.avatarUrl"
          :name="accountLabel(user)"
          :alt="accountLabel(user)"
          size="big"
        />
        <el-flex rules="ccs" :gap="3" class="fg100">
          <el-text :size="14" :weight="800">{{ accountLabel(user) }}</el-text>
          <el-text color="normal45" :size="10">{{ user.id }}</el-text>
        </el-flex>
      </el-flex>

      <el-divider />

      <el-grid
        cols="minmax(120px, .4fr) minmax(0, 1fr)"
        :gap="12"
        align-items="center"
        class="w100">
        <el-text color="normal55" :size="12">{{ t("manage.common.fields.account") }}</el-text>
        <el-text :size="12" :weight="700">{{ accountLabel(user) }}</el-text>

        <el-text color="normal55" :size="12">{{ t("manage.common.fields.userId") }}</el-text>
        <el-text :size="12" :weight="700">{{ user.id }}</el-text>

        <el-text color="normal55" :size="12">{{ t("manage.common.fields.role") }}</el-text>
        <el-text :size="12" :weight="700">{{ roleLabel(user.role) }}</el-text>

        <el-text color="normal55" :size="12">{{ t("manage.common.fields.status") }}</el-text>
        <el-text :size="12" :weight="700" :color="user.status === 'active' ? 'green' : 'red'">
          {{ statusLabel(user.status) }}
        </el-text>

        <el-text color="normal55" :size="12">{{ t("manage.common.fields.cloudDrafts") }}</el-text>
        <el-text :size="12" :weight="700" :localize="true">{{ user.cloudDraftCount }}</el-text>

        <el-text color="normal55" :size="12">{{ t("manage.common.fields.activeSessions") }}</el-text>
        <el-text :size="12" :weight="700" :localize="true">{{ user.activeSessionCount }}</el-text>

        <el-text color="normal55" :size="12">{{ t("manage.common.fields.joined") }}</el-text>
        <el-text :size="12" :weight="700">{{ formatDate(user.createdAt) }}</el-text>
      </el-grid>
    </template>
  </el-flex>
</template>
