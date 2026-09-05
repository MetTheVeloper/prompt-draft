import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase } from './database.mjs'

const ANALYTICS_EVENTS_PATH = '/api/analytics/events'
const MAX_BODY_BYTES = 8 * 1024
const MAX_PATH_LENGTH = 500
const MAX_VARIANT_KEY_LENGTH = 100
const SUPPORTED_LOCALES = new Set(['en', 'fa'])

const EVENT_RULES = Object.freeze({
  prompt_archive_view: Object.freeze({
    resourceType: 'prompt_archive_item',
    metadataKeys: Object.freeze(['source']),
  }),
  prompt_archive_copy: Object.freeze({
    resourceType: 'prompt_archive_item',
    metadataKeys: Object.freeze(['variantKey']),
  }),
})

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isJsonRequest(request) {
  const contentType = String(request.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase()

  return contentType === 'application/json'
}

function validationError(field, message) {
  return { field, message }
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers['content-length'] ?? 0)

  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    const error = new Error('Analytics event payload is too large')
    error.code = 'ANALYTICS_BODY_TOO_LARGE'
    throw error
  }

  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    totalBytes += chunk.length

    if (totalBytes > MAX_BODY_BYTES) {
      const error = new Error('Analytics event payload is too large')
      error.code = 'ANALYTICS_BODY_TOO_LARGE'
      throw error
    }

    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('Request body must contain valid JSON')
    error.code = 'ANALYTICS_INVALID_JSON'
    throw error
  }
}

function validateResource(value, rule, errors) {
  if (!isPlainObject(value)) {
    errors.push(validationError('resource', 'resource must be an object'))
    return null
  }

  const type = typeof value.type === 'string' ? value.type.trim() : ''
  const id = typeof value.id === 'string' ? value.id.trim() : ''

  if (type !== rule.resourceType) {
    errors.push(validationError('resource.type', `resource.type must be ${rule.resourceType}`))
  }

  if (!/^[1-9]\d{0,19}$/.test(id)) {
    errors.push(validationError('resource.id', 'resource.id must be a positive numeric public id'))
  }

  return errors.length ? null : { type, id }
}

function validateMetadata(eventName, value, rule, errors) {
  const metadata = value === undefined ? {} : value

  if (!isPlainObject(metadata)) {
    errors.push(validationError('metadata', 'metadata must be an object'))
    return null
  }

  const allowedKeys = new Set(rule.metadataKeys)
  const unknownKey = Object.keys(metadata).find(key => !allowedKeys.has(key))

  if (unknownKey) {
    errors.push(validationError(`metadata.${unknownKey}`, 'metadata field is not allowed for this event'))
    return null
  }

  if (eventName === 'prompt_archive_view') {
    if (metadata.source !== undefined && !['api', 'fallback'].includes(metadata.source)) {
      errors.push(validationError('metadata.source', 'metadata.source must be api or fallback'))
    }

    return errors.length
      ? null
      : metadata.source
        ? { source: metadata.source }
        : {}
  }

  if (eventName === 'prompt_archive_copy') {
    const variantKey = typeof metadata.variantKey === 'string'
      ? metadata.variantKey.trim()
      : ''

    if (!variantKey || variantKey.length > MAX_VARIANT_KEY_LENGTH) {
      errors.push(validationError(
        'metadata.variantKey',
        `metadata.variantKey must be a non-empty string up to ${MAX_VARIANT_KEY_LENGTH} characters`,
      ))
      return null
    }

    return { variantKey }
  }

  return {}
}

function normalizeOptionalPath(value, errors) {
  if (value === undefined || value === null || value === '') return null

  if (typeof value !== 'string') {
    errors.push(validationError('path', 'path must be a string'))
    return null
  }

  const path = value.trim()
  if (!path || path.length > MAX_PATH_LENGTH || !path.startsWith('/')) {
    errors.push(validationError(
      'path',
      `path must start with / and be up to ${MAX_PATH_LENGTH} characters`,
    ))
    return null
  }

  return path
}

function normalizeOptionalLocale(value, errors) {
  if (value === undefined || value === null || value === '') return null

  if (typeof value !== 'string' || !SUPPORTED_LOCALES.has(value.trim())) {
    errors.push(validationError('locale', 'locale must be en or fa'))
    return null
  }

  return value.trim()
}

function normalizeOptionalOccurredAt(value, errors) {
  if (value === undefined || value === null || value === '') return null

  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(validationError('occurredAt', 'occurredAt must be a valid timestamp'))
    return null
  }

  return new Date(value).toISOString()
}

function validateEventBody(body) {
  if (!isPlainObject(body)) {
    return {
      errors: [validationError('body', 'JSON body must be an object')],
      event: null,
    }
  }

  const errors = []
  const allowedTopLevelFields = new Set([
    'eventId',
    'eventName',
    'anonymousId',
    'sessionId',
    'resource',
    'path',
    'locale',
    'occurredAt',
    'metadata',
  ])
  const unknownField = Object.keys(body).find(field => !allowedTopLevelFields.has(field))

  if (unknownField) {
    errors.push(validationError(unknownField, 'Unsupported analytics event field'))
  }

  const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : ''
  const anonymousId = typeof body.anonymousId === 'string' ? body.anonymousId.trim() : ''
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
  const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : ''
  const rule = EVENT_RULES[eventName]

  if (!isUuid(eventId)) {
    errors.push(validationError('eventId', 'eventId must be a valid UUID'))
  }

  if (!isUuid(anonymousId)) {
    errors.push(validationError('anonymousId', 'anonymousId must be a valid UUID'))
  }

  if (!isUuid(sessionId)) {
    errors.push(validationError('sessionId', 'sessionId must be a valid UUID'))
  }

  if (!rule) {
    errors.push(validationError('eventName', 'eventName is not allowed'))
  }

  const resource = rule ? validateResource(body.resource, rule, errors) : null
  const metadata = rule ? validateMetadata(eventName, body.metadata, rule, errors) : null
  const path = normalizeOptionalPath(body.path, errors)
  const locale = normalizeOptionalLocale(body.locale, errors)
  const occurredAt = normalizeOptionalOccurredAt(body.occurredAt, errors)

  if (errors.length || !rule || !resource || metadata === null) {
    return { errors, event: null }
  }

  return {
    errors: [],
    event: {
      id: eventId,
      eventName,
      anonymousId,
      sessionId,
      resourceType: resource.type,
      resourceId: resource.id,
      path,
      locale,
      metadata,
      occurredAt,
    },
  }
}

async function insertEvent(event, userId) {
  const result = await queryDatabase(
    `
      INSERT INTO product_analytics_events (
        id,
        event_name,
        user_id,
        anonymous_id,
        session_id,
        resource_type,
        resource_id,
        path,
        locale,
        metadata,
        occurred_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `,
    [
      event.id,
      event.eventName,
      userId,
      event.anonymousId,
      event.sessionId,
      event.resourceType,
      event.resourceId,
      event.path,
      event.locale,
      JSON.stringify(event.metadata),
      event.occurredAt,
    ],
  )

  return result.rowCount === 1
}

export async function handleProductAnalyticsRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== ANALYTICS_EVENTS_PATH) return false

  if (request.method !== 'POST') {
    response.writeHead(405, {
      ...corsHeaders,
      Allow: 'POST',
      'Content-Type': 'application/json; charset=utf-8',
    })
    response.end(JSON.stringify({ ok: false, message: 'Method Not Allowed' }))
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
    if (error?.code === 'ANALYTICS_BODY_TOO_LARGE') {
      sendJson(response, 413, { ok: false, message: error.message }, corsHeaders)
    } else {
      sendJson(response, 400, { ok: false, message: error.message }, corsHeaders)
    }
    return true
  }

  const validation = validateEventBody(body)
  if (validation.errors.length || !validation.event) {
    sendJson(
      response,
      400,
      {
        ok: false,
        code: 'ANALYTICS_VALIDATION',
        message: 'Invalid analytics event',
        errors: validation.errors,
      },
      corsHeaders,
    )
    return true
  }

  try {
    const user = await getAuthenticatedUser(request)
    const inserted = await insertEvent(validation.event, user?.id ?? null)

    sendJson(
      response,
      200,
      {
        ok: true,
        accepted: true,
        duplicate: !inserted,
      },
      corsHeaders,
    )
  } catch (error) {
    console.error('[Prompt Draft API] analytics event insert failed', error)
    sendJson(
      response,
      500,
      { ok: false, message: 'Failed to record analytics event' },
      corsHeaders,
    )
  }

  return true
}
