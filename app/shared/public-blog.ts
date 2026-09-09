export type PublicBlogLocale = 'en' | 'fa'

export type PublicBlogAuthor = {
  name: string
  url: string | null
}

export type PublicBlogHero = {
  fullUrl: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  alt: string
}

export type PublicBlogSummary = {
  slug: string
  availableLocales: PublicBlogLocale[]
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  author: PublicBlogAuthor
  hero: PublicBlogHero | null
}

export type PublicBlogArticle = PublicBlogSummary & {
  body: string
}

export type PublicBlogListResponse = {
  ok: true
  articles: PublicBlogSummary[]
}

export type PublicBlogArticleResponse = {
  ok: true
  article: PublicBlogArticle
}
