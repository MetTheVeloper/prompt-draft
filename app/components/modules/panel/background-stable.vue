<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ModuleValues, PromptKeyModule } from "../../../modules/types";
import type { ModuleOutputValue } from "../../../utils/compilePrompt";
import type { PromptValidationIssue } from "../../../utils/promptValidation";
import type { ModuleEntityPayload } from "~/modules/entityContracts";
import {
  getGlobalModuleValues,
  getModuleEntities,
  getModuleEntityTargetPolicy,
  setModuleEntities,
} from "~/modules/entityContracts";
import { getSceneEntities } from "~/utils/scene";
import { compileBackgroundModule } from "~/utils/compileBackground";
import { compileSceneResourceModule } from "~/utils/compileSceneResource";
import BackgroundPanel from "./background.vue";
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

const globalValues = computed(() => getGlobalModuleValues(modelSnapshot.value));
const entities = computed(() =>
  getModuleEntities<ModuleEntityPayload>(modelSnapshot.value),
);
const targetPolicy = computed(() => getModuleEntityTargetPolicy(props.module));
const customMode = computed(() => Boolean(panelSnapshot.value?.isCustomMode));

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

const output = computed(() =>
  compileSceneResourceModule(props.module, modelSnapshot.value, {
    customMode: customMode.value,
    referencedEntityIds: referencedEntityIds.value,
    compileValues: compileBackgroundModule,
  }),
);

const displayPreview = computed(() => props.previewOutput || output.value);

watch(
  output,
  (value) => emit("update:output", value),
  { immediate: true },
);

function handleModelValue(value: ModuleValues) {
  const nextValue = cloneValue(value);
  modelSnapshot.value = nextValue;
  rememberPending(pendingModelEchoes, stateSignature(nextValue));
  emit("update:modelValue", nextValue);
}

function handlePanelState(value: ModulePanelState) {
  const nextValue = cloneValue(value);
  panelSnapshot.value = nextValue;
  rememberPending(pendingPanelEchoes, stateSignature(nextValue));
  emit("update:panelState", nextValue);
}

function updateEntities(nextEntities: typeof entities.value) {
  handleModelValue(setModuleEntities(modelSnapshot.value, nextEntities));
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
    allowGlobalInheritanceToggle: true,
  }),
  onUpdate: updateEntities,
});
</script>

<template>
  <ModuleEntitiesPanelShell
    :count="entities.length"
    @open="openModuleEntitiesModal"
  >
    <BackgroundPanel
      :module="module"
      :model-value="modelSnapshot"
      :panel-state="panelSnapshot"
      :aspect-ratio="aspectRatio"
      :preview-output="displayPreview"
      @update:model-value="handleModelValue"
      @update:panel-state="handlePanelState"
      @update:issues="emit('update:issues', $event)"
    />
  </ModuleEntitiesPanelShell>
</template>
