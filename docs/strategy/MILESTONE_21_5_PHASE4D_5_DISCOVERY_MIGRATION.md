# Milestone 21.5 — Phase 4D.5 Discovery Structured Data + Legacy Generator Migration

Status: **DONE / FOUNDER-LOCAL + STAGING SSR VERIFIED / ACCEPTED 2026-09-09**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_SITEMAP_ROBOTS_AI_DISCOVERY.md
```

Accepted dependencies:

```text
4D.2 shared public inventory + sitemap -> ACCEPTED
4D.3 robots normalization             -> ACCEPTED
4D.4 llms.txt shared projection       -> ACCEPTED 2026-09-09
```

## 1. 4D.4 acceptance checkpoint

The founder explicitly accepted 4D.4 on 2026-09-09 after the following evidence:

```text
pnpm test:llms-discovery
-> 9 tests / 9 pass / 0 fail

pnpm test:public-url-inventory
-> 7 tests / 7 pass / 0 fail

pnpm frontend
-> Docker/Nitro production build PASS
-> runtime bundle contains llms.txt.mjs + sitemap.xml.mjs + robots.txt.mjs
```

Staging-config runtime:

```text
NUXT_PUBLIC_NOINDEX=true
NUXT_PUBLIC_SITE_URL=https://grassic.ir

GET http://127.0.0.1:3000/llms.txt
-> 200
-> Content-Type: text/plain; charset=utf-8
-> Cache-Control: no-store
-> X-Robots-Tag: noindex, nofollow, noarchive
-> canonical Markdown link count = 0
-> private/legacy forbidden scan = no matches
```

Indexing-enabled static projection:

```text
NUXT_PUBLIC_SITE_URL=https://example.test
NUXT_PUBLIC_API_BASE=http://127.0.0.1:4000
NUXT_PUBLIC_NOINDEX=false

scripts/generate-public-seo.ts
-> sitemap canonical URL count = 220
-> llms canonical link count = 220
-> sitemap URL set == llms URL set
-> Compare-Object = no differences
-> private/legacy forbidden scan = no matches
```

Therefore:

```text
4D.4 -> DONE / FOUNDER-LOCAL + STAGING-CONFIG VERIFIED / ACCEPTED 2026-09-09
```

## 2. 4D.5 audit findings

The authoritative branch was re-read before implementation.

The audit found:

```text
1. Native /discover/:slug already owns request-time SSR data loading through /api/discover.
2. Native Discovery cards already link to canonical localized /prompt/:id routes.
3. Approved Creator attribution already links to canonical localized /creator/:username routes.
4. Native Discovery used usePublicSeo but did not yet provide structuredData or a data-derived OG image.
5. Milestone-21 generate-public-seo.ts still fetched /api/discover a second time.
6. The legacy generator still injected a second static Discovery snapshot into generated HTML.
7. That snapshot still used legacy /prompts?id= Prompt links and /user?un= Creator links.
8. The current /api/discover response uses `creator`, while the legacy generator still expected `owner`, so legacy static attribution had drifted from the accepted 4C contract.
9. The legacy generator also injected its own CollectionPage/ItemList JSON-LD, creating a second structured-data authority beside native Nuxt SSR.
10. Discovery slug/tag definitions were duplicated between app preferences, Nuxt prerender config, and public URL inventory code.
```

## 3. Selected architecture

4D.5 makes native Nuxt SSR authoritative for Discovery presentation + SEO:

```text
shared Discovery definition
-> Nuxt /discover/:slug SSR data
-> native visible cards
-> native usePublicSeo metadata
-> native CollectionPage / ItemList structured data
```

The post-generator is reduced to the artifacts that truly need post-generation projection:

```text
shared public inventory
-> sitemap.xml
-> llms.txt
-> robots.txt
```

It no longer fetches or renders Discovery content independently.

A narrow compatibility cleanup remains in the post-generator only to remove stale Milestone-21 markers if an existing `.output` directory still contains them:

```text
data-public-seo-snapshot
data-public-seo-structured
```

This is cleanup, not a second SEO renderer.

## 4. Shared Discovery catalog

Authoritative source after Nitro-build hardening:

```text
app/shared/public-discovery.ts
```

Compatibility re-export for root scripts/tests:

```text
shared/public-discovery.ts
```

The root file is a thin re-export shim, not a second catalog.

The authoritative catalog owns the six accepted Discovery definitions:

```text
key
slug
stable English label/description for machine-facing uses
tags
icon
i18n title key
i18n description key
```

Consumers include:

```text
app/composables/useDiscoveryPreferences.ts
scripts/public-url-inventory.ts
nuxt.config.ts
```

Nuxt legacy static-generation prerenders are derived from the same route list and explicitly include both locale spaces:

```text
/discover/:slug
/fa/discover/:slug
```

The catalog was moved inside the Nuxt `app/` source tree after a verification build exposed a Nitro bundling problem with a raw root-relative TypeScript import. This resolved the build without duplicating policy/data.

## 5. Native Discovery structured data

Implemented utility:

```text
app/utils/publicDiscoverySeo.ts
```

Native page:

```text
app/pages/discover/[slug].vue
```

The page passes reactive values to `usePublicSeo` and provides:

```text
localized title
localized description
canonicalPath via publicDiscoveryPath
first public cover image as OG/Twitter image when available
CollectionPage JSON-LD
ItemList of currently rendered sanitized public items
```

Each structured item is a public-safe `CreativeWork` containing only intentionally public data:

```text
localized title
canonical localized /prompt/:id URL
publishedAt
language
tags
public cover image
optional approved Creator attribution
```

When Creator attribution exists, the structured author is limited to:

```text
Person.name = canonical public username
Person.url  = canonical localized /creator/:username
```

Forbidden data remains excluded:

```text
Prompt body
variants
private Drafts
source_user_id
source_draft_id
email
birthday
role/account state
balance/Goin
permissions/sessions
storage keys
admin/provider metadata
```

## 6. Legacy generator retirement

`scripts/generate-public-seo.ts` no longer contains:

```text
/api/discover fetches
fetchDiscoveryItems
renderStaticSnapshot
setRouteHead
legacy /prompts?id= item links
legacy /user?un= Creator links
independent Discovery JSON-LD construction
```

It retains only:

```text
legacy marker cleanup for pre-existing .output HTML
public inventory fetch for indexing-enabled sitemap/llms
sitemap.xml rendering
llms.txt rendering
robots.txt rendering
```

## 7. Focused tests

Added/updated:

```text
scripts/public-discovery-seo.test.ts
scripts/public-discovery-visual-contract.test.ts
package.json -> test:discovery-seo
```

The focused contract covers:

```text
single shared six-category catalog
unique keys/slugs
deterministic shared routes
localized FA structured-data Prompt URL
localized FA Creator URL
localized title/language
public image/tags
private/legacy structured-data exclusion
native page owns structuredData + OG image
Nuxt/public inventory/preferences consume shared catalog
legacy generator no longer fetches/renders Discovery
legacy cleanup markers remain migration-only
accepted Discovery visual/public-data boundaries remain intact
```

## 8. Founder verification evidence — ACCEPTED 2026-09-09

Focused no-rebuild gates:

```text
pnpm test:discovery-seo
-> 8 tests / 8 pass / 0 fail

pnpm test:public-url-inventory
-> 7 tests / 7 pass / 0 fail
```

Frontend build verification:

```text
pnpm frontend
-> Nuxt client build PASS
-> Nuxt server build PASS
-> Nitro server build PASS
-> Docker image built
-> frontend container started
```

Verification uncovered two non-policy build issues and both were fixed before acceptance:

```text
1. Docker/Corepack bootstrap network fragility
   -> pnpm 11.6.0 bootstrap moved before package manifest COPY
   -> retry + IPv4-first hardening

2. Nitro unresolved root-relative shared/public-discovery.ts import
   -> authoritative catalog moved to app/shared/public-discovery.ts
   -> root shared/public-discovery.ts became a re-export shim
```

Final raw staging SSR source was inspected for:

```text
https://grassic.ir/discover/portrait-photography
https://grassic.ir/fa/discover/portrait-photography
```

EN source proved:

```text
lang=en-US / dir=ltr
localized title + description
self canonical
EN/FA hreflang + x-default
staging noindex meta
OG/Twitter image
native CollectionPage -> ItemList -> CreativeWork JSON-LD
canonical /prompt/:id structured URLs
visible canonical /prompt/:id links
no /prompts?id=
no /user?un=
no protected/private serialized-field matches
```

FA source proved:

```text
lang=fa-IR / dir=rtl
localized Persian title + description
self canonical /fa/discover/portrait-photography
EN/FA hreflang + x-default
staging noindex meta
native CollectionPage -> ItemList -> CreativeWork JSON-LD
canonical /fa/prompt/:id structured URLs
visible canonical /fa/prompt/:id links
no /prompts?id=
no /user?un=
no protected/private serialized-field matches
```

The live Discovery fixture used for this smoke did not contain Creator attribution, so no runtime `author` node was expected. The focused contract test separately proves the optional approved-Creator path uses canonical localized `/creator/:username` URLs and only public username identity.

The founder explicitly authorized acceptance after this evidence.

Production-like fresh static generation is intentionally executed once in the 4D.6 aggregate gate rather than repeated here. It remains required before final Phase 4D acceptance.

## 9. Acceptance

Final 4D.5 state:

```text
4D.4 -> DONE / VERIFIED / ACCEPTED
4D.5 -> DONE / FOUNDER-LOCAL + STAGING SSR VERIFIED / ACCEPTED 2026-09-09
4D.6 -> IMPLEMENTED / VERIFICATION PENDING / NOT ACCEPTED
```

Next source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md
```
