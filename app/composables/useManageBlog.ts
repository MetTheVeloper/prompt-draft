import type {
  ManageBlogArticleResponse,
  ManageBlogListResponse,
  ManageBlogWriteInput,
  ManageBlogWriteResponse,
} from '../shared/manage-blog'

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

  function create(input: ManageBlogWriteInput) {
    return $fetch<ManageBlogWriteResponse>('/api/manage/blog', {
      method: 'POST',
      headers: auth.authHeaders(),
      body: input,
    })
  }

  function update(id: string, input: ManageBlogWriteInput) {
    return $fetch<ManageBlogWriteResponse>(`/api/manage/blog/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: auth.authHeaders(),
      body: input,
    })
  }

  return {
    list,
    load,
    create,
    update,
  }
}
