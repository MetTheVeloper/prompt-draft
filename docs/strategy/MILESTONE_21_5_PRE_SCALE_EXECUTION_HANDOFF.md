# Milestone 21.5 — Pre-Scale Execution Handoff

Status: **FOUNDER-APPROVED EXECUTION HANDOFF / PRODUCTION RUNTIME ACTIVE / SEO DEFERRED / DOMAIN EXPANSION SCALE-GATED / CAMPAIGN CE1 VERIFIED**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

Current authoritative runtime checkpoint:

```text
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
```

Campaign Engine sources of truth:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
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
CE1 Foundation               -> IMPLEMENTED / FOUNDER-LOCAL VERIFIED 2026-09-13
CE1 explicit acceptance      -> PENDING
next implementation slice    -> PAUSED PENDING FOUNDER CONSULTATION
```

CE1 implementation commit:

```text
1f8c35ee9041e600ba6d99d37c595f446842d000
feat: add Campaign Engine CE1 foundation
```

Founder-local verification evidence:

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

Canonical evidence record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
```

CE1 is **not** marked DONE/ACCEPTED yet. Explicit founder acceptance remains required. A separate persistence round-trip/direct immutable-version mutation rejection probe has not yet been executed and is recorded transparently in the CE1 verification doc.

Do **not** start CE2 until the founder consultation requested after CE1 verification is complete.

---

## 5. Campaign authority boundaries that remain mandatory

Campaign Engine must preserve the existing authority boundaries:

```text
user_economy_events       -> authoritative Goin ledger
product_analytics_events  -> observational analytics only
admin_audit_log           -> privileged mutation audit
backend authorization     -> authoritative permission enforcement
campaign_versions         -> immutable published Campaign snapshots
browser/client            -> never authoritative reward/winner/user identity source
```

No Campaign wallet or parallel Goin balance is allowed.

CE1 intentionally does not connect reward settlement because current `recordUserEconomyEvent()` opens its own transaction. Before Campaign reward settlement, CE2 must introduce an executor/client-aware internal Economy primitive or equivalent so qualification, budget reservation, Campaign Reward Grant and `user_economy_events` issuance can share one transaction.

---

## 6. CE1 foundation now present

Migration:

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

## 7. 21.5 invariants while Campaign Engine work proceeds

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

## 8. Deferred 21.5 work

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

## 9. Current transition instruction

Immediate execution state:

```text
21.5 production runtime / SEO-off checkpoint -> KEEP
Domain Expansion implementation              -> DEFER UNTIL SCALE GATE
Campaign Engine V1                           -> ACTIVE PRE-SCALE TRACK
CE1 Foundation                               -> IMPLEMENTED / LOCAL VERIFIED / ACCEPTANCE PENDING
CE2 or any next Campaign slice               -> PAUSED FOR FOUNDER CONSULTATION
```

Before any further Campaign write:

```text
1. re-read latest feature/growth-foundation HEAD
2. read DEVELOPMENT_WORKFLOW.md
3. read CAMPAIGN_ENGINE_STATUS.md
4. read CAMPAIGN_ENGINE_CE1_VERIFICATION.md
5. read the Campaign V1 schema/runtime source-of-truth docs
6. preserve production noindex and Domain Expansion scale gate
7. resolve the pending founder consultation before selecting the next slice
```
