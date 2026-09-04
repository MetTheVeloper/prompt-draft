# Milestone 17 — Prompt Archive Platform

Status: `PLANNED / NOT STARTED`

Selected on: 2026-09-04

This document is the source of truth for moving the current Prompt Archive from a static local JSON/catalog into a backend-owned archive platform while preserving a resilient static fallback and the existing Nuxt static-generation contract.

Do not mark this milestone DONE from code creation alone. Each phase must be locally verified by the user, and the final milestone requires a successful `pnpm generate`.

## Product goal

Current `/prompts` behavior is backed by a local static archive:

```text
public/data/prompts.json
public/prompts/<telegram-message-id>/*
```

The target is:

```text
PostgreSQL archive source of truth
  -> backend Archive read APIs
  -> /prompts server-first loading
  -> local JSON + local images as fallback snapshot

/manage/archive
  -> permission-aware Archive management
  -> add/edit/publish/archive Telegram-channel prompt entries
  -> localized titles stored with the content
  -> canonical tag selection
  -> local image preparation now
  -> cloud/Object Storage upload layer later
```

The local JSON is not deleted. It changes role from primary source to deploy-time fallback snapshot.

## Current verified frontend access baseline

Before this milestone starts, the following product access behavior is already implemented and locally verified:

```text
/prompts Header entry is visible to everyone
/prompts content requires authenticated user + account email
anonymous / missing-email users enter /prompts first
Email Requirement modal auto-opens with from = promptArchive
closing the modal leaves the user on /prompts with a blocked-state CTA
Prompt Draft on Telegram action is available from the blocked state
/collage is limited to admin / super_admin through permission-aware UI + route access
403 and 404 use the dedicated EL-system error page
```

The user also verified a successful static `pnpm generate` after the access/error-page work.

These access rules remain in force during Milestone 17.

## Current archive implementation baseline

Current loader:

```text
app/composables/usePromptArchive.ts
```

It loads only:

```text
/data/prompts.json
```

Current payload type:

```text
app/types/promptArchive.ts
```

Current `PromptArchiveItem` fields include:

```text
id                  Telegram message/post id in practice
titleKey            i18n path, e.g. prompts.items.511.title
sourceTitle
publishedAt
telegramUrl
model.previewGeneratedWith
model.optimizedFor
images[]
prompt
tags[]
variants?
```

Current title rendering uses:

```text
t(item.titleKey)
```

Current images use local public paths such as:

```text
/prompts/511/01.webp
```

Current `/prompts` list loads the entire payload and performs search/filter/sort in the browser.

Current JSON also contains payload-level metadata such as `schemaVersion`, `channel`, `updatedAt`, and `modelHistory`. Migration work must account for these fields deliberately rather than silently discarding them.

## Architectural invariants

Milestone 17 must preserve:

```text
static Nuxt frontend
backend independent from Nuxt server routes
pnpm generate support
browser -> backend API through existing typed boundary
backend authorization authoritative for Manage mutations
local fallback must remain usable when backend archive read fails
local fallback must never bypass a 401/403 access decision
```

The UI should consume one normalized Archive DTO regardless of whether data came from PostgreSQL/API or local fallback JSON.

Do not scatter `if server else local` behavior throughout Prompt components.

## Target read architecture

```text
/prompts
  -> Prompt Archive repository/composable
      -> try backend Archive API
      -> normalize/validate response
      -> on recoverable backend failure, load local snapshot
  -> one normalized DTO
  -> existing list/detail UI
```

Fallback is allowed for failures such as:

```text
network unavailable
timeout
5xx backend error
invalid/unusable archive response
```

Fallback must NOT be used to bypass:

```text
401
403
```

The current static JSON is public deploy content, so it is not treated as a secret/security boundary. The `/prompts` email/account requirement remains a product access gate until the archive payload itself is moved behind an authoritative protected API contract.

## Server read API direction

Prefer separate list and detail read models instead of returning the full prompt body for every archive card.

Proposed public/product endpoints:

```text
GET /api/archive
GET /api/archive/:telegramMessageId
```

List query contract should support server-side behavior such as:

```text
limit
cursor
search
model
tag
sort = newest | oldest
```

The list response should contain only fields needed for cards/filter facets, for example:

```text
telegramMessageId
title
publishedAt
preview model
optimizedFor
tags
cover thumbnail
image count
```

The detail response can add:

```text
full prompt
all full images
sourceTitle
variants
Telegram URL/source metadata
```

This prevents archive growth from forcing every visitor to download every full prompt body and full image URL on initial load.

## Archive database direction

The durable archive identity should not depend on Telegram message id alone.

Recommended item table shape:

```text
prompt_archive_items
  id UUID PRIMARY KEY
  telegram_message_id INTEGER UNIQUE NOT NULL
  channel TEXT NOT NULL
  titles JSONB NOT NULL
  source_title TEXT
  published_at TIMESTAMPTZ NOT NULL
  prompt TEXT NOT NULL
  preview_model TEXT NOT NULL
  optimized_for TEXT[] NOT NULL
  status TEXT NOT NULL  -- draft | published | archived
  created_by UUID
  updated_by UUID
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
```

`telegram_message_id` remains the user-facing/channel identifier and is used to construct the Telegram post URL, but the relational database identity is the archive UUID.

### Image records

Do not keep durable managed images only as an arbitrary URL array.

Recommended relation:

```text
prompt_archive_images
  id UUID PRIMARY KEY
  archive_item_id UUID NOT NULL
  position INTEGER NOT NULL
  storage_key TEXT
  full_url TEXT
  thumbnail_url TEXT
  width INTEGER
  height INTEGER
  thumbnail_width INTEGER
  thumbnail_height INTEGER
  mime_type TEXT
  size_bytes BIGINT
  thumbnail_size_bytes BIGINT
  created_at TIMESTAMPTZ
```

During the pre-cloud phase, processed image Blob/object-URL state can exist only in the Manage client form. Durable cloud URLs/keys become relevant when the Object Storage phase starts.

### Tag catalog

Tags are dynamic archive content and should not become another source-code/i18n dependency.

Build a canonical tag catalog by extracting the DISTINCT union of every current `tags[]` value from `public/data/prompts.json`.

Recommended durable model:

```text
prompt_archive_tags
  id UUID PRIMARY KEY
  slug TEXT UNIQUE NOT NULL
  created_at TIMESTAMPTZ

prompt_archive_item_tags
  archive_item_id UUID
  tag_id UUID
  PRIMARY KEY (archive_item_id, tag_id)
```

The initial migration/import seeds `prompt_archive_tags` from all tag slugs already used by the existing JSON archive.

`/manage/archive` must use the project's existing `el-multi-select` to select tags from this canonical catalog.

Initial scope should prefer catalog selection over arbitrary ad-hoc tags so spelling/casing variations do not fragment filters. A later explicit tag-management action can add new canonical tags if needed.

The public list API can expose available/faceted tag slugs for `/prompts` filtering without depending on a frontend hardcoded tag list.

## Localization decision — localized content belongs in archive data

New archive entries must NOT require the operator to type an i18n key.

`/manage/archive` should provide separate fields for:

```text
English title
Persian title
```

Durable form:

```json
{
  "title": {
    "en": "Natural LinkedIn Portrait",
    "fa": "پرتره طبیعی لینکدین"
  }
}
```

Reason:

Archive entries are dynamic content. If new prompt titles depend on adding keys to `i18n/locales/en.ts` and `fa.ts`, every Archive publish still requires source-code edits and a frontend redeploy, defeating the purpose of the management workspace.

### Existing title migration

The current JSON uses title keys such as:

```text
prompts.items.6.title
prompts.items.511.title
```

The migration/import utility must read:

```text
public/data/prompts.json
+ current English locale
+ current Persian locale
```

and resolve every existing `titleKey` into localized archive data before inserting into PostgreSQL.

After parity is verified, generate/upgrade the local fallback snapshot to a normalized schema that contains localized title data directly. The runtime archive UI should eventually consume one normalized shape instead of keeping two permanent title systems.

A temporary V2 import adapter is acceptable for migration tooling; it should not become a permanent second runtime model.

## Local fallback snapshot contract

The current `public/data/prompts.json` becomes a fallback snapshot rather than a file operators edit by hand.

Long-term preferred workflow:

```text
PostgreSQL Archive
  -> archive snapshot/export script
  -> public/data/prompts.json
  -> static deploy fallback
```

A command such as the following is a desired later convenience:

```text
pnpm archive:snapshot
```

The snapshot must use the same normalized Archive DTO semantics as the API as far as practical.

For fallback images, existing local assets remain available under:

```text
public/prompts/<telegram-message-id>/...
```

Do not delete local image assets during the initial server migration.

## Image preparation pipeline for Manage Archive

Before connecting any cloud provider, `/manage/archive` needs a reusable local image preparation component.

### Reuse existing converter core

Current `ImageBatchConverter.vue` already implements useful browser-side primitives:

```text
File -> createImageBitmap where available
HTMLImageElement decode fallback
Canvas 2D rendering
canvas.toBlob()
WebP/JPEG quality control
object URL preview lifecycle
multi-file drag/drop handling
```

Do NOT make the new Archive uploader import or depend on the `ImageBatchConverter.vue` component itself.

Instead, extract/refactor the low-level image decode/canvas/export logic into a reusable utility/service that both the converter and Archive uploader can call.

Example responsibility boundary:

```text
app/utils/imageProcessing.ts
  decodeImageFile()
  renderImageToCanvas()
  exportCanvasBlob()
  resizeWithinBounds()
  prepareArchiveImage()
```

Exact file names can change during implementation; the separation of reusable processing logic from UI components is the invariant.

### Allowed input formats

Archive image input is intentionally stricter than the current general converter.

Accept only:

```text
image/jpeg (.jpg / .jpeg)
image/png  (.png)
image/webp (.webp)
```

Reject unsupported image formats such as GIF, SVG, BMP, AVIF, etc. for the Archive workflow unless the scope is explicitly expanded later.

Validation should check both MIME type and filename extension defensively.

### Input UX

The Archive image manager must support:

```text
file picker
multiple images
drag and drop
paste from clipboard
preview
remove
reorder
```

Processing should happen locally in the browser before any future upload step.

### Required output per selected image

Each accepted source image produces two prepared WebP assets:

```text
full image
  -> image/webp
  -> mandatory quality = 0.6
  -> optimized/resized according to Archive full-image bounds

thumbnail
  -> image/webp
  -> smaller dimensions
  -> optimized for card/list loading
```

Both outputs must preserve aspect ratio and must not upscale an image beyond its source dimensions.

Suggested initial bounds to evaluate during implementation:

```text
full max edge: 2048px
thumbnail max edge: 640px
```

These dimensions are recommendations, not yet a verified product invariant. Final constants should be confirmed during the first implementation phase using representative current archive images.

The full-image WebP quality requirement of `0.6` is explicit product scope.

The thumbnail quality can be chosen separately for acceptable visual quality/weight; it should not be assumed to require the same value unless testing supports it.

### Prepared-image client contract

The uploader should expose a provider-neutral prepared representation similar to:

```text
id
sourceFile
sourceName
sourceSize
fullBlob
fullWidth
fullHeight
fullSize
thumbnailBlob
thumbnailWidth
thumbnailHeight
thumbnailSize
preview URLs
position
processing status/error
```

This allows the later cloud-storage phase to consume already-prepared `fullBlob` + `thumbnailBlob` without redesigning `/manage/archive`.

Object URLs must be revoked when items are removed or the component unmounts.

## Future Object Storage / CDN phase

Cloud storage is deliberately NOT the first implementation phase.

After database/read/manage behavior is stable, connect an Object Storage provider such as ArvanCloud.

Security invariant:

```text
storage access key / secret never enters the Nuxt client
```

Provider credentials belong only in backend environment/secrets.

Preferred eventual flow, subject to current provider capabilities/documentation:

```text
Manage browser
  -> request upload authorization from Prompt Draft backend
  -> upload prepared full/thumbnail WebP assets
  -> Object Storage/CDN
  -> backend persists storage keys/URLs in prompt_archive_images
```

At implementation time, verify current ArvanCloud Object Storage APIs and choose between presigned/direct upload and backend-proxied upload based on the provider's actual supported contract.

Do not hardcode provider-specific logic into Prompt Archive UI. Keep a storage-provider boundary so a future provider change does not rewrite Manage.

## Manage Archive workspace

Milestone 17 explicitly reopens Manage for one new permission-aware section. Start from `docs/backend/MANAGE_GUIDE.md`; do not recreate a separate admin shell.

Canonical new route:

```text
/manage/archive
```

Recommended permission split:

```text
archive.view
archive.manage
```

Initial role mapping can grant both to:

```text
admin
super_admin
```

All Archive UI visibility, route access, backend read/write APIs, and mutations must follow the existing three-layer authorization pattern.

Add Archive to `MANAGE_SECTIONS` instead of hardcoding navigation elsewhere.

### Manage list

Prefer a server-side list/read model with:

```text
search
status filter
model filter
cursor pagination
manual refresh
```

Do not load an unbounded admin collection and filter it only in the browser.

### Add/edit form

Initial form fields:

```text
Telegram post/message id          required + unique
English title                     required
Persian title                     required
Published at                      required
Prompt body                       required
Preview model                     required dropdown
Optimized for                     multi-select
Tags                              el-multi-select from canonical tag catalog
Source title/caption              optional
Images                            local Archive image manager
Status                            draft / published / archived
```

Telegram URL should be derived from the configured channel + Telegram message id rather than manually typed when possible.

### Publish semantics

Prefer:

```text
create/edit as draft
explicit Publish action
```

An incomplete image processing/form state must not accidentally become visible in `/prompts`.

Public Archive APIs return `published` items only.

### Audit

Successful privileged mutations should append to the existing `admin_audit_log` with explicit action names, actor, target archive item and useful metadata.

Examples:

```text
archive.create
archive.update
archive.publish
archive.archive
archive.image.reorder
```

Final naming should follow the existing audit vocabulary consistently.

## Import/migration requirement

Do not manually re-enter the current archive.

Build a repeatable import utility that:

```text
reads public/data/prompts.json
validates current schema
resolves current titleKey values from EN/FA locales
extracts the distinct canonical tag catalog
creates/upserts archive items
maps Telegram message ids
maps prompt/model/tags/source metadata
accounts for variants
records current local image paths as migration/source metadata where useful
produces an import/parity report
```

The import must be safe to rerun or have explicit idempotency semantics. Telegram message id uniqueness is the obvious natural import key even though the database row identity remains UUID.

Parity verification should compare at least:

```text
item count
Telegram message ids
titles EN/FA
prompt bodies
published dates
models
tags
variant counts
image counts
```

Do not switch `/prompts` to server-first until parity is verified locally.

## Suggested implementation phases

### Phase 17A — Archive data foundation + import

```text
schema design
Archive item/image/tag tables
permissions
import utility from JSON + EN/FA i18n
canonical tag catalog seed
parity report
no /prompts cutover yet
```

Verification gate: current JSON archive is represented faithfully in PostgreSQL.

### Phase 17B — Server read APIs + fallback repository

```text
GET /api/archive list read model
GET /api/archive/:id detail read model
server-side search/filter/sort/cursor pagination
typed frontend contracts
server-first Archive repository/composable
recoverable local JSON fallback
401/403 never downgraded to fallback
normalized title/image DTO
```

Verification gate: normal server path works, backend-offline fallback works, and `/prompts` UI behavior remains correct.

### Phase 17C — Manage Archive + local image preparation

```text
/manage/archive section
archive.view / archive.manage authorization
server-side admin list
add/edit/draft/publish/archive
EN/FA Manage copy
admin audit log
canonical tag multi-select
Archive image manager
jpg/jpeg/png/webp validation
file picker + drag/drop + paste
full WebP quality 0.6
thumbnail WebP generation
preview/remove/reorder
NO cloud upload yet
```

Verification gate: an admin can prepare and persist archive metadata while image processing produces upload-ready assets locally.

### Phase 17D — Object Storage / CDN

```text
verify current ArvanCloud Object Storage contract
backend-only credentials
storage adapter
prepared full/thumbnail upload
persist storage keys/URLs
migrate existing public/prompts assets
retain local assets for fallback snapshot
CDN images on server path
local images on fallback path
```

Verification gate: server Archive uses remote media successfully while backend failure still falls back to local snapshot/assets.

### Phase 17E — Snapshot/export + closure

```text
Archive DB -> normalized fallback JSON snapshot
optional pnpm archive:snapshot command
final failure-mode verification
final EN/FA verification
final pnpm generate
update STATUS/README/IMPLEMENTATION
```

## Explicit non-goals unless separately approved

Do not automatically add:

```text
Telegram bot ingestion
automatic Telegram scraping
automatic prompt extraction from Telegram captions
AI-generated translations for titles
automatic tag generation
public user submissions
archive comments/likes/favorites
search-engine/backend technology beyond PostgreSQL without demonstrated need
cloud image upload before local image preparation is verified
```

## Verification checklist

At minimum, before Milestone 17 can be marked DONE:

```text
existing JSON import parity verified
all legacy titles resolve to localized EN/FA archive data
canonical tag catalog covers all tags already used in JSON
admin sees /manage/archive
normal user cannot see/access /manage/archive
backend Manage Archive APIs cannot be bypassed
new Archive entry can be drafted and published
public API only exposes published items
server list/detail pagination/filter/search behave correctly
/prompts server-first path works
backend outage triggers local fallback
401/403 do not trigger fallback
existing local fallback JSON/images still render
Archive image manager accepts jpg/jpeg/png/webp only
multiple file picker works
drag/drop works
clipboard paste works
full WebP output uses quality 0.6
thumbnail WebP is generated at smaller dimensions
image aspect ratio is preserved
no image is upscaled
preview/remove/reorder work
object URLs are cleaned up
EN/FA Manage UI verified
audit rows exist for privileged mutations
new static /manage/archive route is covered
pnpm generate succeeds
```

## Required reading for the implementation chat

Read before code changes:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

Then inspect at minimum:

```text
public/data/prompts.json
public/prompts/
app/types/promptArchive.ts
app/composables/usePromptArchive.ts
app/pages/prompts.vue
app/components/prompts/PromptItem.vue
app/components/prompts/PromptDetail.vue
app/components/tools/ImageBatchConverter.vue
app/components/el/multi-select.vue
app/config/manage.ts
app/pages/manage.vue
app/pages/manage/users.vue
backend auth/authorization/admin route patterns
admin_audit_log implementation
```

## Start rule for the next chat

The next chat should begin with inspection and planning confirmation for Phase 17A. Do not jump directly to Cloud Storage or rewrite the `/prompts` UI before validating the current JSON/import contract.
