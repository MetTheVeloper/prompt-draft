# Milestone 21.5 — Phase 4 SEO Platform & Public Content Architecture

Status: **IN PROGRESS / 4A + 4B + 4C + 4D DONE + ACCEPTED / 4E BLOG V1 NEXT**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent milestone:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

Operational workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

---

## 1. Objective

Phase 4 turns the accepted hybrid Nuxt/Nitro runtime into one reusable SEO/public-content platform.

Every acquisition surface must have deterministic answers for:

```text
canonical URL
locale URL
indexability / robots
SSR title + description
OG/Twitter metadata
structured data when authoritative
sitemap inclusion
AI-oriented discovery where appropriate
404 / redirect behavior
public data projection
internal linking
```

Phase 4 must extend shared architecture rather than create parallel SEO, authorization, content, or localization stacks.

Security remains absolute:

```text
DO NOT expose protected Prompt bodies/variants for SEO/public content.
DO NOT SSR/private-publish private Drafts.
DO NOT expose private account/Creator data.
DO NOT make GET /api/archive/:id public.
```

---

## 2. Accepted runtime baseline

```text
21.5.1 Hybrid / SSR Architecture   DONE / ACCEPTED
21.5.2 Docker Production Runtime   DONE / ACCEPTED
21.5.3 Cloudflare Production Path  DONE / ACCEPTED
```

Accepted foundations include:

```text
Nuxt SSR for acquisition-capable public routes
explicit application/client-heavy route policy
Nitro Docker runtime
server-internal vs browser-public API origin split
Cloudflare staging path
NUXT_PUBLIC_NOINDEX staging protection
sanitized public APIs
existing Arvan Object Storage media pipeline
```

`prompt-draft.ir` remains untouched until an explicit rollout phase.

---

## 3. Phase 4 execution order

```text
21.5.4A SEO Contracts & Route Semantics                    DONE / ACCEPTED
21.5.4B Public Prompt Architecture                         DONE / ACCEPTED
21.5.4C Public Creator + Indexability Policy               DONE / ACCEPTED
21.5.4D Sitemap / Robots / Discovery + AI Discovery        DONE / ACCEPTED 2026-09-09
21.5.4E Blog V1                                            NEXT / AUDIT FIRST
21.5.4F Integration / Verification / Legacy Retirement     NOT STARTED
```

Required order:

```text
4A -> 4B -> 4C -> 4D -> 4E -> 4F
```

---

## 4. Accepted locale/indexing model

```text
English/default -> unprefixed
Persian         -> /fa
```

Only authoritative localized content may be indexable.

Each authoritative localization is self-canonical.

When both localizations exist:

```text
reciprocal hreflang
authoritative x-default -> English/default
```

No cookie-dependent canonical language and no fake fallback localization.

Application/private `/fa` routes may exist but remain non-acquisition surfaces.

---

## 5. Accepted 4A — shared SEO/routing platform

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
```

Accepted behavior includes:

```text
shared usePublicSeo
reactive SSR metadata
absolute canonical URLs
OG/Twitter policy
EN/FA canonical + hreflang + x-default
structured-data injection from authoritative callers only
staging noindex precedence
locale-aware html lang/dir
real public 404/redirect semantics
shared public route helpers
application X-Robots-Tag policy
strict locale route audit
legacy static-generation compatibility isolation
```

---

## 6. Accepted 4B — Public Prompt

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

Canonical public routes:

```text
/prompt/:id
/fa/prompt/:id
```

Dedicated sanitized API:

```text
GET /api/public/prompts/:id
```

Protected product detail remains:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
GET /api/archive/:id
```

Public query never selects protected Prompt bodies/variants.

Localized founder-authored description is shared by visible copy and SEO/CreativeWork projection.

---

## 7. Accepted 4C — Public Creator

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4C_8_AGGREGATE_STAGING_ACCEPTANCE.md
```

Creator lifecycle remains separate from user role.

Canonical public routes:

```text
/creator/:username
/fa/creator/:username
```

Public policy:

```text
accessible = active account + approved Creator + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
```

Publication count is never a Creator gate.

Public Creator projection excludes internal/private account/lifecycle/economy/storage data.

---

## 8. Accepted 4D — Sitemap / Robots / Discovery + AI Discovery

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_SITEMAP_ROBOTS_AI_DISCOVERY.md
docs/strategy/MILESTONE_21_5_PHASE4D_5_DISCOVERY_MIGRATION.md
docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md
```

Final architecture:

```text
GET /api/public/inventory
        |
        v
shared canonical public inventory
        +--> sitemap.xml
        +--> llms.txt
        +--> static compatibility

shared application SEO route policy
        +--> route policy
        +--> X-Robots-Tag
        +--> origin robots exclusions

native Discovery SSR
        +--> visible content
        +--> usePublicSeo
        +--> CollectionPage / ItemList JSON-LD
```

Final acceptance gates all passed:

```text
pnpm test:phase4d-final       PASS
pnpm smoke:phase4d-final      PASS
pnpm verify:phase4d-static    PASS
```

Static proof at acceptance time:

```text
220 sitemap URLs
220 llms URLs
identical sitemap/llms URL sets
331 prerendered routes
12 native EN/FA Discovery pages checked
```

Staging external proof preserved public/private authorization and global noindex.

`prompt-draft.ir` was not targeted.

---

## 9. 4E — Blog V1 target architecture

Public routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Minimum public Article behavior:

```text
stable article identity
stable canonical slug
SSR article HTML
localized title/description/body
canonical + EN/FA alternates
OG/Twitter metadata
published/updated dates
author attribution when authoritative
Article/BlogPosting structured data
shared sitemap inclusion
shared llms.txt inclusion where appropriate
article-view + meaningful product-action analytics
real 404/canonical behavior
```

### Editorial source of truth

Accepted model:

```text
Git repository          -> canonical editorial source
Docker/Nitro deployment -> normal runtime content source
Arvan Object Storage    -> media + mirror/emergency publication store
```

Repository-backed does not mean GitHub request-time access.

Normal serving path:

```text
repository article content
-> build/deploy
-> deployed Nuxt/Nitro content
-> request-time SSR
```

GitHub must never be queried per public Blog request.

### Article contract

4E must define one structured Article + Localization contract before building UI.

Conceptual shape:

```text
Article
  id
  slug
  status
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

Exact repository representation/frontmatter is chosen during 4E audit.

Metadata must not be hard-coded across Vue pages.

### Manage authoring

Target route:

```text
/manage/blog
```

Target UX:

```text
article list
new/edit article
metadata form
slug/status/publish dates
EN/FA editing
Markdown-producing editor
live preview
validation
image insertion/upload
save/export/publish workflow
```

Preferred editor candidate:

```text
md-editor-v3
```

The exact version/license/runtime integration is validated at implementation time.

### Media

Blog images must reuse the existing Arvan storage pipeline or a shared extraction of that pipeline.

Do not put base64 image payloads into Markdown.

Desired media metadata where practical:

```text
id
fullUrl
thumbnailUrl
width
height
alt
caption
```

### Emergency Arvan publication

Arvan may serve as a mirror/emergency content store while Git reconciliation is pending, but it must not become an uncontrolled equal source of truth.

Emergency state must be explicit with identity/version metadata such as:

```text
articleId
revision/contentHash
publishedAt
source=emergency
syncState=pending_git
```

---

## 10. Blog sitemap / AI-discovery integration rule

Blog is added to the public inventory only after 4E defines authoritative publication/localization semantics.

Required direction:

```text
published Article contract
        |
        v
shared public inventory inputs
        +--> /blog + localized blog index
        +--> /blog/:slug only for authoritative published locales
        +--> sitemap.xml
        +--> llms.txt
```

Forbidden:

```text
separate Blog-only sitemap rules
separate Blog-only indexability heuristics
draft/unpublished article URLs in sitemap/llms
fake localized Blog URLs
```

---

## 11. 4E audit-first questions

Before implementation, inspect and decide:

```text
1. exact repository article directory/file/frontmatter shape
2. server-safe Markdown parsing/rendering/sanitization strategy
3. exact draft/published/localized eligibility rules
4. slug validation + canonical redirect behavior
5. author representation: site/editorial author vs approved Creator attribution
6. public Blog index sorting/pagination/category/tag policy for V1
7. manage/blog permission model and backend write/export boundary
8. reuse/extraction of existing Arvan SigV4 media upload pipeline
9. md-editor-v3 current version/license/SSR constraints
10. safe image insertion contract
11. Git write/publish mechanism from Manage without request-time GitHub dependency
12. emergency Arvan mirror/publication reconciliation model
13. Blog analytics events and CTA semantics
14. static-generate compatibility and shared public inventory integration
15. narrow verification slices before final 4E acceptance
```

---

## 12. Hard rules inherited forward

```text
DO NOT weaken authorization for Blog/SEO.
DO NOT expose protected Prompt data through Blog integrations.
DO NOT expose private Draft/account/Creator data.
DO NOT use cookie-dependent canonical language.
DO NOT create fake localized Blog pages.
DO NOT query GitHub per public Blog request.
DO NOT create Git and Arvan as uncontrolled equal content sources.
DO NOT embed base64 images in Markdown.
DO NOT add draft/unpublished Blog URLs to sitemap/llms.
DO NOT create a second public-indexability system.
DO NOT touch prompt-draft.ir before explicit rollout.
```

---

## 13. Current next action

Phase 4D is closed and accepted.

Proceed audit-first to:

```text
21.5.4E — Blog V1
```

Create/maintain a dedicated 4E source-of-truth before implementation and use the smallest verification scope defined by `DEVELOPMENT_WORKFLOW.md`.
