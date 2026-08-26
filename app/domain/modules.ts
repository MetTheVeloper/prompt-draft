import type {
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import type {
  ModulePanelState,
  PromptDraftState,
} from "../modules/promptDraft.types";
import {
  createDefaultModuleValues,
  getModulePresetValues,
} from "../utils/compileModules";
import {
  getModuleFieldCustomValueKey,
  isModuleFieldCustomSelection,
} from "../utils/moduleFieldValues";
import {
  applySimpleModuleFieldValue,
  SIMPLE_MODULE_FIELD_TYPES,
  type SimpleModuleFieldType,
} from "./moduleFields";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export { SIMPLE_MODULE_FIELD_TYPES } from "./moduleFields";
export type { SimpleModuleFieldType } from "./moduleFields";

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

  const values = currentModuleValues(draft, module);
  const valueResult = applySimpleModuleFieldValue(values, field, {
    value: input.value,
    customText: input.customText,
  });
  if (!valueResult.ok) return valueResult;

  const nextValues = valueResult.value;
  const panelState = currentPanelState(draft, module.key);
  const activePresetId = panelState.activePresetId;

  if (
    activePresetId &&
    !presetMatchesValues(module, activePresetId, nextValues)
  ) {
    panelState.activePresetId = null;
  }

  return moduleMutation(draft, module, nextValues, panelState);
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
