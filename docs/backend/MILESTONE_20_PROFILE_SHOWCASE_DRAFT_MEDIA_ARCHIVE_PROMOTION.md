# Milestone 20 — Profile Showcase, Draft Media & Archive Promotion

Status: `DONE / LOCALLY VERIFIED`

Selected: 2026-09-05
Closed: 2026-09-05
Branch: `feature/docker-local-api`

## Goal

Extend the verified Milestone 19 public-profile foundation without reopening it. Milestone 20 turns `/user` into a richer creator/showcase surface and adds Cloud Draft media, safe deletion semantics, moderation, and deliberate promotion of public user Drafts into Prompt Archive.

Milestone 19 remains closed and verified. Milestone 20 is additive.

## Carried invariants

```text
static Nuxt generation remains supported
pnpm generate remains a release invariant
backend authorization is authoritative
Cloud Drafts remain private by default
visitors never receive private Drafts
public profile APIs never expose email/private account data
Arvan credentials remain backend-only
applied migrations are never rewritten
```

## Phase 20A — Profile UX polish + username profile alias

Status: `DONE / VERIFIED`

Verified additions:

```text
Profile Menu avatar centered on cover
exact half-avatar cover overlap
Profile Menu avatar visual +12px
reusable el-avatar fallback: bg="surface50" + bd="b4"
root + child Global Menu support for nested avatar actions
avatar Choose/Change + Remove menu
centered name/role hierarchy
compact XP badge beside name
relative member age
compact Manage / View profile / Sign out actions
/user?id=<UUID> remains supported
/user?un=<username> public-safe alias resolution
shared portal-based tooltip fix
Draft-card border contract normal15 -> normal50 on hover
```

The shared tooltip now teleports outside clipped parent layout, fixing the overflow/layout issue globally.

UUID remains canonical user identity. Username resolution is public-safe:

```text
GET /api/users/resolve?username=<username>
```

The resolver exposes only UUID + username.

## Phase 20B — Cloud Draft preview media + Draft workflow

Status: `DONE / VERIFIED`

Migrations:

```text
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
```

### Draft preview media

Preview media is relational in `prompt_draft_images`.

```text
up to 8 images per Draft
JPEG / PNG / WebP input
WebP quality 0.60
preserve source pixel dimensions
no crop
no resize
position 0 = primary/card preview
Arvan namespace: draft-media/<USER_UUID>/<IMAGE_UUID>/image.webp
```

Owner media API:

```text
GET    /api/drafts/:draftId/images
POST   /api/drafts/:draftId/images
DELETE /api/drafts/:draftId/images/:imageId
POST   /api/drafts/:draftId/images/:imageId/primary
```

### Preview Manager

Verified behavior:

```text
all images shown in central modal
arbitrary primary-image selection
per-image Delete FAB
stacked confirmation modal
multi-image add flow
```

### Draft action workflow

Owner cards expose:

```text
Edit Draft
Manage Previews
Copy Output
Download JSON
──────────────
Show / Hide from Profile
Delete Draft
```

`Edit Draft` deep-links to `/create?draft=<DRAFT_ID>` and restores that exact identity.

### Soft deletion

Deletion uses a tombstone on `prompt_drafts`:

```text
deleted_at IS NULL     -> active Draft
deleted_at IS NOT NULL -> deleted Draft
```

Normal owner/public reads, counters and cloud restore exclude tombstones. A stale client cannot resurrect a tombstoned Draft; PUT returns `409 DRAFT_DELETED`.

Local verification confirmed the deleted row remains in PostgreSQL while disappearing from active UI/read models.

### Final showcase card design

Verified `/user` Draft cards:

```text
aspect-ratio: 1 / 1
no card padding
primary image fills background
second preview crossfades on hover
large bottom-pinned title/metadata
absolute top action row
three-dot menu + Preview Manager + image count
card effect: { color: 'normal15' }
soft readability gradient
Saved drafts (N) integrated into heading
```

Phase 20B closed with successful `pnpm generate`.

## Phase 20C — Moderation + Promote to Prompt Archive

Status: `DONE / VERIFIED`

Migration:

```text
019_archive_user_draft_promotion.sql
```

### Permission contract

```text
archive.manage     -> promote a public user Draft into Prompt Archive
drafts.delete_any -> moderate-delete another user's Draft
```

Role behavior:

```text
Admin       -> Archive promotion
Super Admin -> Archive promotion + arbitrary Draft moderation delete
```

Backend authorization remains authoritative.

### Promotion workflow

Eligible public Drafts expose `Add to prompts` for authorized users.

The central modal accepts:

```text
English title
Persian title
optional Telegram post/message ID
```

Prompt output is compiled from the stored Cloud Draft. Promotion creates an Archive item in `draft` state and never auto-publishes.

Endpoints:

```text
GET    /api/admin/archive/source-draft/:userId/:draftId
GET    /api/admin/archive/source-draft/:userId/:draftId/images/:imageId
POST   /api/admin/archive/promote-draft
DELETE /api/admin/archive/source-draft/:userId/:draftId
```

Duplicate promotion is blocked by source provenance uniqueness and returns `DRAFT_ALREADY_PROMOTED`.

### Archive identity and Telegram compatibility

Migration 019 separates Archive route identity from Telegram source identity:

```text
public_id = stable numeric Archive route identity
existing rows: public_id = telegram_message_id
new non-Telegram rows can use sequence-backed public_id
telegram_message_id nullable
telegram_url nullable
source_kind += user_draft
source_user_id + source_draft_id provenance
unique user-Draft provenance
```

Existing Telegram-backed public IDs remain compatible. `/api/archive`, `/prompts`, Manage Archive and schemaVersion 3 fallback parsing accept optional Telegram linkage. Telegram actions render only when a Telegram URL exists.

Manage deep links resolve by public ID:

```text
GET /api/admin/archive/public/:publicId
/manage/archive?edit=<publicId>
```

### Media independence

Promoted Draft preview images become Archive-owned media.

```text
source image read through authorized backend proxy
re-prepared using Archive image contract
full: max edge 2048, WebP 0.60
thumbnail: max edge 640, WebP 0.72
no upscale
stored under archive/... keys
```

Deleting/moderating the source Draft does not break the promoted Archive item or its media.

Local verification confirmed Archive-owned keys such as:

```text
archive/<ARCHIVE_ITEM_UUID>/<IMAGE_UUID>/full.webp
archive/<ARCHIVE_ITEM_UUID>/<IMAGE_UUID>/thumb.webp
```

### Moderation deletion

Super Admin moderation reuses the verified Draft tombstone model:

```text
central confirmation
backend drafts.delete_any enforcement
prompt_drafts.deleted_at populated
server_updated_at refreshed
draft.moderation_delete audit event
actor + target captured
normal profile reads exclude tombstone
promoted Archive item remains independent
```

Local verification confirmed both `archive.promote_user_draft` and `draft.moderation_delete` audit records.

### Final local acceptance

The user explicitly accepted Phase 20C on 2026-09-05.

Verified locally:

```text
migration 019 applied
promotion succeeds
promoted item starts as Archive draft
duplicate promotion returns DRAFT_ALREADY_PROMOTED
promoted item can be published and appears in /prompts
moderation delete tombstones the source Draft
source Draft disappears from normal profile reads
promoted Archive item remains available after source moderation
Archive media uses independent archive/... storage keys
audit log contains promotion + moderation events
Archive snapshot export returns PARITY_OK
publishedItemCount = snapshotItemCount = 102
schemaVersion = 3
pnpm generate succeeds
```

Accepted existing build warnings remain non-blocking:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

## Final schema history introduced by Milestone 20

```text
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
019_archive_user_draft_promotion.sql
```

Do not rewrite applied migration history. The next schema change must use migration `020_*.sql`.

## Closure

Milestone 20 is closed. No Milestone 21 has been selected by this document.
