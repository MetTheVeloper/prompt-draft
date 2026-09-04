import { handleAdminArchiveRequest } from './adminArchive.mjs'
import { handleAdminArchiveMediaRequest } from './adminArchiveMedia.mjs'
import { getAuthenticatedUser } from './auth.mjs'

export async function handleAdminArchiveRoute({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const isArchiveAdminPath =
    url.pathname === '/api/admin/archive' ||
    url.pathname.startsWith('/api/admin/archive/')

  if (!isArchiveAdminPath) return false

  let user

  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] admin archive auth lookup failed', error)
    sendJson(
      response,
      500,
      { ok: false, message: 'Failed to authenticate request' },
      corsHeaders,
    )
    return true
  }

  if (!user) {
    sendJson(
      response,
      401,
      { ok: false, message: 'Authentication required' },
      corsHeaders,
    )
    return true
  }

  const mediaHandled = await handleAdminArchiveMediaRequest({
    request,
    response,
    url,
    corsHeaders,
    sendJson,
    user,
  })
  if (mediaHandled) return true

  return handleAdminArchiveRequest({
    request,
    response,
    url,
    corsHeaders,
    sendJson,
    user,
  })
}
