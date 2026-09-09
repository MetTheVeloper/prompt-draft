# Milestone 21.5 — Phase 4 SEO Platform & Public Content Architecture

Status: **IN PROGRESS / 4A + 4B + 4C DONE + ACCEPTED / NEXT 4D SITEMAP + ROBOTS + DISCOVERY + AI DISCOVERY**

Date: 2026-09-09

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
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4C_8_AGGREGATE_STAGING_ACCEPTANCE.md
docs/strategy/MILESTONE_21_5_PHASE4D_SITEMAP_ROBOTS_AI_DISCOVERY.md
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
AI-oriented public discovery when appropriate
404 / redirect behavior
public data projection
internal linking
```

Phase 4 extends the existing architecture. It must not create a parallel SEO stack beside `usePublicSeo`, sanitized public APIs, authorization rules, the existing media pipeline or Nuxt hybrid rendering policy.

Security remains absolute:

```text
DO NOT expose protected Prompt bodies for SEO or AI discovery.
DO NOT SSR/private-publish private Drafts.
DO NOT expose email, balance, sessions, permissions or private account data.
DO NOT make GET /api/archive/:id public merely to serve an SEO/AI page.
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
accepted public GET /api/public/creators/:username projection
existing Arvan Object Storage media pipeline
```

`prompt-draft.ir` remains on the prior production version while Phase 4 is developed and verified on the `grassic.ir` staging path.

---

## 3. Phase 4 execution slices

```text
21.5.4A — SEO Contracts & Route Semantics                     DONE / ACCEPTED
21.5.4B — Public Prompt Architecture                          DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
21.5.4C — Public Creator Architecture + Indexability Policy   DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
21.5.4D — Sitemap / Robots / Discovery + AI Discovery         NEXT / AUDIT FIRST
21.5.4E — Blog V1                                             NOT STARTED
21.5.4F — SEO Integration / Verification / Legacy Retirement  NOT STARTED
```

Implementation order remains intentional:

```text
4A -> 4B -> 4C -> 4D -> 4E -> 4F
```

Shared platform contracts come before sitemap and Blog route-specific implementation.

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
minimal approved Creator attribution after 4C
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
internal source user/draft ids
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
```

Final staging smoke:

```text
pnpm smoke:phase4b-final -> PASS
```

`prompt-draft.ir` remained untouched and staging `NUXT_PUBLIC_NOINDEX=true` remained authoritative.

---

## 7. 21.5.4C — Public Creator Architecture + Indexability Policy

Status: **DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED 2026-09-09**

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4C_3_CREATOR_APPLICATION_ADMIN_REVIEW.md
docs/strategy/MILESTONE_21_5_PHASE4C_4_PUBLIC_CREATOR_POLICY_API.md
docs/strategy/MILESTONE_21_5_PHASE4C_5_PUBLIC_CREATOR_SSR.md
docs/strategy/MILESTONE_21_5_PHASE4C_6_CREATOR_SEO_INDEXABILITY.md
docs/strategy/MILESTONE_21_5_PHASE4C_7_PROMPT_DISCOVERY_CREATOR_ATTRIBUTION.md
docs/strategy/MILESTONE_21_5_PHASE4C_8_AGGREGATE_STAGING_ACCEPTANCE.md
```

Accepted model:

```text
users.role remains user|admin|super_admin
Creator is a separate explicit reviewed public-identity lifecycle
profile completion never auto-promotes
publishing a Prompt never auto-promotes
Creator request requires complete localized Creator profile
admin/super_admin review through creators.manage
self-review blocked
```

Accepted Creator lifecycle:

```text
none
pending
approved
rejected
suspended
```

Accepted Creator application requirements:

```text
active account
canonical username
screenName EN + FA
bio EN + FA
article EN + FA
>= 1 active controlled taxonomy skill
```

Explicitly not required:

```text
avatar
cover
birthday
links
location
published Prompt count
XP
Goin/balance
```

Accepted public Creator policy:

```text
accessible = account exists + active + Creator approved + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
published Prompt count = signal only / never a gate
```

Accepted canonical routes:

```text
/creator/:username
/fa/creator/:username
```

Accepted public API:

```text
GET /api/public/creators/:username
```

Public Creator positive allowlist is limited to:

```text
canonical username
localized ScreenName/Bio/Article
safe avatar/cover
active localized taxonomy skills
safe HTTP/HTTPS public links
location.text only
canonical published Archive summaries
policy.indexable/discoverable
```

Explicitly excluded:

```text
internal UUID
email
birthday
role/account status
Creator lifecycle/review metadata
XP/Goin
permissions/sessions/referrals
private Drafts
storage keys
location provider metadata
admin audit data
raw Prompt bodies/variants/source ids
```

Accepted Public Creator SSR/SEO behavior:

```text
localized EN/FA rendering
LTR/RTL
sanitized Markdown Article
self canonical
reciprocal EN/FA hreflang
x-default -> EN/default
localized OG/Twitter metadata
ProfilePage JSON-LD + Person mainEntity
policy-driven noindex
NUXT_PUBLIC_NOINDEX staging override always wins
real 404 for unavailable Creator
mixed-case username -> permanent localized canonical redirect
```

Accepted Prompt/Discovery attribution policy:

```text
prompt_archive_items.source_user_id remains internal provenance
only accessible approved Creator becomes public attribution
ordinary/pending/rejected/suspended/inactive/provenance-less owner remains public but unattributed
minimal browser attribution = { username, avatarUrl } | null
no UUID/source_user_id/email/private account data
Home/Public Discovery use Creator vocabulary instead of active-user owner heuristic
```

Final aggregate evidence:

```text
pnpm test:phase4c-final -> PASS
pnpm frontend -> PASS
pnpm smoke:phase4c-final -> PASS
strict route audit -> 463 source files / zero hazards
runtime localization -> fallback EN 0 / Creator FA missing 0 / extra 0
Creator API/SSR EN+FA / 301 / 404 / privacy / noindex staging smoke -> PASS
prompt-draft.ir not targeted
```

Founder explicit final acceptance:

```text
Phase 4C تایید
```

---

## 8. Discovery migration direction — NEXT FOR 4D

`/discover/[slug]` already uses request-time SSR-aware loading through the sanitized public discovery API and consumes `usePublicSeo`.

Completed by 4A–4C:

```text
locale-aware metadata/canonical behavior
semantic HTTP 404 for invalid slugs
malformed encoded slug -> 404 rather than accidental 500
canonical lowercase/trailing-slash permanent redirect behavior
Prompt acquisition links -> localized /prompt/:id
public preview-media cinema/background
SSR first-image fallback
approved Creator attribution -> localized /creator/:username
no active-user-is-public-creator heuristic
```

4D now needs to:

```text
extend authoritative OG/structured data where truthful
integrate Discovery routes with shared sitemap architecture
make sitemap eligibility consume accepted Prompt/Creator policy outputs
add a supplemental llms.txt projection from the same shared public inventory
replace/reduce Milestone-21 static SEO snapshot dependencies
migrate robots/sitemap runtime behavior without weakening staging noindex
```

---

## 9. Robots + sitemap + AI-discovery direction — 4D TARGET

Detailed 4D planning source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_SITEMAP_ROBOTS_AI_DISCOVERY.md
```

The current static `public/robots.txt` and `scripts/generate-public-seo.ts` sitemap behavior are Milestone 21-era compatibility pieces, not the target Phase 4 architecture.

Target sitemap inventory:

```text
static public acquisition routes
+ public Prompt canonical routes
+ eligible Creator canonical routes
+ published Blog routes once 4E exists
```

Sitemap inclusion must use the same authoritative eligibility rules used by route metadata. It must not create an independent second definition of `indexable`.

Accepted 4A server policy already provides explicit application-route noindex response headers in both locale spaces.

Accepted 4C Creator policy already supplies the authoritative Creator `indexable`/`discoverable` result.

Staging protection remains stronger than route-level SEO:

```text
NUXT_PUBLIC_NOINDEX=true
  -> global noindex response/header behavior
  -> route-level index intent must never override it
```

Phase 4D also explicitly evaluates and, when the audit confirms a clean integration path, implements:

```text
/llms.txt
```

For Prompt Draft, `llms.txt` is a supplemental/experimental LLM-friendly guide to already-public canonical resources. It is **not** a crawler permission mechanism, training consent signal, sitemap replacement, or guarantee of AI indexing/citation.

Required architecture:

```text
shared canonical/indexable public inventory
-> sitemap projection
-> llms.txt projection
```

It must not become a second Prompt/Creator eligibility system.

Candidate current resource families are:

```text
/
/guide
/discover/:slug
/prompt/:id
/creator/:username
```

Blog URLs may join the shared sitemap/llms inventory only after 4E defines published Blog semantics.

`llms.txt` must never expose or direct models toward protected Prompt bodies/variants, private Drafts, private Creator/account fields, internal UUID/source ids, storage keys, economy/permission/session state, or admin/provider metadata.

The audit must choose static, build-generated, or runtime output based on shared-policy reuse, Docker/Nitro/static-generate compatibility, staging behavior and operational simplicity. Do not introduce request-time GitHub/external-service dependencies merely to build sitemap/AI-discovery output.

---

## 10. Blog V1 accepted architecture

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

## 11. Blog authoring in Manage

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

## 12. Blog repository + Arvan resilience architecture

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

## 13. Blog media architecture

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

## 14. Operational storage lesson retained

The existing Arvan/AWS-compatible upload path uses SigV4 and therefore depends on correct system time.

Operational implication:

```text
unexpected Arvan/S3 SigV4 403 across multiple upload surfaces
  -> verify host/system clock before treating it as a storage/CORS/code regression
```

This is an environment/runtime diagnostic note, not a Phase 4 blocker.

---

## 15. Legacy `generate-public-seo` retirement

`scripts/generate-public-seo.ts` is a historical Milestone 21 workaround that performs static HTML head patching, snapshot injection, sitemap generation and robots augmentation.

It remains temporarily for rollback/history while native Phase 4 behavior is built.

Target end state after 4F verification:

```text
native SSR metadata/canonical/structured-data behavior authoritative
runtime/shared sitemap architecture authoritative
shared inventory also able to project llms.txt without parallel eligibility logic
legacy post-generate HTML patching removed or reduced to a narrow compatibility adapter only if justified
no duplicate SEO/AI-discovery source of truth
```

---

## 16. Verification discipline

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
/llms.txt
/sitemap.xml
/robots.txt
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
llms.txt canonical/public-only content
llms.txt and sitemap sharing authoritative eligibility inputs
redirect behavior
no protected Prompt/account/private Draft leakage
no private data leakage through llms.txt
client-heavy/authenticated route regression smoke
```

Founder verification remains required before each slice is accepted and before Phase 4 as a whole is marked DONE.

---

## 17. Current next action

4A, 4B and 4C are closed and founder-accepted.

Proceed to:

```text
21.5.4D — Sitemap / Robots / Discovery + AI Discovery
```

4D planning source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_SITEMAP_ROBOTS_AI_DISCOVERY.md
```

Immediate 4D audit/design questions:

```text
1. inventory current public/robots.txt, any public/llms.txt, generate-public-seo.ts and sitemap outputs
2. identify runtime vs generate-time sitemap/robots consumers and deployment assumptions
3. define one authoritative public URL inventory for static routes, Discovery, Public Prompts and approved indexable Creators
4. consume accepted Creator policy.indexable/discoverable rather than re-deriving Creator eligibility
5. consume authoritative Prompt locale availability rather than creating fallback entries
6. define EN/FA sitemap alternate behavior and xhtml hreflang policy
7. define staging robots/sitemap/llms behavior under NUXT_PUBLIC_NOINDEX=true without weakening global staging protection
8. preserve application/private noindex/X-Robots-Tag rules from 4A
9. audit Discovery structured data and sitemap inclusion against sanitized public DTO only
10. decide static vs generated vs runtime /llms.txt while forcing it to consume the same shared canonical/indexable inventory as sitemap
11. keep llms.txt supplemental: not crawler permission, not training consent, not an independent indexability policy
12. keep protected Prompt/private Draft/private Creator/account data out of sitemap/robots/llms outputs
13. define retirement/migration path for generate-public-seo.ts without breaking static-generate compatibility prematurely
14. add narrow contract tests before implementation acceptance
```

Before proposing founder verification commands, read and obey:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

Use the smallest rebuild/test scope and root `package.json` scripts to keep verification fast.

Do not begin 4E until 4D is implemented, founder-verified and explicitly accepted.
