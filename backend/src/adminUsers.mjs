import { getAdminUserById, listAdminUsers } from './database.mjs'
import { PERMISSIONS, USER_ROLES, hasPermission } from './authorization.mjs'

const MAX_QUERY_LENGTH = 200

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

function encodeCursor(user) {
  return Buffer.from(
    JSON.stringify({
      createdAt: user.createdAt,
      id: user.id,
    }),
    'utf8',
  ).toString('base64url')
}

function decodeCursor(value) {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8')
    const cursor = JSON.parse(decoded)

    if (
      !cursor ||
      typeof cursor !== 'object' ||
      typeof cursor.createdAt !== 'string' ||
      Number.isNaN(Date.parse(cursor.createdAt)) ||
      !isUuid(cursor.id)
    ) {
      return null
    }

    return {
      createdAt: new Date(cursor.createdAt).toISOString(),
      id: cursor.id,
    }
  } catch {
    return null
  }
}

function parseListQuery(url) {
  const errors = []
  let limit = 20
  let cursor = null
  let query = null
  let role = null

  const rawLimit = url.searchParams.get('limit')
  if (rawLimit !== null) {
    if (!/^\d+$/.test(rawLimit)) {
      errors.push({
        field: 'limit',
        message: 'limit must be an integer between 1 and 100',
      })
    } else {
      limit = Number(rawLimit)
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        errors.push({
          field: 'limit',
          message: 'limit must be an integer between 1 and 100',
        })
      }
    }
  }

  const rawCursor = url.searchParams.get('cursor')
  if (rawCursor !== null) {
    cursor = rawCursor ? decodeCursor(rawCursor) : null
    if (!cursor) {
      errors.push({
        field: 'cursor',
        message: 'cursor must be a valid admin user cursor',
      })
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

  const rawRole = url.searchParams.get('role')
  if (rawRole !== null) {
    role = rawRole.trim()
    if (!USER_ROLES.includes(role)) {
      errors.push({
        field: 'role',
        message: 'role must be user, admin, or super_admin',
      })
    }
  }

  return {
    errors,
    limit,
    cursor,
    query,
    role,
  }
}

function sendForbidden(response, corsHeaders, sendJson) {
  sendJson(
    response,
    403,
    { ok: false, message: 'Forbidden' },
    corsHeaders,
  )
}

export async function handleAdminUsersRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  user,
}) {
  const isCollection = url.pathname === '/api/admin/users'
  const detailMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/)

  if (!isCollection && !detailMatch) return false

  if (!hasPermission(user, PERMISSIONS.USERS_VIEW)) {
    sendForbidden(response, corsHeaders, sendJson)
    return true
  }

  if (request.method !== 'GET') {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      corsHeaders,
    )
    return true
  }

  if (isCollection) {
    const params = parseListQuery(url)

    if (params.errors.length > 0) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Invalid admin user list query',
          errors: params.errors,
        },
        corsHeaders,
      )
      return true
    }

    try {
      const result = await listAdminUsers(params)
      const lastUser = result.users.at(-1) ?? null

      sendJson(
        response,
        200,
        {
          ok: true,
          users: result.users,
          pageInfo: {
            nextCursor: result.hasMore && lastUser ? encodeCursor(lastUser) : null,
            hasMore: result.hasMore,
          },
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] admin user list failed', error)
      sendJson(
        response,
        500,
        { ok: false, message: 'Failed to load users' },
        corsHeaders,
      )
    }

    return true
  }

  let id
  try {
    id = decodeURIComponent(detailMatch[1]).trim()
  } catch {
    id = ''
  }

  if (!isUuid(id)) {
    sendJson(
      response,
      400,
      { ok: false, message: 'Invalid user id' },
      corsHeaders,
    )
    return true
  }

  try {
    const foundUser = await getAdminUserById(id)

    if (!foundUser) {
      sendJson(
        response,
        404,
        { ok: false, message: 'User not found' },
        corsHeaders,
      )
      return true
    }

    sendJson(
      response,
      200,
      { ok: true, user: foundUser },
      corsHeaders,
    )
  } catch (error) {
    console.error('[Prompt Draft API] admin user detail failed', error)
    sendJson(
      response,
      500,
      { ok: false, message: 'Failed to load user' },
      corsHeaders,
    )
  }

  return true
}
