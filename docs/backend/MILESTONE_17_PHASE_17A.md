# Milestone 17 — Phase 17A: Archive data foundation + import

Status: `IMPLEMENTED / AWAITING LOCAL VERIFICATION`

Branch: `feature/docker-local-api`

This phase is not DONE until the user runs the local verification below and explicitly confirms the result.

## Scope implemented

Phase 17A intentionally implements only the Prompt Archive data/import foundation.

Implemented:

```text
backend/sql/013_prompt_archive_foundation.sql
backend/src/import-prompt-archive.mjs
backend/package.json -> archive:import
compose.yaml -> read-only Archive source mounts
backend archive.view / archive.manage permission identifiers
frontend matching permission identifiers
```

Intentionally not implemented in this phase:

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

Preserves current payload-level source data:

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

The Telegram message ID is the rerunnable natural import key. The UUID is the durable relational identity and is preserved by import reruns.

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

`source_kind` separates legacy JSON-imported rows from future managed rows so migration reconciliation does not need to treat all Archive data as disposable import output.

### prompt_archive_images

Current local image paths are imported as ordered image records:

```text
archive_item_id
position
source_path
mime_type
```

The relation already reserves provider-neutral future storage/delivery metadata:

```text
storage_key
full_url
thumbnail_url
width / height
thumbnail_width / thumbnail_height
size_bytes / thumbnail_size_bytes
```

This does not start Object Storage. It only avoids a schema redesign when the two-output image pipeline is connected later.

### canonical tags

Durable catalog:

```text
prompt_archive_tags
prompt_archive_item_tags
```

Import builds the catalog from the DISTINCT union of current JSON tags. Tag slugs must already be trimmed lowercase canonical values; the importer fails instead of silently normalizing a changed legacy value.

This shape is directly suitable for future catalog-driven `el-multi-select` usage.

## Import behavior

Command inside the API container:

```text
npm run archive:import
```

The API container receives read-only source mounts:

```text
./public -> /archive-source/public
./i18n/locales -> /archive-source/i18n/locales
```

The importer reads:

```text
public/data/prompts.json
i18n/locales/en.ts
i18n/locales/fa.ts
```

Existing `titleKey` values are resolved against both locale objects and stored as localized Archive data.

The import runs in one PostgreSQL transaction.

Rerun semantics:

```text
same telegram_message_id -> same archive item UUID
source-owned scalar/JSON fields -> updated from current snapshot
tag memberships -> reconciled
image source path/position -> reconciled
future storage columns -> not overwritten by the import
legacy rows removed from the JSON -> removed from the legacy import set
managed rows -> excluded from legacy-row cleanup
unreferenced legacy-import tag rows -> cleaned up
```

## Parity report

After the write transaction, the importer reads PostgreSQL back and prints JSON with:

```text
archiveImport = PARITY_OK | PARITY_FAILED
sourceItemCount
databaseItemCount
canonicalTagCount
databaseCanonicalTagCount
mismatchCount
categories
mismatches
```

Parity checks include at least:

```text
payload schemaVersion/channel/updatedAt/modelHistory
item count
Telegram IDs
EN titles
FA titles
legacy title keys
source titles
Telegram URLs
prompt bodies
published dates
preview model
optimizedFor
tags
canonical tag union
variants (exact structured comparison, stronger than count-only)
image counts
image source paths/order
```

A parity mismatch exits with code `2`. Import/schema/source failures exit with code `1`.

## Permission foundation

Identifiers now exist at the shared backend/frontend authorization boundary:

```text
archive.view
archive.manage
```

Current initial backend mapping grants both to `admin`; `super_admin` continues to receive them through wildcard `*`.

No Manage section or Archive admin endpoint exists yet, so these permission identifiers do not expose a new UI surface in Phase 17A.

## Local verification gate

From repository root, rebuild/recreate the API so it contains the new script and receives the new read-only mounts:

```powershell
docker compose up -d --build db api
```

Apply schema:

```powershell
docker compose exec api npm run db:schema
```

Run import + parity:

```powershell
docker compose exec api npm run archive:import
```

Expected final report:

```text
"archiveImport": "PARITY_OK"
"mismatchCount": 0
```

### Rerun safety check

Capture imported UUIDs:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT telegram_message_id, id FROM prompt_archive_items WHERE source_kind = 'legacy_json' ORDER BY telegram_message_id;"
```

Run import again:

```powershell
docker compose exec api npm run archive:import
```

Run the UUID query again. The same Telegram IDs must retain the same UUIDs, and the second import must also return `PARITY_OK`.

### Useful database inspection

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT COUNT(*) AS items FROM prompt_archive_items WHERE source_kind = 'legacy_json'; SELECT COUNT(*) AS tags FROM prompt_archive_tags; SELECT COUNT(*) AS images FROM prompt_archive_images;"
```

Localized-title sample:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT telegram_message_id, titles->>'en' AS en, titles->>'fa' AS fa FROM prompt_archive_items WHERE source_kind = 'legacy_json' ORDER BY telegram_message_id DESC LIMIT 5;"
```

Variant sample:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT telegram_message_id, jsonb_array_length(variants) AS variants FROM prompt_archive_items WHERE source_kind = 'legacy_json' AND jsonb_array_length(variants) > 0 ORDER BY telegram_message_id;"
```

Canonical tags:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT slug FROM prompt_archive_tags ORDER BY slug;"
```

## Release invariant

After backend/data verification, run:

```powershell
pnpm generate
```

Phase 17A remains `AWAITING LOCAL VERIFICATION` until the user confirms the import/parity/rerun behavior and static generation.

Do not begin Phase 17B merely because these files exist.
