import { queryDatabase } from './database.mjs'

const HERO_MEDIA_PATH = '/api/home/hero-media'
const SHOWCASE_PATH = '/api/home/showcase'
const PUBLIC_DISCOVERY_PATH = '/api/discover'
const MAX_TAGS = 24
const MAX_TAG_LENGTH = 100
const HERO_DEFAULT_LIMIT = 50
const HERO_MAX_LIMIT = 50
const SHOWCASE_DEFAULT_LIMIT = 5
const SHOWCASE_MAX_LIMIT = 5
const DISCOVERY_DEFAULT_LIMIT = 18
const DISCOVERY_MAX_LIMIT = 24

function normalizeTag(value) {
  if (typeof value !== 'string') return null
  const tag = value.trim().toLowerCase()
  if (!tag || tag.length > MAX_TAG_LENGTH || /\s/.test(tag)) return null
  return tag
}

function parseTags(url) {
  const values = url.searchParams.getAll('tag')
  if (values.length > MAX_TAGS) return null

  const tags = []
  const seen = new Set()

  for (const value of values) {
    const tag = normalizeTag(value)
    if (!tag) return null
    if (seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
  }

  return tags
}

function parseLimit(url, fallback, max) {
  const raw = url.searchParams.get('limit')
  if (raw == null || raw === '') return fallback
  if (!/^\d+$/.test(raw)) return null
  const limit = Number(raw)
  return Number.isSafeInteger(limit) && limit >= 1 && limit <= max ? limit : null
}

function createTagFilter(tags, values) {
  if (!tags.length) return ''
  values.push(tags)
  return `AND EXISTS (
    SELECT 1
    FROM prompt_archive_item_tags hit
    INNER JOIN prompt_archive_tags htags ON htags.id = hit.tag_id
    WHERE hit.archive_item_id = items.id
      AND htags.slug = ANY($${values.length}::text[])
  )`
}

async function listHeroMedia(tags, limit) {
  const values = []
  const tagFilter = createTagFilter(tags, values)
  values.push(limit)

  const result = await queryDatabase(`
    SELECT
      items.public_id AS "itemId",
      COALESCE(images.full_url, images.source_path) AS "fullUrl",
      COALESCE(images.thumbnail_url, images.full_url, images.source_path) AS "thumbnailUrl"
    FROM prompt_archive_images images
    INNER JOIN prompt_archive_items items ON items.id = images.archive_item_id
    WHERE items.status = 'published'
      AND COALESCE(images.full_url, images.source_path) IS NOT NULL
      ${tagFilter}
    ORDER BY RANDOM()
    LIMIT $${values.length}
  `, values)

  return result.rows
    .map(row => ({
      itemId: Number(row.itemId),
      fullUrl: row.fullUrl,
      thumbnailUrl: row.thumbnailUrl ?? row.fullUrl,
    }))
    .filter(item => Number.isInteger(item.itemId) && item.itemId > 0 && item.fullUrl)
}

function normalizeLocalizedTitle(value) {
  const en = typeof value?.en === 'string' ? value.en.trim() : ''
  const fa = typeof value?.fa === 'string' ? value.fa.trim() : ''
  return en && fa ? { en, fa } : null
}

function mapShowcaseItem(row) {
  const title = normalizeLocalizedTitle(row.title)
  if (!title) throw new Error(`Home showcase item ${row.id} has invalid localized title data`)

  const coverFullUrl = row.coverImage?.fullUrl || null
  const coverThumbnailUrl = row.coverImage?.thumbnailUrl || coverFullUrl
  const ownerUsername = typeof row.ownerUsername === 'string' && row.ownerUsername.trim()
    ? row.ownerUsername.trim()
    : null

  return {
    id: Number(row.id),
    title,
    publishedAt: row.publishedAt.toISOString(),
    telegramUrl: row.telegramUrl ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    imageCount: Number(row.imageCount) || 0,
    coverImage: coverFullUrl
      ? {
          fullUrl: coverFullUrl,
          thumbnailUrl: coverThumbnailUrl || coverFullUrl,
        }
      : null,
    owner: ownerUsername
      ? {
          username: ownerUsername,
          avatarUrl: row.ownerAvatarUrl ?? null,
        }
      : null,
  }
}

async function listShowcaseItems(tags, limit) {
  const values = []
  const tagFilter = createTagFilter(tags, values)
  values.push(limit)

  const result = await queryDatabase(`
    SELECT
      items.public_id AS id,
      items.titles AS title,
      items.published_at AS "publishedAt",
      items.telegram_url AS "telegramUrl",
      owner.username AS "ownerUsername",
      owner.avatar_url AS "ownerAvatarUrl",
      COALESCE((
        SELECT json_agg(tags.slug ORDER BY tags.slug)
        FROM prompt_archive_item_tags it
        INNER JOIN prompt_archive_tags tags ON tags.id = it.tag_id
        WHERE it.archive_item_id = items.id
      ), '[]'::json) AS tags,
      (
        SELECT json_build_object(
          'fullUrl', COALESCE(images.full_url, images.source_path),
          'thumbnailUrl', COALESCE(images.thumbnail_url, images.full_url, images.source_path)
        )
        FROM prompt_archive_images images
        WHERE images.archive_item_id = items.id
        ORDER BY images.position ASC
        LIMIT 1
      ) AS "coverImage",
      (
        SELECT COUNT(*)::integer
        FROM prompt_archive_images images
        WHERE images.archive_item_id = items.id
      ) AS "imageCount"
    FROM prompt_archive_items items
    LEFT JOIN users owner
      ON owner.id = items.source_user_id
      AND owner.status = 'active'
    WHERE items.status = 'published'
      ${tagFilter}
    ORDER BY items.published_at DESC, items.public_id DESC
    LIMIT $${values.length}
  `, values)

  return result.rows.map(mapShowcaseItem)
}

export async function handleHomeDiscoveryRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
}) {
  if (
    url.pathname !== HERO_MEDIA_PATH &&
    url.pathname !== SHOWCASE_PATH &&
    url.pathname !== PUBLIC_DISCOVERY_PATH
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

  const tags = parseTags(url)
  if (!tags) {
    sendJson(response, 400, { ok: false, message: 'Invalid discovery tags' }, corsHeaders)
    return true
  }

  if (url.pathname === HERO_MEDIA_PATH) {
    const limit = parseLimit(url, HERO_DEFAULT_LIMIT, HERO_MAX_LIMIT)
    if (!limit) {
      sendJson(response, 400, { ok: false, message: 'Invalid hero media limit' }, corsHeaders)
      return true
    }

    try {
      const media = await listHeroMedia(tags, limit)
      sendJson(response, 200, { ok: true, media }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] home hero media failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read home hero media' }, corsHeaders)
    }

    return true
  }

  const isPublicDiscovery = url.pathname === PUBLIC_DISCOVERY_PATH
  const limit = parseLimit(
    url,
    isPublicDiscovery ? DISCOVERY_DEFAULT_LIMIT : SHOWCASE_DEFAULT_LIMIT,
    isPublicDiscovery ? DISCOVERY_MAX_LIMIT : SHOWCASE_MAX_LIMIT,
  )

  if (!limit) {
    sendJson(
      response,
      400,
      {
        ok: false,
        message: isPublicDiscovery ? 'Invalid public discovery limit' : 'Invalid home showcase limit',
      },
      corsHeaders,
    )
    return true
  }

  try {
    const items = await listShowcaseItems(tags, limit)
    sendJson(response, 200, { ok: true, items }, corsHeaders)
  } catch (error) {
    console.error(
      isPublicDiscovery
        ? '[Prompt Draft API] public discovery failed'
        : '[Prompt Draft API] home showcase failed',
      error,
    )
    sendJson(
      response,
      500,
      {
        ok: false,
        message: isPublicDiscovery
          ? 'Failed to read public discovery'
          : 'Failed to read home showcase',
      },
      corsHeaders,
    )
  }

  return true
}
