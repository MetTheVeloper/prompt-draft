<script setup lang="ts">
import { computed, watch } from "vue";
import type {
  ModuleValues,
  PromptKeyModule,
} from "~/modules/types";
import type { ModuleOutputValue } from "~/utils/compilePrompt";
import type { PromptValidationIssue } from "~/utils/promptValidation";
import type { ModuleEntityPayload } from "~/modules/entityContracts";
import {
  getGlobalModuleValues,
  getModuleEntities,
  getModuleEntityTargetPolicy,
  setModuleEntities,
} from "~/modules/entityContracts";
import { getSceneEntities } from "~/utils/scene";
import { compileCameraModule } from "~/utils/compileCamera";
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
const targetPolicy = computed(() => getModuleEntityTargetPolicy(props.module));
const customMode = computed(() => Boolean(props.panelState?.isCustomMode));

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
  return compileCameraModule(props.module, values.value, {
    customMode: customMode.value,
    referencedEntityIds: referencedEntityIds.value,
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
  emit(
    "update:modelValue",
    setModuleEntities(values.value, nextEntities),
  );
}

const { openModuleEntitiesModal } = useModuleEntitiesModal({
  module: () => props.module,
  component: ModuleEntitiesField,
  getProps: () => ({
    module: props.module,
    globalValues: globalValues.value,
    modelValue: entities.value,
    targetPolicy: targetPolicy.value,
    allowPresets: true,
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
      :module="module"
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
