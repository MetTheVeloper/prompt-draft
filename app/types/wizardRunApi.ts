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

export type WizardRunRecord = CreateWizardRunInput & {
  id: string;
  createdAt: string;
};

export type CreateWizardRunResponse = {
  ok: true;
  run: WizardRunRecord;
};

export type ListWizardRunsResponse = {
  ok: true;
  count: number;
  runs: WizardRunRecord[];
};

export type ApiHelloResponse = {
  ok: true;
  message: string;
};
