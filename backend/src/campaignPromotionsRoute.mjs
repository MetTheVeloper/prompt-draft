import { getAuthenticatedUser } from './auth.mjs'
import {
  dismissCampaignPromotion,
  listCampaignPromotions,
  resetCampaignPromotionDismissal,
} from './campaignPromotions.mjs'

const MAX_BODY_BYTES = 2 * 1024

function isJsonRequest(request) {
  const contentType = String(request.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase()
  return contentType === 'application/json'
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

async function readEmptyJsonBody(request) {
  const declared = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    const error = new Error('Campaign promotion body too large')
    error.code = 'CAMPAIGN_BODY_TOO_LARGE'
    throw error
  }
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Campaign promotion body too large')
      error.code = 'CAMPAIGN_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (!isObject(body) || Object.keys(body).length > 0) {
    const error = new Error('Campaign promotion dismissal body must be an empty object')
    error.code = 'CAMPAIGN_BODY_INVALID'
    throw error
  }
  return body
}

function parseRoute(pathname) {
  if (pathname === '/api/campaign-promotions') return { kind: 'list' }
  const dismissal = pathname.match(
    /^\/api\/campaign-promotions\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([A-Za-z0-9._-]{1,100})\/dismiss$/,
  )
  if (dismissal) return { kind: 'dismissal', slug: dismissal[1], promotionId: dismissal[2] }
  if (pathname.startsWith('/api/campaign-promotions')) return { kind: 'invalid' }
  return null
}

function sendBusinessError(sendJson, response, corsHeaders, result) {
  const status = result.code === 'CAMPAIGN_PROMOTION_NOT_FOUND'
    ? 404
    : result.code === 'CAMPAIGN_PROMOTION_SLOT_INVALID'
      ? 400
      : 409
  const messages = {
    CAMPAIGN_PROMOTION_NOT_FOUND: 'Campaign promotion not found',
    CAMPAIGN_PROMOTION_SLOT_INVALID: 'Campaign promotion slot is invalid',
    CAMPAIGN_PROMOTION_NOT_DISMISSIBLE: 'Campaign promotion cannot be dismissed',
    CAMPAIGN_PROMOTION_LOCAL_DISMISSAL: 'Campaign promotion dismissal is local to this browser context',
  }
  sendJson(response, status, {
    ok: false,
    code: result.code,
    message: messages[result.code] ?? 'Campaign promotion request failed',
  }, corsHeaders)
}

export async function handleCampaignPromotionsRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const route = parseRoute(url.pathname)
  if (!route) return false
  if (route.kind === 'invalid') {
    sendJson(response, 404, { ok: false, message: 'Not Found' }, corsHeaders)
    return true
  }

  let user = null
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] campaign promotion auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  try {
    if (route.kind === 'list') {
      if (request.method !== 'GET') {
        sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, { ...corsHeaders, Allow: 'GET' })
        return true
      }
      const unknownQuery = [...url.searchParams.keys()].find(key => key !== 'slot')
      if (unknownQuery) {
        sendJson(response, 400, { ok: false, message: `Unsupported campaign promotion query field: ${unknownQuery}` }, corsHeaders)
        return true
      }
      const result = await listCampaignPromotions({
        slot: url.searchParams.get('slot') ?? '',
        userId: user?.id ?? null,
      })
      if (!result.ok) {
        sendBusinessError(sendJson, response, corsHeaders, result)
        return true
      }
      sendJson(response, 200, result, corsHeaders)
      return true
    }

    if (!['PUT', 'DELETE'].includes(request.method)) {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, { ...corsHeaders, Allow: 'PUT, DELETE' })
      return true
    }
    if (!user) {
      sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
      return true
    }

    if (request.method === 'PUT') {
      if (!isJsonRequest(request)) {
        sendJson(response, 415, { ok: false, message: 'Content-Type must be application/json' }, corsHeaders)
        return true
      }
      try {
        await readEmptyJsonBody(request)
      } catch (error) {
        if (error?.code === 'CAMPAIGN_BODY_TOO_LARGE') {
          sendJson(response, 413, { ok: false, message: error.message }, corsHeaders)
        } else {
          sendJson(response, 400, { ok: false, message: error.message || 'Request body must contain valid JSON' }, corsHeaders)
        }
        return true
      }
    }

    const result = request.method === 'PUT'
      ? await dismissCampaignPromotion({
          slug: route.slug,
          promotionId: route.promotionId,
          userId: user.id,
        })
      : await resetCampaignPromotionDismissal({
          slug: route.slug,
          promotionId: route.promotionId,
          userId: user.id,
        })

    if (!result.ok) {
      sendBusinessError(sendJson, response, corsHeaders, result)
      return true
    }
    sendJson(response, 200, result, corsHeaders)
    return true
  } catch (error) {
    console.error('[Prompt Draft API] campaign promotion request failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to process campaign promotion request' }, corsHeaders)
    return true
  }
}
