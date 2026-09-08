# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Inherited Growth baseline:

```text
3ef4b0c65777d6f2814744ed0a1fa8a78750a389
```

---

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
Phase 21.5.4 SEO/Public Content Architecture    -> IN PROGRESS / 4A + 4B ACCEPTED / 4C NEXT
Phase 21.5.5 Organic Acquisition Launch         -> NOT STARTED

Phase 2 Domain Expansion                        -> NEXT STRATEGIC PHASE AFTER 21.5
First domain                                    -> Content Creation
Founder Domain Expansion research               -> MAY RUN IN PARALLEL WITH 21.5
```

---

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
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

Rendering ADR:

```text
docs/strategy/ADR_002_HYBRID_RENDERING_STRATEGY.md
```

ADR-001 remains historically correct for Milestone 21D. ADR-002 records the accepted Milestone 21.5 hybrid direction.

---

## Milestone 21.5 execution order

```text
Phase 1 — Hybrid / SSR Architecture                  DONE / ACCEPTED
Phase 2 — Docker Production Runtime                  DONE / ACCEPTED
Phase 3 — Cloudflare Production Path                 DONE / ACCEPTED
Phase 4 — SEO Platform & Public Content Architecture IN PROGRESS / 4C NEXT
Phase 5 — Organic Acquisition Launch & Measurement   NOT STARTED
```

Phase 4 slices:

```text
21.5.4A SEO Contracts & Route Semantics                    DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
21.5.4B Public Prompt Architecture                         DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
21.5.4C Public Creator + Indexability Policy               NEXT
21.5.4D Sitemap / Robots / Discovery Migration             NOT STARTED
21.5.4E Blog V1                                            NOT STARTED
21.5.4F Integration / Verification / Legacy Retirement     NOT STARTED
```

Required order:

```text
4A -> 4B -> 4C -> 4D -> 4E -> 4F
```

---

## Accepted Phase 1 rendering state

Selected baseline:

```text
ssr: true
hybrid routeRules
Nuxt/Nitro server runtime required for real hybrid behavior
independent Node API retained
```

Acquisition-capable SSR surfaces include:

```text
/
/guide
/discover/**
/prompt/**
```

Explicit client-rendered/application surfaces include:

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

---

## Accepted Phase 2 Docker runtime

Production-like local topology:

```text
browser
  -> frontend Nuxt/Nitro container :3000

SSR frontend
  -> http://api:4000 over Compose network

browser client API
  -> public/browser API origin

API
  -> db:5432
  -> translator:5000
```

Core contract:

```text
NUXT_API_BASE_INTERNAL -> server-only API origin
NUXT_PUBLIC_API_BASE   -> browser-visible API origin
```

Accepted infrastructure includes multi-stage frontend Docker build, Compose health checks, restart behavior, service-network API access, builder memory/cache hardening and reproducible stack lifecycle commands.

---

## Accepted Phase 3 Cloudflare production-like path

Staging topology:

```text
https://grassic.ir
  -> Cloudflare edge
  -> fallback Worker
  -> Cloudflare Tunnel
  -> frontend:3000

https://api.grassic.ir
  -> Cloudflare edge
  -> Cloudflare Tunnel
  -> api:4000
```

Runtime split:

```text
Nuxt SSR server -> http://api:4000
browser          -> https://api.grassic.ir
```

Verified Phase 3 outcomes include:

```text
public HTTPS frontend/API
CORS from grassic.ir
browser API origin api.grassic.ir
regular/super-admin application parity
request-time SSR
no localhost/api:4000 leakage into browser-facing SSR HTML
NUXT_PUBLIC_NOINDEX=true
X-Robots-Tag staging protection
Cloudflare Tunnel HTTP/2 compatibility
stack restart/recovery
Worker fail-open behavior
branded 503 fallback during intentional tunnel outage
recovery after tunnel restore
API cache bypass rule
```

Stable `prompt-draft.ir` remains deliberately untouched while Phase 4 is developed/verified on `grassic.ir`.

---

## Accepted Phase 4A — SEO/routing foundation

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
```

Accepted behavior:

```text
usePublicSeo is the shared public SEO primitive
EN default URLs are unprefixed
FA URLs use /fa
Nuxt i18n strategy = prefix_except_default
root html lang/dir is locale-aware
canonical URLs are self-referencing per locale
EN/FA reciprocal hreflang supported
x-default points to English/default
Discovery invalid slugs return real 404
Discovery noncanonical uppercase/trailing-slash variants 301 to canonical
application/private routes receive X-Robots-Tag noindex
staging NUXT_PUBLIC_NOINDEX wins globally
internal navigation is locale-safe
query/auth-next behavior preserves locale
legacy app prerenders are isolated behind legacy static-generate mode
```

Founder-local 4A gates passed including strict route audit, SEO contracts, production build, EN/FA runtime smoke, canonical redirects, raw SSR metadata, locale navigation and staging noindex behavior.

---

## Accepted Phase 4B — Public Prompt Architecture

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

Final state:

```text
architecture audit/design        -> DONE / FOUNDER AGREED
architecture contract            -> LOCKED
4B.1 backend public projection   -> DONE / VERIFIED
4B.2 Nuxt SSR Prompt route       -> DONE / VERIFIED
4B.3 SEO metadata                -> DONE / VERIFIED
4B.4 public-link migration       -> DONE / VERIFIED
post-4B.4 interaction polish     -> DONE / VERIFIED
4B.5A localized descriptions     -> DONE / ACCEPTED
4B.5B shared Prompt presentation -> DONE / ACCEPTED
4B.5C Discovery visual layer     -> DONE / ACCEPTED
4B.5D final verification         -> DONE / ACCEPTED
Phase 4B                         -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
```

Founder explicit acceptance on 2026-09-08:

```text
Phase 4B accepted
```

Canonical public Prompt routes:

```text
/prompt/:id
/fa/prompt/:id
```

Protected product routes remain:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
```

Backend security boundary:

```text
GET /api/public/prompts/:id -> public/read-only/published-only sanitized projection
GET /api/archive/:id        -> authenticated + email gate
```

Final public presentation projection includes only intentionally public fields:

```text
public numeric id
localized title
localized founder-authored description
availableLocales
publication date
public tags
public model/presentation metadata
public preview image URLs/position
optional public-safe Telegram message id
```

Explicitly excluded:

```text
protected Prompt body
protected variants
sourceTitle/private Draft payload
source Draft/user identity unless later accepted by Creator policy
storage keys
unlock state
balance/Goin
permissions
viewer/account state
```

Important invariant:

```text
The public database query itself does not SELECT prompt or variants.
```

Localized description is the one source for:

```text
visible Public Prompt description
meta description
og:description
twitter:description
CreativeWork.description
```

Locale availability requires:

```text
valid localized title + valid localized description
```

No fake localization fallback is allowed.

Published description rollout:

```text
migration 025 -> description storage
founder-reviewed backfill -> 100 published Archive rows
migration 026 -> published localization database constraint
```

The two staging/test Archive items 9002/9003 were safely pruned before canonical backfill.

Shared Prompt presentation remains presentation-only and does not know protected Prompt body, variants, unlock/economy or viewer state.

Public Discovery hero final behavior:

```text
semantic el-flex section
content-sized hero
zero outer default-layout padding
public preview media only
SSR first-image fallback
client visual-slider enhancement when multiple previews exist
single media layer after hydration
slider clipped to hero
```

Final aggregate regression:

```text
pnpm test:phase4b-final -> PASS
Strict route audit -> PASS / 447 source files / zero hazards
```

Final staging smoke:

```text
pnpm smoke:phase4b-final -> PASS
public Prompt API 200
invalid public Prompt API 404
protected Archive API 401
EN/FA Public Prompt SSR 200
EN/FA Discovery SSR 200
SEO/noindex/private-boundary checks PASS
```

Final production-like stack health:

```text
frontend    healthy
api         healthy
db          healthy
translator  healthy
cloudflared up
```

Manual founder browser smoke also passed for EN/FA, light/dark presentation, protected unlock/copy/economy continuity, browser-history back behavior, Telegram linking and Discovery cinema.

---

## Accepted locale/indexing direction inherited into 4C

```text
English/default -> unprefixed
Persian         -> /fa
EN + FA both indexable only when authoritative localized content exists
self-canonical per locale
reciprocal hreflang when both authoritative localizations exist
x-default -> English/default
```

One URL must deterministically render one language.

Do not use cookie-dependent canonical language.

Missing translation must not create fake indexable fallback content pretending to be authoritative.

---

## Current action — 21.5.4C Public Creator + Indexability Policy

4C is now the active Phase 4 slice.

Accepted direction inherited from prior planning:

```text
/user
  -> account/product surface
  -> not canonical SEO Creator URL

/creator/:username
  -> target public SSR/SEO Creator route
  -> intentionally public identity/publications only
```

Public Creator V1 must exclude:

```text
email
balance/Goin
sessions
permissions
private Drafts
owner-only stats/counts
XP initially
```

Accessibility and indexability are separate:

```text
valid but quality-failing Creator
  -> accessible
  -> noindex
  -> excluded from sitemap

nonexistent/deleted/public-access-prohibited Creator
  -> unavailable / 404 according to policy
```

Target policy output concept:

```text
accessible
indexable
discoverable
reasons[]
signals{}
```

Exact quality thresholds remain deliberately TBD until the 4C audit/design locks them.

### 4C start rule

Before implementation:

```text
1. read this STATUS.md
2. read docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
3. read docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
4. read docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
5. read docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
6. inspect the latest feature/growth-foundation branch
7. audit current user/profile/publication/privacy/indexability data before designing 4C
8. do not expose private account fields merely because a public Creator route is being added
```

Do not implement quality thresholds, Creator public DTO or route behavior before the 4C audit establishes their source-of-truth fields and privacy semantics.

---

## Accepted Blog V1 direction for 4E

Public routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Editorial architecture:

```text
Git repository          -> canonical editorial source
Docker/Nitro deployment -> normal request-time article source
Arvan Object Storage    -> mirror/emergency publication store
```

GitHub is never queried per request.

Emergency Arvan publication may temporarily serve content while Git reconciliation is pending, with identity/version metadata such as:

```text
articleId
revision/contentHash
publishedAt
source=emergency
syncState=pending_git
```

`/manage/blog` target:

```text
metadata form
EN/FA localization editing
Markdown-producing editor
headings/lists/quotes/links/images/etc.
live preview
validation
```

Preferred editor candidate remains `md-editor-v3`, subject to implementation-time version/license validation.

Blog images must reuse the existing/shared Arvan upload pipeline and must not embed base64 payloads into Markdown.

---

## Operational Arvan/S3 note

The existing storage upload path uses AWS SigV4 and depends on correct system time.

During Phase 4A verification, media uploads returned storage `403 Forbidden` after a power outage because the founder laptop clock was incorrect. Correcting system time restored uploads without code changes.

Diagnostic rule:

```text
unexpected SigV4 403 across multiple Arvan upload surfaces
  -> verify host/system clock before treating as CORS/storage/code regression
```

---

## Accepted public/protected boundary inherited forward

```text
/prompts list/catalog -> public product/catalog surface
GET /api/archive      -> public sanitized list/catalog

/prompts?id=<id> full Prompt detail -> authenticated + email gate
GET /api/archive/:id               -> authenticated + email gate

/prompt/:id Public Prompt -> public sanitized acquisition presentation
GET /api/public/prompts/:id -> public published-only sanitized read model
```

Rendering/SEO work must not weaken backend authorization.

Private Drafts are never public or SSR-published.

---

## Accepted internal economy state inherited from Milestone 21

Spendable unit:

```text
goin
```

Simulation reference:

```text
1 goin = 250 toman
```

XP and Goin remain semantically separate.

Current Prompt Archive sink:

```text
first meaningful Prompt Copy unlock = 5 goin
repeat Copy/access after unlock     = free
```

Authoritative economy behavior remains ledger/idempotency/atomicity driven as established in Milestone 21.

---

## Accepted Growth metrics state inherited from Milestone 21

Manage route:

```text
/manage/growth
permission: system.metrics.view
```

Backend summary API:

```text
GET /api/admin/growth/summary?days=7
GET /api/admin/growth/summary?days=30
```

Current behavioral events include:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

Do not use `admin_audit_log` as behavioral analytics.

---

## Migration state

Current Phase 4B migration head:

```text
026_prompt_archive_published_localization_constraint.sql
```

Relevant 4B.5 migrations:

```text
025_prompt_archive_descriptions.sql
026_prompt_archive_published_localization_constraint.sql
```

Before allocating any later migration number, inspect the current branch migration directory again rather than assuming a number is free from this snapshot.

---

## Hard rules inherited forward

```text
DO NOT weaken authorization for SEO.
DO NOT make GET /api/archive/:id public.
DO NOT expose protected Prompt bodies/variants/unlock-gated content.
DO NOT derive Public Prompt description from protected Prompt text.
DO NOT expose private Drafts.
DO NOT expose email, balance, sessions or permissions in public SEO projections.
DO NOT merge public/protected data sources when sharing Prompt presentation UI.
DO NOT use cookie-dependent canonical language.
DO NOT create indexable fake localization fallback pages.
DO NOT let route-level SEO override staging NUXT_PUBLIC_NOINDEX=true.
DO NOT expose private account/profile data through 4C Creator surfaces.
DO NOT query GitHub per Blog request.
DO NOT embed Blog images as base64 Markdown payloads.
DO NOT create a second uncontrolled Blog source of truth beside Git.
DO NOT use admin_audit_log as behavioral analytics.
```

---

## Resume instruction

When continuing in a new chat:

```text
1. read this STATUS.md
2. read docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
3. read docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
4. read docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
5. read docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
6. confirm Phase 21.5.4B remains DONE / ACCEPTED
7. inspect the latest feature/growth-foundation branch state
8. begin 21.5.4C with a privacy/data/indexability audit before implementation
9. preserve all accepted 4A/4B route, localization, SEO, noindex and public/protected boundaries
10. do not begin 4D until 4C is implemented, founder-verified and explicitly accepted
```
