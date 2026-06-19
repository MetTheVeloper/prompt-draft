export type OverlayPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type OverlaySafeAreaPreset = 'none' | 'story' | 'reel'

export type OverlayRect = {
  x: number
  y: number
  width: number
  height: number
}

type SafeAreaInsetRatios = {
  top: number
  right: number
  bottom: number
  left: number
}

const SAFE_AREA_INSET_RATIOS: Record<OverlaySafeAreaPreset, SafeAreaInsetRatios> = {
  none: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  // Organic Story:
  // top UI is the main risk.
  // bottom is kept moderate because on many modern devices reply UI is outside the 9:16 media.
  story: {
    top: 0.14,
    right: 0.06,
    bottom: 0.12,
    left: 0.06,
  },

  // Reels:
  // top header + right action rail + bottom account/caption/audio area.
  reel: {
    top: 0.14,
    right: 0.15,
    bottom: 0.15,
    left: 0.15,
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getOverlaySafeAreaRect(options: {
  canvasWidth: number
  canvasHeight: number
  safeArea: OverlaySafeAreaPreset
  padding?: number
}): OverlayRect {
  const { canvasWidth, canvasHeight, safeArea } = options
  const padding = Math.max(0, Math.round(options.padding ?? 0))
  const ratios = SAFE_AREA_INSET_RATIOS[safeArea]

  const left = Math.max(padding, Math.round(canvasWidth * ratios.left))
  const right = Math.max(padding, Math.round(canvasWidth * ratios.right))
  const top = Math.max(padding, Math.round(canvasHeight * ratios.top))
  const bottom = Math.max(padding, Math.round(canvasHeight * ratios.bottom))

  return {
    x: left,
    y: top,
    width: Math.max(1, canvasWidth - left - right),
    height: Math.max(1, canvasHeight - top - bottom),
  }
}

export function getOverlayPlacement(options: {
  canvasWidth: number
  canvasHeight: number
  overlayWidth: number
  overlayHeight: number
  position: OverlayPosition
  safeArea?: OverlaySafeAreaPreset
  padding?: number
  fitInsideSafeArea?: boolean
}) {
  const {
    canvasWidth,
    canvasHeight,
    overlayWidth,
    overlayHeight,
    position,
    safeArea = 'none',
    padding = 0,
    fitInsideSafeArea = true,
  } = options

  const safeRect = getOverlaySafeAreaRect({
    canvasWidth,
    canvasHeight,
    safeArea,
    padding,
  })

  const safeOverlayWidth = Math.max(1, overlayWidth)
  const safeOverlayHeight = Math.max(1, overlayHeight)

  const scale = fitInsideSafeArea
    ? clamp(
        Math.min(
          1,
          safeRect.width / safeOverlayWidth,
          safeRect.height / safeOverlayHeight
        ),
        0.01,
        1
      )
    : 1

  const width = Math.round(safeOverlayWidth * scale)
  const height = Math.round(safeOverlayHeight * scale)

  const isLeft = position.endsWith('left')
  const isRight = position.endsWith('right')
  const isTop = position.startsWith('top')
  const isBottom = position.startsWith('bottom')

  const isVerticalCenter =
    position === 'center' || position.startsWith('center')

  const isHorizontalCenter =
    position === 'center' || position.endsWith('center')

  let x = safeRect.x
  let y = safeRect.y

  if (isHorizontalCenter) {
    x = safeRect.x + (safeRect.width - width) / 2
  } else if (isRight) {
    x = safeRect.x + safeRect.width - width
  } else if (isLeft) {
    x = safeRect.x
  }

  if (isVerticalCenter) {
    y = safeRect.y + (safeRect.height - height) / 2
  } else if (isBottom) {
    y = safeRect.y + safeRect.height - height
  } else if (isTop) {
    y = safeRect.y
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width,
    height,
    scale,
    safeAreaRect: safeRect,
  }
}