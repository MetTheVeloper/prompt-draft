import type { PromptOutputFormat } from "../utils/compilePromptCore";
import {
  completeWizardSession,
  type WizardCompletionResult,
} from "./completion";
import type { PortraitWizardMappingResult } from "./portrait";
import { executePortraitWizardMappingWithSubjectOverrides } from "./portraitSubjectOverrides";
import type {
  WizardActionHostContext,
  WizardSession,
} from "./session";

export type PortraitWizardCompletionResult =
  | {
      ok: true;
      stage: "complete";
      mapping: Extract<PortraitWizardMappingResult, { ok: true }>;
      completion: Extract<WizardCompletionResult, { ok: true }>;
    }
  | {
      ok: false;
      stage: "mapping";
      mapping: Extract<PortraitWizardMappingResult, { ok: false }>;
    }
  | {
      ok: false;
      stage: "completion";
      mapping: Extract<PortraitWizardMappingResult, { ok: true }>;
      completion: Extract<WizardCompletionResult, { ok: false }>;
    };

/**
 * Canonical Portrait completion pipeline:
 * answers/rules -> mapper -> per-subject overrides -> prompt.validate -> prompt.compile.
 * Successful output is still not persisted/applied to the Active Draft here.
 */
export async function completePortraitWizard(
  session: WizardSession,
  hostContext: WizardActionHostContext,
  options: { format?: PromptOutputFormat } = {},
): Promise<PortraitWizardCompletionResult> {
  const mapping = await executePortraitWizardMappingWithSubjectOverrides(
    session,
    hostContext,
  );
  if (!mapping.ok) {
    return {
      ok: false,
      stage: "mapping",
      mapping,
    };
  }

  const completion = await completeWizardSession(
    mapping.session,
    hostContext,
    options,
  );

  if (!completion.ok) {
    return {
      ok: false,
      stage: "completion",
      mapping,
      completion,
    };
  }

  return {
    ok: true,
    stage: "complete",
    mapping,
    completion,
  };
}
