# Milestone 21.5 — Phase 4 SEO Platform & Public Content Architecture

Status: **IN PROGRESS / 4A DONE + ACCEPTED / NEXT 4B PUBLIC PROMPT**

Date: 2026-09-07

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

Phase 4A verification record:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
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

Phase 4 extends the existing architecture. It must not create a parallel SEO stack beside `usePublicSeo`, sanitized discovery APIs, authorization rules, the existing media pipeline or Nuxt hybrid rendering policy.

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
existing Arvan Object Storage media pipeline
```

`prompt-draft.ir` remains on the prior production version while Phase 4 is developed and verified on the `grassic.ir` staging path.

---

## 3. Phase 4 execution slices

```text
21.5.4A — SEO Contracts & Route Semantics                    DONE / ACCEPTED
21.5.4B — Public Prompt Architecture                         NEXT
21.5.4C — Public Creator Architecture + Indexability Policy NOT STARTED
21.5.4D — Sitemap / Robots / Discovery Migration            NOT STARTED
21.5.4E — Blog V1                                           NOT STARTED
21.5.4F — SEO Integration / Verification / Legacy Retirement NOT STARTED
```

Implementation order is intentional:

```text
4A -> 4B -> 4C -> 4D -> 4E -> 4F
```

Shared platform contracts come before Prompt, Creator and Blog route-specific implementation.

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

Founder-local acceptance evidence:

```text
pnpm seo:audit-routes:strict -> PASS, 441 files, zero hazards
pnpm test:seo-contracts     -> PASS, 5/5
pnpm build                  -> PASS
EN/FA real-runtime route smoke on grassic.ir -> PASS
Discovery invalid route semantics -> real 404 PASS
Discovery uppercase/trailing-slash canonical 301 -> PASS
raw SSR canonical/hreflang/lang-dir/OG/Twitter -> PASS
application-route X-Robots-Tag EN/FA -> PASS
staging-wide public-route noindex precedence -> PASS
browser locale/navigation/query/auth-next regression smoke -> PASS
founder acceptance -> PASS
```

Important verification-found regressions were fixed before acceptance:

```text
Vue I18n error 26 caused by useI18n/usePublicSeo from a global Nuxt plugin
  -> moved Home/Guide SEO policy into component setup

Persian font selector matched lang=fa but accepted SSR emits fa-IR
  -> selector changed to html[lang|='fa']

legacy prerender of /manage and other application routes bypassed request-time SEO middleware
  -> application prerenders gated behind legacy static-generate mode
```

Canonical 4A record:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
```

---

## 5. Accepted locale / indexing architecture

Both English and Persian are intended to be indexable when authoritative localized content actually exists.

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

Each authoritative localized page is self-canonical:

```text
EN canonical -> EN URL
FA canonical -> FA URL
```

When both authoritative localizations exist they expose reciprocal `hreflang` and an English/default `x-default` target.

A missing translation must not silently create an indexable localized route containing fallback content and pretending to be a translation. Dynamic Blog/entity localization availability is enforced by the relevant later phase.

Application routes may have `/fa` variants but remain application surfaces, not SEO surfaces. Their client-only and noindex policy remains authoritative.

---

## 6. 21.5.4B — Public Prompt Architecture

Status: **NEXT**

Accepted canonical route:

```text
/prompt/:id
```

Locale examples:

```text
/prompt/123
/fa/prompt/123
```

Public Prompt must use a sanitized public presentation projection distinct from protected Prompt detail.

Public SEO-capable fields may include authoritative presentation data such as:

```text
public id
localized title
publication date
public tags
public model/presentation metadata
public preview media
public creator attribution when intentionally public
```

It must not expose:

```text
protected Prompt body
protected variants
unlock-gated content
private drafts
private account/economy state
```

Existing product route remains protected:

```text
/prompts?id=<id>
```

Existing backend boundary remains protected:

```text
GET /api/archive/:id
```

4B must not make either protected contract public as an SEO shortcut.

4B should define the sanitized public Prompt projection, route loading/status semantics, metadata/structured-data policy, internal-link migration compatibility and EN/FA authoritative-localization behavior before implementation is accepted.

---

## 7. Accepted public Creator direction

Canonical route:

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

---

## 8. Creator server-authoritative indexability / quality policy

Creator accessibility and indexability are separate concepts.

Accepted default behavior:

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

No arbitrary count/score threshold is approved yet. Exact thresholds/weights remain TBD until 4C.

The same server-authoritative result should drive route robots metadata, sitemap inclusion and future public Creator discovery behavior.

---

## 9. Discovery migration direction

`/discover/[slug]` already uses request-time SSR-aware loading through the sanitized public discovery API and consumes `usePublicSeo`.

Completed and accepted in 4A:

```text
locale-aware metadata/canonical behavior
semantic HTTP 404 for invalid slugs
malformed encoded slug -> 404 rather than accidental 500
canonical lowercase/trailing-slash permanent redirect behavior
```

4D still needs to:

```text
use authoritative public preview media for OG where valid
add structured data only when truthful
migrate Prompt links to /prompt/:id after 4B exists
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

Normal publish direction:

```text
/manage/blog
  -> validated article artifact
  -> canonical Git commit/push
  -> normal deployment
  -> optional/expected Arvan mirror
```

Emergency publish when GitHub/international connectivity is unavailable:

```text
/manage/blog
  -> validated article artifact
  -> Arvan emergency publication
  -> runtime may serve emergency article
  -> publication marked pending Git reconciliation
```

When connectivity returns:

```text
pending Arvan emergency article
  -> deterministic reconcile/sync to Git
  -> normal deployment
  -> clear pending state
```

Emergency artifact identity/version metadata should include conceptually:

```text
articleId
revision/contentHash
publishedAt
source = emergency
syncState = pending_git
```

This feature must remain narrowly scoped and must not accidentally become a general-purpose CMS synchronization system.

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

The article body references uploaded media rather than containing binary data.

A provider-independent media reference may be introduced only if it materially reduces future storage/hostname migration cost and still resolves through the shared media layer.

---

## 15. Operational storage lesson retained

The existing Arvan/AWS-compatible upload path uses SigV4 and therefore depends on correct system time.

During Phase 4A verification, storage uploads returned `403 Forbidden` after a power outage because the founder laptop clock was incorrect. Correcting the system clock restored avatar/draft media uploads without code changes.

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

Final verification must cover raw server responses and browser behavior across at least:

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

Phase 4A is closed and accepted.

Proceed to:

```text
21.5.4B — Public Prompt Architecture
```

Immediate 4B design questions to resolve against the accepted contracts:

```text
1. define sanitized public Prompt projection and authoritative backend source
2. define /prompt/:id SSR loading and status semantics
3. define EN/FA localization availability behavior without fake fallback indexing
4. define canonical/OG/Twitter/structured-data inputs from sanitized fields only
5. preserve /prompts?id=<id> as protected product detail
6. preserve GET /api/archive/:id as protected
7. define internal-link compatibility/migration path for Discovery/public surfaces
8. add 4B contract tests and founder-local runtime verification before acceptance
```
