import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'
import { queryDatabase } from './database.mjs'

const scryptAsync = promisify(scrypt)
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const MAX_PASSWORD_LENGTH = 200

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

async function readJsonBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function parseIdentifier(value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (!normalized) return null

  if (normalized.includes('@')) {
    if (
      normalized.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ) {
      return null
    }

    return {
      type: 'email',
      value: normalized,
    }
  }

  if (!/^[a-z0-9._-]{3,64}$/.test(normalized)) {
    return null
  }

  return {
    type: 'username',
    value: normalized,
  }
}

function validatePassword(password) {
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > MAX_PASSWORD_LENGTH ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return 'Password must be 8-200 characters and include an English letter and a number'
  }

  return null
}

function mapUserRow(row) {
  return {
    id: row.id,
    username: row.username ?? null,
    email: row.email ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

async function findUserByIdentifier(identifier) {
  const field = identifier.type === 'email' ? 'email' : 'username'
  const result = await queryDatabase(
    `
      SELECT
        id,
        username,
        email,
        password_hash AS "passwordHash",
        created_at AS "createdAt"
      FROM users
      WHERE LOWER(${field}) = $1
      LIMIT 1
    `,
    [identifier.value],
  )

  return result.rows[0] ?? null
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url')
  const derivedKey = await scryptAsync(password, salt, 64)
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('base64url')}`
}

async function verifyPassword(password, encodedHash) {
  if (typeof encodedHash !== 'string') return false

  const [algorithm, salt, expectedEncoded] = encodedHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !expectedEncoded) return false

  try {
    const expected = Buffer.from(expectedEncoded, 'base64url')
    const actual = Buffer.from(await scryptAsync(password, salt, expected.length))

    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

async function createSession(userId) {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashSessionToken(token)
  const sessionId = randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  await queryDatabase(
    `
      INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [sessionId, userId, tokenHash, expiresAt],
  )

  return token
}

function getBearerToken(request) {
  const authorization = request.headers.authorization
  if (typeof authorization !== 'string') return null

  const match = authorization.match(/^Bearer\s+([^\s]+)$/i)
  return match?.[1] ?? null
}

async function getUserForToken(token) {
  if (!token) return null

  const result = await queryDatabase(
    `
      SELECT
        users.id,
        users.username,
        users.email,
        users.created_at AS "createdAt"
      FROM auth_sessions
      INNER JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.token_hash = $1
        AND auth_sessions.expires_at > NOW()
      LIMIT 1
    `,
    [hashSessionToken(token)],
  )

  return result.rows[0] ? mapUserRow(result.rows[0]) : null
}

export function getAuthToken(request) {
  return getBearerToken(request)
}

export function getAuthenticatedUser(request) {
  return getUserForToken(getBearerToken(request))
}

async function deleteSession(token) {
  if (!token) return

  await queryDatabase(
    `DELETE FROM auth_sessions WHERE token_hash = $1`,
    [hashSessionToken(token)],
  )
}

async function readAuthBody(request, response, corsHeaders, sendJson) {
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
    return await readJsonBody(request)
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

function sendIdentifierError(response, corsHeaders, sendJson) {
  sendJson(
    response,
    400,
    {
      ok: false,
      message: 'Invalid username or email',
      errors: [
        {
          field: 'identifier',
          message: 'Use a valid email or a 3-64 character username using English letters, numbers, dot, underscore, or hyphen',
        },
      ],
    },
    corsHeaders,
  )
}

export async function handleAuthRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (!url.pathname.startsWith('/api/auth/')) return false

  if (request.method === 'POST' && url.pathname === '/api/auth/identify') {
    const body = await readAuthBody(request, response, corsHeaders, sendJson)
    if (!body) return true

    const identifier = parseIdentifier(body.identifier)
    if (!identifier) {
      sendIdentifierError(response, corsHeaders, sendJson)
      return true
    }

    try {
      const user = await findUserByIdentifier(identifier)
      sendJson(
        response,
        200,
        {
          ok: true,
          exists: Boolean(user),
          identifierType: identifier.type,
          identifier: identifier.value,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] auth identify failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to check account' }, corsHeaders)
    }

    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/register') {
    const body = await readAuthBody(request, response, corsHeaders, sendJson)
    if (!body) return true

    const identifier = parseIdentifier(body.identifier)
    if (!identifier) {
      sendIdentifierError(response, corsHeaders, sendJson)
      return true
    }

    const passwordError = validatePassword(body.password)
    if (passwordError) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Invalid password',
          errors: [{ field: 'password', message: passwordError }],
        },
        corsHeaders,
      )
      return true
    }

    try {
      if (await findUserByIdentifier(identifier)) {
        sendJson(response, 409, { ok: false, message: 'Account already exists' }, corsHeaders)
        return true
      }

      const userId = randomUUID()
      const passwordHash = await hashPassword(body.password)
      const username = identifier.type === 'username' ? identifier.value : null
      const email = identifier.type === 'email' ? identifier.value : null

      const result = await queryDatabase(
        `
          INSERT INTO users (id, username, email, password_hash)
          VALUES ($1, $2, $3, $4)
          RETURNING id, username, email, created_at AS "createdAt"
        `,
        [userId, username, email, passwordHash],
      )

      const user = mapUserRow(result.rows[0])
      const token = await createSession(user.id)

      sendJson(response, 201, { ok: true, token, user }, corsHeaders)
    } catch (error) {
      if (error?.code === '23505') {
        sendJson(response, 409, { ok: false, message: 'Account already exists' }, corsHeaders)
      } else {
        console.error('[Prompt Draft API] auth register failed', error)
        sendJson(response, 500, { ok: false, message: 'Failed to create account' }, corsHeaders)
      }
    }

    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readAuthBody(request, response, corsHeaders, sendJson)
    if (!body) return true

    const identifier = parseIdentifier(body.identifier)
    if (!identifier) {
      sendIdentifierError(response, corsHeaders, sendJson)
      return true
    }

    if (typeof body.password !== 'string') {
      sendJson(response, 400, { ok: false, message: 'Password is required' }, corsHeaders)
      return true
    }

    try {
      const userRow = await findUserByIdentifier(identifier)
      const validPassword = userRow
        ? await verifyPassword(body.password, userRow.passwordHash)
        : false

      if (!userRow || !validPassword) {
        sendJson(response, 401, { ok: false, message: 'Incorrect username/email or password' }, corsHeaders)
        return true
      }

      const user = mapUserRow(userRow)
      const token = await createSession(user.id)
      sendJson(response, 200, { ok: true, token, user }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] auth login failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to sign in' }, corsHeaders)
    }

    return true
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    try {
      const user = await getUserForToken(getBearerToken(request))

      if (!user) {
        sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
        return true
      }

      sendJson(response, 200, { ok: true, user }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] auth me failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read account' }, corsHeaders)
    }

    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
    try {
      await deleteSession(getBearerToken(request))
      sendJson(response, 200, { ok: true }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] auth logout failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to sign out' }, corsHeaders)
    }

    return true
  }

  sendJson(response, 404, { ok: false, message: 'Not Found' }, corsHeaders)
  return true
}
