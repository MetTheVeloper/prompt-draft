# Milestone 17 — Prompt Archive Platform

Status: `DONE / LOCALLY VERIFIED`

Selected: 2026-09-04

Completed: 2026-09-04

Branch: `feature/docker-local-api`

This document is the final source of truth for the Prompt Archive Platform migration from a static local catalog to an authoritative PostgreSQL/API/Manage platform with Arvan-hosted managed media and a generated static fallback.

## Final architecture

Primary runtime path:

```text
PostgreSQL
  -> Prompt Archive backend read APIs
  -> server-side search/filter/order/cursor pagination
  -> /prompts API-first repository
```

Management path:

```text
/manage/archive
  -> archive.view / archive.manage
  -> create/edit/draft/publish/archive
  -> canonical tags
  -> EN/FA dynamic titles
  -> browser media preparation
  -> backend storage adapter
  -> Arvan Object Storage
  -> prompt_archive_images
  -> admin_audit_log
```

Fallback path:

```text
PostgreSQL published Archive
  -> pnpm archive:snapshot
  -> public/data/prompts.json schemaVersion 3
  -> local legacy media
  -> mirrored managed media under public/prompts/_snapshot
  -> /prompts fallback reader
```

The fallback is used for recoverable backend failure. Authentication/authorization failures are not treated as fallback conditions.

## Phase outcomes

### 17A — data foundation + import parity

Status: `DONE / LOCALLY VERIFIED`

Created the Archive relational model:

```text
prompt_archive_metadata
prompt_archive_items
prompt_archive_images
prompt_archive_tags
prompt_archive_item_tags
```

Key decisions:

```text
DB row UUID = durable primary key
Telegram message ID = natural/import identifier
localized titles stored as content
canonical tags normalized into durable catalog tables
variants + model history preserved
legacy JSON import is idempotent
managed rows are protected from later legacy-import overwrite
```

The user verified:

```text
100 source items = 100 imported legacy items
23 canonical tags
276 image rows
localized EN/FA titles
variant parity
stable UUID mapping across rerun
PARITY_OK / mismatchCount=0
pnpm generate
```

Detailed phase document:

```text
docs/backend/MILESTONE_17_PHASE_17A.md
```

### 17B — server read APIs + fallback repository

Status: `DONE / USER-VERIFIED LOCALLY`

`/prompts` moved to an API-first normalized repository with:

```text
server-side search
model filtering
tag filtering
sorting
cursor pagination
list/detail split
recoverable JSON fallback
```

The user verified real browser/network behavior, filtering and fallback operation.

Detailed phase document:

```text
docs/backend/MILESTONE_17_PHASE_17B.md
```

### 17C — Manage Archive + local image preparation

Status: `DONE / LOCALLY VERIFIED`

Added:

```text
/manage/archive
archive.view
archive.manage
create/edit Draft flow
explicit Publish / Archive state changes
canonical tag selection
admin audit events
local prepared-media manager
```

Archive media preparation accepts:

```text
jpg/jpeg
png
webp
```

and produces:

```text
full WebP
  max edge = 2048
  quality = 0.60
  aspect ratio preserved
  no upscale

thumbnail WebP
  max edge = 640
  quality = 0.72
  aspect ratio preserved
  no upscale
```

Input methods include file picker, multi-file selection, drag/drop and clipboard paste, with preview/remove/reorder.

Detailed phase document:

```text
docs/backend/MILESTONE_17_PHASE_17C.md
```

### 17D — Arvan Object Storage

Status: `DONE / LOCALLY VERIFIED`

A dedicated Archive media bucket was configured in region `ir-thr-at1`. Storage credentials remain backend-only through ignored local environment variables and production runtime secrets.

Verified capability spike:

```text
HeadBucket -> 200
PutObject -> 200
HeadObject -> 200
signed GetObject -> 200 / body match
anonymous PublicGet -> 200 / body match
DeleteObject -> 204
```

Managed Archive media uses immutable UUID-based keys:

```text
archive/<archive-item-uuid>/<image-uuid>/full.webp
archive/<archive-item-uuid>/<image-uuid>/thumb.webp
```

This makes visual reorder independent from object naming.

Durable media flow:

```text
browser prepared full/thumb
-> Save Draft
-> backend
-> Arvan
-> prompt_archive_images
-> prepared queue clears
-> Publish becomes available
```

Upload/delete/reorder mutation behavior returns content to Draft when appropriate so published Archive state cannot change implicitly.

Deep-link management was added:

```text
/manage/archive?edit=<telegram-message-id>
```

and Admin/Super Admin users receive a direct Edit FAB on public Prompt cards.

Admin Archive cursor pagination was also fixed to preserve PostgreSQL timestamp precision rather than truncating microseconds through JavaScript `Date` conversion.

Detailed phase document:

```text
docs/backend/MILESTONE_17_PHASE_17D.md
```

### 17E — snapshot export + closure

Status: `DONE / LOCALLY VERIFIED`

Added:

```text
pnpm archive:snapshot
```

The exporter creates:

```text
public/data/prompts.json
schemaVersion = 3
```

V3 stores localized titles directly:

```text
title.en
title.fa
```

instead of requiring runtime i18n title keys.

Media strategy:

```text
legacy media
  -> retained under existing local public/prompts paths

managed Arvan media
  -> primary cloud URLs at runtime
  -> mirrored into public/prompts/_snapshot for static fallback
```

This deliberately avoids a risky bulk migration of legacy images merely for uniformity.

At final verification, the user confirmed an exporter run with:

```text
archiveSnapshot = PARITY_OK
publishedItemCount = 101
snapshotItemCount = 101
mismatchCount = 0
schemaVersion = 3
mirroredManagedImageCount = 2
legacyMediaStrategy = local-assets-retained
```

The API was then stopped and `/prompts` correctly reported:

```text
data-archive-source = fallback
```

while rendering the catalog successfully. Final `pnpm generate` also succeeded.

Detailed phase document:

```text
docs/backend/MILESTONE_17_PHASE_17E.md
```

## Archive localization rule

Dynamic Archive content owns its localized titles:

```text
titles.en
titles.fa
```

Do not introduce new managed Archive items whose title depends on source-code i18n keys.

Legacy V2 title keys remain migration compatibility only.

## Archive tags rule

Canonical tag source of truth:

```text
prompt_archive_tags
prompt_archive_item_tags
```

Manage must select from canonical tags rather than introducing uncontrolled spelling/case variants.

## Import rule

The legacy importer is a bootstrap/migration tool, not a permanent synchronization mechanism.

Once an imported item is taken over by Manage as `managed`, the importer must fail safely rather than overwrite managed content.

V3 snapshot compatibility remains available for future bootstrap of published catalog state, but the static snapshot is not a complete backup of Draft/Archived Manage state.

## Storage/security rule

Storage Access Key / Secret Key must never be committed or exposed to the frontend.

Local development uses ignored `.env` values. The repository may contain only non-secret examples such as `.env.example`.

The same storage substrate is now reusable by later media features, which is how Milestones 18 and 19 implement avatars and covers.

## Current consumer behavior

`/prompts` remains subject to the verified product access gate that requires an authenticated account with email.

Manage Archive remains permission protected.

The public/static fallback does not weaken those product authorization rules; it only changes where Archive data is read from after a recoverable API failure.

## Release invariant

Milestone 17 was closed only after:

```text
phase-level local verification
real Arvan storage verification
snapshot parity
API-off fallback verification
successful pnpm generate
```

## Follow-on milestones

The media/storage foundation established here is reused by:

```text
Milestone 18 — User Avatar Foundation
Milestone 19 — Public User Profiles + Cover Media
```

Both are now also complete and locally verified.
