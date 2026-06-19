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