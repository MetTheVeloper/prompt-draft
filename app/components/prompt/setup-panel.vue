<script setup lang="ts">
import { computed } from "vue";
import type { PromptKeyModule } from "../../modules/types";
import type {
  ImageToImageSettings,
  PromptMode,
  PromptSettings,
  ReferenceSubjectType,
  ReferenceUsage,
  TransformationStrength,
} from "../../utils/compilePrompt";
import { buildPromptSubject } from "../../utils/compilePrompt";
import PromptModuleSelector from "./module-selector.vue";

const { t } = useI18n();
const { mini } = useScreen();

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

const aspectRatioOptions = ["1:1", "4:5", "5:4", "3:4", "4:3", "9:16", "16:9", "21:9"];

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

function getInputValue(event: Event) {
  const target = event.target as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null;

  return target?.value ?? "";
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
</script>

<template>
  <el-grid type="section" :p="[0]" :br="2" bc="normal10" bg="surface" :radius="28" class="w100 oh">
    <!-- Header -->
    <el-grid :p="[20, 20, 16, 20]" class="w100" v-if="!mini">
      <el-text type="h2" :size="16" :weight="800" class="lh1">
        {{ t("promptSetup.title") }}
      </el-text>

      <el-text type="p" :size="12" :weight="300" color="normal60">
        {{ t("promptSetup.description") }}
      </el-text>
    </el-grid>
    <el-divider v-if="!mini" />
    <!-- Key Modules -->
    <el-grid :gap="12" :p="[16]">
      <el-flex rules="ccs" :gap="4">
        <el-flex rules="rbc" class="w100">
          <el-text type="h3" :size="15" :weight="800" class="lh1" icon="element-4">
            {{ t("create.modulesTitle") }}
          </el-text>

          <el-text marker="blue5" color="blue" :size="11" :weight="800">
            {{ selectedModuleKeys.length }} / {{ modules.length }}
          </el-text>
        </el-flex>

        <el-text :size="11" :weight="300" color="normal55">
          {{ t("create.modulesDescription") }}
        </el-text>
      </el-flex>

      <PromptModuleSelector :modules="modules" :model-value="selectedModuleKeys" embedded hide-head
        @update:model-value="updateSelectedModuleKeys" />
    </el-grid>

    <el-divider />

    <el-grid :gap="18" :p="[16]">
      <!-- Prompt Type -->
      <el-grid :gap="12">
        <el-flex rules="ccs" :gap="4">
          <el-text type="h3" :size="15" :weight="800" class="lh1" icon="category">
            {{ t("promptSetup.mode.title") }}
          </el-text>

          <el-text :size="11" :weight="300" color="normal55">
            {{ t("promptSetup.mode.description") }}
          </el-text>
        </el-flex>

        <el-grid :gap="8">
          <el-text type="label" v-for="mode in promptModes" :key="mode" class="crp db">
            <el-flex rules="rsc" :gap="10" :p="[14]" :br="1" :radius="16"
              :bc="settings.mode === mode ? 'blue45' : 'normal10'" :bg="settings.mode === mode ? 'blue5' : 'normal3'">
              <input type="radio" name="prompt-mode" :checked="settings.mode === mode"
                @change="updateSettings({ mode })" />

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

      <!-- Core Context -->
      <el-grid :gap="12">
        <el-flex rules="ccs" :gap="4">
          <el-text type="h3" :size="15" :weight="800" class="lh1" icon="document-text">
            {{ t("promptSetup.core.title") }}
          </el-text>

          <el-text :size="11" :weight="300" color="normal55">
            {{ t("promptSetup.core.label") }}
          </el-text>
        </el-flex>

        <el-grid :gap="12">
          <el-text type="label">
            <el-flex rules="ccs" :gap="4" class="mb8">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.idea.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.idea.description") }}
              </el-text>
            </el-flex>

            <textarea :value="settings.idea" rows="4" :placeholder="t('promptSetup.idea.placeholder')"
              @input="updateSettings({ idea: getInputValue($event) })" />
          </el-text>

          <el-text type="label" v-if="settings.mode === 'text_to_image'">
            <el-flex rules="ccs" :gap="4" class="mb8">
              <el-text :size="13" :weight="800">
                {{ t("promptSetup.subject.label") }}
              </el-text>

              <el-text :size="11" :weight="300" color="normal50">
                {{ t("promptSetup.subject.description") }}
              </el-text>
            </el-flex>

            <input :value="settings.subject" type="text" :placeholder="t('promptSetup.subject.placeholder')"
              @input="updateSettings({ subject: getInputValue($event) })" />
          </el-text>
        </el-grid>
      </el-grid>

      <!-- Image Reference Settings -->
      <el-grid v-if="settings.mode === 'image_to_image'" :gap="14">
        <el-flex rules="ccs" :gap="4">
          <el-text type="h3" :size="15" :weight="800" class="lh1" icon="image">
            {{ t("promptSetup.imageToImage.title") }}
          </el-text>

          <el-text :size="11" :weight="300" color="normal55">
            {{ t("promptSetup.imageToImage.description") }}
          </el-text>
        </el-flex>

        <label>
          <el-flex rules="ccs" :gap="4" class="mb8">
            <el-text :size="13" :weight="800">
              {{ t("promptSetup.imageToImage.referenceSubjectType.label") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal50">
              {{ t("promptSetup.imageToImage.referenceSubjectType.description") }}
            </el-text>
          </el-flex>

          <select :value="settings.imageToImage.referenceSubjectType" @change="
            updateImageToImageSettings({
              referenceSubjectType: getInputValue($event) as ReferenceSubjectType,
            })
            ">
            <option v-for="subjectType in referenceSubjectTypes" :key="subjectType" :value="subjectType">
              {{
                t(`promptSetup.imageToImage.referenceSubjectType.options.${subjectType}`)
              }}
            </option>
          </select>
        </label>

        <label v-if="settings.imageToImage.referenceSubjectType === 'custom'">
          <el-flex rules="ccs" :gap="4" class="mb8">
            <el-text :size="13" :weight="800">
              {{ t("promptSetup.imageToImage.customSubject.label") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal50">
              {{ t("promptSetup.imageToImage.customSubject.description") }}
            </el-text>
          </el-flex>

          <input :value="settings.imageToImage.customSubject" type="text"
            :placeholder="t('promptSetup.imageToImage.customSubject.placeholder')" @input="
              updateImageToImageSettings({
                customSubject: getInputValue($event),
              })
              " />
        </label>

        <label>
          <el-flex rules="ccs" :gap="4" class="mb8">
            <el-text :size="13" :weight="800">
              {{ t("promptSetup.imageToImage.subjectDescription.label") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal50">
              {{ t("promptSetup.imageToImage.subjectDescription.description") }}
            </el-text>
          </el-flex>

          <textarea :value="settings.imageToImage.subjectDescription" rows="3"
            :placeholder="t('promptSetup.imageToImage.subjectDescription.placeholder')" @input="
              updateImageToImageSettings({
                subjectDescription: getInputValue($event),
              })
              " />
        </label>

        <!-- Generated Subject -->
        <el-grid :gap="6" :p="[12]" :radius="14" bg="normal5">
          <el-text :size="12" :weight="800" color="normal70">
            {{ t("promptSetup.imageToImage.generatedSubject.label") }}
          </el-text>

          <el-text :size="12" :weight="300" :color="generatedSubject ? 'normal75' : 'orange'" icon="magic-star"
            :icon-color="generatedSubject ? 'blue' : 'orange'">
            {{ generatedSubject || t("promptSetup.imageToImage.generatedSubject.empty") }}
          </el-text>
        </el-grid>

        <label>
          <el-flex rules="ccs" :gap="4" class="mb8">
            <el-text :size="13" :weight="800">
              {{ t("promptSetup.imageToImage.referenceUsage.label") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal50">
              {{ t("promptSetup.imageToImage.referenceUsage.description") }}
            </el-text>
          </el-flex>

          <select :value="settings.imageToImage.referenceUsage" @change="
            updateImageToImageSettings({
              referenceUsage: getInputValue($event) as ReferenceUsage,
            })
            ">
            <option v-for="usage in referenceUsageOptions" :key="usage" :value="usage">
              {{ t(`promptSetup.imageToImage.referenceUsage.options.${usage}`) }}
            </option>
          </select>
        </label>

        <label>
          <el-flex rules="ccs" :gap="4" class="mb8">
            <el-text :size="13" :weight="800">
              {{ t("promptSetup.imageToImage.transformationStrength.label") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal50">
              {{ t("promptSetup.imageToImage.transformationStrength.description") }}
            </el-text>
          </el-flex>

          <select :value="settings.imageToImage.transformationStrength" @change="
            updateImageToImageSettings({
              transformationStrength: getInputValue($event) as TransformationStrength,
            })
            ">
            <option v-for="strength in transformationStrengthOptions" :key="strength" :value="strength">
              {{
                t(`promptSetup.imageToImage.transformationStrength.options.${strength}`)
              }}
            </option>
          </select>
        </label>

        <!-- Preserve Options -->
        <el-grid :gap="10">
          <el-flex rules="ccs" :gap="4">
            <el-text type="h3" :size="14" :weight="800" class="lh1" icon="shield-tick">
              {{ t("promptSetup.imageToImage.preserve.title") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal50">
              {{ t("promptSetup.imageToImage.preserve.description") }}
            </el-text>
          </el-flex>

          <el-grid :gap="6">
            <label v-for="option in preserveOptions" v-show="option.visible" :key="option.key" class="crp">
              <el-flex rules="rsc" :gap="8" :p="[8, 10]" :radius="12"
                :bg="getPreserveValue(option.key) ? 'blue5' : 'normal3'" :br="1"
                :bc="getPreserveValue(option.key) ? 'blue25' : 'normal5'">
                <input type="checkbox" :checked="getPreserveValue(option.key)"
                  @change="updatePreserveValue(option.key, getCheckedValue($event))" />

                <el-text :size="12" :weight="500" :color="getPreserveValue(option.key) ? 'normal90' : 'normal65'">
                  {{ option.label }}
                </el-text>
              </el-flex>
            </label>
          </el-grid>
        </el-grid>
      </el-grid>

      <!-- Output Constraints -->
      <el-grid :gap="12">
        <el-flex rules="ccs" :gap="4">
          <el-text type="h3" :size="15" :weight="800" class="lh1" icon="setting-2">
            {{ t("promptSetup.output.title") }}
          </el-text>

          <el-text :size="11" :weight="300" color="normal55">
            {{ t("promptSetup.output.label") }}
          </el-text>
        </el-flex>

        <label>
          <el-flex rules="ccs" :gap="4" class="mb8">
            <el-text :size="13" :weight="800">
              {{ t("promptSetup.aspectRatio.label") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal50">
              {{ t("promptSetup.aspectRatio.description") }}
            </el-text>
          </el-flex>

          <select :value="settings.aspectRatio" @change="updateSettings({ aspectRatio: getInputValue($event) })">
            <option v-for="ratio in aspectRatioOptions" :key="ratio" :value="ratio">
              {{ ratio }}
            </option>
          </select>
        </label>

        <label>
          <el-flex rules="ccs" :gap="4" class="mb8">
            <el-text :size="13" :weight="800">
              {{ t("promptSetup.globalRules.label") }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal50">
              {{ t("promptSetup.globalRules.description") }}
            </el-text>
          </el-flex>

          <textarea :value="settings.globalRules" rows="4" :placeholder="t('promptSetup.globalRules.placeholder')"
            @input="updateSettings({ globalRules: getInputValue($event) })" />
        </label>
      </el-grid>

    </el-grid>
  </el-grid>
</template>
