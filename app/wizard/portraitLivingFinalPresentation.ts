import type { WizardSession } from "./session";

export type PortraitLivingFinalPhase =
  | "aspect-ratio"
  | "reference-fidelity"
  | "transformation-strength";

const LIVING_FINAL_UI_KEY = "livingFinalUi";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFinalPhase(value: unknown): value is PortraitLivingFinalPhase {
  return value === "aspect-ratio" ||
    value === "reference-fidelity" ||
    value === "transformation-strength";
}

function storedFinalPhase(session: WizardSession) {
  const raw = session.derived[LIVING_FINAL_UI_KEY];
  if (!isRecord(raw) || !isFinalPhase(raw.phase)) return null;
  return raw.phase;
}

function isUserOwned(session: WizardSession, answerId: string) {
  return session.answers[answerId]?.source === "user";
}

export function isPortraitLivingTransformMode(session: WizardSession) {
  return session.answers.creationMode?.value === "from_image";
}

export function setPortraitLivingFinalPhase(
  session: WizardSession,
  phase: PortraitLivingFinalPhase,
): WizardSession {
  return {
    ...session,
    derived: {
      ...session.derived,
      [LIVING_FINAL_UI_KEY]: { phase },
    },
  };
}

export function getPortraitLivingFinalPhase(
  session: WizardSession,
): PortraitLivingFinalPhase {
  const transformMode = isPortraitLivingTransformMode(session);
  const explicit = storedFinalPhase(session);

  if (explicit) {
    if (!transformMode && explicit !== "aspect-ratio") return "aspect-ratio";
    return explicit;
  }

  if (!transformMode) return "aspect-ratio";
  if (isUserOwned(session, "referenceUsage")) return "transformation-strength";
  if (isUserOwned(session, "aspectRatio")) return "reference-fidelity";
  return "aspect-ratio";
}

export function getPortraitLivingFinalProgress(session: WizardSession): number | null {
  if (session.currentStepId !== "final-settings") return null;

  if (!isPortraitLivingTransformMode(session)) return 0;

  const phase = getPortraitLivingFinalPhase(session);
  if (phase === "reference-fidelity") return 1 / 3;
  if (phase === "transformation-strength") return 2 / 3;
  return 0;
}
