import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'
import { handleAdminDashboardRequest } from './adminDashboard.mjs'
import { handleAdminUsersRequest } from './adminUsers.mjs'
import { handleCloudDraftRequest } from './cloudDrafts.mjs'
import { queryDatabase } from './database.mjs'
import {
  PERMISSIONS,
  getAuthorizationPayload,
  hasPermission,
  normalizeUserRole,
  resolvePermissionsForRole,
} from './authorization.mjs'
import { createProfileState } from './profileRequirements.mjs'
import { createUserScoreState } from './userScore.mjs'

const scryptAsync = promisify(scrypt)
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const MAX_PASSWORD_LENGTH = 200
const PROFILE_FIELDS = new Set(['username', 'email'])

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

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()

  if (
    !normalized ||
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    return null
  }

  return normalized
}

function normalizeUsername(value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()

  if (!/^[a-z0-9._-]{3,64}$/.test(normalized)) {
    return null
  }

  return normalized
}

function parseIdentifier(value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (!normalized) return null

  if (normalized.includes('@')) {
    const email = normalizeEmail(normalized)
    return email ? { type: 'email', value: email } : null
  }

  const username = normalizeUsername(normalized)
  return username ? { type: 'username', value: username } : null
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
    role: normalizeUserRole(row.role),
    status: row.status ?? 'active',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function createAuthorizationResponse(user) {
  return {
    user,
    profile: createProfileState(user),
    score: await createUserScoreState(user),
    permissions: resolvePermissionsForRole(user.role),
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
        role,
        status,
        password_hash AS "passwordHash",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
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
        users.role,
        users.status,
        users.created_at AS "createdAt",
        users.updated_at AS "updatedAt"
      FROM auth_sessions
      INNER JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.token_hash = $1
        AND auth_sessions.expires_at > NOW()
        AND users.status = 'active'
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

function validateProfileCompletionBody(body) {
  if (!isPlainObject(body)) {
    return {
      errors: [{ field: 'body', message: 'JSON body must be an object' }],
      values: null,
    }
  }

  const errors = []
  const unknownFields = Object.keys(body).filter((field) => !PROFILE_FIELDS.has(field))

  if (unknownFields.length) {
    errors.push({
      field: 'body',
      message: `Unsupported profile field: ${unknownFields[0]}`,
    })
  }

  const includesUsername = hasOwn(body, 'username')
  const includesEmail = hasOwn(body, 'email')

  if (!includesUsername && !includesEmail) {
    errors.push({
      field: 'body',
      message: 'At least one profile field is required',
    })
  }

  const username = includesUsername ? normalizeUsername(body.username) : null
  const email = includesEmail ? normalizeEmail(body.email) : null

  if (includesUsername && !username) {
    errors.push({
      field: 'username',
      message: 'Username must be 3-64 characters using English letters, numbers, dot, underscore, or hyphen',
    })
  }

  if (includesEmail && !email) {
    errors.push({
      field: 'email',
      message: 'Email must be a valid email address',
    })
  }

  return {
    errors,
    values: errors.length ? null : { username, email, includesUsername, includesEmail },
  }
}

async function handleProfileCompletion({ request, response, corsHeaders, sendJson }) {
  let user

  try {
    user = await getUserForToken(getBearerToken(request))
  } catch (error) {
    console.error('[Prompt Draft API] profile auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return
  }

  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return
  }

  const body = await readAuthBody(request, response, corsHeaders, sendJson)
  if (!body) return

  const validation = validateProfileCompletionBody(body)
  if (validation.errors.length || !validation.values) {
    sendJson(
      response,
      400,
      { ok: false, code: 'PROFILE_VALIDATION', message: 'Invalid profile information', errors: validation.errors },
      corsHeaders,
    )
    return
  }

  const { username, email, includesUsername, includesEmail } = validation.values
  const lockedErrors = []

  if (includesUsername && user.username && user.username !== username) {
    lockedErrors.push({ field: 'username', message: 'Username is already set for this account' })
  }

  if (includesEmail && user.email && user.email !== email) {
    lockedErrors.push({ field: 'email', message: 'Email is already set for this account' })
  }

  if (lockedErrors.length) {
    sendJson(
      response,
      409,
      { ok: false, code: 'PROFILE_FIELD_LOCKED', message: 'Existing identity fields cannot be changed here', errors: lockedErrors },
      corsHeaders,
    )
    return
  }

  const additions = []

  if (includesUsername && !user.username) {
    additions.push({ type: 'username', value: username })
  }

  if (includesEmail && !user.email) {
    additions.push({ type: 'email', value: email })
  }

  try {
    for (const identifier of additions) {
      const existing = await findUserByIdentifier(identifier)

      if (existing && existing.id !== user.id) {
        sendJson(
          response,
          409,
          {
            ok: false,
            code: 'PROFILE_FIELD_TAKEN',
            message: 'Profile value is already in use',
            errors: [{ field: identifier.type, message: `${identifier.type} is already in use` }],
          },
          corsHeaders,
        )
        return
      }
    }

    if (!additions.length) {
      sendJson(response, 200, { ok: true, ...(await createAuthorizationResponse(user)) }, corsHeaders)
      return
    }

    const nextUsername = user.username ?? username
    const nextEmail = user.email ?? email

    const result = await queryDatabase(
      `
        UPDATE users
        SET username = $2,
            email = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, username, email, role, status,
                  created_at AS "createdAt",
                  updated_at AS "updatedAt"
      `,
      [user.id, nextUsername, nextEmail],
    )

    const updatedUser = mapUserRow(result.rows[0])
    sendJson(response, 200, { ok: true, ...(await createAuthorizationResponse(updatedUser)) }, corsHeaders)
  } catch (error) {
    if (error?.code === '23505') {
      sendJson(
        response,
        409,
        { ok: false, code: 'PROFILE_FIELD_TAKEN', message: 'Profile value is already in use' },
        corsHeaders,
      )
    } else {
      console.error('[Prompt Draft API] profile completion failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to update profile' }, corsHeaders)
    }
  }
}

async function handleAdminAccessCheck({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (!url.pathname.startsWith('/api/admin/')) return false

  let user

  try {
    user = await getAuthenticatedUser(request)
  } catch (error) {
    console.error('[Prompt Draft API] admin auth lookup failed', error)
    sendJson(
      response,
      500,
      { ok: false, message: 'Failed to authenticate request' },
      corsHeaders,
    )
    return true
  }

  if (!user) {
    sendJson(
      response,
      401,
      { ok: false, message: 'Authentication required' },
      corsHeaders,
    )
    return true
  }

  if (
    await handleAdminDashboardRequest({
      request,
      response,
      url,
      corsHeaders,
      sendJson,
      user,
    })
  ) {
    return true
  }

  if (
    await handleAdminUsersRequest({
      request,
      response,
      url,
      corsHeaders,
      sendJson,
      user,
    })
  ) {
    return true
  }

  if (request.method === 'GET' && url.pathname === '/api/admin/access-check') {
    const requiredPermission = PERMISSIONS.DASHBOARD_VIEW

    if (!hasPermission(user, requiredPermission)) {
      sendJson(
        response,
        403,
        { ok: false, message: 'Forbidden' },
        corsHeaders,
      )
      return true
    }

    const authorization = getAuthorizationPayload(user)
    sendJson(
      response,
      200,
      {
        ok: true,
        user,
        permissions: authorization.permissions,
        requiredPermission,
      },
      corsHeaders,
    )
    return true
  }

  sendJson(response, 404, { ok: false, message: 'Not Found' }, corsHeaders)
  return true
}

export async function handleAuthRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  const isCloudDraftPath =
    url.pathname === '/api/drafts' || url.pathname.startsWith('/api/drafts/')

  if (isCloudDraftPath) {
    let user

    try {
      user = await getAuthenticatedUser(request)
    } catch (error) {
      console.error('[Prompt Draft API] cloud draft auth lookup failed', error)
      sendJson(
        response,
        500,
        { ok: false, message: 'Failed to authenticate request' },
        corsHeaders,
      )
      return true
    }

    if (!user) {
      sendJson(
        response,
        401,
        { ok: false, message: 'Authentication required' },
        corsHeaders,
      )
      return true
    }

    await handleCloudDraftRequest({
      request,
      response,
      url,
      corsHeaders,
      sendJson,
      user,
    })
    return true
  }

  if (await handleAdminAccessCheck({ request, response, url, corsHeaders, sendJson })) {
    return true
  }

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
          RETURNING id, username, email, role, status,
                    created_at AS "createdAt",
                    updated_at AS "updatedAt"
        `,
        [userId, username, email, passwordHash],
      )

      const user = mapUserRow(result.rows[0])
      const token = await createSession(user.id)
      const authorization = await createAuthorizationResponse(user)

      sendJson(
        response,
        201,
        { ok: true, token, ...authorization },
        corsHeaders,
      )
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

      if (userRow.status === 'suspended') {
        sendJson(response, 403, { ok: false, message: 'Account suspended' }, corsHeaders)
        return true
      }

      const user = mapUserRow(userRow)
      const token = await createSession(user.id)
      const authorization = await createAuthorizationResponse(user)

      sendJson(
        response,
        200,
        { ok: true, token, ...authorization },
        corsHeaders,
      )
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

      sendJson(
        response,
        200,
        { ok: true, ...(await createAuthorizationResponse(user)) },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] auth me failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read account' }, corsHeaders)
    }

    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/profile/complete') {
    await handleProfileCompletion({ request, response, corsHeaders, sendJson })
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