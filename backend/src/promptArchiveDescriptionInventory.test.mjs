import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPromptArchiveDescriptionInventory,
  mapPromptArchiveDescriptionInventoryRow,
  PROMPT_ARCHIVE_DESCRIPTION_INVENTORY_QUERY,
} from './promptArchiveDescriptionInventory.mjs'

test('description inventory query is published-only and never selects protected fields', () => {
  assert.match(PROMPT_ARCHIVE_DESCRIPTION_INVENTORY_QUERY, /items\.status\s*=\s*'published'/)
  for (const forbidden of [
    /items\.prompt/i,
    /items\.variants/i,
    /source_title/i,
    /source_draft/i,
    /storage_key/i,
    /user_content_unlocks/i,
    /user_economy/i,
  ]) {
    assert.doesNotMatch(PROMPT_ARCHIVE_DESCRIPTION_INVENTORY_QUERY, forbidden)
  }
})

test('description inventory mapper returns only the explicit safe review fields', () => {
  const mapped = mapPromptArchiveDescriptionInventoryRow({
    publicId: 486,
    title: { en: ' Object-Filled Pool Fashion Editorial ', fa: ' ادیتوریال فشن در استخر اشیا ' },
    tags: ['editorial', 'fashion', 'image-to-image'],
    previewUrl: ' https://example.test/486/thumb.webp ',
    publishedAt: new Date('2026-07-20T10:17:00.000Z'),
    description: { en: '', fa: '' },
    prompt: 'PROTECTED_SENTINEL',
    variants: ['PROTECTED_VARIANT_SENTINEL'],
    sourceTitle: 'PROTECTED_SOURCE_SENTINEL',
    storageKey: 'PROTECTED_STORAGE_SENTINEL',
  })

  assert.deepEqual(mapped, {
    publicId: 486,
    title: { en: 'Object-Filled Pool Fashion Editorial', fa: 'ادیتوریال فشن در استخر اشیا' },
    tags: ['editorial', 'fashion', 'image-to-image'],
    previewUrl: 'https://example.test/486/thumb.webp',
    publishedAt: '2026-07-20T10:17:00.000Z',
    description: { en: '', fa: '' },
  })
  assert.doesNotMatch(JSON.stringify(mapped), /PROTECTED_/)
})

test('description inventory includes deterministic count and ordering supplied by the query', () => {
  const inventory = buildPromptArchiveDescriptionInventory([
    {
      publicId: 486,
      title: { en: 'One', fa: 'یک' },
      tags: [],
      previewUrl: null,
      publishedAt: new Date('2026-07-20T10:17:00.000Z'),
      description: {},
    },
    {
      publicId: 511,
      title: { en: 'Two', fa: 'دو' },
      tags: ['portrait'],
      previewUrl: '/prompts/511/01.webp',
      publishedAt: new Date('2026-07-21T10:17:00.000Z'),
      description: { en: 'Existing EN', fa: 'Existing FA' },
    },
  ], new Date('2026-09-08T12:30:00.000Z'))

  assert.equal(inventory.schemaVersion, 1)
  assert.equal(inventory.generatedAt, '2026-09-08T12:30:00.000Z')
  assert.equal(inventory.publishedCount, 2)
  assert.deepEqual(inventory.items.map(item => item.publicId), [486, 511])
})
