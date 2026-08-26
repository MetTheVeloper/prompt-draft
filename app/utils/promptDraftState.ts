import type { ModuleValues } from "../modules/types";
import type {
  ModulePanelState,
  PromptDraftState,
} from "../modules/promptDraft.types";
import type {
  PromptOutputFormat,
  PromptSettings,
} from "./compilePromptCore";

export type NormalizePromptDraftStateOptions = {
  validModuleKeys: readonly string[];
  defaultPromptSettings: PromptSettings;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isPromptOutputFormat(
  value: unknown,
): value is PromptOutputFormat {
  return value === "modular" || value === "natural" || value === "json";
}

export function createPromptDraftState(
  defaultPromptSettings: PromptSettings,
): PromptDraftState {
  return {
    version: 1,
    selectedModuleKeys: [],
    moduleValues: {},
    modulePanelStates: {},
    promptSettings: cloneJson(defaultPromptSettings),
    outputFormat: "modular",
  };
}

export function clonePromptDraftState(
  state: PromptDraftState,
): PromptDraftState {
  return cloneJson(state);
}

export function normalizePromptDraftState(
  value: unknown,
  options: NormalizePromptDraftStateOptions,
): PromptDraftState {
  const source = isRecord(value) ? value : {};
  const validModuleKeys = new Set(options.validModuleKeys);

  const selectedModuleKeys = Array.isArray(source.selectedModuleKeys)
    ? source.selectedModuleKeys.filter(
        (key): key is string =>
          typeof key === "string" && validModuleKeys.has(key),
      )
    : [];

  const moduleValues = isRecord(source.moduleValues)
    ? cloneJson(source.moduleValues as Record<string, ModuleValues>)
    : {};

  const modulePanelStates = isRecord(source.modulePanelStates)
    ? cloneJson(source.modulePanelStates as Record<string, ModulePanelState>)
    : {};

  const promptSettings = {
    ...cloneJson(options.defaultPromptSettings),
    ...(isRecord(source.promptSettings)
      ? cloneJson(source.promptSettings as Partial<PromptSettings>)
      : {}),
  } as PromptSettings;

  return {
    version: 1,
    selectedModuleKeys,
    moduleValues,
    modulePanelStates,
    promptSettings,
    outputFormat: isPromptOutputFormat(source.outputFormat)
      ? source.outputFormat
      : "modular",
  };
}
