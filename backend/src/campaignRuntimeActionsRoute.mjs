import { createHash } from 'node:crypto'
import { getAuthenticatedUser, getAuthToken } from './auth.mjs'
import { queryDatabase } from './database.mjs'
import { getCampaignCallerState } from './campaignRuntime.mjs'
import {
  loadParticipationRuntime,
  loadPublishedCampaignBySlug,
} from './campaignRuntimeShared.mjs'
import {
  readCampaignAttemptAvailability,
  reserveCampaignAttempt,
} from './campaignAttempts.mjs'
import {
  readCampaignMechanicStates,
  submitCampaignAction,
} from './campaignActions.mjs'
import { evaluateCampaignRuntimeNotices } from './campaignRuntimeNotices.mjs'

const MAX_BODY_BYTES = 16 * 1024
const NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function sessionKey(request) {
  const token = getAuthToken(request)
  return token ? createHash('sha256').update(token).digest('hex') : null
}

async function readJsonBody(request) {
  const declared = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw Object.assign(new Error('Campaign request body too large'), { code: 'BODY_TOO_LARGE' })
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Campaign request body too large'), { code: 'BODY_TOO_LARGE' })
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function isJsonRequest(request) {
  return String(request.headers['content-type'] ?? '').split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

function validIdempotency(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 240
}

function parsePath(pathname) {
  const state = pathname.match(/^\/api\/campaigns\/([a-z0-9]+(?:-[a-z0-9]+)*)\/state$/)
  if (state) return { kind: 'state', slug: state[1] }
  const attempt = pathname.match(/^\/api\/campaigns\/([a-z0-9]+(?:-[a-z0-9]+)*)\/mechanics\/([A-Za-z0-9._-]{1,100})\/attempts$/)
  if (attempt) return { kind: 'attempt', slug: attempt[1], mechanicId: attempt[2] }
  const action = pathname.match(/^\/api\/campaigns\/([a-z0-9]+(?:-[a-z0-9]+)*)\/actions$/)
  if (action) return { kind: 'action', slug: action[1] }
  return null
}

function statusFor(code) {
  if (code === 'CAMPAIGN_NOT_FOUND' || code === 'CAMPAIGN_MECHANIC_NOT_FOUND') return 404
  if (code === 'CAMPAIGN_ATTEMPT_LIMIT_REACHED') return 429
  if (code === 'CAMPAIGN_IDEMPOTENCY_CONFLICT' || code === 'CAMPAIGN_PARTICIPATION_REQUIRED' || code === 'CAMPAIGN_PARTICIPATION_CLOSED' || code === 'CAMPAIGN_NOT_ACTIVE' || code === 'CAMPAIGN_ATTEMPT_STATE_INVALID') return 409
  return 400
}

function messageFor(code) {
  const messages = {
    CAMPAIGN_NOT_FOUND: 'Campaign not found',
    CAMPAIGN_MECHANIC_NOT_FOUND: 'Campaign mechanic not found',
    CAMPAIGN_PARTICIPATION_REQUIRED: 'Campaign participation is required',
    CAMPAIGN_ATTEMPT_LIMIT_REACHED: 'No campaign attempt is currently available',
    CAMPAIGN_IDEMPOTENCY_CONFLICT: 'Campaign idempotency key conflicts with an earlier request',
    CAMPAIGN_ACTION_UNSUPPORTED: 'Campaign action is not supported',
    CAMPAIGN_ACTION_SCHEMA_INVALID: 'Campaign action payload is invalid',
    CAMPAIGN_ATTEMPT_INVALID: 'Campaign attempt is invalid',
    CAMPAIGN_ATTEMPT_STATE_INVALID: 'Campaign attempt state does not allow this action',
    CAMPAIGN_SESSION_CONTEXT_REQUIRED: 'Campaign session context is required',
  }
  return messages[code] ?? 'Campaign request failed'
}

function validateAttemptBody(body) {
  if (!isObject(body) || Object.keys(body).some(key => key !== 'idempotencyKey') || !validIdempotency(body.idempotencyKey)) return null
  return { idempotencyKey: body.idempotencyKey.trim() }
}

function validateActionBody(body) {
  if (!isObject(body)) return null
  const allowed = new Set(['mechanicId', 'action', 'idempotencyKey', 'payload', 'evidence'])
  if (Object.keys(body).some(key => !allowed.has(key))) return null
  if (!NAME_PATTERN.test(body.mechanicId ?? '') || !NAME_PATTERN.test(body.action ?? '') || !validIdempotency(body.idempotencyKey)) return null
  if (body.payload !== undefined && !isObject(body.payload)) return null
  if (body.evidence !== undefined && !isObject(body.evidence)) return null
  return {
    mechanicId: body.mechanicId,
    action: body.action,
    idempotencyKey: body.idempotencyKey.trim(),
    payload: body.payload ?? {},
    evidence: body.evidence ?? {},
  }
}

async function sendServiceResult(response, sendJson, corsHeaders, result) {
  if (result.ok) {
    sendJson(response, 200, result, corsHeaders)
    return
  }
  sendJson(response, statusFor(result.code), {
    ok: false,
    code: result.code,
    message: messageFor(result.code),
    ...(result.nextEligibleAt ? { nextEligibleAt: result.nextEligibleAt } : {}),
    ...(result.duplicate !== undefined ? { duplicate: result.duplicate } : {}),
  }, corsHeaders)
}

export async function handleCampaignActionsRequest({ request, response, url, corsHeaders, sendJson }) {
  const route = parsePath(url.pathname)
  if (!route) return false
  const expectedMethod = route.kind === 'state' ? 'GET' : 'POST'
  if (request.method !== expectedMethod) {
    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, { ...corsHeaders, Allow: expectedMethod })
    return true
  }

  let user
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] campaign CE2.2 auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }
  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  try {
    const runtimeSessionKey = sessionKey(request)
    if (route.kind === 'state') {
      const effectiveAt = new Date()
      const result = await getCampaignCallerState({ slug: route.slug, userId: user.id, asOf: effectiveAt })
      if (!result.ok) {
        await sendServiceResult(response, sendJson, corsHeaders, result)
        return true
      }

      let definition = null
      if (result.participation) {
        const runtime = await loadParticipationRuntime(result.participation.id, queryDatabase)
        if (runtime) {
          definition = runtime.definition
          result.mechanics = await readCampaignMechanicStates(queryDatabase, runtime)
          result.attemptAvailability = await readCampaignAttemptAvailability({
            runtime,
            sessionKey: runtimeSessionKey,
            asOf: effectiveAt,
            executor: queryDatabase,
          })
        }
      }

      if (!definition) {
        const published = await loadPublishedCampaignBySlug(route.slug, queryDatabase)
        definition = published?.definition ?? null
      }

      const notices = evaluateCampaignRuntimeNotices({
        definition,
        campaignStatus: result.campaign.status,
        participation: result.participation,
        attemptAvailability: result.attemptAvailability,
        asOf: effectiveAt,
      })
      result.serverNow = notices.serverNow
      result.activeNotices = notices.activeNotices

      sendJson(response, 200, result, corsHeaders)
      return true
    }

    if (!isJsonRequest(request)) {
      sendJson(response, 415, { ok: false, message: 'Content-Type must be application/json' }, corsHeaders)
      return true
    }
    let body
    try {
      body = await readJsonBody(request)
    } catch (error) {
      sendJson(response, error?.code === 'BODY_TOO_LARGE' ? 413 : 400, {
        ok: false,
        message: error?.code === 'BODY_TOO_LARGE' ? error.message : 'Request body must contain valid JSON',
      }, corsHeaders)
      return true
    }

    if (route.kind === 'attempt') {
      const input = validateAttemptBody(body)
      if (!input) {
        sendJson(response, 400, { ok: false, message: 'Invalid campaign attempt request' }, corsHeaders)
        return true
      }
      const result = await reserveCampaignAttempt({
        slug: route.slug,
        userId: user.id,
        mechanicId: route.mechanicId,
        idempotencyKey: input.idempotencyKey,
        sessionKey: runtimeSessionKey,
      })
      await sendServiceResult(response, sendJson, corsHeaders, result)
      return true
    }

    const input = validateActionBody(body)
    if (!input) {
      sendJson(response, 400, { ok: false, message: 'Invalid campaign action request' }, corsHeaders)
      return true
    }
    const result = await submitCampaignAction({ slug: route.slug, userId: user.id, ...input })
    await sendServiceResult(response, sendJson, corsHeaders, result)
    return true
  } catch (error) {
    console.error('[Prompt Draft API] campaign CE2.2 request failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to process campaign request' }, corsHeaders)
    return true
  }
}
