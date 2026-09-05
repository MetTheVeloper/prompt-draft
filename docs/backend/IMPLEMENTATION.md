# Backend Implementation Baseline

Last updated: 2026-09-06

Branch: `feature/docker-local-api`
Final implementation checkpoint: `4c67b045abead7e2eb3d7cdc29865859a86ecf6b`

## Current verified state

Milestones 1 through 20 are complete and locally verified.

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
```

## Schema workflow

The development schema runner discovers:

```text
backend/sql/NNN_*.sql
```

and applies them in lexical order.

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

Auth responses expose the current user, permissions, progressive-profile state, score and referral read models. Media is intentionally read through dedicated profile-media endpoints rather than expanding every login/register response.

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

Privileged behavior must keep three-layer enforcement:

```text
1. conditional UI
2. frontend route guard
3. backend permission guard (authoritative)
```

Relevant verified permissions now include Manage/user permissions plus:

```text
archive.view
archive.manage
drafts.delete_any
```

Do not rely on frontend hiding as the security boundary.

## Cloud Draft ownership, visibility and deletion

`prompt_drafts` is account-scoped by `user_id`.

Normal Cloud Draft API behavior is owner-only. A user cannot request arbitrary another-user Draft content through the private Cloud Draft API.

Public profile behavior uses a separate public-safe read path instead of weakening the ownership model.

Visibility model:

```text
private
public
```

Default:

```text
private
```

Public profile visitor queries filter at the backend/database layer:

```sql
visibility = 'public'
```

Owner profile reads may include all own active Draft summaries.

Milestone 20 adds soft-delete tombstones:

```text
deleted_at IS NULL     -> active Draft
deleted_at IS NOT NULL -> deleted Draft
```

Normal Draft reads, profile reads, counters and cloud restore exclude tombstones. A stale client cannot resurrect a deleted Draft; write attempts against a tombstoned identity are rejected.

Do not expose full editor snapshots or account-private fields merely because a Draft summary is public.

## Public user profile privacy

Public profile endpoints:

```text
GET /api/users/resolve?username=<username>
GET /api/users/:userId/profile
GET /api/users/:userId/drafts
```

Public read models must never expose:

```text
email
auth/session data
password fields
private Drafts to non-owners
```

When username is missing, public UI uses a localized generic name instead of email fallback.

Owner visibility mutation:

```text
POST /api/drafts/:draftId/visibility
```

The mutation condition must include both authenticated `user_id` and requested `draft_id`.

No XP is awarded for visibility toggles. If Share Draft receives XP later, implement a separate idempotent reward event rather than rewarding public/private toggling.

# Media implementation baseline

## Storage adapter

Managed media uses the backend-only Arvan/S3-compatible adapter established in Milestone 17.

Credentials must remain server-side environment variables. Never expose Access Key or Secret Key through Nuxt runtime/public config or browser requests.

The verified storage adapter supports:

```text
HEAD bucket
PUT object
HEAD object
signed GET
anonymous public GET
DELETE object
```

Use immutable object keys for replaceable media, then update DB state and best-effort delete old objects.

## Archive images

Accepted inputs:

```text
jpg/jpeg
png
webp
```

Browser outputs:

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

Archive storage keys are UUID-based and independent of visual position. Reorder therefore updates DB position without rewriting object URLs.

## User avatar

Migration:

```text
015_user_avatar.sql
```

Avatar fields are nullable and have no stored default.

Browser contract:

```text
JPEG/PNG/WebP input
center crop
exact 400x400
WebP quality = 0.60
```

Backend validates actual WebP structure/dimensions rather than trusting browser metadata.

Storage:

```text
avatars/<user-uuid>/<immutable-avatar-uuid>.webp
```

Reusable UI:

```text
app/components/el/avatar.vue
```

Fallback order:

```text
image
-> initials
-> person icon
```

## User cover

Migration:

```text
016_public_user_profiles.sql
```

Cover is optional and preserves source aspect ratio.

Browser outputs:

```text
full WebP
  max edge = 2048
  quality = 0.60
  no upscale

thumbnail WebP
  max edge = 640
  quality = 0.72
  no upscale
```

Storage:

```text
covers/<user-uuid>/<immutable-cover-uuid>/full.webp
covers/<user-uuid>/<immutable-cover-uuid>/thumb.webp
```

Profile Menu uses thumbnail; `/user` hero uses full cover.

## Cloud Draft preview media

Migration:

```text
017_cloud_draft_preview_media.sql
```

Preview media is relational in `prompt_draft_images`.

Verified contract:

```text
up to 8 images per Draft
JPEG/PNG/WebP input
WebP quality 0.60
preserve source dimensions
no crop
no resize
position 0 = primary preview
```

Storage namespace:

```text
draft-media/<USER_UUID>/<IMAGE_UUID>/image.webp
```

Owner media endpoints support list/add/delete/primary selection. The central Preview Manager is the reusable UI surface.

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

After Milestone 20, Archive route identity is the stable numeric `public_id`. Telegram linkage is optional source metadata rather than the route identity.

```text
public_id              -> required stable public route identity
telegram_message_id    -> nullable
telegram_url           -> nullable
source_kind            -> managed | legacy_json | user_draft
source_user_id         -> nullable provenance
source_draft_id        -> nullable provenance
```

Dynamic localized titles are stored with content:

```text
titles.en
titles.fa
```

New managed Archive rows must not depend on source-code i18n title keys.

## Runtime reads

`/prompts` is API-first.

Server-side list behavior includes search/filter/order/cursor pagination.

Recoverable backend failure may switch to generated static fallback. Authentication/authorization errors are not fallback conditions.

Fallback snapshot:

```text
public/data/prompts.json
schemaVersion = 3
```

Generated through:

```text
pnpm archive:snapshot
```

Managed cloud media is mirrored into:

```text
public/prompts/_snapshot/...
```

Legacy media remains on its existing local static path.

## Manage Archive

Canonical route:

```text
/manage/archive
```

Deep-link edit route:

```text
/manage/archive?edit=<publicId>
```

Resolution endpoint:

```text
GET /api/admin/archive/public/:publicId
```

Manage extends the existing shell and uses existing permission/audit conventions.

Mutating Archive media or content returns the item to Draft where required so public state does not change implicitly.

Importer is a bootstrap/migration tool, not a permanent sync engine. Once source rows have been taken over as managed state, import safeguards prevent legacy import from overwriting managed content.

## User Draft promotion

Migration:

```text
019_archive_user_draft_promotion.sql
```

Authorized promotion requires a public active source Draft and creates a new Archive item in Draft state.

```text
archive.manage
  -> promote eligible public user Draft

drafts.delete_any
  -> moderation soft-delete of another user's Draft
```

Promotion copies/re-prepares source Draft preview media into independent Archive-owned `archive/...` keys. The promoted item therefore survives later source-Draft moderation/removal.

Duplicate promotion is prevented by source provenance uniqueness.

# Public profile UI baseline

Routes:

```text
/user?id=<USER_UUID>
/user?un=<username>
```

Verified visual/product direction after Milestone 20:

```text
full-screen cinematic cover hero
cover in canvas slider/background layer
large foreground el-avatar
centered identity hierarchy
compact member age + XP presentation
Saved Drafts image-first showcase cards
owner Draft actions through shared Global Menu
owner visibility controls
visitor public-only content
```

Draft cards intentionally do not display internal Draft UUIDs.

Milestone 20 card behavior includes primary full-background preview, optional second-image hover crossfade, Preview Manager access, Edit/Copy/Download actions and soft Delete.

## Shared canvas-slider single-source rule

When the renderer receives exactly one image source, do not run a fake slide-to-same-slide reveal transition and do not freeze at the end of pan animation.

Current behavior:

```text
pan start
-> eased movement to end
-> eased movement back to start
-> repeat continuously
```

Multi-source slider behavior remains unchanged.

# Manage baseline

Canonical routes include:

```text
/manage
/manage/dashboard
/manage/users
/manage/archive
```

Future Manage work must extend the existing `MANAGE_SECTIONS`, middleware, typed API boundaries, authorization, audit logging and EN/FA patterns documented in `MANAGE_GUIDE.md`.

Do not recreate a second admin shell.

# XP / referral rules

Authoritative score state remains the append-only:

```text
user_score_events
```

Current verified rewards include account creation, email addition, Cloud Draft creation and referral events.

Routine Draft edits/saves are intentionally not rewarded.

Every new reward producer must define a stable logical event and deterministic idempotency key.

# Release/verification rules

For frontend-affecting milestone changes:

```text
pnpm generate
```

must succeed before the milestone is considered complete.

Backend/API/database behavior must also be locally exercised by the user before `DONE` status.

# Closure state

`feature/docker-local-api` is complete through Milestone 20. There is no unfinished in-scope milestone in this branch.

The final verified milestone source is:

```text
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
```

For a new chat or child branch, read:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
docs/backend/MILESTONE_18_USER_AVATAR.md
docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
```

Then inspect the current implementation related to the user's new direction before editing code.
