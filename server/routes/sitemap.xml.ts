import {
  buildPublicUrlInventory,
  isPublicApiInventory,
  renderSitemapXml,
  type PublicApiInventory,
} from '../../scripts/public-url-inventory'

const PUBLIC_INVENTORY_FETCH_TIMEOUT_MS = 5000
const PUBLIC_INVENTORY_CACHE_TTL_MS = 5 * 60 * 1000

let cachedInventory: {
  apiBase: string
  expiresAt: number
  value: PublicApiInventory
} | null = null

function normalizeAbsoluteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  try {
    return new URL(raw).toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

async function fetchRuntimePublicInventory(apiBase: string) {
  if (
    cachedInventory &&
    cachedInventory.apiBase === apiBase &&
    cachedInventory.expiresAt > Date.now()
  ) {
    return cachedInventory.value
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PUBLIC_INVENTORY_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(new URL('/api/public/inventory', `${apiBase}/`), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json() as { ok?: boolean; inventory?: unknown }
    if (payload.ok !== true || !isPublicApiInventory(payload.inventory)) {
      throw new Error('invalid public inventory response')
    }

    cachedInventory = {
      apiBase,
      expiresAt: Date.now() + PUBLIC_INVENTORY_CACHE_TTL_MS,
      value: payload.inventory,
    }

    return payload.inventory
  } finally {
    clearTimeout(timeout)
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = normalizeAbsoluteUrl(config.public.siteUrl)
  const indexingEnabled = String(config.public.noindex ?? '').toLowerCase() !== 'true'

  if (!siteUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Public site URL is not configured',
    })
  }

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  if (!indexingEnabled) {
    setHeader(event, 'Cache-Control', 'no-store')
    return renderSitemapXml([], siteUrl)
  }

  const apiBase = normalizeAbsoluteUrl(
    config.apiBaseInternal || config.public.apiBase,
  )

  if (!apiBase) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Public inventory API is not configured',
    })
  }

  try {
    const dynamicInventory = await fetchRuntimePublicInventory(apiBase)
    const publicInventory = buildPublicUrlInventory({
      dynamicInventory,
      indexingEnabled: true,
    })

    setHeader(event, 'Cache-Control', 'public, max-age=300')
    return renderSitemapXml(publicInventory, siteUrl)
  } catch (error) {
    console.error('[public-seo] runtime sitemap inventory failed', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Public sitemap is temporarily unavailable',
    })
  }
})
