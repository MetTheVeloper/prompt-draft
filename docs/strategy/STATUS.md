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
Phase 21E3 Economy UX & Manage  -> IMPLEMENTED / AWAITING LOCAL VERIFICATION
```

## Closed Milestones 21A–21D

Canonical verification docs:

```text
docs/strategy/MILESTONE_21A_VERIFICATION.md
docs/strategy/MILESTONE_21B_VERIFICATION.md
docs/strategy/MILESTONE_21C_VERIFICATION.md
docs/strategy/MILESTONE_21D_VERIFICATION.md
```

21D final public/protected boundary remains:

```text
/prompts list/catalog -> public
GET /api/archive -> public
search/sort/multi-tag/pagination -> public

/prompts?id=<id> full Prompt detail -> authenticated + email gate
GET /api/archive/:id -> authenticated + email gate
```

Public discovery routes and static SEO snapshot strategy remain accepted without migrating the whole application away from `ssr:false`.

## 21E semantic foundation

Canonical design:

```text
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
```

Internal spendable unit:

```text
goin
```

Simulation reference value:

```text
1 goin = 250 toman
```

This is reference metadata only, not a fiat buy/cash-out/redemption guarantee.

XP and Goin remain separate:

```text
user_score_events
  -> achievement/reward provenance + lifetime XP

user_economy_events
  -> spendable Goin issuance/debit/refund/correction
```

Spending Goin must never reduce lifetime XP/reputation.

## 21E1 — DONE

Canonical verification:

```text
docs/strategy/MILESTONE_21E1_VERIFICATION.md
```

Foundation migrations:

```text
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
```

Verified ledger properties:

```text
append-only authoritative ledger
SUM(unit_delta) authoritative balance
idempotent retry
negative balance rejected
failed overspend creates no row
parallel spends cannot overspend
read model consistent with ledger
```

Founder-approved Goin Issuance V1:

```text
account_created       -> 10 goin
profile_email_added   -> 10 goin
referral_joined       -> 10 goin
referral_reward       -> 20 goin
draft_created         -> 0 goin
```

Verified locally:

```text
policy settings seeded correctly
historical backfill correct
schema rerun does not double issue
new account_created score event issues +10 Goin
new draft_created remains XP-only
GET /api/economy owner-only
GET /api/economy/events owner-only
Super-Admin economy settings authorization
```

## 21E2 — DONE

Canonical closure:

```text
docs/strategy/MILESTONE_21E2_PROMPT_UNLOCK.md
```

Migration:

```text
024_prompt_archive_unlocks.sql
```

Introduced:

```text
user_content_unlocks
goin_prompt_archive_unlock_cost = 5
goin_sink_rule_version = 1
```

Accepted first sink semantics:

```text
view Prompt detail -> no Goin charge
first meaningful copy/unlock -> 5 Goin default
repeat access to same Prompt -> no additional charge
```

Backend routes:

```text
GET  /api/economy/unlocks/prompt-archive/:publicId
POST /api/economy/unlocks/prompt-archive/:publicId
```

Verified backend/runtime properties:

```text
anonymous unlock read -> 401
Prompt detail view -> no balance change / no unlock / no debit
locked state -> cost=5, ruleVersion=1
first unlock -> exactly -5 Goin + one durable access row
repeat same Prompt -> chargedGoin=0
parallel same-Prompt POSTs -> exactly one charge
foreign user -> cannot observe another user's unlock
zero-balance POST -> 409 INSUFFICIENT_GOIN_BALANCE, no rows
email-incomplete user -> 403
missing Prompt public ID -> 404
```

Frontend Copy integration was then locally verified through the real account flow:

```text
Prompt 501 first Copy -> one prompt_archive_unlock debit of -5
Prompt 501 first Copy -> one user_content_unlocks row, price_goin=5, ruleVersion=1
Prompt 501 repeat Copy -> no additional debit and no additional unlock row
pnpm generate -> PASS
```

21E2 is closed as:

```text
DONE / LOCALLY VERIFIED / USER ACCEPTED
```

## 21E3 — current phase

Canonical implementation/verification doc:

```text
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
```

### Private account Goin UX

New shared state:

```text
app/types/economy.ts
app/composables/useEconomy.ts
```

Updated private account menu:

```text
app/components/auth/AuthProfileMenu.vue
```

The account menu now displays XP and spendable Goin as distinct concepts and reads the authoritative balance from `GET /api/economy`.

`usePromptArchiveUnlock` feeds returned economy state into the shared account state so a paid Prompt unlock can update the visible account balance immediately.

The public `/user` profile deliberately does not expose spendable Goin balance.

### Super-Admin Economy Manage

New route:

```text
/manage/economy
```

Permission:

```text
system.settings.manage
```

Registered through the existing `/manage` section system, so only callers with that permission see/access the section. Current ordinary `admin` permissions do not include it; `super_admin` has `*`.

New client/UI:

```text
app/composables/useAdminEconomy.ts
app/pages/manage/economy.vue
i18n/locales/manage-economy.en.ts
i18n/locales/manage-economy.fa.ts
```

The page manages:

```text
Goin reference value
account-created issuance
profile-email issuance
referred-user issuance
referrer issuance
Draft-created issuance
Prompt Archive first-unlock cost
```

Updated existing backend route:

```text
backend/src/adminEconomyRoute.mjs
```

The same GET/PUT `/api/admin/economy/settings` contract now includes sink policy:

```text
settings.sinks.ruleVersion
settings.sinks.promptArchiveUnlock.costGoin
```

Sink changes:

```text
increment goin_sink_rule_version
write economy.goin_sink_policy_updated to admin_audit_log
apply only to future first unlocks
preserve historical price_goin + pricing_rule_version
```

Reference-value changes do not increment issuance/sink policy versions. Issuance changes keep their existing versioned behavior.

21E3 needs local verification of backend rebuild, `pnpm generate`, account-menu balance UX, EN/FA + Dark/Light, Super-Admin Manage access, settings load/save, and authorization boundaries.

## Migration state

Current migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
024_prompt_archive_unlocks.sql
```

21E3 adds no migration.

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
DO NOT put Prompt text/sellable knowledge into analytics metadata.
DO NOT make /api/archive/:id public merely for SEO.
DO NOT introduce fiat purchase/cash-out/payout in 21E.
DO NOT grant ordinary admin system.settings.manage implicitly.
DO NOT create a second Economy settings API for /manage.
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
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/backend/MILESTONE_15_SCORE_LEDGER.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
