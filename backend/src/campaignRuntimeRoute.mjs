import { getAuthenticatedUser } from './auth.mjs'
import {
  getCampaignCallerState,
  getPublicCampaignRuntime,
  startCampaignParticipation,
} from './campaignRuntime.mjs'

const MAX_PARTICIPATION_BODY_BYTES = 8 * 1024
const MAX_IDEMPOTENCY_KEY_LENGTH = 240
const ATTRIBUTION_FIELDS = new Set(['source', 'medium', 'campaign', 'placement', 'referrer'])

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

async function readJsonBody(request) {
  const declared = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declared) && declared > MAX_PARTICIPATION_BODY_BYTES) {
    const error = new Error('Campaign participation body too large')
    error.code = 'CAMPAIGN_BODY_TOO_LARGE'
    throw error
  }

  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_PARTICIPATION_BODY_BYTES) {
      const error = new Error('Campaign participation body too large')
      error.code = 'CAMPAIGN_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function normalizeAttribution(value) {
  if (value === undefined) return { ok: true, value: {} }
  if (!isObject(value)) return { ok: false, message: 'attribution must be an object' }

  const unknown = Object.keys(value).find(key => !ATTRIBUTION_FIELDS.has(key))
  if (unknown) return { ok: false, message: `Unsupported attribution field: ${unknown}` }

  const output = {}
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw !== 'string' || !raw.trim()) {
      return { ok: false, message: `attribution.${key} must be a non-empty string` }
    }
    const limit = key === 'referrer' ? 500 : 160
    const normalized = raw.trim()
    if (normalized.length > limit) {
      return { ok: false, message: `attribution.${key} must be at most ${limit} characters` }
    }
    output[key] = normalized
  }
  return { ok: true, value: output }
}

function validateParticipationBody(body) {
  if (!isObject(body)) return { ok: false, message: 'JSON body must be an object' }
  const allowed = new Set(['idempotencyKey', 'attribution'])
  const unknown = Object.keys(body).find(key => !allowed.has(key))
  if (unknown) return { ok: false, message: `Unsupported participation field: ${unknown}` }

  if (
    typeof body.idempotencyKey !== 'string' ||
    !body.idempotencyKey.trim() ||
    body.idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    return {
      ok: false,
      message: `idempotencyKey must be 1-${MAX_IDEMPOTENCY_KEY_LENGTH} characters`,
    }
  }

  const attribution = normalizeAttribution(body.attribution)
  if (!attribution.ok) return attribution
  return {
    ok: true,
    value: {
      idempotencyKey: body.idempotencyKey.trim(),
      attribution: attribution.value,
    },
  }
}

function parseCampaignPath(pathname) {
  const state = pathname.match(/^\/api\/campaigns\/([a-z0-9]+(?:-[a-z0-9]+)*)\/state$/)
  if (state) return { kind: 'state', slug: state[1] }
  const participation = pathname.match(/^\/api\/campaigns\/([a-z0-9]+(?:-[a-z0-9]+)*)\/participation$/)
  if (participation) return { kind: 'participation', slug: participation[1] }
  const publicRead = pathname.match(/^\/api\/campaigns\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)
  if (publicRead) return { kind: 'public', slug: publicRead[1] }
  if (pathname.startsWith('/api/campaigns/')) return { kind: 'invalid', slug: null }
  return null
}

function errorStatus(code) {
  if (code === 'CAMPAIGN_NOT_FOUND') return 404
  if (code === 'CAMPAIGN_NOT_ELIGIBLE') return 403
  if (code === 'CAMPAIGN_NOT_ACTIVE' || code === 'CAMPAIGN_PARTICIPATION_CLOSED') return 409
  return 400
}

function errorMessage(code) {
  if (code === 'CAMPAIGN_NOT_FOUND') return 'Campaign not found'
  if (code === 'CAMPAIGN_NOT_ELIGIBLE') return 'Campaign participation is not eligible'
  if (code === 'CAMPAIGN_PARTICIPATION_CLOSED') return 'Campaign participation is closed'
  if (code === 'CAMPAIGN_NOT_ACTIVE') return 'Campaign is not active'
  return 'Campaign request failed'
}

export async function handleCampaignRuntimeRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const route = parseCampaignPath(url.pathname)
  if (!route) return false

  if (route.kind === 'invalid') {
    sendJson(response, 404, { ok: false, code: 'CAMPAIGN_NOT_FOUND', message: 'Campaign not found' }, corsHeaders)
    return true
  }

  const allowed = route.kind === 'participation' ? 'POST' : 'GET'
  if (request.method !== allowed) {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      { ...corsHeaders, Allow: allowed },
    )
    return true
  }

  let user = null
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] campaign auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  if ((route.kind === 'state' || route.kind === 'participation') && !user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  try {
    if (route.kind === 'public') {
      const result = await getPublicCampaignRuntime({
        slug: route.slug,
        userId: user?.id ?? null,
      })
      if (!result.ok) {
        sendJson(
          response,
          errorStatus(result.code),
          { ok: false, code: result.code, message: errorMessage(result.code) },
          corsHeaders,
        )
        return true
      }
      sendJson(response, 200, result, corsHeaders)
      return true
    }

    if (route.kind === 'state') {
      const result = await getCampaignCallerState({ slug: route.slug, userId: user.id })
      if (!result.ok) {
        sendJson(
          response,
          errorStatus(result.code),
          { ok: false, code: result.code, message: errorMessage(result.code) },
          corsHeaders,
        )
        return true
      }
      sendJson(response, 200, result, corsHeaders)
      return true
    }

    if (!isJsonRequest(request)) {
      sendJson(
        response,
        415,
        { ok: false, message: 'Content-Type must be application/json' },
        corsHeaders,
      )
      return true
    }

    let body
    try {
      body = await readJsonBody(request)
    } catch (error) {
      if (error?.code === 'CAMPAIGN_BODY_TOO_LARGE') {
        sendJson(response, 413, { ok: false, message: error.message }, corsHeaders)
      } else {
        sendJson(response, 400, { ok: false, message: 'Request body must contain valid JSON' }, corsHeaders)
      }
      return true
    }

    const validation = validateParticipationBody(body)
    if (!validation.ok) {
      sendJson(response, 400, { ok: false, message: validation.message }, corsHeaders)
      return true
    }

    const result = await startCampaignParticipation({
      slug: route.slug,
      userId: user.id,
      attribution: validation.value.attribution,
    })
    if (!result.ok) {
      sendJson(
        response,
        errorStatus(result.code),
        {
          ok: false,
          code: result.code,
          message: errorMessage(result.code),
          ...(result.eligibility ? { eligibility: result.eligibility } : {}),
        },
        corsHeaders,
      )
      return true
    }

    sendJson(response, 200, result, corsHeaders)
    return true
  } catch (error) {
    console.error('[Prompt Draft API] campaign runtime request failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to process campaign request' }, corsHeaders)
    return true
  }
}
