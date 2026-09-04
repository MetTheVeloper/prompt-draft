# Prompt Draft Backend

This directory is the current source of truth for Prompt Draft backend, Docker, authorization, Cloud Drafts, translation, Manage, XP/referrals, Prompt Archive, profile media and public profile work.

## Current branch

`feature/docker-local-api`

## Current verified architecture

```text
static Nuxt frontend
  -> direct browser HTTP/CORS
  -> independent Node API :4000
  -> validation / authentication / authorization
  -> PostgreSQL
  -> backend-only integrations such as Arvan Object Storage
```

The backend intentionally remains independent from Nuxt server routes so the frontend can continue using static generation.

Core invariants:

```text
pnpm generate must keep working
backend authorization is authoritative
Cloud Drafts are private by default
public profile APIs must not leak email/private Drafts
storage credentials remain backend-only
schema changes use new numbered SQL migrations
important reward events require idempotency semantics
```

## Documentation map

```text
STATUS.md
  -> verified current checkpoint + next-chat handoff

README.md
  -> current architecture and milestone overview

IMPLEMENTATION.md
  -> concrete extension rules and implementation boundaries

API_GUIDE.md
  -> reusable backend/API vertical-slice playbook

MANAGE_GUIDE.md
  -> reusable Manage/admin workspace playbook

MILESTONE_*.md
  -> detailed feature source-of-truth records
```

A milestone is only `DONE` after local user verification. Code creation alone is not sufficient.

## Milestones 1–16 — COMPLETE

The verified base platform includes:

```text
Docker/PostgreSQL foundation
Wizard run persistence + History
optional authentication
account-owned Cloud Draft sync
server-side translation
roles and permissions
/manage shell + Dashboard + Users
admin audit log
progressive username/email completion
email feature gates
append-only XP/event ledger
referral relationships + rewards
Prompt/Collage access gates
static-safe 403/404 error surfaces
```

## Milestone 17 — COMPLETE: Prompt Archive Platform

Prompt Archive moved from static JSON-only data to a backend-owned platform.

Primary path:

```text
PostgreSQL
  -> /api/archive list/detail/search/filter/pagination
  -> /prompts
```

Management path:

```text
/manage/archive
  -> archive.view / archive.manage
  -> create/edit/draft/publish/archive
  -> canonical tags
  -> EN/FA dynamic titles
  -> prepared media
  -> Arvan Object Storage
  -> admin audit events
```

Fallback path:

```text
pnpm archive:snapshot
  -> public/data/prompts.json schemaVersion 3
  -> local legacy media
  -> mirrored managed media under public/prompts/_snapshot
  -> /prompts fallback on recoverable API failure
```

Archive managed images use full + thumbnail WebP outputs and immutable cloud keys. The live Arvan capability was verified with signed and anonymous read/write/delete behavior.

Deep linking is supported through:

```text
/manage/archive?edit=<telegram-message-id>
```

Admins/Super Admins can also jump directly from `/prompts` cards to Manage edit mode.

Detailed source:

```text
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

## Milestone 18 — COMPLETE: User Avatar Foundation

Users have an optional avatar with no stored default image.

Avatar contract:

```text
JPEG/PNG/WebP input
center crop
exact 400x400 output
WebP quality 0.60
backend dimension/header validation
Arvan-backed immutable object
replace/remove support
```

Reusable component:

```text
app/components/el/avatar.vue
```

Fallback behavior:

```text
image
-> initials
-> person icon
```

`el-avatar` uses the same sizing system as EL buttons so an avatar and same-size FAB align by height.

Profile Header/Profile Menu/Manage user information reuse this component.

Detailed source:

```text
docs/backend/MILESTONE_18_USER_AVATAR.md
```

## Milestone 19 — COMPLETE: Public User Profiles + Cover Media

Public profile route:

```text
/user?id=<user-uuid>
```

Cover media is optional and uses:

```text
full WebP: max edge 2048, quality 0.60
thumbnail WebP: max edge 640, quality 0.72
aspect ratio preserved
no upscale
```

Storage layout:

```text
covers/<user-uuid>/<immutable-cover-uuid>/full.webp
covers/<user-uuid>/<immutable-cover-uuid>/thumb.webp
```

Profile Menu now combines cover + overlapping avatar and supports live prepared previews before Save.

Public Draft privacy model:

```text
prompt_drafts.visibility = private | public
```

Default is `private`.

Backend behavior:

```text
owner   -> may receive all own Cloud Draft summaries
visitor -> receives only visibility='public' Draft summaries
```

Public profile responses intentionally exclude email and other private Auth data.

The `/user` hero uses the cover as canvas-slider media and keeps `el-avatar` in the foreground. The final verified presentation centers the identity hierarchy, uses a larger avatar focal point, and avoids exposing Draft UUIDs in cards.

The shared canvas slider has explicit single-source looping pan behavior:

```text
start -> ease to end -> ease back to start -> repeat
```

Multi-source transitions retain their previous behavior.

Visibility toggles do not award XP. Any future Share Draft reward must use a separate idempotent event.

Detailed source:

```text
docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md
```

## Current API/product boundaries

### Auth

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/profile/complete
```

### Cloud Drafts

```text
PUT  /api/drafts/:id
GET  /api/drafts/:id
GET  /api/drafts
POST /api/drafts/:id/visibility
```

Cloud Draft save/recovery remains account-scoped. Public profile reads use a separate public-safe read model.

### Profile media

```text
GET/POST/DELETE /api/profile/avatar
GET/POST/DELETE /api/profile/cover
```

### Public profiles

```text
GET /api/users/:userId/profile
GET /api/users/:userId/drafts
```

### Prompt Archive

```text
/api/archive...
/api/admin/archive...
```

Archive exact route details remain documented in the Milestone 17 phase docs.

## Current SQL history

```text
001_create_wizard_runs.sql
002_create_prompt_drafts.sql
003_create_auth.sql
004_scope_prompt_drafts_to_users.sql
005_add_user_roles.sql
006_add_admin_user_indexes.sql
007_add_user_status_and_admin_audit.sql
008_progressive_user_profile.sql
009_user_score_events.sql
010_score_identity_triggers.sql
011_score_cloud_draft_creation.sql
012_create_referrals.sql
013_prompt_archive_foundation.sql
014_archive_media_storage_keys.sql
015_user_avatar.sql
016_public_user_profiles.sql
```

Do not rewrite applied migration history. Add a new numbered migration for future schema changes.

## Current next step

No new milestone is selected yet.

The next chat should first read:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
docs/backend/MILESTONE_18_USER_AVATAR.md
docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md
```

Then inspect the implementation relevant to the user's new request and extend the verified platform without reopening completed behavior unnecessarily.
