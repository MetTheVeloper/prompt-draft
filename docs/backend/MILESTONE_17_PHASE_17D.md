# Milestone 17 — Phase 17D: ArvanCloud Object Storage integration

Status: `DONE / LOCALLY VERIFIED`

Branch: `feature/docker-local-api`

Last verified: 2026-09-04

Phase 17D is complete and explicitly accepted by the user after real local/browser verification, including the final deep-link and Manage pagination fixes. The project-wide static-generation release invariant was also confirmed before proceeding to Phase 17E.

## Dedicated Archive media bucket

```text
bucket: prompt-draft-archive-media
region: ir-thr-at1
S3 endpoint: https://s3.ir-thr-at1.arvanstorage.ir
public host: https://prompt-draft-archive-media.s3.ir-thr-at1.arvanstorage.ir
versioning: enabled
lifecycle: not configured
CORS: not configured
```

The existing website-deploy bucket and GitHub Actions secrets were deliberately left untouched.

## Secret handling

Archive runtime credentials use backend-only environment variables:

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

Real credentials live only in ignored local `.env` / production backend secret storage. `.env.example` contains names/defaults only. Storage credentials never enter Nuxt public runtime config or the browser bundle.

## Verified Arvan capability

Real credentials were tested against the real bucket.

Verified signed operations:

```text
HeadBucket   200
PutObject    200
HeadObject   200
GetObject    200, bodyMatches=true
DeleteObject 204
archiveStorageCapability=OK
```

Verified anonymous/public read:

```text
PublicGet 200
bodyMatches=true
```

This confirms endpoint, region, credentials, SigV4 implementation, path-style behavior, upload, signed read/delete, and public-read delivery.

## Storage adapter

Implemented without AWS SDK dependency:

```text
backend/src/archiveStorage.mjs
backend/src/archive-storage-smoke.mjs
```

The adapter uses Node built-ins + AWS Signature Version 4 and supports:

```text
HEAD bucket/object
PUT object
GET object
DELETE object
public URL generation
storage error parsing
```

## Durable image schema

Migration:

```text
backend/sql/014_archive_media_storage_keys.sql
```

Managed image rows persist separate keys for full and thumbnail objects.

Immutable object layout:

```text
archive/<archive-item-uuid>/<image-uuid>/full.webp
archive/<archive-item-uuid>/<image-uuid>/thumb.webp
```

Reorder therefore never changes object URLs.

Current object headers:

```text
Content-Type: image/webp
Cache-Control: public, max-age=31536000, immutable
x-amz-acl: public-read
```

## Durable media flow

Verified browser flow:

```text
/manage/archive
  -> prepare full WebP + thumbnail WebP locally
  -> Save as draft
  -> Prompt Draft backend
  -> Arvan Object Storage
  -> prompt_archive_images
  -> prepared queue clears
  -> Publish becomes available immediately
```

The browser never receives S3 credentials.

Verified managed image row example characteristics:

```text
storage_key present
thumbnail_storage_key present
full_url on Arvan
thumbnail_url on Arvan
mime_type=image/webp
full dimensions/sizes persisted
thumbnail dimensions/sizes persisted
positions contiguous from 0
```

The user locally verified two uploaded images for Telegram message `9001`, including public Archive rendering and full-detail image navigation.

## Admin media API

Implemented and verified:

```text
POST   /api/admin/archive/:archiveItemUuid/images
PUT    /api/admin/archive/:archiveItemUuid/images/order
DELETE /api/admin/archive/:archiveItemUuid/images/:imageUuid
```

All media mutations require `archive.manage` and return the parent item to `draft`/`managed` state before republishing.

Audit vocabulary includes:

```text
archive.image.upload
archive.image.reorder
archive.image.delete
```

Upload failure performs best-effort cleanup of newly-created objects. Delete commits the DB/user-visible state first and then performs best-effort storage cleanup, so cleanup failure can create an orphan object but not a live broken DB row.

## Public Archive media behavior

The existing server read model uses:

```text
thumbnail_url for card media
full_url for full/detail media
source_path as legacy fallback
```

The user verified that a published managed item renders Arvan media correctly in `/prompts` and its detail view.

No CORS rule is required for the current browser-display flow because upload is backend-proxied and display uses ordinary `<img>` GET requests.

## Manage Archive deep links

The final UX polish added a stable human-readable edit link:

```text
/manage/archive?edit=<telegram-message-id>
```

Example:

```text
/manage/archive?edit=9001
```

Backend admin resolution maps the Telegram ID to the authoritative Archive UUID before loading the item.

Verified behavior:

```text
Edit action updates the URL
refresh reopens the same editor
Back/Forward remain meaningful
Back to Archive removes the edit query
Prompt cards expose an Edit FAB only to users with archive.manage
normal users do not receive the privileged action
```

## Manage cursor pagination bug + fix

A final bug was found in `/manage/archive` Load more.

Root cause:

```text
PostgreSQL updated_at has microsecond precision
-> cursor passed through JavaScript Date
-> Date.toISOString() truncated to milliseconds
-> keyset boundary moved slightly
-> imported rows with near-identical timestamps were skipped
-> second page returned items=[] and hasMore=false
```

Fix:

```text
cursor keeps the PostgreSQL timestamp text at full precision
cursor decode validates it but no longer normalizes through Date.toISOString()
```

The user locally verified Load more after the fix: subsequent pages append correctly and the button remains until the real final page.

## Verification summary

Explicitly confirmed locally by the user:

```text
Arvan signed capability smoke test
Arvan anonymous PublicGet
014 migration applied
real full/thumb upload
PostgreSQL storage metadata persistence
public Arvan image access
published card + detail media rendering
Manage persisted-image behavior
Archive publish flow
Manage deep-link refresh behavior
admin-only Prompt-card Edit action
Manage cursor Load more pagination fix
final static generation gate
```

Phase 17D is closed. Phase 17E owns snapshot export, fully-local fallback media mirroring, and Milestone 17 closure.
