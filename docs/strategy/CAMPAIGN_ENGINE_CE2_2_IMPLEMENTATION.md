# Campaign Engine — CE2.2 Actions / Attempts Runtime

Status: **IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

## Inherited accepted state

```text
CE1 Foundation                 -> DONE / VERIFIED / ACCEPTED
Expiring / Promotional Goin V1 -> VERIFIED / ACCEPTED
CE2.1 Runtime Core             -> DONE / VERIFIED / ACCEPTED
```

Canonical CE2.1 verification record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE2_1_VERIFICATION.md
```

## CE2.2 implementation scope

CE2.2 adds the generic runtime primitives required before game-specific and chance-wheel mechanics:

```text
server-authoritative attempt reservation
campaign / calendar_day / rolling_24h / session attempt periods
calendar-day timezone boundaries
attempt idempotency
attempt-limit enforcement under participation row lock
attempt_created trusted domain event
bounded authenticated Actions endpoint
action request hashing / idempotency conflict detection
accepted/rejected campaign_actions audit rows
mechanic-state row lock + revision update
attempt_started safe generic Action
attempt_started trusted domain event linked to source_action_id
caller /state mechanic-state + attempt-availability enrichment
runtime publish validation for attempt policy
```

Implementation commits:

```text
32bce0faf8c98369d533e9cd81e2c2d947b64fc6  feat: route Campaign attempts and actions
aa9e910436ae8936cff7466ba5a900db0c3931c2  feat: add Campaign attempts and actions runtime
98dea7e662092527f1e2d98038c84f19c06f8ba6  fix: fail closed on invalid attempt timezone
```

Primary files:

```text
backend/src/campaignAttempts.mjs
backend/src/campaignActions.mjs
backend/src/campaignRuntimeActionsRoute.mjs
backend/src/campaignRuntimeDefinition.mjs
backend/src/campaignActionsAttempts.test.mjs
backend/src/publicInventory.mjs
```

No migration was required. Existing migration 029 already contains:

```text
campaign_actions.request_hash
campaign_mechanic_states revision boundary
campaign_attempts idempotency uniqueness
campaign_attempts period/index uniqueness
```

## Trust boundary

CE2.2 deliberately does not implement game outcome or chance-wheel authority.

Currently accepted generic Action:

```text
attempt_started
```

It can only move a caller-owned reserved attempt to `started` and update non-financial mechanic runtime state.

Until CE4 provides mechanic-specific validation / server RNG, requests such as:

```text
game_finished
spin_requested
client-supplied won/rewardAmount
```

must not produce trusted success outcome/reward effects. Unsupported actions may be persisted as rejected audit rows.

Browser input never selects:

```text
user identity
campaign version
period key
attempt index
allowed attempt count
winner / outcome
reward amount
reward expiry
Economy event identity
```

## Verification scope

Changed service scope:

```text
backend only
```

No SQL migration was added by CE2.2, therefore no `db:schema` rerun is required solely for this slice after migration 031 was already locally verified.

Smallest verification:

```powershell
pnpm api
docker compose exec api node --test src/campaignActionsAttempts.test.mjs src/campaignRuntime.test.mjs src/campaignFoundation.test.mjs
```

Optional HTTP auth-boundary smoke without needing a real campaign fixture:

```powershell
curl.exe -i -X POST http://localhost:4000/api/campaigns/nonexistent/mechanics/game/attempts ^
  -H "Content-Type: application/json" ^
  -d "{\"idempotencyKey\":\"smoke-attempt\"}"
```

Expected without Authorization header:

```text
HTTP 401
Authentication required
```

No frontend rebuild, `pnpm generate`, or `pnpm stack` is required.

## Focused test expectations

```text
calendar-day period key + nextEligibleAt honor configured timezone
invalid attempt policy cannot publish
first attempt reserves one server slot
same attempt idempotency key returns existing logical attempt
second attempt beyond period limit is rejected
exactly one attempt_created trusted event is produced
attempt_started requires caller-owned reserved attempt
accepted Action writes campaign_actions accepted=true
mechanic state revision advances under lock
attempt_started trusted event links to source action
same Action retry does not replay effects
same idempotency key + changed payload returns CAMPAIGN_IDEMPOTENCY_CONFLICT
unsupported game_finished remains rejected and cannot produce game_won/attempt_resolved/reward_granted
```

Do not mark CE2.2 DONE until founder-local evidence is clean and no hidden blocker is found.
