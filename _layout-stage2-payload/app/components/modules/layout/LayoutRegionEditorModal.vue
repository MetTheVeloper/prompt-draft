<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue"
import type { ElDropdownValue } from "~/types/dropdown"
import type {
  LayoutFit,
  LayoutHorizontalAlign,
  LayoutOverflow,
  LayoutRegion,
  LayoutRegionRole,
  LayoutVerticalAlign,
} from "~/modules/layout.types"
import {
  clampUnit,
  cloneLayoutRegion,
  normalizeLayoutRegion,
} from "~/utils/layoutRegions"

type LayoutRegionEditorController = {
  submit: () => boolean
  canSubmit?: () => boolean
}

const props = defineProps<{
  region: LayoutRegion
  regionIndex: number
  controller?: LayoutRegionEditorController
  onSave?: (region: LayoutRegion) => void
}>()

const { t } = useI18n()
const { mobile } = useScreen()
const submitAttempted = ref(false)

const draft = reactive<LayoutRegion>(
  cloneLayoutRegion(normalizeLayoutRegion(props.region, props.regionIndex)),
)

const roleOptions: Array<{ value: LayoutRegionRole; labelKey: string }> = [
  { value: "background", labelKey: "modules.layout.fields.regions.roles.background" },
  { value: "hero_image", labelKey: "modules.layout.fields.regions.roles.hero_image" },
  { value: "supporting_image", labelKey: "modules.layout.fields.regions.roles.supporting_image" },
  { value: "text", labelKey: "modules.layout.fields.regions.roles.text" },
  { value: "logo", labelKey: "modules.layout.fields.regions.roles.logo" },
  { value: "badge", labelKey: "modules.layout.fields.regions.roles.badge" },
  { value: "cta", labelKey: "modules.layout.fields.regions.roles.cta" },
  { value: "metadata", labelKey: "modules.layout.fields.regions.roles.metadata" },
  { value: "decoration", labelKey: "modules.layout.fields.regions.roles.decoration" },
  { value: "empty_space", labelKey: "modules.layout.fields.regions.roles.empty_space" },
  { value: "custom", labelKey: "modules.layout.fields.regions.roles.custom" },
]

const horizontalAlignOptions: Array<{ value: LayoutHorizontalAlign; labelKey: string }> = [
  { value: "start", labelKey: "modules.layout.fields.regions.horizontalAlign.start" },
  { value: "center", labelKey: "modules.layout.fields.regions.horizontalAlign.center" },
  { value: "end", labelKey: "modules.layout.fields.regions.horizontalAlign.end" },
  { value: "stretch", labelKey: "modules.layout.fields.regions.horizontalAlign.stretch" },
]

const verticalAlignOptions: Array<{ value: LayoutVerticalAlign; labelKey: string }> = [
  { value: "start", labelKey: "modules.layout.fields.regions.verticalAlign.start" },
  { value: "center", labelKey: "modules.layout.fields.regions.verticalAlign.center" },
  { value: "end", labelKey: "modules.layout.fields.regions.verticalAlign.end" },
  { value: "stretch", labelKey: "modules.layout.fields.regions.verticalAlign.stretch" },
]

const fitOptions: Array<{ value: LayoutFit; labelKey: string }> = [
  { value: "cover", labelKey: "modules.layout.fields.regions.fit.cover" },
  { value: "contain", labelKey: "modules.layout.fields.regions.fit.contain" },
  { value: "fill", labelKey: "modules.layout.fields.regions.fit.fill" },
  { value: "natural", labelKey: "modules.layout.fields.regions.fit.natural" },
]

const overflowOptions: Array<{ value: LayoutOverflow; labelKey: string }> = [
  { value: "visible", labelKey: "modules.layout.fields.regions.overflow.visible" },
  { value: "hidden", labelKey: "modules.layout.fields.regions.overflow.hidden" },
]

const geometryFields = [
  { value: "x", labelKey: "modules.layout.fields.regions.controls.geometry.x" },
  { value: "y", labelKey: "modules.layout.fields.regions.controls.geometry.y" },
  { value: "width", labelKey: "modules.layout.fields.regions.controls.geometry.width" },
  { value: "height", labelKey: "modules.layout.fields.regions.controls.geometry.height" },
  { value: "layer", labelKey: "modules.layout.fields.regions.controls.geometry.layer" },
] as const

const customRoleIssue = computed(() => {
  if (draft.role !== "custom") return ""
  if (draft.customRole?.trim()) return ""

  return t("modules.layout.fields.regions.validation.customRoleRequired")
})

const geometryIssue = computed(() => {
  if (Number(draft.width) > 0 && Number(draft.height) > 0) return ""

  return t("modules.layout.fields.regions.validation.invalidGeometry")
})

const canSubmit = computed(() => {
  return !customRoleIssue.value && !geometryIssue.value
})

function editorId(field: string) {
  return `layout:region:${draft.id}:${field}`
}

function updateRole(value: ElDropdownValue) {
  draft.role = String(value || "hero_image") as LayoutRegionRole
}

function updateHorizontalAlign(value: ElDropdownValue) {
  draft.horizontalAlign = String(value || "stretch") as LayoutHorizontalAlign
}

function updateVerticalAlign(value: ElDropdownValue) {
  draft.verticalAlign = String(value || "stretch") as LayoutVerticalAlign
}

function updateFit(value: ElDropdownValue) {
  draft.fit = String(value || "cover") as LayoutFit
}

function updateOverflow(value: ElDropdownValue) {
  draft.overflow = String(value || "hidden") as LayoutOverflow
}

function updateNumericField(
  field: "x" | "y" | "width" | "height" | "layer",
  value: unknown,
) {
  draft[field] = Number(value)
}

function normalizeGeometry() {
  draft.x = clampUnit(draft.x)
  draft.y = clampUnit(draft.y)
  draft.width = Math.min(clampUnit(draft.width), 1 - draft.x)
  draft.height = Math.min(clampUnit(draft.height), 1 - draft.y)
  draft.layer = Number.isFinite(Number(draft.layer))
    ? Number(draft.layer)
    : props.regionIndex
}

function saveRegion() {
  submitAttempted.value = true
  normalizeGeometry()

  if (!canSubmit.value) return false

  props.onSave?.(cloneLayoutRegion(draft))
  return true
}

if (props.controller) {
  props.controller.submit = saveRegion
  props.controller.canSubmit = () => canSubmit.value
}

onBeforeUnmount(() => {
  if (props.controller?.submit === saveRegion) {
    props.controller.submit = () => false
  }

  if (props.controller?.canSubmit) {
    delete props.controller.canSubmit
  }
})
</script>

<template>
  <form class="layout-region-editor" @submit.prevent="saveRegion">
    <el-grid :cols="mobile ? 1 : 2" :gap="10" class="w100">
      <label class="layout-region-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.layout.fields.regions.controls.name.label") }}
        </el-text>

        <el-text-field
          v-model="draft.name"
          :editor-id="editorId('name')"
          :placeholder="t('modules.layout.fields.regions.controls.name.placeholder')"
        />
      </label>

      <div class="layout-region-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.layout.fields.regions.controls.role.label") }}
        </el-text>

        <el-dropdown
          :model-value="draft.role"
          :items="roleOptions"
          :item-label="(item) => t(item.labelKey)"
          item-value="value"
          @update:model-value="updateRole"
        />
      </div>

      <label
        v-if="draft.role === 'custom'"
        class="layout-region-editor__control"
      >
        <el-text :size="11" color="normal50">
          {{ t("modules.layout.fields.regions.controls.customRole.label") }}
        </el-text>

        <el-text-field
          v-model="draft.customRole"
          :editor-id="editorId('customRole')"
          :placeholder="t('modules.layout.fields.regions.controls.customRole.placeholder')"
        />
      </label>

      <label class="layout-region-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.layout.fields.regions.controls.contentKey.label") }}
        </el-text>

        <el-text-field
          v-model="draft.contentKey"
          :editor-id="editorId('contentKey')"
          support-variables
          :placeholder="t('modules.layout.fields.regions.controls.contentKey.placeholder')"
        />
      </label>
    </el-grid>

    <el-grid :gap="8" class="w100">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="12" :weight="700" icon="grid-5">
          {{ t("modules.layout.fields.regions.controls.geometry.title") }}
        </el-text>

        <el-text :size="10" color="normal45">
          {{ t("modules.layout.fields.regions.controls.geometry.description") }}
        </el-text>
      </el-flex>

      <el-grid :cols="mobile ? 2 : 5" :gap="8" class="w100">
        <label
          v-for="fieldConfig in geometryFields"
          :key="fieldConfig.value"
          class="layout-region-editor__control"
        >
          <el-text :size="10" color="normal50">
            {{ t(fieldConfig.labelKey) }}
          </el-text>

          <el-text-field
            :model-value="String(draft[fieldConfig.value] ?? '')"
            type="number"
            :placeholder="t(fieldConfig.labelKey)"
            @update:model-value="updateNumericField(fieldConfig.value, $event)"
            @blur="normalizeGeometry"
          />
        </label>
      </el-grid>
    </el-grid>

    <el-grid :cols="mobile ? 1 : 2" :gap="10" class="w100">
      <div class="layout-region-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.layout.fields.regions.controls.horizontalAlign.label") }}
        </el-text>

        <el-dropdown
          :model-value="draft.horizontalAlign"
          :items="horizontalAlignOptions"
          :item-label="(item) => t(item.labelKey)"
          item-value="value"
          @update:model-value="updateHorizontalAlign"
        />
      </div>

      <div class="layout-region-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.layout.fields.regions.controls.verticalAlign.label") }}
        </el-text>

        <el-dropdown
          :model-value="draft.verticalAlign"
          :items="verticalAlignOptions"
          :item-label="(item) => t(item.labelKey)"
          item-value="value"
          @update:model-value="updateVerticalAlign"
        />
      </div>

      <div class="layout-region-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.layout.fields.regions.controls.fit.label") }}
        </el-text>

        <el-dropdown
          :model-value="draft.fit"
          :items="fitOptions"
          :item-label="(item) => t(item.labelKey)"
          item-value="value"
          @update:model-value="updateFit"
        />
      </div>

      <div class="layout-region-editor__control">
        <el-text :size="11" color="normal50">
          {{ t("modules.layout.fields.regions.controls.overflow.label") }}
        </el-text>

        <el-dropdown
          :model-value="draft.overflow"
          :items="overflowOptions"
          :item-label="(item) => t(item.labelKey)"
          item-value="value"
          @update:model-value="updateOverflow"
        />
      </div>
    </el-grid>

    <label class="layout-region-editor__control">
      <el-text :size="11" color="normal50">
        {{ t("modules.layout.fields.regions.controls.description.label") }}
      </el-text>

      <el-text-field
        v-model="draft.description"
        type="textarea"
        :rows="4"
        :editor-id="editorId('description')"
        support-variables
        :placeholder="t('modules.layout.fields.regions.controls.description.placeholder')"
      />
    </label>

    <el-text
      v-if="submitAttempted && customRoleIssue"
      :size="11"
      color="orange"
      icon="danger"
      icon-color="orange"
    >
      {{ customRoleIssue }}
    </el-text>

    <el-text
      v-if="submitAttempted && geometryIssue"
      :size="11"
      color="orange"
      icon="danger"
      icon-color="orange"
    >
      {{ geometryIssue }}
    </el-text>
  </form>
</template>

<style scoped>
.layout-region-editor {
  display: grid;
  gap: 14px;
  width: 100%;
  max-height: min(70vh, 680px);
  overflow: auto;
}

.layout-region-editor__control {
  display: grid;
  gap: 5px;
  width: 100%;
}
</style>
