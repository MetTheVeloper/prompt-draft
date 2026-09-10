import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildBlogMediaStorageKeys,
  normalizeBlogMediaManifest,
  normalizeBlogMediaPrefix,
  parseBlogMediaListObjectsXml,
} from './adminBlogMedia.mjs'

test('Blog media prefix stays confined to normalized relative folder segments', () => {
  assert.equal(normalizeBlogMediaPrefix(''), '')
  assert.equal(normalizeBlogMediaPrefix('2026'), '2026/')
  assert.equal(normalizeBlogMediaPrefix('/2026/09/'), '2026/09/')
  assert.equal(normalizeBlogMediaPrefix('campaign-assets/set_1'), 'campaign-assets/set_1/')

  assert.throws(() => normalizeBlogMediaPrefix('../archive/'), /Invalid Blog media prefix/)
  assert.throws(() => normalizeBlogMediaPrefix('2026/../archive'), /Invalid Blog media prefix/)
  assert.throws(() => normalizeBlogMediaPrefix('2026\\09'), /Invalid Blog media prefix/)
})

test('managed Blog media keys are isolated under blog/year/month', () => {
  const keys = buildBlogMediaStorageKeys(
    new Date('2026-09-10T06:00:00.000Z'),
    '11111111-1111-4111-8111-111111111111',
  )

  assert.equal(keys.folder, '2026/09/')
  assert.equal(
    keys.fullKey,
    'blog/2026/09/11111111-1111-4111-8111-111111111111.full.webp',
  )
  assert.equal(
    keys.thumbnailKey,
    'blog/2026/09/11111111-1111-4111-8111-111111111111.thumb.webp',
  )
  assert.equal(
    keys.manifestKey,
    'blog/2026/09/11111111-1111-4111-8111-111111111111.json',
  )
})

test('ListObjectsV2 response parser exposes folders, keys, and continuation state', () => {
  const parsed = parseBlogMediaListObjectsXml(`<?xml version="1.0" encoding="UTF-8"?>
    <ListBucketResult>
      <IsTruncated>true</IsTruncated>
      <Contents><Key>blog/2026/09/a.json</Key></Contents>
      <Contents><Key>blog/2026/09/a.full.webp</Key></Contents>
      <CommonPrefixes><Prefix>blog/2026/10/</Prefix></CommonPrefixes>
      <NextContinuationToken>next&amp;token</NextContinuationToken>
    </ListBucketResult>`)

  assert.deepEqual(parsed.keys, [
    'blog/2026/09/a.json',
    'blog/2026/09/a.full.webp',
  ])
  assert.deepEqual(parsed.prefixes, ['blog/2026/10/'])
  assert.equal(parsed.isTruncated, true)
  assert.equal(parsed.nextContinuationToken, 'next&token')
})

test('managed Blog media manifest only accepts public-safe Blog-scoped asset metadata', () => {
  const manifest = normalizeBlogMediaManifest({
    version: 1,
    id: '11111111-1111-4111-8111-111111111111',
    folder: '2026/09/',
    sourceName: 'hero.png',
    createdAt: '2026-09-10T06:00:00.000Z',
    full: {
      key: 'blog/2026/09/11111111-1111-4111-8111-111111111111.full.webp',
      url: 'https://cdn.example.test/blog/2026/09/full.webp',
      width: 1600,
      height: 900,
    },
    thumbnail: {
      key: 'blog/2026/09/11111111-1111-4111-8111-111111111111.thumb.webp',
      url: 'https://cdn.example.test/blog/2026/09/thumb.webp',
      width: 640,
      height: 360,
    },
  })

  assert.ok(manifest)
  assert.equal(manifest.folder, '2026/09/')
  assert.equal(manifest.width, 1600)
  assert.equal(manifest.thumbnailWidth, 640)

  const escaped = normalizeBlogMediaManifest({
    version: 1,
    id: '11111111-1111-4111-8111-111111111111',
    folder: '2026/09/',
    sourceName: 'bad',
    createdAt: '2026-09-10T06:00:00.000Z',
    full: { key: 'archive/private.webp', url: 'https://cdn.example.test/private', width: 10, height: 10 },
    thumbnail: { key: 'blog/thumb.webp', url: 'https://cdn.example.test/thumb', width: 10, height: 10 },
  })
  assert.equal(escaped, null)
})
