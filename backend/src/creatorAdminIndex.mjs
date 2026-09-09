import { getAuthenticatedUser } from './auth.mjs'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { queryDatabase } from './database.mjs'

const ADMIN_CREATORS_PATH = '/api/admin/creators'
const ADMIN_CREATOR_EVENTS_PATTERN = /^\/api\/admin\/creators\/([^/]+)\/events$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_QUERY_LENGTH = 200
const CREATOR_FILTER_STATUSES = new Set([
  'pending',
  'approved',
  'rejected',
  'suspended',
])

function asIso(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString()
}

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function decodeUserId(value) {
  try {
    return decodeURIComponent(value).trim()
  } catch {
    return ''
  }
}

function encodeCursor(row) {
  return Buffer.from(
    JSON.stringify({
      updatedAt: asIso(row.creatorUpdatedAt),
      userId: row.id,
    }),
    'utf8',
  ).toString('base64url')
}

function decodeCursor(value) {
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (
      !decoded ||
      typeof decoded !== 'object' ||
      typeof decoded.updatedAt !== 'string' ||
      Number.isNaN(Date.parse(decoded.updatedAt)) ||
      !isUuid(decoded.userId)
    ) {
      return null
    }

    return {
      updatedAt: new Date(decoded.updatedAt).toISOString(),
      userId: decoded.userId,
    }
  } catch {
    return null
  }
}

export function parseCreatorAdminListQuery(url) {
  const errors = []
  let limit = 20
  let cursor = null
  let query = null
  let status = null

  const rawLimit = url.searchParams.get('limit')
  if (rawLimit !== null) {
    if (!/^\d+$/.test(rawLimit)) {
      errors.push({ field: 'limit', message: 'limit must be an integer between 1 and 100' })
    } else {
      limit = Number(rawLimit)
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        errors.push({ field: 'limit', message: 'limit must be an integer between 1 and 100' })
      }
    }
  }

  const rawCursor = url.searchParams.get('cursor')
  if (rawCursor !== null) {
    cursor = rawCursor ? decodeCursor(rawCursor) : null
    if (!cursor) {
      errors.push({ field: 'cursor', message: 'cursor must be a valid Creator review cursor' })
    }
  }

  const rawQuery = url.searchParams.get('query')
  if (rawQuery !== null) {
    query = rawQuery.trim()
    if (!query || query.length > MAX_QUERY_LENGTH) {
      errors.push({
        field: 'query',
        message: `query must be a non-empty string up to ${MAX_QUERY_LENGTH} characters`,
      })
    }
  }

  const rawStatus = url.searchParams.get('status')
  if (rawStatus !== null) {
    status = rawStatus.trim().toLowerCase()
    if (!CREATOR_FILTER_STATUSES.has(status)) {
      errors.push({
        field: 'status',
        message: 'status must be pending, approved, rejected, or suspended',
      })
    }
  }

  return { errors, limit, cursor, query, status }
}

function mapCreatorSummary(row) {
  return {
    id: row.id,
    username: row.username ?? null,
    email: row.email ?? null,
    avatarUrl: row.avatarUrl ?? null,
    role: row.role,
    accountStatus: row.accountStatus,
    creatorStatus: row.creatorStatus,
    createdAt: asIso(row.createdAt),
    requestedAt: asIso(row.requestedAt),
    reviewedAt: asIso(row.reviewedAt),
    approvedAt: asIso(row.approvedAt),
    suspendedAt: asIso(row.suspendedAt),
    creatorUpdatedAt: asIso(row.creatorUpdatedAt),
  }
}

export async function listAdminCreators({
  limit = 20,
  cursor = null,
  query = null,
  status = null,
} = {}, runQuery = queryDatabase) {
  const values = []
  const conditions = []

  if (status) {
    values.push(status)
    conditions.push(`creator.status = $${values.length}`)
  }

  if (query) {
    values.push(query)
    const index = values.length
    conditions.push(
      `(POSITION(LOWER($${index}) IN LOWER(COALESCE(users.username, ''))) > 0 OR POSITION(LOWER($${index}) IN LOWER(COALESCE(users.email, ''))) > 0)`,
    )
  }

  if (cursor) {
    values.push(cursor.updatedAt, cursor.userId)
    const updatedAtIndex = values.length - 1
    const userIdIndex = values.length
    conditions.push(
      `(creator.updated_at, creator.user_id) < ($${updatedAtIndex}::timestamptz, $${userIdIndex}::uuid)`,
    )
  }

  const fetchLimit = limit + 1
  values.push(fetchLimit)
  const limitIndex = values.length
  const whereClause = conditions.length ? `WHERE ${conditions.join('\n        AND ')}` : ''

  const result = await runQuery(
    `
      SELECT
        users.id,
        users.username,
        users.email,
        users.avatar_url AS "avatarUrl",
        users.role,
        users.status AS "accountStatus",
        users.created_at AS "createdAt",
        creator.status AS "creatorStatus",
        creator.requested_at AS "requestedAt",
        creator.reviewed_at AS "reviewedAt",
        creator.approved_at AS "approvedAt",
        creator.suspended_at AS "suspendedAt",
        creator.updated_at AS "creatorUpdatedAt"
      FROM creator_accounts creator
      INNER JOIN users ON users.id = creator.user_id
      ${whereClause}
      ORDER BY creator.updated_at DESC, creator.user_id DESC
      LIMIT $${limitIndex}
    `,
    values,
  )

  const hasMore = result.rows.length > limit
  const rows = result.rows.slice(0, limit)
  const creators = rows.map(mapCreatorSummary)
  const lastRow = rows.at(-1) ?? null

  return {
    creators,
    pageInfo: {
      hasMore,
      nextCursor: hasMore && lastRow ? encodeCursor(lastRow) : null,
    },
  }
}

export async function readCreatorEvents(userId, runQuery = queryDatabase) {
  const accountResult = await runQuery(
    `SELECT status FROM creator_accounts WHERE user_id = $1 LIMIT 1`,
    [userId],
  )
  if (!accountResult.rows[0]) return null

  const result = await runQuery(
    `
      SELECT
        id,
        actor_user_id AS "actorUserId",
        event_type AS "eventType",
        metadata,
        created_at AS "createdAt"
      FROM creator_account_events
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `,
    [userId],
  )

  return result.rows.map(row => ({
    id: row.id,
    actorUserId: row.actorUserId ?? null,
    eventType: row.eventType,
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
    createdAt: asIso(row.createdAt),
  }))
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
    console.error('[Prompt Draft API] Creator admin index auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return null
  }
}

export async function handleCreatorAdminIndexRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const isCollection = url.pathname === ADMIN_CREATORS_PATH
  const eventsMatch = url.pathname.match(ADMIN_CREATOR_EVENTS_PATTERN)
  if (!isCollection && !eventsMatch) return false

  const user = await authenticate(request, response, corsHeaders, sendJson)
  if (!user) return true

  if (!hasPermission(user, PERMISSIONS.CREATORS_MANAGE)) {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, {
      ...corsHeaders,
      Allow: 'GET',
    })
    return true
  }

  if (isCollection) {
    const params = parseCreatorAdminListQuery(url)
    if (params.errors.length) {
      sendJson(
        response,
        400,
        {
          ok: false,
          code: 'CREATOR_ADMIN_LIST_INVALID',
          message: 'Invalid Creator review list query',
          errors: params.errors,
        },
        corsHeaders,
      )
      return true
    }

    try {
      const page = await listAdminCreators(params)
      sendJson(response, 200, { ok: true, ...page }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] Creator admin index failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to load Creator accounts' }, corsHeaders)
    }
    return true
  }

  const userId = decodeUserId(eventsMatch[1])
  if (!isUuid(userId)) {
    sendJson(response, 400, { ok: false, message: 'Invalid user id' }, corsHeaders)
    return true
  }

  try {
    const events = await readCreatorEvents(userId)
    if (!events) {
      sendJson(response, 404, { ok: false, message: 'Creator account not found' }, corsHeaders)
    } else {
      sendJson(response, 200, { ok: true, events }, corsHeaders)
    }
  } catch (error) {
    console.error('[Prompt Draft API] Creator event history failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to load Creator history' }, corsHeaders)
  }

  return true
}
