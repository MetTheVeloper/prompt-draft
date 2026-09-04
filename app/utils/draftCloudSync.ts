import type {
  PromptDraftRecord,
  PromptDraftState,
} from "~/modules/promptDraft.types";

const LEGACY_DRAFT_SYNC_STORAGE_KEY = "prompt-draft:create-editor:cloud-sync:v1";
export const DRAFT_SYNC_STORAGE_KEY = "prompt-draft:create-editor:cloud-sync:v2";

export type DraftSyncMetadataEntry = {
  fingerprint: string;
  syncedAt: string;
  revision: number;
};

type DraftSyncUserMetadata = {
  drafts: Record<string, DraftSyncMetadataEntry>;
};

export type DraftSyncMetadata = {
  version: 2;
  users: Record<string, DraftSyncUserMetadata>;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function createEmptyDraftSyncMetadata(): DraftSyncMetadata {
  return {
    version: 2,
    users: {},
  };
}

export function readDraftSyncMetadata(): DraftSyncMetadata {
  if (!import.meta.client) return createEmptyDraftSyncMetadata();

  const raw = localStorage.getItem(DRAFT_SYNC_STORAGE_KEY);
  if (!raw) return createEmptyDraftSyncMetadata();

  try {
    const parsed = JSON.parse(raw) as Partial<DraftSyncMetadata>;

    if (parsed.version !== 2 || !isPlainRecord(parsed.users)) {
      return createEmptyDraftSyncMetadata();
    }

    return parsed as DraftSyncMetadata;
  } catch {
    return createEmptyDraftSyncMetadata();
  }
}

export function writeDraftSyncMetadata(metadata: DraftSyncMetadata) {
  if (!import.meta.client) return;

  localStorage.setItem(DRAFT_SYNC_STORAGE_KEY, JSON.stringify(metadata));
  localStorage.removeItem(LEGACY_DRAFT_SYNC_STORAGE_KEY);
}

export function getDraftSyncEntry(userId: string, draftId: string) {
  if (!userId || !draftId) return null;

  const metadata = readDraftSyncMetadata();
  return metadata.users[userId]?.drafts?.[draftId] ?? null;
}

export function setDraftSyncEntry(
  userId: string,
  draftId: string,
  entry: DraftSyncMetadataEntry,
) {
  if (!userId || !draftId) return;

  const metadata = readDraftSyncMetadata();
  const userMetadata = metadata.users[userId] ?? { drafts: {} };

  userMetadata.drafts[draftId] = entry;
  metadata.users[userId] = userMetadata;

  writeDraftSyncMetadata(metadata);
}

export function getDraftState(draft: PromptDraftRecord): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: draft.selectedModuleKeys,
    moduleValues: draft.moduleValues,
    modulePanelStates: draft.modulePanelStates,
    promptSettings: draft.promptSettings,
    outputFormat: draft.outputFormat,
  };
}

export function createDraftFingerprint(draft: PromptDraftRecord) {
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

export function isDraftSyncedForUser(userId: string, draft: PromptDraftRecord) {
  const entry = getDraftSyncEntry(userId, draft.id);
  return entry?.fingerprint === createDraftFingerprint(draft);
}
