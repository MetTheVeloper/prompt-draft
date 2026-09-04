import { randomUUID } from 'node:crypto'
import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase } from './database.mjs'
import {
  getArchiveStorageConfig,
  getArchiveStoragePublicUrl,
  readStorageError,
  requestArchiveStorage,
} from './archiveStorage.mjs'

const COVER_PATH = '/api/profile/cover'
const FULL_MAX_EDGE = 2048
const THUMBNAIL_MAX_EDGE = 640
const MAX_FULL_BYTES = 12 * 1024 * 1024
const MAX_THUMBNAIL_BYTES = 4 * 1024 * 1024
const MAX_BODY_BYTES = 24 * 1024 * 1024
const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

function coverResponse(row) {
  if (!row?.cover_url) {
    return { ok: true, cover: null }
  }

  return {
    ok: true,
    cover: {
      fullUrl: row.cover_url,
      thumbnailUrl: row.cover_thumbnail_url,
      width: Number(row.cover_width),
      height: Number(row.cover_height),
      thumbnailWidth: Number(row.cover_thumbnail_width),
      thumbnailHeight: Number(row.cover_thumbnail_height),
    },
  }
}

function getObjectAcl() {
  const value = (process.env.ARCHIVE_S3_OBJECT_ACL || 'public-read').trim()
  if (!value) return null
  if (!['public-read', 'private'].includes(value)) {
    throw new Error('ARCHIVE_S3_OBJECT_ACL must be public-read, private, or empty')
  }
  return value
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
    console.error('[Prompt Draft API] cover auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return null
  }
}

function validationError(message, code = 'COVER_INVALID') {
  const error = new Error(message)
  error.code = code
  return error
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw validationError('Cover image request is too large', 'COVER_TOO_LARGE')
  }

  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_BODY_BYTES) {
      throw validationError('Cover image request is too large', 'COVER_TOO_LARGE')
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw validationError('Cover request body must contain valid JSON')
  }
}

function decodeStrictBase64(value, label, maxBytes) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(value)
  ) {
    throw validationError(`${label} must be standard base64 data`)
  }

  const buffer = Buffer.from(value, 'base64')
  if (!buffer.length || buffer.toString('base64') !== value) {
    throw validationError(`${label} is not valid base64 data`)
  }

  if (buffer.length > maxBytes) {
    throw validationError(`${label} exceeds the allowed byte size`, 'COVER_TOO_LARGE')
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

function validateDimensions(buffer, label, maxEdge) {
  const dimensions = readWebpDimensions(buffer)
  if (!dimensions) {
    throw validationError(`${label} must be a valid WebP image`)
  }

  if (
    dimensions.width < 1 ||
    dimensions.height < 1 ||
    Math.max(dimensions.width, dimensions.height) > maxEdge
  ) {
    throw validationError(`${label} must fit inside a ${maxEdge}px maximum edge`)
  }

  return dimensions
}

function validateUploadBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Cover request body must be an object')
  }

  if (!body.full || typeof body.full !== 'object' || Array.isArray(body.full)) {
    throw validationError('full cover payload is required')
  }

  if (!body.thumbnail || typeof body.thumbnail !== 'object' || Array.isArray(body.thumbnail)) {
    throw validationError('thumbnail cover payload is required')
  }

  const fullBuffer = decodeStrictBase64(
    body.full.base64,
    'full.base64',
    MAX_FULL_BYTES,
  )
  const thumbnailBuffer = decodeStrictBase64(
    body.thumbnail.base64,
    'thumbnail.base64',
    MAX_THUMBNAIL_BYTES,
  )

  if (Number(body.full.sizeBytes) !== fullBuffer.length) {
    throw validationError('full.sizeBytes does not match decoded image bytes')
  }
  if (Number(body.thumbnail.sizeBytes) !== thumbnailBuffer.length) {
    throw validationError('thumbnail.sizeBytes does not match decoded image bytes')
  }

  const full = validateDimensions(fullBuffer, 'full cover', FULL_MAX_EDGE)
  const thumbnail = validateDimensions(
    thumbnailBuffer,
    'thumbnail cover',
    THUMBNAIL_MAX_EDGE,
  )

  const fullRatio = full.width / full.height
  const thumbnailRatio = thumbnail.width / thumbnail.height
  if (Math.abs(fullRatio - thumbnailRatio) > 0.02) {
    throw validationError('Cover full and thumbnail aspect ratios must match')
  }

  if (
    thumbnail.width > full.width ||
    thumbnail.height > full.height
  ) {
    throw validationError('Cover thumbnail cannot be larger than the full image')
  }

  return {
    fullBuffer,
    thumbnailBuffer,
    full,
    thumbnail,
  }
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

async function cleanupObjects(keys, config) {
  for (const key of keys.filter(Boolean)) {
    try {
      await deleteObject(key, config)
    } catch (error) {
      console.error('[Prompt Draft API] cover storage cleanup failed', { key, error })
    }
  }
}

async function readCover(userId) {
  const result = await queryDatabase(
    `
      SELECT
        cover_url,
        cover_storage_key,
        cover_thumbnail_url,
        cover_thumbnail_storage_key,
        cover_width,
        cover_height,
        cover_thumbnail_width,
        cover_thumbnail_height
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  )

  return result.rows[0] ?? null
}

async function uploadCover(user, payload) {
  const config = getArchiveStorageConfig()
  const coverId = randomUUID()
  const prefix = `covers/${user.id}/${coverId}`
  const fullKey = `${prefix}/full.webp`
  const thumbnailKey = `${prefix}/thumb.webp`
  const fullUrl = getArchiveStoragePublicUrl(fullKey, config)
  const thumbnailUrl = getArchiveStoragePublicUrl(thumbnailKey, config)
  const previous = await readCover(user.id)
  const uploadedKeys = []

  try {
    await putObject(fullKey, payload.fullBuffer, config)
    uploadedKeys.push(fullKey)
    await putObject(thumbnailKey, payload.thumbnailBuffer, config)
    uploadedKeys.push(thumbnailKey)

    const result = await queryDatabase(
      `
        UPDATE users
        SET cover_url = $2,
            cover_storage_key = $3,
            cover_thumbnail_url = $4,
            cover_thumbnail_storage_key = $5,
            cover_width = $6,
            cover_height = $7,
            cover_thumbnail_width = $8,
            cover_thumbnail_height = $9,
            updated_at = NOW()
        WHERE id = $1
        RETURNING
          cover_url,
          cover_storage_key,
          cover_thumbnail_url,
          cover_thumbnail_storage_key,
          cover_width,
          cover_height,
          cover_thumbnail_width,
          cover_thumbnail_height
      `,
      [
        user.id,
        fullUrl,
        fullKey,
        thumbnailUrl,
        thumbnailKey,
        payload.full.width,
        payload.full.height,
        payload.thumbnail.width,
        payload.thumbnail.height,
      ],
    )

    if (!result.rows[0]) {
      throw new Error('User not found while saving cover')
    }

    await cleanupObjects(
      [previous?.cover_storage_key, previous?.cover_thumbnail_storage_key],
      config,
    )

    return result.rows[0]
  } catch (error) {
    await cleanupObjects(uploadedKeys, config)
    throw error
  }
}

async function clearCover(user) {
  const previous = await readCover(user.id)

  await queryDatabase(
    `
      UPDATE users
      SET cover_url = NULL,
          cover_storage_key = NULL,
          cover_thumbnail_url = NULL,
          cover_thumbnail_storage_key = NULL,
          cover_width = NULL,
          cover_height = NULL,
          cover_thumbnail_width = NULL,
          cover_thumbnail_height = NULL,
          updated_at = NOW()
      WHERE id = $1
    `,
    [user.id],
  )

  if (previous?.cover_storage_key || previous?.cover_thumbnail_storage_key) {
    try {
      const config = getArchiveStorageConfig()
      await cleanupObjects(
        [previous.cover_storage_key, previous.cover_thumbnail_storage_key],
        config,
      )
    } catch (error) {
      console.error('[Prompt Draft API] cover removal cleanup setup failed', error)
    }
  }
}

export async function handleUserCoverRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== COVER_PATH) return false

  const user = await authenticate(request, response, corsHeaders, sendJson)
  if (!user) return true

  if (request.method === 'GET') {
    try {
      const row = await readCover(user.id)
      if (!row) {
        sendJson(response, 404, { ok: false, message: 'User not found' }, corsHeaders)
        return true
      }
      sendJson(response, 200, coverResponse(row), corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] cover read failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read cover' }, corsHeaders)
    }
    return true
  }

  if (request.method === 'POST') {
    const contentType = String(request.headers['content-type'] ?? '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase()

    if (contentType !== 'application/json') {
      sendJson(response, 415, { ok: false, message: 'Cover Content-Type must be application/json' }, corsHeaders)
      return true
    }

    try {
      const body = await readJsonBody(request)
      const payload = validateUploadBody(body)
      const row = await uploadCover(user, payload)
      sendJson(response, 200, coverResponse(row), corsHeaders)
    } catch (error) {
      if (error?.code === 'COVER_TOO_LARGE') {
        sendJson(response, 413, { ok: false, message: error.message }, corsHeaders)
      } else if (error?.code === 'COVER_INVALID') {
        sendJson(response, 400, { ok: false, message: error.message }, corsHeaders)
      } else {
        console.error('[Prompt Draft API] cover upload failed', error)
        sendJson(response, 500, { ok: false, message: 'Failed to save cover' }, corsHeaders)
      }
    }
    return true
  }

  if (request.method === 'DELETE') {
    try {
      await clearCover(user)
      sendJson(response, 200, { ok: true, cover: null }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] cover remove failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to remove cover' }, corsHeaders)
    }
    return true
  }

  response.writeHead(405, {
    ...corsHeaders,
    Allow: 'GET, POST, DELETE',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify({ ok: false, message: 'Method Not Allowed' }))
  return true
}
