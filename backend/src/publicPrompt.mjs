import { queryDatabase } from './database.mjs'
import { handlePublicCreatorRequest } from './publicCreator.mjs'
import { mapPublicCreatorAttribution } from './publicCreatorAttribution.mjs'
import { normalizePublicPromptLocalization } from './publicLocalization.mjs'

const PUBLIC_PROMPT_PREFIX = '/api/public/prompts'
const PUBLIC_PROMPT_MATCH = /^\/api\/public\/prompts\/(\d+)$/
const PUBLIC_PROMPT_MODELS = new Set(['dall-e', 'gpt-image-1'])

function normalizeModel(value, itemId) {
  const previewGeneratedWith = typeof value?.previewGeneratedWith === 'string'
    ? value.previewGeneratedWith
    : ''
  const optimizedFor = Array.isArray(value?.optimizedFor) ? value.optimizedFor : []

  if (
    !PUBLIC_PROMPT_MODELS.has(previewGeneratedWith) ||
    optimizedFor.some(model => !PUBLIC_PROMPT_MODELS.has(model))
  ) {
    throw new Error(`Public Prompt ${itemId} has invalid model metadata`)
  }

  return {
    previewGeneratedWith,
    optimizedFor: [...optimizedFor],
  }
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter(tag => typeof tag === 'string')
    .map(tag => tag.trim())
    .filter(Boolean)
}

function normalizeImage(value) {
  if (!value || typeof value !== 'object') return null

  const position = Number(value.position)
  const fullUrl = typeof value.fullUrl === 'string' ? value.fullUrl.trim() : ''
  const thumbnailUrl = typeof value.thumbnailUrl === 'string'
    ? value.thumbnailUrl.trim()
    : fullUrl

  if (!Number.isInteger(position) || position < 0 || !fullUrl) return null

  return {
    position,
    fullUrl,
    thumbnailUrl: thumbnailUrl || fullUrl,
  }
}

function normalizeTelegramMessageId(value, itemId) {
  if (value === null || value === undefined) return null

  const telegramMessageId = Number(value)
  if (!Number.isSafeInteger(telegramMessageId) || telegramMessageId <= 0) {
    throw new Error(`Public Prompt ${itemId} has invalid Telegram message metadata`)
  }

  return telegramMessageId
}

export function mapPublicPromptRow(row) {
  const id = Number(row?.id)
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Public Prompt row has invalid public id')
  }

  const localized = normalizePublicPromptLocalization(row.title, row.description)
  if (!localized) {
    throw new Error(`Public Prompt ${id} has no complete authoritative localization`)
  }

  const publishedAt = row.publishedAt instanceof Date
    ? row.publishedAt
    : new Date(row.publishedAt)
  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error(`Public Prompt ${id} has invalid publication date`)
  }

  const images = (Array.isArray(row.images) ? row.images : [])
    .map(normalizeImage)
    .filter(Boolean)

  return {
    id,
    title: localized.title,
    description: localized.description,
    availableLocales: localized.availableLocales,
    publishedAt: publishedAt.toISOString(),
    telegramMessageId: normalizeTelegramMessageId(row.telegramMessageId, id),
    tags: normalizeTags(row.tags),
    model: normalizeModel({
      previewGeneratedWith: row.previewGeneratedWith,
      optimizedFor: row.optimizedFor,
    }, id),
    images,
    creator: mapPublicCreatorAttribution(row),
  }
}

export async function readPublicPrompt(id, query = queryDatabase) {
  const result = await query(`
    SELECT
      items.public_id AS id,
      items.titles AS title,
      items.descriptions AS description,
      items.published_at AS "publishedAt",
      items.telegram_message_id AS "telegramMessageId",
      items.preview_model AS "previewGeneratedWith",
      items.optimized_for AS "optimizedFor",
      creator_user.username AS "creatorUsername",
      creator_user.avatar_url AS "creatorAvatarUrl",
      creator_user.status AS "creatorAccountStatus",
      creator_account.status AS "creatorStatus",
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
          AND COALESCE(images.full_url, images.source_path) IS NOT NULL
      ), '[]'::json) AS images
    FROM prompt_archive_items items
    LEFT JOIN users creator_user
      ON creator_user.id = items.source_user_id
    LEFT JOIN creator_accounts creator_account
      ON creator_account.user_id = creator_user.id
    WHERE items.public_id = $1
      AND items.status = 'published'
    LIMIT 1
  `, [id])

  const row = result.rows[0]
  return row ? mapPublicPromptRow(row) : null
}

function parsePublicPromptId(pathname) {
  const match = pathname.match(PUBLIC_PROMPT_MATCH)
  if (!match) return null

  const id = Number(match[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export async function handlePublicPromptRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  query = queryDatabase,
}) {
  if (
    await handlePublicCreatorRequest({
      request,
      response,
      url,
      corsHeaders,
      sendJson,
      query,
    })
  ) {
    return true
  }

  if (url.pathname !== PUBLIC_PROMPT_PREFIX && !url.pathname.startsWith(`${PUBLIC_PROMPT_PREFIX}/`)) {
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

  const id = parsePublicPromptId(url.pathname)
  if (!id) {
    sendJson(response, 404, { ok: false, message: 'Public Prompt not found' }, corsHeaders)
    return true
  }

  try {
    const prompt = await readPublicPrompt(id, query)
    if (!prompt) {
      sendJson(response, 404, { ok: false, message: 'Public Prompt not found' }, corsHeaders)
      return true
    }

    sendJson(response, 200, { ok: true, prompt }, corsHeaders)
  } catch (error) {
    console.error('[Prompt Draft API] public Prompt read failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to read public Prompt' }, corsHeaders)
  }

  return true
}
