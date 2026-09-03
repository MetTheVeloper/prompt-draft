import type { PromptDraftState } from "~/modules/promptDraft.types";
import type { WizardAnswerState } from "~/wizard/session";

export type WizardRunSnapshotV1 = {
  schemaVersion: 1;
  session: {
    currentStepId: string;
    answers: Record<string, WizardAnswerState>;
    derived: Record<string, unknown>;
  };
  finalDraft: PromptDraftState;
};

export type CreateWizardRunInput = {
  wizardId: string;
  wizardVersion: number;
  output: string;
  snapshot: WizardRunSnapshotV1;
};

export type WizardRunSummary = {
  id: string;
  createdAt: string;
  wizardId: string;
  wizardVersion: number;
};

export type WizardRunRecord = WizardRunSummary & {
  output: string;
  snapshot: WizardRunSnapshotV1;
};

export type CreateWizardRunResponse = {
  ok: true;
  run: WizardRunRecord;
};

export type WizardRunPageInfo = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type ListWizardRunsParams = {
  limit?: number;
  cursor?: string;
  wizardId?: string;
};

export type ListWizardRunsResponse = {
  ok: true;
  runs: WizardRunSummary[];
  pageInfo: WizardRunPageInfo;
};

export type GetWizardRunResponse = {
  ok: true;
  run: WizardRunRecord;
};

export type ApiHelloResponse = {
  ok: true;
  message: string;
};
