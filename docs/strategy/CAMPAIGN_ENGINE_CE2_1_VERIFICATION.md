# Campaign Engine — CE2.1 Runtime Core Verification

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

## Scope verified

CE2.1 established the first Campaign Runtime Core slice:

```text
public Campaign projection
caller-aware Campaign state
single V1 participation + version lock
authoritative Metric Registry resolvers
metric-backed completion refresh
Campaign Reward Grant -> existing Economy ledger
transaction-aware Economy integration
expiring/promotional Campaign Goin rewards
atomic reward budget guard
publish-time reward-budget seeding
reward-grant qualification identity contract
public HTTP Campaign runtime dispatch
```

Implementation / fix commits:

```text
2c6d66e151e735416d385463ef9afe649f75a971  feat: add Campaign runtime core
3239eb7933be1ec82d2821dc77ef78d4b9bd77a3  fix: tighten Campaign runtime semantics
0411be9a94f4a0fde188446d8933aa98764ea022  fix: export Campaign runtime helpers
163b9557c3fe21fc9a44fd0687b6e74ed3960813  fix: align Campaign reward grant contract
```

Migration added during verification hardening:

```text
031_campaign_reward_grant_contract.sql
```

Migration 031 aligns the implemented reward-grant table with the canonical DB contract by adding/normalizing:

```text
qualification_key
reward_type
qualification
failed_at
(participation_id, reward_definition_id, qualification_key) uniqueness
economy-event reconciliation uniqueness / FK behavior
full V1 reward-grant status allowlist
```

## Founder-local evidence

Founder-local verification on 2026-09-13 produced clean evidence:

```text
pnpm api
  -> PASS / API image rebuilt and started

docker compose exec api npm run db:schema
  -> PASS / migrations 001 through 031 applied

docker compose exec api node --test src/campaignRuntime.test.mjs
  -> PASS 6/6

verified runtime cases:
  effective scheduled/active/paused/ended/archive lifecycle
  private mechanic config + reward budget do not leak in public projection
  unrelated client_reported UI may coexist but cannot authorize Goin
  publish seeds reward budget inside publish transaction
  metric completion grants exactly one expiring Goin reward
  participation remains locked to original published version
  reward retry remains idempotent
  exhausted global reward budget fails later grant without Economy issuance

curl.exe -i http://localhost:4000/api/campaigns/nonexistent
  -> PASS / HTTP 404
  -> {"ok":false,"code":"CAMPAIGN_NOT_FOUND","message":"Campaign not found"}
```

The recurring Docker orphan `prompt-draft-cloudflared-1` warning is unrelated to this backend/runtime slice. No orphan removal or production topology change was performed.

## Acceptance

The supplied verification evidence is clean and engineering review found no hidden blocker. Under the founder acceptance convention used by this project, CE2.1 is accepted.

```text
CE2.1 Runtime Core -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

## Next slice

```text
CE2.2 — Actions / Attempts / Mechanic-State Runtime
```

CE2.2 remains backend-only unless implementation evidence requires otherwise. It must preserve:

```text
client Actions are untrusted
attempt allocation is server-authoritative and atomic
browser cannot choose period key / attempt index / winner / reward
mechanic state uses a serialized revision boundary
action idempotency cannot replay effects
published participation remains version-locked
CE4 still owns game-specific validation and chance-wheel server RNG
```
