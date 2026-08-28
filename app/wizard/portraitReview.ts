import type { ActionIssue } from "../actions/types";
import {
  portraitWizardV1Definition,
  portraitWizardV2Definition,
  type WizardDefinition,
  type WizardQuestionDefinition,
} from "./definition";
import {
  getWizardEntityDisplayLabel,
  normalizeWizardEntityAnswers,
} from "./entities";
import {
  applyPortraitWizardRules,
  derivePortraitWizardState,
  type PortraitEnvironmentType,
  type PortraitWizardDerived,
} from "./portrait";
import type { WizardAnswerSource, WizardSession } from "./session";

export type PortraitReviewItem = {
  id: string;
  stepId: string;
  label: string;
  value: string;
  source: WizardAnswerSource | "derived";
  answerId?: string;
};

export type PortraitWizardReview =
  | {
      ok: true;
      session: WizardSession;
      derived: PortraitWizardDerived;
      items: PortraitReviewItem[];
    }
  | {
      ok: false;
      session: WizardSession;
      items: PortraitReviewItem[];
      issues: ActionIssue[];
    };

const ENVIRONMENT_DETAIL_ANSWER: Record<PortraitEnvironmentType, string> = {
  studio: "studioDirection",
  outdoor: "outdoorSetting",
  abstract: "abstractDirection",
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function definitionForSession(session: WizardSession): WizardDefinition {
  return session.wizardVersion === 2
    ? portraitWizardV2Definition
    : portraitWizardV1Definition;
}

function questionById(session: WizardSession, questionId: string) {
  for (const step of definitionForSession(session).steps) {
    const question = step.questions.find((item) => item.id === questionId);
    if (question) return { stepId: step.id, question };
  }
  return null;
}

function questionValueLabel(question: WizardQuestionDefinition, value: unknown) {
  if (question.type === "singleChoice" && typeof value === "string") {
    return question.options.find((option) => option.value === value)?.label || value;
  }
  if (question.type === "entityCollection") {
    return normalizeWizardEntityAnswers(value)
      .map(getWizardEntityDisplayLabel)
      .join(", ");
  }
  return cleanText(value);
}

function answerItem(
  session: WizardSession,
  answerId: string,
  options: { value?: string; label?: string } = {},
): PortraitReviewItem | null {
  const answer = session.answers[answerId];
  const definition = questionById(session, answerId);
  if (!definition) return null;

  const value = options.value ?? questionValueLabel(definition.question, answer?.value);
  if (!value) return null;

  return {
    id: answerId,
    stepId: definition.stepId,
    label: options.label || definition.question.title,
    value,
    source: answer?.source || "derived",
    answerId,
  };
}

export function buildPortraitWizardReview(
  session: WizardSession,
): PortraitWizardReview {
  const ruledSession = applyPortraitWizardRules(session);
  const derivedResult = derivePortraitWizardState(ruledSession);

  if (!derivedResult.ok) {
    return {
      ok: false,
      session: ruledSession,
      items: [],
      issues: derivedResult.issues,
    };
  }

  const derived = derivedResult.value;
  const items: PortraitReviewItem[] = [];

  if (session.wizardVersion === 2) {
    for (const answerId of ["idea", "creationMode", "subjects"] as const) {
      const item = answerItem(ruledSession, answerId, {
        ...(answerId === "idea" && !cleanText(ruledSession.answers.idea?.value)
          ? { value: derived.promptIdea, label: "Idea" }
          : {}),
      });
      if (item) items.push(item);
    }
  } else {
    const subject = answerItem(ruledSession, "subjectReference", {
      value: cleanText(derived.subjectTarget.label) || derived.subjectToken,
    });
    if (subject) items.push(subject);
  }

  for (const answerId of [
    "portraitIntent",
    "expressionIntent",
    "hairIntent",
    "outfitIntent",
    "framingIntent",
    "poseIntent",
    "environmentType",
  ]) {
    if (answerId === "poseIntent" && !derived.poseIntent) continue;
    const item = answerItem(ruledSession, answerId);
    if (item) items.push(item);
  }

  const environmentDetailAnswerId = ENVIRONMENT_DETAIL_ANSWER[derived.environmentType];
  if (derived.environmentDetails) {
    const detail = answerItem(ruledSession, environmentDetailAnswerId, {
      value: derived.environmentDetails,
    });
    if (detail) items.push(detail);
  }

  const lighting = answerItem(ruledSession, "lightingIntent");
  if (lighting) items.push(lighting);

  if (session.wizardVersion === 2) {
    const aspectRatio = answerItem(ruledSession, "aspectRatio");
    if (aspectRatio) items.push(aspectRatio);

    if (derived.promptMode === "image_to_image") {
      for (const answerId of ["referenceUsage", "transformationStrength"]) {
        const item = answerItem(ruledSession, answerId);
        if (item) items.push(item);
      }
    }
  }

  return {
    ok: true,
    session: ruledSession,
    derived,
    items,
  };
}
