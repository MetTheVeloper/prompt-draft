import type { HomeShowcaseItem } from '~/composables/useHomeDiscovery'

export type PublicDiscoveryResponse = {
  ok: true
  items: HomeShowcaseItem[]
}

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

function uniqueTags(tags: readonly string[]) {
  return Array.from(new Set(
    tags
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean),
  ))
}

export function usePublicDiscovery() {
  const config = useRuntimeConfig()
  const apiBase = normalizeApiBase(config.public.apiBase)

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  async function load(tags: readonly string[], limit = 18) {
    const params = new URLSearchParams()
    params.set('limit', String(Math.min(24, Math.max(1, limit))))

    for (const tag of uniqueTags(tags)) {
      params.append('tag', tag)
    }

    const response = await $fetch<PublicDiscoveryResponse>(
      endpoint(`/api/discover?${params.toString()}`),
    )

    return response.items
  }

  return { load }
}
