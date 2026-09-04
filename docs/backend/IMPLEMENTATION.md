# Backend Implementation Baseline

Last updated: 2026-09-05

Branch: `feature/docker-local-api`

## Current verified state

Milestones 1 through 19 are complete and locally verified.

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
```

Never rewrite applied migration history. Add a new numbered migration for future schema changes.

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

Archive adds:

```text
archive.view
archive.manage
```

Do not rely on frontend hiding as the security boundary.

## Cloud Draft ownership

`prompt_drafts` is account-scoped by `user_id`.

Normal Cloud Draft API behavior is owner-only. A user cannot request arbitrary another-user Draft content through the private Cloud Draft API.

Milestone 19 adds a separate public-safe profile read path rather than weakening that ownership model.

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

Owner profile reads may include all own Draft summaries.

Do not expose full editor snapshots or account-private fields merely because a Draft summary is public.

## Public user profile privacy

Public profile endpoint:

```text
GET /api/users/:userId/profile
```

Public draft summaries:

```text
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

Owner mutation:

```text
POST /api/drafts/:draftId/visibility
```

The mutation condition must include both authenticated `user_id` and requested `draft_id`.

No XP is awarded for visibility toggles. If Share Draft receives XP later, implement a separate idempotent reward event rather than rewarding public/private toggling.

# Media implementation baseline

## Storage adapter

Managed media uses the backend-only Arvan/S3-compatible adapter established in Milestone 17.

Credentials must remain server-side environment variables. Never expose Access Key or Secret Key through Nuxt runtime/public config or browser requests.

The currently verified storage supports:

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

`el-avatar` sizing uses the same EL dimension resolver as button height, so a same-size FAB and avatar align by height.

## User cover

Migration:

```text
016_public_user_profiles.sql
```

Cover is optional.

Unlike avatar, cover is not force-cropped. Aspect ratio is preserved and consuming UI uses cover-style framing.

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

Telegram message ID is the natural import/content identifier while DB rows keep independent UUID primary keys.

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
/manage/archive?edit=<telegram-message-id>
```

Manage extends the existing shell and uses existing permission/audit conventions.

Mutating Archive media or content returns the item to Draft where required so public state does not change implicitly.

Importer is a bootstrap/migration tool, not a permanent sync engine. Once source rows have been taken over as managed state, import safeguards prevent legacy import from overwriting managed content.

# Public profile UI baseline

Route:

```text
/user?id=<USER_UUID>
```

Current verified visual direction:

```text
full-screen cinematic cover hero
cover in canvas slider/background layer
large foreground el-avatar
centered identity hierarchy
large creator name
member-since metadata
XP / public Draft / total Draft stats
Saved Drafts section
owner visibility controls
visitor public-only content
```

Draft cards intentionally do not display internal Draft UUIDs. They show product metadata such as modules, revision and updated time instead.

## Shared canvas-slider single-source rule

When the renderer receives exactly one image source, do not run a fake slide-to-same-slide reveal transition and do not freeze at the end of pan animation.

Current behavior:

```text
pan start
-> eased movement to end
-> eased movement back to start
-> repeat continuously
```

This behavior applies anywhere the shared renderer is used with one source, including user cover/profile backgrounds and single-preview prompt detail surfaces.

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

For frontend-affecting changes:

```text
pnpm generate
```

must succeed before the milestone is considered complete.

Backend/API/database behavior must also be locally exercised by the user before `DONE` status.

# Current next step

No Milestone 20 or other next feature is selected yet.

For a new chat, read:

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

Then inspect the current implementation related to the user's new direction before editing code.
