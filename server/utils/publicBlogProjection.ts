import type { BlogArticle, BlogLocale } from '../../shared/blog-article'
import type {
  PublicBlogArticle,
  PublicBlogHero,
  PublicBlogSummary,
} from '../../app/shared/public-blog'

export function readPublicBlogLocale(value: unknown): BlogLocale | null {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === 'en' || raw === 'fa' ? raw : null
}

function projectHero(article: BlogArticle, locale: BlogLocale): PublicBlogHero | null {
  if (!article.hero) return null
  return {
    fullUrl: article.hero.fullUrl,
    thumbnailUrl: article.hero.thumbnailUrl,
    width: article.hero.width,
    height: article.hero.height,
    alt: article.hero.alt[locale] || '',
  }
}

export function projectPublicBlogSummary(
  article: BlogArticle,
  locale: BlogLocale,
): PublicBlogSummary {
  const localization = article.localizations[locale]
  if (!localization || !article.publishedAt || !article.availableLocales.includes(locale)) {
    throw new Error(`Article ${article.id} is not public in locale ${locale}`)
  }

  return {
    slug: article.slug,
    availableLocales: [...article.availableLocales],
    title: localization.title,
    description: localization.description,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    author: {
      name: article.author.name,
      url: article.author.url,
    },
    hero: projectHero(article, locale),
  }
}

export function projectPublicBlogArticle(
  article: BlogArticle,
  locale: BlogLocale,
): PublicBlogArticle {
  const summary = projectPublicBlogSummary(article, locale)
  const body = article.body[locale]
  if (!body) throw new Error(`Article ${article.id} has no public body for locale ${locale}`)
  return { ...summary, body }
}
