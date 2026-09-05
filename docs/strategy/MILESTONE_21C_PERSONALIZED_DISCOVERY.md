# Milestone 21C — User Preferences & Personalized Discovery

Status: **CAPABILITY AUDIT COMPLETE / DESIGN COMPLETE / IMPLEMENTATION STARTED**

Parent:

```text
Milestone 21 — Growth Foundation
```

Predecessor:

```text
Milestone 21B — Referral Growth Activation
DONE / LOCALLY VERIFIED / USER ACCEPTED
```

Canonical 21B verification:

```text
docs/strategy/MILESTONE_21B_VERIFICATION.md
```

## 1. Goal

Add the first explicit, persisted user-interest model and use it to make the existing homepage meaningfully different for different signed-in users.

The first 21C release is deliberately small:

```text
signed-in user
  -> chooses visual interests that already have real Prompt Draft content
  -> preferences persist on the account
  -> homepage changes to expose selected discovery paths first
  -> selected paths deep-link into the existing Prompt Archive tag filter
```

This is not a recommendation-model project and it is not a new content taxonomy project.

## 2. Capability audit

### Existing systems to reuse

```text
Auth user UUID / active-session system
progressive account/profile system
PostgreSQL migrations and query layer
Prompt Archive relational tag taxonomy
GET /api/archive tag filtering
localized EN/FA frontend
existing static / homepage
existing /prompts discovery UI
21A product analytics primitive for later measurement
```

### Missing capability

Before 21C there is no persisted account-level discovery preference model.

There is also no personalized homepage state. The current homepage is one static hero with Create Prompt and Guide actions for every visitor.

### Important existing Archive behavior

The Archive already supports canonical relational tags and server filtering:

```text
GET /api/archive?tag=<slug>
```

The list endpoint returns metadata/cards and available tags, while the current Archive product still requires an authenticated account with email.

21C must not remove that gate. Public discovery/SEO belongs to 21D.

### Deep-link gap found during audit

The current `/prompts` page maintains an internal `tagFilter`, but it does not initialize that filter from `route.query.tag`.

Therefore a personalized homepage link such as:

```text
/prompts?tag=portrait
```

would not yet produce the intended filtered experience.

21C will close that small real gap instead of adding a second discovery page.

## 3. Do not offer future domains prematurely

The Milestone 21 roadmap explicitly warns against asking users to choose categories that do not yet change the product experience.

Therefore V1 does **not** present these future domains as preferences yet:

```text
Programming
Education
Marketing
broad Content Creation categories without a distinct current path
```

Those may become preference domains only after the corresponding product/domain expansion exists.

## 4. V1 interest taxonomy

The first preference keys are product-level interest clusters backed by content that already exists in the current Prompt Archive.

```text
portrait_photography
three_d_sculpture
illustration_animation
poster_editorial
product_fashion
cinematic_game_art
```

These are not replacements for Archive tags. They are stable user-interest keys that can map to one or more existing content tags.

### Current primary deep-link mapping

```text
portrait_photography    -> /prompts?tag=portrait
three_d_sculpture       -> /prompts?tag=3d
illustration_animation  -> /prompts?tag=illustration
poster_editorial        -> /prompts?tag=poster
product_fashion         -> /prompts?tag=product
cinematic_game_art      -> /prompts?tag=cinematic
```

### Future ranking bundles

A later recommender can interpret each stable interest more broadly without changing stored user data:

```text
portrait_photography
  -> portrait, photography, avatar

three_d_sculpture
  -> 3d, sculpture

illustration_animation
  -> illustration, animation-style, anime, cartoon

poster_editorial
  -> poster, editorial

product_fashion
  -> product, fashion

cinematic_game_art
  -> cinematic, game-style, pixel-art
```

V1 does not need multi-tag ranking yet. The homepage first pass only needs a truthful primary route for each preference.

## 5. Persistence design

Next migration:

```text
021_user_preferences.sql
```

New one-to-one account table:

```text
user_preferences
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
  discovery_interests TEXT[] NOT NULL DEFAULT '{}'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Why one row per user:

- preferences belong to the existing user identity;
- no parallel profile/account system is needed;
- the row can gain other true preference fields later;
- current discovery state is tiny and bounded;
- account deletion naturally removes preference state.

Database should bound list cardinality but should not hard-code the product allowlist into a CHECK constraint. The backend is the semantic authority so new interest keys do not require a schema migration merely to extend the product taxonomy.

## 6. API contract

Authenticated endpoints:

```text
GET /api/preferences/discovery
PUT /api/preferences/discovery
```

GET response when no row exists:

```json
{
  "ok": true,
  "preferences": {
    "interests": [],
    "updatedAt": null
  }
}
```

PUT body:

```json
{
  "interests": [
    "portrait_photography",
    "illustration_animation"
  ]
}
```

Rules:

```text
active authenticated account required
JSON object only
unknown top-level fields rejected
interests must be an array
maximum 6 interests
all keys must come from the current V1 allowlist
duplicate keys rejected
PUT replaces the full discovery-interest set
empty array is valid at API level
```

The UI may require at least one choice when completing onboarding even though the API supports clearing preferences.

## 7. Identity and privacy boundary

V1 server preferences are account-level and authenticated.

Do not silently persist an anonymous visitor's local choices into a later account in this first slice. Anonymous-to-user preference merging creates identity/ownership semantics that are not needed to prove personalized discovery.

V1 behavior:

```text
anonymous visitor -> generic homepage
signed-in user without preference row -> explicit onboarding panel
signed-in user with preferences -> personalized homepage discovery section
```

This keeps ownership clear and makes account persistence easy to verify.

## 8. Frontend primitive

Add:

```text
app/composables/useDiscoveryPreferences.ts
```

Responsibilities:

```text
canonical V1 interest definitions
GET current account preferences
PUT replacement preference set
strict client normalization
avoid stale preference state when a different user signs in
expose loading/saving state
```

The backend remains authoritative for accepted keys.

## 9. Personalized homepage V1

Keep the existing Prompt Draft hero and primary Create/Guide actions.

Add a compact account-aware discovery panel:

### Signed in, no interests

Show explicit onboarding:

```text
Choose what you want to explore
six current visual-interest choices
select one or more
Save interests
```

### Signed in, preferences exist

Show:

```text
For you
selected interest entry points first
Edit interests
```

Each selected interest opens the existing `/prompts` route with its primary tag query.

### Anonymous

Keep the current generic homepage. A compact sign-in-to-personalize message is allowed but must not block existing Create/Guide actions.

## 10. `/prompts?tag=` deep-link behavior

21C should teach the existing `/prompts` page to initialize `tagFilter` from a valid-looking `route.query.tag` value before the first Archive list request.

This is not a new filter system. It simply connects URL navigation to the already-existing Archive tag filter.

The backend remains the canonical filter implementation.

## 11. Analytics boundary

Preference persistence itself is authoritative state and does not need to be reconstructed from behavioral analytics.

21C V1 does not need a new analytics event merely to save the preference row.

Later, if needed, behavioral events can measure:

```text
preference onboarding shown
preference onboarding completed
personalized discovery card opened
```

Those would remain observational and separate from the preference row.

## 12. First implementation sequence

```text
C1 close 21B verification documentation
C2 create 021_user_preferences.sql
C3 add authenticated preferences API
C4 add useDiscoveryPreferences frontend primitive
C5 add localized homepage preference onboarding/personalized section
C6 make /prompts?tag=<slug> initialize the existing tag filter
C7 local persistence + reload + account-isolation verification
C8 verify personalized deep links produce filtered Archive requests
C9 pnpm generate
C10 mark 21C DONE only after user acceptance
```

## 13. Acceptance criteria

21C is complete when local verification proves:

```text
021 migration applies
signed-out homepage remains usable and generic
signed-in user with no preferences sees explicit current-interest onboarding
saving interests persists one user_preferences row
reload restores the same interest set
another account does not inherit the first account's server preferences
unknown/duplicate preference keys are rejected by backend
selected homepage interests visibly change the user's discovery section
personalized interest opens /prompts?tag=<expected-tag>
/prompts initializes its existing tag filter from the URL
Archive access/email rules remain unchanged
no Programming/Education/Marketing dead-end preference is shown
no second user/profile/tag system exists
pnpm generate passes
```

## 14. Hard rules

```text
DO NOT create a second account/profile identity for preferences.
DO NOT store preferences in user_score_events or product_analytics_events.
DO NOT replace canonical Archive tags with the preference keys.
DO NOT make protected Archive prompt content public in 21C.
DO NOT offer future domains that do not yet create a meaningfully different experience.
DO NOT silently merge anonymous preferences into an account in V1.
DO NOT build ML/recommendation infrastructure before the explicit preference loop is proven.
```
