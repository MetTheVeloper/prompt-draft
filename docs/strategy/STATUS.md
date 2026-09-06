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

Milestone 21 Growth Foundation  -> FUNCTIONALLY COMPLETE / UI POLISH IN PROGRESS
Phase 21A Analytics             -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21B Referral Activation   -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21C Preferences/Discovery -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21D Public Discovery/SEO  -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E1 Economy Foundation   -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E2 Prompt Unlock        -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E3 Economy UX & Manage  -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21F Growth Metrics        -> DONE / LOCALLY VERIFIED / USER ACCEPTED
UI polish closure pass          -> IN PROGRESS
```

## Canonical closure / verification docs

```text
docs/strategy/MILESTONE_21A_VERIFICATION.md
docs/strategy/MILESTONE_21B_VERIFICATION.md
docs/strategy/MILESTONE_21C_VERIFICATION.md
docs/strategy/MILESTONE_21D_VERIFICATION.md
docs/strategy/MILESTONE_21E1_VERIFICATION.md
docs/strategy/MILESTONE_21E2_PROMPT_UNLOCK.md
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
docs/strategy/MILESTONE_21F_GROWTH_METRICS.md
docs/strategy/MILESTONE_21F_VERIFICATION.md
docs/strategy/MILESTONE_21_UI_POLISH.md
```

## 21D public/protected boundary

Accepted boundary remains:

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

Verified Goin issuance V1:

```text
account_created       -> 10 goin
profile_email_added   -> 10 goin
referral_joined       -> 10 goin
referral_reward       -> 20 goin
draft_created         -> 0 goin
```

Verified economy invariants:

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

Current Prompt Archive sink:

```text
first meaningful Prompt Copy unlock = 5 goin
```

Accepted semantics:

```text
view Prompt detail -> free
first meaningful Copy -> may debit 5 goin
repeat Copy / another variant of same Prompt -> free
```

Verified runtime behavior:

```text
atomic debit + durable unlock
same-Prompt concurrent requests charge exactly once
insufficient balance creates neither debit nor unlock
foreign user cannot observe another user's unlock
historical unlock price/rule version preserved
Prompt 501 first Copy -> one -5 debit + one durable unlock
Prompt 501 repeat Copy -> no second debit/unlock
Prompt 502 locked state displayed 5-Goin first-copy contract
Prompt 502 first Copy -> shared private balance changed 90 -> 85 immediately
```

Private Profile Menu displays XP and Goin separately and keeps spendable balance off public `/user`.

Super-Admin economy management:

```text
/manage/economy
permission: system.settings.manage
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

Safe reversible settings verification passed:

```text
reference 250 -> 251 -> save
issuance rule remained v1
sink rule remained v1
reference restored 251 -> 250
```

Final DB policy read-back:

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

## 21F Growth Metrics — DONE

Manage section:

```text
/manage/growth
permission: system.metrics.view
```

Backend read API:

```text
GET /api/admin/growth/summary?days=7
GET /api/admin/growth/summary?days=30
```

Invalid windows:

```text
400 GROWTH_WINDOW_INVALID
```

Current behavioral event coverage remains intentionally narrow:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

Therefore measured audience is explicitly scoped to instrumented Growth surfaces and is not labelled whole-product DAU/MAU.

Verified metric groups:

```text
Measured audience
Prompt Archive engagement
Referral growth
Goin circulation
UTC daily series
Top 8 Prompt Archive tags
```

Final local SQL-vs-API verification passed for both 7-day and 30-day windows:

```text
anonymous request -> 401
ordinary user -> 403
invalid days=8 -> 400
admin/super_admin -> 200

audience summary exactly matches DB
Prompt summary exactly matches DB
referral summary exactly matches DB
economy summary exactly matches DB
tracked event count exactly matches DB
daily series exactly matches DB
Top Tags exactly match DB
measurement scope and event allowlist correct
```

Representative verified 7-day values at closure:

```text
tracked visitors                  3
tracked authenticated users       1
returning authenticated users     1
new accounts                     10
Prompt views                     11
Prompt copies                     9
copy-session rate               50%
Prompt unlocks                    3
referral opens                    2
referral signups                  5
referral share                   50%
open-to-signup directional ratio 250%
Goin issued                     320
Goin spent                       15
Goin outstanding                305
active spenders                   1
tracked analytics events         22
```

The `250%` open-to-signup figure is directional aggregate evidence, not strict attribution; it can exceed 100% when persisted referral signups do not have a tracked referral-link-open event.

Final script result:

```text
ALL 21F GROWTH METRICS CHECKS PASSED
Cleaned 2 temporary auth session(s)
```

Visual/runtime smoke also passed in EN/FA and Light/Dark, and `pnpm generate` passed with `/manage/growth` generated successfully.

## Current closure work — UI polish

Canonical scope:

```text
docs/strategy/MILESTONE_21_UI_POLISH.md
```

This pass is presentation-only. It must not reopen Growth product scope.

Current polish work includes:

```text
shared Manage metric-card typography and spacing tightened
Growth and Economy summary-card hierarchy improved together
numeric values use tabular figures
EN/FA card wrapping improved
referral ratio helper explicitly explains why values may exceed 100%
```

No backend behavior, policy, analytics contract, permission, or schema changes are part of the polish pass.

## Migration state

Current migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
024_prompt_archive_unlocks.sql
```

21E3, 21F, and the UI polish pass add no migration.

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
docs/strategy/MILESTONE_21F_VERIFICATION.md
docs/strategy/MILESTONE_21_UI_POLISH.md
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
