# Milestone 21E1 — Economy Ledger & Goin Issuance Verification

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

## Scope closed by this document

21E1 established and locally verified the spendable Goin foundation without changing lifetime XP/reputation semantics.

Canonical split:

```text
user_score_events
  -> achievement/reward provenance + lifetime XP

user_economy_events
  -> spendable Goin issuance/debit/refund/correction
```

Spending Goin does not reduce XP.

## Migration 022 — economy ledger foundation

Verified locally:

```text
Database schema applied: 022_user_economy_foundation.sql
```

Created:

```text
user_economy_events
economy_settings
```

Verified setting:

```text
goin_reference_value_toman = 250
```

This remains simulation/reference metadata only.

## Ledger invariant verification

Sequential test:

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

Direct DB verification showed exactly two rows after the sequential test: the credit and the debit. Retry and rejected overspend created no row.

Parallel-spend test:

```text
starting balance = 300
parallel debit A = -200
parallel debit B = -200

one request -> fulfilled
one request -> INSUFFICIENT_GOIN_BALANCE
final balance -> 100
```

Direct DB verification showed exactly one parallel debit row.

This proves the per-user `SELECT ... FOR UPDATE` serialization prevents concurrent overspend.

Verified ledger invariants:

```text
append-only authoritative ledger
SUM(unit_delta) authoritative balance
per-user idempotent retry
no negative balance
failed overspend creates no event
parallel spends cannot overspend
read model remains consistent with ledger
```

## Migration 023 — Goin Issuance V1

Founder-approved V1 schedule:

```text
account_created       -> 10 goin
profile_email_added   -> 10 goin
referral_joined       -> 10 goin
referral_reward       -> 20 goin
draft_created         -> 0 goin
```

Verified seeded settings:

```text
goin_issuance_rule_version     = 1
goin_issue_account_created     = 10
goin_issue_profile_email_added = 10
goin_issue_referral_joined     = 10
goin_issue_referral_reward     = 20
goin_issue_draft_created       = 0
goin_reference_value_toman     = 250
```

Verified historical backfill:

```text
account_created       score=10  economy=10  issued=100
profile_email_added   score=7   economy=7   issued=70
referral_joined       score=5   economy=5   issued=50
referral_reward       score=5   economy=5   issued=100
draft_created         score=6   economy=0   issued=0
```

Total historical issuance at verification time:

```text
320 goin
```

Schema rerun produced identical counts and totals, proving no double issuance.

Future issuance trigger verification:

```text
new account_created score event
  -> one score_reward_issued economy event
  -> +10 goin
  -> ruleVersion=1
  -> policyKey=goin_issue_account_created
  -> backfill=false
```

Draft verification:

```text
new draft_created score event
  -> XP row created
  -> zero economy rows
```

The future-event tests were wrapped in transactions and rolled back.

## API boundary verification

Temporary sessions were created directly for verification and deleted afterward.

Verified:

```text
GET /api/economy without auth                     -> 401
GET /api/economy as active user                   -> 200
API balance/read model matched authenticated user -> PASS
GET /api/economy/events?limit=100                 -> 200
all returned events belonged to caller            -> PASS
GET /api/economy/events?limit=101                 -> 400
foreign userId query parameter could not switch ownership -> PASS
ordinary user GET /api/admin/economy/settings     -> 403
super_admin GET /api/admin/economy/settings       -> 200
super_admin no-op PUT current settings             -> 200 / changed=false
```

No active ordinary `admin` account existed in the local dataset, so that one role-specific runtime check was skipped. The permission contract remains `system.settings.manage`; ordinary admins do not receive that permission in the current role map.

Observed authenticated ordinary-user state during verification:

```text
balance          = 10
lifetimeIssued   = 10
lifetimeSpent    = 0
transactionCount = 1
```

Observed Super-Admin settings response:

```text
goinReferenceValueToman = 250
issuance.ruleVersion     = 1
accountCreated           = 10
profileEmailAdded        = 10
referralJoined           = 10
referralReward           = 20
draftCreated             = 0
```

Final test output:

```text
ALL 21E1 API BOUNDARY CHECKS PASSED
```

Temporary auth sessions were cleaned after the test.

## 21E1 conclusion

21E1 is closed.

The platform now has:

```text
independent spendable Goin ledger
safe concurrent debit behavior
idempotent economic mutation primitive
Goin state/history APIs
Super-Admin economy settings contract
versioned Goin issuance policy
deterministic historical backfill
future score-event -> Goin issuance bridge
XP/Goin semantic separation
```

## Handoff to 21E2

Next slice:

```text
024_prompt_archive_unlocks.sql
user_content_unlocks
server-authoritative Prompt Archive unlock cost
GET  /api/economy/unlocks/prompt-archive/:publicId
POST /api/economy/unlocks/prompt-archive/:publicId
atomic debit + durable unlock
single-charge semantics
insufficient-balance rejection
```

The frontend must not charge on every Copy click. A successful first unlock creates durable access; later Copy actions reuse that access at zero additional Goin cost.
