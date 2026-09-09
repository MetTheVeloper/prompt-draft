# Milestone 21.5 — Phase 4E.3 Blog Shared Inventory + Sitemap / llms / Static

Status: **IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED**

Date: 2026-09-10

Branch:

```text
feature/growth-foundation
```

Accepted dependencies:

```text
4D shared public inventory / sitemap / llms / static architecture -> ACCEPTED
4E.1 Article Contract + Repository Loader                    -> ACCEPTED
4E.2 Public Blog SSR + Markdown/SEO                          -> ACCEPTED
```

## 1. Purpose

4E.3 makes Blog a first-class resource family inside the already-accepted 4D canonical public URL inventory.

It must not create:

```text
Blog-only sitemap policy
Blog-only llms policy
Blog-only locale/indexability rules
request-time GitHub content reads
```

Required direction:

```text
validated Blog Article repository
-> Article.availableLocales (4E.1 authority)
-> minimal Blog public URL projection
-> shared buildPublicUrlInventory
   + backend Prompt/Creator inventory
   + static Core/Discovery routes
-> sitemap.xml
-> llms.txt
-> legacy static generation
```

## 2. Shared Blog URL projection

New pure helper:

```text
shared/blog-public-inventory.ts
```

Projection shape:

```text
slug
availableLocales
```

The helper receives already-validated `BlogArticle[]` and carries forward only `Article.availableLocales`.

It deliberately does not inspect/recreate:

```text
status
localized title/description
Markdown body
publishedAt
```

Those already determine `availableLocales` in the accepted 4E.1 contract.

Draft/non-public Articles have zero available locales and are omitted.

## 3. Shared public URL inventory extension

`scripts/public-url-inventory.ts` now supports resource kind:

```text
blog
```

Blog index routes are always valid acquisition routes when indexing is enabled:

```text
/blog
/fa/blog
```

Article routes are added only for supplied authoritative locales:

```text
/blog/:slug
/fa/blog/:slug
```

Example:

```text
Article.availableLocales = [fa]
-> /fa/blog/:slug included
-> /blog/:slug absent
```

Global noindex remains absolute:

```text
indexingEnabled=false
-> []
```

This suppresses Blog and all other public resources exactly as before.

## 4. Baseline URL-count change

Before Blog, accepted 4D inventory had 220 canonical routes in the then-current data snapshot.

4E.3 intentionally adds the two bilingual Blog index routes, so with the same Prompt/Creator dataset and zero published Blog Articles the corresponding expected count becomes:

```text
222 canonical routes
```

Each real Blog Article later adds exactly the number of authoritative locales it has.

Therefore future verification must compute expected counts from the shared inventory rather than hard-code 220.

## 5. Runtime sitemap / llms integration

Runtime Prompt/Creator source remains:

```text
GET backend /api/public/inventory
```

Runtime Blog source is local deployed content:

```text
Nitro assets:blog
-> loadBlogRepository()
-> projectBlogPublicInventory()
```

Shared runtime helper:

```text
loadRuntimeBlogPublicInventory()
```

Runtime routes:

```text
server/routes/sitemap.xml.ts
server/routes/llms.txt.ts
```

When indexing is enabled they load in parallel:

```text
backend public inventory
Blog bundled repository inventory
```

and pass both to the same `buildPublicUrlInventory` call.

No request-time GitHub access exists.

### staging/noindex precedence

The accepted 4D behavior remains unchanged:

```text
NUXT_PUBLIC_NOINDEX=true
-> return empty sitemap/llms projection before backend or Blog inventory loading
-> Cache-Control: no-store
```

Blog cannot weaken staging noindex.

## 6. llms.txt extension

`llms.txt` now has a first-class section:

```text
## Blog
```

It contains the Blog index and canonical published Article locale URLs from the exact same `PublicUrlResource[]` consumed by sitemap.

No Article body is copied into llms.txt.

No draft URL is listed.

Crawler permission semantics remain owned by robots.txt, not llms.txt.

## 7. Static generator integration

`scripts/generate-public-seo.ts` now obtains:

```text
backend Prompt/Creator inventory -> HTTP /api/public/inventory
Blog inventory                  -> readBlogRepositoryDirectory()
                                 -> projectBlogPublicInventory()
```

and passes both into one shared inventory projection before rendering:

```text
sitemap.xml
llms.txt
robots.txt
```

Static generation still has no GitHub live dependency.

## 8. Legacy Nuxt prerender strategy

`nuxt.config.ts` adds explicit legacy-static crawl roots:

```text
/blog
/fa/blog
```

They are derived from `PUBLIC_ROUTE_PATHS.blog`.

Article details are intentionally not maintained as a second config-time slug list.

During `nuxt generate`:

```text
Blog EN/FA indexes
-> native Nitro Blog repository projection
-> only authoritative Article links rendered
-> Nitro crawler follows those real links
-> Article detail pages prerendered
```

This keeps prerender discovery aligned with the same 4E.1/4E.2 public eligibility used at runtime.

## 9. Focused contract verification

Root command:

```powershell
pnpm test:blog-inventory
```

Suite includes:

```text
scripts/blog-public-inventory.test.ts
scripts/public-url-inventory.test.ts
scripts/public-llms.test.ts
scripts/public-seo-generator-contract.test.ts
scripts/runtime-seo-delivery-contract.test.ts
```

It covers:

```text
Blog minimal projection
Blog index EN/FA inclusion
authoritative Article locale inclusion
no fake EN/FA locale
no draft leakage
sitemap/llms exact URL-set parity
Blog llms section
global noindex precedence
runtime Blog repository consumption
static filesystem Blog repository consumption
legacy static Blog crawl roots
accepted 4D inventory/llms/runtime regressions
```

## 10. Production-like static verification

Root command:

```powershell
pnpm verify:blog-inventory-static
```

Prerequisite:

```text
local accepted backend API available on http://127.0.0.1:4000
(or BLOG_STATIC_API_BASE override)
```

The verifier:

```text
reads backend public inventory
reads + validates actual content/blog repository
projects expected Blog inventory through 4E.1
builds the exact expected shared canonical URL set
runs isolated indexing-enabled pnpm generate with https://example.test
does not mutate parent shell env
compares sitemap URLs exactly to expected set
compares llms URLs exactly to expected set
checks sitemap == llms parity
checks robots Sitemap declaration
checks /blog and /fa/blog generated HTML
checks every real published Blog Article generated HTML when present
checks canonical/JSON-LD/noindex/private boundaries
```

Current repository intentionally has zero real published Blog Articles, so current static proof must at minimum verify both Blog index pages. Article detail static verification becomes automatic as soon as a real Article exists.

## 11. Service/rebuild scope

4E.3 changes:

```text
frontend/Nitro runtime routes
Nuxt static prerender config
Node static tooling
shared URL inventory
```

It does not change the independent backend service.

Founder verification order:

```powershell
pnpm test:blog-inventory
pnpm frontend
pnpm verify:blog-inventory-static
```

`pnpm frontend` is required because runtime sitemap/llms + `nuxt.config.ts` changed.

The static verifier itself runs one `pnpm generate`; do not run a separate manual generate first.

Do not run:

```text
pnpm api
pnpm stack
```

unless a separate unrelated backend issue requires it.

## 12. Acceptance checklist

```text
[ ] pnpm test:blog-inventory -> PASS
[ ] pnpm frontend -> PASS
[ ] runtime staging noindex sitemap/llms behavior remains safe
[ ] pnpm verify:blog-inventory-static -> PASS
[ ] expected shared inventory includes /blog + /fa/blog
[ ] sitemap URL set == llms URL set == expected shared inventory
[ ] no draft/fake-locale/private Blog leakage
[ ] founder explicitly accepts 4E.3
```

## 13. Current state

```text
4E.1 -> DONE / ACCEPTED
4E.2 -> DONE / ACCEPTED
4E.3 -> IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
4E.4 -> NOT STARTED
4E.5 -> NOT STARTED
4E.6 -> NOT STARTED
```
