import { saveManageBlogArticle } from '../../../utils/blogManageWrite'

export default defineEventHandler(async (event) => {
  const articleId = (getRouterParam(event, 'id') || '').trim()
  return saveManageBlogArticle(event, articleId)
})
