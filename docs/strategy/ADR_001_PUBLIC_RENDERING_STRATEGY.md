# ADR-001 — Public Rendering Strategy for Discovery / SEO

Status: **CURRENT STATIC INVARIANT RETAINED / TARGETED BUILD-TIME SEO SNAPSHOTS SELECTED**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Context phase:

```text
Milestone 21D — Public Discovery & SEO Foundation
```

## Decision

Prompt Draft will **not** migrate the application to SSR during Milestone 21D.

The current release invariant remains:

```text
Nuxt ssr: false
pnpm generate
static frontend artifact
independent Node API
```

21D improves URL architecture, public discovery routes, crawler metadata, sitemap/robots behavior and sanitized public-content projection within that invariant.

Generated-output verification has now proved one limitation of the raw Nuxt SPA artifact:

```text
HTML content not prerendered because ssr: false was set.
```

Therefore 21D selects a targeted intermediate technique:

```text
Nuxt still generates the SPA/static artifact
  -> post-generate SEO step enriches only /discover/* HTML
  -> route-specific title/description/canonical/OG metadata is written into HTML
  -> sanitized semantic discovery content is injected into the Nuxt root
  -> CollectionPage/ItemList JSON-LD is written where authoritative
  -> the normal client application mounts over that static snapshot at runtime
```

This is **not** full SSR and is **not** a public Prompt-body export.

The build-time snapshot reads only the dedicated sanitized `/api/discover` projection and never serializes Prompt body/variants.

## Current capability audit

Verified current configuration:

```text
nuxt.config.ts -> ssr: false
pnpm generate is the release build
Nitro prerender list exists, but SPA mode means route output is still client-rendered application content
independent API defaults to http://127.0.0.1:4000 in development
@nuxtjs/i18n uses strategy=no_prefix
```

Verified current SEO surface before 21D:

```text
no established route-level SEO metadata primitive
app.head contained PWA/favicon/mobile metadata but no full public SEO architecture
robots.txt allowed all crawlers
no sitemap generation contract
Prompt Archive user-facing route used /prompts and query parameters
Prompt detail used /prompts?id=<publicId>
public user profile used /user?un=<username> or /user?id=<uuid>
```

Verified public-content boundary after the 21D list-access correction:

```text
/prompts list/catalog is public
GET /api/archive list is public
GET /api/archive/:id full Prompt detail remains authenticated + email-gated
/api/discover is public and presentation-only
/api/home/hero-media and /api/home/showcase are public presentation-only feeds
public/data/prompts.json remains a historical full-content fallback artifact and is not used as the SEO projection
```

## Generated-output evidence — 2026-09-06

Local verification produced both expected positive results and one important rendering limitation.

Verified:

```text
GET /api/discover?tag=poster&tag=editorial&limit=10 -> 200
response returned sanitized published presentation rows
no Prompt body/variants were present
GET /api/discover?tag=poster&limit=25 -> 400
pnpm generate -> PASS
six /discover/* routes included in Nuxt generation
NUXT_PUBLIC_SITE_URL unset -> production sitemap intentionally skipped
NUXT_PUBLIC_SITE_URL=https://example.test -> sitemap generated for 7 routes
robots.txt included the absolute sitemap URL and excluded /manage, /create and /login
```

Critical generated-output evidence:

```text
HTML content not prerendered because ssr: false was set.
```

Conclusion:

> Correct route files and sitemap entries alone are not enough. The raw SPA-generated discovery HTML needs route-specific crawler-visible content before 21D can be considered an SEO foundation.

This evidence activates the targeted build-time snapshot path described above, not a global SSR migration.

## Options considered

### Option A — Keep SPA/static architecture and improve crawlable shell/public static surfaces

Advantages:

```text
no deployment architecture migration
keeps existing release workflow
lowest operational risk
works with current independent API
lets us establish URL/metadata/indexing contracts before choosing a renderer
```

Limitation now confirmed by local evidence:

```text
raw ssr:false route output does not include route-specific rendered page body
```

Decision for 21D: **YES, with targeted post-generate discovery snapshots.**

### Option B — Build-time prerender of every public content page

Potential future shape:

```text
/discover/<category>
/p/<public-id-or-slug>
/@<username> or /creator/<username>
```

Advantages:

```text
real HTML per public URL
strong SEO without a persistent frontend SSR server
compatible with static hosting
```

Limitations:

```text
build duration grows with catalog size
new Creator publishing is not visible until rebuild/deploy
requires a sanitized/public build-time content feed
```

Decision for 21D: **partially selected for the six discovery routes only through lightweight post-generation HTML enrichment; not selected as an application-wide rendering mode.**

### Option C — Incremental regeneration / on-demand static rendering

Advantages:

```text
static-like delivery
better freshness for growing public catalogs
reduces full-build pressure
```

Limitations:

```text
requires hosting/runtime support not present in the current static artifact contract
adds cache invalidation/revalidation semantics
```

Decision for 21D: **defer**.

### Option D — Full SSR

Advantages:

```text
fresh route-specific HTML
straightforward dynamic Creator/Product pages
server-generated metadata per request
```

Limitations:

```text
changes deployment model materially
adds frontend server/runtime operational cost
couples public availability to rendering runtime
unnecessary at current catalog scale without evidence
```

Decision for 21D: **do not adopt speculatively**.

### Option E — Hybrid rendering

Potential future model:

```text
marketing/category pages -> prerender/static
public Product/Creator pages -> prerender or incremental
authenticated editor/manage -> SPA/client-heavy
```

Advantages:

```text
best semantic fit for Prompt Draft's mixed public/private product
keeps interactive authenticated application client-oriented
lets public acquisition surfaces optimize for crawlers independently
```

Limitations:

```text
requires an explicit Nuxt rendering/deployment transition
more routing/deployment complexity than current SPA
```

Decision for 21D: **likely long-term target, but not activated yet**.

## Migration triggers

Revisit this ADR when one or more of the following become true.

### Catalog/page-volume trigger

```text
public indexable pages become large enough that targeted/static generation materially slows releases
```

### Freshness trigger

```text
Creator publishing/product updates need search-visible HTML faster than the normal build/deploy cadence
```

### SEO evidence trigger

```text
Search Console/crawler diagnostics show the enriched static discovery HTML is still not reliably indexed or lacks required route-specific content/meta
```

### Creator/Marketplace trigger

```text
dynamic Creator/Product pages become a primary acquisition surface and publish frequently
```

### Deployment trigger

```text
hosting gains reliable support for hybrid/edge/incremental rendering and the operational tradeoff becomes favorable
```

## Public URL direction

21D moves away from query parameters as the *future canonical acquisition contract* while preserving application compatibility.

Current application URLs remain:

```text
/prompts?tag=poster&tag=editorial
/prompts?id=9002
/user?un=grass
```

Public acquisition direction:

```text
/discover/posters-editorial
/p/<stable-public-id-or-future-slug>
/creator/<username>
```

Exact Product and Creator canonical routes remain deferred until those public presentation contracts exist.

## Language/indexing decision

Current i18n uses `no_prefix`, so English and Persian do not currently have separate canonical route namespaces.

Until locale URL architecture is explicitly changed:

```text
one canonical URL per public page
runtime locale may change client presentation
no hreflang URL pairs for nonexistent language-specific paths
build-time discovery SEO snapshot uses the default English public copy
```

## Security/content boundary decision

SEO work uses a **sanitized public projection**.

Do not make the protected Prompt-detail API public merely for indexing.

Do not use the historical full prompt snapshot as the SEO feed.

Public discovery/indexing data may contain only intentionally public information such as:

```text
stable public identifier
localized title
tags
preview media
published date
creator attribution when authoritative
public category/discovery relationship
```

Prompt body, variants and private Draft data remain outside this projection.

## 21D implementation consequence

Current 21D path:

```text
D1 canonical URL + SEO metadata contract                  -> implemented
D2 six path-based public discovery landing routes         -> implemented
D3 sanitized /api/discover projection                     -> implemented / locally verified
D4 generated sitemap + robots contract                    -> implemented / locally verified
D5 generated-output inspection                            -> completed; raw SPA body insufficient
D6 targeted build-time discovery SEO snapshots            -> implemented / awaiting local verification
D7 final generated HTML/crawler inspection                -> next gate
```

No full SSR migration is required for these slices.
