<script setup lang="ts">
import { reactive, watch } from "vue";
import type { ModuleValues, PromptKeyModule } from "../../modules/types";
import { createDefaultModuleValues } from "../../utils/compileModules";
import type { ModuleOutputMap } from "../../utils/compilePrompt";
import type { PromptValidationIssue } from "../../utils/promptValidation";
import ModulesPanelBase from "../modules/panel/base.vue";

const { t } = useI18n();

type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

const props = withDefaults(
  defineProps<{
    modules: PromptKeyModule[];
    moduleValues?: Record<string, ModuleValues>;
    modulePanelStates?: Record<string, ModulePanelState>;
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

function updateModuleOutput(moduleKey: string, output: string) {
  moduleOutputs[moduleKey] = output;
  emitOutputs();
}

function updateModuleIssues(moduleKey: string, issues: PromptValidationIssue[]) {
  moduleIssues[moduleKey] = issues;
  emitIssues();
}

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
      <ModulesPanelBase
        v-for="module in modules"
        :key="module.key"
        :module="module"
        :model-value="moduleValues[module.key]"
        :panel-state="modulePanelStates[module.key]"
        @update:model-value="updateModuleValues(module.key, $event)"
        @update:panel-state="updateModulePanelState(module.key, $event)"
        @update:output="updateModuleOutput(module.key, $event)"
        @update:issues="updateModuleIssues(module.key, $event)"
      />
    </el-flex>

    <el-flex rules="ccc" v-else :p="32" :radius="24" :br="1" bt="d" bc="red25">
      <el-icon icon="slash" :size="80" color="red50" class="mb24" />

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

.prompt-editor__empty {
  width: 100%;
  padding: 32px;
  border: 1px dashed rgba(0, 0, 0, 0.18);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.prompt-editor__empty h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.prompt-editor__empty p {
  margin: 0;
  font-size: 13px;
  opacity: 0.65;
}
</style>