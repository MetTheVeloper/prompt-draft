<script setup lang="ts">
import type { AdminUserSummary } from "~/types/adminUsersApi";

const props = defineProps<{
  userId: string;
}>();

const api = usePromptDraftApi();
const { locale } = useI18n();

const user = ref<AdminUserSummary | null>(null);
const loading = ref(true);
const errorMessage = ref("");

function accountLabel(value: AdminUserSummary) {
  return value.username || value.email || value.id;
}

function roleLabel(value: string) {
  return value.replaceAll("_", " ");
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
    : "Failed to load user information.";
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
      Loading user information…
    </el-text>

    <el-flex v-else-if="errorMessage" rules="rsc" :gap="8" bg="red10" :p="12" :radius="10" class="w100">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">{{ errorMessage }}</el-text>
    </el-flex>

    <el-grid
      v-else-if="user"
      cols="minmax(120px, .4fr) minmax(0, 1fr)"
      :gap="12"
      align-items="center"
      class="w100">
      <el-text color="normal55" :size="12">Account</el-text>
      <el-text :size="12" :weight="700">{{ accountLabel(user) }}</el-text>

      <el-text color="normal55" :size="12">User ID</el-text>
      <el-text :size="12" :weight="700">{{ user.id }}</el-text>

      <el-text color="normal55" :size="12">Role</el-text>
      <el-text :size="12" :weight="700">{{ roleLabel(user.role) }}</el-text>

      <el-text color="normal55" :size="12">Status</el-text>
      <el-text :size="12" :weight="700" :color="user.status === 'active' ? 'green' : 'red'">
        {{ user.status }}
      </el-text>

      <el-text color="normal55" :size="12">Cloud drafts</el-text>
      <el-text :size="12" :weight="700" :localize="true">{{ user.cloudDraftCount }}</el-text>

      <el-text color="normal55" :size="12">Active sessions</el-text>
      <el-text :size="12" :weight="700" :localize="true">{{ user.activeSessionCount }}</el-text>

      <el-text color="normal55" :size="12">Joined</el-text>
      <el-text :size="12" :weight="700">{{ formatDate(user.createdAt) }}</el-text>
    </el-grid>
  </el-flex>
</template>
