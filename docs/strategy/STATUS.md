# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-07

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
Phase 21.5.1 Hybrid / SSR Architecture          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
Phase 21.5.2 Docker Production Runtime          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
Phase 21.5.3 Cloudflare Production Path         -> DONE / FOUNDER-PRODUCTION-LIKE VERIFIED / ACCEPTED
Phase 21.5.4 SEO/Public Content Architecture    -> IN PROGRESS / 4A STARTED
Phase 21.5.5 Organic Acquisition Launch         -> NOT STARTED
Phase 2 Domain Expansion                        -> NEXT STRATEGIC PHASE AFTER 21.5
First domain                                    -> Content Creation
Founder Domain Expansion research               -> MAY RUN IN PARALLEL WITH 21.5
```

## Canonical Milestone 21.5 sources

Milestone source of truth:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

Phase records:

```text
docs/strategy/MILESTONE_21_5_PHASE1_HYBRID_SSR.md
docs/strategy/MILESTONE_21_5_PHASE2_DOCKER_RUNTIME.md
docs/strategy/MILESTONE_21_5_PHASE3_CLOUDFLARE_PRODUCTION_PATH.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Current rendering ADR:

```text
docs/strategy/ADR_002_HYBRID_RENDERING_STRATEGY.md
```

ADR-001 remains historically correct for Milestone 21D; ADR-002 records the selected Milestone 21.5 hybrid direction.

Milestone 21.5 execution order:

```text
Phase 1 — Hybrid / SSR Architecture                       DONE / ACCEPTED
Phase 2 — Docker Production Runtime                       DONE / ACCEPTED
Phase 3 — Cloudflare Production Path                      DONE / ACCEPTED
Phase 4 — SEO Platform & Public Content Architecture      IN PROGRESS / 4A STARTED
Phase 5 — Organic Acquisition Launch & Measurement        NOT STARTED
```

## Phase 1 accepted rendering state

Selected Nuxt baseline:

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

Explicit client-rendered surfaces:

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

Founder-local acceptance passed with:

```text
pnpm build
pnpm preview
SSR/raw-HTML discovery smoke
/, /guide, discovery smoke
/create, /manage, /prompts, /user, Wizard smoke
regular-user and super-admin auth smoke
```

The preview-port CORS issue was fixed by allowing port 3000 in local API CORS configuration. The super-admin login issue was confirmed to be a local password-hash mismatch rather than an SSR/origin/role restriction and was corrected through a secure local password-reset CLI.

## Phase 2 Docker runtime state — accepted

Accepted production-like local shape:

```text
browser
  -> http://localhost:3000
  -> frontend Nuxt/Nitro container

SSR frontend
  -> http://api:4000
  -> API over Compose network

browser client API
  -> http://localhost:4000

API
  -> db:5432
  -> translator:5000
```

Key runtime contract:

```text
NUXT_API_BASE_INTERNAL=http://api:4000      server-only
NUXT_PUBLIC_API_BASE=http://localhost:4000  browser-visible local default
```

Accepted Phase 2 infrastructure:

```text
root multi-stage frontend Dockerfile
root .dockerignore excluding local secrets/build outputs
frontend Compose service
frontend/API/db/translator health checks
health-gated service dependencies
restart: unless-stopped
server-internal vs browser-public API origin split
stack lifecycle pnpm commands
builder-only 4 GB Node heap for Nuxt SSR bundling
BuildKit pnpm-store cache
pnpm registry timeout/retry/concurrency hardening
correct Corepack package-manager integrity metadata
```

Founder-local verification passed with:

```text
pnpm stack
pnpm stack:status
pnpm stack:restart
```

Verified outcomes:

```text
Nuxt client build PASS
Nuxt SSR server build PASS
Nitro node-server output PASS
frontend image built
api image built
frontend healthy
api healthy
db healthy
translator healthy
/discover/posters-editorial functional through Docker frontend
raw SSR HTML fetched successfully
browser API traffic uses http://localhost:4000
GET /api/auth/me -> 200 OK observed in DevTools
regular and super-admin auth/application smoke PASS
full stack rebuild/recreate PASS
post-restart recovery to all-healthy PASS
```

Docker-internal `http://api:4000` remains server-only and was not exposed to browser networking.

Phase 2 is closed. Its accepted runtime became the baseline for Phase 3.

## Phase 3 Cloudflare production path — accepted

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE3_CLOUDFLARE_PRODUCTION_PATH.md
```

Accepted production-like staging topology:

```text
https://grassic.ir
  -> Cloudflare edge
  -> prompt-draft-staging-fallback Worker
  -> Cloudflare Tunnel
  -> frontend:3000

https://api.grassic.ir
  -> Cloudflare edge
  -> Cloudflare Tunnel
  -> api:4000
```

Accepted runtime split:

```text
Nuxt SSR server -> http://api:4000
browser          -> https://api.grassic.ir
```

Verified outcomes:

```text
grassic.ir authoritative on Cloudflare
frontend/API Tunnel routes active
frontend/API direct host binds remain loopback-only
public HTTPS frontend PASS
public HTTPS API PASS
CORS from https://grassic.ir PASS
browser API origin https://api.grassic.ir PASS
regular/super-admin/application parity PASS
public request-time SSR PASS
no tested api:4000 / localhost:4000 / api.prompt-draft.ir leakage in SSR HTML
NUXT_PUBLIC_NOINDEX=true PASS
X-Robots-Tag: noindex, nofollow, noarchive PASS
cloudflared forced to HTTP/2 for current network PASS
stack restart/recovery PASS
Cloudflare Worker route grassic.ir/* PASS
Worker failure mode Fail open PASS
intentional cloudflared outage -> branded HTTP 503 fallback PASS
fallback links to stable https://prompt-draft.ir/ PASS
Tunnel restore -> normal HTTP 200 recovery PASS
Cloudflare Cache Rule api.grassic.ir -> Bypass cache ACTIVE
```

The stable `prompt-draft.ir` deployment was deliberately left untouched during Phase 3. The new runtime architecture has therefore been proven without making the production hostname cutover itself a prerequisite.

Phase 3 closure checkpoint:

```text
adbff89e4c65ac8fa26cca58dee1040f62c808a1
```

## Phase 4 SEO / public content architecture — in progress

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Execution slices:

```text
21.5.4A SEO Contracts & Route Semantics                    IN PROGRESS
21.5.4B Public Prompt Architecture                         NOT STARTED
21.5.4C Public Creator + Indexability Policy               NOT STARTED
21.5.4D Sitemap / Robots / Discovery Migration             NOT STARTED
21.5.4E Blog V1                                            NOT STARTED
21.5.4F Integration / Verification / Legacy Retirement     NOT STARTED
```

Accepted route/content direction:

```text
Prompt canonical -> /prompt/:id
Creator canonical -> /creator/:username
/user -> private/account product surface, not Creator SEO canonical
English/default -> unprefixed URL
Persian -> /fa prefix
EN + FA both indexable when authoritative localized content exists
Blog V1 -> repository-backed editorial content
/manage/blog -> Markdown-producing admin authoring surface
Git -> canonical Blog editorial source
Arvan -> Blog mirror/emergency publication store
Docker/Nitro deployed content -> normal Blog request-time source
Blog images -> existing/shared Arvan media upload pipeline
```

Phase 4A implementation has started by maturing the existing `usePublicSeo` primitive, making root HTML `lang/dir` locale-aware, and beginning locale-aware navigation migration in Header/default layout.

Important activation gate:

```text
Do not enable prefix_except_default until raw internal navigation has been audited/migrated.
```

This avoids Persian users being sent unintentionally to unprefixed English routes by legacy raw paths.

Current Phase 4 implementation commits are not founder-local accepted yet. Phase 4 remains IN PROGRESS until build/runtime/browser/raw-HTML verification passes.

## Accepted Creator SEO direction for Phase 4

```text
/user
  -> private/signed-in account profile surface
  -> not canonical SEO Creator URL

/creator/:username
  -> future public SSR/SEO Creator route
  -> public data/publications only
```

A Creator page must not become indexable merely because an account exists or one trivial public item was published.

Phase 4 must define a shared server-authoritative Creator indexability/quality policy. The same eligibility result should drive SSR robots/index metadata, sitemap inclusion and future public Creator discovery behavior.

Exact thin-content thresholds remain deliberately TBD. Candidate inputs include meaningful public content volume/substance, public profile completeness, publication quality/visibility, spam/moderation state and duplicate/low-value content signals.

Accepted accessibility/indexability distinction:

```text
valid thin/new/incomplete public Creator
  -> accessible
  -> noindex
  -> excluded from indexable sitemap

nonexistent / removed / public-access-prohibited Creator
  -> unavailable / 404 semantics
```

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

Milestone 21.5 revisits rendering because the product now has a non-speculative acquisition use case:

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
DO NOT expose Docker-internal service origins to browser runtime configuration.
DO NOT make every Creator account indexable without a thin-content/quality eligibility policy.
DO NOT activate FA route prefixes before locale-aware internal navigation is safe.
DO NOT make Git and Arvan uncontrolled equal Blog sources of truth.
DO NOT embed Blog images as base64 Markdown payloads.
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
docs/strategy/MILESTONE_21_5_PHASE2_DOCKER_RUNTIME.md
docs/strategy/MILESTONE_21_5_PHASE3_CLOUDFLARE_PRODUCTION_PATH.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```

Accepted Phase 2 implementation checkpoint:

```text
72acb6beb5e6e21232c945a05534bc41c0dabdc3
```

Accepted Phase 3 closure checkpoint:

```text
adbff89e4c65ac8fa26cca58dee1040f62c808a1
```

Current next implementation phase:

```text
Phase 21.5.4A — SEO Contracts & Route Semantics
```
