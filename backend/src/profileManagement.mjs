import { randomUUID } from 'node:crypto'
import { getAuthenticatedUser } from './auth.mjs'
import {
  evaluateCreatorApplicationReadiness,
  normalizeCreatorProfile,
  validateCreatorProfileTechnicalLimits,
} from './creatorProfileRequirements.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'

const PROFILE_PATH = '/api/profile'
const USERNAME_PATTERN = /^[a-z0-9._-]{3,64}$/
const SKILL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const LINK_TYPES = new Set([
  'website',
  'github',
  'linkedin',
  'instagram',
  'telegram',
  'x',
  'youtube',
  'other',
])
const MAX_LINKS = 5
const MAX_SELECTED_SKILLS = 100
const MAX_LOCATION_LENGTH = 255
const MAX_LOCATION_PROVIDER_ID_LENGTH = 512
const MAX_LINK_URL_LENGTH = 2048
const MAX_LINK_LABEL_LENGTH = 160

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function createRequestError(statusCode, code, message, errors = []) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.errors = errors
  return error
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

function normalizeUsername(value) {
  const normalized = normalizeOptionalString(value)?.toLowerCase() ?? null
  return normalized && USERNAME_PATTERN.test(normalized) ? normalized : null
}

function normalizeEmail(value) {
  const normalized = normalizeOptionalString(value)?.toLowerCase() ?? null
  if (!normalized) return null
  if (
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    return null
  }
  return normalized
}

function normalizeIsoDate(value) {
  const normalized = normalizeOptionalString(value)
  if (!normalized) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null

  const [year, month, day] = normalized.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return normalized
}

function normalizeCountryCode(value) {
  const normalized = normalizeOptionalString(value)?.toUpperCase() ?? null
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : null
}

function normalizeLocation(value, errors) {
  if (value === undefined || value === null) return null
  if (!isPlainObject(value)) {
    errors.push({ field: 'profile.location', message: 'location must be an object or null' })
    return null
  }

  const text = normalizeOptionalString(value.text)
  if (!text) return null
  if (text.length > MAX_LOCATION_LENGTH) {
    errors.push({
      field: 'profile.location.text',
      message: `location text must be at most ${MAX_LOCATION_LENGTH} characters`,
    })
  }

  const source = value.source === 'suggestion' ? 'suggestion' : 'custom'
  if (value.source !== undefined && value.source !== 'custom' && value.source !== 'suggestion') {
    errors.push({
      field: 'profile.location.source',
      message: 'location source must be custom or suggestion',
    })
  }

  const providerPlaceId = source === 'suggestion'
    ? normalizeOptionalString(value.providerPlaceId)
    : null
  if (providerPlaceId && providerPlaceId.length > MAX_LOCATION_PROVIDER_ID_LENGTH) {
    errors.push({
      field: 'profile.location.providerPlaceId',
      message: `provider place id must be at most ${MAX_LOCATION_PROVIDER_ID_LENGTH} characters`,
    })
  }

  const rawCountryCode = normalizeOptionalString(value.countryCode)
  const countryCode = normalizeCountryCode(value.countryCode)
  if (rawCountryCode && !countryCode) {
    errors.push({
      field: 'profile.location.countryCode',
      message: 'country code must be a two-letter ISO-style code',
    })
  }

  return {
    text,
    source,
    providerPlaceId,
    countryCode,
  }
}

function normalizeSkillSlugs(value, errors) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    errors.push({ field: 'profile.skills', message: 'skills must be an array' })
    return []
  }
  if (value.length > MAX_SELECTED_SKILLS) {
    errors.push({
      field: 'profile.skills',
      message: `skills may contain at most ${MAX_SELECTED_SKILLS} values`,
    })
  }

  const slugs = []
  const seen = new Set()
  value.forEach((item, index) => {
    if (typeof item !== 'string') {
      errors.push({ field: `profile.skills.${index}`, message: 'skill must be a string slug' })
      return
    }

    const slug = item.trim().toLowerCase()
    if (!SKILL_SLUG_PATTERN.test(slug)) {
      errors.push({ field: `profile.skills.${index}`, message: 'skill slug is invalid' })
      return
    }

    if (!seen.has(slug)) {
      seen.add(slug)
      slugs.push(slug)
    }
  })

  return slugs
}

function normalizeProfileLinkUrl(value) {
  const raw = normalizeOptionalString(value)
  if (!raw || raw.length > MAX_LINK_URL_LENGTH) return null

  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

function normalizeLinks(value, errors) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    errors.push({ field: 'profile.links', message: 'links must be an array' })
    return []
  }
  if (value.length > MAX_LINKS) {
    errors.push({ field: 'profile.links', message: `links may contain at most ${MAX_LINKS} values` })
  }

  return value.slice(0, MAX_LINKS).map((item, index) => {
    if (!isPlainObject(item)) {
      errors.push({ field: `profile.links.${index}`, message: 'link must be an object' })
      return null
    }

    const type = typeof item.type === 'string' ? item.type.trim().toLowerCase() : ''
    if (!LINK_TYPES.has(type)) {
      errors.push({
        field: `profile.links.${index}.type`,
        message: 'link type is not supported',
      })
    }

    const url = normalizeProfileLinkUrl(item.url)
    if (!url) {
      errors.push({
        field: `profile.links.${index}.url`,
        message: 'link URL must be a valid http or https URL',
      })
    }

    const label = normalizeOptionalString(item.label)
    if (label && label.length > MAX_LINK_LABEL_LENGTH) {
      errors.push({
        field: `profile.links.${index}.label`,
        message: `link label must be at most ${MAX_LINK_LABEL_LENGTH} characters`,
      })
    }

    return {
      type,
      url,
      label,
      position: index,
    }
  }).filter(Boolean)
}

export function normalizeProfileUpdateInput(body) {
  const errors = []
  if (!isPlainObject(body)) {
    return {
      errors: [{ field: 'body', message: 'JSON body must be an object' }],
      value: null,
    }
  }

  const account = isPlainObject(body.account) ? body.account : null
  const profile = isPlainObject(body.profile) ? body.profile : null

  if (!account) errors.push({ field: 'account', message: 'account must be an object' })
  if (!profile) errors.push({ field: 'profile', message: 'profile must be an object' })
  if (!account || !profile) return { errors, value: null }

  const rawUsername = normalizeOptionalString(account.username)
  const rawEmail = normalizeOptionalString(account.email)
  const username = normalizeUsername(account.username)
  const email = normalizeEmail(account.email)

  if (rawUsername && !username) {
    errors.push({
      field: 'account.username',
      message: 'username must be 3-64 characters using English letters, numbers, dot, underscore, or hyphen',
    })
  }
  if (rawEmail && !email) {
    errors.push({ field: 'account.email', message: 'email must be a valid email address' })
  }
  if (!username && !email) {
    errors.push({
      field: 'account',
      message: 'at least one account identity field must remain present',
    })
  }

  const creatorProfile = normalizeCreatorProfile(profile)
  errors.push(...validateCreatorProfileTechnicalLimits(profile))

  const rawBirthday = normalizeOptionalString(profile.birthday)
  const birthday = normalizeIsoDate(profile.birthday)
  if (rawBirthday && !birthday) {
    errors.push({
      field: 'profile.birthday',
      message: 'birthday must be a valid YYYY-MM-DD date',
    })
  }

  const skills = normalizeSkillSlugs(profile.skills, errors)
  const links = normalizeLinks(profile.links, errors)
  const location = normalizeLocation(profile.location, errors)

  return {
    errors,
    value: errors.length
      ? null
      : {
          account: { username, email },
          profile: {
            ...creatorProfile,
            birthday,
            skills,
            links,
            location,
          },
        },
  }
}

function mapProfileRow(row, selectedSkills, links, taxonomy) {
  const profile = {
    screenName: {
      en: row.screenNameEn ?? null,
      fa: row.screenNameFa ?? null,
    },
    bio: {
      en: row.bioEn ?? null,
      fa: row.bioFa ?? null,
    },
    article: {
      en: row.articleEn ?? null,
      fa: row.articleFa ?? null,
    },
    birthday: row.birthday ?? null,
    skills: selectedSkills.filter(skill => skill.active).map(skill => skill.slug),
    links,
    location: row.locationText
      ? {
          text: row.locationText,
          source: row.locationSource ?? 'custom',
          providerPlaceId: row.locationProviderPlaceId ?? null,
          countryCode: row.locationCountryCode ?? null,
        }
      : null,
  }

  const activeSkillSlugs = selectedSkills
    .filter(skill => skill.active)
    .map(skill => skill.slug)
  const creatorStatus = row.creatorStatus ?? 'none'
  const readiness = evaluateCreatorApplicationReadiness({
    accountStatus: row.accountStatus,
    username: row.username,
    profile,
    activeSkillSlugs,
  })

  return {
    ok: true,
    account: {
      username: row.username ?? null,
      email: row.email ?? null,
    },
    profile,
    creator: {
      status: creatorStatus,
      readiness,
      usernameChangeRequiresAlias: creatorStatus === 'approved' || creatorStatus === 'suspended',
    },
    taxonomy,
  }
}

async function readTaxonomy(query) {
  const [categoriesResult, skillsResult] = await Promise.all([
    query(`
      SELECT
        slug,
        title_en AS "titleEn",
        title_fa AS "titleFa",
        sort_order AS "sortOrder"
      FROM profile_skill_categories
      WHERE active = TRUE
      ORDER BY sort_order ASC, slug ASC
    `),
    query(`
      SELECT
        slug,
        category_slug AS "categorySlug",
        title_en AS "titleEn",
        title_fa AS "titleFa",
        sort_order AS "sortOrder"
      FROM profile_skills
      WHERE active = TRUE
      ORDER BY category_slug ASC, sort_order ASC, slug ASC
    `),
  ])

  return {
    categories: categoriesResult.rows.map(row => ({
      slug: row.slug,
      title: { en: row.titleEn, fa: row.titleFa },
      sortOrder: Number(row.sortOrder),
    })),
    skills: skillsResult.rows.map(row => ({
      slug: row.slug,
      categorySlug: row.categorySlug,
      title: { en: row.titleEn, fa: row.titleFa },
      sortOrder: Number(row.sortOrder),
    })),
  }
}

export async function readOwnerProfile(userId, query = queryDatabase) {
  const [profileResult, skillResult, linkResult, taxonomy] = await Promise.all([
    query(`
      SELECT
        users.username,
        users.email,
        users.status AS "accountStatus",
        profile.screen_name_en AS "screenNameEn",
        profile.screen_name_fa AS "screenNameFa",
        profile.bio_en AS "bioEn",
        profile.bio_fa AS "bioFa",
        profile.article_en AS "articleEn",
        profile.article_fa AS "articleFa",
        profile.birthday::text AS birthday,
        profile.location_text AS "locationText",
        profile.location_source AS "locationSource",
        profile.location_provider_place_id AS "locationProviderPlaceId",
        profile.location_country_code AS "locationCountryCode",
        creator.status AS "creatorStatus"
      FROM users
      LEFT JOIN user_profiles profile ON profile.user_id = users.id
      LEFT JOIN creator_accounts creator ON creator.user_id = users.id
      WHERE users.id = $1
        AND users.status = 'active'
      LIMIT 1
    `, [userId]),
    query(`
      SELECT selected.skill_slug AS slug, skills.active
      FROM user_profile_skills selected
      INNER JOIN profile_skills skills ON skills.slug = selected.skill_slug
      WHERE selected.user_id = $1
      ORDER BY skills.category_slug ASC, skills.sort_order ASC, skills.slug ASC
    `, [userId]),
    query(`
      SELECT
        id,
        type,
        url,
        label,
        position
      FROM user_profile_links
      WHERE user_id = $1
      ORDER BY position ASC, id ASC
    `, [userId]),
    readTaxonomy(query),
  ])

  const row = profileResult.rows[0]
  if (!row) return null

  const links = linkResult.rows.map(link => ({
    id: link.id,
    type: link.type,
    url: link.url,
    label: link.label ?? null,
    position: Number(link.position),
  }))

  return mapProfileRow(row, skillResult.rows, links, taxonomy)
}

async function ensureActiveSkills(client, slugs) {
  if (!slugs.length) return []

  const result = await client.query(
    `
      SELECT slug
      FROM profile_skills
      WHERE active = TRUE
        AND slug = ANY($1::text[])
      ORDER BY slug ASC
    `,
    [slugs],
  )

  const active = result.rows.map(row => row.slug)
  const activeSet = new Set(active)
  const missing = slugs.filter(slug => !activeSet.has(slug))
  if (missing.length) {
    throw createRequestError(
      400,
      'PROFILE_SKILL_INVALID',
      'One or more selected skills are unavailable',
      missing.map(slug => ({ field: 'profile.skills', message: `Unknown or inactive skill: ${slug}` })),
    )
  }

  return slugs
}

async function ensureIdentityAvailable(client, userId, account) {
  const result = await client.query(
    `
      SELECT id, username, email
      FROM users
      WHERE id <> $1
        AND (
          ($2::text IS NOT NULL AND LOWER(username) = $2)
          OR ($3::text IS NOT NULL AND LOWER(email) = $3)
        )
      LIMIT 1
    `,
    [userId, account.username, account.email],
  )

  const conflict = result.rows[0]
  if (!conflict) return

  const errors = []
  if (account.username && conflict.username?.toLowerCase() === account.username) {
    errors.push({ field: 'account.username', message: 'username is already in use' })
  }
  if (account.email && conflict.email?.toLowerCase() === account.email) {
    errors.push({ field: 'account.email', message: 'email is already in use' })
  }

  throw createRequestError(
    409,
    'PROFILE_IDENTITY_TAKEN',
    'Profile identity is already in use',
    errors,
  )
}

async function replaceSkills(client, userId, slugs) {
  await client.query(`DELETE FROM user_profile_skills WHERE user_id = $1`, [userId])
  if (!slugs.length) return

  await client.query(
    `
      INSERT INTO user_profile_skills (user_id, skill_slug)
      SELECT $1, skill_slug
      FROM UNNEST($2::text[]) AS selected(skill_slug)
    `,
    [userId, slugs],
  )
}

async function replaceLinks(client, userId, links) {
  await client.query(`DELETE FROM user_profile_links WHERE user_id = $1`, [userId])

  for (const link of links) {
    await client.query(
      `
        INSERT INTO user_profile_links (
          id,
          user_id,
          type,
          url,
          label,
          position
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [randomUUID(), userId, link.type, link.url, link.label, link.position],
    )
  }
}

export async function updateOwnerProfile(user, input, transaction = withDatabaseTransaction) {
  await transaction(async (client) => {
    const accountResult = await client.query(
      `
        SELECT username, email, status
        FROM users
        WHERE id = $1
        FOR UPDATE
      `,
      [user.id],
    )
    const current = accountResult.rows[0]
    if (!current || current.status !== 'active') {
      throw createRequestError(404, 'PROFILE_NOT_FOUND', 'Profile not found')
    }

    const creatorResult = await client.query(
      `SELECT status FROM creator_accounts WHERE user_id = $1 FOR UPDATE`,
      [user.id],
    )
    const creatorStatus = creatorResult.rows[0]?.status ?? 'none'
    const identityProtected = creatorStatus === 'approved' || creatorStatus === 'suspended'

    if (identityProtected && current.username !== input.account.username) {
      throw createRequestError(
        409,
        'CREATOR_USERNAME_CHANGE_REQUIRES_ALIAS',
        'Approved Creator usernames cannot change until canonical alias redirects are available',
        [{ field: 'account.username', message: 'Creator username change requires alias support' }],
      )
    }

    await ensureIdentityAvailable(client, user.id, input.account)
    const activeSkills = await ensureActiveSkills(client, input.profile.skills)

    if (identityProtected) {
      const readiness = evaluateCreatorApplicationReadiness({
        accountStatus: 'active',
        username: input.account.username,
        profile: input.profile,
        activeSkillSlugs: activeSkills,
      })

      if (!readiness.ready) {
        throw createRequestError(
          409,
          'CREATOR_PROFILE_REQUIRED_FIELDS_LOCKED',
          'Approved Creator profile must keep all Creator-required fields complete',
          [
            ...readiness.missingFields.map(field => ({
              field: field === 'username' ? 'account.username' : `profile.${field}`,
              message: 'This field is required while Creator status is approved',
            })),
            ...readiness.errors,
          ],
        )
      }
    }

    await client.query(
      `
        UPDATE users
        SET username = $2,
            email = $3,
            updated_at = NOW()
        WHERE id = $1
      `,
      [user.id, input.account.username, input.account.email],
    )

    const location = input.profile.location
    await client.query(
      `
        INSERT INTO user_profiles (
          user_id,
          screen_name_en,
          screen_name_fa,
          bio_en,
          bio_fa,
          article_en,
          article_fa,
          birthday,
          location_text,
          location_source,
          location_provider_place_id,
          location_country_code,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::date,
          $9, $10, $11, $12, NOW()
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
          screen_name_en = EXCLUDED.screen_name_en,
          screen_name_fa = EXCLUDED.screen_name_fa,
          bio_en = EXCLUDED.bio_en,
          bio_fa = EXCLUDED.bio_fa,
          article_en = EXCLUDED.article_en,
          article_fa = EXCLUDED.article_fa,
          birthday = EXCLUDED.birthday,
          location_text = EXCLUDED.location_text,
          location_source = EXCLUDED.location_source,
          location_provider_place_id = EXCLUDED.location_provider_place_id,
          location_country_code = EXCLUDED.location_country_code,
          updated_at = NOW()
      `,
      [
        user.id,
        input.profile.screenName.en,
        input.profile.screenName.fa,
        input.profile.bio.en,
        input.profile.bio.fa,
        input.profile.article.en,
        input.profile.article.fa,
        input.profile.birthday,
        location?.text ?? null,
        location?.source ?? null,
        location?.providerPlaceId ?? null,
        location?.countryCode ?? null,
      ],
    )

    await replaceSkills(client, user.id, activeSkills)
    await replaceLinks(client, user.id, input.profile.links)
  })
}

async function readJsonBody(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function isJsonRequest(request) {
  const contentType = String(request.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase()
  return contentType === 'application/json'
}

async function authenticate(request, response, corsHeaders, sendJson, getUser) {
  try {
    const user = await getUser(request)
    if (!user) {
      sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
      return null
    }
    return user
  } catch (error) {
    console.error('[Prompt Draft API] profile management auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return null
  }
}

export async function handleProfileManagementRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  getUser = getAuthenticatedUser,
  readProfile = readOwnerProfile,
  updateProfile = updateOwnerProfile,
}) {
  if (url.pathname !== PROFILE_PATH) return false

  const user = await authenticate(request, response, corsHeaders, sendJson, getUser)
  if (!user) return true

  if (request.method === 'GET') {
    try {
      const profile = await readProfile(user.id)
      if (!profile) {
        sendJson(response, 404, { ok: false, message: 'Profile not found' }, corsHeaders)
        return true
      }
      sendJson(response, 200, profile, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] profile management read failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read profile' }, corsHeaders)
    }
    return true
  }

  if (request.method === 'PUT') {
    if (!isJsonRequest(request)) {
      sendJson(
        response,
        415,
        { ok: false, message: 'Content-Type must be application/json' },
        corsHeaders,
      )
      return true
    }

    let body
    try {
      body = await readJsonBody(request)
    } catch {
      sendJson(response, 400, { ok: false, message: 'Request body must contain valid JSON' }, corsHeaders)
      return true
    }

    const validation = normalizeProfileUpdateInput(body)
    if (validation.errors.length || !validation.value) {
      sendJson(
        response,
        400,
        {
          ok: false,
          code: 'PROFILE_VALIDATION',
          message: 'Invalid profile information',
          errors: validation.errors,
        },
        corsHeaders,
      )
      return true
    }

    try {
      await updateProfile(user, validation.value)
      const profile = await readProfile(user.id)
      sendJson(response, 200, profile, corsHeaders)
    } catch (error) {
      if (Number.isInteger(error?.statusCode)) {
        sendJson(
          response,
          error.statusCode,
          {
            ok: false,
            code: error.code ?? 'PROFILE_UPDATE_FAILED',
            message: error.message,
            ...(Array.isArray(error.errors) && error.errors.length ? { errors: error.errors } : {}),
          },
          corsHeaders,
        )
      } else if (error?.code === '23505') {
        sendJson(
          response,
          409,
          { ok: false, code: 'PROFILE_IDENTITY_TAKEN', message: 'Profile identity is already in use' },
          corsHeaders,
        )
      } else {
        console.error('[Prompt Draft API] profile management update failed', error)
        sendJson(response, 500, { ok: false, message: 'Failed to update profile' }, corsHeaders)
      }
    }
    return true
  }

  sendJson(
    response,
    405,
    { ok: false, message: 'Method Not Allowed' },
    { ...corsHeaders, Allow: 'GET, PUT' },
  )
  return true
}
