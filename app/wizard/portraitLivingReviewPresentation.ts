import {
  createWizardEntity,
  defaultWizardEntityDefinition,
  normalizeWizardEntityAnswers,
  type WizardEntityAnswer,
  type WizardEntityPromptMode,
} from "./entities";
import {
  clearPortraitLivingPoseAnswers,
  setPortraitLivingCompositionPhase,
  setPortraitLivingLookState,
  setPortraitLivingPeopleState,
} from "./portraitLivingPresentation";
import { setPortraitLivingFinalPhase } from "./portraitLivingFinalPresentation";
import { setPortraitLivingScenePhase } from "./portraitLivingScenePresentation";
import type { WizardSession } from "./session";

export type PortraitLivingReviewPending =
  | "people-config"
  | "pose"
  | "environment-confirm"
  | "reference"
  | "strength";

export type PortraitLivingReviewEditContext = {
  originAnswerId: string;
  originStepId: string;
  beforeCreationMode: string;
  beforeFraming: string;
  beforeSubjectCount: number;
  pending?: PortraitLivingReviewPending;
};

export type PortraitLivingReviewEditTarget = {
  answerId: string;
  stepId: string;
};

const LIVING_REVIEW_EDIT_KEY = "livingReviewEdit";
const TRANSFORM_ONLY_ANSWER_IDS = [
  "referenceUsage",
  "transformationStrength",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPending(value: unknown): value is PortraitLivingReviewPending {
  return value === "people-config" ||
    value === "pose" ||
    value === "environment-confirm" ||
    value === "reference" ||
    value === "strength";
}

function answerText(session: WizardSession, answerId: string) {
  return cleanText(session.answers[answerId]?.value);
}

function isUserOwned(session: WizardSession, answerId: string) {
  return session.answers[answerId]?.source === "user";
}

function withReviewContext(
  session: WizardSession,
  context: PortraitLivingReviewEditContext,
): WizardSession {
  return {
    ...session,
    derived: {
      ...session.derived,
      [LIVING_REVIEW_EDIT_KEY]: context,
    },
  };
}

function withPending(
  session: WizardSession,
  pending: PortraitLivingReviewPending,
): WizardSession {
  const context = getPortraitLivingReviewEditContext(session);
  return context
    ? withReviewContext(session, { ...context, pending })
    : session;
}

export function getPortraitLivingReviewEditContext(
  session: WizardSession,
): PortraitLivingReviewEditContext | null {
  const raw = session.derived[LIVING_REVIEW_EDIT_KEY];
  if (!isRecord(raw)) return null;

  const originAnswerId = cleanText(raw.originAnswerId);
  const originStepId = cleanText(raw.originStepId);
  if (!originAnswerId || !originStepId) return null;

  return {
    originAnswerId,
    originStepId,
    beforeCreationMode: cleanText(raw.beforeCreationMode),
    beforeFraming: cleanText(raw.beforeFraming),
    beforeSubjectCount:
      typeof raw.beforeSubjectCount === "number" && Number.isFinite(raw.beforeSubjectCount)
        ? Math.max(0, Math.floor(raw.beforeSubjectCount))
        : 0,
    ...(isPending(raw.pending) ? { pending: raw.pending } : {}),
  };
}

export function isPortraitLivingReviewEditing(session: WizardSession) {
  return Boolean(getPortraitLivingReviewEditContext(session));
}

export function returnToPortraitLivingReview(session: WizardSession): WizardSession {
  const derived = { ...session.derived };
  delete derived[LIVING_REVIEW_EDIT_KEY];
  return {
    ...session,
    currentStepId: "review",
    derived,
  };
}

export function clearPortraitLivingTransformOnlyAnswers(
  session: WizardSession,
): WizardSession {
  const answers = { ...session.answers };
  for (const answerId of TRANSFORM_ONLY_ANSWER_IDS) delete answers[answerId];
  return { ...session, answers };
}

function prepareReviewTarget(
  session: WizardSession,
  answerId: string,
): WizardSession {
  if (answerId === "subjects") {
    return setPortraitLivingPeopleState(session, "choice");
  }

  if (answerId === "expressionIntent") {
    return setPortraitLivingLookState(session, { domain: "expression", phase: "choice" });
  }
  if (answerId === "expressionOptions" || answerId === "expressionSubjectOverrides") {
    return setPortraitLivingLookState(session, { domain: "expression", phase: "refine" });
  }
  if (answerId === "hairIntent") {
    return setPortraitLivingLookState(session, { domain: "hair", phase: "choice" });
  }
  if (answerId === "hairOptions" || answerId === "hairSubjectOverrides") {
    return setPortraitLivingLookState(session, { domain: "hair", phase: "refine" });
  }
  if (answerId === "outfitIntent") {
    return setPortraitLivingLookState(session, { domain: "outfit", phase: "choice" });
  }
  if (answerId === "outfitOptions" || answerId === "outfitSubjectOverrides") {
    return setPortraitLivingLookState(session, { domain: "outfit", phase: "refine" });
  }

  if (answerId === "framingIntent") {
    return setPortraitLivingCompositionPhase(session, "framing");
  }
  if (answerId === "poseIntent") {
    return setPortraitLivingCompositionPhase(session, "pose-choice");
  }
  if (answerId === "poseOptions" || answerId === "poseSubjectOverrides") {
    return setPortraitLivingCompositionPhase(session, "pose-refine");
  }

  if (answerId === "environmentType") {
    return setPortraitLivingScenePhase(session, "environment-choice");
  }
  if (
    answerId === "studioDirection" ||
    answerId === "outdoorSetting" ||
    answerId === "abstractDirection"
  ) {
    return setPortraitLivingScenePhase(session, "environment-detail");
  }
  if (answerId === "backgroundOptions") {
    return setPortraitLivingScenePhase(session, "environment-refine");
  }

  if (answerId === "aspectRatio") {
    return setPortraitLivingFinalPhase(session, "aspect-ratio");
  }
  if (answerId === "referenceUsage") {
    return setPortraitLivingFinalPhase(session, "reference-fidelity");
  }
  if (answerId === "transformationStrength") {
    return setPortraitLivingFinalPhase(session, "transformation-strength");
  }

  return session;
}

export function beginPortraitLivingReviewEdit(
  session: WizardSession,
  target: PortraitLivingReviewEditTarget,
): WizardSession {
  const context: PortraitLivingReviewEditContext = {
    originAnswerId: target.answerId,
    originStepId: target.stepId,
    beforeCreationMode: answerText(session, "creationMode"),
    beforeFraming: answerText(session, "framingIntent"),
    beforeSubjectCount: normalizeWizardEntityAnswers(session.answers.subjects?.value).length,
  };

  const next = withReviewContext(
    { ...session, currentStepId: target.stepId },
    context,
  );
  return prepareReviewTarget(next, target.answerId);
}

export function resolvePortraitLivingReviewChoice(
  session: WizardSession,
  answerId: string,
): WizardSession {
  const context = getPortraitLivingReviewEditContext(session);
  if (!context) return session;

  if (context.pending === "pose" && answerId === "poseIntent") {
    return returnToPortraitLivingReview(session);
  }

  if (context.pending === "reference" && answerId === "referenceUsage") {
    let next = withPending(session, "strength");
    next = { ...next, currentStepId: "final-settings" };
    return setPortraitLivingFinalPhase(next, "transformation-strength");
  }

  if (context.pending === "strength" && answerId === "transformationStrength") {
    return returnToPortraitLivingReview(session);
  }

  if (answerId !== context.originAnswerId) return session;

  if (answerId === "creationMode") {
    const mode = answerText(session, "creationMode");
    if (mode === "from_description") {
      return returnToPortraitLivingReview(
        clearPortraitLivingTransformOnlyAnswers(session),
      );
    }

    if (mode === "from_image" && context.beforeCreationMode !== "from_image") {
      let next = clearPortraitLivingTransformOnlyAnswers(session);
      next = withPending(next, "reference");
      next = { ...next, currentStepId: "final-settings" };
      return setPortraitLivingFinalPhase(next, "reference-fidelity");
    }

    return returnToPortraitLivingReview(session);
  }

  if (answerId === "subjects") {
    const subjects = normalizeWizardEntityAnswers(session.answers.subjects?.value);
    if (subjects.length <= 1) return returnToPortraitLivingReview(session);
    let next = withPending(session, "people-config");
    next = { ...next, currentStepId: "subjects" };
    return setPortraitLivingPeopleState(next, "configure");
  }

  if (answerId === "framingIntent") {
    const framing = answerText(session, "framingIntent");
    if (framing === "headshot") {
      return returnToPortraitLivingReview(
        clearPortraitLivingPoseAnswers(session),
      );
    }

    if (context.beforeFraming === "headshot" || !isUserOwned(session, "poseIntent")) {
      let next = clearPortraitLivingPoseAnswers(session);
      next = withPending(next, "pose");
      next = { ...next, currentStepId: "composition" };
      return setPortraitLivingCompositionPhase(next, "pose-choice");
    }

    return returnToPortraitLivingReview(session);
  }

  if (answerId === "environmentType") {
    let next = withPending(session, "environment-confirm");
    next = { ...next, currentStepId: "environment" };
    return setPortraitLivingScenePhase(next, "environment-detail");
  }

  return returnToPortraitLivingReview(session);
}

export function completePortraitLivingReviewConfirmation(
  session: WizardSession,
): WizardSession {
  return isPortraitLivingReviewEditing(session)
    ? returnToPortraitLivingReview(session)
    : session;
}

export function resizePortraitLivingReviewSubjects(
  subjects: readonly WizardEntityAnswer[],
  count: 1 | 2 | 3 | 4,
  mode: WizardEntityPromptMode,
): WizardEntityAnswer[] {
  const next = subjects.slice(0, count).map((subject) => ({ ...subject }));

  while (next.length < count) {
    const entity = createWizardEntity("person", next);
    next.push({
      ...entity,
      definition: defaultWizardEntityDefinition(mode),
    });
  }

  return next;
}
