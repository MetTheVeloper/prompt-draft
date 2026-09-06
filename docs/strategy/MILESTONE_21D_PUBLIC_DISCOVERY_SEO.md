# Milestone 21D — Public Discovery & SEO Foundation

Status: **FIRST SLICES LOCALLY VERIFIED / TARGETED BUILD-TIME SEO SNAPSHOT IMPLEMENTED / AWAITING GENERATED HTML VERIFICATION**

Branch:

```text
feature/growth-foundation
```

Predecessor:

```text
Milestone 21C — DONE / LOCALLY VERIFIED / USER ACCEPTED
```

Rendering decision:

```text
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
```

## 1. Goal

21D turns the personalized/public-facing discovery experience into an organic-acquisition foundation without exposing protected prompt knowledge and without speculatively replacing the static frontend architecture.

Primary loop:

```text
search / shared public discovery URL
  -> useful category landing surface
  -> published Prompt presentation metadata
  -> protected Prompt detail / sign-in path
  -> product use
```

21D is not Marketplace activation and is not a full SSR migration.

## 2. Capability classification

### Existing — reused

```text
published Prompt Archive catalog
stable Archive public_id
localized Archive titles
canonical relational tags
Archive preview media
published_at
telegramUrl when present
source_user_id provenance when authoritative
six current discovery-interest bundles
multi-tag OR/union semantics
public homepage preview APIs
personalized homepage category sections
static pnpm generate release workflow
Global EN/FA i18n
```

### Extended

```text
public Archive list access
public URL conventions
public discovery category routes
SEO metadata architecture
robots/sitemap contract
sanitized public discovery projection
crawler-oriented build output
structured data where authoritative fields exist
```

### Genuinely new

```text
formal rendering ADR
sitemap generation primitive
canonical SEO helper/contract
path-based public discovery landing page family
sanitized /api/discover feed
post-generate discovery HTML enrichment
crawler/generated-output verification contract
```

### Explicitly not part of 21D

```text
full Product schema
Creator storefront
payments/payout
public full prompt body
public prompt variants
full SSR migration
new referral/economy systems
ratings/reviews
multi-owner content
```

## 3. Current access/content boundary

The obsolete test gate that prevented anonymous users from seeing `/prompts` list content has been removed.

Current intended boundary:

```text
Anonymous user
  -> /prompts list/catalog is visible
  -> GET /api/archive list is public
  -> search/filter/multi-tag/pagination are public
  -> opening full Prompt detail requires existing account + email rule
  -> GET /api/archive/:id remains protected
```

21D public discovery also uses:

```text
GET /api/discover
```

This endpoint intentionally returns presentation metadata only.

Safe public fields include:

```text
public id
localized title
tags
preview media
published date
image count
Telegram link when intentionally public
creator attribution only when authoritative
```

Still protected:

```text
prompt body
variants
private Draft data
internal moderation fields
non-public account fields
```

The historical `public/data/prompts.json` fallback is not used as the 21D SEO feed.

## 4. Public discovery route family

Implemented routes:

```text
/discover/portrait-photography
/discover/3d-sculpture
/discover/illustration-animation
/discover/posters-editorial
/discover/product-fashion
/discover/cinematic-game-art
```

These map to the existing discovery bundles:

```text
portrait-photography
  -> portrait, photography, avatar

3d-sculpture
  -> 3d, sculpture

illustration-animation
  -> illustration, animation-style, anime, cartoon

posters-editorial
  -> poster, editorial

product-fashion
  -> product, fashion

cinematic-game-art
  -> cinematic, game-style, pixel-art
```

The slugs are public acquisition concepts, not replacements for Archive tags.

## 5. SEO metadata contract

Reusable frontend primitive:

```text
app/composables/usePublicSeo.ts
```

Current responsibilities:

```text
title
description
canonical link when NUXT_PUBLIC_SITE_URL exists
og:title
og:description
og:url
og:image when available
og:type
twitter card/title/description/image
robots meta
```

Runtime/build origin:

```text
NUXT_PUBLIC_SITE_URL
```

No production domain is hardcoded.

## 6. Sanitized public discovery API

Implemented endpoint:

```text
GET /api/discover?tag=<tag>&tag=<tag>&limit=<1..20>
```

Properties:

```text
public
published items only
repeated tags use OR/union semantics
max limit 20
returns presentation metadata only
never returns Prompt body or variants
```

Locally verified example:

```text
GET /api/discover?tag=poster&tag=editorial&limit=10 -> 200
```

The returned rows included titles, published dates, Telegram URLs, tags, image counts, preview media and nullable owner attribution only.

Guard locally verified:

```text
GET /api/discover?tag=poster&limit=25 -> 400 Invalid public discovery limit
```

## 7. Sitemap / robots contract

`pnpm generate` invokes:

```text
scripts/generate-public-seo.ts
```

When `NUXT_PUBLIC_SITE_URL` is absent:

```text
production sitemap is intentionally skipped
localhost is never emitted as production truth
```

When configured, sitemap currently contains:

```text
/
/discover/portrait-photography
/discover/3d-sculpture
/discover/illustration-animation
/discover/posters-editorial
/discover/product-fashion
/discover/cinematic-game-art
```

Locally verified with:

```text
NUXT_PUBLIC_SITE_URL=https://example.test
```

Output correctly contained seven absolute URLs.

Generated robots contract:

```text
User-Agent: *
Allow: /
Disallow: /manage
Disallow: /create
Disallow: /login
Sitemap: <site-origin>/sitemap.xml
```

## 8. Generated-output finding

Nuxt successfully emitted all six discovery route files, but the build output explicitly reported:

```text
HTML content not prerendered because ssr: false was set.
```

This proves that route existence + sitemap alone are not enough for crawler-visible discovery content.

ADR-001 therefore selects a targeted intermediate solution rather than switching the whole application to SSR.

## 9. Build-time discovery SEO snapshots

The existing `scripts/generate-public-seo.ts` now enriches each generated `/discover/<slug>/index.html` after Nuxt generation.

For each route it now:

```text
writes route-specific <title>
writes route-specific meta description
writes route-specific Open Graph/Twitter fields
writes canonical + og:url when NUXT_PUBLIC_SITE_URL exists
uses first sanitized preview image as social image when available
writes CollectionPage + ItemList JSON-LD
injects a semantic static discovery snapshot into #__nuxt
```

The static snapshot contains only:

```text
category title/description
link into the existing filtered Prompt Archive
up to 12 sanitized /api/discover rows
title + Persian title
tags
preview image
owner username only when authoritative
link to /prompts?id=<publicId>
```

It never serializes Prompt body or variants.

At runtime the normal Nuxt/Vue SPA mounts into the same root and renders the full interactive page.

### Build-time data source

The post-generate step reads:

```text
NUXT_PUBLIC_API_BASE
```

or local development fallback:

```text
http://127.0.0.1:4000
```

It requests only `/api/discover`.

If that feed is temporarily unavailable, route title/description/structured category shell can still be written, while item snapshot fetches log warnings and remain empty rather than falling back to full Prompt content.

## 10. Structured data

21D currently emits only claims supported by the model:

```text
CollectionPage
ItemList
ListItem
```

It does not emit unsupported commercial schema such as:

```text
Product price
Offer
Review
Rating
availability
creator payout/commercial identity
```

## 11. Locale policy

Current routing remains:

```text
i18n strategy = no_prefix
```

Therefore:

```text
one canonical URL per public page
no fake /en or /fa canonical namespaces
no fake hreflang pairs
runtime UI remains EN/FA
static SEO snapshot uses default English category copy while preserving localized item titles in sanitized content
```

A separate locale-routing decision is required before language-specific SEO URLs exist.

## 12. Public Prompt / Creator URL direction

Current operational links remain:

```text
/prompts?id=<publicId>
/user?un=<username>
```

Future acquisition direction remains compatible with:

```text
/p/<stable-public-id-or-future-slug>
/creator/<username>
```

Those routes are not activated merely to complete 21D.

## 13. Local verification already passed

```text
/api/discover sanitized response -> PASS
/api/discover max-limit guard -> PASS
pnpm generate without NUXT_PUBLIC_SITE_URL -> PASS
sitemap intentional skip without site origin -> PASS
pnpm generate with example site origin -> PASS
six discovery routes included in generation -> PASS
sitemap seven public routes -> PASS
robots rules + absolute sitemap URL -> PASS
raw generated HTML body limitation under ssr:false -> CONFIRMED
```

## 14. Next verification gate

Pull the build-time snapshot implementation and regenerate with the local API running.

Expected post-generate log examples:

```text
[public-seo] enriched /discover/posters-editorial with <n> sanitized items
[public-seo] enriched 6 discovery routes ...
```

Then inspect:

```text
.output/public/discover/posters-editorial/index.html
```

It must contain, before JavaScript execution:

```text
Posters & Editorial · Prompt Draft
route-specific description
canonical URL when site origin configured
data-public-seo-snapshot
application/ld+json
sanitized Prompt titles/cards
no Prompt body
no variants
```

The interactive route must still work normally in the browser after client mount.

21D can move toward closure only after this generated-HTML check passes.

## 15. Rendering decision after current evidence

Do not switch global `ssr:false` yet.

The sequence is now:

```text
static SPA release
  -> targeted build-time public discovery snapshots
  -> crawler/Search Console evidence
  -> only then revisit hybrid/incremental/SSR if needed
```

This preserves the working deployment model while solving the specific acquisition-surface gap proven by generated output.
