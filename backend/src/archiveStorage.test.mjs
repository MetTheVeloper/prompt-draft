import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canonicalizeArchiveStorageQuery,
  getArchiveStorageRequestUrl,
  signArchiveStorageRequest,
} from './archiveStorage.mjs'

const config = {
  endpoint: 'https://s3.example.test',
  region: 'ir-thr-at1',
  bucket: 'prompt-draft',
  publicBaseUrl: 'https://cdn.example.test',
  forcePathStyle: true,
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret',
}

test('object request URL stays unchanged when no query is supplied', () => {
  const url = getArchiveStorageRequestUrl('archive/item/full.webp', config)
  assert.equal(url.origin, 'https://s3.example.test')
  assert.equal(url.pathname, '/prompt-draft/archive/item/full.webp')
  assert.equal(url.search, '')
})

test('ListObjectsV2 query is AWS encoded and deterministically sorted', () => {
  const query = canonicalizeArchiveStorageQuery({
    prefix: 'blog/2026/09/hero image',
    'max-keys': 200,
    delimiter: '/',
    'list-type': 2,
  })

  assert.equal(
    query,
    'delimiter=%2F&list-type=2&max-keys=200&prefix=blog%2F2026%2F09%2Fhero%20image',
  )

  const url = getArchiveStorageRequestUrl(null, config, {
    prefix: 'blog/2026/09/',
    delimiter: '/',
    'list-type': 2,
  })
  assert.equal(
    url.search,
    '?delimiter=%2F&list-type=2&prefix=blog%2F2026%2F09%2F',
  )
})

test('query values participate in SigV4 without changing signed-header scope', () => {
  const date = new Date('2026-09-10T06:00:00.000Z')
  const plainUrl = getArchiveStorageRequestUrl(null, config)
  const listUrl = getArchiveStorageRequestUrl(null, config, {
    'list-type': 2,
    prefix: 'blog/',
  })

  const plain = signArchiveStorageRequest({
    method: 'GET',
    url: plainUrl,
    config,
    date,
  })
  const list = signArchiveStorageRequest({
    method: 'GET',
    url: listUrl,
    config,
    date,
  })

  assert.match(plain.headers.Authorization, /SignedHeaders=host;x-amz-content-sha256;x-amz-date/)
  assert.match(list.headers.Authorization, /SignedHeaders=host;x-amz-content-sha256;x-amz-date/)
  assert.notEqual(list.headers.Authorization, plain.headers.Authorization)
})
