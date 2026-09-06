# Milestone 21E3 — Goin Account UX & Super-Admin Economy Management

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Predecessors:

```text
21E1 Economy Foundation -> DONE / LOCALLY VERIFIED / USER ACCEPTED
21E2 Prompt Unlock      -> DONE / LOCALLY VERIFIED / USER ACCEPTED
```

## Goal

Make the existing Goin economy visible and manageable without creating a second balance, policy, or settings system.

21E3 introduced two product surfaces:

```text
private account UX
  -> authenticated user sees current spendable Goin balance

Super-Admin /manage economy surface
  -> manage reference value
  -> manage issuance policy
  -> manage current Prompt Archive first-unlock cost
```

## Capability reuse

21E3 reused the existing economy/admin primitives:

```text
GET /api/economy
GET /api/economy/events
GET /api/admin/economy/settings
PUT /api/admin/economy/settings

economy_settings
user_economy_events
user_content_unlocks
system.settings.manage
admin_audit_log
```

No parallel wallet, settings subsystem, or new schema migration was introduced.

Migration ceiling remains:

```text
024_prompt_archive_unlocks.sql
```

Next future schema migration remains:

```text
025_*.sql
```

## Private Goin account state

Added:

```text
app/types/economy.ts
app/composables/useEconomy.ts
```

The shared client state reads the authoritative caller-owned state from:

```text
GET /api/economy
```

and exposes:

```text
balance
lifetimeIssued
lifetimeSpent
transactionCount
unit metadata
```

State is scoped by authenticated `user.id` and resets on account change/logout.

`usePromptArchiveUnlock` applies the backend economy object returned by unlock reads/mutations into the same shared state, so paid Prompt unlocks update the visible private balance immediately without inventing a client-side wallet.

## Profile Menu UX

Updated:

```text
app/components/auth/AuthProfileMenu.vue
```

XP and Goin are intentionally distinct:

```text
XP   -> lifetime reputation / achievement
Goin -> spendable internal unit
```

The private Profile Menu now includes:

```text
Goin badge beside XP
Goin balance row
```

The public `/user` profile remains unchanged and does not expose spendable Goin balance.

EN/FA account labels use existing i18n infrastructure and normal theme-aware components/tokens.

## Super-Admin Economy Manage

Added route:

```text
/manage/economy
```

Permission:

```text
system.settings.manage
```

Current authorization behavior:

```text
super_admin -> allowed via *
admin       -> not granted system.settings.manage
user        -> not granted
```

The navigation tab and route middleware use the same permission; navigation hiding is not the security boundary.

Added:

```text
app/composables/useAdminEconomy.ts
app/pages/manage/economy.vue
i18n/locales/manage-economy.en.ts
i18n/locales/manage-economy.fa.ts
```

The page manages:

```text
Goin reference value in toman

Issuance:
  account_created
  profile_email_added
  referral_joined
  referral_reward
  draft_created

Sink:
  Prompt Archive first unlock cost
```

Accepted baseline values:

```text
1 goin reference        = 250 toman
account_created         = 10 goin
profile_email_added     = 10 goin
referral_joined         = 10 goin
referral_reward         = 20 goin
draft_created           = 0 goin
Prompt Archive unlock   = 5 goin
```

## Backend settings extension

Updated the existing endpoint instead of creating a second settings API:

```text
GET /api/admin/economy/settings
PUT /api/admin/economy/settings
```

The contract now includes:

```text
settings.sinks.ruleVersion
settings.sinks.promptArchiveUnlock.costGoin
```

Rule-version semantics:

```text
reference-value change
  -> no issuance-version change
  -> no sink-version change

issuance change
  -> goin_issuance_rule_version +1
  -> future issuance only

sink change
  -> goin_sink_rule_version +1
  -> future first unlocks only
```

Historical issuance and historical `user_content_unlocks.price_goin / pricing_rule_version` are never rewritten.

Audit actions:

```text
economy.goin_reference_value_updated
economy.goin_issuance_policy_updated
economy.goin_sink_policy_updated
```

No-op PUT remains `changed=false`.

## Local verification — PASSED

The user rebuilt the backend and completed `pnpm generate` successfully.

The live `/manage/economy` UI was visually verified in the local application and showed:

```text
Economy Manage section visible to Super Admin
Reference value = 250 toman
Issuance Rule = v1
Sink Rule = v1
Prompt unlock = 5 goin
```

The private account menu visibly showed XP and Goin as separate badges plus a dedicated Goin balance row.

### Reversible reference-value test

The user changed:

```text
250 -> 251
```

and saved successfully.

Observed after save:

```text
Reference card = 251 toman
Issuance Rule remained v1
Sink Rule remained v1
Goin balance unchanged by reference metadata change
```

The value was then restored:

```text
251 -> 250
```

Final database read-back confirmed:

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

### Shared balance update after paid unlock

The user opened Prompt Archive item `502` while its first-copy contract displayed:

```text
Unlock & copy · 5 goin
current visible balance = 90 goin
```

After the first paid Copy:

```text
Prompt became durably unlocked
Copy button changed to ordinary Copy state
future copies were shown as free
private Profile Menu balance updated immediately to 85 goin
```

This verifies the intended shared economy state path:

```text
server-authoritative unlock
-> returned economy state
-> shared useEconomy state
-> Profile Menu updates without a second wallet calculation
```

The user accepted the resulting UI and behavior as correct.

## Hard rules preserved

```text
DO NOT merge XP and Goin.
DO NOT show another user's private spendable balance.
DO NOT create a mutable users.balance source of truth.
DO NOT trust client form values without backend validation.
DO NOT retroactively rewrite historical issuance after reward-policy changes.
DO NOT retroactively rewrite historical unlock prices after sink-policy changes.
DO NOT treat reference Toman value as fiat convertibility.
DO NOT grant ordinary admin system.settings.manage implicitly.
DO NOT create a second Economy settings API for /manage.
```

## Closure

Milestone 21E3 is closed as:

```text
DONE / LOCALLY VERIFIED / USER ACCEPTED
```

The Growth Foundation can now proceed to:

```text
21F — Growth Metrics in Manage
```
