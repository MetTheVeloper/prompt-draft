<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type {
  ModuleValues,
  PromptKeyModule,
} from "~/modules/types";
import type { ModuleOutputValue } from "~/utils/compilePrompt";
import type { PromptValidationIssue } from "~/utils/promptValidation";
import {
  compileSceneModule,
  type SceneCompileIssue,
} from "~/utils/compileScene";
import ModulesPanelBase from "./base.vue";

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
    modelValue: () => ({}),
    modules: () => [],
    moduleValues: () => ({}),
    previewOutput: "",
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleValues): void;
  (event: "update:panelState", value: ModulePanelState): void;
  (event: "update:output", value: ModuleOutputValue): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
  (event: "remove", moduleKey: string): void;
}>();

const baseIssues = ref<PromptValidationIssue[]>([]);

const layoutActive = computed(() => {
  return props.modules.some((module) => module.key === "layout");
});

const compileResult = computed(() => {
  return compileSceneModule(props.modelValue || {}, {
    modules: props.modules,
    moduleValues: {
      ...props.moduleValues,
      scene: props.modelValue || {},
    },
    layoutActive: layoutActive.value,
  });
});

const output = computed(() => compileResult.value.output);
const displayPreview = computed(() => props.previewOutput || output.value);

function mapCompileIssue(issue: SceneCompileIssue): PromptValidationIssue {
  const code =
    issue.kind === "component_cardinality"
      ? "scene_component_cardinality_conflict"
      : "scene_missing_component_reference";

  return {
    id: issue.id,
    code,
    level: "warning",
    moduleKey: "scene",
    moduleLabel: "Scenes",
  };
}

const sceneIssues = computed<PromptValidationIssue[]>(() => {
  return compileResult.value.issues.map(mapCompileIssue);
});

watch(
  output,
  (value) => emit("update:output", value),
  { immediate: true },
);

watch(
  [baseIssues, sceneIssues],
  () => {
    emit("update:issues", [...baseIssues.value, ...sceneIssues.value]);
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <ModulesPanelBase
    :module="module"
    :model-value="modelValue"
    :panel-state="panelState"
    :aspect-ratio="aspectRatio"
    :preview-output="displayPreview"
    :modules="modules"
    :module-values="moduleValues"
    @update:model-value="emit('update:modelValue', $event)"
    @update:panel-state="emit('update:panelState', $event)"
    @update:issues="baseIssues = $event"
    @remove="emit('remove', $event)"
  />
</template>
