import type { ComponentPublicInstance, Ref } from 'vue'

import {
  CANVAS_VIEW_ZOOM_DEFAULT,
  CANVAS_VIEW_ZOOM_MAX,
  CANVAS_VIEW_ZOOM_MIN,
} from '~/constants/collage'

type CanvasWrapRef = HTMLElement | ComponentPublicInstance | null

type CanvasViewMode = 'fit' | 'actual' | 'custom'

export const useCollageCanvasView = (
  canvasRef: Ref<HTMLCanvasElement | null>,
) => {
  const canvasWrapRef = ref<CanvasWrapRef>(null)

  const canvasZoom = ref(CANVAS_VIEW_ZOOM_DEFAULT)
  const canvasViewMode = ref<CanvasViewMode>('custom')

  const canvasIntrinsicWidth = ref(0)
  const canvasIntrinsicHeight = ref(0)

  const canvasZoomMin = CANVAS_VIEW_ZOOM_MIN
  const canvasZoomMax = CANVAS_VIEW_ZOOM_MAX

  const clampCanvasZoom = (value: number) => {
    return Math.min(
      CANVAS_VIEW_ZOOM_MAX,
      Math.max(CANVAS_VIEW_ZOOM_MIN, Math.round(value)),
    )
  }

  const getCanvasWrapElement = () => {
    const target = canvasWrapRef.value

    if (!target) return null
    if (target instanceof HTMLElement) return target

    const element = target.$el

    return element instanceof HTMLElement ? element : null
  }

  const syncCanvasIntrinsicSize = () => {
    const canvas = canvasRef.value

    const width = canvas?.width || 0
    const height = canvas?.height || 0

    canvasIntrinsicWidth.value = width
    canvasIntrinsicHeight.value = height

    return {
      width,
      height,
    }
  }

  const setCanvasZoom = (value: number) => {
    syncCanvasIntrinsicSize()

    canvasViewMode.value = 'custom'
    canvasZoom.value = clampCanvasZoom(value)
  }

  const setCanvasActualSize = () => {
    syncCanvasIntrinsicSize()

    canvasViewMode.value = 'actual'
    canvasZoom.value = 100
  }

  const fitCanvasToWrap = async () => {
    await nextTick()

    const canvas = canvasRef.value
    const wrap = getCanvasWrapElement()

    const { width, height } = syncCanvasIntrinsicSize()

    if (!canvas || !wrap || !width || !height) return

    const styles = window.getComputedStyle(wrap)

    const paddingX =
      parseFloat(styles.paddingLeft || '0') +
      parseFloat(styles.paddingRight || '0')

    const paddingY =
      parseFloat(styles.paddingTop || '0') +
      parseFloat(styles.paddingBottom || '0')

    const availableWidth = wrap.clientWidth - paddingX
    const availableHeight = wrap.clientHeight - paddingY

    if (availableWidth <= 0 || availableHeight <= 0) return

    const fitScale = Math.min(
      availableWidth / width,
      availableHeight / height,
    )

    if (!Number.isFinite(fitScale)) return

    canvasViewMode.value = 'fit'
    canvasZoom.value = clampCanvasZoom(fitScale * 100)
  }

  const reapplyCanvasView = async () => {
    await nextTick()

    syncCanvasIntrinsicSize()

    if (canvasViewMode.value === 'fit') {
      await fitCanvasToWrap()
      return
    }

    if (canvasViewMode.value === 'actual') {
      setCanvasActualSize()
      return
    }

    canvasZoom.value = clampCanvasZoom(canvasZoom.value)
  }

  const canvasDisplayStyle = computed(() => {
    const width = canvasIntrinsicWidth.value
    const height = canvasIntrinsicHeight.value

    if (!width || !height) {
      return {
        width: '100%',
        height: 'auto',
      }
    }

    const scale = canvasZoom.value / 100

    return {
      width: `${Math.max(1, width * scale)}px`,
      height: `${Math.max(1, height * scale)}px`,
    }
  })

  return {
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
  }
}