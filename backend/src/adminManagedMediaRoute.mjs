import { randomUUID } from 'node:crypto'
import { getAuthenticatedUser } from './auth.mjs'
import {
  getArchiveStorageConfig,
  getArchiveStoragePublicUrl,
  readStorageError,
  requestArchiveStorage,
} from './archiveStorage.mjs'

const PATH = '/api/admin/media/images'
const MAX_BODY_BYTES = 24 * 1024 * 1024
const MAX_FULL_BYTES = 12 * 1024 * 1024
const MAX_THUMBNAIL_BYTES = 4 * 1024 * 1024
const FULL_MAX_EDGE = 2048
const THUMBNAIL_MAX_EDGE = 640
const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const SCOPES = Object.freeze({
  telegram: Object.freeze({ storagePrefix: 'managed/telegram' }),
})

function validationError(message) {
  const error = new Error(message)
  error.code = 'MANAGED_MEDIA_VALIDATION'
  return error
}

function isJsonRequest(request) {
  return String(request.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase() === 'application/json'
}

async function readJsonBody(request) {
  const declared = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    const error = new Error('Managed image request body is too large')
    error.code = 'MANAGED_MEDIA_BODY_TOO_LARGE'
    throw error
  }

  const chunks = []
  let total = 0
  for await (const chunk of request) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) {
      const error = new Error('Managed image request body is too large')
      error.code = 'MANAGED_MEDIA_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('Request body must contain valid JSON')
    error.code = 'MANAGED_MEDIA_INVALID_JSON'
    throw error
  }
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

export function resolveManagedMediaScope(value) {
  return typeof value === 'string' ? SCOPES[value] ?? null : null
}

export function managedMediaStorageKeys(scope, imageId) {
  const config = resolveManagedMediaScope(scope)
  if (!config || typeof imageId !== 'string' || !imageId) return null
  const prefix = `${config.storagePrefix}/${imageId}`
  return {
    fullKey: `${prefix}/full.webp`,
    thumbnailKey: `${prefix}/thumb.webp`,
  }
}

export function validateManagedImageUploadBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Managed image body must be an object')
  }
  const scope = typeof body.scope === 'string' ? body.scope.trim() : ''
  if (!resolveManagedMediaScope(scope)) throw validationError('Unsupported managed media scope')

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
    scope,
    sourceName: typeof body.sourceName === 'string' ? body.sourceName.trim().slice(0, 500) : '',
    fullBuffer,
    thumbnailBuffer,
    width,
    height,
    thumbnailWidth,
    thumbnailHeight,
  }
}

function getObjectAcl() {
  const value = (process.env.ARCHIVE_S3_OBJECT_ACL || '').trim()
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
  const response = await requestArchiveStorage({ method: 'DELETE', key, config })
  if (!response.ok && response.status !== 404) throw await readStorageError(response)
}

async function cleanupObjects(keys, config) {
  for (const key of keys) {
    try {
      await deleteObject(key, config)
    } catch (error) {
      console.error('[Prompt Draft API] managed media cleanup failed', { key, error })
    }
  }
}

export async function handleAdminManagedMediaRoute({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== PATH) return false

  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, { ...corsHeaders, Allow: 'POST' })
    return true
  }
  if (!isJsonRequest(request)) {
    sendJson(response, 415, { ok: false, message: 'Content-Type must be application/json' }, corsHeaders)
    return true
  }

  let user
  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] managed media auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return true
  }

  // Telegram publishing is currently a super-admin backend capability. Keep
  // generic media upload at the same authority boundary until more scopes are
  // explicitly registered with their own permission contract.
  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return true
  }
  if (user.role !== 'super_admin') {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  let body
  try {
    body = await readJsonBody(request)
  } catch (error) {
    sendJson(
      response,
      error?.code === 'MANAGED_MEDIA_BODY_TOO_LARGE' ? 413 : 400,
      { ok: false, message: error.message },
      corsHeaders,
    )
    return true
  }

  let payload
  try {
    payload = validateManagedImageUploadBody(body)
  } catch (error) {
    sendJson(response, 400, { ok: false, message: error.message }, corsHeaders)
    return true
  }

  const imageId = randomUUID()
  const keys = managedMediaStorageKeys(payload.scope, imageId)
  const config = getArchiveStorageConfig()
  const uploadedKeys = []

  try {
    await putObject(keys.fullKey, payload.fullBuffer, config)
    uploadedKeys.push(keys.fullKey)
    await putObject(keys.thumbnailKey, payload.thumbnailBuffer, config)
    uploadedKeys.push(keys.thumbnailKey)

    sendJson(response, 201, {
      ok: true,
      image: {
        id: imageId,
        scope: payload.scope,
        fullUrl: getArchiveStoragePublicUrl(keys.fullKey, config),
        thumbnailUrl: getArchiveStoragePublicUrl(keys.thumbnailKey, config),
        width: payload.width,
        height: payload.height,
        thumbnailWidth: payload.thumbnailWidth,
        thumbnailHeight: payload.thumbnailHeight,
        sizeBytes: payload.fullBuffer.length,
        thumbnailSizeBytes: payload.thumbnailBuffer.length,
      },
    }, corsHeaders)
  } catch (error) {
    await cleanupObjects(uploadedKeys, config)
    console.error('[Prompt Draft API] managed media upload failed', {
      scope: payload.scope,
      sourceName: payload.sourceName || null,
      error,
    })
    sendJson(response, 502, { ok: false, message: 'Managed image upload failed' }, corsHeaders)
  }

  return true
}
