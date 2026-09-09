# Milestone 21.5 — Phase 4E Blog V1

Status: **IN PROGRESS / 4E.1 + 4E.2 + 4E.3 ACCEPTED / 4E.4 IMPLEMENTED + VERIFICATION PENDING**

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

## 4E.4 — CURRENT

Record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_4_BLOG_MANAGEMENT.md
```

Status:

```text
IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
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

Authoring workspace:

```text
repository Article list
new/edit state
stable Article id
slug/status/timestamps
editorial author metadata
hero metadata
EN/FA title + description + alt + Markdown body
small Markdown toolbar
live preview through renderPublicBlogMarkdown
canonical validation through validateBlogArticlePackage
```

Editor dependency decision:

```text
md-editor-v3 re-audited
no dependency added in 4E.4
accepted safe renderer remains the single preview/public renderer
```

Canonical write boundary:

```text
4E.4 = read + author + validate
4E.5 = Git save/publish + media + reconciliation
```

No temporary container filesystem/database/editor state is allowed to become canonical.

Verification:

```powershell
pnpm test:blog-manage
pnpm api
pnpm frontend
```

Then founder UI smoke for EN/FA Manage Blog and unauthorized endpoint behavior.

---

## Remaining slices

```text
4E.5 Blog Media + Repository Git Publish / Emergency Adapter
4E.6 Aggregate Regression + External Staging + Static Acceptance
```

### 4E.5 target

```text
Blog-specific media upload
shared/extracted Arvan SigV4 primitives
stable media URLs in Markdown
Git repository publication adapter
save/publish flow from /manage/blog
explicit conflict/reconciliation behavior
optional emergency Arvan publication only with pending_git reconciliation
```

No base64 payloads in canonical Markdown.

### 4E.6 target

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
Verify 4E.4:
pnpm test:blog-manage
-> pnpm api
-> pnpm frontend
-> founder EN/FA Blog Manage UI smoke
```

After explicit 4E.4 acceptance proceed to 4E.5.
