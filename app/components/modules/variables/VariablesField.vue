<script setup lang="ts">
import { computed, inject, watch } from "vue";
import type { ElDropdownValue } from "~/types/dropdown";

import type {
  ModuleField,
  ModuleFieldOption,
  PromptVariable,
  PromptVariableType,
} from "../../../modules/types";
import { variableBlueprints } from "../../../modules/variables.blueprints";
import {
  createPromptVariable as createPromptVariableDomain,
  deletePromptVariable as deletePromptVariableDomain,
  duplicatePromptVariable as duplicatePromptVariableDomain,
  updatePromptVariable as updatePromptVariableDomain,
  type CreatePromptVariableInput,
  type UpdatePromptVariableInput,
  type UserPromptVariableType,
} from "../../../domain/variables";
import {
  createUniqueVariableKey,
  formatVariableToken,
  isReservedVariableKey,
  isValidVariableKey,
  normalizeVariableKey,
} from "../../../utils/promptVariables";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

type VariableEditorController = {
  submit: () => boolean;
};

type BlueprintEditorController = {
  submit: () => boolean;
};

type CreateVariablesContextAction = {
  id: number;
  action: "create" | null;
};

const CREATE_VARIABLES_CONTEXT_ACTION_KEY = "prompt-draft:create:variables-context-action";

import VariableEditorModal from "./VariableEditorModal.vue";
import VariableBlueprintModal from "./VariableBlueprintModal.vue";

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
const catalogI18n = useCatalogI18n("variables");
const { activeSystemVariableKeys } = usePromptVariables();
const createVariablesContextAction = inject<CreateVariablesContextAction | null>(
  CREATE_VARIABLES_CONTEXT_ACTION_KEY,
  null,
);

let lastHandledContextActionId = 0;

const variables = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

const variableCountLabel = computed(() => {
  return t("modules.variables.fields.variables.list.count", {
    count: variables.value.length,
  });
});

function blueprintLabel(id: string, fallback: string) {
  return catalogI18n.itemLabel("blueprints", id, fallback);
}

function blueprintDescription(id: string, fallback: string) {
  return catalogI18n.itemDescription("blueprints", id, fallback);
}

function blueprintCategoryLabel(category: string, fallback: string) {
  return catalogI18n.catalogText(`categories.${category}`, fallback);
}

const blueprintItems = computed(() => {
  return variableBlueprints.map((blueprint) => ({
    value: blueprint.id,
    label: blueprintLabel(blueprint.id, blueprint.label),
    description: blueprintDescription(blueprint.id, blueprint.description),
    icon: blueprint.icon,
    group: blueprint.category,
    groupLabel: blueprintCategoryLabel(blueprint.category, blueprint.categoryLabel),
  }));
});

function translate(path: string, fallback = "") {
  const translated = t(path);

  return translated === path ? fallback : translated;
}

function cloneVariable(variable: PromptVariable): PromptVariable {
  return {
    ...variable,
    id: variable.id || "",
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

function variableMutationOptions() {
  return {
    blockedKeys: activeSystemVariableKeys.value,
  };
}

function reportVariableMutationFailure(operation: string, issues: unknown) {
  console.error(`Variable ${operation} rejected by canonical domain service:`, issues);
}

function getExistingVariableKeys(exceptIndex?: number) {
  return variables.value
    .filter((_, index) => index !== exceptIndex)
    .map((variable) => normalizeVariableKey(variable.key))
    .filter(Boolean);
}

function getUnavailableVariableKeys() {
  return Array.from(new Set([
    ...getExistingVariableKeys(),
    ...activeSystemVariableKeys.value.map(normalizeVariableKey).filter(Boolean),
  ]));
}

function createVariableDraft(): PromptVariable {
  return {
    id: "",
    key: createUniqueVariableKey("variable", getExistingVariableKeys()),
    value: "",
    description: "",
    type: "text",
    enabled: true,
  };
}

function createInputFromVariable(
  variable: Omit<PromptVariable, "id"> | PromptVariable,
): CreatePromptVariableInput {
  return {
    key: variable.key || "",
    value: variable.value || "",
    description: variable.description || "",
    type: (variable.type || "text") as UserPromptVariableType,
    enabled: variable.enabled !== false,
    ...(variable.source === "user" ? { source: "user" as const } : {}),
  };
}

function updateInputFromVariable(variable: PromptVariable): UpdatePromptVariableInput {
  return {
    key: variable.key || "",
    value: variable.value || "",
    description: variable.description || "",
    type: (variable.type || "text") as UserPromptVariableType,
    enabled: variable.enabled !== false,
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
    { value: "font" },
    { value: "custom" },
  ];
}

function variableTypeLabel(optionValue: string) {
  return translate(
    `modules.${props.moduleKey}.fields.${props.field.id}.types.${optionValue}`,
    optionValue
  );
}

function getBlueprintTypeOptions() {
  return getVariableTypeOptions().map((option) => ({
    value: option.value as PromptVariableType,
    label: variableTypeLabel(option.value),
  }));
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
    : createVariableDraft();

  if (!sourceVariable) return;

  const variable = cloneVariable(sourceVariable);
  const token = getVariableToken(variable);

  const editorController: VariableEditorController = {
    submit: () => false,
  };

  modal.open({
    header: {
      icon: isEdit ? "edit" : "add_circle",
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
          if (!sourceVariable.id) {
            reportVariableMutationFailure("update", [{ code: "variable_not_found" }]);
            return;
          }

          const result = updatePromptVariableDomain(
            variables.value,
            sourceVariable.id,
            updateInputFromVariable(savedVariable),
            variableMutationOptions(),
          );

          if (!result.ok) {
            reportVariableMutationFailure("update", result.issues);
            return;
          }

          updateVariables(result.value.variables);
          return;
        }

        const result = createPromptVariableDomain(
          variables.value,
          createInputFromVariable(savedVariable),
          variableMutationOptions(),
        );

        if (!result.ok) {
          reportVariableMutationFailure("create", result.issues);
          return;
        }

        updateVariables(result.value.variables);
      },
    },
    actions: [
      {
        label: t("modules.variables.fields.variables.actions.cancel"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: isEdit
          ? t("modules.variables.fields.variables.actions.save")
          : t("modules.variables.fields.variables.actions.create"),
        icon: isEdit ? "check_circle" : "add_circle",
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

function selectBlueprint(value: ElDropdownValue) {
  const blueprintId = String(value || "");
  const blueprint = variableBlueprints.find((candidate) => candidate.id === blueprintId);
  if (!blueprint) return;

  const controller: BlueprintEditorController = { submit: () => false };

  modal.open({
    header: {
      icon: blueprint.icon || "auto_awesome",
      title: blueprintLabel(blueprint.id, blueprint.label),
      subtitle: catalogI18n.uiText(
        "blueprints.configureSubtitle",
        "Configure the variables before adding them to the prompt graph.",
      ),
      color: "blue",
    },
    component: VariableBlueprintModal,
    props: {
      blueprint,
      existingKeys: getUnavailableVariableKeys(),
      typeOptions: getBlueprintTypeOptions(),
      controller,
      onApply: (createdVariables: Array<Omit<PromptVariable, "id">>) => {
        let nextVariables = variables.value;

        for (const variable of createdVariables) {
          const result = createPromptVariableDomain(
            nextVariables,
            createInputFromVariable(variable),
            variableMutationOptions(),
          );

          if (!result.ok) {
            reportVariableMutationFailure("blueprint create", result.issues);
            return;
          }

          nextVariables = result.value.variables;
        }

        updateVariables(nextVariables);
      },
    },
    actions: [
      {
        label: t("modules.variables.fields.variables.actions.cancel"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: catalogI18n.uiText("blueprints.createVariables", "Create variables"),
        icon: "auto_awesome",
        color: "prim",
        close: true,
        handler: () => controller.submit(),
      },
    ],
    options: {
      width: mobile.value ? "calc(100% - 24px)" : 860,
      closeOnBackdrop: true,
    },
  });
}

function removePromptVariable(variableIndex: number) {
  const sourceVariable = variables.value[variableIndex];
  if (!sourceVariable?.id) return;

  const result = deletePromptVariableDomain(
    variables.value,
    sourceVariable.id,
  );

  if (!result.ok) {
    reportVariableMutationFailure("delete", result.issues);
    return;
  }

  updateVariables(result.value.variables);
}

function duplicatePromptVariable(variableIndex: number) {
  const sourceVariable = variables.value[variableIndex];
  if (!sourceVariable?.id) return;

  const result = duplicatePromptVariableDomain(
    variables.value,
    sourceVariable.id,
    variableMutationOptions(),
  );

  if (!result.ok) {
    reportVariableMutationFailure("duplicate", result.issues);
    return;
  }

  updateVariables(result.value.variables);
}

function openDeleteConfirm(variable: PromptVariable, variableIndex: number) {
  const token = getVariableToken(variable);

  modal.open({
    header: {
      icon: "delete",
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
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: t("modules.variables.fields.variables.actions.confirmDelete"),
        icon: "delete",
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

watch(
  () => createVariablesContextAction?.id,
  (actionId) => {
    if (!actionId || actionId === lastHandledContextActionId) return;
    if (props.moduleKey !== "variables" || props.field.id !== "variables") return;

    lastHandledContextActionId = actionId;

    if (createVariablesContextAction?.action === "create") {
      openCreateModal();
      createVariablesContextAction.action = null;
    }
  },
  { immediate: true },
);
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

      <el-flex rules="rcc" :gap="8">
        <el-dropdown
          :model-value="''"
          :items="blueprintItems"
          item-value="value"
          item-label="label"
          item-description="description"
          item-icon="icon"
          item-group="group"
          item-group-label="groupLabel"
          :placeholder="catalogI18n.uiText('blueprints.placeholder', 'Blueprints')"
          @update:model-value="selectBlueprint"
        />
        <el-button
          :label="t('modules.variables.fields.variables.actions.add')"
          icon="add"
          color="prim"
          :size="12"
          :p="[8, 12]"
          :radius="10"
          @click="openCreateModal"
        />
      </el-flex>
    </el-flex>

    <div v-if="variables.length" class="variables-field__list">
      <modules-variables-variable-chip
        v-for="(variable, variableIndex) in variables"
        :key="variable.id || variableIndex"
        :variable="variable"
        :token="getVariableToken(variable)"
        :type-label="variableTypeLabel(variable.type || 'text')"
        :value-preview="getVariableValuePreview(variable)"
        :issue="getVariableKeyIssue(variable, variableIndex)"
        :disabled="variable.enabled === false"
        :disabled-label="t('modules.variables.fields.variables.list.disabled')"
        :delete-label="t('modules.variables.fields.variables.actions.delete')"
        :edit-label="t('modules.variables.fields.variables.actions.edit')"
        :duplicate-label="t('modules.variables.fields.variables.actions.duplicate')"
        @edit="openEditModal(variableIndex)"
        @delete="openDeleteConfirm(variable, variableIndex)"
        @duplicate="duplicatePromptVariable(variableIndex)"
      />
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