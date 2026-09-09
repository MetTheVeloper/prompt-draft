export const BLOG_LOCALES = ['en', 'fa'] as const
export const BLOG_ARTICLE_STATUSES = ['draft', 'published'] as const
export const BLOG_ARTICLE_METADATA_FILE = 'article.json'
export const BLOG_ARTICLE_BODY_FILES = Object.freeze({
  en: 'en.md',
  fa: 'fa.md',
} as const)

export type BlogLocale = (typeof BLOG_LOCALES)[number]
export type BlogArticleStatus = (typeof BLOG_ARTICLE_STATUSES)[number]

export type BlogLocalizationMetadata = {
  title: string
  description: string
}

export type BlogEditorialAuthor = {
  kind: 'editorial'
  name: string
  url: string | null
}

export type BlogHero = {
  fullUrl: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  alt: Partial<Record<BlogLocale, string>>
}

export type BlogArticleMetadata = {
  id: string
  slug: string
  status: BlogArticleStatus
  publishedAt: string | null
  updatedAt: string
  author: BlogEditorialAuthor
  hero: BlogHero | null
  localizations: Partial<Record<BlogLocale, BlogLocalizationMetadata>>
}

export type BlogArticle = BlogArticleMetadata & {
  body: Partial<Record<BlogLocale, string>>
  availableLocales: BlogLocale[]
}

export type BlogValidationIssue = {
  path: string
  message: string
}

export type BlogArticleValidationResult =
  | { ok: true; article: BlogArticle }
  | { ok: false; issues: BlogValidationIssue[] }

export type BlogRepositoryValidationResult =
  | { ok: true; articles: BlogArticle[] }
  | { ok: false; issues: BlogValidationIssue[] }

const ARTICLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RFC3339_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/
const UNSAFE_MARKDOWN_DESTINATION = /!?\[[^\]]*\]\(\s*(?:javascript:|data:|vbscript:|file:)/i
const MAX_ARTICLE_ID_LENGTH = 80
const MAX_SLUG_LENGTH = 100
const MAX_TITLE_LENGTH = 180
const MAX_DESCRIPTION_LENGTH = 400
const MAX_AUTHOR_NAME_LENGTH = 120
const MAX_ALT_LENGTH = 240
const MAX_BODY_BYTES = 512 * 1024

function issue(issues: BlogValidationIssue[], path: string, message: string) {
  issues.push({ path, message })
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: BlogValidationIssue[],
) {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    issue(issues, path, `must contain exactly: ${wanted.join(', ')}`)
  }
}

function normalizeBoundedString(
  value: unknown,
  path: string,
  issues: BlogValidationIssue[],
  maxLength: number,
  { minLength = 1 }: { minLength?: number } = {},
) {
  if (typeof value !== 'string') {
    issue(issues, path, 'must be a string')
    return ''
  }
  const normalized = value.trim()
  if (normalized.length < minLength) {
    issue(issues, path, `must contain at least ${minLength} character${minLength === 1 ? '' : 's'}`)
  }
  if (normalized.length > maxLength) {
    issue(issues, path, `must contain at most ${maxLength} characters`)
  }
  return normalized
}

function normalizeTimestamp(
  value: unknown,
  path: string,
  issues: BlogValidationIssue[],
  { nullable = false }: { nullable?: boolean } = {},
) {
  if (nullable && value === null) return null
  if (typeof value !== 'string' || !RFC3339_PATTERN.test(value)) {
    issue(issues, path, 'must be an RFC3339 timestamp with an explicit timezone')
    return null
  }
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) {
    issue(issues, path, 'must be a valid timestamp')
    return null
  }
  return timestamp.toISOString()
}

export function normalizeBlogPublicUrl(value: unknown) {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

function normalizeNullablePublicUrl(
  value: unknown,
  path: string,
  issues: BlogValidationIssue[],
) {
  if (value === null) return null
  const url = normalizeBlogPublicUrl(value)
  if (!url) issue(issues, path, 'must be null, root-relative, or an absolute HTTP(S) URL')
  return url
}

function normalizeRequiredPublicUrl(
  value: unknown,
  path: string,
  issues: BlogValidationIssue[],
) {
  const url = normalizeBlogPublicUrl(value)
  if (!url) issue(issues, path, 'must be a root-relative or absolute HTTP(S) URL')
  return url ?? ''
}

function normalizeNullableDimension(
  value: unknown,
  path: string,
  issues: BlogValidationIssue[],
) {
  if (value === null) return null
  if (!Number.isSafeInteger(value) || Number(value) <= 0 || Number(value) > 20_000) {
    issue(issues, path, 'must be null or a positive integer no greater than 20000')
    return null
  }
  return Number(value)
}

function normalizeAuthor(value: unknown, issues: BlogValidationIssue[]): BlogEditorialAuthor {
  if (!isPlainObject(value)) {
    issue(issues, 'author', 'must be an object')
    return { kind: 'editorial', name: '', url: null }
  }
  assertExactKeys(value, ['kind', 'name', 'url'], 'author', issues)
  if (value.kind !== 'editorial') {
    issue(issues, 'author.kind', 'V1 supports only explicit editorial/site author identities')
  }
  return {
    kind: 'editorial',
    name: normalizeBoundedString(value.name, 'author.name', issues, MAX_AUTHOR_NAME_LENGTH),
    url: normalizeNullablePublicUrl(value.url, 'author.url', issues),
  }
}

function normalizeHero(
  value: unknown,
  localizations: Partial<Record<BlogLocale, BlogLocalizationMetadata>>,
  issues: BlogValidationIssue[],
): BlogHero | null {
  if (value === null) return null
  if (!isPlainObject(value)) {
    issue(issues, 'hero', 'must be null or an object')
    return null
  }
  assertExactKeys(value, ['fullUrl', 'thumbnailUrl', 'width', 'height', 'alt'], 'hero', issues)
  const width = normalizeNullableDimension(value.width, 'hero.width', issues)
  const height = normalizeNullableDimension(value.height, 'hero.height', issues)
  if ((width === null) !== (height === null)) {
    issue(issues, 'hero', 'width and height must either both be null or both be present')
  }

  const alt: Partial<Record<BlogLocale, string>> = {}
  if (!isPlainObject(value.alt)) {
    issue(issues, 'hero.alt', 'must be an object keyed only by authoritative locales')
  } else {
    const extraKeys = Object.keys(value.alt).filter(key => !BLOG_LOCALES.includes(key as BlogLocale))
    if (extraKeys.length) issue(issues, 'hero.alt', `contains unsupported locale key(s): ${extraKeys.join(', ')}`)
    for (const locale of BLOG_LOCALES) {
      const raw = value.alt[locale]
      if (raw === undefined) continue
      alt[locale] = normalizeBoundedString(raw, `hero.alt.${locale}`, issues, MAX_ALT_LENGTH)
    }
  }

  for (const locale of BLOG_LOCALES) {
    if (localizations[locale] && !alt[locale]) {
      issue(issues, `hero.alt.${locale}`, 'is required when hero media and this localization are present')
    }
  }

  return {
    fullUrl: normalizeRequiredPublicUrl(value.fullUrl, 'hero.fullUrl', issues),
    thumbnailUrl: normalizeNullablePublicUrl(value.thumbnailUrl, 'hero.thumbnailUrl', issues),
    width,
    height,
    alt,
  }
}

function normalizeLocalizations(
  value: unknown,
  issues: BlogValidationIssue[],
): Partial<Record<BlogLocale, BlogLocalizationMetadata>> {
  const localizations: Partial<Record<BlogLocale, BlogLocalizationMetadata>> = {}
  if (!isPlainObject(value)) {
    issue(issues, 'localizations', 'must be an object')
    return localizations
  }
  const extraKeys = Object.keys(value).filter(key => !BLOG_LOCALES.includes(key as BlogLocale))
  if (extraKeys.length) issue(issues, 'localizations', `contains unsupported locale key(s): ${extraKeys.join(', ')}`)

  for (const locale of BLOG_LOCALES) {
    const raw = value[locale]
    if (raw === undefined) continue
    if (!isPlainObject(raw)) {
      issue(issues, `localizations.${locale}`, 'must be an object')
      continue
    }
    assertExactKeys(raw, ['title', 'description'], `localizations.${locale}`, issues)
    localizations[locale] = {
      title: normalizeBoundedString(raw.title, `localizations.${locale}.title`, issues, MAX_TITLE_LENGTH),
      description: normalizeBoundedString(
        raw.description,
        `localizations.${locale}.description`,
        issues,
        MAX_DESCRIPTION_LENGTH,
      ),
    }
  }

  if (!BLOG_LOCALES.some(locale => Boolean(localizations[locale]))) {
    issue(issues, 'localizations', 'must define at least one localization metadata object')
  }
  return localizations
}

function normalizeBody(
  value: Partial<Record<BlogLocale, unknown>> | undefined,
  localizations: Partial<Record<BlogLocale, BlogLocalizationMetadata>>,
  issues: BlogValidationIssue[],
) {
  const body: Partial<Record<BlogLocale, string>> = {}
  for (const locale of BLOG_LOCALES) {
    const raw = value?.[locale]
    if (raw === undefined) continue
    if (typeof raw !== 'string') {
      issue(issues, `body.${locale}`, 'must be Markdown text')
      continue
    }
    const normalized = raw.replace(/\r\n?/g, '\n').trim()
    const bytes = new TextEncoder().encode(normalized).byteLength
    if (bytes > MAX_BODY_BYTES) issue(issues, `body.${locale}`, `must be no larger than ${MAX_BODY_BYTES} UTF-8 bytes`)
    if (normalized.includes('\u0000')) issue(issues, `body.${locale}`, 'must not contain null bytes')
    if (UNSAFE_MARKDOWN_DESTINATION.test(normalized)) {
      issue(issues, `body.${locale}`, 'contains an unsafe Markdown link/image protocol; use root-relative or HTTP(S) URLs')
    }
    if (!localizations[locale] && normalized) {
      issue(issues, `body.${locale}`, 'has body content but no matching localization metadata')
    }
    body[locale] = normalized
  }
  return body
}

export function getBlogAvailableLocales(
  article: Pick<BlogArticle, 'status' | 'localizations' | 'body'>,
): BlogLocale[] {
  if (article.status !== 'published') return []
  return BLOG_LOCALES.filter(locale => {
    const metadata = article.localizations[locale]
    const body = article.body[locale]
    return Boolean(metadata?.title && metadata?.description && typeof body === 'string' && body.trim())
  })
}

export function isBlogLocalePublic(
  article: Pick<BlogArticle, 'status' | 'availableLocales'>,
  locale: BlogLocale,
) {
  return article.status === 'published' && article.availableLocales.includes(locale)
}

export function validateBlogArticlePackage(input: {
  directoryId?: string
  metadata: unknown
  body?: Partial<Record<BlogLocale, unknown>>
}): BlogArticleValidationResult {
  const issues: BlogValidationIssue[] = []
  if (!isPlainObject(input.metadata)) {
    return { ok: false, issues: [{ path: 'article.json', message: 'must contain one JSON object' }] }
  }
  const metadata = input.metadata
  assertExactKeys(
    metadata,
    ['id', 'slug', 'status', 'publishedAt', 'updatedAt', 'author', 'hero', 'localizations'],
    'article.json',
    issues,
  )

  const id = normalizeBoundedString(metadata.id, 'id', issues, MAX_ARTICLE_ID_LENGTH)
  if (id && !ARTICLE_ID_PATTERN.test(id)) {
    issue(issues, 'id', 'must use lowercase ASCII letters/numbers separated by single hyphens')
  }
  if (input.directoryId !== undefined && input.directoryId !== id) {
    issue(issues, 'id', `must match repository directory name "${input.directoryId}"`)
  }

  const slug = normalizeBoundedString(metadata.slug, 'slug', issues, MAX_SLUG_LENGTH)
  if (slug && !ARTICLE_SLUG_PATTERN.test(slug)) {
    issue(issues, 'slug', 'must use lowercase ASCII letters/numbers separated by single hyphens')
  }

  const status = BLOG_ARTICLE_STATUSES.includes(metadata.status as BlogArticleStatus)
    ? metadata.status as BlogArticleStatus
    : 'draft'
  if (!BLOG_ARTICLE_STATUSES.includes(metadata.status as BlogArticleStatus)) {
    issue(issues, 'status', `must be one of: ${BLOG_ARTICLE_STATUSES.join(', ')}`)
  }

  const publishedAt = normalizeTimestamp(metadata.publishedAt, 'publishedAt', issues, { nullable: true })
  const updatedAt = normalizeTimestamp(metadata.updatedAt, 'updatedAt', issues)
  if (status === 'published' && !publishedAt) issue(issues, 'publishedAt', 'is required for published Articles')
  if (publishedAt && updatedAt && new Date(updatedAt).getTime() < new Date(publishedAt).getTime()) {
    issue(issues, 'updatedAt', 'must not be earlier than publishedAt')
  }

  const localizations = normalizeLocalizations(metadata.localizations, issues)
  const author = normalizeAuthor(metadata.author, issues)
  const hero = normalizeHero(metadata.hero, localizations, issues)
  const body = normalizeBody(input.body, localizations, issues)

  const article: BlogArticle = {
    id,
    slug,
    status,
    publishedAt,
    updatedAt: updatedAt ?? '',
    author,
    hero,
    localizations,
    body,
    availableLocales: [],
  }
  article.availableLocales = getBlogAvailableLocales(article)

  if (status === 'published' && article.availableLocales.length === 0) {
    issue(issues, 'status', 'published Articles must have at least one authoritative locale with metadata and non-empty body')
  }

  return issues.length ? { ok: false, issues } : { ok: true, article }
}

export function validateBlogRepositoryAssets(assets: Record<string, string>): BlogRepositoryValidationResult {
  const issues: BlogValidationIssue[] = []
  const directories = new Map<string, Record<string, string>>()

  for (const [rawKey, value] of Object.entries(assets)) {
    const key = rawKey.replaceAll('\\', '/').replace(/^\/+/, '')
    if (!key || key === 'README.md' || key === '.gitkeep' || key.startsWith('_')) continue
    const parts = key.split('/')
    if (parts.length !== 2) {
      issue(issues, key, 'Blog repository assets must use <articleId>/<file> layout')
      continue
    }
    const [directoryId, fileName] = parts
    if (!ARTICLE_ID_PATTERN.test(directoryId) || directoryId.length > MAX_ARTICLE_ID_LENGTH) {
      issue(issues, directoryId, 'article directory name must be a canonical Article id')
      continue
    }
    if (![BLOG_ARTICLE_METADATA_FILE, ...Object.values(BLOG_ARTICLE_BODY_FILES)].includes(fileName as never)) {
      issue(issues, key, 'unsupported file; V1 article directories may contain only article.json, en.md and fa.md')
      continue
    }
    const files = directories.get(directoryId) ?? {}
    files[fileName] = value
    directories.set(directoryId, files)
  }

  const articles: BlogArticle[] = []
  const slugOwners = new Map<string, string>()

  for (const directoryId of [...directories.keys()].sort()) {
    const files = directories.get(directoryId)!
    const metadataSource = files[BLOG_ARTICLE_METADATA_FILE]
    if (metadataSource === undefined) {
      issue(issues, directoryId, 'contains localization body files without article.json')
      continue
    }

    let metadata: unknown
    try {
      metadata = JSON.parse(metadataSource)
    } catch {
      issue(issues, `${directoryId}/${BLOG_ARTICLE_METADATA_FILE}`, 'must contain valid JSON')
      continue
    }

    const result = validateBlogArticlePackage({
      directoryId,
      metadata,
      body: {
        en: files[BLOG_ARTICLE_BODY_FILES.en],
        fa: files[BLOG_ARTICLE_BODY_FILES.fa],
      },
    })
    if (!result.ok) {
      for (const item of result.issues) {
        issue(issues, `${directoryId}/${item.path}`, item.message)
      }
      continue
    }

    const existingOwner = slugOwners.get(result.article.slug)
    if (existingOwner) {
      issue(issues, `${directoryId}/slug`, `duplicates slug owned by Article "${existingOwner}"`)
      continue
    }
    slugOwners.set(result.article.slug, directoryId)
    articles.push(result.article)
  }

  return issues.length
    ? { ok: false, issues }
    : { ok: true, articles: articles.sort((a, b) => a.id.localeCompare(b.id)) }
}

export class BlogRepositoryValidationError extends Error {
  readonly issues: BlogValidationIssue[]

  constructor(issues: BlogValidationIssue[]) {
    super(`Blog repository validation failed with ${issues.length} issue${issues.length === 1 ? '' : 's'}`)
    this.name = 'BlogRepositoryValidationError'
    this.issues = issues
  }
}

export function assertValidBlogRepositoryAssets(assets: Record<string, string>) {
  const result = validateBlogRepositoryAssets(assets)
  if (!result.ok) throw new BlogRepositoryValidationError(result.issues)
  return result.articles
}
