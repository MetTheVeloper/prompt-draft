# Campaign Engine V1 — CE1 Foundation Verification

Status: **FOUNDER-LOCAL VERIFIED / EXPLICIT ACCEPTANCE PENDING**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

Implementation commit verified:

```text
1f8c35ee9041e600ba6d99d37c595f446842d000
feat: add Campaign Engine CE1 foundation
```

This record captures the first founder-local verification evidence for CE1. It does **not** mark CE1 DONE or ACCEPTED. Explicit founder acceptance remains required before closing the slice.

---

## 1. Verified scope

CE1 implementation under verification contains:

```text
backend/sql/029_campaign_engine_v1.sql
backend/src/authorization.mjs
backend/src/campaignDefinition.mjs
backend/src/campaignFoundation.test.mjs
backend/src/campaignRegistry.mjs
backend/src/campaignRules.mjs
backend/src/campaigns.mjs
```

Implemented CE1 capabilities:

```text
Campaign schema foundation
marketing permissions
Campaign Definition draft/publish validation
Campaign head persistence
optimistic draft revision persistence
immutable published Campaign Version model
publish idempotency under Campaign row lock
admin_audit_log writes for privileged Campaign mutations
Renderer Registry skeleton
Mechanic Registry skeleton
Metric Registry skeleton
RuleExpression validation/evaluation
deterministic Campaign Definition hashing
```

No Campaign-specific wallet or balance was introduced.

The authoritative Goin ledger remains:

```text
user_economy_events
```

`campaign_reward_grants.economy_event_id` references that existing ledger.

Product Analytics remains observational and was not made reward authority.

---

## 2. Smallest-scope verification used

Changed implementation services were backend/API + SQL only.

Therefore verification intentionally used:

```text
pnpm api
focused CE1 backend tests
db:schema
campaign table inventory
```

Not used:

```text
pnpm frontend
pnpm generate
pnpm stack
```

No frontend files changed, so frontend rebuild/generate would have been reassurance rather than evidence.

---

## 3. Founder-local API rebuild evidence

Command:

```powershell
pnpm api
```

Result:

```text
PASS
prompt-draft-api image rebuilt
translator healthy
db healthy
api started
```

Observed non-blocking environment warning:

```text
Found orphan containers (prompt-draft-cloudflared-1)
```

This warning is unrelated to CE1 correctness and no `--remove-orphans` action was taken as part of Campaign work.

---

## 4. Focused CE1 test evidence

Command:

```powershell
docker compose exec api node --test src/campaignFoundation.test.mjs
```

Result:

```text
tests   9
pass    9
fail    0
skipped 0
```

Passing contracts:

```text
admin gets campaign view/metrics but not manage/publish
draft validation permits an intentionally incomplete definition
publish validator accepts canonical campaign.v1 definition
validator rejects unknown metrics and missing localized content
publish validator requires registered renderer references
reward-bearing campaigns require authenticated participation
client_reported mechanics cannot be reward-bearing in V1
rule evaluator supports nested all/any/not and trusted resolvers
definition hashing is deterministic across object key order
```

This provides focused evidence for authorization policy, draft-vs-publish validation, registry enforcement, reward trust boundaries, recursive RuleExpression evaluation and canonical hashing.

---

## 5. Migration/schema evidence

Command:

```powershell
docker compose exec api npm run db:schema
```

Result:

```text
PASS
001_create_wizard_runs.sql through 029_campaign_engine_v1.sql applied successfully
```

Campaign migration applied:

```text
029_campaign_engine_v1.sql
```

The migration was therefore confirmed compatible with the current rerunnable schema application path.

---

## 6. Campaign table inventory evidence

Command:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\dt campaign*"
```

Result:

```text
campaign_actions
campaign_attempts
campaign_events
campaign_mechanic_states
campaign_participations
campaign_promotion_user_states
campaign_reward_budgets
campaign_reward_grants
campaign_versions
campaigns
```

Total Campaign relations confirmed:

```text
10 tables
```

---

## 7. Authority-boundary evidence

CE1 preserves the designed boundaries:

```text
user_economy_events      -> only authoritative Goin ledger
product_analytics_events -> observational only
admin_audit_log          -> privileged Campaign mutation audit
backend authorization    -> authoritative permission model
Campaign Definition      -> versioned data contract
campaign_versions        -> immutable published snapshots
browser/client           -> never reward/winner/user-identity authority
```

The existing Economy implementation still opens its own transaction through `recordUserEconomyEvent()`.

Therefore Campaign reward settlement is intentionally **not connected in CE1**. CE2 must first introduce an executor/client-aware internal Economy primitive or equivalent so Campaign qualification, budget reservation, reward grant and `user_economy_events` credit can share one transaction.

---

## 8. Verification boundary / remaining CE1 closure evidence

The current founder-local run proves:

```text
backend image builds and starts
CE1 focused contracts pass 9/9
migration 029 applies through the normal schema runner
all expected Campaign tables exist
```

It does not yet separately execute a persistence round-trip such as:

```text
create Campaign head
replace draft with expected revision
publish immutable Campaign Version
retry publish idempotently
attempt direct UPDATE/DELETE of campaign_versions and confirm DB trigger rejection
inspect matching admin_audit_log rows
```

No public/admin Campaign HTTP routes exist yet, so this is not an HTTP-route gap for CE1. It is optional additional service/DB closure evidence before explicit CE1 acceptance.

---

## 9. Current status after this verification

```text
CE1 implementation              -> IMPLEMENTED
focused unit/contract tests      -> PASS 9/9
API rebuild                      -> PASS
migration 029 schema application -> PASS
Campaign table presence          -> PASS / 10 tables
founder-local verification       -> VERIFIED 2026-09-13
explicit founder acceptance      -> PENDING
CE1 DONE                         -> NO
next slice                       -> PAUSED PENDING FOUNDER CONSULTATION
```

Do not start CE2 merely because CE1 local evidence is green. Resume only after the founder consultation/decision and a fresh latest-HEAD audit.

---

## 10. Invariants preserved during verification

```text
NUXT_PUBLIC_NOINDEX=true remains unchanged
production SEO/indexability remains deferred
production DNS/Tunnel/Worker configuration was not changed
Domain Expansion implementation was not started
no Campaign wallet was created
no parallel analytics store was created
no frontend rebuild was requested
pnpm stack was not used for reassurance
```
