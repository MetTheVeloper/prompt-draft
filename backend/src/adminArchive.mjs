import { randomUUID } from 'node:crypto'
import { PERMISSIONS, hasPermission } from './authorization.mjs'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'

const ARCHIVE_MODELS = Object.freeze(['dall-e', 'gpt-image-1'])
const ARCHIVE_STATUSES = Object.freeze(['draft', 'published', 'archived'])
const ARCHIVE_MODEL_SET = new Set(ARCHIVE_MODELS)
const ARCHIVE_STATUS_SET = new Set(ARCHIVE_STATUSES)
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const MAX_QUERY_LENGTH = 200
const MAX_TITLE_LENGTH = 300
const MAX_SOURCE_TITLE_LENGTH = 5000
const MAX_PROMPT_LENGTH = 200000
const MAX_BODY_BYTES = 1024 * 1024
const MAX_TAG_COUNT = 50

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

function sendForbidden(response, corsHeaders, sendJson) {
  sendJson(response, 403, { ok: false, message: 'Forbidden' }, corsHeaders)
}

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

async function readJsonBody(request, response, corsHeaders, sendJson) {
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
    const chunks = []
    let totalBytes = 0

    for await (const chunk of request) {
      totalBytes += chunk.length
      if (totalBytes > MAX_BODY_BYTES) {
        sendJson(
          response,
          413,
          { ok: false, message: 'Archive request body is too large' },
          corsHeaders,
        )
        return null
      }
      chunks.push(chunk)
    }

    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
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

function encodeCursor(item) {
  return Buffer.from(
    JSON.stringify({
      updatedAt: item.updatedAt,
      id: item.id,
    }),
    'utf8',
  ).toString('base64url')
}

function decodeCursor(value) {
  if (!value) return null

  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))

    if (
      !isPlainObject(decoded) ||
      typeof decoded.updatedAt !== 'string' ||
      Number.isNaN(Date.parse(decoded.updatedAt)) ||
      !isUuid(decoded.id)
    ) {
      return undefined
    }

    return {
      updatedAt: new Date(decoded.updatedAt).toISOString(),
      id: decoded.id,
    }
  } catch {
    return undefined
  }
}

function parseListQuery(url) {
  const errors = []
  const rawLimit = url.searchParams.get('limit')
  const rawCursor = url.searchParams.get('cursor')
  const rawQuery = url.searchParams.get('query')
  const rawStatus = url.searchParams.get('status')
  const rawModel = url.searchParams.get('model')

  let limit = DEFAULT_LIMIT
  if (rawLimit !== null) {
    if (!/^\d+$/.test(rawLimit)) {
      errors.push({ field: 'limit', message: `limit must be an integer between 1 and ${MAX_LIMIT}` })
    } else {
      limit = Number(rawLimit)
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
        errors.push({ field: 'limit', message: `limit must be an integer between 1 and ${MAX_LIMIT}` })
      }
    }
  }

  const cursor = rawCursor === null ? null : decodeCursor(rawCursor)
  if (cursor === undefined) {
    errors.push({ field: 'cursor', message: 'cursor must be a valid Manage Archive cursor' })
  }

  const query = rawQuery?.trim() || ''
  if (query.length > MAX_QUERY_LENGTH) {
    errors.push({ field: 'query', message: `query must be up to ${MAX_QUERY_LENGTH} characters` })
  }

  const status = rawStatus?.trim() || ''
  if (status && !ARCHIVE_STATUS_SET.has(status)) {
    errors.push({ field: 'status', message: 'status must be draft, published, or archived' })
  }

  const model = rawModel?.trim() || ''
  if (model && !ARCHIVE_MODEL_SET.has(model)) {
    errors.push({ field: 'model', message: 'model must be dall-e or gpt-image-1' })
  }

  return {
    errors,
    limit,
    cursor: cursor || null,
    query,
    status,
    model,
  }
}

function validateArchiveInput(body) {
  const errors = []

  if (!isPlainObject(body)) {
    return [{ field: 'body', message: 'JSON body must be an object' }]
  }

  if (!Number.isSafeInteger(body.telegramMessageId) || body.telegramMessageId <= 0) {
    errors.push({ field: 'telegramMessageId', message: 'Telegram message id must be a positive integer' })
  }

  if (!isPlainObject(body.title)) {
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

  if (
    body.sourceTitle !== undefined &&
    body.sourceTitle !== null &&
    (typeof body.sourceTitle !== 'string' || body.sourceTitle.length > MAX_SOURCE_TITLE_LENGTH)
  ) {
    errors.push({
      field: 'sourceTitle',
      message: `sourceTitle must be a string up to ${MAX_SOURCE_TITLE_LENGTH} characters`,
    })
  }

  if (
    typeof body.publishedAt !== 'string' ||
    !body.publishedAt.trim() ||
    Number.isNaN(Date.parse(body.publishedAt))
  ) {
    errors.push({ field: 'publishedAt', message: 'publishedAt must be a valid timestamp' })
  }

  if (
    typeof body.prompt !== 'string' ||
    !body.prompt.trim() ||
    body.prompt.length > MAX_PROMPT_LENGTH
  ) {
    errors.push({
      field: 'prompt',
      message: `prompt must be a non-empty string up to ${MAX_PROMPT_LENGTH} characters`,
    })
  }

  if (!ARCHIVE_MODEL_SET.has(body.previewModel)) {
    errors.push({ field: 'previewModel', message: 'previewModel must be dall-e or gpt-image-1' })
  }

  if (
    !Array.isArray(body.optimizedFor) ||
    body.optimizedFor.length === 0 ||
    body.optimizedFor.some((value) => !ARCHIVE_MODEL_SET.has(value)) ||
    new Set(body.optimizedFor).size !== body.optimizedFor.length
  ) {
    errors.push({
      field: 'optimizedFor',
      message: 'optimizedFor must contain one or more unique supported models',
    })
  }

  if (
    !Array.isArray(body.tags) ||
    body.tags.length > MAX_TAG_COUNT ||
    body.tags.some((tag) => (
      typeof tag !== 'string' ||
      !tag.trim() ||
      tag !== tag.trim() ||
      tag !== tag.toLowerCase() ||
      /\s/.test(tag)
    )) ||
    new Set(body.tags).size !== body.tags.length
  ) {
    errors.push({
      field: 'tags',
      message: `tags must contain up to ${MAX_TAG_COUNT} unique canonical tag slugs`,
    })
  }

  return errors
}

function normalizeArchiveInput(body) {
  return {
    telegramMessageId: body.telegramMessageId,
    title: {
      en: body.title.en.trim(),
      fa: body.title.fa.trim(),
    },
    sourceTitle: typeof body.sourceTitle === 'string' && body.sourceTitle.trim()
      ? body.sourceTitle.trim()
      : null,
    publishedAt: new Date(body.publishedAt).toISOString(),
    prompt: body.prompt,
    previewModel: body.previewModel,
    optimizedFor: [...body.optimizedFor],
    tags: [...body.tags].sort((first, second) => first.localeCompare(second)),
  }
}

function mapSummaryRow(row) {
  return {
    id: row.id,
    telegramMessageId: Number(row.telegramMessageId),
    title: row.title,
    publishedAt: row.publishedAt.toISOString(),
    telegramUrl: row.telegramUrl,
    previewModel: row.previewModel,
    optimizedFor: Array.isArray(row.optimizedFor) ? row.optimizedFor : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status,
    sourceKind: row.sourceKind,
    imageCount: Number(row.imageCount) || 0,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapImage(value) {
  return {
    id: value.id,
    position: Number(value.position) || 0,
    sourcePath: value.sourcePath ?? null,
    storageKey: value.storageKey ?? null,
    fullUrl: value.fullUrl ?? value.sourcePath ?? null,
    thumbnailUrl: value.thumbnailUrl ?? value.fullUrl ?? value.sourcePath ?? null,
    width: value.width == null ? null : Number(value.width),
    height: value.height == null ? null : Number(value.height),
    thumbnailWidth: value.thumbnailWidth == null ? null : Number(value.thumbnailWidth),
    thumbnailHeight: value.thumbnailHeight == null ? null : Number(value.thumbnailHeight),
    mimeType: value.mimeType ?? null,
    sizeBytes: value.sizeBytes == null ? null : Number(value.sizeBytes),
    thumbnailSizeBytes: value.thumbnailSizeBytes == null ? null : Number(value.thumbnailSizeBytes),
  }
}

function mapDetailRow(row) {
  return {
    ...mapSummaryRow({
      ...row,
      imageCount: Array.isArray(row.images) ? row.images.length : 0,
    }),
    channel: row.channel,
    sourceTitle: row.sourceTitle ?? '',
    prompt: row.prompt,
    variants: Array.isArray(row.variants) ? row.variants : [],
    images: (Array.isArray(row.images) ? row.images : []).map(mapImage),
    createdAt: row.createdAt.toISOString(),
  }
}

function buildListWhere({ query, status, model, cursor }) {
  const values = []
  const conditions = []

  if (query) {
    values.push(query)
    const parameter = `$${values.length}`
    conditions.push(`(
      POSITION(LOWER(${parameter}) IN LOWER(CAST(items.telegram_message_id AS TEXT))) > 0
      OR POSITION(LOWER(${parameter}) IN LOWER(COALESCE(items.titles->>'en', ''))) > 0
      OR POSITION(LOWER(${parameter}) IN LOWER(COALESCE(items.titles->>'fa', ''))) > 0
      OR POSITION(LOWER(${parameter}) IN LOWER(COALESCE(items.source_title, ''))) > 0
      OR POSITION(LOWER(${parameter}) IN LOWER(items.prompt)) > 0
      OR EXISTS (
        SELECT 1
        FROM prompt_archive_item_tags search_item_tags
        INNER JOIN prompt_archive_tags search_tags ON search_tags.id = search_item_tags.tag_id
        WHERE search_item_tags.archive_item_id = items.id
          AND POSITION(LOWER(${parameter}) IN LOWER(search_tags.slug)) > 0
      )
    )`)
  }

  if (status) {
    values.push(status)
    conditions.push(`items.status = $${values.length}`)
  }

  if (model) {
    values.push(model)
    conditions.push(`items.preview_model = $${values.length}`)
  }

  if (cursor) {
    values.push(cursor.updatedAt, cursor.id)
    conditions.push(
      `(items.updated_at, items.id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`,
    )
  }

  return {
    values,
    whereClause: conditions.length ? `WHERE ${conditions.join('\n      AND ')}` : '',
  }
}

async function listArchiveItems(params) {
  const filter = buildListWhere(params)
  const values = [...filter.values, params.limit + 1]
  const limitParameter = `$${values.length}`

  const result = await queryDatabase(
    `
      SELECT
        items.id,
        items.telegram_message_id AS "telegramMessageId",
        items.titles AS title,
        items.published_at AS "publishedAt",
        items.telegram_url AS "telegramUrl",
        items.preview_model AS "previewModel",
        items.optimized_for AS "optimizedFor",
        items.status,
        items.source_kind AS "sourceKind",
        items.updated_at AS "updatedAt",
        COALESCE((
          SELECT json_agg(tags.slug ORDER BY tags.slug)
          FROM prompt_archive_item_tags item_tags
          INNER JOIN prompt_archive_tags tags ON tags.id = item_tags.tag_id
          WHERE item_tags.archive_item_id = items.id
        ), '[]'::json) AS tags,
        (
          SELECT COUNT(*)::integer
          FROM prompt_archive_images images
          WHERE images.archive_item_id = items.id
        ) AS "imageCount"
      FROM prompt_archive_items items
      ${filter.whereClause}
      ORDER BY items.updated_at DESC, items.id DESC
      LIMIT ${limitParameter}
    `,
    values,
  )

  const hasMore = result.rows.length > params.limit
  const items = result.rows.slice(0, params.limit).map(mapSummaryRow)
  const lastItem = items.at(-1)

  return {
    items,
    pageInfo: {
      hasMore,
      nextCursor: hasMore && lastItem ? encodeCursor(lastItem) : null,
    },
  }
}

async function getArchiveItemById(id) {
  const result = await queryDatabase(
    `
      SELECT
        items.id,
        items.telegram_message_id AS "telegramMessageId",
        items.channel,
        items.titles AS title,
        items.source_title AS "sourceTitle",
        items.telegram_url AS "telegramUrl",
        items.published_at AS "publishedAt",
        items.prompt,
        items.preview_model AS "previewModel",
        items.optimized_for AS "optimizedFor",
        items.variants,
        items.status,
        items.source_kind AS "sourceKind",
        items.created_at AS "createdAt",
        items.updated_at AS "updatedAt",
        COALESCE((
          SELECT json_agg(tags.slug ORDER BY tags.slug)
          FROM prompt_archive_item_tags item_tags
          INNER JOIN prompt_archive_tags tags ON tags.id = item_tags.tag_id
          WHERE item_tags.archive_item_id = items.id
        ), '[]'::json) AS tags,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', images.id,
              'position', images.position,
              'sourcePath', images.source_path,
              'storageKey', images.storage_key,
              'fullUrl', images.full_url,
              'thumbnailUrl', images.thumbnail_url,
              'width', images.width,
              'height', images.height,
              'thumbnailWidth', images.thumbnail_width,
              'thumbnailHeight', images.thumbnail_height,
              'mimeType', images.mime_type,
              'sizeBytes', images.size_bytes,
              'thumbnailSizeBytes', images.thumbnail_size_bytes
            ) ORDER BY images.position ASC
          )
          FROM prompt_archive_images images
          WHERE images.archive_item_id = items.id
        ), '[]'::json) AS images
      FROM prompt_archive_items items
      WHERE items.id = $1
      LIMIT 1
    `,
    [id],
  )

  return result.rows[0] ? mapDetailRow(result.rows[0]) : null
}

async function listCanonicalTags() {
  const result = await queryDatabase(`
    SELECT slug
    FROM prompt_archive_tags
    ORDER BY slug ASC
  `)
  return result.rows.map((row) => row.slug)
}

async function requireKnownTags(client, tags) {
  if (!tags.length) return

  const result = await client.query(
    `SELECT slug FROM prompt_archive_tags WHERE slug = ANY($1::text[])`,
    [tags],
  )
  const known = new Set(result.rows.map((row) => row.slug))
  const unknown = tags.filter((tag) => !known.has(tag))

  if (unknown.length) {
    const error = new Error(`Unknown Archive tags: ${unknown.join(', ')}`)
    error.code = 'ARCHIVE_UNKNOWN_TAGS'
    error.tags = unknown
    throw error
  }
}

async function getArchiveChannel(client) {
  const result = await client.query(
    `SELECT channel FROM prompt_archive_metadata WHERE id = 1 LIMIT 1`,
  )
  const channel = result.rows[0]?.channel

  if (typeof channel !== 'string' || !/^[A-Za-z0-9_]+$/.test(channel)) {
    const error = new Error('Prompt Archive channel metadata is missing or invalid')
    error.code = 'ARCHIVE_METADATA_MISSING'
    throw error
  }

  return channel
}

function telegramUrl(channel, telegramMessageId) {
  return `https://t.me/${channel}/${telegramMessageId}`
}

async function replaceTags(client, archiveItemId, tags) {
  await client.query(
    `DELETE FROM prompt_archive_item_tags WHERE archive_item_id = $1`,
    [archiveItemId],
  )

  if (!tags.length) return

  await client.query(
    `
      INSERT INTO prompt_archive_item_tags (archive_item_id, tag_id)
      SELECT $1, id
      FROM prompt_archive_tags
      WHERE slug = ANY($2::text[])
    `,
    [archiveItemId, tags],
  )
}

async function auditArchiveMutation(client, actor, action, metadata) {
  await client.query(
    `
      INSERT INTO admin_audit_log (
        id,
        actor_user_id,
        target_user_id,
        action,
        metadata
      )
      VALUES ($1, $2, NULL, $3, $4::jsonb)
    `,
    [randomUUID(), actor.id, action, JSON.stringify(metadata)],
  )
}

async function createArchiveItem(actor, input) {
  const id = randomUUID()

  await withDatabaseTransaction(async (client) => {
    await requireKnownTags(client, input.tags)
    const channel = await getArchiveChannel(client)

    await client.query(
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
          created_by,
          updated_by,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4::jsonb, NULL,
          $5, $6, $7, $8, $9,
          $10::text[], '[]'::jsonb, 'draft', 'managed',
          $11, $11, NOW(), NOW()
        )
      `,
      [
        id,
        input.telegramMessageId,
        channel,
        JSON.stringify(input.title),
        input.sourceTitle,
        telegramUrl(channel, input.telegramMessageId),
        input.publishedAt,
        input.prompt,
        input.previewModel,
        input.optimizedFor,
        actor.id,
      ],
    )

    await replaceTags(client, id, input.tags)
    await auditArchiveMutation(client, actor, 'archive.create', {
      archiveItemId: id,
      telegramMessageId: input.telegramMessageId,
      status: 'draft',
    })
  })

  return getArchiveItemById(id)
}

async function updateArchiveItem(actor, id, input) {
  await withDatabaseTransaction(async (client) => {
    const existingResult = await client.query(
      `
        SELECT telegram_message_id, status, source_kind
        FROM prompt_archive_items
        WHERE id = $1
        FOR UPDATE
      `,
      [id],
    )
    const existing = existingResult.rows[0]

    if (!existing) {
      const error = new Error('Archive item not found')
      error.code = 'ARCHIVE_NOT_FOUND'
      throw error
    }

    await requireKnownTags(client, input.tags)
    const channel = await getArchiveChannel(client)

    await client.query(
      `
        UPDATE prompt_archive_items
        SET telegram_message_id = $2,
            channel = $3,
            titles = $4::jsonb,
            source_title = $5,
            telegram_url = $6,
            published_at = $7,
            prompt = $8,
            preview_model = $9,
            optimized_for = $10::text[],
            status = 'draft',
            source_kind = 'managed',
            updated_by = $11,
            updated_at = NOW()
        WHERE id = $1
      `,
      [
        id,
        input.telegramMessageId,
        channel,
        JSON.stringify(input.title),
        input.sourceTitle,
        telegramUrl(channel, input.telegramMessageId),
        input.publishedAt,
        input.prompt,
        input.previewModel,
        input.optimizedFor,
        actor.id,
      ],
    )

    await replaceTags(client, id, input.tags)
    await auditArchiveMutation(client, actor, 'archive.update', {
      archiveItemId: id,
      telegramMessageId: input.telegramMessageId,
      previousTelegramMessageId: Number(existing.telegram_message_id),
      fromStatus: existing.status,
      toStatus: 'draft',
      fromSourceKind: existing.source_kind,
      toSourceKind: 'managed',
    })
  })

  return getArchiveItemById(id)
}

async function setArchiveStatus(actor, id, nextStatus) {
  await withDatabaseTransaction(async (client) => {
    const existingResult = await client.query(
      `
        SELECT telegram_message_id, status, source_kind
        FROM prompt_archive_items
        WHERE id = $1
        FOR UPDATE
      `,
      [id],
    )
    const existing = existingResult.rows[0]

    if (!existing) {
      const error = new Error('Archive item not found')
      error.code = 'ARCHIVE_NOT_FOUND'
      throw error
    }

    if (existing.status === nextStatus && existing.source_kind === 'managed') return

    await client.query(
      `
        UPDATE prompt_archive_items
        SET status = $2,
            source_kind = 'managed',
            updated_by = $3,
            updated_at = NOW()
        WHERE id = $1
      `,
      [id, nextStatus, actor.id],
    )

    const action = nextStatus === 'published'
      ? 'archive.publish'
      : nextStatus === 'archived'
        ? 'archive.archive'
        : 'archive.draft'

    await auditArchiveMutation(client, actor, action, {
      archiveItemId: id,
      telegramMessageId: Number(existing.telegram_message_id),
      fromStatus: existing.status,
      toStatus: nextStatus,
      fromSourceKind: existing.source_kind,
      toSourceKind: 'managed',
    })
  })

  return getArchiveItemById(id)
}

function handleKnownMutationError(error, response, corsHeaders, sendJson) {
  if (error?.code === '23505') {
    sendJson(
      response,
      409,
      { ok: false, message: 'Telegram message id already exists in Prompt Archive' },
      corsHeaders,
    )
    return true
  }

  if (error?.code === 'ARCHIVE_UNKNOWN_TAGS') {
    sendJson(
      response,
      400,
      {
        ok: false,
        message: 'Archive contains unknown tag selections',
        errors: (error.tags || []).map((tag) => ({
          field: 'tags',
          message: `Unknown canonical tag: ${tag}`,
        })),
      },
      corsHeaders,
    )
    return true
  }

  if (error?.code === 'ARCHIVE_NOT_FOUND') {
    sendJson(response, 404, { ok: false, message: 'Archive item not found' }, corsHeaders)
    return true
  }

  if (error?.code === 'ARCHIVE_METADATA_MISSING') {
    sendJson(
      response,
      500,
      { ok: false, message: 'Prompt Archive channel metadata is unavailable' },
      corsHeaders,
    )
    return true
  }

  return false
}

export async function handleAdminArchiveRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  user,
}) {
  const collection = url.pathname === '/api/admin/archive'
  const tagsCollection = url.pathname === '/api/admin/archive/tags'
  const detailMatch = url.pathname.match(/^\/api\/admin\/archive\/([0-9a-f-]{36})$/i)
  const statusMatch = url.pathname.match(
    /^\/api\/admin\/archive\/([0-9a-f-]{36})\/(draft|publish|archive)$/i,
  )

  if (!collection && !tagsCollection && !detailMatch && !statusMatch) return false

  const isMutation =
    (collection && request.method === 'POST') ||
    (detailMatch && request.method === 'PUT') ||
    Boolean(statusMatch)
  const requiredPermission = isMutation
    ? PERMISSIONS.ARCHIVE_MANAGE
    : PERMISSIONS.ARCHIVE_VIEW

  if (!hasPermission(user, requiredPermission)) {
    sendForbidden(response, corsHeaders, sendJson)
    return true
  }

  if (tagsCollection) {
    if (request.method !== 'GET') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
      return true
    }

    try {
      sendJson(response, 200, { ok: true, tags: await listCanonicalTags() }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] admin archive tags failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to list Archive tags' }, corsHeaders)
    }
    return true
  }

  if (collection && request.method === 'GET') {
    const params = parseListQuery(url)
    if (params.errors.length) {
      sendJson(
        response,
        400,
        { ok: false, message: 'Invalid Manage Archive query', errors: params.errors },
        corsHeaders,
      )
      return true
    }

    try {
      sendJson(response, 200, { ok: true, ...(await listArchiveItems(params)) }, corsHeaders)
    } catch (error) {
      console.error('[Prompt Draft API] admin archive list failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to list Prompt Archive items' }, corsHeaders)
    }
    return true
  }

  if (collection && request.method === 'POST') {
    const body = await readJsonBody(request, response, corsHeaders, sendJson)
    if (!body) return true

    const errors = validateArchiveInput(body)
    if (errors.length) {
      sendJson(response, 400, { ok: false, message: 'Validation failed', errors }, corsHeaders)
      return true
    }

    try {
      const item = await createArchiveItem(user, normalizeArchiveInput(body))
      sendJson(response, 201, { ok: true, item }, corsHeaders)
    } catch (error) {
      if (handleKnownMutationError(error, response, corsHeaders, sendJson)) return true
      console.error('[Prompt Draft API] admin archive create failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to create Archive item' }, corsHeaders)
    }
    return true
  }

  if (detailMatch) {
    const id = detailMatch[1]
    if (!isUuid(id)) {
      sendJson(response, 400, { ok: false, message: 'Invalid Archive item id' }, corsHeaders)
      return true
    }

    if (request.method === 'GET') {
      try {
        const item = await getArchiveItemById(id)
        if (!item) {
          sendJson(response, 404, { ok: false, message: 'Archive item not found' }, corsHeaders)
        } else {
          sendJson(response, 200, { ok: true, item }, corsHeaders)
        }
      } catch (error) {
        console.error('[Prompt Draft API] admin archive detail failed', error)
        sendJson(response, 500, { ok: false, message: 'Failed to read Archive item' }, corsHeaders)
      }
      return true
    }

    if (request.method === 'PUT') {
      const body = await readJsonBody(request, response, corsHeaders, sendJson)
      if (!body) return true

      const errors = validateArchiveInput(body)
      if (errors.length) {
        sendJson(response, 400, { ok: false, message: 'Validation failed', errors }, corsHeaders)
        return true
      }

      try {
        const item = await updateArchiveItem(user, id, normalizeArchiveInput(body))
        sendJson(response, 200, { ok: true, item }, corsHeaders)
      } catch (error) {
        if (handleKnownMutationError(error, response, corsHeaders, sendJson)) return true
        console.error('[Prompt Draft API] admin archive update failed', error)
        sendJson(response, 500, { ok: false, message: 'Failed to update Archive item' }, corsHeaders)
      }
      return true
    }

    sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
    return true
  }

  if (statusMatch) {
    const id = statusMatch[1]
    const action = statusMatch[2].toLowerCase()

    if (!isUuid(id)) {
      sendJson(response, 400, { ok: false, message: 'Invalid Archive item id' }, corsHeaders)
      return true
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
      return true
    }

    const nextStatus = action === 'publish'
      ? 'published'
      : action === 'archive'
        ? 'archived'
        : 'draft'

    try {
      const item = await setArchiveStatus(user, id, nextStatus)
      sendJson(response, 200, { ok: true, item }, corsHeaders)
    } catch (error) {
      if (handleKnownMutationError(error, response, corsHeaders, sendJson)) return true
      console.error('[Prompt Draft API] admin archive status change failed', error)
      sendJson(response, 500, { ok: false, message: 'Failed to change Archive status' }, corsHeaders)
    }
    return true
  }

  sendJson(response, 405, { ok: false, message: 'Method Not Allowed' }, corsHeaders)
  return true
}
