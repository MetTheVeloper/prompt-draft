import type {
  ModuleField,
  ModuleFieldValue,
  ModuleValues,
} from "../modules/types";
import {
  getModuleFieldCustomValueKey,
  isModuleFieldCustomSelection,
} from "../utils/moduleFieldValues";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export const SIMPLE_MODULE_FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "multiSelect",
  "checkbox",
  "color",
  "number",
  "range",
] as const;

export type SimpleModuleFieldType =
  (typeof SIMPLE_MODULE_FIELD_TYPES)[number];

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

export function isSimpleModuleField(field: ModuleField) {
  return SIMPLE_MODULE_FIELD_TYPES.includes(
    field.type as SimpleModuleFieldType,
  );
}

function fieldHasFreeformOption(field: ModuleField) {
  return Boolean(field.options?.some((option) => option.freeform));
}

function fieldOptionExists(field: ModuleField, value: string) {
  return Boolean(field.options?.some((option) => option.value === value));
}

function validateSelectValue(
  field: ModuleField,
  value: unknown,
): DomainResult<ModuleFieldValue> {
  if (typeof value !== "string") {
    return domainFailure({
      code: "module_field_invalid_value",
      path: "value",
      details: { fieldId: field.id, expected: "string" },
    });
  }

  if (!value || fieldOptionExists(field, value) || fieldHasFreeformOption(field)) {
    return domainSuccess(value);
  }

  return domainFailure({
    code: "module_field_invalid_option",
    path: "value",
    details: { fieldId: field.id, value },
  });
}

function validateMultiSelectValue(
  field: ModuleField,
  value: unknown,
): DomainResult<ModuleFieldValue> {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return domainFailure({
      code: "module_field_invalid_value",
      path: "value",
      details: { fieldId: field.id, expected: "string[]" },
    });
  }

  if (fieldHasFreeformOption(field)) {
    return domainSuccess([...value] as string[]);
  }

  const invalid = value.find((item) => !fieldOptionExists(field, item));
  if (invalid !== undefined) {
    return domainFailure({
      code: "module_field_invalid_option",
      path: "value",
      details: { fieldId: field.id, value: invalid },
    });
  }

  return domainSuccess([...value] as string[]);
}

function validateNumberValue(
  field: ModuleField,
  value: unknown,
): DomainResult<ModuleFieldValue> {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return domainFailure({
      code: "module_field_invalid_value",
      path: "value",
      details: { fieldId: field.id, expected: "finite_number" },
    });
  }

  const min = field.ui?.min;
  const max = field.ui?.max;

  if (typeof min === "number" && value < min) {
    return domainFailure({
      code: "module_field_out_of_range",
      path: "value",
      details: { fieldId: field.id, min, value },
    });
  }

  if (typeof max === "number" && value > max) {
    return domainFailure({
      code: "module_field_out_of_range",
      path: "value",
      details: { fieldId: field.id, max, value },
    });
  }

  return domainSuccess(value);
}

export function validateSimpleModuleFieldValue(
  field: ModuleField,
  value: unknown,
): DomainResult<ModuleFieldValue> {
  if (!isSimpleModuleField(field)) {
    return domainFailure({
      code: "module_field_structured",
      path: "fieldId",
      details: { fieldId: field.id, fieldType: field.type },
    });
  }

  if (field.type === "select") {
    return validateSelectValue(field, value);
  }

  if (field.type === "multiSelect") {
    return validateMultiSelectValue(field, value);
  }

  if (field.type === "checkbox") {
    return typeof value === "boolean"
      ? domainSuccess(value)
      : domainFailure({
          code: "module_field_invalid_value",
          path: "value",
          details: { fieldId: field.id, expected: "boolean" },
        });
  }

  if (field.type === "number" || field.type === "range") {
    return validateNumberValue(field, value);
  }

  return typeof value === "string"
    ? domainSuccess(value)
    : domainFailure({
        code: "module_field_invalid_value",
        path: "value",
        details: { fieldId: field.id, expected: "string" },
      });
}

export type ApplySimpleModuleFieldInput = {
  value: ModuleFieldValue;
  customText?: string;
};

/**
 * Canonical simple-field write semantics shared by global module state and
 * generic named ModuleEntity payloads. This helper deliberately does not know
 * whether the values belong to Global or an entity; callers own that boundary.
 */
export function applySimpleModuleFieldValue(
  sourceValues: ModuleValues,
  field: ModuleField,
  input: ApplySimpleModuleFieldInput,
): DomainResult<ModuleValues> {
  const valueResult = validateSimpleModuleFieldValue(field, input.value);
  if (!valueResult.ok) return valueResult;

  const values = cloneValue(sourceValues);
  values[field.id] = cloneValue(valueResult.value);

  if (field.customInput) {
    const customKey = getModuleFieldCustomValueKey(field);
    const isCustom = isModuleFieldCustomSelection(field, valueResult.value);

    if (input.customText !== undefined && !isCustom) {
      return domainFailure({
        code: "module_field_custom_text_inactive",
        path: "customText",
        details: { fieldId: field.id },
      });
    }

    if (isCustom) {
      if (input.customText !== undefined) {
        values[customKey] = input.customText;
      } else if (values[customKey] === undefined) {
        values[customKey] = "";
      }
    }
  } else if (input.customText !== undefined) {
    return domainFailure({
      code: "module_field_custom_text_unsupported",
      path: "customText",
      details: { fieldId: field.id },
    });
  }

  return domainSuccess(values);
}

/** Remove one local field override and its persisted customInput sidecar. */
export function clearSimpleModuleFieldValue(
  sourceValues: ModuleValues,
  field: ModuleField,
): DomainResult<ModuleValues> {
  if (!isSimpleModuleField(field)) {
    return domainFailure({
      code: "module_field_structured",
      path: "fieldId",
      details: { fieldId: field.id, fieldType: field.type },
    });
  }

  const values = cloneValue(sourceValues);
  delete values[field.id];

  if (field.customInput) {
    delete values[getModuleFieldCustomValueKey(field)];
  }

  return domainSuccess(values);
}
