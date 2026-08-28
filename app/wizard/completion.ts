import { invokePublicAction } from "../actions/public";
import type { PublicActionInvocation } from "../actions/public";
import type { ActionIssue } from "../actions/types";
import type {
  PromptReadCompile,
  PromptReadValidation,
} from "../domain/promptRead";
import type { PromptDraftState } from "../modules/promptDraft.types";
import type { PromptOutputFormat } from "../utils/compilePromptCore";
import { clonePromptDraftState } from "../utils/promptDraftState";
import type { PromptValidationIssue } from "../utils/promptValidation";
import type {
  WizardActionHostContext,
  WizardSession,
} from "./session";

export type WizardCompletionFailureStage =
  | "validate_action"
  | "validation"
  | "compile_action";

export type WizardCompletionResult =
  | {
      ok: true;
      session: WizardSession;
      finalDraft: PromptDraftState;
      validation: PromptReadValidation;
      compilation: PromptReadCompile;
      actions: PublicActionInvocation[];
    }
  | {
      ok: false;
      stage: WizardCompletionFailureStage;
      session: WizardSession;
      validation?: PromptReadValidation;
      actionIssues?: ActionIssue[];
      validationIssues?: PromptValidationIssue[];
      actions: PublicActionInvocation[];
    };

function invalidReadIssue(actionId: string): ActionIssue {
  return {
    code: "wizard_read_result_invalid",
    details: { actionId },
  };
}

function isPromptReadValidation(value: unknown): value is PromptReadValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<PromptReadValidation>;
  return (
    typeof candidate.valid === "boolean" &&
    typeof candidate.hasErrors === "boolean" &&
    Array.isArray(candidate.issues) &&
    Boolean(candidate.outputs) &&
    typeof candidate.outputs === "object" &&
    !Array.isArray(candidate.outputs)
  );
}

function isPromptReadCompile(value: unknown): value is PromptReadCompile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<PromptReadCompile>;
  return (
    (candidate.format === "modular" ||
      candidate.format === "natural" ||
      candidate.format === "json") &&
    typeof candidate.output === "string"
  );
}

/**
 * Runs the canonical completion reads against the isolated Wizard Working Draft.
 * It never mutates/replaces an Active Draft; the host may apply `finalDraft`
 * only after this function succeeds.
 */
export async function completeWizardSession(
  session: WizardSession,
  hostContext: WizardActionHostContext,
  options: { format?: PromptOutputFormat } = {},
): Promise<WizardCompletionResult> {
  const actions: PublicActionInvocation[] = [];

  const validateRequest: PublicActionInvocation = {
    actionId: "prompt.validate",
    input: {},
  };
  actions.push(validateRequest);

  const validateResult = await invokePublicAction<PromptReadValidation>(
    validateRequest,
    {
      ...hostContext,
      draft: session.workingDraft,
    },
  );

  if (!validateResult.ok) {
    return {
      ok: false,
      stage: "validate_action",
      session,
      actionIssues: validateResult.issues,
      actions,
    };
  }

  if (!isPromptReadValidation(validateResult.data)) {
    return {
      ok: false,
      stage: "validate_action",
      session,
      actionIssues: [invalidReadIssue("prompt.validate")],
      actions,
    };
  }

  const validation = validateResult.data;
  if (!validation.valid || validation.hasErrors) {
    return {
      ok: false,
      stage: "validation",
      session,
      validation,
      validationIssues: validation.issues.filter(
        (issue) => issue.level === "error",
      ),
      actions,
    };
  }

  const compileRequest: PublicActionInvocation = {
    actionId: "prompt.compile",
    input:
      options.format === undefined
        ? {}
        : { format: options.format },
  };
  actions.push(compileRequest);

  const compileResult = await invokePublicAction<PromptReadCompile>(
    compileRequest,
    {
      ...hostContext,
      draft: session.workingDraft,
    },
  );

  if (!compileResult.ok) {
    return {
      ok: false,
      stage: "compile_action",
      session,
      validation,
      actionIssues: compileResult.issues,
      actions,
    };
  }

  if (!isPromptReadCompile(compileResult.data)) {
    return {
      ok: false,
      stage: "compile_action",
      session,
      validation,
      actionIssues: [invalidReadIssue("prompt.compile")],
      actions,
    };
  }

  return {
    ok: true,
    session,
    finalDraft: clonePromptDraftState(session.workingDraft),
    validation,
    compilation: compileResult.data,
    actions,
  };
}
