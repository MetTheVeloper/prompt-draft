# Milestone 21.5 — Phase 4E Blog V1

Status: **IN PROGRESS / 4E.1 + 4E.2 ACCEPTED / 4E.3 IMPLEMENTED + VERIFICATION PENDING**

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
DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED 2026-09-09
```

## Objective

4E adds a repository-backed bilingual Blog acquisition system without creating a second SEO/indexability/content-source architecture.

Public routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Blog remains:

```text
SSR-first
Git repository backed
EN/FA authoritative-localization aware
safe Markdown
SEO/structured-data complete
shared sitemap/llms integrated
manageable through /manage/blog
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

Git remains the canonical editorial source.

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

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_1_ARTICLE_CONTRACT.md
```

Final state:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

Canonical repository package:

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

`availableLocales` is derived, never stored.

V1 author is explicit editorial/site identity only.

Markdown uses the shared safe public renderer; raw HTML is escaped and unsafe active URL schemes are rejected.

Runtime repository path:

```text
Nitro serverAssets baseName=blog
-> useStorage('assets:blog')
-> shared/blog-article.ts validation
```

Static/build adapter:

```text
scripts/blog-repository.ts
```

Founder evidence:

```text
pnpm test:blog-contract -> 18/18 PASS
pnpm frontend -> Nuxt client/server/Nitro/Docker PASS
founder -> تایید
```

---

## 4E.2 — ACCEPTED

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_2_PUBLIC_BLOG.md
```

Final state:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-10
```

Public Nitro projection:

```text
GET /api/public/blog?locale=en|fa
GET /api/public/blog/:slug?locale=en|fa
```

Public pages:

```text
/blog
/fa/blog
/blog/:slug
/fa/blog/:slug
```

Index:

```text
SSR localized Blog shell
published locale-eligible Article list
publishedAt-desc ordering
localized empty state
canonical Article links
CollectionPage + ItemList JSON-LD
EN/FA canonical alternates
```

Detail:

```text
published + target locale authoritative only
real 404 otherwise
canonical slug normalization
301 only after canonical Article existence is proven
safe Markdown HTML
self canonical
Article.availableLocales-driven hreflang
OG/Twitter article metadata
BlogPosting JSON-LD
article published/modified metadata
```

V1 editorial authors are represented as `Organization` in structured data.

No fake public Article fixture was added.

Founder evidence:

```text
pnpm test:blog-public -> 26/26 PASS
pnpm frontend -> PASS through Nitro + Docker container start
pnpm smoke:blog-public -> PASS
EN/FA Blog API -> 200
EN/FA Blog index -> 200
staging-config X-Robots-Tag -> noindex, nofollow, noarchive
EN/FA nonexistent Article -> 404
positive runtime Article -> intentionally skipped until first real published Article
founder -> تایید
```

---

## 4E.3 — CURRENT

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_3_BLOG_INVENTORY.md
```

Status:

```text
IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
```

Architecture:

```text
validated Blog repository
-> Article.availableLocales
-> shared/blog-public-inventory.ts
-> buildPublicUrlInventory
   + backend Prompt/Creator inventory
   + Core/Discovery routes
-> sitemap.xml
-> llms.txt
-> static generation
```

Blog index becomes a first-class shared inventory resource:

```text
/blog
/fa/blog
```

Each Article adds only its authoritative locale URLs.

With the same accepted 4D Prompt/Creator snapshot and zero published Blog Articles, the historical 220-URL inventory becomes 222 because the two Blog index URLs are now intentionally public.

Runtime sitemap/llms sources:

```text
backend /api/public/inventory -> Prompt/Creator
Nitro assets:blog            -> Blog
```

They merge into one `buildPublicUrlInventory` call.

Staging noindex still returns an empty inventory before either source is loaded.

Static generator sources:

```text
backend public inventory
+ readBlogRepositoryDirectory()
+ projectBlogPublicInventory()
```

Legacy static prerender roots now include:

```text
/blog
/fa/blog
```

Article pages are discovered from real locale-authoritative links rendered by those indexes; no second config-time Article slug policy exists.

Focused gates:

```powershell
pnpm test:blog-inventory
pnpm frontend
pnpm verify:blog-inventory-static
```

No `pnpm api` or `pnpm stack` is required for 4E.3.

---

## Remaining slices

```text
4E.4 Manage Blog Permission + Authoring UI
4E.5 Blog Media + Repository Publish / Emergency Adapter
4E.6 Aggregate Regression + External Staging + Static Acceptance
```

### 4E.4 target

```text
explicit blog.manage permission
/manage/blog
Article list/new/edit
EN/FA Markdown workflow
live preview
validation
md-editor-v3 integration if project verification remains positive
```

Do not reuse unrelated Archive/System permissions.

### 4E.5 target

```text
Blog-specific media upload
shared/extracted Arvan SigV4 primitives
stable media URLs in Markdown
repository publication adapter
optional emergency Arvan publication with explicit pending_git reconciliation
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
DO NOT touch prompt-draft.ir before explicit rollout.
```

## Current next action

```text
Verify 4E.3:
pnpm test:blog-inventory
-> pnpm frontend
-> pnpm verify:blog-inventory-static
```

After founder acceptance proceed to 4E.4.
