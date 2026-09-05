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
Milestone 21 Growth Foundation  -> IN PROGRESS
Phase 21A capability audit      -> COMPLETE
Phase 21A analytics design      -> COMPLETE
Phase 21A implementation        -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21B referral activation   -> SELECTED / IMPLEMENTATION STARTED
```

## 21A closure

The first dedicated Behavioral Analytics primitive is now implemented and locally verified:

```text
backend/sql/020_product_analytics_events.sql
backend/src/productAnalytics.mjs
app/composables/useProductAnalytics.ts
POST /api/analytics/events
```

First verified events:

```text
prompt_archive_view
prompt_archive_copy
```

Verified locally:

```text
migration 020
real authenticated UI persistence
anonymous persistence with user_id = NULL
eventId delivery dedupe
HTTP 400 validation rejection
HTTP 413 body-size rejection
non-blocking analytics failure behavior
no prompt text in analytics metadata
pnpm generate PASS
```

Canonical verification record:

```text
docs/strategy/MILESTONE_21A_VERIFICATION.md
```

## Important Growth architecture finding carried forward

```text
/prompts frontend currently requires logged-in user + email before loading Archive
/api/archive backend currently enforces the same login+email requirement
Archive list projection does not expose full prompt text
Archive detail projection does expose prompt + variants
/data/prompts.json fallback snapshot currently contains full prompt content
```

Strategic consequence:

> Future Growth/SEO/Marketplace work must separate public discovery metadata from protected/unlocked sellable knowledge rather than simply making the current full Archive detail contract public.

## Current next step — Phase 21B

Activate referral growth by extending the existing Milestone 16 referral foundation rather than creating a second referral system.

Existing authoritative primitives to reuse:

```text
registration referralUsername input
username -> canonical active referrer UUID resolution
referrals relation table
one-referrer-per-user uniqueness
self-referral prevention
atomic referral relation + score rewards
GET /api/auth/me referredCount
```

First 21B slice:

1. define canonical username referral URL;
2. prefill the existing registration referral field from URL;
3. record referral-link landing through the existing product analytics primitive;
4. add a user-facing referral-link copy surface after the URL/prefill contract is verified;
5. keep `referrals` as authoritative conversion truth;
6. do not create a separate invite-code identity.

Source:

```text
docs/strategy/MILESTONE_21B_REFERRAL_GROWTH.md
```

## Hard rules

```text
DO NOT use admin_audit_log as behavioral analytics.
DO NOT use user_score_events as a generic analytics warehouse.
DO NOT create a second XP/referral/auth/admin system.
DO NOT trust analytics events as economic/payout authority.
DO NOT put prompt text or sellable knowledge into analytics metadata.
DO NOT treat referral_link_open as authoritative referral success.
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
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
docs/backend/MILESTONE_16_REFERRAL_FOUNDATION.md
```
