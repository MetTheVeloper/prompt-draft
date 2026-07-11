import type {
  ImageVectorizerConfigPayload,
  ImageVectorizerSettings,
} from '~/types/imageVectorizer'

export const IMAGE_VECTORIZER_CONFIG_TYPE = 'prompt-draft.image-vectorizer-config'
export const IMAGE_VECTORIZER_CONFIG_VERSION = 1
export const IMAGE_VECTORIZER_STORAGE_KEY = 'prompt-draft:image-vectorizer:settings:v1'

export const DEFAULT_IMAGE_VECTORIZER_SETTINGS: ImageVectorizerSettings = {
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
  enhanceLowRes: false,
  lowResScale: 0,
  lowResRecovery: 60,
  paletteOverrides: {},
  smooth: 18,
  smoothMode: 'pre',
}

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

  return {
    maxColors: normalizeNumber(value.maxColors, fallback.maxColors, 1, 32),
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
    refineSvg: normalizeBoolean(
      value.refineSvg,
      fallback.refineSvg,
    ),
    enhanceLowRes: normalizeBoolean(
      value.enhanceLowRes,
      fallback.enhanceLowRes,
    ),
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
    paletteOverrides: normalizePaletteOverrides(
      value.paletteOverrides,
      fallback.paletteOverrides,
    ),
    smooth: normalizeNumber(value.smooth, fallback.smooth, 0, 100),
    smoothMode: normalizeSmoothMode(value.smoothMode, fallback.smoothMode),
  }
}

export function createImageVectorizerConfig(
  settings: ImageVectorizerSettings,
): ImageVectorizerConfigPayload {
  return {
    type: IMAGE_VECTORIZER_CONFIG_TYPE,
    version: IMAGE_VECTORIZER_CONFIG_VERSION,
    settings: normalizeImageVectorizerSettings(settings),
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

  const candidate = parsed as Partial<ImageVectorizerConfigPayload> & {
    settings?: unknown
  }

  if ('type' in candidate || 'version' in candidate || 'settings' in candidate) {
    if (
      candidate.type !== IMAGE_VECTORIZER_CONFIG_TYPE ||
      candidate.version !== IMAGE_VECTORIZER_CONFIG_VERSION ||
      !candidate.settings ||
      typeof candidate.settings !== 'object'
    ) {
      throw new Error('INVALID_CONFIG')
    }

    return normalizeImageVectorizerSettings(candidate.settings)
  }

  const knownKeys: Array<keyof ImageVectorizerSettings> = [
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
    'refineSvg',
    'enhanceLowRes',
    'lowResScale',
    'lowResRecovery',
    'paletteOverrides',
    'smooth',
  ]
  const hasKnownSetting = knownKeys.some((key) => key in candidate)

  if (!hasKnownSetting) {
    throw new Error('INVALID_CONFIG')
  }

  // Accept a plain settings object too. This makes debug snippets easier to
  // paste while the copied format remains versioned and self-describing.
  return normalizeImageVectorizerSettings(parsed)
}

export function loadStoredImageVectorizerSettings() {
  if (!import.meta.client) return null

  const raw = localStorage.getItem(IMAGE_VECTORIZER_STORAGE_KEY)

  if (!raw) return null

  try {
    return parseImageVectorizerConfig(raw)
  } catch {
    localStorage.removeItem(IMAGE_VECTORIZER_STORAGE_KEY)
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
