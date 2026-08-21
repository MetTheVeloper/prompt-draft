<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import type { ModuleValues, PromptKeyModule } from "~/modules/types";
import type { HairStyle } from "~/modules/hair.types";
import type {
  ModuleOutputMap,
  ModuleOutputValue,
} from "~/utils/compilePrompt";
import type { PromptValidationIssue } from "~/utils/promptValidation";
import { createDefaultModuleValues } from "~/utils/compileModules";
import {
  compileHairModule,
  formatHairOutputForReferences,
} from "~/utils/compileHair";
import HairStylesField from "../hair/HairStylesField.vue";

const { t } = useI18n();
const { mobile, mini } = useScreen();

const props = defineProps<{
  module: PromptKeyModule;
  modelValue?: ModuleValues;
  panelState?: { isCustomMode?: boolean; activePresetId?: string | null };
  moduleOutputs?: ModuleOutputMap;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: ModuleValues): void;
  (event: "update:panelState", value: { isCustomMode?: boolean; activePresetId?: string | null }): void;
  (event: "update:output", value: ModuleOutputValue): void;
  (event: "update:issues", value: PromptValidationIssue[]): void;
}>();

const values = reactive<ModuleValues>({});
const syncingValues = ref(false);
const syncingPanel = ref(false);
const expanded = ref(false);
const customMode = ref(false);
const copied = ref(false);

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

function moduleOutputText(value: ModuleOutputValue) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

const moduleTitle = computed(() => translate("modules.hair.title", "Hair"));
const moduleDescription = computed(() =>
  translate(
    "modules.hair.description",
    "Build subject-scoped hairstyles from structural hair properties and optional components.",
  ),
);
const hairField = computed(() => props.module.fields.hairStyles);
const customField = computed(() => props.module.fields.customText);

function syncValues(source?: ModuleValues) {
  syncingValues.value = true;
  const defaults = createDefaultModuleValues(props.module);
  Object.keys(values).forEach((key) => delete values[key]);
  Object.assign(values, defaults, cloneValue(source || {}));
  nextTick(() => {
    syncingValues.value = false;
  });
}

watch(() => props.modelValue, syncValues, { immediate: true, deep: true });
watch(values, (next) => {
  if (!syncingValues.value) emit("update:modelValue", cloneValue(next));
}, { deep: true });

watch(() => props.panelState, (state) => {
  syncingPanel.value = true;
  customMode.value = Boolean(state?.isCustomMode);
  nextTick(() => {
    syncingPanel.value = false;
  });
}, { immediate: true, deep: true });

watch(customMode, () => {
  if (syncingPanel.value) return;
  emit("update:panelState", {
    isCustomMode: customMode.value,
    activePresetId: null,
  });
});

const hairStyles = computed<HairStyle[]>(() => {
  if (!Array.isArray(values.hairStyles)) return [];
  return cloneValue(values.hairStyles) as unknown as HairStyle[];
});

const customText = computed(() =>
  typeof values.customText === "string" ? values.customText.trim() : "",
);

const externalReferenceText = computed(() =>
  Object.entries(props.moduleOutputs || {})
    .filter(([moduleKey]) => moduleKey !== props.module.key)
    .map(([, value]) => moduleOutputText(value))
    .filter(Boolean)
    .join("\n"),
);

/** Keep graph output context-independent; only the displayed/final prompt uses aliases. */
const rawOutput = computed(() => {
  if (customMode.value) return customText.value;
  return compileHairModule(props.module, values);
});

const output = computed(() => {
  if (customMode.value || !rawOutput.value) return rawOutput.value;
  return formatHairOutputForReferences(
    String(rawOutput.value),
    externalReferenceText.value,
  );
});

watch(rawOutput, (value) => emit("update:output", value), { immediate: true });

const issues = computed<PromptValidationIssue[]>(() => {
  if (customMode.value && !customText.value) {
    return [{
      id: "hair:custom_override_empty",
      code: "custom_override_empty",
      level: "error",
      moduleKey: "hair",
      moduleLabel: moduleTitle.value,
    }];
  }
  return [];
});
watch(issues, (value) => emit("update:issues", value), { immediate: true });

const statusLabel = computed(() => {
  if (customMode.value) {
    return customText.value ? t("panel.statusCustom") : t("panel.statusCustomEmpty");
  }
  return hairStyles.value.length ? t("panel.statusPartiallyFilled") : t("panel.statusEmpty");
});

function clearModule() {
  const defaults = createDefaultModuleValues(props.module);
  Object.keys(defaults).forEach((key) => {
    values[key] = cloneValue(defaults[key]);
  });
  customMode.value = false;
}

function removeModule() {
  if (!import.meta.client) return;
  window.dispatchEvent(new CustomEvent("prompt-draft:remove-key-module", {
    detail: { moduleKey: props.module.key },
  }));
}

async function copyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(String(output.value));
    copied.value = true;
    window.setTimeout(() => { copied.value = false; }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}
</script>

<template>
  <el-grid
    type="section"
    :p="mobile ? 12 : mini ? 16 : 20"
    :br="2"
    :bc="!expanded ? 'normal10' : 'blue50'"
    :radius="mobile ? 16 : mini ? 24 : 32"
    bg="surface"
    class="w100"
  >
    <el-flex rules="ccs" class="w100" :gap="12">
      <el-flex :rules="mini ? 'ccs' : 'rbc'" class="w100" :gap="12">
        <el-flex rules="rcc" :gap="12">
          <el-text marker="blue5" color="blue" :size="12" :weight="700">{{ t("panel.keyModule") }}</el-text>
          <el-text marker="orange5" color="orange" :size="12" :weight="700">{{ statusLabel }}</el-text>
          <el-text :size="10" color="orange">{{ hairStyles.length }} {{ hairStyles.length === 1 ? 'style' : 'styles' }}</el-text>
        </el-flex>
        <el-flex rules="rcc" :gap="6">
          <el-switch :model-value="customMode" :size="12" :label="t('panel.customMode')" @update:model-value="customMode = $event" />
          <el-button type="fab" mode="flat" icon="refresh" :label="translate('components.contextMenu.actions.reset', 'Reset')" :size="12" :p="8" @click="clearModule" />
          <el-button type="fab" mode="flat" color="red" icon="delete" :label="t('components.contextMenu.actions.removeFromKeyModules')" :size="12" :p="8" @click="removeModule" />
          <el-button type="fab" mode="flat" color="prim" :size="14" :p="8" :label="!expanded ? t('panel.expand') : t('panel.collapse')" :icon="!expanded ? 'expand_more' : 'expand_less'" @click="expanded = !expanded" />
        </el-flex>
      </el-flex>

      <el-flex rules="ccs" class="w100 crp" :gap="4" @click="expanded = !expanded">
        <el-text type="h2" :size="24" :weight="800" class="lh1" effect="glitch" :icon="module.icon">{{ moduleTitle.toUpperCase() }}</el-text>
        <el-text type="p" :size="14" :weight="200" icon="info" color="normal60" icon-color="normal50">{{ moduleDescription }}</el-text>
      </el-flex>

      <el-divider mode="dashed" :dash="4" :gap="2" />
      <pre v-if="!expanded && output" class="fs12 txt-normal" style="white-space: pre-wrap; overflow-wrap: anywhere">{{ output }}</pre>
      <el-text v-else-if="!expanded" :size="12" color="red80">{{ t("panel.emptyOutput") }}</el-text>
    </el-flex>

    <el-grid v-show="expanded" :gap="12" class="w100">
      <el-grid v-if="!customMode && hairField" :p="12" :br="1" :radius="16" bc="blue35" class="w100">
        <el-flex rules="ccs" :gap="4">
          <el-text :size="14" :weight="600" icon="face_retouching_natural">Hairstyle Designer</el-text>
          <el-text :size="11" color="normal45">Build one or more subject-scoped hairstyles, then assign color and material externally when needed.</el-text>
        </el-flex>
        <HairStylesField :model-value="hairStyles" @update:model-value="values.hairStyles = $event" />
      </el-grid>

      <el-grid v-if="customMode && customField" :p="12" :br="1" :radius="16" :bc="customText ? 'blue35' : 'orange25'">
        <el-flex rules="ccs" :gap="4">
          <el-text :size="14" :weight="600" icon="edit">Custom Override</el-text>
          <el-text :size="11" color="normal45">Replace the structured Hairstyle Designer output with your own instruction.</el-text>
        </el-flex>
        <el-text-field v-model="values.customText" type="textarea" :rows="customField.ui?.rows || 4" support-variables placeholder="Describe the complete hairstyle instruction..." />
        <el-text v-if="!customText" :size="10" color="orange" icon="warning" icon-color="orange">{{ t("panel.customOverrideEmpty") }}</el-text>
      </el-grid>

      <el-grid :gap="16" :br="1" :p="16" :radius="16" :bc="output ? 'normal15' : 'orange25'" :bg="output ? 'normal5' : 'orange5'">
        <el-flex rules="rbc" class="w100">
          <el-text type="h3" :size="16" :weight="600" :color="output ? 'normal' : 'orange'" :icon="output ? 'task_alt' : 'error'">{{ t("panel.compiledOutput") }}</el-text>
          <el-button :label="copied ? t('panel.copied') : t('panel.copy')" :icon="copied ? 'check' : 'content_copy'" color="prim" :mode="copied ? 'flat' : 'normal'" :disable="!output" :size="12" :p="[8, 12]" @click="copyOutput" />
        </el-flex>
        <el-divider />
        <pre v-if="output" class="fs12 txt-normal" style="white-space: pre-wrap; overflow-wrap: anywhere">{{ output }}</pre>
        <el-text v-else :size="12" color="orange">{{ customMode ? t("panel.emptyCustomOutputDescription") : t("panel.emptyOutputDescription") }}</el-text>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
