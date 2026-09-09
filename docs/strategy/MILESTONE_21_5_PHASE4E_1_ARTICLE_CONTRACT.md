# Milestone 21.5 — Phase 4E.1 Article Contract + Repository Loader + Validation

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09**

Branch:

```text
feature/growth-foundation
```

Parent:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_BLOG_V1.md
```

## Accepted purpose

4E.1 locks the Blog content semantics before public routes, editor UI, media upload or repository publication tooling.

Canonical editorial source remains Git. Public/runtime requests never query GitHub.

## Canonical repository package

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

`articleId` is stable identity and is independent from public slug. Directory name must equal `article.json.id`.

Article directories may contain only:

```text
article.json
en.md
fa.md
```

Repository-wide duplicate slugs are invalid.

## Accepted metadata contract

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

ID/slug vocabulary:

```text
lowercase ASCII letters/numbers
single hyphens between segments
no spaces/query/hash/slash identity
```

Timestamps are RFC3339 with explicit timezone and normalize to UTC ISO strings.

Published rule:

```text
status=published
-> publishedAt required
-> updatedAt >= publishedAt
-> >=1 authoritative public locale required
```

## Accepted localization policy

Supported locales:

```text
en
fa
```

Metadata per locale:

```text
title
description
```

Body:

```text
en -> en.md
fa -> fa.md
```

`availableLocales` is derived, never stored:

```text
status=published
AND title exists
AND description exists
AND matching Markdown body is non-empty
```

Therefore partial translation work never creates a fake indexable locale.

The same derived result is authoritative for later:

```text
route availability
Blog index
canonical/hreflang
structured data
sitemap
llms
static prerender inventory
```

## Accepted author model

V1 author identity is explicit editorial/site metadata:

```text
kind=editorial
name
url=null|root-relative|HTTP(S)
```

Article metadata does not reference private user/account identity, UUID, email, role or Creator lifecycle.

Approved Creator authorship may be added only through an explicit future schema extension.

## Accepted hero/media metadata

Hero is optional. When present:

```text
fullUrl
thumbnailUrl
width
height
alt.en / alt.fa as applicable
```

URLs are root-relative or HTTP(S). Dimensions are both null or both valid positive integers. Localized alt is required wherever hero + localization metadata coexist.

Actual upload/storage remains 4E.5 scope. No image bytes/base64 are stored in repository metadata.

## Accepted Markdown contract

Shared renderer:

```text
app/utils/publicMarkdown.ts
```

Adapters:

```text
app/utils/publicCreatorMarkdown.ts
app/utils/publicBlogMarkdown.ts
```

Blog body Markdown `#` renders from `<h2>` because page title owns `<h1>`.

Supported V1 subset:

```text
headings
paragraphs
bold/italic
inline/fenced code
ordered/unordered lists
blockquote
horizontal rule
links
images
```

Safety:

```text
raw HTML escaped
root-relative + HTTP(S) destinations allowed
javascript:/data:/vbscript:/file: destinations inactive/rejected
external Blog links rel=noopener noreferrer
images loading=lazy + decoding=async
```

Markdown tables are intentionally not interpreted in V1 yet.

## Shared validation

Authoritative contract:

```text
shared/blog-article.ts
```

Validation rejects unknown metadata, invalid id/slug, directory mismatch, unsupported status, invalid timestamp ordering, unrecognized author shape, invalid hero metadata, body without localization metadata, unsafe Markdown schemes, oversized body, unsupported files, orphan body files, duplicate slugs and published Articles with zero authoritative locales.

Repository validation is fail-closed.

## Runtime architecture

Docker runner copies only `.output`, therefore deployed Blog runtime does not depend on a Git working tree.

Accepted path:

```text
content/blog in Git
-> Nuxt/Nitro build
-> Nitro serverAssets baseName=blog
-> bundled in .output/server
-> useStorage('assets:blog')
-> shared Article validator
```

Runtime loader:

```text
server/utils/blogRepository.ts
```

Public eligibility helpers:

```text
listPublishedBlogArticles(locale)
getPublishedBlogArticleBySlug(slug, locale)
```

No request-time GitHub/API/network content fetch exists.

## Static/build adapter

```text
scripts/blog-repository.ts
```

It reads `content/blog` from filesystem and sends the same asset map through `assertValidBlogRepositoryAssets`.

Thus runtime and build have different acquisition adapters but one validation/publication policy.

## Deferred intentionally

Still later scope:

```text
4E.2 public Blog SSR/SEO
4E.3 sitemap/llms/static inventory
4E.4 Manage permission/editor
4E.5 media + repository publication/emergency adapter
4E.6 aggregate acceptance
```

## Founder verification evidence

2026-09-09:

```text
pnpm test:blog-contract
-> 18 tests
-> 18 pass
-> 0 fail
```

Coverage included locale eligibility, draft behavior, strict metadata, author privacy, unsafe/base64 Markdown rejection, duplicate/orphan repository validation, filesystem adapter reuse, safe Blog Markdown, intentional table non-support, Nitro serverAssets contract and Public Creator Markdown regression.

Frontend runtime build:

```text
pnpm frontend
-> dependency install PASS
-> Nuxt client build PASS
-> Nuxt server build PASS
-> Nitro node-server build PASS
-> Docker frontend image built
-> frontend container started
```

A second `pnpm frontend` was a complete cache hit and container remained running.

No backend/API/full-stack rebuild was required.

Founder explicit acceptance:

```text
تایید
```

## Final state

```text
4E.1 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4E.2 -> IN PROGRESS
4E.3 -> NOT STARTED
4E.4 -> NOT STARTED
4E.5 -> NOT STARTED
4E.6 -> NOT STARTED
```
