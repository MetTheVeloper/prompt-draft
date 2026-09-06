# Milestone 21D — Public Discovery & SEO Foundation Implementation Handoff

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

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

Canonical verification record:

```text
docs/strategy/MILESTONE_21D_VERIFICATION.md
```

## Final implemented scope

21D establishes a public acquisition/SEO layer without exposing protected Prompt bodies and without migrating the full application away from `ssr:false`.

Implemented:

```text
NUXT_PUBLIC_SITE_URL runtime/build contract
usePublicSeo reusable SEO/canonical primitive
global product SEO defaults
six stable path-based discovery routes
GET /api/discover sanitized public presentation endpoint
PublicDiscoveryCard public presentation component
public Prompt Archive list/catalog access
protected full Prompt detail boundary retained
robots crawler boundaries
sitemap generation
post-generate route-specific SEO enrichment
CollectionPage + ItemList JSON-LD
crawler-visible sanitized HTML snapshots
EN/FA discovery UI copy
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

Each route reuses the 21C interest/tag bundles.

## Sanitized public API

```text
GET /api/discover?tag=<slug>&tag=<slug>&limit=<1..24>
```

Semantics:

```text
published Archive items only
repeated tags = OR/union
presentation metadata only
no prompt body
no variants
```

Returned public projection includes:

```text
public id
localized title
publishedAt
telegramUrl nullable
tags
imageCount
coverImage
owner username/avatar only when authoritative source_user_id exists
```

## Prompt Archive public/protected boundary

The obsolete test-era list gate was removed.

Current behavior:

```text
/prompts list + filters + cards + preview media -> public
GET /api/archive -> public

/prompts?id=<id> full Prompt detail -> authenticated + email gate
GET /api/archive/:id -> authenticated + email gate
```

This gives anonymous users a usable catalog while keeping full Prompt knowledge protected.

## SEO generation architecture

The project remains:

```text
ssr: false
pnpm generate
static frontend artifact
independent Node API
```

Nuxt correctly reports that SPA route HTML itself is not prerendered.

21D therefore uses a controlled post-generate enrichment step in:

```text
scripts/generate-public-seo.ts
```

For each `/discover/*` route it injects into the generated artifact:

```text
route-specific title
route-specific description
canonical URL when NUXT_PUBLIC_SITE_URL exists
Open Graph/Twitter metadata
first sanitized preview image when available
CollectionPage + ItemList JSON-LD
semantic data-public-seo-snapshot body
up to 12 sanitized discovery items
```

The data source is only:

```text
/api/discover
```

The historical full Prompt fallback snapshot is not used as the SEO feed.

## Sitemap / robots

When `NUXT_PUBLIC_SITE_URL` is absent:

```text
build continues
production sitemap is intentionally skipped
localhost is not published as canonical truth
```

When it is present:

```text
.output/public/sitemap.xml is generated
.output/public/robots.txt receives the absolute Sitemap line
```

Initial sitemap contains:

```text
/
six /discover/<slug> routes
```

## Verification summary

Locally verified on 2026-09-06:

```text
/api/discover multi-tag public response works
limit=25 is rejected with HTTP 400
public discovery output contains no prompt/variants
anonymous /prompts catalog access works
full Prompt detail remains protected
pnpm generate passes
24 Nuxt routes include all six discovery routes
sitemap contains 7 public URLs
robots contains expected exclusions + Sitemap
all six generated discovery routes are enriched with sanitized items
```

Generated UTF-8 HTML verification for:

```text
.output/public/discover/posters-editorial/index.html
```

resulted in:

```text
Snapshot         True
JsonLd           True
Canonical        True
Title            True
HasArticles      True
ProtectedFields  False
```

Confirmed generated title:

```html
<title>Posters &amp; Editorial · Prompt Draft</title>
```

## Final rendering decision

Do not migrate the entire application to SSR for current 21D scale.

The accepted architecture is targeted static SEO enrichment for the controlled public discovery route family.

ADR-001 remains the authority for future migration triggers such as public page volume, freshness requirements, Creator/Product publishing scale or better hosting support for hybrid/incremental rendering.

## Result

Milestone 21D is **DONE / LOCALLY VERIFIED / USER ACCEPTED**.
