# Milestone 21B — Referral Growth Activation Implementation Handoff

Status: **FIRST SLICE IMPLEMENTED / AWAITING LOCAL VERIFICATION**

Branch:

```text
feature/growth-foundation
```

Design/audit source:

```text
docs/strategy/MILESTONE_21B_REFERRAL_GROWTH.md
```

## Implemented first slice

This slice activates URL attribution on top of the existing Milestone 16 referral system.

Changed files:

```text
backend/src/productAnalytics.mjs
app/composables/useProductAnalytics.ts
app/pages/login.vue
```

No referral schema, reward rule, auth identity, or XP ledger was replaced.

## Canonical URL

V1 referral URL:

```text
/login?ref=<username>
```

The URL uses the existing Prompt Draft username as the referral identity.

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

The analytics endpoint remains strict. Resource ID validation is now event-specific:

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

`useProductAnalytics()` now supports:

```text
prompt_archive_item
referral_username
```

and event name:

```text
referral_link_open
```

The login page emits the event once per valid normalized referral username during its component lifecycle. The existing analytics anonymous/session identity is reused.

## No migration

No `021` migration is required for this slice.

Reused tables:

```text
referrals
user_score_events
product_analytics_events
```

## Local verification — first slice

### 1. Pull and rebuild API

```powershell
git pull
docker compose up -d --build api
```

No schema command is required for this slice because no migration was added.

### 2. Choose a real referrer username

Use an existing active account that has a username. Example below uses `grass`; replace it with a real local username if needed.

Open in a signed-out/incognito browser:

```text
http://localhost:3030/login?ref=grass
```

### 3. Verify prefill

Enter a new/unused username or email in the first Auth step and continue to account creation.

Expected:

```text
Referral username field is already filled with grass
field remains editable
password/repeat-password flow is unchanged
```

Use Change Identifier and return to registration again. The referral prefill should remain available from the URL.

### 4. Verify landing event

Without creating an account yet, query:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT event_name, user_id, anonymous_id, session_id, resource_type, resource_id, path, locale, metadata, received_at FROM product_analytics_events WHERE event_name='referral_link_open' ORDER BY received_at DESC LIMIT 10;"
```

Expected newest row:

```text
event_name    = referral_link_open
resource_type = referral_username
resource_id   = grass
path          = /login?ref=grass
metadata      = {}
```

In a truly signed-out browser, `user_id` should be null.

### 5. Verify malformed link does not become attribution

Open:

```text
http://localhost:3030/login?ref=!!!bad!!!
```

Proceed to a new-account registration step.

Expected:

```text
Referral username is not prefilled from this value
no referral_link_open row with !!!bad!!! is accepted
```

### 6. Verify backend event validation directly if desired

A direct event using an invalid referral resource ID must return HTTP 400 because `referral_username` resource IDs use the same username grammar as Auth.

### 7. Do not complete a disposable real referral signup unless desired

Landing/prefill can be verified independently from conversion.

When a real conversion is tested later, the expected authoritative behavior remains:

```text
one referrals row
referred user +500 XP via referral_joined
referrer +1000 XP via referral_reward
invited-user count increases from referrals
```

## Next 21B slice after this verification

Add the user-facing **Copy referral link** action to the existing Profile Menu, using the canonical URL contract proven here. Then perform one full signup conversion verification and run `pnpm generate` before closing 21B.

## Invariant

The local modification:

```text
public/data/prompts.json
```

is unrelated to this work and must not be included in 21B commits.
