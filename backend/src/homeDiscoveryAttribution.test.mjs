import assert from 'node:assert/strict'
import test from 'node:test'

import { listShowcaseItems, mapShowcaseItem } from './homeDiscovery.mjs'

const SHOWCASE_ROW = {
  id: 73,
  title: {
    en: 'Macro Toy Portrait',
    fa: 'پرتره ماکرو اسباب‌بازی',
  },
  publishedAt: new Date('2026-09-09T10:00:00.000Z'),
  telegramUrl: 'https://t.me/prompt-draft/73',
  tags: ['portrait', 'macro'],
  imageCount: 2,
  coverImage: {
    fullUrl: 'https://cdn.example.com/73/full.webp',
    thumbnailUrl: 'https://cdn.example.com/73/thumb.webp',
  },
  creatorUsername: 'grassias',
  creatorAvatarUrl: 'https://cdn.example.com/avatar.webp',
  creatorAccountStatus: 'active',
  creatorStatus: 'approved',
  sourceUserId: 'PRIVATE_UUID_SENTINEL',
  email: 'PRIVATE_EMAIL_SENTINEL@example.com',
}

test('Discovery maps only minimal approved Creator attribution', () => {
  const item = mapShowcaseItem(SHOWCASE_ROW)

  assert.deepEqual(item.creator, {
    username: 'grassias',
    avatarUrl: 'https://cdn.example.com/avatar.webp',
  })
  assert.equal('owner' in item, false)

  const serialized = JSON.stringify(item)
  assert.equal(serialized.includes('PRIVATE_UUID_SENTINEL'), false)
  assert.equal(serialized.includes('PRIVATE_EMAIL_SENTINEL'), false)
})

test('Discovery leaves non-Creator and unavailable source users unattributed without dropping the Prompt', () => {
  for (const row of [
    { creatorUsername: null, creatorAccountStatus: null, creatorStatus: null },
    { creatorUsername: 'ordinary-user', creatorAccountStatus: 'active', creatorStatus: null },
    { creatorUsername: 'pending-user', creatorAccountStatus: 'active', creatorStatus: 'pending' },
    { creatorUsername: 'rejected-user', creatorAccountStatus: 'active', creatorStatus: 'rejected' },
    { creatorUsername: 'suspended-user', creatorAccountStatus: 'active', creatorStatus: 'suspended' },
    { creatorUsername: 'inactive-user', creatorAccountStatus: 'suspended', creatorStatus: 'approved' },
  ]) {
    const item = mapShowcaseItem({ ...SHOWCASE_ROW, ...row })
    assert.equal(item.id, 73)
    assert.equal(item.creator, null)
  }
})

test('Discovery SQL derives attribution from source_user_id plus Creator state, not active-user ownership', async () => {
  let capturedSql = ''
  let capturedValues = null

  const items = await listShowcaseItems(['portrait'], 5, async (sql, values) => {
    capturedSql = sql
    capturedValues = values
    return { rows: [SHOWCASE_ROW] }
  })

  assert.equal(items.length, 1)
  assert.equal(items[0].creator.username, 'grassias')
  assert.deepEqual(capturedValues, [['portrait'], 5])
  assert.match(capturedSql, /creator_user\.id\s*=\s*items\.source_user_id/i)
  assert.match(capturedSql, /creator_accounts\s+creator_account/i)
  assert.match(capturedSql, /creator_account\.status\s+AS\s+"creatorStatus"/i)
  assert.doesNotMatch(capturedSql, /owner\.status\s*=\s*'active'/i)
  assert.doesNotMatch(capturedSql, /AS\s+"ownerUsername"/i)
  assert.doesNotMatch(capturedSql, /items\.source_user_id\s+AS/i)
})
