import type { PromptDraftState } from "~/modules/promptDraft.types";

export type UpsertPromptDraftInput = {
  title: string;
  createdAt: string;
  updatedAt: string;
  snapshot: PromptDraftState;
};

export type SyncedPromptDraftRecord = UpsertPromptDraftInput & {
  id: string;
  serverUpdatedAt: string;
  revision: number;
};

export type UpsertPromptDraftResponse = {
  ok: true;
  draft: SyncedPromptDraftRecord;
};

export type GetPromptDraftResponse = {
  ok: true;
  draft: SyncedPromptDraftRecord;
};
