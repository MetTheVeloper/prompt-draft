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
Phase 21C Preferences/Discovery -> FIRST PRODUCT SLICE IMPLEMENTED / AWAITING LOCAL VERIFICATION
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

Verified example:

```text
referrer = grass
referred = m010
referral id = 5f63047f-6d5e-40dd-a2b9-00460a57c8d3
Invited users = 3 -> 4
```

Canonical closure:

```text
docs/strategy/MILESTONE_21B_VERIFICATION.md
```

## Current phase — 21C User Preferences & Personalized Discovery

Capability audit found:

```text
no persisted account-level discovery preference model exists
the homepage is currently generic/static
Archive already has canonical relational tags and tag filtering
/prompts did not previously initialize its tag filter from ?tag=
current Archive content is heavily visual and already supports meaningful interest clusters
future Programming/Education/Marketing domains are not yet distinct enough to ask users to choose them
```

Design source:

```text
docs/strategy/MILESTONE_21C_PERSONALIZED_DISCOVERY.md
```

First implemented slice:

```text
021_user_preferences.sql
user_preferences one-row-per-user persistence
GET /api/preferences/discovery
PUT /api/preferences/discovery
useDiscoveryPreferences frontend primitive
six current visual interest clusters
signed-in homepage onboarding
For you homepage state after save
Edit interests flow
/prompts?tag=<slug> -> existing Archive tag filter initialization
EN/FA Growth locale fragment
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

Primary discovery routes:

```text
portrait_photography    -> /prompts?tag=portrait
three_d_sculpture       -> /prompts?tag=3d
illustration_animation  -> /prompts?tag=illustration
poster_editorial        -> /prompts?tag=poster
product_fashion         -> /prompts?tag=product
cinematic_game_art      -> /prompts?tag=cinematic
```

V1 ownership boundary:

```text
anonymous visitor -> generic homepage
signed-in user     -> account-level server preferences
no silent anonymous -> account preference merge
```

Current verification handoff:

```text
docs/strategy/MILESTONE_21C_IMPLEMENTATION.md
```

## Important Growth architecture finding carried forward

```text
/prompts frontend requires logged-in user + email before Archive content loads
/api/archive backend enforces the same login+email requirement
Archive list projection does not expose full prompt text
Archive detail projection does expose prompt + variants
/data/prompts.json fallback snapshot currently contains full prompt content
```

Strategic consequence:

> 21C may personalize routes into the current Archive, but it must not remove the Archive access boundary. Public discovery metadata versus protected sellable knowledge is a 21D concern.

## Migration state

Current schema migrations now extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
```

The next future schema migration after 21C must use:

```text
022_*.sql
```

unless `021` is changed before local acceptance and branch history is deliberately rewritten, which is not the default workflow.

## Hard rules

```text
DO NOT use admin_audit_log as behavioral analytics.
DO NOT use user_score_events as a generic analytics warehouse.
DO NOT create a second XP/referral/auth/admin/profile system.
DO NOT trust analytics events as economic/payout authority.
DO NOT put prompt text or sellable knowledge into analytics metadata.
DO NOT treat referral_link_open as authoritative referral success.
DO NOT store user preferences in analytics or the score ledger.
DO NOT replace canonical Archive tags with user-interest keys.
DO NOT show future preference domains that do not yet change the product experience.
DO NOT silently merge anonymous preferences into an account in 21C V1.
DO NOT make protected Archive content public in 21C.
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
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
