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

function isEmptyValue(value: ModuleFieldValue) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function cleanPromptPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

type ColorAssignmentItem = {
  mode?: "preset" | "custom";
  preset?: string;
  colors?: string[];
  usage?: string;
};

function humanizeValue(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function formatList(items: string[]) {
  const cleanedItems = items.map((item) => item.trim()).filter(Boolean);

  if (cleanedItems.length === 0) return "";
  if (cleanedItems.length === 1) return cleanedItems[0];
  if (cleanedItems.length === 2)
    return `${cleanedItems[0]} and ${cleanedItems[1]}`;

  return `${cleanedItems.slice(0, -1).join(", ")}, and ${cleanedItems[cleanedItems.length - 1]
    }`;
}

function colorUsageToPromptText(value?: string) {
  const map: Record<string, string> = {
    overall: "the overall image",
    background: "the background",
    subject: "the main subject",
    outfit: "the outfit",
    hair: "the hair",
    lighting: "the lighting mood",
    accents: "the graphic accents",
  };

  return map[value || "overall"] || humanizeValue(value || "overall");
}

function isColorAssignmentItem(value: unknown): value is ColorAssignmentItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return true;
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

function quoteTypographyText(value: string) {
  return `"${cleanPromptPart(value).replace(/"/g, '\\"')}"`;
}

function compileTypographyTextBlock(
  field: ModuleField,
  block: TypographyTextBlock,
  blockIndex: number,
) {
  const text = block.text?.trim();

  if (!text) return "";

  const layerName = block.layerName?.trim() || `{text_${blockIndex + 1}}`;

  const purposeText = resolveConfigPromptText(
    field,
    "textPurposeOptions",
    block.purpose,
    block.customPurpose,
  );

  const fontStyleText = resolveConfigPromptText(
    field,
    "fontStyleOptions",
    block.fontStyle,
    block.customFontStyle,
  );

  const fontSizeText = resolveConfigPromptText(
    field,
    "fontSizeOptions",
    block.fontSize,
    block.customFontSize,
  );

  const fontWeightText = resolveConfigPromptText(
    field,
    "fontWeightOptions",
    block.fontWeight,
    block.customFontWeight,
  );

  const typographyParts = [
    fontStyleText,
    fontSizeText,
    fontWeightText,
  ].filter(Boolean);

  const parts = [`${layerName}: ${quoteTypographyText(text)}`];

  if (purposeText) {
    parts.push(purposeText);
  }

  if (typographyParts.length) {
    parts.push(`using ${formatList(typographyParts)}`);
  }

  if (block.additionalDescription?.trim()) {
    parts.push(
      `with non-visible styling note: ${cleanPromptPart(block.additionalDescription)}`,
    );
  }

  return parts.join(", ");
}

function compileTypographyTextGroup(
  field: ModuleField,
  group: TypographyTextGroup,
  groupIndex: number,
) {
  const groupName = group.groupName?.trim() || `{text_group_${groupIndex + 1}}`;

  const groupPurposeText = resolveConfigPromptText(
    field,
    "groupPurposeOptions",
    group.groupPurpose,
    group.customGroupPurpose,
  );

  const positionText = resolveConfigPromptText(
    field,
    "positionPresetOptions",
    group.positionPreset,
    group.customPositionDescription,
  );

  const directionText = resolveConfigPromptText(
    field,
    "directionOptions",
    group.direction,
  );

  const writingDirectionText = resolveConfigPromptText(
    field,
    "writingDirectionOptions",
    group.writingDirection,
  );

  const alignmentText = resolveConfigPromptText(
    field,
    "alignmentOptions",
    group.alignment,
  );

  const distributionText = resolveConfigPromptText(
    field,
    "distributionOptions",
    group.distribution,
  );

  const groupParts = [groupName];

  if (groupPurposeText) {
    groupParts.push(groupPurposeText);
  }

  if (positionText) {
    groupParts.push(`positioned ${positionText} as one grouped typography unit`);
  }

  if (directionText) {
    groupParts.push(directionText);
  }

  if (writingDirectionText) {
    groupParts.push(writingDirectionText);
  }

  if (alignmentText) {
    groupParts.push(alignmentText);
  }

  if (distributionText) {
    groupParts.push(distributionText);
  }

  if (group.additionalDescription?.trim()) {
    groupParts.push(
      `with non-visible group styling note: ${cleanPromptPart(group.additionalDescription)}`,
    );
  }

  const textBlocks = (group.texts || [])
    .filter(isTypographyTextBlock)
    .map((block, blockIndex) => {
      return compileTypographyTextBlock(field, block, blockIndex);
    })
    .filter(Boolean);

  if (!textBlocks.length) return "";

  return `Typography group ${groupParts.join(", ")} containing ${textBlocks.join("; ")}`;
}

function compileTextGroupsField(
  field: ModuleField,
  value: ModuleFieldValue,
) {
  if (!Array.isArray(value)) return "";

  const groups = value
    .filter(isTypographyTextGroup)
    .map((group, groupIndex) => {
      return compileTypographyTextGroup(field, group, groupIndex);
    })
    .filter(Boolean);

  if (!groups.length) return "";

  return `Typography layout: ${groups.join(". ")}`;
}

function typographyAccuracyToPromptText(value?: string) {
  const map: Record<string, string> = {
    flexible:
      "typography may be interpreted flexibly when exact lettering is not essential",
    readable:
      "render all quoted typography text as clear readable text with intentional letterforms",
    exact:
      "render all quoted typography text exactly as written with correct spelling and no extra letters",
  };

  return map[value || "exact"] || map.exact;
}

function typographyVisibleTextGuardPromptText() {
  return [
    "Only render the quoted text values as visible typography",
    "do not render layer names, group names, purposes, notes, field labels, or descriptions as extra visible text",
    "use purposes and descriptions only as layout and styling instructions",
  ].join("; ");
}

function compileTypographyModule(
  module: PromptKeyModule,
  values: ModuleValues,
): string {
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

  const textGroupsField = module.fields.textGroups;
  const textGroupsOutput = textGroupsField
    ? compileTextGroupsField(textGroupsField, values.textGroups)
    : "";

  const extraDetails =
    typeof values.extraDetails === "string"
      ? cleanPromptPart(values.extraDetails)
      : "";

  const parts = [textGroupsOutput].filter(Boolean);

  if (textGroupsOutput) {
    const textAccuracy =
      typeof values.textAccuracy === "string" && values.textAccuracy.trim()
        ? values.textAccuracy
        : "exact";

    parts.push(typographyAccuracyToPromptText(textAccuracy));
    parts.push(typographyVisibleTextGuardPromptText());
  }

  if (extraDetails) {
    parts.push(extraDetails);
  }

  return parts.join(". ");
}

function compileColorAssignmentsField(
  field: ModuleField,
  value: ModuleFieldValue,
) {
  if (!Array.isArray(value)) return "";

  const assignments = value.filter(isColorAssignmentItem);

  const parts = assignments
    .map((assignment) => {
      const usageText = colorUsageToPromptText(assignment.usage);

      if (assignment.mode === "custom") {
        const colors = (assignment.colors || [])
          .map((color) => color.trim())
          .filter(Boolean);

        if (!colors.length) return "";

        return `use a custom color palette based on ${formatList(
          colors,
        )} for ${usageText}`;
      }

      const preset = assignment.preset?.trim();

      if (!preset) return "";

      const presetPromptText = getOptionPromptText(field, preset);
      const presetText =
        presetPromptText === preset ? humanizeValue(preset) : presetPromptText;

      return `use ${presetText} for ${usageText}`;
    })
    .filter(Boolean);

  return parts.join(", ");
}

function humanizeFieldId(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
}

function isHexColor(value: string) {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}

function compileColorField(field: ModuleField, value: ModuleFieldValue) {
  if (typeof value !== "string") return "";

  const colorValue = value.trim();

  if (!colorValue) return "";

  const fieldName = humanizeFieldId(field.id);

  if (isHexColor(colorValue)) {
    return `the ${fieldName} must be ${colorValue}`;
  }

  return `the ${fieldName} must be ${colorValue}`;
}

function getOptionPromptText(field: ModuleField, value: string) {
  const option = field.options?.find((item) => item.value === value);
  return option?.promptText || value;
}

function compileField(field: ModuleField, value: ModuleFieldValue) {
  if (isEmptyValue(value)) return "";

  if (field.type === "colorAssignments") {
    return compileColorAssignmentsField(field, value);
  }

  if (field.type === "textGroups") {
    return compileTextGroupsField(field, value);
  }

  if (field.type === "color") {
    return compileColorField(field, value);
  }

  if (Array.isArray(value)) {
    return value
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
): string {
  if (module.key === "typography") {
    return compileTypographyModule(module, values);
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

  const sortedFields = fields
    .filter((field) => !field.isOverride)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  let parts = sortedFields
    .map((field) => compileField(field, values[field.id]))
    .filter(Boolean)
    .map(cleanPromptPart);

  if (module.compile?.removeDuplicates !== false) {
    parts = uniquePromptParts(parts);
  }

  return parts.join(module.compile?.separator || ", ");
}
