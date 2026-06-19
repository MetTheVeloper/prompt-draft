import type {
  ComputedRef,
  Ref,
} from 'vue'

import {
  createCanvasSliderRenderer,
  type CanvasSliderImageSource,
  type CanvasSliderRenderer,
} from '~/utils/canvasSliderRenderer'

import {
  createCollageLayout,
} from '~/utils/collage/layout'

import {
  drawImageCover,
  drawRoundedRect,
} from '~/utils/collage/drawing'

import type {
  CollageImageItem,
  CollageMode,
} from '~/types/collage'

type UseCollageRendererOptions = {
  canvasRef: Ref<HTMLCanvasElement | null>
  activeMode: Ref<CollageMode>
  images: Ref<CollageImageItem[]>

  padding: Ref<number>
  gap: Ref<number>
  backgroundColor: Ref<string>

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
    canvasHeight: number
  ) => Promise<HTMLCanvasElement | null>

  drawOverlayCanvas: (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    overlayCanvas: HTMLCanvasElement
  ) => void
}

export function useCollageRenderer(options: UseCollageRendererOptions) {
  const isRendering = ref(false)

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
      canvas.height / 2
    )

    previewInfo.value = {
      width: canvas.width,
      height: canvas.height,
      ratio: canvas.width / canvas.height,
      columns: 0,
      rows: 0,
    }
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

    if (!options.images.value.length) {
      drawVideoEmptyState()
      return
    }

    const width = Math.max(1, Math.round(options.videoWidth.value))
    const height = Math.max(1, Math.round(options.videoHeight.value))

    const overlayCanvas = await options.createCompositeOverlayCanvas(
      width,
      height
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
          overlayCanvas
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

  async function renderCanvas() {
    if (options.activeMode.value !== 'image') return

    stopVideoRenderer()

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

        return
      }

      canvas.width = layout.width
      canvas.height = layout.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = options.backgroundColor.value
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const cell of layout.cells) {
        ctx.save()

        drawRoundedRect(
          ctx,
          cell.x,
          cell.y,
          cell.width,
          cell.height,
          28
        )

        ctx.clip()

        drawImageCover(
          ctx,
          cell.image.image,
          cell.x,
          cell.y,
          cell.width,
          cell.height
        )

        ctx.restore()
      }

      const overlayCanvas = await options.createCompositeOverlayCanvas(
        canvas.width,
        canvas.height
      )

      if (overlayCanvas) {
        options.drawOverlayCanvas(
          ctx,
          canvas.width,
          canvas.height,
          overlayCanvas
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

    stopVideoRenderer,
    cancelVideoPreviewRender,
    drawVideoEmptyState,
    renderVideoPreview,
    renderCanvas,
    renderCurrentMode,
  }
}