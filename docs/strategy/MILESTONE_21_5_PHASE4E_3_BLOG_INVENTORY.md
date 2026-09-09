# Milestone 21.5 — Phase 4E.3 Blog Shared Inventory + Sitemap / llms / Static

Status: **DONE / FOUNDER-LOCAL + STATIC VERIFIED / ACCEPTED 2026-09-10**

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

## Accepted architecture

Blog is a first-class resource family inside the existing public URL inventory. No Blog-specific sitemap, llms, locale or indexability stack was created.

```text
validated content/blog repository
-> Article.availableLocales (4E.1 authority)
-> shared/blog-public-inventory.ts
-> buildPublicUrlInventory
   + static Core/Discovery
   + backend Prompt/Creator inventory
   + Blog index/Article inventory
-> sitemap.xml
-> llms.txt
-> legacy pnpm generate compatibility
```

Blog projection carries only:

```text
slug
availableLocales
```

It does not recreate status/title/description/body publication rules. Draft or incomplete locale content has zero public Article URLs.

## Accepted public URL behavior

Indexing-enabled environments always include:

```text
/blog
/fa/blog
```

Article paths exist only for authoritative locales:

```text
/blog/:slug
/fa/blog/:slug
```

Global `NUXT_PUBLIC_NOINDEX=true` remains absolute and returns an empty shared public inventory before Blog/backend inventory reads.

## Accepted runtime sources

```text
Prompt + Creator -> backend GET /api/public/inventory
Blog             -> Nitro assets:blog -> loadBlogRepository()
```

Runtime sitemap and llms load both authoritative sources and pass them to the same `buildPublicUrlInventory` call.

There is no request-time GitHub access.

## Accepted static source

```text
Prompt + Creator -> backend public inventory API
Blog             -> content/blog filesystem validator
```

`scripts/generate-public-seo.ts` projects both through the same shared URL inventory before writing sitemap/llms/robots.

Legacy static prerender roots explicitly include:

```text
/blog
/fa/blog
```

Article detail pages are discovered by the Nuxt crawler from truthful localized Blog index links instead of a second slug list.

## URL-count contract

The accepted historical 4D snapshot had 220 canonical URLs. Blog adds two bilingual index URLs, therefore the accepted zero-Article snapshot is:

```text
222 canonical URLs
```

Future expected counts are computed dynamically. Each published Article contributes exactly its authoritative locale count.

## Founder verification evidence

```text
pnpm test:blog-inventory
-> 19 tests / 19 PASS / 0 FAIL

pnpm frontend
-> dependency install PASS
-> Nuxt client PASS
-> Nuxt server PASS
-> Nitro node-server PASS
-> Docker image PASS
-> frontend container started

pnpm verify:blog-inventory-static
-> expected canonical URL count: 222
-> published Blog Article inventory: 0
-> isolated production-like pnpm generate completed
-> Blog EN/FA index prerendered
-> shared sitemap/llms expected-set verification completed without error
```

Founder explicit acceptance:

```text
تایید
```

## Accepted invariants

```text
one shared URL inventory
sitemap URL set == llms URL set == computed expected inventory
no draft Blog Article URLs
no fake locale URLs
no Blog body copied to llms
no request-time GitHub reads
staging noindex wins before inventory reads
/blog + /fa/blog are canonical acquisition routes
```

## State transition

```text
4E.1 -> DONE / ACCEPTED
4E.2 -> DONE / ACCEPTED
4E.3 -> DONE / ACCEPTED 2026-09-10
4E.4 -> CURRENT / Manage Blog Permission + Authoring UI
4E.5 -> NOT STARTED
4E.6 -> NOT STARTED
```
