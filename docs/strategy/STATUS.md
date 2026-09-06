# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Inherited Growth baseline:

```text
3ef4b0c65777d6f2814744ed0a1fa8a78750a389
```

## Current state

```text
Docker/backend Milestones 1–20 -> inherited COMPLETE baseline
Product Strategy V1            -> documented / approved direction
Founder Discovery Q&A V1       -> documented
Marketplace Product Model       -> documented
Content Graph & Lineage         -> documented
Execution Layer                 -> documented
Pricing/Internal Economy V1     -> documented
Execution Roadmap V1            -> documented

Milestone 21 Growth Foundation  -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21A Analytics             -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21B Referral Activation   -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21C Preferences/Discovery -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21D Public Discovery/SEO  -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E1 Economy Foundation   -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E2 Prompt Unlock        -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E3 Economy UX & Manage  -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21F Growth Metrics        -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Final UI polish                 -> DONE / LOCALLY VERIFIED / USER ACCEPTED

Milestone 21.5 Rendering & Organic Acquisition -> IN PROGRESS
Phase 21.5.1 Hybrid / SSR Architecture          -> IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING
Phase 21.5.2 Docker Production Runtime          -> NEXT AFTER PHASE 1 ACCEPTANCE
Phase 2 Domain Expansion                        -> NEXT STRATEGIC PHASE AFTER 21.5
First domain                                    -> Content Creation
Founder Domain Expansion research               -> MAY RUN IN PARALLEL WITH 21.5
```

## Canonical Milestone 21.5 sources

Milestone source of truth:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

Current Phase 1 implementation record:

```text
docs/strategy/MILESTONE_21_5_PHASE1_HYBRID_SSR.md
```

Current rendering ADR:

```text
docs/strategy/ADR_002_HYBRID_RENDERING_STRATEGY.md
```

ADR-001 remains historically correct for Milestone 21D; ADR-002 records the selected Milestone 21.5 hybrid direction.

Milestone 21.5 execution order:

```text
Phase 1 — Hybrid / SSR Architecture                       IMPLEMENTED / VERIFY NEXT
Phase 2 — Docker Production Runtime                       NOT STARTED
Phase 3 — Cloudflare Production Path                      NOT STARTED
Phase 4 — SEO Platform & Public Content Architecture      NOT STARTED
Phase 5 — Organic Acquisition Launch & Measurement        NOT STARTED
```

## Phase 1 rendering state

Selected Nuxt baseline on the current branch:

```text
ssr: true
hybrid routeRules
Nuxt/Nitro server runtime required for real hybrid behavior
independent Node API retained
```

First server-rendered/default acquisition surfaces:

```text
/
/guide
/discover/**
```

Explicit client-rendered surfaces in Phase 1:

```text
/create
/collage
/vectorizer
/history
/dashboard
/login
/manage
/manage/**
/wizard
/wizard/**
/prompts
/user
```

`/prompts` and `/user` remain public product surfaces, but their current query-parameter contracts are not being promoted into permanent canonical SEO contracts during Phase 1.

The six `/discover/*` routes now load sanitized public collection data through SSR-aware `useAsyncData()` rather than waiting for `onMounted()`.

Current server data path:

```text
/discover/<slug>
  -> Nuxt SSR
  -> usePublicDiscovery
  -> NUXT_PUBLIC_API_BASE/api/discover
  -> sanitized published presentation data
  -> server HTML + Nuxt hydration payload
```

Public/protected data boundaries are unchanged.

Phase 1 local acceptance command is now:

```powershell
pnpm build
pnpm preview
```

`pnpm generate` remains present as a compatibility/rollback path from the prior static architecture but is not a valid acceptance test for hybrid request-time rendering.

The Milestone 21D post-generate discovery SEO snapshot machinery has deliberately not been deleted yet. Phase 4 will remove/reduce/retain it only after SSR runtime, Docker and Cloudflare behavior are verified.

## Milestone 21.5 rationale

Milestone 21D intentionally retained:

```text
ssr: false
pnpm generate
static frontend
independent Node API
```

and used targeted post-generate SEO snapshots for six controlled `/discover/*` routes.

That decision remains historically correct for 21D.

Milestone 21.5 explicitly revisits rendering because the product now has a non-speculative acquisition use case:

```text
existing public discovery content
planned Blog acquisition surface
growing public dynamic route needs
internal Growth analytics already available
Google Search Console can provide external search/indexing evidence
Domain Expansion requires founder research and should not be rushed
```

Domain Expansion research may proceed in parallel while engineering executes Milestone 21.5.

## Canonical Milestone 21 closure

```text
docs/strategy/MILESTONE_21_CLOSURE.md
docs/strategy/MILESTONE_21_GROWTH_FOUNDATION.md
docs/strategy/MILESTONE_21_UI_POLISH.md
```

Phase-level verification sources:

```text
docs/strategy/MILESTONE_21A_VERIFICATION.md
docs/strategy/MILESTONE_21B_VERIFICATION.md
docs/strategy/MILESTONE_21C_VERIFICATION.md
docs/strategy/MILESTONE_21D_VERIFICATION.md
docs/strategy/MILESTONE_21E1_VERIFICATION.md
docs/strategy/MILESTONE_21E2_PROMPT_UNLOCK.md
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
docs/strategy/MILESTONE_21F_VERIFICATION.md
```

## Accepted public/protected boundary

```text
/prompts list/catalog -> public
GET /api/archive -> public
search/sort/multi-tag/pagination -> public

/prompts?id=<id> full Prompt detail -> authenticated + email gate
GET /api/archive/:id -> authenticated + email gate
```

Rendering changes do not alter backend authorization or make protected Prompt content public.

## Accepted internal economy state

Internal spendable unit:

```text
goin
```

Simulation reference metadata:

```text
1 goin = 250 toman
```

XP and Goin remain semantically separate:

```text
user_score_events
  -> achievement/reward provenance + lifetime XP

user_economy_events
  -> spendable Goin issuance/debit/refund/correction
```

Current issuance V1:

```text
account_created       -> 10 goin
profile_email_added   -> 10 goin
referral_joined       -> 10 goin
referral_reward       -> 20 goin
draft_created         -> 0 goin
```

Current Prompt Archive sink:

```text
first meaningful Prompt Copy unlock = 5 goin
repeat Copy/access after unlock     = free
```

Verified economy invariants:

```text
append-only authoritative ledger
SUM(unit_delta) authoritative balance
idempotent retries
negative balance rejected
failed overspend creates no row
parallel spends cannot overspend
historical issuance backfill rerunnable without double issue
atomic debit + durable unlock
same-Prompt concurrent requests charge exactly once
insufficient balance creates neither debit nor unlock
historical unlock price/rule version preserved
XP unchanged by Goin spending
```

Private Profile Menu:

```text
Goin beside username via shared GoinAmount component
XP on separate row
reusable What is Goin? modal
live earn/spend/reference values from authoritative policy
```

Super-Admin economy management:

```text
/manage/economy
permission: system.settings.manage
```

## Accepted Growth metrics state

Manage route:

```text
/manage/growth
permission: system.metrics.view
```

Backend read API:

```text
GET /api/admin/growth/summary?days=7
GET /api/admin/growth/summary?days=30
```

Current behavioral event coverage:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

Measured audience is explicitly scoped to instrumented Growth surfaces and is not whole-product DAU/MAU.

Final independent SQL-vs-API verification passed for both 7-day and 30-day windows, including auth, invalid-window handling, summaries, daily series, Top Tags, measurement scope and event allowlist.

Milestone 21.5 may extend acquisition analytics only where persisted data supports the metrics shown.

## Final UI polish — accepted

Accepted final presentation state:

```text
founder-provided Goin SVG + reusable GoinAmount
Profile Menu Goin-first hierarchy
central reusable Goin information modal
chart-first Daily Signals and Popular Tags with table toggles
useScreen-based responsive Growth layout
2 x 4-card desktop/wide Growth density
shared Goin rendering in Growth/Economy
normal-colored Prompt Copy feedback + state icons
/prompts content surface80
normal/invert Prompt tags
theme-aware card overlays/fallbacks/borders for /prompts and /user
Light/Dark + EN/FA/RTL smoke accepted
```

## Final local release-generation evidence for Milestone 21

Founder-local command:

```powershell
pnpm generate
```

Final Milestone 21 result:

```text
PASS
26 routes prerendered
.output/public generated
offline manifest generated: 258 files / 63.2 MB
6 discovery routes enriched with sanitized SEO snapshots
```

This remains historical Milestone 21 evidence and is not the Milestone 21.5 hybrid-runtime verification mode.

## Migration state

Current migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
024_prompt_archive_unlocks.sql
```

Next future schema migration:

```text
025_*.sql
```

## Hard rules inherited forward

```text
DO NOT use admin_audit_log as behavioral analytics.
DO NOT use user_score_events as a generic analytics warehouse.
DO NOT create a second XP/referral/auth/admin/profile system.
DO NOT make Goin spending reduce lifetime XP/reputation.
DO NOT add a mutable users.balance as economy source of truth.
DO NOT trust frontend balance checks.
DO NOT trust analytics events as economic authority.
DO NOT convert XP 1:1 into Goin.
DO NOT issue Goin for draft_created in V1 unless policy is explicitly changed.
DO NOT retroactively reprice historical Goin issuance/unlocks.
DO NOT charge Prompt page views.
DO NOT charge on every Copy click.
DO NOT expose another user's economy history, unlock state, or spendable balance.
DO NOT treat the 250 toman reference as a buy/cash-out guarantee.
DO NOT treat the current 5-Goin Prompt unlock as a permanent Marketplace price.
DO NOT put Prompt text/sellable knowledge into analytics or Growth metrics.
DO NOT call measured-surface audience whole-product DAU/MAU.
DO NOT make /api/archive/:id public merely for SEO.
DO NOT introduce fiat purchase/cash-out/payout before its roadmap phase.
DO NOT start the full Marketplace before Domain Expansion is evaluated.
DO NOT expose protected Prompt bodies merely because routes become SSR.
DO NOT treat every route as SSR-worthy merely because global SSR is enabled.
DO NOT delete the old static SEO fallback before the new runtime path is verified.
```

## Phase 2 — Domain Expansion after Milestone 21.5

Source of truth:

```text
docs/strategy/EXECUTION_ROADMAP_V1.md
```

Strategic order remains:

```text
Phase 1 — Growth Foundation     DONE
Interim Milestone 21.5          IN PROGRESS
Phase 2 — Domain Expansion      NEXT STRATEGIC PHASE
Phase 3 — Marketplace Activation
Phase 4 — AI Enhancement
```

Domain priority hypothesis:

```text
1. Content Creation
2. Programming
3. Education
4. Marketing / Advertising
```

The first Domain Expansion implementation must still begin with Content Creation and must be based on domain research and semantic modeling rather than UI cloning.

Required sequence:

```text
research domain
  -> audit existing Semantic Prompt Engine capabilities
  -> identify domain semantic components
  -> define independent modules
  -> define wiring / compile semantics
  -> design the first Content Creation generator
  -> implement incrementally
  -> verify real user value
```

Founder research for Content Creation may run in parallel with Milestone 21.5 engineering. Do not build Programming in parallel. Use Content Creation as the first proof that Prompt Draft's semantic architecture generalizes beyond image prompting.

## Primary strategy sources

```text
docs/strategy/PRODUCT_STRATEGY_V1.md
docs/strategy/PRICING_AND_INTERNAL_ECONOMY_V1.md
docs/strategy/EXECUTION_ROADMAP_V1.md
docs/strategy/MILESTONE_21_CLOSURE.md
docs/strategy/MILESTONE_21_GROWTH_FOUNDATION.md
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/strategy/ADR_002_HYBRID_RENDERING_STRATEGY.md
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
docs/strategy/MILESTONE_21_5_PHASE1_HYBRID_SSR.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```

Latest Phase 1 documentation checkpoint before founder-local verification:

```text
eff42ea26bf62cac6947b0a030aa5910e6e9ec0c
```
