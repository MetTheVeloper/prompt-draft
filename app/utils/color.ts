import { useAppStore } from '~/store/app'

/* -------------------------------------------------
 * Basic Helpers
 * ------------------------------------------------- */

export function toHex(c: number): string {
  const n = Math.min(255, Math.max(0, Math.floor(c)))
  const hex = n.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null
  const m = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/.exec(hex.trim())
  if (!m) return null

  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  }
}

export function mixColor(
  color: string | undefined,
  percent: number,
  isBlack: boolean = true
): string {
  if (!color) return '#000000'
  const rgb = hexToRgb(color)
  if (!rgb) return color

  const p = Math.max(0, Math.min(100, percent)) / 100
  const { r, g, b } = rgb

  const newR = isBlack ? r * (1 - p) : r + (255 - r) * p
  const newG = isBlack ? g * (1 - p) : g + (255 - g) * p
  const newB = isBlack ? b * (1 - p) : b + (255 - b) * p

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

export function shadeColor(color: string, percent: number): string {
  if (!color || !color.startsWith('#')) return color

  const f = parseInt(color.slice(1), 16)
  if (Number.isNaN(f)) return color

  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent)

  const R = f >> 16
  const G = (f >> 8) & 0x00ff
  const B = f & 0x0000ff

  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  )
}

export function getColorShade(color: string | undefined, percent: number): string {
  if (!color) return '#000000'
  return shadeColor(color, percent)
}

export function getRandomHexColor(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`
}

/* -------------------------------------------------
 * Dynamic Theme Color System
 * ------------------------------------------------- */

/**
 * Alias map (contract-based, not data-based)
 * این فقط قرارداد نام کوتاه → کلید واقعی تم هست
 */
const COLOR_ALIASES: Record<string, string> = {
  prim: 'primary',
  primDark: 'primaryDark',
  onPrim: 'onPrimary',
  sec: 'secondary',
  secDark: 'secondaryDark',
  onSec: 'onSecondary',
  normal: 'normalText',
  dark: 'darkText',
  invert: 'invertText',
  surface: 'themeSurface',
  background: 'themeBackground',
  red: 'themeRed',
  green: 'themeGreen',
  blue: 'themeBlue',
  orange: 'themeOrange',
  yellow: 'themeYellow',
  pink: 'themePink',
  violet: 'themeViolet',
  indigo: 'themeIndigo',
  purple: 'themePurple',
  cyan: 'themeCyan',
  teal: 'themeTeal',
  lime: 'themeLime',
  brown: 'themeBrown',
  slate: 'themeSlate',
  white: 'themeWhite',
  black: 'themeBlack',
  gray: 'themeGray',
  paletteOne: 'paletteOne',
  paletteTwo: 'paletteTwo',
  paletteThree: 'paletteThree',
  trans: 'transparent',
}

/**
 * Build color list dynamically from current theme
 */
export function buildColors() {
  const app = useAppStore()
  const activeTheme = app.theme?.theme || {}
  const projectTheme = app.project?.theme || null

  let merged: Record<string, string> = {}

  if (projectTheme?.static) {
    const mode = projectTheme.static?.mode || activeTheme.mode || 'dark'
    const activeVariant = projectTheme[mode as 'dark' | 'light'] || {}

    merged = {
      ...projectTheme.static,
      ...activeVariant,
    }
  } else {
    merged = {
      ...activeTheme,
    }
  }

  const list = Object.entries(COLOR_ALIASES).map(([short, full]) => {
    const code =
      full === 'transparent'
        ? '#00000000'
        : merged[full] ?? null

    return { short, full, code }
  })

  Object.keys(merged).forEach((key) => {
    if (!list.find((c) => c.full === key)) {
      list.push({
        short: key,
        full: key,
        code: merged[key],
      })
    }
  })

  return list
}

/* -------------------------------------------------
 * Public API
 * ------------------------------------------------- */

export function getColor(col?: string) {
  const colors = buildColors()
  const key = col ? col.replace(/\d/g, '') : null

  if (!key) return colors

  return colors.find((c) => c.short === key || c.full === key)
}

export function getColorCode(col: string): string | null {
  const c = getColor(col)
  return c?.code ?? null
}

export function getColorName(hex: string): string | null {
  const colors = buildColors()
  const found = colors.find((c) => c.code?.toLowerCase() === hex.toLowerCase())
  return found?.short ?? null
}

export function splitColor(color?: string) {
  const fallback = {
    input: color ?? '',
    name: '',
    alpha: 'ff',
    alphaPercent: 100,
    full: '#000000ff',
    variable: 'themeBlack',
    variableFull: 'themeBlack100',
    cssVariableFull: 'var(--themeBlack100)',
    found: false,
  }

  if (!color || typeof color !== 'string') {
    return fallback
  }

  const raw = color.trim()

  if (!raw) {
    return fallback
  }

  /**
   * Example:
   * normal0      → name: normal, alphaPercent: 0
   * normal50     → name: normal, alphaPercent: 50
   * primary100   → name: primary, alphaPercent: 100
   * primDark25   → name: primDark, alphaPercent: 25
   */
  const match = raw.match(/\d+/)
  const parsedAlphaPercent = match ? parseInt(match[0], 10) : 100

  const alphaPercent = Math.min(100, Math.max(0, parsedAlphaPercent))

  const alpha = Math.round((alphaPercent / 100) * 255)
    .toString(16)
    .padStart(2, '0')

  const name = raw.replace(/\d+/g, '')

  if (!name) {

    return {
      ...fallback,
      input: raw,
      alpha,
      alphaPercent,
    }
  }

  const c = getColor(name)


  if (!c?.code) {

    return {
      ...fallback,
      input: raw,
      name,
      alpha,
      alphaPercent,
    }
  }

  /**
   * transparent خودش 8-digit hex هست: #00000000
   * پس برای جلوگیری از ساختن #00000000ff
   * جدا هندلش می‌کنیم.
   */
  const baseCode = c.code

  const full =
    baseCode.length === 9
      ? baseCode
      : `${baseCode}${alpha}`

  return {
    input: raw,
    name,
    alpha,
    alphaPercent,
    full,
    variable: c.full,
    variableFull: `${c.full}${alphaPercent}`,
    cssVariableFull: `var(--${c.full}${alphaPercent})`,
    found: true,
  }
}