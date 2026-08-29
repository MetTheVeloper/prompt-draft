import { linkedinProfileTemplate } from "./builtins/linkedin-profile";
import { loadUserPromptTemplates } from "./storage";
import type { PromptTemplate, PromptTemplateStorage } from "./types";
import { normalizePromptTemplate } from "./validation";

const BUILTIN_TEMPLATES = [linkedinProfileTemplate] as const;

function normalizedBuiltIns() {
  return BUILTIN_TEMPLATES.map((template) => {
    const normalized = normalizePromptTemplate(template, "builtin");
    if (!normalized) {
      throw new Error(`Invalid built-in prompt template: ${template.id}`);
    }
    return normalized;
  });
}

export function listBuiltInPromptTemplates(): PromptTemplate[] {
  return normalizedBuiltIns();
}

export function getBuiltInPromptTemplate(templateId: string) {
  const id = templateId.trim();
  return listBuiltInPromptTemplates().find((template) => template.id === id) || null;
}

export function listAvailablePromptTemplates(
  storage?: PromptTemplateStorage | null,
): PromptTemplate[] {
  return [
    ...listBuiltInPromptTemplates(),
    ...loadUserPromptTemplates(storage),
  ];
}

export function getPromptTemplate(
  templateId: string,
  storage?: PromptTemplateStorage | null,
) {
  const id = templateId.trim();
  return listAvailablePromptTemplates(storage).find((template) => template.id === id) || null;
}
