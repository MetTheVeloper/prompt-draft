import {
  createWizardEntity,
  defaultWizardEntityDefinition,
  normalizeWizardEntityAnswers,
  type WizardEntityAnswer,
  type WizardEntityPromptMode,
} from "./entities";
import {
  clearPortraitLivingPoseAnswers,
  getPortraitLivingCompositionPhase,
  getPortraitLivingLookState,
  getPortraitLivingPeopleState,
  setPortraitLivingCompositionPhase,
  setPortraitLivingLookState,
  setPortraitLivingPeopleState,
  type PortraitLivingCompositionPhase,
  type PortraitLivingLookDomain,
  type PortraitLivingLookPhase,
  type PortraitLivingPeopleState,
} from "./portraitLivingPresentation";
import {
  getPortraitLivingFinalPhase,
  isPortraitLivingTransformMode,
  setPortraitLivingFinalPhase,
  type PortraitLivingFinalPhase,
} from "./portraitLivingFinalPresentation";
import {
  getPortraitLivingScenePhase,
  setPortraitLivingScenePhase,
  type PortraitLivingScenePhase,
} from "./portraitLivingScenePresentation";
import type { WizardSession } from "./session";

export type PortraitLivingReviewPending =
  | "people-config"
  | "pose"
  | "environment-confirm"
  | "reference"
  | "strength";

export type PortraitLivingNavigationAnchor = {
  stepId: string;
  peopleState?: PortraitLivingPeopleState;
  lookDomain?: PortraitLivingLookDomain;
  lookPhase?: PortraitLivingLookPhase;
  compositionPhase?: PortraitLivingCompositionPhase;
  scenePhase?: PortraitLivingScenePhase;
  finalPhase?: PortraitLivingFinalPhase;
};

export type PortraitLivingReviewEditContext = {
  originAnswerId: string;
  originStepId: string;
  beforeCreationMode: string;
  beforeFraming: string;
  beforeSubjectCount: number;
  returnAnchor: PortraitLivingNavigationAnchor;
  pending?: PortraitLivingReviewPending;
};

export type PortraitLivingReviewEditTarget = {
  answerId: string;
  stepId: string;
};

const LIVING_EDIT_KEY = "livingEditDetour";
const LEGACY_LIVING_REVIEW_EDIT_KEY = "livingReviewEdit";
const TRANSFORM_ONLY_ANSWER_IDS = [
  "referenceUsage",
  "transformationStrength",
] as const;

export const PORTRAIT_LIVING_CHAPTER_EDIT_TARGETS: Readonly<
  Record<string, PortraitLivingReviewEditTarget>
> = {
  start: { answerId: "creationMode", stepId: "start" },
  subjects: { answerId: "subjects", stepId: "subjects" },
  portrait: { answerId: "portraitIntent", stepId: "intent" },
  appearance: { answerId: "expressionIntent", stepId: "appearance" },
  composition: { answerId: "framingIntent", stepId: "composition" },
  scene: { answerId: "environmentType", stepId: "environment" },
  final: { answerId: "aspectRatio", stepId: "final-settings" },
};

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

function isPeopleState(value: unknown): value is PortraitLivingPeopleState {
  return value === "choice" || value === "count" || value === "configure";
}

function isLookDomain(value: unknown): value is PortraitLivingLookDomain {
  return value === "expression" || value === "hair" || value === "outfit";
}

function isLookPhase(value: unknown): value is PortraitLivingLookPhase {
  return value === "choice" || value === "refine";
}

function isCompositionPhase(value: unknown): value is PortraitLivingCompositionPhase {
  return value === "framing" || value === "pose-choice" || value === "pose-refine";
}

function isScenePhase(value: unknown): value is PortraitLivingScenePhase {
  return value === "environment-choice" ||
    value === "environment-detail" ||
    value === "environment-refine";
}

function isFinalPhase(value: unknown): value is PortraitLivingFinalPhase {
  return value === "aspect-ratio" ||
    value === "reference-fidelity" ||
    value === "transformation-strength";
}

function answerText(session: WizardSession, answerId: string) {
  return cleanText(session.answers[answerId]?.value);
}

function isUserOwned(session: WizardSession, answerId: string) {
  return session.answers[answerId]?.source === "user";
}

function parseNavigationAnchor(value: unknown): PortraitLivingNavigationAnchor | null {
  if (!isRecord(value)) return null;
  const stepId = cleanText(value.stepId);
  if (!stepId) return null;

  return {
    stepId,
    ...(isPeopleState(value.peopleState) ? { peopleState: value.peopleState } : {}),
    ...(isLookDomain(value.lookDomain) ? { lookDomain: value.lookDomain } : {}),
    ...(isLookPhase(value.lookPhase) ? { lookPhase: value.lookPhase } : {}),
    ...(isCompositionPhase(value.compositionPhase)
      ? { compositionPhase: value.compositionPhase }
      : {}),
    ...(isScenePhase(value.scenePhase) ? { scenePhase: value.scenePhase } : {}),
    ...(isFinalPhase(value.finalPhase) ? { finalPhase: value.finalPhase } : {}),
  };
}

export function capturePortraitLivingNavigationAnchor(
  session: WizardSession,
): PortraitLivingNavigationAnchor {
  const anchor: PortraitLivingNavigationAnchor = {
    stepId: session.currentStepId,
  };

  if (session.currentStepId === "subjects") {
    anchor.peopleState = getPortraitLivingPeopleState(session);
  } else if (session.currentStepId === "appearance") {
    const look = getPortraitLivingLookState(session);
    anchor.lookDomain = look.domain;
    anchor.lookPhase = look.phase;
  } else if (session.currentStepId === "composition") {
    anchor.compositionPhase = getPortraitLivingCompositionPhase(session);
  } else if (
    session.currentStepId === "environment" ||
    session.currentStepId === "lighting"
  ) {
    anchor.scenePhase = getPortraitLivingScenePhase(session);
  } else if (session.currentStepId === "final-settings") {
    anchor.finalPhase = getPortraitLivingFinalPhase(session);
  }

  return anchor;
}

export function portraitLivingChapterIdForStep(stepId: string) {
  if (stepId === "start") return "start";
  if (stepId === "subjects") return "subjects";
  if (stepId === "intent") return "portrait";
  if (stepId === "appearance") return "appearance";
  if (stepId === "composition") return "composition";
  if (stepId === "environment" || stepId === "lighting") return "scene";
  if (stepId === "final-settings") return "final";
  if (stepId === "review") return "review";
  return "";
}

export function getPortraitLivingEditReturnChapterId(session: WizardSession) {
  const context = getPortraitLivingReviewEditContext(session);
  return portraitLivingChapterIdForStep(
    context?.returnAnchor.stepId || session.currentStepId,
  );
}

function withEditContext(
  session: WizardSession,
  context: PortraitLivingReviewEditContext,
): WizardSession {
  const derived = {
    ...session.derived,
    [LIVING_EDIT_KEY]: context,
  };
  delete derived[LEGACY_LIVING_REVIEW_EDIT_KEY];
  return { ...session, derived };
}

function withPending(
  session: WizardSession,
  pending: PortraitLivingReviewPending,
): WizardSession {
  const context = getPortraitLivingReviewEditContext(session);
  return context
    ? withEditContext(session, { ...context, pending })
    : session;
}

export function getPortraitLivingReviewEditContext(
  session: WizardSession,
): PortraitLivingReviewEditContext | null {
  const raw = session.derived[LIVING_EDIT_KEY] ||
    session.derived[LEGACY_LIVING_REVIEW_EDIT_KEY];
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
    returnAnchor: parseNavigationAnchor(raw.returnAnchor) || { stepId: "review" },
    ...(isPending(raw.pending) ? { pending: raw.pending } : {}),
  };
}

export function isPortraitLivingReviewEditing(session: WizardSession) {
  return Boolean(getPortraitLivingReviewEditContext(session));
}

function withoutEditContext(session: WizardSession) {
  const derived = { ...session.derived };
  delete derived[LIVING_EDIT_KEY];
  delete derived[LEGACY_LIVING_REVIEW_EDIT_KEY];
  return { ...session, derived };
}

function restoreNavigationAnchor(
  session: WizardSession,
  anchor: PortraitLivingNavigationAnchor,
): WizardSession {
  let next = {
    ...session,
    currentStepId: anchor.stepId,
  };

  if (anchor.stepId === "subjects") {
    return setPortraitLivingPeopleState(next, anchor.peopleState || "choice");
  }

  if (anchor.stepId === "appearance") {
    return setPortraitLivingLookState(next, {
      domain: anchor.lookDomain || "expression",
      phase: anchor.lookPhase || "choice",
    });
  }

  if (anchor.stepId === "composition") {
    let phase = anchor.compositionPhase || "framing";
    if (answerText(next, "framingIntent") === "headshot" && phase !== "framing") {
      phase = "framing";
    }
    return setPortraitLivingCompositionPhase(next, phase);
  }

  if (anchor.stepId === "environment" || anchor.stepId === "lighting") {
    return setPortraitLivingScenePhase(
      next,
      anchor.scenePhase || "environment-choice",
    );
  }

  if (anchor.stepId === "final-settings") {
    let phase = anchor.finalPhase || "aspect-ratio";
    if (!isPortraitLivingTransformMode(next) && phase !== "aspect-ratio") {
      phase = "aspect-ratio";
    }
    return setPortraitLivingFinalPhase(next, phase);
  }

  return next;
}

export function returnToPortraitLivingEditAnchor(session: WizardSession): WizardSession {
  const context = getPortraitLivingReviewEditContext(session);
  const clean = withoutEditContext(session);
  return restoreNavigationAnchor(
    clean,
    context?.returnAnchor || { stepId: "review" },
  );
}

/** Backward-compatible alias for the original Review-only edit flow. */
export function returnToPortraitLivingReview(session: WizardSession): WizardSession {
  return returnToPortraitLivingEditAnchor(session);
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

function beginEdit(
  session: WizardSession,
  target: PortraitLivingReviewEditTarget,
  returnAnchor: PortraitLivingNavigationAnchor,
): WizardSession {
  const context: PortraitLivingReviewEditContext = {
    originAnswerId: target.answerId,
    originStepId: target.stepId,
    beforeCreationMode: answerText(session, "creationMode"),
    beforeFraming: answerText(session, "framingIntent"),
    beforeSubjectCount: normalizeWizardEntityAnswers(session.answers.subjects?.value).length,
    returnAnchor,
  };

  const next = withEditContext(
    { ...session, currentStepId: target.stepId },
    context,
  );
  return prepareReviewTarget(next, target.answerId);
}

export function beginPortraitLivingReviewEdit(
  session: WizardSession,
  target: PortraitLivingReviewEditTarget,
): WizardSession {
  return beginEdit(session, target, { stepId: "review" });
}

export function beginPortraitLivingChapterEdit(
  session: WizardSession,
  chapterId: string,
): WizardSession {
  const target = PORTRAIT_LIVING_CHAPTER_EDIT_TARGETS[chapterId];
  if (!target) return session;

  const existing = getPortraitLivingReviewEditContext(session);
  const returnAnchor = existing?.returnAnchor ||
    capturePortraitLivingNavigationAnchor(session);
  return beginEdit(session, target, returnAnchor);
}

export function resolvePortraitLivingReviewChoice(
  session: WizardSession,
  answerId: string,
): WizardSession {
  const context = getPortraitLivingReviewEditContext(session);
  if (!context) return session;

  if (context.pending === "pose" && answerId === "poseIntent") {
    return returnToPortraitLivingEditAnchor(session);
  }

  if (context.pending === "reference" && answerId === "referenceUsage") {
    let next = withPending(session, "strength");
    next = { ...next, currentStepId: "final-settings" };
    return setPortraitLivingFinalPhase(next, "transformation-strength");
  }

  if (context.pending === "strength" && answerId === "transformationStrength") {
    return returnToPortraitLivingEditAnchor(session);
  }

  if (answerId !== context.originAnswerId) return session;

  if (answerId === "creationMode") {
    const mode = answerText(session, "creationMode");
    if (mode === "from_description") {
      return returnToPortraitLivingEditAnchor(
        clearPortraitLivingTransformOnlyAnswers(session),
      );
    }

    if (mode === "from_image" && context.beforeCreationMode !== "from_image") {
      let next = clearPortraitLivingTransformOnlyAnswers(session);
      next = withPending(next, "reference");
      next = { ...next, currentStepId: "final-settings" };
      return setPortraitLivingFinalPhase(next, "reference-fidelity");
    }

    return returnToPortraitLivingEditAnchor(session);
  }

  if (answerId === "subjects") {
    const subjects = normalizeWizardEntityAnswers(session.answers.subjects?.value);
    if (subjects.length <= 1) return returnToPortraitLivingEditAnchor(session);
    let next = withPending(session, "people-config");
    next = { ...next, currentStepId: "subjects" };
    return setPortraitLivingPeopleState(next, "configure");
  }

  if (answerId === "framingIntent") {
    const framing = answerText(session, "framingIntent");
    if (framing === "headshot") {
      return returnToPortraitLivingEditAnchor(
        clearPortraitLivingPoseAnswers(session),
      );
    }

    if (context.beforeFraming === "headshot" || !isUserOwned(session, "poseIntent")) {
      let next = clearPortraitLivingPoseAnswers(session);
      next = withPending(next, "pose");
      next = { ...next, currentStepId: "composition" };
      return setPortraitLivingCompositionPhase(next, "pose-choice");
    }

    return returnToPortraitLivingEditAnchor(session);
  }

  if (answerId === "environmentType") {
    let next = withPending(session, "environment-confirm");
    next = { ...next, currentStepId: "environment" };
    return setPortraitLivingScenePhase(next, "environment-detail");
  }

  return returnToPortraitLivingEditAnchor(session);
}

export function completePortraitLivingReviewConfirmation(
  session: WizardSession,
): WizardSession {
  return isPortraitLivingReviewEditing(session)
    ? returnToPortraitLivingEditAnchor(session)
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
