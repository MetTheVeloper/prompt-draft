import type { PromptDraftState } from "../modules/promptDraft.types";
import type {
  MaterialAssignment,
  ModuleField,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import { createDefaultModuleValues } from "../utils/compileModules";
import { normalizeSemanticTargets } from "../utils/semanticTargets";
import type { SemanticReferenceCatalogSource } from "../utils/semanticReferenceCatalog";
import {
  setSemanticAssignmentScope,
  type SemanticAssignmentScopePatch,
  type SemanticAssignmentScopePolicy,
} from "./assignmentScopes";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type MaterialAssignmentProperty =
  | "material"
  | "finish"
  | "surfaceTexture"
  | "opticalCharacter"
  | "textureProminence";

export type MaterialAssignmentMutationOptions = {
  createAssignmentId?: () => string;
  semanticSources?: readonly SemanticReferenceCatalogSource[];
};

export type MaterialAssignmentMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  assignments: MaterialAssignment[];
  assignment?: MaterialAssignment;
};

const MATERIAL_BUILTINS = [
  "all_surfaces",
  "background",
  "subject",
  "outfit",
  "hair",
  "typography",
  "accents",
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

function validateTextureTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<{ values: ModuleValues; field: ModuleField }> {
  if (module.key !== "texture") {
    return domainFailure({
      code: "texture_module_invalid",
      details: { moduleKey: module.key },
    });
  }

  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = module.fields.materialAssignments;
  if (!field || field.type !== "materialAssignments") {
    return domainFailure({
      code: "material_assignments_field_missing",
      details: { moduleKey: module.key, fieldId: "materialAssignments" },
    });
  }

  return domainSuccess({ values: currentModuleValues(draft, module), field });
}

function normalizeAssignment(
  value: unknown,
  index: number,
): MaterialAssignment | null {
  if (!isRecord(value)) return null;

  const hasExplicitTargets = Array.isArray(value.targets);

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : `material-assignment-${index + 1}`,
    presetId:
      typeof value.presetId === "string" && value.presetId
        ? value.presetId
        : undefined,
    material: typeof value.material === "string" ? value.material : "",
    finish: typeof value.finish === "string" ? value.finish : "",
    surfaceTexture:
      typeof value.surfaceTexture === "string" ? value.surfaceTexture : "",
    opticalCharacter:
      typeof value.opticalCharacter === "string" ? value.opticalCharacter : "",
    textureProminence:
      typeof value.textureProminence === "string" ? value.textureProminence : "",
    conditions: Array.isArray(value.conditions)
      ? value.conditions.filter((item): item is string => typeof item === "string")
      : [],
    targets: hasExplicitTargets
      ? normalizeSemanticTargets(value.targets)
      : [{ kind: "builtin", value: "all_surfaces" }],
    exceptions: normalizeSemanticTargets(value.exceptions),
  };
}

function normalizeAssignments(value: unknown): MaterialAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeAssignment(item, index))
    .filter((item): item is MaterialAssignment => Boolean(item));
}

function validateStableIdentities(
  assignments: readonly MaterialAssignment[],
): DomainResult<true> {
  const ids = new Set<string>();

  for (const assignment of assignments) {
    const assignmentId = String(assignment.id || "").trim();
    if (!assignmentId || ids.has(assignmentId)) {
      return domainFailure({
        code: "material_assignment_identity_conflict",
        details: { assignmentId },
      });
    }
    ids.add(assignmentId);
  }

  return domainSuccess(true);
}

function readAssignments(values: ModuleValues): DomainResult<MaterialAssignment[]> {
  const assignments = normalizeAssignments(values.materialAssignments);
  const identities = validateStableIdentities(assignments);
  if (!identities.ok) return identities;
  return domainSuccess(assignments);
}

function assignmentIndexById(
  assignments: readonly MaterialAssignment[],
  assignmentId: string,
) {
  return assignments.findIndex((assignment) => assignment.id === assignmentId);
}

function assignmentNotFound(assignmentId: string) {
  return domainFailure({
    code: "material_assignment_not_found",
    path: "assignmentId",
    details: { assignmentId },
  });
}

function withAssignments(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  assignments: readonly MaterialAssignment[],
  assignment?: MaterialAssignment,
): DomainResult<MaterialAssignmentMutation> {
  const nextAssignments = cloneValue(assignments);
  const nextModuleValues: ModuleValues = {
    ...values,
    materialAssignments: nextAssignments,
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

function materialScopePolicy(
  sources: readonly SemanticReferenceCatalogSource[] = [],
): SemanticAssignmentScopePolicy {
  return {
    capability: "material",
    builtinValues: MATERIAL_BUILTINS,
    exclusiveValue: "all_surfaces",
    sources,
  };
}

function nextUniqueId(
  requested: string,
  existingIds: readonly string[],
): DomainResult<string> {
  const id = requested.trim();
  if (!id || existingIds.includes(id)) {
    return domainFailure({
      code: "material_assignment_identity_conflict",
      details: { assignmentId: id },
    });
  }
  return domainSuccess(id);
}

type MaterialPresetRecipe = Partial<MaterialAssignment> & {
  id: string;
};

function presetRecipes(field: ModuleField): MaterialPresetRecipe[] {
  const raw = field.config?.presetRecipes;
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id.trim()) {
      return [];
    }
    return [item as MaterialPresetRecipe];
  });
}

function assignmentWithProperty(
  current: MaterialAssignment,
  property: MaterialAssignmentProperty,
  value: string,
): MaterialAssignment {
  return {
    ...current,
    [property]: value,
    presetId: undefined,
  };
}

export function createPromptMaterialAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  options: MaterialAssignmentMutationOptions = {},
): DomainResult<MaterialAssignmentMutation> {
  const target = validateTextureTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;

  const idResult = nextUniqueId(
    (options.createAssignmentId || (() => randomId("material-assignment")))(),
    assignments.map((item) => item.id || ""),
  );
  if (!idResult.ok) return idResult;

  const assignment: MaterialAssignment = {
    id: idResult.value,
    material: "",
    finish: "",
    surfaceTexture: "",
    opticalCharacter: "",
    textureProminence: "",
    conditions: [],
    targets: [{ kind: "builtin", value: "all_surfaces" }],
    exceptions: [],
  };

  return withAssignments(
    draft,
    module,
    target.value.values,
    [...assignments, assignment],
    assignment,
  );
}

export function deletePromptMaterialAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
): DomainResult<MaterialAssignmentMutation> {
  const target = validateTextureTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  return withAssignments(
    draft,
    module,
    target.value.values,
    assignments.filter((_, itemIndex) => itemIndex !== index),
  );
}

export function setPromptMaterialAssignmentScope(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  patch: SemanticAssignmentScopePatch,
  options: MaterialAssignmentMutationOptions = {},
): DomainResult<MaterialAssignmentMutation> {
  const target = validateTextureTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  const current = assignments[index];
  const scopeResult = setSemanticAssignmentScope(
    {
      targets: current.targets,
      exceptions: current.exceptions || [],
    },
    patch,
    materialScopePolicy(options.semanticSources),
  );
  if (!scopeResult.ok) return scopeResult;

  const assignment: MaterialAssignment = {
    ...current,
    targets: scopeResult.value.targets,
    exceptions: scopeResult.value.exceptions,
  };
  const next = [...assignments];
  next[index] = assignment;

  return withAssignments(
    draft,
    module,
    target.value.values,
    next,
    assignment,
  );
}

export function applyPromptMaterialAssignmentPreset(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  presetId: string,
): DomainResult<MaterialAssignmentMutation> {
  const target = validateTextureTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  const current = assignments[index];
  const requestedPresetId = presetId.trim();

  if (!requestedPresetId) {
    const assignment: MaterialAssignment = {
      ...current,
      presetId: undefined,
    };
    const next = [...assignments];
    next[index] = assignment;
    return withAssignments(
      draft,
      module,
      target.value.values,
      next,
      assignment,
    );
  }

  const recipe = presetRecipes(target.value.field).find(
    (item) => item.id === requestedPresetId,
  );
  if (!recipe) {
    return domainFailure({
      code: "material_preset_not_found",
      path: "presetId",
      details: { presetId: requestedPresetId },
    });
  }

  const assignment: MaterialAssignment = {
    ...current,
    presetId: requestedPresetId,
    material: recipe.material || "",
    finish: recipe.finish || "",
    surfaceTexture: recipe.surfaceTexture || "",
    opticalCharacter: recipe.opticalCharacter || "",
    textureProminence: recipe.textureProminence || "",
    conditions: [...(recipe.conditions || [])],
    targets: cloneValue(current.targets),
    exceptions: cloneValue(current.exceptions || []),
  };
  const next = [...assignments];
  next[index] = assignment;

  return withAssignments(
    draft,
    module,
    target.value.values,
    next,
    assignment,
  );
}

export function setPromptMaterialAssignmentProperty(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  property: MaterialAssignmentProperty,
  value: string,
): DomainResult<MaterialAssignmentMutation> {
  const target = validateTextureTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  const assignment = assignmentWithProperty(
    assignments[index],
    property,
    value,
  );
  const next = [...assignments];
  next[index] = assignment;

  return withAssignments(
    draft,
    module,
    target.value.values,
    next,
    assignment,
  );
}

export function setPromptMaterialAssignmentConditions(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  conditions: readonly string[],
): DomainResult<MaterialAssignmentMutation> {
  const target = validateTextureTarget(draft, module);
  if (!target.ok) return target;

  const assignmentsResult = readAssignments(target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);

  const assignment: MaterialAssignment = {
    ...assignments[index],
    presetId: undefined,
    conditions: [...conditions],
  };
  const next = [...assignments];
  next[index] = assignment;

  return withAssignments(
    draft,
    module,
    target.value.values,
    next,
    assignment,
  );
}
