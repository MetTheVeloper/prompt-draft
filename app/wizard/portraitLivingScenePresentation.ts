import type { WizardSession } from "./session";

export type PortraitLivingScenePhase =
  | "environment-choice"
  | "environment-detail"
  | "environment-refine";

export type PortraitLivingEnvironmentType = "studio" | "outdoor" | "abstract";

const LIVING_SCENE_UI_KEY = "livingSceneUi";
const ENVIRONMENT_DETAIL_ANSWER_IDS = [
  "studioDirection",
  "outdoorSetting",
  "abstractDirection",
] as const;

const ENVIRONMENT_DETAIL_ANSWER: Record<PortraitLivingEnvironmentType, string> = {
  studio: "studioDirection",
  outdoor: "outdoorSetting",
  abstract: "abstractDirection",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function userString(session: WizardSession, answerId: string) {
  const answer = session.answers[answerId];
  return answer?.source === "user" && typeof answer.value === "string"
    ? answer.value.trim()
    : "";
}

function isScenePhase(value: unknown): value is PortraitLivingScenePhase {
  return value === "environment-choice" ||
    value === "environment-detail" ||
    value === "environment-refine";
}

function storedScenePhase(session: WizardSession) {
  const raw = session.derived[LIVING_SCENE_UI_KEY];
  if (!isRecord(raw) || !isScenePhase(raw.phase)) return null;
  return raw.phase;
}

export function setPortraitLivingScenePhase(
  session: WizardSession,
  phase: PortraitLivingScenePhase,
): WizardSession {
  return {
    ...session,
    derived: {
      ...session.derived,
      [LIVING_SCENE_UI_KEY]: { phase },
    },
  };
}

export function getPortraitLivingScenePhase(
  session: WizardSession,
): PortraitLivingScenePhase {
  const explicit = storedScenePhase(session);
  if (explicit) return explicit;

  return session.answers.environmentType?.source === "user"
    ? "environment-detail"
    : "environment-choice";
}

export function getPortraitLivingSceneProgress(session: WizardSession): number | null {
  if (session.currentStepId === "environment") {
    const phase = getPortraitLivingScenePhase(session);
    if (phase === "environment-detail") return 1 / 3;
    if (phase === "environment-refine") return 1 / 2;
    return 0;
  }

  if (session.currentStepId === "lighting") {
    return session.answers.lightingIntent?.source === "user" ? 1 : 2 / 3;
  }

  return null;
}

export function portraitLivingEnvironmentDetailAnswerId(
  value: unknown,
): string | null {
  return value === "studio" || value === "outdoor" || value === "abstract"
    ? ENVIRONMENT_DETAIL_ANSWER[value]
    : null;
}

export function clearPortraitLivingEnvironmentDetailAnswers(
  session: WizardSession,
): WizardSession {
  const answers = { ...session.answers };
  for (const answerId of ENVIRONMENT_DETAIL_ANSWER_IDS) delete answers[answerId];
  return { ...session, answers };
}

export function getPortraitLivingEnvironmentDetail(
  session: WizardSession,
  environmentType: unknown,
) {
  const answerId = portraitLivingEnvironmentDetailAnswerId(environmentType);
  return answerId ? userString(session, answerId) : "";
}
