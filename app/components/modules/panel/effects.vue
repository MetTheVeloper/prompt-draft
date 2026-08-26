<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { EffectLayer, ModulePreset, ModuleValues, PromptKeyModule } from "../../../modules/types";
import type { ModuleOutputValue } from "../../../utils/compilePrompt";
import type { PromptValidationIssue } from "../../../utils/promptValidation";
import {
  createDefaultModuleValues,
  getModulePresetValues,
} from "../../../utils/compileModules";
import { compileEffectsModule } from "../../../utils/compileEffects";
import { useModulePanelContextMenu } from "~/composables/useModulePanelContextMenu";
import EffectLayersField from "../effects/EffectLayersField.vue";

const { t } = useI18n();
const { mobile, mini } = useScreen();

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

type ModulePanelState = {
  isCustomMode?: boolean;
  activePresetId?: string | null;
};

function cloneValue<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function normalizeForSignature(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForSignature);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, normalizeForSignature(item)]),
    );
  }
  return value;
}

function signature(value: unknown) {
  try {
    return JSON.stringify(normalizeForSignature(value));
  } catch {
    return String(value ?? "");
  }
}

function normalizeModel(value?: ModuleValues): ModuleValues {
  return {
    ...createDefaultModuleValues(props.module),
    ...cloneValue(value || {}),
  };
}

const modelSnapshot = ref<ModuleValues>(normalizeModel(props.modelValue));
const panelSnapshot = ref<ModulePanelState>(cloneValue(props.panelState || {}));
const pendingModelEchoes = new Set<string>();
const pendingPanelEchoes = new Set<string>();
const isPanelExpanded = ref(false);
const isAdvancedOpen = ref(false);
const isCopied = ref(false);

function rememberPending(set: Set<string>, value: string) {
  set.add(value);
  while (set.size > 32) {
    const oldest = set.values().next().value;
    if (!oldest) break;
    set.delete(oldest);
  }
}

watch(
  () => props.modelValue,
  (value) => {
    const next = normalizeModel(value);
    const nextSignature = signature(next);
    if (pendingModelEchoes.delete(nextSignature)) return;
    if (nextSignature === signature(modelSnapshot.value)) return;
    modelSnapshot.value = next;
  },
  { deep: true },
);

watch(
  () => props.panelState,
  (value) => {
    const next = cloneValue(value || {});
    const nextSignature = signature(next);
    if (pendingPanelEchoes.delete(nextSignature)) return;
    if (nextSignature === signature(panelSnapshot.value)) return;
    panelSnapshot.value = next;
  },
  { deep: true },
);

const values = computed(() => modelSnapshot.value);
const isCustomMode = computed(() => Boolean(panelSnapshot.value.isCustomMode));
const activePresetId = computed(() => panelSnapshot.value.activePresetId ?? null);
const moduleI18nBase = computed(() => `modules.${props.module.key}`);

function translate(path: string, fallback = "") {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

const moduleTitle = computed(() => translate(`${moduleI18nBase.value}.title`, "Effects"));
const moduleDescription = computed(() => translate(`${moduleI18nBase.value}.description`));

function fieldLabel(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.label`, fieldId);
}

function fieldDescription(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.description`);
}

function fieldPlaceholder(fieldId: string) {
  return translate(`${moduleI18nBase.value}.fields.${fieldId}.placeholder`);
}

function presetLabel(presetId: string) {
  return translate(`${moduleI18nBase.value}.presets.${presetId}.label`, presetId);
}

function presetDescription(presetId: string) {
  return translate(`${moduleI18nBase.value}.presets.${presetId}.description`);
}

const presets = computed<ModulePreset[]>(() =>
  Object.values(props.module.presets || {}).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
);

const presetItems = computed(() => [
  { value: "", label: t("panel.none") },
  ...presets.value.map((preset) => ({
    value: preset.id,
    label: presetLabel(preset.id),
    description: presetDescription(preset.id),
  })),
]);

const effectLayers = computed<EffectLayer[]>(() =>
  Array.isArray(values.value.effectLayers)
    ? (values.value.effectLayers as EffectLayer[])
    : [],
);

const customTextValue = computed(() =>
  typeof values.value.customText === "string" ? values.value.customText.trim() : "",
);

const { isCollapseLocked, togglePanel } = useModulePanelCollapseGuard({
  expanded: isPanelExpanded,
  isCustomMode: () => isCustomMode.value,
  getCustomValue: () => customTextValue.value,
});

function emitModel(nextValue: ModuleValues) {
  const next = normalizeModel(nextValue);
  modelSnapshot.value = next;
  rememberPending(pendingModelEchoes, signature(next));
  emit("update:modelValue", cloneValue(next));
}

function emitPanel(nextValue: ModulePanelState) {
  const next = cloneValue(nextValue);
  panelSnapshot.value = next;
  rememberPending(pendingPanelEchoes, signature(next));
  emit("update:panelState", next);
}

function setField(key: string, value: ModuleValues[string]) {
  const next = {
    ...values.value,
    [key]: cloneValue(value),
  };
  emitModel(next);

  if (activePresetId.value && !presetMatches(activePresetId.value, next)) {
    emitPanel({
      ...panelSnapshot.value,
      activePresetId: null,
    });
  }
}

function presetMatches(presetId: string, source: ModuleValues = values.value) {
  const presetValues = getModulePresetValues(props.module, presetId);
  return Object.entries(presetValues).every(
    ([key, value]) => signature(source[key]) === signature(value),
  );
}

function applyPreset(presetId: string) {
  const presetValues = getModulePresetValues(props.module, presetId);
  if (!Object.keys(presetValues).length) return;

  emitModel({
    ...values.value,
    ...cloneValue(presetValues),
  });
  emitPanel({
    isCustomMode: false,
    activePresetId: presetId,
  });
  isPanelExpanded.value = true;
}

function handlePresetSelect(value: unknown) {
  const presetId = String(value ?? "");
  if (!presetId) {
    emitPanel({
      ...panelSnapshot.value,
      activePresetId: null,
    });
    return;
  }
  applyPreset(presetId);
}

function toggleCustomMode(value: boolean) {
  emitPanel({
    ...panelSnapshot.value,
    isCustomMode: value,
  });
  if (value) isPanelExpanded.value = true;
}

function clearEffects() {
  emitModel(createDefaultModuleValues(props.module));
  emitPanel({
    isCustomMode: false,
    activePresetId: null,
  });
}

const effectiveValues = computed<ModuleValues>(() => ({
  ...values.value,
  customText: "",
}));

const output = computed(() =>
  isCustomMode.value
    ? customTextValue.value
    : compileEffectsModule(props.module, effectiveValues.value),
);

const displayOutput = computed(() => props.previewOutput || String(output.value || ""));

watch(
  output,
  (value) => emit("update:output", value),
  { immediate: true },
);

const validationIssues = computed<PromptValidationIssue[]>(() => {
  if (isCustomMode.value && !customTextValue.value) {
    return [
      {
        id: "effects:custom_override_empty",
        code: "custom_override_empty",
        level: "error",
        moduleKey: "effects",
        moduleLabel: moduleTitle.value,
      },
    ];
  }
  return [];
});

watch(
  validationIssues,
  (issues) => emit("update:issues", issues),
  { immediate: true },
);

const filledCount = computed(() => {
  let count = 0;
  if (effectLayers.value.length) count += 1;
  if (typeof values.value.extraDetails === "string" && values.value.extraDetails.trim()) count += 1;
  return count;
});

const hasAnyValue = computed(() => filledCount.value > 0 || Boolean(customTextValue.value));

const statusLabel = computed(() => {
  if (isCustomMode.value) {
    return customTextValue.value ? t("panel.statusCustom") : t("panel.statusCustomEmpty");
  }
  if (activePresetId.value) return t("panel.statusPreset");
  if (filledCount.value) return t("panel.statusPartiallyFilled");
  return t("panel.statusEmpty");
});

async function copyOutput() {
  if (!displayOutput.value) return;
  try {
    await navigator.clipboard.writeText(displayOutput.value);
    isCopied.value = true;
    window.setTimeout(() => {
      isCopied.value = false;
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
  }
}

function removeModule() {
  if (!import.meta.client) return;
  window.dispatchEvent(
    new CustomEvent("prompt-draft:remove-key-module", {
      detail: { moduleKey: props.module.key },
    }),
  );
}

const { openModulePanelContextMenu } = useModulePanelContextMenu({
  getTitle: () => moduleTitle.value,
  getExpanded: () => isPanelExpanded.value,
  onToggleExpand: togglePanel,
  canToggleExpand: () => !isCollapseLocked.value,
  getCustomMode: () => isCustomMode.value,
  onToggleCustomize: () => toggleCustomMode(!isCustomMode.value),
  canCopyOutput: () => Boolean(displayOutput.value),
  onCopyOutput: copyOutput,
  onRemove: removeModule,
});
</script>

<template>
  <el-grid
    type="section"
    :p="mobile ? 12 : mini ? 16 : 20"
    :br="2"
    :bc="!isPanelExpanded ? 'normal10' : 'blue50'"
    :radius="mobile ? 16 : mini ? 24 : 32"
    bg="surface"
    class="w100"
    @contextmenu="openModulePanelContextMenu"
  >
    <el-flex rules="csc" class="w100">
      <el-flex rules="ccs" class="w100">
        <el-flex :rules="mini ? 'ccs' : 'rbc'" class="w100" :gap="12">
          <el-flex rules="rcc" :gap="12">
            <el-text type="span" marker="blue5" color="blue" :size="12" :weight="700">
              {{ t("panel.keyModule") }}
            </el-text>
            <el-text type="span" marker="orange5" color="orange" :size="12" :weight="700">
              {{ statusLabel }}
            </el-text>
            <el-text type="span" :size="10" color="orange">
              {{ filledCount }} / 2 {{ t("panel.fieldsFilled") }}
            </el-text>
          </el-flex>

          <el-flex rules="rcc" :class="mini ? 'w100' : ''">
            <el-switch
              :class="mini ? 'fg100' : ''"
              :model-value="isCustomMode"
              :size="12"
              :label="t('panel.customMode')"
              @update:model-value="toggleCustomMode"
            />
            <el-button
              type="fab"
              :size="14"
              mode="flat"
              :p="8"
              icon="delete"
              :label="t('panel.clear')"
              :disable="!hasAnyValue"
              @click="clearEffects"
            />
            <el-button
              type="fab"
              :size="14"
              color="prim"
              :mode="isCopied ? 'flat' : 'normal'"
              :p="8"
              :icon="isCopied ? 'check' : 'content_copy'"
              :label="isCopied ? t('panel.copied') : t('panel.copy')"
              :disable="!displayOutput"
              @click="copyOutput"
            />
            <el-button
              type="fab"
              :size="14"
              mode="flat"
              color="prim"
              :p="8"
              :disable="isCollapseLocked"
              :icon="!isPanelExpanded ? 'expand_more' : 'expand_less'"
              :label="!isPanelExpanded ? t('panel.expand') : t('panel.collapse')"
              @click="togglePanel"
            />
          </el-flex>
        </el-flex>

        <el-flex rules="ccs" class="w100 crp" :gap="4" @click="togglePanel">
          <el-flex rules="rsc" :gap="8">
            <el-text type="h2" :size="24" :weight="800" class="lh1" effect="glitch" :icon="module.icon">
              {{ moduleTitle.toUpperCase() }}
            </el-text>
            <el-help v-if="moduleDescription" :text="moduleDescription" />
          </el-flex>
        </el-flex>

        <el-divider mode="dashed" :dash="4" :gap="2" class="mt12 mb12" />
        <modules-panel-module-output-text
          v-if="!isPanelExpanded && displayOutput"
          :value="displayOutput"
          :size="12"
          color="normal50"
        />
        <el-text v-else-if="!isPanelExpanded" type="span" :size="12" color="red80">
          {{ t("panel.emptyOutput") }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-grid v-show="isPanelExpanded" :gap="12" class="w100">
      <el-grid
        v-if="isCustomMode"
        rules="csc"
        :br="1"
        :p="16"
        :radius="16"
        :bc="!customTextValue ? 'orange25' : 'normal15'"
        :bg="!customTextValue ? 'orange5' : 'normal5'"
        :gap="12"
      >
        <el-flex rules="rsc" :gap="8">
          <el-text :size="16" :weight="600" icon="edit">{{ fieldLabel("customText") }}</el-text>
          <el-help v-if="fieldDescription('customText')" :text="fieldDescription('customText')" />
        </el-flex>
        <el-text-field
          :model-value="String(values.customText || '')"
          type="textarea"
          :rows="4"
          :placeholder="fieldPlaceholder('customText')"
          editor-id="effects:customText:override"
          support-variables
          @update:model-value="setField('customText', $event)"
        />
      </el-grid>

      <template v-else>
        <el-grid :p="12" :br="1" :radius="16" bc="blue50" :gap="12">
          <el-flex rules="rsc" :gap="8">
            <el-text :size="14" :weight="600" icon="layers">
              {{ translate(`${moduleI18nBase}.groups.core.title`, "Effect Stack") }}
            </el-text>
            <el-help
              v-if="translate(`${moduleI18nBase}.groups.core.description`)"
              :text="translate(`${moduleI18nBase}.groups.core.description`)"
            />
          </el-flex>

          <el-grid :br="1" :radius="12" bc="normal5" :p="12" :gap="10">
            <el-flex rules="rsc" :gap="8">
              <el-text :size="13" :weight="500" icon="widgets">{{ t("panel.presets") }}</el-text>
              <el-help :text="t('panel.presetsDescription')" />
            </el-flex>
            <el-dropdown
              :model-value="activePresetId || ''"
              :items="presetItems"
              item-label="label"
              item-value="value"
              :clearable="false"
              @update:model-value="handlePresetSelect"
            />
          </el-grid>

          <el-grid :br="1" :radius="12" bc="normal5" :p="12" :gap="12">
            <el-flex rules="rsc" :gap="8">
              <el-text :size="14" :weight="500" icon="auto_awesome">{{ fieldLabel("effectLayers") }}</el-text>
              <el-help v-if="fieldDescription('effectLayers')" :text="fieldDescription('effectLayers')" />
            </el-flex>
            <EffectLayersField
              v-if="module.fields.effectLayers"
              :field="module.fields.effectLayers"
              :model-value="effectLayers"
              @update:model-value="setField('effectLayers', $event)"
            />
          </el-grid>
        </el-grid>

        <el-grid :p="12" :br="1" :radius="16" :bc="isAdvancedOpen ? 'blue50' : 'normal10'" :gap="12">
          <el-flex rules="rbc" class="w100 crp" @click="isAdvancedOpen = !isAdvancedOpen">
            <el-flex rules="rsc" :gap="8">
              <el-text :size="14" :weight="600" :icon="isAdvancedOpen ? 'expand_less' : 'expand_more'">
                {{ translate(`${moduleI18nBase}.groups.advanced.title`, "Advanced") }}
              </el-text>
              <el-help
                v-if="translate(`${moduleI18nBase}.groups.advanced.description`)"
                :text="translate(`${moduleI18nBase}.groups.advanced.description`)"
              />
            </el-flex>
          </el-flex>

          <el-grid v-if="isAdvancedOpen" :br="1" :radius="12" bc="normal5" :p="12" :gap="10">
            <el-flex rules="rsc" :gap="8">
              <el-text :size="14" :weight="500" icon="notes">{{ fieldLabel("extraDetails") }}</el-text>
              <el-help v-if="fieldDescription('extraDetails')" :text="fieldDescription('extraDetails')" />
            </el-flex>
            <el-text-field
              :model-value="String(values.extraDetails || '')"
              type="textarea"
              :rows="3"
              :placeholder="fieldPlaceholder('extraDetails')"
              editor-id="effects:extraDetails"
              support-variables
              @update:model-value="setField('extraDetails', $event)"
            />
          </el-grid>
        </el-grid>
      </template>

      <el-grid
        rules="csc"
        :gap="16"
        :br="1"
        :p="16"
        :radius="16"
        :bc="!displayOutput ? 'orange25' : 'normal15'"
        :bg="!displayOutput ? 'orange5' : 'normal5'"
      >
        <el-flex rules="rbc" class="w100">
          <el-flex rules="rsc" :gap="16">
            <el-text
              :size="16"
              :weight="600"
              :color="!displayOutput ? 'orange' : 'normal'"
              :icon-color="!displayOutput ? 'orange' : 'normal'"
              :icon="!displayOutput ? 'error' : 'task_alt'"
            >
              {{ t("panel.compiledOutput") }}
            </el-text>
            <el-text marker="primary" color="white" :size="12" :weight="300">{{ moduleTitle }}</el-text>
          </el-flex>
          <el-button
            :label="isCopied ? t('panel.copied') : t('panel.copy')"
            :icon="isCopied ? 'check' : 'content_copy'"
            color="prim"
            :mode="isCopied ? 'flat' : 'normal'"
            :disable="!displayOutput"
            :size="12"
            :p="[8, 12]"
            @click="copyOutput"
          />
        </el-flex>
        <el-divider />
        <modules-panel-module-output-text
          v-if="displayOutput"
          :value="displayOutput"
          :size="14"
          color="normal85"
        />
        <el-flex v-else rules="ccs">
          <el-text :size="14" :weight="700">{{ t("panel.emptyOutputTitle") }}</el-text>
          <el-text :size="12" :weight="400">
            {{ isCustomMode ? t("panel.emptyCustomOutputDescription") : t("panel.emptyOutputDescription") }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-button
        mode="flat"
        color="red"
        icon="delete"
        :label="t('components.contextMenu.actions.removeFromKeyModules')"
        @click="removeModule"
      />
    </el-grid>
  </el-grid>
</template>