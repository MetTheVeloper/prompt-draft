import type { DiscoveryInterestDefinition } from '~/composables/useDiscoveryPreferences'

export type HomeShowcaseItem = {
  id: number
  title: {
    en: string
    fa: string
  }
  publishedAt: string
  telegramUrl: string | null
  tags: string[]
  imageCount: number
  coverImage: {
    fullUrl: string
    thumbnailUrl: string
  } | null
  owner: {
    username: string
    avatarUrl: string | null
  } | null
}

export type HomeDiscoverySection = {
  key: string
  definition: DiscoveryInterestDefinition
  items: HomeShowcaseItem[]
}

type HeroMediaResponse = {
  ok: true
  media: Array<{
    itemId: number
    fullUrl: string
    thumbnailUrl: string
  }>
}

type ShowcaseResponse = {
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

export function useHomeDiscovery() {
  const config = useRuntimeConfig()
  const apiBase = normalizeApiBase(config.public.apiBase)

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  function buildPath(path: string, tags: readonly string[], limit: number) {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    for (const tag of uniqueTags(tags)) params.append('tag', tag)
    return `${path}?${params.toString()}`
  }

  async function loadHeroSources(tags: readonly string[], limit = 50) {
    const response = await $fetch<HeroMediaResponse>(
      endpoint(buildPath('/api/home/hero-media', tags, Math.min(50, Math.max(1, limit)))),
    )

    return response.media
      .map(media => media.fullUrl || media.thumbnailUrl)
      .filter(Boolean)
  }

  async function loadShowcase(tags: readonly string[], limit = 5) {
    const response = await $fetch<ShowcaseResponse>(
      endpoint(buildPath('/api/home/showcase', tags, Math.min(5, Math.max(1, limit)))),
    )

    return response.items
  }

  async function loadSections(definitions: readonly DiscoveryInterestDefinition[]) {
    const results = await Promise.allSettled(
      definitions.map(definition => loadShowcase(definition.tags, 5)),
    )

    return definitions.map((definition, index) => {
      const result = results[index]

      if (result?.status === 'rejected') {
        console.warn(`[Prompt Draft] home showcase failed for ${definition.key}`, result.reason)
      }

      return {
        key: definition.key,
        definition,
        items: result?.status === 'fulfilled' ? result.value : [],
      }
    })
  }

  return {
    loadHeroSources,
    loadShowcase,
    loadSections,
  }
}
