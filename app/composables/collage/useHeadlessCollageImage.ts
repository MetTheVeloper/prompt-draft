import type {
  CollageCanvasAspectRatioLock,
  CollageCanvasAspectRatioOrientation,
  CollageCanvasOutputSize,
  CollageImageItem,
  CollageLayoutConstraintMode,
  CollageMode,
  BrandOverlayMode,
} from '~/types/collage'

import {
  COLLAGE_DEFAULT_BACKGROUND_COLOR,
  COLLAGE_DEFAULT_GAP,
  COLLAGE_DEFAULT_PADDING,
} from '~/constants/collage'

import { loadCollageImageFile } from '~/utils/collage/file'
import { useCollageRenderer } from '~/composables/collage/useCollageRenderer'
import { useCollageExport } from '~/composables/collage/useCollageExport'

function remoteImageName(url: string, index: number, mime: string) {
  try {
    const parsed = new URL(url)
    const pathName = parsed.pathname.split('/').filter(Boolean).pop() || ''
    if (pathName.includes('.')) return pathName
  } catch {
    // The caller validates URLs. Fall through to a deterministic name.
  }

  const extension = mime === 'image/png'
    ? 'png'
    : mime === 'image/jpeg'
      ? 'jpg'
      : mime === 'image/webp'
        ? 'webp'
        : 'img'

  return `collage-source-${index + 1}.${extension}`
}

async function loadRemoteCollageImage(url: string, index: number) {
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
    cache: 'default',
  })

  if (!response.ok) {
    throw new Error(`Remote collage image request failed (${response.status})`)
  }

  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('Remote collage source is not an image')
  }

  const file = new File(
    [blob],
    remoteImageName(url, index, blob.type),
    {
      type: blob.type,
      lastModified: Date.now(),
    },
  )

  const item = await loadCollageImageFile(file)
  return {
    ...item,
    name: file.name,
  }
}

export function useHeadlessCollageImage() {
  const componentInstance = getCurrentInstance()
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const activeMode = ref<CollageMode>('image')
  const images = ref<CollageImageItem[]>([])

  const padding = ref(COLLAGE_DEFAULT_PADDING)
  const gap = ref(COLLAGE_DEFAULT_GAP)
  const backgroundColor = ref(COLLAGE_DEFAULT_BACKGROUND_COLOR)
  const cellRadius = ref(28)
  const canvasDecorationsEnabled = ref(true)

  const imageShuffleSeed = ref(0)
  const layoutShuffleSeed = ref(0)
  const layoutConstraintMode = ref<CollageLayoutConstraintMode>('controlled')
  const canvasAspectRatioLock = ref<CollageCanvasAspectRatioLock>('auto')
  const canvasAspectRatioOrientation = ref<CollageCanvasAspectRatioOrientation>('vertical')
  const canvasOutputSize = ref<CollageCanvasOutputSize>('large')

  const brandOverlayEnabled = ref(false)
  const brandOverlayMode = ref<BrandOverlayMode>('overlay')
  const videoWidth = ref(1080)
  const videoHeight = ref(1920)
  const videoInterval = ref(2500)
  const videoTransitionDuration = ref(500)
  const videoEdgeBlur = ref(0)
  const videoRandom = ref(false)
  const videoLoop = ref(false)
  const normalizedVideoRepeat = computed(() => 1)

  const loading = ref(false)
  const loadError = ref('')
  const revision = ref(0)
  const sourceUrls = ref<string[]>([])
  const initialImageIds = ref<string[]>([])

  function createCompositeOverlayCanvas() {
    return Promise.resolve<HTMLCanvasElement | null>(null)
  }

  function createBrandFooterCanvas() {
    return Promise.resolve<HTMLCanvasElement | null>(null)
  }

  function drawOverlayCanvas() {}

  const renderer = useCollageRenderer({
    canvasRef,
    activeMode,
    images,
    padding,
    gap,
    backgroundColor,
    cellRadius,
    canvasDecorationsEnabled,
    imageShuffleSeed,
    layoutShuffleSeed,
    layoutConstraintMode,
    canvasAspectRatioLock,
    canvasAspectRatioOrientation,
    canvasOutputSize,
    brandOverlayEnabled,
    brandOverlayMode,
    videoWidth,
    videoHeight,
    videoInterval,
    videoTransitionDuration,
    videoEdgeBlur,
    videoRandom,
    videoLoop,
    normalizedVideoRepeat,
    getVideoSources: () => [],
    createCompositeOverlayCanvas,
    createBrandFooterCanvas,
    drawOverlayCanvas,
  })

  const exporter = useCollageExport({ canvasRef })

  const ready = computed(() => (
    !loading.value &&
    !loadError.value &&
    images.value.length > 0 &&
    Boolean(canvasRef.value)
  ))

  function disposeImages(items = images.value) {
    for (const item of items) {
      if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    }
  }

  async function render() {
    if (!images.value.length || !canvasRef.value) return
    await renderer.renderCanvas()
  }

  async function setSourceUrls(urls: string[]) {
    const normalized = urls.map(value => value.trim()).filter(Boolean)
    if (
      normalized.length === sourceUrls.value.length &&
      normalized.every((value, index) => value === sourceUrls.value[index]) &&
      images.value.length === normalized.length
    ) {
      await nextTick()
      await render()
      return
    }

    loading.value = true
    loadError.value = ''

    try {
      const loaded = await Promise.all(
        normalized.map((url, index) => loadRemoteCollageImage(url, index)),
      )

      disposeImages()
      images.value = loaded
      sourceUrls.value = normalized
      initialImageIds.value = loaded.map(item => item.id)
      imageShuffleSeed.value = 0
      layoutShuffleSeed.value = 0
      layoutConstraintMode.value = 'controlled'
      canvasAspectRatioLock.value = 'auto'
      canvasAspectRatioOrientation.value = 'vertical'
      revision.value += 1

      await nextTick()
      await render()
    } catch (error) {
      console.error('[Prompt Draft] remote collage image preflight failed', error)
      disposeImages()
      images.value = []
      sourceUrls.value = normalized
      initialImageIds.value = []
      loadError.value = error instanceof Error
        ? error.message
        : 'Remote collage image loading failed'
      revision.value += 1
    } finally {
      loading.value = false
    }
  }

  async function applyChange(change: () => void) {
    change()
    revision.value += 1
    await nextTick()
    await render()
  }

  function setLayoutConstraintMode(value: CollageLayoutConstraintMode) {
    if (layoutConstraintMode.value === value) return
    void applyChange(() => {
      layoutConstraintMode.value = value
    })
  }

  function setCanvasAspectRatioLock(value: CollageCanvasAspectRatioLock) {
    if (canvasAspectRatioLock.value === value) return
    void applyChange(() => {
      canvasAspectRatioLock.value = value
    })
  }

  function setCanvasAspectRatioOrientation(value: CollageCanvasAspectRatioOrientation) {
    if (canvasAspectRatioOrientation.value === value) return
    void applyChange(() => {
      canvasAspectRatioOrientation.value = value
    })
  }

  function shuffleLayout() {
    void applyChange(() => {
      layoutShuffleSeed.value += 1
    })
  }

  function shuffleImages() {
    void applyChange(() => {
      imageShuffleSeed.value += 1
    })
  }

  function moveImage(imageId: string, direction: -1 | 1) {
    const index = images.value.findIndex(item => item.id === imageId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= images.value.length) return

    void applyChange(() => {
      const next = [...images.value]
      const [item] = next.splice(index, 1)
      if (!item) return
      next.splice(nextIndex, 0, item)
      images.value = next
      imageShuffleSeed.value = 0
    })
  }

  function resetLayout() {
    void applyChange(() => {
      const byId = new Map(images.value.map(item => [item.id, item]))
      const restored = initialImageIds.value
        .map(id => byId.get(id))
        .filter((item): item is CollageImageItem => Boolean(item))

      if (restored.length === images.value.length) images.value = restored
      imageShuffleSeed.value = 0
      layoutShuffleSeed.value = 0
      layoutConstraintMode.value = 'controlled'
      canvasAspectRatioLock.value = 'auto'
      canvasAspectRatioOrientation.value = 'vertical'
    })
  }

  onMounted(() => {
    if (canvasRef.value) return

    const templateRefs = componentInstance?.proxy?.$refs as Record<string, unknown> | undefined
    const element = templateRefs?.['promptCollage.canvasRef']
    if (element instanceof HTMLCanvasElement) {
      canvasRef.value = element
    }
  })

  onBeforeUnmount(() => {
    renderer.stopVideoRenderer()
    renderer.disposeImagePips()
    disposeImages()
  })

  return {
    canvasRef,
    images,
    loading,
    loadError,
    ready,
    revision,
    previewInfo: renderer.previewInfo,
    isRendering: renderer.isRendering,
    layoutConstraintMode,
    canvasAspectRatioLock,
    canvasAspectRatioOrientation,
    canvasOutputSize,
    setSourceUrls,
    render,
    setLayoutConstraintMode,
    setCanvasAspectRatioLock,
    setCanvasAspectRatioOrientation,
    shuffleLayout,
    shuffleImages,
    moveImage,
    resetLayout,
    getExportBlob: exporter.getExportBlob,
  }
}
