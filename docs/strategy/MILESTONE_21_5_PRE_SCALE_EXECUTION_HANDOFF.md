# Milestone 21.5 — Pre-Scale Execution Handoff

Status: **FOUNDER-APPROVED EXECUTION HANDOFF / PRODUCTION RUNTIME ACTIVE / SEO DEFERRED / DOMAIN EXPANSION SCALE-GATED / CAMPAIGN CE1 ACCEPTED / EXPIRING GOIN IN VERIFICATION**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

Current authoritative runtime checkpoint:

```text
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
```

Campaign Engine / Economy transition sources of truth:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
```

---

## 1. Founder sequencing decision

Milestone 21.5 has reached the intended safe operating checkpoint for continued product development:

```text
production runtime      -> ACTIVE / VERIFIED
production canonical    -> prompt-draft.ir
production API          -> api.prompt-draft.ir
production indexability -> OFF
NUXT_PUBLIC_NOINDEX     -> true
SEO launch              -> DEFERRED
Search Console launch   -> DEFERRED
```

The product remains under active development/testing. SEO/indexing must stay disabled until a future explicit founder approval.

Milestone 21.5 therefore remains technically open for deferred SEO-launch work, but it no longer blocks normal product engineering.

---

## 2. Domain Expansion remains scale-gated

Domain Expansion remains a major strategic capability and a future proof that Prompt Draft's Semantic Prompt Engine generalizes beyond the current image-focused domain.

However, the founder has explicitly classified Domain Expansion as a **scale-stage advantage**, not the immediate engineering track.

Current policy:

```text
DO NOT start Domain Expansion implementation merely because 21.5 runtime work reached a pause point.

Before Domain Expansion implementation:
  -> product should reach the appropriate scale/readiness stage
  -> founder should explicitly select the scale gate
  -> domain research + semantic modeling must be mature
```

Domain research may continue in parallel; implementation is intentionally deferred.

---

## 3. Pre-scale execution lane

Between the current 21.5 checkpoint and the future Domain Expansion scale gate, Prompt Draft may execute platform work that improves acquisition, retention, commercialization readiness, operator capability and economic experimentation without prematurely multiplying semantic domains.

Examples include:

```text
Campaign Engine
marketing/operator tooling
campaign-driven Goin incentives
promotion surfaces
measurement/reconciliation
production reliability work
other founder-selected pre-scale product systems
```

These tracks must reuse the accepted Growth Foundation contracts rather than create parallel wallets, analytics stores, authorization systems or rendering stacks.

---

## 4. Selected pre-scale engineering track — Campaign Engine V1

Founder-selected track:

```text
Campaign Engine V1
```

Current implementation state:

```text
architecture/source of truth -> DOCUMENTED
database schema              -> DESIGNED
API/runtime contract         -> DESIGNED
CE1 Foundation               -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
Economy prerequisite         -> EXPIRING / PROMOTIONAL GOIN V1 IMPLEMENTED / AWAITING LOCAL VERIFICATION
next Campaign slice          -> CE2 AFTER ECONOMY VERIFICATION
```

CE1 implementation commit:

```text
1f8c35ee9041e600ba6d99d37c595f446842d000
feat: add Campaign Engine CE1 foundation
```

Founder-local CE1 verification evidence:

```text
pnpm api
  -> PASS / backend image rebuilt and started

docker compose exec api node --test src/campaignFoundation.test.mjs
  -> PASS 9/9

docker compose exec api npm run db:schema
  -> PASS / migrations 001 through 029 applied

docker compose exec db psql -U prompt_draft -d prompt_draft -c "\dt campaign*"
  -> PASS / 10 expected Campaign tables present
```

Canonical CE1 evidence record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
```

The founder clarified that a clean-log response of "ظاهرا اوکیه" is acceptance when engineering review finds no hidden blocker. CE1 logs were clean and no hidden blocker was found, so CE1 is accepted.

A separate direct immutable-version mutation rejection probe remains optional hardening evidence, not a CE1 blocker.

---

## 5. Expiring / Promotional Goin prerequisite before CE2

Before starting CE2, the founder selected an Economy extension to prevent promotional Campaign rewards from becoming unlimited permanent money supply.

Canonical contract:

```text
docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
```

Implementation commit:

```text
ddff7f0458281ba8abcd57c6a23ff614d5fb3ef5
feat: add expiring promotional Goin
```

Implemented direction:

```text
user_economy_events stays the authoritative Goin event ledger
no second wallet or balance column
positive credits may opt into expires_at
historical/existing Goin remains permanent by default
spending uses FEFO: earliest-expiring active Goin first
expiring-credit allocations preserve consumption provenance
only unspent remainder expires
Prompt Archive debit uses the shared Economy primitive
operator outstanding uses expiry-aware balance state
```

The Economy extension also introduces the transaction-aware primitive CE2 already required:

```text
backend/src/economyCore.mjs
recordUserEconomyEventInTransaction(client, input, options)
```

Campaign reward settlement must reuse this primitive inside the Campaign transaction. Do not create nested independent Economy transactions or a Campaign wallet.

CE2 remains blocked until founder-local verification of this Economy extension is clean.

---

## 6. Campaign authority boundaries that remain mandatory

Campaign Engine must preserve the existing authority boundaries:

```text
user_economy_events       -> authoritative Goin event ledger
Economy expiry/allocation -> authoritative spendable-balance provenance
product_analytics_events  -> observational analytics only
admin_audit_log           -> privileged mutation audit
backend authorization     -> authoritative permission enforcement
campaign_versions         -> immutable published Campaign snapshots
browser/client            -> never authoritative reward amount/expiry/winner/user identity source
```

No Campaign wallet or parallel Goin balance is allowed.

Campaign reward correctness requires one transaction covering:

```text
reward qualification
budget reservation
campaign_reward_grant
user_economy_events credit
reward reconciliation/state/events
```

---

## 7. CE1 foundation now present

Campaign migration:

```text
backend/sql/029_campaign_engine_v1.sql
```

Verified Campaign tables:

```text
campaigns
campaign_versions
campaign_participations
campaign_actions
campaign_events
campaign_mechanic_states
campaign_attempts
campaign_reward_budgets
campaign_reward_grants
campaign_promotion_user_states
```

CE1 also introduced/extended:

```text
Campaign Definition validator
Campaign head/draft persistence
optimistic draft revisions
immutable publish versions
publish idempotency
Renderer Registry skeleton
Mechanic Registry skeleton
Metric Registry skeleton
RuleExpression validator/evaluator
marketing.campaigns.view
marketing.campaigns.manage
marketing.campaigns.publish
marketing.metrics.view
```

Safe current role direction remains:

```text
user        -> no Campaign permissions
admin       -> campaign view + marketing metrics
super_admin -> all via existing wildcard
```

---

## 8. 21.5 invariants while Campaign Engine work proceeds

Keep:

```text
Nuxt SSR/hybrid route contract
production runtime through Cloudflare Tunnel
prompt-draft.ir canonical production host
api.prompt-draft.ir browser API origin
server-internal API -> http://api:4000
host-aware indexability guard
NUXT_PUBLIC_NOINDEX=true
production + staging noindex behavior
public/protected Prompt and Creator boundaries
Blog/public SEO architecture
first-party acquisition analytics contract
```

Do not:

```text
turn SEO/indexing on as a side effect of Campaign work
submit production sitemap/Search Console launch work
change production DNS/Tunnel/Worker/indexability without explicit founder approval
weaken public/private data boundaries
start Domain Expansion implementation
create Campaign-specific Economy or Analytics authorities
```

Campaign public routes may eventually be built and production-tested while global noindex remains active.

---

## 9. Deferred 21.5 work

The following remains intentionally deferred rather than forgotten:

```text
NUXT_PUBLIC_NOINDEX=false
production SEO/indexability launch
Search Console production property/launch workflow
sitemap submission for acquisition launch
representative production indexing evidence
initial organic acquisition measurement cadence
```

When the founder later decides the product is ready for SEO launch, resume from:

```text
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
```

and re-audit the latest branch/runtime before changing indexability.

---

## 10. Current transition instruction

Immediate execution state:

```text
21.5 production runtime / SEO-off checkpoint -> KEEP
Domain Expansion implementation              -> DEFER UNTIL SCALE GATE
Campaign Engine V1                           -> ACTIVE PRE-SCALE TRACK
CE1 Foundation                               -> DONE / VERIFIED / ACCEPTED
Expiring / Promotional Goin V1               -> IMPLEMENTED / AWAITING LOCAL VERIFICATION
CE2 Runtime Core                             -> NEXT AFTER ECONOMY VERIFICATION
```

Before any further Campaign write:

```text
1. re-read latest feature/growth-foundation HEAD
2. read DEVELOPMENT_WORKFLOW.md
3. read CAMPAIGN_ENGINE_STATUS.md
4. read CAMPAIGN_ENGINE_CE1_VERIFICATION.md
5. read EXPIRING_PROMOTIONAL_GOIN_V1.md
6. read the Campaign V1 schema/runtime source-of-truth docs
7. preserve production noindex and Domain Expansion scale gate
8. verify/accept Expiring Goin before starting CE2
```
