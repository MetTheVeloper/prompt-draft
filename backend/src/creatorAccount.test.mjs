import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyCreatorAdminAction,
  normalizeCreatorReviewNote,
  requestCreatorAccount,
  resolveCreatorAdminTransition,
  resolveCreatorRequestTransition,
} from './creatorAccount.mjs'
import {
  PERMISSIONS,
  resolvePermissionsForRole,
} from './authorization.mjs'

const USER_ID = '11111111-1111-4111-8111-111111111111'
const ACTOR_ID = '22222222-2222-4222-8222-222222222222'

function completeProfileRow(overrides = {}) {
  return {
    screenNameEn: 'Grass',
    screenNameFa: 'گراس',
    bioEn: 'Builder',
    bioFa: 'سازنده',
    articleEn: '# Building',
    articleFa: '# ساختن',
    birthday: null,
    locationText: 'Earth',
    ...overrides,
  }
}

function createFakeClient({
  creatorStatus = 'none',
  profileRow = completeProfileRow(),
  accountStatus = 'active',
} = {}) {
  const calls = []
  let status = creatorStatus
  let requestedAt = creatorStatus === 'none' ? null : new Date('2026-09-09T06:00:00Z')

  async function query(sql, values = []) {
    const normalized = String(sql).replace(/\s+/g, ' ').trim()
    calls.push({ sql: normalized, values })

    if (normalized.includes('FROM users') && normalized.includes('WHERE id = $1')) {
      return {
        rows: [{
          id: USER_ID,
          username: 'grass',
          email: 'grass@example.com',
          role: 'user',
          status: accountStatus,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        }],
      }
    }

    if (normalized.includes('FROM user_profiles')) {
      return { rows: profileRow ? [profileRow] : [] }
    }

    if (normalized.includes('FROM creator_accounts')) {
      if (status === 'none') return { rows: [] }
      return {
        rows: [{
          status,
          requestedAt,
          reviewedAt: null,
          reviewedByUserId: null,
          reviewNote: null,
          approvedAt: status === 'approved' || status === 'suspended'
            ? new Date('2026-09-09T07:00:00Z')
            : null,
          suspendedAt: status === 'suspended'
            ? new Date('2026-09-09T08:00:00Z')
            : null,
        }],
      }
    }

    if (normalized.includes('FROM user_profile_skills')) {
      return {
        rows: [{
          slug: 'prompt-engineering',
          categorySlug: 'ai-prompting',
          titleEn: 'Prompt Engineering',
          titleFa: 'مهندسی پرامپت',
          active: true,
          sortOrder: 10,
          categoryTitleEn: 'AI & Prompting',
          categoryTitleFa: 'هوش مصنوعی و پرامپت‌نویسی',
          categorySortOrder: 10,
        }],
      }
    }

    if (normalized.includes('FROM user_profile_links')) {
      return { rows: [] }
    }

    if (normalized.startsWith('INSERT INTO creator_accounts')) {
      status = 'pending'
      requestedAt = new Date('2026-09-09T09:00:00Z')
      return { rows: [{ requestedAt }] }
    }

    if (normalized.startsWith('UPDATE creator_accounts')) {
      if (normalized.includes("status = 'pending'")) {
        status = 'pending'
        requestedAt = new Date('2026-09-09T09:00:00Z')
        return { rows: [{ requestedAt }] }
      }
      if (normalized.includes("status = 'rejected'")) status = 'rejected'
      else if (normalized.includes("status = 'suspended'")) status = 'suspended'
      else if (normalized.includes("status = 'approved'")) status = 'approved'
      return { rows: [] }
    }

    if (
      normalized.startsWith('INSERT INTO creator_account_events') ||
      normalized.startsWith('INSERT INTO admin_audit_log')
    ) {
      return { rows: [] }
    }

    throw new Error(`Unexpected query: ${normalized}`)
  }

  return {
    client: { query },
    calls,
    getStatus: () => status,
  }
}

function transactionFor(fake) {
  return async work => work(fake.client)
}

test('Creator request lifecycle supports request, reapply and pending idempotency', () => {
  assert.deepEqual(resolveCreatorRequestTransition('none'), {
    nextStatus: 'pending',
    eventType: 'requested',
    idempotent: false,
  })
  assert.deepEqual(resolveCreatorRequestTransition('rejected'), {
    nextStatus: 'pending',
    eventType: 'reapplied',
    idempotent: false,
  })
  assert.deepEqual(resolveCreatorRequestTransition('pending'), {
    nextStatus: 'pending',
    eventType: null,
    idempotent: true,
  })
  assert.throws(() => resolveCreatorRequestTransition('approved'), error => {
    assert.equal(error.statusCode, 409)
    assert.equal(error.code, 'CREATOR_REQUEST_UNAVAILABLE')
    return true
  })
})

test('Creator admin transitions are explicit and state-safe', () => {
  assert.equal(resolveCreatorAdminTransition('pending', 'approve').to, 'approved')
  assert.equal(resolveCreatorAdminTransition('pending', 'reject').to, 'rejected')
  assert.equal(resolveCreatorAdminTransition('approved', 'suspend').to, 'suspended')
  assert.equal(resolveCreatorAdminTransition('suspended', 'unsuspend').to, 'approved')
  assert.throws(() => resolveCreatorAdminTransition('approved', 'approve'), error => {
    assert.equal(error.code, 'CREATOR_TRANSITION_INVALID')
    return true
  })
})

test('admin gets creators.manage without gaining users.manage', () => {
  const permissions = resolvePermissionsForRole('admin')
  assert.ok(permissions.includes(PERMISSIONS.CREATORS_MANAGE))
  assert.ok(!permissions.includes(PERMISSIONS.USERS_MANAGE))
  assert.deepEqual(resolvePermissionsForRole('user'), [])
  assert.deepEqual(resolvePermissionsForRole('super_admin'), ['*'])
})

test('Creator review notes normalize safely and enforce the storage limit', () => {
  assert.deepEqual(normalizeCreatorReviewNote('  looks good  '), {
    value: 'looks good',
    error: null,
  })
  assert.deepEqual(normalizeCreatorReviewNote(''), { value: null, error: null })
  assert.ok(normalizeCreatorReviewNote('x'.repeat(2001)).error)
  assert.ok(normalizeCreatorReviewNote({}).error)
})

test('complete ordinary account may submit first Creator request', async () => {
  const fake = createFakeClient({ creatorStatus: 'none' })
  const result = await requestCreatorAccount(
    { id: USER_ID },
    transactionFor(fake),
  )

  assert.equal(result.status, 'pending')
  assert.equal(result.readiness.ready, true)
  assert.equal(result.idempotent, false)
  assert.equal(fake.getStatus(), 'pending')
  assert.ok(fake.calls.some(call => call.sql.startsWith('INSERT INTO creator_accounts')))
  assert.ok(fake.calls.some(call => (
    call.sql.startsWith('INSERT INTO creator_account_events') &&
    call.values.includes('requested')
  )))
})

test('pending Creator request is idempotent and does not append duplicate event', async () => {
  const fake = createFakeClient({ creatorStatus: 'pending' })
  const result = await requestCreatorAccount(
    { id: USER_ID },
    transactionFor(fake),
  )

  assert.equal(result.status, 'pending')
  assert.equal(result.idempotent, true)
  assert.ok(!fake.calls.some(call => call.sql.startsWith('INSERT INTO creator_account_events')))
})

test('rejected Creator account may reapply and appends reapplied event', async () => {
  const fake = createFakeClient({ creatorStatus: 'rejected' })
  const result = await requestCreatorAccount(
    { id: USER_ID },
    transactionFor(fake),
  )

  assert.equal(result.status, 'pending')
  assert.equal(fake.getStatus(), 'pending')
  assert.ok(fake.calls.some(call => (
    call.sql.startsWith('INSERT INTO creator_account_events') &&
    call.values.includes('reapplied')
  )))
})

test('incomplete Creator profile is rejected server-side before state mutation', async () => {
  const fake = createFakeClient({
    creatorStatus: 'none',
    profileRow: completeProfileRow({ articleFa: null }),
  })

  await assert.rejects(
    () => requestCreatorAccount({ id: USER_ID }, transactionFor(fake)),
    error => {
      assert.equal(error.statusCode, 400)
      assert.equal(error.code, 'CREATOR_PROFILE_INCOMPLETE')
      assert.ok(error.errors.some(item => item.field === 'profile.article.fa'))
      return true
    },
  )
  assert.ok(!fake.calls.some(call => call.sql.startsWith('INSERT INTO creator_accounts')))
})

test('admin approval rechecks readiness, writes lifecycle event and audit record', async () => {
  const fake = createFakeClient({ creatorStatus: 'pending' })
  const review = await applyCreatorAdminAction({
    actor: { id: ACTOR_ID, role: 'admin' },
    targetUserId: USER_ID,
    action: 'approve',
    note: 'Strong bilingual Creator profile',
    transaction: transactionFor(fake),
  })

  assert.equal(fake.getStatus(), 'approved')
  assert.equal(review.creator.status, 'approved')
  assert.ok(fake.calls.some(call => (
    call.sql.startsWith('INSERT INTO creator_account_events') &&
    call.values.includes('approved')
  )))
  assert.ok(fake.calls.some(call => (
    call.sql.startsWith('INSERT INTO admin_audit_log') &&
    call.values.includes('creator.approved')
  )))
})

test('Creator self-review is blocked before transaction work', async () => {
  const fake = createFakeClient({ creatorStatus: 'pending' })
  await assert.rejects(
    () => applyCreatorAdminAction({
      actor: { id: USER_ID, role: 'admin' },
      targetUserId: USER_ID,
      action: 'approve',
      transaction: transactionFor(fake),
    }),
    error => {
      assert.equal(error.statusCode, 409)
      assert.equal(error.code, 'CREATOR_SELF_REVIEW_BLOCKED')
      return true
    },
  )
  assert.equal(fake.calls.length, 0)
})

test('approval fails when pending Creator profile became incomplete', async () => {
  const fake = createFakeClient({
    creatorStatus: 'pending',
    profileRow: completeProfileRow({ bioEn: null }),
  })

  await assert.rejects(
    () => applyCreatorAdminAction({
      actor: { id: ACTOR_ID, role: 'admin' },
      targetUserId: USER_ID,
      action: 'approve',
      transaction: transactionFor(fake),
    }),
    error => {
      assert.equal(error.statusCode, 409)
      assert.equal(error.code, 'CREATOR_PROFILE_NOT_READY')
      return true
    },
  )
  assert.equal(fake.getStatus(), 'pending')
})
