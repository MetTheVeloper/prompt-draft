# Milestone 21C — Personalized Home Experience Extension

Status: **IMPLEMENTED / AWAITING LOCAL VERIFICATION**

Branch:

```text
feature/growth-foundation
```

Parent capability:

```text
Milestone 21C — User Preferences & Personalized Discovery
```

## 1. Why this extension exists

The first 21C slice persisted interests and exposed them as a compact homepage selector/For You panel. That proved account-level preference state and multi-tag discovery, but it did not yet make the homepage itself meaningfully personalized.

This extension turns those preference primitives into the actual homepage experience.

The goal is:

```text
user interests
  -> preferred hero media
  -> preferred showcase section ordering
  -> immersive category sections
  -> direct paths into relevant Prompt Archive items
```

The preference editor is moved out of the homepage content surface and into the reusable global modal system.

## 2. Existing primitives reused

```text
useModal global modal stack
EmailRequirementModal pattern
useDiscoveryPreferences + user_preferences
six current DiscoveryInterestDefinition bundles
multi-tag Archive semantics
visual/tile.vue canvas hero
Prompt Archive images/tags/public IDs
source_user_id provenance from promoted user Drafts
useScreen responsive device state
```

Important implementation finding:

> `app/components/visual/tile.vue` already supports an explicit `sources` array, so the personalized hero does not require a new canvas renderer. The homepage only needs a media-source API and a controlled remount when the source set changes.

## 3. Reusable discovery-preferences modal

New files:

```text
app/components/growth/DiscoveryPreferencesModal.vue
app/composables/useDiscoveryPreferencesModal.ts
```

Behavior:

```text
loads current account interests
renders all six current interest groups
supports multi-select
persists through existing PUT /api/preferences/discovery
requires at least one choice in UI
closes after successful save
accepts an onSaved callback
can be opened from any future surface
```

Homepage behavior:

```text
signed-in + preference data exists -> no automatic modal
signed-in + no preference data      -> modal opens on homepage mount
anonymous                           -> no preference modal
```

The rebuilt hero also exposes a compact `Tune my feed` action for signed-in users, proving that the same modal can be reopened independently of onboarding.

A future Profile Menu action can call the same composable without duplicating preference UI.

## 4. Personalized hero media API

New backend module:

```text
backend/src/homeDiscovery.mjs
```

Endpoint:

```text
GET /api/home/hero-media
```

Query:

```text
?tag=<slug>&tag=<slug>&limit=50
```

Rules:

```text
repeated tag parameters
OR/union tag matching
maximum 24 requested tags
maximum 50 returned media rows
published Archive items only
full image URL preferred
thumbnail URL included as fallback
random ordering per request
if no tags are supplied, samples across all published Archive media
```

The client flattens the selected user's interest bundles and sends the resulting unique tag set.

If the account has no interests, or the visitor is anonymous, the endpoint can return a broad Archive sample.

If the endpoint fails, the existing static `/slider` source set remains the hero fallback.

### Access boundary

This endpoint returns media URLs and Archive public IDs only. It does **not** return prompt text or variants and does not make `/api/archive/:id` public.

This is a homepage preview primitive, not the 21D public-discovery contract.

## 5. Home showcase API

Endpoint:

```text
GET /api/home/showcase
```

Query:

```text
?tag=<slug>&tag=<slug>&limit=5
```

Rules:

```text
repeated tags use OR/union semantics
published Archive items only
maximum 5 items
ordered newest first
returns presentation metadata only
no prompt body
no variants
```

Returned item presentation data:

```text
public Archive id
localized title
publishedAt
telegramUrl when present
tags
first preview image
image count
owner attribution when source_user_id resolves to an active user
```

### Ownership/provenance boundary

The Archive does not currently have a universal creator/owner entity for all historical content.

Therefore:

```text
user_draft-promoted item with active source_user_id -> owner username/avatar may render
legacy_json / managed item without source_user_id     -> owner = null
```

Do not fabricate an owner for legacy content and do not introduce multi-ownership semantics in this milestone.

## 6. Homepage hero redesign

The previous V1 copy is replaced with product/discovery-oriented copy.

English direction:

```text
CURATED PROMPTS · PERSONALIZED DISCOVERY
Find a prompt worth building on.
Explore visual prompts shaped around what you like, open the ones that spark something, and turn inspiration into your next draft.
```

Primary actions:

```text
Explore prompts       -> scroll to discovery feed
Create from scratch   -> /create
Tune my feed          -> reusable preference modal, authenticated users
```

A small bottom-centered scroll affordance invites the user into the feed while preserving the full-screen first impression.

The existing three-tile canvas visual language remains.

## 7. Homepage category sections

There is one section for each of the six current interest definitions.

Each section is implemented as:

```text
app/components/home/HomeDiscoverySection.vue
```

Each section:

```text
height = 100vh / 100svh on mobile
up to five Archive items
active item's image covers the full section background
active item auto-advances
hover pauses autoplay
previous/next controls
slide-position controls
```

Content overlays include:

```text
fixed category title
fixed category description
active item localized title
active item tags
owner avatar + username when authoritative attribution exists
published date
preview image count
View prompt action
Telegram action when telegramUrl exists
```

## 8. Personalized ordering

All six category sections remain available.

For a signed-in user with preferences:

```text
selected categories first
remaining categories after them
```

This makes the page personalized without hiding the rest of the catalog.

Hero media uses only selected category tags when preferences exist.

## 9. Responsive grid composition

The feed uses a six-track CSS grid so section widths can resolve cleanly to thirds, halves, or full width while every row remains exactly one viewport high.

Device mapping uses the existing `useScreen()` states:

```text
mobile               -> 1 section per row, full width
 tablet / laptop     -> up to 2 sections per row, half width
 desktop / wide      -> up to 3 sections per row, one-third width
```

Balancing rules:

```text
2-column mode + one leftover -> final section spans full width
3-column mode + one leftover -> final section spans full width
3-column mode + two leftover -> each of final two spans half width
```

This prevents awkward empty grid cells for future odd section counts.

## 10. No schema migration

This extension reuses:

```text
user_preferences
prompt_archive_items
prompt_archive_images
prompt_archive_tags
prompt_archive_item_tags
users
```

No `022` migration is required.

## 11. Files in this extension

```text
backend/src/homeDiscovery.mjs
backend/src/index.mjs
app/composables/useHomeDiscovery.ts
app/composables/useDiscoveryPreferencesModal.ts
app/components/growth/DiscoveryPreferencesModal.vue
app/components/home/HomeDiscoverySection.vue
app/pages/index.vue
i18n/locales/growth.en.ts
i18n/locales/growth.fa.ts
```

## 12. Local verification

Pull and rebuild API because backend source changed:

```powershell
git pull
docker compose up -d --build api
```

No schema command is required solely for this extension if migration 021 is already applied.

### Hero media API

```powershell
curl.exe "http://127.0.0.1:4000/api/home/hero-media?tag=portrait&tag=photography&limit=50"
```

Expected:

```text
ok = true
media count <= 50
all rows contain public itemId + usable media URL
```

### Showcase API

```powershell
curl.exe "http://127.0.0.1:4000/api/home/showcase?tag=poster&tag=editorial&limit=5"
```

Expected:

```text
ok = true
items count <= 5
no prompt text in response
no variants in response
items match poster OR editorial
owner is nullable
```

### Homepage

Verify:

```text
hero remains exactly one viewport tall
new copy replaces legacy V1 copy
hero uses Archive media when endpoint succeeds
small scroll affordance is bottom-centered
scroll reveals category grid
six category sections appear when current data exists
selected interests are ordered first
section height is one viewport
section width responds as full/half/third according to useScreen state
section slider advances through up to five items
background changes with active item
tags/date/image count render
owner avatar/username appears only when authoritative owner data exists
View Prompt works
Telegram action appears only when URL exists
```

### Preference modal

For an account with an existing `user_preferences` row containing an empty interest array, or after clearing the row through the API:

```text
opening / automatically opens the reusable interest modal
saving interests closes modal
hero source set refreshes
selected sections move first
Tune my feed reopens the same modal
```

### Release invariant

```powershell
pnpm generate
```

Must pass before this extension and 21C are closed.

## 13. Scale note

The current Archive is small enough that random hero media selection through PostgreSQL `ORDER BY RANDOM()` is acceptable for the Growth experiment.

If the media corpus grows by orders of magnitude, replace this selection strategy with a sampled candidate pool or another indexed/random-key strategy rather than preserving a full random sort indefinitely.

## 14. Hard rules

```text
DO NOT put the preference selector back into the homepage content grid.
DO NOT create a second preference persistence system.
DO NOT return prompt bodies from the homepage preview APIs.
DO NOT fabricate creator ownership for historical Archive content.
DO NOT introduce multi-ownership in this milestone.
DO NOT duplicate the Archive tag taxonomy as a second database taxonomy.
DO NOT replace useScreen with unrelated responsive logic.
DO NOT remove the existing /api/archive prompt-content access boundary here.
```
