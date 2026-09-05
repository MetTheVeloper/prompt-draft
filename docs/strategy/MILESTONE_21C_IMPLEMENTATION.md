# Milestone 21C — User Preferences & Personalized Discovery Implementation Handoff

Status: **FIRST PRODUCT SLICE IMPLEMENTED / AWAITING LOCAL VERIFICATION**

Branch:

```text
feature/growth-foundation
```

Design source:

```text
docs/strategy/MILESTONE_21C_PERSONALIZED_DISCOVERY.md
```

Predecessor verification:

```text
docs/strategy/MILESTONE_21B_VERIFICATION.md
```

## Implemented slice

The first 21C slice adds explicit account-level discovery preferences and immediately uses them to personalize the existing homepage.

Implemented files:

```text
backend/sql/021_user_preferences.sql
backend/src/userPreferences.mjs
backend/src/index.mjs
app/composables/useDiscoveryPreferences.ts
app/pages/index.vue
app/pages/prompts.vue
i18n/locales/growth.en.ts
i18n/locales/growth.fa.ts
i18n/i18n.config.ts
```

## Database

Migration:

```text
021_user_preferences.sql
```

New table:

```text
user_preferences
```

Fields:

```text
user_id UUID PRIMARY KEY -> users(id) ON DELETE CASCADE
discovery_interests TEXT[] NOT NULL DEFAULT '{}'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

The list is bounded to six entries at the database level. Product key semantics remain backend-controlled so adding a future valid interest does not require a migration only to change a CHECK enum.

## Preferences API

Authenticated endpoints:

```text
GET /api/preferences/discovery
PUT /api/preferences/discovery
```

Current accepted keys:

```text
portrait_photography
three_d_sculpture
illustration_animation
poster_editorial
product_fashion
cinematic_game_art
```

PUT is strict:

```text
Content-Type application/json
4 KiB body ceiling
body must be an object
only top-level field = interests
interests must be an array
maximum 6 values
unknown keys rejected
duplicate keys rejected
full-list replacement semantics
```

No email requirement is added to preference persistence. An active authenticated user is sufficient.

## Frontend preference primitive

Composable:

```text
app/composables/useDiscoveryPreferences.ts
```

It owns:

```text
canonical V1 interest definitions
primary Archive-tag deep links
GET/PUT API calls
loaded-for-user identity guard
loading/saving state
strict client normalization
```

V1 intentionally does not silently merge anonymous local interests into a user account.

## Personalized homepage

The existing homepage hero remains intact.

For a signed-in user with no saved interests, the homepage now shows an explicit preference selector with six current visual directions.

After save, the panel becomes a **For you** section containing only the selected directions plus an Edit interests action.

The six choices are backed by live current Archive content:

```text
Portraits & Photography
3D & Sculpture
Illustration & Animation
Posters & Editorial
Product & Fashion
Cinematic & Game Art
```

Future domains such as Programming, Education, and Marketing are deliberately not shown because they do not yet produce a distinct current experience.

If the preference GET fails, onboarding is not allowed to assume the account has no preferences; the homepage shows an error/retry state instead of risking an accidental overwrite.

Anonymous visitors retain the current generic homepage.

## Archive deep links

The existing `/prompts` page now initializes its already-existing tag filter from:

```text
/prompts?tag=<slug>
```

Primary mappings:

```text
portrait_photography    -> /prompts?tag=portrait
three_d_sculpture       -> /prompts?tag=3d
illustration_animation  -> /prompts?tag=illustration
poster_editorial        -> /prompts?tag=poster
product_fashion         -> /prompts?tag=product
cinematic_game_art      -> /prompts?tag=cinematic
```

This does not create a second Archive/filter system. The existing Archive API performs the actual tag filtering.

The current Archive login+email access contract remains unchanged.

## Local verification sequence

### 1. Pull

```powershell
git pull
```

Do not discard or commit the unrelated local modification:

```text
public/data/prompts.json
```

### 2. Rebuild API

Backend source and SQL are copied into the Docker image:

```powershell
docker compose up -d --build api
```

### 3. Apply schema

```powershell
docker compose exec api npm run db:schema
```

Expected final migration line:

```text
Database schema applied: 021_user_preferences.sql
```

### 4. Inspect schema

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d user_preferences"
```

### 5. Homepage onboarding

Sign in with an account that does not yet have a `user_preferences` row and open:

```text
http://localhost:3030/
```

Expected:

```text
original Prompt Draft hero/actions still work
interest onboarding panel appears
only the six current visual directions are offered
one or more choices can be selected
Save interests becomes available after selecting at least one
```

Choose a small set such as:

```text
Portraits & Photography
Illustration & Animation
Product & Fashion
```

and save.

Expected immediately after save:

```text
onboarding panel becomes For you
only selected directions are shown
Edit interests is available
```

### 6. Verify PostgreSQL persistence

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT u.username, p.discovery_interests, p.created_at, p.updated_at FROM user_preferences p JOIN users u ON u.id=p.user_id ORDER BY p.updated_at DESC;"
```

Expected selected keys for the test account.

### 7. Reload persistence

Hard refresh the homepage.

Expected:

```text
For you restores from server
saved interests are unchanged
onboarding is not shown again for that account
```

### 8. Edit persistence

Click Edit interests, change the set, save, and run the query again.

Expected:

```text
same user_preferences row remains
interest array changes
updated_at advances
```

### 9. Verify account isolation

Sign out and use a second existing account with no preference row.

Expected:

```text
second account does not inherit the first user's server preferences
second account sees its own onboarding state
```

### 10. Verify strict backend validation

With the first account's current Bearer token available in browser/local testing, PUT an unknown or duplicate key if desired.

Expected:

```text
HTTP 400
code = PREFERENCES_VALIDATION
```

The normal UI never sends invalid values.

### 11. Verify personalized deep link

From **For you**, click Portraits & Photography.

Expected URL:

```text
/prompts?tag=portrait
```

For an account with Archive access (email present), the Archive tag dropdown should initialize to `portrait` and the first list request should use the existing tag filter.

Equivalent mappings should work for the other selected directions.

### 12. Confirm Archive access rule is unchanged

An account without email may save preferences, but opening the Prompt Archive still follows the existing email requirement. 21C does not bypass it.

### 13. Release invariant

```powershell
pnpm generate
```

Must pass before 21C is marked DONE.

## Acceptance gate

Do not close 21C until the user verifies:

```text
migration 021 applies
preference API works with authenticated user
homepage onboarding renders only current meaningful interests
save creates one user_preferences row
reload restores preferences
edit updates the same row
account isolation works
personalized homepage visibly reflects selected interests
/prompts?tag= deep link activates existing filter
Archive access rules remain unchanged
pnpm generate passes
```

## Invariants

```text
preferences are not score events
preferences are not analytics events
preference keys do not replace Archive tags
no anonymous->account silent merge in V1
no future dead-end domains are shown
public/data/prompts.json remains unrelated
```
