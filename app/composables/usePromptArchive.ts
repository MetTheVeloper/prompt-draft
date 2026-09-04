import type {
  PromptArchiveDetailItem,
  PromptArchiveDetailResponse,
  PromptArchiveImage,
  PromptArchiveLegacyItem,
  PromptArchiveListItem,
  PromptArchiveListQuery,
  PromptArchiveListResponse,
  PromptArchiveLocalizedTitle,
  PromptArchiveModel,
  PromptArchiveNavigationItem,
  PromptArchivePayload,
  PromptArchiveReadSource,
  PromptArchiveVariant,
} from '~/types/promptArchive'

const ARCHIVE_SNAPSHOT_URL = '/data/prompts.json'
const ARCHIVE_REQUEST_TIMEOUT_MS = 5000
const ARCHIVE_MODELS = new Set<PromptArchiveModel>(['dall-e', 'gpt-image-1'])

let snapshotPromise: Promise<PromptArchivePayload> | null = null
let listRequestVersion = 0
let detailRequestVersion = 0

class PromptArchiveReadError extends Error {
  status: number | null
  recoverable: boolean

  constructor(message: string, options: { status?: number | null; recoverable?: boolean } = {}) {
    super(message)
    this.name = 'PromptArchiveReadError'
    this.status = options.status ?? null
    this.recoverable = options.recoverable ?? false
  }
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function isArchiveModel(value: unknown): value is PromptArchiveModel {
  return typeof value === 'string' && ARCHIVE_MODELS.has(value as PromptArchiveModel)
}

function normalizeTitle(value: unknown): PromptArchiveLocalizedTitle | null {
  if (!isPlainObject(value)) return null

  const en = typeof value.en === 'string' ? value.en.trim() : ''
  const fa = typeof value.fa === 'string' ? value.fa.trim() : ''

  return en && fa ? { en, fa } : null
}

function normalizeModel(value: unknown) {
  if (!isPlainObject(value) || !isArchiveModel(value.previewGeneratedWith)) return null
  if (!Array.isArray(value.optimizedFor) || !value.optimizedFor.every(isArchiveModel)) return null

  return {
    previewGeneratedWith: value.previewGeneratedWith,
    optimizedFor: [...value.optimizedFor],
  }
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value) || value.some(tag => typeof tag !== 'string')) return null
  return value.map(tag => tag.trim()).filter(Boolean)
}

function normalizeImage(value: unknown): PromptArchiveImage | null {
  if (!isPlainObject(value)) return null

  const position = Number(value.position)
  const fullUrl = typeof value.fullUrl === 'string' ? value.fullUrl.trim() : ''
  const thumbnailUrl = typeof value.thumbnailUrl === 'string'
    ? value.thumbnailUrl.trim()
    : fullUrl

  if (!Number.isInteger(position) || position < 0 || !fullUrl) return null

  return {
    position,
    fullUrl,
    thumbnailUrl: thumbnailUrl || fullUrl,
  }
}

function normalizeListItem(value: unknown): PromptArchiveListItem | null {
  if (!isPlainObject(value)) return null

  const id = Number(value.id)
  const title = normalizeTitle(value.title)
  const model = normalizeModel(value.model)
  const tags = normalizeTags(value.tags)
  const publishedAt = typeof value.publishedAt === 'string' ? value.publishedAt : ''
  const telegramUrl = typeof value.telegramUrl === 'string' ? value.telegramUrl.trim() : ''
  const imageCount = Number(value.imageCount)
  const coverImage = value.coverImage == null ? null : normalizeImage(value.coverImage)

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !title ||
    !model ||
    !tags ||
    !publishedAt ||
    Number.isNaN(Date.parse(publishedAt)) ||
    !telegramUrl ||
    !Number.isInteger(imageCount) ||
    imageCount < 0 ||
    (value.coverImage != null && !coverImage)
  ) {
    return null
  }

  return {
    id,
    title,
    publishedAt: new Date(publishedAt).toISOString(),
    telegramUrl,
    model,
    tags,
    coverImage,
    imageCount,
  }
}

function normalizeVariant(value: unknown): PromptArchiveVariant | null {
  if (!isPlainObject(value) || !isPlainObject(value.label)) return null

  const key = typeof value.key === 'string' ? value.key.trim() : ''
  const prompt = typeof value.prompt === 'string' ? value.prompt : ''
  const en = typeof value.label.en === 'string' ? value.label.en.trim() : ''
  const fa = typeof value.label.fa === 'string' ? value.label.fa.trim() : ''

  if (!key || !prompt || !en || !fa) return null

  return {
    key,
    prompt,
    label: { en, fa },
  }
}

function normalizeDetailItem(value: unknown): PromptArchiveDetailItem | null {
  if (!isPlainObject(value)) return null

  const base = normalizeListItem(value)
  if (!base) return null

  const sourceTitle = typeof value.sourceTitle === 'string' ? value.sourceTitle : ''
  const prompt = typeof value.prompt === 'string' ? value.prompt : ''

  if (!prompt || !Array.isArray(value.images) || !Array.isArray(value.variants)) return null

  const images = value.images.map(normalizeImage)
  const variants = value.variants.map(normalizeVariant)

  if (images.some(image => !image) || variants.some(variant => !variant)) return null

  return {
    ...base,
    sourceTitle,
    prompt,
    images: images as PromptArchiveImage[],
    variants: variants as PromptArchiveVariant[],
  }
}

function normalizeNavigationItem(value: unknown): PromptArchiveNavigationItem | null {
  if (value == null) return null
  if (!isPlainObject(value)) return null

  const id = Number(value.id)
  const title = normalizeTitle(value.title)

  if (!Number.isInteger(id) || id <= 0 || !title) return null
  return { id, title }
}

function normalizeListResponse(value: unknown): PromptArchiveListResponse | null {
  if (!isPlainObject(value) || value.ok !== true || !Array.isArray(value.items)) return null

  const items = value.items.map(normalizeListItem)
  const totalCount = Number(value.totalCount)
  const hasMore = value.hasMore
  const nextCursor = value.nextCursor
  const availableTags = normalizeTags(value.availableTags)

  if (
    items.some(item => !item) ||
    !Number.isInteger(totalCount) ||
    totalCount < 0 ||
    typeof hasMore !== 'boolean' ||
    !(nextCursor === null || typeof nextCursor === 'string') ||
    !availableTags
  ) {
    return null
  }

  return {
    ok: true,
    items: items as PromptArchiveListItem[],
    totalCount,
    hasMore,
    nextCursor,
    availableTags,
  }
}

function normalizeDetailResponse(value: unknown): PromptArchiveDetailResponse | null {
  if (!isPlainObject(value) || value.ok !== true) return null

  const item = normalizeDetailItem(value.item)
  const previousItem = normalizeNavigationItem(value.previousItem)
  const nextItem = normalizeNavigationItem(value.nextItem)

  if (!item) return null
  if (value.previousItem != null && !previousItem) return null
  if (value.nextItem != null && !nextItem) return null

  return {
    ok: true,
    item,
    previousItem,
    nextItem,
  }
}

function getPathValue(source: unknown, path: string) {
  if (!isPlainObject(source) || !path) return null

  let current: unknown = source
  for (const part of path.split('.').filter(Boolean)) {
    if (!isPlainObject(current) || !(part in current)) return null
    current = current[part]
  }

  return typeof current === 'string' ? current.trim() : null
}

function normalizeLegacyPayload(value: unknown): PromptArchivePayload | null {
  if (!isPlainObject(value) || !Array.isArray(value.items)) return null
  if (!Number.isInteger(value.schemaVersion) || typeof value.channel !== 'string') return null
  if (typeof value.updatedAt !== 'string' || !Array.isArray(value.modelHistory)) return null

  const validItems = value.items.every((item) => {
    if (!isPlainObject(item)) return false

    return (
      Number.isInteger(item.id) &&
      item.id > 0 &&
      typeof item.titleKey === 'string' &&
      typeof item.sourceTitle === 'string' &&
      typeof item.publishedAt === 'string' &&
      !Number.isNaN(Date.parse(item.publishedAt)) &&
      typeof item.telegramUrl === 'string' &&
      typeof item.prompt === 'string' &&
      normalizeModel(item.model) !== null &&
      normalizeTags(item.tags) !== null &&
      Array.isArray(item.images) &&
      item.images.every((image: unknown) => typeof image === 'string') &&
      (item.variants === undefined || (
        Array.isArray(item.variants) &&
        item.variants.every((variant: unknown) => normalizeVariant(variant) !== null)
      ))
    )
  })

  return validItems ? value as PromptArchivePayload : null
}

function encodeCursor(item: { id: number; publishedAt: string }) {
  if (!import.meta.client) return null

  return btoa(JSON.stringify({ publishedAt: item.publishedAt, id: item.id }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '')
}

function decodeCursor(value: string | null | undefined) {
  if (!value || !import.meta.client) return null

  try {
    const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
    const padding = '='.repeat((4 - normalized.length % 4) % 4)
    const decoded = JSON.parse(atob(normalized + padding))
    const id = Number(decoded?.id)
    const publishedAt = typeof decoded?.publishedAt === 'string' ? decoded.publishedAt : ''

    if (!Number.isInteger(id) || id <= 0 || Number.isNaN(Date.parse(publishedAt))) return null

    return {
      id,
      publishedAt: new Date(publishedAt).toISOString(),
    }
  } catch {
    return null
  }
}

function compareArchivePosition(
  first: { id: number; publishedAt: string },
  second: { id: number; publishedAt: string },
) {
  const dateDifference = new Date(first.publishedAt).getTime() - new Date(second.publishedAt).getTime()
  return dateDifference || first.id - second.id
}

function shouldUseFallback(error: unknown) {
  return error instanceof PromptArchiveReadError && error.recoverable
}

async function loadSnapshot(force = false) {
  if (force) snapshotPromise = null
  if (snapshotPromise) return snapshotPromise

  snapshotPromise = (async () => {
    const response = await fetch(ARCHIVE_SNAPSHOT_URL, {
      cache: force ? 'no-store' : 'default',
    })

    if (!response.ok) {
      throw new Error(`Prompt Archive fallback snapshot failed with ${response.status}`)
    }

    const normalized = normalizeLegacyPayload(await response.json())
    if (!normalized) throw new Error('Prompt Archive fallback snapshot is invalid')
    return normalized
  })()

  try {
    return await snapshotPromise
  } catch (error) {
    snapshotPromise = null
    throw error
  }
}

export function usePromptArchive() {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const { getLocaleMessage } = useI18n()
  const apiBase = normalizeApiBase(config.public.apiBase)

  const items = useState<PromptArchiveListItem[]>('prompt-archive-items-v3', () => [])
  const availableTags = useState<string[]>('prompt-archive-tags-v3', () => [])
  const totalCount = useState<number>('prompt-archive-total-v3', () => 0)
  const hasMore = useState<boolean>('prompt-archive-has-more-v3', () => false)
  const nextCursor = useState<string | null>('prompt-archive-cursor-v3', () => null)
  const source = useState<PromptArchiveReadSource | null>('prompt-archive-source-v3', () => null)
  const pending = useState<boolean>('prompt-archive-pending-v3', () => false)
  const error = useState<string>('prompt-archive-error-v3', () => '')

  const detail = useState<PromptArchiveDetailItem | null>('prompt-archive-detail-v3', () => null)
  const previousItem = useState<PromptArchiveNavigationItem | null>('prompt-archive-previous-v3', () => null)
  const nextItem = useState<PromptArchiveNavigationItem | null>('prompt-archive-next-v3', () => null)
  const detailSource = useState<PromptArchiveReadSource | null>('prompt-archive-detail-source-v3', () => null)
  const detailPending = useState<boolean>('prompt-archive-detail-pending-v3', () => false)
  const detailError = useState<string>('prompt-archive-detail-error-v3', () => '')

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  function resolveLegacyTitle(item: PromptArchiveLegacyItem): PromptArchiveLocalizedTitle {
    const en = getPathValue(getLocaleMessage('en'), item.titleKey)
    const fa = getPathValue(getLocaleMessage('fa'), item.titleKey)

    if (!en || !fa) {
      throw new Error(`Prompt Archive fallback title is missing for ${item.titleKey}`)
    }

    return { en, fa }
  }

  function normalizeLegacyImages(images: string[]): PromptArchiveImage[] {
    return images.map((url, position) => ({
      position,
      fullUrl: url,
      thumbnailUrl: url,
    }))
  }

  function mapLegacyListItem(item: PromptArchiveLegacyItem): PromptArchiveListItem {
    const images = normalizeLegacyImages(item.images)

    return {
      id: item.id,
      title: resolveLegacyTitle(item),
      publishedAt: new Date(item.publishedAt).toISOString(),
      telegramUrl: item.telegramUrl,
      model: {
        previewGeneratedWith: item.model.previewGeneratedWith,
        optimizedFor: [...item.model.optimizedFor],
      },
      tags: [...item.tags].sort((first, second) => first.localeCompare(second)),
      coverImage: images[0] ?? null,
      imageCount: images.length,
    }
  }

  function mapLegacyDetailItem(item: PromptArchiveLegacyItem): PromptArchiveDetailItem {
    const listItem = mapLegacyListItem(item)

    return {
      ...listItem,
      sourceTitle: item.sourceTitle,
      prompt: item.prompt,
      images: normalizeLegacyImages(item.images),
      variants: (item.variants || []).map(variant => ({
        key: variant.key,
        prompt: variant.prompt,
        label: { ...variant.label },
      })),
    }
  }

  async function requestApi(path: string) {
    if (!import.meta.client) {
      throw new PromptArchiveReadError('Prompt Archive API is client-only in the static app', {
        recoverable: true,
      })
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), ARCHIVE_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(endpoint(path), {
        headers: {
          Accept: 'application/json',
          ...auth.authHeaders(),
        },
        cache: 'no-store',
        signal: controller.signal,
      })

      if (response.status === 401 || response.status === 403) {
        throw new PromptArchiveReadError(`Prompt Archive access denied with ${response.status}`, {
          status: response.status,
          recoverable: false,
        })
      }

      if (!response.ok) {
        throw new PromptArchiveReadError(`Prompt Archive API failed with ${response.status}`, {
          status: response.status,
          recoverable: response.status >= 500,
        })
      }

      try {
        return await response.json()
      } catch {
        throw new PromptArchiveReadError('Prompt Archive API returned invalid JSON', {
          status: response.status,
          recoverable: true,
        })
      }
    } catch (cause) {
      if (cause instanceof PromptArchiveReadError) throw cause

      throw new PromptArchiveReadError(
        cause instanceof Error ? cause.message : 'Prompt Archive API is unavailable',
        { recoverable: true },
      )
    } finally {
      window.clearTimeout(timeout)
    }
  }

  async function loadFallbackList(query: PromptArchiveListQuery, force = false): Promise<PromptArchiveListResponse> {
    const payload = await loadSnapshot(force)
    const search = String(query.search ?? '').trim().toLocaleLowerCase()
    const model = query.model ?? null
    const tag = query.tag ?? null
    const sort = query.sort ?? 'newest'
    const limit = Math.min(100, Math.max(1, Math.trunc(query.limit ?? 24)))
    const cursor = decodeCursor(query.cursor)

    const filtered = payload.items
      .filter((item) => {
        if (model && item.model.previewGeneratedWith !== model) return false
        if (tag && !item.tags.includes(tag)) return false
        if (!search) return true

        const title = resolveLegacyTitle(item)
        const haystack = [
          item.id,
          title.en,
          title.fa,
          item.sourceTitle,
          item.prompt,
          ...item.tags,
        ].join(' ').toLocaleLowerCase()

        return haystack.includes(search)
      })
      .map(mapLegacyListItem)
      .sort((first, second) => {
        const comparison = compareArchivePosition(first, second)
        return sort === 'oldest' ? comparison : -comparison
      })

    const total = filtered.length
    const afterCursor = cursor
      ? filtered.filter((item) => {
          const comparison = compareArchivePosition(item, cursor)
          return sort === 'oldest' ? comparison > 0 : comparison < 0
        })
      : filtered

    const pageItems = afterCursor.slice(0, limit)
    const pageHasMore = afterCursor.length > pageItems.length
    const lastItem = pageItems.at(-1)
    const tags = Array.from(new Set(payload.items.flatMap(item => item.tags)))
      .sort((first, second) => first.localeCompare(second))

    return {
      ok: true,
      items: pageItems,
      totalCount: total,
      hasMore: pageHasMore,
      nextCursor: pageHasMore && lastItem ? encodeCursor(lastItem) : null,
      availableTags: tags,
    }
  }

  async function loadFallbackDetail(id: number, force = false): Promise<PromptArchiveDetailResponse | null> {
    const payload = await loadSnapshot(force)
    const index = payload.items.findIndex(item => item.id === id)
    if (index < 0) return null

    const item = payload.items[index]
    const previous = index > 0 ? payload.items[index - 1] : null
    const next = index < payload.items.length - 1 ? payload.items[index + 1] : null

    return {
      ok: true,
      item: mapLegacyDetailItem(item),
      previousItem: previous
        ? { id: previous.id, title: resolveLegacyTitle(previous) }
        : null,
      nextItem: next
        ? { id: next.id, title: resolveLegacyTitle(next) }
        : null,
    }
  }

  function buildListPath(query: PromptArchiveListQuery) {
    const params = new URLSearchParams()
    params.set('limit', String(query.limit ?? 24))
    params.set('sort', query.sort ?? 'newest')

    if (query.cursor) params.set('cursor', query.cursor)
    if (query.search?.trim()) params.set('search', query.search.trim())
    if (query.model) params.set('model', query.model)
    if (query.tag) params.set('tag', query.tag)

    return `/api/archive?${params.toString()}`
  }

  async function loadList(
    query: PromptArchiveListQuery = {},
    options: { append?: boolean; forceFallbackSnapshot?: boolean } = {},
  ) {
    const version = ++listRequestVersion
    pending.value = true
    error.value = ''

    try {
      let response: PromptArchiveListResponse
      let readSource: PromptArchiveReadSource = 'api'

      try {
        const apiResponse = normalizeListResponse(await requestApi(buildListPath(query)))
        if (!apiResponse) {
          throw new PromptArchiveReadError('Prompt Archive API list contract is invalid', {
            recoverable: true,
          })
        }
        response = apiResponse
      } catch (cause) {
        if (!shouldUseFallback(cause)) throw cause

        response = await loadFallbackList(query, options.forceFallbackSnapshot)
        readSource = 'fallback'
      }

      if (version !== listRequestVersion) return null

      if (options.append) {
        const seen = new Set(items.value.map(item => item.id))
        items.value = [
          ...items.value,
          ...response.items.filter(item => !seen.has(item.id)),
        ]
      } else {
        items.value = response.items
      }

      totalCount.value = response.totalCount
      hasMore.value = response.hasMore
      nextCursor.value = response.nextCursor
      availableTags.value = response.availableTags
      source.value = readSource

      return response
    } catch (cause) {
      if (version !== listRequestVersion) return null

      console.error('[prompt archive] Failed to load list:', cause)
      error.value = cause instanceof Error ? cause.message : 'prompt-archive-list-failed'
      return null
    } finally {
      if (version === listRequestVersion) pending.value = false
    }
  }

  async function loadDetail(id: number, options: { forceFallbackSnapshot?: boolean } = {}) {
    const version = ++detailRequestVersion
    detailPending.value = true
    detailError.value = ''

    try {
      let response: PromptArchiveDetailResponse | null
      let readSource: PromptArchiveReadSource = 'api'

      try {
        const raw = await requestApi(`/api/archive/${id}`)
        response = normalizeDetailResponse(raw)

        if (!response) {
          throw new PromptArchiveReadError('Prompt Archive API detail contract is invalid', {
            recoverable: true,
          })
        }
      } catch (cause) {
        if (!shouldUseFallback(cause)) throw cause

        response = await loadFallbackDetail(id, options.forceFallbackSnapshot)
        readSource = 'fallback'
      }

      if (version !== detailRequestVersion) return null

      if (!response) {
        detail.value = null
        previousItem.value = null
        nextItem.value = null
        detailSource.value = readSource
        return null
      }

      detail.value = response.item
      previousItem.value = response.previousItem
      nextItem.value = response.nextItem
      detailSource.value = readSource
      return response
    } catch (cause) {
      if (version !== detailRequestVersion) return null

      console.error('[prompt archive] Failed to load detail:', cause)
      detail.value = null
      previousItem.value = null
      nextItem.value = null
      detailError.value = cause instanceof Error ? cause.message : 'prompt-archive-detail-failed'
      return null
    } finally {
      if (version === detailRequestVersion) detailPending.value = false
    }
  }

  function clearDetail() {
    detailRequestVersion += 1
    detail.value = null
    previousItem.value = null
    nextItem.value = null
    detailError.value = ''
    detailPending.value = false
    detailSource.value = null
  }

  return {
    items,
    availableTags,
    totalCount,
    hasMore,
    nextCursor,
    source,
    pending,
    error,
    detail,
    previousItem,
    nextItem,
    detailSource,
    detailPending,
    detailError,
    loadList,
    loadDetail,
    clearDetail,
  }
}
