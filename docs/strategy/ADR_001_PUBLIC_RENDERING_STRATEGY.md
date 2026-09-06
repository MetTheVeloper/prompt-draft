# ADR-001 — Public Rendering Strategy for Discovery / SEO

Status: **ACCEPT CURRENT STATIC INVARIANT / DEFINE MIGRATION TRIGGERS**

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

21D will first improve URL architecture, crawler-visible static metadata/assets, discovery landing conventions, sitemap/robots behavior and public-content boundaries within that invariant.

A rendering migration is deferred until an observable trigger justifies it.

## Current capability audit

Verified current configuration:

```text
nuxt.config.ts -> ssr: false
pnpm generate is the release build
Nitro prerender list exists, but SPA mode means route output is still client-rendered application content
independent API defaults to http://127.0.0.1:4000 in development
@nuxtjs/i18n uses strategy=no_prefix
```

Verified current SEO surface:

```text
no existing useSeoMeta implementation found
app.head contains PWA/favicon/mobile metadata but no full product SEO metadata architecture
public/robots.txt currently allows all crawlers
no current sitemap contract is documented
Prompt Archive user-facing route uses /prompts and query parameters
Prompt detail uses /prompts?id=<publicId>
public user profile uses /user?un=<username> or /user?id=<uuid>
```

Verified public-content boundary:

```text
/prompts frontend requires authenticated user + email
/api/archive backend enforces the same protected-content boundary
/api/home/hero-media and /api/home/showcase expose published presentation metadata only
public/data/prompts.json fallback historically contains full prompt content
```

That last item is a critical 21D boundary issue: protected API semantics and a publicly shipped full-content snapshot must not be treated as equivalent security boundaries.

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

Limitations:

```text
route-specific client content is not guaranteed to be present in generated HTML
query-param detail pages are weak canonical SEO surfaces
large dynamic Creator/Product catalogs will eventually outgrow this approach
```

Decision for 21D: **YES**.

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

Decision for 21D: **design-compatible, not selected globally yet**.

This is the preferred first migration candidate if page volume and build latency remain manageable.

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
public indexable pages become large enough that full static generation materially slows releases
```

Initial operational signal:

```text
public-route generation becomes a significant share of release time or starts failing due to page volume
```

### Freshness trigger

```text
Creator publishing/product updates need search-visible HTML faster than the normal build/deploy cadence
```

### SEO evidence trigger

```text
Search Console/crawler diagnostics show client-rendered discovery pages are not reliably indexed or lack route-specific content/meta despite correct URL/sitemap setup
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

21D should move away from query parameters as the *future canonical acquisition contract*.

Current application URLs remain backward-compatible:

```text
/prompts?tag=poster&tag=editorial
/prompts?id=9002
/user?un=grass
```

Future public canonical conventions should be path-based and stable, for example:

```text
/discover/posters-editorial
/p/<stable-public-id-or-future-slug>
/creator/<username>
```

Exact Product and Creator canonical routes must be finalized without inventing Marketplace primitives that do not exist yet.

For 21D, six discovery landing routes are safe because the six interest bundles already exist as product-level discovery concepts.

## Language/indexing decision

Current i18n uses `no_prefix`, so English and Persian do not currently have separate canonical route namespaces.

21D must therefore avoid pretending that `/en/...` and `/fa/...` public URL contracts already exist.

Until locale URL architecture is explicitly changed:

```text
one canonical URL per public page
runtime locale may change client presentation
no hreflang URL pairs should be emitted for nonexistent language-specific paths
```

A future locale-routing ADR can change this.

## Security/content boundary decision

SEO work must use a **sanitized public projection**.

Do not make the existing protected prompt-detail API public merely for indexing.

Do not use a public snapshot containing full sellable prompt text as the future SEO feed.

Public discovery/indexing data should contain only information intentionally public, such as:

```text
stable public identifier
localized title
public summary/description when available
tags
preview media
published date
creator attribution when authoritative
public category/discovery relationship
```

Prompt body, variants and private Draft data remain outside this projection unless a later commercial access policy explicitly changes them.

## 21D implementation consequence

The first 21D implementation slices should therefore be:

```text
D1 canonical URL + SEO metadata contract
D2 robots/sitemap generation contract
D3 six path-based public discovery landing routes
D4 sanitized public discovery projection suitable for those routes
D5 structured data only where the data model actually supports it
D6 crawler/build verification
```

No SSR migration is required for these slices.

If crawler-visible page body content proves insufficient under `ssr:false`, that evidence becomes a trigger to revisit build-time prerender/hybrid rendering rather than silently changing architecture mid-milestone.
