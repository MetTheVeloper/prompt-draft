import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeArchiveDescriptionInput,
  validateArchiveDescriptionInput,
} from './archiveDescriptionInput.mjs'

test('legacy Admin Archive payloads may omit description during backward-safe rollout', () => {
  assert.deepEqual(validateArchiveDescriptionInput(undefined), [])
  assert.deepEqual(normalizeArchiveDescriptionInput(undefined), {})
})

test('supplied Archive descriptions require complete EN and FA localization', () => {
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
