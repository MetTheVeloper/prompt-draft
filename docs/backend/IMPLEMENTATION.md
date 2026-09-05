# Backend Implementation Baseline

Last updated: 2026-09-06

Current branch: `feature/create-ui-consolidation`
Backend/platform base: `feature/docker-local-api` at implementation checkpoint `4c67b045abead7e2eb3d7cdc29865859a86ecf6b`

## Current verified state

Milestones 1 through 20 are complete and locally verified. The post-Milestone-20 `feature/create-ui-consolidation` scope is also complete and locally verified.

Current platform path:

```text
static Nuxt frontend
  -> browser CORS/preflight
  -> independent Node API :4000
  -> validation / authentication / authorization
  -> PostgreSQL
  -> optional backend-only services/integrations
  -> Arvan Object Storage for managed media
```

The backend remains independent from Nuxt server routes so static generation remains supported.

Reusable conventions:

```text
docs/backend/API_GUIDE.md
  -> general API/backend vertical slices

docs/backend/MANAGE_GUIDE.md
  -> permission-aware Manage/admin features

docs/backend/BRANCH_CREATE_UI_CONSOLIDATION.md
  -> current post-M20 UI/API-projection decisions
```

## Schema workflow

The development schema runner discovers `backend/sql/NNN_*.sql` and applies files in lexical order.

Current schema history:

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
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
019_archive_user_draft_promotion.sql
```

Never rewrite applied migration history. The next real schema change must use `020_*.sql`.

# Core product boundaries

## Authentication + progressive profile

Authentication remains optional for local-first product flows unless a feature explicitly gates access.

Persisted identity states support:

```text
username only
email only
username + email
```

At least one identity must remain present.

Auth responses expose current user, permissions, progressive-profile state, score and referral read models. Media is read through dedicated profile-media endpoints rather than expanding every auth response.

Security baseline:

```text
password hashing -> Node scrypt + random salt
raw passwords -> never stored
browser sessions -> random bearer tokens
DB session storage -> SHA-256 token hash only
```

## Authorization

Persisted roles:

```text
user
admin
super_admin
```

Privileged behavior keeps three-layer enforcement:

```text
1. conditional UI
2. frontend route guard
3. backend permission guard (authoritative)
```

Relevant verified permissions include Manage/user capabilities plus:

```text
archive.view
archive.manage
drafts.delete_any
```

Do not rely on frontend hiding as the security boundary.

## Cloud Draft ownership, visibility and deletion

`prompt_drafts` is account-scoped by `user_id`.

Normal Cloud Draft APIs are owner-only. Public profile behavior uses a separate public-safe read path rather than weakening ownership.

Visibility:

```text
private
public
```

Default: `private`.

Visitor profile queries filter `visibility = 'public'` in backend/database queries. Owner profile reads may include all own active Draft summaries.

Soft deletion from Milestone 20:

```text
deleted_at IS NULL     -> active Draft
deleted_at IS NOT NULL -> deleted Draft
```

Normal Draft/profile reads, counters and cloud restore exclude tombstones. Stale clients cannot resurrect a tombstoned Draft.

Do not expose full editor snapshots or account-private fields merely because a Draft summary is public.

## Public user profile privacy

Public endpoints:

```text
GET /api/users/resolve?username=<username>
GET /api/users/:userId/profile
GET /api/users/:userId/drafts
```

Public read models never expose email, auth/session secrets, password fields or private Drafts to non-owners.

When username is absent, public UI uses a localized generic name rather than email fallback.

Owner visibility mutation:

```text
POST /api/drafts/:draftId/visibility
```

The mutation is scoped by authenticated `user_id` plus requested `draft_id`.

No XP is awarded for visibility toggles. A future Share reward must be a separate idempotent event.

# Media implementation baseline

## Storage adapter

Managed media uses the backend-only Arvan/S3-compatible adapter established in Milestone 17. Credentials remain server-side only.

Verified adapter operations include HEAD bucket/object, PUT, signed GET, anonymous public GET and DELETE.

Use immutable object keys for replaceable media, persist new DB state, then best-effort clean old objects.

## Archive images

Accepted input: JPEG/JPG, PNG, WebP.

```text
full WebP
  max edge = 2048
  quality = 0.60
  preserve aspect ratio
  no upscale

thumbnail WebP
  max edge = 640
  quality = 0.72
  preserve aspect ratio
  no upscale
```

Archive storage keys are UUID-based and independent of visual position.

## User avatar

Migration: `015_user_avatar.sql`.

```text
JPEG/PNG/WebP input
center crop
exact 400x400
WebP quality 0.60
```

Backend validates actual WebP structure/dimensions.

Storage:

```text
avatars/<user-uuid>/<immutable-avatar-uuid>.webp
```

Reusable UI: `app/components/el/avatar.vue`.

Fallback:

```text
image -> initials -> person icon
```

## User cover

Migration: `016_public_user_profiles.sql`.

Cover is optional and preserves source aspect ratio.

```text
full WebP: max edge 2048, quality 0.60, no upscale
thumbnail WebP: max edge 640, quality 0.72, no upscale
```

Storage:

```text
covers/<user-uuid>/<immutable-cover-uuid>/full.webp
covers/<user-uuid>/<immutable-cover-uuid>/thumb.webp
```

Profile Menu uses thumbnail; `/user` hero uses full cover.

## Cloud Draft preview media

Migration: `017_cloud_draft_preview_media.sql`.

Preview media is relational in `prompt_draft_images`.

```text
up to 8 images per Draft
JPEG/PNG/WebP input
WebP quality 0.60
preserve source dimensions
no crop / no resize
position 0 = primary preview
```

Storage:

```text
draft-media/<USER_UUID>/<IMAGE_UUID>/image.webp
```

The central `DraftPreviewManagerModal` is the reusable owner media-management surface.

# Prompt Archive implementation baseline

## Authoritative source

PostgreSQL is the Archive source of truth.

Core tables:

```text
prompt_archive_metadata
prompt_archive_items
prompt_archive_images
prompt_archive_tags
prompt_archive_item_tags
```

Archive route identity is stable numeric `public_id`. Telegram linkage is optional source metadata.

```text
public_id              -> stable public route identity
telegram_message_id    -> nullable
telegram_url           -> nullable
source_kind            -> managed | legacy_json | user_draft
source_user_id         -> nullable provenance
source_draft_id        -> nullable provenance
```

Dynamic localized titles live in `titles.en` / `titles.fa`.

## Runtime reads

`/prompts` is API-first. Server-side list behavior includes search/filter/order/cursor pagination.

Recoverable backend failure may use the generated fallback snapshot:

```text
public/data/prompts.json
schemaVersion = 3
```

Generated through `pnpm archive:snapshot`; managed cloud media is mirrored under `public/prompts/_snapshot/...`.

## Manage Archive

Canonical route:

```text
/manage/archive
```

Deep-link edit route:

```text
/manage/archive?edit=<publicId>
```

Resolver:

```text
GET /api/admin/archive/public/:publicId
```

Mutating Archive content/media returns an item to Draft where required; publish remains an explicit operation.

Legacy import is bootstrap/migration tooling, not permanent sync.

## User Draft promotion

Migration: `019_archive_user_draft_promotion.sql`.

```text
archive.manage     -> promote eligible public user Draft
drafts.delete_any -> moderation soft-delete another user's Draft
```

Promotion creates an Archive Draft, records source provenance, blocks duplicate source promotion and copies/re-prepares media into independent Archive-owned `archive/...` keys. Promotion never auto-publishes.

# Public profile UI baseline

Routes:

```text
/user?id=<USER_UUID>
/user?un=<username>
```

Verified post-M20 direction:

```text
full-screen cinematic cover hero
large foreground el-avatar
centered identity hierarchy
compact member age + XP presentation
Saved Drafts image-first showcase cards
owner actions through shared Global Menu
owner visibility controls
visitor public-only content
```

Draft cards do not display internal UUIDs.

## Shared canvas-slider single-source rule

For exactly one image source:

```text
pan start
-> eased movement to end
-> eased movement back to start
-> repeat continuously
```

Do not fake a slide-to-same-slide transition or freeze at pan end. Multi-source behavior remains unchanged.

# Manage baseline

Canonical routes:

```text
/manage
/manage/dashboard
/manage/users
/manage/archive
```

Future Manage work extends existing `MANAGE_SECTIONS`, middleware, typed API boundaries, authorization, Global Menu/Modal, audit and EN/FA patterns. Do not recreate a second admin shell.

# Post-Milestone-20 UI/API projection baseline

`feature/create-ui-consolidation` establishes these additional implementation rules.

## `/create` action hierarchy

Primary/high-frequency:

```text
Drafts
Cloud Save / Sync
Public / Private
```

Secondary actions use the shared Global Menu:

```text
Share
Download
Manage previews
Delete
```

The visibility control uses the existing owner API. Preview management reuses `DraftPreviewManagerModal`; there is no create-specific duplicate media workflow.

When a primary Draft preview exists, `/create` may use it as the full-screen presentation background. `position = 0` remains the source of primary-image truth.

## Admin collection/detail projection rule

Return the smallest server projection needed to render the surface without per-row detail requests.

Verified examples:

```text
/manage/users list
  -> avatarUrl stays in lightweight summary

User Information modal
  -> richer detail-only projection: cover, email, Draft visibility counts,
     active sessions, XP, joined/updated/activity timestamps

/manage/archive list
  -> previewImageUrl selected directly by list query
  -> first image ordered by position/id
  -> thumbnail -> full -> source fallback
```

Avoid N+1 list reads. Rich fields that only one modal/editor needs belong in the detail response rather than bloating every list row.

The admin User Information response is privileged and must not be confused with the public profile privacy contract.

No migration was needed for this consolidation pass.

# XP / referral rules

Authoritative score state remains append-only `user_score_events`.

Verified rewards include account creation, email addition, Cloud Draft creation and referral events. Routine Draft edits/saves are intentionally not rewarded.

Every new reward producer needs a stable logical event and deterministic idempotency key.

# Release/verification rules

Frontend-affecting milestone/release work preserves `pnpm generate`.

Backend/API/database behavior must be locally exercised before milestone `DONE` status. Branch-level UI consolidation may additionally be functionally accepted through explicit local user verification before later release integration.

# Closure state

Milestones 1–20 and the defined `feature/create-ui-consolidation` scope are closed. No in-scope task remains open.

Current handoff order:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
docs/backend/BRANCH_CREATE_UI_CONSOLIDATION.md
```

No merge to `main` is implied by this closure state.
