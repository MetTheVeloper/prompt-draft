<script setup lang="ts">
import { onBeforeUnmount, reactive, watch } from "vue";
import type { ModuleValues, PromptKeyModule } from "../../modules/types";
import { createDefaultModuleValues } from "../../utils/compileModules";
import type {
  ModuleOutputMap,
  ModuleOutputValue,
} from "../../utils/compilePrompt";
import type { PromptValidationIssue } from "../../utils/promptValidation";
import ModulesPanelBase from "../modules/panel/base.vue";
import ModulesPanelForm from "../modules/panel/form.vue";
import ModulesPanelCamera from "../modules/panel/camera.vue";
import ModulesPanelSceneResource from "../modules/panel/scene-resource.vue";
import ModulesPanelScene from "../modules/panel/scene.vue";
import ModulesPanelBackground from "../modules/panel/background-stable.vue";
import ModulesPanelEffects from "../modules/panel/effects.vue";
import ModulesPanelLighting from "../modules/panel/lighting.vue";
import ModulesPanelTexture from "../modules/panel/texture.vue";
import ModulesPanelSubjectAssignments from "../modules/panel/subject-assignments.vue";
import ModulesPanelHair from "../modules/panel/hair.vue";
import ModulesPanelOutfit from "../modules/panel/outfit.vue";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
import { usePromptOutputFormat } from "~/composables/usePromptOutputFormat";
import { buildModuleVariableGroups } from "~/utils/promptVariableCatalog";
import { formatModuleOutputPreview } from "~/utils/moduleOutputPreview";

const { t } = useI18n();
const { setModuleVariableGroups, clearModuleVariableGroups } = usePromptVariables();
const { outputFormat } = usePromptOutputFormat();

type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

const props = withDefaults(
  defineProps<{
    modules: PromptKeyModule[];
    moduleValues?: Record<string, ModuleValues>;
    modulePanelStates?: Record<string, ModulePanelState>;
    aspectRatio?: string;
  }>(),
  {
    moduleValues: () => ({}),
    modulePanelStates: () => ({}),
  }
);

const emit = defineEmits<{
  (event: "update:moduleValues", value: Record<string, ModuleValues>): void;
  (event: "update:modulePanelStates", value: Record<string, ModulePanelState>): void;
  (event: "update:outputs", value: ModuleOutputMap): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
}>();

const moduleOutputs = reactive<ModuleOutputMap>({});
const moduleIssues = reactive<Record<string, PromptValidationIssue[]>>({});

function emitOutputs() {
  emit("update:outputs", { ...moduleOutputs });
}

function emitIssues() {
  const issues = props.modules.flatMap((module) => {
    return moduleIssues[module.key] || [];
  });

  emit("update:issues", issues);
}

function updateModuleValues(moduleKey: string, values: ModuleValues) {
  emit("update:moduleValues", {
    ...props.moduleValues,
    [moduleKey]: values,
  });
}

function updateModulePanelState(moduleKey: string, state: ModulePanelState) {
  emit("update:modulePanelStates", {
    ...props.modulePanelStates,
    [moduleKey]: state,
  });
}

function updateModuleOutput(moduleKey: string, output: ModuleOutputValue) {
  moduleOutputs[moduleKey] = output;
  emitOutputs();
}

function updateModuleIssues(moduleKey: string, issues: PromptValidationIssue[]) {
  moduleIssues[moduleKey] = issues;
  emitIssues();
}

function getModulePanel(module: PromptKeyModule) {
  if (module.key === "scene") return ModulesPanelScene;
  if (module.key === "form") return ModulesPanelForm;
  if (module.key === "camera") return ModulesPanelCamera;
  if (module.key === "framing") return ModulesPanelSceneResource;
  if (module.key === "background") return ModulesPanelBackground;
  if (module.key === "effects") return ModulesPanelEffects;
  if (module.key === "lighting") return ModulesPanelLighting;
  if (module.key === "texture") return ModulesPanelTexture;
  if (module.key === "hair") return ModulesPanelHair;
  if (module.key === "outfit") return ModulesPanelOutfit;
  if (module.key === "pose" || module.key === "expression") {
    return ModulesPanelSubjectAssignments;
  }
  return ModulesPanelBase;
}

function getModulePreview(module: PromptKeyModule) {
  return formatModuleOutputPreview(
    module.key,
    moduleOutputs[module.key],
    outputFormat.value,
    moduleOutputs,
  );
}

function getModulePanelExtraProps(module: PromptKeyModule) {
  const extraProps: Record<string, unknown> = {
    previewOutput: getModulePreview(module),
  };

  if (
    module.key === "scene" ||
    module.key === "form" ||
    module.key === "camera" ||
    module.key === "framing"
  ) {
    extraProps.modules = props.modules;
    extraProps.moduleValues = props.moduleValues;
  }

  // Spread the reactive output map so Vue tracks its individual entries.
  // Hair and Outfit previews use this snapshot only to show selective local
  // aliases when another module targets one of their child entities.
  if (module.key === "outfit" || module.key === "hair") {
    extraProps.moduleOutputs = { ...moduleOutputs };
  }

  return extraProps;
}

watch(
  [
    () => props.modules,
    () => props.moduleValues,
    () => ({ ...moduleOutputs }),
  ],
  () => {
    setModuleVariableGroups(
      buildModuleVariableGroups(
        props.modules,
        props.moduleValues,
        moduleOutputs,
      ),
    );
  },
  {
    immediate: true,
    deep: true,
  },
);

onBeforeUnmount(() => {
  clearModuleVariableGroups();
});

watch(
  () => props.modules.map((module) => module.key),
  (activeModuleKeys) => {
    const nextModuleValues = { ...props.moduleValues };
    const nextPanelStates = { ...props.modulePanelStates };

    let hasModuleValuesChange = false;
    let hasPanelStateChange = false;

    props.modules.forEach((module) => {
      if (!nextModuleValues[module.key]) {
        nextModuleValues[module.key] = createDefaultModuleValues(module);
        hasModuleValuesChange = true;
      }

      if (!nextPanelStates[module.key]) {
        nextPanelStates[module.key] = {
          isCustomMode: false,
          activePresetId: null,
        };

        hasPanelStateChange = true;
      }
    });

    if (hasModuleValuesChange) {
      emit("update:moduleValues", nextModuleValues);
    }

    if (hasPanelStateChange) {
      emit("update:modulePanelStates", nextPanelStates);
    }

    Object.keys(moduleOutputs).forEach((moduleKey) => {
      if (!activeModuleKeys.includes(moduleKey)) {
        delete moduleOutputs[moduleKey];
      }
    });

    Object.keys(moduleIssues).forEach((moduleKey) => {
      if (!activeModuleKeys.includes(moduleKey)) {
        delete moduleIssues[moduleKey];
      }
    });

    emitOutputs();
    emitIssues();
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <section class="prompt-editor">
    <el-flex rules="csc" v-if="modules.length" class="w100" :gap="16">
      <component
        :is="getModulePanel(module)"
        v-for="module in modules"
        :key="module.key"
        v-bind="getModulePanelExtraProps(module)"
        :module="module"
        :model-value="moduleValues[module.key]"
        :panel-state="modulePanelStates[module.key]"
        :aspect-ratio="aspectRatio"
        @update:model-value="updateModuleValues(module.key, $event)"
        @update:panel-state="updateModulePanelState(module.key, $event)"
        @update:output="updateModuleOutput(module.key, $event)"
        @update:issues="updateModuleIssues(module.key, $event)"
      />
    </el-flex>

    <el-flex rules="ccc" v-else :p="32" :radius="24" :br="1" bt="d" bc="red25">
      <el-icon icon="remove" :size="80" color="red50" class="mb24" />

      <el-text type="h1" :size="20" :weight="800" color="normal" class="tc">
        {{ t("promptEditor.emptyTitle") }}
      </el-text>

      <el-text type="p" :size="16" :weight="400" class="tc">
        {{ t("promptEditor.emptyDescription") }}
      </el-text>
    </el-flex>
  </section>
</template>

<style scoped>
.prompt-editor {
  width: 100%;
}

.prompt-editor__modules {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
