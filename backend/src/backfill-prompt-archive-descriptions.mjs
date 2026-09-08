import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDatabase, queryDatabase, withDatabaseTransaction } from './database.mjs'
import {
  assertManifestMatchesPublishedIds,
  normalizeDescriptionManifest,
} from './promptArchiveDescriptionBackfill.mjs'

export const PUBLISHED_ID_QUERY = `
  SELECT public_id AS "publicId"
  FROM prompt_archive_items
  WHERE status = 'published'
  ORDER BY public_id ASC
`

export const DESCRIPTION_UPDATE_QUERY = `
  UPDATE prompt_archive_items
  SET descriptions = $2::jsonb
  WHERE public_id = $1
    AND status = 'published'
`

export async function backfillPromptArchiveDescriptions(manifestPath) {
  const manifestFile = resolve(manifestPath)
  const rawManifest = JSON.parse(await readFile(manifestFile, 'utf8'))
  const manifest = normalizeDescriptionManifest(rawManifest)

  const publishedResult = await queryDatabase(PUBLISHED_ID_QUERY)
  const publishedIds = publishedResult.rows.map(row => Number(row.publicId))
  assertManifestMatchesPublishedIds(manifest, publishedIds)

  await withDatabaseTransaction(async client => {
    for (const publicId of publishedIds) {
      const descriptions = manifest.get(publicId)
      const result = await client.query(
        DESCRIPTION_UPDATE_QUERY,
        [publicId, JSON.stringify(descriptions)],
      )
      if (result.rowCount !== 1) {
        throw new Error(`Published Archive row ${publicId} changed during description backfill`)
      }
    }
  })

  return { updatedCount: publishedIds.length }
}

async function main() {
  const manifestPath = process.argv[2]
  if (!manifestPath) {
    throw new Error(
      'Usage: npm run archive:backfill-descriptions -- <founder-reviewed-manifest.json>',
    )
  }

  const result = await backfillPromptArchiveDescriptions(manifestPath)
  console.log(`Backfilled localized descriptions for ${result.updatedCount} published Archive row(s).`)
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main()
    .catch(error => {
      console.error('[Prompt Archive descriptions] backfill failed:', error.message)
      process.exitCode = 1
    })
    .finally(() => closeDatabase())
}
