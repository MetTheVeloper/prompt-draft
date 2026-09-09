import type { HomeShowcaseItem } from '~/composables/useHomeDiscovery'
import { publicCreatorPath, publicPromptPath } from '~/utils/publicRoutes'

export type PublicDiscoveryLocale = 'en' | 'fa'

export type PublicDiscoveryStructuredData = {
  '@context': 'https://schema.org'
  '@type': 'CollectionPage'
  name: string
  description: string
  url: string
  inLanguage: 'en-US' | 'fa-IR'
  mainEntity: {
    '@type': 'ItemList'
    numberOfItems: number
    itemListElement: Array<{
      '@type': 'ListItem'
      position: number
      item: {
        '@type': 'CreativeWork'
        name: string
        url: string
        datePublished: string
        inLanguage: 'en-US' | 'fa-IR'
        image?: string
        keywords?: string[]
        author?: {
          '@type': 'Person'
          name: string
          url: string
        }
      }
    }>
  }
}

export function normalizeDiscoverySiteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  try {
    return new URL(raw).toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function toDiscoveryAbsoluteUrl(siteUrl: string, value: string | null | undefined) {
  const raw = value?.trim() || ''
  if (!raw) return ''

  try {
    return new URL(raw).toString()
  } catch {
    if (!siteUrl) return ''

    try {
      return new URL(raw.startsWith('/') ? raw : `/${raw}`, `${siteUrl}/`).toString()
    } catch {
      return ''
    }
  }
}

export function buildPublicDiscoveryStructuredData(options: {
  items: readonly HomeShowcaseItem[]
  locale: PublicDiscoveryLocale
  title: string
  description: string
  canonicalUrl: string
  toCanonicalUrl: (basePath: string) => string
  toAbsoluteUrl: (value: string | null | undefined) => string
}): PublicDiscoveryStructuredData {
  const language = options.locale === 'fa' ? 'fa-IR' : 'en-US'

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.title,
    description: options.description,
    url: options.canonicalUrl,
    inLanguage: language,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.items.length,
      itemListElement: options.items.map((item, index) => {
        const localizedTitle = options.locale === 'fa' ? item.title.fa : item.title.en
        const creativeWork: PublicDiscoveryStructuredData['mainEntity']['itemListElement'][number]['item'] = {
          '@type': 'CreativeWork',
          name: localizedTitle,
          url: options.toCanonicalUrl(publicPromptPath(item.id)),
          datePublished: item.publishedAt,
          inLanguage: language,
        }

        const imageUrl = options.toAbsoluteUrl(
          item.coverImage?.fullUrl || item.coverImage?.thumbnailUrl || null,
        )
        if (imageUrl) creativeWork.image = imageUrl
        if (item.tags.length) creativeWork.keywords = [...item.tags]

        if (item.creator) {
          const creatorUrl = options.toCanonicalUrl(publicCreatorPath(item.creator.username))
          if (creatorUrl) {
            creativeWork.author = {
              '@type': 'Person',
              name: item.creator.username,
              url: creatorUrl,
            }
          }
        }

        return {
          '@type': 'ListItem' as const,
          position: index + 1,
          item: creativeWork,
        }
      }),
    },
  }
}
