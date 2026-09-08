import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertPublishedArchiveLocalization,
  validatePublishedArchiveLocalization,
} from './archivePublishedLocalization.mjs'

test('published Archive localization requires EN/FA title and description', () => {
  assert.deepEqual(validatePublishedArchiveLocalization({
    title: { en: 'English title', fa: 'عنوان فارسی' },
    description: { en: 'English description', fa: 'توضیح فارسی' },
  }), [])
})

test('published Archive localization reports every incomplete authored field', () => {
  assert.deepEqual(validatePublishedArchiveLocalization({
    title: { en: 'English title', fa: '   ' },
    description: { en: '', fa: 'توضیح فارسی' },
  }), [
    { field: 'description.en', message: 'EN description is required before publishing' },
    { field: 'title.fa', message: 'FA title is required before publishing' },
  ])
})

test('publish assertion exposes a stable validation error contract', () => {
  assert.throws(
    () => assertPublishedArchiveLocalization({ title: {}, description: {} }),
    error => {
      assert.equal(error.code, 'ARCHIVE_LOCALIZATION_INCOMPLETE')
      assert.equal(error.errors.length, 4)
      return true
    },
  )
})
