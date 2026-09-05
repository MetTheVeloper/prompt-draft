# Milestone 20 — Profile Showcase, Draft Media & Archive Promotion

Status: `IN PROGRESS`

Selected: 2026-09-05

Branch: `feature/docker-local-api`

## Goal

Extend the verified Milestone 19 public-profile foundation without reopening it. Milestone 20 turns `/user` into a richer creator/showcase surface and adds Cloud Draft media, safe deletion semantics, moderation, and deliberate promotion of public user Drafts into the Prompt Archive.

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
important reward events require idempotency semantics
```

## Phase 20A — Profile UX polish + username profile alias

Status: `DONE / VERIFIED`

Local verification completed on 2026-09-05, including successful `pnpm generate`.

### Verified work

```text
Profile Menu avatar centered on cover
exact half-avatar cover overlap
Profile Menu avatar visual +12px
reusable el-avatar fallback: bg="surface50" + bd="b4"
root + child Global Menu support for nested avatar actions
avatar Choose/Change + Remove menu
centered name/role hierarchy
compact XP badge beside name
relative member age such as Today / 2D ago
Manage + View profile FAB + Sign out FAB compact action row
/user?id=<UUID> remains supported
/user?un=<username> public-safe alias resolution
shared tooltip portal fix
Draft-card border contract normal15 -> normal50 on hover
```

The shared tooltip component now teleports its floating bubble outside clipped parent layout, fixing overflow/layout regressions globally rather than only inside Profile Menu.

UUID remains canonical user identity. Username resolution is public-safe:

```text
GET /api/users/resolve?username=<username>
```

The resolver exposes only UUID + username.

## Phase 20B — Cloud Draft preview media + Draft card workflow

Status: `DONE / VERIFIED`

Local verification completed on 2026-09-05, including successful `pnpm generate`.

### Migration 017 — Draft preview media

```text
017_cloud_draft_preview_media.sql
```

Preview media is relational in `prompt_draft_images`, not embedded in the Draft snapshot.

Each image stores:

```text
stable UUID
user_id + draft_id ownership
ordered position
immutable public URL
immutable storage key
width + height
encoded byte size
created_at
```

The current cap is 8 images per Cloud Draft.

Browser preparation contract:

```text
input: JPEG / PNG / WebP
output: WebP
quality: 0.60
preserve source pixel dimensions
no crop
no resize
max edge: 8192px
max decoded pixels: 40MP
max encoded payload: 12 MiB
```

Backend independently validates uploaded WebP bytes and dimensions.

Storage namespace:

```text
draft-media/<USER_UUID>/<IMAGE_UUID>/image.webp
```

Owner media API:

```text
GET    /api/drafts/:draftId/images
POST   /api/drafts/:draftId/images
DELETE /api/drafts/:draftId/images/:imageId
POST   /api/drafts/:draftId/images/:imageId/primary
```

Position 0 is the primary/card-preview image. Reordering and deletion preserve deterministic compact positions.

### Preview Manager

The previous next-image cycling interaction was replaced with the central modal system.

`Manage Previews` now provides:

```text
all stored images in one modal
current primary selection
click any image to make it primary
per-image Delete FAB
stacked confirmation modal before image deletion
multi-image add flow
```

The central Global Modal system already supports real stacked modals, so deletion confirmation stays above the Preview Manager without closing it.

### Draft action menu

Owner cards expose a central three-dot menu:

```text
Edit Draft
Manage Previews
Copy Output
Download JSON
──────────────
Show / Hide from Profile
Delete Draft
```

`Edit Draft` deep-links to:

```text
/create?draft=<DRAFT_ID>
```

Cloud restore activates that exact Draft so subsequent saves continue on the same identity.

`Copy Output` compiles the stored Draft through the existing prompt compiler rather than copying raw snapshot data. `Download JSON` exports the Draft record using the same Draft model consumed by `/create`.

### Migration 018 — soft deletion

```text
018_soft_delete_prompt_drafts.sql
```

Cloud Draft deletion is intentionally a tombstone, not a physical database delete:

```text
deleted_at IS NULL     -> active Draft
deleted_at IS NOT NULL -> deleted Draft
```

Owner list, public profile reads, counters, cloud restore and normal Draft detail/list behavior exclude tombstoned Drafts.

A tombstoned Draft cannot be accidentally resurrected by a stale client: a later PUT for that identity returns `409 DRAFT_DELETED`.

The local Cloud Draft mirror also removes server-tracked Drafts that disappear from active server responses, preventing deleted Drafts from returning to the `/create` Draft menu on another device.

The user locally verified that the deleted row remains in PostgreSQL with `deleted_at` populated while disappearing from the UI/read models.

### Final Draft-card showcase design

The verified `/user` Draft cards are image-first square showcase cards:

```text
aspect-ratio: 1 / 1
no card padding
primary image covers full card
second preview crossfades in on hover when available
large 2x title typography
labels + title + metadata pinned to bottom overlay
absolute top action bar
three-dot action + Preview Manager + image count
card effect: { color: 'normal15' }
soft lower readability gradient
```

Cards remain lightweight: two static images are used for hover crossfade rather than per-card canvas/slider animation.

Saved Draft count is integrated into the heading:

```text
Saved drafts (4)
```

and omitted when count is zero.

### Phase 20B acceptance — verified

```text
migration 017 applied successfully
migration 018 applied successfully
multi-image upload works
primary selection works for arbitrary image count
stacked image-delete confirmation works
soft deletion keeps DB row and hides Draft from active reads
stale sync cannot resurrect tombstoned Drafts
Edit Draft opens the correct Draft in /create
Copy Output works
Download JSON works
visibility actions work
square image-first card design works
second image appears on hover
owner/visitor privacy remains correct
pnpm generate succeeds
```

Phase 20B is closed.

## Phase 20C — Moderation + Promote to Prompt Archive

Status: `IMPLEMENTED / PENDING LOCAL VERIFICATION`

Implementation completed on branch on 2026-09-05. Local migration/behavior verification and `pnpm generate` are still required before closure.

### Permission contract

Reuse existing permissions:

```text
archive.manage     -> Add to prompts / promotion workflow
drafts.delete_any -> moderate-delete another user's Draft
```

Current role mapping intentionally means:

```text
Admin       -> may promote public Drafts into Prompt Archive
Super Admin -> may promote + moderate-delete arbitrary visible user Drafts
```

Backend checks remain authoritative.

### Promotion UX

When an Admin/Super Admin visits a public user profile, an eligible public Draft exposes:

```text
Add to prompts
```

The central modal asks for:

```text
English title
Persian title
optional Telegram post/message ID
```

The prompt body is compiled from the stored Cloud Draft with the same compiler used by normal Draft output. Promotion creates an Archive item in `draft` state and never auto-publishes.

Implemented promotion endpoints:

```text
GET    /api/admin/archive/source-draft/:userId/:draftId
GET    /api/admin/archive/source-draft/:userId/:draftId/images/:imageId
POST   /api/admin/archive/promote-draft
DELETE /api/admin/archive/source-draft/:userId/:draftId   # drafts.delete_any
```

Promotion source reads require an active, non-deleted, public Draft. Duplicate promotion of the same source Draft is prevented by database provenance uniqueness.

### Migration 019 — Archive identity + provenance

```text
019_archive_user_draft_promotion.sql
```

Implemented identity model:

```text
public_id = stable numeric Archive route identity
existing rows: public_id = telegram_message_id
new non-Telegram rows: sequence-backed public_id
sequence-backed namespace starts at 1,000,000,000
telegram_message_id nullable
telegram_url nullable
source_kind += user_draft
source_user_id + source_draft_id provenance
unique user-Draft provenance
```

The high sequence namespace keeps generated non-Telegram identities away from the historical Telegram-ID namespace while preserving every old public route.

For existing Telegram-backed rows:

```text
/prompts?id=<OLD_TELEGRAM_ID>
```

continues to resolve the same item because its `public_id` is backfilled to that value.

Admin Archive deep links now resolve by `public_id` rather than assuming the route identity is always a Telegram message ID:

```text
GET /api/admin/archive/public/:publicId
/manage/archive?edit=<publicId>
```

The older Telegram resolver remains available for compatibility.

### Non-Telegram Archive compatibility

`/api/archive`, `/prompts`, detail navigation, Manage Archive and the fallback snapshot all treat Telegram linkage as optional.

Implemented behavior:

```text
Telegram buttons render only when telegram_url exists
public Archive list/detail contracts accept telegramUrl = null
schemaVersion 3 fallback parser accepts telegramUrl = null
Manage Archive Telegram field is optional
Manage list/editor display public_id as the primary identity
Archive search covers public_id and optional telegram_message_id
```

The snapshot exporter writes public IDs and nullable Telegram URLs. The bootstrap importer reads those public IDs and advances `prompt_archive_public_id_seq` above imported sequence-backed IDs, preventing a fresh-install collision after importing a snapshot that already contains non-Telegram Archive entries.

### Media independence

Draft preview images promoted into Archive become Archive-owned media.

The promotion modal reads each source image through an authorized backend proxy, re-prepares it with the existing Archive media contract, and uploads it through the normal Archive media API into `archive/...` storage keys.

Archive media contract remains:

```text
full: max edge 2048, WebP quality 0.60
thumbnail: max edge 640, WebP quality 0.72
no upscale
```

Therefore deleting or changing `draft-media/...` after promotion cannot break the promoted Archive media.

If metadata promotion succeeds but one later media copy fails, the already-created Archive item remains a safe `draft`; the UI reports the partial media-copy warning so the Admin can finish it in Manage Archive.

### Provenance preservation during Archive editing

Managed Archive mutations normally mark an item as `managed`. For promoted items, metadata edits, image upload/delete/reorder and status changes preserve `source_kind='user_draft'` plus `source_user_id` / `source_draft_id` rather than erasing promotion provenance.

### Moderation deletion

Super Admin moderation deletion reuses the existing Draft soft-delete model rather than physical deletion.

Implemented behavior:

```text
confirmation modal
backend drafts.delete_any enforcement
deleted_at tombstone
server_updated_at refresh
audit event: draft.moderation_delete
actor + target user/Draft captured
Draft disappears from normal owner/public list responses
stored Draft/media remain available for audit/recovery
previously promoted Archive item remains independent
```

Admin does not receive `drafts.delete_any`; Super Admin receives it through the existing wildcard permission model.

### Phase 20C local acceptance checklist

Do not mark Phase 20C complete until all of the following are locally confirmed:

```text
019 migration applies cleanly
existing Telegram Archive item still opens at its old /prompts?id=<telegram-id> route
existing Telegram Archive item still exposes Telegram actions
Admin can promote another public Draft
promotion without Telegram creates public_id >= 1,000,000,000
promoted item starts as Archive draft
/manage/archive?edit=<publicId> opens promoted non-Telegram item
promoted images are copied into Archive-owned storage/media rows
removing/changing source Draft preview does not break promoted Archive media
publishing promoted item makes /prompts?id=<publicId> readable
non-Telegram item shows no Telegram action
same source Draft cannot be promoted twice
Admin cannot moderation-delete another user's Draft
Super Admin can moderation-delete it
moderation delete populates prompt_drafts.deleted_at and audit log
tombstoned source Draft disappears from normal profile reads
already-promoted Archive item remains intact
archive snapshot generation/parity succeeds
pnpm generate succeeds
```

## Verification rule

Each phase is locally verified before it is marked complete. Frontend-affecting closure always includes:

```text
pnpm generate
```

Milestone 20 is marked `DONE` only after Phase 20C is locally verified.
