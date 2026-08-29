import type { PromptDraftState } from "../modules/promptDraft.types";
import { clonePromptDraftState } from "../utils/promptDraftState";
import {
  PROMPT_TEMPLATE_SCHEMA_VERSION,
  type PromptTemplate,
  type PromptTemplateCollection,
  type PromptTemplateSource,
  type PromptTemplateStorage,
} from "./types";
import { normalizePromptTemplate } from "./validation";

export const PROMPT_TEMPLATE_STORAGE_KEY = "prompt-draft:prompt-templates:v1";

function resolveStorage(storage?: PromptTemplateStorage | null) {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

function createTemplateId() {
  return `template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadUserPromptTemplates(
  storage?: PromptTemplateStorage | null,
): PromptTemplate[] {
  const target = resolveStorage(storage);
  if (!target) return [];

  const raw = target.getItem(PROMPT_TEMPLATE_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<PromptTemplateCollection>;
    if (parsed.version !== 1 || !Array.isArray(parsed.templates)) return [];

    return parsed.templates
      .map((template) => normalizePromptTemplate(template, "user"))
      .filter((template): template is PromptTemplate => Boolean(template));
  } catch {
    return [];
  }
}

export function persistUserPromptTemplates(
  templates: readonly PromptTemplate[],
  storage?: PromptTemplateStorage | null,
) {
  const target = resolveStorage(storage);
  if (!target) return false;

  const normalized = templates
    .map((template) => normalizePromptTemplate(template, "user"))
    .filter((template): template is PromptTemplate => Boolean(template));

  const collection: PromptTemplateCollection = {
    version: 1,
    templates: normalized,
  };

  target.setItem(PROMPT_TEMPLATE_STORAGE_KEY, JSON.stringify(collection));
  return true;
}

export function createUserPromptTemplateFromDraft(
  draft: PromptDraftState,
  options: {
    title: string;
    description?: string;
    source?: PromptTemplateSource;
    id?: string;
    now?: string;
  },
): PromptTemplate {
  const title = options.title.trim();
  if (!title) throw new Error("Prompt template title is required");

  const now = options.now || new Date().toISOString();
  const template: PromptTemplate = {
    schemaVersion: PROMPT_TEMPLATE_SCHEMA_VERSION,
    id: options.id?.trim() || createTemplateId(),
    title,
    ...(options.description?.trim()
      ? { description: options.description.trim() }
      : {}),
    origin: "user",
    ...(options.source ? { source: options.source } : {}),
    draft: clonePromptDraftState(draft),
    createdAt: now,
    updatedAt: now,
  };

  const normalized = normalizePromptTemplate(template, "user");
  if (!normalized) throw new Error("Cannot create invalid user prompt template");
  return normalized;
}

export function saveUserPromptTemplate(
  template: PromptTemplate,
  storage?: PromptTemplateStorage | null,
) {
  const normalized = normalizePromptTemplate(template, "user");
  if (!normalized) throw new Error("Cannot save invalid user prompt template");

  const templates = loadUserPromptTemplates(storage);
  const existingIndex = templates.findIndex((item) => item.id === normalized.id);

  if (existingIndex >= 0) {
    templates.splice(existingIndex, 1, normalized);
  } else {
    templates.unshift(normalized);
  }

  persistUserPromptTemplates(templates, storage);
  return normalized;
}

export function deleteUserPromptTemplate(
  templateId: string,
  storage?: PromptTemplateStorage | null,
) {
  const id = templateId.trim();
  if (!id) return false;

  const templates = loadUserPromptTemplates(storage);
  const next = templates.filter((template) => template.id !== id);
  if (next.length === templates.length) return false;

  return persistUserPromptTemplates(next, storage);
}
