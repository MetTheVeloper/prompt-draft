import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase } from './database.mjs'

const DISCOVERY_PREFERENCES_PATH = '/api/preferences/discovery'
const MAX_BODY_BYTES = 4 * 1024
const MAX_DISCOVERY_INTERESTS = 6

const DISCOVERY_INTERESTS = new Set([
  'portrait_photography',
  'three_d_sculpture',
  'illustration_animation',
  'poster_editorial',
  'product_fashion',
  'cinematic_game_art',
])

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

async function authenticate(request, response, corsHeaders, sendJson) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
      return null
    }
    return user
  } catch (error) {
    console.error('[Prompt Draft API] preferences auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return null
  }
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    const error = new Error('Preferences request body is too large')
    error.code = 'PREFERENCES_BODY_TOO_LARGE'
    throw error
  }

  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_BODY_BYTES) {
      const error = new Error('Preferences request body is too large')
      error.code = 'PREFERENCES_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function validateDiscoveryPreferences(body) {
  if (!isPlainObject(body)) {
    return {
      errors: [{ field: 'body', message: 'JSON body must be an object' }],
      interests: null,
    }
  }

  const errors = []
  const unknownFields = Object.keys(body).filter(key => key !== 'interests')

  if (unknownFields.length) {
    errors.push({
      field: 'body',
      message: `Unsupported preference field: ${unknownFields[0]}`,
    })
  }

  if (!Array.isArray(body.interests)) {
    errors.push({
      field: 'interests',
      message: 'interests must be an array',
    })
    return { errors, interests: null }
  }

  if (body.interests.length > MAX_DISCOVERY_INTERESTS) {
    errors.push({
      field: 'interests',
      message: `interests can contain at most ${MAX_DISCOVERY_INTERESTS} values`,
    })
  }

  const interests = []
  const seen = new Set()

  for (const rawInterest of body.interests) {
    if (typeof rawInterest !== 'string') {
      errors.push({
        field: 'interests',
        message: 'every interest must be a string',
      })
      continue
    }

    const interest = rawInterest.trim()

    if (!DISCOVERY_INTERESTS.has(interest)) {
      errors.push({
        field: 'interests',
        message: `unsupported discovery interest: ${interest || '(empty)'}`,
      })
      continue
    }

    if (seen.has(interest)) {
      errors.push({
        field: 'interests',
        message: `duplicate discovery interest: ${interest}`,
      })
      continue
    }

    seen.add(interest)
    interests.push(interest)
  }

  return {
    errors,
    interests: errors.length ? null : interests,
  }
}

function mapPreferenceRow(row) {
  return {
    interests: Array.isArray(row?.interests) ? row.interests : [],
    updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
  }
}

async function readDiscoveryPreferences(userId) {
  const result = await queryDatabase(
    `
      SELECT
        discovery_interests AS interests,
        updated_at AS "updatedAt"
      FROM user_preferences
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  )

  return mapPreferenceRow(result.rows[0])
}

async function writeDiscoveryPreferences(userId, interests) {
  const result = await queryDatabase(
    `
      INSERT INTO user_preferences (
        user_id,
        discovery_interests,
        created_at,
        updated_at
      )
      VALUES ($1, $2::text[], NOW(), NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        discovery_interests = EXCLUDED.discovery_interests,
        updated_at = NOW()
      RETURNING
        discovery_interests AS interests,
        updated_at AS "updatedAt"
    `,
    [userId, interests],
  )

  return mapPreferenceRow(result.rows[0])
}

export async function handleUserPreferencesRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== DISCOVERY_PREFERENCES_PATH) return false

  if (!['GET', 'PUT'].includes(request.method ?? '')) {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method not allowed' },
      { ...corsHeaders, Allow: 'GET, PUT' },
    )
    return true
  }

  const user = await authenticate(request, response, corsHeaders, sendJson)
  if (!user) return true

  if (request.method === 'GET') {
    try {
      const preferences = await readDiscoveryPreferences(user.id)
      sendJson(response, 200, { ok: true, preferences }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] discovery preferences read failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read preferences' }, corsHeaders)
    }
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
    if (error?.code === 'PREFERENCES_BODY_TOO_LARGE') {
      sendJson(
        response,
        413,
        { ok: false, code: 'PREFERENCES_BODY_TOO_LARGE', message: 'Preferences request body is too large' },
        corsHeaders,
      )
    } else {
      sendJson(
        response,
        400,
        { ok: false, message: 'Request body must contain valid JSON' },
        corsHeaders,
      )
    }
    return true
  }

  const validation = validateDiscoveryPreferences(body)
  if (validation.errors.length || !validation.interests) {
    sendJson(
      response,
      400,
      {
        ok: false,
        code: 'PREFERENCES_VALIDATION',
        message: 'Invalid discovery preferences',
        errors: validation.errors,
      },
      corsHeaders,
    )
    return true
  }

  try {
    const preferences = await writeDiscoveryPreferences(user.id, validation.interests)
    sendJson(response, 200, { ok: true, preferences }, corsHeaders)
  } catch (error) {
    console.error('[Prompt Draft API] discovery preferences write failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to save preferences' }, corsHeaders)
  }

  return true
}
