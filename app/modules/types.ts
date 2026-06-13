export type ModuleFieldWidth = "half" | "full";

export type ModuleFieldOptionLayout = "default" | "categorized";

export type ModuleFieldCompatibilityMode = "sort-and-hint";

export type ModuleOptionCompatibility = {
  preferredTags?: string[];
  supportedTags?: string[];
  discouragedTags?: string[];
  warningKey?: string;
};

export type ModuleFieldCompatibilityConfig = {
  dependsOn: string;
  mode: ModuleFieldCompatibilityMode;
};

export type ModuleFieldOption = {
  value: string;
  promptText?: string;
  disabled?: boolean;
  tags?: string[];

  category?: string;
  categoryLabel?: string;
  categoryLabelKey?: string;

  compatibility?: ModuleOptionCompatibility;
};

export type ModuleFieldType =
  | 'text'
  | 'textarea'
  | 'colorAssignments'
  | 'select'
  | 'multiSelect'
  | 'checkbox'
  | 'color'
  | 'number'
  | 'range'

export type ModuleFieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined

export type ModuleValues = Record<string, ModuleFieldValue>

export interface ModuleOption extends ModuleFieldOption {
  order?: number;
}

export type ModuleFieldUi = {
  component?: "select" | "segmented" | "textarea" | "input";
  searchable?: boolean;
  clearable?: boolean;
  width?: ModuleFieldWidth;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;

  optionLayout?: ModuleFieldOptionLayout;
};

export interface ModuleFieldUiConfig {
  component?: 'input' | 'textarea' | 'select' | 'multiSelect' | 'segmented' | 'checkbox' | 'slider' | 'color' | 'colorAssignments'
  placeholder?: string
  rows?: number
  width?: 'full' | 'half' | 'third'
  clearable?: boolean
  searchable?: boolean
  multiple?: boolean
  min?: number
  max?: number
  step?: number

  optionLayout?: ModuleFieldOptionLayout
  compatibility?: ModuleFieldCompatibilityConfig
}

export interface ModuleField {
  id: string
  type: ModuleFieldType
  default?: ModuleFieldValue
  group?: string
  order?: number
  options?: ModuleOption[]
  isOverride?: boolean
  promptText?: string
  ui?: ModuleFieldUiConfig
}

export interface ModuleGroup {
  id: string
  order?: number
  defaultOpen?: boolean
}

export interface ModulePreset {
  id: string
  order?: number
  values: ModuleValues
}

export interface ModuleCompileConfig {
  separator?: string
  removeDuplicates?: boolean
  ignoreEmpty?: boolean
  overrideField?: string
}

export interface PromptKeyModule {
  key: string
  icon?: string
  groups?: Record<string, ModuleGroup>
  fields: Record<string, ModuleField>
  presets?: Record<string, ModulePreset>
  compile?: ModuleCompileConfig
}