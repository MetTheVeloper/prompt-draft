<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import DraftPreviewManagerModal from "~/components/modals/DraftPreviewManagerModal.vue";
import type {
  PromptDraftCollection,
  PromptDraftRecord,
} from "~/modules/promptDraft.types";
import type {
  SyncedPromptDraftRecord,
  UpsertPromptDraftInput,
} from "~/types/draftSyncApi";
import type {
  UserDraftPreviewImage,
  UserDraftVisibility,
  UserProfileDraftSummary,
} from "~/types/userProfileApi";
import { downloadCloudDraftJson } from "~/utils/cloudDraftActions";
import {
  createDraftFingerprint,
  getDraftState,
  getDraftSyncEntry,
  isDraftSyncedForUser,
  removeDraftSyncEntry,
  setDraftSyncEntry,
} from "~/utils/draftCloudSync";

const DRAFT_COLLECTION_STORAGE_KEY = "prompt-draft:create-editor:drafts:v1";
const CREATE_DRAFT_COLLECTION_REFRESH_EVENT =
  "prompt-draft:create-editor:collection-refresh";
const AUTOSYNC_INTERVAL_MS = 120_000;
const STATUS_POLL_INTERVAL_MS = 1_000;
const LOCAL_SAVE_SETTLE_MS = 450;

type DraftCloudStatus = "idle" | "dirty" | "syncing" | "synced" | "error";

const route = useRoute();
const { t, locale } = useI18n();
const auth = useAuth();
const promptApi = usePromptDraftApi();
const profileApi = useUserProfileApi();
const modal = useModal();
const { $menu } = useNuxtApp();

const teleportTarget = shallowRef<HTMLElement | null>(null);
const backgroundTarget = shallowRef<HTMLElement | null>(null);
const legacyActionsTarget = shallowRef<HTMLElement | null>(null);
const activeStatus = ref<DraftCloudStatus>("idle");
const activeDraftId = ref<string | null>(null);
const activeCloudDraft = ref<UserProfileDraftSummary | null>(null);
const metadataLoading = ref(false);
const visibilityLoading = ref(false);
const actionLoading = ref(false);
const failedFingerprints = new Map<string, string>();
const inFlightDraftIds = new Set<string>();

let targetObserver: MutationObserver | null = null;
let autosyncTimer: ReturnType<typeof setInterval> | null = null;
let statusTimer: ReturnType<typeof setInterval> | null = null;
let metadataRequestVersion = 0;
let lastMetadataDraftId: string | null = null;

const currentUserId = computed(() => auth.user.value?.id ?? null);

const requestedDraftId = computed(() => {
  const value = typeof route.query.draft === "string" ? route.query.draft.trim() : "";
  return value && value.length <= 200 ? value : null;
});

const copy = computed(() =>
  locale.value === "fa"
    ? {
        public: "عمومی",
        private: "خصوصی",
        managePreviews: "مدیریت پیش‌نمایش‌ها",
        share: "اشتراک‌گذاری",
        download: "دانلود",
        delete: "حذف درفت",
        deleteTitle: "حذف درفت",
        deleteDescription: "این درفت از فضای ابری و فهرست محلی شما حذف می‌شود.",
        cancel: "لغو",
        visibilityError: "تغییر وضعیت انتشار درفت انجام نشد.",
        actionError: "عملیات درفت انجام نشد.",
      }
    : {
        public: "Public",
        private: "Private",
        managePreviews: "Manage previews",
        share: "Share",
        download: "Download",
        delete: "Delete draft",
        deleteTitle: "Delete draft",
        deleteDescription: "This draft will be removed from cloud storage and your local draft list.",
        cancel: "Cancel",
        visibilityError: "Draft visibility could not be updated.",
        actionError: "Draft action could not be completed.",
      },
);

const buttonLabel = computed(() => {
  if (!auth.isLoggedIn.value) return t("auth.header.login");
  if (activeStatus.value === "syncing") return t("create.draft.cloud.syncing");
  if (activeStatus.value === "synced") return t("create.draft.cloud.synced");
  if (activeStatus.value === "error") return t("create.draft.cloud.failed");
  if (activeStatus.value === "dirty") return t("create.draft.cloud.dirty");
  return t("create.draft.cloud.save");
});

const buttonIcon = computed(() => {
  if (!auth.isLoggedIn.value) return "login";
  if (activeStatus.value === "syncing") return "sync";
  if (activeStatus.value === "synced") return "cloud_done";
  if (activeStatus.value === "error") return "cloud_off";
  return "cloud_upload";
});

const buttonColor = computed(() => {
  if (!auth.isLoggedIn.value) return "blue";
  if (activeStatus.value === "synced") return "green";
  if (activeStatus.value === "error") return "red";
  if (activeStatus.value === "syncing") return "orange";
  return "blue";
});

const isPublic = computed(() => activeCloudDraft.value?.visibility === "public");
const visibilityLabel = computed(() => (isPublic.value ? copy.value.public : copy.value.private));
const canManageCloudMetadata = computed(() => {
  return Boolean(
    auth.isLoggedIn.value &&
      activeDraftId.value &&
      activeCloudDraft.value?.id === activeDraftId.value,
  );
});
const primaryPreview = computed(() => activeCloudDraft.value?.images?.[0] ?? null);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPromptDraftRecord(value: unknown): value is PromptDraftRecord {
  if (!isPlainRecord(value)) return false;

  return (
    value.version === 1 &&
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.title === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.selectedModuleKeys) &&
    isPlainRecord(value.moduleValues) &&
    isPlainRecord(value.modulePanelStates) &&
    isPlainRecord(value.promptSettings) &&
    ["modular", "natural", "json"].includes(String(value.outputFormat))
  );
}

function readDraftCollection(): PromptDraftCollection | null {
  if (!import.meta.client) return null;

  const raw = localStorage.getItem(DRAFT_COLLECTION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PromptDraftCollection>;

    if (parsed.version !== 1 || !Array.isArray(parsed.drafts)) return null;

    const drafts = parsed.drafts.filter(isPromptDraftRecord);

    return {
      version: 1,
      activeDraftId:
        typeof parsed.activeDraftId === "string" ? parsed.activeDraftId : null,
      drafts,
    };
  } catch {
    return null;
  }
}

function getActiveDraft(collection = readDraftCollection()) {
  if (!collection) return null;

  return (
    collection.drafts.find((draft) => draft.id === collection.activeDraftId) ||
    collection.drafts[0] ||
    null
  );
}

function toLocalDraft(remote: SyncedPromptDraftRecord): PromptDraftRecord {
  return {
    ...remote.snapshot,
    version: 1,
    id: remote.id,
    title: remote.title,
    createdAt: remote.createdAt,
    updatedAt: remote.updatedAt,
  };
}

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function readAllCloudDrafts() {
  const drafts: SyncedPromptDraftRecord[] = [];
  let cursor: string | undefined;

  do {
    const response = await promptApi.listPromptDrafts({
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });

    drafts.push(...response.drafts);
    cursor = response.pageInfo.nextCursor ?? undefined;

    if (!response.pageInfo.hasMore) break;
  } while (cursor);

  return drafts;
}

async function restoreCloudDrafts() {
  if (!import.meta.client) return;

  const userId = currentUserId.value;
  if (!userId) return;

  let remoteDrafts: SyncedPromptDraftRecord[];

  try {
    remoteDrafts = await readAllCloudDrafts();
  } catch (error) {
    console.warn("[Prompt Draft] cloud draft restore failed; keeping local drafts", error);
    return;
  }

  const collection = readDraftCollection() ?? {
    version: 1 as const,
    activeDraftId: null,
    drafts: [],
  };
  const remoteIds = new Set(remoteDrafts.map((draft) => draft.id));
  const drafts = collection.drafts.filter((draft) => {
    const wasCloudTracked = Boolean(getDraftSyncEntry(userId, draft.id));
    const shouldRemove = wasCloudTracked && !remoteIds.has(draft.id);

    if (shouldRemove) {
      removeDraftSyncEntry(userId, draft.id);
      return false;
    }

    return true;
  });
  const newRemoteDrafts: PromptDraftRecord[] = [];

  for (const remote of remoteDrafts) {
    const remoteDraft = toLocalDraft(remote);
    const existingIndex = drafts.findIndex((draft) => draft.id === remote.id);

    if (existingIndex < 0) {
      newRemoteDrafts.push(remoteDraft);
    } else {
      const localDraft = drafts[existingIndex];

      if (timestamp(remoteDraft.updatedAt) >= timestamp(localDraft.updatedAt)) {
        drafts.splice(existingIndex, 1, remoteDraft);
      }
    }

    setDraftSyncEntry(userId, remote.id, {
      fingerprint: createDraftFingerprint(remoteDraft),
      syncedAt: remote.serverUpdatedAt,
      revision: remote.revision,
    });
  }

  const mergedDrafts = [...newRemoteDrafts, ...drafts];
  const requestedId = requestedDraftId.value;
  const activeDraftId =
    requestedId && mergedDrafts.some((draft) => draft.id === requestedId)
      ? requestedId
      : collection.activeDraftId &&
          mergedDrafts.some((draft) => draft.id === collection.activeDraftId)
        ? collection.activeDraftId
        : mergedDrafts[0]?.id ?? null;

  const mergedCollection: PromptDraftCollection = {
    version: 1,
    activeDraftId,
    drafts: mergedDrafts,
  };

  localStorage.setItem(
    DRAFT_COLLECTION_STORAGE_KEY,
    JSON.stringify(mergedCollection),
  );

  window.dispatchEvent(new Event(CREATE_DRAFT_COLLECTION_REFRESH_EVENT));
}

function toUpsertInput(draft: PromptDraftRecord): UpsertPromptDraftInput {
  return {
    title: draft.title,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    snapshot: getDraftState(draft),
  };
}

function getSyncKey(userId: string, draftId: string) {
  return `${userId}:${draftId}`;
}

async function findCloudDraftSummary(draftId: string) {
  const userId = currentUserId.value;
  if (!userId) return null;

  let cursor: string | undefined;

  do {
    const response = await profileApi.listDrafts(userId, {
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });
    const match = response.drafts.find((draft) => draft.id === draftId);
    if (match) return match;
    cursor = response.pageInfo.nextCursor ?? undefined;
    if (!response.pageInfo.hasMore) break;
  } while (cursor);

  return null;
}

async function refreshActiveCloudMetadata(force = false) {
  const draftId = activeDraftId.value;
  const userId = currentUserId.value;

  if (!draftId || !userId || !getDraftSyncEntry(userId, draftId)) {
    activeCloudDraft.value = null;
    lastMetadataDraftId = draftId;
    return;
  }

  if (!force && lastMetadataDraftId === draftId && activeCloudDraft.value?.id === draftId) {
    return;
  }

  const version = ++metadataRequestVersion;
  metadataLoading.value = true;

  try {
    const draft = await findCloudDraftSummary(draftId);
    if (version !== metadataRequestVersion) return;
    activeCloudDraft.value = draft;
    lastMetadataDraftId = draftId;
  } catch (error) {
    if (version === metadataRequestVersion) {
      console.warn("[Prompt Draft] cloud draft metadata refresh failed", error);
      activeCloudDraft.value = null;
      lastMetadataDraftId = draftId;
    }
  } finally {
    if (version === metadataRequestVersion) metadataLoading.value = false;
  }
}

function refreshActiveStatus() {
  const userId = currentUserId.value;
  const draft = getActiveDraft();
  const previousDraftId = activeDraftId.value;

  activeDraftId.value = draft?.id || null;

  if (previousDraftId !== activeDraftId.value) {
    activeCloudDraft.value = null;
    lastMetadataDraftId = null;
    void refreshActiveCloudMetadata();
  }

  if (!userId || !draft) {
    activeStatus.value = "idle";
    return;
  }

  const fingerprint = createDraftFingerprint(draft);
  const syncKey = getSyncKey(userId, draft.id);

  if (inFlightDraftIds.has(syncKey)) {
    activeStatus.value = "syncing";
    return;
  }

  if (failedFingerprints.get(syncKey) === fingerprint) {
    activeStatus.value = "error";
    return;
  }

  activeStatus.value = isDraftSyncedForUser(userId, draft) ? "synced" : "dirty";
}

async function syncDraft(draft: PromptDraftRecord, force = false) {
  const userId = currentUserId.value;
  if (!userId) return false;

  const syncKey = getSyncKey(userId, draft.id);
  if (inFlightDraftIds.has(syncKey)) return true;

  const fingerprint = createDraftFingerprint(draft);

  if (!force && isDraftSyncedForUser(userId, draft)) {
    refreshActiveStatus();
    return true;
  }

  inFlightDraftIds.add(syncKey);
  refreshActiveStatus();

  try {
    const response = await promptApi.upsertPromptDraft(draft.id, toUpsertInput(draft));

    setDraftSyncEntry(userId, draft.id, {
      fingerprint,
      syncedAt: response.draft.serverUpdatedAt,
      revision: response.draft.revision,
    });

    failedFingerprints.delete(syncKey);
    if (draft.id === activeDraftId.value) {
      lastMetadataDraftId = null;
      await refreshActiveCloudMetadata(true);
    }
    return true;
  } catch (error) {
    console.error("[Prompt Draft] cloud draft sync failed", error);
    failedFingerprints.set(syncKey, fingerprint);
    return false;
  } finally {
    inFlightDraftIds.delete(syncKey);
    refreshActiveStatus();
  }
}

async function syncActiveDraft(force = true) {
  const draft = getActiveDraft();
  if (!draft) return false;
  return await syncDraft(draft, force);
}

async function syncDirtyDrafts() {
  const userId = currentUserId.value;
  if (!userId) return;

  const collection = readDraftCollection();
  if (!collection) return;

  for (const draft of collection.drafts) {
    if (!getDraftSyncEntry(userId, draft.id)) continue;
    if (isDraftSyncedForUser(userId, draft)) continue;

    const succeeded = await syncDraft(draft, false);

    if (!succeeded) break;
  }
}

async function handleManualSync() {
  if (!import.meta.client || activeStatus.value === "syncing") return;

  await auth.initialize();

  if (!auth.isLoggedIn.value) {
    await navigateTo("/login?next=%2Fcreate");
    return;
  }

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) activeElement.blur();

  activeStatus.value = "syncing";

  await new Promise((resolve) => {
    window.setTimeout(resolve, LOCAL_SAVE_SETTLE_MS);
  });

  await syncActiveDraft(true);
}

async function handleVisibilityToggle(nextPublic: boolean) {
  const draft = activeCloudDraft.value;
  if (!draft || visibilityLoading.value) return;

  const visibility: UserDraftVisibility = nextPublic ? "public" : "private";
  visibilityLoading.value = true;

  try {
    const response = await profileApi.setDraftVisibility(draft.id, visibility);
    draft.visibility = response.draft.visibility;
    draft.publishedAt = response.draft.publishedAt;
  } catch (error) {
    console.error("[Prompt Draft] visibility update failed", error);
  } finally {
    visibilityLoading.value = false;
  }
}

function applyDraftImages(images: UserDraftPreviewImage[]) {
  if (!activeCloudDraft.value) return;
  activeCloudDraft.value.images = [...images];
}

function openPreviewManager() {
  const draft = activeCloudDraft.value;
  if (!draft) return;

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
      onImagesChange: applyDraftImages,
    },
    options: { width: 920, maxHeight: "88vh" },
  });
}

function getLocalExportDraft() {
  const draft = getActiveDraft();
  return draft ? JSON.parse(JSON.stringify(draft)) : null;
}

function downloadLocalDraftJson() {
  if (!import.meta.client) return;
  const draft = getLocalExportDraft();
  if (!draft) return;

  const blob = new Blob([`${JSON.stringify(draft, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(draft.title || "draft").replace(/[^a-z0-9._-]+/gi, "-") || "draft"}-draft.json`;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function downloadActiveDraft() {
  const draftId = activeDraftId.value;
  if (!draftId || actionLoading.value) return;
  actionLoading.value = true;

  try {
    if (canManageCloudMetadata.value) {
      const response = await promptApi.getPromptDraft(draftId);
      downloadCloudDraftJson(response.draft);
    } else {
      downloadLocalDraftJson();
    }
  } catch (error) {
    console.error("[Prompt Draft] download failed", error);
  } finally {
    actionLoading.value = false;
  }
}

async function shareActiveDraft() {
  if (!import.meta.client || actionLoading.value) return;
  const draftId = activeDraftId.value;
  if (!draftId) return;
  actionLoading.value = true;

  try {
    const value = canManageCloudMetadata.value
      ? (await promptApi.getPromptDraft(draftId)).draft
      : getLocalExportDraft();
    if (!value) return;

    const json = `${JSON.stringify(value, null, 2)}\n`;
    const title = String((value as { title?: string }).title || "draft");
    const file = new File([json], `${title.replace(/[^a-z0-9._-]+/gi, "-") || "draft"}-draft.json`, {
      type: "application/json",
    });

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({ files: [file], title });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    downloadLocalDraftJson();
  } catch (error) {
    console.error("[Prompt Draft] share failed", error);
  } finally {
    actionLoading.value = false;
  }
}

function removeDraftFromLocalMirror(draftId: string) {
  if (!import.meta.client) return;
  const userId = currentUserId.value;
  if (userId) removeDraftSyncEntry(userId, draftId);

  const collection = readDraftCollection();
  if (!collection) return;

  const drafts = collection.drafts.filter((draft) => draft.id !== draftId);
  const nextActiveId = collection.activeDraftId === draftId
    ? drafts[0]?.id ?? null
    : collection.activeDraftId ?? drafts[0]?.id ?? null;

  localStorage.setItem(
    DRAFT_COLLECTION_STORAGE_KEY,
    JSON.stringify({ version: 1, activeDraftId: nextActiveId, drafts } satisfies PromptDraftCollection),
  );
  window.dispatchEvent(new Event(CREATE_DRAFT_COLLECTION_REFRESH_EVENT));
  activeCloudDraft.value = null;
  lastMetadataDraftId = null;
  refreshActiveStatus();
}

function confirmDeleteActiveDraft() {
  const draft = getActiveDraft();
  if (!draft) return;

  const modalId = modal.open({
    header: {
      icon: "delete",
      title: copy.value.deleteTitle,
      subtitle: draft.title,
      closeButton: true,
      color: "red",
    },
    descriptions: [copy.value.deleteDescription],
    actions: [
      { label: copy.value.cancel, color: "normal", mode: "flat" },
      {
        label: copy.value.delete,
        icon: "delete",
        color: "red",
        mode: "flat",
        close: false,
        disable: () => actionLoading.value,
        handler: async () => {
          if (actionLoading.value) return false;
          actionLoading.value = true;
          try {
            const userId = currentUserId.value;
            if (userId && getDraftSyncEntry(userId, draft.id)) {
              await promptApi.deletePromptDraft(draft.id);
            }
            removeDraftFromLocalMirror(draft.id);
            modal.close(modalId);
          } catch (error) {
            console.error("[Prompt Draft] delete failed", error);
          } finally {
            actionLoading.value = false;
          }
          return false;
        },
      },
    ],
    options: { width: 480 },
  });
}

function openOverflowMenu(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  const anchor = event.currentTarget as HTMLElement;
  $menu.open({
    mode: "dropdown",
    anchor,
    placement: "bottom-end",
    options: {
      minWidth: 220,
      maxWidth: 300,
      closeOnScroll: false,
      zIndex: 2300,
    },
    items: [
      {
        label: copy.value.share,
        icon: "share",
        disabled: () => !activeDraftId.value || actionLoading.value,
        handler: shareActiveDraft,
      },
      {
        label: copy.value.download,
        icon: "download",
        disabled: () => !activeDraftId.value || actionLoading.value,
        handler: downloadActiveDraft,
      },
      {
        label: copy.value.managePreviews,
        icon: "wallpaper",
        disabled: () => !canManageCloudMetadata.value || metadataLoading.value,
        handler: openPreviewManager,
      },
      { type: "divider" },
      {
        label: copy.value.delete,
        icon: "delete",
        color: "red",
        disabled: () => !activeDraftId.value || actionLoading.value,
        handler: confirmDeleteActiveDraft,
      },
    ],
  });
}

function hasDraftMenuLabel(element: HTMLElement) {
  const menuLabel = t("create.draft.menu").trim();

  return Array.from(element.querySelectorAll<HTMLElement>("*")).some((child) => {
    return child.textContent?.trim() === menuLabel;
  });
}

function findCreatePageRoot(titleElement: HTMLElement) {
  let current: HTMLElement | null = titleElement;

  while (current && current !== document.body) {
    if (current.querySelector?.(".create-page__layout")) return current;
    current = current.parentElement;
  }

  return null;
}

function consolidateLegacyActions() {
  if (!teleportTarget.value) return;
  const managerGrid = teleportTarget.value.parentElement;
  if (!managerGrid) return;

  const siblings = Array.from(managerGrid.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  const legacy = siblings.find((child) => child !== teleportTarget.value) ?? null;

  if (legacy) {
    legacy.classList.add("create-page__legacy-actions--consolidated");
    legacyActionsTarget.value = legacy;
  }
}

function resolveTeleportTarget() {
  if (!import.meta.client || teleportTarget.value) return;

  const titleElement = document.querySelector<HTMLElement>(
    ".create-page__draft-title",
  );

  if (!titleElement) return;

  backgroundTarget.value = findCreatePageRoot(titleElement);
  backgroundTarget.value?.classList.add("create-page--has-preview-background");

  let current = titleElement.parentElement;

  while (current && current !== document.body) {
    if (hasDraftMenuLabel(current)) {
      teleportTarget.value = current;
      consolidateLegacyActions();
      targetObserver?.disconnect();
      targetObserver = null;
      return;
    }

    current = current.parentElement;
  }
}

onMounted(async () => {
  await auth.initialize();
  await restoreCloudDrafts();
  await nextTick();
  resolveTeleportTarget();

  if (!teleportTarget.value) {
    targetObserver = new MutationObserver(resolveTeleportTarget);
    targetObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  refreshActiveStatus();
  await refreshActiveCloudMetadata();

  statusTimer = setInterval(refreshActiveStatus, STATUS_POLL_INTERVAL_MS);
  autosyncTimer = setInterval(() => {
    void syncDirtyDrafts();
  }, AUTOSYNC_INTERVAL_MS);
});

onBeforeUnmount(() => {
  targetObserver?.disconnect();
  legacyActionsTarget.value?.classList.remove("create-page__legacy-actions--consolidated");
  backgroundTarget.value?.classList.remove("create-page--has-preview-background");

  if (statusTimer) clearInterval(statusTimer);
  if (autosyncTimer) clearInterval(autosyncTimer);
});
</script>

<template>
  <Teleport v-if="teleportTarget" :to="teleportTarget">
    <el-flex rules="rcc" :gap="8" class="create-draft-cloud-controls">
      <el-switch
        :model-value="isPublic"
        :label="visibilityLabel"
        :size="12"
        :loading="visibilityLoading"
        :disable="!canManageCloudMetadata || metadataLoading"
        @update:model-value="handleVisibilityToggle"
      />
      <el-button
        :label="buttonLabel"
        :icon="buttonIcon"
        :color="buttonColor"
        type="fab"
        mode="flat"
        :size="12"
        :p="8"
        :disable="activeStatus === 'syncing'"
        @click="handleManualSync"
      />
      <el-button
        icon="more_vert"
        color="normal"
        type="fab"
        mode="flat"
        :size="12"
        :p="8"
        :disable="!activeDraftId"
        @click="openOverflowMenu"
      />
    </el-flex>
  </Teleport>

  <Teleport v-if="backgroundTarget && primaryPreview" :to="backgroundTarget">
    <div class="create-draft-background" aria-hidden="true">
      <img :src="primaryPreview.url" alt="" />
      <div class="create-draft-background__gradient" />
    </div>
  </Teleport>
</template>

<style>
.create-page__legacy-actions--consolidated {
  display: none !important;
}

.create-page--has-preview-background > :not(.create-draft-background) {
  position: relative;
  z-index: 1;
}

.create-draft-background {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.create-draft-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.4;
}

.create-draft-background__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    var(--themeBackground0, var(--themeBackground)) 0%,
    var(--themeBackground) 100%
  );
}

@media (max-width: 760px) {
  .create-draft-cloud-controls .switch-root > .fg100 {
    display: none;
  }
}
</style>
