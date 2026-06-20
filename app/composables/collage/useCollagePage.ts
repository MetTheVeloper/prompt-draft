import type {
  CollageMode,
} from '~/types/collage'

import {
  COLLAGE_DEFAULT_BACKGROUND_COLOR,
  COLLAGE_DEFAULT_GAP,
  COLLAGE_DEFAULT_PADDING,
} from '~/constants/collage'

import {
  useCollageImages,
} from '~/composables/collage/useCollageImages'

import {
  useCollageOverlay,
} from '~/composables/collage/useCollageOverlay'

import {
  useCollageExport,
} from '~/composables/collage/useCollageExport'

import {
  useCollageVideo,
} from '~/composables/collage/useCollageVideo'

import {
  useCollageRenderer,
} from '~/composables/collage/useCollageRenderer'

import {
  useCollageCanvasView,
} from '~/composables/collage/useCollageCanvasView'

export function useCollagePage() {
  const { orientation, mini } = useScreen()

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
      const canShowCollage =
        !mini.value || orientation.value === 'landscape'

      if (!canShowCollage) return

      scheduleRenderAfterRotate()
    },
    {
      flush: 'post',
    }
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
    ],
    async () => {
      if (activeMode.value !== 'image') return

      await rendererApi.renderCanvas()
      await reapplyCanvasView()
    },
    {
      deep: true,
      flush: 'post',
    }
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
    }
  )

  onMounted(async () => {
    window.addEventListener('paste', imagesApi.handlePaste)
    await rendererApi.renderCurrentMode()
    await reapplyCanvasView()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('paste', imagesApi.handlePaste)

    rendererApi.cancelVideoPreviewRender()

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