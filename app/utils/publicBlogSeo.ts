import type { PublicBlogArticle, PublicBlogLocale } from '~/shared/public-blog'

export function normalizeBlogSiteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  try {
    return new URL(raw).toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function toAbsoluteBlogUrl(siteUrl: string, value: string | null | undefined) {
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

export function buildPublicBlogPostingStructuredData(input: {
  article: PublicBlogArticle
  locale: PublicBlogLocale
  canonicalUrl: string
  imageUrl?: string | null
}) {
  const { article, locale, canonicalUrl } = input
  const imageUrl = input.imageUrl?.trim() || ''
  const authorUrl = article.author.url?.trim() || ''

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    headline: article.title,
    description: article.description,
    inLanguage: locale === 'fa' ? 'fa-IR' : 'en-US',
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    author: {
      '@type': 'Person',
      name: article.author.name,
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Prompt Draft',
    },
  }
}
