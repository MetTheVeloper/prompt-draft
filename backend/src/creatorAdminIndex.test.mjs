import assert from 'node:assert/strict'
import test from 'node:test'
import {
  listAdminCreators,
  parseCreatorAdminListQuery,
  readCreatorEvents,
} from './creatorAdminIndex.mjs'

const USER_ID = '11111111-1111-4111-8111-111111111111'

test('Creator admin list query accepts supported status/search/limit', () => {
  const url = new URL('http://localhost/api/admin/creators?status=pending&query=grass&limit=25')
  const parsed = parseCreatorAdminListQuery(url)

  assert.deepEqual(parsed.errors, [])
  assert.equal(parsed.status, 'pending')
  assert.equal(parsed.query, 'grass')
  assert.equal(parsed.limit, 25)
  assert.equal(parsed.cursor, null)
})

test('Creator admin list query rejects unsupported statuses and empty search', () => {
  const url = new URL('http://localhost/api/admin/creators?status=none&query=')
  const parsed = parseCreatorAdminListQuery(url)

  assert.ok(parsed.errors.some(error => error.field === 'status'))
  assert.ok(parsed.errors.some(error => error.field === 'query'))
})

test('Creator admin list maps review-safe account metadata and pagination', async () => {
  const rows = [
    {
      id: USER_ID,
      username: 'grass',
      email: 'grass@example.com',
      avatarUrl: 'https://cdn.example.com/avatar.webp',
      role: 'user',
      accountStatus: 'active',
      creatorStatus: 'pending',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      requestedAt: new Date('2026-09-09T08:00:00Z'),
      reviewedAt: null,
      approvedAt: null,
      suspendedAt: null,
      creatorUpdatedAt: new Date('2026-09-09T08:00:00Z'),
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      username: 'second',
      email: 'second@example.com',
      avatarUrl: null,
      role: 'admin',
      accountStatus: 'active',
      creatorStatus: 'approved',
      createdAt: new Date('2026-01-02T00:00:00Z'),
      requestedAt: new Date('2026-09-08T08:00:00Z'),
      reviewedAt: new Date('2026-09-08T09:00:00Z'),
      approvedAt: new Date('2026-09-08T09:00:00Z'),
      suspendedAt: null,
      creatorUpdatedAt: new Date('2026-09-08T09:00:00Z'),
    },
  ]

  const calls = []
  const runQuery = async (sql, values) => {
    calls.push({ sql: String(sql), values })
    return { rows }
  }

  const page = await listAdminCreators({
    limit: 1,
    status: 'pending',
    query: 'grass',
  }, runQuery)

  assert.equal(page.creators.length, 1)
  assert.equal(page.creators[0].creatorStatus, 'pending')
  assert.equal(page.creators[0].accountStatus, 'active')
  assert.equal(page.pageInfo.hasMore, true)
  assert.ok(page.pageInfo.nextCursor)
  assert.ok(calls[0].sql.includes('creator.status'))
  assert.ok(calls[0].sql.includes('users.email'))
  assert.deepEqual(calls[0].values.slice(0, 2), ['pending', 'grass'])
})

test('Creator event history is ordered admin-only review data', async () => {
  let call = 0
  const runQuery = async (sql, values) => {
    call += 1
    assert.deepEqual(values, [USER_ID])
    if (call === 1) return { rows: [{ status: 'pending' }] }
    assert.ok(String(sql).includes('creator_account_events'))
    return {
      rows: [{
        id: '33333333-3333-4333-8333-333333333333',
        actorUserId: null,
        eventType: 'requested',
        metadata: {},
        createdAt: new Date('2026-09-09T08:00:00Z'),
      }],
    }
  }

  const events = await readCreatorEvents(USER_ID, runQuery)
  assert.equal(events.length, 1)
  assert.equal(events[0].eventType, 'requested')
  assert.equal(events[0].actorUserId, null)
  assert.equal(events[0].createdAt, '2026-09-09T08:00:00.000Z')
})
