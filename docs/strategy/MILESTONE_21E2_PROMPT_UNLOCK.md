# Milestone 21E2 — Prompt Archive Durable Unlock

Status: **BACKEND LOCALLY VERIFIED / USER ACCEPTED · FRONTEND COPY WIRING IMPLEMENTED / AWAITING UI + BUILD VERIFICATION**

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

Founder-approved semantic direction:

```text
view -> free
first meaningful copy/unlock -> may cost
repeat copy after access -> no repeated charge
```

21E2 now has a locally verified backend durable-access primitive and a frontend Copy integration awaiting final visual/runtime verification.

## Migration 024

Migration:

```text
backend/sql/024_prompt_archive_unlocks.sql
```

Server-side simulation defaults:

```text
goin_prompt_archive_unlock_cost = 5
goin_sink_rule_version          = 1
```

The initial 5-Goin amount is an experiment default, not a permanent Marketplace price.

At the current simulation reference value:

```text
5 goin × 250 toman ~= 1,250 toman reference value
```

This remains simulation/reference metadata only and is not a fiat purchase/redemption promise.

Migration 024 creates:

```text
user_content_unlocks
```

Schema:

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

The generic table can later support Template/Workflow access without introducing full Marketplace Orders in Milestone 21.

## Local schema verification — PASSED

Migration 024 applied successfully:

```text
Database schema applied: 024_prompt_archive_unlocks.sql
```

Verified settings:

```text
goin_prompt_archive_unlock_cost = 5
goin_sink_rule_version          = 1
```

Verified constraints/indexes:

```text
PRIMARY KEY (id)
UNIQUE(user_id, resource_type, resource_id)
UNIQUE(economy_event_id) WHERE economy_event_id IS NOT NULL
price_goin >= 0
pricing_rule_version > 0
FK user_id -> users ON DELETE CASCADE
FK economy_event_id -> user_economy_events ON DELETE SET NULL
```

## Unlock endpoints

Backend routes:

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

Returns current caller-owned access state without mutation:

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

Already unlocked:

```text
newlyUnlocked   = false
alreadyUnlocked = true
chargedGoin     = 0
```

First paid unlock:

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

Economy debit:

```text
event_type      = prompt_archive_unlock
unit_delta      = -current_cost
source_type     = prompt_archive_item
source_id       = publicId
idempotency_key = prompt_archive_unlock:v1:<publicId>
```

Debit metadata:

```text
ruleVersion
policyKey = goin_prompt_archive_unlock_cost
publicId
accessKind = copy_unlock
```

The durable unlock stores the actual historical charged price and pricing-rule version so future policy changes do not rewrite past access.

## Atomicity / concurrency

All unlock attempts for one user serialize on the canonical user row:

```sql
SELECT id FROM users WHERE id = $1 FOR UPDATE
```

Consequences:

```text
two simultaneous unlocks cannot overspend the same balance
two simultaneous requests for the same Prompt cannot double-charge
failed insufficient-balance attempts create neither debit nor unlock
successful debit and durable access commit together
```

## Backend behavioral verification — PASSED

A self-contained local verification created temporary users and sessions, exercised real Goin issuance and real published Prompt Archive rows, then deleted the temporary users so their sessions/ledger/unlocks were removed by existing foreign-key behavior.

Verified buyer baseline through real issuance rules:

```text
account_created       -> +10 goin
profile_email_added   -> +10 goin
starting balance      -> 20 goin
```

Verified auth/access boundary:

```text
anonymous GET unlock state -> 401
email-incomplete user      -> 403
foreign user sees only own unlock state
missing Archive public ID  -> 404
```

No unpublished Archive row existed in the local fixture, so the explicit unpublished-row runtime check was skipped. The backend query still restricts the resource lookup to `status = 'published'`.

Verified view-is-free invariant:

```text
GET /api/archive/:id -> 200
balance before == balance after
no user_content_unlocks row
no prompt_archive_unlock debit
```

Verified first unlock:

```text
first POST        -> 200
newlyUnlocked     -> true
alreadyUnlocked   -> false
chargedGoin       -> 5
balance           -> 20 -> 15
unlock rows       -> exactly 1
debit rows        -> exactly 1
```

Verified historical provenance:

```text
price_goin             = 5
pricing_rule_version   = 1
economy unit_delta     = -5
economy_event_id       = linked
idempotency_key        = prompt_archive_unlock:v1:<publicId>
metadata.publicId      = correct
metadata.accessKind    = copy_unlock
```

Verified repeat access:

```text
second POST       -> 200
newlyUnlocked     -> false
alreadyUnlocked   -> true
chargedGoin       -> 0
balance unchanged
still one unlock row
still one debit row
```

Verified same-Prompt concurrency with two simultaneous POST requests:

```text
both HTTP 200
one request newlyUnlocked=true / chargedGoin=5
one request alreadyUnlocked=true / chargedGoin=0
total charged = 5
one durable unlock row
one debit row
```

Verified insufficient-balance atomicity:

```text
temporary user balance -> 0
POST                    -> 409
code                    -> INSUFFICIENT_GOIN_BALANCE
balance                 -> 0
required                -> 5
new debit rows          -> 0
new unlock rows         -> 0
```

Final buyer state after unlocking two unique Prompts:

```text
lifetimeIssued = 20
lifetimeSpent  = 10
balance        = 10
```

The verification concluded:

```text
ALL 21E2 BACKEND UNLOCK CHECKS PASSED
```

## Frontend Copy integration — IMPLEMENTED / AWAITING LOCAL VERIFICATION

New client composable:

```text
app/composables/usePromptArchiveUnlock.ts
```

Responsibilities:

```text
GET current Prompt unlock state
POST first unlock
caller auth headers only
client-side policy/economy/access state
normalized insufficient-balance failure state
no client-side authority over pricing or balance
```

Updated detail UI:

```text
app/components/prompts/PromptDetail.vue
```

Copy behavior now follows:

```text
Prompt detail loads
  -> GET unlock state (read-only)

Copy click
  -> if already unlocked: clipboard directly
  -> if locked: POST durable unlock
  -> insufficient balance: stop, show Goin feedback, do not copy
  -> success/already unlocked: copy selected prompt variant
  -> track existing prompt_archive_copy only after clipboard success
```

The backend remains authoritative. The frontend does not calculate whether a debit should be accepted and does not create a local unlock independently.

UX copy communicates before the first action:

```text
Unlock & copy · 5 goin
First copy unlocks this prompt for 5 goin. Your balance: N.
```

After durable access:

```text
Copy prompt
Unlocked · future copies of this prompt are free.
```

Insufficient balance feedback includes server-reported `required` and `balance` values.

Clipboard failure after a successful unlock does not refund or recreate access: the durable access remains valid and the user can retry Copy without a second charge.

EN/FA strings were added through the Growth locale overlay so existing Prompt Archive locale ownership remains intact.

## Existing Archive detail boundary

21E2 does **not** make Prompt detail public and does not charge page views.

Current boundary remains:

```text
/prompts list -> public
/api/archive list -> public
full /api/archive/:id detail -> login + email
```

## Final local verification still required

Before closing 21E2:

```text
pnpm generate PASS
open a locked Prompt detail in EN + FA
confirm first Copy shows 5-Goin contract before action
confirm first Copy deducts exactly 5 and copies text
confirm second Copy does not deduct again
switch variant and confirm no second unlock charge
refresh/reopen same Prompt and confirm durable unlocked state reloads
open another Prompt and confirm it is independently locked
verify insufficient-Goin UX prevents clipboard copy
verify Dark/Light rendering of new status text/buttons
verify existing prompt_archive_copy analytics still fires only after successful clipboard copy
```

Only after those checks pass should 21E2 be marked DONE / USER ACCEPTED.
