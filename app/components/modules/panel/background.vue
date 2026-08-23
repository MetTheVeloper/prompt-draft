<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import type {
  ModuleField,
  ModuleFieldValue,
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
import { compileBackgroundModule } from "../../../utils/compileBackground";
import {
  getModuleFieldCustomValueKey,
  isModuleFieldCustomSelection,
} from "../../../utils/moduleFieldValues";
import { useModulePanelContextMenu } from "~/composables/useModulePanelContextMenu";

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

type FieldGroup = {
  id: string;
  fields: ModuleField[];
};

const values = reactive<ModuleValues>({});
const isSyncingValues = ref(false);
const isSyncingPanelState = ref(false);
const isPanelExpanded = ref(false);
const isCustomMode = ref(false);
const activePresetId = ref<string | null>(null);
const isCopied = ref(false);
const openGroups = reactive<Record<string, boolean>>({
  core: true,
  construction: true,
  content: true,
  advanced: false,
});

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function customDefaults() {
  return Object.values(props.module.fields).reduce<ModuleValues>((result, field) => {
    if (field.customInput) {
      result[getModuleFieldCustomValueKey(field)] = "";
    }
    return result;
  }, {});
}

function syncValuesFromModel(modelValue?: ModuleValues) {
  isSyncingValues.value = true;

  const nextValues = {
    ...createDefaultModuleValues(props.module),
    ...customDefaults(),
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
  translate(`${moduleI18nBase.value}.title`, "Background"),
);
const moduleDescription = computed(() =>
  translate(`${moduleI18nBase.value}.description`),
);

const normalFields = computed(() =>
  Object.values(props.module.fields)
    .filter((field) => !field.isOverride)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
);

const fieldGroups = computed<FieldGroup[]>(() => {
  const groupIds = ["core", "construction", "content", "advanced"];

  return groupIds
    .map((id) => ({
      id,
      fields: normalFields.value.filter((field) => (field.group || "core") === id),
    }))
    .filter((group) => group.fields.length > 0);
});

const presetItems = computed<ModulePreset[]>(() =>
  Object.values(props.module.presets || {}).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  ),
);

const presetDropdownItems = computed(() => [
  { value: "", label: t("panel.none") },
  ...presetItems.value.map((preset) => ({
    value: preset.id,
    label: presetLabel(preset.id),
    description: presetDescription(preset.id),
  })),
]);

const customTextValue = computed(() => {
  return typeof values.customText === "string" ? values.customText.trim() : "";
});

const effectiveValues = computed<ModuleValues>(() => ({
  ...values,
  customText: "",
}));

const output = computed(() => {
  if (isCustomMode.value) return customTextValue.value;
  return compileBackgroundModule(props.module, effectiveValues.value);
});

watch(
  output,
  (value) => emit("update:output", value),
  { immediate: true },
);

const validationIssues = computed<PromptValidationIssue[]>(() => {
  if (isCustomMode.value && !customTextValue.value) {
    return [
      {
        id: "background:custom_override_empty",
        code: "custom_override_empty",
        level: "error",
        moduleKey: "background",
        moduleLabel: moduleTitle.value,
      },
    ];
  }

  return [];
});

watch(
  validationIssues,
  (issues) => emit("update:issues", issues),
  { immediate: true },
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

function fieldCustomPlaceholder(fieldId: string) {
  return translate(
    `${moduleI18nBase.value}.fields.${fieldId}.customPlaceholder`,
    fieldPlaceholder(fieldId),
  );
}

function optionLabel(fieldId: string, optionValue: string) {
  return translate(
    `${moduleI18nBase.value}.fields.${fieldId}.options.${optionValue}`,
    optionValue,
  );
}

function groupTitle(groupId: string) {
  return translate(`${moduleI18nBase.value}.groups.${groupId}.title`, groupId);
}

function groupDescription(groupId: string) {
  return translate(`${moduleI18nBase.value}.groups.${groupId}.description`);
}

function presetLabel(presetId: string) {
  return translate(`${moduleI18nBase.value}.presets.${presetId}.label`, presetId);
}

function presetDescription(presetId: string) {
  return translate(`${moduleI18nBase.value}.presets.${presetId}.description`);
}

function getFieldOptions(field: ModuleField) {
  return field.options || [];
}

function customValueKey(field: ModuleField) {
  return getModuleFieldCustomValueKey(field);
}

function hasCustomSelection(field: ModuleField) {
  return isModuleFieldCustomSelection(field, values[field.id]);
}

function fieldIsFilled(field: ModuleField) {
  const value = values[field.id];

  if (Array.isArray(value)) {
    if (value.some((item) => item !== "custom")) return true;
    return hasCustomSelection(field)
      ? Boolean(String(values[customValueKey(field)] || "").trim())
      : false;
  }

  if (hasCustomSelection(field)) {
    return Boolean(String(values[customValueKey(field)] || "").trim());
  }

  return typeof value === "string" ? Boolean(value.trim()) : Boolean(value);
}

const filledNormalFieldsCount = computed(() =>
  normalFields.value.filter(fieldIsFilled).length,
);

const hasAnyValue = computed(() => {
  return filledNormalFieldsCount.value > 0 || Boolean(customTextValue.value);
});

const statusLabel = computed(() => {
  if (isCustomMode.value) {
    return customTextValue.value ? t("panel.statusCustom") : t("panel.statusCustomEmpty");
  }
  if (activePresetId.value) return t("panel.statusPreset");
  if (filledNormalFieldsCount.value > 0) return t("panel.statusPartiallyFilled");
  return t("panel.statusEmpty");
});

function presetMatchesCurrentValues(presetId: string) {
  const presetValues = getModulePresetValues(props.module, presetId);
  const entries = Object.entries(presetValues);
  if (!entries.length) return false;

  return entries.every(([key, value]) => {
    try {
      return JSON.stringify(values[key]) === JSON.stringify(value);
    } catch {
      return values[key] === value;
    }
  });
}

watch(
  values,
  () => {
    if (isSyncingValues.value || !activePresetId.value) return;
    if (!presetMatchesCurrentValues(activePresetId.value)) {
      activePresetId.value = null;
    }
  },
  { deep: true },
);

function applyPreset(presetId: string) {
  const presetValues = getModulePresetValues(props.module, presetId);
  if (!Object.keys(presetValues).length) return;

  Object.entries(presetValues).forEach(([key, value]) => {
    values[key] = cloneValue(value);

    const field = props.module.fields[key];
    if (field?.customInput && !isModuleFieldCustomSelection(field, value)) {
      values[customValueKey(field)] = "";
    }
  });

  activePresetId.value = presetId;
  isCustomMode.value = false;
  isPanelExpanded.value = true;
}

function handlePresetSelect(value: unknown) {
  const presetId = String(value ?? "");
  if (!presetId) {
    activePresetId.value = null;
    return;
  }
  applyPreset(presetId);
}

function clearBackground() {
  const defaults = {
    ...createDefaultModuleValues(props.module),
    ...customDefaults(),
  };

  Object.keys(defaults).forEach((key) => {
    values[key] = cloneValue(defaults[key]);
  });

  activePresetId.value = null;
  isCustomMode.value = false;
}

function togglePanel() {
  isPanelExpanded.value = !isPanelExpanded.value;
}

function toggleGroup(groupId: string) {
  openGroups[groupId] = !openGroups[groupId];
}

function promptEditorId(fieldId: string, suffix = "") {
  return `${props.module.key}:${fieldId}${suffix ? `:${suffix}` : ""}`;
}

async function copyOutput() {
  if (!output.value) return;

  try {
    await navigator.clipboard.writeText(String(output.value));
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
  getCustomMode: () => isCustomMode.value,
  onToggleCustomize: () => {
    isCustomMode.value = !isCustomMode.value;
    if (isCustomMode.value) isPanelExpanded.value = true;
  },
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
              {{ filledNormalFieldsCount }} / {{ normalFields.length }} {{ t("panel.fieldsFilled") }}
            </el-text>
          </el-flex>

          <el-flex rules="rcc" :class="mini ? 'w100' : ''">
            <el-switch
              :class="mini ? 'fg100' : ''"
              :model-value="isCustomMode"
              :size="12"
              @update:model-value="isCustomMode = $event"
              :label="t('panel.customMode')"
            />
            <el-button
              type="fab"
              :size="14"
              @click="clearBackground"
              :disable="!hasAnyValue"
              mode="flat"
              :p="8"
              :label="t('panel.clear')"
              icon="delete"
            />
            <el-button
              type="fab"
              :size="14"
              @click="copyOutput"
              :disable="!output"
              :mode="isCopied ? 'flat' : 'normal'"
              color="prim"
              :p="8"
              :label="isCopied ? t('panel.copied') : t('panel.copy')"
              :icon="isCopied ? 'check' : 'content_copy'"
            />
            <el-button
              type="fab"
              :size="14"
              @click="togglePanel"
              mode="flat"
              color="prim"
              :p="8"
              :label="!isPanelExpanded ? t('panel.expand') : t('panel.collapse')"
              :icon="!isPanelExpanded ? 'expand_more' : 'expand_less'"
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
      <el-grid
        v-if="isCustomMode"
        rules="csc"
        :br="1"
        :p="16"
        :radius="16"
        :bc="!customTextValue ? 'orange25' : 'normal15'"
        :bg="!customTextValue ? 'orange5' : 'normal5'"
      >
        <el-flex rules="ccs" :gap="4">
          <el-text :size="16" :weight="600" icon="edit">
            {{ fieldLabel("customText") }}
          </el-text>
          <el-text :size="10" color="normal45">
            {{ fieldDescription("customText") }}
          </el-text>
        </el-flex>
        <el-text-field
          v-model="values.customText"
          type="textarea"
          :rows="4"
          :placeholder="fieldPlaceholder('customText')"
          :editor-id="promptEditorId('customText', 'override')"
          support-variables
        />
      </el-grid>

      <template v-else>
        <el-grid
          :p="12"
          :br="1"
          :radius="16"
          :bc="openGroups[group.id] ? 'blue50' : 'normal10'"
          v-for="group in fieldGroups"
          :key="group.id"
        >
          <el-flex rules="csc" class="w100">
            <el-flex rules="rbc" class="w100 crp" @click="toggleGroup(group.id)">
              <el-flex rules="ccs" :gap="3">
                <el-text
                  :size="14"
                  :weight="600"
                  :icon="openGroups[group.id] ? 'expand_less' : 'expand_more'"
                >
                  {{ groupTitle(group.id) }}
                </el-text>
                <el-text v-if="groupDescription(group.id)" :size="10" color="normal45">
                  {{ groupDescription(group.id) }}
                </el-text>
              </el-flex>
              <el-text :size="10">
                {{ group.fields.filter(fieldIsFilled).length }} / {{ group.fields.length }}
              </el-text>
            </el-flex>

            <el-grid v-if="openGroups[group.id]" :cols="mobile ? 1 : 2" :gap="12" class="w100">
              <el-grid
                v-if="group.id === 'core'"
                :br="1"
                :radius="12"
                bc="normal5"
                :p="12"
                :gap="12"
              >
                <el-flex rules="ccs" :gap="3">
                  <el-text :size="14" :weight="400" icon="widgets">{{ t("panel.presets") }}</el-text>
                  <el-text :size="10" color="normal45">{{ t("panel.presetsDescription") }}</el-text>
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

              <el-grid
                v-for="field in group.fields"
                :key="field.id"
                :br="1"
                :radius="12"
                bc="normal5"
                :p="12"
                :gap="12"
                :class="field.ui?.width === 'full' || field.type === 'multiSelect' || field.type === 'textarea' ? 'w100' : ''"
              >
                <el-flex rules="ccs" :gap="3">
                  <el-text :size="14" :weight="400" icon="star">
                    {{ fieldLabel(field.id) }}
                  </el-text>
                  <el-text v-if="fieldDescription(field.id)" :size="10" color="normal45">
                    {{ fieldDescription(field.id) }}
                  </el-text>
                </el-flex>

                <el-dropdown
                  v-if="field.type === 'select'"
                  v-model="values[field.id]"
                  :items="getFieldOptions(field)"
                  :item-label="(option) => optionLabel(field.id, option.value)"
                  item-value="value"
                  item-disabled="disabled"
                  :placeholder="fieldPlaceholder(field.id) || t('panel.none')"
                  :clearable="field.ui?.clearable !== false"
                />

                <el-multi-select
                  v-else-if="field.type === 'multiSelect'"
                  v-model="values[field.id]"
                  :items="getFieldOptions(field)"
                  :item-label="(option) => optionLabel(field.id, option.value)"
                  item-value="value"
                  item-disabled="disabled"
                  :placeholder="fieldPlaceholder(field.id) || t('panel.none')"
                  :clearable="field.ui?.clearable !== false"
                />

                <el-text-field
                  v-else-if="field.type === 'textarea'"
                  v-model="values[field.id]"
                  type="textarea"
                  :rows="field.ui?.rows || 3"
                  :placeholder="fieldPlaceholder(field.id)"
                  :editor-id="promptEditorId(field.id)"
                  support-variables
                />

                <el-text-field
                  v-if="field.customInput && hasCustomSelection(field)"
                  v-model="values[customValueKey(field)]"
                  type="text"
                  :placeholder="fieldCustomPlaceholder(field.id)"
                  :editor-id="promptEditorId(field.id, 'custom')"
                  support-variables
                />
              </el-grid>
            </el-grid>
          </el-flex>
        </el-grid>
      </template>

      <el-grid
        rules="csc"
        :gap="16"
        :br="1"
        :p="16"
        :radius="16"
        :bc="!output ? 'orange25' : 'normal15'"
        :bg="!output ? 'orange5' : 'normal5'"
      >
        <el-flex rules="rbc" class="w100">
          <el-flex rules="rsc" :gap="16">
            <el-text
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
            @click="copyOutput"
            :disable="!output"
            :size="12"
            :p="[8, 12]"
          />
        </el-flex>
        <el-divider />
        <el-text v-if="output" :size="14" :weight="300" color="normal85">
          {{ output }}
        </el-text>
        <el-flex v-else rules="ccs">
          <el-text :size="14" :weight="700">{{ t("panel.emptyOutputTitle") }}</el-text>
          <el-text :size="12" :weight="400">
            {{ isCustomMode ? t("panel.emptyCustomOutputDescription") : t("panel.emptyOutputDescription") }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-button
        mode="flat"
        color="red"
        icon="delete"
        :label="t('components.contextMenu.actions.removeFromKeyModules')"
        @click="removeModule"
      />
    </el-grid>
  </el-grid>
</template>

<style scoped></style>