<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import type {
  MaterialAssignment,
  ModuleValues,
  PromptKeyModule,
} from "../../../modules/types";
import type { ModuleOutputValue } from "../../../utils/compilePrompt";
import type { PromptValidationIssue } from "../../../utils/promptValidation";
import { createDefaultModuleValues } from "../../../utils/compileModules";
import { compileTextureModule } from "../../../utils/compileTexture";
import { useModulePanelContextMenu } from "~/composables/useModulePanelContextMenu";
import MaterialAssignmentsField from "../texture/MaterialAssignmentsField.vue";

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
const isCustomMode = ref(false);
const isCopied = ref(false);

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

    nextTick(() => {
      isSyncingPanelState.value = false;
    });
  },
  { immediate: true, deep: true },
);

watch(isCustomMode, () => {
  if (isSyncingPanelState.value) return;

  emit("update:panelState", {
    isCustomMode: isCustomMode.value,
    activePresetId: null,
  });
});

const moduleI18nBase = computed(() => `modules.${props.module.key}`);

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

const moduleTitle = computed(() =>
  translate(`${moduleI18nBase.value}.title`, "Texture / Material"),
);
const moduleDescription = computed(() =>
  translate(
    `${moduleI18nBase.value}.description`,
    "Define material and surface properties, then assign them to semantic targets.",
  ),
);

const assignmentField = computed(() => props.module.fields.materialAssignments);
const extraDetailsField = computed(() => props.module.fields.extraDetails);
const customTextField = computed(() => props.module.fields.customText);

const assignments = computed<MaterialAssignment[]>(() => {
  return Array.isArray(values.materialAssignments)
    ? (values.materialAssignments as MaterialAssignment[])
    : [];
});

const customTextValue = computed(() => {
  return typeof values.customText === "string" ? values.customText.trim() : "";
});

const effectiveValues = computed<ModuleValues>(() => ({
  ...values,
  customText: "",
}));

const output = computed(() => {
  if (isCustomMode.value) return customTextValue.value;
  return compileTextureModule(props.module, effectiveValues.value);
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
        id: "texture:custom_override_empty",
        code: "custom_override_empty",
        level: "error",
        moduleKey: "texture",
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

const filledCount = computed(() => {
  let count = 0;
  if (assignments.value.length) count += 1;
  if (typeof values.extraDetails === "string" && values.extraDetails.trim()) count += 1;
  if (customTextValue.value) count += 1;
  return count;
});

const statusLabel = computed(() => {
  if (isCustomMode.value) {
    return customTextValue.value ? t("panel.statusCustom") : t("panel.statusCustomEmpty");
  }
  if (assignments.value.length || String(values.extraDetails || "").trim()) {
    return t("panel.statusPartiallyFilled");
  }
  return t("panel.statusEmpty");
});

function fieldLabel(fieldId: string, fallback: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.label`, fallback);
}

function fieldDescription(fieldId: string, fallback = "") {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.description`, fallback);
}

function fieldPlaceholder(fieldId: string, fallback = "") {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.placeholder`, fallback);
}

function togglePanel() {
  isPanelExpanded.value = !isPanelExpanded.value;
}

function clearTexture() {
  const defaults = createDefaultModuleValues(props.module);
  Object.keys(defaults).forEach((key) => {
    values[key] = cloneValue(defaults[key]);
  });
  isCustomMode.value = false;
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
              {{ filledCount }} / 3 {{ t("panel.fieldsFilled") }}
            </el-text>
          </el-flex>

          <el-flex rules="rcc" :gap="6" :class="mini ? 'w100' : ''">
            <el-switch
              :model-value="isCustomMode"
              :size="12"
              :label="t('panel.customMode')"
              @update:model-value="isCustomMode = $event"
            />
            <el-button
              type="fab"
              mode="flat"
              icon="refresh"
              :label="translate('components.contextMenu.actions.reset', 'Reset')"
              :size="12"
              :p="8"
              @click="clearTexture"
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
        <el-text v-if="!isPanelExpanded" :size="12" :color="output ? 'normal50' : 'red80'">
          {{ output || t("panel.emptyOutput") }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-grid v-show="isPanelExpanded" :gap="12" class="w100">
      <el-grid
        v-if="!isCustomMode && assignmentField"
        :p="12"
        :br="1"
        :radius="16"
        bc="blue35"
        class="w100"
      >
        <el-flex rules="ccs" :gap="4" class="w100">
          <el-text :size="14" :weight="600" icon="texture">
            {{ fieldLabel("materialAssignments", "Material Assignments") }}
          </el-text>
          <el-text :size="11" color="normal45">
            {{ fieldDescription("materialAssignments", "Build material and surface specifications and assign them to scene entities.") }}
          </el-text>
        </el-flex>

        <MaterialAssignmentsField
          :model-value="assignments"
          :field="assignmentField"
          @update:model-value="values.materialAssignments = $event"
        />
      </el-grid>

      <el-grid
        v-if="!isCustomMode && extraDetailsField"
        :p="12"
        :br="1"
        :radius="16"
        :bc="isAdvancedOpen ? 'blue35' : 'normal10'"
        class="w100"
      >
        <el-flex rules="rbc" class="w100 crp" @click="isAdvancedOpen = !isAdvancedOpen">
          <el-text :size="14" :weight="600" :icon="isAdvancedOpen ? 'expand_less' : 'expand_more'">
            {{ fieldLabel("extraDetails", "Extra Details") }}
          </el-text>
        </el-flex>
        <el-text-field
          v-show="isAdvancedOpen"
          v-model="values.extraDetails"
          type="textarea"
          :rows="extraDetailsField.ui?.rows || 3"
          support-variables
          :placeholder="fieldPlaceholder('extraDetails', 'Add optional material or surface details...')"
        />
      </el-grid>

      <el-grid
        v-if="isCustomMode && customTextField"
        :p="12"
        :br="1"
        :radius="16"
        :bc="customTextValue ? 'blue35' : 'orange25'"
        class="w100"
      >
        <el-flex rules="ccs" class="w100" :gap="4">
          <el-text :size="14" :weight="600" icon="edit">
            {{ fieldLabel("customText", "Custom Override") }}
          </el-text>
          <el-text :size="11" color="normal45">
            {{ fieldDescription("customText", "Replace structured material assignments with your own texture/material instruction.") }}
          </el-text>
        </el-flex>
        <el-text-field
          v-model="values.customText"
          type="textarea"
          :rows="customTextField.ui?.rows || 4"
          support-variables
          :placeholder="fieldPlaceholder('customText', 'Describe the material and surface behavior...')"
        />
        <el-text v-if="!customTextValue" :size="10" color="orange" icon="warning" icon-color="orange">
          {{ t("panel.customOverrideEmpty") }}
        </el-text>
      </el-grid>

      <el-grid
        rules="csc"
        :gap="16"
        :br="1"
        :p="16"
        :radius="16"
        :bc="output ? 'normal15' : 'orange25'"
        :bg="output ? 'normal5' : 'orange5'"
      >
        <el-flex rules="rbc" class="w100">
          <el-text
            type="h3"
            :size="16"
            :weight="600"
            :color="output ? 'normal' : 'orange'"
            :icon="output ? 'task_alt' : 'error'"
          >
            {{ t("panel.compiledOutput") }}
          </el-text>
          <el-button
            :label="isCopied ? t('panel.copied') : t('panel.copy')"
            :icon="isCopied ? 'check' : 'content_copy'"
            color="prim"
            :mode="isCopied ? 'flat' : 'normal'"
            :disable="!output"
            :size="12"
            :p="[8, 12]"
            @click="copyOutput"
          />
        </el-flex>
        <el-divider />
        <el-text v-if="output" :size="14" :weight="300" color="normal85">
          {{ output }}
        </el-text>
        <el-text v-else :size="12" color="orange">
          {{ isCustomMode ? t("panel.emptyCustomOutputDescription") : t("panel.emptyOutputDescription") }}
        </el-text>
      </el-grid>
    </el-grid>
  </el-grid>
</template>