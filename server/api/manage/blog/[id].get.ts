import { loadBlogRepository } from '../../../utils/blogRepository'
import { requireBlogManage } from '../../../utils/blogManageAuthorization'

const ARTICLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default defineEventHandler(async (event) => {
  await requireBlogManage(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const id = decodeURIComponent(getRouterParam(event, 'id') || '').trim()
  if (!ARTICLE_ID_PATTERN.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
  }

  const articles = await loadBlogRepository()
  const article = articles.find(item => item.id === id) ?? null
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
  }

  return {
    ok: true,
    article,
  }
})
