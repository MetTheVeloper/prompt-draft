// app/modules/types.ts
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

export type TypographyTextAccuracy = "flexible" | "readable" | "exact";

export type TypographyTextDirection = "row" | "column";

export type TypographyWritingDirection =
  | "ltr"
  | "rtl"
  | "vertical_ttb"
  | "vertical_btt";

export type TypographyAlignment =
  | "start"
  | "center"
  | "end"
  | "justify";

export type TypographyDistribution =
  | "compact"
  | "balanced"
  | "spaced"
  | "scattered";

export type TypographyTextBlock = {
  id?: string;
  layerName: string;
  text: string;
  purpose?: string;
  customPurpose?: string;
  fontStyle?: string;
  customFontStyle?: string;
  fontSize?: string;
  customFontSize?: string;
  fontWeight?: string;
  customFontWeight?: string;
  additionalDescription?: string;
};

export type TypographyTextGroup = {
  id?: string;
  groupName: string;
  groupPurpose?: string;
  customGroupPurpose?: string;
  positionPreset?: string;
  customPositionDescription?: string;
  direction?: TypographyTextDirection;
  writingDirection?: TypographyWritingDirection;
  alignment?: TypographyAlignment;
  distribution?: TypographyDistribution;
  texts: TypographyTextBlock[];
  additionalDescription?: string;
};

export type ModuleFieldConfig = Record<string, unknown>;

export type PromptVariableType =
  | 'text'
  | 'subject'
  | 'reference'
  | 'object'
  | 'color'
  | 'custom'

export type PromptVariable = {
  id: string
  key: string
  value: string
  description?: string
  type?: PromptVariableType
  enabled: boolean
}

export type ModuleFieldType =
  | 'text'
  | 'textarea'
  | 'colorAssignments'
  | 'textGroups'
  | 'variables'
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
  | TypographyTextGroup[]
  | PromptVariable[]
  | Record<string, unknown>[]
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
  component?: 'input' | 'textarea' | 'select' | 'multiSelect' | 'segmented' | 'checkbox' | 'slider' | 'color' | 'colorAssignments' | 'textGroups' | 'variables'
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
  config?: ModuleFieldConfig
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