# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Exact branch baseline was realigned to the final Docker/backend handoff commit:

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
Milestone 21 Growth Foundation  -> SELECTED
Phase 21A capability audit      -> COMPLETE
Phase 21A analytics design      -> COMPLETE
Phase 21A implementation        -> NOT STARTED
```

## Important 21A audit findings

```text
/prompts frontend currently requires logged-in user + email before loading Archive
/api/archive backend currently enforces the same login+email requirement
Archive list projection does not expose full prompt text
Archive detail projection does expose prompt + variants
/data/prompts.json fallback snapshot currently contains full prompt content
Prompt copy is currently client-side and has no server analytics/access record
```

Strategic consequence:

> Future Growth/SEO/Marketplace work must separate public discovery metadata from protected/unlocked sellable knowledge rather than simply making the current full Archive detail contract public.

## Current next step

Implement the first **Phase 21A — Behavioral Analytics Foundation** slice defined in:

```text
docs/strategy/MILESTONE_21A_ANALYTICS_DESIGN.md
```

Implementation order:

1. create `020_product_analytics_events.sql`;
2. add focused backend analytics event module/API;
3. add focused frontend analytics composable;
4. instrument successful Archive detail view and successful Prompt copy;
5. verify event dedupe, optional auth identity and non-blocking failure behavior;
6. query PostgreSQL for proof;
7. run `pnpm generate`;
8. mark DONE only after local user verification.

## Hard rules

```text
DO NOT use admin_audit_log as behavioral analytics.
DO NOT use user_score_events as a generic analytics warehouse.
DO NOT create a second XP/referral/auth/admin system.
DO NOT trust analytics events as economic/payout authority.
DO NOT put prompt text or sellable knowledge into analytics metadata.
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
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
