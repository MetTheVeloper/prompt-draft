# Milestone 21D — Public Discovery & SEO Foundation

Status: **AUDIT COMPLETE / DESIGN BASELINE CREATED / IMPLEMENTATION READY**

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

21D turns the new personalized/public-facing discovery experience into an organic-acquisition foundation without exposing protected prompt knowledge and without speculatively replacing the static frontend architecture.

Primary loop:

```text
search / shared public discovery URL
  -> useful category landing surface
  -> published Prompt presentation metadata
  -> protected Prompt detail / sign-in path
  -> product use
```

21D is not Marketplace activation and is not an SSR migration.

## 2. Capability classification

### Existing — reuse

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
robots.txt
Global EN/FA i18n
```

### Extension

```text
public URL conventions
public discovery category routes
SEO metadata architecture
robots/sitemap contract
sanitized public discovery projection
crawler-oriented public category content
structured data where authoritative fields exist
```

### Genuinely new

```text
formal rendering ADR
sitemap generation primitive
canonical SEO helper/contract
path-based public discovery landing page family
crawler verification checklist
```

### Explicitly not part of 21D

```text
full Product schema
Creator storefront
payments/payout
public full prompt body
public prompt variants
SSR migration
new referral/economy systems
ratings/reviews
multi-owner content
```

## 3. Current SEO audit findings

Current Nuxt configuration:

```text
ssr: false
i18n strategy: no_prefix
pnpm generate static release
```

Current `app.head` contains:

```text
favicon/PWA links
theme-color
mobile/PWA metadata
Telegram WebApp script
```

Current gap:

```text
no established route-level SEO metadata architecture
no canonical URL helper
no documented sitemap pipeline
robots.txt allows crawling but has no sitemap relationship
```

Current application/public URLs:

```text
/prompts?tag=<tag>&tag=<tag>
/prompts?id=<publicId>
/user?un=<username>
/user?id=<uuid>
```

These remain backward-compatible application routes but are not ideal future acquisition canonicals.

## 4. Critical content-boundary finding

The Prompt Archive application/API intentionally protects prompt content behind authentication + email completion.

At the same time, the historical static fallback snapshot has contained full prompt content.

21D must not widen this mismatch.

Rule:

> SEO/public discovery must use an intentionally sanitized public presentation projection rather than reusing full protected Prompt detail content.

Public acquisition surfaces may expose:

```text
public id
localized title
category/tag relationships
preview image(s)
published date
image count
Telegram link when intentionally public
creator attribution only when authoritative
```

Do not expose in 21D:

```text
prompt body
variants
private Draft data
internal moderation fields
non-public account fields
```

## 5. Canonical discovery route family

21C already established six stable product-level discovery concepts.

21D will give them stable path-based landing URLs:

```text
/discover/portrait-photography
/discover/3d-sculpture
/discover/illustration-animation
/discover/posters-editorial
/discover/product-fashion
/discover/cinematic-game-art
```

These route slugs are public acquisition concepts, not database tag replacements.

They map to the existing Archive tag bundles:

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

Each landing route should provide:

```text
strong category title
short useful category description
preview media/published Prompt cards
CTA into the protected Prompt Archive/product flow
canonical URL metadata
Open Graph/Twitter metadata
```

The route must remain useful even if some mapped tags are absent from the current live Archive.

## 6. Public Prompt URL direction

Do not rewrite existing Prompt detail routing inside this first 21D slice.

Current stable identifier already exists:

```text
prompt_archive_items.public_id
```

Future canonical Prompt path direction:

```text
/p/<public-id>
```

A future slug can be layered only if a real slug field/canonicalization policy is introduced.

Do not derive fragile canonical slugs from mutable localized titles in 21D.

Existing:

```text
/prompts?id=<publicId>
```

remains operational until a dedicated public Prompt presentation route is implemented.

## 7. Creator URL direction

Existing public profile resolution is already available by username.

Current route:

```text
/user?un=<username>
```

Future public canonical direction may become:

```text
/creator/<username>
```

Do not activate that route in the first 21D slice unless the profile body can be rendered as a deliberately public acquisition page without breaking current profile behavior.

21D should preserve compatibility with existing `/user` links.

## 8. SEO metadata contract

Create one reusable public SEO primitive rather than route-specific ad hoc head blocks.

Proposed frontend primitive:

```text
app/composables/usePublicSeo.ts
```

Inputs:

```text
title
description
canonicalPath
imageUrl optional
contentType optional
noindex optional
```

Responsibilities:

```text
title / title template
description
canonical link
og:title
og:description
og:url
og:image when available
og:type
twitter:card
twitter:title
twitter:description
twitter:image when available
robots meta when explicitly noindex
```

Canonical absolute URLs require an explicit public site origin.

Proposed runtime/build config:

```text
NUXT_PUBLIC_SITE_URL
```

Do not hardcode a production domain that is not yet canonical.

If `NUXT_PUBLIC_SITE_URL` is absent in development, the helper may omit absolute canonical/OG URL fields rather than emit localhost as production truth.

## 9. Sitemap contract

21D should introduce a generated sitemap rather than a permanently hand-written list.

Initial sitemap content:

```text
/
/discover/portrait-photography
/discover/3d-sculpture
/discover/illustration-animation
/discover/posters-editorial
/discover/product-fashion
/discover/cinematic-game-art
```

Do not include authenticated/manage/editor routes.

Do not include query-string variants as separate sitemap URLs.

Later, when stable public Prompt and Creator path routes exist, add them from a sanitized public index feed.

Sitemap generation must use `NUXT_PUBLIC_SITE_URL` for absolute URLs.

If no production site URL is configured during local generation, sitemap generation should fail clearly or intentionally skip the production file according to the final implementation decision; it must not silently publish localhost URLs.

## 10. robots.txt contract

Current file:

```text
User-Agent: *
Disallow:
```

21D should keep public crawling allowed but explicitly protect obviously non-public application surfaces where crawler traffic is useless.

Candidate rules:

```text
Disallow: /manage
Disallow: /create
Disallow: /login
```

Whether `/user` or `/prompts` should be disallowed depends on the public-route migration slice; do not block them blindly while current shared links may depend on them.

When production site URL exists, robots should include:

```text
Sitemap: <site-origin>/sitemap.xml
```

## 11. Structured data

Only add structured data where the current model has authoritative fields.

Safe first candidates:

```text
WebSite on the home page
CollectionPage / ItemList on discovery category pages
```

Do not claim:

```text
Product pricing
Review/rating
Offer availability
Creator commercial identity
```

because those primitives do not exist yet.

Prompt Archive entries are not yet commercial `Product` entities.

## 12. Locale policy

Current i18n routing:

```text
strategy = no_prefix
```

Therefore the same public URL can render EN or FA client-side.

21D V1 will not invent separate language URLs and will not emit fake hreflang pairs.

A separate locale-routing decision is required before language-specific canonical URLs exist.

SEO copy for static discovery concepts should still exist in both locale files for in-app consistency.

## 13. Implementation slices

### 21D1 — SEO foundation

```text
NUXT_PUBLIC_SITE_URL runtime/build config
usePublicSeo composable
global default title/description/OG site metadata
safe canonical URL construction
```

### 21D2 — Public discovery routes

```text
six /discover/<slug> routes
reuse existing discovery definitions/tag bundles
sanitized public showcase data
strong EN/FA landing copy
CTA into current product flow
```

### 21D3 — Sitemap / robots

```text
generated sitemap.xml
robots review
exclude non-public app routes from sitemap
```

### 21D4 — Structured data

```text
WebSite schema
CollectionPage/ItemList where valid
```

### 21D5 — Verification

```text
pnpm generate
inspect generated HTML/head behavior
inspect sitemap/robots
verify public APIs contain no prompt body/variants
verify canonical URLs with production-like NUXT_PUBLIC_SITE_URL
verify Dark/Light and EN/FA landing UI
```

## 14. Rendering limitation / gate

Because `ssr:false` is currently intentional, 21D must distinguish two different wins:

```text
A. correct public URL/metadata/indexing architecture
B. crawler-visible route-specific rendered HTML body
```

A can be implemented now.

If B is not reliably achieved under the current build mode, do not fake success. Record the generated-output evidence and use it as the trigger to select build-time prerender or hybrid rendering under ADR-001.

## 15. First coding gate

Before changing rendering architecture:

1. implement the route/metadata/sitemap primitives that are valid under the current invariant;
2. generate locally;
3. inspect actual `.output/public` HTML/head output;
4. decide from evidence whether route-specific discovery pages are sufficiently crawler-visible.

No SSR switch is permitted merely to make the implementation easier.
