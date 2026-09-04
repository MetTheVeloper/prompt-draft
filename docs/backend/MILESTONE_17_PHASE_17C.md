# Milestone 17 — Phase 17C: Manage Archive + local image preparation

Status: `DONE / LOCALLY VERIFIED`

Branch: `feature/docker-local-api`

Phase 17C is complete. The user locally verified the Manage Archive flow and explicitly accepted the phase after exercising the management UI, draft creation, publication behavior, local image preparation, public Archive visibility, and audit output.

## Implemented scope

```text
/manage/archive
archive.view route/UI gate
archive.manage mutation gate
server-side admin list/search/status/model/cursor reads
canonical tag catalog read
create managed Archive draft
edit Archive metadata as draft
explicit publish / archive / restore-to-draft actions
admin audit entries for Archive mutations
legacy-import -> managed ownership handoff safeguard
shared browser image-processing utility
Archive image picker / multi-select / drag-drop / paste
local full WebP + thumbnail WebP preparation
preview / remove / reorder / processing state
existing persisted-image preview
English + Persian Manage Archive localization
```

Cloud upload remains intentionally outside 17C and moves to Phase 17D.

## Manage authorization

The active permissions are:

```text
archive.view
archive.manage
```

The normal three-layer authorization model applies:

```text
Manage section visibility -> archive.view
/manage/archive route middleware -> archive.view
backend admin Archive handler -> authoritative archive.view/archive.manage check
```

## Manage Archive API

Read routes:

```text
GET /api/admin/archive
GET /api/admin/archive/tags
GET /api/admin/archive/:uuid
```

Mutation routes:

```text
POST /api/admin/archive
PUT /api/admin/archive/:uuid
POST /api/admin/archive/:uuid/publish
POST /api/admin/archive/:uuid/archive
POST /api/admin/archive/:uuid/draft
```

Metadata creation/editing produces a managed draft. Public visibility changes only through the explicit publication action.

## Audit

Privileged mutations are written to the existing `admin_audit_log` with actions including:

```text
archive.create
archive.update
archive.publish
archive.archive
archive.draft
```

The user locally verified audit output. One verified flow created Telegram message id `9001` as a managed draft and then published it; the audit table contained both `archive.create` and `archive.publish` with Archive identity/status metadata.

## Legacy importer handoff safeguard

The original JSON importer is a bootstrap/migration tool, not a permanent sync engine.

Once a legacy row is taken over by Manage it becomes:

```text
source_kind = managed
```

and the importer detects managed rows carrying legacy provenance before writing. This prevents a future bootstrap import from silently overwriting management changes.

## Shared image processing core

Low-level browser image conversion was extracted from `ImageBatchConverter.vue` into:

```text
app/utils/imageProcessing.ts
```

The existing converter and Manage Archive now share the same decode/canvas/export implementation.

Archive input is intentionally strict:

```text
image/jpeg -> .jpg or .jpeg
image/png  -> .png
image/webp -> .webp
```

Prepared outputs:

```text
full WebP
  max edge: 2048 px
  quality: 0.60

thumbnail WebP
  max edge: 640 px
  quality: 0.72
```

Aspect ratio is preserved and images are never upscaled.

## Local-only media boundary verified

Phase 17C keeps prepared images only in browser memory. The user verified the image preparation UI and the local-only warning.

When prepared local media exists, Publish is deliberately disabled because those blobs are not durable yet. Returning to the list clears that transient browser-memory queue, which is why reopening the item makes Publish available again.

This behavior is a 17C safety boundary, not a stale-state bug. Phase 17D replaces it with the complete flow:

```text
prepare -> upload -> persist image metadata -> clear local queue -> publish enabled
```

## User verification outcome

The user locally demonstrated/confirmed:

```text
/manage/archive loads and lists Archive rows
managed draft creation works
canonical tags and metadata save correctly
local image preparation produces full + thumbnail outputs
archive.create audit row is written
explicit Publish works
archive.publish audit row is written
published managed item becomes visible in /prompts
public Archive count increased from 100 to 101 for the test item
no Arvan upload occurred during Phase 17C
```

The user then explicitly stated that the required Phase 17C tests were complete and only ArvanCloud integration remained.

## Next phase

```text
Phase 17D — Object Storage / CDN integration
```

The first gate is a provider capability spike against the dedicated Archive-media bucket before any production upload flow is connected.
