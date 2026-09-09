# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-10

Branch:

```text
feature/growth-foundation
```

## Current state

```text
Milestones 1–20                                  -> inherited COMPLETE baseline
Milestone 21 Growth Foundation                  -> DONE / USER ACCEPTED

Milestone 21.5 Rendering & Organic Acquisition  -> IN PROGRESS
21.5.1 Hybrid / SSR Architecture                -> DONE / ACCEPTED
21.5.2 Docker Production Runtime                -> DONE / ACCEPTED
21.5.3 Cloudflare Production Path               -> DONE / ACCEPTED
21.5.4 SEO/Public Content Architecture          -> IN PROGRESS
  4A SEO Contracts & Route Semantics            -> DONE / ACCEPTED
  4B Public Prompt Architecture                 -> DONE / ACCEPTED
  4C Public Creator + Indexability              -> DONE / ACCEPTED
  4D Sitemap / Robots / Discovery / llms        -> DONE / ACCEPTED 2026-09-09
  4E Blog V1                                    -> IN PROGRESS / 4E.1-4E.3 ACCEPTED / 4E.4 VERIFICATION
  4F Integration / Legacy Retirement            -> NOT STARTED
21.5.5 Organic Acquisition Launch               -> NOT STARTED
```

## Mandatory sources

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
docs/strategy/MILESTONE_21_5_PHASE4E_BLOG_V1.md
docs/strategy/MILESTONE_21_5_PHASE4E_1_ARTICLE_CONTRACT.md
docs/strategy/MILESTONE_21_5_PHASE4E_2_PUBLIC_BLOG.md
docs/strategy/MILESTONE_21_5_PHASE4E_3_BLOG_INVENTORY.md
docs/strategy/MILESTONE_21_5_PHASE4E_4_BLOG_MANAGEMENT.md
```

## Verification workflow

```text
inspect changed services
-> focused tests
-> smallest required service rebuild(s)
-> founder-local/runtime verification
-> explicit founder acceptance
```

Time-first service rule:

```text
frontend only -> pnpm frontend
backend only  -> pnpm api
both changed  -> pnpm api + pnpm frontend
pnpm stack only when genuinely required
```

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

```text
pnpm test:phase4d-final    PASS
pnpm smoke:phase4d-final   PASS
pnpm verify:phase4d-static PASS
```

Historical pre-Blog static snapshot:

```text
220 sitemap URLs
220 llms URLs
331 prerendered routes
12 EN/FA Discovery pages checked
```

That 220 count is historical evidence, not a permanent constant.

---

# Phase 4E Blog V1

Editorial architecture:

```text
Git repository          -> canonical editorial source
Nuxt/Nitro deployed app -> normal runtime source
Arvan Object Storage    -> Blog media + explicit mirror/emergency role
```

Never query GitHub per public Blog request.

## 4E.1 — ACCEPTED

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

Public locale eligibility:

```text
status=published
+ localized title
+ localized description
+ matching non-empty Markdown body
```

`availableLocales` is derived. V1 author is explicit editorial/site identity. Shared safe Markdown escapes raw HTML and rejects unsafe active URL schemes.

Evidence:

```text
pnpm test:blog-contract -> 18/18 PASS
pnpm frontend -> PASS
founder -> تایید
```

## 4E.2 — ACCEPTED

Public routes:

```text
/blog
/fa/blog
/blog/:slug
/fa/blog/:slug
```

Frontend Nitro projection:

```text
GET /api/public/blog?locale=en|fa
GET /api/public/blog/:slug?locale=en|fa
```

Accepted:

```text
SSR Blog index/detail
real 404 + canonical slug semantics
safe Markdown HTML
CollectionPage / ItemList
BlogPosting JSON-LD
OG/Twitter article metadata
authoritative Article.availableLocales hreflang
staging noindex preserved
```

Evidence:

```text
pnpm test:blog-public -> 26/26 PASS
pnpm frontend -> PASS
pnpm smoke:blog-public -> PASS
founder -> تایید
```

Positive runtime detail remains naturally deferred until the first real published Article exists.

## 4E.3 — ACCEPTED

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_3_BLOG_INVENTORY.md
```

Accepted shared direction:

```text
Article.availableLocales
-> minimal Blog public inventory
-> shared buildPublicUrlInventory
-> sitemap.xml
-> llms.txt
-> legacy static generation
```

Runtime sources:

```text
backend /api/public/inventory -> Prompt + Creator
Nitro assets:blog            -> Blog
```

Static sources:

```text
backend public inventory
+ content/blog filesystem validator
```

Accepted zero-Article snapshot:

```text
222 canonical URLs
= historical 220 + /blog + /fa/blog
```

Evidence:

```text
pnpm test:blog-inventory -> 19/19 PASS
pnpm frontend -> PASS
pnpm verify:blog-inventory-static -> PASS
expected canonical URL count -> 222
published Blog Article inventory -> 0
founder -> تایید
```

## 4E.4 — CURRENT

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_4_BLOG_MANAGEMENT.md
```

Status:

```text
IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
```

New permission:

```text
blog.manage
```

Role grant:

```text
user        -> no
admin       -> yes
super_admin -> wildcard
```

Manage routes:

```text
/manage/blog
/fa/manage/blog
```

Nitro management repository reads:

```text
GET /api/manage/blog
GET /api/manage/blog/:id
```

Every management API request revalidates the bearer token against backend `/api/auth/me` and requires `blog.manage` or `*`.

Authoring workspace:

```text
repository list
new/edit state
Article id + slug + status + timestamps
editorial author
hero metadata
EN/FA metadata
EN/FA Markdown
live preview through public safe renderer
canonical 4E.1 package validation
```

4E.4 deliberately has no canonical write endpoint. Git save/publish and Blog media belong to 4E.5; container/editor state must never become a temporary canonical source.

Focused verification:

```powershell
pnpm test:blog-manage
pnpm api
pnpm frontend
```

Then founder UI smoke:

```text
admin sees Blog Manage section
/manage/blog and /fa/manage/blog load
new Article editor opens
EN/FA tabs + preview work
invalid package shows exact validator issues
complete draft validates
no save/publish canonical action exists yet
unauthorized direct API access remains 401/403
```

## Remaining Blog slices

```text
4E.5 Blog media + repository Git publish/reconciliation adapter
4E.6 aggregate regression + external staging + static acceptance
```

## Hard rules

```text
DO NOT weaken authorization for SEO/Blog.
DO NOT make protected Archive detail public.
DO NOT expose protected Prompt/private Draft/private account data.
DO NOT query GitHub per public Blog request.
DO NOT make Git + Arvan uncontrolled equal content sources.
DO NOT embed base64 images in Markdown.
DO NOT make editor-specific document state canonical.
DO NOT create fake localized Blog routes.
DO NOT put draft/unpublished Blog URLs into sitemap/llms.
DO NOT recreate Blog indexability policy outside Article contract.
DO NOT let Blog SEO override staging noindex.
DO NOT touch prompt-draft.ir before explicit rollout.
```

## Resume instruction

```text
1. read STATUS.md
2. read DEVELOPMENT_WORKFLOW.md
3. read MILESTONE_21_5_PHASE4E_BLOG_V1.md
4. read 4E.1 through 4E.4 dedicated records
5. inspect latest feature/growth-foundation HEAD
6. confirm 4E.1, 4E.2, 4E.3 are DONE / ACCEPTED
7. current task is 4E.4 founder verification
8. run pnpm test:blog-manage -> pnpm api -> pnpm frontend
9. perform Blog Manage UI smoke
10. keep grassic.ir staging/noindex and prompt-draft.ir untouched
11. after explicit 4E.4 acceptance proceed to 4E.5
```
