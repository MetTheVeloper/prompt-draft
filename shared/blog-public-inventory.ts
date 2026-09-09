import type { BlogArticle, BlogLocale } from './blog-article'

export type BlogPublicInventoryArticle = {
  slug: string
  availableLocales: BlogLocale[]
}

/**
 * Project the already-validated Blog repository into the minimum canonical URL
 * inventory shape. Publication/localization eligibility remains owned by the
 * 4E.1 Article contract through Article.availableLocales; this helper must not
 * recreate status/body/localization heuristics.
 */
export function projectBlogPublicInventory(
  articles: readonly BlogArticle[],
): BlogPublicInventoryArticle[] {
  return articles
    .filter(article => article.availableLocales.length > 0)
    .map(article => ({
      slug: article.slug,
      availableLocales: [...article.availableLocales],
    }))
    .sort((left, right) => left.slug.localeCompare(right.slug))
}
