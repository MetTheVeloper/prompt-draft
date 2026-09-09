import {
  isPublicApiInventory,
  type PublicApiInventory,
} from '../../scripts/public-url-inventory'

const PUBLIC_INVENTORY_FETCH_TIMEOUT_MS = 5000
const PUBLIC_INVENTORY_CACHE_TTL_MS = 5 * 60 * 1000

let cachedInventory: {
  apiBase: string
  expiresAt: number
  value: PublicApiInventory
} | null = null

export function normalizePublicAbsoluteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  try {
    return new URL(raw).toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function isPublicIndexingEnabled(noindexValue: unknown) {
  return String(noindexValue ?? '').trim().toLowerCase() !== 'true'
}

export async function fetchRuntimePublicInventory(apiBase: string) {
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
