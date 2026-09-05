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
Phase 21A implementation        -> IMPLEMENTED / AWAITING LOCAL VERIFICATION
```

## Important 21A audit findings

```text
/prompts frontend currently requires logged-in user + email before loading Archive
/api/archive backend currently enforces the same login+email requirement
Archive list projection does not expose full prompt text
Archive detail projection does expose prompt + variants
/data/prompts.json fallback snapshot currently contains full prompt content
Prompt copy was client-side and had no server analytics/access record before 21A
```

Strategic consequence:

> Future Growth/SEO/Marketplace work must separate public discovery metadata from protected/unlocked sellable knowledge rather than simply making the current full Archive detail contract public.

## Implemented 21A slice awaiting verification

```text
020_product_analytics_events.sql
product_analytics_events table + focused indexes
POST /api/analytics/events
optional backend-resolved auth identity
anonymous_id + session_id + event_id identity model
strict event/metadata validation
same-event delivery dedupe
useProductAnalytics frontend composable
prompt_archive_view instrumentation
prompt_archive_copy instrumentation after successful copy only
analytics failure isolated from primary product behavior
```

Verification source:

```text
docs/strategy/MILESTONE_21A_IMPLEMENTATION.md
```

## Current next step

Locally verify Phase 21A before marking it DONE.

Required closure proof:

1. apply migration `020_product_analytics_events.sql`;
2. verify authenticated view/copy persistence;
3. verify anonymous API event stores `user_id = null`;
4. verify same `eventId` retry creates one row;
5. verify invalid/unapproved payload rejection;
6. verify no prompt text enters analytics metadata;
7. verify analytics failure does not block primary UI behavior;
8. run `pnpm generate`;
9. mark DONE only after explicit user acceptance.

After 21A closure, select **Phase 21B — Referral Growth Activation**.

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
docs/strategy/MILESTONE_21A_IMPLEMENTATION.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
