import { requireBlogManage } from '../../../utils/blogManageAuthorization'
import { getBlogManageRepository } from '../../../utils/blogManageRepository'

const ARTICLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default defineEventHandler(async (event) => {
  await requireBlogManage(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const id = (getRouterParam(event, 'id') || '').trim()
  if (!ARTICLE_ID_PATTERN.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
  }

  const repository = await getBlogManageRepository(event)
  const article = repository.articles.find(item => item.id === id) ?? null
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
  }

  return {
    ok: true,
    article,
    version: repository.versions.get(id) ?? null,
    repositorySource: repository.source,
    writeConfigured: repository.writeConfigured,
  }
})
