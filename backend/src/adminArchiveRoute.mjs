import { handleAdminArchiveRequest } from './adminArchive.mjs'
import { handleAdminArchiveMediaRequest } from './adminArchiveMedia.mjs'
import { handleArchivePromotionRequest } from './archivePromotion.mjs'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase } from './database.mjs'

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

  const promotionHandled = await handleArchivePromotionRequest({
    request,
    response,
    url,
    corsHeaders,
    sendJson,
    user,
  })
  if (promotionHandled) return true

  const publicLookupMatch = url.pathname.match(
    /^\/api\/admin\/archive\/public\/(\d+)$/,
  )

  if (publicLookupMatch) {
    if (!hasPermission(user, PERMISSIONS.ARCHIVE_VIEW)) {
      sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
      return true
    }

    if (request.method !== 'GET') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
      return true
    }

    const publicId = Number(publicLookupMatch[1])
    if (!Number.isSafeInteger(publicId) || publicId <= 0) {
      sendJson(response, 400, { ok: false, message: 'Invalid Archive public id' }, corsHeaders)
      return true
    }

    try {
      const result = await queryDatabase(
        `
          SELECT
            id,
            public_id AS "publicId",
            telegram_message_id AS "telegramMessageId"
          FROM prompt_archive_items
          WHERE public_id = $1
          LIMIT 1
        `,
        [publicId],
      )
      const row = result.rows[0]

      if (!row) {
        sendJson(response, 404, { ok: false, message: 'Archive item not found' }, corsHeaders)
        return true
      }

      sendJson(
        response,
        200,
        {
          ok: true,
          id: row.id,
          publicId: Number(row.publicId),
          telegramMessageId: row.telegramMessageId == null
            ? null
            : Number(row.telegramMessageId),
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] admin archive public-id lookup failed', error)
      sendJson(
        response,
        500,
        { ok: false, message: 'Failed to resolve Archive item' },
        corsHeaders,
      )
    }

    return true
  }

  const telegramLookupMatch = url.pathname.match(
    /^\/api\/admin\/archive\/telegram\/(\d+)$/,
  )

  if (telegramLookupMatch) {
    if (!hasPermission(user, PERMISSIONS.ARCHIVE_VIEW)) {
      sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
      return true
    }

    if (request.method !== 'GET') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
      return true
    }

    const telegramMessageId = Number(telegramLookupMatch[1])
    if (!Number.isSafeInteger(telegramMessageId) || telegramMessageId <= 0) {
      sendJson(response, 400, { ok: false, message: 'Invalid Telegram message id' }, corsHeaders)
      return true
    }

    try {
      const result = await queryDatabase(
        `
          SELECT id, public_id AS "publicId"
          FROM prompt_archive_items
          WHERE telegram_message_id = $1
          LIMIT 1
        `,
        [telegramMessageId],
      )
      const row = result.rows[0]

      if (!row) {
        sendJson(response, 404, { ok: false, message: 'Archive item not found' }, corsHeaders)
        return true
      }

      sendJson(
        response,
        200,
        {
          ok: true,
          id: row.id,
          publicId: Number(row.publicId),
          telegramMessageId,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] admin archive Telegram lookup failed', error)
      sendJson(
        response,
        500,
        { ok: false, message: 'Failed to resolve Archive item' },
        corsHeaders,
      )
    }

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
