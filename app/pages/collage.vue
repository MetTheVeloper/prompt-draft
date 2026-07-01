<script setup lang="ts">
import { useCollagePage } from '~/composables/collage/useCollagePage'
import type { ElDropdownValue } from '~/types/dropdown'
const { locale } = useI18n()
const {
  orientation,
  mini,

  canvasRef,

  activeMode,
  brandOverlayEnabled,

  padding,
  gap,
  cellRadius,
  backgroundColor,
  canvasDecorationsEnabled,

  layoutConstraintMode,
  canvasAspectRatioLock,
  imageExportQuality,
  selectedImageCellOverlayStyle,
  shuffleSimilarImages,
  shuffleLayout,
  setLayoutConstraintMode,
  setCanvasAspectRatioLock,

  selectedImageCell,
  handleCanvasPointerDown,
  handleCanvasPointerMove,
  handleCanvasPointerUp,
  handleCanvasContextMenu,
  handleCanvasWrapPointerDown,
  handlePageContextMenu,

  canExport,
  canExportImage,
  canExportVideo,

  fileInputRef,
  images,
  isDragging,

  openFilePicker,
  handleFileInput,
  addFiles,
  removeImage,
  clearImages,
  handleDrop,
  handleDragOver,
  handleDragLeave,

  overlaySafeAreaPreset,
  overlaySafeAreaOptions,
  handleOverlaySafeAreaChange,

  watermarkPosition,
  watermarkSize,
  watermarkOpacity,
  watermarkPositions,

  brandOverlayTheme,
  telegramPostId,
  brandOverlayGap,

  textOverlayEnabled,
  textOverlayText,
  textOverlayFontSize,
  textOverlayColor,
  textOverlayGap,
  textOverlayMaxWidthRatio,
  textOverlayFontFamily,
  textOverlayFontWeight,
  textOverlayFontValue,
  textOverlayFontGroups,
  handleTextOverlayFontChange,
  getTextOverlayFontOptionValue,

  videoWidth,
  videoHeight,
  videoFps,
  videoInterval,
  videoTransitionDuration,
  videoEdgeBlur,
  videoRandom,
  videoPreset,
  videoLoop,
  videoRepeat,

  isRecordingVideo,

  isExportingMp4,
  mp4ExportProgress,
  mp4ExportStatus,

  videoAudioFile,
  videoAudioLabel,
  videoQualityPreset,
  videoQualitySettings,
  videoMusicVisualizationEnabled,
  videoMusicVisualizationMaxHeightPercent,

  videoImageCount,
  normalizedVideoRepeat,
  videoTotalSlideCount,
  videoTransitionCount,
  videoDurationMs,
  videoDurationLabel,

  handleVideoAudioInput,
  clearVideoAudio,
  applyVideoPreset,
  handleVideoPresetChange,

  isRendering,
  previewInfo,

  canvasWrapRef,
  canvasZoom,
  canvasZoomMin,
  canvasZoomMax,
  canvasDisplayStyle,
  setCanvasZoom,
  setCanvasActualSize,
  fitCanvasToWrap,

  downloadCanvas,
  copyCanvas,
  exportSliderVideo,
  exportSliderMp4,
} = useCollagePage()

const collageModeOptions = ['image', 'video']

const brandOverlayThemeOptions = ['white', 'black']

const videoQualityPresetOptions = ['compact', 'balanced', 'high']

const layoutConstraintModeOptions = ['controlled', 'free']

const canvasAspectRatioLockOptions = [
  { value: 'auto', labelKey: 'pages.collage.layoutTools.canvasRatios.auto' },
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '2:1', label: '2:1' },
  { value: '3:2', label: '3:2' },
  { value: '3:1', label: '3:1' },
  { value: '3:7', label: '3:7' },
]

const videoPresetOptions = [
  {
    value: '1080x1920',
    labelKey: 'pages.collage.video.presets.storyReel',
  },
  {
    value: '1080x1350',
    labelKey: 'pages.collage.video.presets.portraitPost',
  },
  {
    value: '1080x1080',
    labelKey: 'pages.collage.video.presets.squarePost',
  },
  {
    value: '1920x1080',
    labelKey: 'pages.collage.video.presets.landscape',
  },
]

const collagePageGridAttrs = computed(() => ({
  p: 24,
  cols: [unref(mini) ? '260px' : '360px', 'minmax(0, 1fr)', 'auto'],
  gap: 8,
}))

const collageSidebarAttrs = {
  radius: 16,
  cols: 1,
  gap: 16,
  p: 16,
  bg: 'normal5',
} as const

const collageSidebarHeadAttrs = {
  class: 'w100',
  gap: 6,
} as const

const collageDropzoneAttrs = {
  rules: 'ccc',
  gap: 6,
  p: 24,
  class: 'w100',
  radius: 18,
  br: 1,
  bc: 'normal30',
  bg: 'normal5',
} as const

const collagePanelAttrs = {
  gap: 12,
  radius: 18,
  class: 'w100',
  br: 1,
  bc: 'normal10',
  bg: 'normal5',
} as const

const collagePanelHeaderAttrs = {
  rules: 'rbc',
  p: 14,
  gap: 8,
} as const

const collagePanelBodyAttrs = {
  gap: 12,
  p: 14,
} as const

const collageFieldAttrs = {
  type: 'label',
  rules: 'ccs',
  gap: 8,
} as const

const collageImageItemAttrs = {
  rules: 'ccc',
  gap: 10,
  p: 0,
  radius: 14,
  class: 'por',
  bg: 'normal5',
  'align-items': 'center',
} as const

const collageImageActionsAttrs = {
  cols: 3,
  gap: 10,
  bd: 'b8',
  p: 8,
  radius: 80,
  class: 'post b0 zi50',
} as const

const collageVideoActionsAttrs = {
  cols: 2,
  gap: 10,
  bd: 'b8',
  p: 8,
  radius: 80,
  class: 'post b0 zi50',
} as const

type CollagePanelKey =
  | 'images'
  | 'outputMode'
  | 'brand'
  | 'canvas'
  | 'layoutTools'
  | 'video'

const expandedPanels = reactive<Record<CollagePanelKey, boolean>>({
  images: false,
  outputMode: true,
  brand: false,
  canvas: false,
  layoutTools: false,
  video: false,
})

function isPanelExpanded(panel: CollagePanelKey) {
  return expandedPanels[panel]
}

function togglePanel(panel: CollagePanelKey) {
  expandedPanels[panel] = !expandedPanels[panel]
}

function toggleExpandablePanel(panel: CollagePanelKey) {
  if (panel === 'brand' && !brandOverlayEnabled.value) return

  togglePanel(panel)
}

function updateBrandOverlayEnabled(value: ElDropdownValue | boolean) {
  brandOverlayEnabled.value = value === true

  if (!brandOverlayEnabled.value) {
    expandedPanels.brand = false
  }
}

function getPanelToggleSymbol(panel: CollagePanelKey) {
  return isPanelExpanded(panel) ? 'minus' : 'add'
}

const textOverlayFontDropdownOptions = computed(() => {
  const groups = unref(textOverlayFontGroups) || []

  if (!Array.isArray(groups)) return []

  return groups.flatMap((group) => {
    return (group.options || []).map((option) => ({
      ...option,
      value: getTextOverlayFontOptionValue(option),
      group: group.label,
      groupLabel: group.label,
    }))
  })
})

function getDropdownString(value: ElDropdownValue, fallback = '') {
  return String(value || fallback)
}

function createDropdownChangeEvent(value: ElDropdownValue) {
  return {
    target: {
      value: getDropdownString(value),
    },
  } as unknown as Event
}

function updateActiveMode(value: ElDropdownValue) {
  activeMode.value = getDropdownString(
    value,
    'image',
  ) as typeof activeMode.value
}

function updateTextOverlayFontDropdown(value: ElDropdownValue) {
  handleTextOverlayFontChange(createDropdownChangeEvent(value))
}

function updateBrandOverlayTheme(value: ElDropdownValue) {
  brandOverlayTheme.value = getDropdownString(
    value,
    'white',
  ) as typeof brandOverlayTheme.value
}

function updateWatermarkPosition(value: ElDropdownValue) {
  watermarkPosition.value = getDropdownString(
    value,
  ) as typeof watermarkPosition.value
}

function updateOverlaySafeAreaPreset(value: ElDropdownValue) {
  handleOverlaySafeAreaChange(createDropdownChangeEvent(value))
}

function updateVideoQualityPreset(value: ElDropdownValue) {
  videoQualityPreset.value = getDropdownString(
    value,
    'balanced',
  ) as typeof videoQualityPreset.value
}

function updateLayoutConstraintMode(value: ElDropdownValue) {
  setLayoutConstraintMode(
    getDropdownString(value, 'controlled') as typeof layoutConstraintMode.value,
  )
}

function updateCanvasAspectRatioLock(value: ElDropdownValue) {
  setCanvasAspectRatioLock(
    getDropdownString(value, 'auto') as typeof canvasAspectRatioLock.value,
  )
}

function updateVideoPreset(value: ElDropdownValue) {
  videoPreset.value = getDropdownString(
    value,
    '1080x1920',
  ) as typeof videoPreset.value
  handleVideoPresetChange(createDropdownChangeEvent(value))
}
</script>

<template>
  <el-flex
    rules="ccc"
    v-if="orientation === 'portrait' && mini"
    class="w100 h100"
    :radius="24"
    :br="1"
    bt="d"
    bd="b4"
    bc="red"
  >
    <el-icon :size="80" color="normal50" icon="rotate-left" />
    <el-text :size="14" color="normal80">
      {{ $t('pages.collage.rotateYourPhone') }}
    </el-text>
  </el-flex>
  <el-grid
    v-show="!mini || orientation === 'landscape'"
    type="main"
    class="ofh w100 h100"
    v-bind="collagePageGridAttrs"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @contextmenu="handlePageContextMenu"
  >
    <!-- panel -->
    <el-flex
      type="aside"
      class="ofha mxh100 w100 scrollbar-hidden"
      v-bind="collageSidebarAttrs">
      <!-- header -->
      <el-grid class="collage-sidebar__head" v-bind="collageSidebarHeadAttrs">
        <el-text type="h1" :size="22" weight="700">
          {{ $t('pages.collage.title') }}
        </el-text>

        <el-text type="p" :size="13" color="normal60">
          {{ $t('pages.collage.description') }}
        </el-text>
      </el-grid>
      <!-- sticky tool -->
      <el-grid class="collage-panel post t0 zi100" v-bind="collagePanelAttrs" :gap="0" bd="b8">
        <el-flex v-bind="collagePanelHeaderAttrs" v-if="false"
          class="collage-panel__head"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('outputMode')">
          <el-text :size="14" weight="700" icon="setting-2">
            {{ $t('pages.collage.outputMode.title') }}
          </el-text>
        </el-flex>

        <el-grid v-show="isPanelExpanded('outputMode')" v-bind="collagePanelBodyAttrs">
          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.outputMode.mode') }}
            </el-text>

            <el-dropdown
              :model-value="activeMode"
              :items="collageModeOptions"
              :item-label="(mode) => $t(`pages.collage.outputMode.modes.${mode}`)"
              :item-value="(mode) => mode"
              @update:model-value="updateActiveMode"
            />
          </el-flex>
        </el-grid>
      </el-grid>
      <input
        ref="fileInputRef"
        class="collage-file-input"
        type="file"
        accept="image/*"
        multiple
        @change="handleFileInput"
      />

      <el-flex v-bind="collageDropzoneAttrs"
        class="collage-dropzone"
        :class="{ 'collage-dropzone--active': isDragging }"
        @click="openFilePicker"
      >
        <el-icon icon="gallery-add" :size="40" color="blue" />

        <el-text :size="15" weight="700">
          {{ $t('pages.collage.dropzone.title') }}
        </el-text>

        <el-text :size="12" color="normal55">
          {{ $t('pages.collage.dropzone.description') }}
        </el-text>
      </el-flex>

      <el-grid class="collage-panel" v-bind="collagePanelAttrs">
        <el-flex
          v-bind="collagePanelHeaderAttrs"
          class="collage-panel__head"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('images')"
          @click="togglePanel('images')"
          @keydown.enter.prevent="togglePanel('images')"
          @keydown.space.prevent="togglePanel('images')"
        >
          <el-text :size="14" weight="700" icon="gallery">
            {{ $t('pages.collage.images.title') }}
          </el-text>

          <el-flex rules="rce" :gap="8">
            <el-text :size="12" color="normal55" localize>
              {{ images?.length || 0 }}
            </el-text>

            <el-icon :icon="getPanelToggleSymbol('images')" :size="20" color="normal55" />
          </el-flex>
        </el-flex>

        <el-grid v-show="isPanelExpanded('images')" v-bind="collagePanelBodyAttrs">
          <el-grid v-if="images?.length" class="collage-images" :gap="10" :cols="3">
            <el-flex
              v-for="item in images || []"
              :key="item.id"
              class="collage-image-item"
              v-bind="collageImageItemAttrs">
              <img :src="item.url" :alt="item.name" />

              <el-grid class="collage-image-meta" :gap="2" v-if="false">
                <el-text class="collage-image-name" :size="12" weight="700">
                  {{ item.name }}
                </el-text>

                <el-text :size="11" color="normal55" localize>
                  {{ item.width }}×{{ item.height }}
                </el-text>
              </el-grid>

              <el-button
                class="poa t50 l50 trnsxy-50"
                :label="$t('pages.collage.actions.remove')"
                :size="12"
                mode="flat"
                bd="b8"
                type="fab"
                color="red"
                icon="trash"
                @click="removeImage(item.id)"
              />
            </el-flex>
          </el-grid>

          <el-flex v-else rules="ccc" class="collage-empty" :p="14">
            <el-text :size="13" color="normal45">
              {{ $t('pages.collage.images.empty') }}
            </el-text>
          </el-flex>
        </el-grid>
      </el-grid>

      <el-grid class="collage-panel" v-bind="collagePanelAttrs">
        <el-flex
          v-bind="collagePanelHeaderAttrs"
          class="collage-panel__head"
          role="button"
          tabindex="0"
          :aria-expanded="brandOverlayEnabled && isPanelExpanded('brand')"
          @click="toggleExpandablePanel('brand')"
          @keydown.enter.prevent="toggleExpandablePanel('brand')"
          @keydown.space.prevent="toggleExpandablePanel('brand')"
        >
          <el-text :size="14" weight="700" icon="drop">
            {{ $t('pages.collage.brand.title') }}
          </el-text>

          <el-flex rules="rce" :gap="8">
            <el-switch
              size="mini"
              :model-value="brandOverlayEnabled"
              @update:model-value="updateBrandOverlayEnabled"
            />

            <el-icon
              :icon="getPanelToggleSymbol('brand')"
              :size="20"
              :color="brandOverlayEnabled ? 'normal55' : 'normal30'"
            />
          </el-flex>
        </el-flex>

        <el-grid
          v-show="brandOverlayEnabled && isPanelExpanded('brand')"
          v-bind="collagePanelBodyAttrs"
        >
          <el-switch
            v-model="textOverlayEnabled"
            :label="$t('pages.collage.textOverlay.enabled')"
          />

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.textOverlay.font') }}
            </el-text>

            <el-dropdown
              :model-value="textOverlayFontValue"
              :items="textOverlayFontDropdownOptions"
              item-label="label"
              item-value="value"
              item-group="group"
              item-group-label="groupLabel"
              @update:model-value="updateTextOverlayFontDropdown"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.textOverlay.text') }}
            </el-text>

            <textarea
              v-model="textOverlayText"
              :placeholder="$t('pages.collage.textOverlay.placeholder')"
              rows="3"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.textOverlay.size') }}
            </el-text>

            <input
              v-model.number="textOverlayFontSize"
              type="range"
              min="24"
              max="140"
              step="2"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.textOverlay.color') }}
            </el-text>

            <input v-model="textOverlayColor" type="color" />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.textOverlay.gap') }}
            </el-text>

            <input
              v-model.number="textOverlayGap"
              type="range"
              min="0"
              max="160"
              step="2"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.brand.telegramPostId') }}
            </el-text>

            <input
              v-model="telegramPostId"
              type="text"
              :placeholder="$t('pages.collage.brand.telegramPostIdPlaceholder')"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.brand.logoColor') }}
            </el-text>

            <el-dropdown
              :model-value="brandOverlayTheme"
              :items="brandOverlayThemeOptions"
              :item-label="
                (theme) => $t(`pages.collage.brand.logoThemes.${theme}`)
              "
              :item-value="(theme) => theme"
              @update:model-value="updateBrandOverlayTheme"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.brand.position') }}
            </el-text>

            <el-dropdown
              :model-value="watermarkPosition"
              :items="watermarkPositions"
              :item-label="
                (position) =>
                  $t(`pages.collage.brand.positions.${position.value}`)
              "
              item-value="value"
              @update:model-value="updateWatermarkPosition"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.safeArea.title') }}
            </el-text>

            <el-dropdown
              :model-value="overlaySafeAreaPreset"
              :items="overlaySafeAreaOptions"
              item-label="label"
              item-value="value"
              @update:model-value="updateOverlaySafeAreaPreset"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{ $t('pages.collage.brand.height', { value: watermarkSize }) }}
            </el-text>

            <input
              v-model.number="watermarkSize"
              type="range"
              min="48"
              max="260"
              step="4"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{
                $t('pages.collage.brand.opacity', {
                  value: Math.round(watermarkOpacity * 100),
                })
              }}
            </el-text>

            <input
              v-model.number="watermarkOpacity"
              type="range"
              min="0.1"
              max="1"
              step="0.01"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{ $t('pages.collage.brand.gap', { value: brandOverlayGap }) }}
            </el-text>

            <input
              v-model.number="brandOverlayGap"
              type="range"
              min="0"
              max="48"
              step="2"
            />
          </el-flex>

          <el-text type="small" class="collage-help" :size="11" color="normal45">
            {{ $t('pages.collage.brand.help') }}
          </el-text>
        </el-grid>
      </el-grid>

      <el-grid v-bind="collagePanelAttrs"
        v-if="activeMode === 'image'"
        class="collage-panel"
      >
        <el-flex
          v-bind="collagePanelHeaderAttrs"
          class="collage-panel__head"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('canvas')"
          @click="togglePanel('canvas')"
          @keydown.enter.prevent="togglePanel('canvas')"
          @keydown.space.prevent="togglePanel('canvas')"
        >
          <el-text :size="14" weight="700" icon="grid-1">
            {{ $t('pages.collage.canvas.title') }}
          </el-text>

          <el-icon :icon="getPanelToggleSymbol('canvas')" :size="20" color="normal55" />
        </el-flex>

        <el-grid v-show="isPanelExpanded('canvas')" v-bind="collagePanelBodyAttrs">
          <el-switch
            v-model="canvasDecorationsEnabled"
            :label="$t('pages.collage.canvas.decorationsEnabled')"
          />

          <template v-if="canvasDecorationsEnabled">
            <el-flex v-bind="collageFieldAttrs" class="collage-field">
              <el-text type="span" :size="12" color="normal70" localize>
                {{ $t('pages.collage.canvas.padding', { value: padding }) }}
              </el-text>

              <input
                v-model.number="padding"
                type="range"
                min="0"
                max="96"
                step="2"
              />
            </el-flex>

            <el-flex v-bind="collageFieldAttrs" class="collage-field">
              <el-text type="span" :size="12" color="normal70" localize>
                {{ $t('pages.collage.canvas.gap', { value: gap }) }}
              </el-text>

              <input v-model.number="gap" type="range" min="0" max="64" step="2" />
            </el-flex>

            <el-flex v-bind="collageFieldAttrs" class="collage-field">
              <el-text type="span" :size="12" color="normal70" localize>
                {{ $t('pages.collage.canvas.cellRadius', { value: cellRadius }) }}
              </el-text>

              <input
                v-model.number="cellRadius"
                type="range"
                min="0"
                max="100"
                step="1"
              />
            </el-flex>

            <el-flex v-bind="collageFieldAttrs" class="collage-field">
              <el-text type="span" :size="12" color="normal70">
                {{ $t('pages.collage.canvas.backgroundColor') }}
              </el-text>

              <input v-model="backgroundColor" type="color" />
            </el-flex>
          </template>

          <el-divider class="mb2 mt2" />

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{
                $t('pages.collage.canvas.exportQuality', {
                  value: imageExportQuality,
                })
              }}
            </el-text>

            <input
              v-model.number="imageExportQuality"
              type="range"
              min="30"
              max="100"
              step="1"
            />
          </el-flex>

        </el-grid>
      </el-grid>

      <el-grid
        v-if="activeMode === 'image'"
        v-bind="collagePanelAttrs"
        class="collage-panel"
      >
        <el-flex
          v-bind="collagePanelHeaderAttrs"
          class="collage-panel__head"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('layoutTools')"
          @click="togglePanel('layoutTools')"
          @keydown.enter.prevent="togglePanel('layoutTools')"
          @keydown.space.prevent="togglePanel('layoutTools')"
        >
          <el-text :size="14" weight="700" icon="gallery">
            {{ $t('pages.collage.layoutTools.title') }}
          </el-text>

          <el-flex rules="rce" :gap="8">
            <el-text :size="11" color="normal45"> Shift + S / L / C </el-text>
            <el-icon
              :icon="getPanelToggleSymbol('layoutTools')"
              :size="20"
              color="normal55"
            />
          </el-flex>
        </el-flex>

        <el-grid v-show="isPanelExpanded('layoutTools')" v-bind="collagePanelBodyAttrs">
          <el-grid :cols="2" :gap="8">
            <el-button
              :label="$t('pages.collage.layoutTools.shuffleSimilar')"
              :size="12"
              :p="[10, 12]"
              type="fab"
              mode="outline"
              color="normal"
              :bc="['blue25']"
              icon="gallery"
              :disable="images.length < 2"
              @click="shuffleSimilarImages"
            />

            <el-button
              :label="$t('pages.collage.layoutTools.shuffleLayout')"
              :size="12"
              :p="[10, 12]"
              type="fab"
              mode="outline"
              color="normal"
              :bc="['blue25']"
              icon="grid-1"
              :disable="images.length < 2"
              @click="shuffleLayout"
            />
          </el-grid>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.layoutTools.constraintMode') }}
            </el-text>

            <el-dropdown
              :model-value="layoutConstraintMode"
              :items="layoutConstraintModeOptions"
              :item-label="
                (mode) =>
                  $t(`pages.collage.layoutTools.constraintModes.${mode}`)
              "
              :item-value="(mode) => mode"
              @update:model-value="updateLayoutConstraintMode"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.layoutTools.canvasRatio') }}
            </el-text>

            <el-dropdown
              :model-value="canvasAspectRatioLock"
              :items="canvasAspectRatioLockOptions"
              :item-label="
                (option) => option.labelKey ? $t(option.labelKey) : option.label
              "
              item-value="value"
              @update:model-value="updateCanvasAspectRatioLock"
            />
          </el-flex>
        </el-grid>
      </el-grid>

      <el-grid v-bind="collagePanelAttrs"
        v-if="activeMode === 'video'"
        class="collage-panel"
      >
        <el-flex
          v-bind="collagePanelHeaderAttrs"
          class="collage-panel__head"
          role="button"
          tabindex="0"
          :aria-expanded="isPanelExpanded('video')"
          @click="togglePanel('video')"
          @keydown.enter.prevent="togglePanel('video')"
          @keydown.space.prevent="togglePanel('video')"
        >
          <el-text :size="14" weight="700" icon="video-play">
            {{ $t('pages.collage.video.title') }}
          </el-text>

          <el-icon :icon="getPanelToggleSymbol('video')" :size="20" color="normal55" />
        </el-flex>

        <el-grid v-show="isPanelExpanded('video')" v-bind="collagePanelBodyAttrs">
          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.video.quality') }}
            </el-text>

            <el-dropdown
              :model-value="videoQualityPreset"
              :items="videoQualityPresetOptions"
              :item-label="
                (preset) => $t(`pages.collage.video.qualityPresets.${preset}`)
              "
              :item-value="(preset) => preset"
              @update:model-value="updateVideoQualityPreset"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.video.backgroundMusic') }}
            </el-text>

            <input type="file" accept="audio/*" @change="handleVideoAudioInput" />
          </el-flex>

          <el-grid v-if="videoAudioFile" :gap="6">
            <el-text type="span" :size="11" color="normal55">
              {{ videoAudioLabel }}
            </el-text>

            <button type="button" @click="clearVideoAudio">
              {{ $t('pages.collage.video.removeAudio') }}
            </button>
          </el-grid>

          <el-switch
            v-if="videoAudioFile"
            v-model="videoMusicVisualizationEnabled"
            :label="$t('pages.collage.video.musicVisualizationSoftWave')"
          />

          <el-flex
            v-if="videoAudioFile && videoMusicVisualizationEnabled"
            v-bind="collageFieldAttrs"
            class="collage-field"
          >
            <el-text type="span" :size="12" color="normal70" localize>
              {{
                $t('pages.collage.video.musicVisualizationHeight', {
                  value: videoMusicVisualizationMaxHeightPercent,
                })
              }}
            </el-text>

            <input
              v-model.number="videoMusicVisualizationMaxHeightPercent"
              type="range"
              min="0"
              max="50"
              step="1"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.video.preset') }}
            </el-text>

            <el-dropdown
              :model-value="videoPreset"
              :items="videoPresetOptions"
              :item-label="(option) => $t(option.labelKey)"
              item-value="value"
              @update:model-value="updateVideoPreset"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.video.width') }}
            </el-text>

            <input
              v-model.number="videoWidth"
              type="number"
              min="256"
              max="4096"
              step="2"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.video.height') }}
            </el-text>

            <input
              v-model.number="videoHeight"
              type="number"
              min="256"
              max="4096"
              step="2"
            />
          </el-flex>

          <el-flex
            rules="ccs"
            :gap="4"
            class="w100"
            :radius="18"
            bg="normal5"
            :p="12"
          >
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.video.calculatedDuration') }}
            </el-text>

            <el-text type="span" :size="11" color="normal55">
              {{
                $t('pages.collage.video.durationMeta', {
                  slides: videoTotalSlideCount,
                  transitions: videoTransitionCount,
                })
              }}
            </el-text>

            <el-text
              type="span"
              :size="24"
              icon="clock-1"
              weight="700"
              color="normal90"
            >
              {{ videoDurationLabel }}
            </el-text>
          </el-flex>

          <el-switch
            v-model="videoLoop"
            :label="$t('pages.collage.video.loop')"
          />

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{
                $t('pages.collage.video.repeat', { value: normalizedVideoRepeat })
              }}
            </el-text>

            <input
              v-model.number="videoRepeat"
              type="range"
              min="1"
              max="10"
              step="1"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{ $t('pages.collage.video.fps', { value: videoFps }) }}
            </el-text>

            <input
              v-model.number="videoFps"
              type="range"
              min="24"
              max="60"
              step="1"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{
                $t('pages.collage.video.imageInterval', { value: videoInterval })
              }}
            </el-text>

            <input
              v-model.number="videoInterval"
              type="range"
              min="800"
              max="8000"
              step="100"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{
                $t('pages.collage.video.transition', {
                  value: videoTransitionDuration,
                })
              }}
            </el-text>

            <input
              v-model.number="videoTransitionDuration"
              type="range"
              min="300"
              max="4000"
              step="100"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70" localize>
              {{ $t('pages.collage.video.edgeBlur', { value: videoEdgeBlur }) }}
            </el-text>

            <input
              v-model.number="videoEdgeBlur"
              type="range"
              min="0"
              max="400"
              step="10"
            />
          </el-flex>

          <el-flex v-bind="collageFieldAttrs" class="collage-field">
            <el-text type="span" :size="12" color="normal70">
              {{ $t('pages.collage.canvas.backgroundColor') }}
            </el-text>

            <input v-model="backgroundColor" type="color" />
          </el-flex>

          <el-switch
            v-model="videoRandom"
            :disable="videoLoop || normalizedVideoRepeat > 1"
            :label="$t('pages.collage.video.randomOrder')"
          />

          <el-text
            v-if="videoLoop || normalizedVideoRepeat > 1"
            type="span"
            :size="11"
            color="normal55"
          >
            {{ $t('pages.collage.video.randomOrderDisabled') }}
          </el-text>
        </el-grid>
      </el-grid>

      <el-grid v-if="activeMode === 'image'" v-bind="collageImageActionsAttrs">
        <el-button
          :label="$t('pages.collage.actions.save')"
          :p="[12, 24]"
          :size="14"
          type="fab"
          icon="ram"
          color="prim"
          tooltip-position="top"
          :disable="!canExportImage"
          @click="downloadCanvas"
        />

        <el-button
          :label="$t('pages.collage.actions.copy')"
          :p="[12, 24]"
          :size="14"
          type="fab"
          icon="document-copy"
          color="prim"
          tooltip-position="top"
          :disable="!canExportImage"
          @click="copyCanvas"
        />

        <el-button
          :label="$t('pages.collage.actions.clear')"
          class="collage-actions__danger"
          type="fab"
          icon="trash"
          tooltip-position="top"
          :p="[12, 24]"
          :size="14"
          mode="flat"
          color="red"
          :disable="!images?.length"
          @click="clearImages"
        />
      </el-grid>

      <el-grid v-else v-bind="collageVideoActionsAttrs">
        <el-button
          :label="
            isRecordingVideo
              ? $t('pages.collage.actions.recording')
              : $t('pages.collage.actions.exportWebm')
          "
          :p="[12, 24]"
          :size="14"
          type="fab"
          v-if="false"
          icon="video-play"
          color="prim"
          tooltip-position="top"
          :disable="!canExportVideo"
          @click="exportSliderVideo"
        />

        <el-button
          :label="
            isExportingMp4
              ? $t('pages.collage.actions.exportingMp4')
              : $t('pages.collage.actions.exportMp4')
          "
          :p="[12, 24]"
          :size="14"
          type="fab"
          icon="video-play"
          color="prim"
          tooltip-position="top"
          :disable="!canExportVideo"
          @click="exportSliderMp4"
        />

        <el-button
          :label="$t('pages.collage.actions.clear')"
          class="collage-actions__danger"
          type="fab"
          icon="trash"
          tooltip-position="top"
          :p="[12, 24]"
          :size="14"
          mode="flat"
          color="normal10"
          :disable="!images?.length || isRecordingVideo"
          @click="clearImages"
        />
      </el-grid>
    </el-flex>
    <!-- main box -->
    <el-grid
      type="section"
      class="collage-workspace"
      :rows="['auto', 'minmax(0, 1fr)']"
      :gap="8"
      :p="0"
    >
      <el-flex
        class="collage-preview-head por ofh"
        rules="rbc"
        :gap="16"
        :p="[14, 16]"
        :radius="18"
        :br="1"
        bc="normal10"
        bg="normal5"
      >
        <div
          class="poa t0 l0 b0 bg-blue15"
          v-if="isExportingMp4"
          :style="{ width: `${mp4ExportProgress}%` }"
        ></div>
        <el-flex rules="ccs" :gap="0">
          <el-text
            :size="14"
            weight="700"
            localize
            :icon="activeMode === 'video' ? 'video' : 'gallery'"
          >
            {{ previewInfo.width }}×{{ previewInfo.height }}
          </el-text>
          <el-flex rules="rsc" :gap="16">
            <el-text type="span" :size="12" color="normal70">
              {{
                activeMode === 'video'
                  ? $t('pages.collage.preview.videoMeta', {
                      title: $t('pages.collage.video.title'),
                      width: videoWidth,
                      height: videoHeight,
                      duration: videoDurationLabel,
                      fps: videoFps,
                      repeat: normalizedVideoRepeat,
                      loop: videoLoop
                        ? $t('pages.collage.preview.loopSuffix')
                        : '',
                    })
                  : $t('pages.collage.preview.grid', {
                      columns: previewInfo.columns,
                      rows: previewInfo.rows,
                    })
              }}
            </el-text>

            <el-text
              v-if="selectedImageCell"
              type="span"
              :size="11"
              color="normal45"
            >
              {{
                $t('pages.collage.preview.selectedCell', {
                  name: selectedImageCell.image.name,
                })
              }}
            </el-text>
          </el-flex>
        </el-flex>
        <el-text v-if="isRendering" :size="12" color="normal55">
          {{ $t('pages.collage.preview.rendering') }}
        </el-text>
        <el-text v-if="isRecordingVideo" :size="12" color="normal55">
          {{ $t('pages.collage.preview.recordingVideo') }}
        </el-text>
        <el-flex rules="cce" v-if="isExportingMp4" :gap="0">
          <el-text :size="14" :weight="700" color="normal55">
            {{ mp4ExportStatus }}
          </el-text>
          <el-text :size="12" color="normal55">
            {{ mp4ExportProgress }}%
          </el-text>
        </el-flex>
      </el-flex>

      <el-grid
        ref="canvasWrapRef"
        class="collage-canvas-wrap"
        :class="{ 'collage-canvas-wrap--empty': !images?.length }"
        :p="8"
        @pointerdown.self="handleCanvasWrapPointerDown"
        :radius="18"
        :br="1"
        bc="normal10"
        place-items="start center"
      >
        <el-flex
          v-if="!images?.length"
          rules="ccc"
          :gap="8"
          :p="28"
          :radius="24"
          :br="1"
          bc="normal15"
          bg="surface"
          class="collage-canvas-empty-state"
          role="button"
          tabindex="0"
          @click.stop="openFilePicker"
          @keydown.enter.prevent="openFilePicker"
          @keydown.space.prevent="openFilePicker"
        >
          <el-icon icon="gallery-add" :size="56" color="blue" />

          <el-text :size="18" weight="700">
            {{ $t('pages.collage.emptyCanvas.title') }}
          </el-text>

          <el-text type="p" :size="13" color="normal60">
            {{ $t('pages.collage.emptyCanvas.description') }}
          </el-text>

          <el-text type="span" :size="11" color="normal45">
            {{ $t('pages.collage.emptyCanvas.pasteHint') }}
          </el-text>

          <el-button
            :label="$t('pages.collage.emptyCanvas.action')"
            icon="gallery-add"
            type="fab"
            color="prim"
            :size="13"
            :p="[10, 18]"
            @click.stop="openFilePicker"
          />
        </el-flex>

        <canvas
          ref="canvasRef"
          :style="canvasDisplayStyle"
          @pointerdown="handleCanvasPointerDown"
          @pointermove="handleCanvasPointerMove"
          @pointerup="handleCanvasPointerUp"
          @pointercancel="handleCanvasPointerUp"
          @contextmenu="handleCanvasContextMenu"
        />

        <div
          v-if="activeMode === 'image' && selectedImageCell"
          class="collage-selected-cell-overlay"
          :style="selectedImageCellOverlayStyle"
        />
      </el-grid>
    </el-grid>

    <!-- canvas options -->
    <el-flex
      rules="cbc"
      :gap="6"
      :p="8"
      class="collage-canvas-options"
      :radius="8"
    >
      <!-- zoom -->
      <el-flex rules="csc">
        <el-button
          :size="14"
          :p="8"
          :label="$t('pages.collage.zoom.fit')"
          icon="maximize-3"
          type="fab"
          mode="flat"
          @click="fitCanvasToWrap"
        />

        <el-button
          :size="14"
          :p="8"
          :label="$t('pages.collage.zoom.actual')"
          icon="scan"
          type="fab"
          mode="flat"
          @click="setCanvasActualSize"
        />

        <input
          class="vertical-range"
          type="range"
          :min="canvasZoomMin"
          :max="canvasZoomMax"
          :value="canvasZoom"
          @input="
            setCanvasZoom(Number(($event.target as HTMLInputElement).value))
          "
        />

        <el-text :size="12"> %{{ canvasZoom }} </el-text>
      </el-flex>

      <el-grid v-if="activeMode === 'image'" :cols="1" :gap="10">
        <el-button
          :label="$t('pages.collage.actions.save')"
          :p="[8]"
          :size="14"
          type="fab"
          icon="ram"
          color="prim"
          tooltip-position="top"
          :disable="!canExportImage"
          @click="downloadCanvas"
        />

        <el-button
          :label="$t('pages.collage.actions.copy')"
          :p="[8]"
          :size="14"
          mode="flat"
          type="fab"
          icon="document-copy"
          tooltip-position="top"
          :disable="!canExportImage"
          @click="copyCanvas"
        />

        <el-button
          :label="$t('pages.collage.actions.clear')"
          class="collage-actions__danger"
          type="fab"
          icon="trash"
          tooltip-position="top"
          :p="[8]"
          :size="14"
          mode="flat"
          color="red"
          :disable="!images?.length"
          @click="clearImages"
        />
      </el-grid>

      <el-grid v-else :cols="1" :gap="10">
        <el-button
          :label="
            isRecordingVideo
              ? $t('pages.collage.actions.recording')
              : $t('pages.collage.actions.exportWebm')
          "
          :p="[8]"
          :size="14"
          type="fab"
          v-if="false"
          icon="video-play"
          color="prim"
          tooltip-position="top"
          :disable="!canExportVideo"
          @click="exportSliderVideo"
        />

        <el-button
          :label="
            isExportingMp4
              ? $t('pages.collage.actions.exportingMp4')
              : $t('pages.collage.actions.exportMp4')
          "
          :p="[8]"
          :size="14"
          type="fab"
          icon="video-play"
          color="prim"
          tooltip-position="top"
          :disable="!canExportVideo"
          @click="exportSliderMp4"
        />

        <el-button
          :label="$t('pages.collage.actions.clear')"
          class="collage-actions__danger"
          type="fab"
          icon="trash"
          tooltip-position="top"
          :p="[8]"
          :size="14"
          mode="flat"
          color="normal10"
          :disable="!images?.length || isRecordingVideo"
          @click="clearImages"
        />
      </el-grid>
    </el-flex>
  </el-grid>
</template>

<style scoped>
.collage-file-input {
  display: none;
}

.collage-dropzone {
  width: 100%;
  cursor: pointer;
  aspect-ratio: 16/9;
  border-style: dashed !important;
  transition: 0.2s ease;
}

.collage-dropzone:hover,
.collage-dropzone--active {
  border-color: var(--primary) !important;
  background: var(--normalText10) !important;
}

.collage-panel {
  min-width: 0;
}

.collage-panel__head {
  cursor: pointer;
  user-select: none;
}

.collage-panel__head:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}

.collage-panel__toggle {
  min-width: 18px;
  text-align: center;
  line-height: 1;
}

.collage-images {
  min-width: 0;
}

.collage-image-item {
  min-width: 0;
  aspect-ratio: 7/5;
}

.collage-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.collage-image-meta {
  min-width: 0;
}

.collage-image-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collage-empty {
  text-align: center;
}

.collage-field {
  width: 100%;
  min-width: 0;
}

.collage-help {
  line-height: 1.7;
}

.collage-actions {
  margin-top: auto;
}

.collage-actions :deep(.collage-actions__danger .txt-themeRed),
.collage-actions__danger {
  color: var(--themeRed) !important;
}

.collage-workspace {
  min-width: 0;
  height: 100%;
  overflow: auto;
}

.collage-preview-head {
  min-width: 0;
}

.collage-canvas-wrap {
  position: relative;
  min-height: 0;
  overflow: auto;
  background:
    linear-gradient(45deg, var(--normalText5) 25%, var(--normalText0) 25%),
    linear-gradient(-45deg, var(--normalText5) 25%, var(--normalText0) 25%),
    linear-gradient(45deg, var(--normalText0) 75%, var(--normalText5) 75%),
    linear-gradient(-45deg, var(--normalText0) 75%, var(--normalText5) 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
}

.collage-canvas-wrap canvas {
  display: block;
  flex: 0 0 auto;
  max-width: none;
  max-height: none;
  background-color: var(--themeSurface);
  border-radius: 18px;
  box-shadow: 0 24px 80px var(--themeBlack25);
}

.collage-canvas-wrap--empty {
  place-items: center !important;
}

.collage-canvas-empty-state {
  position: absolute;
  inset: 50% auto auto 50%;
  z-index: 8;
  width: min(420px, calc(100% - 32px));
  min-height: 240px;
  text-align: center;
  cursor: pointer;
  transform: translate(-50%, -50%);
  box-shadow: 0 24px 80px var(--themeBlack15);
  backdrop-filter: blur(16px);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.collage-canvas-empty-state:hover,
.collage-canvas-empty-state:focus-visible {
  border-color: var(--primary) !important;
  box-shadow:
    0 24px 80px var(--themeBlack20),
    0 0 0 4px var(--primary15);
  outline: none;
  transform: translate(-50%, -50%) scale(1.01);
}

.collage-selected-cell-overlay {
  position: absolute;
  z-index: 6;
  pointer-events: none;
  border: 2px solid var(--primary);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 70%) inset,
    0 0 0 99999px rgb(0 0 0 / 10%),
    0 0 26px var(--primary);
  transition:
    left 0.16s ease,
    top 0.16s ease,
    width 0.16s ease,
    height 0.16s ease,
    border-radius 0.16s ease;
}

.collage-canvas-options {
  z-index: 5;
  user-select: none;
}

.vertical-range {
  writing-mode: vertical-lr;
  direction: rtl !important;
  width: auto;
  height: 96px;
  accent-color: var(--normalText);
}

@media (max-width: 900px) {
  .collage-page {
    grid-template-columns: 1fr !important;
  }

  .collage-sidebar,
  .collage-workspace {
    height: auto;
  }

  .collage-workspace {
    min-height: 70vh;
  }
}
</style>
