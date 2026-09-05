import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase } from './database.mjs'
import { getUserScoreState } from './userScore.mjs'

const PROFILE_MATCH = /^\/api\/users\/([^/]+)\/profile$/
const DRAFTS_MATCH = /^\/api\/users\/([^/]+)\/drafts$/
const USERNAME_RESOLVE_PATH = '/api/users/resolve'

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

function decodeUserId(value) {
  try {
    const decoded = decodeURIComponent(value).trim()
    return isUuid(decoded) ? decoded : null
  } catch {
    return null
  }
}

function normalizeUsername(value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,64}$/.test(normalized)) return null
  return normalized
}

async function resolveViewer(request) {
  try {
    return await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] public profile viewer lookup failed', error)
    throw error
  }
}

async function resolvePublicUserByUsername(username) {
  const result = await queryDatabase(
    `
      SELECT id, username
      FROM users
      WHERE LOWER(username) = $1
        AND status = 'active'
      LIMIT 1
    `,
    [username],
  )

  return result.rows[0] ?? null
}

async function readPublicProfile(userId) {
  const result = await queryDatabase(
    `
      SELECT
        users.id,
        users.username,
        users.avatar_url AS "avatarUrl",
        users.cover_url AS "coverUrl",
        users.cover_thumbnail_url AS "coverThumbnailUrl",
        users.cover_width AS "coverWidth",
        users.cover_height AS "coverHeight",
        users.cover_thumbnail_width AS "coverThumbnailWidth",
        users.cover_thumbnail_height AS "coverThumbnailHeight",
        users.created_at AS "createdAt",
        (
          SELECT COUNT(*)::int
          FROM prompt_drafts
          WHERE prompt_drafts.user_id = users.id
            AND prompt_drafts.visibility = 'public'
            AND prompt_drafts.deleted_at IS NULL
        ) AS "publicDraftCount",
        (
          SELECT COUNT(*)::int
          FROM prompt_drafts
          WHERE prompt_drafts.user_id = users.id
            AND prompt_drafts.deleted_at IS NULL
        ) AS "totalDraftCount"
      FROM users
      WHERE users.id = $1
        AND users.status = 'active'
      LIMIT 1
    `,
    [userId],
  )

  return result.rows[0] ?? null
}

function mapProfile(row, score, isOwner) {
  return {
    id: row.id,
    username: row.username ?? null,
    avatarUrl: row.avatarUrl ?? null,
    cover: row.coverUrl
      ? {
          fullUrl: row.coverUrl,
          thumbnailUrl: row.coverThumbnailUrl,
          width: Number(row.coverWidth),
          height: Number(row.coverHeight),
          thumbnailWidth: Number(row.coverThumbnailWidth),
          thumbnailHeight: Number(row.coverThumbnailHeight),
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    totalXp: score.totalXp,
    publicDraftCount: Number(row.publicDraftCount),
    ...(isOwner ? { totalDraftCount: Number(row.totalDraftCount) } : {}),
  }
}

function encodeDraftCursor(row) {
  return Buffer.from(
    JSON.stringify({
      updatedAt: row.updatedAt,
      id: row.id,
    }),
    'utf8',
  ).toString('base64url')
}

function decodeDraftCursor(value) {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8')
    const cursor = JSON.parse(decoded)

    if (
      !cursor ||
      typeof cursor !== 'object' ||
      typeof cursor.updatedAt !== 'string' ||
      Number.isNaN(Date.parse(cursor.updatedAt)) ||
      typeof cursor.id !== 'string' ||
      !cursor.id ||
      cursor.id.length > 200
    ) {
      return null
    }

    return {
      updatedAt: new Date(cursor.updatedAt).toISOString(),
      id: cursor.id,
    }
  } catch {
    return null
  }
}

function parseDraftListQuery(url) {
  const errors = []
  let limit = 24
  let cursor = null

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
    cursor = rawCursor ? decodeDraftCursor(rawCursor) : null
    if (!cursor) {
      errors.push({ field: 'cursor', message: 'cursor must be a valid profile draft cursor' })
    }
  }

  return { errors, limit, cursor }
}

function mapDraftRow(row, isOwner) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    revision: Number(row.revision),
    outputFormat: row.outputFormat,
    moduleCount: Number(row.moduleCount),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    images: Array.isArray(row.images)
      ? row.images.map(image => ({
          id: image.id,
          url: image.url,
          width: Number(image.width),
          height: Number(image.height),
          sizeBytes: Number(image.sizeBytes),
          position: Number(image.position),
          createdAt: String(image.createdAt),
        }))
      : [],
    ...(isOwner ? { visibility: row.visibility } : {}),
  }
}

async function listProfileDrafts({ userId, isOwner, limit, cursor }) {
  const values = [userId]
  const conditions = [
    'prompt_drafts.user_id = $1',
    'prompt_drafts.deleted_at IS NULL',
  ]

  if (!isOwner) {
    conditions.push(`prompt_drafts.visibility = 'public'`)
  }

  if (cursor) {
    values.push(cursor.updatedAt, cursor.id)
    const updatedAtParameter = values.length - 1
    const idParameter = values.length
    conditions.push(
      `(prompt_drafts.client_updated_at < $${updatedAtParameter}::timestamptz OR (prompt_drafts.client_updated_at = $${updatedAtParameter}::timestamptz AND prompt_drafts.draft_id < $${idParameter}))`,
    )
  }

  values.push(limit + 1)
  const limitParameter = values.length

  const result = await queryDatabase(
    `
      SELECT
        prompt_drafts.draft_id AS id,
        prompt_drafts.title,
        prompt_drafts.created_at AS "createdAt",
        prompt_drafts.client_updated_at AS "updatedAt",
        prompt_drafts.revision,
        prompt_drafts.visibility,
        prompt_drafts.published_at AS "publishedAt",
        COALESCE(prompt_drafts.snapshot->>'outputFormat', 'modular') AS "outputFormat",
        COALESCE(jsonb_array_length(prompt_drafts.snapshot->'selectedModuleKeys'), 0)::int AS "moduleCount",
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', media.id,
                'url', media.url,
                'width', media.width,
                'height', media.height,
                'sizeBytes', media.size_bytes,
                'position', media.position,
                'createdAt', media.created_at
              )
              ORDER BY media.position ASC, media.created_at ASC, media.id ASC
            )
            FROM prompt_draft_images media
            WHERE media.user_id = prompt_drafts.user_id
              AND media.draft_id = prompt_drafts.draft_id
          ),
          '[]'::jsonb
        ) AS images
      FROM prompt_drafts
      WHERE ${conditions.join('\n        AND ')}
      ORDER BY prompt_drafts.client_updated_at DESC, prompt_drafts.draft_id DESC
      LIMIT $${limitParameter}
    `,
    values,
  )

  const hasMore = result.rows.length > limit
  const rows = result.rows.slice(0, limit)
  const drafts = rows.map(row => mapDraftRow(row, isOwner))
  const last = rows.at(-1) ?? null

  return {
    drafts,
    pageInfo: {
      nextCursor: hasMore && last
        ? encodeDraftCursor({
            id: last.id,
            updatedAt: last.updatedAt.toISOString(),
          })
        : null,
      hasMore,
    },
  }
}

export async function handleUserProfileRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const profileMatch = url.pathname.match(PROFILE_MATCH)
  const draftsMatch = url.pathname.match(DRAFTS_MATCH)
  const isUsernameResolve = url.pathname === USERNAME_RESOLVE_PATH

  if (!profileMatch && !draftsMatch && !isUsernameResolve) return false

  if (request.method !== 'GET') {
    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
    return true
  }

  if (isUsernameResolve) {
    const username = normalizeUsername(url.searchParams.get('username'))
    if (!username) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Invalid username',
          errors: [
            {
              field: 'username',
              message: 'username must be 3-64 characters using English letters, numbers, dot, underscore, or hyphen',
            },
          ],
        },
        corsHeaders,
      )
      return true
    }

    try {
      const user = await resolvePublicUserByUsername(username)
      if (!user) {
        sendJson(response, 404, { ok: false, message: 'User profile not found' }, corsHeaders)
        return true
      }

      sendJson(
        response,
        200,
        {
          ok: true,
          user: {
            id: user.id,
            username: user.username,
          },
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] public username resolve failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to resolve user profile' }, corsHeaders)
    }

    return true
  }

  const userId = decodeUserId((profileMatch || draftsMatch)[1])
  if (!userId) {
    sendJson(response, 400, { ok: false, message: 'Invalid user id' }, corsHeaders)
    return true
  }

  try {
    const [profileRow, viewer] = await Promise.all([
      readPublicProfile(userId),
      resolveViewer(request),
    ])

    if (!profileRow) {
      sendJson(response, 404, { ok: false, message: 'User profile not found' }, corsHeaders)
      return true
    }

    const isOwner = viewer?.id === userId

    if (profileMatch) {
      const score = await getUserScoreState(userId)
      sendJson(
        response,
        200,
        {
          ok: true,
          profile: mapProfile(profileRow, score, isOwner),
          viewer: { isOwner },
        },
        corsHeaders,
      )
      return true
    }

    const { errors, limit, cursor } = parseDraftListQuery(url)
    if (errors.length) {
      sendJson(
        response,
        400,
        { ok: false, message: 'Invalid profile draft query', errors },
        corsHeaders,
      )
      return true
    }

    const page = await listProfileDrafts({ userId, isOwner, limit, cursor })
    sendJson(
      response,
      200,
      {
        ok: true,
        ...page,
        viewer: { isOwner },
      },
      corsHeaders,
    )
    return true
  } catch (error) {
    console.error('[Prompt Draft API] public user profile request failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to read user profile' }, corsHeaders)
    return true
  }
}
