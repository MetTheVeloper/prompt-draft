# Milestone 17 — Phase 17D: ArvanCloud Object Storage integration

Status: `IMPLEMENTED / AWAITING FULL LOCAL VERIFICATION`

Branch: `feature/docker-local-api`

Phase 17C is complete and locally verified. Phase 17D now has both a verified Arvan S3 capability layer and the first durable Manage Archive media workflow. It is not DONE until the public-read and end-to-end browser verification gates below are explicitly confirmed by the user.

## Dedicated Archive bucket

The user created a separate ArvanCloud Object Storage bucket for Archive media:

```text
bucket: prompt-draft-archive-media
region: ir-thr-at1
S3 endpoint: https://s3.ir-thr-at1.arvanstorage.ir
public/bucket host: https://prompt-draft-archive-media.s3.ir-thr-at1.arvanstorage.ir
versioning: enabled
lifecycle: not configured
CORS: not configured
bucket public display: created as disabled/private
```

The existing website-deploy bucket and its GitHub Actions secrets are deliberately untouched.

## Secret handling

Archive runtime credentials use a separate namespace:

```text
ARCHIVE_S3_ENDPOINT
ARCHIVE_S3_REGION
ARCHIVE_S3_BUCKET
ARCHIVE_S3_PUBLIC_BASE_URL
ARCHIVE_S3_FORCE_PATH_STYLE
ARCHIVE_S3_OBJECT_ACL
ARCHIVE_S3_ACCESS_KEY_ID
ARCHIVE_S3_SECRET_ACCESS_KEY
ARCHIVE_S3_SMOKE_PUBLIC_READ
```

Real credentials must never be committed. Repository policy already ignores `.env` and `.env.*` while allowing only `.env.example` to be tracked.

For local development:

```text
copy .env.example -> .env
fill ARCHIVE_S3_ACCESS_KEY_ID and ARCHIVE_S3_SECRET_ACCESS_KEY locally
Docker Compose automatically reads root .env
Compose forwards only ARCHIVE_S3_* values to the API container
```

The Archive media object ACL defaults to `public-read` in local Compose unless explicitly overridden. This is separate from the GitHub Actions deploy secret namespace.

For production, these variables belong in the backend runtime/platform secret store. They must never be exposed through Nuxt public runtime config or bundled frontend code.

## Capability spike — VERIFIED

The user locally verified real credentials against the real dedicated bucket on 2026-09-04.

Observed result:

```text
HeadBucket   200
PutObject    200
HeadObject   200
GetObject    200, bodyMatches=true
DeleteObject 204
archiveStorageCapability=OK
```

Verified configuration:

```text
endpoint=https://s3.ir-thr-at1.arvanstorage.ir
region=ir-thr-at1
bucket=prompt-draft-archive-media
forcePathStyle=true
credentials configured=true
```

This proves the custom SigV4 adapter works with Arvan for signed bucket/object operations.

The public-read capability is still a separate gate because the first smoke run intentionally used:

```text
ARCHIVE_S3_SMOKE_PUBLIC_READ=false
```

## Native storage adapter

Implemented:

```text
backend/src/archiveStorage.mjs
backend/src/archive-storage-smoke.mjs
```

No AWS SDK dependency was added. S3-compatible requests are signed with AWS Signature Version 4 using Node built-ins.

Current primitives:

```text
path-style S3 request URL generation
SigV4 signing
HEAD bucket/object
PUT object
GET object
DELETE object
public URL generation
storage error parsing
```

Signed request base:

```text
https://s3.ir-thr-at1.arvanstorage.ir/prompt-draft-archive-media/...
```

Public URL base:

```text
https://prompt-draft-archive-media.s3.ir-thr-at1.arvanstorage.ir/...
```

## Durable storage schema

Phase 17D adds migration:

```text
backend/sql/014_archive_media_storage_keys.sql
```

It adds:

```text
prompt_archive_images.thumbnail_storage_key
```

`storage_key` remains the full-image object key. Keeping both keys explicit makes cleanup provider-safe and avoids deriving one key from another by string convention.

Managed object keys are immutable and UUID-based:

```text
archive/<archive-item-uuid>/<image-uuid>/full.webp
archive/<archive-item-uuid>/<image-uuid>/thumb.webp
```

They do not depend on Telegram ID or position, so reorder operations never invalidate URLs and the objects can use long-lived immutable cache headers.

Current upload headers:

```text
Content-Type: image/webp
Cache-Control: public, max-age=31536000, immutable
x-amz-acl: public-read   # default local Archive media policy
```

## Admin media API

All media mutation endpoints require authenticated `archive.manage` permission.

### Upload one prepared image pair

```text
POST /api/admin/archive/:archiveItemUuid/images
Content-Type: application/json
```

Payload contains one locally prepared full WebP and thumbnail WebP as base64 plus dimensions and exact byte sizes.

Authoritative server validation includes:

```text
request <= 24 MiB
full decoded bytes <= 12 MiB
thumbnail decoded bytes <= 4 MiB
full dimensions <= 2048 edge
thumbnail dimensions <= 640 edge
base64 must be canonical/valid
reported sizes must match decoded bytes
max 100 persisted images per Archive item
```

On success it:

```text
uploads full object
uploads thumbnail object
persists both keys + public URLs + dimensions + sizes
sets Archive item status=draft
sets source_kind=managed
writes archive.image.upload audit row
```

Prepared browser images are uploaded sequentially. After each successful API call that item is removed from the local queue. Therefore a later failure does not cause successful images to be uploaded again on retry.

### Delete persisted image

```text
DELETE /api/admin/archive/:archiveItemUuid/images/:imageUuid
```

The database record is removed transactionally first and remaining positions are normalized. The parent Archive item returns to draft and `archive.image.delete` is audited.

After commit, managed Arvan objects are deleted. Cleanup failures are returned as warnings rather than restoring a now-obsolete DB record. Legacy static `source_path` images have no Arvan keys and therefore do not require a storage call when removed.

### Reorder persisted images

```text
PUT /api/admin/archive/:archiveItemUuid/images/order
{
  "imageIds": ["...all current image UUIDs exactly once..."]
}
```

Reorder is DB-only because object URLs are immutable. It returns the parent item to draft and writes `archive.image.reorder` to the audit log.

## Storage / DB failure semantics

Upload uses:

```text
upload full
upload thumbnail
DB transaction insert/update/audit
```

If the thumbnail upload or DB transaction fails, already-uploaded new objects are best-effort deleted before the error is returned.

Delete deliberately uses the opposite priority:

```text
DB transaction removes the user-visible record
then best-effort object cleanup
```

This avoids a database row pointing to an object that was already destructively removed. A cleanup failure creates an orphan object, not a broken live Archive record.

## Draft-first media semantics

Every media mutation sets the parent Archive item to:

```text
status=draft
source_kind=managed
```

This prevents upload/delete/reorder from silently changing a currently public published item.

The editor flow is now:

```text
prepare images locally
Save as draft
  -> save metadata
  -> upload prepared full/thumb pairs
  -> persist prompt_archive_images
  -> refresh durable item
local prepared queue becomes empty
Publish becomes immediately enabled
```

The Phase 17C behavior where the operator had to leave/reopen the editor is removed by durable persistence.

## Existing media management

The Manage editor now exposes controls on persisted images for:

```text
move left
move right
delete
```

These call the authoritative backend media API and refresh both the item and management list afterward.

## Public Archive consumption

No special frontend media proxy is introduced.

The existing public Archive read model already prefers:

```text
thumbnail_url for cards
full_url for full media
source_path only as legacy fallback
```

Therefore, after publish, newly stored media can be served directly by Arvan using the stable URLs persisted in PostgreSQL.

CORS is still not required for this flow because upload is browser -> Prompt Draft backend -> Arvan, while Archive display uses ordinary browser image GETs. If a future feature reads these images into canvas from the Arvan origin, CORS rules will need to be revisited.

## Versioning note

Bucket versioning is enabled. A normal S3 DeleteObject on a versioned bucket may create a delete marker rather than physically erase historical object versions. Public/current access is removed, but noncurrent versions may continue consuming storage.

No lifecycle rule is configured yet. If media churn becomes meaningful, a later infrastructure task should consider a safe lifecycle for noncurrent/deleted versions rather than automatically enabling destructive cleanup now.

## Remaining local verification gates

### 1. Public-read capability

Run without editing `.env`:

```powershell
docker compose exec -e ARCHIVE_S3_SMOKE_PUBLIC_READ=true api node src/archive-storage-smoke.mjs
```

Expected additional step:

```text
PublicGet 200 bodyMatches=true
```

If this fails with 403 while signed operations remain green, Arvan bucket/public-display policy must be adjusted before publishing cloud-backed media.

### 2. Apply media migration and rebuild

```powershell
git pull
docker compose up -d --build db api
docker compose exec api npm run db:schema
```

Expected final migration:

```text
014_archive_media_storage_keys.sql
```

### 3. End-to-end Manage upload

Use a draft/new temporary Archive item and prepare at least two images.

Verify after Save:

```text
browser upload requests go only to Prompt Draft API, never expose S3 credentials
POST /api/admin/archive/:uuid/images returns 201 for each prepared image
prepared queue clears as uploads succeed
Current persisted images appear without leaving/reopening editor
Publish becomes clickable immediately
```

Database inspection:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT position, storage_key, thumbnail_storage_key, full_url, thumbnail_url, width, height, thumbnail_width, thumbnail_height, mime_type, size_bytes, thumbnail_size_bytes FROM prompt_archive_images WHERE archive_item_id = '<UUID>' ORDER BY position;"
```

Expected managed rows have both storage keys, both Arvan URLs, `image/webp`, dimensions, and byte sizes.

### 4. Public image access + publish

Open a stored `thumbnail_url` from the API/DB directly in a fresh/private browser context. It must load without Prompt Draft authentication.

Then publish the draft and verify `/prompts` renders its Arvan thumbnail and detail media correctly.

### 5. Reorder and delete

Exercise persisted image reorder and delete.

Verify:

```text
item returns to draft
positions remain contiguous from 0
reorder does not change object URLs
deleted managed media disappears from Archive detail
storage cleanup does not break remaining images
```

Audit inspection:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT action, metadata, created_at FROM admin_audit_log WHERE action LIKE 'archive.%' ORDER BY created_at DESC LIMIT 30;"
```

Expected new actions include:

```text
archive.image.upload
archive.image.reorder
archive.image.delete
```

### 6. Release invariant

```powershell
pnpm generate
```

Phase 17D can be marked DONE only after the user explicitly confirms these gates.
