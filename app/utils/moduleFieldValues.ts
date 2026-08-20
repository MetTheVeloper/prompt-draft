import type {
  ModuleField,
  ModuleFieldValue,
  ModuleValues,
} from "../modules/types";

const DEFAULT_CUSTOM_OPTION_VALUE = "custom";

export function getModuleFieldCustomOptionValue(field: ModuleField) {
  return field.customInput?.optionValue || DEFAULT_CUSTOM_OPTION_VALUE;
}

export function getModuleFieldCustomValueKey(field: ModuleField) {
  return field.customInput?.valueKey || `${field.id}Custom`;
}

export function isModuleFieldCustomSelection(
  field: ModuleField,
  value: ModuleFieldValue,
) {
  if (!field.customInput) return false;

  const customOptionValue = getModuleFieldCustomOptionValue(field);

  if (Array.isArray(value)) {
    return value.some((item) => item === customOptionValue);
  }

  return typeof value === "string" && value === customOptionValue;
}

export function getModuleFieldCustomText(
  field: ModuleField,
  values: ModuleValues,
) {
  if (!field.customInput) return "";

  const value = values[getModuleFieldCustomValueKey(field)];
  return typeof value === "string" ? value.trim() : "";
}

function getOptionPromptText(field: ModuleField, value: string) {
  const option = field.options?.find((item) => item.value === value);
  return option?.promptText || value;
}

function resolveSingleValue(
  field: ModuleField,
  value: string,
  values: ModuleValues,
) {
  const cleanedValue = value.trim();
  if (!cleanedValue) return "";

  if (
    field.customInput &&
    cleanedValue === getModuleFieldCustomOptionValue(field)
  ) {
    return getModuleFieldCustomText(field, values);
  }

  if (field.options?.length) {
    return getOptionPromptText(field, cleanedValue).trim();
  }

  return cleanedValue;
}

export function resolveModuleFieldPromptTexts(
  field: ModuleField,
  value: ModuleFieldValue,
  values: ModuleValues,
) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => resolveSingleValue(field, item, values))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const resolved = resolveSingleValue(field, value, values);
    return resolved ? [resolved] : [];
  }

  return [];
}