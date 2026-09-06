# Milestone 21E1 — Economy Ledger Verification

Status: **LEDGER CORE LOCALLY VERIFIED / USER ACCEPTED · GOIN ISSUANCE V1 LOCALLY VERIFIED · API BOUNDARY CHECKS REMAIN**

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

## Founder-approved Goin Issuance V1

Approved supply schedule:

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

## Goin Issuance V1 local verification

Migration 023 applied successfully:

```text
Database schema applied: 023_goin_issuance_policy.sql
```

Verified settings:

```text
goin_issuance_rule_version     = 1
goin_issue_account_created     = 10
goin_issue_draft_created       = 0
goin_issue_profile_email_added = 10
goin_issue_referral_joined     = 10
goin_issue_referral_reward     = 20
goin_reference_value_toman     = 250
```

Historical backfill verification:

```text
account_created       score_events=10 economy_events=10 goin_issued=100
draft_created         score_events=6  economy_events=0  goin_issued=0
profile_email_added   score_events=7  economy_events=7  goin_issued=70
referral_joined       score_events=5  economy_events=5  goin_issued=50
referral_reward       score_events=5  economy_events=5  goin_issued=100
```

Total historical issuance from eligible V1 score events:

```text
320 goin
```

Schema was then reapplied. The same summary remained unchanged, proving deterministic rerun safety and no double issuance.

### Future eligible score-event bridge

A transaction-scoped verification inserted a new synthetic `account_created` score event.

Observed economy row:

```text
event_type            = score_reward_issued
unit_delta            = 10
source_score_event_id = verification:21e:goin:future:account
```

Observed metadata:

```json
{
  "origin": "score_event_trigger",
  "backfill": false,
  "policyKey": "goin_issue_account_created",
  "ruleVersion": 1,
  "scorePoints": 1000,
  "scoreEventType": "account_created"
}
```

The transaction was rolled back after inspection, leaving no test data.

### Draft-created remains XP-only

A transaction-scoped synthetic `draft_created` score event was inserted.

Observed economy result:

```text
economy_events = 0
```

The transaction was rolled back.

This verifies the V1 anti-farming policy: Draft creation still grants XP through the existing score system but emits zero Goin.

## Issuance invariants proven

```text
existing eligible score rewards receive deterministic Goin backfill
migration rerun cannot double issue
new eligible score events automatically issue Goin
issuance records exact score provenance
issuance records policy key + rule version
future issuance uses server-side policy
Draft creation remains XP-only at V1 amount 0
XP and Goin remain semantically separate
```

## Remaining verification before 21E2

Only API/access-control verification remains for 21E1:

```text
verify unauthenticated GET /api/economy -> 401
verify authenticated GET /api/economy returns only caller state
verify authenticated GET /api/economy/events returns only caller history
verify economy history pagination query validation
verify Super-Admin GET/PUT /api/admin/economy/settings
verify ordinary user/admin cannot mutate economy settings
```

After those checks pass, 21E1 can be closed and 21E can move to the durable Prompt Archive unlock/access primitive without reopening the ledger or issuance architecture.
