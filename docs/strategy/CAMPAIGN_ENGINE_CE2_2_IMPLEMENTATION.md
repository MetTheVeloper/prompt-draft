# Campaign Engine — CE2.2 Actions / Attempts Runtime

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

## Inherited accepted state

```text
CE1 Foundation                 -> DONE / VERIFIED / ACCEPTED
Expiring / Promotional Goin V1 -> DONE / VERIFIED / ACCEPTED
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
6bc2c35d8bdde3c17dba89c6110e00fd826e8fff  fix: type Campaign mechanic action timestamp
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

## Founder-local verification evidence

Changed service scope:

```text
backend only
```

No SQL migration was added by CE2.2, therefore no `db:schema` rerun was required after migration 031 had already been locally verified.

Initial focused regression on 2026-09-13:

```powershell
pnpm api
docker compose exec api node --test src/campaignActionsAttempts.test.mjs src/campaignRuntime.test.mjs src/campaignFoundation.test.mjs
```

Result:

```text
20 tests
19 pass
1 fail
```

The single failure was isolated to the `attempt_started` mechanic-state timestamp update. PostgreSQL inferred one shared parameter as `text` because it was also used inside JSON construction, then rejected that value for `updated_at TIMESTAMPTZ`.

The runtime behavior was unchanged; commit `6bc2c35d8bdde3c17dba89c6110e00fd826e8fff` added explicit `timestamptz` casts to the two affected SQL expressions.

Founder reran the smallest affected suite:

```powershell
pnpm api
docker compose exec api node --test src/campaignActionsAttempts.test.mjs
```

Result:

```text
5 tests
5 pass
0 fail
```

Verified behaviors:

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
unsupported game_finished remains rejected and cannot produce trusted success effects
```

HTTP auth-boundary smoke:

```powershell
curl.exe -i -X POST http://localhost:4000/api/campaigns/nonexistent/mechanics/game/attempts -H "Content-Type: application/json" -d '{"idempotencyKey":"smoke-attempt"}'
```

Result:

```text
HTTP/1.1 401 Unauthorized
{"ok":false,"message":"Authentication required"}
```

This confirms the authenticated runtime boundary does not disclose campaign existence before authentication.

The only runtime warning was the already-known unrelated orphan `prompt-draft-cloudflared-1` Compose warning. No topology cleanup was performed as part of CE2.2.

Because only backend source/tests changed, frontend rebuild, `pnpm generate`, `db:schema`, and `pnpm stack` were correctly not used.

No hidden blocker remains in the supplied founder-local evidence. CE2.2 is therefore accepted.

## Next boundary

CE2 generic runtime is now established far enough for subsequent slices to build on it without letting browser actions become outcome/reward authority.

Next Campaign work should follow the current Campaign Engine scheduling documentation and re-read the latest branch before every write.
