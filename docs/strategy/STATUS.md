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
Phase 21C Preferences/Discovery -> BASE SLICE LOCALLY VERIFIED / HOME EXPERIENCE EXTENSION IMPLEMENTED / AWAITING LOCAL VERIFICATION
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

21A verification source:

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
successful signup still creates canonical referrals row
referred user gets existing +500 referral_joined reward
referrer gets existing +1000 referral_reward reward
invited-user count refreshes from referrals
pnpm generate PASS
```

Canonical closure:

```text
docs/strategy/MILESTONE_21B_VERIFICATION.md
```

## Current phase — 21C User Preferences & Personalized Discovery

The base preference/discovery slice is locally verified by the user.

Verified base capabilities:

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
multi-tag personalized deep links work
pnpm generate PASS
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

## 21C personalized home experience extension

The initial homepage selector proved preference persistence but did not yet make the homepage itself meaningfully personalized.

The current extension is implemented and awaiting local verification.

New reusable preference UI:

```text
app/components/growth/DiscoveryPreferencesModal.vue
app/composables/useDiscoveryPreferencesModal.ts
```

Behavior:

```text
signed-in user with no interests -> modal opens on homepage
existing interests -> no automatic modal
same modal can be reopened through Tune my feed
preference persistence remains user_preferences
```

New homepage preview APIs:

```text
GET /api/home/hero-media?tag=...&limit=50
GET /api/home/showcase?tag=...&limit=5
```

Both endpoints:

```text
use repeated tags with OR/union semantics
read published Archive presentation data only
do not return prompt bodies or variants
leave /api/archive prompt-content access rules unchanged
```

Hero behavior:

```text
visual/tile existing explicit sources support is reused
selected-interest tags -> random Archive media sample up to 50
no preferences/anonymous -> broad Archive media sample
API failure -> existing static slider remains fallback
hero copy rewritten for current product/discovery model
bottom-centered scroll affordance leads to discovery feed
```

Showcase feed behavior:

```text
one immersive section per current interest category
all six categories remain discoverable
selected categories are ordered first
up to five newest matching Archive items per section
active item's preview covers section background
autoplay + previous/next + position controls
category title/description + active item title + tags
published date + preview count
owner avatar/username only when source_user_id provides authoritative active-user provenance
View Prompt + conditional Telegram actions
```

Responsive composition uses existing `useScreen()`:

```text
mobile            -> full-width section
 tablet / laptop  -> up to two half-width sections
 desktop / wide   -> up to three one-third-width sections
```

A six-track grid balances odd remainders without empty cells while keeping every row one viewport high.

Canonical extension design/verification handoff:

```text
docs/strategy/MILESTONE_21C_HOME_EXPERIENCE.md
```

## Important access boundary carried forward

```text
/api/home/* exposes homepage media/presentation metadata only
/api/archive still owns protected Archive prompt reads
Archive detail still exposes prompt + variants only through its current access rules
/data/prompts.json fallback snapshot still contains full prompt content
```

Strategic consequence:

> The home experience can showcase public-facing media and metadata without prematurely solving the broader 21D public discovery/SEO contract.

## Migration state

Current schema migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
```

The current home extension requires no migration.

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
DO NOT silently merge anonymous preferences into an account in 21C V1.
DO NOT fabricate ownership for legacy/managed Archive items without source_user_id.
DO NOT introduce multi-ownership in this milestone.
DO NOT return prompt bodies from /api/home/*.
DO NOT remove the current /api/archive prompt-content access boundary here.
DO NOT break pnpm generate without an explicit rendering architecture decision.
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
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
