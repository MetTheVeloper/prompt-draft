import type { GlobalMenuItem } from '~/composables/useMenu'

import type {
  CollageCanvasAspectRatioLock,
  CollageImageFitMode,
  CollageLayoutConstraintMode,
  CollageMode,
} from '~/types/collage'

import {
  COLLAGE_DEFAULT_BACKGROUND_COLOR,
  COLLAGE_DEFAULT_GAP,
  COLLAGE_DEFAULT_PADDING,
} from '~/constants/collage'

import { useCollageImages } from '~/composables/collage/useCollageImages'

import { useCollageOverlay } from '~/composables/collage/useCollageOverlay'

import { useCollageExport } from '~/composables/collage/useCollageExport'

import { useCollageVideo } from '~/composables/collage/useCollageVideo'

import { useCollageRenderer } from '~/composables/collage/useCollageRenderer'

import { useCollageCanvasView } from '~/composables/collage/useCollageCanvasView'

import { usePageContextMenu } from '~/composables/usePageContextMenu'

type CollageImagePanState = {
  pointerId: number
  imageId: string
  lastPoint: {
    x: number
    y: number
  }
  moved: boolean
}

type PendingCellSelectionToggle = {
  pointerId: number
  imageId: string
}


type CollagePersistedSettings = {
  activeMode?: CollageMode
  brandOverlayEnabled?: boolean
  padding?: number
  gap?: number
  cellRadius?: number
  backgroundColor?: string
  canvasDecorationsEnabled?: boolean
  layoutConstraintMode?: CollageLayoutConstraintMode
  canvasAspectRatioLock?: CollageCanvasAspectRatioLock
  imageExportQuality?: number
}

const COLLAGE_SETTINGS_STORAGE_KEY = 'prompt-draft:collage:settings:v1'

const COLLAGE_MODE_OPTIONS: CollageMode[] = ['image', 'video']
const COLLAGE_LAYOUT_CONSTRAINT_MODE_OPTIONS: CollageLayoutConstraintMode[] = [
  'controlled',
  'free',
]
const COLLAGE_CANVAS_ASPECT_RATIO_LOCK_OPTIONS: CollageCanvasAspectRatioLock[] = [
  'auto',
  '1:1',
  '16:9',
  '9:16',
  '2:1',
  '3:2',
  '3:1',
  '3:7',
]

export function useCollagePage() {
  const { orientation, mini } = useScreen()
  const { t } = useI18n()
  const { openPageContextMenu, shouldIgnorePageContextMenu } =
    usePageContextMenu()

  const canvasRef = ref<HTMLCanvasElement | null>(null)

  const {
    canvasWrapRef,
    canvasZoom,
    canvasZoomMin,
    canvasZoomMax,
    canvasViewMode,
    canvasDisplayStyle,
    syncCanvasIntrinsicSize,
    setCanvasZoom,
    setCanvasActualSize,
    fitCanvasToWrap,
    reapplyCanvasView,
  } = useCollageCanvasView(canvasRef)

  const activeMode = ref<CollageMode>('image')
  const brandOverlayEnabled = ref(true)

  const padding = ref(COLLAGE_DEFAULT_PADDING)
  const gap = ref(COLLAGE_DEFAULT_GAP)
  const cellRadius = ref(28)
  const backgroundColor = ref(COLLAGE_DEFAULT_BACKGROUND_COLOR)
  const canvasDecorationsEnabled = ref(true)

  const imageShuffleSeed = ref(0)
  const layoutShuffleSeed = ref(0)
  const layoutConstraintMode = ref<CollageLayoutConstraintMode>('controlled')
  const canvasAspectRatioLock = ref<CollageCanvasAspectRatioLock>('auto')
  const imageExportQuality = ref(100)
  const selectedImageCellOverlayStyle = ref<Record<string, string>>({})

  function clampNumber(value: unknown, fallback: number, min: number, max: number) {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) return fallback

    return Math.max(min, Math.min(max, Math.round(parsed)))
  }

  function isValidHexColor(value: unknown) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
  }

  function applyPersistedCollageSettings() {
    if (!import.meta.client) return

    try {
      const raw = window.localStorage.getItem(COLLAGE_SETTINGS_STORAGE_KEY)
      if (!raw) return

      const settings = JSON.parse(raw) as CollagePersistedSettings

      if (COLLAGE_MODE_OPTIONS.includes(settings.activeMode as CollageMode)) {
        activeMode.value = settings.activeMode as CollageMode
      }

      if (typeof settings.brandOverlayEnabled === 'boolean') {
        brandOverlayEnabled.value = settings.brandOverlayEnabled
      }

      if (typeof settings.canvasDecorationsEnabled === 'boolean') {
        canvasDecorationsEnabled.value = settings.canvasDecorationsEnabled
      }

      padding.value = clampNumber(settings.padding, padding.value, 0, 96)
      gap.value = clampNumber(settings.gap, gap.value, 0, 64)
      cellRadius.value = clampNumber(settings.cellRadius, cellRadius.value, 0, 100)
      imageExportQuality.value = clampNumber(
        settings.imageExportQuality,
        imageExportQuality.value,
        30,
        100,
      )

      if (isValidHexColor(settings.backgroundColor)) {
        backgroundColor.value = settings.backgroundColor as string
      }

      if (
        COLLAGE_LAYOUT_CONSTRAINT_MODE_OPTIONS.includes(
          settings.layoutConstraintMode as CollageLayoutConstraintMode,
        )
      ) {
        layoutConstraintMode.value =
          settings.layoutConstraintMode as CollageLayoutConstraintMode
      }

      if (
        COLLAGE_CANVAS_ASPECT_RATIO_LOCK_OPTIONS.includes(
          settings.canvasAspectRatioLock as CollageCanvasAspectRatioLock,
        )
      ) {
        canvasAspectRatioLock.value =
          settings.canvasAspectRatioLock as CollageCanvasAspectRatioLock
      }
    } catch (error) {
      console.warn('[collage] Failed to restore persisted settings', error)
    }
  }

  function persistCollageSettings() {
    if (!import.meta.client) return

    const settings: CollagePersistedSettings = {
      activeMode: activeMode.value,
      brandOverlayEnabled: brandOverlayEnabled.value,
      padding: padding.value,
      gap: gap.value,
      cellRadius: cellRadius.value,
      backgroundColor: backgroundColor.value,
      canvasDecorationsEnabled: canvasDecorationsEnabled.value,
      layoutConstraintMode: layoutConstraintMode.value,
      canvasAspectRatioLock: canvasAspectRatioLock.value,
      imageExportQuality: normalizeImageExportQuality(),
    }

    try {
      window.localStorage.setItem(
        COLLAGE_SETTINGS_STORAGE_KEY,
        JSON.stringify(settings),
      )
    } catch (error) {
      console.warn('[collage] Failed to persist settings', error)
    }
  }

  applyPersistedCollageSettings()

  let imagePanState: CollageImagePanState | null = null
  let pendingCellSelectionToggle: PendingCellSelectionToggle | null = null
  let lastCanvasClick:
    | {
        imageId: string
        time: number
        x: number
        y: number
      }
    | null = null
  let imagePanRenderFrame: number | null = null
  let imagePanRenderRunning = false
  let imagePanRenderQueued = false

  let renderAfterRotateTimer: ReturnType<typeof setTimeout> | null = null

  let renderCurrentModeProxy: (() => Promise<void>) | null = null
  let renderVideoPreviewProxy: (() => Promise<void>) | null = null

  async function requestRenderCurrentMode() {
    await renderCurrentModeProxy?.()
    await updateSelectedImageCellOverlaySoon()
  }

  async function renderVideoPreviewForExport() {
    await renderVideoPreviewProxy?.()
  }

  function waitFrame() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }

  function clearSelectedImageCellOverlayStyle() {
    selectedImageCellOverlayStyle.value = {}
  }

  function normalizeCellRadius(value = cellRadius.value) {
    return Math.max(0, Math.min(100, Math.round(value || 0)))
  }

  function updateSelectedImageCellOverlayStyle() {
    const selectedCell = rendererApi?.selectedImageCell?.value
    const canvas = canvasRef.value

    if (!selectedCell || !canvas || !canvas.width || !canvas.height) {
      clearSelectedImageCellOverlayStyle()
      return
    }

    const wrap = canvas.parentElement

    if (!wrap) {
      clearSelectedImageCellOverlayStyle()
      return
    }

    const canvasRect = canvas.getBoundingClientRect()
    const wrapRect = wrap.getBoundingClientRect()

    if (!canvasRect.width || !canvasRect.height) {
      clearSelectedImageCellOverlayStyle()
      return
    }

    const scaleX = canvasRect.width / canvas.width
    const scaleY = canvasRect.height / canvas.height
    const scale = Math.min(scaleX, scaleY)

    selectedImageCellOverlayStyle.value = {
      left: `${canvasRect.left - wrapRect.left + wrap.scrollLeft + selectedCell.x * scaleX}px`,
      top: `${canvasRect.top - wrapRect.top + wrap.scrollTop + selectedCell.y * scaleY}px`,
      width: `${selectedCell.width * scaleX}px`,
      height: `${selectedCell.height * scaleY}px`,
      borderRadius: `${canvasDecorationsEnabled.value ? normalizeCellRadius() * scale : 0}px`,
    }
  }

  async function updateSelectedImageCellOverlaySoon() {
    await nextTick()
    await waitFrame()
    updateSelectedImageCellOverlayStyle()
  }

  const imagesApi = useCollageImages({
    onChange: () => requestRenderCurrentMode(),
  })

  const overlayApi = useCollageOverlay({
    activeMode,
  })

  async function createEnabledCompositeOverlayCanvas(
    canvasWidth: number,
    canvasHeight: number,
  ) {
    if (!brandOverlayEnabled.value) return null

    return overlayApi.createCompositeOverlayCanvas(canvasWidth, canvasHeight)
  }

  function drawEnabledOverlayCanvas(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    overlayCanvas: HTMLCanvasElement,
  ) {
    if (!brandOverlayEnabled.value) return

    overlayApi.drawOverlayCanvas(ctx, canvasWidth, canvasHeight, overlayCanvas)
  }

  const exportApi = useCollageExport({
    canvasRef,
  })

  const videoApi = useCollageVideo({
    images: imagesApi.images,
    canvasRef,
    backgroundColor,

    renderVideoPreview: renderVideoPreviewForExport,
    waitFrame,

    createCompositeOverlayCanvas: createEnabledCompositeOverlayCanvas,
    drawOverlayCanvas: drawEnabledOverlayCanvas,

    downloadVideoBlob: exportApi.downloadVideoBlob,
    shareVideoBlobNative: exportApi.shareVideoBlobNative,
    downloadMp4Blob: exportApi.downloadMp4Blob,
    shareMp4BlobNative: exportApi.shareMp4BlobNative,
  })

  const rendererApi = useCollageRenderer({
    canvasRef,
    activeMode,
    images: imagesApi.images,

    padding,
    gap,
    cellRadius,
    backgroundColor,
    canvasDecorationsEnabled,

    imageShuffleSeed,
    layoutShuffleSeed,
    layoutConstraintMode,
    canvasAspectRatioLock,

    videoWidth: videoApi.videoWidth,
    videoHeight: videoApi.videoHeight,
    videoInterval: videoApi.videoInterval,
    videoTransitionDuration: videoApi.videoTransitionDuration,
    videoEdgeBlur: videoApi.videoEdgeBlur,
    videoRandom: videoApi.videoRandom,
    videoLoop: videoApi.videoLoop,
    normalizedVideoRepeat: videoApi.normalizedVideoRepeat,

    getVideoSources: videoApi.getVideoSources,

    createCompositeOverlayCanvas: createEnabledCompositeOverlayCanvas,
    drawOverlayCanvas: drawEnabledOverlayCanvas,
  })

  renderCurrentModeProxy = rendererApi.renderCurrentMode
  renderVideoPreviewProxy = rendererApi.renderVideoPreview

  const canExport = computed(() => {
    return imagesApi.images.value.length > 0
  })

  const canExportImage = computed(() => {
    return activeMode.value === 'image' && imagesApi.images.value.length > 0
  })

  const canExportVideo = computed(() => {
    return (
      activeMode.value === 'video' &&
      imagesApi.images.value.length > 0 &&
      !videoApi.isRecordingVideo.value &&
      !videoApi.isExportingMp4.value
    )
  })


  function normalizeImageExportQuality(value = imageExportQuality.value) {
    return Math.max(30, Math.min(100, Math.round(value || 100)))
  }

  function getImageExportConfig() {
    const normalizedQuality = normalizeImageExportQuality()

    if (normalizedQuality >= 100) {
      return {
        mimeType: 'image/png',
        extension: 'png',
        quality: undefined,
      }
    }

    return {
      mimeType: 'image/jpeg',
      extension: 'jpg',
      quality: normalizedQuality / 100,
    }
  }

  function createCanvasBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality?: number,
  ) {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas export failed'))
          }
        },
        mimeType,
        quality,
      )
    })
  }

  function downloadImageBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = filename
    anchor.style.display = 'none'

    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  async function downloadCanvas() {
    const canvas = canvasRef.value

    if (!canvas || !canExportImage.value) return

    const config = getImageExportConfig()
    const blob = await createCanvasBlob(
      canvas,
      config.mimeType,
      config.quality,
    )

    downloadImageBlob(
      blob,
      `prompt-draft-collage-${Date.now()}.${config.extension}`,
    )
  }

  function isEditableKeyboardTarget(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null

    return !!target?.closest(
      'input, textarea, select, button, [contenteditable="true"]',
    )
  }

  function canRunCollageShortcut(event: KeyboardEvent) {
    if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return false
    }

    return !isEditableKeyboardTarget(event)
  }

  function canRunSelectedCellArrowPan(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return false
    if (isEditableKeyboardTarget(event)) return false

    return activeMode.value === 'image'
  }

  function shuffleSimilarImages() {
    if (activeMode.value !== 'image' || imagesApi.images.value.length < 2)
      return

    imageShuffleSeed.value++
  }

  function shuffleLayout() {
    if (activeMode.value !== 'image' || imagesApi.images.value.length < 2)
      return

    layoutShuffleSeed.value++
    clearSelectedImageCell()
  }

  function setLayoutConstraintMode(mode: CollageLayoutConstraintMode) {
    if (layoutConstraintMode.value === mode) return

    layoutConstraintMode.value = mode
    layoutShuffleSeed.value++
    clearSelectedImageCell()
  }

  function setCanvasAspectRatioLock(lock: CollageCanvasAspectRatioLock) {
    if (canvasAspectRatioLock.value === lock) return

    canvasAspectRatioLock.value = lock
    clearSelectedImageCell()
  }

  function selectImageCell(cell = rendererApi.selectedImageCell.value) {
    rendererApi.selectedImageCell.value = cell
    void updateSelectedImageCellOverlaySoon()
  }

  function clearSelectedImageCell() {
    rendererApi.clearSelectedImageCell()
    clearSelectedImageCellOverlayStyle()
  }

  function toggleLayoutConstraintMode() {
    setLayoutConstraintMode(
      layoutConstraintMode.value === 'controlled' ? 'free' : 'controlled',
    )
  }

  async function replaceSelectedImage() {
    const selectedCell = rendererApi.selectedImageCell.value
    if (!selectedCell) return

    imagesApi.openReplaceFilePicker(selectedCell.image.id)
  }

  async function removeSelectedImage() {
    const selectedCell = rendererApi.selectedImageCell.value
    if (!selectedCell) return

    const selectedImageId = selectedCell.image.id

    clearSelectedImageCell()
    rendererApi.resetImageTransform(selectedImageId)

    await imagesApi.removeImage(selectedImageId)
  }

  async function toggleSelectedImageFitMode() {
    rendererApi.toggleSelectedImageFitMode()

    await rendererApi.renderCanvas()
    await updateSelectedImageCellOverlaySoon()
  }

  function panSelectedImageWithKeyboard(event: KeyboardEvent) {
    if (!canRunSelectedCellArrowPan(event)) return false

    const selectedCell = rendererApi.selectedImageCell.value
    if (!selectedCell) return false

    const transform = rendererApi.getImageTransform(selectedCell.image.id)
    if (transform.fit !== 'detail') return false

    const step = event.shiftKey ? 48 : 16
    let deltaX = 0
    let deltaY = 0

    if (event.key === 'ArrowLeft') deltaX = -step
    else if (event.key === 'ArrowRight') deltaX = step
    else if (event.key === 'ArrowUp') deltaY = -step
    else if (event.key === 'ArrowDown') deltaY = step
    else return false

    event.preventDefault()

    if (rendererApi.panImageTransform(
      selectedCell.image.id,
      selectedCell,
      deltaX,
      deltaY,
    )) {
      scheduleImagePanRender()
    }

    return true
  }

  function handleCollageKeydown(event: KeyboardEvent) {
    if (panSelectedImageWithKeyboard(event)) return

    if (!canRunCollageShortcut(event)) return

    const key = event.key.toLowerCase()

    if (key === 's') {
      event.preventDefault()
      shuffleSimilarImages()
      return
    }

    if (key === 'l') {
      event.preventDefault()
      shuffleLayout()
      return
    }

    if (key === 'c') {
      event.preventDefault()
      toggleLayoutConstraintMode()
    }
  }

  function scheduleImagePanRender() {
    imagePanRenderQueued = true

    if (imagePanRenderFrame !== null || imagePanRenderRunning) return

    imagePanRenderFrame = requestAnimationFrame(async () => {
      imagePanRenderFrame = null
      imagePanRenderRunning = true
      imagePanRenderQueued = false

      try {
        await rendererApi.renderCanvas()
        updateSelectedImageCellOverlayStyle()
      } finally {
        imagePanRenderRunning = false

        if (imagePanRenderQueued) {
          scheduleImagePanRender()
        }
      }
    })
  }

  function stopImagePan(event?: PointerEvent) {
    if (event && imagePanState?.pointerId === event.pointerId) {
      const target = event.currentTarget as HTMLCanvasElement | null

      if (target?.hasPointerCapture?.(event.pointerId)) {
        target.releasePointerCapture(event.pointerId)
      }
    }

    imagePanState = null
  }

  function handleCanvasPointerDown(event: PointerEvent) {
    if (activeMode.value !== 'image') return
    if (event.button !== 0 || event.isPrimary === false) return

    const point = rendererApi.getCanvasPointFromPointerEvent(event)
    const hitCell = rendererApi.getImageCellAtPointerEvent(event)

    if (!point) return

    const previousSelectedCell = rendererApi.selectedImageCell.value
    const wasSelected =
      !!hitCell && previousSelectedCell?.image.id === hitCell.image.id

    const now = performance.now()
    const isDoubleClick =
      !!hitCell &&
      (event.detail >= 2 ||
        (!!lastCanvasClick &&
          lastCanvasClick.imageId === hitCell.image.id &&
          now - lastCanvasClick.time <= 320 &&
          Math.abs(point.x - lastCanvasClick.x) <= 32 &&
          Math.abs(point.y - lastCanvasClick.y) <= 32))

    lastCanvasClick = hitCell
      ? {
          imageId: hitCell.image.id,
          time: now,
          x: point.x,
          y: point.y,
        }
      : null

    if (isDoubleClick && hitCell) {
      lastCanvasClick = null
      pendingCellSelectionToggle = null
      stopImagePan(event)
      selectImageCell(hitCell)
      event.preventDefault()
      void toggleSelectedImageFitMode()
      return
    }

    if (!hitCell) {
      pendingCellSelectionToggle = null
      clearSelectedImageCell()
      return
    }

    if (wasSelected) {
      pendingCellSelectionToggle = {
        pointerId: event.pointerId,
        imageId: hitCell.image.id,
      }
    } else {
      pendingCellSelectionToggle = null
      selectImageCell(hitCell)
    }

    const transform = rendererApi.getImageTransform(hitCell.image.id)
    if (transform.fit !== 'detail') return

    imagePanState = {
      pointerId: event.pointerId,
      imageId: hitCell.image.id,
      lastPoint: point,
      moved: false,
    }

    const target = event.currentTarget as HTMLCanvasElement | null
    target?.setPointerCapture?.(event.pointerId)

    event.preventDefault()
  }

  function handleCanvasPointerMove(event: PointerEvent) {
    if (!imagePanState || imagePanState.pointerId !== event.pointerId) return

    const point = rendererApi.getCanvasPointFromPointerEvent(event)

    if (!point) {
      stopImagePan(event)
      return
    }

    const cell = rendererApi.getImageCellByImageId(imagePanState.imageId)

    if (!cell) {
      stopImagePan(event)
      return
    }

    const deltaX = point.x - imagePanState.lastPoint.x
    const deltaY = point.y - imagePanState.lastPoint.y

    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      imagePanState.moved = true
      pendingCellSelectionToggle = null
    }

    imagePanState.lastPoint = point

    if (
      rendererApi.panImageTransform(imagePanState.imageId, cell, deltaX, deltaY)
    ) {
      scheduleImagePanRender()
    }

    event.preventDefault()
  }

  function handleCanvasPointerUp(event: PointerEvent) {
    const activePanState =
      imagePanState?.pointerId === event.pointerId ? imagePanState : null

    if (
      pendingCellSelectionToggle?.pointerId === event.pointerId &&
      !activePanState?.moved
    ) {
      clearSelectedImageCell()
      pendingCellSelectionToggle = null
    }

    if (!activePanState) return

    stopImagePan(event)
  }

  async function setSelectedImageFitMode(fit: CollageImageFitMode) {
    rendererApi.setSelectedImageFitMode(fit)

    await rendererApi.renderCanvas()
    await updateSelectedImageCellOverlaySoon()
  }

  async function resetSelectedImageTransform() {
    rendererApi.resetSelectedImageTransform()

    await rendererApi.renderCanvas()
    await updateSelectedImageCellOverlaySoon()
  }

  function refreshPage() {
    if (!import.meta.client) return

    window.location.reload()
  }

  function createBaseContextMenuItems(): GlobalMenuItem[] {
    const hasImages = imagesApi.images.value.length > 0
    const hasMultipleImages = imagesApi.images.value.length > 1

    const items: GlobalMenuItem[] = [
      {
        label: t('pages.collage.dropzone.title'),
        icon: 'gallery-add',
        handler: () => {
          imagesApi.openFilePicker()
        },
      },
      {
        divider: true,
      },
    ]

    if (activeMode.value === 'image') {
      items.push(
        {
          label: t('pages.collage.layoutTools.shuffleSimilar'),
          icon: 'gallery',
          description: 'Shift + S',
          disabled: !hasMultipleImages,
          handler: () => {
            shuffleSimilarImages()
          },
        },
        {
          label: t('pages.collage.layoutTools.shuffleLayout'),
          icon: 'grid-1',
          description: 'Shift + L',
          disabled: !hasMultipleImages,
          handler: () => {
            shuffleLayout()
          },
        },
        {
          label: t('pages.collage.layoutTools.constraintModes.controlled'),
          icon: 'setting-2',
          description: t('pages.collage.layoutTools.constraintMode'),
          active: layoutConstraintMode.value === 'controlled',
          handler: () => {
            setLayoutConstraintMode('controlled')
          },
        },
        {
          label: t('pages.collage.layoutTools.constraintModes.free'),
          icon: 'setting-2',
          description: t('pages.collage.layoutTools.constraintMode'),
          active: layoutConstraintMode.value === 'free',
          handler: () => {
            setLayoutConstraintMode('free')
          },
        },
        {
          divider: true,
        },
        {
          label: t('pages.collage.actions.save'),
          icon: 'ram',
          disabled: !canExportImage.value,
          handler: () => {
            void downloadCanvas()
          },
        },
        {
          label: t('pages.collage.actions.copy'),
          icon: 'document-copy',
          disabled: !canExportImage.value,
          handler: () => {
            void exportApi.copyCanvas()
          },
        },
      )
    } else {
      items.push({
        label: t('pages.collage.actions.exportMp4'),
        icon: 'video-play',
        disabled: !canExportVideo.value,
        handler: () => {
          void videoApi.exportSliderMp4()
        },
      })
    }

    items.push(
      {
        label: t('pages.collage.actions.clear'),
        icon: 'trash',
        color: 'red',
        disabled: !hasImages,
        handler: () => {
          imagesApi.clearImages()
        },
      },
      {
        divider: true,
      },
      {
        label: t('pages.collage.actions.refreshPage'),
        icon: 'refresh',
        handler: () => {
          refreshPage()
        },
      },
    )

    return items
  }

  function createCanvasContextMenuItems(): GlobalMenuItem[] {
    const selectedCell = rendererApi.selectedImageCell.value

    const items: GlobalMenuItem[] = []

    if (selectedCell) {
      items.push(
        {
          label: t('pages.collage.preview.selectedCell', {
            name: selectedCell.image.name,
          }),
          icon: 'gallery',
          disabled: true,
        },
        {
          divider: true,
        },
      )
    }

    if (selectedCell) {
      items.push(
        {
          label: t('pages.collage.actions.replaceImage'),
          icon: 'refresh-2',
          handler: () => {
            void replaceSelectedImage()
          },
        },
        {
          label: t('pages.collage.actions.removeImage'),
          icon: 'trash',
          color: 'red',
          handler: () => {
            void removeSelectedImage()
          },
        },
        {
          divider: true,
        },
      )
    }

    if (selectedCell) {
      const selectedTransform = rendererApi.getImageTransform(
        selectedCell.image.id,
      )

      items.push(
        {
          label: t('pages.collage.imageFit.cover'),
          icon: 'gallery',
          description: t('pages.collage.imageFit.mode'),
          active: selectedTransform.fit === 'cover',
          handler: () => {
            void setSelectedImageFitMode('cover')
          },
        },
        {
          label: t('pages.collage.imageFit.detail'),
          icon: 'scan',
          description: t('pages.collage.imageFit.mode'),
          active: selectedTransform.fit === 'detail',
          handler: () => {
            void setSelectedImageFitMode('detail')
          },
        },
        {
          label: t('pages.collage.imageFit.resetPosition'),
          icon: 'rotate-left',
          disabled: !rendererApi.hasCustomImageTransform(selectedCell.image.id),
          handler: () => {
            void resetSelectedImageTransform()
          },
        },
        {
          divider: true,
        },
      )
    }

    items.push(...createBaseContextMenuItems())

    return items
  }

  function handleCanvasContextMenu(event: MouseEvent) {
    if (activeMode.value !== 'image') {
      handlePageContextMenu(event)
      return
    }

    selectImageCell(rendererApi.getImageCellAtPointerEvent(event))

    openPageContextMenu(event, {
      minWidth: 220,
      closeOnScroll: false,
      items: createCanvasContextMenuItems(),
    })
  }

  function handleCanvasWrapPointerDown(event: PointerEvent) {
    if (activeMode.value !== 'image') return
    if (event.button !== 0 || event.isPrimary === false) return

    clearSelectedImageCell()
  }

  function handlePageContextMenu(event: MouseEvent) {
    if (shouldIgnorePageContextMenu(event)) return

    if (activeMode.value === 'image') {
      clearSelectedImageCell()
    }

    openPageContextMenu(event, {
      minWidth: 220,
      closeOnScroll: false,
      items: createBaseContextMenuItems(),
      fallbackItems: [
        {
          label: t('pages.collage.actions.refreshPage'),
          icon: 'refresh',
          handler: () => {
            refreshPage()
          },
        },
      ],
    })
  }

  function scheduleRenderAfterRotate() {
    if (!imagesApi.images.value.length) return

    if (renderAfterRotateTimer) {
      clearTimeout(renderAfterRotateTimer)
    }

    renderAfterRotateTimer = setTimeout(async () => {
      renderAfterRotateTimer = null

      await nextTick()
      await waitFrame()
      await waitFrame()

      if (!canvasRef.value) return

      await rendererApi.renderCanvas()
      await reapplyCanvasView()
      await updateSelectedImageCellOverlaySoon()
    }, 120)
  }

  watch(
    [orientation, mini],
    () => {
      const canShowCollage = !mini.value || orientation.value === 'landscape'

      if (!canShowCollage) return

      scheduleRenderAfterRotate()
    },
    {
      flush: 'post',
    },
  )

  watch(
    [
      activeMode,
      brandOverlayEnabled,
      imagesApi.images,
      overlayApi.watermarkPosition,
      overlayApi.watermarkSize,
      overlayApi.watermarkOpacity,
      padding,
      gap,
      cellRadius,
      backgroundColor,
      canvasDecorationsEnabled,
      overlayApi.brandOverlayTheme,
      overlayApi.telegramPostId,
      overlayApi.brandOverlayGap,
      overlayApi.textOverlayEnabled,
      overlayApi.textOverlayText,
      overlayApi.textOverlayFontSize,
      overlayApi.textOverlayFontFamily,
      overlayApi.textOverlayFontWeight,
      overlayApi.textOverlayColor,
      overlayApi.textOverlayGap,
      overlayApi.textOverlayMaxWidthRatio,
      imageShuffleSeed,
      layoutShuffleSeed,
      layoutConstraintMode,
      canvasAspectRatioLock,
    ],
    async () => {
      if (activeMode.value !== 'image') return

      await rendererApi.renderCanvas()
      await reapplyCanvasView()
      await updateSelectedImageCellOverlaySoon()
    },
    {
      deep: true,
      flush: 'post',
    },
  )

  watch(
    [canvasZoom],
    () => {
      void updateSelectedImageCellOverlaySoon()
    },
    {
      flush: 'post',
    },
  )

  watch(
    [
      activeMode,
      brandOverlayEnabled,
      imagesApi.images,
      videoApi.videoWidth,
      videoApi.videoHeight,
      videoApi.videoInterval,
      videoApi.videoTransitionDuration,
      videoApi.videoEdgeBlur,
      videoApi.videoRandom,
      videoApi.videoLoop,
      videoApi.videoRepeat,
      backgroundColor,
      overlayApi.watermarkSize,
      overlayApi.brandOverlayTheme,
      overlayApi.telegramPostId,
      overlayApi.brandOverlayGap,
      overlayApi.textOverlayEnabled,
      overlayApi.textOverlayText,
      overlayApi.textOverlayFontSize,
      overlayApi.textOverlayFontFamily,
      overlayApi.textOverlayFontWeight,
      overlayApi.textOverlayColor,
      overlayApi.textOverlayGap,
      overlayApi.textOverlayMaxWidthRatio,
      overlayApi.overlaySafeAreaPreset,
      overlayApi.watermarkPosition,
    ],
    async () => {
      if (activeMode.value !== 'video') return

      await rendererApi.renderVideoPreview()
      await reapplyCanvasView()
      clearSelectedImageCellOverlayStyle()
    },
    {
      flush: 'post',
    },
  )


  watch(
    [
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
    ],
    () => {
      persistCollageSettings()
    },
    {
      flush: 'post',
    },
  )

  function handleWindowResize() {
    updateSelectedImageCellOverlayStyle()
  }

  onMounted(async () => {
    window.addEventListener('paste', imagesApi.handlePaste)
    window.addEventListener('keydown', handleCollageKeydown)
    window.addEventListener('resize', handleWindowResize)
    await rendererApi.renderCurrentMode()
    await reapplyCanvasView()
    await updateSelectedImageCellOverlaySoon()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('paste', imagesApi.handlePaste)
    window.removeEventListener('keydown', handleCollageKeydown)
    window.removeEventListener('resize', handleWindowResize)

    rendererApi.cancelVideoPreviewRender()

    if (imagePanRenderFrame !== null) {
      cancelAnimationFrame(imagePanRenderFrame)
      imagePanRenderFrame = null
    }

    imagePanState = null
    pendingCellSelectionToggle = null
    lastCanvasClick = null
    imagePanRenderRunning = false
    imagePanRenderQueued = false

    if (renderAfterRotateTimer) {
      clearTimeout(renderAfterRotateTimer)
      renderAfterRotateTimer = null
    }

    imagesApi.disposeImages()
  })

  return {
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

    imageShuffleSeed,
    layoutShuffleSeed,
    layoutConstraintMode,
    canvasAspectRatioLock,
    imageExportQuality,
    selectedImageCellOverlayStyle,
    shuffleSimilarImages,
    shuffleLayout,
    setLayoutConstraintMode,
    setCanvasAspectRatioLock,
    toggleLayoutConstraintMode,

    canExport,
    canExportImage,
    canExportVideo,

    canvasWrapRef,
    canvasZoom,
    canvasZoomMin,
    canvasZoomMax,
    canvasViewMode,
    canvasDisplayStyle,

    syncCanvasIntrinsicSize,
    setCanvasZoom,
    setCanvasActualSize,
    fitCanvasToWrap,
    reapplyCanvasView,

    ...imagesApi,
    ...overlayApi,
    ...exportApi,
    downloadCanvas,
    copyCanvas: exportApi.copyCanvas,
    ...videoApi,
    ...rendererApi,

    replaceSelectedImage,
    removeSelectedImage,
    setSelectedImageFitMode,
    toggleSelectedImageFitMode,
    resetSelectedImageTransform,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasContextMenu,
    handleCanvasWrapPointerDown,
    handlePageContextMenu,

    // Keep image API explicit after spreads so nothing can accidentally override it.
    fileInputRef: imagesApi.fileInputRef,
    images: imagesApi.images,
    isDragging: imagesApi.isDragging,

    openFilePicker: imagesApi.openFilePicker,
    openReplaceFilePicker: imagesApi.openReplaceFilePicker,
    handleFileInput: imagesApi.handleFileInput,
    addFiles: imagesApi.addFiles,
    replaceImage: imagesApi.replaceImage,
    removeImage: imagesApi.removeImage,
    clearImages: imagesApi.clearImages,
    handleDrop: imagesApi.handleDrop,
    handleDragOver: imagesApi.handleDragOver,
    handleDragLeave: imagesApi.handleDragLeave,
  }
}
