import { normalizePublicCreatorUsername } from '~/utils/publicRoutes'

export type PublicCreatorLocale = 'en' | 'fa'
export type PublicCreatorLinkType =
  | 'website'
  | 'github'
  | 'linkedin'
  | 'instagram'
  | 'telegram'
  | 'x'
  | 'youtube'
  | 'other'

export type PublicCreatorCover = {
  fullUrl: string
  thumbnailUrl: string
  width: number | null
  height: number | null
  thumbnailWidth: number | null
  thumbnailHeight: number | null
}

export type PublicCreatorSkill = {
  slug: string
  categorySlug: string
  title: Record<PublicCreatorLocale, string>
}

export type PublicCreatorLink = {
  type: PublicCreatorLinkType
  url: string
  label: string | null
}

export type PublicCreatorPublication = {
  id: number
  title: Partial<Record<PublicCreatorLocale, string>>
  description: Partial<Record<PublicCreatorLocale, string>>
  availableLocales: PublicCreatorLocale[]
  publishedAt: string
  coverImage: {
    fullUrl: string
    thumbnailUrl: string
  } | null
}

export type PublicCreator = {
  identity: {
    username: string
    screenName: Record<PublicCreatorLocale, string>
    bio: Record<PublicCreatorLocale, string>
    article: Record<PublicCreatorLocale, string>
    avatarUrl: string | null
    cover: PublicCreatorCover | null
    skills: PublicCreatorSkill[]
    links: PublicCreatorLink[]
    location: { text: string } | null
  }
  publications: PublicCreatorPublication[]
  policy: {
    indexable: boolean
    discoverable: boolean
  }
}

type PublicCreatorResponse = {
  ok: true
  creator: unknown
}

const PUBLIC_CREATOR_LOCALES = new Set<PublicCreatorLocale>(['en', 'fa'])
const PUBLIC_LINK_TYPES = new Set<PublicCreatorLinkType>([
  'website',
  'github',
  'linkedin',
  'instagram',
  'telegram',
  'x',
  'youtube',
  'other',
])
const SKILL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

function normalizeHttpUrl(value: unknown) {
  const raw = normalizeOptionalString(value)
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

function normalizePositiveInteger(value: unknown) {
  if (value === null || value === undefined) return null
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function normalizeLocalizedPair(value: unknown, { allowEmpty = false } = {}) {
  if (!isPlainObject(value)) return null
  const output = {} as Record<PublicCreatorLocale, string>

  for (const locale of PUBLIC_CREATOR_LOCALES) {
    if (typeof value[locale] !== 'string') return null
    const normalized = value[locale].trim()
    if (!allowEmpty && !normalized) return null
    output[locale] = normalized
  }

  return output
}

function normalizePartialLocalization(value: unknown) {
  if (!isPlainObject(value)) return null
  const output: Partial<Record<PublicCreatorLocale, string>> = {}

  for (const locale of PUBLIC_CREATOR_LOCALES) {
    if (value[locale] === undefined) continue
    if (typeof value[locale] !== 'string') return null
    const normalized = value[locale].trim()
    if (!normalized) return null
    output[locale] = normalized
  }

  return Object.keys(output).length ? output : null
}

function normalizeCover(value: unknown): PublicCreatorCover | null | undefined {
  if (value === null || value === undefined) return null
  if (!isPlainObject(value)) return undefined

  const fullUrl = normalizeHttpUrl(value.fullUrl)
  if (!fullUrl) return undefined
  const thumbnailUrl = normalizeHttpUrl(value.thumbnailUrl) || fullUrl

  const dimensions = [
    normalizePositiveInteger(value.width),
    normalizePositiveInteger(value.height),
    normalizePositiveInteger(value.thumbnailWidth),
    normalizePositiveInteger(value.thumbnailHeight),
  ]

  for (const [index, raw] of [
    value.width,
    value.height,
    value.thumbnailWidth,
    value.thumbnailHeight,
  ].entries()) {
    if (raw !== null && raw !== undefined && dimensions[index] === null) return undefined
  }

  return {
    fullUrl,
    thumbnailUrl,
    width: dimensions[0],
    height: dimensions[1],
    thumbnailWidth: dimensions[2],
    thumbnailHeight: dimensions[3],
  }
}

function normalizeSkill(value: unknown): PublicCreatorSkill | null {
  if (!isPlainObject(value)) return null
  const slug = normalizeOptionalString(value.slug)?.toLowerCase() || ''
  const categorySlug = normalizeOptionalString(value.categorySlug)?.toLowerCase() || ''
  const title = normalizeLocalizedPair(value.title)

  if (!SKILL_SLUG_PATTERN.test(slug) || !SKILL_SLUG_PATTERN.test(categorySlug) || !title) {
    return null
  }

  return { slug, categorySlug, title }
}

function normalizeLink(value: unknown): PublicCreatorLink | null {
  if (!isPlainObject(value)) return null
  const type = normalizeOptionalString(value.type)?.toLowerCase() as PublicCreatorLinkType | undefined
  const url = normalizeHttpUrl(value.url)
  if (!type || !PUBLIC_LINK_TYPES.has(type) || !url) return null

  const label = value.label === null || value.label === undefined
    ? null
    : normalizeOptionalString(value.label)
  if (value.label !== null && value.label !== undefined && !label) return null

  return { type, url, label }
}

function normalizePublicationCover(value: unknown) {
  if (value === null || value === undefined) return null
  if (!isPlainObject(value)) return undefined
  const fullUrl = normalizeHttpUrl(value.fullUrl)
  if (!fullUrl) return undefined
  return {
    fullUrl,
    thumbnailUrl: normalizeHttpUrl(value.thumbnailUrl) || fullUrl,
  }
}

function normalizePublication(value: unknown): PublicCreatorPublication | null {
  if (!isPlainObject(value)) return null
  const id = normalizePositiveInteger(value.id)
  const title = normalizePartialLocalization(value.title)
  const description = normalizePartialLocalization(value.description)
  const publishedAt = typeof value.publishedAt === 'string' ? value.publishedAt : ''
  const coverImage = normalizePublicationCover(value.coverImage)

  if (!id || !title || !description || !publishedAt || Number.isNaN(Date.parse(publishedAt)) || coverImage === undefined) {
    return null
  }
  if (!Array.isArray(value.availableLocales)) return null

  const availableLocales: PublicCreatorLocale[] = []
  const seen = new Set<PublicCreatorLocale>()
  for (const item of value.availableLocales) {
    if (typeof item !== 'string' || !PUBLIC_CREATOR_LOCALES.has(item as PublicCreatorLocale)) return null
    const locale = item as PublicCreatorLocale
    if (seen.has(locale) || !title[locale] || !description[locale]) return null
    seen.add(locale)
    availableLocales.push(locale)
  }

  const titleLocales = Object.keys(title) as PublicCreatorLocale[]
  const descriptionLocales = Object.keys(description) as PublicCreatorLocale[]
  if (
    !availableLocales.length ||
    availableLocales.length !== titleLocales.length ||
    availableLocales.length !== descriptionLocales.length ||
    titleLocales.some(locale => !seen.has(locale)) ||
    descriptionLocales.some(locale => !seen.has(locale))
  ) {
    return null
  }

  return {
    id,
    title,
    description,
    availableLocales,
    publishedAt: new Date(publishedAt).toISOString(),
    coverImage,
  }
}

export function normalizePublicCreator(value: unknown): PublicCreator | null {
  if (!isPlainObject(value) || !isPlainObject(value.identity) || !isPlainObject(value.policy)) return null
  const identity = value.identity

  const rawUsername = normalizeOptionalString(identity.username)
  if (!rawUsername) return null

  let username = ''
  try {
    username = normalizePublicCreatorUsername(rawUsername)
  } catch {
    return null
  }
  if (username !== rawUsername) return null

  const screenName = normalizeLocalizedPair(identity.screenName)
  const bio = normalizeLocalizedPair(identity.bio, { allowEmpty: true })
  const article = normalizeLocalizedPair(identity.article, { allowEmpty: true })
  const avatarUrl = identity.avatarUrl === null || identity.avatarUrl === undefined
    ? null
    : normalizeHttpUrl(identity.avatarUrl)
  const cover = normalizeCover(identity.cover)

  if (!screenName || !bio || !article || cover === undefined) return null
  if (identity.avatarUrl !== null && identity.avatarUrl !== undefined && !avatarUrl) return null
  if (!Array.isArray(identity.skills) || !Array.isArray(identity.links) || !Array.isArray(value.publications)) return null

  const skills = identity.skills.map(normalizeSkill)
  const links = identity.links.map(normalizeLink)
  const publications = value.publications.map(normalizePublication)
  if (skills.some(item => !item) || links.some(item => !item) || publications.some(item => !item)) return null

  let location: { text: string } | null = null
  if (identity.location !== null && identity.location !== undefined) {
    if (!isPlainObject(identity.location)) return null
    const text = normalizeOptionalString(identity.location.text)
    if (!text) return null
    location = { text }
  }

  if (typeof value.policy.indexable !== 'boolean' || typeof value.policy.discoverable !== 'boolean') return null

  return {
    identity: {
      username,
      screenName,
      bio,
      article,
      avatarUrl,
      cover,
      skills: skills as PublicCreatorSkill[],
      links: links as PublicCreatorLink[],
      location,
    },
    publications: publications as PublicCreatorPublication[],
    policy: {
      indexable: value.policy.indexable,
      discoverable: value.policy.discoverable,
    },
  }
}

export function usePublicCreator() {
  const config = useRuntimeConfig()
  const apiBase = normalizeApiBase(
    import.meta.server ? config.apiBaseInternal : config.public.apiBase,
  )

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  async function load(username: string) {
    const canonicalUsername = normalizePublicCreatorUsername(username)
    if (username.trim() !== canonicalUsername) {
      throw new Error('Public Creator username must be canonical')
    }

    const response = await $fetch<PublicCreatorResponse>(
      endpoint(`/api/public/creators/${encodeURIComponent(canonicalUsername)}`),
    )
    if (!response || response.ok !== true) {
      throw new Error('Invalid public Creator response')
    }

    const creator = normalizePublicCreator(response.creator)
    if (!creator || creator.identity.username !== canonicalUsername) {
      throw new Error('Invalid public Creator response')
    }

    return creator
  }

  return { load }
}
