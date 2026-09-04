<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import type {
  PromptDraftCollection,
  PromptDraftRecord,
  PromptDraftState,
} from "~/modules/promptDraft.types";
import type { UpsertPromptDraftInput } from "~/types/draftSyncApi";

const DRAFT_COLLECTION_STORAGE_KEY = "prompt-draft:create-editor:drafts:v1";
const DRAFT_SYNC_STORAGE_KEY = "prompt-draft:create-editor:cloud-sync:v1";
const AUTOSYNC_INTERVAL_MS = 120_000;
const STATUS_POLL_INTERVAL_MS = 1_000;
const LOCAL_SAVE_SETTLE_MS = 450;

type DraftSyncMetadataEntry = {
  fingerprint: string;
  syncedAt: string;
  revision: number;
};

type DraftSyncMetadata = {
  version: 1;
  drafts: Record<string, DraftSyncMetadataEntry>;
};

type DraftCloudStatus = "idle" | "dirty" | "syncing" | "synced" | "error";

const { t } = useI18n();
const { upsertPromptDraft } = usePromptDraftApi();

const teleportTarget = shallowRef<HTMLElement | null>(null);
const activeStatus = ref<DraftCloudStatus>("idle");
const activeDraftId = ref<string | null>(null);
const failedFingerprints = new Map<string, string>();
const inFlightDraftIds = new Set<string>();

let targetObserver: MutationObserver | null = null;
let autosyncTimer: ReturnType<typeof setInterval> | null = null;
let statusTimer: ReturnType<typeof setInterval> | null = null;

const buttonLabel = computed(() => {
  if (activeStatus.value === "syncing") return t("create.draft.cloud.syncing");
  if (activeStatus.value === "synced") return t("create.draft.cloud.synced");
  if (activeStatus.value === "error") return t("create.draft.cloud.failed");
  if (activeStatus.value === "dirty") return t("create.draft.cloud.dirty");
  return t("create.draft.cloud.save");
});

const buttonIcon = computed(() => {
  if (activeStatus.value === "syncing") return "sync";
  if (activeStatus.value === "synced") return "cloud_done";
  if (activeStatus.value === "error") return "cloud_off";
  return "cloud_upload";
});

const buttonColor = computed(() => {
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

function readSyncMetadata(): DraftSyncMetadata {
  if (!import.meta.client) {
    return { version: 1, drafts: {} };
  }

  const raw = localStorage.getItem(DRAFT_SYNC_STORAGE_KEY);
  if (!raw) return { version: 1, drafts: {} };

  try {
    const parsed = JSON.parse(raw) as Partial<DraftSyncMetadata>;

    if (parsed.version !== 1 || !isPlainRecord(parsed.drafts)) {
      return { version: 1, drafts: {} };
    }

    return {
      version: 1,
      drafts: parsed.drafts as Record<string, DraftSyncMetadataEntry>,
    };
  } catch {
    return { version: 1, drafts: {} };
  }
}

function writeSyncMetadata(metadata: DraftSyncMetadata) {
  if (!import.meta.client) return;
  localStorage.setItem(DRAFT_SYNC_STORAGE_KEY, JSON.stringify(metadata));
}

function getDraftState(draft: PromptDraftRecord): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: draft.selectedModuleKeys,
    moduleValues: draft.moduleValues,
    modulePanelStates: draft.modulePanelStates,
    promptSettings: draft.promptSettings,
    outputFormat: draft.outputFormat,
  };
}

function createDraftFingerprint(draft: PromptDraftRecord) {
  const serialized = JSON.stringify({
    id: draft.id,
    title: draft.title,
    state: getDraftState(draft),
  });

  let hash = 2166136261;

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function toUpsertInput(draft: PromptDraftRecord): UpsertPromptDraftInput {
  return {
    title: draft.title,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    snapshot: getDraftState(draft),
  };
}

function isDraftSynced(draft: PromptDraftRecord) {
  const fingerprint = createDraftFingerprint(draft);
  const metadata = readSyncMetadata();
  return metadata.drafts[draft.id]?.fingerprint === fingerprint;
}

function refreshActiveStatus() {
  const draft = getActiveDraft();

  activeDraftId.value = draft?.id || null;

  if (!draft) {
    activeStatus.value = "idle";
    return;
  }

  const fingerprint = createDraftFingerprint(draft);

  if (inFlightDraftIds.has(draft.id)) {
    activeStatus.value = "syncing";
    return;
  }

  if (failedFingerprints.get(draft.id) === fingerprint) {
    activeStatus.value = "error";
    return;
  }

  activeStatus.value = isDraftSynced(draft) ? "synced" : "dirty";
}

async function syncDraft(draft: PromptDraftRecord, force = false) {
  if (inFlightDraftIds.has(draft.id)) return true;

  const fingerprint = createDraftFingerprint(draft);

  if (!force && isDraftSynced(draft)) {
    refreshActiveStatus();
    return true;
  }

  inFlightDraftIds.add(draft.id);
  refreshActiveStatus();

  try {
    const response = await upsertPromptDraft(draft.id, toUpsertInput(draft));
    const metadata = readSyncMetadata();

    metadata.drafts[draft.id] = {
      fingerprint,
      syncedAt: response.draft.serverUpdatedAt,
      revision: response.draft.revision,
    };

    writeSyncMetadata(metadata);
    failedFingerprints.delete(draft.id);
    return true;
  } catch (error) {
    console.error("[Prompt Draft] cloud draft sync failed", error);
    failedFingerprints.set(draft.id, fingerprint);
    return false;
  } finally {
    inFlightDraftIds.delete(draft.id);
    refreshActiveStatus();
  }
}

async function syncActiveDraft(force = true) {
  const draft = getActiveDraft();
  if (!draft) return;
  await syncDraft(draft, force);
}

async function syncDirtyDrafts() {
  const collection = readDraftCollection();
  if (!collection) return;

  for (const draft of collection.drafts) {
    if (isDraftSynced(draft)) continue;

    const succeeded = await syncDraft(draft, false);

    if (!succeeded) {
      break;
    }
  }
}

async function handleManualSync() {
  if (!import.meta.client || activeStatus.value === "syncing") return;

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) activeElement.blur();

  activeStatus.value = "syncing";

  await new Promise((resolve) => {
    window.setTimeout(resolve, LOCAL_SAVE_SETTLE_MS);
  });

  await syncActiveDraft(true);
}

function resolveTeleportTarget() {
  if (!import.meta.client || teleportTarget.value) return;

  const titleElement = document.querySelector<HTMLElement>(
    ".create-page__draft-title",
  );

  if (titleElement?.parentElement) {
    teleportTarget.value = titleElement.parentElement;
    targetObserver?.disconnect();
    targetObserver = null;
  }
}

onMounted(async () => {
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
