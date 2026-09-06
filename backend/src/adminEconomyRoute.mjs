import { randomUUID } from 'node:crypto'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { getAuthenticatedUser } from './auth.mjs'
import { ECONOMY_SETTING_KEYS, ECONOMY_UNIT } from './economy.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'

const SETTINGS_PATH = '/api/admin/economy/settings'
const MAX_BODY_BYTES = 4 * 1024
const MIN_REFERENCE_VALUE_TOMAN = 1
const MAX_REFERENCE_VALUE_TOMAN = 1_000_000_000

function isJsonRequest(request) {
  const contentType = String(request.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase()
  return contentType === 'application/json'
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    const error = new Error('Economy settings payload is too large')
    error.code = 'ECONOMY_SETTINGS_BODY_TOO_LARGE'
    throw error
  }

  const chunks = []
  let totalBytes = 0
  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_BODY_BYTES) {
      const error = new Error('Economy settings payload is too large')
      error.code = 'ECONOMY_SETTINGS_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('Request body must contain valid JSON')
    error.code = 'ECONOMY_SETTINGS_INVALID_JSON'
    throw error
  }
}

async function getSettings(executor = queryDatabase) {
  const result = await executor(
    `
      SELECT
        integer_value AS "goinReferenceValueToman",
        updated_by AS "updatedBy",
        updated_at AS "updatedAt"
      FROM economy_settings
      WHERE setting_key = $1
      LIMIT 1
    `,
    [ECONOMY_SETTING_KEYS.GOIN_REFERENCE_VALUE_TOMAN],
  )

  const row = result.rows[0]
  return {
    unit: {
      ...ECONOMY_UNIT,
      referenceValueKind: 'simulation_reference',
    },
    goinReferenceValueToman: Number(row?.goinReferenceValueToman ?? 250),
    updatedBy: row?.updatedBy ?? null,
    updatedAt: row?.updatedAt?.toISOString?.() ?? null,
  }
}

function validateSettingsBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'JSON body must be an object', value: null }
  }

  const keys = Object.keys(body)
  if (keys.length !== 1 || keys[0] !== 'goinReferenceValueToman') {
    return { error: 'Only goinReferenceValueToman can be updated', value: null }
  }

  const value = body.goinReferenceValueToman
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_REFERENCE_VALUE_TOMAN ||
    value > MAX_REFERENCE_VALUE_TOMAN
  ) {
    return {
      error: `goinReferenceValueToman must be an integer between ${MIN_REFERENCE_VALUE_TOMAN} and ${MAX_REFERENCE_VALUE_TOMAN}`,
      value: null,
    }
  }

  return { error: null, value }
}

async function updateReferenceValue(actor, nextValue) {
  return withDatabaseTransaction(async (client) => {
    const execute = client.query.bind(client)
    const current = await getSettings(execute)

    if (current.goinReferenceValueToman === nextValue) {
      return { changed: false, settings: current }
    }

    await execute(
      `
        INSERT INTO economy_settings (
          setting_key,
          integer_value,
          updated_by,
          updated_at
        )
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (setting_key)
        DO UPDATE SET
          integer_value = EXCLUDED.integer_value,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      `,
      [ECONOMY_SETTING_KEYS.GOIN_REFERENCE_VALUE_TOMAN, nextValue, actor.id],
    )

    await execute(
      `
        INSERT INTO admin_audit_log (
          id,
          actor_user_id,
          target_user_id,
          action,
          metadata
        )
        VALUES (
          $1,
          $2,
          NULL,
          'economy.goin_reference_value_updated',
          $3::jsonb
        )
      `,
      [
        randomUUID(),
        actor.id,
        JSON.stringify({
          fromToman: current.goinReferenceValueToman,
          toToman: nextValue,
          unit: ECONOMY_UNIT.code,
          valueKind: 'simulation_reference',
        }),
      ],
    )

    return {
      changed: true,
      settings: await getSettings(execute),
    }
  })
}

export async function handleAdminEconomyRoute({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== SETTINGS_PATH) return false

  let user
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] admin economy auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }

  if (!hasPermission(user, PERMISSIONS.SYSTEM_SETTINGS_MANAGE)) {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  if (request.method === 'GET') {
    try {
      sendJson(response, 200, { ok: true, settings: await getSettings() }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] admin economy settings read failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to load economy settings' }, corsHeaders)
    }
    return true
  }

  if (request.method !== 'PUT') {
    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, { ...corsHeaders, Allow: 'GET, PUT' })
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
    const status = error?.code === 'ECONOMY_SETTINGS_BODY_TOO_LARGE' ? 413 : 400
    sendJson(response, status, { ok: false, message: error.message }, corsHeaders)
    return true
  }

  const validation = validateSettingsBody(body)
  if (validation.error) {
    sendJson(response, 400, {
      ok: false,
      code: 'ECONOMY_SETTINGS_VALIDATION',
      message: validation.error,
    }, corsHeaders)
    return true
  }

  try {
    const result = await updateReferenceValue(user, validation.value)
    sendJson(response, 200, { ok: true, ...result }, corsHeaders)
  } catch (error) {
    console.error('[Prompt Draft API] admin economy settings update failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to update economy settings' }, corsHeaders)
  }

  return true
}
