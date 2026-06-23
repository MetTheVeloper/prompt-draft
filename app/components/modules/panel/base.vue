<script setup lang="ts">

import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";

import type {
  ModuleField,
  ModulePreset,
  ModuleValues,
  ModuleFieldOption,
  PromptKeyModule,
  PromptVariable,
  PromptVariableType,
} from "../../../modules/types";

import type { PromptValidationIssue } from "../../../utils/promptValidation";

import {
  compileModule,
  createDefaultModuleValues,
  getModulePresetValues,
} from "../../../utils/compileModules";

import {
  createUniqueVariableKey,
  formatVariableToken,
  isReservedVariableKey,
  isValidVariableKey,
  normalizeVariableKey,
} from "../../../utils/promptVariables";

import { usePromptEditor } from "~/composables/prompt/usePromptEditor";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

const { t } = useI18n();
const { mobile, mini } = useScreen();

const promptEditor = usePromptEditor();

const {
  setPromptVariables: setGlobalPromptVariables,
  clearPromptVariables,
} = usePromptVariables();


const props = defineProps<{
  module: PromptKeyModule;
  modelValue?: ModuleValues;
  panelState?: ModulePanelState;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleValues): void;
  (event: "update:panelState", value: ModulePanelState): void;
  (event: "update:output", value: string): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
}>();

type ModuleGroupView = {
  id: string;
  order: number;
  defaultOpen: boolean;
  fields: ModuleField[];
};

type SelectOption = NonNullable<ModuleField["options"]>[number] & {
  category?: string;
  categoryLabel?: string;
  categoryLabelKey?: string;
};

type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

const values = reactive<ModuleValues>({});
const isSyncingValues = ref(false);
const isSyncingPanelState = ref(false);

watch(
  values,
  () => {
    if (props.module.key !== "variables") return;

    const variableList = values.variables;

    setGlobalPromptVariables(
      Array.isArray(variableList) ? variableList as PromptVariable[] : []
    );
  },
  {
    deep: true,
    immediate: true,
  }
);

// 
type PromptEditableElement = HTMLInputElement | HTMLTextAreaElement;

function isPromptEditableTarget(target: EventTarget | null): target is PromptEditableElement {
  if (!target) return false;

  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function promptEditorId(fieldId: string, suffix = "") {
  return `${props.module.key}:${fieldId}${suffix ? `:${suffix}` : ""}`;
}

function handleEditorFocus(event: Event, fieldId: string, suffix = "") {
  if (!isPromptEditableTarget(event.target)) return;

  promptEditor.registerEditor(promptEditorId(fieldId, suffix), event.target);
}

function handleEditorBlur(fieldId: string, suffix = "") {
  promptEditor.blurEditor(promptEditorId(fieldId, suffix));
}

function handleEditorCursor(event: Event) {
  if (!isPromptEditableTarget(event.target)) return;

  promptEditor.updateCursor(event.target);
}
// 
function cloneModuleValues(source?: ModuleValues): ModuleValues {
  if (!source) return {};

  try {
    return JSON.parse(JSON.stringify(source));
  } catch {
    return { ...source };
  }
}

function syncValuesFromModel(modelValue?: ModuleValues) {
  isSyncingValues.value = true;

  const defaults = createDefaultModuleValues(props.module);
  const nextValues = {
    ...defaults,
    ...cloneModuleValues(modelValue),
  };

  Object.keys(values).forEach((key) => {
    delete values[key];
  });

  Object.assign(values, nextValues);

  nextTick(() => {
    isSyncingValues.value = false;
  });
}

watch(
  () => props.modelValue,
  (modelValue) => {
    syncValuesFromModel(modelValue);
  },
  {
    immediate: true,
    deep: true,
  }
);

watch(
  values,
  (nextValues) => {
    if (isSyncingValues.value) return;

    emit("update:modelValue", cloneModuleValues(nextValues));
  },
  {
    deep: true,
  }
);

const isCopied = ref(false);
const isCustomMode = ref(false);
const isPanelExpanded = ref(false);
const activePresetId = ref<string | null>(null);

watch(
  () => props.panelState,
  (panelState) => {
    isSyncingPanelState.value = true;

    isCustomMode.value = Boolean(panelState?.isCustomMode);
    activePresetId.value = panelState?.activePresetId ?? null;

    nextTick(() => {
      isSyncingPanelState.value = false;
    });
  },
  {
    immediate: true,
    deep: true,
  }
);

watch(
  [isCustomMode, activePresetId],
  () => {
    if (isSyncingPanelState.value) return;

    emit("update:panelState", {
      isCustomMode: isCustomMode.value,
      activePresetId: activePresetId.value,
    });
  }
);

const openGroups = reactive<Record<string, boolean>>({});
const selectedOptionCategories = reactive<Record<string, string>>({});
const moduleI18nBase = computed(() => `modules.${props.module.key}`);

const fields = computed(() => {
  return Object.values(props.module.fields).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
});

const overrideField = computed(() => {
  return fields.value.find((field) => field.isOverride);
});

const hasOverrideField = computed(() => {
  return Boolean(overrideField.value);
});

const normalFields = computed(() => {
  return fields.value.filter((field) => !field.isOverride);
});

const presetItems = computed<ModulePreset[]>(() => {
  return Object.values(props.module.presets || {}).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
});

const groupedFields = computed<ModuleGroupView[]>(() => {
  const groupMap = new Map<string, ModuleField[]>();

  normalFields.value.forEach((field) => {
    const groupId = field.group || "default";

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, []);
    }

    groupMap.get(groupId)?.push(field);
  });

  const definedGroups = Object.values(props.module.groups || {}).map((group) => {
    return {
      id: group.id,
      order: group.order ?? 0,
      defaultOpen: group.defaultOpen ?? true,
      fields: groupMap.get(group.id) || [],
    };
  });

  const definedGroupIds = new Set(definedGroups.map((group) => group.id));

  const orphanGroups = Array.from(groupMap.entries())
    .filter(([groupId]) => !definedGroupIds.has(groupId))
    .map(([groupId, groupFields]) => {
      return {
        id: groupId,
        order: 999,
        defaultOpen: true,
        fields: groupFields,
      };
    });

  return [...definedGroups, ...orphanGroups]
    .filter((group) => group.fields.length > 0)
    .sort((a, b) => a.order - b.order)
    .map((group) => {
      return {
        ...group,
        fields: [...group.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      };
    });
});

watch(
  groupedFields,
  (groups) => {
    groups.forEach((group) => {
      if (openGroups[group.id] === undefined) {
        openGroups[group.id] = group.defaultOpen;
      }
    });
  },
  {
    immediate: true,
  }
);

const customOverrideValue = computed(() => {
  if (!overrideField.value) return "";

  return String(values[overrideField.value.id] ?? "").trim();
});

const effectiveValues = computed<ModuleValues>(() => {
  const nextValues: ModuleValues = { ...values };

  if (overrideField.value) {
    nextValues[overrideField.value.id] = "";
  }

  return nextValues;
});

const output = computed(() => {
  if (isCustomMode.value && overrideField.value) {
    return customOverrideValue.value;
  }

  return compileModule(props.module, effectiveValues.value);
});

const isCustomOverride = computed(() => {
  if (!isCustomMode.value || !overrideField.value) return false;

  return Boolean(customOverrideValue.value);
});

const moduleTitle = computed(() => {
  return translate(`${moduleI18nBase.value}.title`, props.module.key);
});

const moduleDescription = computed(() => {
  return translate(`${moduleI18nBase.value}.description`);
});

const validationIssues = computed<PromptValidationIssue[]>(() => {
  if (isCustomMode.value && overrideField.value && !customOverrideValue.value) {
    return [
      {
        id: `${props.module.key}:custom_override_empty`,
        code: "custom_override_empty",
        level: "error",
        moduleKey: props.module.key,
        moduleLabel: moduleTitle.value,
      },
    ];
  }

  return [];
});

const filledNormalFieldsCount = computed(() => {
  return normalFields.value.filter(isFieldFilled).length;
});

const totalNormalFieldsCount = computed(() => {
  return normalFields.value.length;
});

const hasAnyValue = computed(() => {
  return fields.value.some(isFieldFilled);
});

const hasVisibleEditor = computed(() => {
  if (isCustomMode.value) return Boolean(overrideField.value);

  return groupedFields.value.length > 0 || presetItems.value.length > 0;
});

const moduleStatusLabel = computed(() => {
  if (isCustomMode.value) {
    return isCustomOverride.value
      ? t("panel.statusCustom")
      : t("panel.statusCustomEmpty");
  }

  if (activePresetId.value) {
    return t("panel.statusPreset");
  }

  if (filledNormalFieldsCount.value > 0) {
    return t("panel.statusPartiallyFilled");
  }

  return t("panel.statusEmpty");
});

watch(
  output,
  (value) => {
    emit("update:output", value);
  },
  {
    immediate: true,
  }
);

watch(
  validationIssues,
  (issues) => {
    emit("update:issues", issues);
  },
  {
    immediate: true,
  }
);


function translate(path: string, fallback = "") {
  const translated = t(path);

  return translated === path ? fallback : translated;
}

function groupTitle(groupId: string) {
  return translate(`${moduleI18nBase.value}.groups.${groupId}.title`, groupId);
}

function groupDescription(groupId: string) {
  return translate(`${moduleI18nBase.value}.groups.${groupId}.description`);
}

function fieldLabel(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.label`, fieldId);
}

function fieldDescription(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.description`);
}

function fieldPlaceholder(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.placeholder`);
}

function optionLabel(fieldId: string, optionValue: string) {
  return translate(
    `${moduleI18nBase.value}.fields.${fieldId}.options.${optionValue}`,
    optionValue
  );
}

function presetLabel(presetId: string) {
  return translate(`${moduleI18nBase.value}.presets.${presetId}.label`, presetId);
}

function presetDescription(presetId: string) {
  return translate(`${moduleI18nBase.value}.presets.${presetId}.description`);
}

function isGroupOpen(group: ModuleGroupView) {
  return openGroups[group.id] ?? group.defaultOpen;
}

function toggleGroup(groupId: string) {
  openGroups[groupId] = !openGroups[groupId];
}

function togglePanel() {
  isPanelExpanded.value = !isPanelExpanded.value;
}

function isFieldFilled(field: ModuleField) {
  const value = values[field.id];

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return !Number.isNaN(value);
  }

  return String(value ?? "").trim().length > 0;
}

function getGroupFilledCount(group: ModuleGroupView) {
  return group.fields.filter(isFieldFilled).length;
}

function fieldClasses(field: ModuleField) {
  const fieldWidth = field.ui?.width || "half";

  return {
    "module-panel__field--filled": isFieldFilled(field),
    "module-panel__field--full":
      fieldWidth === "full" ||
      field.type === "textarea" ||
      field.type === "multiSelect" ||
      field.type === "textGroups" ||
      field.type === "variables" ||
      isCategorizedSelect(field),
    "module-panel__field--half": fieldWidth !== "full",
    "module-panel__field--checkbox": field.type === "checkbox",
    "module-panel__field--range": field.type === "range",
  };
}

function getRawFieldOptions(field: ModuleField) {
  return (field.options || []) as SelectOption[];
}

function getFieldDependency(field: ModuleField) {
  const dependsOn = field.ui?.compatibility?.dependsOn;

  if (!dependsOn) return null;

  const dependencyField = props.module.fields[dependsOn];

  if (!dependencyField) return null;

  const dependencyValue = String(values[dependsOn] ?? "");

  if (!dependencyValue) return null;

  const dependencyOption = getRawFieldOptions(dependencyField).find((option) => {
    return option.value === dependencyValue;
  });

  if (!dependencyOption) return null;

  return {
    field: dependencyField,
    value: dependencyValue,
    option: dependencyOption,
    tags: dependencyOption.tags || [],
  };
}

function hasTagMatch(sourceTags: string[] = [], targetTags: string[] = []) {
  return sourceTags.some((tag) => targetTags.includes(tag));
}

function getCompatibilityScore(option: SelectOption, dependencyTags: string[]) {
  const compatibility = option.compatibility;

  if (!compatibility || dependencyTags.length === 0) return 0;

  let score = 0;

  if (hasTagMatch(dependencyTags, compatibility.preferredTags)) {
    score += 30;
  }

  if (hasTagMatch(dependencyTags, compatibility.supportedTags)) {
    score += 10;
  }

  if (hasTagMatch(dependencyTags, compatibility.discouragedTags)) {
    score -= 50;
  }

  return score;
}

function sortOptionsByCompatibility(field: ModuleField, options: SelectOption[]) {
  if (field.ui?.compatibility?.mode !== "sort-and-hint") {
    return options;
  }

  const dependency = getFieldDependency(field);

  if (!dependency) return options;

  return [...options]
    .map((option, index) => {
      return {
        option,
        index,
        score: getCompatibilityScore(option, dependency.tags),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return a.index - b.index;
    })
    .map((item) => item.option);
}

function isOptionDiscouraged(field: ModuleField, option: SelectOption) {
  if (field.ui?.compatibility?.mode !== "sort-and-hint") return false;

  const dependency = getFieldDependency(field);

  if (!dependency) return false;

  return hasTagMatch(dependency.tags, option.compatibility?.discouragedTags);
}

function getSelectedOptions(field: ModuleField) {
  const currentValue = values[field.id];
  const options = getRawFieldOptions(field);

  if (Array.isArray(currentValue)) {
    return options.filter((option) => currentValue.includes(option.value));
  }

  const stringValue = String(currentValue ?? "");

  if (!stringValue) return [];

  const selectedOption = options.find((option) => option.value === stringValue);

  return selectedOption ? [selectedOption] : [];
}

function getFieldCompatibilityWarnings(field: ModuleField) {
  if (field.ui?.compatibility?.mode !== "sort-and-hint") return [];

  return getSelectedOptions(field)
    .filter((option) => isOptionDiscouraged(field, option))
    .map((option) => {
      return {
        value: option.value,
        key: option.compatibility?.warningKey || "",
      };
    })
    .filter((warning) => warning.key);
}

function compatibilityWarningLabel(warningKey: string) {
  return translate(warningKey, "");
}

function getFieldOptions(field: ModuleField) {
  return sortOptionsByCompatibility(field, getRawFieldOptions(field));
}

function isCategorizedSelect(field: ModuleField) {
  return field.type === "select" && field.ui?.optionLayout === "categorized";
}

function isCategorizedMultiSelect(field: ModuleField) {
  return field.ui?.component === 'multiSelect' && field.ui?.optionLayout === 'categorized';
}

function getFieldOptionCategories(field: ModuleField) {
  const categories = new Map<string, string>();

  getFieldOptions(field).forEach((option) => {
    if (!option.category) return;

    categories.set(option.category, option.categoryLabelKey || option.categoryLabel || option.category);
  });

  return Array.from(categories.entries()).map(([value, label]) => {
    return {
      value,
      label,
    };
  });
}

function getSelectedOption(field: ModuleField) {
  const currentValue = String(values[field.id] ?? "");

  return getFieldOptions(field).find((option) => option.value === currentValue);
}

function getActiveOptionCategory(field: ModuleField) {
  const selectedOption = getSelectedOption(field);

  return selectedOptionCategories[field.id] || selectedOption?.category || "";
}

function getVisibleCategorizedOptions(field: ModuleField) {
  const activeCategory = getActiveOptionCategory(field);

  if (!activeCategory) return [];

  return getFieldOptions(field).filter((option) => {
    return option.category === activeCategory;
  });
}


type PromptVariablePatch = Partial<PromptVariable>;

function createVariableId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `variable_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getVariableTypeOptions(field: ModuleField) {
  const configuredOptions = field.config?.typeOptions;

  if (Array.isArray(configuredOptions) && configuredOptions.length) {
    return configuredOptions as ModuleFieldOption[];
  }

  return [
    { value: "text" },
    { value: "subject" },
    { value: "reference" },
    { value: "object" },
    { value: "color" },
    { value: "custom" },
  ];
}

function getPromptVariables(fieldId: string): PromptVariable[] {
  const value = values[fieldId];

  if (Array.isArray(value)) {
    return value as PromptVariable[];
  }

  values[fieldId] = [];

  return values[fieldId] as PromptVariable[];
}

function setPromptVariables(fieldId: string, variables: PromptVariable[]) {
  values[fieldId] = variables;
}

function getExistingVariableKeys(fieldId: string, exceptIndex?: number) {
  return getPromptVariables(fieldId)
    .filter((_, index) => index !== exceptIndex)
    .map((variable) => normalizeVariableKey(variable.key));
}

function createPromptVariable(fieldId: string, baseKey = "variable"): PromptVariable {
  const key = createUniqueVariableKey(baseKey, getExistingVariableKeys(fieldId));

  return {
    id: createVariableId(),
    key,
    value: "",
    description: "",
    type: "text",
    enabled: true,
  };
}

function addPromptVariable(fieldId: string) {
  const variables = [...getPromptVariables(fieldId), createPromptVariable(fieldId)];
  setPromptVariables(fieldId, variables);
}

function duplicatePromptVariable(fieldId: string, variableIndex: number) {
  const variables = getPromptVariables(fieldId);
  const source = variables[variableIndex];

  if (!source) return;

  const key = createUniqueVariableKey(source.key || "variable", getExistingVariableKeys(fieldId));
  const duplicated: PromptVariable = {
    ...source,
    id: createVariableId(),
    key,
  };

  setPromptVariables(fieldId, [...variables, duplicated]);
}

function removePromptVariable(fieldId: string, variableIndex: number) {
  const variables = getPromptVariables(fieldId).filter(
    (_, index) => index !== variableIndex
  );

  setPromptVariables(fieldId, variables);
}

function updatePromptVariable(
  fieldId: string,
  variableIndex: number,
  patch: PromptVariablePatch
) {
  const variables = [...getPromptVariables(fieldId)];
  const current = variables[variableIndex];

  if (!current) return;

  variables[variableIndex] = {
    ...current,
    ...patch,
  };

  setPromptVariables(fieldId, variables);
}

function handleVariableKeyInput(
  fieldId: string,
  variableIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement;
  updatePromptVariable(fieldId, variableIndex, {
    key: target.value,
  });
}

function normalizePromptVariableKey(fieldId: string, variableIndex: number) {
  const variables = getPromptVariables(fieldId);
  const current = variables[variableIndex];

  if (!current) return;

  const normalizedKey = normalizeVariableKey(current.key);

  if (isReservedVariableKey(normalizedKey)) {
    updatePromptVariable(fieldId, variableIndex, {
      key: normalizedKey,
    });
    return;
  }

  const key = createUniqueVariableKey(
    normalizedKey,
    getExistingVariableKeys(fieldId, variableIndex)
  );

  updatePromptVariable(fieldId, variableIndex, {
    key,
  });
}

function handleVariableValueInput(
  fieldId: string,
  variableIndex: number,
  event: Event
) {
  const target = event.target as HTMLTextAreaElement;
  updatePromptVariable(fieldId, variableIndex, {
    value: target.value,
  });
}

function handleVariableDescriptionInput(
  fieldId: string,
  variableIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement;
  updatePromptVariable(fieldId, variableIndex, {
    description: target.value,
  });
}

function handleVariableTypeChange(
  fieldId: string,
  variableIndex: number,
  event: Event
) {
  const target = event.target as HTMLSelectElement;
  updatePromptVariable(fieldId, variableIndex, {
    type: target.value as PromptVariableType,
  });
}

function handleVariableEnabledChange(
  fieldId: string,
  variableIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement;
  updatePromptVariable(fieldId, variableIndex, {
    enabled: target.checked,
  });
}

function getVariableNormalizedKey(variable: PromptVariable) {
  return normalizeVariableKey(variable.key);
}

function getVariableToken(variable: PromptVariable) {
  return formatVariableToken(getVariableNormalizedKey(variable));
}

function getVariableKeyIssue(fieldId: string, variable: PromptVariable, variableIndex: number) {
  const key = getVariableNormalizedKey(variable);

  if (!isValidVariableKey(key)) {
    return "Invalid variable key.";
  }

  if (isReservedVariableKey(key)) {
    return "This key is reserved for internal typography tokens.";
  }

  const duplicate = getPromptVariables(fieldId).some((item, index) => {
    if (index === variableIndex) return false;

    return normalizeVariableKey(item.key) === key;
  });

  if (duplicate) {
    return "Duplicate variable key.";
  }

  return "";
}

function variableTypeLabel(field: ModuleField, optionValue: string) {
  return translate(
    `${moduleI18nBase.value}.fields.${field.id}.types.${optionValue}`,
    optionValue
  );
}

type ColorAssignmentMode = "preset" | "custom";

type ColorAssignmentUsage =
  | "overall"
  | "background"
  | "subject"
  | "outfit"
  | "hair"
  | "lighting"
  | "accents";

function colorPalettePresetLabel(option: ModuleFieldOption) {
  return option.value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type ColorAssignmentItem = {
  mode: ColorAssignmentMode;
  preset: string;
  colors: string[];
  usage: ColorAssignmentUsage;
};

function getColorPalettePresetOptions(field: ModuleField) {
  return field.options || [];
}

function getColorPalettePresetCategories(field: ModuleField) {
  const categories = new Map<string, string>();

  getColorPalettePresetOptions(field).forEach((option) => {
    if (!option.category) return;

    categories.set(option.category, option.categoryLabel || option.category);
  });

  return Array.from(categories.entries()).map(([value, label]) => ({
    value,
    label,
  }));
}

function getColorPalettePresetsByCategory(field: ModuleField, category: string) {
  return getColorPalettePresetOptions(field).filter((option) => {
    return option.category === category;
  });
}


function createColorAssignment(): ColorAssignmentItem {
  return {
    mode: "preset",
    preset: "",
    colors: [],
    usage: "overall",
  };
}

function getColorAssignments(fieldId: string): ColorAssignmentItem[] {
  const value = values[fieldId];

  if (Array.isArray(value)) {
    return value as ColorAssignmentItem[];
  }

  values[fieldId] = [];

  return values[fieldId] as ColorAssignmentItem[];
}

function setColorAssignments(fieldId: string, assignments: ColorAssignmentItem[]) {
  values[fieldId] = assignments;
}

function addColorAssignment(fieldId: string) {
  const assignments = [...getColorAssignments(fieldId), createColorAssignment()];
  setColorAssignments(fieldId, assignments);
}

function removeColorAssignment(fieldId: string, assignmentIndex: number) {
  const assignments = getColorAssignments(fieldId).filter(
    (_, index) => index !== assignmentIndex
  );

  setColorAssignments(fieldId, assignments);
}

function updateColorAssignmentMode(
  fieldId: string,
  assignmentIndex: number,
  event: Event
) {
  const target = event.target as HTMLSelectElement;
  const mode = target.value as ColorAssignmentMode;

  const assignments = [...getColorAssignments(fieldId)];
  const current = assignments[assignmentIndex];

  assignments[assignmentIndex] = {
    ...current,
    mode,
    preset: mode === "preset" ? current.preset : "",
    colors: mode === "custom" ? current.colors || [] : [],
  };

  setColorAssignments(fieldId, assignments);
}

function updateColorAssignmentUsage(
  fieldId: string,
  assignmentIndex: number,
  event: Event
) {
  const target = event.target as HTMLSelectElement;
  const usage = target.value as ColorAssignmentUsage;

  const assignments = [...getColorAssignments(fieldId)];
  assignments[assignmentIndex] = {
    ...assignments[assignmentIndex],
    usage,
  };

  setColorAssignments(fieldId, assignments);
}

function updateColorAssignmentPreset(
  fieldId: string,
  assignmentIndex: number,
  event: Event
) {
  const target = event.target as HTMLSelectElement;

  const assignments = [...getColorAssignments(fieldId)];
  assignments[assignmentIndex] = {
    ...assignments[assignmentIndex],
    preset: target.value,
  };

  setColorAssignments(fieldId, assignments);
}

function addColorAssignmentColor(fieldId: string, assignmentIndex: number) {
  const assignments = [...getColorAssignments(fieldId)];
  const current = assignments[assignmentIndex];

  assignments[assignmentIndex] = {
    ...current,
    colors: [...(current.colors || []), "#000000"],
  };

  setColorAssignments(fieldId, assignments);
}

function removeColorAssignmentColor(
  fieldId: string,
  assignmentIndex: number,
  colorIndex: number
) {
  const assignments = [...getColorAssignments(fieldId)];
  const current = assignments[assignmentIndex];

  assignments[assignmentIndex] = {
    ...current,
    colors: (current.colors || []).filter((_, index) => index !== colorIndex),
  };

  setColorAssignments(fieldId, assignments);
}

function updateColorAssignmentColor(
  fieldId: string,
  assignmentIndex: number,
  colorIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement;
  const assignments = [...getColorAssignments(fieldId)];
  const current = assignments[assignmentIndex];
  const colors = [...(current.colors || [])];

  colors[colorIndex] = target.value;

  assignments[assignmentIndex] = {
    ...current,
    colors,
  };

  setColorAssignments(fieldId, assignments);
}

function handleOptionCategoryChange(field: ModuleField, event: Event) {
  const target = event.target as HTMLSelectElement;
  const nextCategory = target.value;

  selectedOptionCategories[field.id] = nextCategory;
  values[field.id] = "";
}

function optionCategoryLabel(field: ModuleField, categoryValue: string, fallback: string) {
  if (fallback.startsWith("modules.")) {
    return translate(fallback, categoryValue);
  }

  return translate(
    `${moduleI18nBase.value}.fields.${field.id}.categories.${categoryValue}`,
    fallback
  );
}

function applyPreset(presetKey: string) {
  const presetValues = getModulePresetValues(props.module, presetKey);

  Object.entries(presetValues).forEach(([key, value]) => {
    values[key] = value;
  });

  activePresetId.value = presetKey;
  isCustomMode.value = false;
  isPanelExpanded.value = true;
}

watch(
  () => String(values.preset ?? ""),
  (nextPresetKey) => {
    if (!props.module.presets) return;

    if (!nextPresetKey) {
      activePresetId.value = null;
      return;
    }

    if (activePresetId.value === nextPresetKey) return;

    const presetExists = Boolean(props.module.presets[nextPresetKey]);

    if (!presetExists) return;

    applyPreset(nextPresetKey);
  }
);


function clearModule() {
  const defaults = createDefaultModuleValues(props.module);

  if (isCustomMode.value && overrideField.value) {
    values[overrideField.value.id] = defaults[overrideField.value.id] ?? "";
    return;
  }

  normalFields.value.forEach((field) => {
    values[field.id] = defaults[field.id] ?? "";
  });

  activePresetId.value = null;
}

async function copyOutput() {
  if (!output.value) return;

  try {
    await navigator.clipboard.writeText(output.value);
    isCopied.value = true;

    window.setTimeout(() => {
      isCopied.value = false;
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

onBeforeUnmount(() => {
  if (props.module.key === "variables") {
    clearPromptVariables();
  }
});

</script>

<template>
  <el-grid type="section" :p="mobile ? 12 : mini ? 16 : 20" :br="2" :bc="!isPanelExpanded ? 'normal10' : 'blue50'"
    :radius="mobile ? 16 : mini ? 24 : 32" bg="surface" :class="['w100']">
    <!-- module head -->
    <el-flex rules="csc" class="w100">
      <el-flex rules="ccs" class="w100">
        <el-flex :rules="mini ? 'ccs' : 'rbc'" class="w100">
          <!-- key module label and fill state -->
          <el-flex rules="rcc" :gap="16">
            <el-text type="span" marker="blue5" color="blue" :size="12" :weight="700">
              {{ t("panel.keyModule") }}
            </el-text>

            <el-text type="span" marker="orange5" color="orange" :size="12" :weight="700">
              {{ moduleStatusLabel }}
            </el-text>
            <el-text type="span" :size="10" color="orange">
              {{ filledNormalFieldsCount }} / {{ totalNormalFieldsCount }}
              {{ t("panel.fieldsFilled") }}
            </el-text>
          </el-flex>
          <!-- actions -->
          <el-flex rules="rcc" :class="mini ? 'w100' : ''">
            <el-switch v-if="hasOverrideField" :class="mini ? 'fg100' : ''" :value="isCustomMode"
              @click="isCustomMode = !isCustomMode" :label="t('panel.customMode')" />
            <el-button type="fab" :size="14" @click="clearModule" :disable="!hasAnyValue" mode="flat" :p="8"
              :label="isCustomMode ? t('panel.clearCustom') : t('panel.clear')" icon="trash" />
            <el-button type="fab" :size="14" @click="copyOutput" :disable="!output" :mode="isCopied ? 'flat' : 'normal'"
              color="prim" :p="8" :label="isCopied ? t('panel.copied') : t('panel.copy')"
              :icon="isCopied ? 'tick' : 'document-copy'" />
            <el-button type="fab" :size="14" @click="togglePanel" mode="flat" color="prim" :p="8"
              :label="!isPanelExpanded ? t('panel.expand') : t('panel.collapse')"
              :icon="!isPanelExpanded ? 'arrow-down-1' : 'arrow-up'" />
          </el-flex>
        </el-flex>
        <el-flex rules="ccs" class="w100 crp" :gap="4" @click="togglePanel">
          <el-text type="h2" :size="24" :weight="800" class="lh1" effect="glitch" :icon="module.icon">
            {{ moduleTitle.toUpperCase() }}
          </el-text>
          <el-text type="p" :size="14" :weight="200" icon="info-circle" color="normal60" icon-color="normal50"
            v-if="moduleDescription">
            {{ moduleDescription }}
          </el-text>
        </el-flex>
        <el-divider mode="dashed" :dash="4" :gap="2" class="mt12 mb12" />
        <el-text type="span" :size="12" :color="output ? 'normal50' : 'red80'" v-if="!isPanelExpanded">
          {{ output ? output : t("panel.emptyOutput") }}
        </el-text>
      </el-flex>
    </el-flex>
    <el-grid :gap="12" v-show="isPanelExpanded" class="w100">
      <!-- preset -->
      <el-grid v-if="!isCustomMode && presetItems.length">
        <!-- header -->
        <el-flex rules="ccs" :gap="0" class="w100">
          <el-flex rules="ccs" class="w100">
            <el-flex rules="rbc" class="w100">
              <el-text type="h3" :size="16" :weight="600" class="lh1">
                {{ t("panel.presets") }}
              </el-text>
              <el-text marker="blue15" :size="12" color="white" icon-color="white" :weight="300" v-if="activePresetId"
                icon="tick">
                {{ t("panel.presetSelected") }}
              </el-text>
            </el-flex>
            <el-text :size="10" :weight="300">
              {{ t("panel.presetsDescription") }}
            </el-text>
          </el-flex>
        </el-flex>

        <el-flex rules="rsc" class="fw" :gap="4">
          <el-text v-for="preset in presetItems" :key="preset.id" :size="14" class="pl8 pr8 pt4 pb4 crp"
            :title="presetDescription(preset.id)" @click="applyPreset(preset.id)"
            :marker="activePresetId === preset.id ? 'blue' : 'surface5'"
            :icon="activePresetId === preset.id ? 'tick' : 'component'"
            :icon-color="activePresetId === preset.id ? 'white' : 'normal50'"
            :color="activePresetId === preset.id ? 'white' : 'normal80'">
            {{ presetLabel(preset.id) }}
          </el-text>
        </el-flex>
      </el-grid>

      <!-- custom override -->
      <el-grid rules="csc" :br="1" :p="16" :radius="[16]" :bc="!customOverrideValue ? 'orange25' : 'normal15'"
        :bg="!customOverrideValue ? 'orange5' : 'normal5'" v-if="isCustomMode && overrideField"
        :class="{ 'module-panel__custom-card--empty': !customOverrideValue }">
        <!-- header -->
        <el-flex rules="ccs" :gap="0" class="w100">
          <el-flex rules="ccs" class="w100">
            <el-flex rules="rbc" class="w100">
              <el-text type="h3" :size="16" :weight="600" class="lh1" icon="edit">
                {{ fieldLabel(overrideField.id) }}
              </el-text>
              <el-text marker="normal5" :size="12" :weight="300" v-if="isCustomMode">
                {{ t("panel.customOverrideActive") }}
              </el-text>
            </el-flex>
            <el-text :size="10" :weight="300" v-if="fieldDescription(overrideField.id)">
              {{ fieldDescription(overrideField.id) }}
            </el-text>
          </el-flex>
        </el-flex>

        <textarea v-if="overrideField.type === 'textarea'" v-model="values[overrideField.id]"
          :rows="overrideField.ui?.rows || 4" :placeholder="fieldPlaceholder(overrideField.id)"
          @focus="handleEditorFocus($event, overrideField.id, 'override')"
          @blur="handleEditorBlur(overrideField.id, 'override')" @input="handleEditorCursor" @click="handleEditorCursor"
          @keyup="handleEditorCursor" @select="handleEditorCursor" @touchend="handleEditorCursor" />

        <input v-else v-model="values[overrideField.id]" type="text" :placeholder="fieldPlaceholder(overrideField.id)"
          @focus="handleEditorFocus($event, overrideField.id, 'override')"
          @blur="handleEditorBlur(overrideField.id, 'override')" @input="handleEditorCursor" @click="handleEditorCursor"
          @keyup="handleEditorCursor" @select="handleEditorCursor" @touchend="handleEditorCursor" />

        <el-text v-if="!customOverrideValue" :size="12" icon="danger" icon-color="orange" :weight="300" color="orange">
          {{ t("panel.customOverrideEmpty") }}
        </el-text>
      </el-grid>

      <!-- groups -->
      <el-grid :p="12" :br="1" :radius="16" :bc="!isGroupOpen(group) ? 'normal10' : 'blue50'"
        v-for="group in groupedFields" v-show="!isCustomMode" :key="group.id">
        <el-flex rules="rsc" class="w100" @click="toggleGroup(group.id)">
          <el-flex rules="csc" class="w100 chpen crp" :gap="4">
            <el-flex rules="rbc" class="w100">
              <el-text :size="14" :weight="600" :icon="isGroupOpen(group) ? 'minus' : 'add'">
                {{ groupTitle(group.id) }}
              </el-text>

              <el-text :size="10">
                {{ getGroupFilledCount(group) }} / {{ group.fields.length }}
                {{ t("panel.fieldsFilled") }}
              </el-text>
            </el-flex>

            <el-text :size="12" class="w100" color="normal45" icon-color="normal55" icon="info-circle"
              v-if="groupDescription(group.id)">
              {{ groupDescription(group.id) }}
            </el-text>
          </el-flex>
        </el-flex>

        <el-grid v-if="isGroupOpen(group)" :cols="mobile ? 1 : 2">
          <el-grid v-for="field in group.fields" :key="field.id" :br="1" :radius="12" bc="normal5" :p="12"
            :class="fieldClasses(field)">
            <el-flex rules="ccs" :gap="0">
              <el-text :size="14" :weight="400" icon="star">
                {{ fieldLabel(field.id) }}
              </el-text>

              <el-text :size="10" color="normal45" v-if="fieldDescription(field.id)">
                {{ fieldDescription(field.id) }}
              </el-text>
            </el-flex>

            <div v-if="isCategorizedSelect(field)" class="module-panel__categorized-selects">
              <select :value="getActiveOptionCategory(field)" @change="handleOptionCategoryChange(field, $event)">
                <option value="">
                  {{ t("panel.none") }}
                </option>

                <option v-for="category in getFieldOptionCategories(field)" :key="category.value"
                  :value="category.value">
                  {{ optionCategoryLabel(field, category.value, category.label) }}
                </option>
              </select>

              <select v-model="values[field.id]" :disabled="!getActiveOptionCategory(field)">
                <option v-if="field.ui?.clearable !== false" value="">
                  {{ t("panel.none") }}
                </option>

                <option v-for="option in getVisibleCategorizedOptions(field)" :key="option.value" :value="option.value"
                  :disabled="option.disabled">
                  {{ optionLabel(field.id, option.value) }}
                </option>
              </select>
            </div>

            <div v-else-if="isCategorizedMultiSelect(field)" class="module-panel__categorized-multiselects">
              <select :value="getActiveOptionCategory(field)" @change="handleOptionCategoryChange(field, $event)">
                <option value="">{{ t("panel.none") }}</option>
                <option v-for="category in getFieldOptionCategories(field)" :key="category.value"
                  :value="category.value">
                  {{ optionCategoryLabel(field, category.value, category.label) }}
                </option>
              </select>

              <select v-model="values[field.id]" multiple :disabled="!getActiveOptionCategory(field)">
                <option v-for="option in getVisibleCategorizedOptions(field)" :key="option.value" :value="option.value"
                  :disabled="option.disabled">
                  {{ optionLabel(field.id, option.value) }}
                </option>
              </select>
            </div>

            <select v-else-if="field.type === 'select'" v-model="values[field.id]">
              <option v-if="field.ui?.clearable !== false" value="">
                {{ t("panel.none") }}
              </option>

              <option v-for="option in getFieldOptions(field)" :key="option.value" :value="option.value"
                :disabled="option.disabled">
                {{ optionLabel(field.id, option.value) }}
              </option>
            </select>

            <select v-else-if="field.type === 'multiSelect'" v-model="values[field.id]" multiple>
              <option v-for="option in field.options" :key="option.value" :value="option.value"
                :disabled="option.disabled">
                {{ optionLabel(field.id, option.value) }}
              </option>
            </select>

            <textarea v-else-if="field.type === 'textarea'" v-model="values[field.id]" :rows="field.ui?.rows || 3"
              :placeholder="fieldPlaceholder(field.id)" @focus="handleEditorFocus($event, field.id)"
              @blur="handleEditorBlur(field.id)" @input="handleEditorCursor" @click="handleEditorCursor"
              @keyup="handleEditorCursor" @select="handleEditorCursor" @touchend="handleEditorCursor" />

            <input v-else-if="field.type === 'checkbox'" v-model="values[field.id]" type="checkbox" />

            <input v-else-if="field.type === 'color'" v-model="values[field.id]" type="color"
              :placeholder="fieldPlaceholder(field.id)" class="module-field__color-picker" />

            <div v-else-if="field.type === 'variables'" class="module-field__variables">
              <div v-for="(variable, variableIndex) in getPromptVariables(field.id)" :key="variable.id || variableIndex"
                class="module-field__variable-card">
                <el-flex rules="rbc" :gap="8" class="w100">
                  <el-flex rules="rsc" :gap="8">
                    <input type="checkbox" :checked="variable.enabled !== false"
                      @change="handleVariableEnabledChange(field.id, variableIndex, $event)" />

                    <el-text :size="12" :weight="700" marker="blue10" color="blue">
                      {{ getVariableToken(variable) }}
                    </el-text>
                  </el-flex>

                  <el-flex rules="rcc" :gap="6">
                    <button type="button" class="module-field__small-button"
                      @click="duplicatePromptVariable(field.id, variableIndex)">
                      Duplicate
                    </button>

                    <button type="button" class="module-field__small-button module-field__small-button--danger"
                      @click="removePromptVariable(field.id, variableIndex)">
                      Remove
                    </button>
                  </el-flex>
                </el-flex>

                <el-grid :cols="mobile ? 1 : 2" :gap="8">
                  <div class="module-field__variable-control">
                    <el-text :size="10" color="normal45">Key</el-text>
                    <input type="text" :value="variable.key" placeholder="Music title"
                      @input="handleVariableKeyInput(field.id, variableIndex, $event)"
                      @blur="normalizePromptVariableKey(field.id, variableIndex)" />
                  </div>

                  <div class="module-field__variable-control">
                    <el-text :size="10" color="normal45">Type</el-text>
                    <select :value="variable.type || 'text'"
                      @change="handleVariableTypeChange(field.id, variableIndex, $event)">
                      <option v-for="option in getVariableTypeOptions(field)" :key="option.value" :value="option.value">
                        {{ variableTypeLabel(field, option.value) }}
                      </option>
                    </select>
                  </div>
                </el-grid>

                <div class="module-field__variable-control">
                  <el-text :size="10" color="normal45">Value</el-text>
                  <textarea :value="variable.value" rows="2" placeholder="person in the first attached photo"
                    @input="handleVariableValueInput(field.id, variableIndex, $event)" />
                </div>

                <div class="module-field__variable-control">
                  <el-text :size="10" color="normal45">Description</el-text>
                  <input type="text" :value="variable.description || ''" placeholder="Optional internal note"
                    @input="handleVariableDescriptionInput(field.id, variableIndex, $event)" />
                </div>

                <el-text :size="10" color="orange" icon="danger" icon-color="orange"
                  v-if="getVariableKeyIssue(field.id, variable, variableIndex)">
                  {{ getVariableKeyIssue(field.id, variable, variableIndex) }}
                </el-text>

                <el-text :size="10" color="normal45" icon="code" v-else>
                  Output token: {{ getVariableToken(variable) }}
                </el-text>
              </div>

              <button type="button" class="module-field__add-button" @click="addPromptVariable(field.id)">
                Add variable
              </button>
            </div>

            <div v-else-if="field.type === 'colorAssignments'" class="module-field__color-assignments">
              <div v-for="(assignment, assignmentIndex) in getColorAssignments(field.id)"
                :key="`${field.id}-${assignmentIndex}`" class="module-field__color-assignment">
                <el-flex rules="rbc" :gap="8">
                  <el-text :size="12" :weight="400">
                    Color Rule {{ assignmentIndex + 1 }}
                  </el-text>

                  <button type="button" class="module-field__small-button module-field__small-button--danger"
                    @click="removeColorAssignment(field.id, assignmentIndex)">
                    Remove
                  </button>
                </el-flex>

                <el-grid :cols="mobile ? 1 : 2" :gap="8">
                  <select :value="assignment.mode"
                    @change="updateColorAssignmentMode(field.id, assignmentIndex, $event)">
                    <option value="preset">Preset palette</option>
                    <option value="custom">Custom colors</option>
                  </select>

                  <select :value="assignment.usage"
                    @change="updateColorAssignmentUsage(field.id, assignmentIndex, $event)">
                    <option value="overall">Overall image</option>
                    <option value="background">Background</option>
                    <option value="subject">Main subject</option>
                    <option value="outfit">Outfit</option>
                    <option value="hair">Hair</option>
                    <option value="lighting">Lighting</option>
                    <option value="accents">Graphic accents</option>
                  </select>
                </el-grid>

                <div v-if="assignment.mode === 'preset'" class="module-field__assignment-body">
                  <select :value="assignment.preset || ''"
                    @change="updateColorAssignmentPreset(field.id, assignmentIndex, $event)">
                    <option value="">
                      {{ t("panel.none") }}
                    </option>

                    <optgroup v-for="category in getColorPalettePresetCategories(field)" :key="category.value"
                      :label="category.label">
                      <option v-for="option in getColorPalettePresetsByCategory(field, category.value)"
                        :key="option.value" :value="option.value">
                        {{ colorPalettePresetLabel(option) }}
                      </option>
                    </optgroup>
                  </select>
                </div>

                <div v-else class="module-field__assignment-body">
                  <div v-for="(color, colorIndex) in assignment.colors"
                    :key="`${field.id}-${assignmentIndex}-${colorIndex}`" class="module-field__color-row">
                    <input type="color" :value="color"
                      @input="updateColorAssignmentColor(field.id, assignmentIndex, colorIndex, $event)" />

                    <input type="text" :value="color" placeholder="#000000"
                      @input="updateColorAssignmentColor(field.id, assignmentIndex, colorIndex, $event)" />

                    <button type="button" class="module-field__small-button"
                      @click="removeColorAssignmentColor(field.id, assignmentIndex, colorIndex)">
                      Remove
                    </button>
                  </div>

                  <button type="button" class="module-field__small-button"
                    @click="addColorAssignmentColor(field.id, assignmentIndex)">
                    Add color
                  </button>
                </div>
              </div>

              <button type="button" class="module-field__add-button" @click="addColorAssignment(field.id)">
                Add color assignment
              </button>
            </div>

            <modules-panel-text-groups-field v-else-if="field.type === 'textGroups'" v-model="values[field.id]"
              :field="field" :module-key="module.key" />

            <input v-else-if="field.type === 'number'" v-model.number="values[field.id]" type="number"
              :min="field.ui?.min" :max="field.ui?.max" :step="field.ui?.step"
              :placeholder="fieldPlaceholder(field.id)" />

            <input v-else-if="field.type === 'range'" v-model.number="values[field.id]" type="range"
              :min="field.ui?.min" :max="field.ui?.max" :step="field.ui?.step" />

            <input v-else v-model="values[field.id]" type="text" :placeholder="fieldPlaceholder(field.id)"
              @focus="handleEditorFocus($event, field.id)" @blur="handleEditorBlur(field.id)"
              @input="handleEditorCursor" @click="handleEditorCursor" @keyup="handleEditorCursor"
              @select="handleEditorCursor" @touchend="handleEditorCursor" />

            <el-text :size="10" icon="info-circle" v-if="field.type === 'multiSelect'">
              {{ t("panel.multiSelectHint") }}
            </el-text>
            <el-text v-for="warning in getFieldCompatibilityWarnings(field)" :key="warning.value" :size="10"
              icon="danger" icon-color="orange" color="orange" :weight="300">
              {{ compatibilityWarningLabel(warning.key) }}
            </el-text>
          </el-grid>
        </el-grid>
      </el-grid>

      <el-flex rules="ccs" v-if="!hasVisibleEditor" class="bg-red25" :p="12" :radius="12" :br="2" bc="red">
        <el-text :size="14" :weight="400">{{ t("panel.emptyModuleTitle") }}</el-text>
        <el-text :size="12" :weight="300">{{
          t("panel.emptyModuleDescription")
          }}</el-text>
      </el-flex>

      <el-grid rules="csc" :gap="16" :br="1" :p="16" :radius="[16]" :bc="!output ? 'orange25' : 'normal15'"
        :bg="!output ? 'orange5' : 'normal5'" :class="{ 'module-panel__custom-card--empty': !customOverrideValue }">
        <el-flex rules="rbc" class="w100">
          <el-flex rules="rsc" :gap="16">
            <el-text type="h3" :size="16" :weight="600" class="lh1" :color="!output ? 'orange' : 'normal'"
              :icon-color="!output ? 'orange' : 'normal'" :icon="!output ? 'danger' : 'archive-tick'">
              {{ t("panel.compiledOutput") }}
            </el-text>
            <el-text marker="primary" color="white" class="wsnw" :size="mobile ? 10 : mini ? 12 : 14" :weight="300">
              {{ moduleTitle }}
            </el-text>
          </el-flex>
          <el-button :label="isCopied ? t('panel.copied') : t('panel.copy')" :icon="isCopied ? 'tick' : 'document-copy'"
            color="prim" :mode="isCopied ? 'flat' : 'normal'" @click="copyOutput" :disable="!output" :size="12" :gap="8"
            :type="mini ? 'fab' : 'normal'" :p="mini ? [8] : [8, 12]" />
        </el-flex>
        <el-divider />
        <el-text :size="14" :weight="300" color="normal85" v-if="output">
          {{ output }}
        </el-text>
        <el-flex rules="ccs" v-else>
          <el-text :size="14" :weight="700">{{ t("panel.emptyOutputTitle") }}</el-text>
          <el-text :size="12" :weight="400">
            {{
              isCustomMode
                ? t("panel.emptyCustomOutputDescription")
                : t("panel.emptyOutputDescription")
            }}
          </el-text>
        </el-flex>
      </el-grid>
    </el-grid>
  </el-grid>
</template>

<style scoped>
.module-panel__field--full {
  grid-column: 1 / -1;
}

.module-panel__categorized-selects {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.module-panel__field--full textarea {
  width: 100%;
}

.module-field__variables {
  display: grid;
  gap: 12px;
}

.module-field__variable-card {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--normalText10);
  border-radius: 10px;
  background: var(--normalText5);
}

.module-field__variable-control {
  display: grid;
  gap: 4px;
}

.module-field__variable-card textarea {
  width: 100%;
  resize: vertical;
}

.module-field__color-assignments {
  display: grid;
  gap: 12px;
}

.module-field__color-assignment {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--normalText10);
  border-radius: 10px;
  background: var(--normalText5);
}

.module-field__assignment-body {
  display: grid;
  gap: 8px;
}

.module-field__color-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 8px;
  align-items: center;
}

.module-field__color-row input[type="color"] {
  width: 44px;
  height: 36px;
  padding: 2px;
}

.module-field__small-button,
.module-field__add-button {
  border: 1px solid var(--normalText15);
  border-radius: 8px;
  background: var(--normalText5);
  color: var(--normalText);
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;
}

.module-field__small-button--danger {
  color: var(--themeRed);
  border-color: var(--themeRed30);
}

.module-field__add-button {
  width: 100%;
}

@media (max-width: 768px) {
  .module-panel__categorized-selects {
    grid-template-columns: 1fr;
  }
}
</style>