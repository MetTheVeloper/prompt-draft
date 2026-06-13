import type {
  ModuleField,
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
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

  return `${cleanedItems.slice(0, -1).join(", ")}, and ${
    cleanedItems[cleanedItems.length - 1]
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
    values[field.id] = field.default ?? "";
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
