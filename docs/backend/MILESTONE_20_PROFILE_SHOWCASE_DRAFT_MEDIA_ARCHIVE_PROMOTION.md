# Milestone 20 — Profile Showcase, Draft Media & Archive Promotion

Status: `IN PROGRESS`

Selected: 2026-09-05

Branch: `feature/docker-local-api`

## Goal

Extend the verified Milestone 19 public-profile foundation without reopening its completed behavior.

Milestone 20 turns `/user` into a richer creator/showcase surface and introduces the infrastructure needed for user Draft preview media, moderation, and deliberate promotion of public user Drafts into the Prompt Archive.

Milestone 19 remains closed and verified. Milestone 20 is an additive extension.

## Invariants carried forward

```text
static Nuxt generation remains supported
pnpm generate remains a release invariant
backend authorization is authoritative
Cloud Drafts remain private by default
visitors never receive private Drafts
public profile APIs never expose email/private account data
Arvan credentials remain backend-only
new schema work starts at migration 017
applied migrations are never rewritten
important reward events require idempotency semantics
```

## Phase 20A — Profile UX polish + username profile alias

Status: `DONE / VERIFIED`

Local verification completed on 2026-09-05, including successful `pnpm generate`.

### Profile Menu

Refine the current cover/avatar composition:

```text
avatar centered on the cover
avatar overlaps the cover edge by exactly 50% of avatar height
Profile Menu avatar visual grows by 12px
avatar becomes an interactive trigger
```

Clicking the avatar opens a secondary menu through the project Global Menu system while the parent Profile Menu remains open.

This is implemented as a reusable root/child Global Menu layer rather than a Profile-Menu-only popup. The child layer owns its own open/close/item state, renders above the root menu, and allows Escape to close the child before the parent.

Avatar child-menu actions:

```text
Choose / change avatar
Remove avatar (when an avatar exists)
```

The existing standalone avatar choose/remove FABs are removed. Prepared avatar preview + explicit Save/Cancel remains intact.

The reusable `el-avatar` fallback surface now uses the project glass treatment:

```text
bg="surface50"
bd="b4"
```

This applies to initials/person-icon fallback while real avatar images still fill the component normally.

Identity hierarchy becomes centered:

```text
name + compact XP badge
role
```

XP formatting:

```text
< 1,000 -> raw number
>= 1,000 -> compact K notation (for example 4.2K)
large values may use M notation
```

The previous standalone XP information row is removed.

`Member since` becomes a compact account-age readout based on current time, for example:

```text
Today
2D ago
```

The lower action area becomes one compact row:

```text
Manage       -> fg100
View profile -> FAB
Sign out     -> FAB
```

Existing progressive-profile completion behavior remains available.

### Global Tooltip portal

The shared `el-tooltip` no longer participates in the trigger/container layout.

Tooltip bubbles are teleported to the project `#teleports` layer and positioned with `position: fixed` from the owning component's DOM rectangle. The floating layer:

```text
does not change parent width/height
is not clipped by ancestor overflow:hidden
keeps pointer-events disabled
clamps to viewport safe padding
flips to the opposite side when the preferred side has insufficient room
tracks resize/scroll while open
attaches viewport listeners only while visible
```

This is a central tooltip fix and therefore applies to FAB/button tooltips throughout the project rather than only the Profile Menu.

### Username profile alias

Keep UUID as the canonical backend/user identity.

Support both frontend entry forms:

```text
/user?id=<USER_UUID>
/user?un=<username>
```

Username lookup is case-insensitive and resolves to the existing user UUID/read model. No second profile implementation is introduced.

Implemented public-safe resolver:

```text
GET /api/users/resolve?username=<username>
```

The resolver returns only user UUID + username for active users. It does not expose email or private account state.

### Draft-card border correction

Draft cards use the EL border-color system rather than direct CSS border-color overrides:

```text
normal -> bc="normal15"
hover  -> bc="normal50"
```

The existing hover lift remains, but border color is driven through the `el-flex` `bc` prop.

### Phase 20A acceptance

```text
Profile Menu avatar is centered and overlaps cover by exactly half its height
Profile Menu avatar is 12px larger than the previous visual
avatar fallback uses surface50 + backdrop blur 4
avatar opens a child Global Menu without closing Profile Menu
avatar choose/remove flows work
prepared avatar Save/Cancel still work
name/role are centered
XP appears as compact badge beside name and old XP row is gone
member age is compact and relative
View profile is a FAB beside Manage and Sign out
Manage grows with fg100; View profile and Sign out remain compact FABs
shared tooltips render outside clipped containers without changing parent/menu layout
/user?id=<uuid> still works
/user?un=<username> resolves the same profile
Draft cards use normal15/normal50 EL border colors for normal/hover
EN/FA copy remains valid
pnpm generate succeeds
```

Phase 20A is closed.

## Phase 20B — Cloud Draft preview media

Status: `IMPLEMENTED / AWAITING LOCAL VERIFICATION`

### Relational media model

Migration:

```text
017_cloud_draft_preview_media.sql
```

Draft preview media is stored in `prompt_draft_images` rather than inside `prompt_drafts.snapshot`.

Each image has:

```text
stable UUID
owner user_id
Cloud Draft draft_id
ordered position
immutable public URL
immutable Arvan/S3 storage key
source width + height
encoded byte size
created_at
```

The table references the composite Cloud Draft identity `(user_id, draft_id)` and uses `ON DELETE CASCADE`. Position is unique per Draft and is deferrable so primary-image reorder/delete compaction can remain transactional.

The current per-Draft safety cap is:

```text
8 images
```

### Browser preparation contract

Implemented in `app/utils/draftPreviewImage.ts`:

```text
input: JPEG / PNG / WebP
output: WebP
quality: 0.60
pixel width/height preserved
no crop
no resize
```

The browser rejects unreasonable images rather than silently reducing them:

```text
maximum edge: 8192px
maximum decoded pixels: 40,000,000
maximum encoded WebP payload: 12 MiB
```

The backend independently verifies that the uploaded bytes are a valid WebP and enforces equivalent edge/pixel/byte limits. Client-reported dimensions are not trusted.

### Storage namespace

Draft media uses a dedicated immutable namespace separate from Prompt Archive and profile media:

```text
draft-media/<USER_UUID>/<IMAGE_UUID>/image.webp
```

Objects use immutable cache headers. Arvan credentials remain backend-only.

### Owner media API

Authenticated Cloud Draft routes:

```text
GET    /api/drafts/:draftId/images
POST   /api/drafts/:draftId/images
DELETE /api/drafts/:draftId/images/:imageId
POST   /api/drafts/:draftId/images/:imageId/primary
```

Upload ownership is enforced from the authenticated user. New uploads append to the ordered set. Delete compacts later positions. Making an image primary moves it to position 0 and shifts the previous leading images transactionally.

### Public profile read model

`GET /api/users/:userId/drafts` now includes an ordered `images` array on each returned Draft.

Existing visibility rules remain authoritative:

```text
owner -> own public + private Drafts and their media metadata
visitor -> public Drafts only and media for only those returned public Drafts
```

No private Draft is added to the public profile response.

### `/user` card experience

Owner Draft cards now support:

```text
add one or multiple preview images
remove current primary image
cycle the next stored image into primary position
publish / unpublish as before
```

Position 0 is displayed as the card preview. If an owner Draft has no image, the card shows an add-preview affordance. Public visitors see the primary image only when the public Draft has media.

Card rendering is intentionally static:

```text
plain <img>
lazy loading
async image decoding
no per-card Visual Slider
no continuously animated canvas
```

All stored images remain available through the ordered media model for later richer presentation and Archive promotion.

### Phase 20B acceptance

```text
migration 017 applies successfully
prompt_draft_images rows cascade when their Cloud Draft is deleted
owner can upload JPEG / PNG / WebP from /user
browser output is WebP at quality 0.60 without resize/crop
backend rejects malformed/non-WebP or unreasonable uploads
multiple images preserve deterministic ordered positions
position 0 is the visible card image
owner can advance another stored image to position 0
owner can remove the current primary image and positions compact correctly
owner cannot mutate another user's Draft media
public profile visitor receives media only for public Drafts
private Drafts remain absent from visitor responses
Draft cards remain static rather than running per-card sliders
EN/FA media copy is valid
pnpm generate succeeds
```

Phase 20B is not `DONE` until migration/API/UI behavior and generation are verified locally.

## Phase 20C — Moderation + Promote to Prompt Archive

Status: `PLANNED`

### Permissions

Use existing permission semantics where possible:

```text
archive.manage     -> Add to prompts
drafts.delete_any -> delete another user's Cloud Draft
```

Current role mapping means Admin/Super Admin can manage Archive content while arbitrary Draft deletion remains a Super Admin capability unless the role policy is deliberately changed later.

Backend checks remain authoritative.

### Promote public Draft

Only a public Draft may be promoted from another user's public profile.

The action opens the central modal and asks for:

```text
English title
Persian title
optional Telegram post/message ID
```

Promotion creates a Prompt Archive `draft`, not an automatically published item.

Archive provenance must be explicit. The expected schema extension includes source identity such as:

```text
source_kind = user_draft
source_user_id
source_draft_id
```

A uniqueness rule should prevent accidental duplicate promotion of the same user Draft.

### Telegram assumptions

Current Archive rows require a Telegram message ID and Telegram URL. User-Draft promotion has no inherent Telegram source.

A later numbered migration must therefore make Telegram-specific fields optional where appropriate and audit all assumptions in:

```text
create/edit validation
search
ordering
snapshot export
public Archive mapping
Manage deep links
Telegram URL generation
```

Legacy Telegram-backed items remain fully compatible.

### Media independence

When Draft preview images are promoted to Prompt Archive, Archive media becomes independent of the user's Draft media.

Do not merely point Archive rows at user-owned Draft media URLs. Copy promoted images into Archive-owned storage keys so later user image deletion cannot break published Prompt Archive content.

### Moderation deletion

Super Admin may delete a Draft when `drafts.delete_any` is granted.

Deletion requires:

```text
confirmation UI
backend permission enforcement
audit event
DB cleanup
best-effort Arvan object cleanup
```

An Archive item previously created from that Draft remains independent.

## Verification rule

Each phase is locally verified before it is marked complete.

Frontend-affecting closure always includes:

```text
pnpm generate
```

Milestone 20 is marked `DONE` only after all selected phases are locally verified by the user.
