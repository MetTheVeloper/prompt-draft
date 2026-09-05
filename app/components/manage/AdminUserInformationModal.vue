<script setup lang="ts">
import type { AdminUserDetail } from "~/types/adminUsersApi";

const props = defineProps<{
  userId: string;
}>();

const api = usePromptDraftApi();
const { locale, t } = useI18n();

const user = ref<AdminUserDetail | null>(null);
const loading = ref(true);
const errorMessage = ref("");

const detailLabels = computed(() => locale.value === "fa"
  ? {
      email: "ایمیل",
      totalDrafts: "کل درفت‌ها",
      publicDrafts: "درفت‌های عمومی",
      privateDrafts: "درفت‌های خصوصی",
      totalXp: "امتیاز کل",
      lastUpdated: "آخرین به‌روزرسانی",
      profileMedia: "پروفایل",
    }
  : {
      email: "Email",
      totalDrafts: "Total drafts",
      publicDrafts: "Public drafts",
      privateDrafts: "Private drafts",
      totalXp: "Total XP",
      lastUpdated: "Last updated",
      profileMedia: "Profile",
    });

function accountLabel(value: AdminUserDetail) {
  return value.username || value.email || value.id;
}

function roleLabel(value: AdminUserDetail["role"]) {
  if (value === "super_admin") return t("manage.common.roles.superAdmin");
  if (value === "admin") return t("manage.common.roles.admin");
  return t("manage.common.roles.user");
}

function statusLabel(value: AdminUserDetail["status"]) {
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

function formatNumber(value: number) {
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(value);
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
  <el-flex rules="ccs" :gap="14" class="w100 admin-user-information">
    <el-text v-if="loading" color="normal55" :size="13">
      {{ t("manage.users.information.loading") }}
    </el-text>

    <el-flex
      v-else-if="errorMessage"
      rules="rsc"
      :gap="8"
      bg="red10"
      :p="12"
      :radius="10"
      class="w100">
      <el-icon icon="warning" color="red" :size="18" />
      <el-text color="red" :size="12">{{ errorMessage }}</el-text>
    </el-flex>

    <template v-else-if="user">
      <div class="admin-user-information__hero w100">
        <img
          v-if="user.cover?.fullUrl"
          :src="user.cover.fullUrl"
          :alt="detailLabels.profileMedia"
          class="admin-user-information__cover"
        >
        <div v-else class="admin-user-information__cover admin-user-information__cover--fallback" />
        <div class="admin-user-information__cover-shade" />

        <div class="admin-user-information__identity">
          <el-avatar
            :src="user.avatarUrl"
            :name="accountLabel(user)"
            :alt="accountLabel(user)"
            size="+3"
            :br="2"
            bc="normal25"
          />
          <el-flex rules="ccs" :gap="4" class="admin-user-information__identity-copy">
            <el-text :size="17" :weight="900">{{ accountLabel(user) }}</el-text>
            <el-text v-if="user.email" color="normal60" :size="11">{{ user.email }}</el-text>
            <el-text color="normal45" :size="9">{{ user.id }}</el-text>
          </el-flex>
        </div>
      </div>

      <el-grid
        cols="repeat(4, minmax(0, 1fr))"
        :gap="8"
        class="w100 admin-user-information__stats">
        <el-flex rules="ccs" :gap="3" bg="surface50" :p="10" :radius="10" class="w100">
          <el-text color="normal50" :size="9">{{ detailLabels.totalDrafts }}</el-text>
          <el-text :size="15" :weight="900">{{ formatNumber(user.totalDraftCount) }}</el-text>
        </el-flex>
        <el-flex rules="ccs" :gap="3" bg="surface50" :p="10" :radius="10" class="w100">
          <el-text color="normal50" :size="9">{{ detailLabels.publicDrafts }}</el-text>
          <el-text color="green" :size="15" :weight="900">{{ formatNumber(user.publicDraftCount) }}</el-text>
        </el-flex>
        <el-flex rules="ccs" :gap="3" bg="surface50" :p="10" :radius="10" class="w100">
          <el-text color="normal50" :size="9">{{ detailLabels.privateDrafts }}</el-text>
          <el-text :size="15" :weight="900">{{ formatNumber(user.privateDraftCount) }}</el-text>
        </el-flex>
        <el-flex rules="ccs" :gap="3" bg="surface50" :p="10" :radius="10" class="w100">
          <el-text color="normal50" :size="9">{{ detailLabels.totalXp }}</el-text>
          <el-text color="orange" :size="15" :weight="900">{{ formatNumber(user.totalXp) }}</el-text>
        </el-flex>
      </el-grid>

      <el-divider />

      <el-grid
        cols="minmax(130px, .42fr) minmax(0, 1fr)"
        :gap="12"
        align-items="center"
        class="w100 admin-user-information__details">
        <el-text color="normal55" :size="11">{{ t("manage.common.fields.account") }}</el-text>
        <el-text :size="11" :weight="700">{{ accountLabel(user) }}</el-text>

        <el-text color="normal55" :size="11">{{ detailLabels.email }}</el-text>
        <el-text :size="11" :weight="700">{{ user.email || "—" }}</el-text>

        <el-text color="normal55" :size="11">{{ t("manage.common.fields.userId") }}</el-text>
        <el-text :size="10" :weight="700" class="admin-user-information__id">{{ user.id }}</el-text>

        <el-text color="normal55" :size="11">{{ t("manage.common.fields.role") }}</el-text>
        <el-text :size="11" :weight="700">{{ roleLabel(user.role) }}</el-text>

        <el-text color="normal55" :size="11">{{ t("manage.common.fields.status") }}</el-text>
        <el-text :size="11" :weight="800" :color="user.status === 'active' ? 'green' : 'red'">
          {{ statusLabel(user.status) }}
        </el-text>

        <el-text color="normal55" :size="11">{{ t("manage.common.fields.cloudDrafts") }}</el-text>
        <el-text :size="11" :weight="700">{{ formatNumber(user.cloudDraftCount) }}</el-text>

        <el-text color="normal55" :size="11">{{ t("manage.common.fields.activeSessions") }}</el-text>
        <el-text :size="11" :weight="700">{{ formatNumber(user.activeSessionCount) }}</el-text>

        <el-text color="normal55" :size="11">{{ t("manage.common.fields.joined") }}</el-text>
        <el-text :size="11" :weight="700">{{ formatDate(user.createdAt) }}</el-text>

        <el-text color="normal55" :size="11">{{ detailLabels.lastUpdated }}</el-text>
        <el-text :size="11" :weight="700">{{ formatDate(user.lastUpdatedAt) }}</el-text>
      </el-grid>
    </template>
  </el-flex>
</template>

<style scoped>
.admin-user-information__hero {
  position: relative;
  min-height: 180px;
  overflow: hidden;
  border-radius: 14px;
  background: var(--themeSurface, var(--themeBackground));
}

.admin-user-information__cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-user-information__cover--fallback {
  background:
    radial-gradient(circle at 18% 15%, rgb(58 137 201 / 28%), transparent 42%),
    radial-gradient(circle at 82% 20%, rgb(223 130 56 / 20%), transparent 38%),
    var(--themeSurface, var(--themeBackground));
}

.admin-user-information__cover-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--themeBackground) 0%, rgb(0 0 0 / 8%) 76%);
}

.admin-user-information__identity {
  position: absolute;
  inset-inline: 16px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.admin-user-information__identity-copy {
  min-width: 0;
  text-shadow: 0 1px 10px rgb(0 0 0 / 35%);
}

.admin-user-information__id {
  overflow-wrap: anywhere;
}

@media (max-width: 620px) {
  .admin-user-information__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .admin-user-information__details {
    grid-template-columns: 1fr !important;
    gap: 5px !important;
  }
}
</style>
