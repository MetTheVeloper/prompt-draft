<script setup lang="ts">
import { computed, onBeforeUnmount, reactive } from "vue"
import type { ElDropdownValue } from "~/types/dropdown"
import type {
  ModuleField,
  ModuleFieldOption,
  PromptVariable,
  TypographyTextGroup,
} from "~/modules/types"
import {
  cloneTypographyTextGroup,
  normalizeTypographyTextGroup,
} from "~/utils/typography"
import { getLayoutRegionVariableToken } from "~/utils/structuralVariables"
import { usePromptVariables } from "~/composables/prompt/usePromptVariables"

type TextGroupEditorController = {
  submit: () => boolean
  canSubmit?: () => boolean
}

type PositionDropdownItem = {
  value: string
  label: string
  description?: string
  group: string
  groupLabel: string
  disabled?: boolean
}

const props = defineProps<{
  group: TypographyTextGroup
  field: ModuleField
  controller?: TextGroupEditorController
  onSave?: (group: TypographyTextGroup) => void
}>()

const { t } = useI18n()
const { mobile } = useScreen()
const { enabledModuleVariableGroups } = usePromptVariables()
const draft = reactive(
  cloneTypographyTextGroup(normalizeTypographyTextGroup(props.group)),
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

function optionItems(key: string) {
  return getConfigOptions(key).map((option) => ({
    value: option.value,
    label: humanize(option.value),
  }))
}

const layoutRegionVariables = computed<PromptVariable[]>(() => {
  const layoutGroup = enabledModuleVariableGroups.value.find((group) => {
    return group.id === "layout"
  })

  return (layoutGroup?.variables || []).filter((variable) => {
    return variable.entityType === "region" && Boolean(variable.entityId)
  })
})

const positionItems = computed<PositionDropdownItem[]>(() => {
  const presetGroupLabel = translate(
    "modules.typography.fields.textGroups.group.controls.positionPreset.groups.presets",
    "Preset Positions",
  )
  const layoutGroupLabel = translate(
    "modules.typography.fields.textGroups.group.controls.positionPreset.groups.layout",
    "Layout Regions",
  )
  const customGroupLabel = translate(
    "modules.typography.fields.textGroups.group.controls.positionPreset.groups.custom",
    "Custom",
  )

  const items: PositionDropdownItem[] = getConfigOptions(
    "positionPresetOptions",
  )
    .filter((option) => option.value !== "custom")
    .map((option) => ({
      value: `preset:${option.value}`,
      label: humanize(option.value),
      description: option.promptText,
      group: "preset",
      groupLabel: presetGroupLabel,
    }))

  items.push(
    ...layoutRegionVariables.value.map((variable) => ({
      value: `region:${variable.entityId}`,
      label: variable.label || `{${variable.key}}`,
      description: `{${variable.key}}`,
      group: "layout",
      groupLabel: layoutGroupLabel,
    })),
  )

  if (
    draft.positionSource === "layout_region" &&
    draft.layoutRegionId &&
    !layoutRegionVariables.value.some((variable) => {
      return variable.entityId === draft.layoutRegionId
    })
  ) {
    items.push({
      value: `region:${draft.layoutRegionId}`,
      label: translate(
        "modules.typography.fields.textGroups.group.controls.positionPreset.missingRegion",
        `Missing Layout Region — ${draft.layoutRegionId}`,
      ),
      description: getLayoutRegionVariableToken(draft.layoutRegionId),
      group: "layout",
      groupLabel: layoutGroupLabel,
      disabled: true,
    })
  }

  items.push({
    value: "custom",
    label: translate(
      "modules.typography.fields.textGroups.group.controls.positionPreset.custom",
      "Custom Position",
    ),
    group: "custom",
    groupLabel: customGroupLabel,
  })

  return items
})

const positionValue = computed(() => {
  if (draft.positionSource === "layout_region" && draft.layoutRegionId) {
    return `region:${draft.layoutRegionId}`
  }

  if (draft.positionSource === "custom" || draft.positionPreset === "custom") {
    return "custom"
  }

  return draft.positionPreset ? `preset:${draft.positionPreset}` : ""
})

function editorId(fieldKey: string) {
  return `typography:text-group:${draft.id}:${fieldKey}`
}

function updateStringField(
  key: keyof TypographyTextGroup,
  value: ElDropdownValue,
) {
  ;(draft as Record<string, unknown>)[key] = String(value || "")
}

function updatePosition(value: ElDropdownValue) {
  const selected = String(value || "")

  if (selected.startsWith("region:")) {
    draft.positionSource = "layout_region"
    draft.layoutRegionId = selected.slice("region:".length)
    draft.positionPreset = ""
    return
  }

  if (selected === "custom") {
    draft.positionSource = "custom"
    draft.positionPreset = "custom"
    draft.layoutRegionId = ""
    return
  }

  draft.positionSource = "preset"
  draft.positionPreset = selected.startsWith("preset:")
    ? selected.slice("preset:".length)
    : selected
  draft.layoutRegionId = ""
}

function saveGroup() {
  props.onSave?.(cloneTypographyTextGroup(draft))
  return true
}

if (props.controller) {
  props.controller.submit = saveGroup
  props.controller.canSubmit = () => true
}

onBeforeUnmount(() => {
  if (props.controller?.submit === saveGroup) {
    props.controller.submit = () => false
  }

  if (props.controller?.canSubmit) {
    delete props.controller.canSubmit
  }
})
</script>

<template>
  <form class="text-group-editor" @submit.prevent="saveGroup">
    <el-flex rules="rsc" :gap="8" class="w100">
      <el-text marker="blue20" color="blue" :size="12" :weight="700">
        {{ draft.groupName }}
      </el-text>
      <el-text :size="10" color="normal45">
        {{ t("modules.typography.fields.textGroups.group.modal.stableKey") }}
      </el-text>
    </el-flex>

    <el-grid :cols="mobile ? 1 : 2" :gap="10" class="w100">
      <div class="text-group-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.group.controls.groupPurpose.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.groupPurpose || ''"
          :items="optionItems('groupPurposeOptions')"
          item-label="label"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updateStringField('groupPurpose', $event)"
        />
      </div>

      <div class="text-group-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.group.controls.positionPreset.label") }}
        </el-text>
        <el-dropdown
          :model-value="positionValue"
          :items="positionItems"
          item-label="label"
          item-value="value"
          item-description="description"
          item-group="group"
          item-group-label="groupLabel"
          item-disabled="disabled"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updatePosition"
        />
      </div>

      <label
        v-if="draft.groupPurpose === 'custom'"
        class="text-group-editor__control"
      >
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.group.controls.customGroupPurpose.label") }}
        </el-text>
        <el-text-field
          v-model="draft.customGroupPurpose"
          :editor-id="editorId('customGroupPurpose')"
          support-variables
          :placeholder="t('modules.typography.fields.textGroups.group.controls.customGroupPurpose.placeholder')"
        />
      </label>

      <label
        v-if="draft.positionSource === 'custom'"
        class="text-group-editor__control"
      >
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.group.controls.customPositionDescription.label") }}
        </el-text>
        <el-text-field
          v-model="draft.customPositionDescription"
          type="textarea"
          rows="2"
          :editor-id="editorId('customPositionDescription')"
          support-variables
          :placeholder="t('modules.typography.fields.textGroups.group.controls.customPositionDescription.placeholder')"
        />
      </label>
    </el-grid>

    <el-grid :cols="mobile ? 1 : 2" :gap="10" class="w100">
      <div class="text-group-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.group.controls.direction.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.direction || 'column'"
          :items="optionItems('directionOptions')"
          item-label="label"
          item-value="value"
          @update:model-value="updateStringField('direction', $event)"
        />
      </div>

      <div class="text-group-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.group.controls.writingDirection.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.writingDirection || ''"
          :items="optionItems('writingDirectionOptions')"
          item-label="label"
          item-value="value"
          :placeholder="t('panel.none')"
          clearable
          @update:model-value="updateStringField('writingDirection', $event)"
        />
      </div>

      <div class="text-group-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.group.controls.alignment.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.alignment || 'center'"
          :items="optionItems('alignmentOptions')"
          item-label="label"
          item-value="value"
          @update:model-value="updateStringField('alignment', $event)"
        />
      </div>

      <div class="text-group-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.typography.fields.textGroups.group.controls.distribution.label") }}
        </el-text>
        <el-dropdown
          :model-value="draft.distribution || 'compact'"
          :items="optionItems('distributionOptions')"
          item-label="label"
          item-value="value"
          @update:model-value="updateStringField('distribution', $event)"
        />
      </div>
    </el-grid>

    <label class="text-group-editor__control">
      <el-text :size="11" color="normal50">
        {{ t("modules.typography.fields.textGroups.group.controls.additionalDescription.label") }}
      </el-text>
      <el-text-field
        v-model="draft.additionalDescription"
        type="textarea"
        rows="3"
        :editor-id="editorId('additionalDescription')"
        support-variables
        :placeholder="t('modules.typography.fields.textGroups.group.controls.additionalDescription.placeholder')"
      />
    </label>
  </form>
</template>

<style scoped>
.text-group-editor {
  display: grid;
  gap: 14px;
  width: 100%;
  max-height: min(72vh, 700px);
  overflow: auto;
}

.text-group-editor__control {
  display: grid;
  gap: 5px;
  width: 100%;
}
</style>
