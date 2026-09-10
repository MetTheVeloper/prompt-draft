import type {
  BlogArticle,
  BlogArticleStatus,
  BlogHero,
  BlogLocalizationMetadata,
  BlogLocale,
} from './blog-article'

export type ManageBlogRepositorySource = 'git' | 'deployed'

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
  repositorySource: ManageBlogRepositorySource
  writeConfigured: boolean
}

export type ManageBlogArticleResponse = {
  ok: true
  article: BlogArticle
  version: string | null
  repositorySource: ManageBlogRepositorySource
  writeConfigured: boolean
}

export type ManageBlogWriteInput = {
  expectedVersion: string | null
  slug: string
  status: BlogArticleStatus
  hero: BlogHero | null
  localizations: Partial<Record<BlogLocale, BlogLocalizationMetadata>>
  body: Partial<Record<BlogLocale, string>>
}

export type ManageBlogWriteResponse = {
  ok: true
  article: BlogArticle
  version: string
  commitSha: string
  repositorySource: 'git'
  auditRecorded: boolean
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
