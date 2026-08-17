<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue"
import type { ElDropdownValue } from "~/types/dropdown"
import type {
  ModuleField,
  ModuleFieldOption,
  TypographyTextBlock,
} from "~/modules/types"
import {
  cloneTypographyTextBlock,
  normalizeTypographyTextBlock,
} from "~/utils/typography"
import { usePromptVariables } from "~/composables/prompt/usePromptVariables"

type TextBlockEditorController = {
  submit: () => boolean
  canSubmit?: () => boolean
}

type DropdownItem = {
  value: string
  label: string
  description?: string
  group?: string
  groupLabel?: string
}

const props = defineProps<{
  block: TypographyTextBlock
  field: ModuleField
  controller?: TextBlockEditorController
  onSave?: (block: TypographyTextBlock) => void
}>()

const { t } = useI18n()
const { mobile } = useScreen()
const { enabledPromptVariables } = usePromptVariables()
const submitAttempted = ref(false)
const draft = reactive(
  cloneTypographyTextBlock(normalizeTypographyTextBlock(props.block)),
)

function translate(path: string, fallback = "") {
  const translated = t(path)
  return translated === path ? fallback : translated
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isModuleFieldOption(value: unknown): value is ModuleFieldOption {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (value as ModuleFieldOption).value === "string",
  )
}

function getConfigOptions(key: string) {
  const value = props.field.config?.[key]
  return Array.isArray(value) ? value.filter(isModuleFieldOption) : []
}

function optionItems(key: string): DropdownItem[] {
  return getConfigOptions(key).map((option) => ({
    value: option.value,
    label: humanize(option.value),
    description: option.promptText,
  }))
}

const fontItems = computed<DropdownItem[]>(() => {
  const presetLabel = translate(
    "modules.typography.fields.textGroups.block.controls.fontStyle.groups.presets",
    "Font Presets",
  )
  const variableLabel = translate(
    "modules.typography.fields.textGroups.block.controls.fontStyle.groups.variables",
    "Font Variables",
  )

  return [
    ...getConfigOptions("fontStyleOptions").map((option) => ({
      value: option.value,
      label: humanize(option.value),
      description: option.promptText,
      group: "preset",
      groupLabel: presetLabel,
    })),
    ...enabledPromptVariables.value
      .filter((variable) => variable.type === "font")
      .map((variable) => ({
        value: `{${variable.key}}`,
        label: `{${variable.key}}`,
        description: variable.value,
        group: "variable",
        groupLabel: variableLabel,
      })),
  ]
})

const textIssue = computed(() => {
  return draft.text.trim()
    ? ""
    : t("modules.typography.fields.textGroups.block.validation.requiredTextEmpty")
})

const canSubmit = computed(() => !textIssue.value)

function editorId(fieldKey: string) {
  return `typography:text:${draft.id}:${fieldKey}`
}

function updateStringField(
  key: keyof TypographyTextBlock,
  value: ElDropdownValue,
) {
  ;(draft as Record<string, unknown>)[key] = String(value || "")
}

function saveBlock() {
  submitAttempted.value = true
  if (!canSubmit.value) return false

  props.onSave?.(cloneTypographyTextBlock(draft))
  return true
}

if (props.controller) {
  props.controller.submit = saveBlock
  props.controller.canSubmit = () => canSubmit.value
}

onBeforeUnmount(() => {
  if (props.controller?.submit === saveBlock) {
    props.controller.submit = () => false
  }

  if (props.controller?.canSubmit) {
    delete props.controller.canSubmit
  }
})
</script>

<template>
  <form class="text-block-editor" @submit.prevent="saveBlock">
    <el-flex rules="rsc" :gap="8" class="w100">
      <el-text marker="orange20" color="orange" :size="12" :weight="700">
        {{ draft.layerName }}
      </el-text>
      <el-text :size="10" color="normal45">
        {{ t("modules.typography.fields.textGroups.block.modal.stableKey") }}
      </el-text>
    </el-flex>

    <label class="text-block-editor__control">
      <el-text :size="11" color="normal50">
        {{ t("modules.typography.fields.textGroups.block.controls.text.label") }}
      </el-text>
      <el-text-field
        v-model="draft.text"
        type="textarea"
        rows="3"
        :editor-id="editorId('text')"
        support-variables
        :placeholder="t('modules.typography.fields.textGroups.block.controls.text.placeholder')"
      />
    </label>

    <el-grid :cols="mobile ? 1 : 2" :gap="10" class="w100">
      <div class="text-block-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.block.controls.purpose.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.purpose || ''"
          :items="optionItems('textPurposeOptions')"
          item-label="label"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updateStringField('purpose', $event)"
        />
      </div>

      <div class="text-block-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.block.controls.fontStyle.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.fontStyle || ''"
          :items="fontItems"
          item-label="label"
          item-value="value"
          item-description="description"
          item-group="group"
          item-group-label="groupLabel"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updateStringField('fontStyle', $event)"
        />
      </div>

      <label
        v-if="draft.purpose === 'custom'"
        class="text-block-editor__control"
      >
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.block.controls.customPurpose.label") }}
        </el-text>
        <el-text-field
          v-model="draft.customPurpose"
          :editor-id="editorId('customPurpose')"
          support-variables
          :placeholder="t('modules.typography.fields.textGroups.block.controls.customPurpose.placeholder')"
        />
      </label>

      <label
        v-if="draft.fontStyle === 'custom'"
        class="text-block-editor__control"
      >
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.block.controls.customFontStyle.label") }}
        </el-text>
        <el-text-field
          v-model="draft.customFontStyle"
          :editor-id="editorId('customFontStyle')"
          support-variables
          :placeholder="t('modules.typography.fields.textGroups.block.controls.customFontStyle.placeholder')"
        />
      </label>

      <div class="text-block-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.block.controls.fontSize.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.fontSize || ''"
          :items="optionItems('fontSizeOptions')"
          item-label="label"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updateStringField('fontSize', $event)"
        />
      </div>

      <div class="text-block-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.block.controls.fontWeight.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.fontWeight || 'regular'"
          :items="optionItems('fontWeightOptions')"
          item-label="label"
          item-value="value"
          @update:model-value="updateStringField('fontWeight', $event)"
        />
      </div>

      <label
        v-if="draft.fontSize === 'custom'"
        class="text-block-editor__control"
      >
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.block.controls.customFontSize.label") }}
        </el-text>
        <el-text-field
          v-model="draft.customFontSize"
          :editor-id="editorId('customFontSize')"
          support-variables
          :placeholder="t('modules.typography.fields.textGroups.block.controls.customFontSize.placeholder')"
        />
      </label>

      <label
        v-if="draft.fontWeight === 'custom'"
        class="text-block-editor__control"
      >
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.block.controls.customFontWeight.label") }}
        </el-text>
        <el-text-field
          v-model="draft.customFontWeight"
          :editor-id="editorId('customFontWeight')"
          support-variables
          :placeholder="t('modules.typography.fields.textGroups.block.controls.customFontWeight.placeholder')"
        />
      </label>
    </el-grid>

    <label class="text-block-editor__control">
      <el-text :size="11" color="normal50">
        {{ t("modules.typography.fields.textGroups.block.controls.additionalDescription.label") }}
      </el-text>
      <el-text-field
        v-model="draft.additionalDescription"
        type="textarea"
        rows="3"
        :editor-id="editorId('additionalDescription')"
        support-variables
        :placeholder="t('modules.typography.fields.textGroups.block.controls.additionalDescription.placeholder')"
      />
    </label>

    <el-text
      v-if="submitAttempted && textIssue"
      :size="11"
      color="orange"
      icon="warning"
      icon-color="orange"
    >
      {{ textIssue }}
    </el-text>
  </form>
</template>

<style scoped>
.text-block-editor {
  display: grid;
  gap: 14px;
  width: 100%;
  max-height: min(72vh, 700px);
  overflow: auto;
}

.text-block-editor__control {
  display: grid;
  gap: 5px;
  width: 100%;
}
</style>
