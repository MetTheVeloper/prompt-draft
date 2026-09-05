import { randomUUID } from 'node:crypto'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import {
  getArchiveStorageConfig,
  getArchiveStoragePublicUrl,
  readStorageError,
  requestArchiveStorage,
} from './archiveStorage.mjs'

const MAX_DRAFT_IMAGES = 8
const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const MAX_IMAGE_EDGE = 8192
const MAX_IMAGE_PIXELS = 40_000_000
const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

function draftMediaError(message, code, statusCode = 400) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  return error
}

function parseDraftId(value) {
  try {
    const decoded = decodeURIComponent(value).trim()
    if (
      !decoded ||
      decoded.length > 200 ||
      /[\u0000-\u001f\u007f]/.test(decoded)
    ) {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

function getObjectAcl() {
  const value = (process.env.ARCHIVE_S3_OBJECT_ACL || 'public-read').trim()
  if (!value) return null
  if (!['public-read', 'private'].includes(value)) {
    throw new Error('ARCHIVE_S3_OBJECT_ACL must be public-read, private, or empty')
  }
  return value
}

async function putObject(key, body, config) {
  const acl = getObjectAcl()
  const response = await requestArchiveStorage({
    method: 'PUT',
    key,
    body,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': STORAGE_CACHE_CONTROL,
      ...(acl ? { 'x-amz-acl': acl } : {}),
    },
    config,
  })

  if (!response.ok) throw await readStorageError(response)
}

async function deleteObject(key, config) {
  if (!key) return
  const response = await requestArchiveStorage({ method: 'DELETE', key, config })
  if (!response.ok && response.status !== 404) throw await readStorageError(response)
}

async function cleanupObject(key, config) {
  if (!key) return
  try {
    await deleteObject(key, config)
  } catch (error) {
    console.error('[Prompt Draft API] draft media storage cleanup failed', { key, error })
  }
}

async function readImageBody(request) {
  const declaredLength = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
    throw draftMediaError(
      'Draft preview image exceeds the allowed byte size',
      'DRAFT_MEDIA_TOO_LARGE',
      413,
    )
  }

  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_IMAGE_BYTES) {
      throw draftMediaError(
        'Draft preview image exceeds the allowed byte size',
        'DRAFT_MEDIA_TOO_LARGE',
        413,
      )
    }
    chunks.push(chunk)
  }

  const buffer = Buffer.concat(chunks)
  if (!buffer.length) {
    throw draftMediaError(
      'Draft preview image body is empty',
      'DRAFT_MEDIA_INVALID',
    )
  }
  return buffer
}

function readUint24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
}

function readWebpDimensions(buffer) {
  if (
    buffer.length < 30 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null
  }

  const chunkType = buffer.toString('ascii', 12, 16)

  if (chunkType === 'VP8X' && buffer.length >= 30) {
    return {
      width: readUint24LE(buffer, 24) + 1,
      height: readUint24LE(buffer, 27) + 1,
    }
  }

  if (chunkType === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
    const b0 = buffer[21]
    const b1 = buffer[22]
    const b2 = buffer[23]
    const b3 = buffer[24]
    return {
      width: 1 + (b0 | ((b1 & 0x3f) << 8)),
      height: 1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)),
    }
  }

  if (
    chunkType === 'VP8 ' &&
    buffer.length >= 30 &&
    buffer[23] === 0x9d &&
    buffer[24] === 0x01 &&
    buffer[25] === 0x2a
  ) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    }
  }

  return null
}

function validateWebp(buffer) {
  const dimensions = readWebpDimensions(buffer)
  if (!dimensions) {
    throw draftMediaError(
      'Draft preview image must be a valid WebP image',
      'DRAFT_MEDIA_INVALID',
    )
  }

  const { width, height } = dimensions
  if (
    width < 1 ||
    height < 1 ||
    Math.max(width, height) > MAX_IMAGE_EDGE ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw draftMediaError(
      `Draft preview image must be at most ${MAX_IMAGE_EDGE}px on either edge and ${MAX_IMAGE_PIXELS} pixels total`,
      'DRAFT_MEDIA_DIMENSIONS',
    )
  }

  return dimensions
}

function mapImageRow(row) {
  return {
    id: row.id,
    url: row.url,
    width: Number(row.width),
    height: Number(row.height),
    sizeBytes: Number(row.sizeBytes),
    position: Number(row.position),
    createdAt: row.createdAt.toISOString(),
  }
}

async function listDraftImages(userId, draftId, query = queryDatabase) {
  const result = await query(
    `
      SELECT
        id,
        url,
        width,
        height,
        size_bytes AS "sizeBytes",
        position,
        created_at AS "createdAt"
      FROM prompt_draft_images
      WHERE user_id = $1
        AND draft_id = $2
      ORDER BY position ASC, created_at ASC, id ASC
    `,
    [userId, draftId],
  )

  return result.rows.map(mapImageRow)
}

async function requireDraft(query, userId, draftId, lock = false) {
  const result = await query(
    `
      SELECT draft_id
      FROM prompt_drafts
      WHERE user_id = $1
        AND draft_id = $2
        AND deleted_at IS NULL
      LIMIT 1
      ${lock ? 'FOR UPDATE' : ''}
    `,
    [userId, draftId],
  )

  if (!result.rows[0]) {
    throw draftMediaError('Draft not found', 'DRAFT_NOT_FOUND', 404)
  }
}

async function uploadDraftImage(user, draftId, buffer, dimensions) {
  await requireDraft(queryDatabase, user.id, draftId)

  const config = getArchiveStorageConfig()
  const imageId = randomUUID()
  const storageKey = `draft-media/${user.id}/${imageId}/image.webp`
  const url = getArchiveStoragePublicUrl(storageKey, config)
  let uploaded = false

  try {
    await putObject(storageKey, buffer, config)
    uploaded = true

    await withDatabaseTransaction(async (client) => {
      await requireDraft(client.query.bind(client), user.id, draftId, true)

      const countResult = await client.query(
        `
          SELECT COUNT(*)::int AS count,
                 COALESCE(MAX(position), -1)::int AS "maxPosition"
          FROM prompt_draft_images
          WHERE user_id = $1
            AND draft_id = $2
        `,
        [user.id, draftId],
      )

      const count = Number(countResult.rows[0]?.count ?? 0)
      if (count >= MAX_DRAFT_IMAGES) {
        throw draftMediaError(
          `A Cloud Draft can store up to ${MAX_DRAFT_IMAGES} preview images`,
          'DRAFT_MEDIA_LIMIT',
          409,
        )
      }

      const position = Number(countResult.rows[0]?.maxPosition ?? -1) + 1
      await client.query(
        `
          INSERT INTO prompt_draft_images (
            id,
            user_id,
            draft_id,
            position,
            url,
            storage_key,
            width,
            height,
            size_bytes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          imageId,
          user.id,
          draftId,
          position,
          url,
          storageKey,
          dimensions.width,
          dimensions.height,
          buffer.length,
        ],
      )
    })

    return await listDraftImages(user.id, draftId)
  } catch (error) {
    if (uploaded) await cleanupObject(storageKey, config)
    throw error
  }
}

async function removeDraftImage(user, draftId, imageId) {
  let storageKey = null

  await withDatabaseTransaction(async (client) => {
    await requireDraft(client.query.bind(client), user.id, draftId, true)

    const imageResult = await client.query(
      `
        SELECT storage_key, position
        FROM prompt_draft_images
        WHERE id = $1
          AND user_id = $2
          AND draft_id = $3
        LIMIT 1
      `,
      [imageId, user.id, draftId],
    )

    const image = imageResult.rows[0]
    if (!image) {
      throw draftMediaError('Draft preview image not found', 'DRAFT_MEDIA_NOT_FOUND', 404)
    }

    storageKey = image.storage_key
    await client.query('SET CONSTRAINTS prompt_draft_images_position_unique DEFERRED')
    await client.query(
      `
        DELETE FROM prompt_draft_images
        WHERE id = $1
          AND user_id = $2
          AND draft_id = $3
      `,
      [imageId, user.id, draftId],
    )
    await client.query(
      `
        UPDATE prompt_draft_images
        SET position = position - 1
        WHERE user_id = $1
          AND draft_id = $2
          AND position > $3
      `,
      [user.id, draftId, Number(image.position)],
    )
  })

  try {
    const config = getArchiveStorageConfig()
    await cleanupObject(storageKey, config)
  } catch (error) {
    console.error('[Prompt Draft API] draft media removal cleanup setup failed', error)
  }

  return await listDraftImages(user.id, draftId)
}

async function makeDraftImagePrimary(user, draftId, imageId) {
  await withDatabaseTransaction(async (client) => {
    await requireDraft(client.query.bind(client), user.id, draftId, true)

    const imageResult = await client.query(
      `
        SELECT position
        FROM prompt_draft_images
        WHERE id = $1
          AND user_id = $2
          AND draft_id = $3
        LIMIT 1
      `,
      [imageId, user.id, draftId],
    )

    const image = imageResult.rows[0]
    if (!image) {
      throw draftMediaError('Draft preview image not found', 'DRAFT_MEDIA_NOT_FOUND', 404)
    }

    const currentPosition = Number(image.position)
    if (currentPosition === 0) return

    await client.query('SET CONSTRAINTS prompt_draft_images_position_unique DEFERRED')
    await client.query(
      `
        UPDATE prompt_draft_images
        SET position = CASE
          WHEN id = $3 THEN 0
          ELSE position + 1
        END
        WHERE user_id = $1
          AND draft_id = $2
          AND position <= $4
      `,
      [user.id, draftId, imageId, currentPosition],
    )
  })

  return await listDraftImages(user.id, draftId)
}

function sendDraftMediaError(error, response, corsHeaders, sendJson) {
  if (error?.code && Number.isInteger(error.statusCode)) {
    sendJson(
      response,
      error.statusCode,
      { ok: false, code: error.code, message: error.message },
      corsHeaders,
    )
    return
  }

  console.error('[Prompt Draft API] draft preview media request failed', error)
  sendJson(
    response,
    500,
    { ok: false, message: 'Failed to manage draft preview media' },
    corsHeaders,
  )
}

export async function handleDraftMediaRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  user,
}) {
  const collectionMatch = url.pathname.match(/^\/api\/drafts\/([^/]+)\/images$/)
  const primaryMatch = url.pathname.match(
    /^\/api\/drafts\/([^/]+)\/images\/([^/]+)\/primary$/,
  )
  const imageMatch = url.pathname.match(/^\/api\/drafts\/([^/]+)\/images\/([^/]+)$/)

  if (!collectionMatch && !primaryMatch && !imageMatch) return false

  const rawDraftId = (collectionMatch || primaryMatch || imageMatch)[1]
  const draftId = parseDraftId(rawDraftId)
  if (!draftId) {
    sendJson(response, 400, { ok: false, message: 'Invalid draft id' }, corsHeaders)
    return true
  }

  try {
    if (collectionMatch && request.method === 'GET') {
      await requireDraft(queryDatabase, user.id, draftId)
      const images = await listDraftImages(user.id, draftId)
      sendJson(response, 200, { ok: true, images }, corsHeaders)
      return true
    }

    if (collectionMatch && request.method === 'POST') {
      const contentType = String(request.headers['content-type'] ?? '')
        .split(';', 1)[0]
        .trim()
        .toLowerCase()

      if (contentType !== 'image/webp') {
        sendJson(
          response,
          415,
          { ok: false, message: 'Draft preview Content-Type must be image/webp' },
          corsHeaders,
        )
        return true
      }

      const buffer = await readImageBody(request)
      const dimensions = validateWebp(buffer)
      const images = await uploadDraftImage(user, draftId, buffer, dimensions)
      sendJson(response, 201, { ok: true, images }, corsHeaders)
      return true
    }

    if (primaryMatch && request.method === 'POST') {
      const imageId = decodeURIComponent(primaryMatch[2])
      if (!isUuid(imageId)) {
        sendJson(response, 400, { ok: false, message: 'Invalid draft image id' }, corsHeaders)
        return true
      }

      const images = await makeDraftImagePrimary(user, draftId, imageId)
      sendJson(response, 200, { ok: true, images }, corsHeaders)
      return true
    }

    if (imageMatch && request.method === 'DELETE') {
      const imageId = decodeURIComponent(imageMatch[2])
      if (!isUuid(imageId)) {
        sendJson(response, 400, { ok: false, message: 'Invalid draft image id' }, corsHeaders)
        return true
      }

      const images = await removeDraftImage(user, draftId, imageId)
      sendJson(response, 200, { ok: true, images }, corsHeaders)
      return true
    }
  } catch (error) {
    sendDraftMediaError(error, response, corsHeaders, sendJson)
    return true
  }

  response.writeHead(405, {
    ...corsHeaders,
    Allow: collectionMatch ? 'GET, POST' : primaryMatch ? 'POST' : 'DELETE',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify({ ok: false, message: 'Method Not Allowed' }))
  return true
}
