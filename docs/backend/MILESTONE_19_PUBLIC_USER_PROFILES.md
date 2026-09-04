# Milestone 19 — Public User Profiles + Cover Media

Status: `IMPLEMENTED / AWAITING LOCAL VERIFICATION`

Branch: `feature/docker-local-api`

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

## Privacy contract

Cloud Drafts were account-owned private data before this milestone. The public profile must not silently expose them.

Migration 016 therefore adds:

```text
prompt_drafts.visibility = private | public
```

Default:

```text
private
```

All existing drafts remain private until their owner explicitly publishes them.

Public profile behavior:

```text
profile owner -> sees all own Cloud Draft summaries
visitor       -> API returns public drafts only
```

The distinction is enforced by PostgreSQL queries in the backend, not by frontend hiding.

The public user profile response deliberately does NOT expose:

```text
email
password/auth data
sessions
private drafts to other users
```

A user without a username is rendered publicly as a generic localized `Prompt Draft User` label rather than leaking the account email.

## Data model

Migration:

```text
backend/sql/016_public_user_profiles.sql
```

Adds optional cover fields to `users`:

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

Cover state is constrained to be fully present or fully absent.

Adds to `prompt_drafts`:

```text
visibility TEXT NOT NULL DEFAULT 'private'
published_at TIMESTAMPTZ NULL
```

and an owner/visibility/update index for profile reads.

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

Cover composition is not center-cropped. The source aspect ratio is preserved and the consuming UI uses cover-style framing.

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

The full image is intended for `/user` hero/background use.

The thumbnail is intended for Profile Menu and other small surfaces.

## Cover storage

Authenticated self-service route:

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

The browser sends prepared full + thumbnail WebP data. The backend validates actual WebP headers/dimensions, byte limits, maximum edges, and matching aspect ratio before persistence.

Replacement semantics follow avatar/archive media safety:

```text
upload new immutable objects
-> persist new DB state
-> best-effort cleanup previous objects
```

Removal clears authoritative DB state first and then attempts object cleanup.

Storage credentials remain backend-only.

## Public profile API

Public-safe profile:

```text
GET /api/users/:userId/profile
```

Response includes only product-public data:

```text
id
username | null
avatarUrl | null
cover | null
createdAt
totalXp
publicDraftCount
```

When the authenticated viewer is the profile owner, the response additionally includes:

```text
totalDraftCount
viewer.isOwner = true
```

Public/owner draft summaries:

```text
GET /api/users/:userId/drafts?limit=24&cursor=...
```

Draft summaries intentionally avoid returning every persisted editor snapshot in the profile list payload. They include lightweight presentation metadata:

```text
id
title
createdAt
updatedAt
revision
outputFormat
moduleCount
publishedAt
visibility   # owner only
```

Visitor query filtering is authoritative:

```sql
visibility = 'public'
```

## Draft publication API

Authenticated owner mutation:

```text
POST /api/drafts/:draftId/visibility
Content-Type: application/json

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

First publication sets `published_at` once. Returning a draft to private does not erase the historical first-published timestamp.

No XP is currently awarded for visibility toggles. A future Share Draft reward should use a separate idempotent score-event rule so private/public toggling cannot farm XP.

## `/user?id=<UUID>`

Page:

```text
app/pages/user.vue
```

Design direction intentionally follows the visual language established by `/prompts?id=...` rather than copying its exact controls:

```text
full-screen cinematic hero
large typography
foreground el-avatar
cover used as visual-slider/background media
avatar never used as the slider background
large creator name
XP / draft stats
scroll transition into a work/drafts section
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

Owner draft cards:

```text
all Cloud Draft summaries
Private/Public marker
Show on profile
Hide from profile
```

Visitor draft cards:

```text
public drafts only
no visibility-management controls
```

## Profile Menu

The Profile Menu hero is now profile-media aware:

```text
cover thumbnail as the upper visual surface
fallback visual when no cover exists
avatar overlaps the lower cover edge
live local cover preview before Save
avatar and cover controls remain independent
View profile action opens /user?id=<current-user-uuid>
```

Cover selection does not upload immediately. The prepared thumbnail appears in the menu first; Save cover performs the backend upload.

## EL Avatar follow-up

`el-avatar` now explicitly supports EL border props:

```text
br
bc
```

This allows large profile avatars and overlapping Profile Menu avatars to use the component directly without relying on attribute fallthrough.

## Local verification gate

This milestone is not DONE until the user verifies it locally.

### 1. Pull, rebuild, schema

```powershell
git pull
docker compose up -d --build db api
docker compose exec api npm run db:schema
```

Expected migration output includes:

```text
016_public_user_profiles.sql
```

### 2. Existing-draft privacy baseline

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT user_id, draft_id, visibility, published_at FROM prompt_drafts ORDER BY client_updated_at DESC LIMIT 10;"
```

Existing rows should initially show:

```text
visibility = private
```

### 3. Cover preparation/save

Open Profile Menu and choose a non-square image.

Expected:

```text
cover preview appears in Profile Menu before upload
aspect ratio remains intact
Save cover -> POST /api/profile/cover -> 200
```

Database:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT username, cover_url, cover_thumbnail_url, cover_storage_key, cover_thumbnail_storage_key, cover_width, cover_height, cover_thumbnail_width, cover_thumbnail_height FROM users WHERE id = '<USER_UUID>';"
```

Expected storage keys:

```text
covers/<user-id>/<uuid>/full.webp
covers/<user-id>/<uuid>/thumb.webp
```

Open both public URLs directly.

### 4. Own profile

Open:

```text
http://localhost:3030/user?id=<YOUR_UUID>
```

Expected:

```text
large el-avatar foreground
cover drives the hero background/slider
username never replaced by email in public presentation
XP visible
all own Cloud Draft summaries visible
private drafts marked Private
```

### 5. Publish one draft

Click:

```text
Show on profile
```

Expected Network request:

```text
POST /api/drafts/<draft-id>/visibility
200
```

Database row becomes:

```text
visibility = public
published_at != NULL
```

### 6. Anonymous visitor privacy

Open the same `/user?id=...` in Incognito/logged-out state.

Expected:

```text
profile itself loads without authentication
only public draft(s) appear
private draft(s) are absent from the API response, not merely hidden in UI
email is not present anywhere in public profile API response
```

Useful direct API checks:

```text
GET /api/users/<uuid>/profile
GET /api/users/<uuid>/drafts
```

### 7. Unpublish

As owner, click:

```text
Hide from profile
```

Expected:

```text
visibility = private
visitor no longer receives that draft
```

### 8. Cover replacement/removal

Replace cover and verify immutable new URLs/keys.

Then remove cover.

Expected:

```text
DELETE /api/profile/cover -> 200
all cover DB fields -> NULL
/user falls back to cinematic generated background
Profile Menu falls back to its generated cover surface
```

### 9. Avatar regression

Verify existing Milestone 18 behavior still works:

```text
avatar upload
avatar replacement
avatar removal
Header avatar
Profile Menu avatar
```

### 10. Release invariant

```powershell
pnpm generate
```

Only after explicit user confirmation should this document become:

```text
Status: DONE / LOCALLY VERIFIED
```
