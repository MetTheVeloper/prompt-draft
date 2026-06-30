<script setup lang="ts">
import { useCollagePage } from '~/composables/collage/useCollagePage'
import type { ElDropdownValue } from '~/types/dropdown'
const { locale } = useI18n()
const {
  orientation,
  mini,

  canvasRef,

  activeMode,

  padding,
  gap,
  backgroundColor,

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
  activeMode.value = getDropdownString(value, 'image') as typeof activeMode.value
}

function updateTextOverlayFontDropdown(value: ElDropdownValue) {
  handleTextOverlayFontChange(createDropdownChangeEvent(value))
}

function updateBrandOverlayTheme(value: ElDropdownValue) {
  brandOverlayTheme.value = getDropdownString(value, 'white') as typeof brandOverlayTheme.value
}

function updateWatermarkPosition(value: ElDropdownValue) {
  watermarkPosition.value = getDropdownString(value) as typeof watermarkPosition.value
}

function updateOverlaySafeAreaPreset(value: ElDropdownValue) {
  handleOverlaySafeAreaChange(createDropdownChangeEvent(value))
}

function updateVideoQualityPreset(value: ElDropdownValue) {
  videoQualityPreset.value = getDropdownString(value, 'balanced') as typeof videoQualityPreset.value
}

function updateVideoPreset(value: ElDropdownValue) {
  videoPreset.value = getDropdownString(value, '1080x1920') as typeof videoPreset.value
  handleVideoPresetChange(createDropdownChangeEvent(value))
}

</script>

<template>
  <el-flex rules="ccc" v-if="orientation === 'portrait' && mini" class="w100 h100" :radius="24" :br="1" bt="d" bd="b4"
    bc="red">
    <el-icon :size="80" color="normal50" icon="rotate-left" />
    <el-text :size="14" color="normal80">
      {{ $t('pages.collage.rotateYourPhone') }}
    </el-text>
  </el-flex>
  <el-grid v-show="!mini || orientation === 'landscape'" type="main" class="ofh w100" :p="24"
    :cols="[mini ? '260px' : '360px', 'minmax(0, 1fr)', 'auto']" :gap="8" @drop="handleDrop" @dragover="handleDragOver"
    @dragleave="handleDragLeave">
    <!-- panel -->
    <el-grid type="aside" class="ofha mxh100" :radius="16" :cols="1" :gap="16" :p="16" bg="normal5">
      <el-grid class="collage-sidebar__head" :gap="6">
        <el-text type="h1" :size="22" weight="700">
          {{ $t('pages.collage.title') }}
        </el-text>

        <el-text type="p" :size="13" color="normal60">
          {{ $t('pages.collage.description') }}
        </el-text>
      </el-grid>

      <input ref="fileInputRef" class="collage-file-input" type="file" accept="image/*" multiple
        @change="handleFileInput">

      <el-flex rules="ccc" :class="{ 'collage-dropzone--active': isDragging }" :gap="6" :p="24" :radius="18" :br="1"
        bc="normal30" bg="normal5" @click="openFilePicker">
        <el-icon icon="gallery-add" :size="40" color="blue" />

        <el-text :size="15" weight="700">
          {{ $t('pages.collage.dropzone.title') }}
        </el-text>

        <el-text :size="12" color="normal55">
          {{ $t('pages.collage.dropzone.description') }}
        </el-text>
      </el-flex>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5">
        <el-flex rules="rbc" :gap="8">
          <el-text :size="14" weight="700" icon="gallery">
            {{ $t('pages.collage.images.title') }}
          </el-text>

          <el-text :size="12" color="normal55" localize>
            {{ images?.length || 0 }}
          </el-text>
        </el-flex>

        <el-grid v-if="images?.length" class="collage-images" :gap="10">
          <el-grid v-for="item in images || []" :key="item.id" class="collage-image-item"
            :cols="['52px', 'minmax(0, 1fr)', 'auto']" :gap="10" :p="8" :radius="14" bg="normal5" align-items="center">
            <img :src="item.url" :alt="item.name">

            <el-grid class="collage-image-meta" :gap="2">
              <el-text class="collage-image-name" :size="12" weight="700">
                {{ item.name }}
              </el-text>

              <el-text :size="11" color="normal55" localize>
                {{ item.width }}×{{ item.height }}
              </el-text>
            </el-grid>

            <el-button :label="$t('pages.collage.actions.remove')" :size="12" mode="flat" type="fab" color="red"
              icon="trash" @click="removeImage(item.id)" />
          </el-grid>
        </el-grid>

        <el-flex v-else rules="ccc" class="collage-empty" :p="14">
          <el-text :size="13" color="normal45">
            {{ $t('pages.collage.images.empty') }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5">
        <el-text :size="14" weight="700" icon="setting-2">
          {{ $t('pages.collage.outputMode.title') }}
        </el-text>

        <div class="collage-field">
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
        </div>
      </el-grid>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5">
        <el-text :size="14" weight="700" icon="drop">
          {{ $t('pages.collage.brand.title') }}
        </el-text>

        <el-flex type="label" class="collage-checkbox-field" rules="rsc" :gap="8">
          <input v-model="textOverlayEnabled" type="checkbox">

          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.textOverlay.enabled') }}
          </el-text>
        </el-flex>

        <div class="field">
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
        </div>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.textOverlay.text') }}
          </el-text>

          <textarea v-model="textOverlayText" :placeholder="$t('pages.collage.textOverlay.placeholder')" rows="3" />
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.textOverlay.size') }}
          </el-text>

          <input v-model.number="textOverlayFontSize" type="range" min="24" max="140" step="2" />
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.textOverlay.color') }}
          </el-text>

          <input v-model="textOverlayColor" type="color" />
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.textOverlay.gap') }}
          </el-text>

          <input v-model.number="textOverlayGap" type="range" min="0" max="160" step="2" />
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.telegramPostId') }}
          </el-text>

          <input v-model="telegramPostId" type="text"
            :placeholder="$t('pages.collage.brand.telegramPostIdPlaceholder')">
        </label>

        <div class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.logoColor') }}
          </el-text>

          <el-dropdown
            :model-value="brandOverlayTheme"
            :items="brandOverlayThemeOptions"
            :item-label="(theme) => $t(`pages.collage.brand.logoThemes.${theme}`)"
            :item-value="(theme) => theme"
            @update:model-value="updateBrandOverlayTheme"
          />
        </div>

        <div class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.position') }}
          </el-text>

          <el-dropdown
            :model-value="watermarkPosition"
            :items="watermarkPositions"
            :item-label="(position) => $t(`pages.collage.brand.positions.${position.value}`)"
            item-value="value"
            @update:model-value="updateWatermarkPosition"
          />
        </div>

        <div class="field">
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
        </div>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.brand.height', { value: watermarkSize }) }}
          </el-text>

          <input v-model.number="watermarkSize" type="range" min="48" max="260" step="4">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.brand.opacity', { value: Math.round(watermarkOpacity * 100) }) }}
          </el-text>

          <input v-model.number="watermarkOpacity" type="range" min="0.1" max="1" step="0.01">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.brand.gap', { value: brandOverlayGap }) }}
          </el-text>

          <input v-model.number="brandOverlayGap" type="range" min="0" max="48" step="2">
        </label>

        <el-text type="small" class="collage-help" :size="11" color="normal45">
          {{ $t('pages.collage.brand.help') }}
        </el-text>
      </el-grid>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5"
        v-if="activeMode === 'image'">
        <el-text :size="14" weight="700" icon="grid-1">
          {{ $t('pages.collage.canvas.title') }}
        </el-text>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.canvas.padding', { value: padding }) }}
          </el-text>

          <input v-model.number="padding" type="range" min="0" max="96" step="2">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.canvas.gap', { value: gap }) }}
          </el-text>

          <input v-model.number="gap" type="range" min="0" max="64" step="2">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.canvas.backgroundColor') }}
          </el-text>

          <input v-model="backgroundColor" type="color">
        </label>
      </el-grid>

      <el-grid v-if="activeMode === 'video'" class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10"
        bg="normal5">
        <el-text :size="14" weight="700" icon="video-play">
          {{ $t('pages.collage.video.title') }}
        </el-text>

        <div class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.video.quality') }}
          </el-text>

          <el-dropdown
            :model-value="videoQualityPreset"
            :items="videoQualityPresetOptions"
            :item-label="(preset) => $t(`pages.collage.video.qualityPresets.${preset}`)"
            :item-value="(preset) => preset"
            @update:model-value="updateVideoQualityPreset"
          />
        </div>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.video.backgroundMusic') }}
          </el-text>

          <input type="file" accept="audio/*" @change="handleVideoAudioInput">
        </label>

        <el-grid v-if="videoAudioFile" :gap="6">
          <el-text type="span" :size="11" color="normal55">
            {{ videoAudioLabel }}
          </el-text>

          <button type="button" @click="clearVideoAudio">
            {{ $t('pages.collage.video.removeAudio') }}
          </button>
        </el-grid>

        <el-flex v-if="videoAudioFile" type="label" class="collage-checkbox-field" rules="rsc" :gap="8">
          <input v-model="videoMusicVisualizationEnabled" type="checkbox">

          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.video.musicVisualizationSoftWave') }}
          </el-text>
        </el-flex>

        <label v-if="videoAudioFile && videoMusicVisualizationEnabled" class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.video.musicVisualizationHeight', {
              value: videoMusicVisualizationMaxHeightPercent
            }) }}
          </el-text>

          <input v-model.number="videoMusicVisualizationMaxHeightPercent" type="range" min="0" max="50" step="1">
        </label>

        <div class="collage-field">
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
        </div>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.video.width') }}
          </el-text>

          <input v-model.number="videoWidth" type="number" min="256" max="4096" step="2">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.video.height') }}
          </el-text>

          <input v-model.number="videoHeight" type="number" min="256" max="4096" step="2">
        </label>

        <el-flex rules="ccs" :gap="4" class="w100" :radius="18" bg="normal5" :p="12">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.video.calculatedDuration') }}
          </el-text>

          <el-text type="span" :size="11" color="normal55">
            {{ $t('pages.collage.video.durationMeta', {
              slides: videoTotalSlideCount, transitions: videoTransitionCount
            }) }}
          </el-text>

          <el-text type="span" :size="24" icon="clock-1" weight="700" color="normal90">
            {{ videoDurationLabel }}
          </el-text>
        </el-flex>

        <el-flex type="label" class="collage-checkbox-field" rules="rsc" :gap="8">
          <input v-model="videoLoop" type="checkbox">

          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.video.loop') }}
          </el-text>
        </el-flex>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.video.repeat', { value: normalizedVideoRepeat }) }}
          </el-text>

          <input v-model.number="videoRepeat" type="range" min="1" max="10" step="1">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.video.fps', { value: videoFps }) }}
          </el-text>

          <input v-model.number="videoFps" type="range" min="24" max="60" step="1">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.video.imageInterval', { value: videoInterval }) }}
          </el-text>

          <input v-model.number="videoInterval" type="range" min="800" max="8000" step="100">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.video.transition', { value: videoTransitionDuration }) }}
          </el-text>

          <input v-model.number="videoTransitionDuration" type="range" min="300" max="4000" step="100">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            {{ $t('pages.collage.video.edgeBlur', { value: videoEdgeBlur }) }}
          </el-text>

          <input v-model.number="videoEdgeBlur" type="range" min="0" max="400" step="10">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.canvas.backgroundColor') }}
          </el-text>

          <input v-model="backgroundColor" type="color">
        </label>

        <el-flex type="label" class="collage-checkbox-field" rules="rsc" :gap="8">
          <input v-model="videoRandom" type="checkbox" :disabled="videoLoop || normalizedVideoRepeat > 1">

          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.video.randomOrder') }}
          </el-text>
        </el-flex>

        <el-text v-if="videoLoop || normalizedVideoRepeat > 1" type="span" :size="11" color="normal55">
          {{ $t('pages.collage.video.randomOrderDisabled') }}
        </el-text>
      </el-grid>

      <el-grid v-if="activeMode === 'image'" :cols="3" :gap="10">
        <el-button :label="$t('pages.collage.actions.save')" :p="[12, 24]" :size="14" type="fab" icon="ram" color="prim"
          tooltip-position="top" :disable="!canExportImage" @click="downloadCanvas" />

        <el-button :label="$t('pages.collage.actions.copy')" :p="[12, 24]" :size="14" type="fab" icon="document-copy"
          color="normal10" tooltip-position="top" :disable="!canExportImage" @click="copyCanvas" />

        <el-button :label="$t('pages.collage.actions.clear')" class="collage-actions__danger" type="fab" icon="trash"
          tooltip-position="top" :p="[12, 24]" :size="14" mode="flat" color="normal10" :disable="!(images?.length)"
          @click="clearImages" />
      </el-grid>

      <el-grid v-else :cols="2" :gap="10">
        <el-button
          :label="isRecordingVideo ? $t('pages.collage.actions.recording') : $t('pages.collage.actions.exportWebm')"
          :p="[12, 24]" :size="14" type="fab" v-if="false" icon="video-play" color="prim" tooltip-position="top"
          :disable="!canExportVideo" @click="exportSliderVideo" />

        <el-button
          :label="isExportingMp4 ? $t('pages.collage.actions.exportingMp4') : $t('pages.collage.actions.exportMp4')"
          :p="[12, 24]" :size="14" type="fab" icon="video-play" color="prim" tooltip-position="top"
          :disable="!canExportVideo" @click="exportSliderMp4" />

        <el-button :label="$t('pages.collage.actions.clear')" class="collage-actions__danger" type="fab" icon="trash"
          tooltip-position="top" :p="[12, 24]" :size="14" mode="flat" color="normal10"
          :disable="!(images?.length) || isRecordingVideo" @click="clearImages" />
      </el-grid>
    </el-grid>
    <!-- main box -->
    <el-grid type="section" class="collage-workspace" :rows="['auto', 'minmax(0, 1fr)']" :gap="8" :p="0">
      <el-flex class="collage-preview-head por ofh" rules="rbc" :gap="16" :p="[14, 16]" :radius="18" :br="1"
        bc="normal10" bg="normal5">
        <div class="poa t0 l0 b0 bg-blue15" v-if="isExportingMp4" :style="{ width: `${mp4ExportProgress}%` }"></div>
        <el-flex rules="ccs" :gap="0">
          <el-text :size="14" weight="700" localize :icon="activeMode === 'video' ? 'video' : 'gallery'">
            {{ previewInfo.width }}×{{ previewInfo.height }}
          </el-text>
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
                  loop: videoLoop ? $t('pages.collage.preview.loopSuffix') : '',
                })
                : $t('pages.collage.preview.grid', { columns: previewInfo.columns, rows: previewInfo.rows })
            }}
          </el-text>
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

      <el-grid ref="canvasWrapRef" class="collage-canvas-wrap" :p="8" :radius="18" :br="1" bc="normal10"
        place-items="start center">
        <canvas ref="canvasRef" :style="canvasDisplayStyle" />
      </el-grid>
    </el-grid>

    <!-- canvas options -->
    <el-flex rules="cbc" :gap="6" :p="8" class="collage-canvas-options" :radius="8">
      <!-- zoom -->
      <el-flex rules="csc">
        <el-button :size="14" :p="8" :label="$t('pages.collage.zoom.fit')" icon="maximize-3" type="fab" mode="flat"
          @click="fitCanvasToWrap" />

        <el-button :size="14" :p="8" :label="$t('pages.collage.zoom.actual')" icon="scan" type="fab" mode="flat"
          @click="setCanvasActualSize" />

        <input class="vertical-range" type="range" :min="canvasZoomMin" :max="canvasZoomMax" :value="canvasZoom"
          @input="setCanvasZoom(Number(($event.target as HTMLInputElement).value))">

        <el-text :size="12">
          %{{ canvasZoom }}
        </el-text>
      </el-flex>

      <el-grid v-if="activeMode === 'image'" :cols="1" :gap="10">
        <el-button :label="$t('pages.collage.actions.save')" :p="[8]" :size="14" type="fab" icon="ram" color="prim"
          tooltip-position="top" :disable="!canExportImage" @click="downloadCanvas" />

        <el-button :label="$t('pages.collage.actions.copy')" :p="[8]" :size="14" mode="flat" type="fab"
          icon="document-copy" tooltip-position="top" :disable="!canExportImage" @click="copyCanvas" />

        <el-button :label="$t('pages.collage.actions.clear')" class="collage-actions__danger" type="fab" icon="trash"
          tooltip-position="top" :p="[8]" :size="14" mode="flat" color="red" :disable="!(images?.length)"
          @click="clearImages" />
      </el-grid>

      <el-grid v-else :cols="1" :gap="10">
        <el-button
          :label="isRecordingVideo ? $t('pages.collage.actions.recording') : $t('pages.collage.actions.exportWebm')"
          :p="[8]" :size="14" type="fab" v-if="false" icon="video-play" color="prim" tooltip-position="top"
          :disable="!canExportVideo" @click="exportSliderVideo" />

        <el-button
          :label="isExportingMp4 ? $t('pages.collage.actions.exportingMp4') : $t('pages.collage.actions.exportMp4')"
          :p="[8]" :size="14" type="fab" icon="video-play" color="prim" tooltip-position="top"
          :disable="!canExportVideo" @click="exportSliderMp4" />

        <el-button :label="$t('pages.collage.actions.clear')" class="collage-actions__danger" type="fab" icon="trash"
          tooltip-position="top" :p="[8]" :size="14" mode="flat" color="normal10"
          :disable="!(images?.length) || isRecordingVideo" @click="clearImages" />
      </el-grid>
    </el-flex>
  </el-grid>
</template>

<style scoped>
.collage-file-input {
  display: none;
}

.collage-dropzone {
  cursor: pointer;
  min-height: 112px;
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

.collage-images {
  min-width: 0;
}

.collage-image-item {
  min-width: 0;
}

.collage-image-item img {
  width: 52px;
  height: 52px;
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
  display: grid;
  gap: 8px;
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
    linear-gradient(45deg, var(--normalText15) 25%, transparent 25%),
    linear-gradient(-45deg, var(--normalText15) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--normalText10) 75%),
    linear-gradient(-45deg, transparent 75%, var(--normalText10) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
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

.collage-checkbox-field {
  width: fit-content;
  min-height: 28px;
  cursor: pointer;
  user-select: none;

  input[type='checkbox'] {
    flex: 0 0 auto;
    transform: translateY(0);
  }

  span {
    cursor: pointer;
    line-height: 1.2;
  }

  &:has(input:disabled) {
    opacity: 0.55;
    cursor: not-allowed;

    span,
    input {
      cursor: not-allowed;
    }
  }
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