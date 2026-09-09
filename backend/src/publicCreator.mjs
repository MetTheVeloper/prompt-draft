import {
  evaluateCreatorProfileContent,
  isCanonicalCreatorUsername,
} from './creatorProfileRequirements.mjs'
import { queryDatabase } from './database.mjs'

const PUBLIC_CREATOR_PREFIX = '/api/public/creators'
const PUBLIC_CREATOR_MATCH = /^\/api\/public\/creators\/([^/]+)$/
const PUBLIC_LINK_TYPES = new Set([
  'website',
  'github',
  'linkedin',
  'instagram',
  'telegram',
  'x',
  'youtube',
  'other',
])

function normalizeOptionalText(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

function normalizePositiveInteger(value) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function normalizeHttpUrl(value) {
  const raw = normalizeOptionalText(value)
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

function parsePublicCreatorUsername(pathname) {
  const match = pathname.match(PUBLIC_CREATOR_MATCH)
  if (!match) return null

  try {
    const username = decodeURIComponent(match[1]).trim()
    return isCanonicalCreatorUsername(username) ? username : null
  } catch {
    return null
  }
}

export function evaluateCreatorPublicPolicy({
  accountExists = false,
  accountStatus = null,
  creatorStatus = null,
  username = null,
  creatorProfileComplete = false,
  hasPublishedPrompt = false,
} = {}) {
  const signals = {
    accountActive: Boolean(accountExists && accountStatus === 'active'),
    creatorApproved: creatorStatus === 'approved',
    canonicalUsername: isCanonicalCreatorUsername(username),
    creatorProfileComplete: Boolean(creatorProfileComplete),
    hasPublishedPrompt: Boolean(hasPublishedPrompt),
  }

  const accessible = Boolean(
    accountExists &&
    signals.accountActive &&
    signals.creatorApproved &&
    signals.canonicalUsername
  )
  const indexable = accessible && signals.creatorProfileComplete
  const discoverable = indexable
  const reasons = []

  if (!accountExists) reasons.push('account_missing')
  if (accountExists && !signals.accountActive) reasons.push('account_inactive')
  if (accountExists && !signals.creatorApproved) reasons.push('creator_not_approved')
  if (accountExists && !signals.canonicalUsername) reasons.push('canonical_username_missing')
  if (accessible && !signals.creatorProfileComplete) reasons.push('creator_profile_incomplete')

  return {
    accessible,
    indexable,
    discoverable,
    reasons,
    signals,
  }
}

function mapPublicCover(row) {
  const fullUrl = normalizeHttpUrl(row?.coverUrl)
  if (!fullUrl) return null

  const thumbnailUrl = normalizeHttpUrl(row?.coverThumbnailUrl) || fullUrl

  return {
    fullUrl,
    thumbnailUrl,
    width: normalizePositiveInteger(row?.coverWidth),
    height: normalizePositiveInteger(row?.coverHeight),
    thumbnailWidth: normalizePositiveInteger(row?.coverThumbnailWidth),
    thumbnailHeight: normalizePositiveInteger(row?.coverThumbnailHeight),
  }
}

function mapPublicSkill(row) {
  const slug = normalizeOptionalText(row?.slug)?.toLowerCase() ?? null
  const categorySlug = normalizeOptionalText(row?.categorySlug)?.toLowerCase() ?? null
  if (!slug || !categorySlug) return null

  const titleEn = normalizeOptionalText(row?.titleEn) || slug
  const titleFa = normalizeOptionalText(row?.titleFa) || titleEn

  return {
    slug,
    categorySlug,
    title: {
      en: titleEn,
      fa: titleFa,
    },
  }
}

function mapPublicLink(row) {
  const type = typeof row?.type === 'string' ? row.type.trim().toLowerCase() : ''
  const url = normalizeHttpUrl(row?.url)
  if (!PUBLIC_LINK_TYPES.has(type) || !url) return null

  return {
    type,
    url,
    label: normalizeOptionalText(row?.label),
  }
}

function normalizePublicationLocalization(titleValue, descriptionValue) {
  const title = {}
  const description = {}
  const availableLocales = []

  for (const locale of ['en', 'fa']) {
    const localizedTitle = normalizeOptionalText(titleValue?.[locale])
    const localizedDescription = normalizeOptionalText(descriptionValue?.[locale])
    if (!localizedTitle || !localizedDescription) continue

    title[locale] = localizedTitle
    description[locale] = localizedDescription
    availableLocales.push(locale)
  }

  return availableLocales.length
    ? { title, description, availableLocales }
    : null
}

function mapPublicationCover(value) {
  if (!value || typeof value !== 'object') return null
  const fullUrl = normalizeHttpUrl(value.fullUrl)
  if (!fullUrl) return null

  return {
    fullUrl,
    thumbnailUrl: normalizeHttpUrl(value.thumbnailUrl) || fullUrl,
  }
}

export function mapPublicCreatorPublication(row) {
  const id = normalizePositiveInteger(row?.id)
  if (!id) return null

  const localized = normalizePublicationLocalization(row?.title, row?.description)
  if (!localized) return null

  const publishedAt = row?.publishedAt instanceof Date
    ? row.publishedAt
    : new Date(row?.publishedAt)
  if (Number.isNaN(publishedAt.getTime())) return null

  return {
    id,
    title: localized.title,
    description: localized.description,
    availableLocales: localized.availableLocales,
    publishedAt: publishedAt.toISOString(),
    coverImage: mapPublicationCover(row?.coverImage),
  }
}

export function mapPublicCreatorProjection({
  state,
  profileRow,
  skills = [],
  links = [],
  publications = [],
  content,
  policy,
}) {
  const username = state.username
  const normalizedProfile = content.profile

  return {
    identity: {
      username,
      screenName: {
        en: normalizedProfile.screenName.en || username,
        fa: normalizedProfile.screenName.fa || normalizedProfile.screenName.en || username,
      },
      bio: {
        en: normalizedProfile.bio.en || '',
        fa: normalizedProfile.bio.fa || '',
      },
      article: {
        en: normalizedProfile.article.en || '',
        fa: normalizedProfile.article.fa || '',
      },
      avatarUrl: normalizeHttpUrl(profileRow?.avatarUrl),
      cover: mapPublicCover(profileRow),
      skills: skills.map(mapPublicSkill).filter(Boolean),
      links: links.map(mapPublicLink).filter(Boolean),
      location: normalizeOptionalText(profileRow?.locationText)
        ? { text: normalizeOptionalText(profileRow.locationText) }
        : null,
    },
    publications: publications.map(mapPublicCreatorPublication).filter(Boolean),
    policy: {
      indexable: policy.indexable,
      discoverable: policy.discoverable,
    },
  }
}

async function readCreatorPublicState(username, query) {
  const result = await query(
    `
      SELECT
        users.id,
        users.username,
        users.status AS "accountStatus",
        creator.status AS "creatorStatus",
        EXISTS (
          SELECT 1
          FROM prompt_archive_items items
          WHERE items.source_user_id = users.id
            AND items.status = 'published'
            AND items.public_id IS NOT NULL
        ) AS "hasPublishedPrompt"
      FROM users
      LEFT JOIN creator_accounts creator ON creator.user_id = users.id
      WHERE users.username = $1
      LIMIT 1
    `,
    [username],
  )

  return result.rows[0] ?? null
}

async function readCreatorPublicProfile(userId, query) {
  const result = await query(
    `
      SELECT
        users.avatar_url AS "avatarUrl",
        users.cover_url AS "coverUrl",
        users.cover_thumbnail_url AS "coverThumbnailUrl",
        users.cover_width AS "coverWidth",
        users.cover_height AS "coverHeight",
        users.cover_thumbnail_width AS "coverThumbnailWidth",
        users.cover_thumbnail_height AS "coverThumbnailHeight",
        profile.screen_name_en AS "screenNameEn",
        profile.screen_name_fa AS "screenNameFa",
        profile.bio_en AS "bioEn",
        profile.bio_fa AS "bioFa",
        profile.article_en AS "articleEn",
        profile.article_fa AS "articleFa",
        profile.location_text AS "locationText"
      FROM users
      LEFT JOIN user_profiles profile ON profile.user_id = users.id
      WHERE users.id = $1
      LIMIT 1
    `,
    [userId],
  )

  return result.rows[0] ?? null
}

async function readCreatorPublicSkills(userId, query) {
  const result = await query(
    `
      SELECT
        skills.slug,
        skills.category_slug AS "categorySlug",
        skills.title_en AS "titleEn",
        skills.title_fa AS "titleFa"
      FROM user_profile_skills selected
      INNER JOIN profile_skills skills ON skills.slug = selected.skill_slug
      INNER JOIN profile_skill_categories categories ON categories.slug = skills.category_slug
      WHERE selected.user_id = $1
        AND skills.active = TRUE
        AND categories.active = TRUE
      ORDER BY categories.sort_order ASC, skills.sort_order ASC, skills.slug ASC
    `,
    [userId],
  )

  return result.rows
}

async function readCreatorPublicLinks(userId, query) {
  const result = await query(
    `
      SELECT type, url, label
      FROM user_profile_links
      WHERE user_id = $1
      ORDER BY position ASC, id ASC
    `,
    [userId],
  )

  return result.rows
}

async function readCreatorPublications(userId, query) {
  const result = await query(
    `
      SELECT
        items.public_id AS id,
        items.titles AS title,
        items.descriptions AS description,
        items.published_at AS "publishedAt",
        (
          SELECT json_build_object(
            'fullUrl', COALESCE(images.full_url, images.source_path),
            'thumbnailUrl', COALESCE(images.thumbnail_url, images.full_url, images.source_path)
          )
          FROM prompt_archive_images images
          WHERE images.archive_item_id = items.id
            AND COALESCE(images.full_url, images.source_path) IS NOT NULL
          ORDER BY images.position ASC
          LIMIT 1
        ) AS "coverImage"
      FROM prompt_archive_items items
      WHERE items.source_user_id = $1
        AND items.status = 'published'
        AND items.public_id IS NOT NULL
      ORDER BY items.published_at DESC, items.public_id DESC
    `,
    [userId],
  )

  return result.rows
}

export async function readPublicCreator(username, query = queryDatabase) {
  if (!isCanonicalCreatorUsername(username)) return null

  const stateRow = await readCreatorPublicState(username, query)
  if (!stateRow) return null

  const basePolicy = evaluateCreatorPublicPolicy({
    accountExists: true,
    accountStatus: stateRow.accountStatus,
    creatorStatus: stateRow.creatorStatus,
    username: stateRow.username,
    creatorProfileComplete: false,
    hasPublishedPrompt: stateRow.hasPublishedPrompt,
  })

  if (!basePolicy.accessible) return null

  const [profileRow, skillRows, linkRows, publicationRows] = await Promise.all([
    readCreatorPublicProfile(stateRow.id, query),
    readCreatorPublicSkills(stateRow.id, query),
    readCreatorPublicLinks(stateRow.id, query),
    readCreatorPublications(stateRow.id, query),
  ])

  if (!profileRow) return null

  const profile = {
    screenName: {
      en: profileRow.screenNameEn ?? null,
      fa: profileRow.screenNameFa ?? null,
    },
    bio: {
      en: profileRow.bioEn ?? null,
      fa: profileRow.bioFa ?? null,
    },
    article: {
      en: profileRow.articleEn ?? null,
      fa: profileRow.articleFa ?? null,
    },
  }
  const content = evaluateCreatorProfileContent({
    profile,
    activeSkillSlugs: skillRows.map(skill => skill.slug),
  })
  const policy = evaluateCreatorPublicPolicy({
    accountExists: true,
    accountStatus: stateRow.accountStatus,
    creatorStatus: stateRow.creatorStatus,
    username: stateRow.username,
    creatorProfileComplete: content.complete,
    hasPublishedPrompt: stateRow.hasPublishedPrompt,
  })

  return mapPublicCreatorProjection({
    state: stateRow,
    profileRow,
    skills: skillRows,
    links: linkRows,
    publications: publicationRows,
    content,
    policy,
  })
}

export async function handlePublicCreatorRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  query = queryDatabase,
}) {
  if (
    url.pathname !== PUBLIC_CREATOR_PREFIX &&
    !url.pathname.startsWith(`${PUBLIC_CREATOR_PREFIX}/`)
  ) {
    return false
  }

  if (request.method !== 'GET') {
    sendJson(
      response,
      405,
      { ok: false, message: 'Method not allowed' },
      { ...corsHeaders, Allow: 'GET' },
    )
    return true
  }

  const username = parsePublicCreatorUsername(url.pathname)
  if (!username) {
    sendJson(response, 404, { ok: false, message: 'Public Creator not found' }, corsHeaders)
    return true
  }

  try {
    const creator = await readPublicCreator(username, query)
    if (!creator) {
      sendJson(response, 404, { ok: false, message: 'Public Creator not found' }, corsHeaders)
      return true
    }

    sendJson(response, 200, { ok: true, creator }, corsHeaders)
  } catch (error) {
    console.error('[Prompt Draft API] public Creator read failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to read public Creator' }, corsHeaders)
  }

  return true
}
