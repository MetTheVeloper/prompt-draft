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
Phase 21.5.4 SEO/Public Content Architecture    -> IN PROGRESS / 4A ACCEPTED / 4B NEXT
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
Phase 4 — SEO Platform & Public Content Architecture IN PROGRESS
Phase 5 — Organic Acquisition Launch & Measurement   NOT STARTED
```

Phase 4 slices:

```text
21.5.4A SEO Contracts & Route Semantics                    DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
21.5.4B Public Prompt Architecture                         NEXT
21.5.4C Public Creator + Indexability Policy               NOT STARTED
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

## Phase 4A — accepted SEO/routing foundation

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

Founder-local 4A gates:

```text
pnpm seo:audit-routes:strict -> PASS, 441 files, zero hazards
pnpm test:seo-contracts     -> PASS, 5/5
pnpm build                  -> PASS
EN/FA runtime route smoke   -> PASS
canonical redirect smoke    -> PASS
raw SSR metadata smoke      -> PASS
browser locale navigation   -> PASS
application noindex headers -> PASS
staging public noindex      -> PASS
founder acceptance          -> PASS
```

Verification found and fixed two meaningful regressions:

```text
1. Vue I18n SyntaxError: 26 on refresh after locale switching
   root cause: useI18n/usePublicSeo from global Nuxt plugin
   fix: Home/Guide SEO policy moved into component setup

   Persian font selector also expected lang=fa while SSR emits fa-IR
   fix: html[lang|='fa']

2. /manage EN missed X-Robots-Tag
   root cause: legacy Nitro prerender bypassed request-time SEO middleware
   fix: app/client-only prerenders gated behind NUXT_LEGACY_STATIC_GENERATE=true
```

Relevant remediation/acceptance commits:

```text
8d05c3fd95c174ac6dc7b4f5eea1be2fcab50375
  i18n initialization + Persian font remediation

aeaa6353f89e0ca48a9668a3382100579593e617
  legacy application prerender isolation

6fcc37f3d8629ee750877585aac7910e54d9dd64
  Phase 4A founder-local acceptance record

b4fda517eab0dbeb9862174ac878486f9b890d19
  Phase 4 parent advanced to 4B
```

---

## Accepted locale/indexing direction

```text
English/default -> unprefixed
Persian         -> /fa
EN + FA both indexable when authoritative localized content exists
self-canonical per locale
reciprocal hreflang when both authoritative localizations exist
x-default -> English/default
```

One URL must deterministically render one language.

Do not use cookie-dependent canonical language.

Missing translation must not create fake indexable fallback content pretending to be an authoritative translation.

---

## Current action — 21.5.4B Public Prompt Architecture

Canonical public Prompt route:

```text
/prompt/:id
/fa/prompt/:id
```

Current protected/product route remains:

```text
/prompts?id=<id>
```

Backend security boundary remains:

```text
GET /api/archive            -> public list/catalog
GET /api/archive/:id        -> authenticated + email gate
```

4B must create/use a sanitized public Prompt presentation projection rather than exposing the protected detail payload.

Public fields may include authoritative presentation data such as:

```text
public id
localized title
publication date
public tags
public preview media
public model/presentation metadata
public creator attribution when intentionally public
```

Never expose through public Prompt SEO:

```text
protected Prompt body
protected variants
unlock-gated content
private Drafts
email/balance/session/permission/account state
```

Immediate 4B tasks:

```text
1. audit existing archive/discovery/public projection code paths
2. define sanitized public Prompt API/domain contract
3. define /prompt/:id SSR route loading and 404/availability semantics
4. define authoritative EN/FA localization behavior
5. wire usePublicSeo metadata from sanitized fields only
6. define truthful structured data inputs
7. preserve /prompts?id=<id> protected behavior
8. preserve GET /api/archive/:id protection
9. define Discovery/public-link migration compatibility
10. add contract tests + founder-local runtime acceptance gate
```

---

## Accepted public Creator direction for 4C

```text
/user
  -> account/product surface
  -> not canonical SEO Creator URL

/creator/:username
  -> future public SSR/SEO Creator route
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

Exact quality thresholds remain deliberately TBD until 4C.

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

Preferred editor candidate:

```text
md-editor-v3
```

Validate implementation-time version/license before install.

Blog images:

```text
reuse existing/shared Arvan upload pipeline
never embed base64 in Markdown
preserve stable media URL/reference
preserve id/fullUrl/thumbnailUrl/width/height/alt/caption where practical
```

---

## Operational Arvan/S3 note

The existing storage upload path uses AWS SigV4 and depends on correct system time.

During Phase 4A verification, all media uploads returned storage `403 Forbidden` after a power outage because the founder laptop clock was incorrect. Correcting system time restored uploads without code changes.

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

Canonical detailed economy records remain in the Milestone 21 strategy/verification documents.

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

Current schema migrations extend through:

```text
024_prompt_archive_unlocks.sql
```

Next future schema migration:

```text
025_*.sql
```

Do not allocate a new migration number without first checking the branch.

---

## Hard rules inherited forward

```text
DO NOT weaken authorization for SEO.
DO NOT make GET /api/archive/:id public.
DO NOT expose protected Prompt bodies/variants/unlock-gated content.
DO NOT expose private Drafts.
DO NOT expose email, balance, sessions or permissions in public SEO projections.
DO NOT use cookie-dependent canonical language.
DO NOT create indexable fake localization fallback pages.
DO NOT let route-level SEO override staging NUXT_PUBLIC_NOINDEX=true.
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
3. read docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md for accepted 4A evidence
4. inspect the latest feature/growth-foundation branch state
5. continue with 21.5.4B Public Prompt Architecture
6. discuss/lock architecture before broad implementation changes
7. update Phase 4 source/status after each accepted slice
```
