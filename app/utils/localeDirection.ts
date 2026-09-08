export type LocaleTextDirection = 'ltr' | 'rtl'

const RTL_LANGUAGE_FALLBACK = new Set([
  'ar',
  'dv',
  'fa',
  'he',
  'ku',
  'ps',
  'sd',
  'ug',
  'ur',
  'yi',
])

export function localeTextDirection(value: string): LocaleTextDirection {
  const normalized = value.trim().replace('_', '-')
  if (!normalized) return 'ltr'

  try {
    const locale = new Intl.Locale(normalized) as unknown as {
      textInfo?: { direction?: string }
    }
    const direction = locale.textInfo?.direction
    if (direction === 'rtl') return 'rtl'
    if (direction === 'ltr') return 'ltr'
  } catch {
    // Fall through to the language-subtag compatibility list below.
  }

  const language = normalized.split('-', 1)[0]?.toLowerCase() ?? ''
  return RTL_LANGUAGE_FALLBACK.has(language) ? 'rtl' : 'ltr'
}
