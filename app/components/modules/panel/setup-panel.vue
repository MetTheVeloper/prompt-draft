<script setup lang="ts">
import { computed, reactive } from "vue";
import type { GlobalMenuItem } from "~/composables/useMenu";
import type { ElDropdownValue } from "~/types/dropdown";
import type { PromptKeyModule } from "../../modules/types";
import type {
  ImageToImageSettings,
  PromptMode,
  PromptSettings,
  ReferenceSubjectType,
  ReferenceUsage,
  TransformationStrength,
} from "../../utils/compilePrompt";
import { buildPromptSubject, createDefaultPromptSettings } from "../../utils/compilePrompt";
import PromptModuleSelector from "./module-selector.vue";

import {
  ASPECT_RATIO_GROUPS,
  findAspectRatioGroupByOption,
  findAspectRatioOption,
  getDefaultAspectRatioValue,
  type AspectRatioCategoryId,
} from "../../constants/aspectRatios";

const { t } = useI18n();
const { mini } = useScreen();
const { openPageContextMenu } = usePageContextMenu();

function translate(path: string, fallback = "") {
  const translated = t(path);

  return translated === path ? fallback : translated;
}

function editorId(fieldKey: string) {
  return `setup:${fieldKey}`;
}

const props = defineProps<{
  modules: PromptKeyModule[];
  settings: PromptSettings;
  selectedModuleKeys: string[];
}>();

const emit = defineEmits<{
  (event: "update:settings", value: PromptSettings): void;
  (event: "update:selectedModuleKeys", value: string[]): void;
}>();

const promptModes: PromptMode[] = ["text_to_image", "image_to_image"];

const referenceSubjectTypes: ReferenceSubjectType[] = [
  "person",
  "object",
  "animal",
  "building",
  "product",
  "vehicle",
  "scene",
  "custom",
];

const referenceUsageOptions: ReferenceUsage[] = ["strict", "balanced", "loose"];

const activeAspectRatioGroup = computed(() => {
  return (
    findAspectRatioGroupByOption(props.settings.aspectRatio) ||
    ASPECT_RATIO_GROUPS[0]
  );
});

const activeAspectRatioCategory = computed(() => {
  return activeAspectRatioGroup.value?.id || "common";
});

const activeAspectRatioOptions = computed(() => {
  return activeAspectRatioGroup.value?.options || [];
});

const activeAspectRatioOption = computed(() => {
  return findAspectRatioOption(props.settings.aspectRatio);
});

function updateAspectRatioCategory(categoryId: AspectRatioCategoryId) {
  const group = ASPECT_RATIO_GROUPS.find((item) => item.id === categoryId);

  updateSettings({
    aspectRatio: group?.options[0]?.value || getDefaultAspectRatioValue(),
  });
}

function updateAspectRatioValue(value: string) {
  updateSettings({
    aspectRatio: value || getDefaultAspectRatioValue(),
  });
}

const transformationStrengthOptions: TransformationStrength[] = [
  "subtle",
  "balanced",
  "strong",
  "extreme",
];

const preserveOptions = computed(() => {
  return [
    {
      key: "preserveMainSubject",
      label: t("promptSetup.imageToImage.preserve.options.mainSubject"),
      visible: true,
    },
    {
      key: "preserveIdentity",
      label: t("promptSetup.imageToImage.preserve.options.identity"),
      visible: isPersonReference.value,
    },
    {
      key: "preservePose",
      label: t("promptSetup.imageToImage.preserve.options.pose"),
      visible: true,
    },
    {
      key: "preserveOutfit",
      label: t("promptSetup.imageToImage.preserve.options.outfit"),
      visible: isPersonReference.value,
    },
    {
      key: "preserveComposition",
      label: t("promptSetup.imageToImage.preserve.options.composition"),
      visible: true,
    },
    {
      key: "preserveColors",
      label: t("promptSetup.imageToImage.preserve.options.colors"),
      visible: true,
    },
    {
      key: "preserveMaterials",
      label: t("promptSetup.imageToImage.preserve.options.materials"),
      visible: true,
    },
    {
      key: "preserveLighting",
      label: t("promptSetup.imageToImage.preserve.options.lighting"),
      visible: true,
    },
  ] as const;
});

const generatedSubject = computed(() => {
  return buildPromptSubject(props.settings);
});

const coreFieldCount = computed(() => {
  return props.settings.mode === "text_to_image" ? 2 : 1;
});

const coreFilledFieldCount = computed(() => {
  const fields = [props.settings.idea];

  if (props.settings.mode === "text_to_image") {
    fields.push(props.settings.subject);
  }

  return fields.filter((value) => String(value || "").trim()).length;
});

function updateReferenceSubjectType(value: ElDropdownValue) {
  updateImageToImageSettings({
    referenceSubjectType: value as ReferenceSubjectType,
  });
}

function updateReferenceUsage(value: ElDropdownValue) {
  updateImageToImageSettings({
    referenceUsage: value as ReferenceUsage,
  });
}

function updateTransformationStrength(value: ElDropdownValue) {
  updateImageToImageSettings({
    transformationStrength: value as TransformationStrength,
  });
}

function updateAspectRatioCategoryValue(value: ElDropdownValue) {
  updateAspectRatioCategory(value as AspectRatioCategoryId);
}

function updateAspectRatioDropdownValue(value: ElDropdownValue) {
  updateAspectRatioValue(String(value || ""));
}

const isPersonReference = computed(() => {
  return props.settings.imageToImage.referenceSubjectType === "person";
});

function updateSettings(patch: Partial<PromptSettings>) {
  emit("update:settings", {
    ...props.settings,
    ...patch,
  });
}

function updateImageToImageSettings(patch: Partial<ImageToImageSettings>) {
  emit("update:settings", {
    ...props.settings,
    imageToImage: {
      ...props.settings.imageToImage,
      ...patch,
    },
  });
}

function updateSelectedModuleKeys(value: string[]) {
  emit("update:selectedModuleKeys", value);
}


function getCheckedValue(event: Event) {
  const target = event.target as HTMLInputElement | null;

  return Boolean(target?.checked);
}

function getPreserveValue(key: string) {
  return Boolean(props.settings.imageToImage[key as keyof ImageToImageSettings]);
}

function updatePreserveValue(key: string, value: boolean) {
  updateImageToImageSettings({
    [key]: value,
  } as Partial<ImageToImageSettings>);
}

type SetupPanelKey =
  | "modules"
  | "mode"
  | "core"
  | "imageReference"
  | "output";

const expandedPanels = reactive<Record<SetupPanelKey, boolean>>({
  modules: true,
  mode: false,
  core: false,
  imageReference: false,
  output: false,
});

const setupRootAttrs = {
  type: "section",
  p: [0],
  bg: "surface0",
  radius: 28,
  class: "w100 oh",
} as const;

const setupHeaderAttrs = {
  p: [20, 20, 16, 20],
  class: "w100",
} as const;

const setupPanelsWrapAttrs = {
  gap: 12,
} as const;

const setupPanelAttrs = {
  gap: 0,
  radius: 18,
  class: "w100",
  br: 2,
  bc: "normal10",
  bg: "surface",
} as const;

const setupPanelHeaderAttrs = {
  rules: "rbc",
  p: 16,
  gap: 8,
} as const;

const setupPanelBodyAttrs = {
  gap: 12,
  p: 14,
} as const;

const setupPanelIntroAttrs = {
  rules: "ccs",
  gap: 4,
} as const;

const setupFieldAttrs = {
  type: "label",
} as const;

const setupFieldHeadAttrs = {
  rules: "ccs",
  gap: 4,
  class: "mb8",
} as const;

function isPanelExpanded(panel: SetupPanelKey) {
  return expandedPanels[panel];
}

function togglePanel(panel: SetupPanelKey) {
  expandedPanels[panel] = !expandedPanels[panel];
}

function getPanelToggleSymbol(panel: SetupPanelKey) {
  return isPanelExpanded(panel) ? "minus" : "add";
}

function getSetupPanelTitle(panel: SetupPanelKey) {
  const titles: Record<SetupPanelKey, string> = {
    modules: t("create.modulesTitle"),
    mode: t("promptSetup.mode.title"),
    core: t("promptSetup.core.title"),
    imageReference: t("promptSetup.imageToImage.title"),
    output: t("promptSetup.output.title"),
  };

  return titles[panel];
}

function resetSetupPanel(panel: SetupPanelKey) {
  const defaults = createDefaultPromptSettings();

  if (panel === "modules") {
    updateSelectedModuleKeys([]);
    return;
  }

  if (panel === "mode") {
    updateSettings({
      mode: defaults.mode,
    });
    return;
  }

  if (panel === "core") {
    updateSettings({
      idea: defaults.idea,
      subject: defaults.subject,
    });
    return;
  }

  if (panel === "imageReference") {
    updateSettings({
      imageToImage: JSON.parse(JSON.stringify(defaults.imageToImage)),
    });
    return;
  }

  updateSettings({
    aspectRatio: defaults.aspectRatio,
    globalRules: defaults.globalRules,
  });
}

function getSetupPanelContextMenuItems(panel: SetupPanelKey): GlobalMenuItem[] {
  const expanded = isPanelExpanded(panel);

  return [
    {
      type: "header",
      label: getSetupPanelTitle(panel),
    },
    {
      label: expanded
        ? translate("components.contextMenu.actions.collapse", "Collapse")
        : translate("components.contextMenu.actions.expand", "Expand"),
      icon: expanded ? "minus" : "add",
      handler: () => togglePanel(panel),
    },
    {
      label: translate("components.contextMenu.actions.resetSettings", "Reset settings"),
      icon: "refresh",
      color: "orange",
      handler: () => resetSetupPanel(panel),
    },
  ];
}

function openSetupPanelContextMenu(event: MouseEvent, panel: SetupPanelKey) {
  openPageContextMenu(event, {
    items: getSetupPanelContextMenuItems(panel),
    minWidth: 190,
    maxWidth: 220,
    closeOnScroll: false,
    zIndex: 2300,
  });
}

</script>

<template>
  <el-grid v-bind="setupRootAttrs">
    <!-- Header -->
    <el-grid v-if="!mini" v-bind="setupHeaderAttrs">
      <el-text type="h2" :size="16" :weight="800" class="lh1">
        {{ t("promptSetup.title") }}
      </el-text>

      <el-text type="p" :size="12" :weight="300" color="normal60">
        {{ t("promptSetup.description") }}
      </el-text>
    </el-grid>

    <el-grid v-bind="setupPanelsWrapAttrs">
      <!-- Key Modules -->
      <el-grid class="setup-panel" v-bind="setupPanelAttrs" @contextmenu="openSetupPanelContextMenu($event, 'modules')">
        <el-flex
          v-bind="setupPanelHeaderAttrs"
          class="setup-panel__head crp"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('modules')"
          @click="togglePanel('modules')"
          @keydown.enter.prevent="togglePanel('modules')"
          @keydown.space.prevent="togglePanel('modules')"
        >
          <el-flex v-bind="setupPanelIntroAttrs">
            <el-text type="h3" :size="15" :weight="800" class="lh1" icon="element-4">
              {{ t("create.modulesTitle") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal55" v-if="isPanelExpanded('modules')">
              {{ t("create.modulesDescription") }}
            </el-text>
            <el-text
              v-if="!isPanelExpanded('modules')"
              :size="12"
              :weight="700"
              bg="blue"
              :p="[4, 8]"
              :radius="8"
              color="white"
            >
              {{ selectedModuleKeys.length }} / {{ modules.length }}
            </el-text>
          </el-flex>

          <el-flex rules="rce" :gap="8">
            <el-icon :icon="getPanelToggleSymbol('modules')" :size="20" color="normal55" />
          </el-flex>
        </el-flex>

        <el-grid v-show="isPanelExpanded('modules')" v-bind="setupPanelBodyAttrs">
          <PromptModuleSelector
            :modules="modules"
            :model-value="selectedModuleKeys"
            embedded
            hide-head
            @update:model-value="updateSelectedModuleKeys"
          />
        </el-grid>
      </el-grid>

      <!-- Prompt Type -->
      <el-grid class="setup-panel" v-bind="setupPanelAttrs" @contextmenu="openSetupPanelContextMenu($event, 'mode')">
        <el-flex
          v-bind="setupPanelHeaderAttrs"
          class="setup-panel__head crp"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('mode')"
          @click="togglePanel('mode')"
          @keydown.enter.prevent="togglePanel('mode')"
          @keydown.space.prevent="togglePanel('mode')"
        >
          <el-flex v-bind="setupPanelIntroAttrs">
            <el-text type="h3" :size="15" :weight="800" class="lh1" icon="category">
              {{ t("promptSetup.mode.title") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal55" v-if="isPanelExpanded('mode')">
              {{ t("promptSetup.mode.description") }}
            </el-text>
            <el-text
              v-if="!isPanelExpanded('mode')"
              :size="12"
              :weight="700"
              bg="blue"
              :p="[4, 8]"
              :radius="8"
              color="white"
            >
              {{ t(`promptSetup.mode.options.${settings.mode}.label`) }}
            </el-text>
          </el-flex>

          <el-flex rules="rce" :gap="8">
            <el-icon :icon="getPanelToggleSymbol('mode')" :size="20" color="normal55" />
          </el-flex>
        </el-flex>

        <el-grid v-show="isPanelExpanded('mode')" v-bind="setupPanelBodyAttrs">
          <el-grid :gap="8">
            <el-text type="label" v-for="mode in promptModes" :key="mode" class="crp db">
              <el-flex
                rules="rsc"
                :gap="10"
                :p="[14]"
                :br="1"
                :radius="16"
                :bc="settings.mode === mode ? 'blue45' : 'normal10'"
                :bg="settings.mode === mode ? 'blue5' : 'normal3'"
              >
                <input
                  type="radio"
                  name="prompt-mode"
                  :checked="settings.mode === mode"
                  @change="updateSettings({ mode })"
                />

                <el-flex rules="ccs" :gap="4">
                  <el-text :size="13" :weight="800" color="normal">
                    {{ t(`promptSetup.mode.options.${mode}.label`) }}
                  </el-text>

                  <el-text :size="11" :weight="300" color="normal55">
                    {{ t(`promptSetup.mode.options.${mode}.description`) }}
                  </el-text>
                </el-flex>
              </el-flex>
            </el-text>
          </el-grid>
        </el-grid>
      </el-grid>

      <!-- Core Context -->
      <el-grid class="setup-panel" v-bind="setupPanelAttrs" @contextmenu="openSetupPanelContextMenu($event, 'core')">
        <el-flex
          v-bind="setupPanelHeaderAttrs"
          class="setup-panel__head crp"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('core')"
          @click="togglePanel('core')"
          @keydown.enter.prevent="togglePanel('core')"
          @keydown.space.prevent="togglePanel('core')"
        >
          <el-flex v-bind="setupPanelIntroAttrs">
            <el-text type="h3" :size="15" :weight="800" class="lh1" icon="document-text">
              {{ t("promptSetup.core.title") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal55" v-if="isPanelExpanded('core')">
              {{ t("promptSetup.core.label") }}
            </el-text>
            <el-text
              v-if="!isPanelExpanded('core')"
              :size="12"
              :weight="700"
              bg="blue"
              :p="[4, 8]"
              :radius="8"
              color="white"
            >
              {{ coreFilledFieldCount }} / {{ coreFieldCount }}
            </el-text>
          </el-flex>

          <el-flex rules="rce" :gap="8">
            <el-icon :icon="getPanelToggleSymbol('core')" :size="20" color="normal55" />
          </el-flex>
        </el-flex>

        <el-grid v-show="isPanelExpanded('core')" v-bind="setupPanelBodyAttrs">
          <el-text v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.idea.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.idea.description") }}
              </el-text>
            </el-flex>

            <el-text-field
              :model-value="settings.idea"
              type="textarea"
              rows="4"
              :size="14"
              :placeholder="t('promptSetup.idea.placeholder')"
              :editor-id="editorId('idea')"
              support-variables
              @update:model-value="updateSettings({ idea: $event })"
            />
          </el-text>

          <el-text v-if="settings.mode === 'text_to_image'" v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.subject.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.subject.description") }}
              </el-text>
            </el-flex>

            <el-text-field
              :model-value="settings.subject"
              type="text"
              :size="14"
              :placeholder="t('promptSetup.subject.placeholder')"
              :editor-id="editorId('subject')"
              support-variables
              @update:model-value="updateSettings({ subject: $event })"
            />
          </el-text>
        </el-grid>
      </el-grid>

      <!-- Image Reference Settings -->
      <el-grid v-if="settings.mode === 'image_to_image'" class="setup-panel" v-bind="setupPanelAttrs" @contextmenu="openSetupPanelContextMenu($event, 'imageReference')">
        <el-flex
          v-bind="setupPanelHeaderAttrs"
          class="setup-panel__head crp"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('imageReference')"
          @click="togglePanel('imageReference')"
          @keydown.enter.prevent="togglePanel('imageReference')"
          @keydown.space.prevent="togglePanel('imageReference')"
        >
          <el-flex v-bind="setupPanelIntroAttrs">
            <el-text type="h3" :size="15" :weight="800" class="lh1" icon="image">
              {{ t("promptSetup.imageToImage.title") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal55" v-if="isPanelExpanded('imageReference')">
              {{ t("promptSetup.imageToImage.description") }}
            </el-text>
            <el-text
              v-if="!isPanelExpanded('imageReference')"
              :size="12"
              :weight="700"
              bg="blue"
              :p="[4, 8]"
              :radius="8"
              color="white"
            >
              {{ t(`promptSetup.imageToImage.referenceSubjectType.options.${settings.imageToImage.referenceSubjectType}`) }}
            </el-text>
          </el-flex>

          <el-flex rules="rce" :gap="8">
            <el-icon :icon="getPanelToggleSymbol('imageReference')" :size="20" color="normal55" />
          </el-flex>
        </el-flex>

        <el-grid v-show="isPanelExpanded('imageReference')" v-bind="setupPanelBodyAttrs">
          <el-text v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.imageToImage.referenceSubjectType.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.imageToImage.referenceSubjectType.description") }}
              </el-text>
            </el-flex>

            <el-dropdown
              :model-value="settings.imageToImage.referenceSubjectType"
              icon="add"
              :items="referenceSubjectTypes"
              :item-label="(subjectType) => t(`promptSetup.imageToImage.referenceSubjectType.options.${subjectType}`)"
              :item-value="(subjectType) => subjectType"
              @update:model-value="updateReferenceSubjectType"
            />
          </el-text>

          <el-text v-if="settings.imageToImage.referenceSubjectType === 'custom'" v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.imageToImage.customSubject.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.imageToImage.customSubject.description") }}
              </el-text>
            </el-flex>

            <el-text-field
              :model-value="settings.imageToImage.customSubject"
              type="text"
              :size="14"
              :placeholder="t('promptSetup.imageToImage.customSubject.placeholder')"
              :editor-id="editorId('customSubject')"
              support-variables
              @update:model-value="
                updateImageToImageSettings({
                  customSubject: $event,
                })
              "
            />
          </el-text>

          <el-text v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.imageToImage.subjectDescription.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.imageToImage.subjectDescription.description") }}
              </el-text>
            </el-flex>

            <el-text-field
              :model-value="settings.imageToImage.subjectDescription"
              type="textarea"
              rows="3"
              :size="14"
              :placeholder="t('promptSetup.imageToImage.subjectDescription.placeholder')"
              :editor-id="editorId('subjectDescription')"
              support-variables
              @update:model-value="
                updateImageToImageSettings({
                  subjectDescription: $event,
                })
              "
            />
          </el-text>

          <!-- Generated Subject -->
          <el-grid :gap="6" :p="[12]" :radius="14" bg="normal5">
            <el-text :size="12" :weight="800" color="normal70">
              {{ t("promptSetup.imageToImage.generatedSubject.label") }}
            </el-text>

            <el-text
              :size="12"
              :weight="300"
              :color="generatedSubject ? 'normal75' : 'orange'"
              icon="magic-star"
              :icon-color="generatedSubject ? 'blue' : 'orange'"
            >
              {{ generatedSubject || t("promptSetup.imageToImage.generatedSubject.empty") }}
            </el-text>
          </el-grid>

          <el-text v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.imageToImage.referenceUsage.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.imageToImage.referenceUsage.description") }}
              </el-text>
            </el-flex>

            <el-dropdown
              :model-value="settings.imageToImage.referenceUsage"
              :items="referenceUsageOptions"
              :item-label="(usage) => t(`promptSetup.imageToImage.referenceUsage.options.${usage}`)"
              :item-value="(usage) => usage"
              @update:model-value="updateReferenceUsage"
            />
          </el-text>

          <el-text v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.imageToImage.transformationStrength.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.imageToImage.transformationStrength.description") }}
              </el-text>
            </el-flex>

            <el-dropdown
              :model-value="settings.imageToImage.transformationStrength"
              :items="transformationStrengthOptions"
              :item-label="(strength) => t(`promptSetup.imageToImage.transformationStrength.options.${strength}`)"
              :item-value="(strength) => strength"
              @update:model-value="updateTransformationStrength"
            />
          </el-text>

          <!-- Preserve Options -->
          <el-grid :gap="10">
            <el-flex v-bind="setupPanelIntroAttrs">
              <el-text type="h3" :size="14" :weight="800" class="lh1" icon="shield-tick">
                {{ t("promptSetup.imageToImage.preserve.title") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.imageToImage.preserve.description") }}
              </el-text>
            </el-flex>

            <el-grid :gap="6">
              <label v-for="option in preserveOptions" v-show="option.visible" :key="option.key" class="crp">
                <el-flex
                  rules="rsc"
                  :gap="8"
                  :p="[8, 10]"
                  :radius="12"
                  :bg="getPreserveValue(option.key) ? 'blue5' : 'normal3'"
                  :br="1"
                  :bc="getPreserveValue(option.key) ? 'blue25' : 'normal5'"
                >
                  <input
                    type="checkbox"
                    :checked="getPreserveValue(option.key)"
                    @change="updatePreserveValue(option.key, getCheckedValue($event))"
                  />

                  <el-text
                    :size="12"
                    :weight="500"
                    :color="getPreserveValue(option.key) ? 'normal90' : 'normal65'"
                  >
                    {{ option.label }}
                  </el-text>
                </el-flex>
              </label>
            </el-grid>
          </el-grid>
        </el-grid>
      </el-grid>

      <!-- Output Constraints -->
      <el-grid class="setup-panel" v-bind="setupPanelAttrs" @contextmenu="openSetupPanelContextMenu($event, 'output')">
        <el-flex
          v-bind="setupPanelHeaderAttrs"
          class="setup-panel__head crp"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('output')"
          @click="togglePanel('output')"
          @keydown.enter.prevent="togglePanel('output')"
          @keydown.space.prevent="togglePanel('output')">
          <el-flex v-bind="setupPanelIntroAttrs">
            <el-text type="h3" :size="15" :weight="800" class="lh1" icon="setting-2">
              {{ t("promptSetup.output.title") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal55" v-if="isPanelExpanded('output')">
              {{ t("promptSetup.output.label") }}
            </el-text>
            <el-text v-if="activeAspectRatioOption && !isPanelExpanded('output')"
              :size="12" :weight="700" bg="blue" :p="[4, 8]" :radius="8" color="white">
              {{ activeAspectRatioOption.ratio }}
            </el-text>
          </el-flex>

          <el-flex rules="rce" :gap="8">
            <el-icon :icon="getPanelToggleSymbol('output')" :size="20" color="normal55" />
          </el-flex>
        </el-flex>

        <el-grid v-show="isPanelExpanded('output')" v-bind="setupPanelBodyAttrs">
          <el-text v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.aspectRatio.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.aspectRatio.description") }}
              </el-text>
            </el-flex>

            <el-grid :gap="8">
              <el-dropdown
                :model-value="activeAspectRatioCategory"
                :items="ASPECT_RATIO_GROUPS"
                :item-label="(group) => t(group.labelKey)"
                item-value="id"
                @update:model-value="updateAspectRatioCategoryValue"
              />

              <el-dropdown
                :model-value="settings.aspectRatio"
                :items="activeAspectRatioOptions"
                :item-label="(option) => `${t(option.labelKey)} — ${option.ratio}`"
                :item-description="(option) => t(option.descriptionKey)"
                item-value="value"
                @update:model-value="updateAspectRatioDropdownValue"
              />

              <el-grid v-if="activeAspectRatioOption" :gap="4" :p="[10]" :radius="12" bg="normal5">
                <el-text :size="11" :weight="700" color="normal70">
                  {{ activeAspectRatioOption.ratio }}
                </el-text>

                <el-text :size="11" :weight="300" color="normal55">
                  {{ t(activeAspectRatioOption.descriptionKey) }}
                </el-text>
              </el-grid>
            </el-grid>
          </el-text>

          <el-text v-bind="setupFieldAttrs">
            <el-flex v-bind="setupFieldHeadAttrs">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.globalRules.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.globalRules.description") }}
              </el-text>
            </el-flex>

            <el-text-field
              :model-value="settings.globalRules"
              type="textarea"
              rows="4"
              :size="14"
              :placeholder="t('promptSetup.globalRules.placeholder')"
              :editor-id="editorId('globalRules')"
              support-variables
              @update:model-value="updateSettings({ globalRules: $event })"
            />
          </el-text>
        </el-grid>
      </el-grid>
    </el-grid>
  </el-grid>
</template>
