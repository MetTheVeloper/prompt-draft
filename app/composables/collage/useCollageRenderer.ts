import type { ComputedRef, Ref } from 'vue'

import {
  createCanvasSliderRenderer,
  type CanvasSliderImageSource,
  type CanvasSliderRenderer,
} from '~/utils/canvasSliderRenderer'

import { createCollageLayout } from '~/utils/collage/layout'

import {
  COLLAGE_CANVAS_OUTPUT_SIZE_VALUE_MAP,
  getCollageCanvasAspectRatioValue,
} from '~/constants/collage'

import { loadCollagePipImageFile } from '~/utils/collage/file'

import { shuffleSimilarRatioCellImages } from '~/utils/collage/shuffle'

import {
  drawImageInCell,
  drawImagePip,
  drawRoundedRect,
  getImageCellDrawMetrics,
  normalizeImageCellPan,
} from '~/utils/collage/drawing'

import type {
  CollageCanvasAspectRatioLock,
  CollageCanvasAspectRatioOrientation,
  CollageCanvasOutputSize,
  BrandOverlayMode,
  CollageImageFitMode,
  CollageImageItem,
  CollageImagePip,
  CollageImageTransform,
  CollagePipHitResult,
  CollagePipPosition,
  CollagePipRect,
  CollagePipSize,
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
  cellRadius: Ref<number>
  canvasDecorationsEnabled: Ref<boolean>

  imageShuffleSeed: Ref<number>
  layoutShuffleSeed: Ref<number>
  layoutConstraintMode: Ref<CollageLayoutConstraintMode>
  canvasAspectRatioLock: Ref<CollageCanvasAspectRatioLock>
  canvasAspectRatioOrientation: Ref<CollageCanvasAspectRatioOrientation>
  canvasOutputSize: Ref<CollageCanvasOutputSize>
  brandOverlayEnabled: Ref<boolean>
  brandOverlayMode: Ref<BrandOverlayMode>

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

  createBrandFooterCanvas: (
    canvasWidth: number,
    backgroundColor: string,
  ) => Promise<HTMLCanvasElement | null>

  drawOverlayCanvas: (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    overlayCanvas: HTMLCanvasElement,
  ) => void
}



function getCanvasOutputMaxSide(size: CollageCanvasOutputSize) {
  return (
    COLLAGE_CANVAS_OUTPUT_SIZE_VALUE_MAP[size] ||
    COLLAGE_CANVAS_OUTPUT_SIZE_VALUE_MAP.large
  )
}

function getCanvasAspectRatioCandidates(
  lock: CollageCanvasAspectRatioLock,
  orientation: CollageCanvasAspectRatioOrientation = 'vertical',
) {
  const ratio = getCollageCanvasAspectRatioValue(lock, orientation)

  if (!ratio) return undefined

  return [ratio]
}

function getLockedCanvasSize(
  lock: CollageCanvasAspectRatioLock,
  maxSide = 1200,
  orientation: CollageCanvasAspectRatioOrientation = 'vertical',
) {
  const ratio = getCollageCanvasAspectRatioValue(lock, orientation)

  if (!ratio) return null

  if (ratio >= 1) {
    return {
      width: maxSide,
      height: Math.round(maxSide / ratio),
      ratio,
    }
  }

  return {
    width: Math.round(maxSide * ratio),
    height: maxSide,
    ratio,
  }
}

const DEFAULT_IMAGE_TRANSFORM: CollageImageTransform = {
  fit: 'cover',
  panX: 0,
  panY: 0,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeCellRadius(value: number) {
  return clamp(Math.round(value || 0), 0, 100)
}

const PIP_SIZE_RATIOS: Record<CollagePipSize, number> = {
  small: 0.22,
  medium: 0.32,
  large: 0.42,
}

const PIP_SIZE_MAX: Record<CollagePipSize, number> = {
  small: 120,
  medium: 180,
  large: 240,
}

function getPipMargin(cell: CollageLayoutCell) {
  return clamp(Math.round(Math.min(cell.width, cell.height) * 0.045), 10, 28)
}

function getPipRect(
  cell: CollageLayoutCell,
  pip: CollageImagePip,
): CollagePipRect {
  const margin = getPipMargin(cell)
  const minCellSide = Math.max(1, Math.min(cell.width, cell.height))
  const maxAvailableSide = Math.max(1, minCellSide - margin * 2)
  const targetSide = minCellSide * PIP_SIZE_RATIOS[pip.size]
  const size = Math.round(
    clamp(
      targetSide,
      Math.min(48, maxAvailableSide),
      Math.min(PIP_SIZE_MAX[pip.size], maxAvailableSide),
    ),
  )

  const left = cell.x + margin
  const centerX = cell.x + cell.width / 2 - size / 2
  const right = cell.x + cell.width - margin - size

  const top = cell.y + margin
  const centerY = cell.y + cell.height / 2 - size / 2
  const bottom = cell.y + cell.height - margin - size

  let x = right
  let y = bottom

  if (pip.position.endsWith('left')) x = left
  else if (pip.position.endsWith('center')) x = centerX
  else if (pip.position.endsWith('right')) x = right

  if (pip.position.startsWith('top')) y = top
  else if (pip.position.startsWith('center')) y = centerY
  else if (pip.position.startsWith('bottom')) y = bottom

  return {
    x,
    y,
    width: size,
    height: size,
  }
}

function isPointInsideRect(x: number, y: number, rect: CollagePipRect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  )
}

export function useCollageRenderer(options: UseCollageRendererOptions) {
  const isRendering = ref(false)
  const lastImageLayout = ref<CollageLayoutResult | null>(null)
  const selectedImageCell = ref<CollageLayoutCell | null>(null)
  const imageTransforms = ref<Record<string, CollageImageTransform>>({})
  const imagePips = ref<Record<string, CollageImagePip>>({})
  const lastImagePipRects = ref<Record<string, CollagePipRect>>({})

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

  function getImagePipAtCanvasPoint(
    x: number,
    y: number,
  ): CollagePipHitResult | null {
    const layout = lastImageLayout.value
    if (!layout) return null

    for (let index = layout.cells.length - 1; index >= 0; index--) {
      const cell = layout.cells[index]
      if (!cell) continue

      const pip = imagePips.value[cell.image.id]
      if (!pip) continue

      const rect =
        lastImagePipRects.value[cell.image.id] || getPipRect(cell, pip)

      if (!isPointInsideRect(x, y, rect)) continue

      return {
        imageId: cell.image.id,
        cell,
        pip,
        rect,
      }
    }

    return null
  }

  function getImagePipAtPointerEvent(event: MouseEvent) {
    const point = getCanvasPointFromPointerEvent(event)
    if (!point) return null

    return getImagePipAtCanvasPoint(point.x, point.y)
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

  function toggleSelectedImageFitMode() {
    const selectedCell = selectedImageCell.value
    if (!selectedCell) return

    const current = getImageTransform(selectedCell.image.id)

    setImageFitMode(
      selectedCell.image.id,
      current.fit === 'detail' ? 'cover' : 'detail',
    )
  }

  function getImagePip(imageId: string) {
    return imagePips.value[imageId] || null
  }

  function hasImagePip(imageId: string) {
    return !!imagePips.value[imageId]
  }

  async function setImagePipFromFile(imageId: string, file: File) {
    if (!file.type.startsWith('image/')) return

    const current = imagePips.value[imageId]
    const loadedPip = await loadCollagePipImageFile(file)

    imagePips.value = {
      ...imagePips.value,
      [imageId]: {
        ...loadedPip,
        position: current?.position || loadedPip.position,
        size: current?.size || loadedPip.size,
      },
    }

    if (current) {
      URL.revokeObjectURL(current.url)
    }
  }

  function setImagePipPosition(imageId: string, position: CollagePipPosition) {
    const current = imagePips.value[imageId]
    if (!current || current.position === position) return

    imagePips.value = {
      ...imagePips.value,
      [imageId]: {
        ...current,
        position,
      },
    }
  }

  function setImagePipSize(imageId: string, size: CollagePipSize) {
    const current = imagePips.value[imageId]
    if (!current || current.size === size) return

    imagePips.value = {
      ...imagePips.value,
      [imageId]: {
        ...current,
        size,
      },
    }
  }

  function removeImagePip(imageId: string) {
    const current = imagePips.value[imageId]
    if (!current) return

    URL.revokeObjectURL(current.url)

    const nextPips = { ...imagePips.value }
    const nextRects = { ...lastImagePipRects.value }

    delete nextPips[imageId]
    delete nextRects[imageId]

    imagePips.value = nextPips
    lastImagePipRects.value = nextRects
  }

  function disposeImagePips() {
    for (const pip of Object.values(imagePips.value)) {
      URL.revokeObjectURL(pip.url)
    }

    imagePips.value = {}
    lastImagePipRects.value = {}
  }

  function pruneImageState() {
    const availableIds = new Set(options.images.value.map((image) => image.id))
    const nextTransforms: Record<string, CollageImageTransform> = {}
    const nextPips: Record<string, CollageImagePip> = {}
    const nextRects: Record<string, CollagePipRect> = {}
    let transformsChanged = false
    let pipsChanged = false
    let rectsChanged = false

    for (const [imageId, transform] of Object.entries(imageTransforms.value)) {
      if (!availableIds.has(imageId)) {
        transformsChanged = true
        continue
      }

      nextTransforms[imageId] = transform
    }

    for (const [imageId, pip] of Object.entries(imagePips.value)) {
      if (!availableIds.has(imageId)) {
        URL.revokeObjectURL(pip.url)
        pipsChanged = true
        continue
      }

      nextPips[imageId] = pip
    }

    for (const [imageId, rect] of Object.entries(lastImagePipRects.value)) {
      if (!availableIds.has(imageId)) {
        rectsChanged = true
        continue
      }

      nextRects[imageId] = rect
    }

    if (transformsChanged) {
      imageTransforms.value = nextTransforms
    }

    if (pipsChanged) {
      imagePips.value = nextPips
    }

    if (rectsChanged) {
      lastImagePipRects.value = nextRects
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
    pruneImageState()

    const canvas = options.canvasRef.value
    if (!canvas) return

    isRendering.value = true

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      isRendering.value = false
      return
    }

    try {
      const decorationPadding = options.canvasDecorationsEnabled.value
        ? options.padding.value
        : 0
      const decorationGap = options.canvasDecorationsEnabled.value
        ? options.gap.value
        : 0
      const shouldUseBrandFooter =
        options.brandOverlayEnabled.value &&
        options.brandOverlayMode.value === 'footer'
      const layoutPadding = shouldUseBrandFooter
        ? {
            top: decorationPadding,
            right: decorationPadding,
            bottom: 0,
            left: decorationPadding,
          }
        : decorationPadding
      const canvasOutputMaxSide = getCanvasOutputMaxSide(options.canvasOutputSize.value)
      const lockedCanvasSize = getLockedCanvasSize(
        options.canvasAspectRatioLock.value,
        canvasOutputMaxSide,
        options.canvasAspectRatioOrientation.value,
      )

      let brandFooterCanvas: HTMLCanvasElement | null = null
      let collageLayoutRatios = getCanvasAspectRatioCandidates(
        options.canvasAspectRatioLock.value,
        options.canvasAspectRatioOrientation.value,
      )
      let collageLayoutMaxSide: number | undefined = canvasOutputMaxSide
      let finalCanvasWidth = 0
      let finalCanvasHeight = 0
      let collageOffsetX = 0
      let collageOffsetY = 0

      if (shouldUseBrandFooter && lockedCanvasSize) {
        brandFooterCanvas = await options.createBrandFooterCanvas(
          lockedCanvasSize.width,
          options.backgroundColor.value,
        )

        const footerHeight = brandFooterCanvas?.height || 0
        const collageAreaHeight = Math.max(
          1,
          lockedCanvasSize.height - footerHeight,
        )
        const collageAreaRatio = lockedCanvasSize.width / collageAreaHeight

        collageLayoutRatios = [collageAreaRatio]
        collageLayoutMaxSide = Math.max(lockedCanvasSize.width, collageAreaHeight)
        finalCanvasWidth = lockedCanvasSize.width
        finalCanvasHeight = lockedCanvasSize.height
      }

      const layout = createCollageLayout({
        images: options.images.value,
        padding: layoutPadding,
        gap: decorationGap,
        maxSide: collageLayoutMaxSide,
        layoutShuffleSeed: options.layoutShuffleSeed.value,
        constraintMode: options.layoutConstraintMode.value,
        ratios: collageLayoutRatios,
      })

      if (!layout) {
        const canvasOutputMaxSide = getCanvasOutputMaxSide(options.canvasOutputSize.value)

        canvas.width = canvasOutputMaxSide
        canvas.height = canvasOutputMaxSide

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (options.canvasDecorationsEnabled.value) {
          ctx.fillStyle = options.backgroundColor.value
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        previewInfo.value = {
          width: canvas.width,
          height: canvas.height,
          ratio: 1,
          columns: 0,
          rows: 0,
        }

        lastImageLayout.value = null
        selectedImageCell.value = null
        lastImagePipRects.value = {}

        return
      }

      if (shouldUseBrandFooter && !lockedCanvasSize) {
        brandFooterCanvas = await options.createBrandFooterCanvas(
          layout.width,
          options.backgroundColor.value,
        )
      }

      if (!finalCanvasWidth || !finalCanvasHeight) {
        finalCanvasWidth = layout.width
        finalCanvasHeight = layout.height + (brandFooterCanvas?.height || 0)
      }

      collageOffsetX = Math.round((finalCanvasWidth - layout.width) / 2)
      collageOffsetY = 0

      canvas.width = finalCanvasWidth
      canvas.height = finalCanvasHeight

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (options.canvasDecorationsEnabled.value) {
        ctx.fillStyle = options.backgroundColor.value
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      const renderedCells = shuffleSimilarRatioCellImages(layout.cells, {
        seed: options.imageShuffleSeed.value,
      }).map((cell) => ({
        ...cell,
        x: cell.x + collageOffsetX,
        y: cell.y + collageOffsetY,
      }))

      lastImageLayout.value = {
        ...layout,
        width: canvas.width,
        height: canvas.height,
        ratio: canvas.width / Math.max(1, canvas.height),
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

        drawRoundedRect(
          ctx,
          cell.x,
          cell.y,
          cell.width,
          cell.height,
          options.canvasDecorationsEnabled.value
            ? normalizeCellRadius(options.cellRadius.value)
            : 0,
        )

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

      const nextPipRects: Record<string, CollagePipRect> = {}

      for (const cell of renderedCells) {
        const pip = imagePips.value[cell.image.id]
        if (!pip) continue

        const rect = getPipRect(cell, pip)
        nextPipRects[cell.image.id] = rect

        ctx.save()
        drawRoundedRect(
          ctx,
          cell.x,
          cell.y,
          cell.width,
          cell.height,
          options.canvasDecorationsEnabled.value
            ? normalizeCellRadius(options.cellRadius.value)
            : 0,
        )
        ctx.clip()
        drawImagePip(ctx, pip.image, rect.x, rect.y, rect.width, {
          radius: Math.max(8, Math.min(18, rect.width * 0.12)),
          shadow: true,
        })
        ctx.restore()
      }

      lastImagePipRects.value = nextPipRects

      if (brandFooterCanvas) {
        ctx.drawImage(
          brandFooterCanvas,
          0,
          canvas.height - brandFooterCanvas.height,
        )
      } else {
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
      }

      previewInfo.value = {
        width: canvas.width,
        height: canvas.height,
        ratio: canvas.width / Math.max(1, canvas.height),
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
    imagePips,
    lastImagePipRects,

    clearSelectedImageCell,
    getCanvasPointFromPointerEvent,
    getImageCellAtCanvasPoint,
    getImageCellAtPointerEvent,
    getImagePipAtCanvasPoint,
    getImagePipAtPointerEvent,
    getImageCellByImageId,
    handleCanvasPointerDown,

    getImageTransform,
    hasCustomImageTransform,
    setImageTransform,
    setImageFitMode,
    setSelectedImageFitMode,
    toggleSelectedImageFitMode,
    resetImageTransform,
    resetSelectedImageTransform,
    getImagePip,
    hasImagePip,
    setImagePipFromFile,
    setImagePipPosition,
    setImagePipSize,
    removeImagePip,
    disposeImagePips,
    panImageTransform,

    stopVideoRenderer,
    cancelVideoPreviewRender,
    drawVideoEmptyState,
    renderVideoPreview,
    renderCanvas,
    renderCurrentMode,
  }
}
