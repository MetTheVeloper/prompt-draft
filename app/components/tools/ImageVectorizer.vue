<script setup lang="ts">
import ImageVectorizerPreview from '~/components/tools/ImageVectorizerPreview.vue'
import {
  ImageVectorizerProcessError,
  useImageVectorizer,
} from '~/composables/tools/useImageVectorizer'
import type { GlobalMenuItem } from '~/composables/useMenu'
import type {
  ImageVectorizerBackgroundPick,
  ImageVectorizerSettings,
} from '~/types/imageVectorizer'
import {
  DEFAULT_IMAGE_VECTORIZER_SETTINGS,
  loadStoredImageVectorizerSettings,
  parseImageVectorizerConfig,
  saveStoredImageVectorizerSettings,
  serializeImageVectorizerConfig,
} from '~/utils/vectorizer/config'

const MAX_COLOR_OPTIONS = [2, 3, 4, 5, 6, 8, 12, 16, 24, 32]

const { t } = useI18n()
const modal = useModal()
const { mobile } = useScreen()
const { openPageContextMenu } = usePageContextMenu()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isPickingBackground = ref(false)
const statusText = ref('')
const processingTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const actionStatusTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const lastStrictWarning = ref('')
const settingsHydrated = ref(false)

const settings = reactive<ImageVectorizerSettings>({
  ...DEFAULT_IMAGE_VECTORIZER_SETTINGS,
})

const {
  source,
  sourceUrl,
  sourceFile,
  result,
  rasterUrl,
  rasterBlob,
  svgUrl,
  isLoading,
  loadFile,
  process,
  clearOutput,
  reset,
  downloadSvg,
  downloadPng,
  copySvgCode,
  copyPng,
  pasteImageFromClipboard,
} = useImageVectorizer()

const controlsCols = computed(() => mobile.value ? 1 : 2)

const maxColorOptions = computed(() => {
  return MAX_COLOR_OPTIONS.map((count) => ({
    label: t('tools.imageVectorizer.values.colors', { count }),
    value: count,
    icon: 'color-swatch',
  }))
})

const selectedMaxColors = computed<number>({
  get() {
    return settings.maxColors
  },
  set(value) {
    const count = Number(value)

    if (MAX_COLOR_OPTIONS.includes(count)) {
      settings.maxColors = count
    }
  },
})

const selectedBackgroundColor = computed(() => {
  return settings.backgroundColor || result.value?.backgroundColor || null
})

const sourceDetails = computed(() => {
  if (!source.value) return ''

  return t('tools.imageVectorizer.selected.details', {
    width: source.value.originalWidth,
    height: source.value.originalHeight,
    size: formatBytes(source.value.file.size),
  })
})

const outputDetails = computed(() => {
  if (!result.value) return ''

  return t('tools.imageVectorizer.result.details', {
    width: result.value.stats.outputWidth,
    height: result.value.stats.outputHeight,
    colors: result.value.stats.outputColorCount,
    regions: result.value.stats.regionCount,
  })
})

const simplificationText = computed(() => {
  if (!result.value) return ''

  const before = result.value.stats.originalPointCount
  const after = result.value.stats.simplifiedPointCount
  const reduction = before > 0
    ? Math.max(0, ((before - after) / before) * 100)
    : 0

  return t('tools.imageVectorizer.result.optimization', {
    before,
    after,
    percent: formatPercent(reduction),
  })
})

const contextMenuItems = computed<GlobalMenuItem[]>(() => [
  {
    label: t('tools.imageVectorizer.contextMenu.downloadSvg'),
    icon: 'receive-square',
    disabled: () => !result.value || isLoading.value,
    handler: () => downloadSvg(),
  },
  {
    label: t('tools.imageVectorizer.contextMenu.copySvg'),
    icon: 'copy',
    disabled: () => !result.value || isLoading.value,
    handler: copySvgFromMenu,
  },
  {
    label: t('tools.imageVectorizer.contextMenu.downloadPng'),
    icon: 'image',
    disabled: () => !rasterBlob.value || isLoading.value,
    handler: () => downloadPng(),
  },
  {
    label: t('tools.imageVectorizer.contextMenu.copyPng'),
    icon: 'copy',
    disabled: () => !rasterBlob.value || isLoading.value,
    handler: copyPngFromMenu,
  },
  {
    label: t('tools.imageVectorizer.contextMenu.pasteImage'),
    icon: 'gallery-add',
    handler: pasteImageFromMenu,
  },
  {
    label: t('tools.imageVectorizer.contextMenu.removeImage'),
    icon: 'trash',
    color: 'red',
    handler: clearSource,
  },
  {
    type: 'divider',
  },
  {
    label: t('tools.imageVectorizer.contextMenu.copyConfig'),
    icon: 'setting-2',
    handler: copyConfigFromMenu,
  },
  {
    label: t('tools.imageVectorizer.contextMenu.pasteConfig'),
    icon: 'document',
    handler: pasteConfigFromMenu,
  },
])

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** exponent

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function formatPercent(value: number) {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1)
}

function setActionStatus(message: string) {
  if (actionStatusTimer.value) {
    clearTimeout(actionStatusTimer.value)
  }

  statusText.value = message
  actionStatusTimer.value = setTimeout(() => {
    if (!isLoading.value) statusText.value = ''
    actionStatusTimer.value = null
  }, 2600)
}

function showClipboardError(error: unknown, fallbackKey: string) {
  console.error('[ImageVectorizer] Clipboard action failed:', error)

  const processError = error instanceof ImageVectorizerProcessError
    ? error
    : null
  let messageKey = fallbackKey

  if (processError?.code === 'NO_CLIPBOARD_IMAGE') {
    messageKey = 'tools.imageVectorizer.messages.noClipboardImage'
  } else if (
    processError?.code === 'CLIPBOARD_READ_UNAVAILABLE' ||
    processError?.code === 'CLIPBOARD_WRITE_UNAVAILABLE' ||
    processError?.code === 'IMAGE_CLIPBOARD_UNAVAILABLE'
  ) {
    messageKey = 'tools.imageVectorizer.messages.clipboardUnavailable'
  } else if (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'SecurityError')
  ) {
    messageKey = 'tools.imageVectorizer.messages.clipboardPermissionDenied'
  }

  modal.message({
    type: 'warning',
    message: t(messageKey),
    width: 500,
  })
}

function openFilePicker() {
  fileInput.value?.click()
}

function isImageFile(file: File) {
  if (file.type.startsWith('image/')) return true
  return /\.(avif|bmp|gif|jpe?g|png|webp)$/i.test(file.name)
}

async function selectFile(file: File) {
  if (!isImageFile(file)) {
    modal.message({
      type: 'warning',
      message: t('tools.imageVectorizer.messages.unsupportedFile'),
      width: 470,
    })
    return
  }

  try {
    statusText.value = t('tools.imageVectorizer.status.loading')
    settings.backgroundColor = null
    isPickingBackground.value = false
    lastStrictWarning.value = ''

    await loadFile(file)
    await processImage()
  } catch (error) {
    handleProcessError(error)
  }
}

function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  input.value = ''

  if (file) selectFile(file)
}

function handleDragEnter() {
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as Node | null

  if (relatedTarget && target.contains(relatedTarget)) return

  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  isDragging.value = false

  const file = Array.from(event.dataTransfer?.files || []).find(isImageFile)

  if (file) {
    selectFile(file)
  } else {
    modal.message({
      type: 'warning',
      message: t('tools.imageVectorizer.messages.unsupportedFile'),
      width: 470,
    })
  }
}

async function processImage() {
  if (!source.value) return

  try {
    statusText.value = t('tools.imageVectorizer.status.processing')
    await process({ ...settings })
    statusText.value = t('tools.imageVectorizer.status.ready')
    lastStrictWarning.value = ''
  } catch (error) {
    handleProcessError(error)
  }
}

function scheduleProcessing() {
  if (!source.value) return

  if (processingTimer.value) {
    clearTimeout(processingTimer.value)
  }

  processingTimer.value = setTimeout(() => {
    processImage()
  }, 260)
}

function handleProcessError(error: unknown) {
  console.error('[ImageVectorizer] Processing failed:', error)

  const processError = error instanceof ImageVectorizerProcessError
    ? error
    : null

  statusText.value = ''

  if (processError?.code === 'COLOR_LIMIT_EXCEEDED') {
    clearOutput()

    const signature = `${processError.detectedColorCount}-${processError.maxColors}`

    if (lastStrictWarning.value === signature) return

    lastStrictWarning.value = signature

    modal.message({
      type: 'warning',
      title: t('tools.imageVectorizer.messages.colorLimitTitle'),
      message: t('tools.imageVectorizer.messages.colorLimitExceeded', {
        detected: processError.detectedColorCount || 0,
        max: processError.maxColors || settings.maxColors,
      }),
      width: 520,
    })
    return
  }

  modal.message({
    type: 'error',
    message: t('tools.imageVectorizer.messages.processingFailed'),
    width: 490,
  })
}

function toggleBackgroundPicker() {
  if (!source.value || !settings.removeBackground) return

  isPickingBackground.value = !isPickingBackground.value
}

function handleBackgroundPick(value: ImageVectorizerBackgroundPick) {
  settings.backgroundColor = value.color
  isPickingBackground.value = false
}

function useAutomaticBackground() {
  settings.backgroundColor = null
  isPickingBackground.value = false
}

function clearSource() {
  if (processingTimer.value) {
    clearTimeout(processingTimer.value)
    processingTimer.value = null
  }

  reset()
  statusText.value = ''
  settings.backgroundColor = null
  isPickingBackground.value = false
  lastStrictWarning.value = ''
}

async function copySvgFromMenu() {
  try {
    await copySvgCode()
    setActionStatus(t('tools.imageVectorizer.status.svgCopied'))
  } catch (error) {
    showClipboardError(
      error,
      'tools.imageVectorizer.messages.clipboardWriteFailed',
    )
  }
}

async function copyPngFromMenu() {
  try {
    await copyPng()
    setActionStatus(t('tools.imageVectorizer.status.pngCopied'))
  } catch (error) {
    showClipboardError(
      error,
      'tools.imageVectorizer.messages.clipboardWriteFailed',
    )
  }
}

async function pasteImageFromMenu() {
  try {
    statusText.value = t('tools.imageVectorizer.status.loading')
    settings.backgroundColor = null
    isPickingBackground.value = false
    lastStrictWarning.value = ''

    await pasteImageFromClipboard()
    await processImage()
  } catch (error) {
    statusText.value = ''
    showClipboardError(
      error,
      'tools.imageVectorizer.messages.clipboardReadFailed',
    )
  }
}

async function copyConfigFromMenu() {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new ImageVectorizerProcessError(
        'CLIPBOARD_WRITE_UNAVAILABLE',
        'Text clipboard access is unavailable.',
      )
    }

    await navigator.clipboard.writeText(
      serializeImageVectorizerConfig({ ...settings }),
    )
    setActionStatus(t('tools.imageVectorizer.status.configCopied'))
  } catch (error) {
    showClipboardError(
      error,
      'tools.imageVectorizer.messages.clipboardWriteFailed',
    )
  }
}

async function pasteConfigFromMenu() {
  try {
    if (!navigator.clipboard?.readText) {
      throw new ImageVectorizerProcessError(
        'CLIPBOARD_READ_UNAVAILABLE',
        'Text clipboard access is unavailable.',
      )
    }

    const raw = await navigator.clipboard.readText()
    const nextSettings = parseImageVectorizerConfig(raw)

    Object.assign(settings, nextSettings)
    saveStoredImageVectorizerSettings(settings)
    setActionStatus(t('tools.imageVectorizer.status.configPasted'))
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'INVALID_JSON' || error.message === 'INVALID_CONFIG')
    ) {
      modal.message({
        type: 'warning',
        message: t('tools.imageVectorizer.messages.invalidConfig'),
        width: 500,
      })
      return
    }

    showClipboardError(
      error,
      'tools.imageVectorizer.messages.clipboardReadFailed',
    )
  }
}

function handleContextMenu(event: MouseEvent) {
  if (!sourceFile.value) return

  openPageContextMenu(event, {
    items: contextMenuItems.value,
    minWidth: 250,
    maxHeight: '80vh',
    closeOnScroll: false,
    zIndex: 45000,
    respectIgnoreSelector: false,
  })
}

watch(
  settings,
  () => {
    if (settingsHydrated.value) {
      saveStoredImageVectorizerSettings(settings)
    }

    scheduleProcessing()
  },
  { deep: true },
)

watch(
  () => settings.removeBackground,
  (enabled) => {
    if (!enabled) isPickingBackground.value = false
  },
)

onMounted(() => {
  const storedSettings = loadStoredImageVectorizerSettings()

  if (storedSettings) {
    Object.assign(settings, storedSettings)
  }

  settingsHydrated.value = true
  saveStoredImageVectorizerSettings(settings)
})

onBeforeUnmount(() => {
  if (processingTimer.value) clearTimeout(processingTimer.value)
  if (actionStatusTimer.value) clearTimeout(actionStatusTimer.value)
})
</script>

<template>
  <div
    class="image-vectorizer"
    :class="{ 'is-dragging': isDragging }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @contextmenu="handleContextMenu"
  >
    <input
      ref="fileInput"
      class="image-vectorizer-input"
      type="file"
      accept="image/*"
      @change="handleInputChange"
    />

    <el-flex
      v-if="!sourceFile"
      rules="ccc"
      :gap="16"
      :p="28"
      bg="normal5"
      :radius="22"
      class="image-vectorizer-empty"
    >
      <el-icon icon="shapes" :size="36" />

      <el-flex rules="ccc" :gap="6">
        <el-text :size="16" :weight="600" icon="gallery-add" marker="blue40">
          {{ t('tools.imageVectorizer.empty.title') }}
        </el-text>

        <el-text
          :size="13"
          :weight="300"
          color="normal70"
          class="image-vectorizer-empty-description"
        >
          {{ t('tools.imageVectorizer.empty.description') }}
        </el-text>
      </el-flex>

      <el-button
        color="prim"
        icon="add"
        :label="t('tools.imageVectorizer.empty.action')"
        :size="13"
        :p="[10, 14]"
        @click="openFilePicker"
      />
    </el-flex>

    <template v-else>
      <el-flex rules="csc" :gap="10" bg="normal5" :p="16" :radius="20">
        <el-flex rules="rbc" :gap="12" class="w100 image-vectorizer-summary-row">
          <el-flex rules="csc" :gap="4" class="image-vectorizer-summary-content">
            <el-text :size="16" :weight="700" icon="image" marker="blue40">
              {{ sourceFile.name }}
            </el-text>

            <el-text :size="11" :weight="300" color="normal65" icon="document">
              {{ sourceDetails }}
            </el-text>
          </el-flex>

          <el-flex rules="rsc" :gap="8" class="image-vectorizer-summary-actions">
            <el-button
              icon="refresh"
              mode="flat"
              color="prim"
              :label="t('tools.imageVectorizer.actions.replace')"
              :size="11"
              :p="[8, 10]"
              @click="openFilePicker"
            />

            <el-button
              icon="trash"
              mode="flat"
              color="red"
              :label="t('tools.imageVectorizer.actions.clear')"
              :size="11"
              :p="[8, 10]"
              @click="clearSource"
            />
          </el-flex>
        </el-flex>

        <el-flex v-if="result" rules="rsc" :gap="8" class="w100 image-vectorizer-palette">
          <el-text :size="11" :weight="400" color="normal70" icon="color-swatch">
            {{ t('tools.imageVectorizer.result.palette') }}
          </el-text>

          <span
            v-for="color in result.palette"
            :key="color.hex"
            class="image-vectorizer-palette-color"
            :title="`${color.hex} · ${formatPercent(color.percent)}%`"
            :style="{ backgroundColor: color.hex }"
          />
        </el-flex>
      </el-flex>

      <ImageVectorizerPreview
        :source-url="sourceUrl"
        :source-name="sourceFile.name"
        :raster-url="rasterUrl"
        :svg-url="svgUrl"
        :loading="isLoading"
        :picking-background="isPickingBackground"
        :background-color="selectedBackgroundColor"
        @pick-background="handleBackgroundPick"
      />

      <el-grid :cols="controlsCols" :gap="12" class="image-vectorizer-controls">
        <el-flex rules="csc" :gap="8" bg="normal5" :p="14" :radius="18" class="image-vectorizer-control">
          <el-text :size="12" :weight="500" color="normal75" icon="color-swatch" marker="blue40">
            {{ t('tools.imageVectorizer.controls.maxColors') }}
          </el-text>

          <el-dropdown
            v-model="selectedMaxColors"
            :items="maxColorOptions"
            icon="color-swatch"
            :placeholder="t('tools.imageVectorizer.controls.maxColors')"
            :menu-options="{ zIndex: 40000 }"
          />

          <el-text :size="10" :weight="300" color="normal55">
            {{ t('tools.imageVectorizer.controls.maxColorsHint') }}
          </el-text>
        </el-flex>

        <el-flex rules="csc" :gap="8" bg="normal5" :p="14" :radius="18" class="image-vectorizer-control">
          <el-flex rules="rbc" :gap="8" class="w100">
            <el-text :size="12" :weight="500" color="normal75" icon="magic-star" marker="blue40">
              {{ t('tools.imageVectorizer.controls.colorTolerance') }}
            </el-text>

            <el-text :size="11" :weight="600" color="blue">
              {{ settings.colorTolerance }}%
            </el-text>
          </el-flex>

          <input
            v-model.number="settings.colorTolerance"
            class="image-vectorizer-range"
            type="range"
            min="0"
            max="100"
            step="1"
          />

          <el-text :size="10" :weight="300" color="normal55">
            {{ t('tools.imageVectorizer.controls.colorToleranceHint') }}
          </el-text>
        </el-flex>

        <el-flex rules="csc" :gap="10" bg="normal5" :p="14" :radius="18" class="image-vectorizer-control">
          <el-switch
            v-model="settings.strictColorLimit"
            :size="14"
            icon="warning-2"
            :label="t('tools.imageVectorizer.controls.strictColorLimit')"
          />

          <el-text :size="10" :weight="300" color="normal55">
            {{ t('tools.imageVectorizer.controls.strictColorLimitHint') }}
          </el-text>
        </el-flex>

        <el-flex rules="csc" :gap="10" bg="normal5" :p="14" :radius="18" class="image-vectorizer-control">
          <el-switch
            v-model="settings.removeBackground"
            :size="14"
            icon="eraser"
            :label="t('tools.imageVectorizer.controls.removeBackground')"
          />

          <el-flex rules="rsc" :gap="8" class="w100 image-vectorizer-background-actions">
            <el-button
              icon="color-swatch"
              mode="flat"
              color="prim"
              :label="isPickingBackground ? t('tools.imageVectorizer.actions.cancelPicker') : t('tools.imageVectorizer.actions.pickBackground')"
              :disable="!settings.removeBackground"
              :disabled="!settings.removeBackground"
              :size="11"
              :p="[8, 10]"
              @click="toggleBackgroundPicker"
            />

            <el-button
              v-if="settings.backgroundColor"
              icon="refresh"
              mode="flat"
              :label="t('tools.imageVectorizer.actions.autoBackground')"
              :size="11"
              :p="[8, 10]"
              @click="useAutomaticBackground"
            />
          </el-flex>
        </el-flex>

        <el-flex rules="csc" :gap="10" bg="normal5" :p="14" :radius="18" class="image-vectorizer-control">
          <el-switch
            v-model="settings.trimCanvas"
            :size="14"
            icon="crop"
            :label="t('tools.imageVectorizer.controls.trimCanvas')"
          />

          <el-text :size="10" :weight="300" color="normal55">
            {{ t('tools.imageVectorizer.controls.trimCanvasHint') }}
          </el-text>
        </el-flex>

        <el-flex rules="csc" :gap="8" bg="normal5" :p="14" :radius="18" class="image-vectorizer-control">
          <el-flex rules="rbc" :gap="8" class="w100">
            <el-text :size="12" :weight="500" color="normal75" icon="maximize" marker="blue40">
              {{ t('tools.imageVectorizer.controls.padding') }}
            </el-text>

            <el-text :size="11" :weight="600" color="blue">
              {{ settings.padding }}px
            </el-text>
          </el-flex>

          <input
            v-model.number="settings.padding"
            class="image-vectorizer-range"
            :class="{ 'is-disabled': !settings.trimCanvas }"
            type="range"
            min="0"
            max="200"
            step="5"
            :disabled="!settings.trimCanvas"
          />
        </el-flex>

        <el-flex rules="csc" :gap="8" bg="normal5" :p="14" :radius="18" class="image-vectorizer-control">
          <el-flex rules="rbc" :gap="8" class="w100">
            <el-text :size="12" :weight="500" color="normal75" icon="filter-remove" marker="blue40">
              {{ t('tools.imageVectorizer.controls.minRegionSize') }}
            </el-text>

            <el-text :size="11" :weight="600" color="blue">
              {{ settings.minRegionSize }}px
            </el-text>
          </el-flex>

          <input
            v-model.number="settings.minRegionSize"
            class="image-vectorizer-range"
            type="range"
            min="0"
            max="100"
            step="1"
          />

          <el-text :size="10" :weight="300" color="normal55">
            {{ t('tools.imageVectorizer.controls.minRegionSizeHint') }}
          </el-text>
        </el-flex>

        <el-flex rules="csc" :gap="8" bg="normal5" :p="14" :radius="18" class="image-vectorizer-control">
          <el-flex rules="rbc" :gap="8" class="w100">
            <el-text :size="12" :weight="500" color="normal75" icon="brush-2" marker="blue40">
              {{ t('tools.imageVectorizer.controls.smooth') }}
            </el-text>

            <el-text :size="11" :weight="600" color="blue">
              {{ settings.smooth }}%
            </el-text>
          </el-flex>

          <input
            v-model.number="settings.smooth"
            class="image-vectorizer-range"
            type="range"
            min="0"
            max="100"
            step="1"
          />

          <el-text :size="10" :weight="300" color="normal55">
            {{ t('tools.imageVectorizer.controls.smoothHint') }}
          </el-text>
        </el-flex>
      </el-grid>

      <el-flex rules="csc" :gap="7" class="image-vectorizer-download-area">
        <el-button
          color="prim"
          icon="receive-square"
          class="image-vectorizer-download"
          :label="isLoading ? t('tools.imageVectorizer.actions.processing') : t('tools.imageVectorizer.actions.download')"
          :disable="isLoading || !result"
          :disabled="isLoading || !result"
          :effect="true"
          :size="14"
          :p="[12, 16]"
          @click="downloadSvg()"
        />

        <el-text
          v-if="outputDetails"
          :size="11"
          :weight="400"
          color="normal70"
          icon="shapes"
          marker="blue40"
          class="image-vectorizer-result-text"
        >
          {{ outputDetails }}
        </el-text>

        <el-text
          v-if="simplificationText"
          :size="10"
          :weight="300"
          color="normal55"
          icon="chart-square"
          class="image-vectorizer-result-text"
        >
          {{ simplificationText }}
        </el-text>

        <el-text
          v-if="statusText"
          :size="11"
          :weight="300"
          color="normal65"
          class="image-vectorizer-result-text"
        >
          {{ statusText }}
        </el-text>
      </el-flex>
    </template>
  </div>
</template>

<style scoped>
.image-vectorizer {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px;
}

.image-vectorizer.is-dragging {
  outline: 1px dashed currentColor;
  outline-offset: 8px;
  border-radius: 24px;
}

.image-vectorizer-input {
  display: none;
}

.image-vectorizer-empty {
  min-height: 240px;
  border: 1px dashed color-mix(in srgb, currentColor 20%, transparent);
  text-align: center;
}

.image-vectorizer-empty-description {
  max-width: 480px;
  line-height: 1.8;
}

.image-vectorizer-summary-row,
.image-vectorizer-summary-actions,
.image-vectorizer-background-actions,
.image-vectorizer-palette {
  flex-wrap: wrap;
}

.image-vectorizer-summary-content {
  min-width: 0;
}

.image-vectorizer-controls,
.image-vectorizer-control {
  width: 100%;
  min-width: 0;
}

.image-vectorizer-palette-color {
  width: 24px;
  height: 24px;
  display: inline-block;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  box-shadow: 0 3px 10px rgb(0 0 0 / 16%);
}

.image-vectorizer-range {
  width: 100%;
  min-width: 0;
  height: 28px;
  accent-color: var(--primary, currentColor);
  cursor: pointer;
}

.image-vectorizer-range.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.image-vectorizer-download-area,
.image-vectorizer-download {
  width: 100%;
}

.image-vectorizer-result-text {
  text-align: center;
}
</style>
