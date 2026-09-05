import { randomUUID } from 'node:crypto'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import {
  getArchiveStorageConfig,
  getArchiveStoragePublicUrl,
  readStorageError,
  requestArchiveStorage,
} from './archiveStorage.mjs'

const MAX_BODY_BYTES = 24 * 1024 * 1024
const MAX_FULL_BYTES = 12 * 1024 * 1024
const MAX_THUMBNAIL_BYTES = 4 * 1024 * 1024
const MAX_ARCHIVE_IMAGES = 100
const FULL_MAX_EDGE = 2048
const THUMBNAIL_MAX_EDGE = 640
const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

function isUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function nullableNumber(value) {
  return value === null || value === undefined ? null : Number(value)
}

function nextSourceKind(value) {
  return value === 'user_draft' ? 'user_draft' : 'managed'
}

function sendForbidden(response, corsHeaders, sendJson) {
  sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
}

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

async function readJsonBody(request, response, corsHeaders, sendJson) {
  if (!isJsonRequest(request)) {
    sendJson(response, 415, { ok: false, message: 'Content-Type must be application/json' }, corsHeaders)
    return null
  }
  try {
    const chunks = []
    let totalBytes = 0
    for await (const chunk of request) {
      totalBytes += chunk.length
      if (totalBytes > MAX_BODY_BYTES) {
        sendJson(response, 413, { ok: false, message: 'Archive image request body is too large' }, corsHeaders)
        return null
      }
      chunks.push(chunk)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    sendJson(response, 400, { ok: false, message: 'Request body must contain valid JSON' }, corsHeaders)
    return null
  }
}

function validationError(message) {
  const error = new Error(message)
  error.code = 'ARCHIVE_MEDIA_VALIDATION'
  return error
}

function decodeStrictBase64(value, label, maxBytes) {
  if (typeof value !== 'string' || !value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw validationError(`${label} must be standard base64 data`)
  }
  const buffer = Buffer.from(value, 'base64')
  if (!buffer.length || buffer.toString('base64') !== value) throw validationError(`${label} is not valid base64 data`)
  if (buffer.length > maxBytes) throw validationError(`${label} exceeds the allowed byte size`)
  return buffer
}

function requireDimension(value, label, maxEdge) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > maxEdge) {
    throw validationError(`${label} must be an integer between 1 and ${maxEdge}`)
  }
  return value
}

function validateUploadBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw validationError('Archive image body must be an object')
  const full = body.full
  const thumbnail = body.thumbnail
  if (!full || typeof full !== 'object' || Array.isArray(full)) throw validationError('full image payload is required')
  if (!thumbnail || typeof thumbnail !== 'object' || Array.isArray(thumbnail)) throw validationError('thumbnail image payload is required')

  const fullBuffer = decodeStrictBase64(full.base64, 'full.base64', MAX_FULL_BYTES)
  const thumbnailBuffer = decodeStrictBase64(thumbnail.base64, 'thumbnail.base64', MAX_THUMBNAIL_BYTES)
  const width = requireDimension(full.width, 'full.width', FULL_MAX_EDGE)
  const height = requireDimension(full.height, 'full.height', FULL_MAX_EDGE)
  const thumbnailWidth = requireDimension(thumbnail.width, 'thumbnail.width', THUMBNAIL_MAX_EDGE)
  const thumbnailHeight = requireDimension(thumbnail.height, 'thumbnail.height', THUMBNAIL_MAX_EDGE)
  if (Number(full.sizeBytes) !== fullBuffer.length) throw validationError('full.sizeBytes does not match decoded image bytes')
  if (Number(thumbnail.sizeBytes) !== thumbnailBuffer.length) throw validationError('thumbnail.sizeBytes does not match decoded image bytes')

  return {
    sourceName: typeof body.sourceName === 'string' ? body.sourceName.trim().slice(0, 500) : '',
    fullBuffer,
    thumbnailBuffer,
    width,
    height,
    thumbnailWidth,
    thumbnailHeight,
  }
}

async function auditArchiveMutation(client, actor, action, metadata) {
  await client.query(`
    INSERT INTO admin_audit_log (id, actor_user_id, target_user_id, action, metadata)
    VALUES ($1, $2, NULL, $3, $4::jsonb)
  `, [randomUUID(), actor.id, action, JSON.stringify(metadata)])
}

async function requireArchiveItem(id) {
  const result = await queryDatabase(`
    SELECT id, public_id AS "publicId", telegram_message_id AS "telegramMessageId", source_kind AS "sourceKind"
    FROM prompt_archive_items WHERE id = $1 LIMIT 1
  `, [id])
  if (!result.rows[0]) {
    const error = new Error('Archive item not found')
    error.code = 'ARCHIVE_NOT_FOUND'
    throw error
  }
  return result.rows[0]
}

function getObjectAcl() {
  const value = (process.env.ARCHIVE_S3_OBJECT_ACL || '').trim()
  if (!value) return null
  if (!['public-read', 'private'].includes(value)) throw new Error('ARCHIVE_S3_OBJECT_ACL must be public-read, private, or empty')
  return value
}

async function putObject(key, body, config) {
  const acl = getObjectAcl()
  const response = await requestArchiveStorage({
    method: 'PUT', key, body,
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

async function cleanupObjects(keys, config) {
  const failures = []
  for (const key of keys.filter(Boolean)) {
    try { await deleteObject(key, config) }
    catch (error) {
      console.error('[Prompt Draft API] archive media cleanup failed', { key, error })
      failures.push(key)
    }
  }
  return failures
}

async function uploadArchiveImage(actor, archiveItemId, payload) {
  const item = await requireArchiveItem(archiveItemId)
  const config = getArchiveStorageConfig()
  const imageId = randomUUID()
  const prefix = `archive/${archiveItemId}/${imageId}`
  const fullKey = `${prefix}/full.webp`
  const thumbnailKey = `${prefix}/thumb.webp`
  const fullUrl = getArchiveStoragePublicUrl(fullKey, config)
  const thumbnailUrl = getArchiveStoragePublicUrl(thumbnailKey, config)
  const uploadedKeys = []

  try {
    await putObject(fullKey, payload.fullBuffer, config); uploadedKeys.push(fullKey)
    await putObject(thumbnailKey, payload.thumbnailBuffer, config); uploadedKeys.push(thumbnailKey)

    await withDatabaseTransaction(async client => {
      const lockedResult = await client.query(`
        SELECT public_id AS "publicId", telegram_message_id AS "telegramMessageId", source_kind AS "sourceKind"
        FROM prompt_archive_items WHERE id = $1 FOR UPDATE
      `, [archiveItemId])
      const locked = lockedResult.rows[0]
      if (!locked) {
        const error = new Error('Archive item not found'); error.code = 'ARCHIVE_NOT_FOUND'; throw error
      }

      const countResult = await client.query(`
        SELECT COUNT(*)::integer AS count, COALESCE(MAX(position) + 1, 0)::integer AS "nextPosition"
        FROM prompt_archive_images WHERE archive_item_id = $1
      `, [archiveItemId])
      const count = Number(countResult.rows[0]?.count) || 0
      if (count >= MAX_ARCHIVE_IMAGES) throw validationError(`Archive items support up to ${MAX_ARCHIVE_IMAGES} images`)
      const position = Number(countResult.rows[0]?.nextPosition)

      await client.query(`
        INSERT INTO prompt_archive_images (
          id, archive_item_id, position, source_path, storage_key, thumbnail_storage_key,
          full_url, thumbnail_url, width, height, thumbnail_width, thumbnail_height,
          mime_type, size_bytes, thumbnail_size_bytes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, NULL, $4, $5, $6, $7, $8, $9, $10, $11,
          'image/webp', $12, $13, NOW(), NOW()
        )
      `, [
        imageId, archiveItemId, position, fullKey, thumbnailKey, fullUrl, thumbnailUrl,
        payload.width, payload.height, payload.thumbnailWidth, payload.thumbnailHeight,
        payload.fullBuffer.length, payload.thumbnailBuffer.length,
      ])

      const sourceKind = nextSourceKind(locked.sourceKind)
      await client.query(`
        UPDATE prompt_archive_items
        SET status = 'draft', source_kind = $2, updated_by = $3, updated_at = NOW()
        WHERE id = $1
      `, [archiveItemId, sourceKind, actor.id])

      await auditArchiveMutation(client, actor, 'archive.image.upload', {
        archiveItemId,
        publicId: Number(locked.publicId),
        telegramMessageId: nullableNumber(locked.telegramMessageId),
        imageId,
        position,
        sourceName: payload.sourceName || null,
        storageKey: fullKey,
        thumbnailStorageKey: thumbnailKey,
        fullBytes: payload.fullBuffer.length,
        thumbnailBytes: payload.thumbnailBuffer.length,
      })
    })
  } catch (error) {
    await cleanupObjects(uploadedKeys, config)
    throw error
  }

  return {
    id: imageId,
    fullUrl,
    thumbnailUrl,
    publicId: Number(item.publicId),
    telegramMessageId: nullableNumber(item.telegramMessageId),
  }
}

async function normalizePositionsAfterDelete(client, archiveItemId) {
  await client.query(`UPDATE prompt_archive_images SET position = position + 10000, updated_at = NOW() WHERE archive_item_id = $1`, [archiveItemId])
  await client.query(`
    WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC, id ASC) - 1 AS next_position
      FROM prompt_archive_images WHERE archive_item_id = $1
    )
    UPDATE prompt_archive_images images
    SET position = ordered.next_position, updated_at = NOW()
    FROM ordered WHERE images.id = ordered.id
  `, [archiveItemId])
}

async function deleteArchiveImage(actor, archiveItemId, imageId) {
  let deleted
  await withDatabaseTransaction(async client => {
    const itemResult = await client.query(`
      SELECT public_id AS "publicId", telegram_message_id AS "telegramMessageId", source_kind AS "sourceKind"
      FROM prompt_archive_items WHERE id = $1 FOR UPDATE
    `, [archiveItemId])
    const item = itemResult.rows[0]
    if (!item) { const error = new Error('Archive item not found'); error.code = 'ARCHIVE_NOT_FOUND'; throw error }

    const imageResult = await client.query(`
      SELECT id, storage_key, thumbnail_storage_key, position
      FROM prompt_archive_images WHERE id = $1 AND archive_item_id = $2 FOR UPDATE
    `, [imageId, archiveItemId])
    deleted = imageResult.rows[0]
    if (!deleted) { const error = new Error('Archive image not found'); error.code = 'ARCHIVE_IMAGE_NOT_FOUND'; throw error }

    await client.query(`DELETE FROM prompt_archive_images WHERE id = $1 AND archive_item_id = $2`, [imageId, archiveItemId])
    await normalizePositionsAfterDelete(client, archiveItemId)
    const sourceKind = nextSourceKind(item.sourceKind)
    await client.query(`
      UPDATE prompt_archive_items SET status = 'draft', source_kind = $2, updated_by = $3, updated_at = NOW()
      WHERE id = $1
    `, [archiveItemId, sourceKind, actor.id])

    await auditArchiveMutation(client, actor, 'archive.image.delete', {
      archiveItemId,
      publicId: Number(item.publicId),
      telegramMessageId: nullableNumber(item.telegramMessageId),
      imageId,
      previousPosition: Number(deleted.position),
      storageKey: deleted.storage_key,
      thumbnailStorageKey: deleted.thumbnail_storage_key,
    })
  })

  const keys = [deleted?.storage_key, deleted?.thumbnail_storage_key].filter(Boolean)
  if (!keys.length) return { cleanupFailures: [] }
  return { cleanupFailures: await cleanupObjects(keys, getArchiveStorageConfig()) }
}

async function reorderArchiveImages(actor, archiveItemId, imageIds) {
  if (!Array.isArray(imageIds) || imageIds.some(id => !isUuid(id)) || new Set(imageIds).size !== imageIds.length) {
    throw validationError('imageIds must contain unique Archive image UUIDs')
  }

  await withDatabaseTransaction(async client => {
    const itemResult = await client.query(`
      SELECT public_id AS "publicId", telegram_message_id AS "telegramMessageId", source_kind AS "sourceKind"
      FROM prompt_archive_items WHERE id = $1 FOR UPDATE
    `, [archiveItemId])
    const item = itemResult.rows[0]
    if (!item) { const error = new Error('Archive item not found'); error.code = 'ARCHIVE_NOT_FOUND'; throw error }

    const currentResult = await client.query(`
      SELECT id FROM prompt_archive_images WHERE archive_item_id = $1 ORDER BY position ASC, id ASC FOR UPDATE
    `, [archiveItemId])
    const currentIds = currentResult.rows.map(row => row.id)
    if (currentIds.length !== imageIds.length || currentIds.some(id => !imageIds.includes(id))) {
      throw validationError('imageIds must contain every current Archive image exactly once')
    }

    await client.query(`UPDATE prompt_archive_images SET position = position + 10000, updated_at = NOW() WHERE archive_item_id = $1`, [archiveItemId])
    for (const [position, currentImageId] of imageIds.entries()) {
      await client.query(`UPDATE prompt_archive_images SET position = $3, updated_at = NOW() WHERE archive_item_id = $1 AND id = $2`, [archiveItemId, currentImageId, position])
    }

    const sourceKind = nextSourceKind(item.sourceKind)
    await client.query(`
      UPDATE prompt_archive_items SET status = 'draft', source_kind = $2, updated_by = $3, updated_at = NOW()
      WHERE id = $1
    `, [archiveItemId, sourceKind, actor.id])

    await auditArchiveMutation(client, actor, 'archive.image.reorder', {
      archiveItemId,
      publicId: Number(item.publicId),
      telegramMessageId: nullableNumber(item.telegramMessageId),
      imageIds,
    })
  })
}

function handleKnownError(error, response, corsHeaders, sendJson) {
  if (error?.code === 'ARCHIVE_NOT_FOUND') {
    sendJson(response, 404, { ok: false, message: 'Archive item not found' }, corsHeaders); return true
  }
  if (error?.code === 'ARCHIVE_IMAGE_NOT_FOUND') {
    sendJson(response, 404, { ok: false, message: 'Archive image not found' }, corsHeaders); return true
  }
  if (error?.code === 'ARCHIVE_MEDIA_VALIDATION') {
    sendJson(response, 400, { ok: false, message: error.message }, corsHeaders); return true
  }
  return false
}

export async function handleAdminArchiveMediaRequest({ request, response, url, corsHeaders, sendJson, user }) {
  const collectionMatch = url.pathname.match(/^\/api\/admin\/archive\/([0-9a-f-]{36})\/images$/i)
  const orderMatch = url.pathname.match(/^\/api\/admin\/archive\/([0-9a-f-]{36})\/images\/order$/i)
  const imageMatch = url.pathname.match(/^\/api\/admin\/archive\/([0-9a-f-]{36})\/images\/([0-9a-f-]{36})$/i)
  if (!collectionMatch && !orderMatch && !imageMatch) return false

  if (!hasPermission(user, PERMISSIONS.ARCHIVE_MANAGE)) {
    sendForbidden(response, corsHeaders, sendJson); return true
  }

  const archiveItemId = collectionMatch?.[1] || orderMatch?.[1] || imageMatch?.[1]
  if (!isUuid(archiveItemId)) {
    sendJson(response, 400, { ok: false, message: 'Invalid Archive item id' }, corsHeaders); return true
  }

  try {
    if (collectionMatch) {
      if (request.method !== 'POST') {
        sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders); return true
      }
      const body = await readJsonBody(request, response, corsHeaders, sendJson)
      if (!body) return true
      const image = await uploadArchiveImage(user, archiveItemId, validateUploadBody(body))
      sendJson(response, 201, { ok: true, image }, corsHeaders); return true
    }

    if (orderMatch) {
      if (request.method !== 'PUT') {
        sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders); return true
      }
      const body = await readJsonBody(request, response, corsHeaders, sendJson)
      if (!body) return true
      await reorderArchiveImages(user, archiveItemId, body.imageIds)
      sendJson(response, 200, { ok: true }, corsHeaders); return true
    }

    if (imageMatch) {
      if (request.method !== 'DELETE') {
        sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders); return true
      }
      const imageId = imageMatch[2]
      if (!isUuid(imageId)) {
        sendJson(response, 400, { ok: false, message: 'Invalid Archive image id' }, corsHeaders); return true
      }
      sendJson(response, 200, { ok: true, ...(await deleteArchiveImage(user, archiveItemId, imageId)) }, corsHeaders)
      return true
    }
  } catch (error) {
    if (handleKnownError(error, response, corsHeaders, sendJson)) return true
    console.error('[Prompt Draft API] admin archive media mutation failed', error)
    sendJson(response, 500, { ok: false, message: 'Archive media operation failed' }, corsHeaders)
    return true
  }

  return false
}
