# Milestone 21.5 — Phase 4E Blog V1

Status: **IN PROGRESS / 4E.1 + 4E.2 + 4E.3 ACCEPTED / 4E.4 VERIFICATION / 4E.5 MEDIA IMPLEMENTED + VERIFICATION PENDING**

Date: 2026-09-10

Branch:

```text
feature/growth-foundation
```

Parent:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Operational workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

UI workflow:

```text
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
```

Accepted dependency:

```text
21.5.4D Sitemap / Robots / Discovery + AI Discovery
DONE / ACCEPTED 2026-09-09
```

## Objective

4E adds a repository-backed bilingual Blog acquisition + editorial system without creating a second SEO, indexability, authorization, localization or content-source architecture.

Public routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Management route:

```text
/manage/blog
/fa/manage/blog
```

Blog remains:

```text
SSR-first
Git repository backed
EN/FA authoritative-localization aware
safe Markdown
SEO/structured-data complete
shared sitemap/llms integrated
permissioned for management
Arvan-media compatible
Docker/Nitro + pnpm generate compatible
```

## Locked inherited rules

```text
EN/default -> unprefixed
FA         -> /fa
self canonical per authoritative locale
no fake localized Article fallback
NUXT_PUBLIC_NOINDEX=true always wins on staging
no protected/private data exposure
no request-time GitHub reads
prompt-draft.ir untouched before explicit rollout
```

Canonical editorial source:

```text
Git repository
```

Normal serving:

```text
content/blog in Git
-> Nuxt/Nitro build
-> bundled .output/server assets
-> request-time SSR
```

Arvan Object Storage remains Blog media + explicit mirror/emergency infrastructure, never an uncontrolled equal editorial source.

---

## 4E.1 — ACCEPTED

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_1_ARTICLE_CONTRACT.md
```

Canonical package:

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

`availableLocales` is derived. V1 author is explicit editorial/site identity only. Shared safe Markdown escapes raw HTML and rejects unsafe active URL schemes.

Evidence:

```text
pnpm test:blog-contract -> 18/18 PASS
pnpm frontend -> PASS
founder -> تایید
```

---

## 4E.2 — ACCEPTED

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_2_PUBLIC_BLOG.md
```

Public Nitro projection:

```text
GET /api/public/blog?locale=en|fa
GET /api/public/blog/:slug?locale=en|fa
```

Accepted public behavior:

```text
SSR EN/FA Blog index
published locale-eligible Article detail
real 404
canonical slug semantics
safe Markdown
CollectionPage + ItemList JSON-LD
BlogPosting JSON-LD
OG/Twitter article metadata
Article.availableLocales-driven hreflang
staging noindex preserved
```

No fake Article fixture exists.

Evidence:

```text
pnpm test:blog-public -> 26/26 PASS
pnpm frontend -> PASS
pnpm smoke:blog-public -> PASS
founder -> تایید
```

---

## 4E.3 — ACCEPTED

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_3_BLOG_INVENTORY.md
```

Accepted shared architecture:

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
backend /api/public/inventory -> Prompt/Creator
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
= historical pre-Blog 220 + /blog + /fa/blog
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

---

## 4E.4 — VERIFICATION IN PROGRESS

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_4_BLOG_MANAGEMENT.md
```

Status:

```text
IMPLEMENTED / FOUNDER VERIFICATION IN PROGRESS / NOT ACCEPTED
```

Authorization:

```text
blog.manage
user        -> no
admin       -> yes
super_admin -> wildcard
```

`blog.manage` is mirrored in backend + frontend permission catalogs and registered as its own `/manage` section.

Nitro management reads:

```text
GET /api/manage/blog
GET /api/manage/blog/:id
```

Each request revalidates the bearer token through backend `/api/auth/me` and requires `blog.manage` or wildcard.

Authoring workspace now follows the project UI system and contains:

```text
repository Article list
new/edit state
system-owned Article id and timestamps
editable slug/status
no manual Editorial Identity fields
managed Hero media selection
EN/FA title + description + localized Hero alt + Markdown body
locale Complete/Incomplete/Public state near locale tabs
global Link modal
managed Gallery image insertion
live preview through renderPublicBlogMarkdown
canonical validation through validateBlogArticlePackage
```

Editor dependency decision:

```text
no additional editor dependency
Prompt Draft el-* primitives remain authoritative
accepted safe renderer remains the single preview/public renderer
```

Canonical write boundary remains:

```text
4E.4 = read + author + validate
4E.5 = managed media + Git save/publish + reconciliation
```

No temporary container filesystem/database/editor state is allowed to become canonical.

Founder verification already proved:

```text
blog.manage focused suite reached 43/43 PASS before latest media finalization
backend build previously PASS
frontend Docker/Nitro build previously PASS
unauthenticated /api/manage/blog -> 401
functional Gallery browse/upload/select smoke -> good
Link modal -> good
```

Latest media/UI refinements require the combined focused rerun below before acceptance.

---

## 4E.5 — CURRENT / MEDIA LANE IMPLEMENTED

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_5_BLOG_MEDIA_PUBLISH.md
```

Status:

```text
MEDIA LANE IMPLEMENTED / FOUNDER VERIFICATION PENDING
GIT PUBLICATION LANE NOT STARTED
4E.5 OVERALL NOT ACCEPTED
```

Implemented media direction:

```text
existing archiveStorage SigV4 authority reused
Blog namespace confined to blog/
ListObjectsV2 folder browsing
managed full WebP + thumbnail WebP + JSON manifest
required persisted default alt for new uploads
legacy no-alt manifests remain readable
admin audit trail
reusable MediaGallery modal
Hero selection
Markdown image insertion with selected-image preview + editable default alt
```

Finalized Gallery/UI contract includes:

```text
current-folder divider
no redundant Folders label
folder navigation with project el-button semantics
Images section start-aligned
second click deselects selected image
file selection stages preview + required alt before upload
editor/preview top-aligned
Markdown preview image max 400px on each axis
Repository Metadata start-aligned
```

Still pending in 4E.5:

```text
canonical Git repository write adapter
Save draft action
Publish transition
optimistic conflict/version handling
repository reconciliation
optional explicit emergency Arvan publication metadata
```

No base64 payloads are allowed in canonical Markdown.

---

## 4E.6 — NOT STARTED

Target:

```text
accepted 4A–4D regressions
4E contract/public/inventory/manage/media tests
EN/FA Blog SSR
first real published Article positive detail
404/canonical/localization
Markdown safety
structured data
sitemap/llms exact parity
Manage authorization
Git publication proof
static generation
external staging noindex
prompt-draft.ir untouched
```

---

## Hard rules

```text
DO NOT weaken authorization.
DO NOT expose protected Prompt/private Draft/private account data.
DO NOT query GitHub per public Blog request.
DO NOT make Git + Arvan uncontrolled equal content sources.
DO NOT put base64 image payloads in Markdown.
DO NOT make editor-specific document state canonical.
DO NOT create fake localized Blog routes.
DO NOT expose draft/unpublished Article URLs in sitemap/llms.
DO NOT recreate Blog indexability policy outside the Article contract.
DO NOT let Blog SEO override staging NUXT_PUBLIC_NOINDEX=true.
DO NOT add canonical write semantics before the Git publication adapter.
DO NOT touch prompt-draft.ir before explicit rollout.
```

## Current next action

```text
Verify the finalized 4E.4 + 4E.5 media lane:
pnpm test:blog-manage
-> pnpm test:blog-media
-> pnpm api
-> pnpm frontend
-> founder Gallery/Markdown/Light+Dark UI smoke
```

Do not accept 4E.4 or 4E.5 until focused/runtime verification and explicit founder acceptance are complete.
