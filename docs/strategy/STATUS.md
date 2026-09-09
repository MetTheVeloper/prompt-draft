# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-09

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
Milestone 21 Growth Foundation  -> DONE / LOCALLY VERIFIED / USER ACCEPTED

Milestone 21.5 Rendering & Organic Acquisition -> IN PROGRESS
Phase 21.5.1 Hybrid / SSR Architecture          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
Phase 21.5.2 Docker Production Runtime          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
Phase 21.5.3 Cloudflare Production Path         -> DONE / FOUNDER-PRODUCTION-LIKE VERIFIED / ACCEPTED
Phase 21.5.4 SEO/Public Content Architecture    -> IN PROGRESS / 4A + 4B + 4C + 4D ACCEPTED / 4E BLOG V1 NEXT
Phase 21.5.5 Organic Acquisition Launch         -> NOT STARTED

Phase 2 Domain Expansion                        -> NEXT STRATEGIC PHASE AFTER 21.5
First domain                                    -> Content Creation
Founder Domain Expansion research               -> MAY RUN IN PARALLEL WITH 21.5
```

---

## Canonical sources

Milestone:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

Mandatory operational workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

Current Phase 4 parent:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Accepted Phase records:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4C_8_AGGREGATE_STAGING_ACCEPTANCE.md
docs/strategy/MILESTONE_21_5_PHASE4D_SITEMAP_ROBOTS_AI_DISCOVERY.md
docs/strategy/MILESTONE_21_5_PHASE4D_5_DISCOVERY_MIGRATION.md
docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md
```

Rendering ADR:

```text
docs/strategy/ADR_002_HYBRID_RENDERING_STRATEGY.md
```

---

## Milestone 21.5 execution order

```text
Phase 1 — Hybrid / SSR Architecture                  DONE / ACCEPTED
Phase 2 — Docker Production Runtime                  DONE / ACCEPTED
Phase 3 — Cloudflare Production Path                 DONE / ACCEPTED
Phase 4 — SEO Platform & Public Content Architecture IN PROGRESS / 4E NEXT
Phase 5 — Organic Acquisition Launch & Measurement   NOT STARTED
```

Phase 4 slices:

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

## Accepted runtime/rendering baseline

```text
ssr: true
Nuxt/Nitro production runtime
hybrid route policy
server-only internal API origin
browser-visible public API origin
Cloudflare staging path
NUXT_PUBLIC_NOINDEX staging protection
```

Staging topology:

```text
https://grassic.ir
  -> Cloudflare edge / tunnel
  -> frontend:3000

https://api.grassic.ir
  -> Cloudflare edge / tunnel
  -> api:4000
```

Stable production remains:

```text
prompt-draft.ir -> untouched until explicit rollout
```

---

## Accepted public locale/indexability direction

```text
English/default -> unprefixed
Persian         -> /fa
```

Rules:

```text
one URL deterministically renders one language
self-canonical per authoritative localization
reciprocal EN/FA hreflang when both authoritative
x-default -> English/default
no fake localized fallback pages
NUXT_PUBLIC_NOINDEX=true always overrides route-level index intent on staging
```

---

## Accepted Public Prompt boundary

Canonical acquisition routes:

```text
/prompt/:id
/fa/prompt/:id
```

Public API:

```text
GET /api/public/prompts/:id
```

Protected product detail:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
GET /api/archive/:id
```

Public Prompt projection never exposes protected Prompt body, variants, private Drafts, source ids, storage keys, economy/viewer/permission state.

The Public Prompt page may intentionally link users to the protected `/prompts?id=` route as its product CTA; that route is not a canonical acquisition URL.

---

## Accepted Public Creator boundary

Canonical routes:

```text
/creator/:username
/fa/creator/:username
```

Public API:

```text
GET /api/public/creators/:username
```

Policy:

```text
accessible = active account + approved Creator + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
```

Published Prompt count is never a Creator eligibility gate.

Public Creator projection excludes internal UUID, email, birthday, role/account state, Creator review metadata, XP/Goin, permissions/sessions, private Drafts, storage/provider/admin data.

---

## Accepted Phase 4D — final state

```text
4D.1 audit                                  DONE
4D.2 shared public inventory + sitemap      DONE / ACCEPTED
4D.3 robots + staging precedence            DONE / ACCEPTED
4D.4 llms.txt shared projection             DONE / ACCEPTED
4D.5 native Discovery SEO migration         DONE / ACCEPTED
4D.6 aggregate/staging/static verification  DONE / ACCEPTED
Phase 4D                                    DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED 2026-09-09
```

Final 4D architecture:

```text
GET /api/public/inventory
        |
        v
one shared canonical public inventory
        +--> sitemap.xml
        +--> llms.txt
        +--> static compatibility

shared SEO application route policy
        +--> route policy
        +--> X-Robots-Tag
        +--> origin robots exclusions

native Discovery SSR
        +--> visible content
        +--> usePublicSeo
        +--> CollectionPage / ItemList JSON-LD
```

Final verification evidence:

```text
pnpm test:phase4d-final      PASS
pnpm smoke:phase4d-final     PASS
pnpm verify:phase4d-static   PASS
```

Static acceptance snapshot:

```text
220 sitemap URLs
220 llms URLs
identical sitemap/llms URL sets
331 prerendered routes
12 EN/FA Discovery HTML pages checked
```

External staging smoke proved:

```text
public inventory privacy
protected /api/archive/:id still 401 anonymously
robots/sitemap/llms staging noindex precedence
EN/FA Prompt SSR
EN/FA Creator SSR
EN/FA Discovery SSR
canonical/hreflang/structured data
no private data leakage
prompt-draft.ir not targeted
```

Cloudflare Managed robots content is currently prepended at the edge. Its crawler-specific content signals are separate from Prompt Draft's origin robots/indexability source of truth.

---

## Current action — 21.5.4E Blog V1

Phase 4D is closed.

Current task:

```text
21.5.4E — Blog V1
```

Start audit-first before implementation.

Public route target:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Accepted editorial architecture:

```text
Git repository          -> canonical editorial source
Docker/Nitro deployment -> normal public runtime content source
Arvan Object Storage    -> Blog media + mirror/emergency publication store
```

Never query GitHub per public Blog request.

Target Article contract:

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

Minimum public Blog behavior:

```text
SSR article HTML
localized title/description/body
real canonical + EN/FA alternates
OG/Twitter metadata
Article/BlogPosting JSON-LD
published/updated dates
author attribution when authoritative
real 404/canonical behavior
shared sitemap inclusion
shared llms inclusion
article-view + meaningful CTA analytics
```

Manage target:

```text
/manage/blog
```

Expected management UX:

```text
article list
new/edit flow
metadata form
slug/status/publish dates
EN/FA content editor
Markdown toolbar
live preview
validation
image upload/insertion
save/export/publish workflow
```

Preferred editor candidate:

```text
md-editor-v3
```

As of the 4E planning audit on 2026-09-09, current npm latest is `6.5.6`, MIT licensed. Exact dependency pin and SSR/client integration must be verified before implementation.

Blog media must reuse or safely extract the existing Arvan SigV4 storage pipeline. Do not embed base64 images inside Markdown.

Emergency Arvan publication must remain an explicit temporary state, not a second uncontrolled source of truth.

---

## 4E audit-first checklist

Before code changes:

```text
1. inspect current repo for any existing Blog/content code — do not assume none
2. choose exact article directory/file/frontmatter contract
3. define publication + localization eligibility
4. define slug validation/canonical redirects/404s
5. choose Markdown parser/render/sanitization path safe for SSR
6. define Blog index sorting/pagination/tag/category scope for V1
7. define author model: editorial identity vs approved Creator reference
8. add explicit Blog manage permission rather than piggybacking unrelated admin permissions
9. inspect/extract existing Arvan storage upload code for Blog media reuse
10. validate md-editor-v3 integration and bundle/runtime impact
11. define Git-backed Manage save/publish workflow without request-time GitHub dependence
12. define emergency Arvan mirror/reconciliation metadata
13. integrate published Blog inventory into the accepted shared sitemap/llms pipeline
14. add analytics events for article view and meaningful product action
15. preserve pnpm generate + Docker/Nitro staging compatibility
16. build focused tests before broad rebuilds
```

---

## Existing management/permission observations relevant to 4E

Current `/manage` sections are driven by explicit permission mapping.

Existing permissions include:

```text
dashboard.view
system.metrics.view
users.view
users.manage
creators.manage
drafts.view_all
drafts.delete_any
system.settings.manage
collage.view
archive.view
archive.manage
```

There is not yet a Blog-specific permission in the current accepted authorization list.

4E should add an explicit permission such as a Blog/content management capability rather than reusing an unrelated Archive/System permission merely for convenience.

Current `/manage` sections do not yet include Blog.

---

## Existing Arvan/media observation relevant to 4E

The current Archive media path already provides reusable building blocks around:

```text
AWS-SigV4-compatible Arvan storage
stable public URL construction
PUT/DELETE object operations
public immutable cache headers
full + thumbnail WebP handling
validation and cleanup
```

The current Archive upload endpoint is Archive-specific and accepts base64 JSON payloads.

4E should reuse/extract the storage/signing primitives, but Blog Markdown itself must receive stable public URLs/references, not base64 payloads.

Operational diagnostic remains:

```text
unexpected SigV4 403 across multiple Arvan surfaces
-> verify host/system clock first
```

---

## Hard rules inherited forward

```text
DO NOT weaken authorization for SEO/Blog.
DO NOT make GET /api/archive/:id public.
DO NOT expose protected Prompt bodies/variants.
DO NOT expose private Drafts/account/Creator data.
DO NOT create fake localized Blog pages.
DO NOT query GitHub per public Blog request.
DO NOT create Git + Arvan as uncontrolled equal content sources.
DO NOT embed base64 image payloads in Markdown.
DO NOT put draft/unpublished Blog URLs into sitemap or llms.txt.
DO NOT create a second Blog indexability/sitemap policy.
DO NOT let Blog route SEO override staging NUXT_PUBLIC_NOINDEX=true.
DO NOT touch prompt-draft.ir before explicit rollout.
DO NOT default to full-stack rebuilds when narrower verification is sufficient.
```

---

## Resume instruction

When continuing in a new chat:

```text
1. read this STATUS.md
2. read docs/strategy/DEVELOPMENT_WORKFLOW.md and obey time-first/smallest-rebuild rules
3. read docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
4. confirm 4A, 4B, 4C and 4D are DONE / ACCEPTED
5. read docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md for the final accepted 4D baseline
6. inspect latest feature/growth-foundation HEAD before any Blog decision/write
7. continue 4E audit-first and create/use its dedicated source-of-truth
8. preserve accepted EN/FA canonical/noindex/public-private contracts
9. preserve Git as canonical Blog editorial source and no request-time GitHub reads
10. reuse/extract Arvan storage primitives for Blog media; no base64 Markdown
11. add explicit Blog management permission rather than unrelated permission reuse
12. add Blog to shared sitemap/llms inventory only after published Article/localization semantics are authoritative
13. keep grassic.ir/api.grassic.ir as staging; do not touch prompt-draft.ir
14. use the smallest focused verification gates before any rebuild
```
