<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import type { ElDropdownItem, ElDropdownValue } from "~/types/dropdown";
import type {
  LightingSource,
  ModuleField,
  ModulePreset,
  ModuleValues,
  PromptKeyModule,
} from "../../../modules/types";
import type { ModuleOutputValue } from "../../../utils/compilePrompt";
import type { PromptValidationIssue } from "../../../utils/promptValidation";
import {
  createDefaultModuleValues,
  getModulePresetValues,
} from "../../../utils/compileModules";
import { compileLightingModule } from "../../../utils/compileLighting";
import { useModulePanelContextMenu } from "~/composables/useModulePanelContextMenu";
import LightSourcesField from "../lighting/LightSourcesField.vue";

const { t } = useI18n();
const { mobile, mini } = useScreen();

const props = defineProps<{
  module: PromptKeyModule;
  modelValue?: ModuleValues;
  panelState?: ModulePanelState;
  aspectRatio?: string;
  previewOutput?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleValues): void;
  (event: "update:panelState", value: ModulePanelState): void;
  (event: "update:output", value: ModuleOutputValue): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
}>();

type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

const values = reactive<ModuleValues>({});
const isSyncingValues = ref(false);
const isSyncingPanelState = ref(false);
const isPanelExpanded = ref(false);
const isAdvancedOpen = ref(false);
const isCopied = ref(false);
const isCustomMode = ref(false);
const activePresetId = ref<string | null>(null);

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function syncValuesFromModel(modelValue?: ModuleValues) {
  isSyncingValues.value = true;

  const defaults = createDefaultModuleValues(props.module);
  const nextValues = {
    ...defaults,
    ...cloneValue(modelValue || {}),
  };

  Object.keys(values).forEach((key) => delete values[key]);
  Object.assign(values, nextValues);

  nextTick(() => {
    isSyncingValues.value = false;
  });
}

watch(
  () => props.modelValue,
  (modelValue) => syncValuesFromModel(modelValue),
  { immediate: true, deep: true },
);

watch(
  values,
  (nextValues) => {
    if (isSyncingValues.value) return;
    emit("update:modelValue", cloneValue(nextValues));
  },
  { deep: true },
);

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
  { immediate: true, deep: true },
);

watch([isCustomMode, activePresetId], () => {
  if (isSyncingPanelState.value) return;

  emit("update:panelState", {
    isCustomMode: isCustomMode.value,
    activePresetId: activePresetId.value,
  });
});

const moduleI18nBase = computed(() => `modules.${props.module.key}`);

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

const moduleTitle = computed(() =>
  translate(`${moduleI18nBase.value}.title`, props.module.key),
);

const moduleDescription = computed(() =>
  translate(`${moduleI18nBase.value}.description`),
);

function fieldLabel(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.label`, fieldId);
}

function fieldDescription(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.description`);
}

function fieldPlaceholder(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.placeholder`);
}

function fieldOptionLabel(fieldId: string, value: string) {
  return translate(
    `${moduleI18nBase.value}.fields.${fieldId}.options.${value}`,
    value.replace(/[_-]+/g, " "),
  );
}

function presetLabel(presetId: string) {
  return translate(`${moduleI18nBase.value}.presets.${presetId}.label`, presetId);
}

function presetDescription(presetId: string) {
  return translate(`${moduleI18nBase.value}.presets.${presetId}.description`);
}

const lightSourcesField = computed(() => props.module.fields.lightSources);
const ambientLevelField = computed(() => props.module.fields.ambientLevel);
const overallContrastField = computed(() => props.module.fields.overallContrast);
const extraDetailsField = computed(() => props.module.fields.extraDetails);
const customTextField = computed(() => props.module.fields.customText);

const lightSources = computed<LightingSource[]>(() =>
  Array.isArray(values.lightSources)
    ? (values.lightSources as LightingSource[])
    : [],
);

const presetItems = computed<ModulePreset[]>(() =>
  Object.values(props.module.presets || {}).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  ),
);

const presetDropdownItems = computed<ElDropdownItem[]>(() => {
  const items: ElDropdownItem[] = presetItems.value.map((preset) => ({
    value: preset.id,
    label: presetLabel(preset.id),
    description: presetDescription(preset.id),
  }));

  if (props.module.presetUi?.allowNone !== false) {
    items.unshift({ value: "", label: t("panel.none") });
  }

  return items;
});

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
  return entries.every(([key, value]) => moduleValuesEqual(values[key], value));
}

function applyPreset(presetKey: string) {
  const presetValues = getModulePresetValues(props.module, presetKey);

  Object.entries(presetValues).forEach(([key, value]) => {
    values[key] = cloneValue(value);
  });

  activePresetId.value = presetKey;
  isPanelExpanded.value = true;
}

function clearActivePreset(resetValues = false) {
  if (resetValues) {
    const defaults = createDefaultModuleValues(props.module);
    const controlledKeys = ["lightSources", "ambientLevel", "overallContrast"];

    controlledKeys.forEach((key) => {
      values[key] = cloneValue(defaults[key] ?? "");
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

const customOverrideValue = computed(() =>
  typeof values.customText === "string" ? values.customText.trim() : "",
);

const { isCollapseLocked, togglePanel } = useModulePanelCollapseGuard({
  expanded: isPanelExpanded,
  isCustomMode: () => isCustomMode.value && Boolean(customTextField.value),
  getCustomValue: () => customOverrideValue.value,
});

const normalCompileValues = computed<ModuleValues>(() => ({
  ...values,
  customText: "",
}));

const output = computed(() => {
  if (isCustomMode.value) return customOverrideValue.value;
  return compileLightingModule(props.module, normalCompileValues.value);
});

const displayOutput = computed(() =>
  props.previewOutput || String(output.value || ""),
);

watch(
  output,
  (value) => emit("update:output", value),
  { immediate: true },
);

const validationIssues = computed<PromptValidationIssue[]>(() => {
  if (!isCustomMode.value || customOverrideValue.value) return [];

  return [
    {
      id: `${props.module.key}:custom_override_empty`,
      code: "custom_override_empty",
      level: "error",
      moduleKey: props.module.key,
      moduleLabel: moduleTitle.value,
    },
  ];
});

watch(
  validationIssues,
  (issues) => emit("update:issues", issues),
  { immediate: true },
);

const filledNormalFieldsCount = computed(() => {
  let count = 0;

  if (lightSources.value.length) count += 1;
  if (String(values.ambientLevel ?? "").trim()) count += 1;
  if (String(values.overallContrast ?? "").trim()) count += 1;
  if (String(values.extraDetails ?? "").trim()) count += 1;

  return count;
});

const totalNormalFieldsCount = 4;

const statusLabel = computed(() => {
  if (isCustomMode.value) {
    return customOverrideValue.value
      ? t("panel.statusCustom")
      : t("panel.statusCustomEmpty");
  }

  if (activePresetId.value) return t("panel.statusPreset");
  if (filledNormalFieldsCount.value) return t("panel.statusPartiallyFilled");
  return t("panel.statusEmpty");
});

function getFieldOptions(field?: ModuleField) {
  return field?.options || [];
}

function setCustomMode(value: boolean) {
  isCustomMode.value = Boolean(value);
  if (isCustomMode.value) isPanelExpanded.value = true;
}

function clearLighting() {
  const defaults = createDefaultModuleValues(props.module);

  if (isCustomMode.value && customTextField.value) {
    values.customText = cloneValue(defaults.customText ?? "");
    return;
  }

  ["lightSources", "ambientLevel", "overallContrast", "extraDetails"].forEach(
    (key) => {
      values[key] = cloneValue(defaults[key] ?? "");
    },
  );

  activePresetId.value = null;
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

function removeModule() {
  if (!import.meta.client) return;

  window.dispatchEvent(
    new CustomEvent("prompt-draft:remove-key-module", {
      detail: { moduleKey: props.module.key },
    }),
  );
}

const { openModulePanelContextMenu } = useModulePanelContextMenu({
  getTitle: () => moduleTitle.value,
  getExpanded: () => isPanelExpanded.value,
  onToggleExpand: togglePanel,
  canToggleExpand: () => !isCollapseLocked.value,
  canCopyOutput: () => Boolean(displayOutput.value),
  onCopyOutput: copyOutput,
  onRemove: removeModule,
});
</script>

<template>
  <el-grid
    type="section"
    :p="mobile ? 12 : mini ? 16 : 20"
    :br="2"
    :bc="!isPanelExpanded ? 'normal10' : 'blue50'"
    :radius="mobile ? 16 : mini ? 24 : 32"
    bg="surface"
    class="w100"
    @contextmenu="openModulePanelContextMenu"
  >
    <el-flex rules="csc" class="w100">
      <el-flex rules="ccs" class="w100">
        <el-flex :rules="mini ? 'ccs' : 'rbc'" class="w100" :gap="12">
          <el-flex rules="rcc" :gap="12">
            <el-text type="span" marker="blue5" color="blue" :size="12" :weight="700">
              {{ t("panel.keyModule") }}
            </el-text>
            <el-text type="span" marker="orange5" color="orange" :size="12" :weight="700">
              {{ statusLabel }}
            </el-text>
            <el-text type="span" :size="10" color="orange">
              {{ filledNormalFieldsCount }} / {{ totalNormalFieldsCount }} {{ t("panel.fieldsFilled") }}
            </el-text>
          </el-flex>

          <el-flex rules="rcc" :gap="6" :class="mini ? 'w100' : ''">
            <el-switch
              v-if="customTextField"
              :class="mini ? 'fg100' : ''"
              :model-value="isCustomMode"
              :size="12"
              :label="t('panel.customMode')"
              @update:model-value="setCustomMode"
            />
            <el-button
              type="fab"
              mode="flat"
              color="normal"
              icon="refresh"
              :label="isCustomMode ? t('panel.clearCustom') : t('components.contextMenu.actions.reset')"
              :size="12"
              :p="8"
              @click="clearLighting"
            />
            <el-button
              type="fab"
              mode="flat"
              color="red"
              icon="delete"
              :label="t('components.contextMenu.actions.removeFromKeyModules')"
              :size="12"
              :p="8"
              @click="removeModule"
            />
            <el-button
              type="fab"
              :size="14"
              mode="flat"
              color="prim"
              :p="8"
              :disable="isCollapseLocked"
              :label="!isPanelExpanded ? t('panel.expand') : t('panel.collapse')"
              :icon="!isPanelExpanded ? 'expand_more' : 'expand_less'"
              @click="togglePanel"
            />
          </el-flex>
        </el-flex>

        <el-flex rules="ccs" class="w100 crp" :gap="4" @click="togglePanel">
          <el-flex rules="rsc" :gap="8">
            <el-text
              type="h2"
              :size="24"
              :weight="800"
              class="lh1"
              effect="glitch"
              :icon="module.icon"
            >
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

    <el-grid v-show="isPanelExpanded" :gap="12" class="w100">
      <el-grid
        v-if="isCustomMode && customTextField"
        rules="csc"
        :br="1"
        :p="16"
        :radius="16"
        :bc="!customOverrideValue ? 'orange25' : 'normal15'"
        :bg="!customOverrideValue ? 'orange5' : 'normal5'"
      >
        <el-flex :rules="mini ? 'ccs' : 'rbc'" class="w100" :gap="8">
          <el-flex rules="rsc" :gap="8">
            <el-text type="h3" :size="16" :weight="600" icon="edit">
              {{ fieldLabel("customText") }}
            </el-text>
            <el-help
              v-if="fieldDescription('customText')"
              :text="fieldDescription('customText')"
            />
          </el-flex>
          <el-text marker="normal5" :size="12" :weight="300">
            {{ t("panel.customOverrideActive") }}
          </el-text>
        </el-flex>

        <el-text-field
          v-model="values.customText"
          type="textarea"
          :rows="customTextField.ui?.rows || 4"
          :placeholder="fieldPlaceholder('customText')"
          support-variables
        />

        <el-text
          v-if="!customOverrideValue"
          :size="12"
          icon="warning"
          icon-color="orange"
          :weight="300"
          color="orange"
        >
          {{ t("panel.customOverrideEmpty") }}
        </el-text>
      </el-grid>

      <template v-if="!isCustomMode">
        <el-grid :p="12" :br="1" :radius="16" bc="blue25" :gap="12">
          <el-flex rules="rsc" :gap="8">
            <el-text :size="14" :weight="600" icon="widgets">{{ t("panel.presets") }}</el-text>
            <el-help :text="t('modules.lighting.presetsDescription')" />
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

        <el-grid :p="12" :br="1" :radius="16" bc="blue35" :gap="12">
          <el-flex rules="rsc" :gap="8">
            <el-text :size="14" :weight="600" icon="lightbulb">
              {{ t("modules.lighting.groups.sources.title") }}
            </el-text>
            <el-help :text="t('modules.lighting.groups.sources.description')" />
          </el-flex>

          <LightSourcesField
            v-if="lightSourcesField"
            :field="lightSourcesField"
            :model-value="lightSources"
            @update:model-value="values.lightSources = $event"
          />
        </el-grid>

        <el-grid :p="12" :br="1" :radius="16" bc="normal10" :gap="12">
          <el-flex rules="rsc" :gap="8">
            <el-text :size="14" :weight="600" icon="tune">
              {{ t("modules.lighting.groups.global.title") }}
            </el-text>
            <el-help :text="t('modules.lighting.groups.global.description')" />
          </el-flex>

          <el-grid :cols="mobile ? 1 : 2" :gap="10">
            <el-grid v-if="ambientLevelField" :gap="6">
              <el-flex rules="rsc" :gap="6">
                <el-text :size="13" :weight="500">{{ fieldLabel("ambientLevel") }}</el-text>
                <el-help
                  v-if="fieldDescription('ambientLevel')"
                  :text="fieldDescription('ambientLevel')"
                />
              </el-flex>
              <el-dropdown
                v-model="values.ambientLevel"
                :items="getFieldOptions(ambientLevelField)"
                :item-label="(item) => fieldOptionLabel('ambientLevel', item.value)"
                item-value="value"
                :placeholder="t('panel.none')"
                clearable
              />
            </el-grid>

            <el-grid v-if="overallContrastField" :gap="6">
              <el-flex rules="rsc" :gap="6">
                <el-text :size="13" :weight="500">{{ fieldLabel("overallContrast") }}</el-text>
                <el-help
                  v-if="fieldDescription('overallContrast')"
                  :text="fieldDescription('overallContrast')"
                />
              </el-flex>
              <el-dropdown
                v-model="values.overallContrast"
                :items="getFieldOptions(overallContrastField)"
                :item-label="(item) => fieldOptionLabel('overallContrast', item.value)"
                item-value="value"
                :placeholder="t('panel.none')"
                clearable
              />
            </el-grid>
          </el-grid>
        </el-grid>

        <el-grid
          :p="12"
          :br="1"
          :radius="16"
          :bc="isAdvancedOpen ? 'blue35' : 'normal10'"
          :gap="12"
        >
          <el-flex rules="rbc" class="w100 crp" @click="isAdvancedOpen = !isAdvancedOpen">
            <el-flex rules="rsc" :gap="8">
              <el-text
                :size="14"
                :weight="600"
                :icon="isAdvancedOpen ? 'expand_less' : 'expand_more'"
              >
                {{ t("modules.lighting.groups.advanced.title") }}
              </el-text>
              <el-help :text="t('modules.lighting.groups.advanced.description')" />
            </el-flex>
          </el-flex>

          <el-text-field
            v-if="isAdvancedOpen && extraDetailsField"
            v-model="values.extraDetails"
            type="textarea"
            :rows="extraDetailsField.ui?.rows || 3"
            :placeholder="fieldPlaceholder('extraDetails')"
            support-variables
          />
        </el-grid>
      </template>

      <el-grid
        rules="csc"
        :gap="16"
        :br="1"
        :p="16"
        :radius="16"
        :bc="!displayOutput ? 'orange25' : 'normal15'"
        :bg="!displayOutput ? 'orange5' : 'normal5'"
      >
        <el-flex rules="rbc" class="w100" :gap="12">
          <el-flex rules="rsc" :gap="12">
            <el-text
              type="h3"
              :size="16"
              :weight="600"
              :color="!displayOutput ? 'orange' : 'normal'"
              :icon-color="!displayOutput ? 'orange' : 'normal'"
              :icon="!displayOutput ? 'error' : 'task_alt'"
            >
              {{ t("panel.compiledOutput") }}
            </el-text>
            <el-text marker="primary" color="white" :size="12" :weight="300">
              {{ moduleTitle }}
            </el-text>
          </el-flex>

          <el-button
            :label="isCopied ? t('panel.copied') : t('panel.copy')"
            :icon="isCopied ? 'check' : 'content_copy'"
            color="prim"
            :mode="isCopied ? 'flat' : 'normal'"
            :disable="!displayOutput"
            :size="12"
            :p="mini ? 8 : [8, 12]"
            :type="mini ? 'fab' : 'normal'"
            @click="copyOutput"
          />
        </el-flex>

        <el-divider />
        <modules-panel-module-output-text
          v-if="displayOutput"
          :value="displayOutput"
          :size="14"
          color="normal85"
        />
        <el-flex v-else rules="ccs">
          <el-text :size="14" :weight="700">{{ t("panel.emptyOutputTitle") }}</el-text>
          <el-text :size="12" :weight="400">{{ t("panel.emptyOutputDescription") }}</el-text>
        </el-flex>
      </el-grid>
    </el-grid>
  </el-grid>
</template>

<style scoped></style>