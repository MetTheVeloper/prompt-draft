import {
  createWizardEntity,
  defaultWizardEntityDefinition,
  normalizeWizardEntityAnswers,
  type WizardEntityAnswer,
  type WizardEntityPromptMode,
} from "./entities";
import type { WizardSession } from "./session";

export type WizardLivingChapter = {
  id: string;
  label: string;
};

export type WizardLivingSentenceToken = {
  id: string;
  text: string;
  answerId?: string;
  stepId?: string;
  editable: boolean;
  dim?: boolean;
};

export type PortraitLivingPeopleState = "choice" | "count" | "configure";

type PortraitLivingUiState = {
  peopleState?: PortraitLivingPeopleState;
};

const LIVING_UI_KEY = "livingUi";

export const PORTRAIT_LIVING_CHAPTERS: readonly WizardLivingChapter[] = [
  { id: "start", label: "BEGIN" },
  { id: "subjects", label: "PEOPLE" },
  { id: "portrait", label: "PORTRAIT" },
  { id: "appearance", label: "LOOK" },
  { id: "composition", label: "COMPOSITION" },
  { id: "scene", label: "SCENE" },
  { id: "final", label: "FINAL" },
  { id: "review", label: "REVIEW" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function userAnswer(session: WizardSession, answerId: string) {
  const answer = session.answers[answerId];
  return answer?.source === "user" ? answer.value : undefined;
}

function livingUiState(session: WizardSession): PortraitLivingUiState {
  const value = session.derived[LIVING_UI_KEY];
  if (!isRecord(value)) return {};

  const peopleState = value.peopleState;
  return peopleState === "choice" || peopleState === "count" || peopleState === "configure"
    ? { peopleState }
    : {};
}

export function setPortraitLivingPeopleState(
  session: WizardSession,
  peopleState: PortraitLivingPeopleState,
): WizardSession {
  return {
    ...session,
    derived: {
      ...session.derived,
      [LIVING_UI_KEY]: {
        ...livingUiState(session),
        peopleState,
      },
    },
  };
}

export function getPortraitLivingPeopleState(
  session: WizardSession,
): PortraitLivingPeopleState {
  const explicit = livingUiState(session).peopleState;
  if (explicit) return explicit;

  const subjectsAnswer = session.answers.subjects;
  const subjects = normalizeWizardEntityAnswers(subjectsAnswer?.value);
  return subjectsAnswer?.source === "user" && subjects.length > 1
    ? "configure"
    : "choice";
}

export function getPortraitLivingChapterProgress(
  session: WizardSession,
): number | null {
  if (session.currentStepId !== "subjects") return null;

  const peopleState = getPortraitLivingPeopleState(session);
  if (peopleState === "count") return 1 / 3;
  if (peopleState === "configure") return 2 / 3;
  return 0;
}

export function getPortraitLivingPromptMode(
  session: WizardSession,
): WizardEntityPromptMode {
  return session.answers.creationMode?.value === "from_description"
    ? "text_to_image"
    : "image_to_image";
}

export function createPortraitLivingSubjects(
  count: 1 | 2 | 3 | 4,
  mode: WizardEntityPromptMode,
): WizardEntityAnswer[] {
  const subjects: WizardEntityAnswer[] = [];

  while (subjects.length < count) {
    const entity = createWizardEntity("person", subjects);
    subjects.push({
      ...entity,
      definition: defaultWizardEntityDefinition(mode),
    });
  }

  return subjects;
}

function optionLabel(value: unknown, labels: Record<string, string>) {
  const key = cleanText(value);
  return key ? labels[key] || key.replaceAll("_", " ") : "";
}

export function buildPortraitLivingSentenceTokens(
  session: WizardSession,
): WizardLivingSentenceToken[] {
  const creationMode = cleanText(userAnswer(session, "creationMode"));
  if (!creationMode) {
    return [
      {
        id: "intent-placeholder",
        text: "I want to...",
        editable: false,
        dim: true,
      },
    ];
  }

  const tokens: WizardLivingSentenceToken[] = [
    { id: "lead", text: "I want to ", editable: false },
    {
      id: "creation-mode",
      text: creationMode === "from_description" ? "create" : "transform my image into",
      answerId: "creationMode",
      stepId: "start",
      editable: true,
    },
    { id: "mode-space", text: " ", editable: false },
  ];

  const portraitIntent = cleanText(userAnswer(session, "portraitIntent"));
  const portraitLabel = optionLabel(portraitIntent, {
    professional: "a professional portrait",
    cinematic: "a cinematic portrait",
    fashion: "a fashion portrait",
    fantasy: "a fantasy portrait",
  });

  if (portraitLabel) {
    tokens.push({
      id: "portrait-intent",
      text: portraitLabel,
      answerId: "portraitIntent",
      stepId: "intent",
      editable: true,
    });
  } else {
    tokens.push({
      id: "portrait-placeholder",
      text: "a portrait",
      editable: false,
      dim: true,
    });
  }

  const subjectsAnswer = session.answers.subjects;
  const subjects = subjectsAnswer?.source === "user"
    ? normalizeWizardEntityAnswers(subjectsAnswer.value)
    : [];

  if (subjects.length === 1) {
    tokens.push({
      id: "people",
      text: " of one person",
      answerId: "subjects",
      stepId: "subjects",
      editable: true,
    });
  } else if (subjects.length > 1) {
    tokens.push({
      id: "people",
      text: ` featuring ${subjects.length} people`,
      answerId: "subjects",
      stepId: "subjects",
      editable: true,
    });
  }

  const lookParts: Array<{
    id: string;
    text: string;
    answerId: string;
  }> = [];
  const expression = cleanText(userAnswer(session, "expressionIntent"));
  const hair = cleanText(userAnswer(session, "hairIntent"));
  const outfit = cleanText(userAnswer(session, "outfitIntent"));

  if (expression) {
    lookParts.push({
      id: "expression",
      text: `${optionLabel(expression, {})} expressions`,
      answerId: "expressionIntent",
    });
  }
  if (hair && hair !== "keep_reference") {
    lookParts.push({
      id: "hair",
      text: `${optionLabel(hair, {})} hair`,
      answerId: "hairIntent",
    });
  }
  if (outfit && outfit !== "keep_reference") {
    lookParts.push({
      id: "outfit",
      text: `${optionLabel(outfit, {})} outfits`,
      answerId: "outfitIntent",
    });
  }

  if (lookParts.length) {
    tokens.push({ id: "look-lead", text: ", with ", editable: false });
    lookParts.forEach((part, index) => {
      tokens.push({
        id: part.id,
        text: part.text,
        answerId: part.answerId,
        stepId: "appearance",
        editable: true,
      });
      if (index < lookParts.length - 1) {
        tokens.push({
          id: `look-separator-${index}`,
          text: ", ",
          editable: false,
        });
      }
    });
  }

  const framing = cleanText(userAnswer(session, "framingIntent"));
  if (framing) {
    tokens.push({
      id: "framing",
      text: `, ${optionLabel(framing, {
        headshot: "framed as a headshot",
        head_shoulders: "framed head and shoulders",
        half_body: "at half body",
        full_body: "full body",
      })}`,
      answerId: "framingIntent",
      stepId: "composition",
      editable: true,
    });
  }

  const pose = cleanText(userAnswer(session, "poseIntent"));
  if (pose && framing !== "headshot") {
    tokens.push({
      id: "pose",
      text: `, in a ${optionLabel(pose, {})} pose`,
      answerId: "poseIntent",
      stepId: "composition",
      editable: true,
    });
  }

  const environment = cleanText(userAnswer(session, "environmentType"));
  if (environment) {
    tokens.push({
      id: "scene",
      text: `, ${optionLabel(environment, {
        studio: "set in a studio",
        outdoor: "set outdoors",
        abstract: "in an abstract space",
      })}`,
      answerId: "environmentType",
      stepId: "environment",
      editable: true,
    });

    const detailAnswerId = environment === "outdoor"
      ? "outdoorSetting"
      : environment === "abstract"
        ? "abstractDirection"
        : "studioDirection";
    const detail = cleanText(userAnswer(session, detailAnswerId));
    if (detail) {
      tokens.push({
        id: "scene-detail",
        text: ` — ${detail.toLowerCase()}`,
        answerId: detailAnswerId,
        stepId: "environment",
        editable: true,
      });
    }
  }

  const lighting = cleanText(userAnswer(session, "lightingIntent"));
  if (lighting) {
    tokens.push({
      id: "lighting",
      text: `, with ${optionLabel(lighting, {})} lighting`,
      answerId: "lightingIntent",
      stepId: "lighting",
      editable: true,
    });
  }

  return tokens;
}
