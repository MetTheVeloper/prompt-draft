# Milestone 21C — User Preferences & Personalized Discovery Implementation Handoff

Status: **FIRST PRODUCT SLICE IMPLEMENTED / MULTI-TAG DISCOVERY REVISION IMPLEMENTED / AWAITING LOCAL VERIFICATION**

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

## Current implemented scope

21C adds explicit account-level discovery preferences and immediately uses them to personalize the existing homepage.

The first implementation used one primary Archive tag per discovery interest. Local product review showed that this unnecessarily narrowed discovery because each stable interest represents a cluster of real Archive tags.

The implementation has therefore been revised so one interest maps to a bundle of existing Archive tags, the Prompt Archive tag control is multi-select, the Archive API accepts several tags in one request, and URL deep links preserve those tags.

Implemented/updated files:

```text
backend/sql/021_user_preferences.sql
backend/src/userPreferences.mjs
backend/src/index.mjs
backend/src/archive.mjs
app/composables/useDiscoveryPreferences.ts
app/composables/usePromptArchive.ts
app/types/promptArchive.ts
app/pages/index.vue
app/pages/prompts.vue
i18n/locales/growth.en.ts
i18n/locales/growth.fa.ts
i18n/i18n.config.ts
```

No additional migration is required for the multi-tag revision.

## Database

Migration:

```text
021_user_preferences.sql
```

Table:

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

Preference identity stays separate from Archive tags: stable product-level interest keys are persisted, while their tag bundles may evolve with the content catalog.

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

PUT remains strict and account-scoped.

## Current discovery bundles

The current frontend mapping is:

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

These are discovery mappings, not a replacement taxonomy.

When `/prompts` loads, URL-selected tags are reconciled against `availableTags` returned by the actual Archive service. Tags that do not exist in the current live Archive taxonomy are removed from the active selection and URL.

## Prompt Archive multi-tag API

`GET /api/archive` now accepts repeated `tag` query parameters:

```text
/api/archive?tag=poster&tag=editorial
```

The semantics are **OR / union**:

> return a published Archive item when it has at least one of the selected tags.

This is intentionally the correct semantics for discovery clusters. Choosing `poster + editorial` should broaden to the union of those related content paths rather than requiring every result to contain both tags.

The backend keeps existing query validation and bounds repeated tag filters. Duplicate query tags are normalized away.

The SQL filter reuses the existing relational Archive tag tables and performs one list/count request; no client-side N+1 filtering is introduced.

## Prompt Archive frontend query contract

`PromptArchiveListQuery` now uses:

```ts
{
  tags?: string[]
}
```

`usePromptArchive()`:

```text
serializes each selected tag as a repeated ?tag= value
uses OR semantics in the static fallback snapshot too
keeps API and fallback behavior aligned
continues to return the full real availableTags list
```

## `/prompts` tag UI

The former single-value `el-dropdown` is now:

```text
el-multi-select
```

Behavior:

```text
zero selected tags = All Tags
one or more selected tags = union filter
Clear selection = All Tags
selected tags are written into the URL
URL tag changes update the multi-select
invalid/nonexistent URL tags are removed after real availableTags are known
```

Canonical URL shape:

```text
/prompts?tag=poster&tag=editorial
```

Existing one-tag links remain compatible:

```text
/prompts?tag=portrait
```

## Homepage deep links

The personalized homepage now opens an interest using its whole tag bundle instead of one primary tag.

Example:

```text
Posters & Editorial
  -> /prompts?tag=poster&tag=editorial
```

If only one of those tags exists in the current Archive taxonomy, `/prompts` keeps the valid one and removes the missing one after the service response exposes the canonical `availableTags` set.

## Requested Prompt Archive surface adjustment

The main `/prompts` page surface was also adjusted as requested:

```text
removed bd="b8"
changed bg="normal15" -> bg="surface10"
```

This applies to the `prompts-page__surface` container behind the page content.

## Local verification sequence

### 1. Pull and rebuild backend

Backend Archive code changed, but no new migration was added after 021:

```powershell
git pull
docker compose up -d --build api
```

`021_user_preferences.sql` is already applied in the verified local database, so no new schema step is required solely for this revision.

### 2. Verify API multi-tag union directly

Use an authenticated browser/API path or inspect the network request generated by the UI.

Expected request example:

```text
GET /api/archive?limit=24&sort=newest&tag=poster&tag=editorial
```

Expected behavior:

```text
HTTP 200
results may have poster OR editorial
response.availableTags still contains the full published Archive tag set
```

### 3. Verify Prompt Archive multi-select

Open:

```text
/prompts
```

Expected:

```text
Tag control uses el-multi-select
multiple real tags can remain active simultaneously
changing selections triggers one Archive list request containing repeated tag params
clearing selections restores All Tags
```

### 4. Verify URL sync

Select:

```text
poster
editorial
```

Expected URL:

```text
/prompts?tag=poster&tag=editorial
```

Hard refresh that URL.

Expected:

```text
both existing tags restore in el-multi-select
first list request includes both tags
results are union-filtered
```

### 5. Verify nonexistent URL tags are not retained

Open a URL that contains one valid tag and one syntactically valid but nonexistent tag.

Example:

```text
/prompts?tag=poster&tag=does-not-exist
```

Expected after Archive metadata loads:

```text
poster remains selected
does-not-exist is removed from active selection
URL is normalized to the valid current tag set
```

### 6. Verify homepage interest bundle

On `/`, choose or retain:

```text
Posters & Editorial
```

Open that personalized card.

Expected navigation begins with the bundle:

```text
/prompts?tag=poster&tag=editorial
```

The Prompt Archive then reconciles that bundle against live `availableTags`.

Equivalent bundle behavior should work for all six interests.

### 7. Verify existing preference persistence is unchanged

Existing `user_preferences.discovery_interests` rows remain unchanged in meaning and storage format. No migration/data rewrite should occur.

### 8. Verify visual adjustment

On `/prompts`, inspect the main page surface.

Expected:

```text
no bd="b8" on prompts-page__surface
background uses surface10
```

### 9. Release invariant

```powershell
pnpm generate
```

Must pass before 21C is marked DONE.

## Acceptance gate

Do not close 21C until local verification proves:

```text
existing preference persistence still works
Archive tag filter is el-multi-select
multiple selected tags are sent in one API request
backend returns OR/union results for repeated tag filters
fallback snapshot uses the same OR semantics
URL preserves repeated tag params
hard refresh restores real selected tags
nonexistent URL tags are discarded after availableTags reconciliation
homepage interest cards open their tag bundles
existing Archive access/email rules remain unchanged
prompts-page__surface uses bg=surface10 without bd=b8
pnpm generate passes
```

## Invariants

```text
preference keys do not replace Archive tags
Archive relational tags remain canonical content taxonomy
discovery bundles are frontend product mapping
multiple tag filters use union semantics
no second Archive/filter system exists
no new migration is needed for this revision
public/data/prompts.json remains unrelated
```
