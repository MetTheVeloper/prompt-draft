import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { withDatabaseTransaction } from './database.mjs'
import {
  InsufficientGoinBalanceError,
  getUserEconomyBalanceState,
  planExpiringCreditAllocations,
  recordUserEconomyEventInTransaction,
} from './economyCore.mjs'

const ROLLBACK_CODE = 'ECONOMY_EXPIRY_TEST_ROLLBACK'

async function withRollbackFixture(work) {
  try {
    await withDatabaseTransaction(async (client) => {
      const execute = client.query.bind(client)
      const userId = randomUUID()
      await execute(
        `
          INSERT INTO users (id, email, password_hash)
          VALUES ($1, $2, 'test-only')
        `,
        [userId, `economy-expiry-${userId}@example.test`],
      )

      // Account creation currently emits score/economy rewards. This test owns
      // a clean isolated ledger inside a transaction that will be rolled back.
      await execute('DELETE FROM user_economy_events WHERE user_id = $1', [userId])
      await execute('DELETE FROM user_score_events WHERE user_id = $1', [userId])

      await work({ client, execute, userId })

      const rollback = new Error('rollback economy expiry fixture')
      rollback.code = ROLLBACK_CODE
      throw rollback
    })
  } catch (error) {
    if (error?.code === ROLLBACK_CODE) return
    throw error
  }
}

function atOffset(base, milliseconds) {
  return new Date(base.getTime() + milliseconds)
}

test('allocation planner uses supplied FEFO order and leaves permanent remainder implicit', () => {
  const result = planExpiringCreditAllocations([
    { id: 'first', remaining: 2, expiresAt: 'soon' },
    { id: 'second', remaining: 5, expiresAt: 'later' },
  ], 4)

  assert.deepEqual(result, {
    allocations: [
      { creditEventId: 'first', unitAmount: 2, expiresAt: 'soon' },
      { creditEventId: 'second', unitAmount: 2, expiresAt: 'later' },
    ],
    expiringAllocated: 4,
    permanentRequired: 0,
  })
})

test('partial spend consumes expiring Goin first and only the unused remainder expires', async () => {
  await withRollbackFixture(async ({ client, execute, userId }) => {
    const base = new Date()
    const expiresAt = atOffset(base, 60 * 60 * 1000)

    await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_permanent_credit',
      unitDelta: 100,
      idempotencyKey: `test:permanent:${userId}`,
    }, { asOf: base })

    const promo = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_promotional_credit',
      unitDelta: 5,
      idempotencyKey: `test:promo:${userId}`,
      expiresAt,
    }, { asOf: base })

    const debit = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_spend',
      unitDelta: -3,
      idempotencyKey: `test:spend:${userId}`,
    }, { asOf: base })

    const allocations = await execute(
      `
        SELECT credit_event_id AS "creditEventId", unit_amount AS "unitAmount"
        FROM user_economy_expiring_credit_allocations
        WHERE debit_event_id = $1
      `,
      [debit.event.id],
    )

    assert.deepEqual(allocations.rows.map(row => ({
      creditEventId: row.creditEventId,
      unitAmount: Number(row.unitAmount),
    })), [{ creditEventId: promo.event.id, unitAmount: 3 }])

    const beforeExpiry = await getUserEconomyBalanceState(userId, execute, { asOf: base })
    assert.equal(beforeExpiry.balance, 102)
    assert.equal(beforeExpiry.permanentBalance, 100)
    assert.equal(beforeExpiry.expiringBalance, 2)
    assert.equal(beforeExpiry.lifetimeExpired, 0)

    const afterExpiry = await getUserEconomyBalanceState(
      userId,
      execute,
      { asOf: atOffset(expiresAt, 1) },
    )
    assert.equal(afterExpiry.balance, 100)
    assert.equal(afterExpiry.permanentBalance, 100)
    assert.equal(afterExpiry.expiringBalance, 0)
    assert.equal(afterExpiry.lifetimeExpired, 2)
  })
})

test('expired promotional Goin is excluded from affordability', async () => {
  await withRollbackFixture(async ({ client, execute, userId }) => {
    const base = new Date()
    const expiresAt = atOffset(base, 60 * 60 * 1000)
    const afterExpiry = atOffset(expiresAt, 1)

    await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_permanent_credit',
      unitDelta: 2,
      idempotencyKey: `test:permanent:${userId}`,
    }, { asOf: base })

    await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_promotional_credit',
      unitDelta: 5,
      idempotencyKey: `test:promo:${userId}`,
      expiresAt,
    }, { asOf: base })

    const state = await getUserEconomyBalanceState(userId, execute, { asOf: afterExpiry })
    assert.equal(state.balance, 2)
    assert.equal(state.lifetimeExpired, 5)

    await assert.rejects(
      () => recordUserEconomyEventInTransaction(client, {
        userId,
        eventType: 'test_spend_after_expiry',
        unitDelta: -3,
        idempotencyKey: `test:spend-after-expiry:${userId}`,
      }, { asOf: afterExpiry }),
      error => {
        assert.ok(error instanceof InsufficientGoinBalanceError)
        assert.equal(error.balance, 2)
        assert.equal(error.required, 3)
        return true
      },
    )
  })
})

test('FEFO allocation spends the earliest-expiring promotional lots first', async () => {
  await withRollbackFixture(async ({ client, execute, userId }) => {
    const base = new Date()

    await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_permanent_credit',
      unitDelta: 10,
      idempotencyKey: `test:permanent:${userId}`,
    }, { asOf: base })

    const later = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_promo_later',
      unitDelta: 4,
      idempotencyKey: `test:promo-later:${userId}`,
      expiresAt: atOffset(base, 2 * 60 * 60 * 1000),
    }, { asOf: base })

    const sooner = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_promo_sooner',
      unitDelta: 5,
      idempotencyKey: `test:promo-sooner:${userId}`,
      expiresAt: atOffset(base, 60 * 60 * 1000),
    }, { asOf: base })

    const debit = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_spend',
      unitDelta: -6,
      idempotencyKey: `test:spend:${userId}`,
    }, { asOf: base })

    const result = await execute(
      `
        SELECT credit_event_id AS "creditEventId", unit_amount AS "unitAmount"
        FROM user_economy_expiring_credit_allocations
        WHERE debit_event_id = $1
        ORDER BY created_at ASC, credit_event_id ASC
      `,
      [debit.event.id],
    )

    const byCredit = new Map(result.rows.map(row => [
      row.creditEventId,
      Number(row.unitAmount),
    ]))
    assert.equal(byCredit.get(sooner.event.id), 5)
    assert.equal(byCredit.get(later.event.id), 1)

    const state = await getUserEconomyBalanceState(userId, execute, { asOf: base })
    assert.equal(state.balance, 13)
    assert.equal(state.permanentBalance, 10)
    assert.equal(state.expiringBalance, 3)
  })
})

test('idempotent debit retry does not create duplicate allocations', async () => {
  await withRollbackFixture(async ({ client, execute, userId }) => {
    const base = new Date()
    const key = `test:spend:${userId}`

    await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_promo',
      unitDelta: 5,
      idempotencyKey: `test:promo:${userId}`,
      expiresAt: atOffset(base, 60 * 60 * 1000),
    }, { asOf: base })

    const first = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_spend',
      unitDelta: -2,
      idempotencyKey: key,
    }, { asOf: base })
    const retry = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_spend',
      unitDelta: -2,
      idempotencyKey: key,
    }, { asOf: base })

    assert.equal(first.duplicate, false)
    assert.equal(retry.duplicate, true)
    assert.equal(retry.event.id, first.event.id)

    const count = await execute(
      `
        SELECT COUNT(*)::int AS count
        FROM user_economy_expiring_credit_allocations
        WHERE debit_event_id = $1
      `,
      [first.event.id],
    )
    assert.equal(count.rows[0].count, 1)
  })
})

test('mixed debit consumes active expiring Goin before the permanent pool', async () => {
  await withRollbackFixture(async ({ client, execute, userId }) => {
    const base = new Date()

    await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_permanent_credit',
      unitDelta: 5,
      idempotencyKey: `test:permanent:${userId}`,
    }, { asOf: base })

    const promo = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_promotional_credit',
      unitDelta: 2,
      idempotencyKey: `test:promo:${userId}`,
      expiresAt: atOffset(base, 60 * 60 * 1000),
    }, { asOf: base })

    const debit = await recordUserEconomyEventInTransaction(client, {
      userId,
      eventType: 'test_mixed_spend',
      unitDelta: -4,
      idempotencyKey: `test:mixed-spend:${userId}`,
    }, { asOf: base })

    const result = await execute(
      `
        SELECT credit_event_id AS "creditEventId", unit_amount AS "unitAmount"
        FROM user_economy_expiring_credit_allocations
        WHERE debit_event_id = $1
      `,
      [debit.event.id],
    )

    assert.deepEqual(result.rows.map(row => ({
      creditEventId: row.creditEventId,
      unitAmount: Number(row.unitAmount),
    })), [{ creditEventId: promo.event.id, unitAmount: 2 }])

    const state = await getUserEconomyBalanceState(userId, execute, { asOf: base })
    assert.equal(state.balance, 3)
    assert.equal(state.expiringBalance, 0)
    assert.equal(state.permanentBalance, 3)
  })
})

test('operator balance view excludes expired unspent promotional Goin', async () => {
  await withRollbackFixture(async ({ execute, userId }) => {
    const eventId = randomUUID()
    await execute(
      `
        INSERT INTO user_economy_events (
          id,
          user_id,
          event_type,
          unit_delta,
          idempotency_key,
          metadata,
          created_at,
          expires_at
        )
        VALUES (
          $1,
          $2,
          'test_already_expired_promotional_credit',
          5,
          $3,
          '{}'::jsonb,
          NOW() - INTERVAL '2 hours',
          NOW() - INTERVAL '1 hour'
        )
      `,
      [eventId, userId, `test:expired-view:${userId}`],
    )

    const viewResult = await execute(
      `
        SELECT
          balance,
          permanent_balance AS "permanentBalance",
          expiring_balance AS "expiringBalance",
          lifetime_expired AS "lifetimeExpired"
        FROM user_economy_balance_state
        WHERE user_id = $1
      `,
      [userId],
    )

    assert.equal(Number(viewResult.rows[0].balance), 0)
    assert.equal(Number(viewResult.rows[0].permanentBalance), 0)
    assert.equal(Number(viewResult.rows[0].expiringBalance), 0)
    assert.equal(Number(viewResult.rows[0].lifetimeExpired), 5)
  })
})
