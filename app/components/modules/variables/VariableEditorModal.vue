<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";
type VariableEditorController = {
  submit: () => boolean;
};
import type {
  ModuleField,
  ModuleFieldOption,
  PromptVariable,
  PromptVariableType,
} from "../../../modules/types";

import {
  createUniqueVariableKey,
  formatVariableToken,
  isReservedVariableKey,
  isValidVariableKey,
  normalizeVariableKey,
} from "../../../utils/promptVariables";

const props = withDefaults(
  defineProps<{
    variable: PromptVariable;
    field: ModuleField;
    moduleKey: string;
    typeOptions?: ModuleFieldOption[];
    existingKeys?: string[];
    isEdit?: boolean;
    controller?: VariableEditorController;
    onSave?: (variable: PromptVariable) => void;
  }>(),
  {
    typeOptions: () => [],
    existingKeys: () => [],
    isEdit: false,
  }
);

const emit = defineEmits<{
  (event: "close"): void;
}>();

const { t } = useI18n();
const { mobile } = useScreen();

const submitAttempted = ref(false);
const keyTouched = ref(false);

const draft = reactive<PromptVariable>({
  id: props.variable.id,
  key: props.variable.key || "",
  value: props.variable.value || "",
  description: props.variable.description || "",
  type: props.variable.type || "text",
  enabled: props.variable.enabled !== false,
});

const normalizedExistingKeys = computed(() => {
  return props.existingKeys
    .map((key) => normalizeVariableKey(key))
    .filter(Boolean);
});

const normalizedKey = computed(() => {
  return normalizeVariableKey(draft.key);
});

const typeOptions = computed(() => {
  if (props.typeOptions.length) {
    return props.typeOptions;
  }

  return [
    { value: "text" },
    { value: "subject" },
    { value: "reference" },
    { value: "object" },
    { value: "color" },
    { value: "custom" },
  ];
});

const keyIssue = computed(() => {
  if (!isValidVariableKey(normalizedKey.value)) {
    return t("modules.variables.fields.variables.validation.invalidKey");
  }

  if (isReservedVariableKey(normalizedKey.value)) {
    return t("modules.variables.fields.variables.validation.reservedKey");
  }

  if (normalizedExistingKeys.value.includes(normalizedKey.value)) {
    return t("modules.variables.fields.variables.validation.duplicateKey");
  }

  return "";
});

const shouldShowKeyIssue = computed(() => {
  return Boolean(keyIssue.value) && (keyTouched.value || submitAttempted.value);
});

const outputToken = computed(() => {
  return formatVariableToken(normalizedKey.value || "variable");
});

function translate(path: string, fallback = "") {
  const translated = t(path);

  return translated === path ? fallback : translated;
}

function variableTypeLabel(optionValue: string) {
  return translate(
    `modules.${props.moduleKey}.fields.${props.field.id}.types.${optionValue}`,
    optionValue
  );
}

function updateVariableType(value: ElDropdownValue) {
  draft.type = String(value || "text") as PromptVariableType;
}

function normalizeDraftKey() {
  keyTouched.value = true;

  const key = normalizeVariableKey(draft.key);

  draft.key = key;

  if (!key || isReservedVariableKey(key)) return;

  draft.key = createUniqueVariableKey(key, normalizedExistingKeys.value);
}

function submitVariable() {
  const saved = saveVariable();

  if (saved) {
    emit("close");
  }
}

function saveVariable() {
  submitAttempted.value = true;
  normalizeDraftKey();

  if (keyIssue.value) return false;

  props.onSave?.({
    id: draft.id,
    key: normalizedKey.value,
    value: draft.value || "",
    description: draft.description || "",
    type: (draft.type || "text") as PromptVariableType,
    enabled: draft.enabled !== false,
  });

  return true;
}

if (props.controller) {
  props.controller.submit = saveVariable;
}

onBeforeUnmount(() => {
  if (props.controller?.submit === saveVariable) {
    props.controller.submit = () => false;
  }
});
</script>

<template>
  <form class="variable-editor" @submit.prevent="submitVariable">
    <el-grid :cols="mobile ? 1 : 2" :gap="10" class="w100">
      <label class="variable-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.variables.fields.variables.controls.key.label") }}
        </el-text>

        <el-text-field
          v-model="draft.key"
          type="text"
          :placeholder="t('modules.variables.fields.variables.controls.key.placeholder')"
          @blur="normalizeDraftKey"
        />
      </label>

      <div class="variable-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.variables.fields.variables.controls.type.label") }}
        </el-text>

        <el-dropdown
          :model-value="draft.type"
          :items="typeOptions"
          :item-label="(option) => variableTypeLabel(option.value)"
          item-value="value"
          @update:model-value="updateVariableType"
        />
      </div>
    </el-grid>

    <label class="variable-editor__control">
      <el-text :size="11" color="normal50">
        {{ t("modules.variables.fields.variables.controls.value.label") }}
      </el-text>

      <el-text-field
        v-model="draft.value"
        type="textarea"
        rows="4"
        :placeholder="t('modules.variables.fields.variables.controls.value.placeholder')"
      />
    </label>

    <label class="variable-editor__control">
      <el-text :size="11" color="normal50">
        {{ t("modules.variables.fields.variables.controls.description.label") }}
      </el-text>

      <el-text-field
        v-model="draft.description"
        type="text"
        :placeholder="t('modules.variables.fields.variables.controls.description.placeholder')"
      />
    </label>

    <label class="variable-editor__enabled">
      <input v-model="draft.enabled" type="checkbox" />

      <el-text :size="12">
        {{ t("modules.variables.fields.variables.controls.enabled.label") }}
      </el-text>
    </label>

    <el-text v-if="shouldShowKeyIssue" :size="11" color="orange" icon="danger" icon-color="orange">
      {{ keyIssue }}
    </el-text>

    <el-text v-else :size="11" color="normal45" icon="code">
      {{ t("modules.variables.fields.variables.outputToken", { token: outputToken }) }}
    </el-text>
  </form>
</template>

<style scoped>
.variable-editor {
  display: grid;
  gap: 12px;
  width: 100%;
  max-height: min(72vh, 640px);
  overflow: auto;
}

.variable-editor__control {
  display: grid;
  gap: 5px;
  width: 100%;
}

.variable-editor__control .el-text-field--textarea {
  width: 100%;
  resize: vertical;
}

.variable-editor__enabled {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  cursor: pointer;
}
</style>