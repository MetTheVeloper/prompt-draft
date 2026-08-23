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
import LightSourcesField from "../lighting/LightSourcesField.vue";

const { t } = useI18n();
const { mobile, mini } = useScreen();

const props = defineProps<{
  module: PromptKeyModule;
  modelValue?: ModuleValues;
  panelState?: ModulePanelState;
  aspectRatio?: string;
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
const isOverrideOpen = ref(false);
const isCopied = ref(false);
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
    activePresetId.value = panelState?.activePresetId ?? null;

    nextTick(() => {
      isSyncingPanelState.value = false;
    });
  },
  { immediate: true, deep: true },
);

watch(activePresetId, () => {
  if (isSyncingPanelState.value) return;

  emit("update:panelState", {
    isCustomMode: false,
    activePresetId: activePresetId.value,
  });
});

const moduleI18nBase = computed(() => `modules.${props.module.key}`);

function translate(path: string, fallback = "") {
  const translated = t(path);

  return translated === path ? fallback : translated;
}

const moduleTitle = computed(() => {
  return translate(`${moduleI18nBase.value}.title`, props.module.key);
});

const moduleDescription = computed(() => {
  return translate(`${moduleI18nBase.value}.description`);
});

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

const lightSources = computed<LightingSource[]>(() => {
  return Array.isArray(values.lightSources)
    ? (values.lightSources as LightingSource[])
    : [];
});

const presetItems = computed<ModulePreset[]>(() => {
  return Object.values(props.module.presets || {}).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
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

const output = computed(() => compileLightingModule(props.module, values));

watch(
  output,
  (value) => emit("update:output", value),
  { immediate: true },
);

watch(
  () => values,
  () => emit("update:issues", []),
  { immediate: true, deep: true },
);

const hasCustomOverride = computed(() => {
  return typeof values.customText === "string" && Boolean(values.customText.trim());
});

const filledCount = computed(() => {
  let count = 0;

  if (lightSources.value.length) count += 1;
  if (String(values.ambientLevel ?? "").trim()) count += 1;
  if (String(values.overallContrast ?? "").trim()) count += 1;
  if (String(values.extraDetails ?? "").trim()) count += 1;
  if (hasCustomOverride.value) count += 1;

  return count;
});

const statusLabel = computed(() => {
  if (hasCustomOverride.value) return t("panel.statusCustom");
  if (activePresetId.value) return t("panel.statusPreset");
  if (filledCount.value) return t("panel.statusPartiallyFilled");
  return t("panel.statusEmpty");
});

function getFieldOptions(field?: ModuleField) {
  return field?.options || [];
}

function togglePanel() {
  isPanelExpanded.value = !isPanelExpanded.value;
}

function clearLighting() {
  const defaults = createDefaultModuleValues(props.module);

  Object.keys(defaults).forEach((key) => {
    values[key] = cloneValue(defaults[key]);
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

function removeModule() {
  if (!import.meta.client) return;

  window.dispatchEvent(
    new CustomEvent("prompt-draft:remove-key-module", {
      detail: {
        moduleKey: props.module.key,
      },
    }),
  );
}

const { openModulePanelContextMenu } = useModulePanelContextMenu({
  getTitle: () => moduleTitle.value,
  getExpanded: () => isPanelExpanded.value,
  onToggleExpand: togglePanel,
  canCopyOutput: () => Boolean(output.value),
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
              {{ filledCount }} / 5 {{ t("panel.fieldsFilled") }}
            </el-text>
          </el-flex>

          <el-flex rules="rcc" :gap="6" :class="mini ? 'w100' : ''">
            <el-button
              type="fab"
              mode="flat"
              color="normal"
              icon="refresh"
              :label="t('components.contextMenu.actions.reset')"
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
              :label="!isPanelExpanded ? t('panel.expand') : t('panel.collapse')"
              :icon="!isPanelExpanded ? 'expand_more' : 'expand_less'"
              @click="togglePanel"
            />
          </el-flex>
        </el-flex>

        <el-flex rules="ccs" class="w100 crp" :gap="4" @click="togglePanel">
          <el-text type="h2" :size="24" :weight="800" class="lh1" effect="glitch" :icon="module.icon">
            {{ moduleTitle.toUpperCase() }}
          </el-text>
          <el-text
            v-if="moduleDescription"
            type="p"
            :size="14"
            :weight="200"
            icon="info"
            color="normal60"
            icon-color="normal50"
          >
            {{ moduleDescription }}
          </el-text>
        </el-flex>

        <el-divider mode="dashed" :dash="4" :gap="2" class="mt12 mb12" />
        <el-text v-if="!isPanelExpanded" type="span" :size="12" :color="output ? 'normal50' : 'red80'">
          {{ output || t("panel.emptyOutput") }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-grid v-show="isPanelExpanded" :gap="12" class="w100">
      <el-grid :p="12" :br="1" :radius="16" bc="blue25" :gap="12">
        <el-flex rules="ccs" :gap="2">
          <el-text :size="14" :weight="600" icon="widgets">{{ t("panel.presets") }}</el-text>
          <el-text :size="11" color="normal45">{{ t("modules.lighting.presetsDescription") }}</el-text>
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
        <el-flex rules="ccs" :gap="2">
          <el-text :size="14" :weight="600" icon="lightbulb">
            {{ t("modules.lighting.groups.sources.title") }}
          </el-text>
          <el-text :size="11" color="normal45">
            {{ t("modules.lighting.groups.sources.description") }}
          </el-text>
        </el-flex>

        <LightSourcesField
          v-if="lightSourcesField"
          :field="lightSourcesField"
          :model-value="lightSources"
          @update:model-value="values.lightSources = $event"
        />
      </el-grid>

      <el-grid :p="12" :br="1" :radius="16" bc="normal10" :gap="12">
        <el-flex rules="ccs" :gap="2">
          <el-text :size="14" :weight="600" icon="tune">
            {{ t("modules.lighting.groups.global.title") }}
          </el-text>
          <el-text :size="11" color="normal45">
            {{ t("modules.lighting.groups.global.description") }}
          </el-text>
        </el-flex>

        <el-grid :cols="mobile ? 1 : 2" :gap="10">
          <el-grid v-if="ambientLevelField" :gap="6">
            <el-flex rules="ccs" :gap="0">
              <el-text :size="13" :weight="500">{{ fieldLabel("ambientLevel") }}</el-text>
              <el-text :size="10" color="normal45">{{ fieldDescription("ambientLevel") }}</el-text>
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
            <el-flex rules="ccs" :gap="0">
              <el-text :size="13" :weight="500">{{ fieldLabel("overallContrast") }}</el-text>
              <el-text :size="10" color="normal45">{{ fieldDescription("overallContrast") }}</el-text>
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

      <el-grid :p="12" :br="1" :radius="16" :bc="isAdvancedOpen ? 'blue35' : 'normal10'" :gap="12">
        <el-flex rules="rbc" class="w100 crp" @click="isAdvancedOpen = !isAdvancedOpen">
          <el-flex rules="ccs" :gap="2">
            <el-text :size="14" :weight="600" :icon="isAdvancedOpen ? 'expand_less' : 'expand_more'">
              {{ t("modules.lighting.groups.advanced.title") }}
            </el-text>
            <el-text :size="11" color="normal45">{{ t("modules.lighting.groups.advanced.description") }}</el-text>
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

      <el-grid :p="12" :br="1" :radius="16" :bc="isOverrideOpen || hasCustomOverride ? 'orange35' : 'normal10'" :gap="12">
        <el-flex rules="rbc" class="w100 crp" @click="isOverrideOpen = !isOverrideOpen">
          <el-flex rules="ccs" :gap="2">
            <el-text
              :size="14"
              :weight="600"
              :color="hasCustomOverride ? 'orange' : 'normal'"
              :icon="isOverrideOpen ? 'expand_less' : 'expand_more'"
            >
              {{ t("modules.lighting.groups.override.title") }}
            </el-text>
            <el-text :size="11" color="normal45">{{ t("modules.lighting.groups.override.description") }}</el-text>
          </el-flex>
        </el-flex>

        <el-text-field
          v-if="isOverrideOpen && customTextField"
          v-model="values.customText"
          type="textarea"
          :rows="customTextField.ui?.rows || 4"
          :placeholder="fieldPlaceholder('customText')"
          support-variables
        />
      </el-grid>

      <el-grid
        rules="csc"
        :gap="16"
        :br="1"
        :p="16"
        :radius="16"
        :bc="!output ? 'orange25' : 'normal15'"
        :bg="!output ? 'orange5' : 'normal5'"
      >
        <el-flex rules="rbc" class="w100" :gap="12">
          <el-flex rules="rsc" :gap="12">
            <el-text
              type="h3"
              :size="16"
              :weight="600"
              :color="!output ? 'orange' : 'normal'"
              :icon-color="!output ? 'orange' : 'normal'"
              :icon="!output ? 'error' : 'task_alt'"
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
            :disable="!output"
            :size="12"
            :p="mini ? 8 : [8, 12]"
            :type="mini ? 'fab' : 'normal'"
            @click="copyOutput"
          />
        </el-flex>

        <el-divider />
        <el-text v-if="output" :size="14" :weight="300" color="normal85">
          {{ output }}
        </el-text>
        <el-flex v-else rules="ccs">
          <el-text :size="14" :weight="700">{{ t("panel.emptyOutputTitle") }}</el-text>
          <el-text :size="12" :weight="400">{{ t("panel.emptyOutputDescription") }}</el-text>
        </el-flex>
      </el-grid>
    </el-grid>
  </el-grid>
</template>

<style scoped></style>