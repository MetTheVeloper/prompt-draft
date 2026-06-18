export type CanvasSliderImageSource =
  | string
  | HTMLImageElement
  | {
    src?: string
    image: HTMLImageElement
  }

type CanvasSliderImage = {
  src: string
  image: HTMLImageElement
  loaded: boolean
  failed: boolean
}

export type CanvasSliderRendererOptions = {
  canvas: HTMLCanvasElement
  sources: CanvasSliderImageSource[]
  width: number
  height: number
  dpr?: number
  interval?: number
  transitionDuration?: number
  edgeBlur?: number
  random?: boolean
  initialIndex?: number
  backgroundColor?: string
  onAfterDrawFrame?: (payload: {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    timeMs: number
  }) => void
}

export type CanvasSliderFrameOptions = {
  repeat?: number
  loop?: boolean
  originX?: number
  originY?: number
}

export class CanvasSliderRenderer {
  private onAfterDrawFrame?: CanvasSliderRendererOptions['onAfterDrawFrame']
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null = null

  private bufferCanvas: HTMLCanvasElement | null = null
  private bufferCtx: CanvasRenderingContext2D | null = null

  private maskCanvas: HTMLCanvasElement | null = null
  private maskCtx: CanvasRenderingContext2D | null = null

  private width = 0
  private height = 0
  private dpr = 1

  private interval = 10000
  private transitionDuration = 1800
  private edgeBlur = 120
  private random = true
  private backgroundColor = ''

  private slides: CanvasSliderImage[] = []

  private currentIndex = 0
  private nextIndex = 1

  private currentHoldStartedAt = 0
  private currentPanStartedAt = 0

  private isTransitioning = false
  private transitionStartedAt = 0
  private nextPanStartedAt = 0

  private randomQueue: number[] = []
  private rafId = 0
  private running = false

  private pointer = {
    x: 0,
    y: 0
  }

  private transitionOrigin = {
    x: 0,
    y: 0
  }

  private emitAfterDrawFrame(timeMs: number) {
    if (!this.ctx || !this.onAfterDrawFrame) return

    this.onAfterDrawFrame({
      canvas: this.canvas,
      ctx: this.ctx,
      timeMs
    })
  }

  constructor(options: CanvasSliderRendererOptions) {
    this.canvas = options.canvas

    this.onAfterDrawFrame = options.onAfterDrawFrame
    this.interval = options.interval ?? this.interval
    this.transitionDuration = options.transitionDuration ?? this.transitionDuration
    this.edgeBlur = options.edgeBlur ?? this.edgeBlur
    this.random = options.random ?? this.random
    this.backgroundColor = options.backgroundColor ?? ''

    this.resize(options.width, options.height, options.dpr)

    this.setSources(options.sources, options.initialIndex ?? 0)
  }

  start() {
    if (this.running) return

    this.running = true

    const now = performance.now()

    if (!this.currentHoldStartedAt) {
      this.currentHoldStartedAt = now
    }

    if (!this.currentPanStartedAt) {
      this.currentPanStartedAt = now
    }

    this.rafId = window.requestAnimationFrame(this.loop)
  }

  stop() {
    this.running = false

    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  destroy() {
    this.stop()

    for (const slide of this.slides) {
      slide.image.onload = null
      slide.image.onerror = null
    }

    this.slides = []
    this.randomQueue = []

    this.ctx = null
    this.bufferCanvas = null
    this.bufferCtx = null
    this.maskCanvas = null
    this.maskCtx = null
  }

  resize(width: number, height: number, dpr = 1) {
    this.width = Math.max(Math.round(width), 1)
    this.height = Math.max(Math.round(height), 1)
    this.dpr = Math.max(dpr, 1)

    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)

    this.ctx = this.canvas.getContext('2d')

    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
    }

    this.bufferCanvas = document.createElement('canvas')
    this.bufferCanvas.width = Math.round(this.width * this.dpr)
    this.bufferCanvas.height = Math.round(this.height * this.dpr)

    this.bufferCtx = this.bufferCanvas.getContext('2d')

    if (this.bufferCtx) {
      this.bufferCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
      this.bufferCtx.imageSmoothingEnabled = true
      this.bufferCtx.imageSmoothingQuality = 'high'
    }

    this.maskCanvas = document.createElement('canvas')
    this.maskCanvas.width = Math.round(this.width * this.dpr)
    this.maskCanvas.height = Math.round(this.height * this.dpr)

    this.maskCtx = this.maskCanvas.getContext('2d')

    if (this.maskCtx) {
      this.maskCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    }

    if (!this.pointer.x && !this.pointer.y) {
      this.pointer.x = this.width / 2
      this.pointer.y = this.height / 2
    }

    this.transitionOrigin.x = this.pointer.x
    this.transitionOrigin.y = this.pointer.y
  }

  setSources(sources: CanvasSliderImageSource[], initialIndex = 0) {
    for (const slide of this.slides) {
      slide.image.onload = null
      slide.image.onerror = null
    }

    this.slides = sources.map((source) => this.createSlide(source))

    this.currentIndex = this.clamp(
      initialIndex,
      0,
      Math.max(this.slides.length - 1, 0)
    )

    this.nextIndex = this.getValidIndex(this.currentIndex + 1)

    const now = performance.now()

    this.currentHoldStartedAt = now
    this.currentPanStartedAt = now
    this.isTransitioning = false
    this.transitionStartedAt = 0
    this.nextPanStartedAt = 0

    this.refillRandomQueue()
  }

  setPointer(x: number, y: number) {
    this.pointer.x = this.clamp(x, 0, this.width)
    this.pointer.y = this.clamp(y, 0, this.height)
  }

  drawFrame(now = performance.now()) {
    if (!this.ctx || !this.width || !this.height) return

    this.clearStage()

    if (!this.slides.length) return

    const currentSlide = this.slides[this.currentIndex]

    if (currentSlide?.loaded && !currentSlide.failed) {
      this.drawImageCover(
        this.ctx,
        currentSlide,
        now,
        this.currentPanStartedAt,
        this.currentIndex
      )
    }

    if (
      !this.isTransitioning &&
      now - this.currentHoldStartedAt >= this.interval
    ) {
      this.startTransition(now)
    }

    if (this.isTransitioning) {
      const progress = this.clamp(
        (now - this.transitionStartedAt) /
        Math.max(this.transitionDuration, 1),
        0,
        1
      )

      this.drawSoftReveal(now, progress)

      if (progress >= 1) {
        this.finishTransition(now)
      }
    }

    this.emitAfterDrawFrame(now)
  }

  drawFrameAt(timeMs: number, options: CanvasSliderFrameOptions = {}) {
    if (!this.ctx || !this.width || !this.height) return

    this.clearStage()

    if (!this.slides.length) return

    const slideCount = this.slides.length
    const repeat = Math.max(1, Math.round(options.repeat ?? 1))
    const loop = options.loop ?? false

    const interval = Math.max(this.interval, 0)
    const transition = Math.max(this.transitionDuration, 0)

    const totalSlideViews = slideCount * repeat
    const transitionCount = loop
      ? totalSlideViews
      : Math.max(totalSlideViews - 1, 0)

    const totalDuration =
      totalSlideViews * interval + transitionCount * transition

    if (loop && timeMs >= totalDuration) {
      const firstSlide = this.slides[0]

      if (firstSlide?.loaded && !firstSlide.failed) {
        this.drawImageCover(
          this.ctx,
          firstSlide,
          0,
          0,
          0
        )
      }

      return
    }

    if (!totalDuration || slideCount === 1) {
      const slide = this.slides[0]

      if (slide?.loaded && !slide.failed) {
        this.drawImageCover(this.ctx, slide, 0, 0, 0)
      }

      return
    }

    const safeTime = this.clamp(
      Math.max(timeMs, 0),
      0,
      Math.max(totalDuration - 0.001, 0)
    )

    let cursor = 0

    for (let sequenceIndex = 0; sequenceIndex < totalSlideViews; sequenceIndex++) {
      const currentIndex = this.getValidIndex(sequenceIndex)
      const currentSlide = this.slides[currentIndex]

      const holdStart = cursor
      const holdEnd = holdStart + interval

      const currentPanStartedAt =
        sequenceIndex === 0
          ? 0
          : Math.max(0, holdStart - transition)

      if (safeTime < holdEnd || (sequenceIndex === totalSlideViews - 1 && !loop)) {
        if (currentSlide?.loaded && !currentSlide.failed) {
          this.drawImageCover(
            this.ctx,
            currentSlide,
            safeTime,
            currentPanStartedAt,
            currentIndex
          )
        }

        return
      }

      cursor = holdEnd

      const hasTransition =
        transition > 0 && sequenceIndex < transitionCount

      if (hasTransition) {
        const transitionStart = cursor
        const transitionEnd = transitionStart + transition

        if (safeTime < transitionEnd) {
          const nextSequenceIndex = sequenceIndex + 1
          const nextIndex = this.getValidIndex(nextSequenceIndex)

          const isClosingLoopTransition =
            loop && nextSequenceIndex >= totalSlideViews

          const nextPanStartedAt = isClosingLoopTransition
            ? safeTime
            : transitionStart

          if (currentSlide?.loaded && !currentSlide.failed) {
            this.drawImageCover(
              this.ctx,
              currentSlide,
              safeTime,
              currentPanStartedAt,
              currentIndex
            )
          }

          const progress = this.clamp(
            (safeTime - transitionStart) / Math.max(transition, 1),
            0,
            1
          )

          this.drawSoftRevealAt({
            now: safeTime,
            progress,
            nextIndex,
            nextPanStartedAt,
            originX: options.originX ?? this.width / 2,
            originY: options.originY ?? this.height / 2
          })

          return
        }

        cursor = transitionEnd
      }
    }

    const lastIndex = loop ? 0 : this.getValidIndex(totalSlideViews - 1)
    const lastSlide = this.slides[lastIndex]

    if (lastSlide?.loaded && !lastSlide.failed) {
      this.drawImageCover(
        this.ctx,
        lastSlide,
        safeTime,
        Math.max(0, safeTime - interval),
        lastIndex
      )
    }
  }

  private clearStage() {
    if (!this.ctx) return

    this.ctx.clearRect(0, 0, this.width, this.height)

    if (this.backgroundColor) {
      this.ctx.fillStyle = this.backgroundColor
      this.ctx.fillRect(0, 0, this.width, this.height)
    }
  }

  private loop = (now: number) => {
    this.drawFrame(now)

    if (!this.running) return

    this.rafId = window.requestAnimationFrame(this.loop)
  }

  private createSlide(source: CanvasSliderImageSource): CanvasSliderImage {
    if (typeof source === 'string') {
      const image = new Image()

      const slide: CanvasSliderImage = {
        src: source,
        image,
        loaded: false,
        failed: false
      }

      image.onload = () => {
        slide.loaded = true
      }

      image.onerror = () => {
        slide.failed = true
        console.warn(`[CanvasSliderRenderer] Failed to load: ${slide.src}`)
      }

      image.src = source

      return slide
    }

    const image = 'image' in source ? source.image : source
    const src = 'image' in source ? source.src || image.currentSrc || image.src : image.currentSrc || image.src

    const slide: CanvasSliderImage = {
      src,
      image,
      loaded: image.complete && Boolean(image.naturalWidth),
      failed: false
    }

    if (!slide.loaded) {
      image.onload = () => {
        slide.loaded = true
      }

      image.onerror = () => {
        slide.failed = true
        console.warn(`[CanvasSliderRenderer] Failed to load image element.`)
      }
    }

    return slide
  }

  private getValidIndex(index: number) {
    if (!this.slides.length) return 0

    let safeIndex = index % this.slides.length

    if (safeIndex < 0) {
      safeIndex += this.slides.length
    }

    return safeIndex
  }

  private refillRandomQueue() {
    const availableIndexes = this.slides
      .map((_, index) => index)
      .filter((index) => index !== this.currentIndex)

    this.randomQueue = this.shuffle(availableIndexes)
  }

  private getNextRandomIndex() {
    if (!this.slides.length) return this.currentIndex

    let attempts = 0
    const maxAttempts = this.slides.length * 2

    while (attempts < maxAttempts) {
      attempts++

      if (!this.randomQueue.length) {
        this.refillRandomQueue()
      }

      const candidate = this.randomQueue.shift()

      if (candidate === undefined) continue
      if (candidate === this.currentIndex) continue

      const slide = this.slides[candidate]

      if (slide?.loaded && !slide.failed) {
        return candidate
      }
    }

    return this.currentIndex
  }

  private findNextLoadedIndex(fromIndex: number) {
    if (!this.slides.length) return fromIndex

    for (let offset = 1; offset <= this.slides.length; offset++) {
      const candidate = this.getValidIndex(fromIndex + offset)
      const slide = this.slides[candidate]

      if (slide?.loaded && !slide.failed) {
        return candidate
      }
    }

    return fromIndex
  }

  private getNextIndex() {
    if (this.random) {
      return this.getNextRandomIndex()
    }

    return this.findNextLoadedIndex(this.currentIndex)
  }

  private getCoverDrawRect(
    image: HTMLImageElement,
    now: number,
    panStartedAt: number,
    imageIndex: number
  ) {
    const imageWidth = image.naturalWidth || image.width
    const imageHeight = image.naturalHeight || image.height

    const scale = Math.max(
      this.width / imageWidth,
      this.height / imageHeight
    )

    const drawWidth = imageWidth * scale
    const drawHeight = imageHeight * scale

    const overflowX = Math.max(0, drawWidth - this.width)
    const overflowY = Math.max(0, drawHeight - this.height)

    const panDuration = Math.max(
      this.interval + this.transitionDuration,
      1
    )

    const rawProgress = this.clamp((now - panStartedAt) / panDuration, 0, 1)
    const progress = this.smoothstep(rawProgress)

    const reverse = imageIndex % 2 === 1
    const pan = reverse ? 1 - progress : progress

    let x = (this.width - drawWidth) / 2
    let y = (this.height - drawHeight) / 2

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
      height: drawHeight
    }
  }

  private drawImageCover(
    targetCtx: CanvasRenderingContext2D,
    slide: CanvasSliderImage,
    now: number,
    panStartedAt: number,
    imageIndex: number
  ) {
    if (!slide.loaded || slide.failed) return

    const rect = this.getCoverDrawRect(
      slide.image,
      now,
      panStartedAt,
      imageIndex
    )

    targetCtx.drawImage(
      slide.image,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    )
  }

  private getMaxRevealRadius() {
    return this.getMaxRevealRadiusAt(
      this.transitionOrigin.x,
      this.transitionOrigin.y
    )
  }

  private getMaxRevealRadiusAt(x: number, y: number) {
    const distances = [
      Math.hypot(x, y),
      Math.hypot(this.width - x, y),
      Math.hypot(x, this.height - y),
      Math.hypot(this.width - x, this.height - y)
    ]

    return Math.max(...distances) + this.edgeBlur
  }

  private drawSoftReveal(now: number, progress: number) {
    this.drawSoftRevealAt({
      now,
      progress,
      nextIndex: this.nextIndex,
      nextPanStartedAt: this.nextPanStartedAt,
      originX: this.transitionOrigin.x,
      originY: this.transitionOrigin.y
    })
  }

  private drawSoftRevealAt(options: {
    now: number
    progress: number
    nextIndex: number
    nextPanStartedAt: number
    originX: number
    originY: number
  }) {
    if (
      !this.ctx ||
      !this.bufferCanvas ||
      !this.bufferCtx ||
      !this.maskCanvas ||
      !this.maskCtx
    ) {
      return
    }

    const nextSlide = this.slides[options.nextIndex]

    if (!nextSlide?.loaded || nextSlide.failed) return

    const easedProgress = this.easeOutCubic(options.progress)
    const radius = this.getMaxRevealRadiusAt(
      options.originX,
      options.originY
    ) * easedProgress

    this.bufferCtx.clearRect(0, 0, this.width, this.height)
    this.maskCtx.clearRect(0, 0, this.width, this.height)

    this.drawImageCover(
      this.bufferCtx,
      nextSlide,
      options.now,
      options.nextPanStartedAt,
      options.nextIndex
    )

    const blur = Math.max(this.edgeBlur, 1)
    const innerRadius = Math.max(radius - blur, 0)
    const outerRadius = Math.max(radius, 1)

    const gradient = this.maskCtx.createRadialGradient(
      options.originX,
      options.originY,
      innerRadius,
      options.originX,
      options.originY,
      outerRadius
    )

    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    this.maskCtx.fillStyle = gradient
    this.maskCtx.fillRect(0, 0, this.width, this.height)

    this.bufferCtx.save()
    this.bufferCtx.globalCompositeOperation = 'destination-in'
    this.bufferCtx.drawImage(this.maskCanvas, 0, 0, this.width, this.height)
    this.bufferCtx.restore()

    this.ctx.drawImage(this.bufferCanvas, 0, 0, this.width, this.height)
  }

  private startTransition(now: number) {
    if (this.isTransitioning) return

    const candidate = this.getNextIndex()

    if (candidate === this.currentIndex) return

    this.nextIndex = candidate

    this.isTransitioning = true
    this.transitionStartedAt = now
    this.nextPanStartedAt = now

    this.transitionOrigin.x = this.pointer.x || this.width / 2
    this.transitionOrigin.y = this.pointer.y || this.height / 2
  }

  private finishTransition(now: number) {
    this.currentIndex = this.nextIndex
    this.currentHoldStartedAt = now
    this.currentPanStartedAt = this.nextPanStartedAt
    this.isTransitioning = false
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  private smoothstep(t: number) {
    const x = this.clamp(t, 0, 1)
    return x * x * (3 - 2 * x)
  }

  private easeOutCubic(t: number) {
    const x = this.clamp(t, 0, 1)
    return 1 - Math.pow(1 - x, 3)
  }

  private shuffle<T>(items: T[]) {
    const result = [...items]

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }

    return result
  }
}

export function createCanvasSliderRenderer(options: CanvasSliderRendererOptions) {
  return new CanvasSliderRenderer(options)
}