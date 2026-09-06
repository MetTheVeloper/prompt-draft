# Milestone 21E — Internal Economy Simulation Implementation

Status: **21E1 FOUNDATION IMPLEMENTED / AWAITING LOCAL VERIFICATION**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Design source:

```text
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
```

## Founder decisions frozen for this slice

### Branded unit

The internal spendable unit is named:

```text
goin
```

Technical code and user-facing naming should use `goin` unless a later explicit product decision changes branding.

### Simulation reference value

The initial reference valuation is:

```text
1 goin = 250 toman
```

This value is **simulation/reference metadata only**.

It is not:

```text
a fiat purchase price
a cash-out promise
a guaranteed redemption value
a market exchange rate
an investment/token valuation
```

The purpose is to let the simulation express approximate economic scale while real pricing remains unfrozen.

The value is persisted server-side under:

```text
goin_reference_value_toman
```

Default:

```text
250
```

It can be changed by a user with:

```text
system.settings.manage
```

Under the current role map this is effectively Super-Admin-only because `super_admin` has `*` and ordinary `admin` does not have `system.settings.manage`.

Every actual setting change is recorded in `admin_audit_log`.

## Capability audit result for settings

The authorization permission `system.settings.manage` already existed, but no general persisted system-settings service/table was found in the current backend.

21E therefore adds a deliberately narrow `economy_settings` persistence primitive rather than inventing a broad parallel settings platform.

A future Manage settings UI can use the API introduced here without changing the storage contract.

## Migration 022

New migration:

```text
backend/sql/022_user_economy_foundation.sql
```

Creates:

```text
user_economy_events
economy_settings
```

### `user_economy_events`

Authoritative spendable-goin ledger:

```text
id UUID PK
user_id UUID FK users(id)
event_type TEXT
unit_delta BIGINT non-zero
source_type TEXT nullable
source_id TEXT nullable
source_score_event_id TEXT nullable FK user_score_events(id)
idempotency_key TEXT
metadata JSONB
created_at TIMESTAMPTZ
UNIQUE(user_id, idempotency_key)
```

Authoritative balance remains:

```text
SUM(user_economy_events.unit_delta)
```

No mutable `users.balance`, `users.goin_balance` or equivalent source of truth is introduced.

### `economy_settings`

V1 intentionally stores only economy-scoped settings:

```text
setting_key
integer_value
updated_by
updated_at
```

Migration seeds:

```text
goin_reference_value_toman = 250
```

The seed is rerunnable through `ON CONFLICT DO NOTHING`, so an operator-updated value is not reset by reapplying schema migrations.

## Backend economy service

New:

```text
backend/src/economy.mjs
```

Defines the canonical unit:

```text
code = goin
name = goin
decimals = 0
```

Current read model:

```text
balance
lifetimeIssued
lifetimeSpent
transactionCount
unit.code
unit.name
unit.decimals
unit.referenceValueToman
unit.referenceValueKind = simulation_reference
```

### Atomic mutation primitive

`recordUserEconomyEvent(...)` is the internal mutation primitive for future credits, debits, refunds and corrections.

Concurrency contract:

```text
BEGIN
SELECT user row FOR UPDATE
read existing idempotency key
validate optional score-event provenance
SUM current goin balance
reject if debit would make balance negative
insert append-only economy event
COMMIT
```

Therefore parallel economy mutations for one user serialize on the canonical user row and cannot both spend the same balance.

Current implementation deliberately exposes no user-controlled HTTP credit/debit endpoint.

## User economy APIs

### Current state

```text
GET /api/economy
```

Requires authenticated active user.

The backend resolves ownership from the Bearer session; no `userId` request field is accepted.

### Transaction history

```text
GET /api/economy/events?limit=<1..100>&cursor=<cursor>
```

Requires authenticated active user and returns only that user's ledger.

Pagination is ordered by:

```text
created_at DESC, id DESC
```

## Super-Admin economy settings API

New route module:

```text
backend/src/adminEconomyRoute.mjs
```

### Read

```text
GET /api/admin/economy/settings
```

### Change simulation reference value

```text
PUT /api/admin/economy/settings
Content-Type: application/json

{
  "goinReferenceValueToman": 250
}
```

Authorization:

```text
system.settings.manage
```

Current practical role access:

```text
super_admin -> allowed
admin       -> forbidden
user        -> forbidden
```

Validation:

```text
integer only
1..1,000,000,000 toman
strict body: only goinReferenceValueToman
4 KiB body limit
```

Audit action when value actually changes:

```text
economy.goin_reference_value_updated
```

Audit metadata contains previous/new toman values and marks the setting as a simulation reference.

Submitting the already-current value is a no-op and does not create a fake audit change.

## Important non-decisions

This slice does **not** choose:

```text
XP -> goin issuance mapping
initial goin grant per account
Prompt Archive unlock price in goin
fiat buy price
cash-out/payout rate
Creator revenue share
```

In particular:

> `1 goin = 250 toman` does not mean an Archive Prompt costs 1 goin, and it does not imply users can buy or redeem goin for 250 toman.

The first sink price remains a separate server-authoritative policy decision for 21E2.

## XP separation remains authoritative

```text
user_score_events   -> achievement / lifetime XP / reward provenance
user_economy_events -> spendable goin
```

Spending goin must never reduce `totalXp`.

Future goin issuance may reference `source_score_event_id` so existing reward provenance is reused without turning XP itself into the wallet.

## Local verification handoff

After pulling:

```powershell
git pull
docker compose up -d --build api
docker compose exec api npm run db:schema
```

Expected final migration line:

```text
Database schema applied: 022_user_economy_foundation.sql
```

Inspect schema/settings:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d user_economy_events"
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT * FROM economy_settings ORDER BY setting_key;"
```

Expected initial setting:

```text
goin_reference_value_toman | 250
```

Authenticated API tests and atomic ledger mutation tests should be completed before marking 21E1 locally verified.

## Next slice

After 21E1 verification:

```text
freeze a simulation issuance mapping
add deterministic goin issuance/backfill from selected existing score-event provenance
then implement durable Prompt Archive unlock/access semantics
```

Do not activate a paid unlock until users have a deterministic, testable source of goin and the sink price is server-authoritative.
