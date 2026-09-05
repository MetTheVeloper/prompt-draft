import { getAuthenticatedUser } from './auth.mjs'
import { queryDatabase } from './database.mjs'
import { createProfileRequirementPayload } from './profileRequirements.mjs'

const ARCHIVE_MODELS = new Set(['dall-e', 'gpt-image-1'])
const ARCHIVE_SORTS = new Set(['newest', 'oldest'])
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 100
const MAX_SEARCH_LENGTH = 200
const MAX_TAG_LENGTH = 100

function normalizeLocalizedTitle(value) {
  const en = typeof value?.en === 'string' ? value.en.trim() : ''
  const fa = typeof value?.fa === 'string' ? value.fa.trim() : ''
  return en && fa ? { en, fa } : null
}

function normalizeModelList(value) {
  return Array.isArray(value) ? value.filter(model => ARCHIVE_MODELS.has(model)) : []
}

function mapArchiveImage(value) {
  if (!value || typeof value !== 'object') return null
  const fullUrl = typeof value.fullUrl === 'string' ? value.fullUrl : ''
  const thumbnailUrl = typeof value.thumbnailUrl === 'string' ? value.thumbnailUrl : fullUrl
  if (!fullUrl) return null
  return { position: Number(value.position) || 0, fullUrl, thumbnailUrl: thumbnailUrl || fullUrl }
}

function mapArchiveListRow(row) {
  const title = normalizeLocalizedTitle(row.title)
  if (!title) throw new Error(`Archive item ${row.id} has invalid localized title data`)
  return {
    id: Number(row.id),
    title,
    publishedAt: row.publishedAt.toISOString(),
    telegramUrl: row.telegramUrl ?? null,
    model: {
      previewGeneratedWith: row.previewGeneratedWith,
      optimizedFor: normalizeModelList(row.optimizedFor),
    },
    tags: Array.isArray(row.tags) ? row.tags : [],
    coverImage: mapArchiveImage(row.coverImage),
    secondaryImage: mapArchiveImage(row.secondaryImage),
    imageCount: Number(row.imageCount) || 0,
  }
}

function mapArchiveDetailRow(row) {
  const base = mapArchiveListRow({
    ...row,
    coverImage: Array.isArray(row.images) ? row.images[0] : null,
    secondaryImage: Array.isArray(row.images) ? row.images[1] : null,
    imageCount: Array.isArray(row.images) ? row.images.length : 0,
  })
  return {
    ...base,
    sourceTitle: row.sourceTitle ?? '',
    prompt: row.prompt,
    images: (Array.isArray(row.images) ? row.images : []).map(mapArchiveImage).filter(Boolean),
    variants: Array.isArray(row.variants) ? row.variants : [],
  }
}

function mapNavigationRow(row) {
  if (!row) return null
  const title = normalizeLocalizedTitle(row.title)
  return title ? { id: Number(row.id), title } : null
}

function parseLimit(value) {
  if (value == null || value === '') return DEFAULT_LIMIT
  if (!/^\d+$/.test(value)) return null
  const limit = Number(value)
  return Number.isInteger(limit) && limit >= 1 && limit <= MAX_LIMIT ? limit : null
}

function parseSort(value) {
  if (value == null || value === '') return 'newest'
  return ARCHIVE_SORTS.has(value) ? value : null
}

function parseModel(value) {
  if (value == null || value === '' || value === 'all') return null
  return ARCHIVE_MODELS.has(value) ? value : undefined
}

function parseSearch(value) {
  if (value == null || value === '') return ''
  const normalized = value.trim()
  return normalized.length <= MAX_SEARCH_LENGTH ? normalized : null
}

function parseTag(value) {
  if (value == null || value === '' || value === 'all') return ''
  const normalized = value.trim()
  if (!normalized || normalized.length > MAX_TAG_LENGTH || normalized !== normalized.toLowerCase() || /\s/.test(normalized)) return null
  return normalized
}

function encodeCursor(item) {
  return Buffer.from(JSON.stringify({ publishedAt: item.publishedAt, id: item.id }), 'utf8').toString('base64url')
}

function decodeCursor(value) {
  if (!value) return null
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    const id = Number(decoded?.id)
    const publishedAt = typeof decoded?.publishedAt === 'string' ? decoded.publishedAt : ''
    if (!Number.isInteger(id) || id <= 0 || !publishedAt || Number.isNaN(Date.parse(publishedAt))) return undefined
    return { id, publishedAt: new Date(publishedAt).toISOString() }
  } catch {
    return undefined
  }
}

function parseListQuery(url) {
  const limit = parseLimit(url.searchParams.get('limit'))
  const sort = parseSort(url.searchParams.get('sort'))
  const model = parseModel(url.searchParams.get('model'))
  const search = parseSearch(url.searchParams.get('search'))
  const tag = parseTag(url.searchParams.get('tag'))
  const cursor = decodeCursor(url.searchParams.get('cursor'))
  if (limit == null || sort == null || model === undefined || search == null || tag == null || cursor === undefined) return null
  return { limit, sort, model, search, tag, cursor }
}

function buildFilterSql({ search, model, tag, cursor, sort }, includeCursor = true) {
  const values = []
  const conditions = [`items.status = 'published'`]

  if (model) { values.push(model); conditions.push(`items.preview_model = $${values.length}`) }
  if (tag) {
    values.push(tag)
    conditions.push(`EXISTS (
      SELECT 1 FROM prompt_archive_item_tags fit
      INNER JOIN prompt_archive_tags ft ON ft.id = fit.tag_id
      WHERE fit.archive_item_id = items.id AND ft.slug = $${values.length}
    )`)
  }
  if (search) {
    values.push(`%${search}%`)
    const p = `$${values.length}`
    conditions.push(`(
      CAST(items.public_id AS TEXT) ILIKE ${p}
      OR COALESCE(CAST(items.telegram_message_id AS TEXT), '') ILIKE ${p}
      OR items.titles->>'en' ILIKE ${p}
      OR items.titles->>'fa' ILIKE ${p}
      OR COALESCE(items.source_title, '') ILIKE ${p}
      OR items.prompt ILIKE ${p}
      OR EXISTS (
        SELECT 1 FROM prompt_archive_item_tags sit
        INNER JOIN prompt_archive_tags st ON st.id = sit.tag_id
        WHERE sit.archive_item_id = items.id AND st.slug ILIKE ${p}
      )
    )`)
  }
  if (includeCursor && cursor) {
    values.push(cursor.publishedAt, cursor.id)
    const dateParameter = `$${values.length - 1}`
    const idParameter = `$${values.length}`
    const operator = sort === 'oldest' ? '>' : '<'
    conditions.push(`(items.published_at, items.public_id) ${operator} (${dateParameter}::timestamptz, ${idParameter}::integer)`)
  }
  return { values, whereClause: `WHERE ${conditions.join('\n      AND ')}` }
}

async function listArchiveItems(query) {
  const listFilter = buildFilterSql(query, true)
  const countFilter = buildFilterSql(query, false)
  const order = query.sort === 'oldest' ? 'ASC' : 'DESC'
  const listValues = [...listFilter.values, query.limit + 1]

  const [listResult, countResult, tagsResult] = await Promise.all([
    queryDatabase(`
      SELECT
        items.public_id AS id,
        items.titles AS title,
        items.published_at AS "publishedAt",
        items.telegram_url AS "telegramUrl",
        items.preview_model AS "previewGeneratedWith",
        items.optimized_for AS "optimizedFor",
        COALESCE((
          SELECT json_agg(tags.slug ORDER BY tags.slug)
          FROM prompt_archive_item_tags it
          INNER JOIN prompt_archive_tags tags ON tags.id = it.tag_id
          WHERE it.archive_item_id = items.id
        ), '[]'::json) AS tags,
        (
          SELECT json_build_object(
            'position', images.position,
            'fullUrl', COALESCE(images.full_url, images.source_path),
            'thumbnailUrl', COALESCE(images.thumbnail_url, images.full_url, images.source_path)
          )
          FROM prompt_archive_images images
          WHERE images.archive_item_id = items.id
          ORDER BY images.position ASC LIMIT 1
        ) AS "coverImage",
        (
          SELECT json_build_object(
            'position', images.position,
            'fullUrl', COALESCE(images.full_url, images.source_path),
            'thumbnailUrl', COALESCE(images.thumbnail_url, images.full_url, images.source_path)
          )
          FROM prompt_archive_images images
          WHERE images.archive_item_id = items.id
          ORDER BY images.position ASC LIMIT 1 OFFSET 1
        ) AS "secondaryImage",
        (SELECT COUNT(*)::integer FROM prompt_archive_images images WHERE images.archive_item_id = items.id) AS "imageCount"
      FROM prompt_archive_items items
      ${listFilter.whereClause}
      ORDER BY items.published_at ${order}, items.public_id ${order}
      LIMIT $${listValues.length}
    `, listValues),
    queryDatabase(`SELECT COUNT(*)::integer AS count FROM prompt_archive_items items ${countFilter.whereClause}`, countFilter.values),
    queryDatabase(`
      SELECT DISTINCT tags.slug
      FROM prompt_archive_tags tags
      INNER JOIN prompt_archive_item_tags it ON it.tag_id = tags.id
      INNER JOIN prompt_archive_items items ON items.id = it.archive_item_id
      WHERE items.status = 'published'
      ORDER BY tags.slug ASC
    `),
  ])

  const hasMore = listResult.rows.length > query.limit
  const items = listResult.rows.slice(0, query.limit).map(mapArchiveListRow)
  const lastItem = items.at(-1)
  return {
    items,
    totalCount: Number(countResult.rows[0]?.count) || 0,
    hasMore,
    nextCursor: hasMore && lastItem ? encodeCursor(lastItem) : null,
    availableTags: tagsResult.rows.map(row => row.slug),
  }
}

async function getArchiveDetail(id) {
  const result = await queryDatabase(`
    SELECT
      items.public_id AS id,
      items.titles AS title,
      items.source_title AS "sourceTitle",
      items.published_at AS "publishedAt",
      items.telegram_url AS "telegramUrl",
      items.prompt,
      items.preview_model AS "previewGeneratedWith",
      items.optimized_for AS "optimizedFor",
      items.variants,
      COALESCE((
        SELECT json_agg(tags.slug ORDER BY tags.slug)
        FROM prompt_archive_item_tags it
        INNER JOIN prompt_archive_tags tags ON tags.id = it.tag_id
        WHERE it.archive_item_id = items.id
      ), '[]'::json) AS tags,
      COALESCE((
        SELECT json_agg(json_build_object(
          'position', images.position,
          'fullUrl', COALESCE(images.full_url, images.source_path),
          'thumbnailUrl', COALESCE(images.thumbnail_url, images.full_url, images.source_path)
        ) ORDER BY images.position ASC)
        FROM prompt_archive_images images
        WHERE images.archive_item_id = items.id
      ), '[]'::json) AS images
    FROM prompt_archive_items items
    WHERE items.status = 'published' AND items.public_id = $1
    LIMIT 1
  `, [id])

  const row = result.rows[0]
  if (!row) return null
  const [previousResult, nextResult] = await Promise.all([
    queryDatabase(`
      SELECT public_id AS id, titles AS title FROM prompt_archive_items
      WHERE status = 'published' AND (published_at, public_id) < ($1::timestamptz, $2::integer)
      ORDER BY published_at DESC, public_id DESC LIMIT 1
    `, [row.publishedAt.toISOString(), id]),
    queryDatabase(`
      SELECT public_id AS id, titles AS title FROM prompt_archive_items
      WHERE status = 'published' AND (published_at, public_id) > ($1::timestamptz, $2::integer)
      ORDER BY published_at ASC, public_id ASC LIMIT 1
    `, [row.publishedAt.toISOString(), id]),
  ])

  return {
    item: mapArchiveDetailRow(row),
    previousItem: mapNavigationRow(previousResult.rows[0]),
    nextItem: mapNavigationRow(nextResult.rows[0]),
  }
}

async function requireArchiveAccess({ request, response, corsHeaders, sendJson }) {
  let user
  try { user = await getAuthenticatedUser(request) }
  catch (error) {
    console.error('[Prompt Draft API] archive auth lookup failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to authenticate request' }, corsHeaders)
    return null
  }
  if (!user) {
    sendJson(response, 401, { ok: false, message: 'Authentication required' }, corsHeaders)
    return null
  }
  if (!user.email) {
    sendJson(response, 403, createProfileRequirementPayload(user, ['email']), corsHeaders)
    return null
  }
  return user
}

export async function handleArchiveRequest({ request, response, url, corsHeaders, sendJson }) {
  const isArchivePath = url.pathname === '/api/archive' || url.pathname.startsWith('/api/archive/')
  if (!isArchivePath) return false
  if (request.method !== 'GET') {
    sendJson(response, 405, { ok: false, message: 'Method not allowed' }, { ...corsHeaders, Allow: 'GET' })
    return true
  }
  if (!(await requireArchiveAccess({ request, response, corsHeaders, sendJson }))) return true

  if (url.pathname === '/api/archive') {
    const query = parseListQuery(url)
    if (!query) {
      sendJson(response, 400, { ok: false, message: 'Invalid archive query parameters' }, corsHeaders)
      return true
    }
    try { sendJson(response, 200, { ok: true, ...(await listArchiveItems(query)) }, corsHeaders) }
    catch (error) {
      console.error('[Prompt Draft API] archive list failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read Prompt Archive' }, corsHeaders)
    }
    return true
  }

  const detailMatch = url.pathname.match(/^\/api\/archive\/(\d+)$/)
  if (!detailMatch) {
    sendJson(response, 404, { ok: false, message: 'Not Found' }, corsHeaders)
    return true
  }
  const id = Number(detailMatch[1])
  if (!Number.isSafeInteger(id) || id <= 0) {
    sendJson(response, 400, { ok: false, message: 'Invalid archive id' }, corsHeaders)
    return true
  }
  try {
    const detail = await getArchiveDetail(id)
    if (!detail) sendJson(response, 404, { ok: false, message: 'Archive item not found' }, corsHeaders)
    else sendJson(response, 200, { ok: true, ...detail }, corsHeaders)
  } catch (error) {
    console.error('[Prompt Draft API] archive detail failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to read Prompt Archive item' }, corsHeaders)
  }
  return true
}
