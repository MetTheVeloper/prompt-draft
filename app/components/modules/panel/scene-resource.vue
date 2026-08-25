<script setup lang="ts">
import { computed, watch } from "vue";
import type { ModuleFieldValue, ModuleValues, PromptKeyModule } from "~/modules/types";
import type { ModuleOutputValue } from "~/utils/compilePrompt";
import type { PromptValidationIssue } from "~/utils/promptValidation";
import type { ModuleEntityPayload } from "~/modules/entityContracts";
import {
  getGlobalModuleValues,
  getModuleEntities,
  getModuleEntityConfig,
  getModuleEntityTargetPolicy,
  setModuleEntities,
} from "~/modules/entityContracts";
import { getSceneEntities } from "~/utils/scene";
import { compileSceneResourceModule } from "~/utils/compileSceneResource";
import ModulesPanelBase from "./base.vue";
import ModuleEntitiesField from "../shared/ModuleEntitiesField.vue";
import ModuleEntitiesPanelShell from "../shared/ModuleEntitiesPanelShell.vue";

type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

const props = withDefaults(
  defineProps<{
    module: PromptKeyModule;
    modelValue?: ModuleValues;
    panelState?: ModulePanelState;
    aspectRatio?: string;
    previewOutput?: string;
    modules?: PromptKeyModule[];
    moduleValues?: Record<string, ModuleValues>;
  }>(),
  {
    modules: () => [],
    moduleValues: () => ({}),
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleValues): void;
  (event: "update:panelState", value: ModulePanelState): void;
  (event: "update:output", value: ModuleOutputValue): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
  (event: "remove", moduleKey: string): void;
}>();

const values = computed<ModuleValues>(() => props.modelValue || {});
const globalValues = computed(() => getGlobalModuleValues(values.value));
const entities = computed(() => getModuleEntities<ModuleEntityPayload>(values.value));
const entityConfig = computed(() => getModuleEntityConfig(props.module));
const targetPolicy = computed(() => getModuleEntityTargetPolicy(props.module));
const customMode = computed(() => Boolean(props.panelState?.isCustomMode));
const allowPresets = computed(() => Object.keys(props.module.presets || {}).length > 0);
const allowGlobalInheritanceToggle = computed(
  () => entityConfig.value?.allowGlobalInheritanceToggle === true,
);
const preserveEntitiesInCustomMode = computed(
  () => entityConfig.value?.preserveEntitiesInCustomMode === true,
);

function persistedFieldValues(fieldId: string): ModuleFieldValue[] {
  return [
    globalValues.value[fieldId],
    ...entities.value.map((entity) => entity.payload[fieldId]),
  ];
}

/**
 * Categorized freeform dropdowns persist the authored text itself rather than
 * the synthetic `Custom` option. Re-introduce those persisted strings as
 * temporary known options for the editor so their category can be reconstructed
 * after reload. Compilation/persistence still use the original raw string.
 */
const editorModule = computed<PromptKeyModule>(() => {
  const fields = Object.fromEntries(
    Object.entries(props.module.fields).map(([fieldId, field]) => {
      if (
        field.type !== "select" ||
        field.ui?.optionLayout !== "categorized" ||
        !field.options?.some((option) => option.freeform)
      ) {
        return [fieldId, field];
      }

      const options = field.options || [];
      const freeformOption = options.find((option) => option.freeform);
      if (!freeformOption) return [fieldId, field];

      const knownValues = new Set(options.map((option) => option.value));
      const persistedCustomValues = Array.from(
        new Set(
          persistedFieldValues(fieldId)
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter((value) => value && !knownValues.has(value)),
        ),
      );

      if (!persistedCustomValues.length) return [fieldId, field];

      return [
        fieldId,
        {
          ...field,
          options: [
            ...options,
            ...persistedCustomValues.map((value) => ({
              ...freeformOption,
              value,
              promptText: value,
              freeform: false,
            })),
          ],
        },
      ];
    }),
  ) as PromptKeyModule["fields"];

  return {
    ...props.module,
    fields,
  };
});

const referencedEntityIds = computed(() => {
  const sceneActive = props.modules.some((module) => module.key === "scene");
  const layoutActive = props.modules.some((module) => module.key === "layout");
  if (!sceneActive || !layoutActive) return [];

  const seen = new Set<string>();

  return getSceneEntities(props.moduleValues.scene || {})
    .filter((scene) => scene.enabled !== false)
    .flatMap((scene) => scene.components)
    .filter((ref) => ref.moduleKey === props.module.key)
    .map((ref) => ref.entityId)
    .filter((entityId) => {
      if (!entityId || seen.has(entityId)) return false;
      seen.add(entityId);
      return true;
    });
});

const output = computed(() => {
  return compileSceneResourceModule(props.module, values.value, {
    customMode: customMode.value,
    referencedEntityIds: referencedEntityIds.value,
    preserveEntitiesInCustomMode: preserveEntitiesInCustomMode.value,
  });
});

const displayPreview = computed(() => props.previewOutput || output.value);

watch(
  output,
  (value) => emit("update:output", value),
  { immediate: true },
);

function updateBaseValues(nextValues: ModuleValues) {
  emit("update:modelValue", nextValues);
}

function updateEntities(nextEntities: typeof entities.value) {
  emit("update:modelValue", setModuleEntities(values.value, nextEntities));
}

const { openModuleEntitiesModal } = useModuleEntitiesModal({
  module: () => props.module,
  component: ModuleEntitiesField,
  getProps: () => ({
    module: editorModule.value,
    globalValues: globalValues.value,
    modelValue: entities.value,
    targetPolicy: targetPolicy.value,
    allowPresets: allowPresets.value,
    allowGlobalInheritanceToggle: allowGlobalInheritanceToggle.value,
  }),
  onUpdate: updateEntities,
});
</script>

<template>
  <ModuleEntitiesPanelShell
    :count="entities.length"
    @open="openModuleEntitiesModal"
  >
    <ModulesPanelBase
      :module="editorModule"
      :model-value="modelValue"
      :panel-state="panelState"
      :aspect-ratio="aspectRatio"
      :preview-output="displayPreview"
      @update:model-value="updateBaseValues"
      @update:panel-state="emit('update:panelState', $event)"
      @update:issues="emit('update:issues', $event)"
      @remove="emit('remove', $event)"
    />
  </ModuleEntitiesPanelShell>
</template>
