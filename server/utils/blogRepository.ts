import type { BlogArticle, BlogLocale } from '../../shared/blog-article'
import {
  assertValidBlogRepositoryAssets,
  isBlogLocalePublic,
} from '../../shared/blog-article'

let repositoryPromise: Promise<BlogArticle[]> | null = null

function decodeStorageValue(value: unknown) {
  if (typeof value === 'string') return value
  if (value instanceof Uint8Array) return new TextDecoder().decode(value)
  if (value === null || value === undefined) return ''
  return String(value)
}

async function readBundledBlogAssets() {
  const storage = useStorage('assets:blog')
  const keys = await storage.getKeys()
  const assets: Record<string, string> = {}

  for (const key of keys) {
    if (!key.endsWith('.json') && !key.endsWith('.md')) continue
    const value = await storage.getItemRaw(key)
    assets[key] = decodeStorageValue(value)
  }

  return assets
}

export async function loadBlogRepository() {
  repositoryPromise ??= readBundledBlogAssets().then(assertValidBlogRepositoryAssets)
  return repositoryPromise
}

export function clearBlogRepositoryCache() {
  repositoryPromise = null
}

export async function listPublishedBlogArticles(locale: BlogLocale) {
  const articles = await loadBlogRepository()
  return articles
    .filter(article => isBlogLocalePublic(article, locale))
    .sort((a, b) => {
      const publishedDelta = new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
      return publishedDelta || a.slug.localeCompare(b.slug)
    })
}

export async function getPublishedBlogArticleBySlug(slug: string, locale: BlogLocale) {
  const articles = await loadBlogRepository()
  return articles.find(article => article.slug === slug && isBlogLocalePublic(article, locale)) ?? null
}
