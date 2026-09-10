import type {
  BlogMediaBrowseResponse,
  BlogMediaUploadInput,
  BlogMediaUploadResponse,
} from '~/types/blogMedia'

function normalizeApiBase(value: unknown) {
  const base = typeof value === 'string' ? value.trim() : ''
  return base.replace(/\/+$/, '')
}

export function useBlogMediaApi() {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const apiBase = normalizeApiBase(config.public.apiBase)

  function endpoint(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBase}${normalizedPath}`
  }

  function browse(prefix = '', cursor: string | null = null) {
    const query = new URLSearchParams()
    if (prefix) query.set('prefix', prefix)
    if (cursor) query.set('cursor', cursor)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return $fetch<BlogMediaBrowseResponse>(
      endpoint(`/api/admin/blog/media${suffix}`),
      { headers: auth.authHeaders() },
    )
  }

  function upload(input: BlogMediaUploadInput) {
    return $fetch<BlogMediaUploadResponse>(endpoint('/api/admin/blog/media'), {
      method: 'POST',
      headers: auth.authHeaders(),
      body: input,
    })
  }

  return { browse, upload }
}
