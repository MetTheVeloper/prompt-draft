import type { PromptDraftState } from "~/modules/promptDraft.types";
import type { AuthScoreState } from "~/types/auth";

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
  score?: AuthScoreState;
};

export type GetPromptDraftResponse = {
  ok: true;
  draft: SyncedPromptDraftRecord;
};

export type ListPromptDraftsParams = {
  limit?: number;
  cursor?: string;
};

export type ListPromptDraftsResponse = {
  ok: true;
  drafts: SyncedPromptDraftRecord[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type DeletePromptDraftResponse = {
  ok: true;
  draft: {
    id: string;
    deletedAt: string;
  };
};
