import { promptModules } from "../modules/registry";
import type { PromptVariable } from "../modules/types";
import { portraitWizardV1Definition, type WizardDefinition } from "./definition";
import { completePortraitWizard } from "./portraitCompletion";
import { normalizePortraitSubjectReference } from "./portrait";
import { buildPortraitWizardReview } from "./portraitReview";
import type { WizardSession } from "./session";

function createRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getPortraitSubject(session: WizardSession) {
  const value = session.answers.subjectReference?.value;
  if (!value || typeof value !== "object") return null;
  return value as PromptVariable;
}

function createPortraitHostContext(session: WizardSession) {
  const subject = getPortraitSubject(session);
  const target = subject ? normalizePortraitSubjectReference(subject) : null;

  return {
    modules: promptModules,
    environment: {
      subjectAssignmentTargets: target
        ? [
            {
              label: target.label || "Portrait Subject",
              target,
            },
          ]
        : [],
    },
    idFactory: {
      expressionAssignment: () => createRuntimeId("expression"),
      poseAssignment: () => createRuntimeId("pose"),
      hairStyle: () => createRuntimeId("hair"),
      outfitSet: () => createRuntimeId("outfit-set"),
      outfitItem: () => createRuntimeId("outfit-item"),
    },
  };
}

export type WizardRuntimeEntry = {
  id: string;
  definition: WizardDefinition;
  buildReview: (session: WizardSession) => unknown;
  complete: (session: WizardSession) => Promise<unknown>;
};

const portraitRuntime: WizardRuntimeEntry = {
  id: "portrait",
  definition: portraitWizardV1Definition,
  buildReview: buildPortraitWizardReview,
  complete: (session) => completePortraitWizard(session, createPortraitHostContext(session)),
};

const wizardRegistry = new Map<string, WizardRuntimeEntry>([
  [portraitRuntime.id, portraitRuntime],
]);

export const publicWizardIds = [...wizardRegistry.keys()];
export const publicWizardRoutes = publicWizardIds.map((id) => `/wizard/${id}`);

export function resolveWizardRuntime(wizardId: string) {
  return wizardRegistry.get(wizardId) || null;
}
