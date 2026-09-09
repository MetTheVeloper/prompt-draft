# Milestone 21.5 — Phase 4E Blog V1

Status: **IN PROGRESS / 4E.1 ACCEPTED / 4E.2 IMPLEMENTED + VERIFICATION PENDING**

Date: 2026-09-09

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

4E adds a real repository-backed bilingual Blog acquisition system without creating a second SEO/indexability/content-source architecture.

Public routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Blog must remain:

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

Locale model:

```text
EN/default -> unprefixed
FA         -> /fa
```

Only authoritative localized Article content may create a public localized Article route. No fake fallback translation.

Staging:

```text
NUXT_PUBLIC_NOINDEX=true always wins
```

Security:

```text
no protected Prompt bodies/variants
no private Drafts/account/Creator data
no permissions/sessions/economy state
no storage secrets
no admin editorial state in public DTOs
```

GitHub is never queried per public Blog request.

## Editorial source architecture

Canonical source:

```text
Git repository
```

Normal serving:

```text
content/blog in Git
-> Nuxt/Nitro build
-> bundled .output/server content
-> request-time SSR
```

Arvan Object Storage:

```text
Blog media
mirror/emergency publication store if explicitly implemented
```

Arvan is not an equal uncontrolled second editorial source.

## 4E.1 — ACCEPTED

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_1_ARTICLE_CONTRACT.md
```

Status:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

Accepted repository package:

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

Accepted Article metadata:

```text
id
slug
status=draft|published
publishedAt
updatedAt
author
hero
localizations.en/fa.title+description
```

Public locale eligibility is derived from:

```text
status=published
+ localized title
+ localized description
+ matching non-empty Markdown body
```

`availableLocales` is never stored.

V1 author:

```text
explicit editorial/site identity only
kind=editorial
name
safe optional public URL
```

No private user/account identity is serialized.

Accepted Markdown:

```text
shared safe publicMarkdown renderer
Blog heading offset +1
raw HTML escaped
root-relative + HTTP(S) active URLs only
unsafe data/javascript/vbscript/file destinations rejected
no Markdown tables in V1 yet
```

Runtime content loader:

```text
Nitro serverAssets baseName=blog
useStorage('assets:blog')
shared/blog-article.ts validator
```

Static/build adapter:

```text
scripts/blog-repository.ts
```

Founder evidence:

```text
pnpm test:blog-contract -> 18/18 PASS
pnpm frontend -> Nuxt client/server/Nitro/Docker PASS
```

Founder explicit acceptance:

```text
تایید
```

## 4E.2 — CURRENT

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_2_PUBLIC_BLOG.md
```

Status:

```text
IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
```

Implemented public Nitro projection:

```text
GET /api/public/blog?locale=en|fa
GET /api/public/blog/:slug?locale=en|fa
```

These consume the 4E.1 publication/localization policy and expose only public Blog DTOs.

Implemented public pages:

```text
/blog
/fa/blog
/blog/:slug
/fa/blog/:slug
```

Index behavior:

```text
SSR localized Blog shell
published locale-eligible Article list
publishedAt-desc ordering
localized empty state
canonical localized links
CollectionPage + ItemList JSON-LD
EN/FA canonical alternates
```

Detail behavior:

```text
published + locale-authoritative only
real 404 otherwise
canonical slug normalization
301 only after canonical Article existence is proven
safe Markdown HTML
self canonical
Article-specific hreflang from availableLocales
OG/Twitter article metadata
BlogPosting JSON-LD
article:published_time
article:modified_time
```

V1 editorial authors are represented as `Organization` in JSON-LD rather than falsely claiming a Person identity.

Blog is now linked from primary locale-aware navigation.

No fake public article fixture was added. Positive detail projection/SEO is tested with pure fixtures; runtime positive detail smoke waits for the first real published editorial article.

Focused commands:

```powershell
pnpm test:blog-public
pnpm frontend
pnpm smoke:blog-public
```

No independent backend/API rebuild is required for 4E.2.

## Remaining slices

```text
4E.3 Shared Sitemap / llms / Static Inventory Integration
4E.4 Manage Blog Permission + Authoring UI
4E.5 Blog Media + Repository Publish / Emergency Adapter
4E.6 Aggregate Regression + External Staging + Static Acceptance
```

### 4E.3

Extend the accepted 4D shared public inventory with Blog index + only authoritative published Article locale URLs.

One policy must drive:

```text
Blog route availability
sitemap
llms
static prerender inventory
```

### 4E.4

Target:

```text
blog.manage permission
/manage/blog
article list/new/edit
EN/FA workflow
Markdown editor
live preview
validation
```

Preferred editor candidate remains `md-editor-v3`, subject to project integration verification.

### 4E.5

Target:

```text
Blog-specific media upload
shared/extracted Arvan SigV4 primitives
stable media URLs in Markdown
repository publication adapter
optional emergency Arvan publication with explicit pending_git reconciliation
```

No base64 payloads in Markdown.

### 4E.6

Final verification must cover:

```text
accepted 4A–4D regressions
4E contract/public/manage/media tests
EN/FA Blog SSR
real published Article positive detail
404/canonical/localization
Markdown safety
structured data
sitemap/llms parity
Manage authorization
static generation
external staging noindex
prompt-draft.ir untouched
```

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
Verify 4E.2:
pnpm test:blog-public
-> pnpm frontend
-> pnpm smoke:blog-public
```

After founder acceptance proceed to 4E.3.
