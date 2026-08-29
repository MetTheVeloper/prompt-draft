import { promptModules } from "../modules/registry";
import type { PromptDraftState } from "../modules/promptDraft.types";
import { createDefaultPromptSettings } from "../utils/compilePromptCore";
import { normalizePromptDraftState } from "../utils/promptDraftState";
import {
  PROMPT_TEMPLATE_SCHEMA_VERSION,
  type PromptTemplate,
  type PromptTemplateOrigin,
  type PromptTemplateSource,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSource(value: unknown): PromptTemplateSource | undefined {
  if (!isRecord(value)) return undefined;
  if (value.kind !== "wizard" && value.kind !== "create") return undefined;

  const wizardId = cleanText(value.wizardId);
  const wizardVersion =
    typeof value.wizardVersion === "number" && Number.isInteger(value.wizardVersion)
      ? value.wizardVersion
      : undefined;

  return {
    kind: value.kind,
    ...(wizardId ? { wizardId } : {}),
    ...(wizardVersion !== undefined ? { wizardVersion } : {}),
  };
}

function normalizeDraft(value: unknown): PromptDraftState | null {
  if (!isRecord(value) || value.version !== 1) return null;

  return normalizePromptDraftState(value, {
    validModuleKeys: promptModules.map((module) => module.key),
    defaultPromptSettings: createDefaultPromptSettings(),
  });
}

export function normalizePromptTemplate(
  value: unknown,
  expectedOrigin?: PromptTemplateOrigin,
): PromptTemplate | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== PROMPT_TEMPLATE_SCHEMA_VERSION) return null;

  const id = cleanText(value.id);
  const title = cleanText(value.title);
  const description = cleanText(value.description);
  const origin = value.origin;
  const draft = normalizeDraft(value.draft);

  if (!id || !title || !draft) return null;
  if (origin !== "builtin" && origin !== "user") return null;
  if (expectedOrigin && origin !== expectedOrigin) return null;

  const source = normalizeSource(value.source);
  const createdAt = cleanText(value.createdAt);
  const updatedAt = cleanText(value.updatedAt);

  return {
    schemaVersion: PROMPT_TEMPLATE_SCHEMA_VERSION,
    id,
    title,
    ...(description ? { description } : {}),
    origin,
    ...(source ? { source } : {}),
    draft,
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function assertPromptTemplate(
  value: unknown,
  expectedOrigin?: PromptTemplateOrigin,
): asserts value is PromptTemplate {
  if (!normalizePromptTemplate(value, expectedOrigin)) {
    throw new Error("Invalid prompt template");
  }
}
