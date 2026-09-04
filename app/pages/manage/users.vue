<script setup lang="ts">
import AdminUserInformationModal from "~/components/manage/AdminUserInformationModal.vue";
import AdminUserRoleChangeModal from "~/components/manage/AdminUserRoleChangeModal.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type { GlobalMenuItem } from "~/composables/useMenu";
import type { AdminUserSummary } from "~/types/adminUsersApi";
import type { AuthUserRole } from "~/types/auth";

definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.USERS_VIEW,
});

const auth = useAuth();
const api = usePromptDraftApi();
const menu = useMenu();
const modal = useModal();
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

const canManageUsers = computed(() => {
  return auth.can(AUTH_PERMISSIONS.USERS_MANAGE);
});

let filterTimer: ReturnType<typeof setTimeout> | null = null;
let listRequestVersion = 0;

function accountLabel(user: AdminUserSummary) {
  return user.username || user.email || user.id;
}

function roleLabel(role: AuthUserRole) {
  return role.replaceAll("_", " ");
}

function statusLabel(status: AdminUserSummary["status"]) {
  return status === "active" ? "Active" : "Suspended";
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

async function finishMutation(successMessage: string) {
  await loadUsers();
  modal.message({
    type: "success",
    title: "User updated",
    message: successMessage,
    actionLabel: "Done",
  });
}

function openMutationConfirmation(options: {
  user: AdminUserSummary;
  title: string;
  message: string;
  confirmLabel: string;
  icon: string;
  color: string;
  successMessage: string;
  run: () => Promise<unknown>;
}) {
  modal.open({
    header: {
      icon: options.icon,
      title: options.title,
      subtitle: accountLabel(options.user),
      color: options.color,
    },
    descriptions: [options.message],
    actions: [
      {
        label: "Cancel",
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: options.confirmLabel,
        icon: options.icon,
        color: options.color,
        close: false,
        handler: async ({ close }) => {
          try {
            await options.run();
            close();
            await finishMutation(options.successMessage);
          } catch (error) {
            close();
            modal.message({
              type: "error",
              title: "Action failed",
              message: getApiErrorMessage(error, "The administrative action could not be completed."),
              actionLabel: "Close",
            });
          }

          return true;
        },
      },
    ],
    options: {
      width: 520,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  });
}

function openRoleChange(user: AdminUserSummary) {
  let nextRole: AuthUserRole = user.role;

  modal.open({
    header: {
      icon: "admin_panel_settings",
      title: "Change user role",
      subtitle: accountLabel(user),
      color: "blue",
    },
    component: AdminUserRoleChangeModal,
    props: {
      currentRole: user.role,
      onSelect: (value: AuthUserRole) => {
        nextRole = value;
      },
    },
    actions: [
      {
        label: "Cancel",
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: "Change role",
        icon: "admin_panel_settings",
        color: "blue",
        close: false,
        disable: () => nextRole === user.role,
        handler: async ({ close }) => {
          try {
            await api.updateAdminUserRole(user.id, { role: nextRole });
            close();
            await finishMutation(`${accountLabel(user)} is now ${roleLabel(nextRole)}.`);
          } catch (error) {
            close();
            modal.message({
              type: "error",
              title: "Role change failed",
              message: getApiErrorMessage(error, "The user role could not be changed."),
              actionLabel: "Close",
            });
          }

          return true;
        },
      },
    ],
    options: {
      width: 540,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  });
}

function openSuspendToggle(user: AdminUserSummary) {
  if (user.status === "active") {
    openMutationConfirmation({
      user,
      title: "Suspend account?",
      message: "The account will be blocked from signing in and all current sessions will be revoked immediately.",
      confirmLabel: "Suspend account",
      icon: "block",
      color: "orange",
      successMessage: `${accountLabel(user)} has been suspended.`,
      run: () => api.suspendAdminUser(user.id),
    });
    return;
  }

  openMutationConfirmation({
    user,
    title: "Unsuspend account?",
    message: "The account will be allowed to sign in again. Previously revoked sessions are not restored.",
    confirmLabel: "Unsuspend account",
    icon: "check_circle",
    color: "green",
    successMessage: `${accountLabel(user)} can sign in again.`,
    run: () => api.unsuspendAdminUser(user.id),
  });
}

function openRevokeSessions(user: AdminUserSummary) {
  openMutationConfirmation({
    user,
    title: "Revoke all sessions?",
    message: "Every active login session for this account will be invalidated. The user will need to sign in again on each device.",
    confirmLabel: "Revoke sessions",
    icon: "logout",
    color: "orange",
    successMessage: `All sessions for ${accountLabel(user)} were revoked.`,
    run: () => api.revokeAdminUserSessions(user.id),
  });
}

function openResetCloudData(user: AdminUserSummary) {
  openMutationConfirmation({
    user,
    title: "Reset Cloud data?",
    message: "This permanently deletes all Cloud Drafts owned by this account. The account itself and its password are not deleted.",
    confirmLabel: "Delete Cloud Drafts",
    icon: "delete_forever",
    color: "red",
    successMessage: `Cloud Draft data for ${accountLabel(user)} was reset.`,
    run: () => api.resetAdminUserCloudData(user.id),
  });
}

function openUserInformation(user: AdminUserSummary) {
  modal.open({
    header: {
      icon: "info",
      title: "User information",
      subtitle: accountLabel(user),
      color: "blue",
    },
    component: AdminUserInformationModal,
    props: {
      userId: user.id,
    },
    actions: [
      {
        label: "Close",
        icon: "close",
        color: "normal",
        mode: "flat",
        close: true,
      },
    ],
    options: {
      width: 620,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  });
}

function openUserActions(event: MouseEvent, user: AdminUserSummary) {
  const items: GlobalMenuItem[] = [];
  const isSelf = user.id === auth.user.value?.id;

  if (canManageUsers.value) {
    const selfDescription = isSelf
      ? "Self-management is blocked by the admin safety rules."
      : undefined;

    items.push(
      {
        label: "Change role",
        icon: "admin_panel_settings",
        color: "blue",
        description: selfDescription,
        disabled: isSelf,
        handler: () => openRoleChange(user),
      },
      {
        label: user.status === "active" ? "Suspend account" : "Unsuspend account",
        icon: user.status === "active" ? "block" : "check_circle",
        color: user.status === "active" ? "orange" : "green",
        description: selfDescription,
        disabled: isSelf,
        handler: () => openSuspendToggle(user),
      },
      {
        label: "Revoke sessions",
        icon: "logout",
        color: "orange",
        description: selfDescription,
        disabled: isSelf,
        handler: () => openRevokeSessions(user),
      },
      {
        label: "Reset Cloud data",
        icon: "delete_forever",
        color: "red",
        description: selfDescription,
        disabled: isSelf,
        handler: () => openResetCloudData(user),
      },
      { type: "divider" },
    );
  }

  items.push({
    label: "Information",
    icon: "info",
    color: "blue",
    handler: () => openUserInformation(user),
  });

  menu.open({
    mode: "point",
    event,
    items,
    options: {
      minWidth: 230,
      maxWidth: 300,
    },
  });
}

watch(searchText, scheduleFilterReload);
watch(roleFilter, scheduleFilterReload);

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
        :size="15"
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
        cols="minmax(220px, 1.7fr) minmax(115px, .7fr) minmax(100px, .7fr) minmax(90px, .55fr) minmax(110px, .65fr) minmax(160px, 1fr) 44px"
        :gap="12"
        align-items="center"
        class="w100"
        :p="[12, 16]">
        <el-text color="normal55" :size="11" :weight="800">Account</el-text>
        <el-text color="normal55" :size="11" :weight="800">Role</el-text>
        <el-text color="normal55" :size="11" :weight="800">Status</el-text>
        <el-text color="normal55" :size="11" :weight="800">Cloud drafts</el-text>
        <el-text color="normal55" :size="11" :weight="800">Active sessions</el-text>
        <el-text color="normal55" :size="11" :weight="800">Joined</el-text>
        <el-text color="normal55" :size="11" :weight="800">Actions</el-text>
      </el-grid>

      <el-divider />

      <el-flex v-if="loading" rules="ccc" class="w100" :p="24">
        <el-text color="normal55" :size="13">Loading users…</el-text>
      </el-flex>

      <template v-else-if="users.length">
        <template v-for="(user, index) in users" :key="user.id">
          <el-grid
            cols="minmax(220px, 1.7fr) minmax(115px, .7fr) minmax(100px, .7fr) minmax(90px, .55fr) minmax(110px, .65fr) minmax(160px, 1fr) 44px"
            :gap="12"
            align-items="center"
            class="w100"
            :p="[12, 16]">
            <el-flex rules="ccs" :gap="3" class="w100">
              <el-text :size="12" :weight="700">{{ accountLabel(user) }}</el-text>
              <el-text color="normal45" :size="10">{{ user.id }}</el-text>
            </el-flex>
            <el-text :size="12">{{ roleLabel(user.role) }}</el-text>
            <el-text
              :size="11"
              :weight="700"
              :color="user.status === 'active' ? 'green' : 'red'">
              {{ statusLabel(user.status) }}
            </el-text>
            <el-text :size="12" :localize="true">{{ user.cloudDraftCount }}</el-text>
            <el-text :size="12" :localize="true">{{ user.activeSessionCount }}</el-text>
            <el-text :size="12">{{ formatDate(user.createdAt) }}</el-text>
            <el-button
              type="fab"
              mode="flat"
              color="normal"
              icon="more_vert"
              tooltip="User actions"
              :size="11"
              @click.stop="openUserActions($event, user)"
            />
          </el-grid>
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
  </el-flex>
</template>
