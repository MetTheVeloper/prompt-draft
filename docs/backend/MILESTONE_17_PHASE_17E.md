# Milestone 17 — Phase 17E: Snapshot export + platform closure

Status: `IMPLEMENTED / AWAITING LOCAL VERIFICATION`

Branch: `feature/docker-local-api`

Phase 17D is complete and locally verified. Phase 17E is the final Milestone 17 phase and closes the gap between the authoritative PostgreSQL/Arvan Archive and the static deploy fallback.

## Implemented target

Primary path remains:

```text
PostgreSQL
  -> /api/archive list/detail
  -> /prompts

/manage/archive
  -> browser image preparation
  -> backend
  -> Arvan Object Storage
  -> prompt_archive_images
```

Generated fallback path is now:

```text
PostgreSQL published Archive
  -> pnpm archive:snapshot
  -> public/data/prompts.json schemaVersion 3
  -> local fallback media
  -> /prompts fallback reader
```

## Snapshot command

Root command:

```text
pnpm archive:snapshot
```

It executes the backend exporter inside the running API container:

```text
backend/src/export-prompt-archive-snapshot.mjs
```

Docker Compose exposes a dedicated writable snapshot mount:

```text
./public -> /archive-output/public
ARCHIVE_SNAPSHOT_OUTPUT_ROOT=/archive-output
```

The existing import source mount remains read-only.

## Normalized V3 snapshot

Generated file:

```text
public/data/prompts.json
```

Canonical generated schema is now:

```text
schemaVersion: 3
channel
updatedAt
modelHistory
items[]
  id
  title.en
  title.fa
  sourceTitle
  publishedAt
  telegramUrl
  model.previewGeneratedWith
  model.optimizedFor
  images[]
    position
    fullUrl
    thumbnailUrl
  prompt
  tags
  variants
```

New generated snapshots no longer depend on `titleKey` or runtime locale lookup.

`usePromptArchive()` is V3-first and still accepts the old V2/titleKey snapshot only as backward-compatible migration input.

Fallback security semantics are unchanged:

```text
network / timeout / 5xx / unusable API response -> fallback allowed
401 / 403 -> fallback forbidden
```

## Managed media mirroring

Managed Arvan images are mirrored during snapshot generation using signed backend S3 GET requests.

Local mirror namespace:

```text
public/prompts/_snapshot/<telegram-id>/<image-uuid>/full.webp
public/prompts/_snapshot/<telegram-id>/<image-uuid>/thumb.webp
```

The generated JSON points at those local URLs, not Arvan URLs.

Therefore the static fallback is independent from both:

```text
Prompt Draft backend availability
Arvan Object Storage availability
```

The mirror namespace is deliberately separate from the historical numeric `public/prompts/<telegram-id>/...` directories.

Existing referenced mirrors are overwritten from authoritative storage during rerun. Stale mirror directories are pruned only after a successful export/parity pass, so an interrupted export does not intentionally destroy the previous snapshot's media first.

## Legacy media decision

Selected Phase 17E strategy:

```text
B. retain legacy media locally; use Arvan for newly-managed media
```

Legacy `source_path` assets continue to use their existing local URLs under:

```text
public/prompts/<telegram-id>/...
```

The exporter verifies those files exist and are non-empty before it writes the new snapshot.

No bulk migration of the historical legacy media set to Arvan is performed in Milestone 17. This avoids unnecessary data movement while preserving the already-working local assets and fully-local fallback behavior.

## Snapshot parity / fail-fast behavior

The exporter compares generated content against authoritative published DB state and reports at least:

```text
published item count
snapshot item count
Telegram IDs
EN/FA titles
prompt bodies
published dates
model fields
tags
variants
image counts
image ordering
```

It also verifies every referenced local legacy asset and every mirrored managed full/thumbnail asset exists and is non-empty.

Success output includes:

```text
archiveSnapshot: PARITY_OK
mismatchCount: 0
schemaVersion: 3
mirroredManagedImageCount
legacyMediaStrategy: local-assets-retained
```

Parity failure exits non-zero and the generated catalog is not treated as valid closure output.

## Bootstrap compatibility

`backend/src/import-prompt-archive.mjs` now accepts both:

```text
legacy V2 snapshot with titleKey + string image paths
normalized V3 snapshot with title.en/title.fa + image DTOs
```

This matters because after `public/data/prompts.json` is upgraded to V3, a fresh development database can still seed the published catalog from the deploy snapshot.

Important boundary:

```text
snapshot/bootstrap contains published Archive only
```

It is not a full backup of Manage state. Draft and archived admin records are not expected to be reconstructed from the public static snapshot.

The existing fail-fast protection still prevents the bootstrap importer from overwriting rows that have already transitioned into managed ownership on a live database.

## Determinism and rerun behavior

Items are exported in a stable published-date / Telegram-ID order. Tags are sorted, image ordering follows authoritative positions, and `updatedAt` is derived from authoritative persisted timestamps rather than wall-clock export time.

Re-running without Archive changes should not create semantic snapshot drift.

Managed mirror paths are stable because they use Archive item identity indirectly through Telegram directory plus immutable image UUID.

## Local verification gate

Phase 17E is not DONE until the user explicitly confirms the following.

### 1. Pull/rebuild

```powershell
git pull
docker compose up -d --build db api
```

### 2. Generate snapshot

```powershell
pnpm archive:snapshot
```

Expected:

```text
archiveSnapshot = PARITY_OK
mismatchCount = 0
schemaVersion = 3
```

The current published managed test item (`9001`, if still published) should be included and its two managed images should be mirrored locally.

### 3. Inspect generated files

```powershell
git status --short
```

Expected generated changes include:

```text
public/data/prompts.json
public/prompts/_snapshot/...
```

Verify the JSON starts with schemaVersion 3 and includes a managed published item such as `9001` when present.

### 4. Backend-online path

With API running, `/prompts` should continue to report/use:

```text
source=api
```

### 5. Fully-local fallback path

Keep an already-authenticated SPA tab open, then stop only the API:

```powershell
docker compose stop api
```

Trigger an Archive list/detail reload.

Expected:

```text
source=fallback
current exported published items remain visible
managed item media loads from /prompts/_snapshot/... rather than Arvan
```

This proves the new snapshot is current and media fallback is local.

Restart API afterward:

```powershell
docker compose start api
```

### 6. Access semantics

Existing authoritative rule remains:

```text
401/403 never downgrade to fallback
```

No Phase 17E code intentionally changes that contract.

### 7. Localization sanity

While exercising fallback, switch EN/FA and confirm titles render from snapshot `title.en/title.fa` without legacy i18n-key dependence.

### 8. Commit generated fallback assets

Because the deploy is static and GitHub Actions currently has no production DB connection, the generated snapshot/media must be committed after verification:

```powershell
git add public/data/prompts.json public/prompts/_snapshot
git commit -m "Refresh Prompt Archive fallback snapshot"
git push
```

Do not add `.env` or storage credentials.

### 9. Final release invariant

```powershell
pnpm generate
```

Milestone 17 can be marked `DONE / LOCALLY VERIFIED` only after the generated snapshot, fallback behavior, and final static generation are explicitly confirmed by the user.

## Milestone closure docs

At final confirmation update:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

Phase documents remain the detailed implementation history.

## Non-goals retained

Phase 17E does not add:

```text
Telegram bot ingestion
Telegram scraping
public submissions
likes/favorites/comments
AI tag generation
new search technology
presigned browser uploads
CDN purge automation
full admin-state backup/restore
```
