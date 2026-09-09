import type { PublicCreator, PublicCreatorLocale } from '../composables/usePublicCreator'
import { normalizePublicSiteUrl, toAbsolutePublicUrl } from './publicPromptSeo'

export type PublicCreatorPersonStructuredData = {
  '@type': 'Person'
  name: string
  alternateName: string
  url: string
  description?: string
  image?: string
  sameAs?: string[]
  knowsAbout?: string[]
}

export type PublicCreatorStructuredData = {
  '@context': 'https://schema.org'
  '@type': 'ProfilePage'
  name: string
  url: string
  inLanguage: 'en-US' | 'fa-IR'
  description?: string
  image?: string
  mainEntity: PublicCreatorPersonStructuredData
  isPartOf?: {
    '@type': 'WebSite'
    name: 'Prompt Draft'
    url: string
  }
}

export { normalizePublicSiteUrl, toAbsolutePublicUrl }

export function publicCreatorSeoImage(
  creator: PublicCreator,
  fallbackPath = '/pwa-512x512.png',
) {
  return creator.identity.cover?.fullUrl
    || creator.identity.avatarUrl
    || fallbackPath
}

export function buildPublicCreatorStructuredData(options: {
  creator: PublicCreator
  locale: PublicCreatorLocale
  localizedName: string
  description: string
  canonicalUrl: string
  imageUrl?: string | null
  siteUrl?: string | null
}): PublicCreatorStructuredData {
  const {
    creator,
    locale,
    localizedName,
    description,
    canonicalUrl,
    imageUrl,
    siteUrl,
  } = options

  const person: PublicCreatorPersonStructuredData = {
    '@type': 'Person',
    name: localizedName,
    alternateName: `@${creator.identity.username}`,
    url: canonicalUrl,
  }

  const normalizedDescription = description.trim()
  if (normalizedDescription) person.description = normalizedDescription

  const avatarUrl = toAbsolutePublicUrl(siteUrl || '', creator.identity.avatarUrl)
  if (avatarUrl) person.image = avatarUrl

  const sameAs = creator.identity.links.map(link => link.url).filter(Boolean)
  if (sameAs.length) person.sameAs = sameAs

  const knowsAbout = creator.identity.skills
    .map(skill => skill.title[locale] || skill.title.en)
    .map(value => value.trim())
    .filter(Boolean)
  if (knowsAbout.length) person.knowsAbout = knowsAbout

  const structuredData: PublicCreatorStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: localizedName,
    url: canonicalUrl,
    inLanguage: locale === 'fa' ? 'fa-IR' : 'en-US',
    mainEntity: person,
  }

  if (normalizedDescription) structuredData.description = normalizedDescription
  if (imageUrl) structuredData.image = imageUrl
  if (siteUrl) {
    structuredData.isPartOf = {
      '@type': 'WebSite',
      name: 'Prompt Draft',
      url: siteUrl,
    }
  }

  return structuredData
}
