import { getPublishedBlogArticleBySlug } from '../../../utils/blogRepository'
import { projectPublicBlogArticle, readPublicBlogLocale } from '../../../utils/publicBlogProjection'

export default defineEventHandler(async (event) => {
  const locale = readPublicBlogLocale(getQuery(event).locale)
  if (!locale) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported Blog locale' })
  }

  const slug = getRouterParam(event, 'slug')?.trim() || ''
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
  }

  const article = await getPublishedBlogArticleBySlug(slug, locale)
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
  }

  return {
    ok: true,
    article: projectPublicBlogArticle(article, locale),
  }
})
