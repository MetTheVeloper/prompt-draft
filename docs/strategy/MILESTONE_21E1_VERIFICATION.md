# Milestone 21E1 — Economy Ledger Verification

Status: **LEDGER CORE LOCALLY VERIFIED / USER ACCEPTED · GOIN ISSUANCE V1 IMPLEMENTED / AWAITING LOCAL VERIFICATION**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

## Verified locally

Migration 022 applied successfully:

```text
Database schema applied: 022_user_economy_foundation.sql
```

Verified schema:

```text
user_economy_events
  UUID primary key
  user_id foreign key
  non-zero bigint unit_delta
  optional score-event provenance
  per-user idempotency unique constraint
  append-only event metadata/timestamp
```

Verified economy setting seed:

```text
goin_reference_value_toman = 250
```

The value is a simulation/reference value only.

## Sequential ledger invariant verification

Test account began with zero goin.

Observed sequence:

```text
credit +500 -> accepted once
balance      -> 500

debit -200  -> accepted once
balance      -> 300

retry same debit idempotency key
             -> duplicate=true
balance      -> still 300

overspend -301
             -> rejected
code         -> INSUFFICIENT_GOIN_BALANCE
balance      -> still 300
```

Final read model:

```text
balance          = 300
lifetimeIssued   = 500
lifetimeSpent    = 200
transactionCount = 2
```

Direct database verification showed exactly two rows: the +500 credit and the -200 debit. The duplicate retry and rejected overspend created no additional rows.

## Parallel spend verification

Starting balance:

```text
300 goin
```

Two independent `-200` debits were launched concurrently with different idempotency keys.

Observed result:

```text
request A -> fulfilled, balanceAfter=100
request B -> rejected, INSUFFICIENT_GOIN_BALANCE
```

The rejected request observed:

```text
balance  = 100
required = 200
```

Final read model:

```text
balance          = 100
lifetimeIssued   = 500
lifetimeSpent    = 400
transactionCount = 3
```

Direct database verification showed exactly one parallel debit row.

This proves that the per-user `SELECT ... FOR UPDATE` serialization prevents two concurrent debits from spending the same goin balance.

## Ledger invariants proven

```text
append-only authoritative ledger
SUM(unit_delta) authoritative balance
per-user idempotent retry
no negative balance
failed overspend creates no event
parallel spends cannot overspend
read model remains consistent with ledger
```

The ledger/concurrency core is locally verified and founder-accepted.

## Synthetic test-data cleanup

The local verification events use idempotency keys under:

```text
verification:21e1:%
```

They are synthetic and should be removed before deterministic Goin issuance/backfill is evaluated:

```sql
DELETE FROM user_economy_events
WHERE idempotency_key LIKE 'verification:21e1:%';
```

## Founder-approved Goin Issuance V1 handoff

The next supply schedule was explicitly approved:

```text
account_created       -> 10 goin
profile_email_added   -> 10 goin
referral_joined       -> 10 goin
referral_reward       -> 20 goin
draft_created         -> 0 goin
```

Implementation source:

```text
backend/sql/023_goin_issuance_policy.sql
docs/strategy/MILESTONE_21E_GOIN_ISSUANCE_V1.md
```

The issuance bridge and deterministic historical backfill are implemented but still require local verification before being marked accepted.

## Remaining verification before 21E2

```text
apply migration 023
verify seeded V1 issuance settings
verify deterministic historical backfill
rerun schema and prove no double issuance
verify draft_created remains XP-only
verify a newly inserted eligible score event automatically issues Goin
verify authenticated GET /api/economy and GET /api/economy/events ownership boundary
verify Super-Admin issuance settings API / authorization
```

After those checks pass, 21E can move to the durable Prompt Archive unlock/access primitive without reopening the ledger architecture.
