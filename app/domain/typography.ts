import type {
  ModuleField,
  ModuleFieldOption,
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
  TypographyTextBlock,
  TypographyTextGroup,
} from "../modules/types";
import type { PromptDraftState } from "../modules/promptDraft.types";
import { createDefaultModuleValues } from "../utils/compileModules";
import { normalizeLayoutRegionsState } from "../utils/layoutRegions";
import {
  cloneTypographyGroups,
  createTypographyEntityId,
  normalizeTypographyGroups,
  normalizeTypographyTextBlock,
  normalizeTypographyTextGroup,
} from "../utils/typography";
import { isStructuralVariableToken } from "../utils/structuralVariables";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type TypographyMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  groups: TypographyTextGroup[];
  group?: TypographyTextGroup;
  text?: TypographyTextBlock;
};

export type TypographyGroupPatch = {
  groupPurpose?: string;
  customGroupPurpose?: string;
  positionSource?: "preset" | "layout_region" | "custom";
  positionPreset?: string;
  layoutRegionId?: string;
  customPositionDescription?: string;
  direction?: "row" | "column";
  writingDirection?: "ltr" | "rtl" | "vertical_ttb" | "vertical_btt" | "";
  alignment?: "start" | "center" | "end" | "justify";
  distribution?: "compact" | "balanced" | "spaced" | "scattered";
  additionalDescription?: string;
};

export type TypographyTextPatch = {
  text?: string;
  purpose?: string;
  customPurpose?: string;
  fontStyle?: string;
  customFontStyle?: string;
  fontSize?: string;
  customFontSize?: string;
  fontWeight?: string;
  customFontWeight?: string;
  additionalDescription?: string;
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  const existing = draft.moduleValues[module.key];
  return existing ? cloneValue(existing) : createDefaultModuleValues(module);
}

function typographyField(module: PromptKeyModule): ModuleField | null {
  const field = module.fields.textGroups;
  return field?.type === "textGroups" ? field : null;
}

function validateTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<{ moduleValues: ModuleValues; field: ModuleField; groups: TypographyTextGroup[] }> {
  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = typographyField(module);
  if (!field) {
    return domainFailure({
      code: "typography_field_unavailable",
      details: { moduleKey: module.key, fieldId: "textGroups" },
    });
  }

  const moduleValues = currentModuleValues(draft, module);
  return domainSuccess({
    moduleValues,
    field,
    groups: cloneTypographyGroups(moduleValues.textGroups),
  });
}

function withGroups(
  draft: PromptDraftState,
  module: PromptKeyModule,
  moduleValues: ModuleValues,
  groups: TypographyTextGroup[],
  extra: Pick<TypographyMutation, "group" | "text"> = {},
): DomainResult<TypographyMutation> {
  const normalizedGroups = cloneTypographyGroups(groups);
  const nextModuleValues: ModuleValues = {
    ...cloneValue(moduleValues),
    textGroups: normalizedGroups as unknown as ModuleFieldValue,
  };
  const nextDraft = cloneValue(draft);
  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [module.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    groups: cloneTypographyGroups(normalizedGroups),
    group: extra.group ? cloneValue(extra.group) : undefined,
    text: extra.text ? cloneValue(extra.text) : undefined,
  });
}

function fieldConfigOptions(field: ModuleField, key: string): ModuleFieldOption[] {
  const value = field.config?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ModuleFieldOption => {
    return Boolean(
      item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof (item as ModuleFieldOption).value === "string",
    );
  });
}

function validateConfiguredValue(
  field: ModuleField,
  configKey: string,
  value: string,
  path: string,
  options: { allowEmpty?: boolean; allowStructuralToken?: boolean } = {},
): DomainResult<string> {
  if (!value && options.allowEmpty) return domainSuccess("");
  if (options.allowStructuralToken && isStructuralVariableToken(value)) {
    return domainSuccess(value);
  }

  const exists = fieldConfigOptions(field, configKey).some(
    (option) => option.value === value,
  );
  if (exists) return domainSuccess(value);

  return domainFailure({
    code: "typography_invalid_option",
    path,
    details: { configKey, value },
  });
}

function findGroupIndex(groups: readonly TypographyTextGroup[], groupId: string) {
  return groups.findIndex((group) => group.id === groupId);
}

function findTextIndex(group: TypographyTextGroup, textId: string) {
  return group.texts.findIndex((text) => text.id === textId);
}

function groupNotFound(groupId: string) {
  return domainFailure({
    code: "typography_group_not_found",
    path: "groupId",
    details: { groupId },
  });
}

function textNotFound(groupId: string, textId: string) {
  return domainFailure({
    code: "typography_text_not_found",
    path: "textId",
    details: { groupId, textId },
  });
}

function allTypographyIds(groups: readonly TypographyTextGroup[]) {
  const ids = new Set<string>();
  groups.forEach((group) => {
    if (group.id) ids.add(group.id);
    group.texts.forEach((text) => {
      if (text.id) ids.add(text.id);
    });
  });
  return ids;
}

function resolveId(
  groups: readonly TypographyTextGroup[],
  prefix: "text-group" | "text",
  factory?: () => string,
): DomainResult<string> {
  const id = String(factory?.() || createTypographyEntityId(prefix)).trim();
  if (!id) {
    return domainFailure({
      code: "typography_invalid_id",
      details: { prefix },
    });
  }
  if (allTypographyIds(groups).has(id)) {
    return domainFailure({
      code: "typography_id_conflict",
      details: { id },
    });
  }
  return domainSuccess(id);
}

function layoutRegionExists(draft: PromptDraftState, regionId: string) {
  if (!draft.selectedModuleKeys.includes("layout")) return false;
  const state = normalizeLayoutRegionsState(draft.moduleValues.layout?.regions);
  return state.regions.some((region) => region.id === regionId);
}

function applyGroupPatch(
  draft: PromptDraftState,
  field: ModuleField,
  source: TypographyTextGroup,
  patch: TypographyGroupPatch,
): DomainResult<TypographyTextGroup> {
  const next = cloneValue(source);

  if (patch.groupPurpose !== undefined) {
    const checked = validateConfiguredValue(
      field,
      "groupPurposeOptions",
      patch.groupPurpose,
      "groupPurpose",
      { allowEmpty: true },
    );
    if (!checked.ok) return checked;
    next.groupPurpose = checked.value;
  }

  if (patch.direction !== undefined) {
    const checked = validateConfiguredValue(
      field,
      "directionOptions",
      patch.direction,
      "direction",
    );
    if (!checked.ok) return checked;
    next.direction = checked.value as TypographyTextGroup["direction"];
  }

  if (patch.writingDirection !== undefined) {
    const checked = validateConfiguredValue(
      field,
      "writingDirectionOptions",
      patch.writingDirection,
      "writingDirection",
      { allowEmpty: true },
    );
    if (!checked.ok) return checked;
    next.writingDirection = checked.value
      ? (checked.value as NonNullable<TypographyTextGroup["writingDirection"]>)
      : undefined;
  }

  if (patch.alignment !== undefined) {
    const checked = validateConfiguredValue(
      field,
      "alignmentOptions",
      patch.alignment,
      "alignment",
    );
    if (!checked.ok) return checked;
    next.alignment = checked.value as TypographyTextGroup["alignment"];
  }

  if (patch.distribution !== undefined) {
    const checked = validateConfiguredValue(
      field,
      "distributionOptions",
      patch.distribution,
      "distribution",
    );
    if (!checked.ok) return checked;
    next.distribution = checked.value as TypographyTextGroup["distribution"];
  }

  if (
    patch.positionPreset !== undefined ||
    patch.layoutRegionId !== undefined
  ) {
    if (patch.positionSource === undefined) {
      return domainFailure({
        code: "typography_position_source_required",
        path: "positionSource",
      });
    }
  }

  if (patch.positionSource !== undefined) {
    if (patch.positionSource === "layout_region") {
      const regionId = String(patch.layoutRegionId ?? next.layoutRegionId ?? "").trim();
      if (!regionId) {
        return domainFailure({
          code: "typography_layout_region_required",
          path: "layoutRegionId",
        });
      }
      if (!layoutRegionExists(draft, regionId)) {
        return domainFailure({
          code: "typography_layout_region_unavailable",
          path: "layoutRegionId",
          details: { regionId },
        });
      }
      next.positionSource = "layout_region";
      next.layoutRegionId = regionId;
      next.positionPreset = "";
    } else if (patch.positionSource === "custom") {
      next.positionSource = "custom";
      next.positionPreset = "custom";
      next.layoutRegionId = "";
    } else {
      const preset = String(patch.positionPreset ?? "");
      const checked = validateConfiguredValue(
        field,
        "positionPresetOptions",
        preset,
        "positionPreset",
        { allowEmpty: true },
      );
      if (!checked.ok) return checked;
      if (checked.value === "custom") {
        return domainFailure({
          code: "typography_position_source_mismatch",
          path: "positionPreset",
          details: { value: checked.value, expectedSource: "custom" },
        });
      }
      next.positionSource = "preset";
      next.positionPreset = checked.value;
      next.layoutRegionId = "";
    }
  }

  if (patch.customGroupPurpose !== undefined) {
    next.customGroupPurpose = patch.customGroupPurpose;
  }
  if (patch.customPositionDescription !== undefined) {
    next.customPositionDescription = patch.customPositionDescription;
  }
  if (patch.additionalDescription !== undefined) {
    next.additionalDescription = patch.additionalDescription;
  }

  const stableId = source.id;
  const stableName = source.groupName;
  const normalized = normalizeTypographyTextGroup(next);
  normalized.id = stableId;
  normalized.groupName = stableName;
  normalized.texts = cloneValue(source.texts);
  return domainSuccess(normalized);
}

function applyTextPatch(
  field: ModuleField,
  source: TypographyTextBlock,
  patch: TypographyTextPatch,
): DomainResult<TypographyTextBlock> {
  const next = cloneValue(source);

  const optionFields: Array<[
    keyof TypographyTextPatch,
    string,
    boolean?,
  ]> = [
    ["purpose", "textPurposeOptions", true],
    ["fontStyle", "fontStyleOptions", true],
    ["fontSize", "fontSizeOptions", true],
    ["fontWeight", "fontWeightOptions", false],
  ];

  for (const [patchKey, configKey, allowEmpty] of optionFields) {
    const value = patch[patchKey];
    if (value === undefined) continue;
    const checked = validateConfiguredValue(
      field,
      configKey,
      String(value),
      String(patchKey),
      {
        allowEmpty,
        allowStructuralToken: patchKey === "fontStyle",
      },
    );
    if (!checked.ok) return checked;
    (next as Record<string, unknown>)[patchKey] = checked.value;
  }

  if (patch.text !== undefined) next.text = patch.text;
  if (patch.customPurpose !== undefined) next.customPurpose = patch.customPurpose;
  if (patch.customFontStyle !== undefined) next.customFontStyle = patch.customFontStyle;
  if (patch.customFontSize !== undefined) next.customFontSize = patch.customFontSize;
  if (patch.customFontWeight !== undefined) next.customFontWeight = patch.customFontWeight;
  if (patch.additionalDescription !== undefined) {
    next.additionalDescription = patch.additionalDescription;
  }

  if (!String(next.text ?? "").trim()) {
    return domainFailure({
      code: "typography_text_required",
      path: "text",
    });
  }

  const stableId = source.id;
  const stableLayerName = source.layerName;
  const normalized = normalizeTypographyTextBlock(next);
  normalized.id = stableId;
  normalized.layerName = stableLayerName;
  return domainSuccess(normalized);
}

export function createTypographyGroup(
  draft: PromptDraftState,
  module: PromptKeyModule,
  patch: TypographyGroupPatch = {},
  idFactory?: () => string,
): DomainResult<TypographyMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;
  const id = resolveId(target.value.groups, "text-group", idFactory);
  if (!id.ok) return id;

  const base = normalizeTypographyTextGroup({ id: id.value });
  const patched = applyGroupPatch(draft, target.value.field, base, patch);
  if (!patched.ok) return patched;

  const groups = [...target.value.groups, patched.value];
  return withGroups(
    draft,
    module,
    target.value.moduleValues,
    groups,
    { group: patched.value },
  );
}

export function updateTypographyGroup(
  draft: PromptDraftState,
  module: PromptKeyModule,
  groupId: string,
  patch: TypographyGroupPatch,
): DomainResult<TypographyMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;
  if (!Object.keys(patch).length) {
    return domainFailure({ code: "typography_group_empty_update" });
  }

  const groups = target.value.groups;
  const index = findGroupIndex(groups, groupId);
  if (index < 0) return groupNotFound(groupId);
  const patched = applyGroupPatch(draft, target.value.field, groups[index], patch);
  if (!patched.ok) return patched;

  groups[index] = patched.value;
  return withGroups(
    draft,
    module,
    target.value.moduleValues,
    groups,
    { group: patched.value },
  );
}

export function deleteTypographyGroup(
  draft: PromptDraftState,
  module: PromptKeyModule,
  groupId: string,
): DomainResult<TypographyMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;
  const index = findGroupIndex(target.value.groups, groupId);
  if (index < 0) return groupNotFound(groupId);

  return withGroups(
    draft,
    module,
    target.value.moduleValues,
    target.value.groups.filter((group) => group.id !== groupId),
  );
}

export function moveTypographyGroup(
  draft: PromptDraftState,
  module: PromptKeyModule,
  groupId: string,
  toIndex: number,
): DomainResult<TypographyMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;
  const groups = target.value.groups;
  const index = findGroupIndex(groups, groupId);
  if (index < 0) return groupNotFound(groupId);
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= groups.length) {
    return domainFailure({
      code: "typography_group_move_out_of_range",
      path: "toIndex",
      details: { toIndex, count: groups.length },
    });
  }

  const [group] = groups.splice(index, 1);
  if (!group) return groupNotFound(groupId);
  groups.splice(toIndex, 0, group);
  return withGroups(draft, module, target.value.moduleValues, groups, { group });
}

export function createTypographyText(
  draft: PromptDraftState,
  module: PromptKeyModule,
  groupId: string,
  patch: TypographyTextPatch,
  idFactory?: () => string,
): DomainResult<TypographyMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;
  const groups = target.value.groups;
  const groupIndex = findGroupIndex(groups, groupId);
  if (groupIndex < 0) return groupNotFound(groupId);
  const id = resolveId(groups, "text", idFactory);
  if (!id.ok) return id;

  const base = normalizeTypographyTextBlock({ id: id.value });
  const patched = applyTextPatch(target.value.field, base, patch);
  if (!patched.ok) return patched;

  groups[groupIndex].texts.push(patched.value);
  return withGroups(
    draft,
    module,
    target.value.moduleValues,
    groups,
    { group: groups[groupIndex], text: patched.value },
  );
}

export function updateTypographyText(
  draft: PromptDraftState,
  module: PromptKeyModule,
  groupId: string,
  textId: string,
  patch: TypographyTextPatch,
): DomainResult<TypographyMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;
  if (!Object.keys(patch).length) {
    return domainFailure({ code: "typography_text_empty_update" });
  }

  const groups = target.value.groups;
  const groupIndex = findGroupIndex(groups, groupId);
  if (groupIndex < 0) return groupNotFound(groupId);
  const textIndex = findTextIndex(groups[groupIndex], textId);
  if (textIndex < 0) return textNotFound(groupId, textId);

  const patched = applyTextPatch(
    target.value.field,
    groups[groupIndex].texts[textIndex],
    patch,
  );
  if (!patched.ok) return patched;

  groups[groupIndex].texts[textIndex] = patched.value;
  return withGroups(
    draft,
    module,
    target.value.moduleValues,
    groups,
    { group: groups[groupIndex], text: patched.value },
  );
}

export function deleteTypographyText(
  draft: PromptDraftState,
  module: PromptKeyModule,
  groupId: string,
  textId: string,
): DomainResult<TypographyMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;
  const groups = target.value.groups;
  const groupIndex = findGroupIndex(groups, groupId);
  if (groupIndex < 0) return groupNotFound(groupId);
  const textIndex = findTextIndex(groups[groupIndex], textId);
  if (textIndex < 0) return textNotFound(groupId, textId);

  groups[groupIndex].texts = groups[groupIndex].texts.filter(
    (text) => text.id !== textId,
  );
  return withGroups(
    draft,
    module,
    target.value.moduleValues,
    groups,
    { group: groups[groupIndex] },
  );
}

export function moveTypographyText(
  draft: PromptDraftState,
  module: PromptKeyModule,
  groupId: string,
  textId: string,
  toIndex: number,
): DomainResult<TypographyMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;
  const groups = target.value.groups;
  const groupIndex = findGroupIndex(groups, groupId);
  if (groupIndex < 0) return groupNotFound(groupId);
  const group = groups[groupIndex];
  const textIndex = findTextIndex(group, textId);
  if (textIndex < 0) return textNotFound(groupId, textId);
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= group.texts.length) {
    return domainFailure({
      code: "typography_text_move_out_of_range",
      path: "toIndex",
      details: { toIndex, count: group.texts.length },
    });
  }

  const [text] = group.texts.splice(textIndex, 1);
  if (!text) return textNotFound(groupId, textId);
  group.texts.splice(toIndex, 0, text);
  return withGroups(
    draft,
    module,
    target.value.moduleValues,
    groups,
    { group, text },
  );
}
