# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Exact Growth branch baseline:

```text
3ef4b0c65777d6f2814744ed0a1fa8a78750a389
```

## Current state

```text
Docker/backend Milestones 1–20 -> inherited COMPLETE baseline
Product Strategy V1            -> documented / approved direction
Founder Discovery Q&A V1       -> documented
Marketplace Product Model       -> documented
Content Graph & Lineage         -> documented
Execution Layer                 -> documented
Pricing/Internal Economy V1     -> documented
Execution Roadmap V1            -> documented
Milestone 21 Growth Foundation  -> IN PROGRESS
Phase 21A Analytics             -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21B Referral Activation   -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21C Preferences/Discovery -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21D Public Discovery/SEO  -> CORE PUBLIC/API/SITEMAP VERIFIED / BUILD-TIME SEO SNAPSHOT IMPLEMENTED / AWAITING GENERATED HTML VERIFICATION
```

## 21A closure

Dedicated Behavioral Analytics exists through:

```text
backend/sql/020_product_analytics_events.sql
backend/src/productAnalytics.mjs
app/composables/useProductAnalytics.ts
POST /api/analytics/events
```

Verified events include:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

Canonical closure:

```text
docs/strategy/MILESTONE_21A_VERIFICATION.md
```

## 21B closure

Referral Growth Activation is closed and locally accepted.

Verified full loop:

```text
Profile Menu copies /login?ref=<username>
valid referral URL prefills existing registration field
malformed URL referral is ignored
referral_link_open records landing observation
successful signup creates canonical referrals row
referred user receives existing +500 referral_joined reward
referrer receives existing +1000 referral_reward reward
invited-user count refreshes from referrals
pnpm generate PASS
```

Canonical closure:

```text
docs/strategy/MILESTONE_21B_VERIFICATION.md
```

## 21C closure — User Preferences & Personalized Discovery

21C is fully closed and user accepted.

Verified persistence/discovery foundation:

```text
021_user_preferences.sql
user_preferences one-row-per-user persistence
GET /api/preferences/discovery
PUT /api/preferences/discovery
six current visual interest clusters
multi-tag bundles per interest
/prompts uses el-multi-select for tags
/api/archive supports repeated tag query parameters with OR/union semantics
/prompts query parameters restore real existing tags on load
invalid/nonexistent URL tags are reconciled away
multi-tag personalized deep links work
```

Current V1 interest keys:

```text
portrait_photography
three_d_sculpture
illustration_animation
poster_editorial
product_fashion
cinematic_game_art
```

Current bundles:

```text
portrait_photography    -> portrait, photography, avatar
three_d_sculpture       -> 3d, sculpture
illustration_animation  -> illustration, animation-style, anime, cartoon
poster_editorial        -> poster, editorial
product_fashion         -> product, fashion
cinematic_game_art      -> cinematic, game-style, pixel-art
```

Verified personalized-home extension:

```text
reusable global discovery-preferences modal
signed-in/no interests -> modal auto-opens on home
Tune my feed reopens the same modal
full-screen tiled hero reused with dynamic Archive media sources
up to 50 hero media rows from selected-interest tag bundles
public presentation-only /api/home/hero-media
public presentation-only /api/home/showcase
six immersive category showcase sections
selected categories ordered first
up to five Archive items per category
responsive 1/2/3-column layout using useScreen
section height = real viewport below Header
Dark/Light theme-aware overlays/text/buttons
final Hero/Modal theme bugs fixed
pnpm generate PASS after final polish
```

Canonical closure:

```text
docs/strategy/MILESTONE_21C_VERIFICATION.md
```

## Current phase — 21D Public Discovery & SEO Foundation

21D capability audit and ADR are complete. Core public discovery/API/sitemap behavior has now been locally verified.

Current rendering invariant remains:

```text
ssr: false
pnpm generate
static frontend
independent Node API
```

Rendering decision:

```text
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
```

Current decision:

```text
DO NOT migrate the full application to SSR.
Use targeted build-time SEO snapshots for the six public /discover/* routes.
Revisit hybrid/incremental/SSR only from crawler/freshness/page-volume evidence.
```

### Public Archive access correction

The obsolete test-only Archive list gate has been removed.

Current intended boundary:

```text
/prompts list/catalog -> public
GET /api/archive -> public
search/sort/multi-tag/pagination -> public
/prompts?id=<id> full detail -> existing account + email gate
GET /api/archive/:id -> existing account + email gate
```

This lets anonymous visitors browse the catalog without exposing Prompt body/variants.

### Implemented 21D foundation

```text
NUXT_PUBLIC_SITE_URL runtime config
usePublicSeo reusable SEO/canonical primitive
global product title/description/OG defaults
stable slug on each of the six existing discovery definitions
GET /api/discover sanitized public presentation endpoint
/discover/[slug] public landing route
PublicDiscoveryCard public presentation component
six discovery routes included in generated route list
EN/FA public-discovery copy
robots crawler boundaries
post-generate sitemap/robots enrichment
post-generate discovery HTML enrichment
```

Public discovery routes:

```text
/discover/portrait-photography
/discover/3d-sculpture
/discover/illustration-animation
/discover/posters-editorial
/discover/product-fashion
/discover/cinematic-game-art
```

Sanitized endpoint contract:

```text
GET /api/discover?tag=<slug>&tag=<slug>&limit=<1..20>
published items only
OR/union tag semantics
presentation metadata only
no prompt body
no variants
```

### Locally verified 21D behavior

Verified on 2026-09-06:

```text
GET /api/discover?tag=poster&tag=editorial&limit=10 -> 200
sanitized rows returned correctly
GET /api/discover?tag=poster&limit=25 -> 400
pnpm generate without NUXT_PUBLIC_SITE_URL -> PASS
production sitemap skipped when site origin absent
pnpm generate with NUXT_PUBLIC_SITE_URL=https://example.test -> PASS
24 Nuxt routes generated including all six /discover/* routes
sitemap.xml generated for 7 public URLs
robots.txt contains /manage, /create, /login exclusions + absolute Sitemap line
```

Generated-output evidence also confirmed:

```text
HTML content not prerendered because ssr: false was set.
```

That evidence proved that the raw Nuxt SPA route files do not contain sufficient route-specific body content for the SEO goal.

### Current build-time SEO snapshot implementation

`scripts/generate-public-seo.ts` now enriches each generated discovery route after `nuxt generate`.

It writes:

```text
route-specific title
route-specific description
canonical + og:url when site origin exists
Open Graph/Twitter metadata
first sanitized preview image when available
CollectionPage + ItemList JSON-LD
semantic data-public-seo-snapshot body inside #__nuxt
up to 12 sanitized /api/discover items
```

The snapshot source is only:

```text
/api/discover
```

It never uses the historical full Prompt snapshot as its SEO data source and never serializes Prompt body/variants.

If the public discovery API is temporarily unavailable during generation, category-level SEO content still emits and item-level snapshot rows are skipped with warnings.

### Current verification gate

Regenerate with the local API running, then inspect:

```text
.output/public/discover/posters-editorial/index.html
```

Must contain before JavaScript execution:

```text
Posters & Editorial · Prompt Draft
route-specific description
data-public-seo-snapshot
application/ld+json
canonical when NUXT_PUBLIC_SITE_URL exists
sanitized Prompt titles/previews
no Prompt body
no variants
```

The interactive `/discover/posters-editorial` page must still mount and behave normally in browser after the static snapshot is replaced by Vue.

## Migration state

Current schema migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
```

21D requires no schema migration.

Next future schema migration:

```text
022_*.sql
```

## Hard rules

```text
DO NOT use admin_audit_log as behavioral analytics.
DO NOT use user_score_events as a generic analytics warehouse.
DO NOT create a second XP/referral/auth/admin/profile system.
DO NOT trust analytics events as economic/payout authority.
DO NOT put prompt text or sellable knowledge into analytics metadata.
DO NOT store user preferences in analytics or the score ledger.
DO NOT replace canonical Archive tags with user-interest keys.
DO NOT fabricate ownership for legacy/managed Archive items without source_user_id.
DO NOT introduce multi-ownership in Milestone 21.
DO NOT return prompt bodies from /api/home/* or /api/discover.
DO NOT make /api/archive/:id public merely for SEO.
DO NOT use the full prompt snapshot as the future sanitized public SEO projection.
DO NOT invent hreflang language URLs while i18n strategy remains no_prefix.
DO NOT publish localhost canonical/sitemap URLs as production truth.
DO NOT migrate the full application to SSR without a new evidence gate.
DO NOT start full Marketplace commerce inside Milestone 21.
```

## Primary sources

```text
docs/strategy/README.md
docs/strategy/PRODUCT_STRATEGY_V1.md
docs/strategy/FOUNDER_DISCOVERY_QA_V1.md
docs/strategy/EXECUTION_ROADMAP_V1.md
docs/strategy/MILESTONE_21_GROWTH_FOUNDATION.md
docs/strategy/MILESTONE_21A_ANALYTICS_DESIGN.md
docs/strategy/MILESTONE_21A_IMPLEMENTATION.md
docs/strategy/MILESTONE_21A_VERIFICATION.md
docs/strategy/MILESTONE_21B_REFERRAL_GROWTH.md
docs/strategy/MILESTONE_21B_IMPLEMENTATION.md
docs/strategy/MILESTONE_21B_VERIFICATION.md
docs/strategy/MILESTONE_21C_PERSONALIZED_DISCOVERY.md
docs/strategy/MILESTONE_21C_IMPLEMENTATION.md
docs/strategy/MILESTONE_21C_HOME_EXPERIENCE.md
docs/strategy/MILESTONE_21C_VERIFICATION.md
docs/strategy/MILESTONE_21D_PUBLIC_DISCOVERY_SEO.md
docs/strategy/MILESTONE_21D_IMPLEMENTATION.md
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
