<script setup lang="ts">
import { ref, watch } from "vue";
import type { ModuleValues, PromptKeyModule } from "../../../modules/types";
import type { ModuleOutputValue } from "../../../utils/compilePrompt";
import type { PromptValidationIssue } from "../../../utils/promptValidation";
import BackgroundPanel from "./background.vue";

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
}>();

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function normalizeForSignature(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForSignature);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, normalizeForSignature(item)]),
    );
  }

  return value;
}

function stateSignature(value: unknown) {
  try {
    return JSON.stringify(normalizeForSignature(value));
  } catch {
    return String(value ?? "");
  }
}

function rememberPending(set: Set<string>, signature: string) {
  set.add(signature);

  while (set.size > 32) {
    const oldest = set.values().next().value;
    if (!oldest) break;
    set.delete(oldest);
  }
}

const modelSnapshot = ref<ModuleValues>(cloneValue(props.modelValue || {}));
const panelSnapshot = ref<ModulePanelState>(cloneValue(props.panelState || {}));

const pendingModelEchoes = new Set<string>();
const pendingPanelEchoes = new Set<string>();

watch(
  () => props.modelValue,
  (modelValue) => {
    const nextValue = cloneValue(modelValue || {});
    const signature = stateSignature(nextValue);

    if (pendingModelEchoes.delete(signature)) return;
    if (signature === stateSignature(modelSnapshot.value)) return;

    modelSnapshot.value = nextValue;
  },
  { deep: true },
);

watch(
  () => props.panelState,
  (panelState) => {
    const nextValue = cloneValue(panelState || {});
    const signature = stateSignature(nextValue);

    if (pendingPanelEchoes.delete(signature)) return;
    if (signature === stateSignature(panelSnapshot.value)) return;

    panelSnapshot.value = nextValue;
  },
  { deep: true },
);

function handleModelValue(value: ModuleValues) {
  const nextValue = cloneValue(value);
  rememberPending(pendingModelEchoes, stateSignature(nextValue));
  emit("update:modelValue", nextValue);
}

function handlePanelState(value: ModulePanelState) {
  const nextValue = cloneValue(value);
  rememberPending(pendingPanelEchoes, stateSignature(nextValue));
  emit("update:panelState", nextValue);
}
</script>

<template>
  <BackgroundPanel
    :module="module"
    :model-value="modelSnapshot"
    :panel-state="panelSnapshot"
    :aspect-ratio="aspectRatio"
    :preview-output="previewOutput"
    @update:model-value="handleModelValue"
    @update:panel-state="handlePanelState"
    @update:output="emit('update:output', $event)"
    @update:issues="emit('update:issues', $event)"
  />
</template>
