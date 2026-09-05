import { access, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'
import { requestArchiveStorage, readStorageError } from './archiveStorage.mjs'

const { Pool } = pg
const SNAPSHOT_SCHEMA_VERSION = 3
const outputRoot = path.resolve(process.env.ARCHIVE_SNAPSHOT_OUTPUT_ROOT || '/archive-output')
const publicRoot = path.join(outputRoot, 'public')
const snapshotPath = path.join(publicRoot, 'data', 'prompts.json')
const mirrorRoot = path.join(publicRoot, 'prompts', '_snapshot')

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
function sameJson(a, b) { return stableJson(a) === stableJson(b) }
function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`)
  return value
}
function publicUrlToFilePath(urlPath) {
  const value = requireNonEmptyString(urlPath, 'Legacy image path')
  if (!value.startsWith('/') || value.startsWith('//')) throw new Error(`Legacy image path must be root-relative: ${value}`)
  const cleanPath = decodeURIComponent(value.split(/[?#]/, 1)[0])
  const candidate = path.resolve(publicRoot, `.${cleanPath}`)
  const prefix = `${publicRoot}${path.sep}`
  if (candidate !== publicRoot && !candidate.startsWith(prefix)) throw new Error(`Legacy image path escapes public root: ${value}`)
  return candidate
}
async function assertLocalAsset(urlPath) {
  const filePath = publicUrlToFilePath(urlPath)
  await access(filePath)
  const info = await stat(filePath)
  if (!info.isFile() || info.size <= 0) throw new Error(`Fallback asset is missing or empty: ${urlPath}`)
}
async function downloadStorageObject(key, destination) {
  const response = await requestArchiveStorage({ method: 'GET', key })
  if (!response.ok) throw await readStorageError(response)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!bytes.length) throw new Error(`Archive storage object is empty: ${key}`)
  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, bytes)
  return bytes.length
}
function mirrorUrls(publicId, imageId) {
  const base = `/prompts/_snapshot/${publicId}/${imageId}`
  return { fullUrl: `${base}/full.webp`, thumbnailUrl: `${base}/thumb.webp` }
}
async function normalizeImageForSnapshot(item, image, referencedMirrorDirs) {
  const position = Number(image.position)
  if (!Number.isInteger(position) || position < 0) throw new Error(`Archive item ${item.publicId} has invalid image position`)

  if (image.storageKey || image.thumbnailStorageKey) {
    const storageKey = requireNonEmptyString(image.storageKey, `Item ${item.publicId} full storage key`)
    const thumbnailStorageKey = requireNonEmptyString(image.thumbnailStorageKey, `Item ${item.publicId} thumbnail storage key`)
    const imageId = requireNonEmptyString(image.id, `Item ${item.publicId} image id`)
    const mirrorDir = path.join(mirrorRoot, String(item.publicId), imageId)
    const urls = mirrorUrls(item.publicId, imageId)
    await Promise.all([
      downloadStorageObject(storageKey, path.join(mirrorDir, 'full.webp')),
      downloadStorageObject(thumbnailStorageKey, path.join(mirrorDir, 'thumb.webp')),
    ])
    referencedMirrorDirs.add(path.resolve(mirrorDir))
    await Promise.all([assertLocalAsset(urls.fullUrl), assertLocalAsset(urls.thumbnailUrl)])
    return { position, ...urls }
  }

  const sourcePath = requireNonEmptyString(image.sourcePath, `Item ${item.publicId} legacy source path`)
  await assertLocalAsset(sourcePath)
  return { position, fullUrl: sourcePath, thumbnailUrl: sourcePath }
}

async function loadAuthoritativeArchive(client) {
  const metadataResult = await client.query(`
    SELECT channel, model_history, imported_at FROM prompt_archive_metadata WHERE id = 1 LIMIT 1
  `)
  const metadata = metadataResult.rows[0]
  if (!metadata) throw new Error('Prompt Archive metadata is missing')

  const itemsResult = await client.query(`
    SELECT
      items.id,
      items.public_id AS "publicId",
      items.telegram_message_id AS "telegramMessageId",
      items.titles AS title,
      items.source_title AS "sourceTitle",
      items.telegram_url AS "telegramUrl",
      items.published_at AS "publishedAt",
      items.prompt,
      items.preview_model AS "previewModel",
      items.optimized_for AS "optimizedFor",
      items.variants,
      items.updated_at AS "updatedAt",
      COALESCE((
        SELECT json_agg(tags.slug ORDER BY tags.slug)
        FROM prompt_archive_item_tags it
        INNER JOIN prompt_archive_tags tags ON tags.id = it.tag_id
        WHERE it.archive_item_id = items.id
      ), '[]'::json) AS tags,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', images.id,
          'position', images.position,
          'sourcePath', images.source_path,
          'storageKey', images.storage_key,
          'thumbnailStorageKey', images.thumbnail_storage_key,
          'fullUrl', images.full_url,
          'thumbnailUrl', images.thumbnail_url
        ) ORDER BY images.position ASC)
        FROM prompt_archive_images images
        WHERE images.archive_item_id = items.id
      ), '[]'::json) AS images
    FROM prompt_archive_items items
    WHERE items.status = 'published'
    ORDER BY items.published_at DESC, items.public_id DESC
  `)

  return {
    channel: requireNonEmptyString(metadata.channel, 'Archive channel'),
    modelHistory: Array.isArray(metadata.model_history) ? metadata.model_history : [],
    importedAt: metadata.imported_at,
    rows: itemsResult.rows,
  }
}

async function buildSnapshot(authoritative) {
  const referencedMirrorDirs = new Set()
  const items = []

  for (const row of authoritative.rows) {
    const publicId = Number(row.publicId)
    if (!Number.isSafeInteger(publicId) || publicId <= 0) throw new Error(`Invalid Archive public id: ${row.publicId}`)
    if (!row.title?.en?.trim() || !row.title?.fa?.trim()) throw new Error(`Archive item ${publicId} is missing localized titles`)
    if (!Array.isArray(row.images)) throw new Error(`Archive item ${publicId} images are invalid`)

    const images = []
    for (const image of row.images) images.push(await normalizeImageForSnapshot(row, image, referencedMirrorDirs))
    images.sort((a, b) => a.position - b.position)
    images.forEach((image, index) => {
      if (image.position !== index) throw new Error(`Archive item ${publicId} image positions are not contiguous from zero`)
    })

    items.push({
      id: publicId,
      title: { en: row.title.en.trim(), fa: row.title.fa.trim() },
      sourceTitle: typeof row.sourceTitle === 'string' ? row.sourceTitle : '',
      publishedAt: new Date(row.publishedAt).toISOString(),
      telegramUrl: typeof row.telegramUrl === 'string' && row.telegramUrl.trim() ? row.telegramUrl : null,
      model: {
        previewGeneratedWith: requireNonEmptyString(row.previewModel, `Item ${publicId} preview model`),
        optimizedFor: Array.isArray(row.optimizedFor) ? [...row.optimizedFor] : [],
      },
      images,
      prompt: requireNonEmptyString(row.prompt, `Item ${publicId} prompt`),
      tags: Array.isArray(row.tags) ? [...row.tags].sort() : [],
      variants: Array.isArray(row.variants) ? row.variants : [],
    })
  }

  const latestUpdatedAt = authoritative.rows.reduce((latest, row) => {
    const time = new Date(row.updatedAt).getTime()
    return Number.isFinite(time) && time > latest ? time : latest
  }, 0)
  const fallbackTime = new Date(authoritative.importedAt || 0).getTime()
  const updatedAt = new Date(latestUpdatedAt || fallbackTime || 0).toISOString()
  return {
    payload: {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      channel: authoritative.channel,
      updatedAt,
      modelHistory: authoritative.modelHistory,
      items,
    },
    referencedMirrorDirs,
  }
}

function addMismatch(report, category, identifier, expected, actual) {
  report.mismatches.push({ category, identifier, expected, actual })
  report.categories[category] = (report.categories[category] || 0) + 1
}
function buildParityReport(authoritative, payload) {
  const report = {
    ok: true,
    publishedItemCount: authoritative.rows.length,
    snapshotItemCount: payload.items.length,
    mismatchCount: 0,
    categories: {},
    mismatches: [],
  }
  if (payload.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) addMismatch(report, 'schemaVersion', 'archive', SNAPSHOT_SCHEMA_VERSION, payload.schemaVersion)
  if (payload.channel !== authoritative.channel) addMismatch(report, 'channel', 'archive', authoritative.channel, payload.channel)
  if (payload.items.length !== authoritative.rows.length) addMismatch(report, 'itemCount', 'archive', authoritative.rows.length, payload.items.length)

  const rowsById = new Map(authoritative.rows.map(row => [Number(row.publicId), row]))
  const expectedIds = [...rowsById.keys()].sort((a, b) => a - b)
  const actualIds = payload.items.map(item => item.id).sort((a, b) => a - b)
  if (!sameJson(expectedIds, actualIds)) addMismatch(report, 'publicIds', 'archive', expectedIds, actualIds)

  for (const item of payload.items) {
    const row = rowsById.get(item.id)
    if (!row) continue
    if (!sameJson(item.title, row.title)) addMismatch(report, 'titles', item.id, row.title, item.title)
    if (item.prompt !== row.prompt) addMismatch(report, 'promptBodies', item.id, row.prompt, item.prompt)
    if (new Date(item.publishedAt).getTime() !== new Date(row.publishedAt).getTime()) addMismatch(report, 'publishedDates', item.id, row.publishedAt, item.publishedAt)
    const expectedTelegramUrl = typeof row.telegramUrl === 'string' && row.telegramUrl.trim() ? row.telegramUrl : null
    if (item.telegramUrl !== expectedTelegramUrl) addMismatch(report, 'telegramUrls', item.id, expectedTelegramUrl, item.telegramUrl)
    const expectedModel = { previewGeneratedWith: row.previewModel, optimizedFor: Array.isArray(row.optimizedFor) ? row.optimizedFor : [] }
    if (!sameJson(item.model, expectedModel)) addMismatch(report, 'modelFields', item.id, expectedModel, item.model)
    const expectedTags = Array.isArray(row.tags) ? [...row.tags].sort() : []
    if (!sameJson(item.tags, expectedTags)) addMismatch(report, 'tags', item.id, expectedTags, item.tags)
    const expectedVariants = Array.isArray(row.variants) ? row.variants : []
    if (!sameJson(item.variants, expectedVariants)) addMismatch(report, 'variants', item.id, expectedVariants, item.variants)
    if (item.images.length !== row.images.length) addMismatch(report, 'imageCounts', item.id, row.images.length, item.images.length)
    const positions = item.images.map(image => image.position)
    const expectedPositions = row.images.map(image => Number(image.position))
    if (!sameJson(positions, expectedPositions)) addMismatch(report, 'imageOrdering', item.id, expectedPositions, positions)
  }
  report.mismatchCount = report.mismatches.length
  report.ok = report.mismatchCount === 0
  return report
}

async function pruneStaleMirrors(referencedMirrorDirs) {
  let publicEntries
  try { publicEntries = await readdir(mirrorRoot, { withFileTypes: true }) }
  catch (error) { if (error?.code === 'ENOENT') return; throw error }

  for (const publicEntry of publicEntries) {
    if (!publicEntry.isDirectory()) continue
    const publicDir = path.join(mirrorRoot, publicEntry.name)
    const imageEntries = await readdir(publicDir, { withFileTypes: true })
    for (const imageEntry of imageEntries) {
      if (!imageEntry.isDirectory()) continue
      const imageDir = path.resolve(publicDir, imageEntry.name)
      if (!referencedMirrorDirs.has(imageDir)) await rm(imageDir, { recursive: true, force: true })
    }
    if (!(await readdir(publicDir)).length) await rm(publicDir, { recursive: true, force: true })
  }
}

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'prompt_draft',
  user: process.env.DB_USER || 'prompt_draft',
  password: process.env.DB_PASSWORD || 'prompt_draft_dev',
  connectionTimeoutMillis: 3000,
})

let client
try {
  await mkdir(path.dirname(snapshotPath), { recursive: true })
  await mkdir(mirrorRoot, { recursive: true })
  client = await pool.connect()
  const authoritative = await loadAuthoritativeArchive(client)
  const { payload, referencedMirrorDirs } = await buildSnapshot(authoritative)
  const report = buildParityReport(authoritative, payload)

  if (!report.ok) {
    console.error(JSON.stringify({ archiveSnapshot: 'PARITY_FAILED', ...report }, null, 2))
    process.exitCode = 2
  } else {
    await writeFile(snapshotPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
    const persisted = JSON.parse(await readFile(snapshotPath, 'utf8'))
    if (!sameJson(persisted, payload)) throw new Error('Persisted Archive snapshot differs from generated payload')
    await pruneStaleMirrors(referencedMirrorDirs)
    console.log(JSON.stringify({
      archiveSnapshot: 'PARITY_OK',
      ...report,
      schemaVersion: payload.schemaVersion,
      updatedAt: payload.updatedAt,
      output: snapshotPath,
      mirroredManagedImageCount: referencedMirrorDirs.size,
      legacyMediaStrategy: 'local-assets-retained',
    }, null, 2))
  }
} catch (error) {
  console.error('[prompt archive snapshot] failed:', error)
  process.exitCode = 1
} finally {
  client?.release()
  await pool.end()
}
