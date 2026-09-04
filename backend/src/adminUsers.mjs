import { randomUUID } from 'node:crypto'
import { getAdminUserById, listAdminUsers, queryDatabase } from './database.mjs'
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

function sendConflict(response, corsHeaders, sendJson, message) {
  sendJson(
    response,
    409,
    { ok: false, message },
    corsHeaders,
  )
}

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

async function readJsonBody(request, response, corsHeaders, sendJson) {
  if (!isJsonRequest(request)) {
    sendJson(
      response,
      415,
      { ok: false, message: 'Content-Type must be application/json' },
      corsHeaders,
    )
    return null
  }

  try {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    sendJson(
      response,
      400,
      { ok: false, message: 'Request body must contain valid JSON' },
      corsHeaders,
    )
    return null
  }
}

function decodeUserId(value) {
  try {
    return decodeURIComponent(value).trim()
  } catch {
    return ''
  }
}

async function countActiveSuperAdmins() {
  const result = await queryDatabase(
    `
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE role = 'super_admin'
        AND status = 'active'
    `,
  )

  return Number(result.rows[0]?.count ?? 0)
}

function canActorManageTarget(actor, target) {
  if (!actor || !target) return false
  if (actor.role === 'super_admin') return true
  return target.role !== 'super_admin'
}

async function ensureMutationAllowed({
  actor,
  target,
  response,
  corsHeaders,
  sendJson,
  action,
  nextRole = null,
}) {
  if (target.id === actor.id) {
    sendConflict(
      response,
      corsHeaders,
      sendJson,
      'You cannot perform this administrative action on your own account',
    )
    return false
  }

  if (!canActorManageTarget(actor, target)) {
    sendForbidden(response, corsHeaders, sendJson)
    return false
  }

  if (
    action === 'role' &&
    actor.role !== 'super_admin' &&
    nextRole === 'super_admin'
  ) {
    sendForbidden(response, corsHeaders, sendJson)
    return false
  }

  const removesActiveSuperAdmin =
    target.role === 'super_admin' &&
    target.status === 'active' &&
    (
      (action === 'role' && nextRole !== 'super_admin') ||
      action === 'suspend'
    )

  if (removesActiveSuperAdmin && await countActiveSuperAdmins() <= 1) {
    sendConflict(
      response,
      corsHeaders,
      sendJson,
      'The last active super admin cannot be downgraded or suspended',
    )
    return false
  }

  return true
}

async function changeUserRole(actor, target, nextRole) {
  if (target.role === nextRole) {
    return { user: target }
  }

  await queryDatabase(
    `
      WITH changed AS (
        UPDATE users
        SET role = $1
        WHERE id = $2
        RETURNING id
      )
      INSERT INTO admin_audit_log (
        id,
        actor_user_id,
        target_user_id,
        action,
        metadata
      )
      SELECT
        $3,
        $4,
        changed.id,
        'user.role_changed',
        jsonb_build_object('fromRole', $5::text, 'toRole', $1::text)
      FROM changed
    `,
    [nextRole, target.id, randomUUID(), actor.id, target.role],
  )

  return { user: await getAdminUserById(target.id) }
}

async function setUserSuspended(actor, target, suspended) {
  const nextStatus = suspended ? 'suspended' : 'active'
  if (target.status === nextStatus) {
    return { user: target }
  }

  await queryDatabase(
    `
      WITH changed AS (
        UPDATE users
        SET status = $1
        WHERE id = $2
        RETURNING id
      ),
      removed_sessions AS (
        DELETE FROM auth_sessions
        WHERE user_id = $2
        RETURNING id
      )
      INSERT INTO admin_audit_log (
        id,
        actor_user_id,
        target_user_id,
        action,
        metadata
      )
      SELECT
        $3,
        $4,
        changed.id,
        $5,
        jsonb_build_object(
          'fromStatus', $6::text,
          'toStatus', $1::text,
          'revokedSessions', (SELECT COUNT(*) FROM removed_sessions)
        )
      FROM changed
    `,
    [
      nextStatus,
      target.id,
      randomUUID(),
      actor.id,
      suspended ? 'user.suspended' : 'user.unsuspended',
      target.status,
    ],
  )

  return { user: await getAdminUserById(target.id) }
}

async function revokeUserSessions(actor, target) {
  const result = await queryDatabase(
    `
      WITH removed AS (
        DELETE FROM auth_sessions
        WHERE user_id = $1
        RETURNING id
      ),
      audit AS (
        INSERT INTO admin_audit_log (
          id,
          actor_user_id,
          target_user_id,
          action,
          metadata
        )
        VALUES (
          $2,
          $3,
          $1,
          'user.sessions_revoked',
          jsonb_build_object('revokedSessions', (SELECT COUNT(*) FROM removed))
        )
      )
      SELECT COUNT(*)::int AS count
      FROM removed
    `,
    [target.id, randomUUID(), actor.id],
  )

  return {
    user: await getAdminUserById(target.id),
    revokedSessionCount: Number(result.rows[0]?.count ?? 0),
  }
}

async function resetUserCloudData(actor, target) {
  const result = await queryDatabase(
    `
      WITH removed AS (
        DELETE FROM prompt_drafts
        WHERE user_id = $1
        RETURNING draft_id
      ),
      audit AS (
        INSERT INTO admin_audit_log (
          id,
          actor_user_id,
          target_user_id,
          action,
          metadata
        )
        VALUES (
          $2,
          $3,
          $1,
          'user.cloud_data_reset',
          jsonb_build_object('deletedDrafts', (SELECT COUNT(*) FROM removed))
        )
      )
      SELECT COUNT(*)::int AS count
      FROM removed
    `,
    [target.id, randomUUID(), actor.id],
  )

  return {
    user: await getAdminUserById(target.id),
    deletedDraftCount: Number(result.rows[0]?.count ?? 0),
  }
}

async function handleMutation({
  request,
  response,
  action,
  target,
  user,
  corsHeaders,
  sendJson,
}) {
  if (request.method !== 'POST') {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method Not Allowed' },
      corsHeaders,
    )
    return
  }

  let nextRole = null
  if (action === 'role') {
    const body = await readJsonBody(request, response, corsHeaders, sendJson)
    if (!body) return

    nextRole = typeof body.role === 'string' ? body.role.trim() : ''
    if (!USER_ROLES.includes(nextRole)) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Invalid role',
          errors: [{ field: 'role', message: 'role must be user, admin, or super_admin' }],
        },
        corsHeaders,
      )
      return
    }
  }

  if (!await ensureMutationAllowed({
    actor: user,
    target,
    response,
    corsHeaders,
    sendJson,
    action,
    nextRole,
  })) {
    return
  }

  let result
  switch (action) {
    case 'role':
      result = await changeUserRole(user, target, nextRole)
      break
    case 'suspend':
      result = await setUserSuspended(user, target, true)
      break
    case 'unsuspend':
      result = await setUserSuspended(user, target, false)
      break
    case 'revoke-sessions':
      result = await revokeUserSessions(user, target)
      break
    case 'reset-cloud-data':
      result = await resetUserCloudData(user, target)
      break
    default:
      sendJson(response, 404, { ok: false, message: 'Not Found' }, corsHeaders)
      return
  }

  sendJson(response, 200, { ok: true, ...result }, corsHeaders)
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
  const mutationMatch = url.pathname.match(
    /^\/api\/admin\/users\/([^/]+)\/(role|suspend|unsuspend|revoke-sessions|reset-cloud-data)$/,
  )

  if (!isCollection && !detailMatch && !mutationMatch) return false

  const isMutation = Boolean(mutationMatch)
  const requiredPermission = isMutation
    ? PERMISSIONS.USERS_MANAGE
    : PERMISSIONS.USERS_VIEW

  if (!hasPermission(user, requiredPermission)) {
    sendForbidden(response, corsHeaders, sendJson)
    return true
  }

  if (isCollection) {
    if (request.method !== 'GET') {
      sendJson(
        response,
        405,
        { ok: false, message: 'Method Not Allowed' },
        corsHeaders,
      )
      return true
    }

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

  const rawId = mutationMatch?.[1] ?? detailMatch?.[1] ?? ''
  const id = decodeUserId(rawId)

  if (!isUuid(id)) {
    sendJson(
      response,
      400,
      { ok: false, message: 'Invalid user id' },
      corsHeaders,
    )
    return true
  }

  let foundUser
  try {
    foundUser = await getAdminUserById(id)
  } catch (error) {
    console.error('[Prompt Draft API] admin user lookup failed', error)
    sendJson(
      response,
      500,
      { ok: false, message: 'Failed to load user' },
      corsHeaders,
    )
    return true
  }

  if (!foundUser) {
    sendJson(
      response,
      404,
      { ok: false, message: 'User not found' },
      corsHeaders,
    )
    return true
  }

  if (mutationMatch) {
    try {
      await handleMutation({
        request,
        response,
        action: mutationMatch[2],
        target: foundUser,
        user,
        corsHeaders,
        sendJson,
      })
    } catch (error) {
      console.error('[Prompt Draft API] admin user mutation failed', error)
      sendJson(
        response,
        500,
        { ok: false, message: 'Failed to update user' },
        corsHeaders,
      )
    }
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

  sendJson(
    response,
    200,
    { ok: true, user: foundUser },
    corsHeaders,
  )

  return true
}
