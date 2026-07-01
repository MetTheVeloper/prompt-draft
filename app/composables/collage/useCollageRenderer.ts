import type { ComputedRef, Ref } from 'vue'

import {
  createCanvasSliderRenderer,
  type CanvasSliderImageSource,
  type CanvasSliderRenderer,
} from '~/utils/canvasSliderRenderer'

import { createCollageLayout } from '~/utils/collage/layout'

import { shuffleSimilarRatioCellImages } from '~/utils/collage/shuffle'

import {
  drawImageInCell,
  drawRoundedRect,
  getImageCellDrawMetrics,
  normalizeImageCellPan,
} from '~/utils/collage/drawing'

import type {
  CollageImageFitMode,
  CollageImageItem,
  CollageImageTransform,
  CollageLayoutCell,
  CollageLayoutConstraintMode,
  CollageLayoutResult,
  CollageMode,
} from '~/types/collage'

type UseCollageRendererOptions = {
  canvasRef: Ref<HTMLCanvasElement | null>
  activeMode: Ref<CollageMode>
  images: Ref<CollageImageItem[]>

  padding: Ref<number>
  gap: Ref<number>
  backgroundColor: Ref<string>

  imageShuffleSeed: Ref<number>
  layoutShuffleSeed: Ref<number>
  layoutConstraintMode: Ref<CollageLayoutConstraintMode>

  videoWidth: Ref<number>
  videoHeight: Ref<number>
  videoInterval: Ref<number>
  videoTransitionDuration: Ref<number>
  videoEdgeBlur: Ref<number>
  videoRandom: Ref<boolean>
  videoLoop: Ref<boolean>
  normalizedVideoRepeat: ComputedRef<number>

  getVideoSources: () => CanvasSliderImageSource[]

  createCompositeOverlayCanvas: (
    canvasWidth: number,
    canvasHeight: number,
  ) => Promise<HTMLCanvasElement | null>

  drawOverlayCanvas: (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    overlayCanvas: HTMLCanvasElement,
  ) => void
}

const DEFAULT_IMAGE_TRANSFORM: CollageImageTransform = {
  fit: 'cover',
  panX: 0,
  panY: 0,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function useCollageRenderer(options: UseCollageRendererOptions) {
  const isRendering = ref(false)
  const lastImageLayout = ref<CollageLayoutResult | null>(null)
  const selectedImageCell = ref<CollageLayoutCell | null>(null)
  const imageTransforms = ref<Record<string, CollageImageTransform>>({})

  const previewInfo = ref({
    width: 0,
    height: 0,
    ratio: 1,
    columns: 0,
    rows: 0,
  })

  let videoRenderer: CanvasSliderRenderer | null = null
  let videoPreviewRenderToken = 0

  function stopVideoRenderer() {
    videoRenderer?.destroy()
    videoRenderer = null
  }

  function cancelVideoPreviewRender() {
    videoPreviewRenderToken++
    stopVideoRenderer()
  }

  function drawVideoEmptyState() {
    const canvas = options.canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = options.videoWidth.value
    canvas.height = options.videoHeight.value

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = options.backgroundColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '500 44px sans-serif'
    ctx.fillText(
      'Add images to create video',
      canvas.width / 2,
      canvas.height / 2,
    )

    previewInfo.value = {
      width: canvas.width,
      height: canvas.height,
      ratio: canvas.width / canvas.height,
      columns: 0,
      rows: 0,
    }

    lastImageLayout.value = null
    selectedImageCell.value = null
  }

  async function renderVideoPreview() {
    const renderToken = ++videoPreviewRenderToken

    if (options.activeMode.value !== 'video') return

    await nextTick()

    if (
      renderToken !== videoPreviewRenderToken ||
      options.activeMode.value !== 'video'
    ) {
      return
    }

    const canvas = options.canvasRef.value
    if (!canvas) return

    stopVideoRenderer()
    lastImageLayout.value = null
    selectedImageCell.value = null

    if (!options.images.value.length) {
      drawVideoEmptyState()
      return
    }

    const width = Math.max(1, Math.round(options.videoWidth.value))
    const height = Math.max(1, Math.round(options.videoHeight.value))

    const overlayCanvas = await options.createCompositeOverlayCanvas(
      width,
      height,
    )

    if (
      renderToken !== videoPreviewRenderToken ||
      options.activeMode.value !== 'video'
    ) {
      return
    }

    const renderer = createCanvasSliderRenderer({
      canvas,
      sources: options.getVideoSources(),
      width,
      height,
      dpr: 1,
      interval: options.videoInterval.value,
      transitionDuration: options.videoTransitionDuration.value,
      edgeBlur: options.videoEdgeBlur.value,
      random:
        options.videoLoop.value || options.normalizedVideoRepeat.value > 1
          ? false
          : options.videoRandom.value,
      initialIndex: 0,
      backgroundColor: options.backgroundColor.value,

      onAfterDrawFrame: ({ canvas, ctx }) => {
        if (!overlayCanvas) return

        options.drawOverlayCanvas(
          ctx,
          canvas.width,
          canvas.height,
          overlayCanvas,
        )
      },
    })

    if (
      renderToken !== videoPreviewRenderToken ||
      options.activeMode.value !== 'video'
    ) {
      renderer.destroy()
      return
    }

    videoRenderer = renderer
    videoRenderer.setPointer(width / 2, height / 2)
    videoRenderer.start()

    previewInfo.value = {
      width,
      height,
      ratio: width / height,
      columns: 0,
      rows: 0,
    }
  }

  function clearSelectedImageCell() {
    selectedImageCell.value = null
  }

  function getCanvasPointFromPointerEvent(event: MouseEvent) {
    const canvas = options.canvasRef.value
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()

    if (!rect.width || !rect.height) return null

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function getImageCellAtCanvasPoint(x: number, y: number) {
    const layout = lastImageLayout.value
    if (!layout) return null

    return (
      layout.cells.find((cell) => {
        return (
          x >= cell.x &&
          x <= cell.x + cell.width &&
          y >= cell.y &&
          y <= cell.y + cell.height
        )
      }) || null
    )
  }

  function getImageCellAtPointerEvent(event: MouseEvent) {
    const point = getCanvasPointFromPointerEvent(event)
    if (!point) return null

    return getImageCellAtCanvasPoint(point.x, point.y)
  }

  function getImageCellByImageId(imageId: string) {
    return (
      lastImageLayout.value?.cells.find((cell) => cell.image.id === imageId) ||
      null
    )
  }

  function handleCanvasPointerDown(event: MouseEvent) {
    if (options.activeMode.value !== 'image') return

    selectedImageCell.value = getImageCellAtPointerEvent(event)
  }

  function getImageTransform(imageId: string): CollageImageTransform {
    return imageTransforms.value[imageId] || DEFAULT_IMAGE_TRANSFORM
  }

  function hasCustomImageTransform(imageId: string) {
    const transform = getImageTransform(imageId)

    return (
      transform.fit !== DEFAULT_IMAGE_TRANSFORM.fit ||
      transform.panX !== DEFAULT_IMAGE_TRANSFORM.panX ||
      transform.panY !== DEFAULT_IMAGE_TRANSFORM.panY
    )
  }

  function setImageTransform(
    imageId: string,
    transform: Partial<CollageImageTransform>,
  ) {
    const current = getImageTransform(imageId)

    imageTransforms.value = {
      ...imageTransforms.value,
      [imageId]: {
        fit: transform.fit || current.fit,
        panX: normalizeImageCellPan(transform.panX ?? current.panX),
        panY: normalizeImageCellPan(transform.panY ?? current.panY),
      },
    }
  }

  function setImageFitMode(imageId: string, fit: CollageImageFitMode) {
    const nextTransform: Partial<CollageImageTransform> = {
      fit,
    }

    if (fit === 'cover') {
      nextTransform.panX = 0
      nextTransform.panY = 0
    }

    setImageTransform(imageId, nextTransform)
  }

  function setSelectedImageFitMode(fit: CollageImageFitMode) {
    const selectedCell = selectedImageCell.value
    if (!selectedCell) return

    setImageFitMode(selectedCell.image.id, fit)
  }

  function resetImageTransform(imageId: string) {
    if (!imageTransforms.value[imageId]) return

    const nextTransforms = { ...imageTransforms.value }
    delete nextTransforms[imageId]
    imageTransforms.value = nextTransforms
  }

  function resetSelectedImageTransform() {
    const selectedCell = selectedImageCell.value
    if (!selectedCell) return

    resetImageTransform(selectedCell.image.id)
  }

  function pruneImageTransforms() {
    const availableIds = new Set(options.images.value.map((image) => image.id))
    const nextTransforms: Record<string, CollageImageTransform> = {}
    let changed = false

    for (const [imageId, transform] of Object.entries(imageTransforms.value)) {
      if (!availableIds.has(imageId)) {
        changed = true
        continue
      }

      nextTransforms[imageId] = transform
    }

    if (changed) {
      imageTransforms.value = nextTransforms
    }
  }

  function panImageTransform(
    imageId: string,
    cell: CollageLayoutCell,
    deltaX: number,
    deltaY: number,
  ) {
    const transform = getImageTransform(imageId)

    if (transform.fit !== 'detail') return false

    const metrics = getImageCellDrawMetrics(
      cell.image.image,
      cell.x,
      cell.y,
      cell.width,
      cell.height,
      transform,
    )

    let nextPanX = transform.panX
    let nextPanY = transform.panY

    if (metrics.overflowX > 0) {
      nextPanX = clamp(transform.panX - (deltaX * 2) / metrics.overflowX, -1, 1)
    }

    if (metrics.overflowY > 0) {
      nextPanY = clamp(transform.panY - (deltaY * 2) / metrics.overflowY, -1, 1)
    }

    if (nextPanX === transform.panX && nextPanY === transform.panY) {
      return false
    }

    setImageTransform(imageId, {
      panX: nextPanX,
      panY: nextPanY,
    })

    return true
  }

  async function renderCanvas() {
    if (options.activeMode.value !== 'image') return

    stopVideoRenderer()
    pruneImageTransforms()

    const canvas = options.canvasRef.value
    if (!canvas) return

    isRendering.value = true

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      isRendering.value = false
      return
    }

    try {
      const layout = createCollageLayout({
        images: options.images.value,
        padding: options.padding.value,
        gap: options.gap.value,
        layoutShuffleSeed: options.layoutShuffleSeed.value,
        constraintMode: options.layoutConstraintMode.value,
      })

      if (!layout) {
        canvas.width = 1200
        canvas.height = 1200

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = options.backgroundColor.value
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        previewInfo.value = {
          width: canvas.width,
          height: canvas.height,
          ratio: 1,
          columns: 0,
          rows: 0,
        }

        lastImageLayout.value = null
        selectedImageCell.value = null

        return
      }

      canvas.width = layout.width
      canvas.height = layout.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = options.backgroundColor.value
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const renderedCells = shuffleSimilarRatioCellImages(layout.cells, {
        seed: options.imageShuffleSeed.value,
      })

      lastImageLayout.value = {
        ...layout,
        cells: renderedCells,
      }

      const selectedImageId = selectedImageCell.value?.image.id

      if (selectedImageId) {
        selectedImageCell.value =
          renderedCells.find((cell) => cell.image.id === selectedImageId) ||
          null
      }

      for (const cell of renderedCells) {
        const transform = getImageTransform(cell.image.id)

        ctx.save()

        drawRoundedRect(ctx, cell.x, cell.y, cell.width, cell.height, 28)

        ctx.clip()

        drawImageInCell(
          ctx,
          cell.image.image,
          cell.x,
          cell.y,
          cell.width,
          cell.height,
          transform,
        )

        ctx.restore()
      }

      const overlayCanvas = await options.createCompositeOverlayCanvas(
        canvas.width,
        canvas.height,
      )

      if (overlayCanvas) {
        options.drawOverlayCanvas(
          ctx,
          canvas.width,
          canvas.height,
          overlayCanvas,
        )
      }

      previewInfo.value = {
        width: layout.width,
        height: layout.height,
        ratio: layout.ratio,
        columns: layout.columns,
        rows: layout.rows,
      }
    } finally {
      isRendering.value = false
    }
  }

  async function renderCurrentMode() {
    if (options.activeMode.value === 'video') {
      await renderVideoPreview()
      return
    }

    stopVideoRenderer()
    await renderCanvas()
  }

  return {
    isRendering,
    previewInfo,
    lastImageLayout,
    selectedImageCell,
    imageTransforms,

    clearSelectedImageCell,
    getCanvasPointFromPointerEvent,
    getImageCellAtCanvasPoint,
    getImageCellAtPointerEvent,
    getImageCellByImageId,
    handleCanvasPointerDown,

    getImageTransform,
    hasCustomImageTransform,
    setImageTransform,
    setImageFitMode,
    setSelectedImageFitMode,
    resetImageTransform,
    resetSelectedImageTransform,
    panImageTransform,

    stopVideoRenderer,
    cancelVideoPreviewRender,
    drawVideoEmptyState,
    renderVideoPreview,
    renderCanvas,
    renderCurrentMode,
  }
}
