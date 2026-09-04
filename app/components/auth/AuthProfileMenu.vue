<script setup lang="ts">
import { canAccessManage } from "~/config/manage";
import { prepareUserAvatarImage } from "~/utils/userAvatarImage";

const emit = defineEmits<{
  (event: "close"): void;
}>();

const { t, locale } = useI18n();
const auth = useAuth();
const avatar = useUserAvatar();
const { completeMissingIdentity } = useProfileRequirements();

const user = computed(() => auth.user.value);
const avatarInput = ref<HTMLInputElement | null>(null);
const avatarPreviewUrl = ref("");
const preparedAvatar = ref<Blob | null>(null);
const avatarPreparing = ref(false);
const avatarActionError = ref("");

const identityLabel = computed(() => {
  return user.value?.username || user.value?.email || "";
});

const displayIdentityLabel = computed(() => {
  const value = identityLabel.value.trim();
  if (!value || value.includes("@")) return value;

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
});

const displayedAvatarUrl = computed(() => avatarPreviewUrl.value || avatar.url.value || null);

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
  const score = auth.score.value;
  if (!score) return "—";

  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(
    score.totalXp,
  );
});

const formattedReferralCount = computed(() => {
  const referrals = auth.referrals.value;
  if (!referrals) return "—";

  return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(
    referrals.referredCount,
  );
});

const canOpenManage = computed(() => canAccessManage(auth.can));
const hasMissingProfileFields = computed(() => {
  return auth.missingProfileFields.value.length > 0;
});

function revokeAvatarPreview() {
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
  avatarPreviewUrl.value = "";
}

function clearPreparedAvatar() {
  revokeAvatarPreview();
  preparedAvatar.value = null;
  avatarActionError.value = "";
  if (avatarInput.value) avatarInput.value.value = "";
}

function openAvatarPicker() {
  avatarInput.value?.click();
}

async function handleAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  avatarPreparing.value = true;
  avatarActionError.value = "";

  try {
    const output = await prepareUserAvatarImage(file);
    revokeAvatarPreview();
    preparedAvatar.value = output.blob;
    avatarPreviewUrl.value = URL.createObjectURL(output.blob);
  } catch (error) {
    clearPreparedAvatar();
    avatarActionError.value = error instanceof Error
      ? error.message
      : t("auth.profile.avatar.errors.prepare");
  } finally {
    avatarPreparing.value = false;
    input.value = "";
  }
}

async function saveAvatar() {
  if (!preparedAvatar.value || avatar.saving.value) return;
  avatarActionError.value = "";

  try {
    await avatar.upload(preparedAvatar.value);
    clearPreparedAvatar();
  } catch (error) {
    avatarActionError.value = error instanceof Error
      ? error.message
      : t("auth.profile.avatar.errors.save");
  }
}

async function removeAvatar() {
  if (avatar.saving.value) return;
  avatarActionError.value = "";

  try {
    await avatar.remove();
    clearPreparedAvatar();
  } catch (error) {
    avatarActionError.value = error instanceof Error
      ? error.message
      : t("auth.profile.avatar.errors.remove");
  }
}

onMounted(async () => {
  if (!auth.isLoggedIn.value) return;

  try {
    await Promise.all([
      auth.refreshAuthorizationState(),
      avatar.refresh(),
    ]);
  } catch (error) {
    console.warn("[Prompt Draft] profile refresh failed", error);
  }
});

onBeforeUnmount(() => {
  revokeAvatarPreview();
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
  avatar.reset();
  emit("close");
}
</script>

<template>
  <el-flex rules="csc" :gap="12" :p="16" class="w100" style="min-width: 280px">
    <input
      ref="avatarInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      class="profile-avatar-input"
      @change="handleAvatarSelected"
    >

    <el-flex rules="rsc" :gap="10" class="w100">
      <el-avatar
        :src="displayedAvatarUrl"
        :name="displayIdentityLabel"
        :alt="t('auth.profile.avatar.alt')"
        size="big"
      />
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

    <el-flex rules="rsc" :gap="6" class="w100">
      <el-button
        class="fg100"
        color="normal"
        mode="flat"
        icon="photo_camera"
        :label="avatar.url.value ? t('auth.profile.avatar.change') : t('auth.profile.avatar.choose')"
        :disable="avatarPreparing || avatar.saving.value"
        @click="openAvatarPicker"
      />
      <el-button
        v-if="avatar.url.value && !preparedAvatar"
        color="red"
        mode="flat"
        type="fab"
        icon="delete"
        :tooltip="t('auth.profile.avatar.remove')"
        :disable="avatar.saving.value"
        @click="removeAvatar"
      />
    </el-flex>

    <el-flex v-if="preparedAvatar" rules="rsc" :gap="6" class="w100">
      <el-button
        class="fg100"
        color="prim"
        icon="save"
        :label="t('auth.profile.avatar.save')"
        :disable="avatar.saving.value"
        @click="saveAvatar"
      />
      <el-button
        color="normal"
        mode="flat"
        icon="close"
        :label="t('auth.profile.avatar.cancel')"
        :disable="avatar.saving.value"
        @click="clearPreparedAvatar"
      />
    </el-flex>

    <el-text v-if="avatarPreparing" :size="10" color="normal55">
      {{ t("auth.profile.avatar.preparing") }}
    </el-text>
    <el-text v-else :size="10" color="normal45">
      {{ t("auth.profile.avatar.hint") }}
    </el-text>
    <el-text v-if="avatarActionError" :size="10" color="red">
      {{ avatarActionError }}
    </el-text>

    <el-divider />

    <el-flex rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55" icon="bolt" icon-color="prim">
        {{ t("auth.profile.xp") }}
      </el-text>
      <el-text :size="13" :weight="800" color="prim">{{ formattedXp }}</el-text>
    </el-flex>

    <el-flex rules="rbc" class="w100" :gap="16">
      <el-text :size="12" color="normal55" icon="person_add" icon-color="blue">
        {{ t("auth.profile.invitedUsers") }}
      </el-text>
      <el-text :size="12" :weight="700">{{ formattedReferralCount }}</el-text>
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

<style scoped>
.profile-avatar-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
