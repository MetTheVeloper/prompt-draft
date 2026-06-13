<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";

import { promptModules } from "../modules/registry";
import type { ModuleValues } from "../modules/types";
import type {
  ModuleOutputMap,
  PromptOutputFormat,
  PromptSettings,
} from "../utils/compilePrompt";
import { compilePromptOutput, createDefaultPromptSettings } from "../utils/compilePrompt";
import type { PromptValidationIssue } from "../utils/promptValidation";
import { validatePromptSettings } from "../utils/promptValidation";
import PromptEditor from "../components/prompt/editor.vue";
import PromptOutputPreview from "../components/prompt/output-preview.vue";
import PromptSetupPanel from "../components/prompt/setup-panel.vue";
import { useAppStore } from "~/store/app";

const { t, locale } = useI18n();
const app = useAppStore();
type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

const DRAFT_STORAGE_KEY = "prompt-draft:create-editor:v1";

type PromptDraftSnapshot = {
  version: 1;
  selectedModuleKeys: string[];
  moduleValues: Record<string, ModuleValues>;
  modulePanelStates: Record<string, ModulePanelState>;
  promptSettings: PromptSettings;
  outputFormat: PromptOutputFormat;
  updatedAt: string;
};

// const selectedModuleKeys = ref<string[]>(promptModules.map((module) => module.key));
const selectedModuleKeys = ref<string[]>([]);
const moduleValues = ref<Record<string, ModuleValues>>({});
const modulePanelStates = ref<Record<string, ModulePanelState>>({});

const promptSettings = ref<PromptSettings>(createDefaultPromptSettings());

const isDraftHydrated = ref(false);

type DraftSaveStatus = "idle" | "saving" | "saved";

const draftSaveStatus = ref<DraftSaveStatus>("idle");
const lastSavedAt = ref<string | null>(null);


const draftSaveLabel = computed(() => {
  if (!isDraftHydrated.value) {
    return t("create.draft.restoring");
  }

  if (draftSaveStatus.value === "saving") {
    return t("create.draft.saving");
  }

  if (lastSavedAt.value) {
    const time = new Date(lastSavedAt.value).toLocaleTimeString(
      locale.value === "fa" ? "fa-IR" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    return t("create.draft.savedAt", { time });
  }

  return t("create.draft.newDraft");
});

const moduleOutputs = ref<ModuleOutputMap>({});
const outputFormat = ref<PromptOutputFormat>("modular");
const moduleValidationIssues = ref<PromptValidationIssue[]>([]);

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function isValidOutputFormat(value: unknown): value is PromptOutputFormat {
  return value === "modular" || value === "natural" || value === "json";
}

function createDraftSnapshot(): PromptDraftSnapshot {
  return {
    version: 1,
    selectedModuleKeys: cloneJson(selectedModuleKeys.value),
    moduleValues: cloneJson(moduleValues.value),
    modulePanelStates: cloneJson(modulePanelStates.value),
    promptSettings: cloneJson(promptSettings.value),
    outputFormat: outputFormat.value,
    updatedAt: new Date().toISOString(),
  };
}

function saveDraft() {
  if (!import.meta.client) return;
  if (!isDraftHydrated.value) return;

  draftSaveStatus.value = "saving";

  const snapshot = createDraftSnapshot();

  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(snapshot));

  lastSavedAt.value = snapshot.updatedAt;
  draftSaveStatus.value = "saved";
}

const saveDraftDebounced = useDebounceFn(() => {
  saveDraft();
}, 350);

function restoreDraft() {
  if (!import.meta.client) return;

  const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);

  if (!rawDraft) {
    isDraftHydrated.value = true;
    return;
  }

  try {
    const parsed = JSON.parse(rawDraft) as Partial<PromptDraftSnapshot>;

    if (parsed.version !== 1) {
      isDraftHydrated.value = true;
      return;
    }

    const validModuleKeys = new Set(promptModules.map((module) => module.key));

    selectedModuleKeys.value = Array.isArray(parsed.selectedModuleKeys)
      ? parsed.selectedModuleKeys.filter((key) => validModuleKeys.has(key))
      : [];

    moduleValues.value = parsed.moduleValues || {};
    modulePanelStates.value = parsed.modulePanelStates || {};

    promptSettings.value = {
      ...createDefaultPromptSettings(),
      ...(parsed.promptSettings || {}),
    };

    outputFormat.value = isValidOutputFormat(parsed.outputFormat)
      ? parsed.outputFormat
      : "modular";

    lastSavedAt.value = parsed.updatedAt || null;
    draftSaveStatus.value = parsed.updatedAt ? "saved" : "idle";
  } catch {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } finally {
    isDraftHydrated.value = true;
  }
}

const selectedModules = computed(() => {
  return promptModules.filter((module) => {
    return selectedModuleKeys.value.includes(module.key);
  });
});

const globalValidationIssues = computed<PromptValidationIssue[]>(() => {
  const issues: PromptValidationIssue[] = [
    ...validatePromptSettings(promptSettings.value),
    ...moduleValidationIssues.value,
  ];

  if (!selectedModules.value.length) {
    issues.unshift({
      id: "global:no_modules_selected",
      code: "no_modules_selected",
      level: "error",
    });
  }

  return issues;
});

const globalOutput = computed(() => {
  return compilePromptOutput(
    selectedModules.value,
    moduleOutputs.value,
    promptSettings.value,
    outputFormat.value
  );
});

function updateModuleOutputs(outputs: ModuleOutputMap) {
  moduleOutputs.value = outputs;
}

function updateModuleIssues(issues: PromptValidationIssue[]) {
  moduleValidationIssues.value = issues;
}
const { mini, mobile } = useScreen();
const tabs = ref([
  {label: 'setup', icon: 'setting-2'},
  {label: 'editor', icon: 'edit'},
  {label: 'output', icon: 'note-text'},
]);
const tab = ref({label: 'setup', icon: 'settings'});

watch(
  [
    selectedModuleKeys,
    moduleValues,
    modulePanelStates,
    promptSettings,
    outputFormat,
  ],
  () => {
    if (!isDraftHydrated.value) return;

    draftSaveStatus.value = "saving";
    saveDraftDebounced();
  },
  {
    deep: true,
  }
);

function clearDraft() {
  const confirmed = window.confirm(t("create.draft.clearConfirm"));

  if (!confirmed) return;

  selectedModuleKeys.value = [];
  moduleValues.value = {};
  modulePanelStates.value = {};
  promptSettings.value = createDefaultPromptSettings();
  outputFormat.value = "modular";
  moduleOutputs.value = {};
  moduleValidationIssues.value = [];

  lastSavedAt.value = null;
  draftSaveStatus.value = "idle";

  if (import.meta.client) {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }
}

onMounted(() => {
  restoreDraft();

  window.addEventListener("beforeunload", saveDraft);
});

onBeforeUnmount(() => {
  saveDraft();

  window.removeEventListener("beforeunload", saveDraft);
});

</script>

<template>
  <el-grid rules="csc" class="w100 por" :gap="24" style="max-width: 1400px" v-if="app.ready">
    <el-flex :rules="mini ? 'ccs' : 'rbc'" :gap="16" class="w100">
      <el-flex rules="ccs" :gap="0" class="w100">
        <el-text type="span" :size="14" :weight="400">
          {{ t("create.eyebrow") }}
        </el-text>
        <el-text type="h1" :size="mini ? 24 : 40" :weight="800" icon="recovery-convert" icon-color="background"
          marker="normal50" color="background">
          {{ t("create.title") }}
        </el-text>
        <el-text type="p" :size="mini ? 12 : 16" :weight="400" color="normal45">
          {{ t("create.description") }}
        </el-text>
      </el-flex>
      <!-- <el-button to="/" :size="14" mode="flat" type="fab" :label="t('create.backHome')" icon="home" /> -->
      <!-- actions -->
      <el-flex rules="rsc" :gap="12" :class="mini ? 'w100' : ''">
        <el-text type="span" :size="12" color="normal50" class="wsnw" >
          {{ draftSaveLabel }}
        </el-text>
        <el-button @click="clearDraft" :size="14" :p="mini ? 8 : [8, 12]" :type="mini ? 'fab' : 'normal'" mode="outline" color="red" :label="t('create.draft.clear')" icon="trash" />
      </el-flex>
    </el-flex>
    <el-divider :dash="4" :gap="4" mode="dashed" />
    <el-grid :cols="3" v-if="mini" class="post t0 l0 r0 zi200" bg="surface50" :br="1"
      :bc="['normal5', 'normal15', 'normal15', 'normal5']" bd="b4" :radius="24" :p="8">
      <el-button v-for="tb in tabs"
        :key="tb.label"
        @click="tab = tb"
        :label="$t(`create.tabs.${tb.label}`)"
        :size="12"
        :br="1"
        bc="normal25"
        :gap="4"
        :icon="tb.icon"
        :mode="tb.label === tab.label ? 'normal' : 'outline'"
        :color="tb.label === tab.label ? 'prim' : 'normal'" />
    </el-grid>
    <el-grid :cols="!mini ? ['300px', 'minmax(0, 1fr)', '340px'] : 1" class="create-page__layout" :gap="16">
      <el-flex type="aside" rules="csc" class="create-page__sidebar" v-if="!mini || mini && tab.label === 'setup'">
        <PromptSetupPanel v-model:settings="promptSettings" v-model:selected-module-keys="selectedModuleKeys"
          :modules="promptModules" />
      </el-flex>

      <el-flex type="section" class="w100" v-if="!mini || mini && tab.label === 'editor'">
        <PromptEditor :modules="selectedModules" v-model:module-values="moduleValues"
          v-model:module-panel-states="modulePanelStates" @update:outputs="updateModuleOutputs"
          @update:issues="updateModuleIssues" />
      </el-flex>

      <el-flex type="aside" class="create-page__output post t0" v-if="!mini || mini && tab.label === 'output'">
        <PromptOutputPreview v-model:format="outputFormat" :output="globalOutput" :issues="globalValidationIssues" />
      </el-flex>
    </el-grid>
  </el-grid>
</template>

<style scoped>
@media (max-width: 1180px) {
  .create-page__layout {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .create-page__output {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .create-page__header {
    flex-direction: column;
  }

  .create-page__layout {
    grid-template-columns: 1fr;
  }
}
</style>
