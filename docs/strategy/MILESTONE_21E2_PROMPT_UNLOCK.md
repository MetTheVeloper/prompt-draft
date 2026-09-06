# Milestone 21E2 — Prompt Archive Durable Unlock

Status: **BACKEND IMPLEMENTED / AWAITING LOCAL VERIFICATION**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Predecessor:

```text
21E1 -> DONE / LOCALLY VERIFIED / USER ACCEPTED
```

## Goal

Introduce the first real demand/sink primitive for the Goin simulation without turning ordinary page views into billable actions.

Founder-approved semantic direction remains:

```text
view -> free
first meaningful copy/unlock -> may cost
repeat copy after access -> no repeated charge
```

21E2 implements the durable access backend. The existing Prompt detail read boundary remains unchanged in this slice; frontend Copy wiring follows after backend verification.

## Migration 024

New migration:

```text
backend/sql/024_prompt_archive_unlocks.sql
```

Seeds two server-side settings:

```text
goin_prompt_archive_unlock_cost = 5
goin_sink_rule_version          = 1
```

The initial 5-Goin amount is an experiment default, not a permanent Marketplace price.

At the current simulation reference value:

```text
5 goin × 250 toman ~= 1,250 toman reference value
```

This is still not a fiat purchase/redemption promise.

The migration also creates:

```text
user_content_unlocks
```

Schema direction:

```text
id UUID PK
user_id UUID FK users
resource_type TEXT
resource_id TEXT
economy_event_id UUID nullable FK user_economy_events
price_goin BIGINT >= 0
pricing_rule_version BIGINT > 0
metadata JSONB
unlocked_at TIMESTAMPTZ
UNIQUE(user_id, resource_type, resource_id)
```

Current resource type:

```text
prompt_archive_item
```

The generic table can later support Template/Workflow access without introducing full Marketplace Orders now.

## Unlock endpoints

The existing economy route now supports:

```text
GET  /api/economy/unlocks/prompt-archive/:publicId
POST /api/economy/unlocks/prompt-archive/:publicId
```

Both require:

```text
authenticated active user
completed email field
published Prompt Archive item
```

### GET semantics

Returns current access state and current policy without mutation:

```text
resource
unlocked
unlock row when present
policy.costGoin
policy.ruleVersion
economy state
canAfford
```

### POST semantics

If already unlocked:

```text
newlyUnlocked  = false
alreadyUnlocked = true
chargedGoin    = 0
```

If not yet unlocked and balance is sufficient:

```text
lock canonical user row
verify published Archive item
recheck durable unlock
read current sink policy
calculate current Goin balance
insert one negative economy event
insert one durable unlock row
commit both together
```

Economy event:

```text
event_type      = prompt_archive_unlock
unit_delta      = -current_cost
source_type     = prompt_archive_item
source_id       = publicId
idempotency_key = prompt_archive_unlock:v1:<publicId>
```

The debit metadata records:

```text
ruleVersion
policyKey = goin_prompt_archive_unlock_cost
publicId
accessKind = copy_unlock
```

The unlock row stores the actual historical charged price and pricing rule version, so later policy changes do not rewrite past purchases.

## Atomicity / concurrency

All unlock attempts for one user serialize on:

```sql
SELECT id FROM users WHERE id = $1 FOR UPDATE
```

This is the same canonical lock used by existing economy mutations and by score-event Goin issuance.

Consequences:

```text
two simultaneous unlocks cannot overspend the same balance
two simultaneous requests for the same Prompt cannot double-charge
failed insufficient-balance attempts create neither debit nor unlock
successful debit cannot commit without its matching durable unlock
```

## Insufficient balance

POST returns:

```text
HTTP 409
code = INSUFFICIENT_GOIN_BALANCE
balance
required
```

No economy row and no unlock row should be created.

## Free-policy edge case

The setting is allowed conceptually to reach zero later.

When cost is zero:

```text
create durable unlock
chargedGoin = 0
economy_event_id = null
no fake zero-value ledger event
```

The ledger still forbids zero-value economy events.

## Existing Archive detail boundary

21E2 deliberately does **not** make Prompt detail public and does not charge merely for viewing it.

Current boundary stays:

```text
/prompts list -> public
/api/archive list -> public
full /api/archive/:id detail -> login + email
```

The upcoming frontend slice should intercept the meaningful Copy action, request/reuse durable unlock, then proceed to Clipboard only when access succeeds.

This avoids both extremes:

```text
charging page views
charging every Copy click
```

## Local verification checklist

After pulling and applying migration 024, verify:

```text
setting seeds = 5 / ruleVersion 1
user_content_unlocks schema exists
GET unlock state returns locked + policy
first POST deducts exactly 5 and creates one unlock
second POST returns alreadyUnlocked + chargedGoin=0
ledger contains exactly one debit for that Prompt/user
parallel same-Prompt POST cannot double-charge
insufficient-balance POST creates no rows
foreign user cannot observe/reuse another user's unlock
invalid/unpublished Prompt returns 404
email-incomplete user remains blocked
```

Only after these pass should frontend Copy behavior be switched to the unlock flow.
