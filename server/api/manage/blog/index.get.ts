import { projectManageBlogArticleSummary } from '../../../../shared/manage-blog'
import { loadBlogRepository } from '../../../utils/blogRepository'
import { requireBlogManage } from '../../../utils/blogManageAuthorization'

export default defineEventHandler(async (event) => {
  await requireBlogManage(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const articles = await loadBlogRepository()
  return {
    ok: true,
    articles: articles
      .map(projectManageBlogArticleSummary)
      .sort((left, right) => {
        const updatedOrder = right.updatedAt.localeCompare(left.updatedAt)
        return updatedOrder || left.id.localeCompare(right.id)
      }),
  }
})
