import { randomUUID } from 'node:crypto'
import { getAuthenticatedUser } from './auth.mjs'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import {
  evaluateCreatorApplicationReadiness,
} from './creatorProfileRequirements.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'

const CREATOR_REQUEST_PATH = '/api/creator-account/request'
const ADMIN_CREATOR_DETAIL_PATTERN = /^\/api\/admin\/creators\/([^/]+)$/
const ADMIN_CREATOR_ACTION_PATTERN = /^\/api\/admin\/creators\/([^/]+)\/(approve|reject|suspend|unsuspend)$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_REVIEW_NOTE_LENGTH = 2000

export const CREATOR_ACCOUNT_STATUSES = Object.freeze([
  'none',
  'pending',
  'approved',
  'rejected',
  'suspended',
])

function createCreatorError(statusCode, code, message, errors = []) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.errors = errors
  return error
}

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

function normalizeOptionalString(value) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

export function normalizeCreatorReviewNote(value) {
  if (value === undefined || value === null || value === '') {
    return { value: null, error: null }
  }

  if (typeof value !== 'string') {
    return {
      value: null,
      error: 'review note must be a string or null',
    }
  }

  const normalized = value.trim() || null
  if (normalized && normalized.length > MAX_REVIEW_NOTE_LENGTH) {
    return {
      value: null,
      error: `review note must be at most ${MAX_REVIEW_NOTE_LENGTH} characters`,
    }
  }

  return { value: normalized, error: null }
}

export function resolveCreatorRequestTransition(status) {
  switch (status) {
    case 'none':
      return { nextStatus: 'pending', eventType: 'requested', idempotent: false }
    case 'rejected':
      return { nextStatus: 'pending', eventType: 'reapplied', idempotent: false }
    case 'pending':
      return { nextStatus: 'pending', eventType: null, idempotent: true }
    case 'approved':
    case 'suspended':
      throw createCreatorError(
        409,
        'CREATOR_REQUEST_UNAVAILABLE',
        'Creator application cannot be submitted in the current state',
      )
    default:
      throw createCreatorError(409, 'CREATOR_STATE_INVALID', 'Creator account state is invalid')
  }
}

export function resolveCreatorAdminTransition(status, action) {
  const allowed = {
    approve: { from: 'pending', to: 'approved', eventType: 'approved' },
    reject: { from: 'pending', to: 'rejected', eventType: 'rejected' },
    suspend: { from: 'approved', to: 'suspended', eventType: 'suspended' },
    unsuspend: { from: 'suspended', to: 'approved', eventType: 'unsuspended' },
  }

  const transition = allowed[action]
  if (!transition) {
    throw createCreatorError(404, 'CREATOR_ACTION_NOT_FOUND', 'Creator action not found')
  }

  if (status !== transition.from) {
    throw createCreatorError(
      409,
      'CREATOR_TRANSITION_INVALID',
      `Creator action ${action} is not available while status is ${status}`,
    )
  }

  return transition
}

function createProfileFromRow(row) {
  return {
    screenName: {
      en: row?.screenNameEn ?? null,
      fa: row?.screenNameFa ?? null,
    },
    bio: {
      en: row?.bioEn ?? null,
      fa: row?.bioFa ?? null,
    },
    article: {
      en: row?.articleEn ?? null,
      fa: row?.articleFa ?? null,
    },
  }
}

function mapCreatorState(row) {
  return {
    status: row?.status ?? 'none',
    requestedAt: asIso(row?.requestedAt),
    reviewedAt: asIso(row?.reviewedAt),
    reviewedByUserId: row?.reviewedByUserId ?? null,
    reviewNote: row?.reviewNote ?? null,
    approvedAt: asIso(row?.approvedAt),
    suspendedAt: asIso(row?.suspendedAt),
  }
}

async function readCreatorSnapshot(query, userId, { lockAccount = false, lockCreator = false } = {}) {
  const accountResult = await query(
    `
      SELECT
        id,
        username,
        email,
        role,
        status,
        created_at AS "createdAt"
      FROM users
      WHERE id = $1
      ${lockAccount ? 'FOR UPDATE' : ''}
    `,
    [userId],
  )

  const account = accountResult.rows[0]
  if (!account) return null

  const [profileResult, creatorResult, skillsResult, linksResult] = await Promise.all([
    query(
      `
        SELECT
          screen_name_en AS "screenNameEn",
          screen_name_fa AS "screenNameFa",
          bio_en AS "bioEn",
          bio_fa AS "bioFa",
          article_en AS "articleEn",
          article_fa AS "articleFa",
          birthday::text AS birthday,
          location_text AS "locationText"
        FROM user_profiles
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    ),
    query(
      `
        SELECT
          status,
          requested_at AS "requestedAt",
          reviewed_at AS "reviewedAt",
          reviewed_by_user_id AS "reviewedByUserId",
          review_note AS "reviewNote",
          approved_at AS "approvedAt",
          suspended_at AS "suspendedAt"
        FROM creator_accounts
        WHERE user_id = $1
        ${lockCreator ? 'FOR UPDATE' : ''}
      `,
      [userId],
    ),
    query(
      `
        SELECT
          skills.slug,
          skills.category_slug AS "categorySlug",
          skills.title_en AS "titleEn",
          skills.title_fa AS "titleFa",
          skills.active,
          skills.sort_order AS "sortOrder",
          categories.title_en AS "categoryTitleEn",
          categories.title_fa AS "categoryTitleFa",
          categories.sort_order AS "categorySortOrder"
        FROM user_profile_skills selected
        INNER JOIN profile_skills skills ON skills.slug = selected.skill_slug
        INNER JOIN profile_skill_categories categories ON categories.slug = skills.category_slug
        WHERE selected.user_id = $1
        ORDER BY categories.sort_order ASC, skills.sort_order ASC, skills.slug ASC
      `,
      [userId],
    ),
    query(
      `
        SELECT type, url, label, position
        FROM user_profile_links
        WHERE user_id = $1
        ORDER BY position ASC, id ASC
      `,
      [userId],
    ),
  ])

  const profileRow = profileResult.rows[0] ?? null
  const creatorRow = creatorResult.rows[0] ?? null
  const profile = createProfileFromRow(profileRow)
  const activeSkillSlugs = skillsResult.rows
    .filter(skill => skill.active)
    .map(skill => skill.slug)
  const readiness = evaluateCreatorApplicationReadiness({
    accountStatus: account.status,
    username: account.username,
    profile,
    activeSkillSlugs,
  })

  return {
    account: {
      id: account.id,
      username: account.username ?? null,
      email: account.email ?? null,
      role: account.role,
      status: account.status,
      createdAt: asIso(account.createdAt),
    },
    profile: {
      ...profile,
      birthday: profileRow?.birthday ?? null,
      location: profileRow?.locationText ? { text: profileRow.locationText } : null,
      skills: skillsResult.rows.map(skill => ({
        slug: skill.slug,
        categorySlug: skill.categorySlug,
        title: { en: skill.titleEn, fa: skill.titleFa },
        categoryTitle: {
          en: skill.categoryTitleEn,
          fa: skill.categoryTitleFa,
        },
        active: Boolean(skill.active),
      })),
      links: linksResult.rows.map(link => ({
        type: link.type,
        url: link.url,
        label: link.label ?? null,
        position: Number(link.position),
      })),
    },
    creator: mapCreatorState(creatorRow),
    readiness,
  }
}

async function insertCreatorEvent(client, { userId, actorUserId = null, eventType, metadata = {} }) {
  await client.query(
    `
      INSERT INTO creator_account_events (
        id,
        user_id,
        actor_user_id,
        event_type,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [randomUUID(), userId, actorUserId, eventType, JSON.stringify(metadata)],
  )
}

async function insertCreatorAudit(client, { actorUserId, targetUserId, action, metadata = {} }) {
  await client.query(
    `
      INSERT INTO admin_audit_log (
        id,
        actor_user_id,
        target_user_id,
        action,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [randomUUID(), actorUserId, targetUserId, action, JSON.stringify(metadata)],
  )
}

export async function requestCreatorAccount(user, transaction = withDatabaseTransaction) {
  return transaction(async (client) => {
    const query = client.query.bind(client)
    const snapshot = await readCreatorSnapshot(query, user.id, {
      lockAccount: true,
      lockCreator: true,
    })

    if (!snapshot) {
      throw createCreatorError(404, 'CREATOR_PROFILE_NOT_FOUND', 'Profile not found')
    }

    if (!snapshot.readiness.ready) {
      throw createCreatorError(
        400,
        'CREATOR_PROFILE_INCOMPLETE',
        'Creator profile requirements are not complete',
        [
          ...snapshot.readiness.missingFields.map(field => ({
            field: field === 'username' ? 'account.username' : `profile.${field}`,
            message: 'This field is required for a Creator application',
          })),
          ...snapshot.readiness.errors,
        ],
      )
    }

    const transition = resolveCreatorRequestTransition(snapshot.creator.status)
    if (transition.idempotent) {
      return {
        status: 'pending',
        readiness: snapshot.readiness,
        requestedAt: snapshot.creator.requestedAt,
        idempotent: true,
      }
    }

    if (snapshot.creator.status === 'none') {
      const result = await client.query(
        `
          INSERT INTO creator_accounts (
            user_id,
            status,
            requested_at,
            created_at,
            updated_at
          )
          VALUES ($1, 'pending', NOW(), NOW(), NOW())
          RETURNING requested_at AS "requestedAt"
        `,
        [user.id],
      )

      await insertCreatorEvent(client, {
        userId: user.id,
        eventType: transition.eventType,
      })

      return {
        status: 'pending',
        readiness: snapshot.readiness,
        requestedAt: asIso(result.rows[0]?.requestedAt),
        idempotent: false,
      }
    }

    const result = await client.query(
      `
        UPDATE creator_accounts
        SET
          status = 'pending',
          requested_at = NOW(),
          reviewed_at = NULL,
          reviewed_by_user_id = NULL,
          review_note = NULL,
          approved_at = NULL,
          suspended_at = NULL,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING requested_at AS "requestedAt"
      `,
      [user.id],
    )

    await insertCreatorEvent(client, {
      userId: user.id,
      eventType: transition.eventType,
    })

    return {
      status: 'pending',
      readiness: snapshot.readiness,
      requestedAt: asIso(result.rows[0]?.requestedAt),
      idempotent: false,
    }
  })
}

export async function readAdminCreatorReview(userId, query = queryDatabase) {
  return readCreatorSnapshot(query, userId)
}

export async function applyCreatorAdminAction({
  actor,
  targetUserId,
  action,
  note = null,
  transaction = withDatabaseTransaction,
}) {
  if (!hasPermission(actor, PERMISSIONS.CREATORS_MANAGE)) {
    throw createCreatorError(403, 'CREATOR_REVIEW_FORBIDDEN', 'Forbidden')
  }

  if (actor.id === targetUserId) {
    throw createCreatorError(
      409,
      'CREATOR_SELF_REVIEW_BLOCKED',
      'You cannot perform Creator review actions on your own account',
    )
  }

  return transaction(async (client) => {
    const query = client.query.bind(client)
    const snapshot = await readCreatorSnapshot(query, targetUserId, {
      lockAccount: true,
      lockCreator: true,
    })

    if (!snapshot || snapshot.creator.status === 'none') {
      throw createCreatorError(404, 'CREATOR_ACCOUNT_NOT_FOUND', 'Creator account not found')
    }

    const transition = resolveCreatorAdminTransition(snapshot.creator.status, action)

    if (action === 'approve' && !snapshot.readiness.ready) {
      throw createCreatorError(
        409,
        'CREATOR_PROFILE_NOT_READY',
        'Creator profile no longer satisfies the approval requirements',
        snapshot.readiness.missingFields.map(field => ({
          field: field === 'username' ? 'account.username' : `profile.${field}`,
          message: 'This field must be complete before approval',
        })),
      )
    }

    let updateSql
    if (action === 'approve') {
      updateSql = `
        UPDATE creator_accounts
        SET
          status = 'approved',
          reviewed_at = NOW(),
          reviewed_by_user_id = $2,
          review_note = $3,
          approved_at = NOW(),
          suspended_at = NULL,
          updated_at = NOW()
        WHERE user_id = $1
      `
    } else if (action === 'reject') {
      updateSql = `
        UPDATE creator_accounts
        SET
          status = 'rejected',
          reviewed_at = NOW(),
          reviewed_by_user_id = $2,
          review_note = $3,
          approved_at = NULL,
          suspended_at = NULL,
          updated_at = NOW()
        WHERE user_id = $1
      `
    } else if (action === 'suspend') {
      updateSql = `
        UPDATE creator_accounts
        SET
          status = 'suspended',
          suspended_at = NOW(),
          updated_at = NOW()
        WHERE user_id = $1
      `
    } else {
      updateSql = `
        UPDATE creator_accounts
        SET
          status = 'approved',
          suspended_at = NULL,
          updated_at = NOW()
        WHERE user_id = $1
      `
    }

    if (action === 'approve' || action === 'reject') {
      await client.query(updateSql, [targetUserId, actor.id, note])
    } else {
      await client.query(updateSql, [targetUserId])
    }

    await insertCreatorEvent(client, {
      userId: targetUserId,
      actorUserId: actor.id,
      eventType: transition.eventType,
      metadata: note ? { note } : {},
    })

    await insertCreatorAudit(client, {
      actorUserId: actor.id,
      targetUserId,
      action: `creator.${transition.eventType}`,
      metadata: {
        fromStatus: transition.from,
        toStatus: transition.to,
        ...(note ? { note } : {}),
      },
    })

    return readCreatorSnapshot(query, targetUserId)
  })
}

async function readOptionalReviewBody(request, response, corsHeaders, sendJson) {
  const rawLength = request.headers['content-length']
  const hasTransferEncoding = Boolean(request.headers['transfer-encoding'])
  const contentLength = rawLength ? Number(rawLength) : 0

  if (!hasTransferEncoding && (!Number.isFinite(contentLength) || contentLength <= 0)) {
    return { note: null }
  }

  const contentType = request.headers['content-type'] ?? ''
  if (contentType.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
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
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    const normalized = normalizeCreatorReviewNote(body?.note)
    if (normalized.error) {
      sendJson(
        response,
        400,
        {
          ok: false,
          code: 'CREATOR_REVIEW_NOTE_INVALID',
          message: 'Invalid Creator review note',
          errors: [{ field: 'note', message: normalized.error }],
        },
        corsHeaders,
      )
      return null
    }
    return { note: normalized.value }
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

function sendCreatorError(error, response, corsHeaders, sendJson) {
  if (Number.isInteger(error?.statusCode)) {
    sendJson(
      response,
      error.statusCode,
      {
        ok: false,
        code: error.code ?? 'CREATOR_ERROR',
        message: error.message,
        ...(Array.isArray(error.errors) && error.errors.length ? { errors: error.errors } : {}),
      },
      corsHeaders,
    )
    return true
  }
  return false
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
    console.error('[Prompt Draft API] Creator auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return null
  }
}

export async function handleCreatorAccountRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const adminDetailMatch = url.pathname.match(ADMIN_CREATOR_DETAIL_PATTERN)
  const adminActionMatch = url.pathname.match(ADMIN_CREATOR_ACTION_PATTERN)
  const isCreatorRequest = url.pathname === CREATOR_REQUEST_PATH

  if (!isCreatorRequest && !adminDetailMatch && !adminActionMatch) return false

  const user = await authenticate(request, response, corsHeaders, sendJson)
  if (!user) return true

  if (isCreatorRequest) {
    if (request.method !== 'POST') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, {
        ...corsHeaders,
        Allow: 'POST',
      })
      return true
    }

    try {
      const creator = await requestCreatorAccount(user)
      sendJson(response, 200, { ok: true, creator }, corsHeaders)
    } catch (error) {
      if (!sendCreatorError(error, response, corsHeaders, sendJson)) {
        console.error('[Prompt Draft API] Creator request failed', error)
        sendJson(response, 500, { ok: false, message: 'Failed to submit Creator application' }, corsHeaders)
      }
    }
    return true
  }

  if (!hasPermission(user, PERMISSIONS.CREATORS_MANAGE)) {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  const rawId = adminActionMatch?.[1] ?? adminDetailMatch?.[1] ?? ''
  const targetUserId = decodeUserId(rawId)
  if (!isUuid(targetUserId)) {
    sendJson(response, 400, { ok: false, message: 'Invalid user id' }, corsHeaders)
    return true
  }

  if (adminDetailMatch) {
    if (request.method !== 'GET') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, {
        ...corsHeaders,
        Allow: 'GET',
      })
      return true
    }

    try {
      const review = await readAdminCreatorReview(targetUserId)
      if (!review || review.creator.status === 'none') {
        sendJson(response, 404, { ok: false, message: 'Creator account not found' }, corsHeaders)
      } else {
        sendJson(response, 200, { ok: true, review }, corsHeaders)
      }
    } catch (error) {
      console.error('[Prompt Draft API] Creator review lookup failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to load Creator review' }, corsHeaders)
    }
    return true
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, {
      ...corsHeaders,
      Allow: 'POST',
    })
    return true
  }

  const body = await readOptionalReviewBody(request, response, corsHeaders, sendJson)
  if (!body) return true

  try {
    const review = await applyCreatorAdminAction({
      actor: user,
      targetUserId,
      action: adminActionMatch[2],
      note: body.note,
    })
    sendJson(response, 200, { ok: true, review }, corsHeaders)
  } catch (error) {
    if (!sendCreatorError(error, response, corsHeaders, sendJson)) {
      console.error('[Prompt Draft API] Creator admin action failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to update Creator account' }, corsHeaders)
    }
  }

  return true
}
