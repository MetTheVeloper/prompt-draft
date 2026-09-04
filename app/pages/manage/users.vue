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
const roleFilter = ref("");

const roleFilterItems = [
  { label: "User", value: "user", icon: "person" },
  { label: "Admin", value: "admin", icon: "admin_panel_settings" },
  { label: "Super admin", value: "super_admin", icon: "shield_person" },
];

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

function normalizedRoleFilter(): AuthUserRole | undefined {
  return ["user", "admin", "super_admin"].includes(roleFilter.value)
    ? (roleFilter.value as AuthUserRole)
    : undefined;
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
      role: normalizedRoleFilter(),
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
    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text type="h1" :size="24" :weight="800">Users</el-text>
      <el-text color="normal55" :size="13">
        Browse account metadata and current Cloud usage.
      </el-text>
    </el-flex>

    <el-grid
      cols="minmax(240px, 1fr) minmax(180px, 240px) auto"
      :gap="10"
      align-items="center"
      class="w100">
      <el-text-field
        v-model="searchText"
        class="w100"
        type="text"
        :actions="false"
        :size="13"
        placeholder="Search username or email"
      />

      <el-dropdown
        v-model="roleFilter"
        class="w100"
        :items="roleFilterItems"
        placeholder="All roles"
        clearable
        icon="manage_accounts"
      />

      <el-button
        mode="flat"
        color="normal"
        icon="refresh"
        label="Refresh"
        :disable="loading || loadingMore"
        @click="loadUsers()"
      />
    </el-grid>

    <el-flex
      v-if="listError"
      rules="rsc"
      :gap="8"
      class="w100"
      bg="red10"
      :p="12"
      :radius="10">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">{{ listError }}</el-text>
    </el-flex>

    <el-flex
      rules="csc"
      class="w100"
      bg="surface"
      :radius="14"
      :br="1"
      bc="normal15">
      <el-grid
        cols="minmax(220px, 1.8fr) minmax(120px, .8fr) minmax(100px, .6fr) minmax(110px, .7fr) minmax(160px, 1fr)"
        :gap="12"
        align-items="center"
        class="w100"
        :p="[12, 16]">
        <el-text color="normal55" :size="11" :weight="800">Account</el-text>
        <el-text color="normal55" :size="11" :weight="800">Role</el-text>
        <el-text color="normal55" :size="11" :weight="800">Cloud drafts</el-text>
        <el-text color="normal55" :size="11" :weight="800">Active sessions</el-text>
        <el-text color="normal55" :size="11" :weight="800">Joined</el-text>
      </el-grid>

      <el-divider />

      <el-flex v-if="loading" rules="ccc" class="w100" :p="24">
        <el-text color="normal55" :size="13">Loading users…</el-text>
      </el-flex>

      <template v-else-if="users.length">
        <template v-for="(user, index) in users" :key="user.id">
          <el-button
            class="w100"
            mode="flat"
            color="normal"
            :p="[0, 0]"
            :radius="0"
            @click="openUser(user)">
            <el-grid
              cols="minmax(220px, 1.8fr) minmax(120px, .8fr) minmax(100px, .6fr) minmax(110px, .7fr) minmax(160px, 1fr)"
              :gap="12"
              align-items="center"
              class="w100"
              :p="[12, 16]">
              <el-flex rules="ccs" :gap="3" class="w100">
                <el-text :size="12" :weight="700">{{ accountLabel(user) }}</el-text>
                <el-text color="normal45" :size="10">{{ user.id }}</el-text>
              </el-flex>
              <el-text :size="12">{{ roleLabel(user.role) }}</el-text>
              <el-text :size="12" :localize="true">{{ user.cloudDraftCount }}</el-text>
              <el-text :size="12" :localize="true">{{ user.activeSessionCount }}</el-text>
              <el-text :size="12">{{ formatDate(user.createdAt) }}</el-text>
            </el-grid>
          </el-button>
          <el-divider v-if="index < users.length - 1" />
        </template>
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
        <el-button
          mode="flat"
          color="normal"
          icon="close"
          label="Close"
          @click="closeUser"
        />
      </el-flex>

      <el-text v-if="detailLoading" color="normal55" :size="13">
        Loading user…
      </el-text>

      <el-flex
        v-else-if="detailError"
        rules="rsc"
        :gap="8"
        class="w100"
        bg="red10"
        :p="12"
        :radius="10">
        <el-icon icon="warning" color="red" :size="18" />
        <el-text color="red" :size="12">{{ detailError }}</el-text>
      </el-flex>

      <el-grid
        v-else-if="selectedUser"
        cols="minmax(120px, .4fr) minmax(0, 1fr)"
        :gap="12"
        align-items="center"
        class="w100">
        <el-text color="normal55" :size="12">Account</el-text>
        <el-text :size="12" :weight="700">{{ accountLabel(selectedUser) }}</el-text>

        <el-text color="normal55" :size="12">User ID</el-text>
        <el-text :size="12" :weight="700">{{ selectedUser.id }}</el-text>

        <el-text color="normal55" :size="12">Role</el-text>
        <el-text :size="12" :weight="700">{{ roleLabel(selectedUser.role) }}</el-text>

        <el-text color="normal55" :size="12">Cloud drafts</el-text>
        <el-text :size="12" :weight="700" :localize="true">{{ selectedUser.cloudDraftCount }}</el-text>

        <el-text color="normal55" :size="12">Active sessions</el-text>
        <el-text :size="12" :weight="700" :localize="true">{{ selectedUser.activeSessionCount }}</el-text>

        <el-text color="normal55" :size="12">Joined</el-text>
        <el-text :size="12" :weight="700">{{ formatDate(selectedUser.createdAt) }}</el-text>
      </el-grid>
    </el-flex>
  </el-flex>
</template>
