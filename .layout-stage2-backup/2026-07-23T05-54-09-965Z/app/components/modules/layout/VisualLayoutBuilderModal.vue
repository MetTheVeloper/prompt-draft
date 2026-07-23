<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue"
import { findAspectRatioOption } from "~/constants/aspectRatios"
import type {
  LayoutRegion,
  LayoutRegionsState,
} from "~/modules/layout.types"
import {
  cloneLayoutRegion,
  cloneLayoutRegionsState,
  createLayoutRegion,
  normalizeLayoutGrid,
} from "~/utils/layoutRegions"

type VisualLayoutBuilderController = {
  submit: () => boolean
  canSubmit?: () => boolean
}

type CellRect = {
  column: number
  row: number
  columnSpan: number
  rowSpan: number
}

type VisualRegionDraft = {
  region: LayoutRegion
  rect: CellRect
  initialRect: CellRect
  originalRegion?: LayoutRegion
  isNew: boolean
  dirty: boolean
}

type PointerInteraction =
  | {
      type: "create"
      pointerId: number
      startCell: { column: number; row: number }
      currentCell: { column: number; row: number }
    }
  | {
      type: "move"
      pointerId: number
      regionId: string
      startCell: { column: number; row: number }
      originalRect: CellRect
    }
  | {
      type: "resize"
      pointerId: number
      regionId: string
      originalRect: CellRect
    }

const props = defineProps<{
  state: LayoutRegionsState
  aspectRatio: string
  controller?: VisualLayoutBuilderController
  onSave?: (state: LayoutRegionsState) => void
}>()

const { t } = useI18n()
const { mobile } = useScreen()
const modal = useModal()

const initialState = cloneLayoutRegionsState(props.state)
const grid = reactive({ ...initialState.grid })
const pendingColumns = ref(grid.columns)
const pendingRows = ref(grid.rows)
const canvasRef = ref<HTMLElement | null>(null)
const selectedRegionId = ref<string | null>(null)
const activeTool = ref<"select" | "draw">(
  initialState.regions.length ? "select" : "draw",
)
const interaction = ref<PointerInteraction | null>(null)

function clampInteger(value: unknown, min: number, max: number) {
  const number = Math.round(Number(value))

  if (!Number.isFinite(number)) return min

  return Math.min(max, Math.max(min, number))
}

function normalizedRegionToCellRect(region: LayoutRegion): CellRect {
  const column = clampInteger(region.x * grid.columns, 0, grid.columns - 1)
  const row = clampInteger(region.y * grid.rows, 0, grid.rows - 1)
  const columnSpan = clampInteger(
    region.width * grid.columns,
    1,
    grid.columns - column,
  )
  const rowSpan = clampInteger(
    region.height * grid.rows,
    1,
    grid.rows - row,
  )

  return {
    column,
    row,
    columnSpan,
    rowSpan,
  }
}

function createVisualDraft(region: LayoutRegion, isNew = false): VisualRegionDraft {
  const rect = normalizedRegionToCellRect(region)

  return {
    region: cloneLayoutRegion(region),
    rect: { ...rect },
    initialRect: { ...rect },
    originalRegion: isNew ? undefined : cloneLayoutRegion(region),
    isNew,
    dirty: isNew,
  }
}

function cellRectsEqual(first: CellRect, second: CellRect) {
  return (
    first.column === second.column &&
    first.row === second.row &&
    first.columnSpan === second.columnSpan &&
    first.rowSpan === second.rowSpan
  )
}

function syncRegionDirtyState(item: VisualRegionDraft) {
  item.dirty = item.isNew || !cellRectsEqual(item.rect, item.initialRect)
}

const workingRegions = ref<VisualRegionDraft[]>(
  initialState.regions.map((region) => createVisualDraft(region)),
)

const selectedRegion = computed(() => {
  if (!selectedRegionId.value) return null

  return (
    workingRegions.value.find(
      (item) => item.region.id === selectedRegionId.value,
    ) || null
  )
})

const selectedRegionIndex = computed(() => {
  if (!selectedRegionId.value) return -1

  return workingRegions.value.findIndex(
    (item) => item.region.id === selectedRegionId.value,
  )
})

const hasPendingGridChange = computed(() => {
  return (
    Number(pendingColumns.value) !== grid.columns ||
    Number(pendingRows.value) !== grid.rows
  )
})

const aspectRatioData = computed(() => {
  const option = findAspectRatioOption(props.aspectRatio)
  const ratioText = option?.ratio || "1:1"
  const [rawWidth, rawHeight] = ratioText.split(":")
  const width = Number(rawWidth)
  const height = Number(rawHeight)

  if (!Number.isFinite(width) || !Number.isFinite(height) || height <= 0) {
    return {
      label: "1:1",
      width: 1,
      height: 1,
      value: 1,
    }
  }

  return {
    label: ratioText,
    width,
    height,
    value: width / height,
  }
})

const canvasStyle = computed(() => {
  const ratio = aspectRatioData.value
  const baseStyle = {
    aspectRatio: `${ratio.width} / ${ratio.height}`,
    backgroundSize: `${100 / grid.columns}% ${100 / grid.rows}%`,
  }

  if (ratio.value >= 1) {
    return {
      ...baseStyle,
      width: "min(100%, 820px)",
    }
  }

  const viewportHeight = mobile.value ? 52 : 60
  const portraitWidth = Math.max(18, ratio.value * viewportHeight)

  return {
    ...baseStyle,
    width: `min(100%, ${portraitWidth}vh)`,
  }
})

const selectionRect = computed<CellRect | null>(() => {
  const active = interaction.value

  if (!active || active.type !== "create") return null

  const column = Math.min(active.startCell.column, active.currentCell.column)
  const row = Math.min(active.startCell.row, active.currentCell.row)
  const endColumn = Math.max(active.startCell.column, active.currentCell.column)
  const endRow = Math.max(active.startCell.row, active.currentCell.row)

  return {
    column,
    row,
    columnSpan: endColumn - column + 1,
    rowSpan: endRow - row + 1,
  }
})

function cellRectToStyle(rect: CellRect) {
  return {
    left: `${(rect.column / grid.columns) * 100}%`,
    top: `${(rect.row / grid.rows) * 100}%`,
    width: `${(rect.columnSpan / grid.columns) * 100}%`,
    height: `${(rect.rowSpan / grid.rows) * 100}%`,
  }
}

function regionStyle(item: VisualRegionDraft, index: number) {
  const hue = (index * 67 + 205) % 360

  return {
    ...cellRectToStyle(item.rect),
    background: `hsl(${hue} 72% 58% / 0.34)`,
    borderColor: `hsl(${hue} 74% 42%)`,
    zIndex: Number.isFinite(Number(item.region.layer))
      ? Number(item.region.layer) + 10
      : index + 10,
  }
}

function getCanvasCell(event: PointerEvent) {
  const canvas = canvasRef.value

  if (!canvas) return null

  const bounds = canvas.getBoundingClientRect()
  const relativeX = Math.min(
    0.999999,
    Math.max(0, (event.clientX - bounds.left) / bounds.width),
  )
  const relativeY = Math.min(
    0.999999,
    Math.max(0, (event.clientY - bounds.top) / bounds.height),
  )

  return {
    column: Math.floor(relativeX * grid.columns),
    row: Math.floor(relativeY * grid.rows),
  }
}

function setPointerCapture(event: PointerEvent) {
  canvasRef.value?.setPointerCapture?.(event.pointerId)
}

function releasePointerCapture(event: PointerEvent) {
  if (canvasRef.value?.hasPointerCapture?.(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId)
  }
}

function startCreate(event: PointerEvent) {
  if (event.button !== 0) return

  if (activeTool.value !== "draw") {
    selectedRegionId.value = null
    return
  }

  const cell = getCanvasCell(event)

  if (!cell) return

  selectedRegionId.value = null
  interaction.value = {
    type: "create",
    pointerId: event.pointerId,
    startCell: cell,
    currentCell: cell,
  }

  setPointerCapture(event)
}

function startMove(event: PointerEvent, item: VisualRegionDraft) {
  if (event.button !== 0) return

  const cell = getCanvasCell(event)

  if (!cell) return

  selectedRegionId.value = item.region.id
  interaction.value = {
    type: "move",
    pointerId: event.pointerId,
    regionId: item.region.id,
    startCell: cell,
    originalRect: { ...item.rect },
  }

  setPointerCapture(event)
}

function startResize(event: PointerEvent, item: VisualRegionDraft) {
  if (event.button !== 0) return

  selectedRegionId.value = item.region.id
  interaction.value = {
    type: "resize",
    pointerId: event.pointerId,
    regionId: item.region.id,
    originalRect: { ...item.rect },
  }

  setPointerCapture(event)
}

function updateInteraction(event: PointerEvent) {
  const active = interaction.value

  if (!active || active.pointerId !== event.pointerId) return

  const cell = getCanvasCell(event)

  if (!cell) return

  if (active.type === "create") {
    active.currentCell = cell
    return
  }

  const item = workingRegions.value.find(
    (region) => region.region.id === active.regionId,
  )

  if (!item) return

  if (active.type === "move") {
    const columnDelta = cell.column - active.startCell.column
    const rowDelta = cell.row - active.startCell.row

    item.rect.column = clampInteger(
      active.originalRect.column + columnDelta,
      0,
      grid.columns - active.originalRect.columnSpan,
    )
    item.rect.row = clampInteger(
      active.originalRect.row + rowDelta,
      0,
      grid.rows - active.originalRect.rowSpan,
    )
    syncRegionDirtyState(item)
    return
  }

  item.rect.columnSpan = clampInteger(
    cell.column - active.originalRect.column + 1,
    1,
    grid.columns - active.originalRect.column,
  )
  item.rect.rowSpan = clampInteger(
    cell.row - active.originalRect.row + 1,
    1,
    grid.rows - active.originalRect.row,
  )
  syncRegionDirtyState(item)
}

function finishInteraction(event: PointerEvent) {
  const active = interaction.value

  if (!active || active.pointerId !== event.pointerId) return

  if (active.type === "create" && selectionRect.value) {
    const region = createLayoutRegion(workingRegions.value.length, {
      layer: workingRegions.value.length,
    })
    const visualRegion: VisualRegionDraft = {
      region,
      rect: { ...selectionRect.value },
      initialRect: { ...selectionRect.value },
      isNew: true,
      dirty: true,
    }

    workingRegions.value.push(visualRegion)
    selectedRegionId.value = region.id
  }

  interaction.value = null
  releasePointerCapture(event)
}

function cancelInteraction(event: PointerEvent) {
  if (interaction.value?.pointerId !== event.pointerId) return

  interaction.value = null
  releasePointerCapture(event)
}

function removeSelectedRegion() {
  if (!selectedRegionId.value) return

  workingRegions.value = workingRegions.value.filter(
    (item) => item.region.id !== selectedRegionId.value,
  )
  selectedRegionId.value = null
}

function duplicateSelectedRegion() {
  const selected = selectedRegion.value

  if (!selected) return

  const nextColumn = Math.min(
    selected.rect.column + 1,
    grid.columns - selected.rect.columnSpan,
  )
  const nextRow = Math.min(
    selected.rect.row + 1,
    grid.rows - selected.rect.rowSpan,
  )
  const duplicatedRegion = createLayoutRegion(workingRegions.value.length, {
    ...cloneLayoutRegion(selected.region),
    id: undefined,
    name: "",
    layer: workingRegions.value.length,
  } as Partial<LayoutRegion>)

  const duplicateRect = {
    ...selected.rect,
    column: nextColumn,
    row: nextRow,
  }
  const duplicate: VisualRegionDraft = {
    region: duplicatedRegion,
    rect: { ...duplicateRect },
    initialRect: { ...duplicateRect },
    isNew: true,
    dirty: true,
  }

  workingRegions.value.push(duplicate)
  selectedRegionId.value = duplicate.region.id
}

function applyGridChange() {
  const nextGrid = normalizeLayoutGrid({
    columns: pendingColumns.value,
    rows: pendingRows.value,
  })

  pendingColumns.value = nextGrid.columns
  pendingRows.value = nextGrid.rows

  if (
    nextGrid.columns === grid.columns &&
    nextGrid.rows === grid.rows
  ) {
    return
  }

  const resetGrid = () => {
    grid.columns = nextGrid.columns
    grid.rows = nextGrid.rows
    workingRegions.value = []
    selectedRegionId.value = null
    activeTool.value = "draw"
    interaction.value = null
  }

  if (!workingRegions.value.length) {
    resetGrid()
    return
  }

  modal.open({
    header: {
      icon: "warning-2",
      title: t("modules.layout.fields.regions.visualBuilder.gridReset.title"),
      subtitle: t("modules.layout.fields.regions.visualBuilder.gridReset.subtitle"),
      color: "orange",
    },
    descriptions: t(
      "modules.layout.fields.regions.visualBuilder.gridReset.description",
    ),
    actions: [
      {
        label: t("modules.layout.fields.regions.actions.cancel"),
        icon: "close-circle",
        color: "normal",
        mode: "flat",
        close: true,
      },
      {
        label: t(
          "modules.layout.fields.regions.visualBuilder.gridReset.confirm",
        ),
        icon: "refresh-2",
        color: "orange",
        close: true,
        handler: resetGrid,
      },
    ],
    options: {
      width: 480,
    },
  })
}

function regionDisplayName(item: VisualRegionDraft, index: number) {
  return (
    item.region.name.trim() ||
    t("modules.layout.fields.regions.defaultName", {
      index: index + 1,
    })
  )
}

function selectedBoundsLabel(item: VisualRegionDraft) {
  return t("modules.layout.fields.regions.visualBuilder.selectionSummary", {
    column: item.rect.column + 1,
    row: item.rect.row + 1,
    columnSpan: item.rect.columnSpan,
    rowSpan: item.rect.rowSpan,
  })
}

function buildSavedRegion(item: VisualRegionDraft) {
  if (!item.isNew && !item.dirty && item.originalRegion) {
    return cloneLayoutRegion(item.originalRegion)
  }

  return {
    ...cloneLayoutRegion(item.region),
    x: item.rect.column / grid.columns,
    y: item.rect.row / grid.rows,
    width: item.rect.columnSpan / grid.columns,
    height: item.rect.rowSpan / grid.rows,
  }
}

function saveVisualLayout() {
  if (hasPendingGridChange.value) return false

  props.onSave?.({
    grid: {
      columns: grid.columns,
      rows: grid.rows,
    },
    regions: workingRegions.value.map(buildSavedRegion),
  })

  return true
}

if (props.controller) {
  props.controller.submit = saveVisualLayout
  props.controller.canSubmit = () => !hasPendingGridChange.value
}

onBeforeUnmount(() => {
  if (props.controller?.submit === saveVisualLayout) {
    props.controller.submit = () => false
  }

  if (props.controller?.canSubmit) {
    delete props.controller.canSubmit
  }
})
</script>

<template>
  <el-grid class="visual-layout-builder" :gap="12">
    <el-grid :cols="mobile ? 1 : ['1fr', 'auto']" :gap="10" class="w100">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="12" :weight="700" icon="grid-5">
          {{ t("modules.layout.fields.regions.visualBuilder.grid.title") }}
        </el-text>

        <el-text :size="10" color="normal45">
          {{
            t("modules.layout.fields.regions.visualBuilder.grid.description", {
              ratio: aspectRatioData.label,
            })
          }}
        </el-text>
      </el-flex>

      <el-flex :rules="mobile ? 'ccs' : 'rcc'" :gap="8">
        <label class="visual-layout-builder__grid-input">
          <el-text :size="10" color="normal50">
            {{ t("modules.layout.fields.regions.visualBuilder.grid.columns") }}
          </el-text>

          <el-text-field
            :model-value="String(pendingColumns)"
            type="number"
            :placeholder="t('modules.layout.fields.regions.visualBuilder.grid.columns')"
            @update:model-value="pendingColumns = Number($event)"
          />
        </label>

        <label class="visual-layout-builder__grid-input">
          <el-text :size="10" color="normal50">
            {{ t("modules.layout.fields.regions.visualBuilder.grid.rows") }}
          </el-text>

          <el-text-field
            :model-value="String(pendingRows)"
            type="number"
            :placeholder="t('modules.layout.fields.regions.visualBuilder.grid.rows')"
            @update:model-value="pendingRows = Number($event)"
          />
        </label>

        <el-button
          icon="refresh-2"
          mode="flat"
          color="orange"
          :disable="!hasPendingGridChange"
          :label="t('modules.layout.fields.regions.visualBuilder.grid.apply')"
          @click="applyGridChange"
        />
      </el-flex>
    </el-grid>

    <el-flex rules="rsc" :gap="6" class="w100">
      <el-button
        icon="edit-2"
        :mode="activeTool === 'select' ? 'normal' : 'flat'"
        :color="activeTool === 'select' ? 'prim' : 'normal'"
        :label="t('modules.layout.fields.regions.visualBuilder.tools.select')"
        @click="activeTool = 'select'"
      />

      <el-button
        icon="add-circle"
        :mode="activeTool === 'draw' ? 'normal' : 'flat'"
        :color="activeTool === 'draw' ? 'prim' : 'normal'"
        :label="t('modules.layout.fields.regions.visualBuilder.tools.draw')"
        @click="activeTool = 'draw'"
      />
    </el-flex>

    <el-text
      v-if="hasPendingGridChange"
      :size="10"
      color="orange"
      icon="warning-2"
      icon-color="orange"
    >
      {{ t("modules.layout.fields.regions.visualBuilder.grid.pendingChange") }}
    </el-text>

    <el-flex
      v-if="selectedRegion"
      :rules="mobile ? 'ccs' : 'rbc'"
      class="visual-layout-builder__selection w100"
      :gap="8"
      :p="10"
      :radius="12"
      :br="1"
      bc="blue25"
      bg="blue5"
    >
      <el-flex rules="ccs" :gap="2">
        <el-text :size="12" :weight="700" icon="component">
          {{
            regionDisplayName(selectedRegion, selectedRegionIndex)
          }}
        </el-text>

        <el-text :size="10" color="normal50">
          {{ selectedBoundsLabel(selectedRegion) }}
        </el-text>
      </el-flex>

      <el-flex rules="rcc" :gap="4">
        <el-button
          type="fab"
          mode="flat"
          icon="copy"
          :label="t('modules.layout.fields.regions.actions.duplicate')"
          @click="duplicateSelectedRegion"
        />

        <el-button
          type="fab"
          mode="flat"
          color="red"
          icon="trash"
          :label="t('modules.layout.fields.regions.actions.delete')"
          @click="removeSelectedRegion"
        />
      </el-flex>
    </el-flex>

    <el-flex rules="ccc" class="visual-layout-builder__stage w100">
      <div
        ref="canvasRef"
        class="visual-layout-builder__canvas"
        :style="canvasStyle"
        @pointerdown="startCreate"
        @pointermove="updateInteraction"
        @pointerup="finishInteraction"
        @pointercancel="cancelInteraction"
      >
        <button
          v-for="(item, index) in workingRegions"
          :key="item.region.id"
          type="button"
          class="visual-layout-builder__region"
          :class="{
            'visual-layout-builder__region--selected':
              selectedRegionId === item.region.id,
            'visual-layout-builder__region--draw-mode':
              activeTool === 'draw',
          }"
          :style="regionStyle(item, index)"
          @pointerdown.stop="startMove($event, item)"
          @click.stop="selectedRegionId = item.region.id"
        >
          <span class="visual-layout-builder__region-label">
            {{ regionDisplayName(item, index) }}
          </span>

          <span
            v-if="selectedRegionId === item.region.id"
            class="visual-layout-builder__resize-handle"
            @pointerdown.stop="startResize($event, item)"
          />
        </button>

        <div
          v-if="selectionRect"
          class="visual-layout-builder__selection-preview"
          :style="cellRectToStyle(selectionRect)"
        />
      </div>
    </el-flex>

    <el-flex :rules="mobile ? 'ccs' : 'rbc'" class="w100" :gap="8">
      <el-text :size="10" color="normal50" icon="info-circle">
        {{ t("modules.layout.fields.regions.visualBuilder.hint") }}
      </el-text>

      <el-text :size="10" marker="normal5">
        {{
          t("modules.layout.fields.regions.visualBuilder.regionCount", {
            count: workingRegions.length,
          })
        }}
      </el-text>
    </el-flex>
  </el-grid>
</template>

<style scoped>
.visual-layout-builder {
  width: 100%;
  max-height: min(76vh, 860px);
  overflow: auto;
}

.visual-layout-builder__grid-input {
  display: grid;
  gap: 4px;
  width: 92px;
}

.visual-layout-builder__stage {
  min-height: 260px;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--normalText10);
  border-radius: 16px;
  background: var(--normalText5);
}

.visual-layout-builder__canvas {
  position: relative;
  flex: none;
  min-width: 180px;
  min-height: 180px;
  overflow: hidden;
  touch-action: none;
  cursor: crosshair;
  border: 2px solid var(--themeBlue50);
  border-radius: 8px;
  background-color: var(--themeSurface);
  background-image:
    linear-gradient(to right, var(--themeBlue25) 1px, transparent 1px),
    linear-gradient(to bottom, var(--themeBlue25) 1px, transparent 1px);
  user-select: none;
}

.visual-layout-builder__region {
  position: absolute;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  padding: 4px;
  overflow: visible;
  cursor: move;
  border: 2px solid;
  border-radius: 5px;
  color: var(--normalText);
  font: inherit;
  touch-action: none;
}

.visual-layout-builder__region--selected {
  z-index: 200 !important;
  outline: 2px solid var(--themeBlue);
  outline-offset: 2px;
}

.visual-layout-builder__region--draw-mode {
  pointer-events: none;
}

.visual-layout-builder__region-label {
  max-width: 100%;
  padding: 2px 5px;
  overflow: hidden;
  border-radius: 5px;
  background: var(--themeSurface);
  font-size: 10px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

.visual-layout-builder__resize-handle {
  position: absolute;
  right: -7px;
  bottom: -7px;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  border: 2px solid var(--themeSurface);
  border-radius: 4px;
  background: var(--themeBlue);
  touch-action: none;
}

.visual-layout-builder__selection-preview {
  position: absolute;
  z-index: 500;
  border: 2px dashed var(--themeBlue);
  border-radius: 5px;
  background: var(--themeBlue15);
  pointer-events: none;
}

@media (max-width: 760px) {
  .visual-layout-builder__grid-input {
    width: 100%;
  }

  .visual-layout-builder__stage {
    min-height: 220px;
    padding: 8px;
  }
}
</style>
