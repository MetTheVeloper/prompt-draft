import type {
  PromptDraftCollection,
  PromptDraftRecord,
  PromptDraftState,
} from "../modules/promptDraft.types";
import { clonePromptDraftState } from "../utils/promptDraftState";
import { instantiatePromptTemplate } from "./instantiate";
import type { PromptTemplate, PromptTemplateStorage } from "./types";

export const CREATE_DRAFT_COLLECTION_STORAGE_KEY =
  "prompt-draft:create-editor:drafts:v1";

function resolveStorage(storage?: PromptTemplateStorage | null) {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

function emptyCollection(): PromptDraftCollection {
  return {
    version: 1,
    activeDraftId: null,
    drafts: [],
  };
}

export function readCreateDraftCollection(
  storage?: PromptTemplateStorage | null,
): PromptDraftCollection {
  const target = resolveStorage(storage);
  if (!target) return emptyCollection();

  const raw = target.getItem(CREATE_DRAFT_COLLECTION_STORAGE_KEY);
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

function recordToDraftState(record: PromptDraftRecord): PromptDraftState {
  return clonePromptDraftState({
    version: 1,
    selectedModuleKeys: record.selectedModuleKeys,
    moduleValues: record.moduleValues,
    modulePanelStates: record.modulePanelStates,
    promptSettings: record.promptSettings,
    outputFormat: record.outputFormat,
  });
}

export function readActiveCreateDraftForTemplate(
  storage?: PromptTemplateStorage | null,
) {
  const collection = readCreateDraftCollection(storage);
  const record =
    collection.drafts.find((draft) => draft.id === collection.activeDraftId) ||
    collection.drafts[0] ||
    null;

  if (!record) return null;

  return {
    id: record.id,
    title: record.title,
    draft: recordToDraftState(record),
  };
}

/**
 * Template application always creates a brand-new Create Draft. It never
 * patches or overwrites the current Active Draft.
 */
export function addPromptTemplateToCreate(
  template: PromptTemplate,
  storage?: PromptTemplateStorage | null,
) {
  const target = resolveStorage(storage);
  if (!target) return null;

  const collection = readCreateDraftCollection(target);
  const instance = instantiatePromptTemplate(template);
  const now = new Date().toISOString();
  const id = createDraftId();
  const record: PromptDraftRecord = {
    ...instance.draft,
    id,
    title: instance.title.trim() || "Template Draft",
    createdAt: now,
    updatedAt: now,
  };

  const next: PromptDraftCollection = {
    version: 1,
    activeDraftId: id,
    drafts: [record, ...collection.drafts],
  };

  target.setItem(CREATE_DRAFT_COLLECTION_STORAGE_KEY, JSON.stringify(next));

  return record;
}
