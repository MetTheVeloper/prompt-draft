# Milestone 21.5 — Phase 4 SEO Platform & Public Content Architecture

Status: **IN PROGRESS / 4A IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

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

The goal is not to create route-specific SEO patches. The goal is to establish one shared contract for public acquisition surfaces so that each public route has deterministic answers for:

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

Phase 4 must extend the current architecture. It must not create a parallel SEO stack beside the existing `usePublicSeo`, sanitized discovery APIs, authorization model or Nuxt hybrid rendering policy.

---

## 2. Existing architecture retained

The following are accepted foundations, not targets for replacement:

```text
Nuxt SSR by default for acquisition-capable public routes
explicit ssr:false route rules for interaction-heavy/private routes
Nitro production runtime
server-internal API origin separated from browser-public API origin
Cloudflare production path
staging global noindex protection
sanitized GET /api/discover projection
public GET /api/archive list/catalog projection
protected GET /api/archive/:id detail
existing Arvan Object Storage media pipeline
```

Security remains absolute:

```text
DO NOT expose protected Prompt bodies for SEO.
DO NOT SSR/private-publish private Drafts.
DO NOT expose email, balance, sessions, permissions or private account data.
DO NOT make GET /api/archive/:id public merely to serve an SEO page.
```

---

## 3. Phase 4 execution slices

```text
21.5.4A — SEO Contracts & Route Semantics
21.5.4B — Public Prompt Architecture
21.5.4C — Public Creator Architecture + Indexability Policy
21.5.4D — Sitemap / Robots / Discovery Migration
21.5.4E — Blog V1
21.5.4F — SEO Integration / Verification / Legacy Retirement
```

Implementation order is intentional. Shared platform contracts come before Prompt, Creator and Blog route-specific implementation.

---

## 4. 21.5.4A — SEO Contracts & Route Semantics

Status: **IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

Implemented work:

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
```

Verification is deliberately separate from implementation and remains required before 4A is accepted.

### Title policy

Default public title format:

```text
<Page Title> · Prompt Draft
```

Home remains:

```text
Prompt Draft
```

Descriptions must be route/content-specific where meaningful. Global fallback metadata remains a fallback, not the final metadata source for acquisition pages.

### Canonical contract

Canonical URLs must be absolute when `NUXT_PUBLIC_SITE_URL` is configured.

Canonical URLs must describe the authoritative route identity and must not retain incidental tracking/filter/query parameters unless a future route contract explicitly declares them canonical.

---

## 5. Accepted locale / indexing architecture

Both English and Persian are intended to be indexable when authoritative localized content actually exists.

Active URL model:

```text
English/default locale
  -> no locale prefix

Persian
  -> /fa prefix
```

Active Nuxt i18n routing strategy:

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

Each localized page is self-canonical:

```text
EN canonical -> EN URL
FA canonical -> FA URL
```

When both authoritative localizations exist they expose reciprocal language alternates (`hreflang`) and an English/default `x-default` direction where appropriate.

A missing translation must not silently create an indexable localized route containing fallback content and pretending to be a translation. Dynamic Blog/localized-entity availability is enforced by the relevant later content phase.

### Application routes

The locale strategy also creates localized application URLs such as `/fa/create`, but that does not make those routes SEO surfaces. Existing client-only/private/indexability policy remains authoritative.

Both EN and `/fa` variants of client-heavy routes remain `ssr:false` where previously intended, and server middleware adds explicit noindex response headers to application/private route families.

### Localized-navigation acceptance gate

The locale URL contract is now implemented, but it is not accepted until a reproducible source audit confirms no unresolved programmatic-navigation hazards remain.

Commands:

```powershell
pnpm seo:audit-routes
pnpm seo:audit-routes:strict
```

The strict audit checks raw programmatic internal navigation and direct locale-sensitive route-name comparisons. Findings must be fixed or deliberately justified; they must not be suppressed merely to make the gate green.

---

## 6. Accepted public Prompt direction

Canonical route:

```text
/prompt/:id
```

The public Prompt route must use a sanitized public presentation projection distinct from protected Prompt detail.

Public SEO-capable data may include authoritative presentation fields such as:

```text
public id
localized title
publication date
public tags
public model/presentation metadata
public preview images
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

Existing `/prompts?id=<id>` remains the current protected/product detail contract until 4B defines compatibility/redirect behavior. It must not be made public as an SEO shortcut.

---

## 7. Accepted public Creator direction

Canonical route:

```text
/creator/:username
```

`/user` remains the signed-in/account-oriented product surface and is not the canonical Creator SEO URL.

Public Creator V1 exposes only intentionally public identity/publication information.

Do not promote current account-oriented fields into SEO merely because an older public-profile API happens to contain them.

Specifically, public Creator SEO V1 should not expose account/economy internals such as:

```text
email
balance / Goin state
sessions
permissions
private Drafts
owner-only counts
```

XP/reputation is also excluded from the initial SEO Creator contract unless a later product decision explicitly promotes it as public identity information.

---

## 8. Creator server-authoritative indexability / quality policy

Creator accessibility and Creator indexability are separate concepts.

A thin/new/incomplete but otherwise valid public Creator page may remain accessible while being excluded from search indexing.

Default accepted behavior:

```text
valid public Creator but quality policy not satisfied
  -> page remains accessible
  -> robots noindex
  -> excluded from indexable sitemap
  -> excluded from future public discovery eligibility where appropriate
```

Examples of states that should normally resolve to unavailable/404 semantics rather than thin-content noindex include:

```text
nonexistent creator
removed/deleted identity
public access prohibited by moderation/state
```

Final moderation-state mapping is implemented in 4C.

The shared server policy must produce richer output than one page-local boolean. Target conceptual result:

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

No arbitrary count/score threshold is approved yet. Exact thresholds/weights remain deliberately TBD until 4C design/verification.

The same server-authoritative result must drive, where applicable:

```text
Creator route robots metadata
sitemap inclusion
public Creator SEO behavior
future public discovery eligibility
```

---

## 9. Discovery migration direction

`/discover/[slug]` already uses request-time SSR-aware loading through the sanitized public discovery API and consumes the shared `usePublicSeo` primitive.

Phase 4 does not replace that architecture.

Completed in 4A:

```text
locale-aware metadata/canonical behavior
semantic HTTP 404 for invalid slugs
malformed encoded slug -> 404 rather than accidental 500
canonical lowercase/trailing-slash redirect behavior
```

4D will still:

```text
use authoritative public preview images for OG where valid
add structured data only when truthful
migrate Prompt links to /prompt/:id after 4B exists
migrate Creator links to /creator/:username after 4C exists
integrate discovery routes with the shared sitemap architecture
remove/reduce the old post-generate SEO snapshot dependency
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

Sitemap inclusion must use the same authoritative eligibility rules used by route metadata. It must not create an independent second definition of "indexable".

4A now provides server-level noindex response policy for current application/private route families in both locale spaces.

Staging protection remains stronger than route-level SEO:

```text
NUXT_PUBLIC_NOINDEX=true
  -> global noindex response/header behavior
  -> route-level index intent must never override it
```

---

## 11. Blog V1 accepted architecture

Blog V1 remains intentionally smaller than a CMS.

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

### Editorial source of truth

Accepted V1:

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

The exact Markdown/frontmatter filesystem representation is chosen in 4E, but metadata must not be scattered/hard-coded in Vue pages.

---

## 12. Blog authoring in Manage

Blog remains repo-backed while authoring becomes admin-friendly.

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

Current preferred free/open-source editor candidate:

```text
md-editor-v3
```

The library choice is implementation-time validated before installation; the architectural requirement is a Markdown-producing editor, not a proprietary document format.

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

Previously deployed Blog content therefore remains readable even when GitHub/international connectivity is unavailable, as long as the serving runtime/path remains available.

### Dual-path publication resilience

Accepted conservative model:

```text
Git repository
  -> canonical editorial source

Arvan Object Storage
  -> mirror / emergency publication store

Deployed Docker/Nitro content
  -> normal request-time primary source
```

Do **not** make GitHub and Arvan two equal uncontrolled sources of truth.

Normal publish direction:

```text
/manage/blog
  -> validated article artifact
  -> canonical Git commit/push
  -> normal deployment
  -> optional/expected Arvan mirror
```

Emergency publish direction when GitHub/international access is unavailable:

```text
/manage/blog
  -> validated article artifact
  -> Arvan emergency publication
  -> runtime may serve emergency article
  -> mark publication pending Git reconciliation
```

When connectivity returns:

```text
pending Arvan emergency article
  -> deterministic reconcile/sync to Git
  -> normal deployment
  -> clear pending state
```

Emergency artifacts should carry sufficient identity/version metadata, conceptually:

```text
articleId
revision/contentHash
publishedAt
source = emergency
syncState = pending_git
```

This resilience feature belongs to Blog implementation/verification and must remain narrow enough that it does not accidentally become a general-purpose CMS synchronization system.

---

## 14. Blog media architecture

Do not embed Blog images as base64 inside Markdown.

Blog media should reuse the existing Arvan Object Storage upload pipeline rather than introducing a second media system.

Target editor flow:

```text
/manage/blog -> Insert Image
  -> existing/shared media upload pipeline
  -> Arvan Object Storage
  -> stable public media URL/reference
  -> Markdown article body
```

Where practical, media identity should preserve metadata such as:

```text
id
fullUrl
thumbnailUrl
width
height
alt
caption
```

The article body should reference uploaded media, not contain binary data.

A provider-independent media reference may be introduced if it materially reduces future hostname/storage migration cost; if used, it must resolve through the existing shared media layer rather than create another storage abstraction.

---

## 15. Legacy `generate-public-seo` retirement

`scripts/generate-public-seo.ts` is a historical Milestone 21 workaround that currently performs static HTML head patching, snapshot injection, sitemap generation and robots sitemap augmentation.

It remains temporarily for rollback/history while the native Phase 4 platform is built.

Target end state after 4F verification:

```text
native SSR metadata/canonical/structured-data behavior authoritative
runtime/shared sitemap architecture authoritative
legacy post-generate HTML patching removed or reduced to a narrow compatibility adapter only if still justified
no duplicate SEO source of truth
```

---

## 16. Verification discipline

Phase 4 is not accepted because routes merely render.

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

Founder verification remains required before Phase 4 is marked DONE.

---

## 17. Current next action

```text
Verify 21.5.4A on the latest branch.

1. pnpm seo:audit-routes:strict
2. pnpm test:seo-contracts
3. pnpm build
4. pnpm preview + EN/FA route smoke
5. inspect raw canonical/hreflang/robots metadata
6. resolve any audit/runtime regression findings
7. founder accepts 4A
8. proceed to 4B Public Prompt
```
