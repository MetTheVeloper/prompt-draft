<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import type {
  ExpressionAssignment,
  ModuleValues,
  PoseAssignment,
  PromptKeyModule,
} from "~/modules/types";
import type {
  ModuleOutputValue,
  PromptMode,
} from "~/utils/compilePrompt";
import type { PromptValidationIssue } from "~/utils/promptValidation";
import { createDefaultModuleValues } from "~/utils/compileModules";
import { compilePoseModule } from "~/utils/compilePose";
import { compileExpressionModule } from "~/utils/compileExpression";
import SubjectAssignmentsField from "../shared/SubjectAssignmentsField.vue";

const { t } = useI18n();
const { mobile, mini } = useScreen();

const props = withDefaults(
  defineProps<{
    module: PromptKeyModule;
    modelValue?: ModuleValues;
    panelState?: { isCustomMode?: boolean; activePresetId?: string | null };
    promptMode?: PromptMode;
  }>(),
  {
    promptMode: "text_to_image",
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleValues): void;
  (event: "update:panelState", value: { isCustomMode?: boolean; activePresetId?: string | null }): void;
  (event: "update:output", value: ModuleOutputValue): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
}>();

const values = reactive<ModuleValues>({});
const syncingValues = ref(false);
const syncingPanel = ref(false);
const expanded = ref(false);
const customMode = ref(false);
const copied = ref(false);

const kind = computed<"pose" | "expression">(() =>
  props.module.key === "expression" ? "expression" : "pose",
);
const assignmentFieldId = computed(() =>
  kind.value === "pose" ? "poseAssignments" : "expressionAssignments",
);
const assignmentField = computed(() => props.module.fields[assignmentFieldId.value]);
const customField = computed(() => props.module.fields.customText);

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

const moduleTitle = computed(() =>
  translate(`modules.${kind.value}.title`, kind.value === "pose" ? "Pose" : "Expression"),
);
const moduleDescription = computed(() =>
  translate(
    `modules.${kind.value}.description`,
    kind.value === "pose"
      ? "Define physical body configurations and assign them to semantic subjects."
      : "Define visible facial expressions and assign them to semantic subjects.",
  ),
);

function syncValues(source?: ModuleValues) {
  syncingValues.value = true;
  const defaults = createDefaultModuleValues(props.module);
  Object.keys(values).forEach((key) => delete values[key]);
  Object.assign(values, defaults, cloneValue(source || {}));
  nextTick(() => {
    syncingValues.value = false;
  });
}

watch(() => props.modelValue, syncValues, { immediate: true, deep: true });
watch(values, (next) => {
  if (!syncingValues.value) emit("update:modelValue", cloneValue(next));
}, { deep: true });

watch(() => props.panelState, (state) => {
  syncingPanel.value = true;
  customMode.value = Boolean(state?.isCustomMode);
  nextTick(() => {
    syncingPanel.value = false;
  });
}, { immediate: true, deep: true });

watch(customMode, () => {
  if (syncingPanel.value) return;
  emit("update:panelState", { isCustomMode: customMode.value, activePresetId: null });
});

const assignments = computed(() => {
  const current = values[assignmentFieldId.value];
  return Array.isArray(current)
    ? (current as Array<PoseAssignment | ExpressionAssignment>)
    : [];
});

const customText = computed(() =>
  typeof values.customText === "string" ? values.customText.trim() : "",
);

const output = computed(() => {
  if (customMode.value) return customText.value;
  const replaceSource = props.promptMode === "image_to_image";
  return kind.value === "pose"
    ? compilePoseModule(props.module, values, { replaceSource })
    : compileExpressionModule(props.module, values, { replaceSource });
});

watch(output, (value) => emit("update:output", value), { immediate: true });

const issues = computed<PromptValidationIssue[]>(() => {
  if (customMode.value && !customText.value) {
    return [{
      id: `${kind.value}:custom_override_empty`,
      code: "custom_override_empty",
      level: "error",
      moduleKey: kind.value,
      moduleLabel: moduleTitle.value,
    }];
  }
  return [];
});
watch(issues, (value) => emit("update:issues", value), { immediate: true });

const statusLabel = computed(() => {
  if (customMode.value) return customText.value ? t("panel.statusCustom") : t("panel.statusCustomEmpty");
  return assignments.value.length ? t("panel.statusPartiallyFilled") : t("panel.statusEmpty");
});

function clearModule() {
  const defaults = createDefaultModuleValues(props.module);
  Object.keys(defaults).forEach((key) => {
    values[key] = cloneValue(defaults[key]);
  });
  customMode.value = false;
}

function removeModule() {
  if (!import.meta.client) return;
  window.dispatchEvent(new CustomEvent("prompt-draft:remove-key-module", {
    detail: { moduleKey: props.module.key },
  }));
}

async function copyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(String(output.value));
    copied.value = true;
    window.setTimeout(() => { copied.value = false; }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}
</script>

<template>
  <el-grid
    type="section"
    :p="mobile ? 12 : mini ? 16 : 20"
    :br="2"
    :bc="!expanded ? 'normal10' : 'blue50'"
    :radius="mobile ? 16 : mini ? 24 : 32"
    bg="surface"
    class="w100"
  >
    <el-flex rules="ccs" class="w100" :gap="12">
      <el-flex :rules="mini ? 'ccs' : 'rbc'" class="w100" :gap="12">
        <el-flex rules="rcc" :gap="12">
          <el-text marker="blue5" color="blue" :size="12" :weight="700">{{ t("panel.keyModule") }}</el-text>
          <el-text marker="orange5" color="orange" :size="12" :weight="700">{{ statusLabel }}</el-text>
          <el-text :size="10" color="orange">{{ assignments.length }} {{ translate(`modules.${kind}.fields.assignments.countLabel`, 'assignments') }}</el-text>
        </el-flex>
        <el-flex rules="rcc" :gap="6">
          <el-switch :model-value="customMode" :size="12" :label="t('panel.customMode')" @update:model-value="customMode = $event" />
          <el-button type="fab" mode="flat" icon="refresh" :label="translate('components.contextMenu.actions.reset', 'Reset')" :size="12" :p="8" @click="clearModule" />
          <el-button type="fab" mode="flat" color="red" icon="delete" :label="t('components.contextMenu.actions.removeFromKeyModules')" :size="12" :p="8" @click="removeModule" />
          <el-button type="fab" mode="flat" color="prim" :size="14" :p="8" :label="!expanded ? t('panel.expand') : t('panel.collapse')" :icon="!expanded ? 'expand_more' : 'expand_less'" @click="expanded = !expanded" />
        </el-flex>
      </el-flex>

      <el-flex rules="ccs" class="w100 crp" :gap="4" @click="expanded = !expanded">
        <el-text type="h2" :size="24" :weight="800" class="lh1" effect="glitch" :icon="module.icon">{{ moduleTitle.toUpperCase() }}</el-text>
        <el-text type="p" :size="14" :weight="200" icon="info" color="normal60" icon-color="normal50">{{ moduleDescription }}</el-text>
      </el-flex>

      <el-divider mode="dashed" :dash="4" :gap="2" />
      <el-text v-if="!expanded" :size="12" :color="output ? 'normal50' : 'red80'">{{ output || t("panel.emptyOutput") }}</el-text>
    </el-flex>

    <el-grid v-show="expanded" :gap="12" class="w100">
      <el-grid v-if="!customMode && assignmentField" :p="12" :br="1" :radius="16" bc="blue35" class="w100">
        <el-flex rules="ccs" :gap="4">
          <el-text :size="14" :weight="600" :icon="module.icon">{{ translate(`modules.${kind}.fields.assignments.label`, `${moduleTitle} Assignments`) }}</el-text>
          <el-text :size="11" color="normal45">{{ translate(`modules.${kind}.fields.assignments.description`, `Create ${kind} specifications and assign them to subjects.`) }}</el-text>
        </el-flex>
        <SubjectAssignmentsField
          :model-value="assignments"
          :field="assignmentField"
          :kind="kind"
          @update:model-value="values[assignmentFieldId] = $event"
        />
      </el-grid>

      <el-grid v-if="customMode && customField" :p="12" :br="1" :radius="16" :bc="customText ? 'blue35' : 'orange25'">
        <el-flex rules="ccs" :gap="4">
          <el-text :size="14" :weight="600" icon="edit">{{ translate(`modules.${kind}.fields.customText.label`, 'Custom Override') }}</el-text>
          <el-text :size="11" color="normal45">{{ translate(`modules.${kind}.fields.customText.description`, `Replace structured ${kind} assignments with your own instruction.`) }}</el-text>
        </el-flex>
        <el-text-field v-model="values.customText" type="textarea" :rows="customField.ui?.rows || 4" support-variables :placeholder="translate(`modules.${kind}.fields.customText.placeholder`, `Describe the ${kind} instruction...`)" />
        <el-text v-if="!customText" :size="10" color="orange" icon="warning" icon-color="orange">{{ t("panel.customOverrideEmpty") }}</el-text>
      </el-grid>

      <el-grid :gap="16" :br="1" :p="16" :radius="16" :bc="output ? 'normal15' : 'orange25'" :bg="output ? 'normal5' : 'orange5'">
        <el-flex rules="rbc" class="w100">
          <el-text type="h3" :size="16" :weight="600" :color="output ? 'normal' : 'orange'" :icon="output ? 'task_alt' : 'error'">{{ t("panel.compiledOutput") }}</el-text>
          <el-button :label="copied ? t('panel.copied') : t('panel.copy')" :icon="copied ? 'check' : 'content_copy'" color="prim" :mode="copied ? 'flat' : 'normal'" :disable="!output" :size="12" :p="[8, 12]" @click="copyOutput" />
        </el-flex>
        <el-divider />
        <pre v-if="output" class="fs12 txt-normal" style="white-space: pre-wrap; overflow-wrap: anywhere">{{ output }}</pre>
        <el-text v-else :size="12" color="orange">{{ customMode ? t("panel.emptyCustomOutputDescription") : t("panel.emptyOutputDescription") }}</el-text>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
