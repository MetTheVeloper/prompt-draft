import type {
  ModuleField,
  ModuleFieldValue,
  ModulePanelState,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import type { PromptDraftState } from "../modules/promptDraft.types";
import {
  createDefaultModuleValues,
  getModulePresetValues,
} from "../utils/compileModules";
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

export type SetPromptModuleFieldInput = {
  fieldId: string;
  value: ModuleFieldValue;
  customText?: string;
};

export type ModuleMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  panelState: ModulePanelState;
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function cloneDraft(draft: PromptDraftState): PromptDraftState {
  return cloneValue(draft);
}

function defaultPanelState(): ModulePanelState {
  return {
    isCustomMode: false,
    activePresetId: null,
  };
}

function isModuleActive(draft: PromptDraftState, moduleKey: string) {
  return draft.selectedModuleKeys.includes(moduleKey);
}

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  const existing = draft.moduleValues[module.key];
  return existing
    ? cloneValue(existing)
    : createDefaultModuleValues(module);
}

function currentPanelState(
  draft: PromptDraftState,
  moduleKey: string,
): ModulePanelState {
  return {
    ...defaultPanelState(),
    ...(cloneValue(draft.modulePanelStates[moduleKey]) || {}),
  };
}

function withModuleState(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  panelState: ModulePanelState,
): PromptDraftState {
  return {
    ...cloneDraft(draft),
    moduleValues: {
      ...cloneValue(draft.moduleValues),
      [module.key]: cloneValue(values),
    },
    modulePanelStates: {
      ...cloneValue(draft.modulePanelStates),
      [module.key]: cloneValue(panelState),
    },
  };
}

function moduleMutation(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  panelState: ModulePanelState,
): DomainResult<ModuleMutation> {
  const nextDraft = withModuleState(draft, module, values, panelState);

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(values),
    panelState: cloneValue(panelState),
  });
}

function isSimpleModuleField(field: ModuleField) {
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

function validateSimpleFieldValue(
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

function valuesEqual(first: ModuleFieldValue, second: ModuleFieldValue) {
  try {
    return JSON.stringify(first) === JSON.stringify(second);
  } catch {
    return first === second;
  }
}

function presetMatchesValues(
  module: PromptKeyModule,
  presetId: string,
  values: ModuleValues,
) {
  const entries = Object.entries(getModulePresetValues(module, presetId));
  if (!entries.length) return false;

  return entries.every(([key, value]) => valuesEqual(values[key], value));
}

export function activatePromptModule(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<ModuleMutation> {
  const values = currentModuleValues(draft, module);
  const panelState = currentPanelState(draft, module.key);
  const nextDraft = withModuleState(draft, module, values, panelState);

  if (!nextDraft.selectedModuleKeys.includes(module.key)) {
    nextDraft.selectedModuleKeys = [
      ...nextDraft.selectedModuleKeys,
      module.key,
    ];
  }

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(values),
    panelState: cloneValue(panelState),
  });
}

export function deactivatePromptModule(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<{ draft: PromptDraftState }> {
  const nextDraft = cloneDraft(draft);
  nextDraft.selectedModuleKeys = nextDraft.selectedModuleKeys.filter(
    (key) => key !== module.key,
  );

  return domainSuccess({ draft: nextDraft });
}

export function setPromptModuleField(
  draft: PromptDraftState,
  module: PromptKeyModule,
  input: SetPromptModuleFieldInput,
): DomainResult<ModuleMutation> {
  if (!isModuleActive(draft, module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = module.fields[input.fieldId];
  if (!field) {
    return domainFailure({
      code: "module_field_not_found",
      path: "fieldId",
      details: { moduleKey: module.key, fieldId: input.fieldId },
    });
  }

  const valueResult = validateSimpleFieldValue(field, input.value);
  if (!valueResult.ok) return valueResult;

  const values = currentModuleValues(draft, module);
  values[field.id] = cloneValue(valueResult.value);

  if (field.customInput) {
    const customKey = getModuleFieldCustomValueKey(field);
    const isCustom = isModuleFieldCustomSelection(field, valueResult.value);

    if (input.customText !== undefined && !isCustom) {
      return domainFailure({
        code: "module_field_custom_text_inactive",
        path: "customText",
        details: { moduleKey: module.key, fieldId: field.id },
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
      details: { moduleKey: module.key, fieldId: field.id },
    });
  }

  const panelState = currentPanelState(draft, module.key);
  const activePresetId = panelState.activePresetId;

  if (
    activePresetId &&
    !presetMatchesValues(module, activePresetId, values)
  ) {
    panelState.activePresetId = null;
  }

  return moduleMutation(draft, module, values, panelState);
}

export function applyPromptModulePreset(
  draft: PromptDraftState,
  module: PromptKeyModule,
  presetId: string,
): DomainResult<ModuleMutation> {
  if (!isModuleActive(draft, module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const preset = module.presets?.[presetId];
  if (!preset) {
    return domainFailure({
      code: "module_preset_not_found",
      path: "presetId",
      details: { moduleKey: module.key, presetId },
    });
  }

  const values = currentModuleValues(draft, module);
  const presetValues = getModulePresetValues(module, presetId);

  Object.entries(presetValues).forEach(([key, value]) => {
    values[key] = cloneValue(value);
  });

  Object.values(module.fields).forEach((field) => {
    if (!field.customInput || !(field.id in presetValues)) return;

    const customKey = getModuleFieldCustomValueKey(field);
    if (isModuleFieldCustomSelection(field, values[field.id])) {
      if (values[customKey] === undefined) {
        values[customKey] = "";
      }
      return;
    }

    values[customKey] = "";
  });

  const panelState = currentPanelState(draft, module.key);
  panelState.activePresetId = presetId;
  panelState.isCustomMode = false;

  return moduleMutation(draft, module, values, panelState);
}

export function setPromptModuleCustomMode(
  draft: PromptDraftState,
  module: PromptKeyModule,
  enabled: boolean,
): DomainResult<ModuleMutation> {
  if (!isModuleActive(draft, module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const overrideField = Object.values(module.fields).find(
    (field) => field.isOverride,
  );

  if (!overrideField) {
    return domainFailure({
      code: "module_custom_mode_unsupported",
      details: { moduleKey: module.key },
    });
  }

  const values = currentModuleValues(draft, module);
  const panelState = currentPanelState(draft, module.key);
  panelState.isCustomMode = enabled;

  return moduleMutation(draft, module, values, panelState);
}
