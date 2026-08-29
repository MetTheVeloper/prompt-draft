import { clonePromptDraftState } from "../utils/promptDraftState";
import type { PromptTemplate, PromptTemplateInstantiation } from "./types";
import { normalizePromptTemplate } from "./validation";

export function instantiatePromptTemplate(
  template: PromptTemplate,
): PromptTemplateInstantiation {
  const normalized = normalizePromptTemplate(template);
  if (!normalized) {
    throw new Error(`Cannot instantiate invalid prompt template: ${template?.id || "unknown"}`);
  }

  return {
    templateId: normalized.id,
    title: normalized.title,
    draft: clonePromptDraftState(normalized.draft),
  };
}
