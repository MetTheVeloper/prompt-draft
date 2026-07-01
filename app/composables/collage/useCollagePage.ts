import type { GlobalMenuItem } from '~/composables/useMenu'

import type {
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

type CollageImagePanState = {
  pointerId: number
  imageId: string
  lastPoint: {
    x: number
    y: number
  }
}

export function useCollagePage() {
  const { orientation, mini } = useScreen()
  const { t } = useI18n()
  const { $menu } = useNuxtApp()

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

  const padding = ref(COLLAGE_DEFAULT_PADDING)
  const gap = ref(COLLAGE_DEFAULT_GAP)
  const backgroundColor = ref(COLLAGE_DEFAULT_BACKGROUND_COLOR)

  const imageShuffleSeed = ref(0)
  const layoutShuffleSeed = ref(0)
  const layoutConstraintMode = ref<CollageLayoutConstraintMode>('controlled')

  let imagePanState: CollageImagePanState | null = null
  let imagePanRenderFrame: number | null = null
  let imagePanRenderRunning = false
  let imagePanRenderQueued = false

  let renderAfterRotateTimer: ReturnType<typeof setTimeout> | null = null

  let renderCurrentModeProxy: (() => Promise<void>) | null = null
  let renderVideoPreviewProxy: (() => Promise<void>) | null = null

  async function requestRenderCurrentMode() {
    await renderCurrentModeProxy?.()
  }

  async function renderVideoPreviewForExport() {
    await renderVideoPreviewProxy?.()
  }

  function waitFrame() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }

  const imagesApi = useCollageImages({
    onChange: () => requestRenderCurrentMode(),
  })

  const overlayApi = useCollageOverlay({
    activeMode,
  })

  const exportApi = useCollageExport({
    canvasRef,
  })

  const videoApi = useCollageVideo({
    images: imagesApi.images,
    canvasRef,
    backgroundColor,

    renderVideoPreview: renderVideoPreviewForExport,
    waitFrame,

    createCompositeOverlayCanvas: overlayApi.createCompositeOverlayCanvas,
    drawOverlayCanvas: overlayApi.drawOverlayCanvas,

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
    backgroundColor,

    imageShuffleSeed,
    layoutShuffleSeed,
    layoutConstraintMode,

    videoWidth: videoApi.videoWidth,
    videoHeight: videoApi.videoHeight,
    videoInterval: videoApi.videoInterval,
    videoTransitionDuration: videoApi.videoTransitionDuration,
    videoEdgeBlur: videoApi.videoEdgeBlur,
    videoRandom: videoApi.videoRandom,
    videoLoop: videoApi.videoLoop,
    normalizedVideoRepeat: videoApi.normalizedVideoRepeat,

    getVideoSources: videoApi.getVideoSources,

    createCompositeOverlayCanvas: overlayApi.createCompositeOverlayCanvas,
    drawOverlayCanvas: overlayApi.drawOverlayCanvas,
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

  function canRunCollageShortcut(event: KeyboardEvent) {
    if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return false
    }

    const target = event.target as HTMLElement | null

    if (
      target?.closest(
        'input, textarea, select, button, [contenteditable="true"]',
      )
    ) {
      return false
    }

    return true
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
    rendererApi.clearSelectedImageCell()
  }

  function setLayoutConstraintMode(mode: CollageLayoutConstraintMode) {
    if (layoutConstraintMode.value === mode) return

    layoutConstraintMode.value = mode
    layoutShuffleSeed.value++
    rendererApi.clearSelectedImageCell()
  }

  function toggleLayoutConstraintMode() {
    setLayoutConstraintMode(
      layoutConstraintMode.value === 'controlled' ? 'free' : 'controlled',
    )
  }

  function handleCollageKeydown(event: KeyboardEvent) {
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
    rendererApi.handleCanvasPointerDown(event)

    if (activeMode.value !== 'image') return
    if (event.button !== 0 || event.isPrimary === false) return

    const selectedCell = rendererApi.selectedImageCell.value
    if (!selectedCell) return

    const transform = rendererApi.getImageTransform(selectedCell.image.id)
    if (transform.fit !== 'detail') return

    const point = rendererApi.getCanvasPointFromPointerEvent(event)
    if (!point) return

    imagePanState = {
      pointerId: event.pointerId,
      imageId: selectedCell.image.id,
      lastPoint: point,
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

    imagePanState.lastPoint = point

    if (
      rendererApi.panImageTransform(imagePanState.imageId, cell, deltaX, deltaY)
    ) {
      scheduleImagePanRender()
    }

    event.preventDefault()
  }

  function handleCanvasPointerUp(event: PointerEvent) {
    if (!imagePanState || imagePanState.pointerId !== event.pointerId) return

    stopImagePan(event)
  }

  async function setSelectedImageFitMode(fit: CollageImageFitMode) {
    rendererApi.setSelectedImageFitMode(fit)

    await rendererApi.renderCanvas()
  }

  async function resetSelectedImageTransform() {
    rendererApi.resetSelectedImageTransform()

    await rendererApi.renderCanvas()
  }

  function createCanvasContextMenuItems(): GlobalMenuItem[] {
    const hasImages = imagesApi.images.value.length > 0
    const hasMultipleImages = imagesApi.images.value.length > 1
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

    items.push(
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
        divider: true,
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
          void exportApi.downloadCanvas()
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
      {
        label: t('pages.collage.actions.clear'),
        icon: 'trash',
        color: 'red',
        disabled: !hasImages,
        handler: () => {
          imagesApi.clearImages()
        },
      },
    )

    return items
  }

  function handleCanvasContextMenu(event: MouseEvent) {
    if (activeMode.value !== 'image') return

    event.preventDefault()

    rendererApi.selectedImageCell.value =
      rendererApi.getImageCellAtPointerEvent(event)

    $menu.open({
      mode: 'point',
      event,
      options: {
        minWidth: 220,
        closeOnScroll: false,
      },
      items: createCanvasContextMenuItems(),
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
      imagesApi.images,
      overlayApi.watermarkPosition,
      overlayApi.watermarkSize,
      overlayApi.watermarkOpacity,
      padding,
      gap,
      backgroundColor,
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
    ],
    async () => {
      if (activeMode.value !== 'image') return

      await rendererApi.renderCanvas()
      await reapplyCanvasView()
    },
    {
      deep: true,
      flush: 'post',
    },
  )

  watch(
    [
      activeMode,
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
    },
    {
      flush: 'post',
    },
  )

  onMounted(async () => {
    window.addEventListener('paste', imagesApi.handlePaste)
    window.addEventListener('keydown', handleCollageKeydown)
    await rendererApi.renderCurrentMode()
    await reapplyCanvasView()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('paste', imagesApi.handlePaste)
    window.removeEventListener('keydown', handleCollageKeydown)

    rendererApi.cancelVideoPreviewRender()

    if (imagePanRenderFrame !== null) {
      cancelAnimationFrame(imagePanRenderFrame)
      imagePanRenderFrame = null
    }

    imagePanState = null
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

    padding,
    gap,
    backgroundColor,

    imageShuffleSeed,
    layoutShuffleSeed,
    layoutConstraintMode,
    shuffleSimilarImages,
    shuffleLayout,
    setLayoutConstraintMode,
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
    ...videoApi,
    ...rendererApi,

    setSelectedImageFitMode,
    resetSelectedImageTransform,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasContextMenu,

    // Keep image API explicit after spreads so nothing can accidentally override it.
    fileInputRef: imagesApi.fileInputRef,
    images: imagesApi.images,
    isDragging: imagesApi.isDragging,

    openFilePicker: imagesApi.openFilePicker,
    handleFileInput: imagesApi.handleFileInput,
    addFiles: imagesApi.addFiles,
    removeImage: imagesApi.removeImage,
    clearImages: imagesApi.clearImages,
    handleDrop: imagesApi.handleDrop,
    handleDragOver: imagesApi.handleDragOver,
    handleDragLeave: imagesApi.handleDragLeave,
  }
}
