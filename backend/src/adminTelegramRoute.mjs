import { getAuthenticatedUser } from './auth.mjs'
import {
  publicTelegramRoutingConfig,
  readTelegramRoutingConfig,
} from './telegramPostContract.mjs'
import {
  TelegramPublishingServiceError,
  createAndPublishTelegramPublication,
  listTelegramPublications,
  retryTelegramPublication,
} from './telegramPublishing.mjs'

const PREFIX = '/api/admin/telegram'
const PUBLICATIONS_PATH = `${PREFIX}/publications`
const CONFIG_PATH = `${PREFIX}/config`
const MAX_BODY_BYTES = 64 * 1024
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isJsonRequest(request) {
  return String(request.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase() === 'application/json'
}

async function readJsonBody(request) {
  const declared = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    const error = new Error('Telegram publication payload is too large')
    error.code = 'TELEGRAM_BODY_TOO_LARGE'
    throw error
  }

  const chunks = []
  let total = 0
  for await (const chunk of request) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) {
      const error = new Error('Telegram publication payload is too large')
      error.code = 'TELEGRAM_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('Request body must contain valid JSON')
    error.code = 'TELEGRAM_INVALID_JSON'
    throw error
  }
}

function parseLimit(url) {
  if ([...url.searchParams.keys()].some(key => key !== 'limit')) return null
  const raw = url.searchParams.get('limit')
  if (raw === null) return 20
  if (!/^\d+$/.test(raw)) return null
  const limit = Number(raw)
  return Number.isSafeInteger(limit) && limit >= 1 && limit <= 100 ? limit : null
}

function sendServiceError(error, response, sendJson, corsHeaders) {
  if (error instanceof TelegramPublishingServiceError) {
    sendJson(response, error.status, {
      ok: false,
      code: error.code,
      message: error.message,
      ...(Array.isArray(error.errors) && error.errors.length ? { errors: error.errors } : {}),
    }, corsHeaders)
    return
  }

  console.error('[Prompt Draft API] Telegram admin request failed', error)
  sendJson(response, 500, { ok: false, message: 'Failed to process Telegram request' }, corsHeaders)
}

export async function handleAdminTelegramRoute({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  dependencies = {},
}) {
  if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) return false

  let user
  try {
    user = await (dependencies.getAuthenticatedUser ?? getAuthenticatedUser)(request)
  } catch (error) {
    console.error('[Prompt Draft API] Telegram admin auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }
  if (user.role !== 'super_admin') {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  if (url.pathname === CONFIG_PATH) {
    if (request.method !== 'GET') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, { ...corsHeaders, Allow: 'GET' })
      return true
    }

    const config = (dependencies.readTelegramRoutingConfig ?? readTelegramRoutingConfig)()
    sendJson(response, 200, {
      ok: true,
      telegram: publicTelegramRoutingConfig(config),
    }, corsHeaders)
    return true
  }

  if (url.pathname === PUBLICATIONS_PATH) {
    if (request.method === 'GET') {
      const limit = parseLimit(url)
      if (limit === null) {
        sendJson(response, 400, { ok: false, message: 'Invalid Telegram publication list query' }, corsHeaders)
        return true
      }

      try {
        const publications = await (dependencies.listTelegramPublications ?? listTelegramPublications)({ limit })
        sendJson(response, 200, { ok: true, publications }, corsHeaders)
      } catch (error) {
        sendServiceError(error, response, sendJson, corsHeaders)
      }
      return true
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, { ...corsHeaders, Allow: 'GET, POST' })
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
      sendJson(
        response,
        error?.code === 'TELEGRAM_BODY_TOO_LARGE' ? 413 : 400,
        { ok: false, message: error.message },
        corsHeaders,
      )
      return true
    }

    try {
      const result = await (dependencies.createAndPublishTelegramPublication ?? createAndPublishTelegramPublication)(user, body)
      sendJson(response, result.duplicate ? 200 : 201, {
        ok: true,
        duplicate: result.duplicate,
        publication: result.publication,
      }, corsHeaders)
    } catch (error) {
      sendServiceError(error, response, sendJson, corsHeaders)
    }
    return true
  }

  const retryMatch = url.pathname.match(
    /^\/api\/admin\/telegram\/publications\/([0-9a-f-]+)\/retry$/i,
  )
  if (retryMatch) {
    if (!UUID_PATTERN.test(retryMatch[1])) {
      sendJson(response, 404, { ok: false, message: 'Telegram publication not found' }, corsHeaders)
      return true
    }
    if (request.method !== 'POST') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, { ...corsHeaders, Allow: 'POST' })
      return true
    }

    try {
      const publication = await (dependencies.retryTelegramPublication ?? retryTelegramPublication)(user, retryMatch[1])
      sendJson(response, 200, { ok: true, publication }, corsHeaders)
    } catch (error) {
      sendServiceError(error, response, sendJson, corsHeaders)
    }
    return true
  }

  sendJson(response, 404, { ok: false, message: 'Not Found' }, corsHeaders)
  return true
}
