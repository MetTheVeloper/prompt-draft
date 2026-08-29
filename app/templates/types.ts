import type { PromptDraftState } from "../modules/promptDraft.types";

export const PROMPT_TEMPLATE_SCHEMA_VERSION = 1 as const;

export type PromptTemplateOrigin = "builtin" | "user";

export type PromptTemplateSource = {
  kind: "wizard" | "create";
  wizardId?: string;
  wizardVersion?: number;
};

export type PromptTemplate = {
  schemaVersion: typeof PROMPT_TEMPLATE_SCHEMA_VERSION;
  id: string;
  title: string;
  description?: string;
  origin: PromptTemplateOrigin;
  source?: PromptTemplateSource;
  draft: PromptDraftState;
  createdAt?: string;
  updatedAt?: string;
};

export type PromptTemplateInstantiation = {
  templateId: string;
  title: string;
  draft: PromptDraftState;
};

export type PromptTemplateCollection = {
  version: 1;
  templates: PromptTemplate[];
};

export type PromptTemplateStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
