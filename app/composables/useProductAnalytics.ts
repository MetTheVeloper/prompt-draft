type ProductAnalyticsEventName =
  | 'prompt_archive_view'
  | 'prompt_archive_copy'
  | 'referral_link_open'

type ProductAnalyticsResourceType =
  | 'prompt_archive_item'
  | 'referral_username'

type ProductAnalyticsMetadata = Record<string, string | number | boolean | null>

type ProductAnalyticsTrackOptions = {
  resource: {
    type: ProductAnalyticsResourceType
    id: string
  }
  metadata?: ProductAnalyticsMetadata
}

const ANALYTICS_ANONYMOUS_STORAGE_KEY = 'prompt-draft:analytics:anonymous-id:v1'
const ANALYTICS_SESSION_STORAGE_KEY = 'prompt-draft:analytics:session-id:v1'

let memoryAnonymousId: string | null = null
let memorySessionId: string | null = null

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12)}`
}

function readOrCreateStoredUuid(
  storage: Storage,
  key: string,
  current: string | null,
) {
  if (current) return current

  try {
    const stored = storage.getItem(key)?.trim()
    if (stored) return stored

    const created = createUuid()
    storage.setItem(key, created)
    return created
  } catch {
    return createUuid()
  }
}

export function useProductAnalytics() {
  const config = useRuntimeConfig()
  const route = useRoute()
  const auth = useAuth()
  const { locale } = useI18n()
  const apiBase = normalizeApiBase(config.public.apiBase)

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  function analyticsIdentity() {
    if (!import.meta.client) return null

    memoryAnonymousId = readOrCreateStoredUuid(
      window.localStorage,
      ANALYTICS_ANONYMOUS_STORAGE_KEY,
      memoryAnonymousId,
    )

    memorySessionId = readOrCreateStoredUuid(
      window.sessionStorage,
      ANALYTICS_SESSION_STORAGE_KEY,
      memorySessionId,
    )

    return {
      anonymousId: memoryAnonymousId,
      sessionId: memorySessionId,
    }
  }

  async function track(
    eventName: ProductAnalyticsEventName,
    options: ProductAnalyticsTrackOptions,
  ) {
    if (!import.meta.client) return false

    const identity = analyticsIdentity()
    if (!identity) return false

    const body = {
      eventId: createUuid(),
      eventName,
      anonymousId: identity.anonymousId,
      sessionId: identity.sessionId,
      resource: {
        type: options.resource.type,
        id: options.resource.id,
      },
      path: route.fullPath,
      locale: locale.value,
      occurredAt: new Date().toISOString(),
      metadata: options.metadata ?? {},
    }

    try {
      await $fetch(endpoint('/api/analytics/events'), {
        method: 'POST',
        headers: auth.authHeaders(),
        body,
      })
      return true
    } catch {
      // Product analytics is observational and must never block the primary action.
      return false
    }
  }

  return {
    track,
  }
}
