import type { PromptDraftState } from "../modules/promptDraft.types";
import type {
  ColorPaletteRule,
  ColorPaletteSwatch,
  ModuleField,
  ModuleValues,
  PromptKeyModule,
  PromptVariable,
  SemanticTargetRef,
} from "../modules/types";
import { createDefaultModuleValues } from "../utils/compileModules";
import { getEnabledPromptVariables } from "../utils/promptVariables";
import {
  normalizeSemanticTarget,
  normalizeSemanticTargets,
} from "../utils/semanticTargets";
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

export type ColorPaletteMutationOptions = {
  createAssignmentId?: () => string;
  createSwatchId?: () => string;
  semanticSources?: readonly SemanticReferenceCatalogSource[];
};

export type ColorPaletteMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  assignments: ColorPaletteRule[];
  assignment?: ColorPaletteRule;
  swatch?: ColorPaletteSwatch;
};

const COLOR_BUILTINS = [
  "overall",
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

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  return draft.moduleValues[module.key]
    ? cloneValue(draft.moduleValues[module.key])
    : createDefaultModuleValues(module);
}

function validateColorTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<{ values: ModuleValues; field: ModuleField }> {
  if (module.key !== "colorPalette") {
    return domainFailure({
      code: "color_palette_module_invalid",
      details: { moduleKey: module.key },
    });
  }
  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }
  const field = module.fields.paletteAssignments;
  if (!field || field.type !== "colorAssignments") {
    return domainFailure({
      code: "color_palette_field_missing",
      details: { moduleKey: module.key, fieldId: "paletteAssignments" },
    });
  }
  return domainSuccess({ values: currentModuleValues(draft, module), field });
}

function presetOption(field: ModuleField, presetId?: string) {
  return presetId
    ? field.options?.find((option) => option.value === presetId)
    : undefined;
}

function literalSwatch(value: string, id: string): ColorPaletteSwatch {
  return { id, kind: "literal", value };
}

function normalizeSwatch(
  value: unknown,
  fallbackId: string,
): ColorPaletteSwatch | null {
  if (typeof value === "string") {
    return literalSwatch(value, fallbackId);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Partial<ColorPaletteSwatch>;
  if (item.kind !== "literal" && item.kind !== "variable") return null;
  if (typeof item.value !== "string") return null;
  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id : fallbackId,
    kind: item.kind,
    value: item.value,
    variableId: item.variableId,
    token: item.token,
    label: item.label,
  };
}

function legacyTarget(value: unknown): SemanticTargetRef {
  const usage = typeof value === "string" && value.trim() ? value.trim() : "overall";
  if ((COLOR_BUILTINS as readonly string[]).includes(usage)) {
    return { kind: "builtin", value: usage };
  }
  return {
    kind: "custom",
    value: usage === "lighting" ? "lighting (legacy color target)" : usage,
  };
}

function normalizeRule(
  field: ModuleField,
  value: unknown,
  ruleIndex: number,
): ColorPaletteRule | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const presetId =
    typeof item.presetId === "string"
      ? item.presetId
      : typeof item.preset === "string"
        ? item.preset
        : "";
  const rawColors = Array.isArray(item.colors) ? item.colors : [];
  let colors = rawColors
    .map((color, colorIndex) =>
      normalizeSwatch(color, `color-${ruleIndex + 1}-${colorIndex + 1}`),
    )
    .filter((swatch): swatch is ColorPaletteSwatch => Boolean(swatch));
  if (!colors.length && presetId) {
    colors = (presetOption(field, presetId)?.colors || []).map((color, colorIndex) =>
      literalSwatch(color, `color-${ruleIndex + 1}-${colorIndex + 1}`),
    );
  }
  const targets = Array.isArray(item.targets)
    ? normalizeSemanticTargets(item.targets)
    : [legacyTarget(item.usage)];
  const exceptions = Array.isArray(item.exceptions)
    ? normalizeSemanticTargets(item.exceptions)
    : [];
  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `color-rule-${ruleIndex + 1}`,
    presetId: presetId || undefined,
    colors,
    targets,
    exceptions,
  };
}

function normalizeAssignments(field: ModuleField, value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeRule(field, item, index))
    .filter((item): item is ColorPaletteRule => Boolean(item));
}

function validateStableIdentities(
  assignments: readonly ColorPaletteRule[],
): DomainResult<true> {
  const assignmentIds = new Set<string>();
  for (const assignment of assignments) {
    const assignmentId = String(assignment.id || "").trim();
    if (!assignmentId || assignmentIds.has(assignmentId)) {
      return domainFailure({
        code: "color_assignment_identity_conflict",
        details: { assignmentId },
      });
    }
    assignmentIds.add(assignmentId);
    const swatchIds = new Set<string>();
    for (const swatch of assignment.colors) {
      const swatchId = String(swatch.id || "").trim();
      if (!swatchId || swatchIds.has(swatchId)) {
        return domainFailure({
          code: "color_swatch_identity_conflict",
          details: { assignmentId, swatchId },
        });
      }
      swatchIds.add(swatchId);
    }
  }
  return domainSuccess(true);
}

function readAssignments(
  field: ModuleField,
  values: ModuleValues,
): DomainResult<ColorPaletteRule[]> {
  const assignments = normalizeAssignments(field, values.paletteAssignments);
  const identityValidation = validateStableIdentities(assignments);
  if (!identityValidation.ok) return identityValidation;
  return domainSuccess(assignments);
}

function assignmentIndexById(
  assignments: readonly ColorPaletteRule[],
  assignmentId: string,
) {
  return assignments.findIndex((assignment) => assignment.id === assignmentId);
}

function swatchIndexById(assignment: ColorPaletteRule, swatchId: string) {
  return assignment.colors.findIndex((swatch) => swatch.id === swatchId);
}

function assignmentNotFound(assignmentId: string) {
  return domainFailure({
    code: "color_assignment_not_found",
    path: "assignmentId",
    details: { assignmentId },
  });
}

function swatchNotFound(assignmentId: string, swatchId: string) {
  return domainFailure({
    code: "color_swatch_not_found",
    path: "swatchId",
    details: { assignmentId, swatchId },
  });
}

function withAssignments(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  assignments: readonly ColorPaletteRule[],
  assignment?: ColorPaletteRule,
  swatch?: ColorPaletteSwatch,
): DomainResult<ColorPaletteMutation> {
  const nextAssignments = cloneValue(assignments);
  const nextModuleValues: ModuleValues = {
    ...values,
    paletteAssignments: nextAssignments,
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
    swatch: swatch ? cloneValue(swatch) : undefined,
  });
}

function colorScopePolicy(
  sources: readonly SemanticReferenceCatalogSource[] = [],
): SemanticAssignmentScopePolicy {
  return {
    capability: "color",
    builtinValues: COLOR_BUILTINS,
    exclusiveValue: "overall",
    sources,
  };
}

function nextUniqueId(
  requested: string,
  existingIds: readonly string[],
  code: string,
): DomainResult<string> {
  const id = requested.trim();
  if (!id) return domainFailure({ code, details: { id } });
  if (existingIds.includes(id)) {
    return domainFailure({ code, details: { id } });
  }
  return domainSuccess(id);
}

function enabledColorVariables(draft: PromptDraftState): PromptVariable[] {
  return getEnabledPromptVariables(draft.moduleValues.variables?.variables)
    .filter((variable) => {
      return (
        variable.type === "color" &&
        Boolean(variable.key?.trim()) &&
        Boolean(variable.value?.trim())
      );
    });
}

export function createPromptColorAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  options: ColorPaletteMutationOptions = {},
): DomainResult<ColorPaletteMutation> {
  const target = validateColorTarget(draft, module);
  if (!target.ok) return target;
  const assignmentsResult = readAssignments(target.value.field, target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const idResult = nextUniqueId(
    (options.createAssignmentId || (() => randomId("color-rule")))(),
    assignments.map((item) => item.id || ""),
    "color_assignment_identity_conflict",
  );
  if (!idResult.ok) return idResult;
  const assignment: ColorPaletteRule = {
    id: idResult.value,
    colors: [],
    targets: [{ kind: "builtin", value: "overall" }],
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

export function deletePromptColorAssignment(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
): DomainResult<ColorPaletteMutation> {
  const target = validateColorTarget(draft, module);
  if (!target.ok) return target;
  const assignmentsResult = readAssignments(target.value.field, target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);
  const next = assignments.filter((_, itemIndex) => itemIndex !== index);
  return withAssignments(draft, module, target.value.values, next);
}

export function setPromptColorAssignmentScope(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  patch: SemanticAssignmentScopePatch,
  options: ColorPaletteMutationOptions = {},
): DomainResult<ColorPaletteMutation> {
  const target = validateColorTarget(draft, module);
  if (!target.ok) return target;
  const assignmentsResult = readAssignments(target.value.field, target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);
  const current = assignments[index];
  const scopeResult = setSemanticAssignmentScope(
    { targets: current.targets, exceptions: current.exceptions || [] },
    patch,
    colorScopePolicy(options.semanticSources),
  );
  if (!scopeResult.ok) return scopeResult;
  const assignment: ColorPaletteRule = {
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

export function applyPromptColorAssignmentPreset(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  presetId: string,
  options: ColorPaletteMutationOptions = {},
): DomainResult<ColorPaletteMutation> {
  const target = validateColorTarget(draft, module);
  if (!target.ok) return target;
  const assignmentsResult = readAssignments(target.value.field, target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);
  const current = assignments[index];
  if (!presetId.trim()) {
    const assignment = { ...current, presetId: undefined };
    const next = [...assignments];
    next[index] = assignment;
    return withAssignments(draft, module, target.value.values, next, assignment);
  }
  const option = presetOption(target.value.field, presetId);
  if (!option) {
    return domainFailure({
      code: "color_palette_preset_not_found",
      path: "presetId",
      details: { presetId },
    });
  }
  const existingIds = new Set(current.colors.map((swatch) => swatch.id || ""));
  const colors: ColorPaletteSwatch[] = [];
  for (const color of option.colors || []) {
    const generated = (options.createSwatchId || (() => randomId("color")))();
    const idResult = nextUniqueId(
      generated,
      [...existingIds, ...colors.map((swatch) => swatch.id || "")],
      "color_swatch_identity_conflict",
    );
    if (!idResult.ok) return idResult;
    colors.push(literalSwatch(color, idResult.value));
  }
  const assignment: ColorPaletteRule = {
    ...current,
    presetId,
    colors,
  };
  const next = [...assignments];
  next[index] = assignment;
  return withAssignments(draft, module, target.value.values, next, assignment);
}

export function addPromptColorSwatch(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  value = "#000000",
  options: ColorPaletteMutationOptions = {},
): DomainResult<ColorPaletteMutation> {
  const target = validateColorTarget(draft, module);
  if (!target.ok) return target;
  const assignmentsResult = readAssignments(target.value.field, target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const index = assignmentIndexById(assignments, assignmentId);
  if (index < 0) return assignmentNotFound(assignmentId);
  const current = assignments[index];
  const idResult = nextUniqueId(
    (options.createSwatchId || (() => randomId("color")))(),
    current.colors.map((swatch) => swatch.id || ""),
    "color_swatch_identity_conflict",
  );
  if (!idResult.ok) return idResult;
  const swatch = literalSwatch(value, idResult.value);
  const assignment: ColorPaletteRule = {
    ...current,
    presetId: undefined,
    colors: [...current.colors, swatch],
  };
  const next = [...assignments];
  next[index] = assignment;
  return withAssignments(
    draft,
    module,
    target.value.values,
    next,
    assignment,
    swatch,
  );
}

export function setPromptColorSwatchLiteral(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  swatchId: string,
  value: string,
): DomainResult<ColorPaletteMutation> {
  const target = validateColorTarget(draft, module);
  if (!target.ok) return target;
  const assignmentsResult = readAssignments(target.value.field, target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const assignmentIndex = assignmentIndexById(assignments, assignmentId);
  if (assignmentIndex < 0) return assignmentNotFound(assignmentId);
  const current = assignments[assignmentIndex];
  const swatchIndex = swatchIndexById(current, swatchId);
  if (swatchIndex < 0) return swatchNotFound(assignmentId, swatchId);
  const swatch: ColorPaletteSwatch = {
    id: current.colors[swatchIndex].id,
    kind: "literal",
    value,
  };
  const colors = [...current.colors];
  colors[swatchIndex] = swatch;
  const assignment = { ...current, presetId: undefined, colors };
  const next = [...assignments];
  next[assignmentIndex] = assignment;
  return withAssignments(
    draft,
    module,
    target.value.values,
    next,
    assignment,
    swatch,
  );
}

export function setPromptColorSwatchVariable(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  swatchId: string,
  variableId: string,
): DomainResult<ColorPaletteMutation> {
  const target = validateColorTarget(draft, module);
  if (!target.ok) return target;
  const assignmentsResult = readAssignments(target.value.field, target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const assignmentIndex = assignmentIndexById(assignments, assignmentId);
  if (assignmentIndex < 0) return assignmentNotFound(assignmentId);
  const current = assignments[assignmentIndex];
  const swatchIndex = swatchIndexById(current, swatchId);
  if (swatchIndex < 0) return swatchNotFound(assignmentId, swatchId);
  const variable = enabledColorVariables(draft).find((item) => item.id === variableId);
  if (!variable) {
    return domainFailure({
      code: "color_variable_unavailable",
      path: "variableId",
      details: { variableId },
    });
  }
  const token = `{${variable.key}}`;
  const swatch: ColorPaletteSwatch = {
    id: current.colors[swatchIndex].id,
    kind: "variable",
    value: token,
    variableId: variable.id,
    token,
    label: variable.label || variable.key,
  };
  const colors = [...current.colors];
  colors[swatchIndex] = swatch;
  const assignment = { ...current, presetId: undefined, colors };
  const next = [...assignments];
  next[assignmentIndex] = assignment;
  return withAssignments(
    draft,
    module,
    target.value.values,
    next,
    assignment,
    swatch,
  );
}

export function deletePromptColorSwatch(
  draft: PromptDraftState,
  module: PromptKeyModule,
  assignmentId: string,
  swatchId: string,
): DomainResult<ColorPaletteMutation> {
  const target = validateColorTarget(draft, module);
  if (!target.ok) return target;
  const assignmentsResult = readAssignments(target.value.field, target.value.values);
  if (!assignmentsResult.ok) return assignmentsResult;
  const assignments = assignmentsResult.value;
  const assignmentIndex = assignmentIndexById(assignments, assignmentId);
  if (assignmentIndex < 0) return assignmentNotFound(assignmentId);
  const current = assignments[assignmentIndex];
  const swatchIndex = swatchIndexById(current, swatchId);
  if (swatchIndex < 0) return swatchNotFound(assignmentId, swatchId);
  const colors = current.colors.filter((_, index) => index !== swatchIndex);
  const assignment = { ...current, presetId: undefined, colors };
  const next = [...assignments];
  next[assignmentIndex] = assignment;
  return withAssignments(draft, module, target.value.values, next, assignment);
}
