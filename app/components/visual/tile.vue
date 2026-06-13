<template>
  <canvas
    ref="canvasRef"
    class="canvas-tiled-slider-bg"
    :style="canvasStyle"
  />
</template>

<script setup lang="ts">
type SliderImage = {
  src: string
  image: HTMLImageElement
  loaded: boolean
  failed: boolean
}

type Point = {
  x: number
  y: number
}

type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

type TileLayout = {
  points: Point[]
  bounds: Bounds
}

const props = withDefaults(defineProps<{
  count?: number
  basePath?: string
  extension?: string

  /**
   * Time each image set stays fully active after transition.
   */
  interval?: number

  /**
   * Circular reveal transition duration.
   */
  transitionDuration?: number

  /**
   * Softness of the reveal circle edge.
   */
  edgeBlur?: number

  /**
   * Randomize image order.
   */
  random?: boolean

  /**
   * 1 = full viewport.
   * 0.8 = centered smaller layout.
   */
  layoutScale?: number

  /**
   * Extra safe padding around the layout.
   */
  layoutPadding?: number

  /**
   * Slant amount for the tile cuts.
   */
  slantRatio?: number

  zIndex?: number | string
  opacity?: number
  backgroundColor?: string
}>(), {
  count: 47,
  basePath: '/slider',
  extension: 'png',
  interval: 10000,
  transitionDuration: 1800,
  edgeBlur: 120,
  random: true,
  layoutScale: 1,
  layoutPadding: 0,
  slantRatio: 0.08,
  zIndex: -1,
  opacity: 1,
  backgroundColor: 'transparent',
})

const TILE_COUNT = 3

const canvasRef = ref<HTMLCanvasElement | null>(null)

const canvasStyle = computed(() => ({
  zIndex: String(props.zIndex),
  opacity: String(props.opacity),
}))

let ctx: CanvasRenderingContext2D | null = null

let bufferCanvas: HTMLCanvasElement | null = null
let bufferCtx: CanvasRenderingContext2D | null = null

let maskCanvas: HTMLCanvasElement | null = null
let maskCtx: CanvasRenderingContext2D | null = null

let dpr = 1
let width = 0
let height = 0
let rafId = 0

let slides: SliderImage[] = []

let currentIndexes: number[] = []
let nextIndexes: number[] = []

let currentHoldStartedAt = 0
let currentPanStartedAt: number[] = []
let nextPanStartedAt: number[] = []

let isTransitioning = false
let transitionStartedAt = 0

let randomQueue: number[] = []

let pointer = {
  x: 0,
  y: 0,
}

let transitionOrigin = {
  x: 0,
  y: 0,
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const smoothstep = (t: number) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

const easeOutCubic = (t: number) => {
  const x = clamp(t, 0, 1)
  return 1 - Math.pow(1 - x, 3)
}

const shuffle = <T,>(items: T[]) => {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

const getSlideSrc = (index: number) => {
  return `${props.basePath}/${index + 1}.${props.extension}`
}

const createSlides = () => {
  slides = Array.from({ length: props.count }, (_, index) => {
    const image = new Image()

    const slide: SliderImage = {
      src: getSlideSrc(index),
      image,
      loaded: false,
      failed: false,
    }

    image.onload = () => {
      slide.loaded = true
    }

    image.onerror = () => {
      slide.failed = true
      console.warn(`[CanvasTiledSliderBackground] Failed to load: ${slide.src}`)
    }

    image.src = slide.src

    return slide
  })
}

const getValidIndex = (index: number) => {
  if (!slides.length) return 0

  let safeIndex = index % slides.length

  if (safeIndex < 0) {
    safeIndex += slides.length
  }

  return safeIndex
}

const getLoadedIndexes = () => {
  return slides
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => slide.loaded && !slide.failed)
    .map(({ index }) => index)
}

const refillRandomQueue = (exclude: number[] = []) => {
  const loadedIndexes = getLoadedIndexes()

  const source = loadedIndexes.length
    ? loadedIndexes
    : slides.map((_, index) => index)

  randomQueue = shuffle(
    source.filter((index) => !exclude.includes(index)),
  )
}

const getNextRandomIndex = (exclude: number[] = []) => {
  if (!slides.length) return 0

  let attempts = 0
  const maxAttempts = slides.length * 3

  while (attempts < maxAttempts) {
    attempts++

    if (!randomQueue.length) {
      refillRandomQueue(exclude)
    }

    const candidate = randomQueue.shift()

    if (candidate === undefined) continue
    if (exclude.includes(candidate)) continue

    const slide = slides[candidate]

    if (slide?.loaded && !slide.failed) {
      return candidate
    }
  }

  const fallback = getLoadedIndexes().find((index) => !exclude.includes(index))

  return fallback ?? getValidIndex(0)
}

const findNextLoadedIndex = (fromIndex: number, exclude: number[] = []) => {
  if (!slides.length) return fromIndex

  for (let offset = 1; offset <= slides.length; offset++) {
    const candidate = getValidIndex(fromIndex + offset)

    if (exclude.includes(candidate)) continue

    const slide = slides[candidate]

    if (slide?.loaded && !slide.failed) {
      return candidate
    }
  }

  return fromIndex
}

const getNextImageBatch = () => {
  const result: number[] = []

  for (let i = 0; i < TILE_COUNT; i++) {
    const exclude = [
      ...currentIndexes,
      ...result,
    ]

    const nextIndex = props.random
      ? getNextRandomIndex(exclude)
      : findNextLoadedIndex(currentIndexes[i] ?? i, exclude)

    result.push(nextIndex)
  }

  return result
}

const createInitialIndexes = () => {
  const indexes = Array.from({ length: props.count }, (_, index) => index)
  const ordered = props.random ? shuffle(indexes) : indexes

  return Array.from({ length: TILE_COUNT }, (_, index) => {
    return ordered[index] ?? getValidIndex(index)
  })
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  width = window.innerWidth
  height = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)

  ctx = canvas.getContext('2d')

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
  }

  bufferCanvas = document.createElement('canvas')
  bufferCanvas.width = Math.round(width * dpr)
  bufferCanvas.height = Math.round(height * dpr)

  bufferCtx = bufferCanvas.getContext('2d')

  if (bufferCtx) {
    bufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    bufferCtx.imageSmoothingEnabled = true
    bufferCtx.imageSmoothingQuality = 'high'
  }

  maskCanvas = document.createElement('canvas')
  maskCanvas.width = Math.round(width * dpr)
  maskCanvas.height = Math.round(height * dpr)

  maskCtx = maskCanvas.getContext('2d')

  if (maskCtx) {
    maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  if (!pointer.x && !pointer.y) {
    pointer.x = width / 2
    pointer.y = height / 2
  }

  transitionOrigin.x = pointer.x
  transitionOrigin.y = pointer.y
}

const getLayoutArea = () => {
  const padding = Math.max(props.layoutPadding, 0)
  const scale = clamp(props.layoutScale, 0.2, 1)

  const availableWidth = Math.max(width - padding * 2, 1)
  const availableHeight = Math.max(height - padding * 2, 1)

  const areaWidth = availableWidth * scale
  const areaHeight = availableHeight * scale

  return {
    x: (width - areaWidth) / 2,
    y: (height - areaHeight) / 2,
    width: areaWidth,
    height: areaHeight,
  }
}

const getBoundsFromPoints = (points: Point[]): Bounds => {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

const createTile = (points: Point[]): TileLayout => {
  return {
    points,
    bounds: getBoundsFromPoints(points),
  }
}

const getTileLayouts = (): TileLayout[] => {
  const area = getLayoutArea()

  const x0 = area.x
  const y0 = area.y
  const x3 = area.x + area.width
  const y3 = area.y + area.height

  const isLandscape = width >= height

  if (isLandscape) {
    const x1 = area.x + area.width * 0.36
    const x2 = area.x + area.width * 0.68

    const slant = Math.min(
      area.width * props.slantRatio,
      area.height * 0.3,
    )

    return [
      createTile([
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1 - slant, y: y3 },
        { x: x0, y: y3 },
      ]),

      createTile([
        { x: x1, y: y0 },
        { x: x2, y: y0 },
        { x: x2 - slant, y: y3 },
        { x: x1 - slant, y: y3 },
      ]),

      createTile([
        { x: x2, y: y0 },
        { x: x3, y: y0 },
        { x: x3, y: y3 },
        { x: x2 - slant, y: y3 },
      ]),
    ]
  }

  const y1 = area.y + area.height * 0.34
  const y2 = area.y + area.height * 0.68

  const slant = Math.min(
    area.height * props.slantRatio,
    area.width * 0.3,
  )

  return [
    createTile([
      { x: x0, y: y0 },
      { x: x3, y: y0 },
      { x: x3, y: y1 },
      { x: x0, y: y1 - slant },
    ]),

    createTile([
      { x: x0, y: y1 - slant },
      { x: x3, y: y1 },
      { x: x3, y: y2 },
      { x: x0, y: y2 - slant },
    ]),

    createTile([
      { x: x0, y: y2 - slant },
      { x: x3, y: y2 },
      { x: x3, y: y3 },
      { x: x0, y: y3 },
    ]),
  ]
}

const createPath = (points: Point[]) => {
  const path = new Path2D()

  points.forEach((point, index) => {
    if (index === 0) {
      path.moveTo(point.x, point.y)
    } else {
      path.lineTo(point.x, point.y)
    }
  })

  path.closePath()

  return path
}

const getCoverDrawRect = (
  image: HTMLImageElement,
  bounds: Bounds,
  now: number,
  panStartedAt: number,
  imageIndex: number,
) => {
  const imageWidth = image.naturalWidth || image.width
  const imageHeight = image.naturalHeight || image.height

  const scale = Math.max(
    bounds.width / imageWidth,
    bounds.height / imageHeight,
  )

  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale

  const overflowX = Math.max(0, drawWidth - bounds.width)
  const overflowY = Math.max(0, drawHeight - bounds.height)

  /**
   * Image is visible while:
   * entering transition + active interval + outgoing transition.
   */
  const panDuration = Math.max(
    props.interval + props.transitionDuration * 2,
    1,
  )

  const rawProgress = clamp(
    (now - panStartedAt) / panDuration,
    0,
    1,
  )

  const progress = smoothstep(rawProgress)

  const reverse = imageIndex % 2 === 1
  const pan = reverse ? 1 - progress : progress

  let x = bounds.x + (bounds.width - drawWidth) / 2
  let y = bounds.y + (bounds.height - drawHeight) / 2

  if (overflowX > 1) {
    x = bounds.x - overflowX * pan
  }

  if (overflowY > 1) {
    y = bounds.y - overflowY * pan
  }

  return {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  }
}

const drawImageInTile = (
  targetCtx: CanvasRenderingContext2D,
  slide: SliderImage,
  tile: TileLayout,
  now: number,
  panStartedAt: number,
  imageIndex: number,
) => {
  if (!slide.loaded || slide.failed) return

  const path = createPath(tile.points)

  const rect = getCoverDrawRect(
    slide.image,
    tile.bounds,
    now,
    panStartedAt,
    imageIndex,
  )

  targetCtx.save()
  targetCtx.clip(path)

  targetCtx.drawImage(
    slide.image,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  )

  targetCtx.restore()
}

const drawTiles = (
  targetCtx: CanvasRenderingContext2D,
  indexes: number[],
  panStartedAtList: number[],
  now: number,
) => {
  const tiles = getTileLayouts()

  tiles.forEach((tile, tileIndex) => {
    const imageIndex = indexes[tileIndex]
    const slide = slides[imageIndex]

    if (!slide) return

    drawImageInTile(
      targetCtx,
      slide,
      tile,
      now,
      panStartedAtList[tileIndex] ?? now,
      imageIndex,
    )
  })
}

const getMaxRevealRadius = () => {
  const x = transitionOrigin.x
  const y = transitionOrigin.y

  const distances = [
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y),
  ]

  return Math.max(...distances) + props.edgeBlur
}

const drawSoftReveal = (
  now: number,
  progress: number,
) => {
  if (!ctx || !bufferCanvas || !bufferCtx || !maskCanvas || !maskCtx) return

  const easedProgress = easeOutCubic(progress)
  const radius = getMaxRevealRadius() * easedProgress

  bufferCtx.clearRect(0, 0, width, height)
  maskCtx.clearRect(0, 0, width, height)

  drawTiles(
    bufferCtx,
    nextIndexes,
    nextPanStartedAt,
    now,
  )

  const blur = Math.max(props.edgeBlur, 1)
  const innerRadius = Math.max(radius - blur, 0)
  const outerRadius = Math.max(radius, 1)

  const gradient = maskCtx.createRadialGradient(
    transitionOrigin.x,
    transitionOrigin.y,
    innerRadius,
    transitionOrigin.x,
    transitionOrigin.y,
    outerRadius,
  )

  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  maskCtx.fillStyle = gradient
  maskCtx.fillRect(0, 0, width, height)

  bufferCtx.save()
  bufferCtx.globalCompositeOperation = 'destination-in'
  bufferCtx.drawImage(maskCanvas, 0, 0, width, height)
  bufferCtx.restore()

  ctx.drawImage(bufferCanvas, 0, 0, width, height)
}

const startTransition = (now: number) => {
  if (isTransitioning) return

  const batch = getNextImageBatch()

  if (!batch.length) return

  nextIndexes = batch
  nextPanStartedAt = Array.from({ length: TILE_COUNT }, () => now)

  isTransitioning = true
  transitionStartedAt = now

  transitionOrigin.x = pointer.x || width / 2
  transitionOrigin.y = pointer.y || height / 2
}

const finishTransition = (now: number) => {
  currentIndexes = [...nextIndexes]
  currentPanStartedAt = [...nextPanStartedAt]

  currentHoldStartedAt = now
  isTransitioning = false
}

const clearCanvas = () => {
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  if (props.backgroundColor !== 'transparent') {
    ctx.fillStyle = props.backgroundColor
    ctx.fillRect(0, 0, width, height)
  }
}

const drawFrame = (now: number) => {
  if (!ctx || !width || !height || !slides.length) return

  clearCanvas()

  drawTiles(
    ctx,
    currentIndexes,
    currentPanStartedAt,
    now,
  )

  if (!isTransitioning && now - currentHoldStartedAt >= props.interval) {
    startTransition(now)
  }

  if (isTransitioning) {
    const transitionProgress = clamp(
      (now - transitionStartedAt) / Math.max(props.transitionDuration, 1),
      0,
      1,
    )

    drawSoftReveal(now, transitionProgress)

    if (transitionProgress >= 1) {
      finishTransition(now)
    }
  }
}

const loop = (now: number) => {
  drawFrame(now)
  rafId = window.requestAnimationFrame(loop)
}

const handlePointerMove = (event: PointerEvent) => {
  pointer.x = event.clientX
  pointer.y = event.clientY
}

onMounted(() => {
  createSlides()

  currentIndexes = createInitialIndexes()
  nextIndexes = getNextImageBatch()

  pointer.x = window.innerWidth / 2
  pointer.y = window.innerHeight / 2

  transitionOrigin.x = pointer.x
  transitionOrigin.y = pointer.y

  resizeCanvas()
  refillRandomQueue(currentIndexes)

  const now = performance.now()

  currentHoldStartedAt = now
  currentPanStartedAt = Array.from({ length: TILE_COUNT }, () => now)
  nextPanStartedAt = Array.from({ length: TILE_COUNT }, () => now)

  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })

  rafId = window.requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(rafId)

  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('pointermove', handlePointerMove)
})
</script>

<style scoped>
.canvas-tiled-slider-bg {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  pointer-events: none;
  user-select: none;
}
</style>