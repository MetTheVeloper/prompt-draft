import { promptModules } from "../modules/registry";
import type { PromptDraftState } from "../modules/promptDraft.types";
import type { PromptVariable } from "../modules/types";
import { portraitWizardV1Definition, type WizardDefinition } from "./definition";
import { completePortraitWizard } from "./portraitCompletion";
import { applyPortraitWizardRules, normalizePortraitSubjectReference } from "./portrait";
import { buildPortraitWizardReview } from "./portraitReview";
import { publicWizardIds, publicWizardRoutes } from "./publicRoutes";
import type { WizardSession } from "./session";

export type WizardRuntimeReviewItem = {
  id: string;
  stepId: string;
  label: string;
  value: string;
  source: "default" | "user" | "derived";
  answerId?: string;
};

export type WizardRuntimeReview =
  | {
      ok: true;
      session: WizardSession;
      items: WizardRuntimeReviewItem[];
    }
  | {
      ok: false;
      session: WizardSession;
      items: WizardRuntimeReviewItem[];
      issues: unknown[];
    };

export type WizardRuntimeCompletion =
  | { ok: true; finalDraft: PromptDraftState }
  | { ok: false; stage: string; issues?: unknown[] };

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
        ? [{ label: target.label || "Portrait Subject", target }]
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
  resolveSession: (session: WizardSession) => WizardSession;
  buildReview: (session: WizardSession) => WizardRuntimeReview;
  complete: (session: WizardSession) => Promise<WizardRuntimeCompletion>;
};

const portraitRuntime: WizardRuntimeEntry = {
  id: "portrait",
  definition: portraitWizardV1Definition,
  resolveSession: applyPortraitWizardRules,
  buildReview: (session) => buildPortraitWizardReview(session),
  complete: async (session) => {
    const result = await completePortraitWizard(
      session,
      createPortraitHostContext(session),
    );

    if (!result.ok) {
      return {
        ok: false,
        stage: result.stage,
        issues:
          result.stage === "mapping"
            ? result.mapping.issues
            : result.completion.validationIssues || result.completion.actionIssues || [],
      };
    }

    return {
      ok: true,
      finalDraft: result.completion.finalDraft,
    };
  },
};

const wizardRegistry = new Map<string, WizardRuntimeEntry>([
  [portraitRuntime.id, portraitRuntime],
]);

export { publicWizardIds, publicWizardRoutes };

export function resolveWizardRuntime(wizardId: string) {
  return wizardRegistry.get(wizardId) || null;
}
