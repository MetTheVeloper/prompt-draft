import assert from 'node:assert/strict'
import test from 'node:test'

import { mapPublicCreatorAttribution } from './publicCreatorAttribution.mjs'

const APPROVED_ROW = {
  creatorUsername: 'grassias',
  creatorAvatarUrl: 'https://cdn.example.com/avatar.webp',
  creatorAccountStatus: 'active',
  creatorStatus: 'approved',
  sourceUserId: 'PRIVATE_UUID_SENTINEL',
  email: 'PRIVATE_EMAIL_SENTINEL@example.com',
  role: 'super_admin',
  reviewNote: 'PRIVATE_REVIEW_SENTINEL',
}

test('approved active canonical Creator maps to the minimal public attribution allowlist', () => {
  const attribution = mapPublicCreatorAttribution(APPROVED_ROW)

  assert.deepEqual(attribution, {
    username: 'grassias',
    avatarUrl: 'https://cdn.example.com/avatar.webp',
  })

  const serialized = JSON.stringify(attribution)
  for (const forbidden of [
    'PRIVATE_UUID_SENTINEL',
    'PRIVATE_EMAIL_SENTINEL',
    'PRIVATE_REVIEW_SENTINEL',
    'super_admin',
    'creatorStatus',
    'creatorAccountStatus',
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }
})

test('attribution uses the canonical Creator accessibility policy rather than active-user heuristics', () => {
  for (const row of [
    { ...APPROVED_ROW, creatorStatus: null },
    { ...APPROVED_ROW, creatorStatus: 'pending' },
    { ...APPROVED_ROW, creatorStatus: 'rejected' },
    { ...APPROVED_ROW, creatorStatus: 'suspended' },
    { ...APPROVED_ROW, creatorAccountStatus: 'suspended' },
    { ...APPROVED_ROW, creatorUsername: 'GrassiaS' },
    { ...APPROVED_ROW, creatorUsername: null },
  ]) {
    assert.equal(mapPublicCreatorAttribution(row), null)
  }
})

test('unsafe avatar metadata never blocks an otherwise accessible Creator attribution', () => {
  assert.deepEqual(
    mapPublicCreatorAttribution({
      ...APPROVED_ROW,
      creatorAvatarUrl: 'javascript:alert(1)',
    }),
    {
      username: 'grassias',
      avatarUrl: null,
    },
  )
})
