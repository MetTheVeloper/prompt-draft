import type { ComponentPublicInstance, Ref } from 'vue'

import {
  CANVAS_VIEW_ZOOM_DEFAULT,
  CANVAS_VIEW_ZOOM_MAX,
  CANVAS_VIEW_ZOOM_MIN,
} from '~/constants/collage'

type CanvasWrapRef = HTMLElement | ComponentPublicInstance | null

type CanvasViewMode = 'fit' | 'actual' | 'custom'

type CanvasViewportPanState = {
  pointerId: number
  startClientX: number
  startClientY: number
  startScrollLeft: number
  startScrollTop: number
}

type CanvasZoomAnchor = {
  clientX: number
  clientY: number
  ratioX: number
  ratioY: number
}

const CANVAS_FIT_SAFE_PADDING = 80

export const useCollageCanvasView = (
  canvasRef: Ref<HTMLCanvasElement | null>,
) => {
  const canvasWrapRef = ref<CanvasWrapRef>(null)

  const canvasZoom = ref(CANVAS_VIEW_ZOOM_DEFAULT)
  const canvasViewMode = ref<CanvasViewMode>('fit')
  const canvasPanToolEnabled = ref(false)
  const isCanvasViewportPanning = ref(false)

  const canvasIntrinsicWidth = ref(0)
  const canvasIntrinsicHeight = ref(0)

  const canvasZoomMin = CANVAS_VIEW_ZOOM_MIN
  const canvasZoomMax = CANVAS_VIEW_ZOOM_MAX

  let viewportPanState: CanvasViewportPanState | null = null

  const clampCanvasZoom = (value: number) => {
    return Math.min(
      CANVAS_VIEW_ZOOM_MAX,
      Math.max(CANVAS_VIEW_ZOOM_MIN, Math.round(value)),
    )
  }

  const clamp01 = (value: number) => {
    return Math.max(0, Math.min(1, value))
  }

  const waitFrame = () => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
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

  const createZoomAnchor = (event?: MouseEvent | PointerEvent | null) => {
    const canvas = canvasRef.value
    const wrap = getCanvasWrapElement()

    if (!canvas || !wrap) return null

    const canvasRect = canvas.getBoundingClientRect()
    const wrapRect = wrap.getBoundingClientRect()

    if (!canvasRect.width || !canvasRect.height) return null

    const clientX = event?.clientX ?? wrapRect.left + wrapRect.width / 2
    const clientY = event?.clientY ?? wrapRect.top + wrapRect.height / 2

    return {
      clientX,
      clientY,
      ratioX: clamp01((clientX - canvasRect.left) / canvasRect.width),
      ratioY: clamp01((clientY - canvasRect.top) / canvasRect.height),
    } satisfies CanvasZoomAnchor
  }

  const restoreZoomAnchor = (anchor: CanvasZoomAnchor | null) => {
    if (!anchor) return

    const canvas = canvasRef.value
    const wrap = getCanvasWrapElement()

    if (!canvas || !wrap) return

    const canvasRect = canvas.getBoundingClientRect()

    const nextClientX = canvasRect.left + canvasRect.width * anchor.ratioX
    const nextClientY = canvasRect.top + canvasRect.height * anchor.ratioY

    wrap.scrollLeft += nextClientX - anchor.clientX
    wrap.scrollTop += nextClientY - anchor.clientY
  }

  const centerCanvasInWrap = () => {
    const wrap = getCanvasWrapElement()

    if (!wrap) return

    wrap.scrollLeft = Math.max(0, (wrap.scrollWidth - wrap.clientWidth) / 2)
    wrap.scrollTop = Math.max(0, (wrap.scrollHeight - wrap.clientHeight) / 2)
  }

  const setCanvasZoom = async (
    value: number,
    anchorEvent?: MouseEvent | PointerEvent | null,
  ) => {
    syncCanvasIntrinsicSize()

    const anchor = createZoomAnchor(anchorEvent)

    canvasViewMode.value = 'custom'
    canvasZoom.value = clampCanvasZoom(value)

    await nextTick()
    await waitFrame()

    restoreZoomAnchor(anchor)
  }

  const setCanvasActualSize = async () => {
    syncCanvasIntrinsicSize()

    canvasViewMode.value = 'actual'
    canvasZoom.value = 100

    await nextTick()
    await waitFrame()
    centerCanvasInWrap()
  }

  const fitCanvasToWrap = async () => {
    await nextTick()
    await waitFrame()

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

    const availableWidth = wrap.clientWidth - paddingX - CANVAS_FIT_SAFE_PADDING
    const availableHeight = wrap.clientHeight - paddingY - CANVAS_FIT_SAFE_PADDING

    if (availableWidth <= 0 || availableHeight <= 0) return

    const fitScale = Math.min(
      availableWidth / width,
      availableHeight / height,
    )

    if (!Number.isFinite(fitScale)) return

    canvasViewMode.value = 'fit'
    canvasZoom.value = clampCanvasZoom(fitScale * 100)

    await nextTick()
    await waitFrame()
    centerCanvasInWrap()
  }

  const reapplyCanvasView = async () => {
    await nextTick()

    syncCanvasIntrinsicSize()

    if (canvasViewMode.value === 'fit') {
      await fitCanvasToWrap()
      return
    }

    if (canvasViewMode.value === 'actual') {
      await setCanvasActualSize()
      return
    }

    canvasZoom.value = clampCanvasZoom(canvasZoom.value)
  }

  const resetCanvasView = async () => {
    canvasViewMode.value = 'fit'
    await fitCanvasToWrap()
  }

  const handleCanvasWheel = (event: WheelEvent) => {
    const canvas = canvasRef.value
    const wrap = getCanvasWrapElement()

    if (!canvas || !wrap || !canvas.width || !canvas.height) return

    event.preventDefault()
    event.stopPropagation()

    const zoomFactor = Math.exp(-event.deltaY * 0.001)
    const nextZoom = clampCanvasZoom(canvasZoom.value * zoomFactor)

    if (nextZoom === canvasZoom.value) return

    void setCanvasZoom(nextZoom, event)
  }

  const startCanvasViewportPan = (event: PointerEvent) => {
    const wrap = getCanvasWrapElement()

    if (!wrap) return false

    const shouldPanWithMiddleMouse = event.button === 1
    const shouldPanWithLeftMouse =
      canvasPanToolEnabled.value && event.button === 0 && event.isPrimary !== false

    if (!shouldPanWithMiddleMouse && !shouldPanWithLeftMouse) return false

    viewportPanState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScrollLeft: wrap.scrollLeft,
      startScrollTop: wrap.scrollTop,
    }

    isCanvasViewportPanning.value = true
    wrap.setPointerCapture?.(event.pointerId)

    event.preventDefault()
    event.stopPropagation()

    return true
  }

  const handleCanvasViewportPointerDown = (event: PointerEvent) => {
    startCanvasViewportPan(event)
  }

  const handleCanvasViewportPointerMove = (event: PointerEvent) => {
    const wrap = getCanvasWrapElement()

    if (!wrap || !viewportPanState) return
    if (viewportPanState.pointerId !== event.pointerId) return

    const deltaX = event.clientX - viewportPanState.startClientX
    const deltaY = event.clientY - viewportPanState.startClientY

    wrap.scrollLeft = viewportPanState.startScrollLeft - deltaX
    wrap.scrollTop = viewportPanState.startScrollTop - deltaY

    event.preventDefault()
    event.stopPropagation()
  }

  const stopCanvasViewportPan = (event?: PointerEvent) => {
    const wrap = getCanvasWrapElement()

    if (event && viewportPanState?.pointerId !== event.pointerId) return

    if (event && wrap?.hasPointerCapture?.(event.pointerId)) {
      wrap.releasePointerCapture(event.pointerId)
    }

    viewportPanState = null
    isCanvasViewportPanning.value = false

    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleCanvasViewportPointerUp = (event: PointerEvent) => {
    stopCanvasViewportPan(event)
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

  const canvasStageStyle = computed(() => ({
    minWidth: '100%',
    minHeight: '100%',
  }))

  return {
    canvasWrapRef,

    canvasZoom,
    canvasZoomMin,
    canvasZoomMax,
    canvasViewMode,
    canvasPanToolEnabled,
    isCanvasViewportPanning,
    canvasDisplayStyle,
    canvasStageStyle,

    syncCanvasIntrinsicSize,
    setCanvasZoom,
    setCanvasActualSize,
    fitCanvasToWrap,
    reapplyCanvasView,
    resetCanvasView,

    handleCanvasWheel,
    handleCanvasViewportPointerDown,
    handleCanvasViewportPointerMove,
    handleCanvasViewportPointerUp,
    stopCanvasViewportPan,
  }
}
