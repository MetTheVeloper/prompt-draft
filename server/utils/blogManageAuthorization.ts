export const BLOG_MANAGE_PERMISSION = 'blog.manage'
const BLOG_AUTH_TIMEOUT_MS = 5000

export type BlogManageAuthorizationResult =
  | { ok: true }
  | { ok: false; statusCode: 401 | 403 | 502 | 503; statusMessage: string }

function normalizeAbsoluteUrl(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  try {
    return new URL(raw).toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function hasBlogManagePermission(value: unknown) {
  if (!Array.isArray(value)) return false
  return value.includes('*') || value.includes(BLOG_MANAGE_PERMISSION)
}

export async function checkBlogManageAuthorization({
  authorization,
  apiBase,
  fetchImpl = fetch,
}: {
  authorization: unknown
  apiBase: unknown
  fetchImpl?: typeof fetch
}): Promise<BlogManageAuthorizationResult> {
  const authHeader = typeof authorization === 'string' ? authorization.trim() : ''
  if (!/^Bearer\s+\S+$/i.test(authHeader)) {
    return { ok: false, statusCode: 401, statusMessage: 'Authentication required' }
  }

  const normalizedApiBase = normalizeAbsoluteUrl(apiBase)
  if (!normalizedApiBase) {
    return { ok: false, statusCode: 503, statusMessage: 'Authorization service is not configured' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), BLOG_AUTH_TIMEOUT_MS)

  try {
    const response = await fetchImpl(new URL('/api/auth/me', `${normalizedApiBase}/`), {
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
      signal: controller.signal,
    })

    if (response.status === 401) {
      return { ok: false, statusCode: 401, statusMessage: 'Authentication required' }
    }

    if (!response.ok) {
      return { ok: false, statusCode: 502, statusMessage: 'Authorization service is unavailable' }
    }

    const payload = await response.json() as { permissions?: unknown }
    if (!Array.isArray(payload.permissions)) {
      return { ok: false, statusCode: 502, statusMessage: 'Authorization response is invalid' }
    }

    if (!hasBlogManagePermission(payload.permissions)) {
      return { ok: false, statusCode: 403, statusMessage: 'Forbidden' }
    }

    return { ok: true }
  } catch {
    return { ok: false, statusCode: 502, statusMessage: 'Authorization service is unavailable' }
  } finally {
    clearTimeout(timeout)
  }
}

export async function requireBlogManage(event: Parameters<typeof useRuntimeConfig>[0]) {
  const config = useRuntimeConfig(event)
  const result = await checkBlogManageAuthorization({
    authorization: getHeader(event, 'authorization'),
    apiBase: config.apiBaseInternal || config.public.apiBase,
  })

  if (!result.ok) {
    throw createError({
      statusCode: result.statusCode,
      statusMessage: result.statusMessage,
    })
  }
}
