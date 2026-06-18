<template>
  <!-- app/components/visual/slider.vue -->
  <canvas
    ref="canvasRef"
    class="canvas-slider-bg"
    :style="canvasStyle"
  />
</template>

<script setup lang="ts">
import {
  createCanvasSliderRenderer,
  type CanvasSliderRenderer,
  type CanvasSliderImageSource
} from '~/utils/canvasSliderRenderer'

const props = withDefaults(defineProps<{
  count?: number
  basePath?: string
  extension?: string
  sources?: CanvasSliderImageSource[]

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
  extension: 'webp',
  interval: 10000,
  transitionDuration: 1800,
  edgeBlur: 120,
  random: true,
  zIndex: -1,
  opacity: 1,
  startIndex: 1
})

const canvasRef = ref<HTMLCanvasElement | null>(null)

const canvasStyle = computed(() => ({
  zIndex: String(props.zIndex),
  opacity: String(props.opacity)
}))

let renderer: CanvasSliderRenderer | null = null

const getDefaultSources = () => {
  return Array.from(
    { length: props.count },
    (_, index) => `${props.basePath}/${index + 1}.${props.extension}`
  )
}

const getSources = () => {
  if (props.sources?.length) {
    return props.sources
  }

  return getDefaultSources()
}

const getViewportSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

const createRenderer = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  renderer?.destroy()

  const size = getViewportSize()

  renderer = createCanvasSliderRenderer({
    canvas,
    sources: getSources(),
    width: size.width,
    height: size.height,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    interval: props.interval,
    transitionDuration: props.transitionDuration,
    edgeBlur: props.edgeBlur,
    random: props.random,
    initialIndex: Math.max(props.startIndex - 1, 0)
  })

  renderer.setPointer(size.width / 2, size.height / 2)
  renderer.start()
}

const resizeRenderer = () => {
  if (!renderer) return

  const size = getViewportSize()

  renderer.resize(
    size.width,
    size.height,
    Math.min(window.devicePixelRatio || 1, 2)
  )
}

const handlePointerMove = (event: PointerEvent) => {
  renderer?.setPointer(event.clientX, event.clientY)
}

watch(
  () => [
    props.count,
    props.basePath,
    props.extension,
    props.sources,
    props.interval,
    props.transitionDuration,
    props.edgeBlur,
    props.random,
    props.startIndex
  ],
  () => {
    if (!canvasRef.value) return
    createRenderer()
  },
  {
    deep: true
  }
)

onMounted(() => {
  createRenderer()

  window.addEventListener('resize', resizeRenderer)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
})

onBeforeUnmount(() => {
  renderer?.destroy()
  renderer = null

  window.removeEventListener('resize', resizeRenderer)
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