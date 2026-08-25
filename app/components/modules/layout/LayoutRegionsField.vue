<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { usePromptVariables } from "~/composables/prompt/usePromptVariables"
import type { ModuleField, PromptVariable } from "~/modules/types"
import type {
  LayoutRegion,
  LayoutRegionContentRef,
  LayoutRegionsState,
  LayoutRegionsValue,
} from "~/modules/layout.types"
import {
  cloneLayoutRegion,
  cloneLayoutRegionsState,
  createLayoutRegion,
  createLayoutRegionId,
} from "~/utils/layoutRegions"
import LayoutRegionEditorModal from "./LayoutRegionEditorModal.vue"
import VisualLayoutBuilderModal from "./VisualLayoutBuilderModal.vue"

type LayoutRegionEditorController = {
  submit: () => boolean
  canSubmit?: () => boolean
}

type VisualLayoutBuilderController = {
  submit: () => boolean
  canSubmit?: () => boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: LayoutRegionsValue
    field: ModuleField
    aspectRatio?: string
  }>(),
  {
    modelValue: () => ({
      grid: {
        columns: 12,
        rows: 12,
      },
      regions: [],
    }),
    aspectRatio: "",
  },
)

const emit = defineEmits<{
  (event: "update:modelValue", value: LayoutRegionsState): void
}>()

const { t } = useI18n()
const { mobile } = useScreen()
const modal = useModal()
const { moduleVariableGroups } = usePromptVariables()

const regionRoleTranslationKeys: Record<LayoutRegion["role"], string> = {
  none: "modules.layout.fields.regions.roles.none",
  background: "modules.layout.fields.regions.roles.background",
  hero_image: "modules.layout.fields.regions.roles.hero_image",
  supporting_image: "modules.layout.fields.regions.roles.supporting_image",
  text: "modules.layout.fields.regions.roles.text",
  logo: "modules.layout.fields.regions.roles.logo",
  badge: "modules.layout.fields.regions.roles.badge",
  cta: "modules.layout.fields.regions.roles.cta",
  metadata: "modules.layout.fields.regions.roles.metadata",
  decoration: "modules.layout.fields.regions.roles.decoration",
  empty_space: "modules.layout.fields.regions.roles.empty_space",
  custom: "modules.layout.fields.regions.roles.custom",
}

function translate(path: string, fallback: string) {
  const translated = t(path)
  return translated === path ? fallback : translated
}

function sceneVariableToken(variable: PromptVariable) {
  const key = String(variable.key || "").trim()
  return key ? `{${key}}` : ""
}

function sceneVariableLabel(variable: PromptVariable) {
  return String(variable.label || "").trim() || sceneVariableToken(variable)
}

const sceneVariables = computed(() => {
  return moduleVariableGroups.value
    .flatMap((group) => group.variables)
    .filter((variable) => {
      return (
        variable.moduleKey === "scene" &&
        variable.entityType === "scene" &&
        Boolean(variable.entityId) &&
        Boolean(sceneVariableToken(variable))
      )
    })
})

function createSceneContentRef(variable: PromptVariable): LayoutRegionContentRef {
  return {
    kind: "scene",
    entityId: String(variable.entityId),
    token: sceneVariableToken(variable),
    label: sceneVariableLabel(variable),
  }
}

function getSceneVariableById(entityId?: string) {
  if (!entityId) return undefined

  return sceneVariables.value.find((variable) => variable.entityId === entityId)
}

function getSceneVariableByToken(token?: string) {
  const normalizedToken = String(token || "").trim()
  if (!normalizedToken) return undefined

  return sceneVariables.value.find((variable) => {
    return sceneVariableToken(variable) === normalizedToken
  })
}

function reconcileRegionSceneBinding(region: LayoutRegion): LayoutRegion {
  const nextRegion = cloneLayoutRegion(region)
  const ref = nextRegion.contentRef

  if (ref?.kind === "scene") {
    const variable = getSceneVariableById(ref.entityId)

    if (!variable) {
      return nextRegion
    }

    const token = sceneVariableToken(variable)
    nextRegion.contentRef = createSceneContentRef(variable)
    nextRegion.contentKey = token
    return nextRegion
  }

  const legacyScene = getSceneVariableByToken(nextRegion.contentKey)
  if (!legacyScene) return nextRegion

  nextRegion.contentRef = createSceneContentRef(legacyScene)
  nextRegion.contentKey = sceneVariableToken(legacyScene)
  return nextRegion
}

function reconcileSceneBindings(value: LayoutRegionsValue | unknown) {
  const nextState = cloneLayoutRegionsState(value)

  nextState.regions = nextState.regions.map(reconcileRegionSceneBinding)
  return nextState
}

function statesEqual(a: LayoutRegionsState, b: LayoutRegionsState) {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

const localState = ref<LayoutRegionsState>(
  reconcileSceneBindings(props.modelValue),
)

watch(
  () => props.modelValue,
  (modelValue) => {
    const sourceState = cloneLayoutRegionsState(modelValue)
    const reconciledState = reconcileSceneBindings(sourceState)

    localState.value = reconciledState

    if (!statesEqual(sourceState, reconciledState)) {
      emit("update:modelValue", cloneLayoutRegionsState(reconciledState))
    }
  },
  {
    deep: true,
  },
)

watch(
  sceneVariables,
  () => {
    const reconciledState = reconcileSceneBindings(localState.value)

    if (statesEqual(localState.value, reconciledState)) return

    localState.value = reconciledState
    emit("update:modelValue", cloneLayoutRegionsState(reconciledState))
  },
  {
    deep: true,
    immediate: true,
  },
)

const state = computed(() => localState.value)
const regions = computed(() => localState.value.regions)

function updateState(nextState: LayoutRegionsState) {
  const normalizedState = reconcileSceneBindings(nextState)

  localState.value = normalizedState
  emit("update:modelValue", cloneLayoutRegionsState(normalizedState))
}

function updateRegions(nextRegions: LayoutRegion[]) {
  updateState({
    grid: { ...state.value.grid },
    regions: nextRegions.map(cloneLayoutRegion),
  })
}

function regionDisplayName(region: LayoutRegion, index: number) {
  return (
    region.name.trim() ||
    t("modules.layout.fields.regions.defaultName", {
      index: index + 1,
    })
  )
}

function regionRoleLabel(region: LayoutRegion) {
  if (region.role === "custom" && region.customRole?.trim()) {
    return region.customRole.trim()
  }

  return t(regionRoleTranslationKeys[region.role])
}

function regionSceneVariable(region: LayoutRegion) {
  if (region.contentRef?.kind !== "scene") return undefined
  return getSceneVariableById(region.contentRef.entityId)
}

function regionSceneToken(region: LayoutRegion) {
  const variable = regionSceneVariable(region)

  return (
    (variable ? sceneVariableToken(variable) : "") ||
    region.contentRef?.token?.trim() ||
    region.contentKey?.trim() ||
    ""
  )
}

function regionSceneLabel(region: LayoutRegion) {
  const variable = regionSceneVariable(region)

  return (
    (variable ? sceneVariableLabel(variable) : "") ||
    region.contentRef?.label?.trim() ||
    translate(
      "modules.layout.fields.regions.list.missingScene",
      "Missing Scene",
    )
  )
}

function regionSceneStatus(region: LayoutRegion) {
  if (region.contentRef?.kind !== "scene") return "manual"

  const variable = regionSceneVariable(region)
  if (!variable) return "missing"
  if (variable.enabled === false) return "unavailable"
  return "active"
}

function formatNumber(value: number) {
  return Number(value.toFixed(4)).toString()
}

function regionBoundsLabel(region: LayoutRegion) {
  return t("modules.layout.fields.regions.list.bounds", {
    x: formatNumber(region.x),
    y: formatNumber(region.y),
    width: formatNumber(region.width),
    height: formatNumber(region.height),
  })
}

function regionLayerLabel(region: LayoutRegion, index: number) {
  return t("modules.layout.fields.regions.list.layer", {
    layer: Number.isFinite(Number(region.layer)) ? region.layer : index,
  })
}

function createEditorController(): LayoutRegionEditorController {
  return {
    submit: () => false,
  }
}

function openRegionEditor(regionIndex?: number) {
  const isEdit = typeof regionIndex === "number"
  const sourceRegion = isEdit
    ? regions.value[regionIndex]
    : createLayoutRegion(regions.value.length)

  if (!sourceRegion) return

  const controller = createEditorController()
  const displayName = isEdit
    ? regionDisplayName(sourceRegion, regionIndex)
    : t("modules.layout.fields.regions.modal.createTitle")

  modal.open({
    header: {
      icon: isEdit ? "edit" : "add_circle",
      title: isEdit
        ? t("modules.layout.fields.regions.modal.editTitle", {
            name: displayName,
          })
        : t("modules.layout.fields.regions.modal.createTitle"),
      subtitle: t("modules.layout.fields.regions.modal.editorSubtitle"),
      color: "blue",
    },
    component: LayoutRegionEditorModal,
    props: {
      region: cloneLayoutRegion(sourceRegion),
      regionIndex: isEdit ? regionIndex : regions.value.length,
      sceneVariables: sceneVariables.value,
      controller,
      onSave: (savedRegion: LayoutRegion) => {
        if (isEdit) {
          updateRegions(
            regions.value.map((region, index) => {
              return index === regionIndex ? savedRegion : region
            }),
          )
          return
        }

        updateRegions([...regions.value, savedRegion])
      },
    },
    actions: [
      {
        label: t("modules.layout.fields.regions.actions.cancel"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: isEdit
          ? t("modules.layout.fields.regions.actions.save")
          : t("modules.layout.fields.regions.actions.create"),
        icon: isEdit ? "check_circle" : "add_circle",
        color: "prim",
        close: true,
        handler: () => controller.submit(),
      },
    ],
    options: {
      width: mobile.value ? "calc(100% - 24px)" : 720,
      maxHeight: "90vh",
      closeOnBackdrop: true,
    },
  })
}

function openVisualBuilder() {
  const controller: VisualLayoutBuilderController = {
    submit: () => false,
  }

  modal.open({
    header: {
      icon: "grid_view",
      title: t("modules.layout.fields.regions.visualBuilder.modal.title"),
      subtitle: t(
        "modules.layout.fields.regions.visualBuilder.modal.subtitle",
      ),
      color: "blue",
    },
    component: VisualLayoutBuilderModal,
    props: {
      state: cloneLayoutRegionsState(state.value),
      aspectRatio: props.aspectRatio,
      controller,
      onSave: (savedState: LayoutRegionsState) => {
        updateState(savedState)
      },
    },
    actions: [
      {
        label: t("modules.layout.fields.regions.actions.cancel"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: t("modules.layout.fields.regions.actions.apply"),
        icon: "check_circle",
        color: "prim",
        close: true,
        disable: () => {
          return controller.canSubmit ? !controller.canSubmit() : false
        },
        handler: () => controller.submit(),
      },
    ],
    options: {
      width: mobile.value ? "calc(100% - 16px)" : 1080,
      maxHeight: "94vh",
      closeOnBackdrop: false,
    },
  })
}

function moveRegion(regionIndex: number, direction: -1 | 1) {
  const targetIndex = regionIndex + direction

  if (targetIndex < 0 || targetIndex >= regions.value.length) return

  const nextRegions = regions.value.map(cloneLayoutRegion)
  const [region] = nextRegions.splice(regionIndex, 1)
  nextRegions.splice(targetIndex, 0, region)
  updateRegions(nextRegions)
}

function duplicateRegion(regionIndex: number) {
  const sourceRegion = regions.value[regionIndex]

  if (!sourceRegion) return

  const offsetX = 1 / state.value.grid.columns
  const offsetY = 1 / state.value.grid.rows
  const duplicatedRegion: LayoutRegion = {
    ...cloneLayoutRegion(sourceRegion),
    id: createLayoutRegionId(),
    name: "",
    x: Math.min(sourceRegion.x + offsetX, 1 - sourceRegion.width),
    y: Math.min(sourceRegion.y + offsetY, 1 - sourceRegion.height),
    layer: regions.value.length,
  }
  const nextRegions = regions.value.map(cloneLayoutRegion)

  nextRegions.splice(regionIndex + 1, 0, duplicatedRegion)
  updateRegions(nextRegions)
}

function removeRegion(regionIndex: number) {
  updateRegions(
    regions.value.filter((_, index) => index !== regionIndex),
  )
}

function openDeleteConfirm(region: LayoutRegion, regionIndex: number) {
  const displayName = regionDisplayName(region, regionIndex)

  modal.open({
    header: {
      icon: "delete",
      title: t("modules.layout.fields.regions.modal.deleteTitle"),
      subtitle: displayName,
      color: "red",
    },
    descriptions: t(
      "modules.layout.fields.regions.modal.deleteDescription",
      {
        name: displayName,
      },
    ),
    actions: [
      {
        label: t("modules.layout.fields.regions.actions.cancel"),
        icon: "cancel",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: t("modules.layout.fields.regions.actions.confirmDelete"),
        icon: "delete",
        color: "red",
        close: true,
        handler: () => removeRegion(regionIndex),
      },
    ],
    options: {
      width: 460,
    },
  })
}
</script>

<template>
  <el-grid class="layout-regions-field w100" :gap="12">
    <el-flex :rules="mobile ? 'ccs' : 'rbc'" class="w100" :gap="8">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="13" :weight="700" icon="grid_view">
          {{ t("modules.layout.fields.regions.list.title") }}
        </el-text>

        <el-text :size="10" color="normal45">
          {{
            t("modules.layout.fields.regions.list.description", {
              count: regions.length,
              columns: state.grid.columns,
              rows: state.grid.rows,
            })
          }}
        </el-text>
      </el-flex>

      <el-flex :rules="mobile ? 'ccs' : 'rcc'" :gap="6" :class="mobile ? 'w100' : ''">
        <el-button
          :class="mobile ? 'w100' : ''"
          icon="grid_view"
          mode="flat"
          color="blue"
          :label="t('modules.layout.fields.regions.actions.visualBuilder')"
          @click="openVisualBuilder"
        />

        <el-button
          :class="mobile ? 'w100' : ''"
          icon="add"
          color="prim"
          :label="t('modules.layout.fields.regions.actions.add')"
          @click="openRegionEditor()"
        />
      </el-flex>
    </el-flex>

    <el-grid v-if="regions.length" :gap="8" class="w100">
      <el-flex
        v-for="(region, regionIndex) in regions"
        :key="region.id"
        :rules="mobile ? 'ccs' : 'rbc'"
        class="layout-regions-field__item w100"
        :gap="10"
        :p="10"
        :radius="12"
        :br="1"
        bc="normal10"
        @dblclick="openRegionEditor(regionIndex)"
      >
        <el-flex rules="ccs" :gap="3" class="layout-regions-field__item-content">
          <el-flex rules="rsc" :gap="6" class="w100">
            <el-text :size="12" :weight="700" icon="widgets">
              {{ regionDisplayName(region, regionIndex) }}
            </el-text>

            <el-text :size="10" marker="blue5" color="blue">
              {{ regionRoleLabel(region) }}
            </el-text>

            <el-text :size="10" marker="normal5">
              {{ regionLayerLabel(region, regionIndex) }}
            </el-text>
          </el-flex>

          <el-text :size="10" color="normal50">
            {{ regionBoundsLabel(region) }}
          </el-text>

          <el-text
            v-if="region.contentRef?.kind === 'scene'"
            :size="10"
            :color="
              regionSceneStatus(region) === 'missing'
                ? 'red'
                : regionSceneStatus(region) === 'unavailable'
                  ? 'orange'
                  : 'blue'
            "
            :icon="regionSceneStatus(region) === 'active' ? 'layers' : 'warning'"
          >
            {{ regionSceneLabel(region) }} · {{ regionSceneToken(region) }}
          </el-text>

          <el-text
            v-else-if="region.contentKey?.trim()"
            :key="`${region.id}:${region.contentKey}`"
            :size="10"
            color="normal55"
            icon="code"
          >
            {{
              t("modules.layout.fields.regions.list.contentKey", {
                key: region.contentKey,
              })
            }}
          </el-text>
        </el-flex>

        <el-flex rules="rcc" :gap="3" :class="mobile ? 'w100' : ''">
          <el-button
            type="fab"
            mode="flat"
            icon="arrow_upward"
            :disable="regionIndex === 0"
            :label="t('modules.layout.fields.regions.actions.moveUp')"
            @click="moveRegion(regionIndex, -1)"
          />

          <el-button
            type="fab"
            mode="flat"
            icon="arrow_downward"
            :disable="regionIndex === regions.length - 1"
            :label="t('modules.layout.fields.regions.actions.moveDown')"
            @click="moveRegion(regionIndex, 1)"
          />

          <el-button
            type="fab"
            mode="flat"
            icon="content_copy"
            :label="t('modules.layout.fields.regions.actions.duplicate')"
            @click="duplicateRegion(regionIndex)"
          />

          <el-button
            type="fab"
            mode="flat"
            color="blue"
            icon="edit"
            :label="t('modules.layout.fields.regions.actions.edit')"
            @click="openRegionEditor(regionIndex)"
          />

          <el-button
            type="fab"
            mode="flat"
            color="red"
            icon="delete"
            :label="t('modules.layout.fields.regions.actions.delete')"
            @click="openDeleteConfirm(region, regionIndex)"
          />
        </el-flex>
      </el-flex>
    </el-grid>

    <el-flex
      v-else
      rules="ccs"
      :gap="4"
      :p="14"
      :radius="14"
      :br="1"
      bt="d"
      bc="normal15"
      bg="normal5"
      class="w100"
    >
      <el-text :size="13" :weight="700" icon="box">
        {{ t("modules.layout.fields.regions.empty.title") }}
      </el-text>

      <el-text :size="11" color="normal55">
        {{ t("modules.layout.fields.regions.empty.description") }}
      </el-text>
    </el-flex>
  </el-grid>
</template>

<style scoped>
.layout-regions-field__item-content {
  min-width: 0;
  flex: 1 1 auto;
}

.layout-regions-field__item {
  min-width: 0;
}
</style>