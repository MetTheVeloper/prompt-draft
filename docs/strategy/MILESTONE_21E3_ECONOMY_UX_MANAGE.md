# Milestone 21E3 — Goin Account UX & Super-Admin Economy Management

Status: **IMPLEMENTED / AWAITING LOCAL VERIFICATION**

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

21E3 has two product surfaces:

```text
private account UX
  -> show the authenticated user's current Goin balance

Super-Admin /manage economy surface
  -> manage reference value
  -> manage issuance policy
  -> manage current Prompt Archive unlock cost
```

## Capability audit result

Existing reusable backend primitives already existed before this slice:

```text
GET /api/economy
GET /api/economy/events
GET /api/admin/economy/settings
PUT /api/admin/economy/settings

economy_settings
user_economy_events
user_content_unlocks
system.settings.manage permission
admin_audit_log
```

Therefore 21E3 does not add a parallel wallet or generic settings subsystem.

No new migration is required.

Current migration ceiling remains:

```text
024_prompt_archive_unlocks.sql
```

Next future schema migration remains:

```text
025_*.sql
```

## Private user-account Goin visibility

New shared account-state composable:

```text
app/composables/useEconomy.ts
```

Frontend economy types:

```text
app/types/economy.ts
```

The composable reads:

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
loading/error
```

State is scoped to the currently authenticated `user.id`. Changing account or logging out resets the cached economy state.

The Prompt Archive unlock composable now applies the economy object returned by unlock GET/POST responses into this shared state, so the private account balance can update immediately after a paid Copy without waiting for a separate page reload.

### Account-menu placement

Updated:

```text
app/components/auth/AuthProfileMenu.vue
```

The account menu now shows Goin separately from XP:

```text
XP badge     -> lifetime reputation/achievement
Goin badge   -> spendable balance
Goin row     -> private wallet balance summary
```

The public `/user` profile is deliberately unchanged. Spendable Goin balance is account-private in this slice.

EN/FA account strings were added to the existing auth locale files.

## Super-Admin Economy management

New management route:

```text
/manage/economy
```

New page:

```text
app/pages/manage/economy.vue
```

New client composable:

```text
app/composables/useAdminEconomy.ts
```

New locale fragments:

```text
i18n/locales/manage-economy.en.ts
i18n/locales/manage-economy.fa.ts
```

They are merged through the existing i18n configuration rather than replacing the primary manage locale files.

### Authorization

`app/config/manage.ts` now registers the Economy section with:

```text
requiredPermission = system.settings.manage
```

Current role mapping means:

```text
super_admin -> visible/allowed through *
admin       -> not granted system.settings.manage
user        -> not granted
```

The page itself also uses authorization middleware with the same permission, so hiding the navigation tab is not the security boundary.

### Manageable values

The page exposes the current server-side values for:

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

Current baseline values remain:

```text
1 goin reference        = 250 toman
account_created         = 10 goin
profile_email_added     = 10 goin
referral_joined         = 10 goin
referral_reward         = 20 goin
draft_created           = 0 goin
Prompt Archive unlock   = 5 goin
```

### Rule-version behavior

Reference-value changes:

```text
do not increment issuance or sink rule versions
```

Issuance changes:

```text
increment goin_issuance_rule_version
apply only to future eligible score events
historical Goin issuance is not rewritten
```

Sink changes:

```text
increment goin_sink_rule_version
apply only to future first unlocks
existing user_content_unlocks preserve their original price_goin + pricing_rule_version
```

## Backend admin-settings extension

Updated:

```text
backend/src/adminEconomyRoute.mjs
```

The existing settings API now includes sink policy rather than introducing another endpoint.

GET response now includes conceptually:

```text
settings.unit
settings.goinReferenceValueToman
settings.issuance
settings.sinks.ruleVersion
settings.sinks.promptArchiveUnlock.costGoin
settings.updatedBy
settings.updatedAt
```

PUT now accepts any supported combination of:

```json
{
  "goinReferenceValueToman": 250,
  "issuance": {
    "accountCreated": 10,
    "profileEmailAdded": 10,
    "referralJoined": 10,
    "referralReward": 20,
    "draftCreated": 0
  },
  "sinks": {
    "promptArchiveUnlock": {
      "costGoin": 5
    }
  }
}
```

All values remain server-validated.

### Audit behavior

Existing reference audit action:

```text
economy.goin_reference_value_updated
```

Existing issuance audit action:

```text
economy.goin_issuance_policy_updated
```

New sink audit action:

```text
economy.goin_sink_policy_updated
```

No-op PUT remains `changed=false` and does not increment rule versions.

## UI safeguards

The management UI states clearly that:

```text
Goin is an internal simulation unit
Toman value is reference metadata only
policy changes apply prospectively
historical ledger rows are never repriced
historical unlocks are never repriced
```

Input policy:

```text
reference value -> positive whole integer
issuance values -> whole integer >= 0
sink cost       -> whole integer >= 0
```

Zero remains valid for reward/sink policies, including the existing `draft_created = 0` anti-farming decision and a possible future free-unlock experiment.

## Local verification checklist

### Build / backend

```text
git pull
docker compose up -d --build api
pnpm generate
```

No `db:schema` run is required for this slice because there is no migration 025.

### Private account UX

Verify with an authenticated account:

```text
open profile/account menu
Goin balance is visible separately from XP
balance matches GET /api/economy / ledger SUM(unit_delta)
paid Prompt unlock updates the account Goin balance
repeat Copy of an already-unlocked Prompt does not change the balance
logout/login or account switch does not leak prior account balance
EN + FA render correctly
Dark + Light render correctly
public /user profile does not expose spendable balance
```

### Super-Admin Manage UX

Verify:

```text
Super Admin sees Economy tab under /manage
/manage/economy loads without manual API calls
reference = 250
issuance = 10 / 10 / 10 / 20 / 0
Prompt Archive unlock = 5
issuance rule version visible
sink rule version visible
```

Authorization:

```text
user cannot access /manage/economy
ordinary admin without system.settings.manage cannot access /manage/economy
Super Admin can read/update it
```

### Safe reversible settings test

Prefer testing only the reference value first because it does not increment the reward/spend rule versions:

```text
250 -> 251 -> save
verify GET/API/UI = 251
verify user's Goin balance unchanged
251 -> 250 -> save
verify restored to 250
```

This produces audit entries but does not mutate historical Goin ledger rows or unlock rows.

Optionally test a sink change separately only when willing to advance the sink rule version:

```text
5 -> 6 -> sink rule version +1
6 -> 5 -> sink rule version +1 again
```

The historical Prompt `501` unlock previously purchased for 5 Goin must remain stored as:

```text
price_goin = 5
pricing_rule_version = 1
```

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
DO NOT create a second economy settings API for the Manage UI.
```
