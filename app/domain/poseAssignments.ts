import type { PromptDraftState } from "../modules/promptDraft.types";
import type {
  ModuleField,
  ModuleValues,
  PoseAssignment,
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

export type PoseAssignmentPatch = Partial<Pick<
  PoseAssignment,
  | "basePosture"
  | "torsoPosture"
  | "weightBalance"
  | "bodyTension"
  | "locomotion"
  | "gestures"
  | "interactionDetails"
  | "additionalDetails"
  | "targets"
>>;

export type PoseAssignmentMutationOptions = {
  createAssignmentId?: () => string;
  subjectSources?: readonly SemanticReferenceCatalogSource[];
};

export type PoseAssignmentMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  assignments: PoseAssignment[];
  assignment?: PoseAssignment;
};

const PAYLOAD_KEYS = [
  "basePosture",
  "torsoPosture",
  "weightBalance",
  "bodyTension",
  "locomotion",
  "gestures",
  "interactionDetails",
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

function validatePoseTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<{ values: ModuleValues; field: ModuleField }> {
  if (module.key !== "pose") {
    return domainFailure({
      code: "pose_module_invalid",
      details: { moduleKey: module.key },
    });
  }

  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = module.fields.poseAssignments;
  if (!field || field.type !== "poseAssignments") {
    return domainFailure({
      code: "pose_assignments_field_missing",
      details: { moduleKey: module.key, fieldId: "poseAssignments" },
    });
  }

  return domainSuccess({ values: currentModuleValues(draft, module), field });
}

function normalizeAssignment(value: unknown, index: number): PoseAssignment | null {
  if (!isRecord(value)) return null;

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `pose-assignment-${index + 1}`,
    presetId:
      typeof value.presetId === "string" && value.presetId
        ? value.presetId
        : undefined,
    basePosture: typeof value.basePosture === "string" ? value.basePosture : "",
    torsoPosture: typeof value.torsoPosture === "string" ? value.torsoPosture : "",
    weightBalance: typeof value.weightBalance === "string" ? value.weightBalance : "",
    bodyTension: typeof value.bodyTension === "string" ? value.bodyTension : "",
    locomotion: typeof value.locomotion === "string" ? value.locomotion : "",
    gestures: Array.isArray(value.gestures)
      ? value.gestures.filter((item): item is string => typeof item === "string")
      : [],
    interactionDetails:
      typeof value.interactionDetails === "string" ? value.interactionDetails : "",
    additionalDetails:
      typeof value.additionalDetails === "string" ? value.additionalDetails : "",
    targets: normalizeSemanticTargets(value.targets),
  };
}

function normalizeAssignments(value: unknown): PoseAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeAssignment(item, index))
    .filter((item): item is PoseAssignment => Boolean(item));
}

function readAssignments(values: ModuleValues): DomainResult<PoseAssignment[]> {
  const assignments = normalizeAssignments(values.poseAssignments);
  const ids = new Set<string>();

  for (const assignment of assignments) {
    const id = String(assignment.id || "").trim();
    if (!id || ids.has(id)) {
      return domainFailure({
        code: "pose_assignment_identity_conflict",
        details: { assignmentId: id },
      });
    }
    ids.add(id);
  }

  return domainSuccess(assignments);
}

function assignmentNotFound(assignmentId: string) {
  return domainFailure({
    code: "pose_assignment_not_found",
    path: "assignmentId",
    details: { assignmentId },
  });
}

function withAssignments(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  assignments: readonly PoseAssignment[],
  assignment?: PoseAssignment,
): DomainResult<PoseAssignmentMutation> {
  const nextAssignments = cloneValue(assignments);
  const nextModuleValues: ModuleValues = {
    ...values,
    poseAssignments: nextAssignments,
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

export function createPromptPoseAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  options: PoseAssignmentMutationOptions = {},
): DomainResult<PoseAssignmentMutation> {
  const target = validatePoseTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const id = (options.createAssignmentId || (() => randomId("pose-assignment")))().trim();
  if (!id || assignments.some((item) => item.id === id)) {
    return domainFailure({
      code: "pose_assignment_identity_conflict",
      details: { assignmentId: id },
    });
  }

  const firstTarget = firstAvailableSubjectAssignmentTarget({
    sources: options.subjectSources,
  });
  const assignment: PoseAssignment = {
    id,
    basePosture: "",
    torsoPosture: "",
    weightBalance: "",
    bodyTension: "",
    locomotion: "",
    gestures: [],
    interactionDetails: "",
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

export function updatePromptPoseAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  patch: PoseAssignmentPatch,
  options: PoseAssignmentMutationOptions = {},
): DomainResult<PoseAssignmentMutation> {
  const target = validatePoseTarget(draft, module);
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
  const assignment: PoseAssignment = {
    ...current,
    ...(patch.basePosture !== undefined ? { basePosture: patch.basePosture } : {}),
    ...(patch.torsoPosture !== undefined ? { torsoPosture: patch.torsoPosture } : {}),
    ...(patch.weightBalance !== undefined ? { weightBalance: patch.weightBalance } : {}),
    ...(patch.bodyTension !== undefined ? { bodyTension: patch.bodyTension } : {}),
    ...(patch.locomotion !== undefined ? { locomotion: patch.locomotion } : {}),
    ...(patch.gestures !== undefined ? { gestures: [...patch.gestures] } : {}),
    ...(patch.interactionDetails !== undefined
      ? { interactionDetails: patch.interactionDetails }
      : {}),
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

export function deletePromptPoseAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
): DomainResult<PoseAssignmentMutation> {
  const target = validatePoseTarget(draft, module);
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

export function applyPromptPoseAssignmentPreset(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  presetId: string,
): DomainResult<PoseAssignmentMutation> {
  const target = validatePoseTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignments.findIndex((item) => item.id === assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  const current = assignments[index];
  const requestedPresetId = presetId.trim();
  let assignment: PoseAssignment;

  if (!requestedPresetId) {
    assignment = { ...current, presetId: undefined };
  } else {
    const recipe = presetRecipes(target.value.field).find(
      (item) => item.id === requestedPresetId,
    );
    if (!recipe) {
      return domainFailure({
        code: "pose_preset_not_found",
        path: "presetId",
        details: { presetId: requestedPresetId },
      });
    }

    assignment = {
      ...current,
      presetId: requestedPresetId,
      basePosture: typeof recipe.basePosture === "string" ? recipe.basePosture : "",
      torsoPosture: typeof recipe.torsoPosture === "string" ? recipe.torsoPosture : "",
      weightBalance: typeof recipe.weightBalance === "string" ? recipe.weightBalance : "",
      bodyTension: typeof recipe.bodyTension === "string" ? recipe.bodyTension : "",
      locomotion: typeof recipe.locomotion === "string" ? recipe.locomotion : "",
      gestures: Array.isArray(recipe.gestures)
        ? recipe.gestures.filter((item): item is string => typeof item === "string")
        : [],
      interactionDetails:
        typeof recipe.interactionDetails === "string" ? recipe.interactionDetails : "",
      additionalDetails: current.additionalDetails || "",
      targets: cloneValue(current.targets),
    };
  }

  const next = [...assignments];
  next[index] = assignment;
  return withAssignments(draft, module, target.value.values, next, assignment);
}
