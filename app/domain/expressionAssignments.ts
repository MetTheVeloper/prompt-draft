import type { PromptDraftState } from "../modules/promptDraft.types";
import type {
  ExpressionAssignment,
  ModuleField,
  ModuleValues,
  PromptKeyModule,
  SemanticTargetRef,
} from "../modules/types";
import { createDefaultModuleValues } from "../utils/compileModules";
import type { SemanticReferenceCatalogSource } from "../utils/semanticReferenceCatalog";
import { normalizeSemanticTargets } from "../utils/semanticTargets";
import {
  firstAvailableSubjectAssignmentTarget,
  setSubjectAssignmentTargets,
} from "./subjectAssignmentTargets";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type ExpressionAssignmentPatch = Partial<Pick<
  ExpressionAssignment,
  | "coreExpression"
  | "intensity"
  | "eyeState"
  | "browState"
  | "mouthState"
  | "additionalDetails"
  | "targets"
>>;

export type ExpressionAssignmentMutationOptions = {
  createAssignmentId?: () => string;
  subjectSources?: readonly SemanticReferenceCatalogSource[];
};

export type ExpressionAssignmentMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  assignments: ExpressionAssignment[];
  assignment?: ExpressionAssignment;
};

const PAYLOAD_KEYS = [
  "coreExpression",
  "intensity",
  "eyeState",
  "browState",
  "mouthState",
  "additionalDetails",
] as const;

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  return draft.moduleValues[module.key]
    ? cloneValue(draft.moduleValues[module.key])
    : createDefaultModuleValues(module);
}

function validateExpressionTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<{ values: ModuleValues; field: ModuleField }> {
  if (module.key !== "expression") {
    return domainFailure({
      code: "expression_module_invalid",
      details: { moduleKey: module.key },
    });
  }

  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = module.fields.expressionAssignments;
  if (!field || field.type !== "expressionAssignments") {
    return domainFailure({
      code: "expression_assignments_field_missing",
      details: { moduleKey: module.key, fieldId: "expressionAssignments" },
    });
  }

  return domainSuccess({ values: currentModuleValues(draft, module), field });
}

function normalizeAssignment(
  value: unknown,
  index: number,
): ExpressionAssignment | null {
  if (!isRecord(value)) return null;

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `expression-assignment-${index + 1}`,
    presetId:
      typeof value.presetId === "string" && value.presetId
        ? value.presetId
        : undefined,
    coreExpression:
      typeof value.coreExpression === "string" ? value.coreExpression : "",
    intensity: typeof value.intensity === "string" ? value.intensity : "",
    eyeState: typeof value.eyeState === "string" ? value.eyeState : "",
    browState: typeof value.browState === "string" ? value.browState : "",
    mouthState: typeof value.mouthState === "string" ? value.mouthState : "",
    additionalDetails:
      typeof value.additionalDetails === "string" ? value.additionalDetails : "",
    targets: normalizeSemanticTargets(value.targets),
  };
}

function normalizeAssignments(value: unknown): ExpressionAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeAssignment(item, index))
    .filter((item): item is ExpressionAssignment => Boolean(item));
}

function readAssignments(
  values: ModuleValues,
): DomainResult<ExpressionAssignment[]> {
  const assignments = normalizeAssignments(values.expressionAssignments);
  const ids = new Set<string>();

  for (const assignment of assignments) {
    const id = String(assignment.id || "").trim();
    if (!id || ids.has(id)) {
      return domainFailure({
        code: "expression_assignment_identity_conflict",
        details: { assignmentId: id },
      });
    }
    ids.add(id);
  }

  return domainSuccess(assignments);
}

function assignmentNotFound(assignmentId: string) {
  return domainFailure({
    code: "expression_assignment_not_found",
    path: "assignmentId",
    details: { assignmentId },
  });
}

function withAssignments(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  assignments: readonly ExpressionAssignment[],
  assignment?: ExpressionAssignment,
): DomainResult<ExpressionAssignmentMutation> {
  const nextAssignments = cloneValue(assignments);
  const nextModuleValues: ModuleValues = {
    ...values,
    expressionAssignments: nextAssignments,
  };
  const nextDraft = cloneValue(draft);
  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [module.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    assignments: cloneValue(nextAssignments),
    assignment: assignment ? cloneValue(assignment) : undefined,
  });
}

function presetRecipes(field: ModuleField) {
  const raw = field.config?.presetRecipes;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is Record<string, unknown> & { id: string } =>
      isRecord(item) && typeof item.id === "string" && Boolean(item.id.trim()),
  );
}

export function createPromptExpressionAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  options: ExpressionAssignmentMutationOptions = {},
): DomainResult<ExpressionAssignmentMutation> {
  const target = validateExpressionTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const id = (
    options.createAssignmentId || (() => randomId("expression-assignment"))
  )().trim();
  if (!id || assignments.some((item) => item.id === id)) {
    return domainFailure({
      code: "expression_assignment_identity_conflict",
      details: { assignmentId: id },
    });
  }

  const firstTarget = firstAvailableSubjectAssignmentTarget({
    sources: options.subjectSources,
  });
  const assignment: ExpressionAssignment = {
    id,
    coreExpression: "",
    intensity: "",
    eyeState: "",
    browState: "",
    mouthState: "",
    additionalDetails: "",
    targets: firstTarget ? [firstTarget] : [],
  };

  return withAssignments(
    draft,
    module,
    target.value.values,
    [...assignments, assignment],
    assignment,
  );
}

export function updatePromptExpressionAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  patch: ExpressionAssignmentPatch,
  options: ExpressionAssignmentMutationOptions = {},
): DomainResult<ExpressionAssignmentMutation> {
  const target = validateExpressionTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignments.findIndex((item) => item.id === assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  const current = assignments[index];
  let nextTargets = current.targets;
  if (patch.targets !== undefined) {
    const targetResult = setSubjectAssignmentTargets(
      current.targets,
      patch.targets,
      { sources: options.subjectSources },
    );
    if (!targetResult.ok) return targetResult;
    nextTargets = targetResult.value;
  }

  const payloadChanged = PAYLOAD_KEYS.some((key) => patch[key] !== undefined);
  const assignment: ExpressionAssignment = {
    ...current,
    ...(patch.coreExpression !== undefined
      ? { coreExpression: patch.coreExpression }
      : {}),
    ...(patch.intensity !== undefined ? { intensity: patch.intensity } : {}),
    ...(patch.eyeState !== undefined ? { eyeState: patch.eyeState } : {}),
    ...(patch.browState !== undefined ? { browState: patch.browState } : {}),
    ...(patch.mouthState !== undefined ? { mouthState: patch.mouthState } : {}),
    ...(patch.additionalDetails !== undefined
      ? { additionalDetails: patch.additionalDetails }
      : {}),
    targets: cloneValue(nextTargets),
    ...(payloadChanged ? { presetId: undefined } : {}),
  };
  const next = [...assignments];
  next[index] = assignment;

  return withAssignments(draft, module, target.value.values, next, assignment);
}

export function deletePromptExpressionAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
): DomainResult<ExpressionAssignmentMutation> {
  const target = validateExpressionTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignments.findIndex((item) => item.id === assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  return withAssignments(
    draft,
    module,
    target.value.values,
    assignments.filter((_, itemIndex) => itemIndex !== index),
  );
}

export function applyPromptExpressionAssignmentPreset(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  presetId: string,
): DomainResult<ExpressionAssignmentMutation> {
  const target = validateExpressionTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignments.findIndex((item) => item.id === assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  const current = assignments[index];
  const requestedPresetId = presetId.trim();
  let assignment: ExpressionAssignment;

  if (!requestedPresetId) {
    assignment = { ...current, presetId: undefined };
  } else {
    const recipe = presetRecipes(target.value.field).find(
      (item) => item.id === requestedPresetId,
    );
    if (!recipe) {
      return domainFailure({
        code: "expression_preset_not_found",
        path: "presetId",
        details: { presetId: requestedPresetId },
      });
    }

    assignment = {
      ...current,
      presetId: requestedPresetId,
      coreExpression:
        typeof recipe.coreExpression === "string" ? recipe.coreExpression : "",
      intensity: typeof recipe.intensity === "string" ? recipe.intensity : "",
      eyeState: typeof recipe.eyeState === "string" ? recipe.eyeState : "",
      browState: typeof recipe.browState === "string" ? recipe.browState : "",
      mouthState: typeof recipe.mouthState === "string" ? recipe.mouthState : "",
      additionalDetails: current.additionalDetails || "",
      targets: cloneValue(current.targets),
    };
  }

  const next = [...assignments];
  next[index] = assignment;
  return withAssignments(draft, module, target.value.values, next, assignment);
}
