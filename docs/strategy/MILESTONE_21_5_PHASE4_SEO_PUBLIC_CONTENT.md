# Milestone 21.5 — Phase 4 SEO Platform & Public Content Architecture

Status: **IN PROGRESS / 4A + 4B DONE + ACCEPTED / NEXT 4C PUBLIC CREATOR**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent milestone:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

Accepted rendering/runtime baseline:

```text
Phase 21.5.1 Hybrid / SSR Architecture          DONE / ACCEPTED
Phase 21.5.2 Docker Production Runtime          DONE / ACCEPTED
Phase 21.5.3 Cloudflare Production Path         DONE / ACCEPTED
```

Accepted Phase 4 records:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
```

---

## 1. Objective

Phase 4 turns the accepted hybrid Nuxt/Nitro runtime into a reusable SEO/public-content platform.

The target is one shared contract for public acquisition surfaces so every public route has deterministic answers for:

```text
canonical URL
locale URL
indexability / robots
server-rendered title + description
Open Graph / Twitter metadata
structured data when authoritative
sitemap inclusion
404 / redirect behavior
public data projection
internal linking
```

Phase 4 extends the existing architecture. It must not create a parallel SEO stack beside `usePublicSeo`, sanitized public APIs, authorization rules, the existing media pipeline or Nuxt hybrid rendering policy.

Security remains absolute:

```text
DO NOT expose protected Prompt bodies for SEO.
DO NOT SSR/private-publish private Drafts.
DO NOT expose email, balance, sessions, permissions or private account data.
DO NOT make GET /api/archive/:id public merely to serve an SEO page.
```

---

## 2. Existing architecture retained

Accepted foundations:

```text
Nuxt SSR by default for acquisition-capable public routes
explicit ssr:false route rules for interaction-heavy/private routes
Nitro production runtime
server-internal API origin separated from browser-public API origin
Cloudflare production-like staging path
staging global noindex protection
sanitized GET /api/discover projection
public GET /api/archive list/catalog projection
protected GET /api/archive/:id detail
accepted public GET /api/public/prompts/:id projection
existing Arvan Object Storage media pipeline
```

`prompt-draft.ir` remains on the prior production version while Phase 4 is developed and verified on the `grassic.ir` staging path.

---

## 3. Phase 4 execution slices

```text
21.5.4A — SEO Contracts & Route Semantics                     DONE / ACCEPTED
21.5.4B — Public Prompt Architecture                          DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
21.5.4C — Public Creator Architecture + Indexability Policy   NEXT
21.5.4D — Sitemap / Robots / Discovery Migration              NOT STARTED
21.5.4E — Blog V1                                             NOT STARTED
21.5.4F — SEO Integration / Verification / Legacy Retirement  NOT STARTED
```

Implementation order remains intentional:

```text
4A -> 4B -> 4C -> 4D -> 4E -> 4F
```

Shared platform contracts come before Creator, sitemap and Blog route-specific implementation.

---

## 4. 21.5.4A — SEO Contracts & Route Semantics

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

Accepted work:

```text
matured existing usePublicSeo instead of creating duplicate composables
reactive server-rendered title/description metadata
absolute canonical URL contract from NUXT_PUBLIC_SITE_URL
Open Graph + Twitter policy
locale-aware canonical URLs
hreflang + x-default alternates
structured-data injection only from authoritative callers
staging noindex precedence over route-level indexability
locale-aware html lang/dir behavior
EN/FA deterministic URL routing
localized central internal-link handling
route-base-name handling for localized route names
login locale-preserving redirects
server X-Robots-Tag policy for app/private routes
canonical public route helpers
real Discovery 404 behavior
Discovery canonical redirect behavior
reproducible route-audit script
public route contract tests
legacy application prerenders isolated behind NUXT_LEGACY_STATIC_GENERATE
```

Founder-local acceptance evidence included strict route audit, SEO contracts, production build, EN/FA real-runtime route smoke, Discovery 404/canonical redirect semantics, raw SSR canonical/hreflang/lang-dir/OG/Twitter checks, application noindex headers and browser navigation/query/auth-next regression smoke.

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
```

---

## 5. Accepted locale / indexing architecture

Both English and Persian are intended to be indexable only when authoritative localized content actually exists.

Active URL model:

```text
English/default locale -> unprefixed
Persian                -> /fa prefix
```

Nuxt i18n contract:

```text
defaultLocale: en
strategy: prefix_except_default
```

Examples:

```text
/blog/prompt-anatomy
/fa/blog/prompt-anatomy

/prompt/123
/fa/prompt/123

/creator/example
/fa/creator/example
```

Each authoritative localized page is self-canonical.

When both authoritative localizations exist they expose reciprocal `hreflang` and an English/default `x-default` target.

A missing translation must not silently create an indexable localized route containing fallback content and pretending to be a translation.

Application routes may have `/fa` variants but remain application surfaces, not SEO surfaces. Their client-only/noindex policy remains authoritative.

---

## 6. 21.5.4B — Public Prompt Architecture

Status: **DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED**

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

Accepted canonical routes:

```text
/prompt/:id
/fa/prompt/:id
```

The public Prompt route uses a sanitized public presentation projection distinct from protected Prompt detail.

Accepted public presentation fields include only intentionally public data such as:

```text
public numeric id
localized title
localized founder-authored description
availableLocales
publication date
public tags
public model/presentation metadata
public preview media
optional public-safe Telegram message id
```

It does not expose:

```text
protected Prompt body
protected variants
unlock-gated content
private Drafts
source/private Draft payload
storage keys
private account/economy/viewer/permission state
creator attribution before 4C policy
```

Existing product route remains protected:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
```

Existing backend boundary remains protected:

```text
GET /api/archive/:id
```

Dedicated public read model:

```text
GET /api/public/prompts/:id
```

Critical database rule:

```text
public query -> status='published' only
public query -> does not SELECT prompt or variants
```

Accepted localized description contract:

```text
founder-authored EN/FA descriptions
100 published Archive rows backfilled and founder-reviewed
visible description + meta/OG/Twitter/CreativeWork.description share one source
locale availability requires valid title + valid description
no fake fallback localization
```

Accepted shared presentation contract:

```text
public/protected Prompt heroes share presentation only
public and protected data sources remain separate
SSR first-image media fallback
client cinema enhancement
no balance/unlock/permissions/viewer/Prompt/variants in shared component
```

Accepted Discovery visual hardening:

```text
semantic content-sized el-flex hero
zero outer default-layout padding
public category preview media only
SSR first-image fallback
client visual-slider enhancement
single media layer after hydration
slider clipped to hero
```

Founder explicit acceptance:

```text
Phase 4B accepted
```

Final aggregate regression:

```text
pnpm test:phase4b-final -> PASS
strict route audit -> PASS / 447 source files / zero hazards
```

Final staging smoke:

```text
pnpm smoke:phase4b-final -> PASS
public Prompt API 200
invalid public Prompt API 404
protected Archive API 401
EN/FA Public Prompt SSR 200
EN/FA Discovery SSR 200
SEO / noindex / protected-key leakage checks PASS
```

`prompt-draft.ir` remained untouched and staging `NUXT_PUBLIC_NOINDEX=true` remained authoritative.

---

## 7. Public Creator direction — ACTIVE FOR 4C

Canonical target route:

```text
/creator/:username
```

`/user` remains the account/product surface and is not the canonical Creator SEO URL.

Public Creator V1 exposes only intentionally public identity/publication information.

Never expose through Creator SEO:

```text
email
balance / Goin state
sessions
permissions
private Drafts
owner-only stats/counts
```

XP/reputation is excluded from initial public Creator V1 unless a later explicit product decision promotes it.

4C must begin with an audit of current profile/user/publication/moderation fields before a Creator public DTO is locked.

---

## 8. Creator server-authoritative indexability / quality policy

Creator accessibility and indexability are separate concepts.

Accepted default direction:

```text
valid public Creator but quality policy not satisfied
  -> accessible
  -> noindex
  -> excluded from indexable sitemap
  -> excluded from future public discovery eligibility where appropriate
```

States that should normally map to unavailable/404 semantics instead of thin-content noindex include:

```text
nonexistent creator
removed/deleted identity
public access prohibited by moderation/state
```

Target conceptual policy output:

```text
accessible
indexable
discoverable
reasons[]
signals{}
```

Candidate signals:

```text
meaningful public content
content substance/completeness
public identity completeness
publication visibility/quality state
moderation/spam/abuse state
duplicate/thin/low-value signals
```

No arbitrary count/score threshold is approved yet. Exact thresholds/weights remain TBD until 4C audit/design.

The same server-authoritative result should drive route robots metadata, sitemap inclusion and future public Creator discovery behavior.

---

## 9. Discovery migration direction

`/discover/[slug]` already uses request-time SSR-aware loading through the sanitized public discovery API and consumes `usePublicSeo`.

Completed by 4A/4B:

```text
locale-aware metadata/canonical behavior
semantic HTTP 404 for invalid slugs
malformed encoded slug -> 404 rather than accidental 500
canonical lowercase/trailing-slash permanent redirect behavior
Prompt acquisition links -> localized /prompt/:id
public preview-media cinema/background
SSR first-image fallback
```

4D still needs to:

```text
extend authoritative OG/structured data where truthful
migrate Creator links to /creator/:username after 4C exists
integrate Discovery routes with shared sitemap architecture
remove/reduce old post-generate SEO snapshot dependency
```

---

## 10. Robots + sitemap direction

The current static `public/robots.txt` and `scripts/generate-public-seo.ts` sitemap behavior are Milestone 21-era compatibility pieces, not the target Phase 4 architecture.

Target sitemap inventory:

```text
static public acquisition routes
+ public Prompt canonical routes
+ eligible Creator canonical routes
+ published Blog routes
```

Sitemap inclusion must use the same authoritative eligibility rules used by route metadata. It must not create an independent second definition of `indexable`.

Accepted 4A server policy already provides explicit application-route noindex response headers in both locale spaces.

Staging protection remains stronger than route-level SEO:

```text
NUXT_PUBLIC_NOINDEX=true
  -> global noindex response/header behavior
  -> route-level index intent must never override it
```

---

## 11. Blog V1 accepted architecture

Public routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Minimum article behavior:

```text
stable article identity
stable slug
SSR article HTML
localized title/description/body
canonical + language alternates
OG/Twitter metadata
published/updated dates
author attribution when authoritative
Article/BlogPosting structured data where valid
sitemap inclusion
analytics for article view + meaningful product action
```

Accepted editorial source of truth:

```text
repository-backed editorial content
```

The filesystem representation must implement a structured Article + Localization contract so later storage migration does not require redefining public Blog semantics.

Conceptual contract:

```text
Article
  id
  slug
  author
  publishedAt
  updatedAt
  hero media
  localizations
    en
      title
      description
      body
    fa
      title
      description
      body
```

Exact Markdown/frontmatter representation is chosen in 4E. Metadata must not be scattered/hard-coded in Vue pages.

---

## 12. Blog authoring in Manage

Target management route:

```text
/manage/blog
```

Target authoring UX:

```text
article metadata form
EN/FA localization editing
Markdown editor toolbar
headings
bold/italic
ordered/unordered lists
quotes
links
images
code/dividers where appropriate
live preview
validation before export/publish
```

Preferred implementation candidate:

```text
md-editor-v3
```

The library/version/license must be validated at implementation time. The architectural requirement is a Markdown-producing editor, not a proprietary document format.

The admin authoring UI must produce the same clean repository article contract consumed by public SSR.

---

## 13. Blog repository + Arvan resilience architecture

Repository-backed does **not** mean GitHub is queried at request time.

Normal published article serving:

```text
Git repository
  -> build/deploy
  -> article content bundled/available with deployed Nuxt/Nitro runtime
  -> request-time SSR reads deployed/local content
```

Accepted conservative resilience model:

```text
Git repository
  -> canonical editorial source

Arvan Object Storage
  -> mirror / emergency publication store

Deployed Docker/Nitro content
  -> normal request-time primary source
```

Do not make GitHub and Arvan two equal uncontrolled sources of truth.

Emergency publication may use Arvan while Git reconciliation is pending, but identity/version metadata must make that state explicit and deterministic.

---

## 14. Blog media architecture

Do not embed Blog images as base64 inside Markdown.

Blog media should reuse the existing Arvan Object Storage upload pipeline.

Target flow:

```text
/manage/blog -> Insert Image
  -> existing/shared media upload pipeline
  -> Arvan Object Storage
  -> stable public media URL/reference
  -> Markdown article body
```

Where practical, preserve:

```text
id
fullUrl
thumbnailUrl
width
height
alt
caption
```

---

## 15. Operational storage lesson retained

The existing Arvan/AWS-compatible upload path uses SigV4 and therefore depends on correct system time.

Operational implication:

```text
unexpected Arvan/S3 SigV4 403 across multiple upload surfaces
  -> verify host/system clock before treating it as a storage/CORS/code regression
```

This is an environment/runtime diagnostic note, not a Phase 4 blocker.

---

## 16. Legacy `generate-public-seo` retirement

`scripts/generate-public-seo.ts` is a historical Milestone 21 workaround that performs static HTML head patching, snapshot injection, sitemap generation and robots augmentation.

It remains temporarily for rollback/history while native Phase 4 behavior is built.

Target end state after 4F verification:

```text
native SSR metadata/canonical/structured-data behavior authoritative
runtime/shared sitemap architecture authoritative
legacy post-generate HTML patching removed or reduced to a narrow compatibility adapter only if justified
no duplicate SEO source of truth
```

---

## 17. Verification discipline

Phase 4 is not accepted merely because routes render.

Final verification across the remaining slices must cover raw server responses and browser behavior across at least:

```text
/
/guide
/discover/*
/prompt/*
/creator/*
/blog
/blog/*
/fa equivalents where authoritative
```

Required checks include:

```text
server-rendered meaningful HTML
correct status codes
canonical uniqueness
EN/FA URL determinism
hreflang/alternate correctness
robots/indexability correctness
staging global noindex precedence
OG/Twitter metadata
structured-data validity/truthfulness
sitemap inclusion/exclusion
redirect behavior
no protected Prompt/account/private Draft leakage
client-heavy/authenticated route regression smoke
```

Founder verification remains required before each slice is accepted and before Phase 4 as a whole is marked DONE.

---

## 18. Current next action

4A and 4B are closed and accepted.

Proceed to:

```text
21.5.4C — Public Creator Architecture + Indexability Policy
```

Immediate 4C audit/design questions:

```text
1. identify the authoritative user/profile/publication fields that may be public
2. separate public Creator identity from private account identity
3. define /creator/:username lookup, normalization and 404 semantics
4. define suspension/deletion/moderation behavior
5. define server-authoritative accessible/indexable/discoverable policy output
6. define authoritative EN/FA Creator localization availability
7. define canonical/hreflang/OG/structured-data inputs from public-safe fields only
8. define Prompt <-> Creator linking without weakening accepted 4B projection boundaries
9. define sitemap/discovery eligibility inputs for 4D without implementing a second policy source
10. add narrow contract tests before implementation acceptance
```

Do not begin 4D until 4C is implemented, founder-verified and explicitly accepted.
