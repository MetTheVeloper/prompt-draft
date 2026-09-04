<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import type {
  PromptDraftCollection,
  PromptDraftRecord,
} from "~/modules/promptDraft.types";
import type { UpsertPromptDraftInput } from "~/types/draftSyncApi";
import {
  createDraftFingerprint,
  getDraftState,
  getDraftSyncEntry,
  isDraftSyncedForUser,
  setDraftSyncEntry,
} from "~/utils/draftCloudSync";

const DRAFT_COLLECTION_STORAGE_KEY = "prompt-draft:create-editor:drafts:v1";
const AUTOSYNC_INTERVAL_MS = 120_000;
const STATUS_POLL_INTERVAL_MS = 1_000;
const LOCAL_SAVE_SETTLE_MS = 450;

type DraftCloudStatus = "idle" | "dirty" | "syncing" | "synced" | "error";

const { t } = useI18n();
const auth = useAuth();
const { upsertPromptDraft } = usePromptDraftApi();

const teleportTarget = shallowRef<HTMLElement | null>(null);
const activeStatus = ref<DraftCloudStatus>("idle");
const activeDraftId = ref<string | null>(null);
const failedFingerprints = new Map<string, string>();
const inFlightDraftIds = new Set<string>();

let targetObserver: MutationObserver | null = null;
let autosyncTimer: ReturnType<typeof setInterval> | null = null;
let statusTimer: ReturnType<typeof setInterval> | null = null;

const currentUserId = computed(() => auth.user.value?.id ?? null);

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

function refreshActiveStatus() {
  const userId = currentUserId.value;
  const draft = getActiveDraft();

  activeDraftId.value = draft?.id || null;

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
    const response = await upsertPromptDraft(draft.id, toUpsertInput(draft));

    setDraftSyncEntry(userId, draft.id, {
      fingerprint,
      syncedAt: response.draft.serverUpdatedAt,
      revision: response.draft.revision,
    });

    failedFingerprints.delete(syncKey);
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
  if (!draft) return;
  await syncDraft(draft, force);
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

    if (!succeeded) {
      break;
    }
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

function hasDraftMenuLabel(element: HTMLElement) {
  const menuLabel = t("create.draft.menu").trim();

  return Array.from(element.querySelectorAll<HTMLElement>("*")).some((child) => {
    return child.textContent?.trim() === menuLabel;
  });
}

function resolveTeleportTarget() {
  if (!import.meta.client || teleportTarget.value) return;

  const titleElement = document.querySelector<HTMLElement>(
    ".create-page__draft-title",
  );

  if (!titleElement) return;

  let current = titleElement.parentElement;

  while (current && current !== document.body) {
    if (hasDraftMenuLabel(current)) {
      teleportTarget.value = current;
      targetObserver?.disconnect();
      targetObserver = null;
      return;
    }

    current = current.parentElement;
  }
}

onMounted(async () => {
  await auth.initialize();
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

  statusTimer = setInterval(refreshActiveStatus, STATUS_POLL_INTERVAL_MS);
  autosyncTimer = setInterval(() => {
    void syncDirtyDrafts();
  }, AUTOSYNC_INTERVAL_MS);
});

onBeforeUnmount(() => {
  targetObserver?.disconnect();

  if (statusTimer) clearInterval(statusTimer);
  if (autosyncTimer) clearInterval(autosyncTimer);
});
</script>

<template>
  <Teleport v-if="teleportTarget" :to="teleportTarget">
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
  </Teleport>
</template>
