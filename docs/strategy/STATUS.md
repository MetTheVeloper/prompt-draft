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
Phase 21D Public Discovery/SEO  -> AUDIT COMPLETE / DESIGN BASELINE CREATED / IMPLEMENTATION READY
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

Implementation/design sources remain:

```text
docs/strategy/MILESTONE_21C_PERSONALIZED_DISCOVERY.md
docs/strategy/MILESTONE_21C_IMPLEMENTATION.md
docs/strategy/MILESTONE_21C_HOME_EXPERIENCE.md
```

## Current phase — 21D Public Discovery & SEO Foundation

21D capability audit is complete and its design baseline has been created.

Current rendering invariant:

```text
ssr: false
pnpm generate
static frontend
independent Node API
```

Verified SEO gaps:

```text
no established route-level SEO metadata primitive
no canonical URL helper
robots.txt allows crawling but has no sitemap contract
no documented/generated sitemap pipeline
current acquisition-relevant routes rely heavily on query parameters
no public path-based discovery landing route family exists yet
```

Critical public-content boundary:

```text
/prompts frontend remains authenticated + email-gated
/api/archive remains protected by the same product-content boundary
/api/home/* exposes presentation metadata only
/data/prompts.json historical fallback snapshot contains full prompt content
```

21D rule:

> Public SEO/discovery surfaces must use a sanitized public projection. Do not make protected Prompt bodies public merely for indexing.

Rendering decision:

```text
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
```

Decision:

```text
DO NOT migrate to SSR in 21D by default.
First improve URL/metadata/sitemap/public-discovery architecture under the current static invariant.
Use generated-output/crawler evidence as the trigger for future prerender/hybrid rendering.
```

21D design source:

```text
docs/strategy/MILESTONE_21D_PUBLIC_DISCOVERY_SEO.md
```

Planned first slices:

```text
21D1 SEO/canonical primitive + NUXT_PUBLIC_SITE_URL contract
21D2 six /discover/<slug> public landing routes
21D3 generated sitemap + robots contract
21D4 structured data where authoritative
21D5 generated-output/crawler verification
```

Planned discovery paths:

```text
/discover/portrait-photography
/discover/3d-sculpture
/discover/illustration-animation
/discover/posters-editorial
/discover/product-fashion
/discover/cinematic-game-art
```

## Migration state

Current schema migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
```

21C Home and initial 21D design require no migration.

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
DO NOT return prompt bodies from /api/home/*.
DO NOT remove the current /api/archive prompt-content access boundary merely for SEO.
DO NOT use the full prompt snapshot as the future sanitized public SEO projection.
DO NOT invent hreflang language URLs while i18n strategy remains no_prefix.
DO NOT migrate to SSR without the ADR trigger/evidence gate.
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
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
