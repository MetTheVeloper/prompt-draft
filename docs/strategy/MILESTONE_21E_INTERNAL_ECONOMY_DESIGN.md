# Milestone 21E — Internal Economy Simulation Design

Status: **CAPABILITY AUDIT COMPLETE / DESIGN BASELINE CREATED / IMPLEMENTATION READY**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Predecessor:

```text
Milestone 21D — DONE / LOCALLY VERIFIED / USER ACCEPTED
```

Primary strategy source:

```text
docs/strategy/PRICING_AND_INTERNAL_ECONOMY_V1.md
```

Inherited platform source:

```text
docs/backend/MILESTONE_15_SCORE_LEDGER.md
backend/src/userScore.mjs
backend/sql/009_user_score_events.sql
```

## 1. Goal

21E should prove whether Prompt Draft can support a safe virtual circulation loop before fiat payments or full Marketplace commerce exist.

The experiment is:

```text
meaningful platform activity
  -> internal units are earned
  -> user sees a spendable balance
  -> user spends units on a real value-extraction action
  -> durable access prevents repeated charging
  -> circulation is measurable
```

21E is not a payment system and not a cryptocurrency/token launch.

## 2. Capability audit

### Existing — reuse

```text
user_score_events append-only ledger
per-user idempotency keys
positive/negative integer capability at schema level
existing account/email/Draft/referral reward rules
getUserScoreState lifetime XP read model
withDatabaseTransaction(...)
Auth/session identity
Prompt Archive stable public_id
protected full Prompt detail
Behavioral Analytics from 21A
```

### Existing but semantically insufficient

```text
XP can explain achievement/reward history
XP total is SUM(user_score_events.points)
negative score rows are technically possible
```

But current XP is **not** a safe spendable wallet because:

```text
no atomic no-overspend rule
no wallet transaction contract
no debit/refund semantics
no balance lock/concurrency contract
no durable unlock/access state
no user-facing transaction history
spending directly from user_score_events would make displayed XP/reputation fall
```

### Genuinely new

```text
spendable internal-unit ledger
atomic debit transaction primitive
spendable balance read model
durable per-user access/unlock state
unit transaction history API
economy analytics events
controlled first sink
```

## 3. Core semantic decision

### Do not turn current XP balance into a mutable wallet balance

Current `totalXp` remains an achievement/reputation-oriented read model.

Spending must **not** reduce the XP number shown on a user's profile.

Reason:

```text
Creator/user reputation and spendable currency are different concepts.
A user should not lose visible achievement/reputation by buying something.
```

This follows the founder-approved pricing/economy direction:

> Creator Level / reputation must not simply equal current coin balance.

### Introduce a dedicated economy ledger, but reuse existing reward provenance

Recommended new authoritative table:

```text
user_economy_events
```

This is **not** a second gamification/XP system.

Responsibilities are deliberately separated:

```text
user_score_events
  -> achievement / reward provenance / lifetime XP

user_economy_events
  -> spendable unit issuance / debit / refund / correction
```

Economy issuance originating from an XP/reward event should reference that score event rather than invent unrelated reward causes.

## 4. Proposed economy ledger

Next migration:

```text
022_user_economy_foundation.sql
```

Proposed schema:

```text
user_economy_events
  id UUID PK
  user_id UUID FK users(id)
  event_type TEXT
  unit_delta INTEGER CHECK unit_delta <> 0
  source_type TEXT nullable
  source_id TEXT nullable
  source_score_event_id TEXT nullable FK user_score_events(id)
  idempotency_key TEXT
  metadata JSONB
  created_at TIMESTAMPTZ

UNIQUE(user_id, idempotency_key)
```

Authoritative spendable balance:

```text
SUM(user_economy_events.unit_delta)
```

Do not add:

```text
users.credit_balance
users.coin_balance
```

as a second mutable source of truth.

A cached projection may be introduced later only if scale requires it.

## 5. Issuance policy

21E should reuse meaningful reward provenance already implemented rather than create farming loops.

Current eligible source candidates:

```text
account_created
profile_email_added
draft_created
referral_joined
referral_reward
```

The economy layer should use an explicit server-side issuance registry.

For each source event define:

```text
eligible for units? yes/no
unit amount
rule version
stable economy idempotency key
```

Important:

- existing XP amounts do not automatically become a permanent exchange-rate promise;
- V1 may mirror current amounts for the simulation bootstrap, but the mapping must be explicit and versioned;
- future XP achievements may be reputation-only and issue zero units;
- meaningless repetitive actions must not become unit sources.

Historical eligible score events can be backfilled deterministically into the economy ledger once the V1 issuance mapping is frozen.

## 6. Atomic no-overspend contract

A spend must be one database transaction.

Proposed sequence:

```text
BEGIN
  SELECT user row FOR UPDATE
  calculate current economy SUM(unit_delta)
  if balance < cost -> reject INSUFFICIENT_UNITS
  insert deterministic debit event
  create/update durable access row if action grants access
COMMIT
```

The same user lock must be used by economy-credit/debit operations that can race with spending.

Retry safety:

```text
same logical purchase/unlock
  -> same idempotency key
  -> at most one debit
```

A duplicate request must return the existing outcome rather than charge twice.

## 7. Durable unlock/access primitive

Founder direction already defines:

```text
view -> free
first meaningful copy/unlock -> may cost
repeat access -> no repeated charge for same unlock
```

Therefore the first paid simulation sink must not be implemented as "charge every Copy button click".

Proposed durable table when the first sink is activated:

```text
user_content_unlocks
  id UUID PK
  user_id UUID
  resource_type TEXT
  resource_id TEXT
  economy_event_id UUID
  unlocked_at TIMESTAMPTZ

UNIQUE(user_id, resource_type, resource_id)
```

First supported resource type can be:

```text
prompt_archive_item
```

This keeps the access primitive extensible to future Template/Workflow products without introducing the full Marketplace schema now.

## 8. First simulation sink

Best existing surface:

```text
Prompt Archive full Prompt unlock / first meaningful copy access
```

Why:

- public discovery now exists;
- stable Archive public IDs exist;
- full Prompt detail is already a distinct protected value boundary;
- Copy analytics already exists;
- durable access semantics are easy to explain;
- no Product/Order/Payment/Payout schema is required.

However, the exact unit price is intentionally **not frozen in this design document**.

The first implementation should keep price policy server-authoritative and versioned rather than scatter a literal value across UI/backend.

## 9. Suggested backend API shape

### Read current economy state

```text
GET /api/economy
```

Response direction:

```json
{
  "ok": true,
  "economy": {
    "balance": 3500,
    "lifetimeIssued": 4000,
    "lifetimeSpent": 500,
    "transactionCount": 6
  }
}
```

Technical naming should remain `units`/`economy` until a branded currency name is approved.

### Transaction history

```text
GET /api/economy/events?limit=<n>&cursor=<cursor>
```

User sees only their own ledger.

### Future unlock action

Direction:

```text
POST /api/economy/unlocks/prompt-archive/:publicId
```

Response must distinguish:

```text
newlyUnlocked
alreadyUnlocked
insufficientUnits
balanceAfter
```

Do not make client-side balance checks authoritative.

## 10. Frontend state

Do not rename `auth.totalXp` to a currency balance.

Introduce a distinct economy state/composable, for example:

```text
useEconomy()
```

Responsibilities:

```text
balance
lifetime issued/spent
refresh
transaction history
unlock result application
```

Profile UI can eventually show both:

```text
XP / reputation
Units / spendable balance
```

as separate concepts.

## 11. Economy analytics

21A analytics should measure economy behavior but must not be transaction authority.

Candidate product events:

```text
economy_balance_viewed
prompt_unlock_started
prompt_unlock_succeeded
prompt_unlock_insufficient_balance
prompt_unlock_reused
```

Authoritative financial-like facts remain database economy/access rows.

Analytics failure must never change debit/access success.

## 12. Privacy / security

Never place in analytics metadata:

```text
full Prompt body
private Draft content
email
session token
ledger internals not needed for product analysis
```

Economy APIs require authenticated user identity resolved by backend.

No user-supplied `userId` should determine ledger ownership.

## 13. Inflation / farming controls

Carry forward Milestone 15 principles:

```text
no reward per routine autosave
stable idempotency for one-time milestones
versioned issuance rules
no client-authoritative awards
```

Future controls may include:

```text
campaign caps
maturity windows
fraud/abuse review
reward schedule changes
```

but should be added only when evidence requires them.

## 14. Implementation slices

### 21E1 — Economy ledger/read model

```text
migration 022
user_economy_events
backend economy service
atomic balance calculation
idempotent credit/debit primitive
GET /api/economy
GET /api/economy/events
initial deterministic issuance/backfill policy
```

### 21E2 — Durable access primitive

```text
user_content_unlocks
Prompt Archive unlock policy
single-charge semantics
insufficient-balance response
repeat-access response
```

### 21E3 — UI simulation

```text
distinct spendable balance UI
unlock CTA/state
transaction-history surface if useful
EN/FA copy
analytics producers
```

### 21E4 — Verification

```text
initial issuance correct
backfill rerunnable
same debit retry cannot double-charge
parallel spends cannot overspend
insufficient balance cannot create unlock
successful debit + unlock atomic
repeat unlock costs zero additional units
XP total does not decrease when units are spent
transaction history belongs only to authenticated owner
analytics failure cannot affect transaction outcome
pnpm generate PASS
```

## 15. Open founder-controlled values

Infrastructure can proceed without hardcoding these decisions globally, but the controlled sink experiment must freeze them before activation:

```text
branded internal unit name
V1 issuance mapping / whether current XP amounts mirror 1:1
first Prompt unlock price
whether all Archive items share one experiment price or a small server-side tier set
UI wording for XP vs units
```

No fiat conversion rate, payout or investment value should be introduced in Milestone 21.

## 16. Hard rules

```text
DO NOT make spending reduce lifetime XP/reputation.
DO NOT add a mutable users.balance source of truth.
DO NOT trust frontend balance checks.
DO NOT charge on every Copy click.
DO NOT create an unlock without its matching debit atomically.
DO NOT create a debit without durable access atomically when a debit purchases access.
DO NOT expose one user's economy history to another user.
DO NOT treat analytics as economy authority.
DO NOT introduce fiat purchase/cash-out/payout in 21E.
DO NOT build the full Marketplace Product/Order system inside this simulation.
```

## 17. Result of design audit

The existing XP ledger is valuable and should be preserved, but it should remain the achievement/reputation ledger.

A dedicated internal economy ledger is justified because spendable currency has different invariants: debit, atomic balance protection, refunds/corrections and durable access.

The two systems remain connected through explicit reward provenance rather than through duplicated ad-hoc gamification rules.

21E is ready for implementation slice 21E1 once the initial issuance mapping is selected/frozen in code.
