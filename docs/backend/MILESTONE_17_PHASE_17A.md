# Milestone 17 — Phase 17A: Archive data foundation + import

Status: `DONE / LOCALLY VERIFIED`

Verified on: `2026-09-04`

Branch: `feature/docker-local-api`

Phase 17A is complete. The user ran the full local verification gate, confirmed import parity and rerun safety, inspected the imported PostgreSQL data, and completed a successful static `pnpm generate`.

## Scope completed

Phase 17A intentionally implemented only the Prompt Archive data/import foundation.

Implemented:

```text
backend/sql/013_prompt_archive_foundation.sql
backend/src/import-prompt-archive.mjs
backend/package.json -> archive:import
compose.yaml -> read-only Archive source mounts
backend archive.view / archive.manage permission identifiers
frontend matching permission identifiers
```

Intentionally deferred to later phases:

```text
/prompts API cutover
server-first Archive reads
local fallback repository
/manage/archive route/UI
Archive mutation APIs
image-processing utility extraction
Archive image-manager UI
Object Storage / ArvanCloud
snapshot export
```

## Durable schema

### prompt_archive_metadata

Preserves payload-level source data:

```text
schema_version
channel
source_updated_at
model_history JSONB
imported_at
```

### prompt_archive_items

Identity:

```text
id UUID PRIMARY KEY
telegram_message_id INTEGER UNIQUE
```

Telegram message ID is the rerunnable natural import key. The UUID is the durable relational identity and is preserved by import reruns.

Localized titles are stored with Archive content:

```text
titles = { en, fa }
legacy_title_key = migration provenance only
```

Other current item fields retained:

```text
source_title
telegram_url
published_at
prompt
preview_model
optimized_for[]
variants JSONB
status
```

`source_kind` separates legacy JSON-imported rows from future managed rows.

### prompt_archive_images

Current local image paths are imported as ordered image records:

```text
archive_item_id
position
source_path
mime_type
```

The relation reserves provider-neutral future storage/delivery metadata without starting Object Storage:

```text
storage_key
full_url
thumbnail_url
width / height
thumbnail_width / thumbnail_height
size_bytes / thumbnail_size_bytes
```

### canonical tags

Durable catalog:

```text
prompt_archive_tags
prompt_archive_item_tags
```

Import builds the catalog from the DISTINCT union of current JSON tags. Legacy tag slugs must already be trimmed lowercase canonical values.

## Import behavior

Command:

```text
npm run archive:import
```

The API container receives read-only source mounts for:

```text
public/data/prompts.json
i18n/locales/en.ts
i18n/locales/fa.ts
```

Existing `titleKey` values are resolved against both locale objects and persisted as localized Archive data.

The import runs in one PostgreSQL transaction and is safe to rerun:

```text
same telegram_message_id -> same archive item UUID
source-owned fields -> reconciled from the snapshot
tag memberships -> reconciled
image source path/position -> reconciled
future storage columns -> preserved
legacy rows removed from JSON -> removed from legacy import set
managed rows -> excluded from legacy cleanup
unreferenced legacy-import tags -> cleaned up
```

## Parity verification

Importer parity checks cover:

```text
payload schemaVersion/channel/updatedAt/modelHistory
item count
Telegram IDs
EN/FA titles
legacy title keys
source titles
Telegram URLs
prompt bodies
published dates
preview model
optimizedFor
tags
canonical tag union
variants
image counts
image source paths/order
```

Local result:

```text
archiveImport: PARITY_OK
sourceItemCount: 100
databaseItemCount: 100
canonicalTagCount: 23
databaseCanonicalTagCount: 23
mismatchCount: 0
```

The import was executed again and returned `PARITY_OK` a second time.

## Idempotency verification

UUID-map hash before rerun:

```text
519d6e02c2bef2645fa82f261ae43ca7
```

UUID-map hash after rerun:

```text
519d6e02c2bef2645fa82f261ae43ca7
```

The identical hash confirms imported Telegram IDs retained the same durable UUIDs across reruns.

## Direct database inspection

Verified counts:

```text
legacy archive items: 100
canonical tags: 23
image records: 276
```

Localized title samples were inspected directly in PostgreSQL and correctly contained both English and Persian values.

Variant preservation was inspected directly:

```text
telegram_message_id 419 -> 1 variant
```

Canonical tag catalog was inspected directly and contained 23 expected slugs.

## Permission foundation

Identifiers now exist at the shared backend/frontend authorization boundary:

```text
archive.view
archive.manage
```

The initial backend mapping grants both to `admin`; `super_admin` receives them through wildcard `*`.

No Manage Archive route or Archive admin endpoint was exposed in Phase 17A.

## Release invariant

The user ran:

```text
pnpm generate
```

Result: successful static generation on `2026-09-04`.

Existing accepted non-blocking warnings remained present, including duplicate `compilePromptOutput`, sourcemap/cache-driver warnings, and large chunk warnings.

## Phase conclusion

Phase 17A is `DONE / LOCALLY VERIFIED`.

The next planned phase is **Phase 17B — Server read APIs + fallback repository**.

Do not begin Object Storage or `/manage/archive` mutation work before the read-path/fallback layer is implemented and locally verified.
