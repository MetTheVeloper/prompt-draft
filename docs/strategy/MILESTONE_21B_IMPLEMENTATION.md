# Milestone 21B — Referral Growth Activation Implementation Handoff

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Branch:

```text
feature/growth-foundation
```

Design source:

```text
docs/strategy/MILESTONE_21B_REFERRAL_GROWTH.md
```

Canonical verification record:

```text
docs/strategy/MILESTONE_21B_VERIFICATION.md
```

## Implemented scope

21B activated a small referral growth loop on top of the already-authoritative Milestone 16 referral system.

Implemented files:

```text
backend/src/productAnalytics.mjs
app/composables/useProductAnalytics.ts
app/pages/login.vue
app/components/auth/AuthProfileMenu.vue
i18n/locales/auth.en.ts
i18n/locales/auth.fa.ts
```

No referral schema, reward rule, auth identity, or XP ledger was replaced.

## Canonical URL

```text
/login?ref=<normalizedUsername>
```

Verified local example:

```text
http://localhost:3030/login?ref=grass
```

## Registration behavior

`app/pages/login.vue` now:

```text
reads route.query.ref
trims + lowercases it
accepts only existing username syntax /^[a-z0-9._-]{3,64}$/
preserves valid referral value across Auth-step transitions
prefills the existing referralUsername input
keeps the field editable
still submits through existing useAuth().register({ referralUsername })
```

Malformed URL values are ignored. Backend `/api/auth/register` remains authoritative.

## Landing analytics

21B added:

```text
referral_link_open
resource = referral_username:<normalizedUsername>
```

This event remains observational only:

```text
it does not create a referrals row
it does not grant XP
it does not prove successful signup
```

Successful referral truth remains `referrals`.

## Profile Menu activation

The Profile Menu exposes **Copy referral link** for accounts with a username.

Behavior:

```text
uses current browser origin
creates /login?ref=<normalizedUsername>
clipboard API + DOM fallback
localized EN/FA copied/error state
no backend endpoint
no referral-code entity
```

## Local verification result

The user verified the complete loop on 2026-09-06.

Verified landing behavior:

```text
valid URL prefill works
prefill survives Change Identifier
malformed referral link is ignored
referral_link_open persists anonymously with user_id = NULL
```

Verified conversion behavior:

```text
referrer = grass
new account = m010
referral id = 5f63047f-6d5e-40dd-a2b9-00460a57c8d3
referral_username_used = grass
```

Verified score events for the same referral ID:

```text
grass -> referral_reward -> +1000 exactly once
m010  -> referral_joined -> +500 exactly once
```

Verified Profile Menu read model:

```text
Invited users = 3 -> 4
```

Verified release invariant:

```text
pnpm generate -> PASS
```

## Schema result

21B introduced no schema migration. Existing tables were reused:

```text
referrals
user_score_events
product_analytics_events
```

The next real schema change is therefore migration `021`.

## Authority boundaries retained

```text
referral_link_open -> landing observation
referrals           -> successful referral conversion
user_score_events   -> reward issuance
```

## Closure

All 21B acceptance gates passed. Milestone 21B is closed.

Next phase:

```text
Milestone 21C — User Preferences & Personalized Discovery
```

The local modification in:

```text
public/data/prompts.json
```

remains unrelated and must not be included in Growth commits.
