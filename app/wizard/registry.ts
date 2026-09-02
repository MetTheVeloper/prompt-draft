import { promptModules } from "../modules/registry";
import type { PromptDraftState } from "../modules/promptDraft.types";
import type { PromptVariable } from "../modules/types";
import {
  portraitWizardV2Definition,
  type WizardDefinition,
} from "./definition";
import {
  normalizeWizardEntityAnswers,
  wizardEntityToPromptVariable,
} from "./entities";
import { completePortraitWizard } from "./portraitCompletion";
import {
  applyPortraitWizardRules,
  buildPortraitDraftTitle,
  normalizePortraitSubjectReference,
} from "./portrait";
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
  | {
      ok: true;
      finalDraft: PromptDraftState;
      promptPreview: string;
    }
  | { ok: false; stage: string; issues?: unknown[] };

function createRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getPortraitVariables(session: WizardSession): PromptVariable[] {
  if (session.wizardVersion === 2) {
    return normalizeWizardEntityAnswers(session.answers.subjects?.value)
      .map(wizardEntityToPromptVariable);
  }

  const value = session.answers.subjectReference?.value;
  return value && typeof value === "object" ? [value as PromptVariable] : [];
}

function createPortraitHostContext(session: WizardSession) {
  const variables = getPortraitVariables(session);
  const targets = variables
    .map((variable) => ({
      variable,
      target: normalizePortraitSubjectReference(variable),
    }))
    .filter((item) => Boolean(item.target));
  let variableIdIndex = 0;

  return {
    modules: promptModules,
    environment: {
      subjectAssignmentTargets: targets.map(({ variable, target }) => ({
        label: variable.label || variable.value || variable.key || "Portrait Subject",
        target: target!,
      })),
    },
    idFactory: {
      variable: () =>
        variables[variableIdIndex++]?.id || createRuntimeId("wizard-variable"),
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
  draftTitle: (session: WizardSession) => string;
};

const portraitRuntime: WizardRuntimeEntry = {
  id: "portrait",
  definition: portraitWizardV2Definition,
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
      promptPreview: result.completion.compilation.output,
    };
  },
  draftTitle: (session) =>
    buildPortraitDraftTitle(
      normalizeWizardEntityAnswers(session.answers.subjects?.value),
    ),
};

const wizardRegistry = new Map<string, WizardRuntimeEntry>([
  [portraitRuntime.id, portraitRuntime],
]);

export { publicWizardIds, publicWizardRoutes };

export function resolveWizardRuntime(wizardId: string) {
  return wizardRegistry.get(wizardId) || null;
}
