<script setup lang="ts">
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type { AdminUserSummary } from "~/types/adminUsersApi";
import type { AuthUserRole } from "~/types/auth";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.USERS_VIEW,
});

const route = useRoute();
const auth = useAuth();
const api = usePromptDraftApi();
const { locale } = useI18n();

const users = ref<AdminUserSummary[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const listError = ref("");
const nextCursor = ref<string | null>(null);
const hasMore = ref(false);
const searchText = ref("");
const roleFilter = ref<"" | AuthUserRole>("");

const selectedUser = ref<AdminUserSummary | null>(null);
const detailLoading = ref(false);
const detailError = ref("");

let filterTimer: ReturnType<typeof setTimeout> | null = null;
let listRequestVersion = 0;
let detailRequestVersion = 0;

function accountLabel(user: AdminUserSummary) {
  return user.username || user.email || user.id;
}

function roleLabel(role: AuthUserRole) {
  return role.replaceAll("_", " ");
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

function getApiErrorMessage(error: unknown, fallback: string) {
  const value = error as {
    data?: {
      message?: unknown;
      errors?: Array<{ message?: unknown }>;
    };
  };

  const fieldMessage = value?.data?.errors?.find(
    (item) => typeof item?.message === "string",
  )?.message;

  if (typeof fieldMessage === "string" && fieldMessage.trim()) {
    return fieldMessage;
  }

  if (typeof value?.data?.message === "string" && value.data.message.trim()) {
    return value.data.message;
  }

  return fallback;
}

async function loadUsers(options: { append?: boolean } = {}) {
  const append = Boolean(options.append);
  if (append && (!hasMore.value || !nextCursor.value || loadingMore.value)) return;

  const requestVersion = ++listRequestVersion;
  listError.value = "";

  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }

  try {
    const response = await api.listAdminUsers({
      limit: 20,
      cursor: append ? nextCursor.value ?? undefined : undefined,
      query: searchText.value.trim() || undefined,
      role: roleFilter.value || undefined,
    });

    if (requestVersion !== listRequestVersion) return;

    users.value = append ? [...users.value, ...response.users] : response.users;
    nextCursor.value = response.pageInfo.nextCursor;
    hasMore.value = response.pageInfo.hasMore;
  } catch (error) {
    if (requestVersion !== listRequestVersion) return;
    listError.value = getApiErrorMessage(error, "Failed to load users.");

    if (!append) {
      users.value = [];
      nextCursor.value = null;
      hasMore.value = false;
    }
  } finally {
    if (requestVersion === listRequestVersion) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

function scheduleFilterReload() {
  if (filterTimer) clearTimeout(filterTimer);

  filterTimer = setTimeout(() => {
    nextCursor.value = null;
    hasMore.value = false;
    void loadUsers();
  }, 350);
}

async function loadSelectedUser(id: string | null) {
  const requestVersion = ++detailRequestVersion;
  detailError.value = "";
  selectedUser.value = null;

  if (!id) {
    detailLoading.value = false;
    return;
  }

  detailLoading.value = true;

  try {
    const response = await api.getAdminUser(id);
    if (requestVersion !== detailRequestVersion) return;
    selectedUser.value = response.user;
  } catch (error) {
    if (requestVersion !== detailRequestVersion) return;
    detailError.value = getApiErrorMessage(error, "Failed to load user details.");
  } finally {
    if (requestVersion === detailRequestVersion) {
      detailLoading.value = false;
    }
  }
}

async function openUser(user: AdminUserSummary) {
  await navigateTo({
    path: "/manage/users",
    query: { user: user.id },
  });
}

async function closeUser() {
  await navigateTo("/manage/users");
}

watch(searchText, scheduleFilterReload);
watch(roleFilter, scheduleFilterReload);
watch(
  () => route.query.user,
  (value) => {
    const id = typeof value === "string" && value.trim() ? value.trim() : null;
    void loadSelectedUser(id);
  },
  { immediate: true },
);

onMounted(async () => {
  await auth.initialize();
  await loadUsers();
});

onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer);
});
</script>

<template>
  <el-flex rules="csc" :gap="16" class="w100">
    <el-flex rules="csc" :gap="6" class="w100">
      <el-text type="h1" :size="24" :weight="800">Users</el-text>
      <el-text color="normal55" :size="13">
        Browse account metadata and current Cloud usage.
      </el-text>
    </el-flex>

    <el-flex rules="rsc" :gap="10" class="w100 fw">
      <input
        v-model="searchText"
        class="manage-users__control manage-users__search"
        type="search"
        autocomplete="off"
        placeholder="Search username or email"
      />

      <select v-model="roleFilter" class="manage-users__control manage-users__select">
        <option value="">All roles</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="super_admin">Super admin</option>
      </select>

      <el-button
        mode="flat"
        color="normal"
        icon="refresh"
        label="Refresh"
        :disable="loading || loadingMore"
        @click="loadUsers()"
      />
    </el-flex>

    <el-flex
      v-if="listError"
      rules="rsc"
      :gap="8"
      class="w100 manage-users__error"
      :p="12"
      :radius="10">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">{{ listError }}</el-text>
    </el-flex>

    <el-flex rules="csc" class="w100 manage-users__table" bg="surface" :radius="14" :br="1" bc="normal15">
      <div class="manage-users__row manage-users__head">
        <span>Account</span>
        <span>Role</span>
        <span>Cloud drafts</span>
        <span>Active sessions</span>
        <span>Joined</span>
      </div>

      <el-flex v-if="loading" rules="ccc" class="w100" :p="24">
        <el-text color="normal55" :size="13">Loading users…</el-text>
      </el-flex>

      <template v-else-if="users.length">
        <button
          v-for="user in users"
          :key="user.id"
          type="button"
          class="manage-users__row manage-users__data-row"
          @click="openUser(user)">
          <span>
            <strong>{{ accountLabel(user) }}</strong>
            <small>{{ user.id }}</small>
          </span>
          <span>{{ roleLabel(user.role) }}</span>
          <span>{{ user.cloudDraftCount }}</span>
          <span>{{ user.activeSessionCount }}</span>
          <span>{{ formatDate(user.createdAt) }}</span>
        </button>
      </template>

      <el-flex v-else rules="ccc" class="w100" :p="24">
        <el-text color="normal55" :size="13">No users found.</el-text>
      </el-flex>
    </el-flex>

    <el-button
      v-if="hasMore"
      mode="flat"
      color="prim"
      icon="expand_more"
      label="Load more"
      :disable="loadingMore"
      @click="loadUsers({ append: true })"
    />

    <el-flex
      v-if="detailLoading || detailError || selectedUser"
      rules="csc"
      :gap="12"
      class="w100"
      bg="surface"
      :radius="14"
      :br="1"
      bc="normal15"
      :p="16">
      <el-flex rules="rbc" class="w100" :gap="12">
        <el-text :size="16" :weight="800">User detail</el-text>
        <el-button mode="flat" color="normal" icon="close" label="Close" @click="closeUser" />
      </el-flex>

      <el-text v-if="detailLoading" color="normal55" :size="13">Loading user…</el-text>

      <el-flex v-else-if="detailError" rules="rsc" :gap="8" class="w100 manage-users__error" :p="12" :radius="10">
        <el-icon icon="warning" color="red" :size="18" />
        <el-text color="red" :size="12">{{ detailError }}</el-text>
      </el-flex>

      <template v-else-if="selectedUser">
        <div class="manage-users__detail-grid">
          <span>Account</span><strong>{{ accountLabel(selectedUser) }}</strong>
          <span>User ID</span><strong>{{ selectedUser.id }}</strong>
          <span>Role</span><strong>{{ roleLabel(selectedUser.role) }}</strong>
          <span>Cloud drafts</span><strong>{{ selectedUser.cloudDraftCount }}</strong>
          <span>Active sessions</span><strong>{{ selectedUser.activeSessionCount }}</strong>
          <span>Joined</span><strong>{{ formatDate(selectedUser.createdAt) }}</strong>
        </div>
      </template>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.manage-users__control {
  min-height: 42px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(127, 127, 127, 0.25);
  background: rgba(127, 127, 127, 0.07);
  color: inherit;
  font: inherit;
  outline: none;
}

.manage-users__search {
  flex: 1 1 320px;
  min-width: min(320px, 100%);
}

.manage-users__select {
  flex: 0 0 180px;
}

.manage-users__table {
  overflow: hidden;
}

.manage-users__row {
  display: grid;
  grid-template-columns: minmax(220px, 1.8fr) minmax(120px, 0.8fr) minmax(100px, 0.6fr) minmax(110px, 0.7fr) minmax(160px, 1fr);
  width: 100%;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  text-align: left;
}

.manage-users__head {
  font-size: 11px;
  font-weight: 800;
  color: rgba(127, 127, 127, 0.85);
  border-bottom: 1px solid rgba(127, 127, 127, 0.15);
}

.manage-users__data-row {
  border: 0;
  border-bottom: 1px solid rgba(127, 127, 127, 0.12);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.manage-users__data-row:hover {
  background: rgba(127, 127, 127, 0.08);
}

.manage-users__data-row span:first-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.manage-users__data-row small {
  color: rgba(127, 127, 127, 0.8);
  font-size: 10px;
  word-break: break-all;
}

.manage-users__detail-grid {
  display: grid;
  grid-template-columns: minmax(120px, 0.4fr) minmax(0, 1fr);
  gap: 10px 16px;
  width: 100%;
  font-size: 12px;
}

.manage-users__detail-grid span {
  color: rgba(127, 127, 127, 0.85);
}

.manage-users__detail-grid strong {
  overflow-wrap: anywhere;
}

.manage-users__error {
  background: rgba(220, 60, 60, 0.08);
}

@media (max-width: 900px) {
  .manage-users__table {
    overflow-x: auto;
  }

  .manage-users__row {
    min-width: 900px;
  }
}
</style>
