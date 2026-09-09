import { randomBytes } from 'node:crypto'

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789'

export const GENERATED_USERNAME_WORDS = Object.freeze([
  // Fruit & food
  'apple', 'apricot', 'berry', 'cherry', 'coconut', 'fig', 'grape', 'lemon', 'lime', 'mango',
  'melon', 'olive', 'peach', 'pear', 'plum',
  // Colors & materials
  'amber', 'azure', 'coral', 'cyan', 'gold', 'indigo', 'ivory', 'jade', 'silver', 'teal',
  'violet', 'scarlet',
  // Objects
  'anchor', 'camera', 'compass', 'hammer', 'kettle', 'lantern', 'mirror', 'pencil', 'rocket', 'violin',
  // Space
  'comet', 'earth', 'jupiter', 'mars', 'mercury', 'neptune', 'orbit', 'saturn', 'venus',
  // Plants
  'basil', 'cedar', 'clover', 'fern', 'iris', 'lotus', 'maple', 'moss', 'sage', 'willow',
  // Animals & birds
  'badger', 'crane', 'falcon', 'fox', 'koala', 'lynx', 'otter', 'owl', 'panda', 'raven',
  'robin', 'tiger', 'whale', 'wolf',
])

export const GENERATED_USERNAME_PATTERN = /^([a-z][a-z0-9]{2,15})-[a-z0-9]{3}-[a-z0-9]{3}$/

function randomIndex(max, randomBytesFn) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error('random username source must contain at least one word')
  }
  return randomBytesFn(4).readUInt32BE(0) % max
}

function randomSegment(length, randomBytesFn) {
  const bytes = randomBytesFn(length)
  let output = ''
  for (let index = 0; index < length; index += 1) {
    output += ALPHANUMERIC[bytes[index] % ALPHANUMERIC.length]
  }
  return output
}

export function createGeneratedUsername({
  words = GENERATED_USERNAME_WORDS,
  randomBytesFn = randomBytes,
} = {}) {
  const word = words[randomIndex(words.length, randomBytesFn)]
  const first = randomSegment(3, randomBytesFn)
  const second = randomSegment(3, randomBytesFn)
  return `${word}-${first}-${second}`
}

export function compactGeneratedUsername(value) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().toLowerCase()
  const match = normalized.match(GENERATED_USERNAME_PATTERN)
  return match?.[1] ?? normalized
}
