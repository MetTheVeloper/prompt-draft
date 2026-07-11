<script setup lang="ts">
import ImageVectorizerPreview from '~/components/tools/ImageVectorizerPreview.vue'
import {
  ImageVectorizerProcessError,
  useImageVectorizer,
} from '~/composables/tools/useImageVectorizer'
import type { GlobalMenuItem } from '~/composables/useMenu'
import type {
  ImageVectorizerBackgroundPick,
  ImageVectorizerPaletteColor,
  ImageVectorizerSettings,
  ImageVectorizerSmoothMode,
} from '~/types/imageVectorizer'
import {
  DEFAULT_IMAGE_VECTORIZER_SETTINGS,
  loadStoredImageVectorizerSettings,
  parseImageVectorizerConfig,
  saveStoredImageVectorizerSettings,
  serializeImageVectorizerConfig,
} from '~/utils/vectorizer/config'

const MAX_COLOR_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 12, 16, 24, 32]
const LOW_RES_SCALE_OPTIONS = [0, 2, 4, 6, 8]
const SMOOTH_MODE_OPTIONS: ImageVectorizerSmoothMode[] = ['pre', 'post', 'both']

const { t } = useI18n()
const modal = useModal()
const { $modal } = useNuxtApp()
const { mobile, mini } = useScreen()
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
  progress,
  loadFile,
  process,
  cancelProcessing,
  clearOutput,
  reset,
  downloadSvg,
  downloadPng,
  copySvgCode,
  copyPng,
  pasteImageFromClipboard,
} = useImageVectorizer()

const controlsCols = computed(() => mobile.value ? 1 : mini.value ? 4 : 8)

const vectorizerAttrs = computed(() => ({
  rules: !sourceFile.value ? 'ccc' : 'csc',
  bg: 'surface0',
  p: [0, 24],
  class: [
    'image-vectorizer',
    'w100',
    'h100',
    { 'is-dragging': isDragging.value },
  ],
}))

const emptyStateAttrs = {
  rules: 'ccc',
  gap: 16,
  p: 28,
  bg: 'normal5',
  radius: 22,
  class: 'image-vectorizer-empty',
}

const emptyContentAttrs = {
  rules: 'ccc',
  gap: 6,
}

const contentGridAttrs = {
  cols: 1,
  gap: 24,
  rows: 'auto 1fr auto',
  class: 'w100 por mnh100',
}

const workspaceGridAttrs = computed(() => ({
  cols: mini.value ? 1 : 2,
  gap: 12,
  alignItems: 'start',
  class: 'w100 image-vectorizer-workspace',
}))

const previewPaneAttrs = {
  rules: 'css',
  gap: 0,
  class: 'w100 image-vectorizer-pane image-vectorizer-pane--preview',
}

const controlsPaneAttrs = {
  rules: 'css',
  gap: 0,
  class: 'w100 image-vectorizer-pane image-vectorizer-pane--controls',
}

const summaryAttrs = {
  rules: 'rbc',
  gap: 12,
  bg: 'surface15',
  bd: 'b8',
  p: 16,
  radius: [0, 0, 20, 20],
  class: 'w100 post tp0 zi50 bsh24',
}

const downloadAreaAttrs = {
  rules: 'csc',
  bg: 'surface15',
  bd: 'b8',
  gap: 8,
  p: [8],
  radius: [16, 16, 0, 0],
  class: 'image-vectorizer-download-area post b0 zi50 bsh24',
}

const summaryContentAttrs = {
  rules: 'ccs',
  gap: 4,
  class: 'image-vectorizer-summary-content',
}

const paletteAttrs = {
  rules: 'rsc',
  gap: 8,
  class: 'w100 image-vectorizer-palette',
}

const summaryActionsAttrs = {
  rules: 'rsc',
  gap: 8,
  class: 'image-vectorizer-summary-actions',
}

const controlsGridAttrs = computed(() => ({
  cols: controlsCols.value,
  gap: 12,
  alignContent: 'start',
  class: 'image-vectorizer-controls',
}))

const controlCardBaseAttrs = {
  rules: 'css',
  gap: 10,
  bg: 'normal5',
  p: 14,
  radius: 18,
}

const primaryControlCardAttrs = computed(() => ({
  ...controlCardBaseAttrs,
  class: [
    'image-vectorizer-control',
    `image-vectorizer-control--span-${mobile.value ? 1 : mini.value ? 4 : 4}`,
  ],
}))

const secondaryControlCardAttrs = computed(() => ({
  ...controlCardBaseAttrs,
  class: [
    'image-vectorizer-control',
    `image-vectorizer-control--span-${mobile.value ? 1 : mini.value ? 2 : 2}`,
  ],
}))

const controlHeaderAttrs = {
  rules: 'rbc',
  gap: 8,
  class: 'w100',
}

const backgroundActionsAttrs = {
  rules: 'rsc',
  gap: 8,
  class: 'w100 image-vectorizer-background-actions',
}

const fabActionButtonAttrs = {
  mode: 'flat',
  type: 'fab',
  size: 14,
  p: 10,
}

const maxColorOptions = computed(() => {
  return MAX_COLOR_OPTIONS.map((count) => ({
    label: t('tools.imageVectorizer.values.colors', { count }),
    value: count,
    icon: 'color-swatch',
  }))
})

const lowResScaleOptions = computed(() => {
  return LOW_RES_SCALE_OPTIONS.map((value) => ({
    label: value === 0
      ? t('tools.imageVectorizer.values.auto')
      : `${value}x`,
    value,
    icon: 'maximize',
  }))
})

const smoothModeOptions = computed(() => {
  return SMOOTH_MODE_OPTIONS.map((value) => ({
    value,
    icon: value === 'pre'
      ? 'forward-item'
      : value === 'post'
        ? 'backward-item'
        : 'path-square',
    label: t(`tools.imageVectorizer.values.smoothMode.${value}`),
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


const selectedLowResScale = computed<number>({
  get() {
    return settings.lowResScale
  },
  set(value) {
    const scale = Number(value)

    if (LOW_RES_SCALE_OPTIONS.includes(scale)) {
      settings.lowResScale = scale
    }
  },
})

const selectedSmoothMode = computed<ImageVectorizerSmoothMode>({
  get() {
    return settings.smoothMode
  },
  set(value) {
    if (SMOOTH_MODE_OPTIONS.includes(value)) {
      settings.smoothMode = value
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


const processingProgressLabel = computed(() => {
  return t(`tools.imageVectorizer.progress.${progress.value.stage}`)
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


function normalizeHexColor(value: string) {
  const normalized = value.trim().toUpperCase()
  return /^#[\dA-F]{6}$/.test(normalized) ? normalized : null
}

function getPaletteSourceHex(color: ImageVectorizerPaletteColor) {
  return (color.sourceHex || color.hex).toUpperCase()
}

function getPaletteColorTitle(color: ImageVectorizerPaletteColor) {
  const sourceHex = getPaletteSourceHex(color)
  const currentHex = color.hex.toUpperCase()
  const colorLabel = sourceHex === currentHex
    ? currentHex
    : `${sourceHex} → ${currentHex}`

  return `${colorLabel} · ${formatPercent(color.percent)}%`
}

function resetPaletteOverrides() {
  settings.paletteOverrides = {}
}

async function openPaletteColorPicker(
  event: MouseEvent,
  paletteColor: ImageVectorizerPaletteColor,
) {
  event.preventDefault()
  event.stopPropagation()

  const sourceHex = getPaletteSourceHex(paletteColor)
  const anchor = event.currentTarget as HTMLElement | null
  const isContextMenu = event.type === 'contextmenu'
  const presets = Array.from(new Set([
    sourceHex,
    ...(result.value?.palette.map((color) => color.hex.toUpperCase()) || []),
  ]))

  const selectedColor = await $modal.colorPicker({
    ...(isContextMenu
      ? {
          event,
          mode: 'point' as const,
        }
      : {
          anchor,
          mode: 'dropdown' as const,
          placement: 'bottom-start' as const,
        }),
    value: paletteColor.hex,
    defaultColor: sourceHex,
    presets,
    showPresets: true,
    showAlpha: false,
    showInput: true,
    presetsLabel: t('tools.imageVectorizer.palettePicker.presets'),
    confirmLabel: t('tools.imageVectorizer.palettePicker.confirm'),
    cancelLabel: t('tools.imageVectorizer.palettePicker.cancel'),
    width: 292,
    menuOptions: {
      zIndex: 46000,
    },
  })

  if (!selectedColor) return

  const nextHex = normalizeHexColor(selectedColor)

  if (!nextHex || nextHex === paletteColor.hex.toUpperCase()) return

  const nextOverrides = {
    ...settings.paletteOverrides,
  }

  if (nextHex === sourceHex) {
    delete nextOverrides[sourceHex]
  } else {
    nextOverrides[sourceHex] = nextHex
  }

  settings.paletteOverrides = nextOverrides
}


function isEditablePasteTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  if (target.isContentEditable) return true

  const tagName = target.tagName.toLowerCase()

  if (['input', 'textarea', 'select'].includes(tagName)) return true

  return !!target.closest('[contenteditable=""], [contenteditable="true"]')
}

function getImageFileFromClipboardEvent(event: ClipboardEvent) {
  const clipboardData = event.clipboardData

  if (!clipboardData) return null

  const item = Array.from(clipboardData.items || []).find((entry) => {
    return entry.kind === 'file' && entry.type.startsWith('image/')
  })

  const file = item?.getAsFile() || null

  if (!file) return null

  const extension = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'

  return new File([file], `clipboard-image-${Date.now()}.${extension}`, {
    type: file.type || 'image/png',
    lastModified: Date.now(),
  })
}

function confirmClipboardReplacement() {
  return new Promise<boolean>((resolve) => {
    let settled = false

    const finish = (value: boolean) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    modal.open({
      header: {
        icon: 'warning-2',
        title: t('tools.imageVectorizer.messages.replaceClipboardImageTitle'),
        color: 'orange',
        closeButton: false,
      },
      descriptions: t('tools.imageVectorizer.messages.replaceClipboardImageConfirm'),
      actions: [
        {
          label: t('tools.imageVectorizer.actions.keepCurrentImage'),
          color: 'normal',
          mode: 'flat',
          close: true,
          handler: () => {
            finish(false)
          },
        },
        {
          label: t('tools.imageVectorizer.actions.replaceWithClipboard'),
          color: 'orange',
          icon: 'gallery-add',
          close: true,
          handler: () => {
            finish(true)
          },
        },
      ],
      options: {
        width: 500,
        persistent: true,
        closeOnBackdrop: false,
        closeOnEsc: false,
      },
    })
  })
}

async function applyClipboardImage(file: File) {
  settings.backgroundColor = null
  resetPaletteOverrides()
  isPickingBackground.value = false
  lastStrictWarning.value = ''

  await selectFile(file)
}

async function handleWindowPaste(event: ClipboardEvent) {
  if (isEditablePasteTarget(event.target)) return

  const file = getImageFileFromClipboardEvent(event)

  if (!file) return

  event.preventDefault()

  if (sourceFile.value) {
    const confirmed = await confirmClipboardReplacement()

    if (!confirmed) return
  }

  await applyClipboardImage(file)
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
    resetPaletteOverrides()
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

  cancelProcessing()

  if (processingTimer.value) {
    clearTimeout(processingTimer.value)
  }

  processingTimer.value = setTimeout(() => {
    processingTimer.value = null
    processImage()
  }, 100)
}

function handleProcessError(error: unknown) {
  console.error('[ImageVectorizer] Processing failed:', error)

  const processError = error instanceof ImageVectorizerProcessError
    ? error
    : null

  if (processError?.code === 'CANCELLED') return

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
  resetPaletteOverrides()
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
    if (sourceFile.value) {
      const confirmed = await confirmClipboardReplacement()

      if (!confirmed) return
    }

    statusText.value = t('tools.imageVectorizer.status.loading')
    settings.backgroundColor = null
    resetPaletteOverrides()
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

  window.addEventListener('paste', handleWindowPaste)

  settingsHydrated.value = true
  saveStoredImageVectorizerSettings(settings)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', handleWindowPaste)
  if (processingTimer.value) clearTimeout(processingTimer.value)
  if (actionStatusTimer.value) clearTimeout(actionStatusTimer.value)
})
</script>

<template>
  <el-flex
    v-bind="vectorizerAttrs"
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

    <el-flex v-if="!sourceFile" v-bind="emptyStateAttrs">
      <el-icon icon="shapes" :size="36" />

      <el-flex v-bind="emptyContentAttrs">
        <el-text :size="16" :weight="600" icon="gallery-add">
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

    <el-grid v-else v-bind="contentGridAttrs">
      <el-flex v-bind="summaryAttrs">
        <el-flex v-bind="summaryContentAttrs">
          <el-text :size="16" :weight="700" icon="image">
            {{ stringShortner(sourceFile.name, 20, true) }}
          </el-text>

          <el-flex v-if="result" v-bind="paletteAttrs">
            <el-text :size="11" :weight="300" color="normal65" icon="document">
              {{ sourceDetails }}
            </el-text>

            <el-text :size="11" :weight="400" color="normal70" icon="color-swatch">
              {{ t('tools.imageVectorizer.result.palette') }}
            </el-text>

            <button
              v-for="color in result.palette"
              :key="color.sourceHex || color.hex"
              type="button"
              class="image-vectorizer-palette-color"
              :title="getPaletteColorTitle(color)"
              :aria-label="t('tools.imageVectorizer.actions.editPaletteColor', { color: color.hex })"
              :style="{ backgroundColor: color.hex }"
              @click.stop="openPaletteColorPicker($event, color)"
              @contextmenu.stop.prevent="openPaletteColorPicker($event, color)"
            />
          </el-flex>
        </el-flex>

        <el-flex v-bind="summaryActionsAttrs">
          <el-button
            icon="refresh"
            color="prim"
            :label="t('tools.imageVectorizer.actions.replace')"
            v-bind="fabActionButtonAttrs"
            @click="openFilePicker"
          />

          <el-button
            icon="trash"
            color="red"
            :label="t('tools.imageVectorizer.actions.clear')"
            v-bind="fabActionButtonAttrs"
            @click="clearSource"
          />
        </el-flex>
      </el-flex>

      <el-grid v-bind="workspaceGridAttrs">
        <el-flex v-bind="previewPaneAttrs">
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
        </el-flex>

        <el-flex v-bind="controlsPaneAttrs">
          <el-grid v-bind="controlsGridAttrs">
            <el-flex v-bind="primaryControlCardAttrs">
              <el-text :size="12" :weight="500" color="normal75" icon="color-swatch">
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

            <el-flex v-bind="primaryControlCardAttrs">
              <el-switch
                v-model="settings.strictColorLimit"
                :size="14"
                icon="warning-2"
                class="w100"
                :label="t('tools.imageVectorizer.controls.strictColorLimit')"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.strictColorLimitHint') }}
              </el-text>
            </el-flex>

            <el-flex v-bind="primaryControlCardAttrs">
              <el-switch
                v-model="settings.removeBackground"
                :size="14"
                icon="eraser"
                class="w100"
                :label="t('tools.imageVectorizer.controls.removeBackground')"
              />

              <el-flex v-bind="backgroundActionsAttrs">
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

            <el-flex v-bind="primaryControlCardAttrs">
              <el-switch
                v-model="settings.trimCanvas"
                :size="14"
                icon="crop"
                class="w100"
                :label="t('tools.imageVectorizer.controls.trimCanvas')"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.trimCanvasHint') }}
              </el-text>
            </el-flex>

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-flex v-bind="controlHeaderAttrs">
                <el-text :size="12" :weight="500" color="normal75" icon="magic-star">
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

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-flex v-bind="controlHeaderAttrs">
                <el-text :size="12" :weight="500" color="normal75" icon="maximize">
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

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-flex v-bind="controlHeaderAttrs">
                <el-text :size="12" :weight="500" color="normal75" icon="filter-remove">
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

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-flex v-bind="controlHeaderAttrs">
                <el-text :size="12" :weight="500" color="normal75" icon="brush-2">
                  {{ t('tools.imageVectorizer.controls.edgeCleanup') }}
                </el-text>

                <el-text :size="11" :weight="600" color="blue">
                  {{ settings.edgeCleanup }}px
                </el-text>
              </el-flex>

              <input
                v-model.number="settings.edgeCleanup"
                class="image-vectorizer-range"
                type="range"
                min="0"
                max="12"
                step="1"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.edgeCleanupHint') }}
              </el-text>
            </el-flex>

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-switch
                v-model="settings.removeEnclosedBackground"
                :size="14"
                icon="forbidden-2"
                class="w100"
                :label="t('tools.imageVectorizer.controls.removeEnclosedBackground')"
                :disable="!settings.removeBackground"
                :disabled="!settings.removeBackground"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.removeEnclosedBackgroundHint') }}
              </el-text>
            </el-flex>

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-switch
                v-model="settings.refineSvg"
                :size="14"
                icon="magic-star"
                class="w100"
                :label="t('tools.imageVectorizer.controls.refineSvg')"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.refineSvgHint') }}
              </el-text>
            </el-flex>

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-switch
                v-model="settings.enhanceLowRes"
                :size="14"
                icon="maximize"
                class="w100"
                :label="t('tools.imageVectorizer.controls.enhanceLowRes')"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.enhanceLowResHint') }}
              </el-text>
            </el-flex>

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-text :size="12" :weight="500" color="normal75" icon="maximize">
                {{ t('tools.imageVectorizer.controls.lowResScale') }}
              </el-text>

              <el-dropdown
                v-model="selectedLowResScale"
                :items="lowResScaleOptions"
                icon="maximize"
                :placeholder="t('tools.imageVectorizer.controls.lowResScale')"
                :menu-options="{ zIndex: 40000 }"
                :disable="!settings.enhanceLowRes"
                :disabled="!settings.enhanceLowRes"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.lowResScaleHint') }}
              </el-text>
            </el-flex>

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-flex v-bind="controlHeaderAttrs">
                <el-text :size="12" :weight="500" color="normal75" icon="brush-2">
                  {{ t('tools.imageVectorizer.controls.lowResRecovery') }}
                </el-text>

                <el-text :size="11" :weight="600" color="blue">
                  {{ settings.lowResRecovery }}%
                </el-text>
              </el-flex>

              <input
                v-model.number="settings.lowResRecovery"
                class="image-vectorizer-range"
                :class="{ 'is-disabled': !settings.enhanceLowRes }"
                type="range"
                min="0"
                max="100"
                step="1"
                :disabled="!settings.enhanceLowRes"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.lowResRecoveryHint') }}
              </el-text>
            </el-flex>

            <el-flex v-bind="secondaryControlCardAttrs">
              <el-flex v-bind="controlHeaderAttrs">
                <el-text :size="12" :weight="500" color="normal75" icon="brush-2">
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

            <el-flex v-if="settings.enhanceLowRes" v-bind="secondaryControlCardAttrs">
              <el-text :size="12" :weight="500" color="normal75" icon="path-square">
                {{ t('tools.imageVectorizer.controls.smoothMode') }}
              </el-text>

              <el-dropdown
                v-model="selectedSmoothMode"
                :items="smoothModeOptions"
                icon="path-square"
                :placeholder="t('tools.imageVectorizer.controls.smoothMode')"
                :menu-options="{ zIndex: 40000 }"
                :disable="!settings.enhanceLowRes"
                :disabled="!settings.enhanceLowRes"
              />

              <el-text :size="10" :weight="300" color="normal55">
                {{ t('tools.imageVectorizer.controls.smoothModeHint') }}
              </el-text>
            </el-flex>
          </el-grid>
        </el-flex>
      </el-grid>

      <el-flex v-bind="downloadAreaAttrs">
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

        <el-flex
          v-if="isLoading"
          rules="css"
          :gap="5"
          class="image-vectorizer-progress w100"
        >
          <el-flex rules="rbc" :gap="8" class="w100">
            <el-text :size="10" :weight="400" color="normal65">
              {{ processingProgressLabel }}
            </el-text>

            <el-text :size="10" :weight="600" color="blue">
              {{ Math.round(progress.percent) }}%
            </el-text>
          </el-flex>

          <div
            class="image-vectorizer-progress-track"
            role="progressbar"
            :aria-label="processingProgressLabel"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Math.round(progress.percent)"
          >
            <span
              class="image-vectorizer-progress-fill"
              :style="{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }"
            />
          </div>
        </el-flex>

        <el-flex :rules="mobile ? 'csc' : 'rbc'" class="w100">
          <el-text
            v-if="outputDetails"
            :size="12"
            :weight="400"
            color="normal70"
            class="image-vectorizer-result-text w100 tc"
          >
            {{ outputDetails }}
          </el-text>

          <el-text
            v-if="simplificationText"
            :size="12"
            :weight="300"
            color="normal55"
            class="image-vectorizer-result-text w100 tc"
          >
            {{ simplificationText }}
          </el-text>

          <el-text
            v-if="statusText"
            :size="12"
            :weight="300"
            color="normal65"
            class="image-vectorizer-result-text w100 tc"
          >
            {{ statusText }}
          </el-text>
        </el-flex>
      </el-flex>
    </el-grid>
  </el-flex>
</template>

<style scoped>
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

.image-vectorizer-summary-actions,
.image-vectorizer-background-actions,
.image-vectorizer-palette {
  flex-wrap: wrap;
}

.image-vectorizer-summary-content {
  min-width: 0;
}

.image-vectorizer-workspace,
.image-vectorizer-pane,
.image-vectorizer-controls,
.image-vectorizer-control {
  width: 100%;
  min-width: 0;
}

.image-vectorizer-workspace,
.image-vectorizer-pane {
  align-self: start;
}

.image-vectorizer-control--span-1 {
  grid-column: span 1;
}

.image-vectorizer-control--span-2 {
  grid-column: span 2;
}

.image-vectorizer-control--span-3 {
  grid-column: span 3;
}

.image-vectorizer-control--span-4 {
  grid-column: span 4;
}

.image-vectorizer-palette-color {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: inline-block;
  padding: 0;
  appearance: none;
  cursor: pointer;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  box-shadow: 0 3px 10px rgb(0 0 0 / 16%);
  transition: transform 140ms ease, box-shadow 140ms ease;
}

.image-vectorizer-palette-color:hover {
  transform: translateY(-1px) scale(1.08);
  box-shadow: 0 5px 14px rgb(0 0 0 / 22%);
}

.image-vectorizer-palette-color:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
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

.image-vectorizer-progress {
  overflow: hidden;
}

.image-vectorizer-progress-track {
  width: 100%;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.image-vectorizer-progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary, currentColor);
  transition: width 120ms linear;
}

.image-vectorizer-result-text {
  text-align: center;
}
</style>
