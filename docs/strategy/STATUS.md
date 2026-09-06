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
Phase 21E2 Prompt Unlock        -> BACKEND LOCALLY VERIFIED / FRONTEND IMPLEMENTED / AWAITING UI + BUILD VERIFICATION
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
```

Verified user APIs:

```text
GET /api/economy
GET /api/economy/events?limit=<1..100>&cursor=<cursor>
```

Final API boundary verification:

```text
unauthenticated economy read -> 401
authenticated economy read -> own ledger only
history -> own events only
foreign userId query cannot switch ownership
ordinary user economy settings -> 403
super_admin economy settings -> 200
super_admin no-op PUT -> changed=false
```

No active ordinary `admin` account existed in the local verification dataset, so that one runtime role check was skipped; the current permission map still does not grant `system.settings.manage` to ordinary admins.

Super-Admin economy settings backend already manages:

```text
goin reference value
account-created issuance
profile-email issuance
referred-user issuance
referrer issuance
Draft-created issuance
```

A future `/manage` economy surface must reuse this backend contract rather than create another settings system.

## 21E2 — current phase

Canonical implementation/verification doc:

```text
docs/strategy/MILESTONE_21E2_PROMPT_UNLOCK.md
```

Migration:

```text
024_prompt_archive_unlocks.sql
```

Introduces:

```text
user_content_unlocks
goin_prompt_archive_unlock_cost = 5
goin_sink_rule_version = 1
```

The initial 5-Goin cost is a simulation default. At the current reference value it is approximately 1,250 toman of reference value, not a permanent Marketplace fiat price.

Current first sink semantics:

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

Requirements:

```text
authenticated active user
email completed
published Prompt Archive item
```

Atomic unlock contract:

```text
BEGIN
lock canonical user row
check existing durable unlock
read current sink policy
check current Goin balance
insert negative economy event when cost > 0
insert durable unlock row
COMMIT
```

Backend verification is complete and locally accepted:

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

The explicit unpublished-row test was skipped because the local Archive dataset had no unpublished item. The backend published-item lookup itself remains `status = 'published'`.

Frontend integration is now implemented in:

```text
app/composables/usePromptArchiveUnlock.ts
app/components/prompts/PromptDetail.vue
i18n/locales/growth.en.ts
i18n/locales/growth.fa.ts
```

Frontend Copy contract:

```text
load Prompt detail -> read unlock state only
locked Copy -> show current Goin cost -> POST unlock -> clipboard
already unlocked Copy -> clipboard directly
insufficient Goin -> no clipboard copy + server balance/required feedback
successful first unlock -> all later variants/copies of same Prompt are free
clipboard analytics remains prompt_archive_copy and fires only after copy succeeds
```

The new UI uses normal theme tokens/components and EN/FA strings. It still needs local Dark/Light + EN/FA smoke testing and `pnpm generate` before 21E2 can close.

## Migration state

Current migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
024_prompt_archive_unlocks.sql
```

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
DO NOT expose another user's economy history or unlock state.
DO NOT treat the 250 toman reference value as a buy/cash-out guarantee.
DO NOT treat the current 5-Goin Prompt unlock as a permanent Marketplace price.
DO NOT put Prompt text/sellable knowledge into analytics metadata.
DO NOT make /api/archive/:id public merely for SEO.
DO NOT introduce fiat purchase/cash-out/payout in 21E.
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
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/backend/MILESTONE_15_SCORE_LEDGER.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
