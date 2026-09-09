export type PublicLocale = 'en' | 'fa'
export type PublicUrlResourceKind = 'static' | 'discovery' | 'prompt' | 'creator'

export type PublicUrlResource = {
  kind: PublicUrlResourceKind
  locale: PublicLocale
  canonicalPath: string
}

export type PublicApiInventory = {
  prompts: Array<{
    id: number
    availableLocales: string[]
  }>
  creators: Array<{
    username: string
    availableLocales: string[]
    policy: {
      indexable: boolean
      discoverable: boolean
    }
  }>
}

export const PUBLIC_LOCALES: readonly PublicLocale[] = ['en', 'fa'] as const

export const PUBLIC_DISCOVERY_CATALOG = [
  {
    slug: 'portrait-photography',
    title: 'Portraits & Photography',
    description: 'Portraits, photography, avatars, headshots and identity-led visuals.',
    tags: ['portrait', 'photography', 'avatar'],
  },
  {
    slug: '3d-sculpture',
    title: '3D & Sculpture',
    description: '3D characters, crafted objects, figurines and sculptural transformations.',
    tags: ['3d', 'sculpture'],
  },
  {
    slug: 'illustration-animation',
    title: 'Illustration & Animation',
    description: 'Illustration, anime, cartoons and animation-inspired visual styles.',
    tags: ['illustration', 'animation-style', 'anime', 'cartoon'],
  },
  {
    slug: 'posters-editorial',
    title: 'Posters & Editorial',
    description: 'Poster design, covers, editorial compositions and publication-style visuals.',
    tags: ['poster', 'editorial'],
  },
  {
    slug: 'product-fashion',
    title: 'Product & Fashion',
    description: 'Product imagery, advertising, clothing previews and fashion direction.',
    tags: ['product', 'fashion'],
  },
  {
    slug: 'cinematic-game-art',
    title: 'Cinematic & Game Art',
    description: 'Cinematic scenes, game-inspired visuals, characters and dramatic worlds.',
    tags: ['cinematic', 'game-style', 'pixel-art'],
  },
] as const

const STATIC_ACQUISITION_PATHS = ['/', '/guide'] as const
const PUBLIC_LOCALE_SET = new Set<string>(PUBLIC_LOCALES)

function normalizeAvailableLocales(value: unknown): PublicLocale[] {
  if (!Array.isArray(value)) return []

  return PUBLIC_LOCALES.filter(locale => value.includes(locale))
}

function localizedCanonicalPath(basePath: string, locale: PublicLocale) {
  if (locale === 'en') return basePath
  return basePath === '/' ? '/fa' : `/fa${basePath}`
}

function addLocalizedResource(
  resources: PublicUrlResource[],
  kind: PublicUrlResourceKind,
  basePath: string,
  locales: readonly PublicLocale[],
) {
  for (const locale of locales) {
    resources.push({
      kind,
      locale,
      canonicalPath: localizedCanonicalPath(basePath, locale),
    })
  }
}

export function buildPublicUrlInventory({
  dynamicInventory,
  indexingEnabled = true,
}: {
  dynamicInventory?: PublicApiInventory | null
  indexingEnabled?: boolean
} = {}): PublicUrlResource[] {
  if (!indexingEnabled) return []

  const resources: PublicUrlResource[] = []

  for (const path of STATIC_ACQUISITION_PATHS) {
    addLocalizedResource(resources, 'static', path, PUBLIC_LOCALES)
  }

  for (const category of PUBLIC_DISCOVERY_CATALOG) {
    addLocalizedResource(resources, 'discovery', `/discover/${category.slug}`, PUBLIC_LOCALES)
  }

  for (const prompt of dynamicInventory?.prompts ?? []) {
    const id = Number(prompt?.id)
    if (!Number.isSafeInteger(id) || id <= 0) continue

    const locales = normalizeAvailableLocales(prompt.availableLocales)
    addLocalizedResource(resources, 'prompt', `/prompt/${id}`, locales)
  }

  for (const creator of dynamicInventory?.creators ?? []) {
    // The server-authoritative 4C result is the only Creator eligibility gate
    // here. Do not recreate account/role/profile/publication heuristics in build code.
    if (creator?.policy?.indexable !== true) continue

    const username = typeof creator.username === 'string' ? creator.username.trim() : ''
    if (!username) continue

    const locales = normalizeAvailableLocales(creator.availableLocales)
    addLocalizedResource(
      resources,
      'creator',
      `/creator/${encodeURIComponent(username)}`,
      locales,
    )
  }

  const unique = new Map<string, PublicUrlResource>()
  for (const resource of resources) {
    if (!resource.canonicalPath.startsWith('/')) continue
    const key = `${resource.locale}:${resource.canonicalPath}`
    if (!unique.has(key)) unique.set(key, resource)
  }

  return [...unique.values()].sort((left, right) => {
    const pathOrder = left.canonicalPath.localeCompare(right.canonicalPath)
    if (pathOrder !== 0) return pathOrder
    return left.locale.localeCompare(right.locale)
  })
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function renderSitemapXml(resources: readonly PublicUrlResource[], siteUrl: string) {
  const normalizedSiteUrl = new URL(siteUrl).toString().replace(/\/+$/, '')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...resources.map((resource) => {
      const loc = new URL(resource.canonicalPath, `${normalizedSiteUrl}/`).toString()
      return `  <url><loc>${escapeXml(loc)}</loc></url>`
    }),
    '</urlset>',
    '',
  ].join('\n')
}

function toBaseCanonicalPath(resource: PublicUrlResource) {
  if (resource.locale !== 'fa') return resource.canonicalPath
  if (resource.canonicalPath === '/fa') return '/'
  return resource.canonicalPath.startsWith('/fa/')
    ? resource.canonicalPath.slice(3) || '/'
    : resource.canonicalPath
}

function escapeMarkdownLabel(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
}

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function llmsResourceLabel(resource: PublicUrlResource) {
  const basePath = toBaseCanonicalPath(resource)
  const localeLabel = resource.locale === 'fa' ? 'Persian' : 'English'

  if (resource.kind === 'static') {
    const label = basePath === '/' ? 'Prompt Draft home' : 'Prompt Draft guide'
    return `${label} — ${localeLabel}`
  }

  if (resource.kind === 'discovery') {
    const slug = basePath.split('/').filter(Boolean).at(-1) || ''
    const category = PUBLIC_DISCOVERY_CATALOG.find(item => item.slug === slug)
    return `${category?.title || slug || 'Discovery'} — ${localeLabel}`
  }

  if (resource.kind === 'prompt') {
    const id = basePath.split('/').filter(Boolean).at(-1) || ''
    return `Public Prompt ${id} — ${localeLabel}`
  }

  const username = decodePathSegment(basePath.split('/').filter(Boolean).at(-1) || '')
  return `Creator ${username} — ${localeLabel}`
}

const LLMS_SECTIONS: readonly Array<{
  kind: PublicUrlResourceKind
  title: string
}> = [
  { kind: 'static', title: 'Core' },
  { kind: 'discovery', title: 'Discovery' },
  { kind: 'creator', title: 'Creators' },
  { kind: 'prompt', title: 'Public Prompts' },
] as const

export function renderLlmsTxt(resources: readonly PublicUrlResource[], siteUrl: string) {
  const normalizedSiteUrl = new URL(siteUrl).toString().replace(/\/+$/, '')

  if (resources.length === 0) {
    return [
      '# Prompt Draft',
      '',
      '> Prompt Draft public AI-discovery inventory is disabled for this environment.',
      '',
      'This environment does not publish canonical public resource links through llms.txt. Crawler access and indexing behavior remain governed by robots.txt and response-level noindex signals.',
      '',
    ].join('\n')
  }

  const lines = [
    '# Prompt Draft',
    '',
    '> Discover curated visual prompts, public creators, and structured prompt workflows with Prompt Draft.',
    '',
    'The links below are canonical public resources projected from the same indexability inventory used by sitemap.xml. English URLs are unprefixed and Persian URLs use /fa. Protected Prompt bodies, private Drafts, authenticated account surfaces, and other non-public data are intentionally excluded. Crawler permissions remain governed by robots.txt.',
    '',
  ]

  for (const section of LLMS_SECTIONS) {
    const sectionResources = resources.filter(resource => resource.kind === section.kind)
    if (sectionResources.length === 0) continue

    lines.push(`## ${section.title}`, '')
    for (const resource of sectionResources) {
      const href = new URL(resource.canonicalPath, `${normalizedSiteUrl}/`).toString()
      lines.push(`- [${escapeMarkdownLabel(llmsResourceLabel(resource))}](${href})`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function isPublicApiInventory(value: unknown): value is PublicApiInventory {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const inventory = value as Record<string, unknown>
  if (!Array.isArray(inventory.prompts) || !Array.isArray(inventory.creators)) return false

  return inventory.prompts.every((prompt) => {
    if (!prompt || typeof prompt !== 'object' || Array.isArray(prompt)) return false
    const candidate = prompt as Record<string, unknown>
    return Number.isSafeInteger(Number(candidate.id)) &&
      Number(candidate.id) > 0 &&
      Array.isArray(candidate.availableLocales) &&
      candidate.availableLocales.every(locale => typeof locale === 'string' && PUBLIC_LOCALE_SET.has(locale))
  }) && inventory.creators.every((creator) => {
    if (!creator || typeof creator !== 'object' || Array.isArray(creator)) return false
    const candidate = creator as Record<string, unknown>
    const policy = candidate.policy
    return typeof candidate.username === 'string' &&
      candidate.username.trim().length > 0 &&
      Array.isArray(candidate.availableLocales) &&
      candidate.availableLocales.every(locale => typeof locale === 'string' && PUBLIC_LOCALE_SET.has(locale)) &&
      Boolean(policy) &&
      typeof policy === 'object' &&
      !Array.isArray(policy) &&
      typeof (policy as Record<string, unknown>).indexable === 'boolean' &&
      typeof (policy as Record<string, unknown>).discoverable === 'boolean'
  })
}
