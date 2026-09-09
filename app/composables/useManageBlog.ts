import type {
  ManageBlogArticleResponse,
  ManageBlogListResponse,
} from '../../shared/manage-blog'

export function useManageBlog() {
  const auth = useAuth()

  function list() {
    return $fetch<ManageBlogListResponse>('/api/manage/blog', {
      headers: auth.authHeaders(),
    })
  }

  function load(id: string) {
    return $fetch<ManageBlogArticleResponse>(`/api/manage/blog/${encodeURIComponent(id)}`, {
      headers: auth.authHeaders(),
    })
  }

  return {
    list,
    load,
  }
}
