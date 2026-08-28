import type { WizardDefinition } from "./definition";
import type { WizardSession } from "./session";

const WIZARD_SESSION_STORAGE_KEY = "prompt-draft:wizard:sessions:v1";

type PersistedWizardSession = {
  savedAt: string;
  session: WizardSession;
};

type PersistedWizardSessionCollection = {
  version: 1;
  sessions: Record<string, PersistedWizardSession>;
};

function emptyCollection(): PersistedWizardSessionCollection {
  return { version: 1, sessions: {} };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readCollection(): PersistedWizardSessionCollection {
  if (!import.meta.client) return emptyCollection();

  const raw = localStorage.getItem(WIZARD_SESSION_STORAGE_KEY);
  if (!raw) return emptyCollection();

  try {
    const parsed = JSON.parse(raw) as PersistedWizardSessionCollection;
    if (
      parsed.version !== 1 ||
      !parsed.sessions ||
      typeof parsed.sessions !== "object" ||
      Array.isArray(parsed.sessions)
    ) {
      return emptyCollection();
    }
    return parsed;
  } catch {
    return emptyCollection();
  }
}

function writeCollection(collection: PersistedWizardSessionCollection) {
  if (!import.meta.client) return;
  localStorage.setItem(WIZARD_SESSION_STORAGE_KEY, JSON.stringify(collection));
}

export function saveWizardSession(session: WizardSession) {
  if (!import.meta.client) return;

  const collection = readCollection();
  collection.sessions[session.wizardId] = {
    savedAt: new Date().toISOString(),
    session: cloneJson(session),
  };
  writeCollection(collection);
}

export function loadWizardSession(definition: WizardDefinition): WizardSession | null {
  if (!import.meta.client) return null;

  const persisted = readCollection().sessions[definition.id];
  if (!persisted) return null;

  const session = persisted.session;
  if (
    session.wizardId !== definition.id ||
    session.wizardVersion !== definition.version ||
    !definition.steps.some((step) => step.id === session.currentStepId)
  ) {
    return null;
  }

  return cloneJson(session);
}

export function clearWizardSession(wizardId: string) {
  if (!import.meta.client) return;

  const collection = readCollection();
  if (!collection.sessions[wizardId]) return;
  delete collection.sessions[wizardId];
  writeCollection(collection);
}
