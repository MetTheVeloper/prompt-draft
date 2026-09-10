import { randomUUID } from 'node:crypto'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import {
  getArchiveStorageConfig,
  getArchiveStoragePublicUrl,
  readStorageError,
  requestArchiveStorage,
} from './archiveStorage.mjs'

const BLOG_MEDIA_ROOT = 'blog/'
const MAX_BODY_BYTES = 24 * 1024 * 1024
const MAX_FULL_BYTES = 12 * 1024 * 1024
const MAX_THUMBNAIL_BYTES = 4 * 1024 * 1024
const MAX_ALT_LENGTH = 500
const FULL_MAX_EDGE = 2048
const THUMBNAIL_MAX_EDGE = 640
const LIST_MAX_KEYS = 240
const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const BLOG_MEDIA_PREFIX_SEGMENT = /^[A-Za-z0-9_-]{1,80}$/

function validationError(message) {
  const error = new Error(message)
  error.code = 'BLOG_MEDIA_VALIDATION'
  return error
}

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

async function readJsonBody(request) {
  if (!isJsonRequest(request)) throw validationError('Content-Type must be application/json')
  const chunks = []
  let totalBytes = 0
  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_BODY_BYTES) throw validationError('Blog media request body is too large')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw validationError('Request body must contain valid JSON')
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
  if (buffer.length > maxBytes) throw validationError(`${label} exceeds the allowed byte size`)
  return buffer
}

function requireDimension(value, label, maxEdge) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > maxEdge) {
    throw validationError(`${label} must be an integer between 1 and ${maxEdge}`)
  }
  return value
}

function requireAlt(value) {
  if (typeof value !== 'string') throw validationError('alt text is required')
  const normalized = value.trim()
  if (!normalized) throw validationError('alt text is required')
  if (normalized.length > MAX_ALT_LENGTH) {
    throw validationError(`alt text must be ${MAX_ALT_LENGTH} characters or fewer`)
  }
  return normalized
}

function validateUploadBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Blog media body must be an object')
  }
  const full = body.full
  const thumbnail = body.thumbnail
  if (!full || typeof full !== 'object' || Array.isArray(full)) {
    throw validationError('full image payload is required')
  }
  if (!thumbnail || typeof thumbnail !== 'object' || Array.isArray(thumbnail)) {
    throw validationError('thumbnail image payload is required')
  }

  const fullBuffer = decodeStrictBase64(full.base64, 'full.base64', MAX_FULL_BYTES)
  const thumbnailBuffer = decodeStrictBase64(thumbnail.base64, 'thumbnail.base64', MAX_THUMBNAIL_BYTES)
  const width = requireDimension(full.width, 'full.width', FULL_MAX_EDGE)
  const height = requireDimension(full.height, 'full.height', FULL_MAX_EDGE)
  const thumbnailWidth = requireDimension(thumbnail.width, 'thumbnail.width', THUMBNAIL_MAX_EDGE)
  const thumbnailHeight = requireDimension(thumbnail.height, 'thumbnail.height', THUMBNAIL_MAX_EDGE)
  if (Number(full.sizeBytes) !== fullBuffer.length) {
    throw validationError('full.sizeBytes does not match decoded image bytes')
  }
  if (Number(thumbnail.sizeBytes) !== thumbnailBuffer.length) {
    throw validationError('thumbnail.sizeBytes does not match decoded image bytes')
  }

  return {
    sourceName: typeof body.sourceName === 'string'
      ? body.sourceName.trim().slice(0, 500)
      : '',
    alt: requireAlt(body.alt),
    fullBuffer,
    thumbnailBuffer,
    width,
    height,
    thumbnailWidth,
    thumbnailHeight,
  }
}

export function normalizeBlogMediaPrefix(value) {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string' || value.length > 500 || value.includes('\\')) {
    throw validationError('Invalid Blog media prefix')
  }
  const normalized = value.trim().replace(/^\/+|\/+$/g, '')
  if (!normalized) return ''
  const segments = normalized.split('/')
  if (
    segments.length > 8 ||
    segments.some(segment => !BLOG_MEDIA_PREFIX_SEGMENT.test(segment) || segment === '.' || segment === '..')
  ) {
    throw validationError('Invalid Blog media prefix')
  }
  return `${segments.join('/')}/`
}

function parentBlogMediaPrefix(prefix) {
  const segments = prefix.split('/').filter(Boolean)
  if (!segments.length) return null
  segments.pop()
  return segments.length ? `${segments.join('/')}/` : ''
}

function xmlDecode(value) {
  return String(value)
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
}

function firstXmlValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? xmlDecode(match[1]) : null
}

export function parseBlogMediaListObjectsXml(xml) {
  const prefixes = [...String(xml).matchAll(/<CommonPrefixes>[\s\S]*?<Prefix>([\s\S]*?)<\/Prefix>[\s\S]*?<\/CommonPrefixes>/gi)]
    .map(match => xmlDecode(match[1]))
  const keys = [...String(xml).matchAll(/<Contents>[\s\S]*?<Key>([\s\S]*?)<\/Key>[\s\S]*?<\/Contents>/gi)]
    .map(match => xmlDecode(match[1]))
  return {
    prefixes,
    keys,
    isTruncated: firstXmlValue(xml, 'IsTruncated') === 'true',
    nextContinuationToken: firstXmlValue(xml, 'NextContinuationToken'),
  }
}

function encodeCursor(token) {
  if (!token) return null
  return Buffer.from(token, 'utf8').toString('base64url')
}

function decodeCursor(value) {
  if (!value) return null
  if (typeof value !== 'string' || value.length > 4000 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw validationError('Invalid Blog media cursor')
  }
  try {
    const token = Buffer.from(value, 'base64url').toString('utf8')
    if (!token) throw new Error('empty cursor')
    return token
  } catch {
    throw validationError('Invalid Blog media cursor')
  }
}

function safePositiveInteger(value, max) {
  return Number.isSafeInteger(value) && value > 0 && value <= max ? value : null
}

function safePublicUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export function normalizeBlogMediaManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return null
  const id = typeof value.id === 'string' ? value.id : ''
  const folder = (() => {
    try { return normalizeBlogMediaPrefix(value.folder) } catch { return null }
  })()
  const sourceName = typeof value.sourceName === 'string' ? value.sourceName.trim().slice(0, 500) : ''
  const alt = typeof value.alt === 'string' ? value.alt.trim().slice(0, MAX_ALT_LENGTH) : ''
  const createdAt = typeof value.createdAt === 'string' && !Number.isNaN(Date.parse(value.createdAt))
    ? new Date(value.createdAt).toISOString()
    : null
  const full = value.full
  const thumbnail = value.thumbnail
  if (!/^[0-9a-f-]{36}$/i.test(id) || folder === null || !createdAt) return null
  if (!full || typeof full !== 'object' || !thumbnail || typeof thumbnail !== 'object') return null

  const storageKey = typeof full.key === 'string' && full.key.startsWith(BLOG_MEDIA_ROOT) ? full.key : null
  const thumbnailStorageKey = typeof thumbnail.key === 'string' && thumbnail.key.startsWith(BLOG_MEDIA_ROOT)
    ? thumbnail.key
    : null
  const fullUrl = safePublicUrl(full.url)
  const thumbnailUrl = safePublicUrl(thumbnail.url)
  const width = safePositiveInteger(full.width, FULL_MAX_EDGE)
  const height = safePositiveInteger(full.height, FULL_MAX_EDGE)
  const thumbnailWidth = safePositiveInteger(thumbnail.width, THUMBNAIL_MAX_EDGE)
  const thumbnailHeight = safePositiveInteger(thumbnail.height, THUMBNAIL_MAX_EDGE)

  if (
    !storageKey ||
    !thumbnailStorageKey ||
    !fullUrl ||
    !thumbnailUrl ||
    !width ||
    !height ||
    !thumbnailWidth ||
    !thumbnailHeight
  ) return null

  return {
    id,
    folder,
    sourceName: sourceName || id,
    alt,
    createdAt,
    storageKey,
    thumbnailStorageKey,
    fullUrl,
    thumbnailUrl,
    width,
    height,
    thumbnailWidth,
    thumbnailHeight,
  }
}

export function buildBlogMediaStorageKeys(date, id) {
  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const folder = `${year}/${month}/`
  const prefix = `${BLOG_MEDIA_ROOT}${folder}${id}`
  return {
    folder,
    fullKey: `${prefix}.full.webp`,
    thumbnailKey: `${prefix}.thumb.webp`,
    manifestKey: `${prefix}.json`,
  }
}

function objectAcl() {
  const value = (process.env.ARCHIVE_S3_OBJECT_ACL || '').trim()
  if (!value) return null
  if (!['public-read', 'private'].includes(value)) {
    throw new Error('ARCHIVE_S3_OBJECT_ACL must be public-read, private, or empty')
  }
  return value
}

async function putObject(key, body, contentType, config) {
  const acl = objectAcl()
  const response = await requestArchiveStorage({
    method: 'PUT',
    key,
    body,
    headers: {
      'Content-Type': contentType,
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
      console.error('[Prompt Draft API] Blog media cleanup failed', { key, error })
    }
  }
}

async function auditBlogMediaUpload(actor, asset) {
  const { queryDatabase } = await import('./database.mjs')
  await queryDatabase(`
    INSERT INTO admin_audit_log (id, actor_user_id, target_user_id, action, metadata)
    VALUES ($1, $2, NULL, 'blog.media.upload', $3::jsonb)
  `, [
    randomUUID(),
    actor.id,
    JSON.stringify({
      assetId: asset.id,
      folder: asset.folder,
      storageKey: asset.storageKey,
      thumbnailStorageKey: asset.thumbnailStorageKey,
      sourceName: asset.sourceName,
      alt: asset.alt,
    }),
  ])
}

async function uploadBlogMedia(actor, payload) {
  const config = getArchiveStorageConfig()
  const id = randomUUID()
  const createdAt = new Date()
  const keys = buildBlogMediaStorageKeys(createdAt, id)
  const fullUrl = getArchiveStoragePublicUrl(keys.fullKey, config)
  const thumbnailUrl = getArchiveStoragePublicUrl(keys.thumbnailKey, config)
  const asset = {
    id,
    folder: keys.folder,
    sourceName: payload.sourceName || id,
    alt: payload.alt,
    createdAt: createdAt.toISOString(),
    storageKey: keys.fullKey,
    thumbnailStorageKey: keys.thumbnailKey,
    fullUrl,
    thumbnailUrl,
    width: payload.width,
    height: payload.height,
    thumbnailWidth: payload.thumbnailWidth,
    thumbnailHeight: payload.thumbnailHeight,
  }
  const manifest = {
    version: 1,
    id: asset.id,
    folder: asset.folder,
    sourceName: asset.sourceName,
    alt: asset.alt,
    createdAt: asset.createdAt,
    full: {
      key: asset.storageKey,
      url: asset.fullUrl,
      width: asset.width,
      height: asset.height,
      sizeBytes: payload.fullBuffer.length,
    },
    thumbnail: {
      key: asset.thumbnailStorageKey,
      url: asset.thumbnailUrl,
      width: asset.thumbnailWidth,
      height: asset.thumbnailHeight,
      sizeBytes: payload.thumbnailBuffer.length,
    },
  }
  const uploaded = []

  try {
    await putObject(keys.fullKey, payload.fullBuffer, 'image/webp', config)
    uploaded.push(keys.fullKey)
    await putObject(keys.thumbnailKey, payload.thumbnailBuffer, 'image/webp', config)
    uploaded.push(keys.thumbnailKey)
    await putObject(
      keys.manifestKey,
      Buffer.from(JSON.stringify(manifest), 'utf8'),
      'application/json; charset=utf-8',
      config,
    )
    uploaded.push(keys.manifestKey)
    await auditBlogMediaUpload(actor, asset)
  } catch (error) {
    await cleanupObjects(uploaded, config)
    throw error
  }

  return asset
}

async function readManifest(key, config) {
  const response = await requestArchiveStorage({ method: 'GET', key, config })
  if (!response.ok) {
    if (response.status === 404) return null
    throw await readStorageError(response)
  }
  try {
    return normalizeBlogMediaManifest(JSON.parse(await response.text()))
  } catch {
    return null
  }
}

async function browseBlogMedia(prefix, cursor) {
  const config = getArchiveStorageConfig()
  const storagePrefix = `${BLOG_MEDIA_ROOT}${prefix}`
  const continuationToken = decodeCursor(cursor)
  const response = await requestArchiveStorage({
    method: 'GET',
    query: {
      'list-type': 2,
      prefix: storagePrefix,
      delimiter: '/',
      'max-keys': LIST_MAX_KEYS,
      ...(continuationToken ? { 'continuation-token': continuationToken } : {}),
    },
    config,
  })
  if (!response.ok) throw await readStorageError(response)

  const list = parseBlogMediaListObjectsXml(await response.text())
  const folders = list.prefixes
    .filter(value => value.startsWith(storagePrefix) && value !== storagePrefix)
    .map((value) => {
      const relative = normalizeBlogMediaPrefix(value.slice(BLOG_MEDIA_ROOT.length))
      const segments = relative.split('/').filter(Boolean)
      return { name: segments.at(-1) || relative, prefix: relative }
    })
    .sort((left, right) => left.name.localeCompare(right.name))

  const manifestKeys = list.keys.filter(key => (
    key.startsWith(storagePrefix) &&
    key.endsWith('.json') &&
    !key.slice(storagePrefix.length).includes('/')
  ))
  const assets = (await Promise.all(manifestKeys.map(key => readManifest(key, config))))
    .filter(Boolean)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  return {
    prefix,
    parentPrefix: parentBlogMediaPrefix(prefix),
    folders,
    assets,
    pageInfo: {
      hasMore: list.isTruncated,
      nextCursor: list.isTruncated ? encodeCursor(list.nextContinuationToken) : null,
    },
  }
}

async function authenticateBlogManager(request, response, corsHeaders, sendJson) {
  let user
  try {
    const { getAuthenticatedUser } = await import('./auth.mjs')
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] Blog media auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return null
  }
  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return null
  }
  if (!hasPermission(user, PERMISSIONS.BLOG_MANAGE)) {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return null
  }
  return user
}

export async function handleAdminBlogMediaRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== '/api/admin/blog/media') return false

  const user = await authenticateBlogManager(request, response, corsHeaders, sendJson)
  if (!user) return true

  if (request.method === 'GET') {
    try {
      const prefix = normalizeBlogMediaPrefix(url.searchParams.get('prefix') || '')
      const result = await browseBlogMedia(prefix, url.searchParams.get('cursor'))
      sendJson(response, 200, { ok: true, ...result }, corsHeaders)
    } catch (error) {
      if (error?.code === 'BLOG_MEDIA_VALIDATION') {
        sendJson(response, 400, { ok: false, message: error.message }, corsHeaders)
      } else {
        console.error('[Prompt Draft API] Blog media browse failed', error)
        sendJson(response, 502, { ok: false, message: 'Failed to browse Blog media' }, corsHeaders)
      }
    }
    return true
  }

  if (request.method === 'POST') {
    try {
      const payload = validateUploadBody(await readJsonBody(request))
      const asset = await uploadBlogMedia(user, payload)
      sendJson(response, 201, { ok: true, asset }, corsHeaders)
    } catch (error) {
      if (error?.code === 'BLOG_MEDIA_VALIDATION') {
        sendJson(response, 400, { ok: false, message: error.message }, corsHeaders)
      } else {
        console.error('[Prompt Draft API] Blog media upload failed', error)
        sendJson(response, 502, { ok: false, message: 'Failed to upload Blog media' }, corsHeaders)
      }
    }
    return true
  }

  sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
  return true
}
