# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Exact inherited Growth baseline:

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
Phase 21D Public Discovery/SEO  -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E1 Economy Foundation   -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E2 Prompt Unlock        -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E3 Economy UX & Manage  -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21F Growth Metrics        -> IMPLEMENTED / AWAITING LOCAL VERIFICATION
```

## Closed Growth phases

Canonical verification/closure docs:

```text
docs/strategy/MILESTONE_21A_VERIFICATION.md
docs/strategy/MILESTONE_21B_VERIFICATION.md
docs/strategy/MILESTONE_21C_VERIFICATION.md
docs/strategy/MILESTONE_21D_VERIFICATION.md
docs/strategy/MILESTONE_21E1_VERIFICATION.md
docs/strategy/MILESTONE_21E2_PROMPT_UNLOCK.md
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
```

## 21D public/protected boundary

Current accepted boundary remains:

```text
/prompts list/catalog -> public
GET /api/archive -> public
search/sort/multi-tag/pagination -> public

/prompts?id=<id> full Prompt detail -> authenticated + email gate
GET /api/archive/:id -> authenticated + email gate
```

Public discovery routes and targeted static SEO enrichment remain accepted without migrating the whole app away from `ssr:false`.

## 21E economy foundation — DONE

Internal spendable unit:

```text
goin
```

Simulation reference value:

```text
1 goin = 250 toman
```

Reference value is metadata only, not fiat buy/cash-out/redemption convertibility.

XP and Goin remain separate:

```text
user_score_events
  -> achievement/reward provenance + lifetime XP

user_economy_events
  -> spendable Goin issuance/debit/refund/correction
```

### Verified Goin issuance V1

```text
account_created       -> 10 goin
profile_email_added   -> 10 goin
referral_joined       -> 10 goin
referral_reward       -> 20 goin
draft_created         -> 0 goin
```

Verified properties:

```text
append-only authoritative ledger
SUM(unit_delta) authoritative balance
idempotent retry
negative balance rejected
failed overspend creates no row
parallel spends cannot overspend
historical issuance backfill rerunnable without double issue
new eligible score events issue Goin through versioned policy
Draft-created remains XP-only
```

### Verified Prompt unlock sink

Current simulation default:

```text
Prompt Archive first unlock = 5 goin
```

Accepted semantics:

```text
view Prompt detail -> free
first meaningful Copy -> may debit 5 goin
repeat Copy / another variant of same Prompt -> free
```

Verified backend/runtime behavior:

```text
atomic debit + durable unlock
same-Prompt concurrent requests charge exactly once
insufficient balance creates neither debit nor unlock
foreign user cannot observe another user's unlock
historical unlock price/rule version preserved
```

Verified real UI flow:

```text
Prompt 501 first Copy -> one -5 debit + one durable unlock
Prompt 501 repeat Copy -> no second debit/unlock
Prompt 502 locked state displayed 5-Goin first-copy contract
Prompt 502 first Copy -> shared private balance changed 90 -> 85 immediately
```

### Verified Goin private UX / Super-Admin Manage

Private Profile Menu now displays XP and Goin separately and keeps spendable balance off the public `/user` profile.

Super-Admin route:

```text
/manage/economy
```

Permission:

```text
system.settings.manage
```

Manageable policy:

```text
Goin reference value
account-created issuance
profile-email issuance
referred-user issuance
referrer issuance
Draft-created issuance
Prompt Archive first-unlock cost
```

Safe reversible local test passed:

```text
reference 250 -> 251 -> save
issuance rule remained v1
sink rule remained v1
reference restored 251 -> 250
```

Final DB read-back:

```text
goin_issuance_rule_version      = 1
goin_issue_account_created      = 10
goin_issue_draft_created        = 0
goin_issue_profile_email_added  = 10
goin_issue_referral_joined      = 10
goin_issue_referral_reward      = 20
goin_prompt_archive_unlock_cost = 5
goin_reference_value_toman      = 250
goin_sink_rule_version          = 1
```

21E3 is closed:

```text
DONE / LOCALLY VERIFIED / USER ACCEPTED
```

## 21F — current phase

Canonical implementation/verification doc:

```text
docs/strategy/MILESTONE_21F_GROWTH_METRICS.md
```

Goal:

```text
Turn already-persisted Growth Foundation signals into decision-quality Manage read models without creating another analytics warehouse or dashboard shell.
```

### Capability audit

Currently usable authoritative sources:

```text
product_analytics_events
referrals
users
user_economy_events
user_content_unlocks
prompt_archive_items/tags
```

Current behavioral event coverage:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

Therefore 21F deliberately does **not** claim:

```text
whole-product DAU/MAU
whole-product retention
Wizard completion analytics
strict click-level referral attribution
```

Measured audience metrics are explicitly scoped to instrumented growth surfaces.

### New backend read API

Implemented:

```text
GET /api/admin/growth/summary?days=7
GET /api/admin/growth/summary?days=30
```

Authorization:

```text
authenticated caller
system.metrics.view
```

Invalid windows return:

```text
400 GROWTH_WINDOW_INVALID
```

Backend:

```text
backend/src/adminGrowth.mjs
```

No migration is required.

### Metrics currently exposed

Measured audience:

```text
tracked visitors
tracked sessions
tracked authenticated users
returning authenticated users on 2+ measured UTC days
new accounts
```

Prompt Archive:

```text
views
successful copies
view sessions
copy sessions
copy-session rate
durable Prompt unlocks
```

Referral growth:

```text
referral-link opens
persisted referral signups
referral share of new accounts
directional open-to-signup ratio
```

Goin circulation:

```text
period issued
period spent
period net flow
current outstanding Goin
current holders
active spenders
```

Additional response data:

```text
UTC daily series with zero-day filling
top 8 Prompt Archive tags by copies then views
```

No Prompt text/variants are exposed in the metrics response.

### Manage UI

New section:

```text
/manage/growth
```

Permission:

```text
system.metrics.view
```

Frontend:

```text
app/types/adminGrowthApi.ts
app/pages/manage/growth.vue
app/composables/usePromptDraftApi.ts
app/config/manage.ts
i18n/locales/manage-growth.en.ts
i18n/locales/manage-growth.fa.ts
```

UI includes:

```text
7 / 30 day switch
measurement-scope warning
audience metric cards
Prompt metric cards
referral metric cards
Goin circulation cards
daily UTC table
popular Prompt tags
```

21F still needs local backend/API verification, EN/FA + Dark/Light smoke testing, and `pnpm generate` before closure.

## Migration state

Current migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
024_prompt_archive_unlocks.sql
```

21E3 and 21F add no migration.

Next future schema migration:

```text
025_*.sql
```

## Hard rules

```text
DO NOT use admin_audit_log as behavioral analytics.
DO NOT use user_score_events as a generic analytics warehouse.
DO NOT create a second XP/referral/auth/admin/profile system.
DO NOT make Goin spending reduce lifetime XP/reputation.
DO NOT add a mutable users.balance as economy source of truth.
DO NOT trust frontend balance checks.
DO NOT trust analytics events as economic authority.
DO NOT convert XP 1:1 into Goin.
DO NOT issue Goin for draft_created in V1.
DO NOT retroactively reprice historical Goin issuance.
DO NOT charge Prompt page views.
DO NOT charge on every Copy click.
DO NOT create paid access without atomic debit + durable unlock state.
DO NOT expose another user's economy history, unlock state, or spendable balance.
DO NOT treat the 250 toman reference value as a buy/cash-out guarantee.
DO NOT treat the current 5-Goin Prompt unlock as a permanent Marketplace price.
DO NOT put Prompt text/sellable knowledge into analytics or Growth metrics.
DO NOT call measured-surface audience whole-product DAU/MAU.
DO NOT infer Wizard completion before Wizard analytics exists.
DO NOT claim strict referral attribution from aggregate opens/signups.
DO NOT build another dashboard shell for 21F.
DO NOT add aggregate schema until query volume/performance proves it necessary.
DO NOT make /api/archive/:id public merely for SEO.
DO NOT introduce fiat purchase/cash-out/payout in Milestone 21.
DO NOT start the full Marketplace inside Milestone 21.
```

## Primary sources

```text
docs/strategy/PRODUCT_STRATEGY_V1.md
docs/strategy/PRICING_AND_INTERNAL_ECONOMY_V1.md
docs/strategy/EXECUTION_ROADMAP_V1.md
docs/strategy/MILESTONE_21_GROWTH_FOUNDATION.md
docs/strategy/MILESTONE_21A_VERIFICATION.md
docs/strategy/MILESTONE_21B_VERIFICATION.md
docs/strategy/MILESTONE_21C_VERIFICATION.md
docs/strategy/MILESTONE_21D_VERIFICATION.md
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
docs/strategy/MILESTONE_21E_IMPLEMENTATION.md
docs/strategy/MILESTONE_21E1_VERIFICATION.md
docs/strategy/MILESTONE_21E_GOIN_ISSUANCE_V1.md
docs/strategy/MILESTONE_21E2_PROMPT_UNLOCK.md
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
docs/strategy/MILESTONE_21F_GROWTH_METRICS.md
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
