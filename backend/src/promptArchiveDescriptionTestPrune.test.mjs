import assert from 'node:assert/strict'
import test from 'node:test'
import {
  IMAGE_KEYS_QUERY,
  ITEM_DELETE_QUERY,
  PROMPT_ARCHIVE_RESOURCE_TYPE,
  TARGET_SELECT_QUERY,
  UNLOCK_DELETE_QUERY,
  assertExpectedDescriptionTestRows,
  collectArchiveStorageKeys,
} from './promptArchiveDescriptionTestPrune.mjs'

const validRows = [
  { internalId: '00000000-0000-4000-8000-000000009002', publicId: 9002, titleEn: 'TEST', status: 'published' },
  { internalId: '00000000-0000-4000-8000-000000009003', publicId: 9003, titleEn: 'From Grassias', status: 'published' },
]

test('approved staging/test Archive deletion is exact and title guarded', () => {
  assert.deepEqual(assertExpectedDescriptionTestRows(validRows), validRows)
  assert.throws(
    () => assertExpectedDescriptionTestRows(validRows.slice(0, 1)),
    /Expected 2 approved staging\/test Archive rows/,
  )
  assert.throws(
    () => assertExpectedDescriptionTestRows([
      validRows[0],
      { ...validRows[1], titleEn: 'Changed production title' },
    ]),
    /title changed/,
  )
  assert.throws(
    () => assertExpectedDescriptionTestRows([
      validRows[0],
      { ...validRows[1], status: 'draft' },
    ]),
    /no longer published/,
  )
})

test('storage cleanup deduplicates only persisted Archive object keys', () => {
  assert.deepEqual(
    collectArchiveStorageKeys([
      { storageKey: 'archive/a/full.webp', thumbnailStorageKey: 'archive/a/thumb.webp' },
      { storageKey: 'archive/a/full.webp', thumbnailStorageKey: '  ' },
      { storageKey: null, thumbnailStorageKey: 'archive/b/thumb.webp' },
    ]),
    ['archive/a/full.webp', 'archive/a/thumb.webp', 'archive/b/thumb.webp'],
  )
})

test('prune SQL remains narrowly scoped and never reads protected Prompt content', () => {
  const sql = [
    TARGET_SELECT_QUERY,
    IMAGE_KEYS_QUERY,
    UNLOCK_DELETE_QUERY,
    ITEM_DELETE_QUERY,
  ].join('\n').toLowerCase()

  assert.equal(PROMPT_ARCHIVE_RESOURCE_TYPE, 'prompt_archive_item')
  assert.match(TARGET_SELECT_QUERY, /public_id = ANY\(\$1::integer\[\]\)/)
  assert.match(ITEM_DELETE_QUERY, /WHERE id = ANY\(\$1::uuid\[\]\)/)
  assert.doesNotMatch(sql, /\bvariants\b/)
  assert.doesNotMatch(sql, /\bitems\.prompt\b/)
  assert.doesNotMatch(sql, /\bsource_draft\b/)
  assert.doesNotMatch(sql, /\busers\b/)
})
