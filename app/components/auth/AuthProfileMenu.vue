<script setup lang="ts">
import { canAccessManage } from "~/config/manage";

const emit = defineEmits<{
  (event: "close"): void;
}>();

const { t, locale } = useI18n();
const auth = useAuth();
const { completeMissingIdentity } = useProfileRequirements();

const user = computed(() => auth.user.value);

const identityLabel = computed(() => {
  return user.value?.username || user.value?.email || "";
});

const displayIdentityLabel = computed(() => {
  const value = identityLabel.value.trim();
  if (!value || value.includes("@")) return value;

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
});

const roleLabel = computed(() => {
  return user.value?.role?.replaceAll("_", " ") || "";
});

const roleUpperLabel = computed(() => roleLabel.value.toUpperCase());

const roleMarker = computed(() => {
  switch (user.value?.role) {
    case "super_admin":
      return "prim15";
    case "admin":
      return "blue15";
    default:
      return "normal15";
  }
});

const memberSince = computed(() => {
  if (!user.value?.createdAt) return "";

  const date = new Date(user.value.createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

const formattedXp = computed(() => {
  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(
    auth.totalXp.value,
  );
});

const canOpenManage = computed(() => canAccessManage(auth.can));
const hasMissingProfileFields = computed(() => {
  return auth.missingProfileFields.value.length > 0;
});

onMounted(async () => {
  if (!auth.isLoggedIn.value) return;

  try {
    await auth.refreshAuthorizationState();
  } catch (error) {
    console.warn("[Prompt Draft] profile refresh failed", error);
  }
});

function handleCompleteProfile() {
  emit("close");
  completeMissingIdentity();
}

async function handleOpenManage() {
  emit("close");
  await navigateTo("/manage");
}

async function handleLogout() {
  await auth.logout();
  emit("close");
}
</script>

<template>
  <el-flex rules="csc" :gap="12" :p="16" class="w100" style="min-width: 280px">
    <el-flex rules="rsc" :gap="10" class="w100">
      <el-flex rules="rcc" bg="prim15" :radius="100" :p="10">
        <el-icon icon="account_circle" color="prim" :size="24" />
      </el-flex>
      <el-flex rules="ccs" :gap="4" class="fg100">
        <el-text :size="14" :weight="700">{{ displayIdentityLabel }}</el-text>
        <el-text
          v-if="roleLabel"
          :size="12"
          color="normal55"
          :marker="roleMarker">
          {{ roleLabel }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-divider />

    <el-flex rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55" icon="bolt" icon-color="prim">
        {{ t("auth.profile.xp") }}
      </el-text>
      <el-text :size="13" :weight="800" color="prim">{{ formattedXp }}</el-text>
    </el-flex>

    <el-flex v-if="user?.username" rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55">{{ t("auth.profile.username") }}</el-text>
      <el-text :size="12">{{ user.username }}</el-text>
    </el-flex>

    <el-flex v-if="user?.email" rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55">{{ t("auth.profile.email") }}</el-text>
      <el-text :size="12">{{ user.email }}</el-text>
    </el-flex>

    <el-flex v-if="roleLabel" rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55">Role</el-text>
      <el-text :size="12" :weight="700">{{ roleUpperLabel }}</el-text>
    </el-flex>

    <el-flex v-if="memberSince" rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55">{{ t("auth.profile.memberSince") }}</el-text>
      <el-text :size="12">{{ memberSince }}</el-text>
    </el-flex>

    <el-divider />

    <el-button
      v-if="hasMissingProfileFields"
      class="w100"
      color="orange"
      mode="flat"
      icon="person_add"
      :label="t('auth.profile.complete')"
      @click="handleCompleteProfile"
    />

    <el-button
      v-if="canOpenManage"
      class="w100"
      color="blue"
      icon="admin_panel_settings"
      :label="t('manage.title')"
      @click="handleOpenManage"
    />

    <el-button
      class="w100"
      color="red"
      mode="flat"
      icon="logout"
      :label="t('auth.profile.logout')"
      :disable="auth.loading.value"
      @click="handleLogout"
    />
  </el-flex>
</template>
