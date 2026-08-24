<script setup lang="ts">

import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import type { GlobalMenuItem } from "~/composables/useMenu";

import type {
  ElDropdownItem,
  ElDropdownValue,
} from '~/types/dropdown'

import type {
  ModuleField,
  ModuleFieldValue,
  ModulePreset,
  ModuleValues,
  PromptKeyModule,
  PromptVariable,
} from "../../../modules/types";
import type { LayoutRegionsState } from "../../../modules/layout.types";
import type { SceneEntity } from "../../../modules/scene.types";
import { normalizeLayoutRegionsState } from "../../../utils/layoutRegions";
import { normalizeSceneEntities } from "../../../utils/scene";
import LayoutRegionsField from "../layout/LayoutRegionsField.vue";
import SceneEntitiesField from "../scene/SceneEntitiesField.vue";
import LayoutSchemaPreviewModal from "../layout/LayoutSchemaPreviewModal.vue";
import type { ModuleOutputValue } from "../../../utils/compilePrompt";
import {
  copyLayoutSchemaBlobToClipboard,
  createLayoutSchemaBlob,
  createLayoutSchemaFilename,
  downloadLayoutSchemaBlob,
} from "../../../utils/layoutSchema";

import type { PromptValidationIssue } from "../../../utils/promptValidation";

import {
  compileModule,
  createDefaultModuleValues,
  getModulePresetValues,
} from "../../../utils/compileModules";

import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
import { usePromptSubjectContext } from "~/composables/prompt/usePromptSubjectContext";

const { t } = useI18n();
const { mobile, mini } = useScreen();
const { openPageContextMenu } = usePageContextMenu();
const modal = useModal();

const {
  setPromptVariables: setGlobalPromptVariables,
  clearPromptVariables,
} = usePromptVariables();
const { subjectType } = usePromptSubjectContext();

const props = defineProps<{
  module: PromptKeyModule;
  modelValue?: ModuleValues;
  panelState?: ModulePanelState;
  aspectRatio?: string;
  previewOutput?: string;
  modules?: PromptKeyModule[];
  moduleValues?: Record<string, ModuleValues>;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleValues): void;
  (event: "update:panelState", value: ModulePanelState): void;
  (event: "update:output", value: ModuleOutputValue): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
  (event: "remove", moduleKey: string): void;
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

function promptEditorId(fieldId: string, suffix = "") {
  return `${props.module.key}:${fieldId}${suffix ? `:${suffix}` : ""}`;
}

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
const isLayoutSchemaCopied = ref(false);
const isLayoutSchemaBusy = ref(false);
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

function handleOptionCategoryValueChange(field: ModuleField, value: ElDropdownValue) {
  const nextCategory = String(value ?? '')

  selectedOptionCategories[field.id] = nextCategory
  values[field.id] = ''
}

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

const inlinePresetGroupId = computed(() => {
  if (props.module.presetUi?.component !== "select") return "";

  return props.module.presetUi.group || "";
});

const presetDropdownItems = computed<ElDropdownItem[]>(() => {
  const items: ElDropdownItem[] = presetItems.value.map((preset) => ({
    value: preset.id,
    label: presetLabel(preset.id),
    description: presetDescription(preset.id),
  }));

  if (props.module.presetUi?.allowNone !== false) {
    items.unshift({
      value: "",
      label: t("panel.none"),
    });
  }

  return items;
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

const displayOutput = computed(() => {
  if (props.previewOutput) return props.previewOutput;
  return output.value ? getModuleOutputText(output.value) : "";
});

const isLayoutModule = computed(() => props.module.key === "layout");

const layoutRegionsState = computed(() => {
  return normalizeLayoutRegionsState(values.regions);
});

const hasLayoutRegions = computed(() => {
  return isLayoutModule.value && layoutRegionsState.value.regions.length > 0;
});

const isPrimaryCopyDisabled = computed(() => {
  if (isLayoutModule.value) {
    return !hasLayoutRegions.value || isLayoutSchemaBusy.value;
  }

  return !displayOutput.value;
});

const isPrimaryCopied = computed(() => {
  return isLayoutModule.value
    ? isLayoutSchemaCopied.value
    : isCopied.value;
});

const primaryCopyLabel = computed(() => {
  if (!isLayoutModule.value) {
    return isCopied.value ? t("panel.copied") : t("panel.copy");
  }

  return isLayoutSchemaCopied.value
    ? t("modules.layout.schema.actions.copied")
    : t("modules.layout.schema.actions.copy");
});

const primaryCopyIcon = computed(() => {
  if (isPrimaryCopied.value) return "check";

  return "content_copy";
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

function toggleCustomMode() {
  if (!hasOverrideField.value) return;

  isCustomMode.value = !isCustomMode.value;

  if (isCustomMode.value) {
    isPanelExpanded.value = true;
  }
}

function removeModule() {
  emit("remove", props.module.key);

  if (!import.meta.client) return;

  window.dispatchEvent(
    new CustomEvent("prompt-draft:remove-key-module", {
      detail: {
        moduleKey: props.module.key,
      },
    }),
  );
}

function isFieldFilled(field: ModuleField) {
  const value = values[field.id];

  if (field.type === "layoutRegions") {
    return normalizeLayoutRegionsState(value).regions.length > 0;
  }
  if (field.type === "sceneEntities") {
    return normalizeSceneEntities(value).length > 0;
  }
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

function getLayoutRegionsValue(fieldId: string): LayoutRegionsState {
  return normalizeLayoutRegionsState(values[fieldId]);
}

function getSceneEntitiesValue(fieldId: string): SceneEntity[] {
  return normalizeSceneEntities(values[fieldId]);
}

function updateSceneEntitiesValue(fieldId: string, nextScenes: SceneEntity[]) {
  values[fieldId] = nextScenes as unknown as ModuleFieldValue;
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
      field.type === "layoutRegions" ||
      field.type === "sceneEntities" ||
      isCategorizedSelect(field),
    "module-panel__field--half": fieldWidth !== "full",
    "module-panel__field--checkbox": field.type === "checkbox",
    "module-panel__field--range": field.type === "range",
  };
}

function getAllRawFieldOptions(field: ModuleField) {
  return (field.options || []) as SelectOption[];
}

function isOptionSelected(field: ModuleField, option: SelectOption) {
  const currentValue = values[field.id];

  if (Array.isArray(currentValue)) {
    return currentValue.includes(option.value);
  }

  return String(currentValue ?? "") === option.value;
}

function isOptionApplicableToSubject(option: SelectOption) {
  const appliesTo = option.appliesTo || [];

  if (!appliesTo.length || appliesTo.includes("*")) return true;

  return appliesTo.includes(subjectType.value);
}

function getRawFieldOptions(field: ModuleField) {
  return getAllRawFieldOptions(field).filter((option) => {
    return isOptionApplicableToSubject(option) || isOptionSelected(field, option);
  });
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
  const options = getAllRawFieldOptions(field);

  if (Array.isArray(currentValue)) {
    return options.filter((option) => currentValue.includes(option.value));
  }

  const stringValue = String(currentValue ?? "");

  if (!stringValue) return [];

  const selectedOption = options.find((option) => option.value === stringValue);

  return selectedOption ? [selectedOption] : [];
}

function getSubjectApplicabilityWarnings(field: ModuleField) {
  return getSelectedOptions(field)
    .filter((option) => !isOptionApplicableToSubject(option))
    .map((option) => ({ value: option.value }));
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

  if (selectedOption?.category) {
    return selectedOption.category;
  }

  const preferredCategory = selectedOptionCategories[field.id] || "";

  if (
    preferredCategory &&
    getFieldOptions(field).some((option) => option.category === preferredCategory)
  ) {
    return preferredCategory;
  }

  return "";
}

function getVisibleCategorizedOptions(field: ModuleField) {
  const activeCategory = getActiveOptionCategory(field);

  if (!activeCategory) return [];

  return getFieldOptions(field).filter((option) => {
    return option.category === activeCategory;
  });
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

function multiSelectOptionGroupLabel(field: ModuleField, option: SelectOption) {
  const category = option.category || "";
  if (!category) return "";

  const fallback = option.categoryLabelKey || option.categoryLabel || category;
  return optionCategoryLabel(field, category, fallback);
}

function moduleValuesEqual(a: unknown, b: unknown) {
  if (a === b) return true;

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function presetMatchesCurrentValues(presetKey: string) {
  const presetValues = getModulePresetValues(props.module, presetKey);
  const entries = Object.entries(presetValues);

  if (!entries.length) return false;

  return entries.every(([key, value]) => {
    return moduleValuesEqual(values[key], value);
  });
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

function clearActivePreset(resetValues = false) {
  if (resetValues) {
    const defaults = createDefaultModuleValues(props.module);

    normalFields.value.forEach((field) => {
      values[field.id] = defaults[field.id] ?? "";
    });
  }

  activePresetId.value = null;
}

function handlePresetSelect(value: ElDropdownValue) {
  const presetKey = String(value ?? "");

  if (!presetKey) {
    clearActivePreset(props.module.presetUi?.resetOnNone === true);
    return;
  }

  if (!props.module.presets?.[presetKey]) return;

  applyPreset(presetKey);
}

function isInlinePresetGroup(groupId: string) {
  return inlinePresetGroupId.value === groupId && presetItems.value.length > 0;
}

watch(
  values,
  () => {
    if (isSyncingValues.value) return;

    const presetKey = activePresetId.value;
    if (!presetKey) return;

    if (!presetMatchesCurrentValues(presetKey)) {
      activePresetId.value = null;
    }
  },
  { deep: true },
);

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

function groupColumns(group: ModuleGroupView) {
  if (mobile.value) return 1;

  const hasFullWidthField = group.fields.some((field) => {
    return (
      field.ui?.width === "full" ||
      field.type === "variables" ||
      field.type === "textarea" ||
      field.type === "multiSelect" ||
      field.type === "textGroups" ||
      field.type === "colorAssignments" ||
      field.type === "layoutRegions" ||
      field.type === "sceneEntities" ||
      isCategorizedSelect(field)
    );
  });

  return hasFullWidthField ? 1 : 2;
}

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

function getModuleOutputText(value: ModuleOutputValue) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

async function copyOutput() {
  if (!displayOutput.value) return;

  try {
    await navigator.clipboard.writeText(displayOutput.value);
    isCopied.value = true;

    window.setTimeout(() => {
      isCopied.value = false;
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

async function copyCanonicalOutput() {
  if (!output.value) return;

  try {
    await navigator.clipboard.writeText(getModuleOutputText(output.value));
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

async function createCurrentLayoutSchemaBlob() {
  return createLayoutSchemaBlob({
    regions: layoutRegionsState.value,
    aspectRatioValue: props.aspectRatio,
  });
}

function openLayoutSchemaPreview(blob: Blob) {
  const imageUrl = URL.createObjectURL(blob);
  let isDisposed = false;

  function disposeImageUrl() {
    if (isDisposed) return;

    isDisposed = true;
    URL.revokeObjectURL(imageUrl);
  }

  modal.open({
    header: {
      icon: "grid_view",
      title: t("modules.layout.schema.preview.title"),
      subtitle: t("modules.layout.schema.preview.subtitle"),
      color: "blue",
    },
    component: LayoutSchemaPreviewModal,
    props: {
      imageUrl,
      alt: t("modules.layout.schema.preview.alt"),
      onDispose: disposeImageUrl,
    },
    actions: [
      {
        label: t("modules.layout.schema.actions.close"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: t("modules.layout.schema.actions.download"),
        icon: "upload_file",
        color: "orange",
        mode: "flat",
        handler: () => {
          downloadLayoutSchemaBlob(blob, createLayoutSchemaFilename());
        },
      },
      {
        label: t("modules.layout.schema.actions.copy"),
        icon: "grid_view",
        color: "prim",
        close: true,
        handler: async () => {
          try {
            await copyLayoutSchemaBlobToClipboard(blob);
            isLayoutSchemaCopied.value = true;

            window.setTimeout(() => {
              isLayoutSchemaCopied.value = false;
            }, 1500);

            return true;
          } catch (error) {
            console.error("Layout schema copy failed:", error);
            return false;
          }
        },
      },
    ],
    options: {
      width: mobile.value ? "calc(100% - 24px)" : 820,
      maxHeight: "92vh",
      closeOnBackdrop: true,
    },
  });
}

async function copyLayoutSchema() {
  if (!hasLayoutRegions.value || isLayoutSchemaBusy.value) return;

  isLayoutSchemaBusy.value = true;

  try {
    const blob = await createCurrentLayoutSchemaBlob();

    try {
      await copyLayoutSchemaBlobToClipboard(blob);
      isLayoutSchemaCopied.value = true;

      window.setTimeout(() => {
        isLayoutSchemaCopied.value = false;
      }, 1500);
    } catch (error) {
      console.warn("Direct layout schema copy is unavailable:", error);
      openLayoutSchemaPreview(blob);
    }
  } catch (error) {
    console.error("Layout schema rendering failed:", error);

    modal.message({
      type: "error",
      message: t("modules.layout.schema.errors.render"),
    });
  } finally {
    isLayoutSchemaBusy.value = false;
  }
}

async function downloadLayoutSchema() {
  if (!hasLayoutRegions.value || isLayoutSchemaBusy.value) return;

  isLayoutSchemaBusy.value = true;

  try {
    const blob = await createCurrentLayoutSchemaBlob();

    downloadLayoutSchemaBlob(blob, createLayoutSchemaFilename());
  } catch (error) {
    console.error("Layout schema rendering failed:", error);

    modal.message({
      type: "error",
      message: t("modules.layout.schema.errors.render"),
    });
  } finally {
    isLayoutSchemaBusy.value = false;
  }
}

function runPrimaryCopyAction() {
  if (isLayoutModule.value) {
    copyLayoutSchema();
    return;
  }

  copyOutput();
}

const modulePanelContextMenuLabels = computed(() => ({
  title: moduleTitle.value,
  expand: t("components.contextMenu.actions.expand"),
  collapse: t("components.contextMenu.actions.collapse"),
  enableCustomize: t("components.contextMenu.actions.enableCustomize"),
  disableCustomize: t("components.contextMenu.actions.disableCustomize"),
  copyOutput: t("components.contextMenu.actions.copyOutput"),
  copyLayoutSchema: t("modules.layout.schema.actions.copy"),
  downloadLayoutSchema: t("modules.layout.schema.actions.download"),
  remove: t("components.contextMenu.actions.removeFromKeyModules"),
}));

const modulePanelContextMenuItems = computed<GlobalMenuItem[]>(() => {
  const labels = modulePanelContextMenuLabels.value;
  const items: GlobalMenuItem[] = [
    {
      type: "header",
      label: labels.title,
    },
    {
      label: isPanelExpanded.value ? labels.collapse : labels.expand,
      icon: isPanelExpanded.value ? "expand_less" : "expand_more",
      handler: togglePanel,
    },
    {
      label: isCustomMode.value ? labels.disableCustomize : labels.enableCustomize,
      icon: "tune",
      active: isCustomMode.value,
      disabled: !hasOverrideField.value,
      handler: toggleCustomMode,
    },
    {
      type: "divider",
    },
  ];

  if (isLayoutModule.value) {
    items.push(
      {
        label: labels.copyLayoutSchema,
        icon: "grid_view",
        disabled: !hasLayoutRegions.value || isLayoutSchemaBusy.value,
        handler: copyLayoutSchema,
      },
      {
        label: labels.downloadLayoutSchema,
        icon: "upload_file",
        disabled: !hasLayoutRegions.value || isLayoutSchemaBusy.value,
        handler: downloadLayoutSchema,
      },
      {
        label: labels.copyOutput,
        icon: "file_copy",
        disabled: !displayOutput.value,
        handler: copyOutput,
      },
    );
  } else {
    items.push({
      label: labels.copyOutput,
      icon: "file_copy",
      disabled: !displayOutput.value,
      handler: copyOutput,
    });
  }

  items.push({
    label: labels.remove,
    icon: "delete",
    color: "red",
    handler: removeModule,
  });

  return items;
});

function openModulePanelContextMenu(event: MouseEvent) {
  openPageContextMenu(event, {
    items: modulePanelContextMenuItems.value,
    minWidth: 220,
    maxWidth: 260,
    closeOnScroll: false,
    zIndex: 2300,
  });
}

onBeforeUnmount(() => {
  if (props.module.key === "variables") {
    clearPromptVariables();
  }
});

</script>

<template>
  <el-grid type="section" :p="mobile ? 12 : mini ? 16 : 20" :br="2" :bc="!isPanelExpanded ? 'normal10' : 'blue50'"
    :radius="mobile ? 16 : mini ? 24 : 32" bg="surface" :class="['w100']" @contextmenu="openModulePanelContextMenu">
    <el-flex rules="csc" class="w100">
      <el-flex rules="ccs" class="w100">
        <el-flex :rules="mini ? 'ccs' : 'rbc'" class="w100">
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
          <el-flex rules="rcc" :class="mini ? 'w100' : ''">
            <el-switch v-if="hasOverrideField" :class="mini ? 'fg100' : ''" :model-value="isCustomMode" :size="12"
              @update:model-value="isCustomMode = $event" :label="t('panel.customMode')" />
            <el-button type="fab" :size="14" @click="clearModule" :disable="!hasAnyValue" mode="flat" :p="8"
              :label="isCustomMode ? t('panel.clearCustom') : t('panel.clear')" icon="delete" />
            <el-button
              type="fab"
              :size="14"
              @click="runPrimaryCopyAction"
              :disable="isPrimaryCopyDisabled"
              :mode="isPrimaryCopied ? 'flat' : 'normal'"
              color="prim"
              :p="8"
              :label="primaryCopyLabel"
              :icon="primaryCopyIcon"
            />
            <el-button type="fab" :size="14" @click="togglePanel" mode="flat" color="prim" :p="8"
              :label="!isPanelExpanded ? t('panel.expand') : t('panel.collapse')"
              :icon="!isPanelExpanded ? 'expand_more' : 'expand_less'" />
          </el-flex>
        </el-flex>
        <el-flex rules="ccs" class="w100 crp" :gap="4" @click="togglePanel">
          <el-flex rules="rsc" :gap="8">
            <el-text type="h2" :size="24" :weight="800" class="lh1" effect="glitch" :icon="module.icon">
              {{ moduleTitle.toUpperCase() }}
            </el-text>
            <el-help v-if="moduleDescription" :text="moduleDescription" />
          </el-flex>
        </el-flex>
        <el-divider mode="dashed" :dash="4" :gap="2" class="mt12 mb12" />
        <modules-panel-module-output-text
          v-if="!isPanelExpanded && displayOutput"
          :value="displayOutput"
          :size="12"
          color="normal50"
        />
        <el-text v-else-if="!isPanelExpanded" type="span" :size="12" color="red80">
          {{ t("panel.emptyOutput") }}
        </el-text>
      </el-flex>
    </el-flex>
    <el-grid :gap="12" v-show="isPanelExpanded" class="w100">
      <el-grid v-if="!isCustomMode && presetItems.length && !inlinePresetGroupId">
        <el-flex rules="ccs" :gap="0" class="w100">
          <el-flex rules="ccs" class="w100">
            <el-flex rules="rbc" class="w100">
              <el-flex rules="rsc" :gap="8">
                <el-text type="h3" :size="16" :weight="600" class="lh1">
                  {{ t("panel.presets") }}
                </el-text>
                <el-help :text="t('panel.presetsDescription')" />
              </el-flex>
              <el-text marker="blue15" :size="12" color="white" icon-color="white" :weight="300" v-if="activePresetId"
                icon="check">
                {{ t("panel.presetSelected") }}
              </el-text>
            </el-flex>
          </el-flex>
        </el-flex>

        <el-flex rules="rsc" class="fw" :gap="4">
          <el-text v-for="preset in presetItems" :key="preset.id" :size="14" class="pl8 pr8 pt4 pb4 crp"
            :title="presetDescription(preset.id)" @click="applyPreset(preset.id)"
            :marker="activePresetId === preset.id ? 'blue' : 'surface5'"
            :icon="activePresetId === preset.id ? 'check' : 'widgets'"
            :icon-color="activePresetId === preset.id ? 'white' : 'normal50'"
            :color="activePresetId === preset.id ? 'white' : 'normal80'">
            {{ presetLabel(preset.id) }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-grid rules="csc" :br="1" :p="16" :radius="[16]" :bc="!customOverrideValue ? 'orange25' : 'normal15'"
        :bg="!customOverrideValue ? 'orange5' : 'normal5'" v-if="isCustomMode && overrideField"
        :class="{ 'module-panel__custom-card--empty': !customOverrideValue }">
        <el-flex rules="ccs" :gap="0" class="w100">
          <el-flex rules="ccs" class="w100">
            <el-flex :rules="mini ? 'ccs' : 'rbc'" class="w100" :gap="8">
              <el-flex rules="rsc" :gap="8">
                <el-text type="h3" :size="16" :weight="600" class="lh1" icon="edit">
                  {{ fieldLabel(overrideField.id) }}
                </el-text>
                <el-help v-if="fieldDescription(overrideField.id)" :text="fieldDescription(overrideField.id)" />
              </el-flex>

              <el-flex rules="rcc" :gap="8" :class="mini ? 'w100' : ''">
                <el-text marker="normal5" :size="12" :weight="300" v-if="isCustomMode">
                  {{ t("panel.customOverrideActive") }}
                </el-text>
              </el-flex>
            </el-flex>
          </el-flex>
        </el-flex>

        <el-text-field v-model="values[overrideField.id]"
          :type="overrideField.type === 'textarea' ? 'textarea' : 'text'" :rows="overrideField.ui?.rows || 4"
          :placeholder="fieldPlaceholder(overrideField.id)" :editor-id="promptEditorId(overrideField.id, 'override')"
          support-variables />

        <el-text v-if="!customOverrideValue" :size="12" icon="warning" icon-color="orange" :weight="300" color="orange">
          {{ t("panel.customOverrideEmpty") }}
        </el-text>
      </el-grid>

      <el-grid :p="12" :br="1" :radius="16" :bc="!isGroupOpen(group) ? 'normal10' : 'blue50'"
        v-for="group in groupedFields" v-show="!isCustomMode" :key="group.id">
        <el-flex rules="rsc" class="w100" @click="toggleGroup(group.id)">
          <el-flex rules="csc" class="w100 chpen crp" :gap="4">
            <el-flex rules="rbc" class="w100">
              <el-flex rules="rsc" :gap="8">
                <el-text :size="14" :weight="600" :icon="isGroupOpen(group) ? 'expand_less' : 'expand_more'">
                  {{ groupTitle(group.id) }}
                </el-text>
                <el-help v-if="groupDescription(group.id)" :text="groupDescription(group.id)" />
              </el-flex>

              <el-text :size="10">
                {{ getGroupFilledCount(group) }} / {{ group.fields.length }}
                {{ t("panel.fieldsFilled") }}
              </el-text>
            </el-flex>
          </el-flex>
        </el-flex>

        <el-grid v-if="isGroupOpen(group)" :cols="groupColumns(group)">
          <el-grid v-if="isInlinePresetGroup(group.id)" :br="1" :radius="12" bc="normal5" :p="12" :gap="24">
            <el-flex rules="rsc" :gap="8">
              <el-text :size="14" :weight="400" icon="widgets">
                {{ t("panel.presets") }}
              </el-text>
              <el-help :text="t('panel.presetsDescription')" />
            </el-flex>

            <el-dropdown
              :model-value="activePresetId || ''"
              :items="presetDropdownItems"
              item-label="label"
              item-value="value"
              :clearable="false"
              @update:model-value="handlePresetSelect"
            />
          </el-grid>

          <el-grid v-for="field in group.fields" :key="field.id" :br="1" :radius="12" bc="normal5" :p="12"
            :class="fieldClasses(field)" :gap="24">
            <el-flex rules="rsc" :gap="8">
              <el-text :size="14" :weight="400" icon="star">
                {{ fieldLabel(field.id) }}
              </el-text>
              <el-help v-if="fieldDescription(field.id)" :text="fieldDescription(field.id)" />
            </el-flex>

            <el-flex rules="csc" :gap="8" v-if="isCategorizedSelect(field)">
              <el-dropdown
                :model-value="getActiveOptionCategory(field)"
                :items="getFieldOptionCategories(field)"
                :item-label="(category) => optionCategoryLabel(field, category.value, category.label)"
                item-value="value"
                :placeholder="t('panel.none')"
                clearable
                @update:model-value="handleOptionCategoryValueChange(field, $event)"
              />

              <el-dropdown
                v-model="values[field.id]"
                :items="getVisibleCategorizedOptions(field)"
                :item-label="(option) => optionLabel(field.id, option.value)"
                item-value="value"
                item-disabled="disabled"
                :placeholder="t('panel.none')"
                :disabled="!getActiveOptionCategory(field)"
                :clearable="field.ui?.clearable !== false"
              />
            </el-flex>

            <el-dropdown
              v-else-if="field.type === 'select'"
              v-model="values[field.id]"
              :items="getFieldOptions(field)"
              :item-label="(option) => optionLabel(field.id, option.value)"
              item-value="value"
              item-disabled="disabled"
              :placeholder="t('panel.none')"
              :clearable="field.ui?.clearable !== false"
            />

            <el-multi-select
              v-else-if="field.type === 'multiSelect'"
              v-model="values[field.id]"
              :items="getFieldOptions(field)"
              :item-label="(option) => optionLabel(field.id, option.value)"
              item-value="value"
              item-disabled="disabled"
              :item-group="(option) => option.category || ''"
              :item-group-label="(option) => multiSelectOptionGroupLabel(field, option)"
              :placeholder="t('panel.none')"
              :clearable="field.ui?.clearable !== false"
            />

            <el-text-field v-else-if="field.type === 'textarea'" v-model="values[field.id]" type="textarea"
              :rows="field.ui?.rows || 3" :placeholder="fieldPlaceholder(field.id)"
              :editor-id="promptEditorId(field.id)" support-variables />

            <input v-else-if="field.type === 'checkbox'" v-model="values[field.id]" type="checkbox" />

            <input v-else-if="field.type === 'color'" v-model="values[field.id]" type="color"
              :placeholder="fieldPlaceholder(field.id)" />

            <modules-variables-field v-else-if="field.type === 'variables'" v-model="values[field.id]" :field="field"
              :module-key="module.key" />

            <modules-panel-color-assignments-field v-else-if="field.type === 'colorAssignments'"
              v-model="values[field.id]" :field="field" />

            <modules-panel-text-groups-field v-else-if="field.type === 'textGroups'" v-model="values[field.id]"
              :field="field" :module-key="module.key" />

            <SceneEntitiesField
              v-else-if="field.type === 'sceneEntities'"
              :model-value="getSceneEntitiesValue(field.id)"
              :field="field"
              :modules="modules || []"
              :module-values="moduleValues || {}"
              @update:model-value="updateSceneEntitiesValue(field.id, $event)"
            />

            <LayoutRegionsField
              v-else-if="field.type === 'layoutRegions'"
              :model-value="getLayoutRegionsValue(field.id)"
              :field="field"
              :aspect-ratio="aspectRatio"
              @update:model-value="values[field.id] = $event"
            />

            <input v-else-if="field.type === 'number'" v-model.number="values[field.id]" type="number"
              :min="field.ui?.min" :max="field.ui?.max" :step="field.ui?.step"
              :placeholder="fieldPlaceholder(field.id)" />

            <input v-else-if="field.type === 'range'" v-model.number="values[field.id]" type="range"
              :min="field.ui?.min" :max="field.ui?.max" :step="field.ui?.step" />

            <el-text-field v-else v-model="values[field.id]" type="text" :placeholder="fieldPlaceholder(field.id)"
              :editor-id="promptEditorId(field.id)" support-variables />

            <el-text v-for="warning in getFieldCompatibilityWarnings(field)" :key="warning.value" :size="10"
              icon="warning" icon-color="orange" color="orange" :weight="300">
              {{ compatibilityWarningLabel(warning.key) }}
            </el-text>
            <el-text v-for="warning in getSubjectApplicabilityWarnings(field)" :key="`subject:${warning.value}`" :size="10"
              icon="warning" icon-color="orange" color="orange" :weight="300">
              {{ t("panel.subjectOptionMismatch") }}
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

      <el-grid rules="csc" :gap="16" :br="1" :p="16" :radius="[16]" :bc="!displayOutput ? 'orange25' : 'normal15'"
        :bg="!displayOutput ? 'orange5' : 'normal5'" :class="{ 'module-panel__custom-card--empty': !customOverrideValue }">
        <el-flex rules="rbc" class="w100">
          <el-flex rules="rsc" :gap="16">
            <el-text type="h3" :size="16" :weight="600" class="lh1" :color="!displayOutput ? 'orange' : 'normal'"
              :icon-color="!displayOutput ? 'orange' : 'normal'" :icon="!displayOutput ? 'error' : 'task_alt'">
              {{ t("panel.compiledOutput") }}
            </el-text>
            <el-text marker="primary" color="white" class="wsnw" :size="mobile ? 10 : mini ? 12 : 14" :weight="300">
              {{ moduleTitle }}
            </el-text>
          </el-flex>
          <el-flex rules="rcc" :gap="6">
            <el-button
              v-if="isLayoutModule"
              type="fab"
              mode="flat"
              icon="file_copy"
              :label="t('modules.layout.schema.actions.copyJson')"
              :disable="!output"
              :size="12"
              :p="[8]"
              @click="copyCanonicalOutput"
            />

            <el-button
              :label="primaryCopyLabel"
              :icon="primaryCopyIcon"
              color="prim"
              :mode="isPrimaryCopied ? 'flat' : 'normal'"
              @click="runPrimaryCopyAction"
              :disable="isPrimaryCopyDisabled"
              :size="12"
              :gap="8"
              :type="mini ? 'fab' : 'normal'"
              :p="mini ? [8] : [8, 12]"
            />
          </el-flex>
        </el-flex>
        <el-divider />
        <modules-panel-module-output-text
          v-if="displayOutput"
          :value="displayOutput"
          :size="14"
          color="normal85"
        />
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

<style scoped></style>