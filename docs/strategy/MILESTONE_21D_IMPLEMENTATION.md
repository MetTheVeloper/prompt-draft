# Milestone 21D — Public Discovery & SEO Foundation Implementation Handoff

Status: **FIRST IMPLEMENTATION SLICE COMPLETE / AWAITING LOCAL VERIFICATION**

Branch:

```text
feature/growth-foundation
```

Design source:

```text
docs/strategy/MILESTONE_21D_PUBLIC_DISCOVERY_SEO.md
```

Rendering ADR:

```text
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
```

## Implemented scope

The first 21D slice establishes the public acquisition primitives without opening protected Prompt content and without changing `ssr:false`.

Implemented:

```text
NUXT_PUBLIC_SITE_URL runtime config
reusable usePublicSeo composable
global default product SEO metadata
six stable discovery slugs on existing discovery definitions
public sanitized GET /api/discover endpoint
public /discover/[slug] landing page
public discovery card component
six discovery routes added to the current generated route set
robots crawler boundaries
post-generate sitemap/robots enrichment script
EN/FA landing copy
```

No schema migration is required.

## Public discovery routes

```text
/discover/portrait-photography
/discover/3d-sculpture
/discover/illustration-animation
/discover/posters-editorial
/discover/product-fashion
/discover/cinematic-game-art
```

Each route reuses the exact tag bundle already defined by 21C.

## Sanitized discovery API

Endpoint:

```text
GET /api/discover?tag=<slug>&tag=<slug>&limit=<1..24>
```

Semantics:

```text
published Archive items only
repeated tags = OR/union
maximum 24 tag parameters
maximum 24 items
newest published first
```

Response projection is the same deliberately public presentation shape used by the Home showcase:

```text
public id
localized title
publishedAt
telegramUrl nullable
tags
imageCount
coverImage
owner username/avatar only when authoritative active source_user_id exists
```

Not returned:

```text
prompt body
variants
private Draft data
moderation/internal fields
email/session/auth state
```

## Public SEO helper

New:

```text
app/composables/usePublicSeo.ts
```

It manages:

```text
title
description
Open Graph title/description/type/url/image
Twitter card/title/description/image
canonical link
robots index/noindex meta
```

Absolute canonical/OG URLs are emitted only when a valid `NUXT_PUBLIC_SITE_URL` exists.

Local development with an empty site URL does not invent a localhost production canonical.

## Global metadata foundation

`nuxt.config.ts` now includes baseline metadata for:

```text
Prompt Draft title
global product description
og:site_name
og:type
twitter:card
```

Existing PWA/mobile metadata remains.

## Public landing UI

New route component:

```text
app/pages/discover/[slug].vue
```

New card:

```text
app/components/discover/PublicDiscoveryCard.vue
```

Landing behavior:

```text
public / no auth requirement
category title + category description
sanitized published Prompt cards
up to 18 cards requested by default
View Prompt sends the user into the existing protected Prompt detail flow
Telegram action appears when public Telegram URL exists
related discovery-category navigation
Dark/Light theme-aware presentation
EN/FA UI copy
```

This is a discovery/acquisition surface, not a replacement for the protected Prompt Archive detail contract.

## Release generation

The six discovery routes are added to Nitro's current route generation list.

The project remains:

```text
ssr: false
pnpm generate
```

No claim is made yet that route-specific client body content is crawler-visible in generated HTML. That is a verification item and an explicit ADR gate.

## robots.txt

Current source crawler rules:

```text
User-Agent: *
Allow: /
Disallow: /manage
Disallow: /create
Disallow: /login
```

Public discovery paths remain crawlable.

## Sitemap generation

New script:

```text
scripts/generate-public-seo.ts
```

`pnpm generate` now runs:

```text
nuxt generate
-> generate-offline-manifest.ts
-> generate-public-seo.ts
```

When `NUXT_PUBLIC_SITE_URL` is missing:

```text
build remains successful
sitemap generation is intentionally skipped
no localhost production sitemap is emitted
```

When it is a valid absolute URL:

```text
.output/public/sitemap.xml is generated
.output/public/robots.txt gets Sitemap: <site>/sitemap.xml
```

Initial sitemap contains only:

```text
/
six /discover/<slug> routes
```

Authenticated/query-string application routes are not added.

## Local verification

### 1. Pull + rebuild backend

Backend source changed:

```powershell
git pull
docker compose up -d --build api
```

No migration command is required for this 21D slice.

### 2. Verify sanitized public API

```powershell
curl.exe "http://127.0.0.1:4000/api/discover?tag=poster&tag=editorial&limit=10"
```

Expected:

```text
HTTP 200
ok=true
items <= 10
items match poster OR editorial
no prompt field
no variants field
```

Also verify max-limit validation:

```powershell
curl.exe -i "http://127.0.0.1:4000/api/discover?tag=poster&limit=25"
```

Expected:

```text
HTTP 400
```

### 3. Verify public route without authentication

In Incognito/signed-out:

```text
http://localhost:3030/discover/posters-editorial
```

Expected:

```text
page loads without auth/email gate
category hero renders
published cards render
View Prompt enters the existing /prompts?id=<id> protected flow
related categories navigate to other /discover/* routes
```

### 4. Verify invalid discovery slug

```text
/discover/not-a-real-category
```

Expected:

```text
no API disclosure
friendly not-found state
Back to home action
```

### 5. Verify Dark/Light + EN/FA

Check at least one discovery route in both themes and both locales.

No fixed-white/fixed-black presentation should be required for readability.

### 6. Verify normal build with no production site URL

```powershell
Remove-Item Env:NUXT_PUBLIC_SITE_URL -ErrorAction SilentlyContinue
pnpm generate
```

Expected final log includes:

```text
[public-seo] NUXT_PUBLIC_SITE_URL is empty; sitemap generation skipped
```

Build must still pass.

### 7. Verify production-like sitemap generation

PowerShell:

```powershell
$env:NUXT_PUBLIC_SITE_URL="https://example.test"
pnpm generate
Get-Content .output/public/sitemap.xml
Get-Content .output/public/robots.txt
Remove-Item Env:NUXT_PUBLIC_SITE_URL
```

Expected sitemap contains:

```text
https://example.test/
https://example.test/discover/portrait-photography
https://example.test/discover/3d-sculpture
https://example.test/discover/illustration-animation
https://example.test/discover/posters-editorial
https://example.test/discover/product-fashion
https://example.test/discover/cinematic-game-art
```

Expected generated robots includes:

```text
Sitemap: https://example.test/sitemap.xml
```

### 8. Generated HTML evidence gate

After the production-like generate, inspect one generated discovery HTML file.

For example locate the generated file under `.output/public/discover/posters-editorial/` and inspect its `<head>`.

Questions to answer from evidence:

```text
Is route-specific title/description present in generated HTML?
Is canonical present?
Is meaningful route-specific body content present before JavaScript executes?
```

If route-specific body/head content is absent because `ssr:false` emits only the SPA shell, record that result rather than calling SEO rendering complete.

That evidence determines whether 21D should proceed with a build-time prerender/hybrid adjustment under ADR-001.

## Acceptance gate for this slice

Do not mark 21D DONE yet.

This first slice can be marked locally verified when:

```text
public discovery API is sanitized and works anonymously
six discovery routes work anonymously
Dark/Light + EN/FA presentation works
limit validation works
pnpm generate passes
sitemap/robots generation behaves correctly with/without site URL
generated HTML/head evidence is recorded
```

Then continue to structured data and any rendering correction justified by the generated-output evidence.
