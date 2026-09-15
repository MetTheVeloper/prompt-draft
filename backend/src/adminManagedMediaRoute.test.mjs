import assert from 'node:assert/strict'
import test from 'node:test'
import {
  managedMediaStorageKeys,
  resolveManagedMediaScope,
  validateManagedImageUploadBody,
} from './adminManagedMediaRoute.mjs'

test('managed media scopes are server allow-listed', () => {
  assert.ok(resolveManagedMediaScope('telegram'))
  assert.equal(resolveManagedMediaScope('archive'), null)
  assert.equal(resolveManagedMediaScope('../telegram'), null)
})

test('managed media storage keys are server-derived', () => {
  assert.deepEqual(managedMediaStorageKeys('telegram', 'image-123'), {
    fullKey: 'managed/telegram/image-123/full.webp',
    thumbnailKey: 'managed/telegram/image-123/thumb.webp',
  })
})

test('managed media validation rejects unknown scopes before storage', () => {
  assert.throws(
    () => validateManagedImageUploadBody({ scope: 'anything' }),
    /Unsupported managed media scope/,
  )
})
