import type { PublicPrompt, PublicPromptLocale } from '~/composables/usePublicPrompt'

export type PublicPromptStructuredData = {
  '@context': 'https://schema.org'
  '@type': 'CreativeWork'
  name: string
  url: string
  description: string
  datePublished: string
  inLanguage: 'en-US' | 'fa-IR'
  image?: string
  keywords?: string[]
  isPartOf?: {
    '@type': 'WebSite'
    name: 'Prompt Draft'
    url: string
  }
}

export function normalizePublicSiteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  try {
    return new URL(raw).toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function toAbsolutePublicUrl(siteUrl: string, value: string | null | undefined) {
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

export function publicPromptSeoImage(prompt: PublicPrompt, fallbackPath = '/pwa-512x512.png') {
  return prompt.images[0]?.fullUrl || fallbackPath
}

export function buildPublicPromptStructuredData(options: {
  prompt: PublicPrompt
  locale: PublicPromptLocale
  localizedTitle: string
  description: string
  canonicalUrl: string
  imageUrl?: string | null
  siteUrl?: string | null
}): PublicPromptStructuredData {
  const {
    prompt,
    locale,
    localizedTitle,
    description,
    canonicalUrl,
    imageUrl,
    siteUrl,
  } = options

  const structuredData: PublicPromptStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: localizedTitle,
    url: canonicalUrl,
    description,
    datePublished: prompt.publishedAt,
    inLanguage: locale === 'fa' ? 'fa-IR' : 'en-US',
  }

  if (imageUrl) structuredData.image = imageUrl
  if (prompt.tags.length) structuredData.keywords = [...prompt.tags]
  if (siteUrl) {
    structuredData.isPartOf = {
      '@type': 'WebSite',
      name: 'Prompt Draft',
      url: siteUrl,
    }
  }

  return structuredData
}
