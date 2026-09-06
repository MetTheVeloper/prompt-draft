<script setup lang="ts">
import DraftArchivePromotionModal from "~/components/modals/DraftArchivePromotionModal.vue";
import DraftPreviewManagerModal from "~/components/modals/DraftPreviewManagerModal.vue";
import { AUTH_PERMISSIONS } from "~/config/authorization";
import type { PromptDraftCollection } from "~/modules/promptDraft.types";
import type {
  PublicUserProfile,
  UserDraftPreviewImage,
  UserDraftVisibility,
  UserProfileDraftSummary,
} from "~/types/userProfileApi";
import { DRAFT_PREVIEW_IMAGE_MAX_COUNT } from "~/utils/draftPreviewImage";
import {
  compileCloudDraftOutput,
  copyTextToClipboard,
  downloadCloudDraftJson,
} from "~/utils/cloudDraftActions";
import { removeDraftSyncEntry } from "~/utils/draftCloudSync";

const DRAFT_COLLECTION_STORAGE_KEY = "prompt-draft:create-editor:drafts:v1";
const CREATE_DRAFT_COLLECTION_REFRESH_EVENT =
  "prompt-draft:create-editor:collection-refresh";

const route = useRoute();
const auth = useAuth();
const avatarState = useUserAvatar();
const coverState = useUserCover();
const api = useUserProfileApi();
const promptApi = usePromptDraftApi();
const promotionApi = useArchivePromotionApi();
const menu = useMenu();
const modal = useModal();
const { showToast } = useToast();
const { t, locale } = useI18n();
const { mobile, tablet, mini } = useScreen();

const profile = ref<PublicUserProfile | null>(null);
const drafts = ref<UserProfileDraftSummary[]>([]);
const isOwner = ref(false);
const loading = ref(true);
const draftsLoading = ref(false);
const loadingMore = ref(false);
const errorMessage = ref("");
const draftsError = ref("");
const nextCursor = ref<string | null>(null);
const hasMore = ref(false);
const visibilityBusyIds = ref<string[]>([]);
const actionBusyIds = ref<string[]>([]);
const promotedDraftIds = ref<string[]>([]);
const hoveredDraftId = ref<string | null>(null);
let requestVersion = 0;

const moderationCopy = computed(() => locale.value === "fa"
  ? {
      addToPrompts: "افزودن به پرامپت‌ها",
      promotionTitle: "افزودن درفت به Prompt Archive",
      promotionSubtitle: "یک Draft آرشیو مستقل از محتوای عمومی کاربر بسازید.",
      delete: "حذف درفت",
      deleteTitle: "حذف مدیریتی درفت",
      deleteDescription: "این عملیات درفت را به‌صورت soft delete از تمام لیست‌های عادی حذف می‌کند؛ داده برای audit/recovery در دیتابیس باقی می‌ماند.",
      cancel: "لغو",
      confirmDelete: "حذف درفت",
      deleteError: "حذف مدیریتی درفت انجام نشد.",
      deleteSuccess: "درفت از نمایش عمومی و لیست‌های عادی حذف شد.",
      promoted: "این درفت در همین نشست به Prompt Archive اضافه شده است.",
    }
  : {
      addToPrompts: "Add to prompts",
      promotionTitle: "Add Draft to Prompt Archive",
      promotionSubtitle: "Create an independent Archive Draft from this public user Draft.",
      delete: "Delete Draft",
      deleteTitle: "Moderation delete Draft",
      deleteDescription: "This soft-deletes the Draft from normal owner/public lists while retaining its data for audit and recovery.",
      cancel: "Cancel",
      confirmDelete: "Delete Draft",
      deleteError: "Prompt Draft could not moderation-delete this Draft.",
      deleteSuccess: "The Draft was removed from normal/public listings.",
      promoted: "This Draft was added to Prompt Archive during this session.",
    });

const routeUserId = computed(() => {
  const value = typeof route.query.id === "string" ? route.query.id.trim() : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
});

const routeUsername = computed(() => {
  const value = typeof route.query.un === "string"
    ? route.query.un.trim().toLowerCase()
    : "";
  return /^[a-z0-9._-]{3,64}$/.test(value) ? value : null;
});

const displayName = computed(() => {
  const username = profile.value?.username?.trim();
  if (!username) return t("userProfile.fallbackName");
  return `${username.charAt(0).toUpperCase()}${username.slice(1)}`;
});

const heroAvatarUrl = computed(() => {
  if (!profile.value) return null;
  if (isOwner.value && avatarState.loadedUserId.value === profile.value.id) {
    return avatarState.url.value;
  }
  return profile.value.avatarUrl;
});

const heroCoverUrl = computed(() => {
  if (!profile.value) return null;
  if (isOwner.value && coverState.loadedUserId.value === profile.value.id) {
    return coverState.fullUrl.value;
  }
  return profile.value.cover?.fullUrl || null;
});

const heroTitleSize = computed(() => mobile.value ? 46 : tablet.value || mini.value ? 64 : 86);
const heroAvatarSize = computed(() => mobile.value ? 30 : tablet.value || mini.value ? 36 : 44);
const contentPadding = computed(() => mobile.value ? 16 : tablet.value || mini.value ? 24 : 40);
const heroStyle = computed(() => ({ minHeight: `calc(100vh - ${dimension().header.height}px)` }));
const draftColumns = computed(() => mobile.value ? 1 : tablet.value || mini.value ? 2 : 3);

const formattedXp = computed(() => new Intl.NumberFormat(
  locale.value === "fa" ? "fa-IR" : "en-US",
).format(profile.value?.totalXp ?? 0));

const visibleDraftCount = computed(() => {
  if (!profile.value) return 0;
  return isOwner.value
    ? profile.value.totalDraftCount ?? profile.value.publicDraftCount
    : profile.value.publicDraftCount;
});
const draftsTitle = computed(() => {
  const title = t("userProfile.drafts.title");
  return visibleDraftCount.value > 0 ? `${title} (${visibleDraftCount.value})` : title;
});
const draftDescription = computed(() => isOwner.value
  ? t("userProfile.drafts.ownerDescription")
  : t("userProfile.drafts.publicDescription"));

useHead(() => ({
  title: profile.value ? `${displayName.value} · Prompt Draft` : t("userProfile.fallbackName"),
}));

function getApiErrorMessage(error: unknown, fallback: string) {
  const value = error as { data?: { message?: unknown } };
  return typeof value?.data?.message === "string" && value.data.message.trim()
    ? value.data.message
    : fallback;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  }).format(date);
}
function formatUpdatedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale.value === "fa" ? "fa-IR" : "en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}
function formatOutputFormat(value: UserProfileDraftSummary["outputFormat"]) {
  return value.toUpperCase();
}
function scrollToDrafts() {
  if (!import.meta.client) return;
  document.getElementById("user-profile-drafts")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function isDraftActionBusy(draftId: string) {
  return actionBusyIds.value.includes(draftId);
}
function setDraftActionBusy(draftId: string, busy: boolean) {
  if (busy) {
    if (!actionBusyIds.value.includes(draftId)) actionBusyIds.value = [...actionBusyIds.value, draftId];
  } else {
    actionBusyIds.value = actionBusyIds.value.filter(id => id !== draftId);
  }
}
function applyDraftImages(draft: UserProfileDraftSummary, images: UserDraftPreviewImage[]) {
  draft.images = [...images];
}

function openPreviewManager(draft: UserProfileDraftSummary) {
  if (!isOwner.value) return;
  modal.open({
    header: {
      icon: "wallpaper",
      title: t("userProfile.drafts.media.manageTitle"),
      subtitle: draft.title,
      closeButton: true,
      color: "blue",
    },
    component: DraftPreviewManagerModal,
    props: {
      draftId: draft.id,
      title: draft.title,
      images: draft.images,
      onImagesChange: (images: UserDraftPreviewImage[]) => applyDraftImages(draft, images),
    },
    options: { width: 920, maxHeight: "88vh" },
  });
}

function draftIsPublic(draft: UserProfileDraftSummary) {
  return isOwner.value ? draft.visibility === "public" : true;
}
function canPromoteDraft(draft: UserProfileDraftSummary) {
  return Boolean(
    profile.value &&
    draftIsPublic(draft) &&
    auth.can(AUTH_PERMISSIONS.ARCHIVE_MANAGE),
  );
}
function canModerateDraft(draft: UserProfileDraftSummary) {
  return Boolean(
    profile.value &&
    !isOwner.value &&
    draftIsPublic(draft) &&
    auth.can(AUTH_PERMISSIONS.DRAFTS_DELETE_ANY),
  );
}
function hasTopbarActions(draft: UserProfileDraftSummary) {
  return isOwner.value || canPromoteDraft(draft) || canModerateDraft(draft);
}

function openPromotion(draft: UserProfileDraftSummary) {
  if (!profile.value || !canPromoteDraft(draft)) return;
  modal.open({
    header: {
      icon: "library_add",
      title: moderationCopy.value.promotionTitle,
      subtitle: draft.title,
      desc: moderationCopy.value.promotionSubtitle,
      closeButton: true,
      color: "prim",
    },
    component: DraftArchivePromotionModal,
    props: {
      sourceUserId: profile.value.id,
      draftId: draft.id,
      draftTitle: draft.title,
      onPromoted: () => {
        if (!promotedDraftIds.value.includes(draft.id)) {
          promotedDraftIds.value = [...promotedDraftIds.value, draft.id];
        }
      },
    },
    options: { width: 620, maxHeight: "88vh" },
  });
}

function confirmModerationDelete(draft: UserProfileDraftSummary) {
  if (!profile.value || !canModerateDraft(draft)) return;
  const targetUserId = profile.value.id;
  const confirmationId = modal.open({
    header: {
      icon: "delete_forever",
      title: moderationCopy.value.deleteTitle,
      subtitle: draft.title,
      closeButton: true,
      color: "red",
    },
    descriptions: [moderationCopy.value.deleteDescription],
    actions: [
      { label: moderationCopy.value.cancel, color: "normal", mode: "flat" },
      {
        label: moderationCopy.value.confirmDelete,
        icon: "delete_forever",
        color: "red",
        mode: "flat",
        close: false,
        disable: () => isDraftActionBusy(draft.id),
        handler: async () => {
          if (isDraftActionBusy(draft.id)) return false;
          setDraftActionBusy(draft.id, true);
          draftsError.value = "";
          try {
            await promotionApi.moderateDeleteDraft(targetUserId, draft.id);
            drafts.value = drafts.value.filter(item => item.id !== draft.id);
            await refreshProfileSummary();
            modal.close(confirmationId);
            showToast("success", moderationCopy.value.deleteSuccess);
          } catch (error) {
            draftsError.value = getApiErrorMessage(error, moderationCopy.value.deleteError);
          } finally {
            setDraftActionBusy(draft.id, false);
          }
          return false;
        },
      },
    ],
    options: { width: 500 },
  });
}

async function editDraft(draft: UserProfileDraftSummary) {
  await navigateTo({ path: "/create", query: { draft: draft.id } });
}
async function copyDraftOutput(draft: UserProfileDraftSummary) {
  if (isDraftActionBusy(draft.id)) return;
  setDraftActionBusy(draft.id, true);
  draftsError.value = "";
  try {
    const response = await promptApi.getPromptDraft(draft.id);
    const output = compileCloudDraftOutput(response.draft);
    if (!output.trim()) throw new Error(t("userProfile.drafts.errors.outputEmpty"));
    const copied = await copyTextToClipboard(output);
    if (!copied) throw new Error(t("userProfile.drafts.errors.copy"));
    showToast("success", t("userProfile.drafts.copySuccess"));
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : t("userProfile.drafts.errors.copy");
    draftsError.value = getApiErrorMessage(error, message);
  } finally {
    setDraftActionBusy(draft.id, false);
  }
}
async function downloadDraftJson(draft: UserProfileDraftSummary) {
  if (isDraftActionBusy(draft.id)) return;
  setDraftActionBusy(draft.id, true);
  draftsError.value = "";
  try {
    const response = await promptApi.getPromptDraft(draft.id);
    downloadCloudDraftJson(response.draft);
  } catch (error) {
    draftsError.value = getApiErrorMessage(error, t("userProfile.drafts.errors.download"));
  } finally {
    setDraftActionBusy(draft.id, false);
  }
}

function removeDraftFromLocalMirror(draftId: string) {
  if (!import.meta.client) return;
  const userId = auth.user.value?.id;
  if (userId) removeDraftSyncEntry(userId, draftId);
  const raw = localStorage.getItem(DRAFT_COLLECTION_STORAGE_KEY);
  if (!raw) return;
  try {
    const collection = JSON.parse(raw) as Partial<PromptDraftCollection>;
    if (collection.version !== 1 || !Array.isArray(collection.drafts)) return;
    const nextDrafts = collection.drafts.filter(draft => draft.id !== draftId);
    const nextActiveId = collection.activeDraftId === draftId
      ? nextDrafts[0]?.id ?? null
      : collection.activeDraftId ?? nextDrafts[0]?.id ?? null;
    localStorage.setItem(DRAFT_COLLECTION_STORAGE_KEY, JSON.stringify({
      version: 1,
      activeDraftId: nextActiveId,
      drafts: nextDrafts,
    } satisfies PromptDraftCollection));
    window.dispatchEvent(new Event(CREATE_DRAFT_COLLECTION_REFRESH_EVENT));
  } catch {}
}

function confirmDeleteDraft(draft: UserProfileDraftSummary) {
  const confirmationId = modal.open({
    header: {
      icon: "delete",
      title: t("userProfile.drafts.deleteTitle"),
      subtitle: draft.title,
      closeButton: true,
      color: "red",
    },
    descriptions: [t("userProfile.drafts.deleteDescription")],
    actions: [
      { label: t("userProfile.drafts.actions.cancel"), color: "normal", mode: "flat" },
      {
        label: t("userProfile.drafts.actions.delete"),
        icon: "delete",
        color: "red",
        mode: "flat",
        close: false,
        disable: () => isDraftActionBusy(draft.id),
        handler: async () => {
          if (isDraftActionBusy(draft.id)) return false;
          setDraftActionBusy(draft.id, true);
          draftsError.value = "";
          try {
            await promptApi.deletePromptDraft(draft.id);
            drafts.value = drafts.value.filter(item => item.id !== draft.id);
            removeDraftFromLocalMirror(draft.id);
            await refreshProfileSummary();
            modal.close(confirmationId);
          } catch (error) {
            draftsError.value = getApiErrorMessage(error, t("userProfile.drafts.errors.delete"));
          } finally {
            setDraftActionBusy(draft.id, false);
          }
          return false;
        },
      },
    ],
    options: { width: 480 },
  });
}

function openDraftActions(event: MouseEvent, draft: UserProfileDraftSummary) {
  if (!isOwner.value) return;
  const isPublic = draft.visibility === "public";
  menu.open({
    mode: "point",
    event,
    items: [
      { label: t("userProfile.drafts.actions.edit"), icon: "edit", disabled: () => isDraftActionBusy(draft.id), handler: () => editDraft(draft) },
      { label: t("userProfile.drafts.actions.managePreviews"), icon: "wallpaper", handler: () => openPreviewManager(draft) },
      { label: t("userProfile.drafts.actions.copyOutput"), icon: "content_copy", disabled: () => isDraftActionBusy(draft.id), handler: () => copyDraftOutput(draft) },
      { label: t("userProfile.drafts.actions.downloadJson"), icon: "download", disabled: () => isDraftActionBusy(draft.id), handler: () => downloadDraftJson(draft) },
      { type: "divider" },
      {
        label: isPublic ? t("userProfile.drafts.actions.unpublish") : t("userProfile.drafts.actions.publish"),
        icon: isPublic ? "visibility_off" : "public",
        color: isPublic ? "orange" : "green",
        disabled: () => visibilityBusyIds.value.includes(draft.id),
        handler: () => setVisibility(draft, isPublic ? "private" : "public"),
      },
      { label: t("userProfile.drafts.actions.delete"), icon: "delete", color: "red", disabled: () => isDraftActionBusy(draft.id), handler: () => confirmDeleteDraft(draft) },
    ],
    options: { minWidth: 220 },
  });
}

async function resolveTargetUserId() {
  if (routeUserId.value) return routeUserId.value;
  if (!routeUsername.value) return null;
  const response = await api.resolveUsername(routeUsername.value);
  return response.user.id;
}

async function loadDrafts(targetUserId: string, options: { append?: boolean; version?: number } = {}) {
  const append = Boolean(options.append);
  const version = options.version ?? requestVersion;
  if (append) {
    if (!hasMore.value || !nextCursor.value || loadingMore.value) return;
    loadingMore.value = true;
  } else {
    draftsLoading.value = true;
    draftsError.value = "";
  }
  try {
    const response = await api.listDrafts(targetUserId, {
      limit: 24,
      cursor: append ? nextCursor.value || undefined : undefined,
    });
    if (version !== requestVersion) return;
    drafts.value = append ? [...drafts.value, ...response.drafts] : response.drafts;
    isOwner.value = response.viewer.isOwner;
    nextCursor.value = response.pageInfo.nextCursor;
    hasMore.value = response.pageInfo.hasMore;
  } catch (error) {
    if (version !== requestVersion) return;
    draftsError.value = getApiErrorMessage(error, t("userProfile.drafts.errors.load"));
    if (!append) {
      drafts.value = [];
      nextCursor.value = null;
      hasMore.value = false;
    }
  } finally {
    if (version === requestVersion) {
      draftsLoading.value = false;
      loadingMore.value = false;
    }
  }
}

async function loadProfile() {
  const version = ++requestVersion;
  loading.value = true;
  errorMessage.value = "";
  draftsError.value = "";
  profile.value = null;
  drafts.value = [];
  nextCursor.value = null;
  hasMore.value = false;
  isOwner.value = false;
  hoveredDraftId.value = null;
  actionBusyIds.value = [];
  promotedDraftIds.value = [];

  if (!routeUserId.value && !routeUsername.value) {
    errorMessage.value = t("userProfile.notFoundDescription");
    loading.value = false;
    return;
  }
  await auth.initialize();
  try {
    const targetUserId = await resolveTargetUserId();
    if (version !== requestVersion) return;
    if (!targetUserId) {
      errorMessage.value = t("userProfile.notFoundDescription");
      return;
    }
    const response = await api.getProfile(targetUserId);
    if (version !== requestVersion) return;
    profile.value = response.profile;
    isOwner.value = response.viewer.isOwner;
    await loadDrafts(targetUserId, { version });
  } catch (error) {
    if (version !== requestVersion) return;
    errorMessage.value = getApiErrorMessage(error, t("userProfile.notFoundDescription"));
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}

async function refreshProfileSummary() {
  const targetUserId = profile.value?.id;
  if (!targetUserId) return;
  try {
    const response = await api.getProfile(targetUserId);
    profile.value = response.profile;
    isOwner.value = response.viewer.isOwner;
  } catch {}
}

async function setVisibility(draft: UserProfileDraftSummary, visibility: UserDraftVisibility) {
  if (!isOwner.value || visibilityBusyIds.value.includes(draft.id)) return;
  visibilityBusyIds.value = [...visibilityBusyIds.value, draft.id];
  draftsError.value = "";
  try {
    const response = await api.setDraftVisibility(draft.id, visibility);
    draft.visibility = response.draft.visibility;
    draft.publishedAt = response.draft.publishedAt;
    await refreshProfileSummary();
  } catch (error) {
    draftsError.value = getApiErrorMessage(error, t("userProfile.drafts.errors.visibility"));
  } finally {
    visibilityBusyIds.value = visibilityBusyIds.value.filter(id => id !== draft.id);
  }
}
function loadMore() {
  const targetUserId = profile.value?.id;
  if (!targetUserId) return;
  return loadDrafts(targetUserId, { append: true });
}

watch(() => [route.query.id, route.query.un], () => { void loadProfile(); });
onMounted(() => { void loadProfile(); });
</script>

<template>
  <el-flex v-if="loading" rules="ccc" class="w100 h100" :gap="10" :p="40">
    <el-icon icon="refresh" color="prim" :size="34" />
    <el-text :size="13" color="normal55">{{ t("userProfile.loading") }}</el-text>
  </el-flex>

  <el-flex v-else-if="errorMessage || !profile" rules="ccc" class="w100 h100" :gap="10" :p="32">
    <el-icon icon="person_off" color="normal35" :size="44" />
    <el-text type="h1" :size="mini ? 24 : 32" :weight="900">{{ t("userProfile.notFoundTitle") }}</el-text>
    <el-text type="p" :size="13" color="normal55" class="tc">{{ errorMessage || t("userProfile.notFoundDescription") }}</el-text>
    <el-button icon="refresh" mode="flat" color="prim" :label="t('userProfile.retry')" @click="loadProfile" />
  </el-flex>

  <div v-else class="user-profile w100 por">
    <visual-slider
      v-if="heroCoverUrl"
      :sources="[heroCoverUrl]"
      :interval="9000"
      :transition-duration="2600"
      :edge-blur="320"
      :random="false"
      :z-index="0"
      :opacity="1"
      :start-index="0"
    />
    <div v-else class="user-profile__fallback-bg" />
    <div class="user-profile__cinema-overlay" />
    <div class="user-profile__grain" />

    <section class="user-profile__hero w100 por zi20" :style="heroStyle">
      <el-flex rules="ccc" class="user-profile__hero-content w100 h100" :gap="18" :p="contentPadding">
        <el-avatar :src="heroAvatarUrl" :name="displayName" :size="heroAvatarSize" :br="4" bc="white" class="user-profile__hero-avatar" />
        <el-flex rules="ccc" :gap="6" class="user-profile__identity-meta">
          <el-text :size="10" :weight="900" marker="white" color="black" :p="[3, 8]" :radius="100">{{ t("userProfile.eyebrow") }}</el-text>
          <el-text :size="mobile ? 11 : 13" color="white">{{ t("userProfile.memberSince", { date: formatDate(profile.createdAt) }) }}</el-text>
        </el-flex>
        <el-text type="h1" :size="heroTitleSize" :weight="600" color="white" effect="glitch" class="user-profile__title tc">{{ displayName }}</el-text>

        <el-flex rules="rcc" :gap="mobile ? 8 : 12" wrap class="user-profile__stats-row w100">
          <el-flex rules="ccc" :gap="2" class="user-profile__stat" :p="[10, 14]" :radius="16">
            <el-text :size="mobile ? 18 : 24" :weight="900" color="white">{{ formattedXp }}</el-text>
            <el-text :size="10" color="white">{{ t("userProfile.stats.xp") }}</el-text>
          </el-flex>
          <el-flex rules="ccc" :gap="2" class="user-profile__stat" :p="[10, 14]" :radius="16">
            <el-text :size="mobile ? 18 : 24" :weight="900" color="white">{{ profile.publicDraftCount }}</el-text>
            <el-text :size="10" color="white">{{ t("userProfile.stats.publicDrafts") }}</el-text>
          </el-flex>
          <el-flex v-if="isOwner" rules="ccc" :gap="2" class="user-profile__stat" :p="[10, 14]" :radius="16">
            <el-text :size="mobile ? 18 : 24" :weight="900" color="white">{{ profile.totalDraftCount ?? profile.publicDraftCount }}</el-text>
            <el-text :size="10" color="white">{{ t("userProfile.stats.totalDrafts") }}</el-text>
          </el-flex>
        </el-flex>

        <el-button
          :label="t('userProfile.drafts.title')"
          icon="arrow_downward"
          mode="outline"
          color="white"
          text-color="white"
          icon-color="white"
          :size="13"
          :p="[9, 14]"
          @click="scrollToDrafts"
        />
      </el-flex>
    </section>

    <section id="user-profile-drafts" class="user-profile__drafts por zi20">
      <el-flex rules="csc" class="w100" :gap="24" :p="contentPadding">
        <el-grid :gap="8" class="w100">
          <el-text :size="10" :weight="900" color="prim" class="wsnw">{{ t("userProfile.drafts.eyebrow") }}</el-text>
          <el-text type="h2" :size="mobile ? 34 : 54" :weight="600">{{ draftsTitle }}</el-text>
          <el-text type="p" :size="mobile ? 12 : 14" color="normal55" style="max-width: 760px">{{ draftDescription }}</el-text>
        </el-grid>

        <el-flex v-if="draftsError" rules="rsc" class="w100" :gap="8" :p="12" :radius="12" bg="red10">
          <el-icon icon="warning" color="red" :size="18" />
          <el-text color="red" :size="11">{{ draftsError }}</el-text>
        </el-flex>

        <el-flex v-if="draftsLoading" rules="ccc" class="w100" :gap="8" :p="32">
          <el-icon icon="refresh" color="prim" :size="26" />
        </el-flex>

        <el-flex v-else-if="!drafts.length" rules="ccc" class="w100" :gap="10" :p="48" :radius="20" bg="normal5">
          <el-icon icon="draft" color="normal35" :size="38" />
          <el-text :size="14" :weight="700" class="tc">{{ isOwner ? t("userProfile.drafts.emptyOwner") : t("userProfile.drafts.emptyPublic") }}</el-text>
        </el-flex>

        <el-grid v-else :cols="draftColumns" :gap="14" class="w100">
          <el-flex
            v-for="draft in drafts"
            :key="draft.id"
            rules="ccs"
            class="user-profile__draft-card w100"
            :class="{ 'has-secondary': draft.images.length > 1 }"
            :gap="0"
            :radius="18"
            :br="1"
            :bc="hoveredDraftId === draft.id ? 'normal50' : 'normal15'"
            :effect="{ color: 'normal15' }"
            @mouseenter="hoveredDraftId = draft.id"
            @mouseleave="hoveredDraftId = hoveredDraftId === draft.id ? null : hoveredDraftId">
            <template v-if="draft.images.length">
              <img :src="draft.images[0].url" :alt="draft.title" class="user-profile__draft-bg user-profile__draft-bg--primary" loading="lazy" decoding="async" draggable="false">
              <img v-if="draft.images[1]" :src="draft.images[1].url" :alt="draft.title" class="user-profile__draft-bg user-profile__draft-bg--secondary" loading="lazy" decoding="async" draggable="false">
            </template>
            <div v-else class="user-profile__draft-bg-fallback" />
            <div class="user-profile__draft-shade pen" />

            <el-flex
              v-if="hasTopbarActions(draft) || draft.images.length"
              rules="rsc"
              class="user-profile__draft-topbar w100"
              :gap="8">
              <el-flex v-if="hasTopbarActions(draft)" rules="rsc" class="fg100" :gap="8">
                <el-flex rules="rsc" :gap="0" bd="b8" :radius="100" bg="surface75">
                  <template v-if="isOwner">
                    <el-button
                      type="fab"
                      color="normal"
                      mode="flat"
                      icon="more_vert"
                      :tooltip="t('userProfile.drafts.actions.more')"
                      @click="openDraftActions($event, draft)"
                    />
                    <el-button
                      type="fab"
                      color="blue"
                      mode="flat"
                      icon="add_photo_alternate"
                      :tooltip="t('userProfile.drafts.actions.managePreviews')"
                      @click="openPreviewManager(draft)"
                    />
                  </template>

                  <el-button
                    v-if="canPromoteDraft(draft)"
                    type="fab"
                    :color="promotedDraftIds.includes(draft.id) ? 'green' : 'prim'"
                    mode="flat"
                    :icon="promotedDraftIds.includes(draft.id) ? 'check' : 'library_add'"
                    :tooltip="promotedDraftIds.includes(draft.id) ? moderationCopy.promoted : moderationCopy.addToPrompts"
                    :disable="promotedDraftIds.includes(draft.id)"
                    @click="openPromotion(draft)"
                  />

                  <el-button
                    v-if="canModerateDraft(draft)"
                    type="fab"
                    color="red"
                    mode="flat"
                    icon="delete_forever"
                    :tooltip="moderationCopy.delete"
                    :disable="isDraftActionBusy(draft.id)"
                    @click="confirmModerationDelete(draft)"
                  />
                </el-flex>
              </el-flex>
              <div v-else class="fg100" />

              <el-flex
                v-if="draft.images.length"
                rules="rcc"
                class="user-profile__draft-media-count"
                :p="[5, 8]"
                :radius="100"
                bg="surface75"
                bd="b6">
                <el-text :size="10" :weight="800">
                  {{ t("userProfile.drafts.media.count", { count: draft.images.length, max: DRAFT_PREVIEW_IMAGE_MAX_COUNT }) }}
                </el-text>
              </el-flex>
            </el-flex>

            <el-flex rules="ccs" class="user-profile__draft-content w100" :gap="12">
              <el-flex rules="rsc" :gap="8" wrap class="w100 fw">
                <el-text :size="11" :weight="800" marker="normal" color="invert" :p="[4, 7]" :radius="100">{{ formatOutputFormat(draft.outputFormat) }}</el-text>
                <el-text
                  v-if="isOwner && draft.visibility"
                  :size="11"
                  :weight="800"
                  :marker="draft.visibility === 'public' ? 'green35' : 'orange35'"
                  color="normal"
                  :p="[4, 7]"
                  :radius="100">
                  {{ t(`userProfile.drafts.visibility.${draft.visibility}`) }}
                </el-text>
              </el-flex>

              <el-text type="h3" :size="mobile ? 40 : 48" :weight="650" class="user-profile__draft-title">{{ draft.title }}</el-text>

              <el-flex rules="rsc" :gap="12" wrap class="user-profile__draft-meta w100 fw">
                <el-text :size="mobile ? 11 : 12" icon="account_tree">{{ t("userProfile.drafts.modules", { count: draft.moduleCount }) }}</el-text>
                <el-text :size="mobile ? 11 : 12" icon="history">{{ t("userProfile.drafts.revision", { revision: draft.revision }) }}</el-text>
                <el-text :size="mobile ? 11 : 12" icon="schedule">{{ t("userProfile.drafts.updated", { date: formatUpdatedDate(draft.updatedAt) }) }}</el-text>
              </el-flex>
            </el-flex>
          </el-flex>
        </el-grid>

        <el-button v-if="hasMore" icon="expand_more" mode="flat" color="normal" :label="t('userProfile.drafts.loadMore')" :disable="loadingMore" @click="loadMore" />
      </el-flex>
    </section>
  </div>
</template>

<style scoped>
.user-profile {
  min-height: 100%;
  isolation: isolate;
  background: var(--themeBackground);
}

.user-profile__fallback-bg,
.user-profile__cinema-overlay,
.user-profile__grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.user-profile__fallback-bg {
  z-index: 0;
  background:
    radial-gradient(circle at 18% 18%, var(--primary35), transparent 42%),
    radial-gradient(circle at 82% 22%, var(--themePurple25), transparent 46%),
    linear-gradient(145deg, var(--themeSurface20), var(--themeBackground));
}

.user-profile__cinema-overlay {
  z-index: 4;
  background:
    radial-gradient(circle at 50% 34%, transparent 0%, var(--themeSurface15) 44%, var(--themeSurface75) 100%),
    linear-gradient(180deg, var(--themeSurface5) 0%, var(--themeSurface20) 42%, var(--themeSurface85) 100%);
}

.user-profile__grain {
  z-index: 5;
  opacity: 0.08;
  background-image:
    repeating-radial-gradient(circle at 0 0, var(--normalText30) 0, var(--normalText30) .5px, transparent .6px, transparent 3px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.user-profile__hero {
  display: flex;
  align-items: stretch;
}

.user-profile__hero-content {
  justify-content: center;
  align-items: center;
  text-align: center;
  max-width: 1180px;
  margin-inline: auto;
  padding-top: clamp(72px, 10vh, 120px) !important;
  padding-bottom: clamp(52px, 9vh, 110px) !important;
}

.user-profile__hero-avatar {
  filter: drop-shadow(0 18px 44px rgba(0, 0, 0, 0.38));
}

.user-profile__identity-meta {
  width: 100%;
  align-items: center !important;
}

.user-profile__title {
  max-width: min(1000px, 94vw);
  line-height: 0.92 !important;
  letter-spacing: -0.045em;
  text-wrap: balance;
  text-shadow: 0 10px 50px rgba(0, 0, 0, 0.32);
}

.user-profile__stats-row {
  justify-content: center !important;
}

.user-profile__stat {
  min-width: 116px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(10, 12, 18, 0.34);
  backdrop-filter: blur(14px);
}

.user-profile__drafts {
  background:
    linear-gradient(180deg, var(--themeSurface75) 0%, var(--themeSurface90) 28%, var(--themeSurface95) 100%);
  backdrop-filter: blur(9px);
  border-top: 1px solid var(--themeSurface85);
}

.user-profile__drafts > .el-flex {
  max-width: 1440px;
  margin-inline: auto;
  padding-top: 72px !important;
  padding-bottom: 72px !important;
}

.user-profile__draft-card {
  aspect-ratio: 1 / 1;
  isolation: isolate;
  overflow: hidden;
  background: var(--themeBackground);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.22);
  transition: transform 260ms ease, border-color 220ms ease, box-shadow 260ms ease;
}

.user-profile__draft-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

.user-profile__draft-card :deep(.effect) {
  z-index: 4;
  mix-blend-mode: soft-light;
}

.user-profile__draft-bg,
.user-profile__draft-bg-fallback,
.user-profile__draft-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.user-profile__draft-bg {
  z-index: 1;
  display: block;
  object-fit: cover;
  object-position: center;
  user-select: none;
  pointer-events: none;
  transition: opacity 420ms ease, transform 700ms cubic-bezier(.2, .7, .2, 1);
}

.user-profile__draft-bg--primary { opacity: 1; }
.user-profile__draft-bg--secondary { opacity: 0; transform: scale(1.035); }
.user-profile__draft-card:hover .user-profile__draft-bg { transform: scale(1.025); }
.user-profile__draft-card.has-secondary:hover .user-profile__draft-bg--primary { opacity: 0; }
.user-profile__draft-card.has-secondary:hover .user-profile__draft-bg--secondary { opacity: 1; transform: scale(1.025); }

.user-profile__draft-bg-fallback {
  z-index: 1;
  background:
    radial-gradient(circle at 18% 18%, var(--primary35), transparent 42%),
    radial-gradient(circle at 82% 22%, var(--themePurple25), transparent 46%),
    linear-gradient(145deg, var(--themeSurface20), var(--themeBackground));
}

.user-profile__draft-shade {
  z-index: 2;
  background:
    linear-gradient(180deg, var(--themeSurface20) 0%, var(--themeSurface20) 32%, var(--themeSurface85) 100%),
    linear-gradient(90deg, var(--themeSurface45), var(--themeSurface0) 72%);
}

.user-profile__draft-topbar {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 6;
  padding: 14px;
}

.user-profile__draft-media-count {
  flex: 0 0 auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.user-profile__draft-content {
  position: absolute;
  inset-inline-start: 0;
  inset-block-end: 0;
  z-index: 6;
  padding: clamp(18px, 4vw, 26px);
}

.user-profile__draft-title {
  width: 100%;
  line-height: 1.02 !important;
  letter-spacing: -0.035em;
  text-wrap: balance;
  text-shadow: 0 4px 20px var(--invertText70);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.user-profile__draft-meta {
  opacity: 0.86;
  text-shadow: 0 4px 20px var(--invertText45);
}
</style>
