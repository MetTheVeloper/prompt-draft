# Milestone 21.5 — Phase 4E.1 Article Contract + Repository Loader + Validation

Status: **IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_BLOG_V1.md
```

Operational workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

Accepted dependency:

```text
21.5.4D -> DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED
```

---

## 1. Purpose

4E.1 locks the Blog content semantics before public routes, editor UI, media upload or repository publication tooling are built.

The slice answers one question:

```text
What exactly is a valid Prompt Draft Blog Article package,
and how does deployed/runtime code read it without querying GitHub?
```

No public Blog route is added in 4E.1.

---

## 2. Canonical repository layout

Accepted V1 layout:

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

`articleId` is stable identity and is deliberately independent from public slug.

The directory name must equal `article.json.id`.

Supported Article-directory files are intentionally narrow:

```text
article.json
en.md
fa.md
```

Metadata is not duplicated in Markdown frontmatter.

Repository-wide duplicate public slugs are invalid.

Root repository guidance may live in:

```text
content/blog/README.md
```

---

## 3. Article metadata contract

`article.json` contains exactly:

```text
id
slug
status
publishedAt
updatedAt
author
hero
localizations
```

Lifecycle V1:

```text
draft
published
```

No scheduled/archive state is introduced in V1 contract yet.

Canonical id/slug vocabulary:

```text
lowercase ASCII letters/numbers
single hyphens between segments
no uppercase
no spaces
no slash/query/hash identity
```

Timestamps use RFC3339 with explicit timezone and are normalized to UTC ISO strings by the validator.

Published Article rule:

```text
status=published
-> publishedAt required
-> updatedAt >= publishedAt
-> at least one authoritative public locale required
```

---

## 4. Localization/public eligibility contract

Supported authoritative locales:

```text
en
fa
```

Each localization metadata object contains exactly:

```text
title
description
```

Body is supplied by the sibling Markdown file:

```text
en -> en.md
fa -> fa.md
```

Public locale availability is **derived**, never stored:

```text
Article status = published
AND localization title exists
AND localization description exists
AND matching Markdown body exists and is non-empty
```

Therefore a published Article may safely contain translation work-in-progress without creating a fake public locale.

Examples:

```text
EN metadata + EN body + FA metadata but no FA body
-> availableLocales = [en]

status=draft + complete EN/FA
-> availableLocales = []
```

This one derived result will be consumed later by:

```text
route availability / 404
Blog index listing
canonical/hreflang
structured data
sitemap
llms
static prerender inventory
```

No fallback-only locale may be advertised.

---

## 5. V1 author identity decision

4E.1 explicitly selects:

```text
V1 Blog author = explicit editorial/site identity
```

Shape:

```text
kind = editorial
name
url = null | root-relative | HTTP(S)
```

V1 Article metadata does **not** reference:

```text
user UUID
email
role
Creator lifecycle
private account row
```

This prevents Blog publication from coupling repository content to private account identity.

Approved Public Creator authorship can be introduced later only through an explicit schema/policy extension; it is not silently inferred in V1.

---

## 6. Hero/media metadata contract

Hero is optional.

When present:

```text
fullUrl
thumbnailUrl
width
height
alt.en / alt.fa as applicable
```

URLs are limited to:

```text
root-relative
HTTP
HTTPS
```

Hero dimensions are either both null or both valid positive integers.

When hero media and a localization metadata object both exist, localized alt text is required for that locale.

Actual Blog upload/storage behavior remains 4E.5 scope.

No image bytes are stored inside repository metadata.

---

## 7. Markdown contract

4E.1 extracts the existing safe Creator Markdown behavior into one reusable public Markdown primitive:

```text
app/utils/publicMarkdown.ts
```

Adapters:

```text
app/utils/publicCreatorMarkdown.ts
app/utils/publicBlogMarkdown.ts
```

Creator keeps its accepted presentation behavior:

```text
heading offset +1
external rel=ugc noopener noreferrer
```

Blog uses:

```text
heading offset +1
external rel=noopener noreferrer
```

The offset reserves the page-level Article title for `<h1>`; body Markdown `#` begins at `<h2>`.

V1 supported presentation subset:

```text
headings
paragraphs
bold
italic
inline code
fenced code
unordered lists
ordered lists
blockquote
horizontal rule
links
images
```

Safety:

```text
raw HTML escaped
root-relative links/images allowed
HTTP(S) links/images allowed
javascript:/data:/vbscript:/file: destinations not rendered as active URL attributes
external links use target=_blank + rel policy
image loading=lazy + decoding=async
```

Repository validation also rejects unsafe Markdown link/image destination schemes before publication.

V1 intentionally does not interpret Markdown tables yet.

This decision avoids adding a new Markdown dependency/lockfile change in 4E.1 and preserves a deterministic server/client-safe renderer already proven by the Public Creator surface.

If table/plugin support becomes necessary later, it must extend this public safety contract rather than replacing it with editor-owned HTML.

---

## 8. Shared validation implementation

Authoritative pure contract:

```text
shared/blog-article.ts
```

Exports include:

```text
BLOG_LOCALES
BLOG_ARTICLE_STATUSES
validateBlogArticlePackage
validateBlogRepositoryAssets
assertValidBlogRepositoryAssets
getBlogAvailableLocales
isBlogLocalePublic
normalizeBlogPublicUrl
```

Validation rejects at least:

```text
unknown metadata keys
invalid id/slug
directory/id mismatch
unsupported status
invalid timestamps
updatedAt before publishedAt
private/unrecognized author shape
invalid hero URL/dimensions/alt
body without localization metadata
unsafe Markdown URL schemes
oversized Markdown body
unsupported files inside Article directories
orphan body files without article.json
duplicate public slugs
published Article with zero authoritative locales
```

Repository validation is fail-closed: invalid content does not silently become a partial public inventory.

---

## 9. Runtime loader architecture

Docker runner currently copies only:

```text
.output
```

Therefore Blog runtime cannot rely on an external Git working tree mounted beside the app.

Accepted runtime architecture:

```text
content/blog in Git
-> Nuxt/Nitro build
-> Nitro serverAssets baseName=blog
-> bundled inside deployed .output/server
-> useStorage('assets:blog')
-> shared Article validator
-> request-time SSR consumers later in 4E.2
```

Configured in:

```text
nuxt.config.ts
```

Runtime loader:

```text
server/utils/blogRepository.ts
```

Public helper direction already implemented:

```text
listPublishedBlogArticles(locale)
getPublishedBlogArticleBySlug(slug, locale)
```

Both consume `isBlogLocalePublic`; neither creates fallback/indexability rules.

The loader has no GitHub/API/network fetch path.

Nitro server-assets are designed to read from filesystem in development and bundle into the server for production programmatic access.

---

## 10. Filesystem/build adapter

Static/build tooling cannot rely on Nitro runtime storage.

Node filesystem adapter:

```text
scripts/blog-repository.ts
```

It reads:

```text
content/blog
```

and sends exactly the same asset map through:

```text
assertValidBlogRepositoryAssets
```

Therefore:

```text
runtime acquisition adapter != static/build acquisition adapter
policy/validation contract = one shared implementation
```

This adapter becomes the input for 4E.3 sitemap/llms/static integration.

---

## 11. Publication adapter deliberately deferred

4E.1 does not write Git.

Still deferred to 4E.5:

```text
Manage -> Git provider publication
repository-package export fallback
Arvan emergency publication/reconciliation
```

This is deliberate: the Article package must be stable before write tooling is allowed to create it.

Public request-time GitHub access remains forbidden regardless of the later management adapter.

---

## 12. Focused verification

Root command:

```powershell
pnpm test:blog-contract
```

Suite:

```text
scripts/blog-contract.test.ts
scripts/blog-runtime-loader-contract.test.ts
scripts/public-creator-markdown.test.ts
```

It verifies:

```text
published locale derivation
partial localization behavior
draft non-public behavior
strict metadata/identity/timestamp validation
editorial-author privacy boundary
base64/unsafe Markdown rejection
duplicate slug/orphan file rejection
deterministic repository packaging
filesystem adapter reuse
Blog Markdown XSS/protocol handling
V1 table non-support
Nitro serverAssets bundling contract
no GitHub/network runtime loader
accepted Creator Markdown regression
```

Because 4E.1 changes `nuxt.config.ts` and a shared frontend Markdown primitive, final founder verification should also run the smallest relevant runtime build:

```powershell
pnpm frontend
```

No backend/API change exists in 4E.1, therefore:

```text
DO NOT run pnpm api
DO NOT run pnpm stack
```

---

## 13. Acceptance checklist

```text
[ ] pnpm test:blog-contract -> PASS
[ ] pnpm frontend -> PASS
[ ] Nitro Blog server asset bundling produces no build/runtime resolution error
[ ] Public Creator Markdown regression remains green
[ ] founder explicitly accepts 4E.1
```

Only after acceptance proceed to:

```text
4E.2 Public Blog Index + Article SSR + Markdown/SEO
```

---

## 14. Current state

```text
4E.1 -> IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
4E.2 -> NOT STARTED
4E.3 -> NOT STARTED
4E.4 -> NOT STARTED
4E.5 -> NOT STARTED
4E.6 -> NOT STARTED
```
