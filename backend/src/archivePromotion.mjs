import { randomUUID } from 'node:crypto'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import {
  getArchiveStorageConfig,
  readStorageError,
  requestArchiveStorage,
} from './archiveStorage.mjs'

const SOURCE_DRAFT_MATCH = /^\/api\/admin\/archive\/source-draft\/([0-9a-f-]{36})\/([^/]+)$/i
const SOURCE_IMAGE_MATCH = /^\/api\/admin\/archive\/source-draft\/([0-9a-f-]{36})\/([^/]+)\/images\/([0-9a-f-]{36})$/i
const PROMOTE_PATH = '/api/admin/archive/promote-draft'
const MAX_BODY_BYTES = 1024 * 1024
const MAX_TITLE_LENGTH = 300
const MAX_PROMPT_LENGTH = 200000

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function parseDraftId(value) {
  try {
    const decoded = decodeURIComponent(value).trim()
    if (!decoded || decoded.length > 200 || /[\u0000-\u001f\u007f]/.test(decoded)) return null
    return decoded
  } catch {
    return null
  }
}

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

async function readJsonBody(request) {
  const chunks = []
  let total = 0

  for await (const chunk of request) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) {
      const error = new Error('Promotion request body is too large')
      error.code = 'PROMOTION_BODY_TOO_LARGE'
      throw error
    }
    chunks.push(chunk)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function normalizeTelegramMessageId(value) {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : undefined
}

function validatePromotionBody(body) {
  const errors = []

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return [{ field: 'body', message: 'JSON body must be an object' }]
  }

  if (!isUuid(body.sourceUserId)) {
    errors.push({ field: 'sourceUserId', message: 'sourceUserId must be a UUID' })
  }

  if (!parseDraftId(body.sourceDraftId)) {
    errors.push({ field: 'sourceDraftId', message: 'sourceDraftId is invalid' })
  }

  if (!body.title || typeof body.title !== 'object' || Array.isArray(body.title)) {
    errors.push({ field: 'title', message: 'title must contain en and fa values' })
  } else {
    for (const locale of ['en', 'fa']) {
      const value = typeof body.title[locale] === 'string' ? body.title[locale].trim() : ''
      if (!value || value.length > MAX_TITLE_LENGTH) {
        errors.push({
          field: `title.${locale}`,
          message: `${locale.toUpperCase()} title must be 1-${MAX_TITLE_LENGTH} characters`,
        })
      }
    }
  }

  const telegramMessageId = normalizeTelegramMessageId(body.telegramMessageId)
  if (telegramMessageId === undefined) {
    errors.push({
      field: 'telegramMessageId',
      message: 'Telegram message id must be empty or a positive integer',
    })
  }

  if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > MAX_PROMPT_LENGTH) {
    errors.push({
      field: 'prompt',
      message: `prompt must be a non-empty string up to ${MAX_PROMPT_LENGTH} characters`,
    })
  }

  return errors
}

async function getArchiveChannel(client = null) {
  const query = client ? client.query.bind(client) : queryDatabase
  const result = await query(`SELECT channel FROM prompt_archive_metadata WHERE id = 1 LIMIT 1`)
  const channel = result.rows[0]?.channel
  if (typeof channel !== 'string' || !/^[A-Za-z0-9_]+$/.test(channel)) {
    const error = new Error('Prompt Archive channel metadata is missing or invalid')
    error.code = 'ARCHIVE_METADATA_MISSING'
    throw error
  }
  return channel
}

function telegramUrl(channel, telegramMessageId) {
  return telegramMessageId ? `https://t.me/${channel}/${telegramMessageId}` : null
}

async function readSourceDraft(sourceUserId, sourceDraftId, includeStorageKeys = false) {
  const result = await queryDatabase(
    `
      SELECT
        drafts.user_id AS "userId",
        drafts.draft_id AS id,
        drafts.title,
        drafts.snapshot,
        drafts.visibility,
        drafts.published_at AS "publishedAt",
        drafts.created_at AS "createdAt",
        drafts.client_updated_at AS "updatedAt",
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', media.id,
                'url', media.url,
                'storageKey', ${includeStorageKeys ? 'media.storage_key' : 'NULL'},
                'position', media.position,
                'width', media.width,
                'height', media.height,
                'sizeBytes', media.size_bytes
              )
              ORDER BY media.position ASC, media.created_at ASC, media.id ASC
            )
            FROM prompt_draft_images media
            WHERE media.user_id = drafts.user_id
              AND media.draft_id = drafts.draft_id
          ),
          '[]'::jsonb
        ) AS images
      FROM prompt_drafts drafts
      INNER JOIN users ON users.id = drafts.user_id
      WHERE drafts.user_id = $1
        AND drafts.draft_id = $2
        AND drafts.deleted_at IS NULL
        AND drafts.visibility = 'public'
        AND users.status = 'active'
      LIMIT 1
    `,
    [sourceUserId, sourceDraftId],
  )

  return result.rows[0] ?? null
}

function mapSourceDraft(row) {
  return {
    userId: row.userId,
    id: row.id,
    title: row.title,
    snapshot: row.snapshot,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    images: Array.isArray(row.images)
      ? row.images.map(image => ({
          id: image.id,
          url: image.url,
          position: Number(image.position),
          width: Number(image.width),
          height: Number(image.height),
          sizeBytes: Number(image.sizeBytes),
        }))
      : [],
  }
}

async function auditPromotion(client, actor, action, metadata, targetUserId = null) {
  await client.query(
    `
      INSERT INTO admin_audit_log (
        id,
        actor_user_id,
        target_user_id,
        action,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [randomUUID(), actor.id, targetUserId, action, JSON.stringify(metadata)],
  )
}

async function createPromotedArchiveItem(actor, body) {
  const sourceDraftId = parseDraftId(body.sourceDraftId)
  const telegramMessageId = normalizeTelegramMessageId(body.telegramMessageId)
  const archiveItemId = randomUUID()
  let publicId = null

  await withDatabaseTransaction(async (client) => {
    const sourceResult = await client.query(
      `
        SELECT
          drafts.title,
          drafts.published_at AS "publishedAt"
        FROM prompt_drafts drafts
        INNER JOIN users ON users.id = drafts.user_id
        WHERE drafts.user_id = $1
          AND drafts.draft_id = $2
          AND drafts.deleted_at IS NULL
          AND drafts.visibility = 'public'
          AND users.status = 'active'
        FOR UPDATE OF drafts
      `,
      [body.sourceUserId, sourceDraftId],
    )
    const source = sourceResult.rows[0]
    if (!source) {
      const error = new Error('Public source Draft not found')
      error.code = 'PROMOTION_SOURCE_NOT_FOUND'
      throw error
    }

    const channel = await getArchiveChannel(client)
    const inserted = await client.query(
      `
        INSERT INTO prompt_archive_items (
          id,
          telegram_message_id,
          channel,
          titles,
          legacy_title_key,
          source_title,
          telegram_url,
          published_at,
          prompt,
          preview_model,
          optimized_for,
          variants,
          status,
          source_kind,
          source_user_id,
          source_draft_id,
          created_by,
          updated_by,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4::jsonb, NULL,
          $5, $6, $7, $8,
          'gpt-image-1', ARRAY['gpt-image-1']::text[],
          '[]'::jsonb, 'draft', 'user_draft',
          $9, $10, $11, $11, NOW(), NOW()
        )
        RETURNING public_id AS "publicId"
      `,
      [
        archiveItemId,
        telegramMessageId,
        channel,
        JSON.stringify({
          en: body.title.en.trim(),
          fa: body.title.fa.trim(),
        }),
        source.title,
        telegramUrl(channel, telegramMessageId),
        source.publishedAt ?? new Date(),
        body.prompt,
        body.sourceUserId,
        sourceDraftId,
        actor.id,
      ],
    )

    publicId = Number(inserted.rows[0].publicId)

    await auditPromotion(
      client,
      actor,
      'archive.promote_user_draft',
      {
        archiveItemId,
        publicId,
        telegramMessageId,
        sourceUserId: body.sourceUserId,
        sourceDraftId,
        status: 'draft',
      },
      body.sourceUserId,
    )
  })

  return {
    id: archiveItemId,
    publicId,
    telegramMessageId,
    sourceKind: 'user_draft',
    sourceUserId: body.sourceUserId,
    sourceDraftId,
    status: 'draft',
  }
}

async function streamSourceImage({ response, corsHeaders, sourceUserId, sourceDraftId, imageId }) {
  const source = await readSourceDraft(sourceUserId, sourceDraftId, true)
  if (!source) return false

  const image = Array.isArray(source.images)
    ? source.images.find(candidate => candidate.id === imageId)
    : null
  if (!image?.storageKey) return false

  const config = getArchiveStorageConfig()
  const storageResponse = await requestArchiveStorage({
    method: 'GET',
    key: image.storageKey,
    config,
  })
  if (!storageResponse.ok) throw await readStorageError(storageResponse)

  const body = Buffer.from(await storageResponse.arrayBuffer())
  response.writeHead(200, {
    ...corsHeaders,
    'Content-Type': 'image/webp',
    'Content-Length': String(body.length),
    'Cache-Control': 'private, max-age=60',
  })
  response.end(body)
  return true
}

export async function handleArchivePromotionRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  user,
}) {
  const sourceMatch = url.pathname.match(SOURCE_DRAFT_MATCH)
  const imageMatch = url.pathname.match(SOURCE_IMAGE_MATCH)
  const isPromote = url.pathname === PROMOTE_PATH

  if (!sourceMatch && !imageMatch && !isPromote) return false

  if (!hasPermission(user, PERMISSIONS.ARCHIVE_MANAGE)) {
    sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
    return true
  }

  if (sourceMatch) {
    if (request.method !== 'GET') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
      return true
    }

    const sourceUserId = sourceMatch[1]
    const sourceDraftId = parseDraftId(sourceMatch[2])
    if (!isUuid(sourceUserId) || !sourceDraftId) {
      sendJson(response, 400, { ok: false, message: 'Invalid source Draft identity' }, corsHeaders)
      return true
    }

    try {
      const source = await readSourceDraft(sourceUserId, sourceDraftId)
      if (!source) {
        sendJson(response, 404, { ok: false, message: 'Public source Draft not found' }, corsHeaders)
        return true
      }
      sendJson(response, 200, { ok: true, draft: mapSourceDraft(source) }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] promotion source read failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read promotion source Draft' }, corsHeaders)
    }
    return true
  }

  if (imageMatch) {
    if (request.method !== 'GET') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
      return true
    }

    const sourceUserId = imageMatch[1]
    const sourceDraftId = parseDraftId(imageMatch[2])
    const imageId = imageMatch[3]
    if (!isUuid(sourceUserId) || !sourceDraftId || !isUuid(imageId)) {
      sendJson(response, 400, { ok: false, message: 'Invalid source image identity' }, corsHeaders)
      return true
    }

    try {
      const streamed = await streamSourceImage({
        response,
        corsHeaders,
        sourceUserId,
        sourceDraftId,
        imageId,
      })
      if (!streamed) {
        sendJson(response, 404, { ok: false, message: 'Source Draft image not found' }, corsHeaders)
      }
    } catch (error) {
      console.error('[Prompt Draft API] promotion source image failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to read source Draft image' }, corsHeaders)
    }
    return true
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
    return true
  }

  if (!isJsonRequest(request)) {
    sendJson(response, 415, { ok: false, message: 'Content-Type must be application/json' }, corsHeaders)
    return true
  }

  let body
  try {
    body = await readJsonBody(request)
  } catch (error) {
    const status = error?.code === 'PROMOTION_BODY_TOO_LARGE' ? 413 : 400
    sendJson(response, status, { ok: false, message: error?.message || 'Request body must contain valid JSON' }, corsHeaders)
    return true
  }

  const errors = validatePromotionBody(body)
  if (errors.length) {
    sendJson(response, 400, { ok: false, message: 'Validation failed', errors }, corsHeaders)
    return true
  }

  try {
    const item = await createPromotedArchiveItem(user, body)
    sendJson(response, 201, { ok: true, item }, corsHeaders)
  } catch (error) {
    if (error?.code === '23505') {
      if (error.constraint === 'prompt_archive_items_user_draft_source_uidx') {
        sendJson(response, 409, { ok: false, code: 'DRAFT_ALREADY_PROMOTED', message: 'This Draft is already linked to Prompt Archive' }, corsHeaders)
      } else {
        sendJson(response, 409, { ok: false, message: 'Telegram message id already exists in Prompt Archive' }, corsHeaders)
      }
      return true
    }
    if (error?.code === 'PROMOTION_SOURCE_NOT_FOUND') {
      sendJson(response, 404, { ok: false, message: error.message }, corsHeaders)
      return true
    }
    if (error?.code === 'ARCHIVE_METADATA_MISSING') {
      sendJson(response, 500, { ok: false, message: 'Prompt Archive channel metadata is unavailable' }, corsHeaders)
      return true
    }

    console.error('[Prompt Draft API] user Draft promotion failed', error)
    sendJson(response, 500, { ok: false, message: 'Failed to promote Draft to Prompt Archive' }, corsHeaders)
  }

  return true
}
