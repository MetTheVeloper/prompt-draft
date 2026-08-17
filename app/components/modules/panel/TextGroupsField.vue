<script setup lang="ts">
import { computed, watch } from "vue"
import type {
  ModuleField,
  ModuleFieldOption,
  PromptVariable,
  TypographyTextBlock,
  TypographyTextGroup,
} from "../../../modules/types"
import TextGroupEditorModal from "../typography/TextGroupEditorModal.vue"
import TextBlockEditorModal from "../typography/TextBlockEditorModal.vue"
import {
  cloneTypographyGroups,
  createTypographyTextBlock,
  createTypographyTextGroup,
  normalizeTypographyGroups,
} from "../../../utils/typography"
import { usePromptVariables } from "~/composables/prompt/usePromptVariables"

type EditorController = {
  submit: () => boolean
  canSubmit?: () => boolean
}

const props = defineProps<{
  modelValue?: unknown
  field: ModuleField
  moduleKey?: string
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: TypographyTextGroup[]): void
}>()

const { t } = useI18n()
const { mobile } = useScreen()
const modal = useModal()
const { enabledModuleVariableGroups } = usePromptVariables()

const groups = computed(() => normalizeTypographyGroups(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    const source = Array.isArray(value) ? value : []
    const normalized = normalizeTypographyGroups(source)

    if (JSON.stringify(source) !== JSON.stringify(normalized)) {
      emit("update:modelValue", cloneTypographyGroups(normalized))
    }
  },
  { immediate: true, deep: true },
)

function commit(nextGroups: TypographyTextGroup[]) {
  emit("update:modelValue", cloneTypographyGroups(nextGroups))
}

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

function optionLabel(key: string, value?: string) {
  if (!value) return t("panel.none")
  const option = getConfigOptions(key).find((item) => item.value === value)
  return option ? humanize(option.value) : humanize(value)
}

function layoutRegionVariable(regionId?: string) {
  if (!regionId) return undefined

  const group = enabledModuleVariableGroups.value.find((item) => {
    return item.id === "layout"
  })

  return group?.variables.find((variable) => {
    return variable.entityType === "region" && variable.entityId === regionId
  })
}

function groupPositionLabel(group: TypographyTextGroup) {
  if (group.positionSource === "layout_region" && group.layoutRegionId) {
    const variable = layoutRegionVariable(group.layoutRegionId)
    return variable?.label || `{${variable?.key || group.layoutRegionId}}`
  }

  if (group.positionSource === "custom" || group.positionPreset === "custom") {
    return group.customPositionDescription?.trim() || translate(
      "modules.typography.fields.textGroups.group.list.customPosition",
      "Custom Position",
    )
  }

  return optionLabel("positionPresetOptions", group.positionPreset)
}

function textPreview(block: TypographyTextBlock) {
  return block.text.trim() || t(
    "modules.typography.fields.textGroups.block.validation.requiredTextEmpty",
  )
}

function fontLabel(block: TypographyTextBlock) {
  if (block.fontStyle?.startsWith("{")) return block.fontStyle
  return optionLabel("fontStyleOptions", block.fontStyle)
}

function openGroupEditor(groupIndex?: number) {
  const isEdit = typeof groupIndex === "number"
  const source = isEdit
    ? groups.value[groupIndex]
    : createTypographyTextGroup()

  if (!source) return

  const controller: EditorController = {
    submit: () => false,
  }

  modal.open({
    header: {
      icon: isEdit ? "edit" : "add_circle",
      title: isEdit
        ? t("modules.typography.fields.textGroups.group.modal.editTitle")
        : t("modules.typography.fields.textGroups.group.modal.createTitle"),
      subtitle: source.groupName,
      color: "blue",
    },
    component: TextGroupEditorModal,
    props: {
      group: source,
      field: props.field,
      controller,
      onSave: (savedGroup: TypographyTextGroup) => {
        if (isEdit) {
          const nextGroups = [...groups.value]
          nextGroups[groupIndex] = savedGroup
          commit(nextGroups)
          return
        }

        commit([...groups.value, savedGroup])
      },
    },
    actions: [
      {
        label: t("modules.typography.fields.textGroups.actions.cancel"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: isEdit
          ? t("modules.typography.fields.textGroups.actions.save")
          : t("modules.typography.fields.textGroups.actions.create"),
        icon: isEdit ? "check_circle" : "add_circle",
        color: "prim",
        close: true,
        handler: () => controller.submit(),
      },
    ],
    options: {
      width: mobile.value ? "calc(100% - 24px)" : 720,
      closeOnBackdrop: true,
    },
  })
}

function openTextEditor(groupIndex: number, blockIndex?: number) {
  const group = groups.value[groupIndex]
  if (!group) return

  const isEdit = typeof blockIndex === "number"
  const source = isEdit
    ? group.texts[blockIndex]
    : createTypographyTextBlock()

  if (!source) return

  const controller: EditorController = {
    submit: () => false,
  }

  modal.open({
    header: {
      icon: isEdit ? "edit" : "add_circle",
      title: isEdit
        ? t("modules.typography.fields.textGroups.block.modal.editTitle")
        : t("modules.typography.fields.textGroups.block.modal.createTitle"),
      subtitle: `${group.groupName} · ${source.layerName}`,
      color: "orange",
    },
    component: TextBlockEditorModal,
    props: {
      block: source,
      field: props.field,
      controller,
      onSave: (savedBlock: TypographyTextBlock) => {
        const nextGroups = cloneTypographyGroups(groups.value)
        const nextGroup = nextGroups[groupIndex]
        if (!nextGroup) return

        if (isEdit) {
          nextGroup.texts[blockIndex] = savedBlock
        } else {
          nextGroup.texts.push(savedBlock)
        }

        commit(nextGroups)
      },
    },
    actions: [
      {
        label: t("modules.typography.fields.textGroups.actions.cancel"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: isEdit
          ? t("modules.typography.fields.textGroups.actions.save")
          : t("modules.typography.fields.textGroups.actions.create"),
        icon: isEdit ? "check_circle" : "add_circle",
        color: "prim",
        close: true,
        handler: () => controller.submit(),
      },
    ],
    options: {
      width: mobile.value ? "calc(100% - 24px)" : 720,
      closeOnBackdrop: true,
    },
  })
}

function removeGroup(groupIndex: number) {
  const group = groups.value[groupIndex]
  if (!group) return

  modal.open({
    header: {
      icon: "delete",
      title: t("modules.typography.fields.textGroups.group.modal.deleteTitle"),
      subtitle: group.groupName,
      color: "red",
    },
    descriptions: [
      t("modules.typography.fields.textGroups.group.modal.deleteDescription"),
    ],
    actions: [
      {
        label: t("modules.typography.fields.textGroups.actions.cancel"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: t("modules.typography.fields.textGroups.actions.confirmDelete"),
        icon: "delete",
        color: "red",
        close: true,
        handler: () => {
          commit(groups.value.filter((_, index) => index !== groupIndex))
        },
      },
    ],
    options: { width: 460 },
  })
}

function removeText(groupIndex: number, blockIndex: number) {
  const nextGroups = cloneTypographyGroups(groups.value)
  const group = nextGroups[groupIndex]
  if (!group) return

  group.texts = group.texts.filter((_, index) => index !== blockIndex)
  commit(nextGroups)
}

function moveText(groupIndex: number, blockIndex: number, offset: -1 | 1) {
  const nextGroups = cloneTypographyGroups(groups.value)
  const group = nextGroups[groupIndex]
  if (!group) return

  const targetIndex = blockIndex + offset
  if (targetIndex < 0 || targetIndex >= group.texts.length) return

  const [block] = group.texts.splice(blockIndex, 1)
  if (!block) return

  group.texts.splice(targetIndex, 0, block)
  commit(nextGroups)
}
</script>

<template>
  <el-grid class="text-groups-field" :gap="12">
    <el-flex rules="rbc" class="w100" :gap="12">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="13" :weight="700" icon="text_fields">
          {{ t("modules.typography.fields.textGroups.title") }}
        </el-text>
        <el-text :size="10" color="normal45">
          {{ t("modules.typography.fields.textGroups.count", { count: groups.length }) }}
        </el-text>
      </el-flex>

      <el-button
        :label="t('modules.typography.fields.textGroups.actions.addGroup')"
        icon="add_circle"
        color="prim"
        :size="11"
        :p="[8, 11]"
        @click="openGroupEditor()"
      />
    </el-flex>

    <el-flex
      v-if="!groups.length"
      rules="ccs"
      class="text-groups-field__empty"
      :gap="4"
    >
      <el-text :size="13" :weight="600" icon="info">
        {{ t("modules.typography.fields.textGroups.empty.title") }}
      </el-text>
      <el-text :size="11" color="normal45">
        {{ t("modules.typography.fields.textGroups.empty.description") }}
      </el-text>
    </el-flex>

    <el-grid v-else :gap="10" class="w100">
      <el-grid
        v-for="(group, groupIndex) in groups"
        :key="group.id || group.groupName"
        class="text-groups-field__group"
        :gap="9"
      >
        <el-flex rules="rbc" class="w100" :gap="10">
          <el-flex rules="ccs" :gap="2" class="fg100 minw0">
            <el-flex rules="rsc" :gap="7" class="w100">
              <el-text marker="blue20" color="blue" :size="12" :weight="700">
                {{ group.groupName }}
              </el-text>
              <el-text :size="10" color="normal45">
                {{ t("modules.typography.fields.textGroups.group.list.textCount", { count: group.texts.length }) }}
              </el-text>
            </el-flex>

            <el-text :size="10" color="normal55">
              {{ optionLabel("groupPurposeOptions", group.groupPurpose) }} ·
              {{ groupPositionLabel(group) }}
            </el-text>
          </el-flex>

          <el-flex rules="rcc" :gap="4">
            <el-button
              type="fab"
              icon="add"
              :label="t('modules.typography.fields.textGroups.group.actions.addText')"
              :size="11"
              :p="6"
              mode="flat"
              color="prim"
              @click="openTextEditor(groupIndex)"
            />
            <el-button
              type="fab"
              icon="edit"
              :label="t('modules.typography.fields.textGroups.group.actions.edit')"
              :size="11"
              :p="6"
              mode="flat"
              @click="openGroupEditor(groupIndex)"
            />
            <el-button
              type="fab"
              icon="delete"
              :label="t('modules.typography.fields.textGroups.group.actions.remove')"
              :size="11"
              :p="6"
              mode="flat"
              color="red"
              @click="removeGroup(groupIndex)"
            />
          </el-flex>
        </el-flex>

        <el-flex
          v-if="!group.texts.length"
          rules="rsc"
          :gap="6"
          class="text-groups-field__texts-empty"
        >
          <el-icon icon="info" :size="12" color="normal45" />
          <el-text :size="10" color="normal45">
            {{ t("modules.typography.fields.textGroups.group.emptyTexts") }}
          </el-text>
        </el-flex>

        <el-grid v-else :gap="6" class="w100">
          <el-flex
            v-for="(block, blockIndex) in group.texts"
            :key="block.id || block.layerName"
            rules="rbc"
            class="text-groups-field__text"
            :gap="8"
          >
            <el-flex rules="rsc" :gap="8" class="fg100 minw0">
              <el-text marker="orange15" color="orange" :size="10" :weight="700">
                {{ block.layerName }}
              </el-text>

              <el-flex rules="ccs" :gap="0" class="fg100 minw0">
                <el-text
                  :key="`${block.id}:${block.text}`"
                  :size="11"
                  :weight="600"
                  class="text-groups-field__text-preview"
                  :title="block.text"
                >
                  {{ textPreview(block) }}
                </el-text>
                <el-text :size="9" color="normal45">
                  {{ optionLabel("textPurposeOptions", block.purpose) }} ·
                  {{ fontLabel(block) }}
                </el-text>
              </el-flex>
            </el-flex>

            <el-flex rules="rcc" :gap="2">
              <el-button
                type="fab"
                icon="arrow_upward"
                :label="t('modules.typography.fields.textGroups.block.actions.moveUp')"
                :size="10"
                :p="5"
                mode="flat"
                :disable="blockIndex === 0"
                @click="moveText(groupIndex, blockIndex, -1)"
              />
              <el-button
                type="fab"
                icon="arrow_downward"
                :label="t('modules.typography.fields.textGroups.block.actions.moveDown')"
                :size="10"
                :p="5"
                mode="flat"
                :disable="blockIndex === group.texts.length - 1"
                @click="moveText(groupIndex, blockIndex, 1)"
              />
              <el-button
                type="fab"
                icon="edit"
                :label="t('modules.typography.fields.textGroups.block.actions.edit')"
                :size="10"
                :p="5"
                mode="flat"
                @click="openTextEditor(groupIndex, blockIndex)"
              />
              <el-button
                type="fab"
                icon="delete"
                :label="t('modules.typography.fields.textGroups.block.actions.remove')"
                :size="10"
                :p="5"
                mode="flat"
                color="red"
                @click="removeText(groupIndex, blockIndex)"
              />
            </el-flex>
          </el-flex>
        </el-grid>
      </el-grid>
    </el-grid>
  </el-grid>
</template>

<style scoped>
.text-groups-field {
  width: 100%;
}

.text-groups-field__empty,
.text-groups-field__texts-empty {
  padding: 12px;
  border: 1px dashed var(--normalText15);
  border-radius: 12px;
  background: var(--normalText5);
}

.text-groups-field__group {
  width: 100%;
  padding: 11px;
  border: 1px solid var(--normalText12);
  border-radius: 14px;
  background: var(--normalText4);
}

.text-groups-field__text {
  width: 100%;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid var(--normalText10);
  border-radius: 10px;
  background: var(--themeSurface);
}

.text-groups-field__text-preview {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.minw0 {
  min-width: 0;
}

@media (max-width: 640px) {
  .text-groups-field__text {
    align-items: flex-start;
  }
}
</style>
