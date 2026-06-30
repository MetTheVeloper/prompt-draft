<script setup lang="ts">
import { computed } from "vue";

import type {
  ModuleField,
  ModuleFieldOption,
  PromptVariable,
} from "../../../modules/types";

import {
  createUniqueVariableKey,
  formatVariableToken,
  isReservedVariableKey,
  isValidVariableKey,
  normalizeVariableKey,
} from "../../../utils/promptVariables";

type VariableEditorController = {
  submit: () => boolean;
};

import VariableEditorModal from "./VariableEditorModal.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: PromptVariable[];
    field: ModuleField;
    moduleKey: string;
  }>(),
  {
    modelValue: () => [],
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: PromptVariable[]): void;
}>();

const { t } = useI18n();
const { mobile } = useScreen();
const modal = useModal();

const variables = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

const variableCountLabel = computed(() => {
  return t("modules.variables.fields.variables.list.count", {
    count: variables.value.length,
  });
});

function translate(path: string, fallback = "") {
  const translated = t(path);

  return translated === path ? fallback : translated;
}

function createVariableId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `variable_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneVariable(variable: PromptVariable): PromptVariable {
  return {
    id: variable.id || createVariableId(),
    key: variable.key || "",
    value: variable.value || "",
    description: variable.description || "",
    type: variable.type || "text",
    enabled: variable.enabled !== false,
  };
}

function updateVariables(nextVariables: PromptVariable[]) {
  emit("update:modelValue", nextVariables);
}

function getExistingVariableKeys(exceptIndex?: number) {
  return variables.value
    .filter((_, index) => index !== exceptIndex)
    .map((variable) => normalizeVariableKey(variable.key))
    .filter(Boolean);
}

function createPromptVariable(baseKey = "variable"): PromptVariable {
  const key = createUniqueVariableKey(baseKey, getExistingVariableKeys());

  return {
    id: createVariableId(),
    key,
    value: "",
    description: "",
    type: "text",
    enabled: true,
  };
}

function getVariableTypeOptions() {
  const configuredOptions = props.field.config?.typeOptions;

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

function variableTypeLabel(optionValue: string) {
  return translate(
    `modules.${props.moduleKey}.fields.${props.field.id}.types.${optionValue}`,
    optionValue
  );
}

function getVariableToken(variable: PromptVariable) {
  return formatVariableToken(normalizeVariableKey(variable.key));
}

function getVariableValuePreview(variable: PromptVariable) {
  const value = String(variable.value || "").trim();

  return value || t("modules.variables.fields.variables.list.emptyValue");
}

function getVariableKeyIssue(variable: PromptVariable, variableIndex: number) {
  const key = normalizeVariableKey(variable.key);

  if (!isValidVariableKey(key)) {
    return t("modules.variables.fields.variables.validation.invalidKey");
  }

  if (isReservedVariableKey(key)) {
    return t("modules.variables.fields.variables.validation.reservedKey");
  }

  const duplicate = variables.value.some((item, index) => {
    if (index === variableIndex) return false;

    return normalizeVariableKey(item.key) === key;
  });

  if (duplicate) {
    return t("modules.variables.fields.variables.validation.duplicateKey");
  }

  return "";
}

function openCreateModal() {
  openVariableModal();
}

function openEditModal(variableIndex: number) {
  openVariableModal(variableIndex);
}

function openVariableModal(variableIndex?: number) {
  const isEdit = typeof variableIndex === "number";
  const sourceVariable = isEdit
    ? variables.value[variableIndex]
    : createPromptVariable();

  if (!sourceVariable) return;

  const variable = cloneVariable(sourceVariable);
  const token = getVariableToken(variable);

  const editorController: VariableEditorController = {
    submit: () => false,
  };

  modal.open({
    header: {
      icon: isEdit ? "edit-2" : "add-circle",
      title: isEdit
        ? t("modules.variables.fields.variables.modal.editTitle", { token })
        : t("modules.variables.fields.variables.modal.createTitle"),
      subtitle: t("modules.variables.fields.variables.modal.editorSubtitle"),
      color: "blue",
    },
    component: VariableEditorModal,
    props: {
      variable,
      field: props.field,
      moduleKey: props.moduleKey,
      typeOptions: getVariableTypeOptions(),
      existingKeys: getExistingVariableKeys(isEdit ? variableIndex : undefined),
      isEdit,
      controller: editorController,
      onSave: (savedVariable: PromptVariable) => {
        if (isEdit) {
          const nextVariables = variables.value.map((item, index) => {
            return index === variableIndex ? savedVariable : item;
          });

          updateVariables(nextVariables);
          return;
        }

        updateVariables([...variables.value, savedVariable]);
      },
    },
    actions: [
      {
        label: t("modules.variables.fields.variables.actions.cancel"),
        icon: "close-circle",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: isEdit
          ? t("modules.variables.fields.variables.actions.save")
          : t("modules.variables.fields.variables.actions.create"),
        icon: isEdit ? "tick-circle" : "add-circle",
        color: "prim",
        close: true,
        handler: () => {
          return editorController.submit();
        },
      },
    ],
    options: {
      width: mobile.value ? "calc(100% - 24px)" : 640,
      closeOnBackdrop: true,
    },
  });
}

function removePromptVariable(variableIndex: number) {
  const nextVariables = variables.value.filter((_, index) => {
    return index !== variableIndex;
  });

  updateVariables(nextVariables);
}

function duplicatePromptVariable(variableIndex: number) {
  const sourceVariable = variables.value[variableIndex];

  if (!sourceVariable) return;

  const baseKey = normalizeVariableKey(sourceVariable.key) || "variable";

  const duplicatedVariable: PromptVariable = {
    ...cloneVariable(sourceVariable),
    id: createVariableId(),
    key: createUniqueVariableKey(baseKey, getExistingVariableKeys()),
  };

  const nextVariables = [...variables.value];

  nextVariables.splice(variableIndex + 1, 0, duplicatedVariable);

  updateVariables(nextVariables);
}

function openDeleteConfirm(variable: PromptVariable, variableIndex: number) {
  const token = getVariableToken(variable);

  modal.open({
    header: {
      icon: "trash",
      title: t("modules.variables.fields.variables.modal.deleteTitle"),
      subtitle: token,
      color: "red",
    },
    descriptions: [
      t("modules.variables.fields.variables.modal.deleteDescription", {
        token,
      }),
      t("modules.variables.fields.variables.modal.deleteWarning", {
        token,
      }),
    ],
    actions: [
      {
        label: t("modules.variables.fields.variables.actions.cancel"),
        icon: "close-circle",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: t("modules.variables.fields.variables.actions.confirmDelete"),
        icon: "trash",
        color: "red",
        close: true,
        handler: () => {
          removePromptVariable(variableIndex);
        },
      },
    ],
    options: {
      width: 460,
    },
  });
}
</script>

<template>
  <div class="variables-field">
    <el-flex rules="rbc" class="w100 variables-field__head" :gap="12">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="12" :weight="700">
          {{ variableCountLabel }}
        </el-text>

        <el-text :size="10" color="normal45">
          {{ t("modules.variables.fields.variables.list.hint") }}
        </el-text>
      </el-flex>

      <el-button :label="t('modules.variables.fields.variables.actions.add')" icon="add" color="prim" :size="12"
        :p="[8, 12]" :radius="10" @click="openCreateModal" />
    </el-flex>

    <div v-if="variables.length" class="variables-field__list">
      <modules-variables-variable-chip v-for="(variable, variableIndex) in variables" :key="variable.id || variableIndex"
        :variable="variable" :token="getVariableToken(variable)"
        :type-label="variableTypeLabel(variable.type || 'text')" :value-preview="getVariableValuePreview(variable)"
        :issue="getVariableKeyIssue(variable, variableIndex)" :disabled="variable.enabled === false"
        :disabled-label="t('modules.variables.fields.variables.list.disabled')"
        :delete-label="t('modules.variables.fields.variables.actions.delete')"
        :edit-label="t('modules.variables.fields.variables.actions.edit')" @edit="openEditModal(variableIndex)"
        @delete="openDeleteConfirm(variable, variableIndex)"
        :duplicate-label="t('modules.variables.fields.variables.actions.duplicate')"
        @duplicate="duplicatePromptVariable(variableIndex)" />
    </div>

    <el-flex v-else rules="ccs" class="variables-field__empty" :gap="4" :p="14" :radius="14">
      <el-text :size="13" :weight="700" icon="box">
        {{ t("modules.variables.fields.variables.empty.title") }}
      </el-text>

      <el-text :size="11" color="normal55">
        {{ t("modules.variables.fields.variables.empty.description") }}
      </el-text>
    </el-flex>
  </div>
</template>

<style scoped>
.variables-field {
  display: grid;
  gap: 12px;
  width: 100%;
}

.variables-field__head {
  min-width: 0;
}

.variables-field__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.variables-field__empty {
  border: 1px dashed var(--normalText15);
  background: var(--normalText5);
}
</style>
