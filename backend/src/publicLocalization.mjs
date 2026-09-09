export const PUBLIC_CONTENT_LOCALES = Object.freeze(['en', 'fa'])

function normalizeLocalizedText(value, locale) {
  return value && typeof value === 'object' && !Array.isArray(value) && typeof value[locale] === 'string'
    ? value[locale].trim()
    : ''
}

export function normalizePublicPromptLocalization(titleValue, descriptionValue) {
  const title = {}
  const description = {}
  const availableLocales = []

  for (const locale of PUBLIC_CONTENT_LOCALES) {
    const localizedTitle = normalizeLocalizedText(titleValue, locale)
    const localizedDescription = normalizeLocalizedText(descriptionValue, locale)

    if (!localizedTitle || !localizedDescription) continue

    title[locale] = localizedTitle
    description[locale] = localizedDescription
    availableLocales.push(locale)
  }

  return availableLocales.length
    ? { title, description, availableLocales }
    : null
}
