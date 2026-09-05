<script setup lang="ts">
import type { GlobalMenuItem } from "~/composables/useMenu";
import { canAccessManage } from "~/config/manage";
import { prepareUserAvatarImage } from "~/utils/userAvatarImage";
import {
  prepareUserCoverImage,
  type PreparedUserCover,
} from "~/utils/userCoverImage";

const emit = defineEmits<{
  (event: "close"): void;
}>();

const { t, locale } = useI18n();
const auth = useAuth();
const avatar = useUserAvatar();
const cover = useUserCover();
const childMenu = useChildMenu();
const { completeMissingIdentity } = useProfileRequirements();

const user = computed(() => auth.user.value);
const avatarInput = ref<HTMLInputElement | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);
const avatarPreviewUrl = ref("");
const coverPreviewUrl = ref("");
const preparedAvatar = ref<Blob | null>(null);
const preparedCover = ref<PreparedUserCover | null>(null);
const avatarPreparing = ref(false);
const coverPreparing = ref(false);
const avatarActionError = ref("");
const coverActionError = ref("");

const identityLabel = computed(() => {
  return user.value?.username || user.value?.email || "";
});

const displayIdentityLabel = computed(() => {
  const value = identityLabel.value.trim();
  if (!value || value.includes("@")) return value;

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
});

const displayedAvatarUrl = computed(() => avatarPreviewUrl.value || avatar.url.value || null);
const displayedCoverUrl = computed(() => {
  return coverPreviewUrl.value || cover.thumbnailUrl.value || null;
});

const roleLabel = computed(() => {
  return user.value?.role?.replaceAll("_", " ") || "";
});

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

const memberAge = computed(() => {
  if (!user.value?.createdAt) return "";

  const createdAt = new Date(user.value.createdAt);
  if (Number.isNaN(createdAt.getTime())) return "";

  const elapsedMs = Math.max(0, Date.now() - createdAt.getTime());
  const days = Math.floor(elapsedMs / 86_400_000);

  if (days === 0) return t("auth.profile.memberAge.today");
  return t("auth.profile.memberAge.days", { count: days });
});

function compactXp(value: number) {
  if (value < 1000) {
    return new Intl.NumberFormat(locale.value === "fa" ? "fa-IR" : "en-US").format(value);
  }

  const unit = value >= 1_000_000 ? "M" : "K";
  const divisor = value >= 1_000_000 ? 1_000_000 : 1000;
  const compact = (value / divisor).toFixed(1).replace(/\.0$/, "");
  return `${compact}${unit}`;
}

const formattedXp = computed(() => {
  const score = auth.score.value;
  if (!score) return "—";
  return compactXp(score.totalXp);
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

const avatarMenuItems = computed<GlobalMenuItem[]>(() => {
  const items: GlobalMenuItem[] = [
    {
      label: avatar.url.value
        ? t("auth.profile.avatar.change")
        : t("auth.profile.avatar.choose"),
      icon: "photo_camera",
      color: "normal15",
      disabled: () => avatarPreparing.value || avatar.saving.value,
      handler: () => {
        openAvatarPicker();
      },
    },
  ];

  if (avatar.url.value) {
    items.push({
      label: t("auth.profile.avatar.remove"),
      icon: "delete",
      color: "red15",
      disabled: () => avatar.saving.value,
      handler: async () => {
        await removeAvatar();
      },
    });
  }

  return items;
});

function revokeAvatarPreview() {
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
  avatarPreviewUrl.value = "";
}

function revokeCoverPreview() {
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
  coverPreviewUrl.value = "";
}

function clearPreparedAvatar() {
  revokeAvatarPreview();
  preparedAvatar.value = null;
  avatarActionError.value = "";
  if (avatarInput.value) avatarInput.value.value = "";
}

function clearPreparedCover() {
  revokeCoverPreview();
  preparedCover.value = null;
  coverActionError.value = "";
  if (coverInput.value) coverInput.value.value = "";
}

function openAvatarPicker() {
  avatarInput.value?.click();
}

function openAvatarMenu(event: MouseEvent) {
  childMenu.open({
    mode: "point",
    event,
    items: avatarMenuItems.value,
    options: {
      minWidth: 190,
      closeOnSelect: true,
      closeOnOutside: true,
      closeOnEsc: true,
      closeOnScroll: false,
      closeOnResize: true,
    },
  });
}

function openCoverPicker() {
  coverInput.value?.click();
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

async function handleCoverSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  coverPreparing.value = true;
  coverActionError.value = "";

  try {
    const output = await prepareUserCoverImage(file);
    revokeCoverPreview();
    preparedCover.value = output;
    coverPreviewUrl.value = URL.createObjectURL(output.thumbnailBlob);
  } catch (error) {
    clearPreparedCover();
    coverActionError.value = error instanceof Error
      ? error.message
      : t("auth.profile.cover.errors.prepare");
  } finally {
    coverPreparing.value = false;
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

async function saveCover() {
  if (!preparedCover.value || cover.saving.value) return;
  coverActionError.value = "";

  try {
    await cover.upload(preparedCover.value);
    clearPreparedCover();
  } catch (error) {
    coverActionError.value = error instanceof Error
      ? error.message
      : t("auth.profile.cover.errors.save");
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

async function removeCover() {
  if (cover.saving.value) return;
  coverActionError.value = "";

  try {
    await cover.remove();
    clearPreparedCover();
  } catch (error) {
    coverActionError.value = error instanceof Error
      ? error.message
      : t("auth.profile.cover.errors.remove");
  }
}

onMounted(async () => {
  if (!auth.isLoggedIn.value) return;

  try {
    await Promise.all([
      auth.refreshAuthorizationState(),
      avatar.refresh(),
      cover.refresh(),
    ]);
  } catch (error) {
    console.warn("[Prompt Draft] profile refresh failed", error);
  }
});

onBeforeUnmount(() => {
  childMenu.close("replace");
  revokeAvatarPreview();
  revokeCoverPreview();
});

function handleCompleteProfile() {
  emit("close");
  completeMissingIdentity();
}

async function handleOpenProfile() {
  const username = user.value?.username?.trim();
  const userId = user.value?.id;
  if (!username && !userId) return;

  emit("close");

  if (username) {
    await navigateTo(`/user?un=${encodeURIComponent(username)}`);
    return;
  }

  await navigateTo(`/user?id=${encodeURIComponent(userId || "")}`);
}

async function handleOpenManage() {
  emit("close");
  await navigateTo("/manage");
}

async function handleLogout() {
  await auth.logout();
  avatar.reset();
  cover.reset();
  emit("close");
}
</script>

<template>
  <el-flex rules="csc" :gap="0" class="profile-menu w100" style="min-width: 280px">
    <input
      ref="avatarInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      class="profile-media-input"
      @change="handleAvatarSelected"
    >
    <input
      ref="coverInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      class="profile-media-input"
      @change="handleCoverSelected"
    >

    <div class="profile-menu__media w100 por">
      <img
        v-if="displayedCoverUrl"
        :src="displayedCoverUrl"
        alt=""
        class="profile-menu__cover"
      >
      <div v-else class="profile-menu__cover-fallback" />
      <div class="profile-menu__cover-overlay" />

      <el-flex class="profile-menu__cover-actions" rules="rcc" :gap="4">
        <el-button
          type="fab"
          mode="flat"
          color="white"
          text-color="white"
          icon-color="white"
          icon="wallpaper"
          :tooltip="cover.cover.value ? t('auth.profile.cover.change') : t('auth.profile.cover.choose')"
          :size="10"
          :p="7"
          :disable="coverPreparing || cover.saving.value"
          @click="openCoverPicker"
        />
        <el-button
          v-if="cover.cover.value && !preparedCover"
          type="fab"
          mode="flat"
          color="red"
          text-color="white"
          icon-color="white"
          icon="delete"
          :tooltip="t('auth.profile.cover.remove')"
          :size="10"
          :p="7"
          :disable="cover.saving.value"
          @click="removeCover"
        />
      </el-flex>

      <button
        type="button"
        class="profile-menu__avatar-wrap profile-menu__avatar-trigger"
        :aria-label="avatar.url.value ? t('auth.profile.avatar.change') : t('auth.profile.avatar.choose')"
        @click="openAvatarMenu">
        <el-avatar
          :src="displayedAvatarUrl"
          :name="displayIdentityLabel"
          :alt="t('auth.profile.avatar.alt')"
          :size="18"
          :size-offset="12"
          :br="3"
          bc="surface"
        />
      </button>
    </div>

    <el-flex rules="csc" :gap="12" :p="[50, 16, 16, 16]" class="w100">
      <el-flex rules="ccc" :gap="6" class="w100">
        <el-flex rules="rcc" :gap="6" class="w100">
          <el-text :size="15" :weight="800">{{ displayIdentityLabel }}</el-text>
          <el-text
            :size="12"
            :weight="800"
            marker="orange10"
            color="orange"
            :p="[2, 5]"
            :radius="100">
            {{ formattedXp }}
          </el-text>
        </el-flex>

        <el-text
          v-if="roleLabel"
          :size="11"
          color="normal55"
          :marker="roleMarker">
          {{ roleLabel }}
        </el-text>
      </el-flex>

      <el-flex v-if="preparedAvatar" rules="rcc" :gap="6" class="w100">
        <el-button
          color="prim"
          icon="save"
          :label="t('auth.profile.avatar.save')"
          :size="12"
          :disable="avatar.saving.value"
          @click="saveAvatar"
        />
        <el-button
          type="fab"
          color="normal"
          mode="flat"
          icon="close"
          :tooltip="t('auth.profile.avatar.cancel')"
          :size="12"
          :disable="avatar.saving.value"
          @click="clearPreparedAvatar"
        />
      </el-flex>

      <el-flex v-if="preparedCover" rules="rcc" :gap="6" class="w100">
        <el-button
          color="blue"
          icon="save"
          :label="t('auth.profile.cover.save')"
          :size="12"
          :disable="cover.saving.value"
          @click="saveCover"
        />
        <el-button
          type="fab"
          color="normal"
          mode="flat"
          icon="close"
          :tooltip="t('auth.profile.cover.cancel')"
          :size="12"
          :disable="cover.saving.value"
          @click="clearPreparedCover"
        />
      </el-flex>

      <el-text v-if="avatarPreparing" :size="10" color="normal55">
        {{ t("auth.profile.avatar.preparing") }}
      </el-text>
      <el-text v-if="coverPreparing" :size="10" color="normal55">
        {{ t("auth.profile.cover.preparing") }}
      </el-text>
      <el-text v-if="avatarActionError" :size="10" color="red">
        {{ avatarActionError }}
      </el-text>
      <el-text v-if="coverActionError" :size="10" color="red">
        {{ coverActionError }}
      </el-text>

      <el-divider />

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

      <el-flex v-if="memberAge" rules="rbc" class="w100" :gap="16">
        <el-text :size="12" color="normal55">{{ t("auth.profile.memberSince") }}</el-text>
        <el-text :size="12">{{ memberAge }}</el-text>
      </el-flex>

      <el-button
        v-if="hasMissingProfileFields"
        class="w100"
        color="orange"
        mode="flat"
        icon="person_add"
        :label="t('auth.profile.complete')"
        @click="handleCompleteProfile"
      />

      <el-divider />

      <el-flex rules="rsc" :gap="8" class="w100">
        <el-button
          v-if="canOpenManage"
          class="fg100"
          color="blue"
          icon="admin_panel_settings"
          :label="t('manage.title')"
          @click="handleOpenManage"
        />

        <el-button
          type="fab"
          color="normal"
          mode="flat"
          icon="person"
          :tooltip="t('auth.profile.viewProfile')"
          @click="handleOpenProfile"
        />

        <el-button
          type="fab"
          color="red"
          mode="flat"
          icon="logout"
          :tooltip="t('auth.profile.logout')"
          :disable="auth.loading.value"
          @click="handleLogout"
        />
      </el-flex>
    </el-flex>
  </el-flex>
</template>

<style scoped>
.profile-media-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.profile-menu__media {
  height: 132px;
  overflow: visible;
}

.profile-menu__cover,
.profile-menu__cover-fallback,
.profile-menu__cover-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.profile-menu__cover {
  object-fit: cover;
}

.profile-menu__cover-fallback {
  background:
    radial-gradient(circle at 20% 10%, rgba(70, 110, 255, 0.42), transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(122, 55, 255, 0.32), transparent 48%),
    linear-gradient(135deg, rgba(28, 31, 42, 0.95), rgba(13, 15, 21, 0.98));
}

.profile-menu__cover-overlay {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.5));
}

.profile-menu__cover-actions {
  position: absolute;
  inset-block-start: 10px;
  inset-inline-end: 10px;
  z-index: 3;
}

.profile-menu__avatar-wrap {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 4;
  transform: translate(-50%, 50%);
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.28));
}

.profile-menu__avatar-trigger {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  appearance: none;
  cursor: pointer;
}

.profile-menu__avatar-trigger:focus-visible {
  outline: 2px solid var(--themePrimary);
  outline-offset: 3px;
}
</style>