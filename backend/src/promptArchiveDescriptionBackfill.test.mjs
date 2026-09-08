import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import {
  assertManifestMatchesPublishedIds,
  normalizeDescriptionManifest,
} from './promptArchiveDescriptionBackfill.mjs'

test('description manifest requires founder-authored EN and FA for every entry', () => {
  const manifest = normalizeDescriptionManifest({
    6: { en: 'A concise English description.', fa: 'یک توضیح کوتاه فارسی.' },
  })

  assert.deepEqual(manifest.get(6), {
    en: 'A concise English description.',
    fa: 'یک توضیح کوتاه فارسی.',
  })

  assert.throws(
    () => normalizeDescriptionManifest({ 6: { en: 'English only' } }),
    /6\.fa/,
  )
  assert.throws(
    () => normalizeDescriptionManifest({ 6: { en: 'English', fa: 'فارسی', de: 'Nein' } }),
    /unsupported locales/,
  )
})

test('description manifest must exactly match the published public ids', () => {
  const manifest = normalizeDescriptionManifest({
    6: { en: 'Six', fa: 'شش' },
    9: { en: 'Nine', fa: 'نه' },
  })

  assert.doesNotThrow(() => assertManifestMatchesPublishedIds(manifest, [9, 6]))
  assert.throws(
    () => assertManifestMatchesPublishedIds(manifest, [6, 7]),
    /missing published ids: 7; extra\/non-published ids: 9/,
  )
})

test('backfill runner never selects protected Prompt fields', async () => {
  const source = await readFile(new URL('./backfill-prompt-archive-descriptions.mjs', import.meta.url), 'utf8')

  const publishedQueryMatch = source.match(
    /export const PUBLISHED_ID_QUERY = `([\s\S]*?)`/,
  )
  assert.ok(publishedQueryMatch)
  const publishedQuery = publishedQueryMatch[1]

  assert.match(publishedQuery, /public_id/i)
  assert.doesNotMatch(publishedQuery, /\bprompt\b/i)
  assert.doesNotMatch(publishedQuery, /\bvariants\b/i)
  assert.doesNotMatch(publishedQuery, /source_draft|storage_key|unlock|economy/i)
})
