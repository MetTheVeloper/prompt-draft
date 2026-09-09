import { listPublishedBlogArticles } from '../../../utils/blogRepository'
import { projectPublicBlogSummary, readPublicBlogLocale } from '../../../utils/publicBlogProjection'

export default defineEventHandler(async (event) => {
  const locale = readPublicBlogLocale(getQuery(event).locale)
  if (!locale) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported Blog locale' })
  }

  const articles = await listPublishedBlogArticles(locale)
  return {
    ok: true,
    articles: articles.map(article => projectPublicBlogSummary(article, locale)),
  }
})
