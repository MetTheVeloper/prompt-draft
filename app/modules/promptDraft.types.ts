import type { ModuleValues } from "./types";
import type {
  PromptOutputFormat,
  PromptSettings,
} from "../utils/compilePromptCore";

/**
 * Persisted module editor mode. This is application state because it changes
 * how a module's canonical values are interpreted/compiled, but transient UI
 * state such as expanded cards and open modals does not belong here.
 */
export type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

/**
 * Canonical serializable state consumed by domain services and Actions API.
 * Storage/session metadata is deliberately kept outside this contract.
 */
export type PromptDraftState = {
  version: 1;
  selectedModuleKeys: string[];
  moduleValues: Record<string, ModuleValues>;
  modulePanelStates: Record<string, ModulePanelState>;
  promptSettings: PromptSettings;
  outputFormat: PromptOutputFormat;
};

/**
 * Timestamped snapshot used by the existing draft persistence flow.
 */
export type PromptDraftSnapshot = PromptDraftState & {
  updatedAt: string;
};

export type PromptDraftRecord = PromptDraftSnapshot & {
  id: string;
  title: string;
  createdAt: string;
};

export type PromptDraftCollection = {
  version: 1;
  activeDraftId: string | null;
  drafts: PromptDraftRecord[];
};
