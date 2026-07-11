import type {
  ImageVectorizerConfigPayload,
  ImageVectorizerMode,
  ImageVectorizerSettings,
} from '~/types/imageVectorizer'

export const IMAGE_VECTORIZER_CONFIG_TYPE = 'prompt-draft.image-vectorizer-config'
export const IMAGE_VECTORIZER_CONFIG_VERSION = 2
export const IMAGE_VECTORIZER_STORAGE_KEY = 'prompt-draft:image-vectorizer:settings:v2'
const LEGACY_STORAGE_KEY = 'prompt-draft:image-vectorizer:settings:v1'

export const DEFAULT_IMAGE_VECTORIZER_SETTINGS: ImageVectorizerSettings = {
  mode: 'vectorize',
  maxColors: 5,
  colorTolerance: 24,
  strictColorLimit: false,
  removeBackground: true,
  backgroundColor: null,
  trimCanvas: true,
  padding: 5,
  minRegionSize: 10,
  edgeCleanup: 2,
  removeEnclosedBackground: false,
  refineSvg: false,
  refineImage: false,
  enhanceLowRes: false,
  lowResScale: 0,
  lowResRecovery: 60,
  paletteOverrides: {},
  smooth: 18,
  smoothMode: 'pre',
  edgeSmooth: 18,
}

const COMMON_CONFIG_KEYS: Array<keyof ImageVectorizerSettings> = [
  'maxColors',
  'colorTolerance',
  'strictColorLimit',
  'removeBackground',
  'backgroundColor',
  'trimCanvas',
  'padding',
  'minRegionSize',
  'edgeCleanup',
  'removeEnclosedBackground',
  'enhanceLowRes',
  'lowResScale',
  'lowResRecovery',
]

const VECTORIZE_CONFIG_KEYS: Array<keyof ImageVectorizerSettings> = [
  'refineSvg',
  'paletteOverrides',
  'smooth',
  'smoothMode',
]

const UPSCALE_CONFIG_KEYS: Array<keyof ImageVectorizerSettings> = [
  'refineImage',
  'edgeSmooth',
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  step = 1,
) {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed)) return fallback

  const clamped = clamp(parsed, min, max)
  const snapped = step > 0
    ? Math.round(clamped / step) * step
    : clamped

  return clamp(snapped, min, max)
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeMode(value: unknown, fallback: ImageVectorizerMode) {
  return value === 'vectorize' || value === 'upscale'
    ? value
    : fallback
}

function normalizePaletteOverrides(
  value: unknown,
  fallback: Record<string, string>,
) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback }
  }

  const normalized: Record<string, string> = {}

  for (const [source, target] of Object.entries(value)) {
    if (
      typeof target !== 'string' ||
      !/^#[\da-f]{6}$/i.test(source) ||
      !/^#[\da-f]{6}$/i.test(target)
    ) {
      continue
    }

    const sourceHex = source.toUpperCase()
    const targetHex = target.toUpperCase()

    if (sourceHex !== targetHex) {
      normalized[sourceHex] = targetHex
    }
  }

  return normalized
}

function normalizeSmoothMode(
  value: unknown,
  fallback: ImageVectorizerSettings['smoothMode'],
): ImageVectorizerSettings['smoothMode'] {
  return value === 'pre' || value === 'post' || value === 'both'
    ? value
    : fallback
}

function normalizeBackgroundColor(
  value: unknown,
  fallback: string | null,
) {
  if (value === undefined) return fallback
  if (value === null || value === '') return null
  if (typeof value !== 'string') return null

  const normalized = value.trim()

  return /^#[\da-f]{6}$/i.test(normalized)
    ? normalized.toUpperCase()
    : null
}

export function normalizeImageVectorizerSettings(
  input: unknown,
  fallback: ImageVectorizerSettings = DEFAULT_IMAGE_VECTORIZER_SETTINGS,
): ImageVectorizerSettings {
  const value = input && typeof input === 'object'
    ? input as Partial<ImageVectorizerSettings>
    : {}
  const mode = normalizeMode(value.mode, fallback.mode)
  const maxColorLimit = mode === 'upscale' ? 512 : 32
  const fallbackMaxColors = clamp(fallback.maxColors, 1, maxColorLimit)

  return {
    mode,
    maxColors: normalizeNumber(value.maxColors, fallbackMaxColors, 1, maxColorLimit),
    colorTolerance: normalizeNumber(
      value.colorTolerance,
      fallback.colorTolerance,
      0,
      100,
    ),
    strictColorLimit: normalizeBoolean(
      value.strictColorLimit,
      fallback.strictColorLimit,
    ),
    removeBackground: normalizeBoolean(
      value.removeBackground,
      fallback.removeBackground,
    ),
    backgroundColor: normalizeBackgroundColor(
      value.backgroundColor,
      fallback.backgroundColor,
    ),
    trimCanvas: normalizeBoolean(value.trimCanvas, fallback.trimCanvas),
    padding: normalizeNumber(value.padding, fallback.padding, 0, 200, 5),
    minRegionSize: normalizeNumber(
      value.minRegionSize,
      fallback.minRegionSize,
      0,
      100,
    ),
    edgeCleanup: normalizeNumber(
      value.edgeCleanup,
      fallback.edgeCleanup,
      0,
      12,
    ),
    removeEnclosedBackground: normalizeBoolean(
      value.removeEnclosedBackground,
      fallback.removeEnclosedBackground,
    ),
    refineSvg: normalizeBoolean(value.refineSvg, fallback.refineSvg),
    refineImage: normalizeBoolean(value.refineImage, fallback.refineImage),
    enhanceLowRes: mode === 'upscale'
      ? true
      : normalizeBoolean(value.enhanceLowRes, fallback.enhanceLowRes),
    lowResScale: normalizeNumber(
      value.lowResScale,
      fallback.lowResScale,
      0,
      8,
      2,
    ),
    lowResRecovery: normalizeNumber(
      value.lowResRecovery,
      fallback.lowResRecovery,
      0,
      100,
    ),
    paletteOverrides: mode === 'upscale'
      ? {}
      : normalizePaletteOverrides(
          value.paletteOverrides,
          fallback.paletteOverrides,
        ),
    smooth: normalizeNumber(value.smooth, fallback.smooth, 0, 100),
    smoothMode: normalizeSmoothMode(value.smoothMode, fallback.smoothMode),
    edgeSmooth: normalizeNumber(value.edgeSmooth, fallback.edgeSmooth, 0, 100),
  }
}

function pickModeSettings(settings: ImageVectorizerSettings) {
  const keys = [
    ...COMMON_CONFIG_KEYS,
    ...(settings.mode === 'upscale'
      ? UPSCALE_CONFIG_KEYS
      : VECTORIZE_CONFIG_KEYS),
  ]
  const output: Record<string, unknown> = {}

  for (const key of keys) {
    output[key] = key === 'paletteOverrides'
      ? { ...settings.paletteOverrides }
      : settings[key]
  }

  return output as ImageVectorizerConfigPayload['settings']
}

export function createImageVectorizerConfig(
  settings: ImageVectorizerSettings,
): ImageVectorizerConfigPayload {
  const normalized = normalizeImageVectorizerSettings(settings)

  return {
    type: IMAGE_VECTORIZER_CONFIG_TYPE,
    version: IMAGE_VECTORIZER_CONFIG_VERSION,
    mode: normalized.mode,
    settings: pickModeSettings(normalized),
  }
}

export function serializeImageVectorizerConfig(
  settings: ImageVectorizerSettings,
) {
  return JSON.stringify(createImageVectorizerConfig(settings), null, 2)
}

export function parseImageVectorizerConfig(raw: string) {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('INVALID_JSON')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('INVALID_CONFIG')
  }

  const candidate = parsed as {
    type?: unknown
    version?: unknown
    mode?: unknown
    settings?: unknown
  }

  if ('type' in candidate || 'version' in candidate || 'settings' in candidate) {
    if (
      candidate.type !== IMAGE_VECTORIZER_CONFIG_TYPE ||
      !candidate.settings ||
      typeof candidate.settings !== 'object'
    ) {
      throw new Error('INVALID_CONFIG')
    }

    if (candidate.version === 1) {
      return normalizeImageVectorizerSettings({
        ...(candidate.settings as object),
        mode: 'vectorize',
      })
    }

    if (candidate.version !== IMAGE_VECTORIZER_CONFIG_VERSION) {
      throw new Error('INVALID_CONFIG')
    }

    const mode = normalizeMode(candidate.mode, 'vectorize')

    return normalizeImageVectorizerSettings({
      ...(candidate.settings as object),
      mode,
    })
  }

  const plain = parsed as Partial<ImageVectorizerSettings>
  const knownKeys: Array<keyof ImageVectorizerSettings> = [
    'mode',
    ...COMMON_CONFIG_KEYS,
    ...VECTORIZE_CONFIG_KEYS,
    ...UPSCALE_CONFIG_KEYS,
  ]

  if (!knownKeys.some((key) => key in plain)) {
    throw new Error('INVALID_CONFIG')
  }

  return normalizeImageVectorizerSettings(plain)
}

export function loadStoredImageVectorizerSettings() {
  if (!import.meta.client) return null

  const raw = localStorage.getItem(IMAGE_VECTORIZER_STORAGE_KEY)
    || localStorage.getItem(LEGACY_STORAGE_KEY)

  if (!raw) return null

  try {
    const settings = parseImageVectorizerConfig(raw)

    if (!localStorage.getItem(IMAGE_VECTORIZER_STORAGE_KEY)) {
      saveStoredImageVectorizerSettings(settings)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    }

    return settings
  } catch {
    localStorage.removeItem(IMAGE_VECTORIZER_STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return null
  }
}

export function saveStoredImageVectorizerSettings(
  settings: ImageVectorizerSettings,
) {
  if (!import.meta.client) return

  localStorage.setItem(
    IMAGE_VECTORIZER_STORAGE_KEY,
    serializeImageVectorizerConfig(settings),
  )
}
