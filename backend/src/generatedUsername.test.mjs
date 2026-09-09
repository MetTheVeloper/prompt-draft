import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GENERATED_USERNAME_PATTERN,
  GENERATED_USERNAME_WORDS,
  compactGeneratedUsername,
  createGeneratedUsername,
} from './generatedUsername.mjs'

function deterministicRandomBytes(sequence) {
  let cursor = 0
  return (length) => {
    const buffer = Buffer.alloc(length)
    for (let index = 0; index < length; index += 1) {
      buffer[index] = sequence[cursor % sequence.length]
      cursor += 1
    }
    return buffer
  }
}

test('generated username uses a friendly word plus two three-character suffixes', () => {
  const username = createGeneratedUsername({
    words: ['whale'],
    randomBytesFn: deterministicRandomBytes([0, 1, 2, 3, 4, 5, 6, 7]),
  })

  assert.match(username, GENERATED_USERNAME_PATTERN)
  assert.equal(username.split('-').length, 3)
  assert.equal(username.split('-')[0], 'whale')
  assert.equal(username.split('-')[1].length, 3)
  assert.equal(username.split('-')[2].length, 3)
})

test('generated username dictionary stays broad enough for friendly identities', () => {
  assert.ok(GENERATED_USERNAME_WORDS.length >= 60)
  assert.ok(GENERATED_USERNAME_WORDS.includes('whale'))
  assert.ok(GENERATED_USERNAME_WORDS.includes('hammer'))
  assert.ok(GENERATED_USERNAME_WORDS.includes('mars'))
  assert.ok(GENERATED_USERNAME_WORDS.includes('cedar'))
})

test('compact generated usernames show only their dictionary word', () => {
  assert.equal(compactGeneratedUsername('Whale-sq1-xh9'), 'whale')
  assert.equal(compactGeneratedUsername('grassias'), 'grassias')
  assert.equal(compactGeneratedUsername('john-abc-def-extra'), 'john-abc-def-extra')
})
