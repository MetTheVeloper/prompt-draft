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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function questionValueLabel(
  session: WizardSession,
  question: WizardQuestionDefinition,
  value: unknown,
) {
  if (question.type === "singleChoice" && typeof value === "string") {
    return question.options.find((option) => option.value === value)?.label || value;
  }

  if (question.type === "entityCollection") {
    return normalizeWizardEntityAnswers(value)
      .map(getWizardEntityDisplayLabel)
      .join(", ");
  }

  if (question.type === "modalOptions" && isRecord(value)) {
    return question.fields
      .map((field) => {
        const rawValue = cleanText(value[field.id]);
        if (!rawValue) return "";

        const displayValue = field.type === "singleChoice"
          ? field.options.find((option) => option.value === rawValue)?.label || rawValue
          : rawValue;

        return `${field.title}: ${displayValue}`;
      })
      .filter(Boolean)
      .join(" · ");
  }

  if (question.type === "subjectOverrides" && isRecord(value)) {
    const customizedIds = new Set(
      Object.entries(value)
        .filter(([, entry]) => isRecord(entry))
        .map(([subjectId]) => subjectId),
    );
    return normalizeWizardEntityAnswers(
      session.answers[question.subjectsAnswerId]?.value,
    )
      .filter((subject) => customizedIds.has(subject.id))
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

  const value =
    options.value ?? questionValueLabel(session, definition.question, answer?.value);
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
    for (const answerId of ["creationMode", "subjects"] as const) {
      const item = answerItem(ruledSession, answerId);
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
    "expressionOptions",
    "expressionSubjectOverrides",
    "hairIntent",
    "hairOptions",
    "hairSubjectOverrides",
    "outfitIntent",
    "outfitOptions",
    "outfitSubjectOverrides",
    "framingIntent",
    "poseIntent",
    "poseSubjectOverrides",
    "environmentType",
    "backgroundOptions",
  ]) {
    if (
      (answerId === "poseIntent" || answerId === "poseSubjectOverrides") &&
      !derived.poseIntent
    ) continue;
    if (answerId === "outfitOptions" && derived.outfitIntent === "keep_reference") {
      continue;
    }
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
    const idea = answerItem(ruledSession, "idea", {
      value: derived.promptIdea,
      label: "Idea",
    });
    if (idea) items.push(idea);

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
