const DESCRIPTION_LOCALES = Object.freeze(['en', 'fa'])
export const MAX_ARCHIVE_DESCRIPTION_LENGTH = 2000

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function validateArchiveDescriptionInput(value) {
  if (value === undefined) return []

  if (!isPlainObject(value)) {
    return [{ field: 'description', message: 'description must contain en and fa values' }]
  }

  const errors = []
  for (const locale of DESCRIPTION_LOCALES) {
    const text = typeof value[locale] === 'string' ? value[locale].trim() : ''
    if (!text || text.length > MAX_ARCHIVE_DESCRIPTION_LENGTH) {
      errors.push({
        field: `description.${locale}`,
        message: `${locale.toUpperCase()} description must be 1-${MAX_ARCHIVE_DESCRIPTION_LENGTH} characters`,
      })
    }
  }

  return errors
}

export function normalizeArchiveDescriptionInput(value) {
  if (!isPlainObject(value)) return {}
  return {
    en: value.en.trim(),
    fa: value.fa.trim(),
  }
}
