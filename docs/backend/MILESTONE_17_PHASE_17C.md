# Milestone 17 — Phase 17C: Manage Archive + local image preparation

Status: `IMPLEMENTED / AWAITING LOCAL VERIFICATION`

Branch: `feature/docker-local-api`

Phase 17A is complete. The user explicitly accepted and closed Phase 17B after verifying the normal Archive API path, server-side filtering/search behavior, cursor-driven reads, and recoverable local fallback in the browser.

Phase 17C is not DONE from code creation alone. The Manage workspace, mutations, image preparation behavior, authorization, audit behavior, importer handoff safeguard, and static generation must be locally verified by the user.

## Scope implemented

Phase 17C adds the first management surface for Prompt Archive while deliberately keeping cloud upload out of scope.

Implemented:

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

Intentionally not implemented:

```text
ArvanCloud upload
S3 credentials in frontend or repository
presigned uploads
backend upload proxy
cloud image persistence / replacement
storage cleanup semantics
CDN/custom domain integration
fallback snapshot export
new canonical-tag creation UI
variant editor
```

Those storage responsibilities remain Phase 17D.

## Manage authorization

The permissions introduced in Phase 17A are now actively used:

```text
archive.view
archive.manage
```

Current role resolution grants both to `admin`; `super_admin` receives `*`.

Three layers remain in force:

```text
Manage section visibility -> archive.view
/manage/archive route middleware -> archive.view
backend admin Archive handler -> archive.view / archive.manage authoritative check
```

Backend admin Archive routes independently authenticate the Bearer session before permission evaluation.

## Manage Archive API

### GET /api/admin/archive

Requires `archive.view`.

Supported query parameters:

```text
limit   default 20, max 100
cursor  opaque updatedAt + UUID keyset cursor
query   search text
status  draft | published | archived
model   dall-e | gpt-image-1
```

Search covers:

```text
Telegram message id
English title
Persian title
source title
prompt body
tag slugs
```

Ordering is management-oriented:

```text
updated_at DESC
id DESC
```

### GET /api/admin/archive/tags

Requires `archive.view` and returns the canonical tag catalog from `prompt_archive_tags`.

The Manage form selects from this catalog through the existing `el-multi-select`; it does not create ad-hoc spellings.

### GET /api/admin/archive/:uuid

Requires `archive.view` and returns full managed metadata plus current persisted image metadata.

### POST /api/admin/archive

Requires `archive.manage`.

Creates:

```text
status = draft
source_kind = managed
```

Telegram URL is derived from Archive channel metadata and Telegram message id; it is not manually entered.

### PUT /api/admin/archive/:uuid

Requires `archive.manage`.

A metadata save deliberately produces:

```text
status = draft
source_kind = managed
```

This is important for existing published legacy rows: changing the editor form never changes the public published read model silently. The operator must explicitly publish after reviewing the saved draft.

Existing variants and persisted image rows are not discarded by metadata-only edits.

### Explicit status actions

Require `archive.manage`:

```text
POST /api/admin/archive/:uuid/publish
POST /api/admin/archive/:uuid/archive
POST /api/admin/archive/:uuid/draft
```

Public `/api/archive` continues to return `published` rows only.

## Validation

Backend validation is authoritative.

Current boundaries include:

```text
Telegram id -> positive safe integer + DB uniqueness
EN title -> required, max 300
FA title -> required, max 300
source title -> optional, max 5000
publishedAt -> valid timestamp
prompt -> required, max 200000
preview model -> supported Archive model
optimizedFor -> one or more unique supported models
tags -> max 50, unique canonical lowercase slugs
request JSON body -> max 1 MiB
```

Selected tags are checked against the database canonical catalog before mutation.

## Audit

Successful privileged Archive mutations append to the existing `admin_audit_log`.

Actions:

```text
archive.create
archive.update
archive.publish
archive.archive
archive.draft
```

The current audit table is user-target oriented, so Archive actions keep `target_user_id = NULL` and store Archive identity and transition details in `metadata`, including fields such as:

```text
archiveItemId
telegramMessageId
fromStatus / toStatus
fromSourceKind / toSourceKind
```

## Legacy importer handoff safeguard

Phase 17A's importer is a bootstrap/migration tool, not a permanent synchronization engine.

Once an imported row is edited or receives a managed status action, it becomes:

```text
source_kind = managed
legacy_title_key remains present as provenance
```

`archive:import` now checks for managed rows that still carry legacy provenance before starting its transaction. If any exist, the importer fails before writing anything.

This prevents a later bootstrap import from silently overwriting management changes, including the case where the operator changes a legacy item's Telegram message id.

Before Manage takes ownership of any imported row, the importer remains rerunnable with the Phase 17A idempotency behavior.

## Shared image processing core

Low-level browser image conversion was extracted from `ImageBatchConverter.vue` into:

```text
app/utils/imageProcessing.ts
```

The existing batch converter now uses the same shared decode/canvas/export core as Manage Archive rather than maintaining a second implementation.

Reusable responsibilities include:

```text
decodeImageFile()
getDecodedImageSize()
renderImageToCanvas()
exportCanvasBlob()
resizeWithinBounds()
convertImageFile()
prepareArchiveImage()
```

## Archive image input contract

Accepted inputs are deliberately strict:

```text
image/jpeg -> .jpg or .jpeg
image/png  -> .png
image/webp -> .webp
```

Both MIME type and extension must agree.

Unsupported formats are rejected rather than silently converted.

Input UX supports:

```text
file picker
multiple files
drag and drop
clipboard image paste
preview
remove
reorder
```

## Prepared image output

Current constants:

```text
full image
  MIME: image/webp
  max edge: 2048 px
  quality: 0.60

thumbnail
  MIME: image/webp
  max edge: 640 px
  quality: 0.72
```

Both outputs preserve aspect ratio and never upscale beyond source dimensions.

Each ready local item exposes provider-neutral state:

```text
source File/name/size
full Blob/dimensions/size
thumbnail Blob/dimensions/size
preview object URLs
position
processing status/error
```

Owned object URLs are revoked on removal/clear/unmount.

## Cloud boundary in 17C

Prepared media is browser-memory state only.

Nothing is uploaded to ArvanCloud in this phase.

If local prepared images exist in the editor, Publish is blocked with an explicit message. This avoids a misleading state where metadata is published while newly selected media has not been durably uploaded.

Existing already-persisted legacy image records remain visible and are not modified by the local preparation UI.

## Local verification gate

### 1. Pull and rebuild

```powershell
git pull
docker compose up -d --build db api
```

No new SQL migration is introduced by Phase 17C.

### 2. Manage section and authorization

With an admin/super-admin account:

```text
/manage shows Prompt Archive section
/manage/archive opens
GET /api/admin/archive returns 200
GET /api/admin/archive/tags returns the canonical tag list
```

Verify an ordinary user cannot access `/manage/archive` and cannot call the admin Archive API successfully.

### 3. Admin list

Verify:

```text
current imported rows appear
search triggers server request
status filter triggers server request
model filter triggers server request
Load more uses cursor and appends without duplicates
manual refresh works
```

### 4. Draft create

Create a temporary Archive item using an unused Telegram message id.

Verify:

```text
EN/FA titles save
publishedAt saves
prompt saves
preview model saves
optimizedFor saves
tags come from canonical catalog
Telegram URL is derived
status is draft
source kind is managed
public /prompts does not show the draft
```

### 5. Edit + explicit publish semantics

Edit the temporary item and save metadata.

Verify it remains/moves to draft.

Then explicitly Publish and verify it becomes visible through the normal `/prompts` API path.

Move it back to draft and verify the public API no longer returns it. Exercise Archive/restore-to-draft as well.

### 6. Audit

Inspect recent Archive audit rows:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT action, metadata, created_at FROM admin_audit_log WHERE action LIKE 'archive.%' ORDER BY created_at DESC LIMIT 20;"
```

Expected actions include the mutations exercised above.

### 7. Local image preparation

Use representative JPEG, PNG, and WebP images.

Verify:

```text
picker works
multiple files work
drag/drop works
clipboard image paste works
unsupported format is rejected
full output reports <= 2048 max edge
thumbnail reports <= 640 max edge
small source is not upscaled
prepared outputs are WebP
sizes/dimensions render
remove works
reorder works
no processing errors remain
```

Prepared images must remain clearly local-only; no S3/Arvan request should appear in Network.

### 8. Existing batch converter regression

Open the existing Image Batch Converter and convert representative files to WebP and JPEG.

It should still export successfully after the shared-core extraction.

### 9. Importer ownership safeguard

Before editing any legacy row, `archive:import` may still produce normal parity behavior.

After deliberately editing one imported legacy item through Manage, do not use the importer as a sync mechanism. A test run should now fail before writes with a message that legacy import is locked because imported rows are managed by `/manage/archive`.

Only perform this test on local data where that ownership transition is intentional.

### 10. Release invariant

```powershell
pnpm generate
```

Phase 17C remains `IMPLEMENTED / AWAITING LOCAL VERIFICATION` until the user confirms the required behavior and static generation locally.

## Next phase

After Phase 17C verification:

```text
Phase 17D — Object Storage / CDN
```

The preferred first step is a provider capability spike against the dedicated ArvanCloud Archive-media bucket:

```text
HeadBucket
PutObject
HeadObject/public GET
DeleteObject
```

Only after that capability test passes should the storage adapter and durable media upload flow be connected to Manage Archive.
