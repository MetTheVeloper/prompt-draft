<script setup lang="ts">
import { useCollagePage } from '~/composables/collage/useCollagePage';

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

  downloadCanvas,
  copyCanvas,
  exportSliderVideo,
  exportSliderMp4,
} = useCollagePage()
</script>

<template>
  <el-flex rules="ccc" v-if="orientation === 'portrait' && mini" class="w100 h100" :radius="24" :br="1" bt="d" bd="b4"
    bc="red">
    <el-icon :size="80" color="normal50" icon="rotate-left" />
    <el-text :size="14" color="normal80">
      {{ $t('pages.collage.rotateYourPhone') }}
    </el-text>
  </el-flex>
  <el-grid v-show="!mini || orientation === 'landscape'" type="main" class="ofha w100"
    :cols="[mini ? '260px' : '360px', 'minmax(0, 1fr)']" :gap="8" @drop="handleDrop" @dragover="handleDragOver"
    @dragleave="handleDragLeave">
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
            {{ images.length }}
          </el-text>
        </el-flex>

        <el-grid v-if="images.length" class="collage-images" :gap="10">
          <el-grid v-for="item in images" :key="item.id" class="collage-image-item"
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
          Output Mode
        </el-text>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Mode
          </el-text>

          <select v-model="activeMode">
            <option value="image">
              Image Collage
            </option>

            <option value="video">
              Video Slider
            </option>
          </select>
        </label>
      </el-grid>

      <el-grid class="collage-panel" :gap="12" :p="14" :radius="18" :br="1" bc="normal10" bg="normal5">
        <el-text :size="14" weight="700" icon="drop">
          {{ $t('pages.collage.brand.title') }}
        </el-text>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            Text overlay
          </el-text>

          <input v-model="textOverlayEnabled" type="checkbox" />
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            Text font
          </el-text>

          <select :value="textOverlayFontValue" @change="handleTextOverlayFontChange">
            <optgroup v-for="group in textOverlayFontGroups" :key="group.label" :label="group.label">
              <option v-for="option in group.options" :key="getTextOverlayFontOptionValue(option)"
                :value="getTextOverlayFontOptionValue(option)">
                {{ option.label }}
              </option>
            </optgroup>
          </select>
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            Overlay text
          </el-text>

          <textarea v-model="textOverlayText" placeholder="مثلا: پرامپت تبدیل به سبک نقاشی آبرنگ" rows="3" />
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            Text size
          </el-text>

          <input v-model.number="textOverlayFontSize" type="range" min="24" max="140" step="2" />
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            Text color
          </el-text>

          <input v-model="textOverlayColor" type="color" />
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            Text / brand gap
          </el-text>

          <input v-model.number="textOverlayGap" type="range" min="0" max="80" step="2" />
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.telegramPostId') }}
          </el-text>

          <input v-model="telegramPostId" type="text"
            :placeholder="$t('pages.collage.brand.telegramPostIdPlaceholder')">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.logoColor') }}
          </el-text>

          <select v-model="brandOverlayTheme">
            <option value="white">
              {{ $t('pages.collage.brand.logoThemes.white') }}
            </option>

            <option value="black">
              {{ $t('pages.collage.brand.logoThemes.black') }}
            </option>
          </select>
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            {{ $t('pages.collage.brand.position') }}
          </el-text>

          <select v-model="watermarkPosition">
            <option v-for="position in watermarkPositions" :key="position.value" :value="position.value">
              {{ $t(`pages.collage.brand.positions.${position.value}`) }}
            </option>
          </select>
        </label>

        <label class="field">
          <el-text type="span" :size="12" color="normal70">
            Safe area
          </el-text>

          <select :value="overlaySafeAreaPreset" @change="handleOverlaySafeAreaChange">
            <option v-for="option in overlaySafeAreaOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

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
          Video Slider
        </el-text>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            MP4 Quality
          </el-text>

          <select v-model="videoQualityPreset">
            <option value="compact">
              Compact — smaller file
            </option>

            <option value="balanced">
              Balanced — recommended
            </option>

            <option value="high">
              High — larger file
            </option>
          </select>
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Background Music
          </el-text>

          <input type="file" accept="audio/*" @change="handleVideoAudioInput">
        </label>

        <el-grid v-if="videoAudioFile" :gap="6">
          <el-text type="span" :size="11" color="normal55">
            {{ videoAudioLabel }}
          </el-text>

          <button type="button" @click="clearVideoAudio">
            Remove audio
          </button>
        </el-grid>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Preset
          </el-text>

          <select v-model="videoPreset" @change="handleVideoPresetChange">
            <option value="1080x1920">
              Story / Reel — 1080×1920
            </option>

            <option value="1080x1350">
              Portrait Post — 1080×1350
            </option>

            <option value="1080x1080">
              Square Post — 1080×1080
            </option>

            <option value="1920x1080">
              Landscape — 1920×1080
            </option>
          </select>
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Width
          </el-text>

          <input v-model.number="videoWidth" type="number" min="256" max="4096" step="2">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Height
          </el-text>

          <input v-model.number="videoHeight" type="number" min="256" max="4096" step="2">
        </label>

        <el-grid :gap="4">
          <el-text type="span" :size="12" color="normal70">
            Calculated Duration
          </el-text>
          <el-text type="span" :size="11" color="normal55">
            {{ videoTotalSlideCount }} slide views · {{ videoTransitionCount }} transitions
          </el-text>
          <el-text type="span" :size="13" weight="700" color="normal90">
            {{ videoDurationLabel }}
          </el-text>
        </el-grid>

        <label class="collage-field collage-checkbox-field">
          <input v-model="videoLoop" type="checkbox">

          <el-text type="span" :size="12" color="normal70">
            Seamless loop back to first image
          </el-text>
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            Repeat: {{ normalizedVideoRepeat }}×
          </el-text>

          <input v-model.number="videoRepeat" type="range" min="1" max="10" step="1">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            FPS: {{ videoFps }}
          </el-text>

          <input v-model.number="videoFps" type="range" min="24" max="60" step="1">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            Image Interval: {{ videoInterval }}ms
          </el-text>

          <input v-model.number="videoInterval" type="range" min="800" max="8000" step="100">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            Transition: {{ videoTransitionDuration }}ms
          </el-text>

          <input v-model.number="videoTransitionDuration" type="range" min="300" max="4000" step="100">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70" localize>
            Edge Blur: {{ videoEdgeBlur }}
          </el-text>

          <input v-model.number="videoEdgeBlur" type="range" min="0" max="400" step="10">
        </label>

        <label class="collage-field">
          <el-text type="span" :size="12" color="normal70">
            Background Color
          </el-text>

          <input v-model="backgroundColor" type="color">
        </label>

        <label class="collage-field collage-checkbox-field">
          <input v-model="videoRandom" type="checkbox" :disabled="videoLoop || normalizedVideoRepeat > 1">

          <el-text type="span" :size="12" color="normal70">
            Random order
          </el-text>
        </label>

        <el-text v-if="videoLoop || normalizedVideoRepeat > 1" type="span" :size="11" color="normal55">
          Random order is disabled for loop/repeat so the sequence can stay seamless.
        </el-text>
      </el-grid>

      <el-grid v-if="activeMode === 'image'" :cols="3" :gap="10">
        <el-button :label="$t('pages.collage.actions.save')" :p="[12, 24]" :size="14" type="fab" icon="ram" color="prim"
          tooltip-position="top" :disable="!canExportImage" @click="downloadCanvas" />

        <el-button :label="$t('pages.collage.actions.copy')" :p="[12, 24]" :size="14" type="fab" icon="document-copy"
          color="normal10" tooltip-position="top" :disable="!canExportImage" @click="copyCanvas" />

        <el-button :label="$t('pages.collage.actions.clear')" class="collage-actions__danger" type="fab" icon="trash"
          tooltip-position="top" :p="[12, 24]" :size="14" mode="flat" color="normal10" :disable="!images.length"
          @click="clearImages" />
      </el-grid>

      <el-grid v-else :cols="2" :gap="10">
        <el-button :label="isRecordingVideo ? 'Recording...' : 'Export WebM'" :p="[12, 24]" :size="14" type="fab"
          v-if="false" icon="video-play" color="prim" tooltip-position="top" :disable="!canExportVideo"
          @click="exportSliderVideo" />

        <el-button :label="isExportingMp4 ? 'Exporting MP4...' : 'Export MP4'" :p="[12, 24]" :size="14" type="fab"
          icon="video-play" color="prim" tooltip-position="top" :disable="!canExportVideo" @click="exportSliderMp4" />

        <el-button :label="$t('pages.collage.actions.clear')" class="collage-actions__danger" type="fab" icon="trash"
          tooltip-position="top" :p="[12, 24]" :size="14" mode="flat" color="normal10"
          :disable="!images.length || isRecordingVideo" @click="clearImages" />

      </el-grid>

    </el-grid>

    <el-grid type="section" class="collage-workspace" :rows="['auto', 'minmax(0, 1fr)']" :gap="8" :p="0">
      <el-flex class="collage-preview-head" rules="rbc" :gap="16" :p="[14, 16]" :radius="18" :br="1" bc="normal10"
        bg="normal5">
        <el-flex rules="ccs" :gap="0">
          <el-text :size="14" weight="700" localize>
            {{ previewInfo.width }}×{{ previewInfo.height }}
          </el-text>
          <el-text type="span" :size="12" color="normal70">
            {{
              activeMode === 'video'
                ? `Video Slider · ${videoWidth}×${videoHeight} · ${videoDurationLabel} · ${videoFps}fps ·
            ${normalizedVideoRepeat}×${videoLoop ? ' · loop' : ''}`
                : $t('pages.collage.preview.grid', { columns: previewInfo.columns, rows: previewInfo.rows })
            }}
          </el-text>
        </el-flex>
        <el-text v-if="isRendering" :size="12" color="normal55">
          {{ $t('pages.collage.preview.rendering') }}
        </el-text>
        <el-text v-if="isRecordingVideo" :size="12" color="normal55">
          Recording video...
        </el-text>
        <el-text v-if="isExportingMp4" :size="12" color="normal55">
          {{ mp4ExportStatus }} · {{ mp4ExportProgress }}%
        </el-text>
      </el-flex>

      <el-grid class="collage-canvas-wrap" :p="22" :radius="24" :br="1" bc="normal10" place-items="start center">
        <canvas ref="canvasRef" />
      </el-grid>
    </el-grid>
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
  width: min(100%, 1000px);
  background-color: var(--themeSurface);
  height: max(100%, auto);
  border-radius: 18px;
  box-shadow: 0 24px 80px var(--themeBlack25);
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