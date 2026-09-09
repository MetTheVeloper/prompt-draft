import type {
  BlogArticle,
  BlogArticleStatus,
  BlogLocale,
} from './blog-article'

export type ManageBlogArticleSummary = {
  id: string
  slug: string
  status: BlogArticleStatus
  publishedAt: string | null
  updatedAt: string
  availableLocales: BlogLocale[]
  titles: Partial<Record<BlogLocale, string>>
}

export type ManageBlogListResponse = {
  ok: true
  articles: ManageBlogArticleSummary[]
}

export type ManageBlogArticleResponse = {
  ok: true
  article: BlogArticle
}

export function projectManageBlogArticleSummary(
  article: BlogArticle,
): ManageBlogArticleSummary {
  const titles: Partial<Record<BlogLocale, string>> = {}

  for (const locale of ['en', 'fa'] as const) {
    const title = article.localizations[locale]?.title
    if (title) titles[locale] = title
  }

  return {
    id: article.id,
    slug: article.slug,
    status: article.status,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    availableLocales: [...article.availableLocales],
    titles,
  }
}
