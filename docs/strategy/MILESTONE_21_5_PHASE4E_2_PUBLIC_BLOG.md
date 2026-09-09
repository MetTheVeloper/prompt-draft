# Milestone 21.5 — Phase 4E.2 Public Blog Index + Article SSR + Markdown/SEO

Status: **IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Accepted dependency:

```text
4E.1 Article Contract + Repository Loader + Validation
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

## 1. Purpose

4E.2 turns the accepted repository Article contract into native Nuxt/Nitro public Blog surfaces without introducing a second content/indexability policy.

Routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

## 2. Selected runtime architecture

Blog content remains bundled frontend content, not backend database content.

Runtime path:

```text
Git content/blog
-> Nitro serverAssets
-> server/utils/blogRepository.ts
-> public Nitro Blog projection
-> Nuxt SSR pages
```

Public Nitro endpoints:

```text
GET /api/public/blog?locale=en|fa
GET /api/public/blog/:slug?locale=en|fa
```

These are frontend/Nitro endpoints. The independent backend API is intentionally unchanged in 4E.2.

The endpoints consume 4E.1 `isBlogLocalePublic`; they do not recreate publication/localization policy.

## 3. Public projection boundary

Public list/detail DTOs expose only:

```text
slug
availableLocales
localized title
localized description
publishedAt
updatedAt
editorial author name + optional safe public URL
localized hero public URLs/dimensions/alt when present
localized Markdown body on detail only
```

They do not expose repository directory identity, author kind/internal account identity, permissions, sessions, economy, private Drafts, protected Prompt content or source ids.

Implementation:

```text
app/shared/public-blog.ts
server/utils/publicBlogProjection.ts
server/api/public/blog/index.get.ts
server/api/public/blog/[slug].get.ts
app/composables/usePublicBlog.ts
```

## 4. Blog index

`/blog` and `/fa/blog` are valid public SSR acquisition routes even when there are zero published Articles.

Behavior:

```text
SSR localized heading/description
published Articles in active locale only
publishedAt descending from repository loader
localized canonical Article links
hero thumbnail/full fallback
editorial author display
localized empty state
self canonical
EN/FA alternates
CollectionPage + ItemList JSON-LD
```

No fake Article fallback is generated.

## 5. Article detail

`/blog/:slug` and `/fa/blog/:slug` require:

```text
Article exists
status=published
target locale in derived availableLocales
```

Otherwise real 404.

Slug behavior:

```text
canonical lower kebab-case syntax
noncanonical case/wrapping normalized for lookup
301 only after an actual canonical Article exists
invalid slug -> 404
```

This avoids using redirects as a new existence oracle for nonexistent Article slugs.

## 6. Markdown rendering

Article body uses:

```text
renderPublicBlogMarkdown
-> shared renderPublicMarkdown
```

The accepted 4E.1 safety contract remains authoritative.

The SSR page renders the resulting sanitized/escaped deterministic HTML with `v-html`; raw repository HTML is never trusted directly.

## 7. Article SEO

Detail uses the accepted `usePublicSeo` primitive with:

```text
localized title
description
canonical Blog path
contentType=article
hero OG/Twitter image when available
alternateLocales=Article.availableLocales
BlogPosting JSON-LD
```

Additional article metadata:

```text
article:published_time
article:modified_time
author
```

BlogPosting projection includes only truthful public fields:

```text
canonical @id/mainEntityOfPage
headline
description
inLanguage
datePublished
dateModified
public hero image
explicit editorial author
Prompt Draft publisher
```

Relative editorial author URLs are converted to absolute URLs using the configured public site origin.

## 8. Blog index SEO

Index uses:

```text
/blog canonical base
localized static Blog title/description
EN/FA alternates
CollectionPage
ItemList
BlogPosting summary items
```

The index remains meaningful and valid with an empty ItemList before the first real article is published.

## 9. Localization

New locale fragments:

```text
i18n/locales/blog.en.ts
i18n/locales/blog.fa.ts
```

Registered in:

```text
i18n/i18n.config.ts
```

Blog is also added to primary locale-safe navigation through `app/config/navigation.ts`.

## 10. No artificial public fixture

4E.2 intentionally does not add a fake published Blog Article merely to make a positive detail smoke possible.

Verification split:

```text
pure contract tests -> positive localized Article projection + BlogPosting
runtime -> Blog EN/FA index + empty state + API + negative detail/404
first real published Article -> positive runtime detail smoke later in 4E.4/4E.5/4E.6
```

This keeps Git editorial content truthful.

## 11. Focused tests

Root command:

```powershell
pnpm test:blog-public
```

Suite:

```text
scripts/public-blog-projection.test.ts
scripts/public-blog-seo.test.ts
scripts/public-blog-ssr-contract.test.ts
scripts/blog-contract.test.ts
```

Coverage:

```text
public DTO privacy
strict locale parser
localized positive Article projection
BlogPosting canonical/localized JSON-LD
CollectionPage/ItemList index JSON-LD
native SSR page ownership
404 + canonical redirect source contracts
safe Markdown renderer use
public Nitro API policy reuse
EN/FA localization registration
4E.1 repository contract regression
```

## 12. Verification gate

Because 4E.2 changes frontend app/server/Nitro content only:

```powershell
pnpm test:blog-public
pnpm frontend
```

No backend rebuild is required.

After frontend build, narrow runtime checks should cover:

```text
GET /api/public/blog?locale=en -> 200
GET /api/public/blog?locale=fa -> 200
/blog -> 200
/fa/blog -> 200
/blog/nonexistent-article -> 404
/fa/blog/nonexistent-article -> 404
canonical/hreflang + staging noindex on Blog index
CollectionPage JSON-LD in raw SSR HTML
```

If repository is still empty, list responses should be `[]`; that is expected, not a failure.

Do not mark 4E.2 accepted until founder verification + explicit acceptance.

## 13. Current state

```text
4E.1 -> DONE / ACCEPTED
4E.2 -> IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
4E.3 -> NOT STARTED
4E.4 -> NOT STARTED
4E.5 -> NOT STARTED
4E.6 -> NOT STARTED
```
