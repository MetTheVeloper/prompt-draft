import { saveManageBlogArticle } from '../../../utils/blogManageWrite'

export default defineEventHandler(async (event) => {
  return saveManageBlogArticle(event, null)
})
