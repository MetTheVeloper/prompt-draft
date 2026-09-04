import { randomUUID } from 'node:crypto'
import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase } from './database.mjs'
import {
  getArchiveStorageConfig,
  getArchiveStoragePublicUrl,
  readStorageError,
  requestArchiveStorage,
} from './archiveStorage.mjs'

const AVATAR_PATH = '/api/profile/avatar'
const AVATAR_SIZE = 400
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

function avatarResponse(row) {
  const url = row?.avatar_url ?? null
  return {
    ok: true,
    avatar: url ? { url } : null,
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
    console.error('[Prompt Draft API] avatar auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return null
  }
}

async function readAvatarBody(request) {
  const declaredLength = Number(request.headers['content-length'] ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AVATAR_BYTES) {
    const error = new Error('Avatar image is too large')
    error.code = 'AVATAR_TOO_LARGE'
    throw error
  }

  const chunks = []
  let totalBytes = 0
  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > MAX_AVATAR_BYTES) {
      const error = new Error('Avatar image is too large')
      error.code = 'AVATAR_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }

  const body = Buffer.concat(chunks)
  if (!body.length) {
    const error = new Error('Avatar image is required')
    error.code = 'AVATAR_INVALID'
    throw error
  }
  return body
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

function validateAvatarBuffer(buffer) {
  const dimensions = readWebpDimensions(buffer)
  if (!dimensions) {
    const error = new Error('Avatar must be a valid WebP image')
    error.code = 'AVATAR_INVALID'
    throw error
  }

  if (dimensions.width !== AVATAR_SIZE || dimensions.height !== AVATAR_SIZE) {
    const error = new Error(`Avatar must be exactly ${AVATAR_SIZE}x${AVATAR_SIZE}`)
    error.code = 'AVATAR_INVALID'
    throw error
  }
}

async function putAvatar(key, body, config) {
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

async function deleteAvatarObject(key, config) {
  if (!key) return
  const response = await requestArchiveStorage({ method: 'DELETE', key, config })
  if (!response.ok && response.status !== 404) throw await readStorageError(response)
}

async function cleanupAvatarObject(key, config) {
  if (!key) return
  try {
    await deleteAvatarObject(key, config)
  } catch (error) {
    console.error('[Prompt Draft API] avatar storage cleanup failed', { key, error })
  }
}

async function readAvatar(userId) {
  const result = await queryDatabase(
    `SELECT avatar_url, avatar_storage_key FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  )
  return result.rows[0] ?? null
}

async function uploadAvatar(user, buffer) {
  validateAvatarBuffer(buffer)

  const config = getArchiveStorageConfig()
  const avatarId = randomUUID()
  const key = `avatars/${user.id}/${avatarId}.webp`
  const url = getArchiveStoragePublicUrl(key, config)
  const previous = await readAvatar(user.id)

  await putAvatar(key, buffer, config)

  try {
    const result = await queryDatabase(
      `
        UPDATE users
        SET avatar_url = $2,
            avatar_storage_key = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING avatar_url, avatar_storage_key
      `,
      [user.id, url, key],
    )

    if (!result.rows[0]) {
      throw new Error('User not found while saving avatar')
    }
  } catch (error) {
    await cleanupAvatarObject(key, config)
    throw error
  }

  if (previous?.avatar_storage_key && previous.avatar_storage_key !== key) {
    await cleanupAvatarObject(previous.avatar_storage_key, config)
  }

  return { url }
}

async function removeAvatar(user) {
  const result = await queryDatabase(
    `
      UPDATE users
      SET avatar_url = NULL,
          avatar_storage_key = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING avatar_storage_key
    `,
    [user.id],
  )

  // RETURNING observes the new value, so read the previous key before the clear.
  // The explicit pre-read keeps deletion cleanup best-effort and user-visible state authoritative.
  return result.rows[0] ?? null
}

async function clearAvatar(user) {
  const previous = await readAvatar(user.id)
  await queryDatabase(
    `
      UPDATE users
      SET avatar_url = NULL,
          avatar_storage_key = NULL,
          updated_at = NOW()
      WHERE id = $1
    `,
    [user.id],
  )

  if (previous?.avatar_storage_key) {
    try {
      const config = getArchiveStorageConfig()
      await cleanupAvatarObject(previous.avatar_storage_key, config)
    } catch (error) {
      console.error('[Prompt Draft API] avatar removal cleanup setup failed', error)
    }
  }
}

export async function handleUserAvatarRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (url.pathname !== AVATAR_PATH) return false

  const user = await authenticate(request, response, corsHeaders, sendJson)
  if (!user) return true

  if (request.method === 'GET') {
    try {
      const row = await readAvatar(user.id)
      if (!row) {
        sendJson(response, 404, { ok: false, message: 'User not found' }, corsHeaders)
        return true
      }
      sendJson(response, 200, avatarResponse(row), corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] avatar read failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read avatar' }, corsHeaders)
    }
    return true
  }

  if (request.method === 'POST') {
    const contentType = String(request.headers['content-type'] ?? '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase()

    if (contentType !== 'image/webp') {
      sendJson(response, 415, { ok: false, message: 'Avatar Content-Type must be image/webp' }, corsHeaders)
      return true
    }

    try {
      const body = await readAvatarBody(request)
      const avatar = await uploadAvatar(user, body)
      sendJson(response, 200, { ok: true, avatar }, corsHeaders)
    } catch (error) {
      if (error?.code === 'AVATAR_TOO_LARGE') {
        sendJson(response, 413, { ok: false, message: error.message }, corsHeaders)
      } else if (error?.code === 'AVATAR_INVALID') {
        sendJson(response, 400, { ok: false, message: error.message }, corsHeaders)
      } else {
        console.error('[Prompt Draft API] avatar upload failed', error)
        sendJson(response, 500, { ok: false, message: 'Failed to save avatar' }, corsHeaders)
      }
    }
    return true
  }

  if (request.method === 'DELETE') {
    try {
      await clearAvatar(user)
      sendJson(response, 200, { ok: true, avatar: null }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] avatar remove failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to remove avatar' }, corsHeaders)
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
