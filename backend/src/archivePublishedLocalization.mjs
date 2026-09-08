const PUBLISHED_ARCHIVE_LOCALES = Object.freeze(['en', 'fa'])

function localizedText(value, locale) {
  return value && typeof value === 'object' && !Array.isArray(value) && typeof value[locale] === 'string'
    ? value[locale].trim()
    : ''
}

export function validatePublishedArchiveLocalization({ title, description } = {}) {
  const errors = []

  for (const locale of PUBLISHED_ARCHIVE_LOCALES) {
    if (!localizedText(title, locale)) {
      errors.push({
        field: `title.${locale}`,
        message: `${locale.toUpperCase()} title is required before publishing`,
      })
    }
    if (!localizedText(description, locale)) {
      errors.push({
        field: `description.${locale}`,
        message: `${locale.toUpperCase()} description is required before publishing`,
      })
    }
  }

  return errors
}

export function assertPublishedArchiveLocalization(value) {
  const errors = validatePublishedArchiveLocalization(value)
  if (!errors.length) return

  const error = new Error('Archive localization is incomplete')
  error.code = 'ARCHIVE_LOCALIZATION_INCOMPLETE'
  error.errors = errors
  throw error
}
