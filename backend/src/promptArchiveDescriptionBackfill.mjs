const DESCRIPTION_LOCALES = Object.freeze(['en', 'fa'])
const MAX_DESCRIPTION_LENGTH = 2000

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parsePublicId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

export function normalizeDescriptionManifest(value) {
  if (!isPlainObject(value)) {
    throw new Error('Description manifest must be a JSON object keyed by public Prompt id')
  }

  const output = new Map()
  for (const [rawId, descriptions] of Object.entries(value)) {
    const publicId = parsePublicId(rawId)
    if (!publicId) throw new Error(`Invalid public Prompt id in description manifest: ${rawId}`)
    if (!isPlainObject(descriptions)) {
      throw new Error(`Description manifest entry ${publicId} must be an object`)
    }

    const normalized = {}
    for (const locale of DESCRIPTION_LOCALES) {
      const text = typeof descriptions[locale] === 'string' ? descriptions[locale].trim() : ''
      if (!text || text.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(
          `Description ${publicId}.${locale} must be 1-${MAX_DESCRIPTION_LENGTH} characters`,
        )
      }
      normalized[locale] = text
    }

    const unexpectedLocales = Object.keys(descriptions)
      .filter(locale => !DESCRIPTION_LOCALES.includes(locale))
    if (unexpectedLocales.length) {
      throw new Error(
        `Description manifest entry ${publicId} has unsupported locales: ${unexpectedLocales.join(', ')}`,
      )
    }

    output.set(publicId, normalized)
  }

  return output
}

export function assertManifestMatchesPublishedIds(manifest, publishedIds) {
  const normalizedPublishedIds = [...publishedIds].map(Number).sort((a, b) => a - b)
  const manifestIds = [...manifest.keys()].sort((a, b) => a - b)
  const publishedSet = new Set(normalizedPublishedIds)
  const manifestSet = new Set(manifestIds)

  const missing = normalizedPublishedIds.filter(id => !manifestSet.has(id))
  const extra = manifestIds.filter(id => !publishedSet.has(id))

  if (missing.length || extra.length) {
    const parts = []
    if (missing.length) parts.push(`missing published ids: ${missing.join(', ')}`)
    if (extra.length) parts.push(`extra/non-published ids: ${extra.join(', ')}`)
    throw new Error(`Description manifest does not exactly match published Archive rows (${parts.join('; ')})`)
  }
}
