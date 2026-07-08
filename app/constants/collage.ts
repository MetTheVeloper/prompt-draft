import type {
  CollageWatermarkPosition,
  TextOverlayFontGroup,
} from '~/types/collage'

import type {
  OverlaySafeAreaPreset,
} from '~/utils/overlayPlacement'

export const COLLAGE_TELEGRAM_CHANNEL_BASE = 'https://t.me/Prompt_draft'

export const COLLAGE_LOGO_ASPECT_RATIO = 1024 / 244

export const COLLAGE_CANVAS_MAX_SIDE = 2048

export const COLLAGE_CANVAS_OUTPUT_SIZE_OPTIONS = [
  { value: 'small', maxSide: 800 },
  { value: 'medium', maxSide: 1200 },
  { value: 'large', maxSide: 2048 },
] as const

export const COLLAGE_CANVAS_OUTPUT_SIZE_VALUES =
  COLLAGE_CANVAS_OUTPUT_SIZE_OPTIONS.map((option) => option.value)

export const COLLAGE_CANVAS_OUTPUT_SIZE_VALUE_MAP =
  COLLAGE_CANVAS_OUTPUT_SIZE_OPTIONS.reduce(
    (result, option) => {
      result[option.value] = option.maxSide
      return result
    },
    {} as Record<(typeof COLLAGE_CANVAS_OUTPUT_SIZE_OPTIONS)[number]['value'], number>,
  )

export const COLLAGE_CANVAS_ASPECT_RATIO_BASE_OPTIONS = [
  '1:1',
  '1:2',
  '1:3',
  '2:3',
  '3:4',
  '3:5',
  '3:7',
  '4:5',
  '4:7',
  '5:6',
  '5:7',
  '5:8',
  '5:9',
  '6:7',
  '9:16',
  '9:21',
] as const

export const COLLAGE_CANVAS_ASPECT_RATIO_LOCK_OPTIONS = [
  { value: 'auto', labelKey: 'pages.collage.layoutTools.canvasRatios.auto' },
  ...COLLAGE_CANVAS_ASPECT_RATIO_BASE_OPTIONS.map((value) => ({
    value,
    label: value,
  })),
] as const

export const COLLAGE_CANVAS_ASPECT_RATIO_LOCK_VALUES =
  COLLAGE_CANVAS_ASPECT_RATIO_LOCK_OPTIONS.map((option) => option.value)

export const COLLAGE_CANVAS_ASPECT_RATIO_ORIENTATION_OPTIONS = [
  'vertical',
  'horizontal',
] as const

function parseCollageCanvasAspectRatio(value: string) {
  const [rawWidth, rawHeight] = value.split(':')
  const width = Number(rawWidth)
  const height = Number(rawHeight)

  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null

  return {
    width,
    height,
  }
}

export function normalizeCollageCanvasAspectRatioSetting(
  value: unknown,
  orientation: unknown = 'vertical',
) {
  if (value === 'auto') {
    return {
      lock: 'auto',
      orientation: 'vertical' as const,
    }
  }

  const normalizedOrientation =
    orientation === 'horizontal' ? 'horizontal' : 'vertical'

  if (typeof value !== 'string') {
    return {
      lock: 'auto',
      orientation: normalizedOrientation,
    }
  }

  if ((COLLAGE_CANVAS_ASPECT_RATIO_BASE_OPTIONS as readonly string[]).includes(value)) {
    return {
      lock: value,
      orientation: normalizedOrientation,
    }
  }

  const parsed = parseCollageCanvasAspectRatio(value)
  if (!parsed) {
    return {
      lock: 'auto',
      orientation: normalizedOrientation,
    }
  }

  const verticalValue = `${Math.min(parsed.width, parsed.height)}:${Math.max(
    parsed.width,
    parsed.height,
  )}`

  if ((COLLAGE_CANVAS_ASPECT_RATIO_BASE_OPTIONS as readonly string[]).includes(verticalValue)) {
    return {
      lock: verticalValue,
      orientation:
        parsed.width > parsed.height
          ? ('horizontal' as const)
          : ('vertical' as const),
    }
  }

  return {
    lock: 'auto',
    orientation: normalizedOrientation,
  }
}

export function getCollageCanvasAspectRatioValue(
  lock: string,
  orientation: 'vertical' | 'horizontal' = 'vertical',
) {
  if (lock === 'auto') return null

  const parsed = parseCollageCanvasAspectRatio(lock)
  if (!parsed) return null

  const shortSide = Math.min(parsed.width, parsed.height)
  const longSide = Math.max(parsed.width, parsed.height)

  if (shortSide <= 0 || longSide <= 0) return null

  if (orientation === 'horizontal') {
    return longSide / shortSide
  }

  return shortSide / longSide
}


export const COLLAGE_DEFAULT_BACKGROUND_COLOR = '#0b0b0f'

export const COLLAGE_DEFAULT_PADDING = 24

export const COLLAGE_DEFAULT_GAP = 16

export const COLLAGE_CANDIDATE_RATIOS = [
  4 / 5,
  1,
  5 / 4,
  16 / 9,
]

export const COLLAGE_WATERMARK_POSITIONS: {
  label: string
  value: CollageWatermarkPosition
}[] = [
  { label: 'بالا چپ', value: 'top-left' },
  { label: 'بالا وسط', value: 'top-center' },
  { label: 'بالا راست', value: 'top-right' },
  { label: 'وسط چپ', value: 'center-left' },
  { label: 'وسط', value: 'center' },
  { label: 'وسط راست', value: 'center-right' },
  { label: 'پایین چپ', value: 'bottom-left' },
  { label: 'پایین وسط', value: 'bottom-center' },
  { label: 'پایین راست', value: 'bottom-right' },
]

export const COLLAGE_OVERLAY_SAFE_AREA_OPTIONS: {
  label: string
  value: OverlaySafeAreaPreset
}[] = [
  { label: 'None', value: 'none' },
  { label: 'Instagram Story', value: 'story' },
  { label: 'Instagram Reels', value: 'reel' },
]

export const COLLAGE_TEXT_OVERLAY_FONT_GROUPS: TextOverlayFontGroup[] = [
  {
    label: 'Vazirmatn',
    options: [
      { label: 'Thin / 100', family: 'Vazirmatn', weight: 100 },
      { label: 'Extra Light / 200', family: 'Vazirmatn', weight: 200 },
      { label: 'Light / 300', family: 'Vazirmatn', weight: 300 },
      { label: 'Regular / 400', family: 'Vazirmatn', weight: 400 },
      { label: 'Medium / 500', family: 'Vazirmatn', weight: 500 },
      { label: 'Semi Bold / 600', family: 'Vazirmatn', weight: 600 },
      { label: 'Bold / 700', family: 'Vazirmatn', weight: 700 },
      { label: 'Extra Bold / 800', family: 'Vazirmatn', weight: 800 },
      { label: 'Black / 900', family: 'Vazirmatn', weight: 900 },
    ],
  },
  {
    label: 'Handjet',
    options: [
      { label: 'Thin / 100', family: 'Handjet', weight: 100 },
      { label: 'Extra Light / 200', family: 'Handjet', weight: 200 },
      { label: 'Light / 300', family: 'Handjet', weight: 300 },
      { label: 'Regular / 400', family: 'Handjet', weight: 400 },
      { label: 'Medium / 500', family: 'Handjet', weight: 500 },
      { label: 'Semi Bold / 600', family: 'Handjet', weight: 600 },
      { label: 'Bold / 700', family: 'Handjet', weight: 700 },
      { label: 'Extra Bold / 800', family: 'Handjet', weight: 800 },
      { label: 'Black / 900', family: 'Handjet', weight: 900 },
    ],
  },
  {
    label: 'Marhey',
    options: [
      { label: 'Light / 300', family: 'Marhey', weight: 300 },
      { label: 'Regular / 400', family: 'Marhey', weight: 400 },
      { label: 'Medium / 500', family: 'Marhey', weight: 500 },
      { label: 'Semi Bold / 600', family: 'Marhey', weight: 600 },
      { label: 'Bold / 700', family: 'Marhey', weight: 700 },
    ],
  },
  {
    label: 'Badeen Display',
    options: [
      { label: 'Regular / 400', family: 'Badeen Display', weight: 400 },
    ],
  },
  {
    label: 'Oi',
    options: [
      { label: 'Regular / 400', family: 'Oi', weight: 400 },
    ],
  },
]

export const COLLAGE_VIDEO_PRESET_OPTIONS = [
  { label: 'Story / Reel 1080 × 1920', value: '1080x1920' },
  { label: 'Square 1080 × 1080', value: '1080x1080' },
  { label: 'Landscape 1920 × 1080', value: '1920x1080' },
  { label: 'Portrait 1080 × 1350', value: '1080x1350' },
]

export const CANVAS_VIEW_ZOOM_MIN = 10
export const CANVAS_VIEW_ZOOM_MAX = 200
export const CANVAS_VIEW_ZOOM_DEFAULT = 50