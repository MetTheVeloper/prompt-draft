# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-09

Branch:

```text
feature/growth-foundation
```

## Current state

```text
Milestones 1–20                               -> inherited COMPLETE baseline
Milestone 21 Growth Foundation               -> DONE / USER ACCEPTED

Milestone 21.5 Rendering & Organic Acquisition -> IN PROGRESS
21.5.1 Hybrid / SSR Architecture               -> DONE / ACCEPTED
21.5.2 Docker Production Runtime               -> DONE / ACCEPTED
21.5.3 Cloudflare Production Path              -> DONE / ACCEPTED
21.5.4 SEO/Public Content Architecture         -> IN PROGRESS
  4A SEO Contracts & Route Semantics           -> DONE / ACCEPTED
  4B Public Prompt Architecture                -> DONE / ACCEPTED
  4C Public Creator + Indexability             -> DONE / ACCEPTED
  4D Sitemap / Robots / Discovery / llms       -> DONE / ACCEPTED 2026-09-09
  4E Blog V1                                   -> IN PROGRESS / 4E.1 ACCEPTED / 4E.2 VERIFICATION
  4F Integration / Legacy Retirement           -> NOT STARTED
21.5.5 Organic Acquisition Launch              -> NOT STARTED
```

## Mandatory sources

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
docs/strategy/MILESTONE_21_5_PHASE4E_BLOG_V1.md
docs/strategy/MILESTONE_21_5_PHASE4E_1_ARTICLE_CONTRACT.md
docs/strategy/MILESTONE_21_5_PHASE4E_2_PUBLIC_BLOG.md
```

## Verification workflow

Time-first rule remains mandatory:

```text
inspect changed services
-> focused tests
-> no rebuild if possible
-> frontend-only: pnpm frontend
-> backend-only: pnpm api
-> full stack only when genuinely required
```

Do not tell founder to rebuild unrelated services.

## Accepted runtime/staging baseline

```text
Nuxt SSR by default for acquisition surfaces
explicit client-only application route policy
Nuxt/Nitro node-server Docker runtime
independent backend API retained
server-internal API origin separated from browser API origin
Cloudflare staging: grassic.ir + api.grassic.ir
NUXT_PUBLIC_NOINDEX=true on staging
prompt-draft.ir remains untouched
```

## Accepted locale/indexing contract

```text
EN/default -> unprefixed
FA         -> /fa
self canonical per authoritative locale
reciprocal hreflang only for authoritative locales
x-default -> EN/default when EN exists
no fake localized fallback pages
staging global noindex always wins
```

## Accepted public/protected boundaries

Public Prompt:

```text
/prompt/:id
/fa/prompt/:id
GET /api/public/prompts/:id
```

Protected Prompt detail remains:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
GET /api/archive/:id
```

Public Creator:

```text
/creator/:username
/fa/creator/:username
GET /api/public/creators/:username
```

Creator policy:

```text
accessible = active account + approved Creator + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
```

Public surfaces never expose protected Prompt bodies/variants, private Drafts, email, internal UUID/source ids, balance, permissions, sessions, storage/provider/admin data.

## Accepted Phase 4D

Final evidence:

```text
pnpm test:phase4d-final    PASS
pnpm smoke:phase4d-final   PASS
pnpm verify:phase4d-static PASS
```

Accepted shared architecture:

```text
one public inventory
-> sitemap.xml
-> llms.txt
-> static compatibility

one application SEO route policy
-> client-only rules
-> X-Robots-Tag
-> robots exclusions

native Discovery SSR
-> visible content
-> native SEO/structured data
```

Static acceptance snapshot:

```text
220 sitemap URLs
220 llms URLs
identical URL sets
331 prerendered routes
12 EN/FA Discovery pages checked
```

## Phase 4E Blog V1

Canonical source:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_BLOG_V1.md
```

Editorial architecture:

```text
Git repository          -> canonical editorial source
Nuxt/Nitro deployed app -> normal public runtime source
Arvan Object Storage    -> Blog media + explicit mirror/emergency role
```

Never query GitHub per public Blog request.

### 4E.1 — ACCEPTED

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_1_ARTICLE_CONTRACT.md
```

Final state:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

Repository package:

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

Article public locale eligibility:

```text
status=published
+ localized title
+ localized description
+ matching non-empty Markdown body
```

`availableLocales` is derived only.

V1 author is explicit editorial/site identity, not private user identity.

Shared safe Markdown renderer escapes raw HTML and rejects unsafe active URL schemes.

Runtime content path:

```text
content/blog
-> Nitro serverAssets baseName=blog
-> useStorage('assets:blog')
-> shared/blog-article.ts validation
```

Founder evidence:

```text
pnpm test:blog-contract -> 18/18 PASS
pnpm frontend -> PASS through Nitro + Docker container start
founder -> تایید
```

### 4E.2 — CURRENT

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_2_PUBLIC_BLOG.md
```

Status:

```text
IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
```

Implemented routes:

```text
/blog
/fa/blog
/blog/:slug
/fa/blog/:slug
```

Implemented frontend Nitro public projection:

```text
GET /api/public/blog?locale=en|fa
GET /api/public/blog/:slug?locale=en|fa
```

Public DTOs are locale-specific and publication-policy-driven.

Index:

```text
SSR localized content
locale-safe primary navigation link
empty-state safe before first article
CollectionPage + ItemList JSON-LD
EN/FA canonical alternates
```

Detail:

```text
published + authoritative target locale only
real 404
canonical slug path
301 noncanonical variant only after canonical Article exists
safe Markdown HTML
article OG/Twitter
BlogPosting JSON-LD
published/modified metadata
Article.availableLocales drives hreflang
```

No fake published article was inserted for testing.

Current verification sequence:

```powershell
pnpm test:blog-public
pnpm frontend
pnpm smoke:blog-public
```

No `pnpm api` or `pnpm stack` required for 4E.2.

## Remaining Blog slices

```text
4E.3 Shared sitemap/llms/static Blog inventory
4E.4 blog.manage + /manage/blog authoring UI
4E.5 Blog media + repository publish/emergency adapter
4E.6 aggregate regression + external staging + static acceptance
```

## Blog management direction

Target:

```text
/manage/blog
explicit blog.manage permission
article list/new/edit
EN/FA Markdown workflow
live preview
validation
image insertion
save/publish/export
```

Do not reuse unrelated Archive/System permissions.

Preferred editor candidate remains `md-editor-v3`, subject to project integration verification.

## Blog media direction

Reuse/extract the existing Arvan/AWS-SigV4 storage primitives rather than coupling Blog to Archive item APIs.

Markdown stores stable public media URLs/references only; never base64 payloads.

Candidate namespace:

```text
blog/<articleId>/<mediaId>/...
```

Operational note:

```text
unexpected SigV4 403 across Arvan surfaces
-> verify host/system clock first
```

## Hard rules

```text
DO NOT weaken authorization for SEO/Blog.
DO NOT make protected Archive detail public.
DO NOT expose protected Prompt bodies/variants.
DO NOT expose private Draft/account/Creator data.
DO NOT query GitHub per public Blog request.
DO NOT make Git + Arvan uncontrolled equal content sources.
DO NOT embed base64 images in Markdown.
DO NOT make editor-specific document state canonical.
DO NOT create fake localized Blog routes.
DO NOT put draft/unpublished Blog URLs into sitemap/llms.
DO NOT recreate Blog indexability policy outside Article contract.
DO NOT let Blog SEO override staging noindex.
DO NOT touch prompt-draft.ir before explicit rollout.
DO NOT default to full-stack rebuilds when a narrower gate is sufficient.
```

## Resume instruction

```text
1. read STATUS.md
2. read DEVELOPMENT_WORKFLOW.md
3. read MILESTONE_21_5_PHASE4E_BLOG_V1.md
4. read MILESTONE_21_5_PHASE4E_1_ARTICLE_CONTRACT.md
5. read MILESTONE_21_5_PHASE4E_2_PUBLIC_BLOG.md
6. inspect latest feature/growth-foundation HEAD
7. confirm 4E.1 is DONE / ACCEPTED
8. current task is 4E.2 founder verification
9. run pnpm test:blog-public -> pnpm frontend -> pnpm smoke:blog-public
10. do not rebuild backend/full stack for 4E.2
11. keep grassic.ir staging/noindex and prompt-draft.ir untouched
12. after explicit 4E.2 acceptance proceed to 4E.3
```
