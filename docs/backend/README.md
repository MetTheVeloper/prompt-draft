# Prompt Draft Backend

This directory is the source of truth for Prompt Draft backend, Docker, authorization, Cloud Drafts, translation, Manage, XP/referrals, Prompt Archive, profile media and public profile work.

## Current branch

`feature/create-ui-consolidation`

Base backend/platform branch:

```text
feature/docker-local-api
final checkpoint: 4c67b045abead7e2eb3d7cdc29865859a86ecf6b
```

The Docker/backend milestone program through Milestone 20 is complete. The current child branch is a completed post-Milestone-20 UI/API-projection consolidation pass documented in `BRANCH_CREATE_UI_CONSOLIDATION.md`.

## Current verified architecture

```text
static Nuxt frontend
  -> direct browser HTTP/CORS
  -> independent Node API :4000
  -> validation / authentication / authorization
  -> PostgreSQL
  -> backend-only integrations such as Arvan Object Storage
```

The backend remains independent from Nuxt server routes so the frontend can continue using static generation.

Core invariants:

```text
pnpm generate must keep working
backend authorization is authoritative
Cloud Drafts are private by default
public profile APIs must not leak email/private Drafts
storage credentials remain backend-only
schema changes use new numbered SQL migrations
important reward events require idempotency semantics
admin/list projections should avoid N+1 detail requests
```

## Documentation map

```text
STATUS.md
  -> verified current checkpoint + handoff
README.md
  -> architecture + milestone overview
IMPLEMENTATION.md
  -> extension rules and boundaries
API_GUIDE.md
  -> reusable backend/API vertical-slice playbook
MANAGE_GUIDE.md
  -> reusable Manage/admin workspace playbook
MILESTONE_*.md
  -> detailed milestone source-of-truth records
BRANCH_CREATE_UI_CONSOLIDATION.md
  -> post-Milestone-20 /create + Manage projection consolidation record
```

A milestone/branch scope is only `DONE` after local user verification.

## Milestones 1–16 — COMPLETE

Verified base platform includes Docker/PostgreSQL, Wizard run persistence + History, optional authentication, account-owned Cloud Draft sync, server-side translation, roles/permissions, Manage Dashboard + Users, progressive profile completion, email feature gates, append-only XP/event ledger, referrals and Prompt/Collage access gates.

## Milestone 17 — COMPLETE: Prompt Archive Platform

```text
PostgreSQL
  -> /api/archive list/detail/search/filter/pagination
  -> /prompts
```

Management:

```text
/manage/archive
  -> archive.view / archive.manage
  -> create/edit/draft/publish/archive
  -> canonical tags
  -> EN/FA titles
  -> prepared full + thumbnail WebP media
  -> Arvan Object Storage
  -> admin audit events
```

Fallback:

```text
pnpm archive:snapshot
  -> public/data/prompts.json schemaVersion 3
  -> local legacy media
  -> mirrored managed media under public/prompts/_snapshot
```

Archive media contract:

```text
full: max edge 2048, WebP 0.60, no upscale
thumbnail: max edge 640, WebP 0.72, no upscale
```

## Milestone 18 — COMPLETE: User Avatar Foundation

```text
optional JPEG/PNG/WebP
center crop
400x400 WebP
quality 0.60
backend validation
Arvan immutable object
replace/remove
image -> initials -> person icon fallback
```

Reusable component: `app/components/el/avatar.vue`.

## Milestone 19 — COMPLETE: Public User Profiles + Cover Media

Profile routes:

```text
/user?id=<user-uuid>
/user?un=<username>
```

Public Draft privacy:

```text
owner   -> active own public + private Cloud Draft summaries
visitor -> active public Draft summaries only
```

Cloud Draft default is `private`. Public profile responses exclude email/private Auth data.

## Milestone 20 — COMPLETE: Profile Showcase, Draft Media & Archive Promotion

```text
20A -> DONE / verified
20B -> DONE / verified
20C -> DONE / verified
```

### Phase 20A

```text
Profile Menu centered avatar/identity composition
nested Global Menu support
surface50 + blur avatar fallback
compact XP + relative account age
compact Manage / View profile / Sign out actions
shared portal-based tooltip fix
/user?un=<username> resolver
Draft-card normal15 -> normal50 border behavior
```

### Phase 20B

Migrations:

```text
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
```

Cloud Draft media/workflow:

```text
multi-image relational preview media
Arvan draft-media/<user>/<image>/image.webp
WebP quality 0.60
no crop / no resize
position 0 = primary card preview
Preview Manager modal
stacked image-delete confirmation
Edit Draft -> /create?draft=<id>
Copy Output
Download JSON
Show/Hide profile
soft Delete Draft via deleted_at
```

### Phase 20C

Migration:

```text
019_archive_user_draft_promotion.sql
```

Permissions:

```text
archive.manage     -> promote a public user Draft into Prompt Archive
drafts.delete_any -> moderate-delete another user's Draft
```

Archive identity/provenance:

```text
public_id = stable numeric Archive route identity
existing Telegram rows keep their old public IDs
telegram_message_id nullable
telegram_url nullable
source_kind += user_draft
source_user_id + source_draft_id provenance
unique source-Draft promotion
```

Final local acceptance on 2026-09-05 confirmed promotion, duplicate protection, publication, moderation tombstone, audit records, Archive-owned media independence, Archive snapshot parity and successful static generation.

Detailed source:

```text
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
```

## Post-Milestone-20 Create UI Consolidation — COMPLETE

The current branch completes the deferred UI/API-projection pass:

```text
/create
  -> Drafts + Cloud Save/Sync + Public/Private remain primary
  -> Share / Download / Preview Manager / Delete live under Global Menu
  -> existing DraftPreviewManagerModal reused
  -> primary preview can render as the create background

/manage/users
  -> el-avatar in user rows
  -> richer authorized User Information detail projection

/manage/archive
  -> first preview shown with el-avatar
  -> previewImageUrl projected in list API; no N+1 detail reads
```

No schema change was required.

Detailed source:

```text
docs/backend/BRANCH_CREATE_UI_CONSOLIDATION.md
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
PUT    /api/drafts/:id
GET    /api/drafts/:id
GET    /api/drafts
DELETE /api/drafts/:id
POST   /api/drafts/:id/visibility
GET/POST/DELETE /api/drafts/:id/images...
```

### Profile media

```text
GET/POST/DELETE /api/profile/avatar
GET/POST/DELETE /api/profile/cover
```

### Public profiles

```text
GET /api/users/resolve?username=<username>
GET /api/users/:userId/profile
GET /api/users/:userId/drafts
```

### Prompt Archive

```text
GET  /api/archive
GET  /api/archive/:publicId
/api/admin/archive...
GET  /api/admin/archive/public/:publicId
GET  /api/admin/archive/source-draft/:userId/:draftId
POST /api/admin/archive/promote-draft
```

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
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
019_archive_user_draft_promotion.sql
```

Do not rewrite applied migrations. The next schema change must use `020_*.sql`.

## Current next step

Milestones 1–20 and the defined `feature/create-ui-consolidation` scope are closed. No in-scope implementation item remains open. Read `STATUS.md` before selecting the next product direction. No merge to `main` is implied by this documentation state.
