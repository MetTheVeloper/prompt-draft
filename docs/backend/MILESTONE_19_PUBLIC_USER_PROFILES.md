# Milestone 19 — Public User Profiles + Cover Media

Status: `DONE / LOCALLY VERIFIED`

Branch: `feature/docker-local-api`

Completed: 2026-09-05

## Goal

Extend the verified avatar/profile-media foundation with:

```text
optional user cover media
public-safe creator profile read model
/user?id=<UUID>
Cloud Draft private/public visibility
owner access to all own Cloud Draft summaries
visitor access to public Draft summaries only
Awwwards-like creator hero using cover + foreground el-avatar
creative cover/avatar composition in Profile Menu
```

The user locally verified the feature, the final UI polish, and a successful `pnpm generate`.

## Privacy contract

Cloud Drafts remain account-owned private data by default.

Migration 016 adds:

```text
prompt_drafts.visibility = private | public
```

Default:

```text
private
```

Existing Drafts were verified after migration as `private` with no publication timestamp.

Public profile behavior:

```text
profile owner -> receives all own Cloud Draft summaries
visitor       -> backend returns public Draft summaries only
```

Visitor filtering is enforced in backend/PostgreSQL queries, not by frontend hiding.

Public profile responses deliberately do NOT expose:

```text
email
password/auth data
sessions
private Drafts to other users
```

A user without a username is rendered publicly with a generic localized `Prompt Draft User` label rather than leaking account email.

## Data model

Migration:

```text
backend/sql/016_public_user_profiles.sql
```

Optional cover fields on `users`:

```text
cover_url
cover_storage_key
cover_thumbnail_url
cover_thumbnail_storage_key
cover_width
cover_height
cover_thumbnail_width
cover_thumbnail_height
```

Cover state is nullable and must be internally consistent.

Draft visibility fields:

```text
visibility TEXT NOT NULL DEFAULT 'private'
published_at TIMESTAMPTZ NULL
```

The migration also adds the owner/visibility/update indexing needed for profile reads.

## Cover image preparation

Browser utility:

```text
app/utils/userCoverImage.ts
```

Accepted input:

```text
JPEG / JPG
PNG
WebP
```

Unlike avatar preparation, cover is not force-cropped. Source aspect ratio is preserved and the consuming UI uses cover-style framing.

Outputs:

```text
full WebP
  max edge: 2048
  no upscale
  quality: 0.60

thumbnail WebP
  max edge: 640
  no upscale
  quality: 0.72
```

The full image is used by `/user` hero/background rendering.

The thumbnail is used by Profile Menu and other compact surfaces.

## Cover storage

Authenticated self-service API:

```text
GET    /api/profile/cover
POST   /api/profile/cover
DELETE /api/profile/cover
```

Storage layout:

```text
covers/<user-uuid>/<immutable-cover-uuid>/full.webp
covers/<user-uuid>/<immutable-cover-uuid>/thumb.webp
```

The browser sends prepared full + thumbnail WebP data. The backend validates actual WebP headers/dimensions, byte limits, maximum edges and matching aspect ratio before persistence.

Replacement semantics:

```text
upload new immutable objects
-> persist new DB state
-> best-effort cleanup previous objects
```

Removal semantics:

```text
clear authoritative DB state
-> best-effort object cleanup
```

Storage credentials remain backend-only.

The user locally verified real cover persistence, full/thumbnail Arvan URLs and expected storage-key structure.

## Public profile API

Public-safe profile:

```text
GET /api/users/:userId/profile
```

Response contains product-public fields such as:

```text
id
username | null
avatarUrl | null
cover | null
createdAt
totalXp
publicDraftCount
```

When the authenticated viewer owns the profile, the read model may additionally expose owner-only summary data such as:

```text
totalDraftCount
viewer.isOwner = true
```

Draft summaries:

```text
GET /api/users/:userId/drafts?limit=24&cursor=...
```

The profile list deliberately returns lightweight presentation metadata rather than full persisted editor snapshots.

Typical summary fields include:

```text
id
title
createdAt
updatedAt
revision
outputFormat
moduleCount
publishedAt
visibility   # owner-only
```

Internal Draft IDs remain part of the API identity contract but are intentionally not displayed in the final card UI.

## Draft publication API

Authenticated owner mutation:

```text
POST /api/drafts/:draftId/visibility
```

Payload:

```json
{
  "visibility": "public"
}
```

or:

```json
{
  "visibility": "private"
}
```

Only the owning user's row can be updated because the mutation condition includes both:

```text
user_id = authenticated user id
draft_id = requested draft id
```

First publication records `published_at`. Returning the Draft to private does not need to erase the historical first-publication timestamp.

No XP is awarded for visibility toggles.

A future Share Draft reward must use a separate idempotent score event so repeated public/private toggling cannot farm XP.

## `/user?id=<UUID>`

Page:

```text
app/pages/user.vue
```

The visual direction is inspired by the same cinematic/Awwwards-like language used by Prompt detail without cloning its exact controls.

Final verified hero composition:

```text
full-screen cover background
shared canvas slider rendering
foreground el-avatar only
large centered avatar focal point
centered creator identity hierarchy
creator label + member-since metadata
large creator name
XP / public Draft / total Draft stat cards
Saved Drafts CTA
```

Important rule:

```text
avatar is never a slider/background source
```

No cover:

```text
cinematic generated fallback background
```

No avatar:

```text
el-avatar initials fallback
-> person icon fallback
```

The final polish intentionally centers the profile identity instead of aligning it to flex-start and increases avatar prominence.

## Saved Draft cards

Owner cards show all own Cloud Draft summaries and expose publication controls.

Visitor cards receive public Drafts only.

Final card presentation:

```text
output format
Private/Public status for owner
title
module count
revision
updated time
Show on profile / Hide from profile owner action
```

Internal Draft UUIDs are intentionally not shown in product UI.

The metadata row occupies that information space instead.

## Profile Menu composition

Profile Menu now combines user media creatively rather than presenting avatar and cover as unrelated settings.

Final structure:

```text
cover thumbnail at top
avatar overlaps lower cover edge
identity below
cover controls in cover surface
avatar controls near identity
View profile action
```

Avatar and cover preparation remain independent.

Selection shows a local prepared preview before any upload.

Final action-button polish:

```text
Save avatar -> size 12
Save cover  -> size 12
Cancel      -> same-size FAB with close icon + tooltip
```

This avoids the oversized action rows seen in the first implementation.

## Shared canvas-slider single-source behavior

The original shared renderer could reach the end of its pan motion and appear visually stuck when only one image source existed.

The final verified behavior is now intentional and reusable across every single-source consumer:

```text
start state
-> smooth/eased pan to end state
-> smooth/eased pan back to start
-> repeat continuously
```

This is implemented in the shared `canvasSliderRenderer`, not as a `/user`-specific workaround.

Multi-source transition behavior remains unchanged.

This improves both user-cover backgrounds and any Prompt surface that renders a single slider image.

## EL Avatar follow-up

`el-avatar` explicitly supports EL border props such as:

```text
br
bc
```

Its size uses the same EL dimension resolver as button height, preserving the design-system invariant:

```text
same :size on el-avatar and FAB -> same outer height
```

## Local verification summary

The user verified:

```text
016_public_user_profiles.sql applied
existing Cloud Drafts defaulted to private
cover selection previews before upload
cover full + thumbnail persisted to Arvan
cover metadata/storage keys persisted in PostgreSQL
/user?id=<uuid> renders cover + foreground avatar
Profile Menu cover/avatar composition works
owner sees own Cloud Draft collection
public/private Draft controls work
visitor/public privacy behavior works
avatar regression remains functional
single-image slider now loops pan forward/backward
Profile Menu action sizing/FAB Cancel polish is correct
Saved Draft marker/UI artifact removed
Draft UUID removed from visible card UI
centered large-avatar hero polish accepted
pnpm generate succeeds
```

## Completion

Milestone 19 is complete and locally verified.

No next milestone is selected in this document. The next product direction should be supplied by the user in a new chat after reading the current status/architecture sources.
