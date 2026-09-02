import {
  createWizardEntity,
  defaultWizardEntityDefinition,
  getWizardEntityDisplayLabel,
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

export type WizardLivingTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export type WizardLivingLocalizer = {
  t: WizardLivingTranslate;
  list: (items: readonly string[]) => string;
};

export type PortraitLivingPeopleState = "choice" | "count" | "configure";
export type PortraitLivingLookDomain = "expression" | "hair" | "outfit";
export type PortraitLivingLookPhase = "choice" | "refine";
export type PortraitLivingLookState = {
  domain: PortraitLivingLookDomain;
  phase: PortraitLivingLookPhase;
};
export type PortraitLivingCompositionPhase =
  | "framing"
  | "pose-choice"
  | "pose-refine";

type PortraitLivingUiState = {
  peopleState?: PortraitLivingPeopleState;
  lookDomain?: PortraitLivingLookDomain;
  lookPhase?: PortraitLivingLookPhase;
  compositionPhase?: PortraitLivingCompositionPhase;
};

const LIVING_UI_KEY = "livingUi";
const PORTRAIT_POSE_ANSWER_IDS = [
  "poseIntent",
  "poseOptions",
  "poseSubjectOverrides",
] as const;

export const PORTRAIT_LIVING_CHAPTERS: readonly WizardLivingChapter[] = [
  { id: "start", label: "wizard.living.chapters.begin" },
  { id: "subjects", label: "wizard.living.chapters.people" },
  { id: "portrait", label: "wizard.living.chapters.portrait" },
  { id: "appearance", label: "wizard.living.chapters.look" },
  { id: "composition", label: "wizard.living.chapters.composition" },
  { id: "scene", label: "wizard.living.chapters.scene" },
  { id: "final", label: "wizard.living.chapters.final" },
  { id: "review", label: "wizard.living.chapters.review" },
];

export const PORTRAIT_LIVING_LOOK_ANSWER_IDS = {
  expression: {
    intent: "expressionIntent",
    options: "expressionOptions",
    overrides: "expressionSubjectOverrides",
  },
  hair: {
    intent: "hairIntent",
    options: "hairOptions",
    overrides: "hairSubjectOverrides",
  },
  outfit: {
    intent: "outfitIntent",
    options: "outfitOptions",
    overrides: "outfitSubjectOverrides",
  },
} as const;

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

function isLookDomain(value: unknown): value is PortraitLivingLookDomain {
  return value === "expression" || value === "hair" || value === "outfit";
}

function isLookPhase(value: unknown): value is PortraitLivingLookPhase {
  return value === "choice" || value === "refine";
}

function isCompositionPhase(value: unknown): value is PortraitLivingCompositionPhase {
  return value === "framing" || value === "pose-choice" || value === "pose-refine";
}

function livingUiState(session: WizardSession): PortraitLivingUiState {
  const value = session.derived[LIVING_UI_KEY];
  if (!isRecord(value)) return {};

  const peopleState = value.peopleState;
  const lookDomain = value.lookDomain;
  const lookPhase = value.lookPhase;
  const compositionPhase = value.compositionPhase;
  return {
    ...(peopleState === "choice" || peopleState === "count" || peopleState === "configure"
      ? { peopleState }
      : {}),
    ...(isLookDomain(lookDomain) ? { lookDomain } : {}),
    ...(isLookPhase(lookPhase) ? { lookPhase } : {}),
    ...(isCompositionPhase(compositionPhase) ? { compositionPhase } : {}),
  };
}

function mergeLivingUiState(
  session: WizardSession,
  patch: Partial<PortraitLivingUiState>,
): WizardSession {
  return {
    ...session,
    derived: {
      ...session.derived,
      [LIVING_UI_KEY]: {
        ...livingUiState(session),
        ...patch,
      },
    },
  };
}

export function setPortraitLivingPeopleState(
  session: WizardSession,
  peopleState: PortraitLivingPeopleState,
): WizardSession {
  return mergeLivingUiState(session, { peopleState });
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

export function setPortraitLivingLookState(
  session: WizardSession,
  state: PortraitLivingLookState,
): WizardSession {
  return mergeLivingUiState(session, {
    lookDomain: state.domain,
    lookPhase: state.phase,
  });
}

export function getPortraitLivingLookState(
  session: WizardSession,
): PortraitLivingLookState {
  const ui = livingUiState(session);
  if (ui.lookDomain && ui.lookPhase) {
    return { domain: ui.lookDomain, phase: ui.lookPhase };
  }

  if (session.answers.outfitIntent?.source === "user") {
    return { domain: "outfit", phase: "refine" };
  }
  if (session.answers.hairIntent?.source === "user") {
    return { domain: "hair", phase: "refine" };
  }
  if (session.answers.expressionIntent?.source === "user") {
    return { domain: "expression", phase: "refine" };
  }
  return { domain: "expression", phase: "choice" };
}

export function setPortraitLivingCompositionPhase(
  session: WizardSession,
  compositionPhase: PortraitLivingCompositionPhase,
): WizardSession {
  return mergeLivingUiState(session, { compositionPhase });
}

export function getPortraitLivingCompositionPhase(
  session: WizardSession,
): PortraitLivingCompositionPhase {
  const explicit = livingUiState(session).compositionPhase;
  if (explicit) return explicit;

  const framing = cleanText(userAnswer(session, "framingIntent"));
  if (!framing || framing === "headshot") return "framing";
  return session.answers.poseIntent?.source === "user"
    ? "pose-refine"
    : "pose-choice";
}

export function clearPortraitLivingPoseAnswers(session: WizardSession): WizardSession {
  const answers = { ...session.answers };
  for (const answerId of PORTRAIT_POSE_ANSWER_IDS) delete answers[answerId];
  return { ...session, answers };
}

export function getPortraitLivingChapterProgress(
  session: WizardSession,
): number | null {
  if (session.currentStepId === "subjects") {
    const peopleState = getPortraitLivingPeopleState(session);
    if (peopleState === "count") return 1 / 3;
    if (peopleState === "configure") return 1;
    return 0;
  }

  if (session.currentStepId === "appearance") {
    const look = getPortraitLivingLookState(session);
    if (look.domain === "expression") return look.phase === "refine" ? 1 / 6 : 0;
    if (look.domain === "hair") return look.phase === "refine" ? 1 / 2 : 1 / 3;
    return look.phase === "refine" ? 1 : 2 / 3;
  }

  if (session.currentStepId === "composition") {
    const phase = getPortraitLivingCompositionPhase(session);
    if (phase === "pose-choice") return 1 / 2;
    if (phase === "pose-refine") return 1;
    return cleanText(userAnswer(session, "framingIntent")) === "headshot" ? 1 : 0;
  }

  return null;
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

function optionLabel(value: unknown) {
  const key = cleanText(value);
  return key ? key.replaceAll("_", " ") : "";
}

function lookOverridePhrases(
  session: WizardSession,
  subjects: readonly WizardEntityAnswer[],
  answerId: string,
  domain: PortraitLivingLookDomain,
  localizer: WizardLivingLocalizer,
) {
  const value = userAnswer(session, answerId);
  if (!isRecord(value)) return [];

  return subjects.flatMap((subject, index) => {
    const raw = value[subject.id];
    if (!isRecord(raw)) return [];
    const name = getWizardEntityDisplayLabel(subject, index, subjects.length);
    const intent = cleanText(raw.intent);

    if (!intent) {
      return [localizer.t("wizard.living.sentence.override.customDetails", { name, domain })];
    }
    if (domain === "expression") {
      return [localizer.t("wizard.living.sentence.override.expression", {
        name,
        value: optionLabel(intent),
      })];
    }
    if (domain === "hair") {
      return intent === "keep_reference"
        ? [localizer.t("wizard.living.sentence.override.hairReference", { name })]
        : [localizer.t("wizard.living.sentence.override.hair", {
            name,
            value: optionLabel(intent),
          })];
    }
    return intent === "keep_reference"
      ? [localizer.t("wizard.living.sentence.override.outfitReference", { name })]
      : [localizer.t("wizard.living.sentence.override.outfit", {
          name,
          value: optionLabel(intent),
        })];
  });
}

function poseOverridePhrases(
  session: WizardSession,
  subjects: readonly WizardEntityAnswer[],
  localizer: WizardLivingLocalizer,
) {
  const value = userAnswer(session, "poseSubjectOverrides");
  if (!isRecord(value)) return [];

  return subjects.flatMap((subject, index) => {
    const raw = value[subject.id];
    if (!isRecord(raw)) return [];
    const name = getWizardEntityDisplayLabel(subject, index, subjects.length);
    const intent = cleanText(raw.intent);
    return [intent
      ? localizer.t("wizard.living.sentence.override.pose", {
          name,
          value: optionLabel(intent),
        })
      : localizer.t("wizard.living.sentence.override.customDetails", {
          name,
          domain: "pose",
        })];
  });
}

export function buildPortraitLivingSentenceTokens(
  session: WizardSession,
  localizer: WizardLivingLocalizer,
): WizardLivingSentenceToken[] {
  const { t } = localizer;
  const creationMode = cleanText(userAnswer(session, "creationMode"));
  if (!creationMode) {
    return [{
      id: "intent-placeholder",
      text: t("wizard.living.sentence.placeholder"),
      editable: false,
      dim: true,
    }];
  }

  const tokens: WizardLivingSentenceToken[] = [
    { id: "lead", text: t("wizard.living.sentence.lead"), editable: false },
    {
      id: "creation-mode",
      text: t(creationMode === "from_description"
        ? "wizard.living.sentence.create"
        : "wizard.living.sentence.transform"),
      answerId: "creationMode",
      stepId: "start",
      editable: true,
    },
    { id: "mode-space", text: " ", editable: false },
  ];

  const portraitIntent = cleanText(userAnswer(session, "portraitIntent"));
  if (portraitIntent) {
    tokens.push({
      id: "portrait-intent",
      text: t(`wizard.living.sentence.portrait.${portraitIntent}`),
      answerId: "portraitIntent",
      stepId: "intent",
      editable: true,
    });
  } else {
    tokens.push({
      id: "portrait-placeholder",
      text: t("wizard.living.sentence.portraitPlaceholder"),
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
      text: t("wizard.living.sentence.onePerson"),
      answerId: "subjects",
      stepId: "subjects",
      editable: true,
    });
  } else if (subjects.length > 1) {
    tokens.push({
      id: "people",
      text: t("wizard.living.sentence.multiplePeople", { count: subjects.length }),
      answerId: "subjects",
      stepId: "subjects",
      editable: true,
    });
  }

  const lookParts: Array<{ id: string; text: string; answerId: string }> = [];
  const expression = cleanText(userAnswer(session, "expressionIntent"));
  const hair = cleanText(userAnswer(session, "hairIntent"));
  const outfit = cleanText(userAnswer(session, "outfitIntent"));

  if (expression) {
    lookParts.push({
      id: "expression",
      text: t("wizard.living.sentence.expression", { value: optionLabel(expression) }),
      answerId: "expressionIntent",
    });
  }
  if (hair && hair !== "keep_reference") {
    lookParts.push({
      id: "hair",
      text: t("wizard.living.sentence.hair", { value: optionLabel(hair) }),
      answerId: "hairIntent",
    });
  }
  if (outfit && outfit !== "keep_reference") {
    lookParts.push({
      id: "outfit",
      text: t("wizard.living.sentence.outfit", { value: optionLabel(outfit) }),
      answerId: "outfitIntent",
    });
  }

  if (lookParts.length) {
    tokens.push({ id: "look-lead", text: t("wizard.living.sentence.lookLead"), editable: false });
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
          text: t("wizard.living.sentence.separator"),
          editable: false,
        });
      }
    });
  }

  if (subjects.length > 1) {
    const overrideTokens = [
      { id: "expression-overrides", answerId: "expressionSubjectOverrides", domain: "expression" },
      { id: "hair-overrides", answerId: "hairSubjectOverrides", domain: "hair" },
      { id: "outfit-overrides", answerId: "outfitSubjectOverrides", domain: "outfit" },
    ] as const;

    for (const item of overrideTokens) {
      const phrases = lookOverridePhrases(session, subjects, item.answerId, item.domain, localizer);
      if (!phrases.length) continue;
      tokens.push({
        id: item.id,
        text: t("wizard.living.sentence.overrideLead", { value: localizer.list(phrases) }),
        answerId: item.answerId,
        stepId: "appearance",
        editable: true,
      });
    }
  }

  const framing = cleanText(userAnswer(session, "framingIntent"));
  if (framing) {
    const framingKeys: Record<string, string> = {
      headshot: "headshot",
      head_shoulders: "headShoulders",
      half_body: "halfBody",
      full_body: "fullBody",
    };
    const key = framingKeys[framing];
    if (key) {
      tokens.push({
        id: "framing",
        text: t(`wizard.living.sentence.framing.${key}`),
        answerId: "framingIntent",
        stepId: "composition",
        editable: true,
      });
    }
  }

  const pose = cleanText(userAnswer(session, "poseIntent"));
  if (pose && framing !== "headshot") {
    tokens.push({
      id: "pose",
      text: t("wizard.living.sentence.pose", { value: optionLabel(pose) }),
      answerId: "poseIntent",
      stepId: "composition",
      editable: true,
    });

    if (subjects.length > 1) {
      const phrases = poseOverridePhrases(session, subjects, localizer);
      if (phrases.length) {
        tokens.push({
          id: "pose-overrides",
          text: t("wizard.living.sentence.overrideLead", { value: localizer.list(phrases) }),
          answerId: "poseSubjectOverrides",
          stepId: "composition",
          editable: true,
        });
      }
    }
  }

  const environment = cleanText(userAnswer(session, "environmentType"));
  if (environment) {
    tokens.push({
      id: "scene",
      text: t(`wizard.living.sentence.scene.${environment}`),
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
        text: t("wizard.living.sentence.scene.detail", { value: detail.toLowerCase() }),
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
      text: t("wizard.living.sentence.lighting", { value: optionLabel(lighting) }),
      answerId: "lightingIntent",
      stepId: "lighting",
      editable: true,
    });
  }

  return tokens;
}
