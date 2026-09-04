# Milestone 17 — Phase 17D: ArvanCloud Object Storage integration

Status: `IN PROGRESS / CAPABILITY SPIKE READY`

Branch: `feature/docker-local-api`

Phase 17C is complete and locally verified. Phase 17D starts with a provider capability spike before wiring durable media uploads into `/manage/archive`.

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
bucket public display: currently disabled/private
```

The existing website-deploy bucket and its GitHub Actions secrets are deliberately left untouched.

## Secret handling

Archive runtime credentials use a separate namespace:

```text
ARCHIVE_S3_ENDPOINT
ARCHIVE_S3_REGION
ARCHIVE_S3_BUCKET
ARCHIVE_S3_PUBLIC_BASE_URL
ARCHIVE_S3_FORCE_PATH_STYLE
ARCHIVE_S3_ACCESS_KEY_ID
ARCHIVE_S3_SECRET_ACCESS_KEY
ARCHIVE_S3_SMOKE_PUBLIC_READ
```

Real credentials must never be committed.

Repository policy already ignores:

```text
.env
.env.*
```

while allowing only `.env.example` to be tracked.

For local development:

```text
copy .env.example -> .env
fill ARCHIVE_S3_ACCESS_KEY_ID and ARCHIVE_S3_SECRET_ACCESS_KEY locally
Docker Compose automatically reads root .env
Compose forwards only ARCHIVE_S3_* values to the API container
```

For production, the same names must be supplied by the backend runtime/platform secret store. They must never be exposed through Nuxt public runtime config or bundled frontend code.

## Why credentials are separate from GitHub Actions

The existing automatic static-site deployment already uses Arvan S3 credentials from GitHub Actions secrets. Phase 17D does not rotate or reuse that secret namespace.

Archive media is runtime backend storage, so its credentials belong to the API runtime rather than the static deployment runner.

This separation avoids breaking the existing deploy workflow and reduces blast radius.

## Native storage adapter

Phase 17D currently adds:

```text
backend/src/archiveStorage.mjs
```

The first implementation deliberately does not add AWS SDK dependencies. It signs S3-compatible requests with AWS Signature Version 4 using Node's built-in crypto/fetch APIs.

Current operations are provider-neutral primitives suitable for the capability spike:

```text
build path-style request URL
SigV4 request signing
HEAD bucket/object
PUT object
GET object
DELETE object
public URL generation
safe storage error parsing
```

Default local configuration uses path-style requests against:

```text
https://s3.ir-thr-at1.arvanstorage.ir/prompt-draft-archive-media/...
```

Public object URLs are generated from:

```text
https://prompt-draft-archive-media.s3.ir-thr-at1.arvanstorage.ir/...
```

## Capability smoke test

Command:

```powershell
docker compose exec api npm run archive:storage-smoke
```

The script creates a random temporary key under:

```text
_prompt-draft-capability/YYYY-MM-DD/<uuid>.txt
```

and verifies:

```text
HeadBucket
PutObject
HeadObject
signed GetObject + byte equality
DeleteObject cleanup
```

The test output never prints access-key or secret-key values. It reports only whether each secret is configured.

Cleanup is attempted in `finally` even when a later capability step fails.

## Public-read test

The bucket is currently private and CORS remains intentionally empty because uploads will initially be backend -> Arvan.

The first smoke test should therefore use:

```text
ARCHIVE_S3_SMOKE_PUBLIC_READ=false
```

After signed S3 operations are verified, Phase 17D will decide the final anonymous-read policy for Archive media. At that point an optional object ACL/public GET test can be enabled with:

```text
ARCHIVE_S3_SMOKE_PUBLIC_READ=true
```

This makes the smoke PUT request include `x-amz-acl: public-read` and then performs an unsigned GET through `ARCHIVE_S3_PUBLIC_BASE_URL`.

If Arvan bucket policy/public-display settings prevent object ACL public reads, the public policy will be configured explicitly before connecting the production Archive UI.

## Current gate

Before adding the real Manage upload endpoint, the user must locally verify the capability smoke test using the real Archive storage credentials.

Expected successful result:

```json
{
  "archiveStorageCapability": "OK",
  "steps": [
    { "name": "HeadBucket", "ok": true },
    { "name": "PutObject", "ok": true },
    { "name": "HeadObject", "ok": true },
    { "name": "GetObject", "ok": true, "bodyMatches": true },
    { "name": "DeleteObject", "ok": true }
  ]
}
```

Only after this capability gate passes will Phase 17D connect:

```text
Manage prepared full/thumbnail blobs
-> authenticated backend upload
-> Arvan object keys
-> prompt_archive_images persistence
-> durable preview URLs
-> replacement/reorder/delete cleanup semantics
-> Publish enabled after durable media persistence
```
