import type {
  PromptDraftCollection,
  PromptDraftRecord,
  PromptDraftState,
} from "../modules/promptDraft.types";
import { clonePromptDraftState } from "../utils/promptDraftState";

const DRAFT_COLLECTION_STORAGE_KEY = "prompt-draft:create-editor:drafts:v1";

function emptyCollection(): PromptDraftCollection {
  return {
    version: 1,
    activeDraftId: null,
    drafts: [],
  };
}

function readCollection(): PromptDraftCollection {
  if (!import.meta.client) return emptyCollection();

  const raw = localStorage.getItem(DRAFT_COLLECTION_STORAGE_KEY);
  if (!raw) return emptyCollection();

  try {
    const parsed = JSON.parse(raw) as PromptDraftCollection;
    return parsed.version === 1 && Array.isArray(parsed.drafts)
      ? parsed
      : emptyCollection();
  } catch {
    return emptyCollection();
  }
}

function createDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Explicit completion handoff only. A Wizard never reads or overwrites the
 * Create Active Draft. When the user asks to continue in Create, the finished
 * Wizard result becomes a brand-new Create Draft and is selected there.
 */
export function addWizardDraftToCreate(
  finalDraft: PromptDraftState,
  title = "Wizard Prompt",
) {
  if (!import.meta.client) return null;

  const collection = readCollection();
  const now = new Date().toISOString();
  const id = createDraftId();
  const record: PromptDraftRecord = {
    ...clonePromptDraftState(finalDraft),
    id,
    title: title.trim() || "Wizard Prompt",
    createdAt: now,
    updatedAt: now,
  };

  const next: PromptDraftCollection = {
    version: 1,
    activeDraftId: id,
    drafts: [record, ...collection.drafts],
  };

  localStorage.setItem(DRAFT_COLLECTION_STORAGE_KEY, JSON.stringify(next));
  return id;
}
