import type {
  PublicBlogArticle,
  PublicBlogLocale,
  PublicBlogSummary,
} from '../shared/public-blog'

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

export function buildPublicBlogIndexStructuredData(input: {
  articles: PublicBlogSummary[]
  locale: PublicBlogLocale
  canonicalUrl: string
  articleUrl: (article: PublicBlogSummary) => string
}) {
  if (!input.canonicalUrl) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': input.canonicalUrl,
    url: input.canonicalUrl,
    name: input.locale === 'fa' ? 'بلاگ Prompt Draft' : 'Prompt Draft Blog',
    inLanguage: input.locale === 'fa' ? 'fa-IR' : 'en-US',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: input.articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          url: input.articleUrl(article),
          headline: article.title,
          description: article.description,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          author: {
            '@type': 'Organization',
            name: article.author.name,
          },
        },
      })),
    },
  }
}

export function buildPublicBlogPostingStructuredData(input: {
  article: PublicBlogArticle
  locale: PublicBlogLocale
  canonicalUrl: string
  imageUrl?: string | null
  siteUrl?: string
}) {
  const { article, locale, canonicalUrl } = input
  if (!canonicalUrl) return null

  const imageUrl = input.imageUrl?.trim() || ''
  const authorUrl = toAbsoluteBlogUrl(input.siteUrl || '', article.author.url)

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
      '@type': 'Organization',
      name: article.author.name,
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Prompt Draft',
    },
  }
}
