# Milestone 21B — Referral Growth Activation Implementation Handoff

Status: **SECOND SLICE IMPLEMENTED / FIRST SLICE LOCALLY VERIFIED / AWAITING FULL CONVERSION VERIFICATION**

Branch:

```text
feature/growth-foundation
```

Design/audit source:

```text
docs/strategy/MILESTONE_21B_REFERRAL_GROWTH.md
```

## Implemented scope

21B activates a small referral growth loop on top of the already-authoritative Milestone 16 referral system.

Implemented files across the two slices:

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

V1 referral URL:

```text
/login?ref=<username>
```

The URL uses the existing Prompt Draft username as the only referral identity.

## Login / registration behavior

`app/pages/login.vue` now:

```text
reads route.query.ref
trims + lowercases it
accepts only existing username syntax /^[a-z0-9._-]{3,64}$/
keeps valid referral value while identifier step transitions into registration
prefills the existing referralUsername input
keeps the field editable
preserves the link referral when returning to the identifier step
still submits through the existing useAuth().register({ referralUsername }) path
```

Malformed URL values are not treated as valid prefill values.

Backend `/api/auth/register` remains authoritative and still re-resolves the active referrer and applies all Milestone 16 integrity rules.

## Referral landing analytics

New accepted product analytics event:

```text
referral_link_open
```

Resource:

```text
referral_username:<normalizedUsername>
```

The analytics endpoint remains strict. Resource ID validation is event-specific:

```text
prompt_archive_view/copy -> positive numeric Archive public ID
referral_link_open        -> valid normalized username
```

`referral_link_open` accepts no arbitrary metadata.

This event is observational only:

```text
it does not create a referrals row
it does not grant XP
it does not prove successful signup
```

Authoritative conversion remains the existing `referrals` table.

## Frontend analytics typing

`useProductAnalytics()` supports:

```text
prompt_archive_item
referral_username
```

and event name:

```text
referral_link_open
```

The login page emits the event once per valid normalized referral username during its component lifecycle. The existing analytics anonymous/session identity is reused.

## First slice local verification — COMPLETE

The user locally verified the referral landing slice on 2026-09-06.

Verified behavior:

```text
/login?ref=grass recognized as a valid referral landing
registration referralUsername prefilled with grass
prefill remained editable
prefill survived Change Identifier / registration-step transitions
malformed referral URL was ignored
referral_link_open persisted successfully
signed-out landing stored user_id = NULL
resource_type = referral_username
resource_id = grass
path = /login?ref=grass
metadata = {}
```

Observed analytics row included:

```text
event_name    = referral_link_open
user_id       = NULL
resource_type = referral_username
resource_id   = grass
path          = /login?ref=grass
locale        = en
metadata      = {}
```

This verifies landing observation without changing referral conversion authority.

## Second slice — Profile Menu Copy referral link

`app/components/auth/AuthProfileMenu.vue` now exposes a compact authenticated action when the current account has a username.

Behavior:

```text
requires current user.username
normalizes the username before composing the URL
uses current browser origin
creates exactly /login?ref=<username>
uses navigator.clipboard when available
falls back to DOM copy when clipboard API fails/is unavailable
shows localized copied/error state for a short interval
keeps the existing invited-user count unchanged
adds no backend endpoint
adds no referral-code entity
```

A user without a username does not receive a synthetic referral code. Existing profile completion remains the path to acquiring a username.

Localized strings were added in:

```text
i18n/locales/auth.en.ts
i18n/locales/auth.fa.ts
```

## No migration

No `021` migration is required for 21B.

Reused tables:

```text
referrals
user_score_events
product_analytics_events
```

## Final local verification sequence

### 1. Pull latest frontend changes

```powershell
git pull
```

The Profile Menu copy action is frontend-only. No backend rebuild is required solely for this second slice if the backend already contains the verified first-slice analytics changes.

### 2. Verify copy action

Sign in with an account that has a username, open the Profile Menu, and click:

```text
Copy referral link
```

Expected:

```text
button exists only when username exists
copied value uses current origin
path is /login?ref=<normalizedUsername>
button temporarily shows localized success text
```

For local development with username `grass`, expected clipboard value is:

```text
http://localhost:3030/login?ref=grass
```

If the dev origin differs, only the origin should differ.

### 3. Use the copied link in Incognito

Open the copied link in a signed-out/incognito browser.

Proceed with an actually unused username or email so the Auth flow enters registration.

Expected:

```text
Referral username is prefilled from the copied URL
```

### 4. Complete one real referral signup

Use a disposable local test account and complete registration without changing the prefilled referral username.

Expected primary behavior:

```text
account is created normally
login/session response succeeds
existing Milestone 16 referral validation remains authoritative
```

### 5. Verify canonical referral relation

Replace values if using a different test pair:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT r.id, r.referral_username_used, referrer.username AS referrer_username, referred.username AS referred_username, r.created_at FROM referrals r JOIN users referrer ON referrer.id=r.referrer_user_id JOIN users referred ON referred.id=r.referred_user_id ORDER BY r.created_at DESC LIMIT 10;"
```

Expected newest row:

```text
referral_username_used = copied referrer username
referrer_username      = copied referrer username
referred_username      = newly created account username when registration used a username
```

Exactly one referral row should represent the new account.

### 6. Verify referral rewards

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT u.username, e.event_type, e.points, e.source_type, e.source_id, e.idempotency_key, e.created_at FROM user_score_events e JOIN users u ON u.id=e.user_id WHERE e.event_type IN ('referral_joined','referral_reward') ORDER BY e.created_at DESC LIMIT 20;"
```

Expected for the tested relation:

```text
new/referred user -> referral_joined -> +500
referrer          -> referral_reward -> +1000
```

The reward rows must use the existing referral relation as their source. No analytics event should award score.

### 7. Verify invited-user count

Re-open the original referrer's Profile Menu after the signup.

Expected:

```text
Invited users count increases by 1
```

The count continues to come from `referrals`, not analytics or client state.

### 8. Optional funnel sanity query

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT event_name, resource_id, user_id, anonymous_id, session_id, path, received_at FROM product_analytics_events WHERE event_name='referral_link_open' ORDER BY received_at DESC LIMIT 20;"
```

This is landing observation only and does not need a one-to-one relationship with successful signups.

### 9. Release invariant

```powershell
pnpm generate
```

Must pass before 21B is marked DONE.

## Acceptance gate

Do not mark 21B complete until the user verifies:

```text
Profile Menu copy action exists for username accounts
copied URL is current-origin + /login?ref=<username>
EN/FA action/result copy works
copied link prefills the existing registration referral field
successful signup creates exactly one canonical referrals row
existing +500 / +1000 rewards are issued exactly once
invited-user count increases from referrals
referral_link_open remains observational only
no second referral-code/reward/auth system exists
pnpm generate succeeds
```

## Invariant

The local modification:

```text
public/data/prompts.json
```

is unrelated to this work and must not be included in 21B commits.
