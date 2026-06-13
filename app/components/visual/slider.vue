<template>
  <canvas
    ref="canvasRef"
    class="canvas-slider-bg"
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

const props = withDefaults(defineProps<{
  count?: number
  basePath?: string
  extension?: string

  /**
   * Time each image stays fully active after transition.
   * milliseconds
   */
  interval?: number

  /**
   * Circular reveal transition duration.
   * milliseconds
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

  zIndex?: number | string
  opacity?: number
  startIndex?: number
}>(), {
  count: 47,
  basePath: '/slider',
  extension: 'png',
  interval: 10000,
  transitionDuration: 1800,
  edgeBlur: 120,
  random: true,
  zIndex: -1,
  opacity: 1,
  startIndex: 1,
})

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

let currentIndex = 0
let nextIndex = 1

/**
 * Controls when the current image is allowed to change.
 */
let currentHoldStartedAt = 0

/**
 * Controls the intelligent pan/scan movement of the current image.
 * This must NOT reset after reveal finishes, otherwise image motion jumps.
 */
let currentPanStartedAt = 0

let isTransitioning = false
let transitionStartedAt = 0
let nextPanStartedAt = 0

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
      console.warn(`[CanvasSliderBackground] Failed to load: ${slide.src}`)
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

const refillRandomQueue = () => {
  const availableIndexes = slides
    .map((_, index) => index)
    .filter((index) => index !== currentIndex)

  randomQueue = shuffle(availableIndexes)
}

const getNextRandomIndex = () => {
  if (!slides.length) return currentIndex

  let attempts = 0
  const maxAttempts = slides.length * 2

  while (attempts < maxAttempts) {
    attempts++

    if (!randomQueue.length) {
      refillRandomQueue()
    }

    const candidate = randomQueue.shift()

    if (candidate === undefined) continue
    if (candidate === currentIndex) continue

    const slide = slides[candidate]

    if (slide?.loaded && !slide.failed) {
      return candidate
    }
  }

  return currentIndex
}

const findNextLoadedIndex = (fromIndex: number) => {
  if (!slides.length) return fromIndex

  for (let offset = 1; offset <= slides.length; offset++) {
    const candidate = getValidIndex(fromIndex + offset)
    const slide = slides[candidate]

    if (slide?.loaded && !slide.failed) {
      return candidate
    }
  }

  return fromIndex
}

const getNextIndex = () => {
  if (props.random) {
    return getNextRandomIndex()
  }

  return findNextLoadedIndex(currentIndex)
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

const getCoverDrawRect = (
  image: HTMLImageElement,
  now: number,
  panStartedAt: number,
  imageIndex: number,
) => {
  const imageWidth = image.naturalWidth || image.width
  const imageHeight = image.naturalHeight || image.height

  const scale = Math.max(width / imageWidth, height / imageHeight)

  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale

  const overflowX = Math.max(0, drawWidth - width)
  const overflowY = Math.max(0, drawHeight - height)

  /**
   * The image is visible during transition + active interval.
   * So pan duration should cover both periods.
   */
  const panDuration = Math.max(
    props.interval + props.transitionDuration,
    1,
  )

  const rawProgress = clamp(
    (now - panStartedAt) / panDuration,
    0,
    1,
  )

  const progress = smoothstep(rawProgress)

  /**
   * Alternate pan direction so images don't all move the same way.
   */
  const reverse = imageIndex % 2 === 1
  const pan = reverse ? 1 - progress : progress

  let x = (width - drawWidth) / 2
  let y = (height - drawHeight) / 2

  if (overflowX > 1) {
    x = -overflowX * pan
  }

  if (overflowY > 1) {
    y = -overflowY * pan
  }

  return {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  }
}

const drawImageCover = (
  targetCtx: CanvasRenderingContext2D,
  slide: SliderImage,
  now: number,
  panStartedAt: number,
  imageIndex: number,
) => {
  if (!slide.loaded || slide.failed) return

  const rect = getCoverDrawRect(
    slide.image,
    now,
    panStartedAt,
    imageIndex,
  )

  targetCtx.drawImage(
    slide.image,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  )
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

  const nextSlide = slides[nextIndex]
  if (!nextSlide?.loaded || nextSlide.failed) return

  const easedProgress = easeOutCubic(progress)
  const radius = getMaxRevealRadius() * easedProgress

  bufferCtx.clearRect(0, 0, width, height)
  maskCtx.clearRect(0, 0, width, height)

  drawImageCover(
    bufferCtx,
    nextSlide,
    now,
    nextPanStartedAt,
    nextIndex,
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

  const candidate = getNextIndex()

  if (candidate === currentIndex) return

  nextIndex = candidate

  isTransitioning = true
  transitionStartedAt = now
  nextPanStartedAt = now

  transitionOrigin.x = pointer.x || width / 2
  transitionOrigin.y = pointer.y || height / 2
}

const finishTransition = (now: number) => {
  currentIndex = nextIndex

  /**
   * This controls when the next image is allowed to transition out.
   */
  currentHoldStartedAt = now

  /**
   * This keeps the pan motion continuous.
   * Important: do NOT set this to now.
   */
  currentPanStartedAt = nextPanStartedAt

  isTransitioning = false
}

const drawFrame = (now: number) => {
  if (!ctx || !width || !height || !slides.length) return

  const currentSlide = slides[currentIndex]

  ctx.clearRect(0, 0, width, height)

  if (currentSlide?.loaded && !currentSlide.failed) {
    drawImageCover(
      ctx,
      currentSlide,
      now,
      currentPanStartedAt,
      currentIndex,
    )
  }

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
  currentIndex = clamp(
    props.startIndex - 1,
    0,
    Math.max(props.count - 1, 0),
  )

  nextIndex = getValidIndex(currentIndex + 1)

  pointer.x = window.innerWidth / 2
  pointer.y = window.innerHeight / 2

  transitionOrigin.x = pointer.x
  transitionOrigin.y = pointer.y

  createSlides()
  refillRandomQueue()
  resizeCanvas()

  const now = performance.now()

  currentHoldStartedAt = now
  currentPanStartedAt = now

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
.canvas-slider-bg {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  pointer-events: none;
  user-select: none;
}
</style>