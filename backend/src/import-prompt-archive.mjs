import { randomUUID } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '../..')
const sourceRoots = [process.env.ARCHIVE_SOURCE_ROOT, repositoryRoot, '/archive-source'].filter(Boolean)

async function firstExistingPath(relativeCandidates) {
  for (const root of sourceRoots) {
    for (const relativePath of relativeCandidates) {
      const candidate = path.resolve(root, relativePath)
      try {
        await access(candidate)
        return candidate
      } catch {
        // Try next candidate.
      }
    }
  }
  throw new Error(`Archive source file not found: ${relativeCandidates.join(' or ')}`)
}

function loadTrustedLocaleObject(source, filePath) {
  const marker = 'export default'
  const markerIndex = source.indexOf(marker)
  if (markerIndex < 0) throw new Error(`Locale file has no default export: ${filePath}`)
  const expression = source.slice(markerIndex + marker.length).trim().replace(/;\s*$/, '')
  try {
    return Function(`"use strict"; return (${expression});`)()
  } catch (error) {
    throw new Error(`Cannot evaluate trusted locale source ${filePath}: ${error.message}`)
  }
}

function readByPath(object, keyPath) {
  return keyPath.split('.').reduce((value, segment) => value?.[segment], object)
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`)
  return value
}

function requireInteger(value, label) {
  if (!Number.isInteger(value)) throw new Error(`${label} must be an integer`)
  return value
}

function requireStringArray(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    throw new Error(`${label} must be an array of non-empty strings`)
  }
  return value
}

function normalizeTags(tags, itemId) {
  const canonical = tags.map((tag) => tag.trim().toLowerCase())
  if (tags.some((tag, index) => tag !== canonical[index])) {
    throw new Error(`Item ${itemId} contains a non-canonical tag`)
  }
  if (new Set(canonical).size !== canonical.length) throw new Error(`Item ${itemId} contains duplicate tags`)
  return canonical
}

function validateVariant(variant, itemId, index) {
  if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
    throw new Error(`Item ${itemId} variant ${index} must be an object`)
  }
  requireString(variant.key, `Item ${itemId} variant ${index}.key`)
  requireString(variant.prompt, `Item ${itemId} variant ${index}.prompt`)
  requireString(variant.label?.en, `Item ${itemId} variant ${index}.label.en`)
  requireString(variant.label?.fa, `Item ${itemId} variant ${index}.label.fa`)
  return variant
}

function normalizeImages(value, itemId, normalizedSnapshot) {
  if (!Array.isArray(value)) throw new Error(`Item ${itemId}.images must be an array`)
  if (!normalizedSnapshot) {
    return requireStringArray(value, `Item ${itemId}.images`).map((fullUrl, position) => ({
      position, fullUrl, thumbnailUrl: fullUrl, normalizedSnapshot: false,
    }))
  }

  return value.map((image, index) => {
    if (!image || typeof image !== 'object' || Array.isArray(image)) {
      throw new Error(`Item ${itemId}.images[${index}] must be an object`)
    }
    const position = requireInteger(image.position, `Item ${itemId}.images[${index}].position`)
    if (position !== index) throw new Error(`Item ${itemId} image positions must be contiguous from zero`)
    const fullUrl = requireString(image.fullUrl, `Item ${itemId}.images[${index}].fullUrl`)
    const thumbnailUrl = typeof image.thumbnailUrl === 'string' && image.thumbnailUrl.trim()
      ? image.thumbnailUrl
      : fullUrl
    return { position, fullUrl, thumbnailUrl, normalizedSnapshot: true }
  })
}

function normalizeArchivePayload(payload, enMessages, faMessages) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Archive payload must be an object')

  const schemaVersion = requireInteger(payload.schemaVersion, 'schemaVersion')
  const normalizedSnapshot = schemaVersion >= 3
  const channel = requireString(payload.channel, 'channel')
  const updatedAt = requireString(payload.updatedAt, 'updatedAt')
  const modelHistory = Array.isArray(payload.modelHistory) ? payload.modelHistory : null
  if (!modelHistory) throw new Error('modelHistory must be an array')
  if (!Array.isArray(payload.items)) throw new Error('items must be an array')

  const seenIds = new Set()
  const items = payload.items.map((item, itemIndex) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`items[${itemIndex}] must be an object`)

    const telegramMessageId = requireInteger(item.id, `items[${itemIndex}].id`)
    if (telegramMessageId <= 0) throw new Error(`Item ${telegramMessageId} id must be positive`)
    if (seenIds.has(telegramMessageId)) throw new Error(`Duplicate Telegram message id ${telegramMessageId}`)
    seenIds.add(telegramMessageId)

    let titleKey = null
    let titleEn
    let titleFa
    if (normalizedSnapshot) {
      titleEn = requireString(item.title?.en, `Item ${telegramMessageId}.title.en`)
      titleFa = requireString(item.title?.fa, `Item ${telegramMessageId}.title.fa`)
      titleKey = typeof item.titleKey === 'string' && item.titleKey.trim() ? item.titleKey : null
    } else {
      titleKey = requireString(item.titleKey, `Item ${telegramMessageId}.titleKey`)
      titleEn = requireString(readByPath(enMessages, titleKey), `Resolved EN title for ${titleKey}`)
      titleFa = requireString(readByPath(faMessages, titleKey), `Resolved FA title for ${titleKey}`)
    }

    const publishedAt = requireString(item.publishedAt, `Item ${telegramMessageId}.publishedAt`)
    if (Number.isNaN(Date.parse(publishedAt))) throw new Error(`Item ${telegramMessageId}.publishedAt is not a valid date`)

    return {
      telegramMessageId,
      title: { en: titleEn, fa: titleFa },
      titleKey,
      sourceTitle: typeof item.sourceTitle === 'string' ? item.sourceTitle : '',
      publishedAt,
      telegramUrl: requireString(item.telegramUrl, `Item ${telegramMessageId}.telegramUrl`),
      previewGeneratedWith: requireString(item.model?.previewGeneratedWith, `Item ${telegramMessageId}.model.previewGeneratedWith`),
      optimizedFor: requireStringArray(item.model?.optimizedFor, `Item ${telegramMessageId}.model.optimizedFor`),
      images: normalizeImages(item.images, telegramMessageId, normalizedSnapshot),
      prompt: requireString(item.prompt, `Item ${telegramMessageId}.prompt`),
      tags: normalizeTags(requireStringArray(item.tags, `Item ${telegramMessageId}.tags`), telegramMessageId),
      variants: (item.variants ?? []).map((variant, index) => validateVariant(variant, telegramMessageId, index)),
    }
  })

  return { schemaVersion, channel, updatedAt, modelHistory, items, normalizedSnapshot }
}

function mimeTypeFromPath(sourcePath) {
  const lower = sourcePath.toLowerCase()
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return null
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function sameJson(first, second) {
  return stableJson(first) === stableJson(second)
}

function addMismatch(report, category, identifier, expected, actual) {
  report.mismatches.push({ category, identifier, expected, actual })
  report.categories[category] = (report.categories[category] ?? 0) + 1
}

async function assertImporterOwnsSourceRows(client, source) {
  if (!source.items.length) return
  const result = await client.query(
    `
      SELECT telegram_message_id
      FROM prompt_archive_items
      WHERE source_kind = 'managed'
        AND telegram_message_id = ANY($1::int[])
      ORDER BY telegram_message_id
      LIMIT 20
    `,
    [source.items.map((item) => item.telegramMessageId)],
  )
  if (!result.rows.length) return

  const ids = result.rows.map((row) => row.telegram_message_id).join(', ')
  throw new Error(
    `Archive bootstrap import is locked because snapshot rows are now managed by /manage/archive (Telegram ids: ${ids}). ` +
    'The bootstrap importer must not overwrite managed Archive edits.',
  )
}

async function importArchive(client, source) {
  await client.query('BEGIN')
  try {
    await client.query(
      `
        INSERT INTO prompt_archive_metadata (id, schema_version, channel, source_updated_at, model_history, imported_at)
        VALUES (1, $1, $2, $3, $4::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET
          schema_version = EXCLUDED.schema_version,
          channel = EXCLUDED.channel,
          source_updated_at = EXCLUDED.source_updated_at,
          model_history = EXCLUDED.model_history,
          imported_at = NOW()
      `,
      [source.schemaVersion, source.channel, source.updatedAt, JSON.stringify(source.modelHistory)],
    )

    const canonicalTags = [...new Set(source.items.flatMap((item) => item.tags))].sort()
    for (const slug of canonicalTags) {
      await client.query(
        `INSERT INTO prompt_archive_tags (id, slug, source_kind)
         VALUES ($1, $2, 'legacy_json')
         ON CONFLICT (slug) DO NOTHING`,
        [randomUUID(), slug],
      )
    }

    for (const item of source.items) {
      const itemResult = await client.query(
        `
          INSERT INTO prompt_archive_items (
            id, telegram_message_id, channel, titles, legacy_title_key, source_title, telegram_url,
            published_at, prompt, preview_model, optimized_for, variants, status, source_kind, updated_at
          )
          VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11::text[], $12::jsonb, 'published', 'legacy_json', NOW())
          ON CONFLICT (telegram_message_id) DO UPDATE SET
            channel = EXCLUDED.channel,
            titles = EXCLUDED.titles,
            legacy_title_key = EXCLUDED.legacy_title_key,
            source_title = EXCLUDED.source_title,
            telegram_url = EXCLUDED.telegram_url,
            published_at = EXCLUDED.published_at,
            prompt = EXCLUDED.prompt,
            preview_model = EXCLUDED.preview_model,
            optimized_for = EXCLUDED.optimized_for,
            variants = EXCLUDED.variants,
            source_kind = 'legacy_json',
            updated_at = NOW()
          RETURNING id
        `,
        [
          randomUUID(), item.telegramMessageId, source.channel, JSON.stringify(item.title), item.titleKey,
          item.sourceTitle, item.telegramUrl, item.publishedAt, item.prompt, item.previewGeneratedWith,
          item.optimizedFor, JSON.stringify(item.variants),
        ],
      )

      const archiveItemId = itemResult.rows[0].id
      await client.query('DELETE FROM prompt_archive_item_tags WHERE archive_item_id = $1', [archiveItemId])
      if (item.tags.length) {
        await client.query(
          `INSERT INTO prompt_archive_item_tags (archive_item_id, tag_id)
           SELECT $1, id FROM prompt_archive_tags WHERE slug = ANY($2::text[])`,
          [archiveItemId, item.tags],
        )
      }

      for (const image of item.images) {
        await client.query(
          `
            INSERT INTO prompt_archive_images (
              id, archive_item_id, position, source_path, full_url, thumbnail_url, mime_type, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (archive_item_id, position) DO UPDATE SET
              source_path = EXCLUDED.source_path,
              full_url = COALESCE(EXCLUDED.full_url, prompt_archive_images.full_url),
              thumbnail_url = COALESCE(EXCLUDED.thumbnail_url, prompt_archive_images.thumbnail_url),
              mime_type = EXCLUDED.mime_type,
              updated_at = NOW()
          `,
          [
            randomUUID(), archiveItemId, image.position, image.fullUrl,
            image.normalizedSnapshot ? image.fullUrl : null,
            image.normalizedSnapshot ? image.thumbnailUrl : null,
            mimeTypeFromPath(image.fullUrl),
          ],
        )
      }

      await client.query(
        'DELETE FROM prompt_archive_images WHERE archive_item_id = $1 AND position >= $2',
        [archiveItemId, item.images.length],
      )
    }

    await client.query(
      `DELETE FROM prompt_archive_items
       WHERE source_kind = 'legacy_json'
         AND NOT (telegram_message_id = ANY($1::int[]))`,
      [source.items.map((item) => item.telegramMessageId)],
    )

    await client.query(`
      DELETE FROM prompt_archive_tags t
      WHERE t.source_kind = 'legacy_json'
        AND NOT EXISTS (SELECT 1 FROM prompt_archive_item_tags it WHERE it.tag_id = t.id)
    `)

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function buildParityReport(client, source) {
  const [metadataResult, itemsResult, tagsResult, imagesResult, catalogResult] = await Promise.all([
    client.query('SELECT schema_version, channel, source_updated_at, model_history FROM prompt_archive_metadata WHERE id = 1'),
    client.query(`
      SELECT telegram_message_id, channel, titles, legacy_title_key, source_title, telegram_url, published_at,
             prompt, preview_model, optimized_for, variants
      FROM prompt_archive_items WHERE source_kind = 'legacy_json' ORDER BY telegram_message_id
    `),
    client.query(`
      SELECT i.telegram_message_id, t.slug
      FROM prompt_archive_item_tags it
      JOIN prompt_archive_items i ON i.id = it.archive_item_id
      JOIN prompt_archive_tags t ON t.id = it.tag_id
      WHERE i.source_kind = 'legacy_json'
      ORDER BY i.telegram_message_id, t.slug
    `),
    client.query(`
      SELECT i.telegram_message_id, pi.position, pi.source_path, pi.full_url, pi.thumbnail_url
      FROM prompt_archive_images pi
      JOIN prompt_archive_items i ON i.id = pi.archive_item_id
      WHERE i.source_kind = 'legacy_json'
      ORDER BY i.telegram_message_id, pi.position
    `),
    client.query(`
      SELECT DISTINCT t.slug
      FROM prompt_archive_tags t
      JOIN prompt_archive_item_tags it ON it.tag_id = t.id
      JOIN prompt_archive_items i ON i.id = it.archive_item_id
      WHERE i.source_kind = 'legacy_json'
      ORDER BY t.slug
    `),
  ])

  const expectedCatalog = [...new Set(source.items.flatMap((item) => item.tags))].sort()
  const actualCatalog = catalogResult.rows.map((row) => row.slug)
  const report = {
    ok: true,
    sourceItemCount: source.items.length,
    databaseItemCount: itemsResult.rows.length,
    canonicalTagCount: expectedCatalog.length,
    databaseCanonicalTagCount: actualCatalog.length,
    mismatchCount: 0,
    categories: {},
    mismatches: [],
  }

  const metadata = metadataResult.rows[0]
  if (!metadata || metadata.schema_version !== source.schemaVersion) addMismatch(report, 'metadata.schemaVersion', 'archive', source.schemaVersion, metadata?.schema_version)
  if (!metadata || metadata.channel !== source.channel) addMismatch(report, 'metadata.channel', 'archive', source.channel, metadata?.channel)
  if (!metadata || metadata.source_updated_at !== source.updatedAt) addMismatch(report, 'metadata.updatedAt', 'archive', source.updatedAt, metadata?.source_updated_at)
  if (!metadata || !sameJson(metadata.model_history, source.modelHistory)) addMismatch(report, 'metadata.modelHistory', 'archive', source.modelHistory, metadata?.model_history)
  if (itemsResult.rows.length !== source.items.length) addMismatch(report, 'itemCount', 'archive', source.items.length, itemsResult.rows.length)

  const expectedIds = source.items.map((item) => item.telegramMessageId).sort((a, b) => a - b)
  const actualIds = itemsResult.rows.map((row) => row.telegram_message_id).sort((a, b) => a - b)
  if (!sameJson(expectedIds, actualIds)) addMismatch(report, 'telegramIds', 'archive', expectedIds, actualIds)
  if (!sameJson(expectedCatalog, actualCatalog)) addMismatch(report, 'canonicalTags', 'archive', expectedCatalog, actualCatalog)

  const rowsById = new Map(itemsResult.rows.map((row) => [row.telegram_message_id, row]))
  const tagsById = new Map()
  for (const row of tagsResult.rows) {
    const values = tagsById.get(row.telegram_message_id) ?? []
    values.push(row.slug)
    tagsById.set(row.telegram_message_id, values)
  }
  const imagesById = new Map()
  for (const row of imagesResult.rows) {
    const values = imagesById.get(row.telegram_message_id) ?? []
    values.push(row)
    imagesById.set(row.telegram_message_id, values)
  }

  for (const item of source.items) {
    const row = rowsById.get(item.telegramMessageId)
    if (!row) continue
    if (row.channel !== source.channel) addMismatch(report, 'channels', item.telegramMessageId, source.channel, row.channel)
    if (row.legacy_title_key !== item.titleKey) addMismatch(report, 'legacyTitleKeys', item.telegramMessageId, item.titleKey, row.legacy_title_key)
    if (row.titles?.en !== item.title.en) addMismatch(report, 'titles.en', item.telegramMessageId, item.title.en, row.titles?.en)
    if (row.titles?.fa !== item.title.fa) addMismatch(report, 'titles.fa', item.telegramMessageId, item.title.fa, row.titles?.fa)
    if (row.source_title !== item.sourceTitle) addMismatch(report, 'sourceTitles', item.telegramMessageId, item.sourceTitle, row.source_title)
    if (row.telegram_url !== item.telegramUrl) addMismatch(report, 'telegramUrls', item.telegramMessageId, item.telegramUrl, row.telegram_url)
    if (row.prompt !== item.prompt) addMismatch(report, 'promptBodies', item.telegramMessageId, item.prompt, row.prompt)
    if (new Date(row.published_at).getTime() !== new Date(item.publishedAt).getTime()) addMismatch(report, 'publishedDates', item.telegramMessageId, item.publishedAt, row.published_at)
    if (row.preview_model !== item.previewGeneratedWith || !sameJson(row.optimized_for, item.optimizedFor)) {
      addMismatch(report, 'modelFields', item.telegramMessageId,
        { previewGeneratedWith: item.previewGeneratedWith, optimizedFor: item.optimizedFor },
        { previewGeneratedWith: row.preview_model, optimizedFor: row.optimized_for })
    }
    const expectedTags = item.tags.slice().sort()
    const actualTags = (tagsById.get(item.telegramMessageId) ?? []).slice().sort()
    if (!sameJson(expectedTags, actualTags)) addMismatch(report, 'tags', item.telegramMessageId, expectedTags, actualTags)
    if (!sameJson(row.variants, item.variants)) addMismatch(report, 'variants', item.telegramMessageId, item.variants, row.variants)

    const actualImages = imagesById.get(item.telegramMessageId) ?? []
    if (actualImages.length !== item.images.length) addMismatch(report, 'imageCounts', item.telegramMessageId, item.images.length, actualImages.length)
    const expectedPaths = item.images.map((image) => image.fullUrl)
    const actualPaths = actualImages.map((image) => image.source_path)
    if (!sameJson(expectedPaths, actualPaths)) addMismatch(report, 'imagePaths', item.telegramMessageId, expectedPaths, actualPaths)
    if (source.normalizedSnapshot) {
      const expectedThumbs = item.images.map((image) => image.thumbnailUrl)
      const actualThumbs = actualImages.map((image) => image.thumbnail_url)
      if (!sameJson(expectedThumbs, actualThumbs)) addMismatch(report, 'thumbnailPaths', item.telegramMessageId, expectedThumbs, actualThumbs)
    }
  }

  report.mismatchCount = report.mismatches.length
  report.ok = report.mismatchCount === 0
  return report
}

const pool = new Pool({
  host: process.env.DB_HOST ?? 'db',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'prompt_draft',
  user: process.env.DB_USER ?? 'prompt_draft',
  password: process.env.DB_PASSWORD ?? 'prompt_draft_dev',
  connectionTimeoutMillis: 3000,
})

let client
try {
  const promptsPath = await firstExistingPath(['public/data/prompts.json', 'prompts.json'])
  const enPath = await firstExistingPath(['i18n/locales/en.ts', 'locales/en.ts'])
  const faPath = await firstExistingPath(['i18n/locales/fa.ts', 'locales/fa.ts'])
  const [payloadSource, enSource, faSource] = await Promise.all([
    readFile(promptsPath, 'utf8'), readFile(enPath, 'utf8'), readFile(faPath, 'utf8'),
  ])

  const source = normalizeArchivePayload(
    JSON.parse(payloadSource),
    loadTrustedLocaleObject(enSource, enPath),
    loadTrustedLocaleObject(faSource, faPath),
  )

  client = await pool.connect()
  await assertImporterOwnsSourceRows(client, source)
  await importArchive(client, source)
  const report = await buildParityReport(client, source)

  console.log(JSON.stringify({
    archiveImport: report.ok ? 'PARITY_OK' : 'PARITY_FAILED',
    sourceSchemaVersion: source.schemaVersion,
    normalizedSnapshot: source.normalizedSnapshot,
    ...report,
  }, null, 2))
  if (!report.ok) process.exitCode = 2
} catch (error) {
  console.error('[prompt archive import] failed:', error)
  process.exitCode = 1
} finally {
  client?.release()
  await pool.end()
}
