# Milestone 21E — Internal Economy Simulation Design

Status: **21E1 FOUNDATION IMPLEMENTED / AWAITING LOCAL VERIFICATION**

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
  -> goin is earned
  -> user sees a spendable goin balance
  -> user spends goin on a real value-extraction action
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
system.settings.manage permission
admin_audit_log
```

### Existing but semantically insufficient

```text
XP can explain achievement/reward history
XP total is SUM(user_score_events.points)
negative score rows are technically possible
system.settings.manage existed without a persisted settings service
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
spendable goin ledger
atomic debit transaction primitive
spendable balance read model
durable per-user access/unlock state
goin transaction history API
economy-scoped persisted settings
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

Authoritative table:

```text
user_economy_events
```

This is **not** a second gamification/XP system.

Responsibilities are deliberately separated:

```text
user_score_events
  -> achievement / reward provenance / lifetime XP

user_economy_events
  -> spendable goin issuance / debit / refund / correction
```

Economy issuance originating from an XP/reward event should reference that score event rather than invent unrelated reward causes.

## 4. Branded unit and simulation reference value

Founder-approved internal unit name:

```text
goin
```

V1 uses whole-number goin:

```text
code = goin
name = goin
decimals = 0
```

Initial simulation reference valuation:

```text
1 goin = 250 toman
```

This is intentionally classified as:

```text
simulation_reference
```

It is **not**:

```text
a purchase price
a cash-out rate
a redemption promise
a guaranteed real-world value
a market exchange rate
```

The value exists so product/economy experiments can communicate approximate scale while actual commercial pricing remains unfrozen.

The reference value is persisted under:

```text
goin_reference_value_toman
```

and is configurable by `system.settings.manage`. Under the current role map that means Super-Admin in practice.

A settings update must be audited.

## 5. Economy ledger and settings schema

Migration:

```text
022_user_economy_foundation.sql
```

Implemented ledger:

```text
user_economy_events
  id UUID PK
  user_id UUID FK users(id)
  event_type TEXT
  unit_delta BIGINT CHECK unit_delta <> 0
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
users.goin_balance
```

as a second mutable source of truth.

A cached projection may be introduced later only if scale requires it.

Implemented economy-scoped settings table:

```text
economy_settings
  setting_key TEXT PK
  integer_value BIGINT
  updated_by UUID nullable FK users(id)
  updated_at TIMESTAMPTZ
```

Migration seeds `goin_reference_value_toman = 250` with `ON CONFLICT DO NOTHING`, so re-running schema does not overwrite a Super-Admin change.

## 6. Issuance policy

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
eligible for goin? yes/no
goin amount
rule version
stable economy idempotency key
```

Important:

- existing XP amounts do not automatically become a permanent goin conversion promise;
- V1 may mirror current amounts for the simulation bootstrap, but the mapping must be explicit and versioned;
- future XP achievements may be reputation-only and issue zero goin;
- meaningless repetitive actions must not become goin sources.

Historical eligible score events can be backfilled deterministically into the economy ledger once the V1 issuance mapping is frozen.

The `250 toman` reference value is independent from the issuance mapping.

## 7. Atomic no-overspend contract

A spend must be one database transaction.

Implemented mutation primitive uses:

```text
BEGIN
  SELECT canonical user row FOR UPDATE
  check existing economy idempotency key
  validate score-event provenance when supplied
  calculate current SUM(unit_delta)
  if balance + delta < 0 -> reject INSUFFICIENT_GOIN_BALANCE
  insert append-only economy event
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

No user-controlled HTTP credit/debit endpoint exists in 21E1.

## 8. Durable unlock/access primitive

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

## 9. First simulation sink

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

The exact **goin price of the unlock is still not frozen**.

Important distinction:

```text
1 goin = 250 toman reference value
```

does not mean:

```text
one Prompt unlock = 1 goin
```

The first sink price must be a separate server-authoritative and versioned policy.

## 10. Backend APIs

### Read current economy state

Implemented:

```text
GET /api/economy
```

Response includes:

```text
unit.code = goin
unit.name = goin
unit.decimals = 0
unit.referenceValueToman
unit.referenceValueKind = simulation_reference
balance
lifetimeIssued
lifetimeSpent
transactionCount
```

Requires backend-resolved authenticated identity.

### Transaction history

Implemented:

```text
GET /api/economy/events?limit=<1..100>&cursor=<cursor>
```

User sees only their own ledger.

### Super-Admin reference-value settings

Implemented:

```text
GET /api/admin/economy/settings
PUT /api/admin/economy/settings
```

PUT body:

```json
{
  "goinReferenceValueToman": 250
}
```

Authorization:

```text
system.settings.manage
```

Current role mapping makes this Super-Admin-only in practice.

Actual changes produce admin audit action:

```text
economy.goin_reference_value_updated
```

### Future unlock action

Direction:

```text
POST /api/economy/unlocks/prompt-archive/:publicId
```

Response must distinguish:

```text
newlyUnlocked
alreadyUnlocked
insufficientGoin
balanceAfter
```

Do not make client-side balance checks authoritative.

## 11. Frontend state

Do not rename `auth.totalXp` to a currency balance.

Introduce a distinct economy state/composable, for example:

```text
useEconomy()
```

Responsibilities:

```text
goin balance
lifetime issued/spent
reference value display
refresh
transaction history
unlock result application
```

Profile UI can eventually show both:

```text
XP / reputation
goin / spendable balance
```

as separate concepts.

## 12. Economy analytics

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

## 13. Privacy / security

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

Only `system.settings.manage` may mutate the goin simulation reference value.

## 14. Inflation / farming controls

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

## 15. Implementation slices

### 21E1 — Economy ledger/read model

Implemented foundation:

```text
migration 022
user_economy_events
economy_settings
goin naming
250-toman simulation reference setting
backend economy service
atomic balance calculation
idempotent credit/debit primitive
GET /api/economy
GET /api/economy/events
Super-Admin economy settings API
admin audit on setting changes
```

Still required before 21E1 issuance closure:

```text
initial deterministic issuance/backfill policy
local verification of migration/read/settings/no-overspend behavior
```

### 21E2 — Durable access primitive

```text
user_content_unlocks
Prompt Archive unlock price policy
single-charge semantics
insufficient-balance response
repeat-access response
```

### 21E3 — UI simulation

```text
distinct goin balance UI
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
repeat unlock costs zero additional goin
XP total does not decrease when goin is spent
transaction history belongs only to authenticated owner
Super-Admin can update reference value
admin/user cannot update reference value under current role map
setting update is audited
analytics failure cannot affect transaction outcome
pnpm generate PASS
```

## 16. Founder-controlled values

Frozen now:

```text
internal unit name = goin
initial simulation reference value = 250 toman per goin
reference value is Super-Admin configurable
```

Still open:

```text
V1 issuance mapping / whether current XP reward amounts mirror goin 1:1
initial goin account grant
first Prompt unlock price in goin
whether all Archive items share one experiment price or a small server-side tier set
UI wording for XP vs goin beyond the unit name
```

No fiat conversion, purchase, payout or investment value is introduced in Milestone 21.

## 17. Hard rules

```text
DO NOT make spending reduce lifetime XP/reputation.
DO NOT add a mutable users.balance source of truth.
DO NOT trust frontend balance checks.
DO NOT charge on every Copy click.
DO NOT create an unlock without its matching debit atomically.
DO NOT create a debit without durable access atomically when a debit purchases access.
DO NOT expose one user's economy history to another user.
DO NOT treat analytics as economy authority.
DO NOT treat the 250-toman reference value as a buy/cash-out/redemption guarantee.
DO NOT introduce fiat purchase/cash-out/payout in 21E.
DO NOT build the full Marketplace Product/Order system inside this simulation.
```

## 18. Current result

The existing XP ledger remains the achievement/reputation ledger.

The dedicated goin ledger now exists because spendable currency has different invariants: debit, atomic balance protection, refunds/corrections and durable access.

The two systems remain connected through explicit reward provenance rather than through duplicated ad-hoc gamification rules.

21E1 infrastructure is implemented and awaits local verification plus a frozen initial goin issuance mapping before the first paid/unlock simulation is activated.
