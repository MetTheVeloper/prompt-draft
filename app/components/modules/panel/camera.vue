<script setup lang="ts">
import { computed } from "vue";
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
import ModulesPanelBase from "./base.vue";
import ModuleEntitiesField from "../shared/ModuleEntitiesField.vue";

type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

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
  (event: "remove", moduleKey: string): void;
}>();

const values = computed<ModuleValues>(() => props.modelValue || {});
const globalValues = computed(() => getGlobalModuleValues(values.value));
const entities = computed(() => getModuleEntities<ModuleEntityPayload>(values.value));
const targetPolicy = computed(() => getModuleEntityTargetPolicy(props.module));
const customMode = computed(() => Boolean(props.panelState?.isCustomMode));

function updateBaseValues(nextValues: ModuleValues) {
  emit("update:modelValue", nextValues);
}

function updateEntities(nextEntities: typeof entities.value) {
  emit(
    "update:modelValue",
    setModuleEntities(values.value, nextEntities),
  );
}
</script>

<template>
  <el-flex rules="ccs" class="w100" :gap="12">
    <ModulesPanelBase
      :module="module"
      :model-value="modelValue"
      :panel-state="panelState"
      :aspect-ratio="aspectRatio"
      :preview-output="previewOutput"
      @update:model-value="updateBaseValues"
      @update:panel-state="emit('update:panelState', $event)"
      @update:output="emit('update:output', $event)"
      @update:issues="emit('update:issues', $event)"
      @remove="emit('remove', $event)"
    />

    <ModuleEntitiesField
      v-show="!customMode"
      :module="module"
      :global-values="globalValues"
      :model-value="entities"
      :target-policy="targetPolicy"
      @update:model-value="updateEntities"
    />
  </el-flex>
</template>
