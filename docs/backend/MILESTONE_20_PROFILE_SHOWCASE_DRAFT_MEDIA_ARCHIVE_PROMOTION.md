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

Status: `IN PROGRESS`

Started after Phase 20B local verification on 2026-09-05.

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

When an Admin/Super Admin visits another user's public profile, each public Draft can expose:

```text
Add to prompts
```

The action opens the central modal and asks for:

```text
English title
Persian title
optional Telegram post/message ID
```

The rest of the Archive Draft is derived from the source Cloud Draft where possible. Promotion creates an Archive item in `draft` state; it never auto-publishes.

### Archive identity / Telegram compatibility

The current Archive historically uses Telegram message ID as both source identity and public numeric ID. Phase 20C must support Archive items with no Telegram source while preserving all existing `/prompts` URLs.

The selected direction for migration 019 is:

```text
introduce stable public_id for Archive routing
backfill existing public_id = telegram_message_id
new non-Telegram Archive items receive sequence-backed public_id
telegram_message_id becomes nullable
telegram_url becomes nullable
legacy Telegram public IDs stay unchanged
source_kind gains user_draft
source_user_id + source_draft_id store provenance
unique provenance prevents duplicate promotion of one Draft
```

Existing Telegram-backed Archive behavior must remain compatible.

### Media independence

Draft preview images promoted into Archive must become Archive-owned media.

Do not retain references to `draft-media/...` as the canonical Archive image source. Promoted images are re-prepared with the existing Archive image contract and uploaded into Archive storage keys so future Draft-preview deletion cannot break `/prompts`.

Archive media contract remains:

```text
full: max edge 2048, WebP quality 0.60
thumbnail: max edge 640, WebP quality 0.72
no upscale
```

### Moderation deletion

Super Admin moderation deletion uses the existing Draft soft-delete model rather than physical deletion.

Required behavior:

```text
confirmation modal
backend drafts.delete_any enforcement
deleted_at tombstone
audit event with actor + target user/Draft
Draft disappears from normal owner/public list responses
stored Draft/media remain available for audit/recovery
previously promoted Archive item remains independent
```

## Verification rule

Each phase is locally verified before it is marked complete. Frontend-affecting closure always includes:

```text
pnpm generate
```

Milestone 20 is marked `DONE` only after Phase 20C is locally verified.
