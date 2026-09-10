import { projectManageBlogArticleSummary } from '../../../../shared/manage-blog'
import { requireBlogManage } from '../../../utils/blogManageAuthorization'
import { getBlogManageRepository } from '../../../utils/blogManageRepository'

export default defineEventHandler(async (event) => {
  await requireBlogManage(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const repository = await getBlogManageRepository(event)
  return {
    ok: true,
    repositorySource: repository.source,
    writeConfigured: repository.writeConfigured,
    articles: repository.articles
      .map(projectManageBlogArticleSummary)
      .sort((left, right) => {
        const updatedOrder = right.updatedAt.localeCompare(left.updatedAt)
        return updatedOrder || left.id.localeCompare(right.id)
      }),
  }
})
