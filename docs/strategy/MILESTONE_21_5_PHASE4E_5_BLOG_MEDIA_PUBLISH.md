# Milestone 21.5 — Phase 4E.5 Blog Media + Git Publication

Status: **IN PROGRESS / MEDIA LANE IMPLEMENTED / FOUNDER VERIFICATION PENDING / GIT PUBLICATION NOT STARTED / NOT ACCEPTED**

Date: 2026-09-10

Branch:

```text
feature/growth-foundation
```

Accepted dependencies:

```text
4E.1 Article Contract + Repository Loader -> ACCEPTED
4E.2 Public Blog SSR + SEO               -> ACCEPTED
4E.3 Blog Inventory / Sitemap / llms     -> ACCEPTED
4E.4 Blog Manage authoring               -> verification still in progress
```

## Purpose

4E.5 connects the Blog authoring surface to durable managed media and then to the canonical Git publication workflow without introducing a second content authority.

This record is intentionally split into two lanes:

```text
A. managed Blog media on existing Arvan/S3 authority
B. canonical Git save/publish + reconciliation
```

Lane A is implemented and awaiting founder verification. Lane B is not started yet.

## Media authority

Blog media reuses the existing Archive Object Storage implementation:

```text
backend/src/archiveStorage.mjs
```

There is no second S3 client, credential store, signing implementation, or browser-side storage credential.

Blog objects are confined to:

```text
blog/
```

Managed upload layout:

```text
blog/YYYY/MM/<uuid>.full.webp
blog/YYYY/MM/<uuid>.thumb.webp
blog/YYYY/MM/<uuid>.json
```

The JSON manifest is the managed-asset metadata authority for Gallery browsing.

## Authorization

Backend endpoint:

```text
GET  /api/admin/blog/media
POST /api/admin/blog/media
```

Every request requires an authenticated user with:

```text
blog.manage
```

The browser never receives Arvan access credentials.

## Storage browsing

`archiveStorage.mjs` now supports signed query requests required for S3-compatible `ListObjectsV2`.

Gallery browsing uses:

```text
prefix
+ delimiter=/
+ continuation token
+ deterministic SigV4 query canonicalization
```

User-provided prefixes are normalized and remain confined below `blog/`.

## Managed upload

Frontend image processing reuses the accepted Archive image pipeline:

```text
prepareArchiveImage()
-> full WebP
-> thumbnail WebP
-> dimensions / byte sizes
```

Selecting a local file does not immediately upload it.

The Gallery stages:

```text
selected local image
+ local preview
+ required default alt text
```

Only explicit confirmation performs the upload.

New uploads require non-empty alt metadata on both client workflow and backend validation.

The manifest persists:

```text
id
folder
sourceName
alt
createdAt
full key/url/dimensions/size
thumbnail key/url/dimensions/size
```

Legacy manifests created before persisted alt support remain readable with:

```text
alt = ""
```

so founder test assets and existing managed images are not hidden or invalidated.

Uploads are recorded in `admin_audit_log` as:

```text
blog.media.upload
```

with the authenticated admin actor.

## Media Gallery UI

Reusable component:

```text
app/components/manage/MediaGallery.vue
```

It follows `UI_IMPLEMENTATION_GUIDELINES.md` and uses Prompt Draft UI primitives.

Accepted/finalized interaction contract:

```text
current-folder row
-> divider
-> folder buttons
-> Images section aligned to flex-start
-> managed image cards
-> footer actions
```

Folder entries use `el-button` with the project component semantics requested by founder review:

```text
mode = undefined
color = background
text-color = normal
icon-color = normal50
rules = rsc
```

Selecting an already-selected image toggles it back to unselected.

The native file input remains only as an unavoidable browser file capability sink.

## Hero integration

Hero Media no longer exposes raw URL / thumbnail / dimension inputs.

Gallery selection provides:

```text
fullUrl
thumbnailUrl
width
height
```

The existing Hero selection behavior is preserved.

## Markdown image integration

The Markdown Image toolbar action opens the same Gallery.

After selecting an asset:

```text
Gallery selection
-> image/alt modal
-> selected image preview
-> persisted asset alt as editable default
-> insert real fullUrl into Markdown
```

If editor text is selected before opening the workflow, that selected text may override the default alt prefill for this insertion only.

Inserted Markdown remains:

```markdown
![contextual alt](https://.../blog/...full.webp)
```

No base64 image payload enters canonical Markdown.

## Markdown preview finalization

Source and Preview panes align to the top of their grid track.

Preview HTML uses:

```text
color: var(--normalText)
```

Rendered images are constrained responsively:

```text
max-width: min(100%, 400px)
max-height: 400px
width: auto
height: auto
object-fit: contain
```

This caps both tall and wide images without distorting aspect ratio.

## Repository metadata UI refinement

The Repository Metadata container now uses:

```text
rules="css"
```

so its content follows the same top/start alignment contract established during founder UI review.

## Focused verification

Root commands:

```powershell
pnpm test:blog-manage
pnpm test:blog-media
```

When both pass, both changed services must be rebuilt:

```powershell
pnpm api
pnpm frontend
```

Do not use `pnpm stack` unless a later verification step proves it necessary.

Founder smoke must verify:

```text
folder label removed
current-folder divider present
folder buttons use project el-button styling
Images label aligned start
selection toggles on second click
file selection stages preview instead of immediate upload
alt is mandatory before new upload
new uploaded asset retains alt after re-browse
legacy no-alt images still appear
Markdown image flow shows selected image + persisted editable alt
editor + preview panes start at top
preview images never exceed 400px on either axis
Hero selection remains unchanged
Link modal remains unchanged
Repository Metadata aligns start
Light + Dark remain theme-safe
```

## Git publication lane — pending

Still not implemented:

```text
canonical Git repository write adapter
save draft to Git
publish transition to Git
optimistic conflict/version checks
repository reconciliation
optional explicit Arvan emergency publication metadata
```

Git remains the only canonical editorial source.

No temporary container filesystem, database copy, or browser editor state may become canonical while this lane is pending.

## Current state

```text
4E.4 -> verification in progress / NOT ACCEPTED
4E.5 media lane -> IMPLEMENTED / VERIFICATION PENDING
4E.5 Git publication lane -> NOT STARTED
4E.5 overall -> NOT ACCEPTED
4E.6 -> NOT STARTED
```
