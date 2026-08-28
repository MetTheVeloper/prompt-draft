import { invokePublicAction } from "../actions/public";
import type {
  PublicActionInvocation,
  PublicActionResult,
} from "../actions/public";
import type { ActionContext } from "../actions/types";
import type { PromptDraftState } from "../modules/promptDraft.types";
import {
  clonePromptDraftState,
  createPromptDraftState,
} from "../utils/promptDraftState";
import { createDefaultPromptSettings } from "../utils/compilePromptCore";
import {
  assertWizardDefinition,
  type WizardCondition,
  type WizardDefinition,
  type WizardQuestionDefinition,
  type WizardStageDefinition,
  type WizardStepDefinition,
} from "./definition";

export type WizardAnswerSource = "default" | "user";

export type WizardAnswerState = {
  value: unknown;
  source: WizardAnswerSource;
};

export type WizardSession = {
  wizardId: string;
  wizardVersion: number;
  currentStepId: string;
  answers: Record<string, WizardAnswerState>;
  derived: Record<string, unknown>;
  workingDraft: PromptDraftState;
};

export type WizardActionHostContext = Omit<ActionContext, "draft">;

function createDefaultAnswers(definition: WizardDefinition) {
  const answers: Record<string, WizardAnswerState> = {};

  for (const step of definition.steps) {
    for (const question of step.questions) {
      if (question.defaultValue === undefined) continue;

      answers[question.id] = {
        value: question.defaultValue,
        source: "default",
      };
    }
  }

  return answers;
}

function assertSessionDefinition(
  session: WizardSession,
  definition: WizardDefinition,
) {
  if (
    session.wizardId !== definition.id ||
    session.wizardVersion !== definition.version
  ) {
    throw new Error(
      `Wizard session ${session.wizardId}@${session.wizardVersion} does not match definition ${definition.id}@${definition.version}.`,
    );
  }
}

export function isWizardConditionMet(
  session: WizardSession,
  condition?: WizardCondition,
) {
  if (!condition) return true;

  const answer = session.answers[condition.answerId];
  if (!answer) return false;

  const matches = Object.is(answer.value, condition.value);
  return condition.operator === "equals" ? matches : !matches;
}

export function getWizardVisibleSteps(
  definition: WizardDefinition,
  session: WizardSession,
): readonly WizardStepDefinition[] {
  assertSessionDefinition(session, definition);
  return definition.steps.filter((step) =>
    isWizardConditionMet(session, step.visibleWhen),
  );
}

export function getWizardVisibleQuestions(
  definition: WizardDefinition,
  session: WizardSession,
  stepId = session.currentStepId,
): readonly WizardQuestionDefinition[] {
  assertSessionDefinition(session, definition);

  const step = definition.steps.find((item) => item.id === stepId);
  if (!step) throw new Error(`Wizard step not found: ${stepId}`);

  return step.questions.filter((question) =>
    isWizardConditionMet(session, question.visibleWhen),
  );
}

export function getWizardCurrentStep(
  definition: WizardDefinition,
  session: WizardSession,
) {
  assertSessionDefinition(session, definition);
  return definition.steps.find((step) => step.id === session.currentStepId) || null;
}

export function getWizardCurrentStage(
  definition: WizardDefinition,
  session: WizardSession,
): WizardStageDefinition | null {
  const step = getWizardCurrentStep(definition, session);
  if (!step?.stageId || !definition.stages?.length) return null;
  return definition.stages.find((stage) => stage.id === step.stageId) || null;
}

function createSessionFromDraft(
  definition: WizardDefinition,
  initialDraft: PromptDraftState,
): WizardSession {
  assertWizardDefinition(definition);

  const firstStep = definition.steps[0];
  if (!firstStep) {
    throw new Error("Wizard definition must contain at least one step.");
  }

  const session: WizardSession = {
    wizardId: definition.id,
    wizardVersion: definition.version,
    currentStepId: firstStep.id,
    answers: createDefaultAnswers(definition),
    derived: {},
    workingDraft: clonePromptDraftState(initialDraft),
  };

  const firstVisibleStep = getWizardVisibleSteps(definition, session)[0];
  if (!firstVisibleStep) {
    throw new Error("Wizard definition has no visible initial step.");
  }

  return {
    ...session,
    currentStepId: firstVisibleStep.id,
  };
}

/**
 * Compatibility constructor used by the accepted v1 backend tests and any
 * explicit caller that intentionally supplies a Draft snapshot.
 */
export function createWizardSession(
  definition: WizardDefinition,
  activeDraft: PromptDraftState,
): WizardSession {
  return createSessionFromDraft(definition, activeDraft);
}

/**
 * Standard Wizard product flow. Starts from a clean Draft and therefore has
 * no dependency on Create-page Active Draft state.
 */
export function createFreshWizardSession(
  definition: WizardDefinition,
): WizardSession {
  return createSessionFromDraft(
    definition,
    createPromptDraftState(createDefaultPromptSettings()),
  );
}

export function setWizardUserAnswer(
  session: WizardSession,
  questionId: string,
  value: unknown,
): WizardSession {
  return {
    ...session,
    answers: {
      ...session.answers,
      [questionId]: { value, source: "user" },
    },
  };
}

export function setWizardDefaultAnswer(
  session: WizardSession,
  questionId: string,
  value: unknown,
): WizardSession {
  const current = session.answers[questionId];

  if (current?.source === "user") return session;
  if (current?.source === "default" && Object.is(current.value, value)) {
    return session;
  }

  return {
    ...session,
    answers: {
      ...session.answers,
      [questionId]: { value, source: "default" },
    },
  };
}

export function replaceWizardDerived(
  session: WizardSession,
  derived: Record<string, unknown>,
): WizardSession {
  return {
    ...session,
    derived: { ...derived },
  };
}

function moveWizardSession(
  session: WizardSession,
  definition: WizardDefinition,
  offset: -1 | 1,
): WizardSession {
  const steps = getWizardVisibleSteps(definition, session);
  const currentIndex = steps.findIndex(
    (step) => step.id === session.currentStepId,
  );
  const target = steps[currentIndex + offset];

  if (currentIndex < 0) {
    return steps[0]
      ? { ...session, currentStepId: steps[0].id }
      : session;
  }

  return target ? { ...session, currentStepId: target.id } : session;
}

export function goToNextWizardStep(
  session: WizardSession,
  definition: WizardDefinition,
) {
  return moveWizardSession(session, definition, 1);
}

export function goToPreviousWizardStep(
  session: WizardSession,
  definition: WizardDefinition,
) {
  return moveWizardSession(session, definition, -1);
}

/**
 * Executes one canonical public Action against the isolated Working Draft.
 * Failure keeps the session unchanged; success advances only workingDraft.
 */
export async function executeWizardAction<TData = unknown>(
  session: WizardSession,
  request: PublicActionInvocation,
  hostContext: WizardActionHostContext,
): Promise<{
  session: WizardSession;
  result: PublicActionResult<TData>;
}> {
  const result = await invokePublicAction<TData>(request, {
    ...hostContext,
    draft: session.workingDraft,
  });

  return result.ok
    ? {
        session: {
          ...session,
          workingDraft: result.draft,
        },
        result,
      }
    : { session, result };
}
