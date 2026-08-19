// app/utils/compileModules.ts
import type {
  ModuleField,
  ModuleFieldOption,
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
  TypographyTextBlock,
  TypographyTextGroup,
} from "../modules/types";
import { formatPromptVariableDefinitions } from "./promptVariables";
import { compileLayoutModule } from "./compileLayout";
import { compileLightingModule } from "./compileLighting";
import { compileColorPaletteModule } from "./compileColorPalette";
import { compileTextureModule } from "./compileTexture";
import {
  getLayoutRegionVariableToken,
  getTypographyGroupVariableToken,
  getTypographyTextVariableToken,
  isStructuralVariableToken,
} from "./structuralVariables";

function isEmptyValue(value: ModuleFieldValue) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function cleanPromptPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function humanizeValue(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cloneModuleFieldValue(value: ModuleFieldValue): ModuleFieldValue {
  if (value === null || value === undefined) return value;

  try {
    return JSON.parse(JSON.stringify(value)) as ModuleFieldValue;
  } catch {
    return value;
  }
}

function isModuleFieldOption(value: unknown): value is ModuleFieldOption {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return typeof (value as ModuleFieldOption).value === "string";
}

function getConfigOptions(field: ModuleField, key: string): ModuleFieldOption[] {
  const value = field.config?.[key];

  if (!Array.isArray(value)) return [];

  return value.filter(isModuleFieldOption);
}

function getConfigOptionPromptText(
  field: ModuleField,
  key: string,
  value?: string,
) {
  const cleanedValue = value?.trim();

  if (!cleanedValue) return "";

  const option = getConfigOptions(field, key).find((item) => {
    return item.value === cleanedValue;
  });

  return option?.promptText || humanizeValue(cleanedValue);
}

function resolveConfigPromptText(
  field: ModuleField,
  key: string,
  value?: string,
  customValue?: string,
) {
  const cleanedValue = value?.trim();

  if (!cleanedValue) return "";

  if (cleanedValue === "custom") {
    return customValue?.trim() || "";
  }

  if (isStructuralVariableToken(cleanedValue)) {
    return cleanedValue;
  }

  return getConfigOptionPromptText(field, key, cleanedValue);
}

function isTypographyTextBlock(value: unknown): value is TypographyTextBlock {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return true;
}

function isTypographyTextGroup(value: unknown): value is TypographyTextGroup {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return true;
}

function compactRecord(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null || item === "") return false;
      if (typeof item === "object" && !Array.isArray(item)) {
        return Object.keys(item as Record<string, unknown>).length > 0;
      }
      return true;
    }),
  );
}

function serializeTypographyTextBlock(
  field: ModuleField,
  block: TypographyTextBlock,
) {
  const text = block.text?.trim();

  if (!text) return null;

  const typography = compactRecord({
    fontStyle:
      resolveConfigPromptText(
        field,
        "fontStyleOptions",
        block.fontStyle,
        block.customFontStyle,
      ) || undefined,
    fontSize:
      resolveConfigPromptText(
        field,
        "fontSizeOptions",
        block.fontSize,
        block.customFontSize,
      ) || undefined,
    fontWeight:
      resolveConfigPromptText(
        field,
        "fontWeightOptions",
        block.fontWeight,
        block.customFontWeight,
      ) || undefined,
  });

  return compactRecord({
    id: block.id || undefined,
    key: getTypographyTextVariableToken(block),
    content: text,
    purpose:
      resolveConfigPromptText(
        field,
        "textPurposeOptions",
        block.purpose,
        block.customPurpose,
      ) || undefined,
    typography,
    description: block.additionalDescription?.trim() || undefined,
  });
}

function serializeTypographyPosition(
  field: ModuleField,
  group: TypographyTextGroup,
) {
  if (group.positionSource === "layout_region" && group.layoutRegionId) {
    return {
      region: getLayoutRegionVariableToken(group.layoutRegionId),
    };
  }

  if (group.positionSource === "custom" || group.positionPreset === "custom") {
    const custom = group.customPositionDescription?.trim();
    return custom ? { custom } : {};
  }

  const preset = resolveConfigPromptText(
    field,
    "positionPresetOptions",
    group.positionPreset,
    group.customPositionDescription,
  );

  return preset ? { preset } : {};
}

function serializeTypographyTextGroup(
  field: ModuleField,
  group: TypographyTextGroup,
) {
  const texts = (group.texts || [])
    .filter(isTypographyTextBlock)
    .map((block) => serializeTypographyTextBlock(field, block))
    .filter(Boolean);

  if (!texts.length) return null;

  const layout = compactRecord({
    direction:
      resolveConfigPromptText(
        field,
        "directionOptions",
        group.direction,
      ) || undefined,
    writingDirection:
      resolveConfigPromptText(
        field,
        "writingDirectionOptions",
        group.writingDirection,
      ) || undefined,
    alignment:
      resolveConfigPromptText(
        field,
        "alignmentOptions",
        group.alignment,
      ) || undefined,
    distribution:
      resolveConfigPromptText(
        field,
        "distributionOptions",
        group.distribution,
      ) || undefined,
  });

  return compactRecord({
    id: group.id || undefined,
    key: getTypographyGroupVariableToken(group),
    purpose:
      resolveConfigPromptText(
        field,
        "groupPurposeOptions",
        group.groupPurpose,
        group.customGroupPurpose,
      ) || undefined,
    position: serializeTypographyPosition(field, group),
    layout,
    description: group.additionalDescription?.trim() || undefined,
    texts,
  });
}

function serializeTypographyField(
  field: ModuleField,
  value: ModuleFieldValue,
  accuracy = "exact",
) {
  if (!Array.isArray(value)) return null;

  const groups = value
    .filter(isTypographyTextGroup)
    .map((group) => serializeTypographyTextGroup(field, group))
    .filter(Boolean);

  if (!groups.length) return null;

  return {
    groups,
    renderRules: {
      accuracy,
      renderTextValuesOnly: true,
      preserveSpelling: true,
    },
  };
}

function compileVariablesModule(values: ModuleValues): string {
  return formatPromptVariableDefinitions(values.variables);
}

function compileTypographyModule(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const fields = Object.values(module.fields);

  const overrideFieldId =
    module.compile?.overrideField ||
    fields.find((field) => field.isOverride)?.id;

  const textAccuracy =
    typeof values.textAccuracy === "string" && values.textAccuracy.trim()
      ? values.textAccuracy
      : "exact";

  if (overrideFieldId) {
    const overrideValue = values[overrideFieldId];

    if (typeof overrideValue === "string" && overrideValue.trim()) {
      return cleanPromptPart(overrideValue);
    }
  }

  const textGroupsField = module.fields.textGroups;

  const extraDetails =
    typeof values.extraDetails === "string"
      ? cleanPromptPart(values.extraDetails)
      : "";

  const serialized = textGroupsField
    ? serializeTypographyField(
        textGroupsField,
        values.textGroups,
        textAccuracy,
      )
    : null;

  if (!serialized?.groups.length) {
    return "";
  }

  return {
    ...serialized,
    extraDetails: extraDetails || undefined,
  };
}

function humanizeFieldId(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
}

function compileColorField(field: ModuleField, value: ModuleFieldValue) {
  if (typeof value !== "string") return "";

  const colorValue = value.trim();

  if (!colorValue) return "";

  const fieldName = humanizeFieldId(field.id);
  return `the ${fieldName} must be ${colorValue}`;
}

function getOptionPromptText(field: ModuleField, value: string) {
  const option = field.options?.find((item) => item.value === value);
  return option?.promptText || value;
}

function compileField(field: ModuleField, value: ModuleFieldValue) {
  if (isEmptyValue(value)) return "";

  if (field.type === "color") {
    return compileColorField(field, value);
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => getOptionPromptText(field, item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "string") {
    if (field.options?.length) {
      return getOptionPromptText(field, value);
    }

    return value;
  }

  if (typeof value === "boolean") {
    return value ? field.promptText || "" : "";
  }

  return String(value);
}

function uniquePromptParts(parts: string[]) {
  const seen = new Set<string>();

  return parts.filter((part) => {
    const normalized = part.toLowerCase();

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function sortModuleFieldsForCompile(
  module: PromptKeyModule,
  fields: ModuleField[],
) {
  const explicitOrder = module.compile?.fieldOrder || [];

  if (!explicitOrder.length) {
    return [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const rank = new Map(
    explicitOrder.map((fieldId, index) => [fieldId, index]),
  );

  return [...fields].sort((a, b) => {
    const aRank = rank.get(a.id);
    const bRank = rank.get(b.id);

    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;

    return (a.order ?? 0) - (b.order ?? 0);
  });
}

export function createDefaultModuleValues(
  module: PromptKeyModule,
): ModuleValues {
  return Object.values(module.fields).reduce<ModuleValues>((values, field) => {
    values[field.id] = cloneModuleFieldValue(field.default ?? "");
    return values;
  }, {});
}

export function getModulePresetValues(
  module: PromptKeyModule,
  presetKey: string,
): ModuleValues {
  return module.presets?.[presetKey]?.values || {};
}

export function compileModule(
  module: PromptKeyModule,
  values: ModuleValues,
): string | Record<string, unknown> {
  if (module.key === "variables") {
    return compileVariablesModule(values);
  }

  if (module.key === "typography") {
    return compileTypographyModule(module, values);
  }

  if (module.key === "layout") {
    return compileLayoutModule(module, values);
  }

  if (module.key === "lighting") {
    return compileLightingModule(module, values);
  }

  if (module.key === "colorPalette") {
    return compileColorPaletteModule(module, values);
  }

  if (module.key === "texture") {
    return compileTextureModule(module, values);
  }

  const fields = Object.values(module.fields);

  const overrideFieldId =
    module.compile?.overrideField ||
    fields.find((field) => field.isOverride)?.id;

  if (overrideFieldId) {
    const overrideValue = values[overrideFieldId];

    if (typeof overrideValue === "string" && overrideValue.trim()) {
      return cleanPromptPart(overrideValue);
    }
  }

  const sortedFields = sortModuleFieldsForCompile(
    module,
    fields.filter((field) => !field.isOverride),
  );

  let parts = sortedFields
    .map((field) => compileField(field, values[field.id]))
    .filter(Boolean)
    .map(cleanPromptPart);

  if (module.compile?.removeDuplicates !== false) {
    parts = uniquePromptParts(parts);
  }

  return parts.join(module.compile?.separator || ", ");
}
