<script setup lang="ts">
import { onMounted } from "vue";
import type {
  PromptDraftCollection,
  PromptDraftRecord,
} from "~/modules/promptDraft.types";
import type { SyncedPromptDraftRecord } from "~/types/draftSyncApi";
import {
  createDraftFingerprint,
  setDraftSyncEntry,
} from "~/utils/draftCloudSync";

const DRAFT_COLLECTION_STORAGE_KEY = "prompt-draft:create-editor:drafts:v1";
const CREATE_DRAFT_COLLECTION_REFRESH_EVENT =
  "prompt-draft:create-editor:collection-refresh";

const auth = useAuth();
const { listPromptDrafts } = usePromptDraftApi();

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readLocalCollection(): PromptDraftCollection {
  if (!import.meta.client) {
    return { version: 1, activeDraftId: null, drafts: [] };
  }

  const raw = localStorage.getItem(DRAFT_COLLECTION_STORAGE_KEY);
  if (!raw) return { version: 1, activeDraftId: null, drafts: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<PromptDraftCollection>;

    if (parsed.version !== 1 || !Array.isArray(parsed.drafts)) {
      return { version: 1, activeDraftId: null, drafts: [] };
    }

    return {
      version: 1,
      activeDraftId:
        typeof parsed.activeDraftId === "string" ? parsed.activeDraftId : null,
      drafts: parsed.drafts.filter((draft): draft is PromptDraftRecord => {
        return (
          isPlainRecord(draft) &&
          draft.version === 1 &&
          typeof draft.id === "string" &&
          typeof draft.title === "string" &&
          typeof draft.createdAt === "string" &&
          typeof draft.updatedAt === "string"
        );
      }),
    };
  } catch {
    return { version: 1, activeDraftId: null, drafts: [] };
  }
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
    const response = await listPromptDrafts({
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

  await auth.initialize();

  const userId = auth.user.value?.id;
  if (!userId) return;

  let remoteDrafts: SyncedPromptDraftRecord[];

  try {
    remoteDrafts = await readAllCloudDrafts();
  } catch (error) {
    console.warn("[Prompt Draft] cloud draft restore failed; keeping local drafts", error);
    return;
  }

  if (!remoteDrafts.length) return;

  const collection = readLocalCollection();
  const drafts = [...collection.drafts];

  for (const remote of remoteDrafts) {
    const remoteDraft = toLocalDraft(remote);
    const existingIndex = drafts.findIndex((draft) => draft.id === remote.id);

    if (existingIndex < 0) {
      drafts.push(remoteDraft);
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

  const activeDraftId =
    collection.activeDraftId && drafts.some((draft) => draft.id === collection.activeDraftId)
      ? collection.activeDraftId
      : drafts[0]?.id ?? null;

  const mergedCollection: PromptDraftCollection = {
    version: 1,
    activeDraftId,
    drafts,
  };

  localStorage.setItem(
    DRAFT_COLLECTION_STORAGE_KEY,
    JSON.stringify(mergedCollection),
  );

  window.dispatchEvent(new Event(CREATE_DRAFT_COLLECTION_REFRESH_EVENT));
}

onMounted(() => {
  void restoreCloudDrafts();
});
</script>

<template></template>
