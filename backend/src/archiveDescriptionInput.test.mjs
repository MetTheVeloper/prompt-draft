import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeArchiveDescriptionInput,
  validateArchiveDescriptionInput,
} from './archiveDescriptionInput.mjs'

test('Admin Archive payloads require localized descriptions after approved backfill', () => {
  assert.deepEqual(validateArchiveDescriptionInput(undefined), [
    { field: 'description', message: 'description must contain en and fa values' },
  ])
})

test('Archive descriptions require complete EN and FA localization', () => {
  assert.deepEqual(
    validateArchiveDescriptionInput({
      en: 'English description',
      fa: 'توضیح فارسی',
    }),
    [],
  )

  assert.deepEqual(
    validateArchiveDescriptionInput({ en: 'English description' }),
    [{
      field: 'description.fa',
      message: 'FA description must be 1-2000 characters',
    }],
  )
})

test('Archive description normalization trims authored copy without fallback', () => {
  assert.deepEqual(
    normalizeArchiveDescriptionInput({
      en: '  English description  ',
      fa: '  توضیح فارسی  ',
    }),
    {
      en: 'English description',
      fa: 'توضیح فارسی',
    },
  )
})
