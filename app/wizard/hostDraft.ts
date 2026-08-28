import type {
  PromptDraftCollection,
  PromptDraftRecord,
  PromptDraftState,
} from "../modules/promptDraft.types";
import { clonePromptDraftState } from "../utils/promptDraftState";

const DRAFT_COLLECTION_STORAGE_KEY = "prompt-draft:create-editor:drafts:v1";

function readCollection(): PromptDraftCollection | null {
  if (!import.meta.client) return null;

  const raw = localStorage.getItem(DRAFT_COLLECTION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PromptDraftCollection;
    return parsed.version === 1 && Array.isArray(parsed.drafts) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadActiveDraftForWizard(): PromptDraftState | null {
  const collection = readCollection();
  if (!collection) return null;

  const active =
    collection.drafts.find((draft) => draft.id === collection.activeDraftId) ||
    collection.drafts[0];

  return active ? clonePromptDraftState(active) : null;
}

export function commitWizardFinalDraft(finalDraft: PromptDraftState) {
  if (!import.meta.client) return false;

  const collection = readCollection();
  if (!collection) return false;

  const activeIndex = collection.drafts.findIndex(
    (draft) => draft.id === collection.activeDraftId,
  );
  if (activeIndex < 0) return false;

  const current = collection.drafts[activeIndex] as PromptDraftRecord;
  const updatedAt = new Date().toISOString();
  const next: PromptDraftRecord = {
    ...current,
    ...clonePromptDraftState(finalDraft),
    id: current.id,
    title: current.title,
    createdAt: current.createdAt,
    updatedAt,
  };

  const drafts = [...collection.drafts];
  drafts.splice(activeIndex, 1, next);

  localStorage.setItem(
    DRAFT_COLLECTION_STORAGE_KEY,
    JSON.stringify({ ...collection, drafts }),
  );

  return true;
}
