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
Phase 21B referral activation   -> FIRST SLICE IMPLEMENTED / AWAITING LOCAL VERIFICATION
```

## 21A closure

The first dedicated Behavioral Analytics primitive is implemented and locally verified:

```text
backend/sql/020_product_analytics_events.sql
backend/src/productAnalytics.mjs
app/composables/useProductAnalytics.ts
POST /api/analytics/events
```

Verified first events:

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

## Current phase — 21B Referral Growth Activation

21B reuses the existing Milestone 16 referral system. No second referral identity or reward system is being created.

Existing authoritative primitives:

```text
POST /api/auth/register referralUsername
username -> canonical active referrer UUID resolution
referrals relation table
one-referrer-per-user uniqueness
self-referral prevention
atomic referral relation + score rewards
referred user +500 XP
referrer +1000 XP
GET /api/auth/me referredCount
```

First implemented 21B slice:

```text
canonical URL: /login?ref=<username>
valid URL referral username -> existing registration-field prefill
prefill survives identifier-step transitions
new observational event: referral_link_open
resource: referral_username:<username>
event-specific analytics resource validation
no new database migration
```

Important authority boundary:

```text
referral_link_open -> landing observation only
referrals           -> successful referral truth
user_score_events   -> reward truth
```

Local verification instructions:

```text
docs/strategy/MILESTONE_21B_IMPLEMENTATION.md
```

After the first slice is verified, the next slice is the existing Profile Menu **Copy referral link** action followed by one full real referral conversion verification and `pnpm generate`.

## Hard rules

```text
DO NOT use admin_audit_log as behavioral analytics.
DO NOT use user_score_events as a generic analytics warehouse.
DO NOT create a second XP/referral/auth/admin system.
DO NOT trust analytics events as economic/payout authority.
DO NOT put prompt text or sellable knowledge into analytics metadata.
DO NOT treat referral_link_open as authoritative referral success.
DO NOT award XP from referral_link_open.
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
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
docs/backend/MILESTONE_16_REFERRAL_FOUNDATION.md
```
