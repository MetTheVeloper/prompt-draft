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
```

## Documentation map

```text
STATUS.md
  -> verified current checkpoint + next-chat handoff
README.md
  -> architecture + milestone overview
IMPLEMENTATION.md
  -> concrete extension rules and boundaries
API_GUIDE.md
  -> reusable backend/API vertical-slice playbook
MANAGE_GUIDE.md
  -> reusable Manage/admin workspace playbook
MILESTONE_*.md
  -> detailed feature source-of-truth records
```

A milestone is only `DONE` after local user verification. Code creation alone is not sufficient.

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

Current Archive media contract:

```text
full: max edge 2048, WebP 0.60, no upscale
thumbnail: max edge 640, WebP 0.72, no upscale
```

Detailed source:

```text
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

## Milestone 18 — COMPLETE: User Avatar Foundation

Avatar contract:

```text
optional
JPEG/PNG/WebP
center crop
400x400 WebP
quality 0.60
backend dimension validation
Arvan immutable object
replace/remove
image -> initials -> person icon fallback
```

Reusable component:

```text
app/components/el/avatar.vue
```

Detailed source:

```text
docs/backend/MILESTONE_18_USER_AVATAR.md
```

## Milestone 19 — COMPLETE: Public User Profiles + Cover Media

Public profile canonical entry:

```text
/user?id=<user-uuid>
```

Milestone 20 additionally provides `/user?un=<username>` as a public-safe alias while UUID remains canonical.

Public Draft privacy:

```text
owner   -> active own public + private Cloud Draft summaries
visitor -> active public Draft summaries only
```

Cloud Draft default is `private`. Public profile responses exclude email/private Auth data.

Optional cover media remains full + thumbnail WebP on Arvan. The single-source canvas slider keeps eased start/end pan looping and multi-source behavior remains unchanged.

Detailed source:

```text
docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md
```

## Milestone 20 — IN PROGRESS: Profile Showcase, Draft Media & Archive Promotion

```text
20A -> DONE / verified
20B -> DONE / verified
20C -> IMPLEMENTED / pending local verification
```

### Phase 20A — verified

Adds:

```text
Profile Menu centered avatar/identity composition
avatar +12px visual with exact half-height overlap
root + child Global Menu layers
surface50 + blur fallback avatar
compact XP + relative account age
compact Manage / View profile / Sign out actions
shared portal-based tooltip fix
/user?un=<username> resolver
Draft-card normal15 -> normal50 border behavior
```

### Phase 20B — verified

Migrations:

```text
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
```

Cloud Draft media:

```text
multi-image relational media
Arvan draft-media/<user>/<image>/image.webp
WebP quality 0.60
no crop / no resize
position 0 = primary card preview
Preview Manager modal
stacked image-delete confirmation
```

Draft workflow:

```text
Edit Draft -> /create?draft=<id>
Manage Previews
Copy Output
Download JSON
Show/Hide profile
soft Delete Draft
```

Deletion uses `prompt_drafts.deleted_at`; normal read models exclude tombstones while the DB row remains available for audit/recovery. Stale clients receive `409 DRAFT_DELETED` instead of resurrecting a deleted identity.

Verified showcase cards are square, image-first, full-background cards with large bottom-pinned metadata, absolute action controls and a second-preview hover crossfade.

The user locally verified Phase 20B behavior and a successful `pnpm generate` on 2026-09-05.

### Phase 20C — implemented / pending local verification

Permissions:

```text
archive.manage     -> promote a public user Draft into Prompt Archive
drafts.delete_any -> moderate-delete another user's Draft
```

Role behavior:

```text
Admin       -> Archive promotion
Super Admin -> Archive promotion + arbitrary Draft moderation delete
```

Migration:

```text
019_archive_user_draft_promotion.sql
```

Archive identity no longer assumes every item is Telegram-backed:

```text
public_id = stable numeric Archive route identity
existing rows: public_id = telegram_message_id
new non-Telegram rows: sequence-backed public_id >= 1,000,000,000
telegram_message_id nullable
telegram_url nullable
source_kind += user_draft
source_user_id + source_draft_id provenance
unique user-Draft provenance
```

Existing Telegram-based `/prompts?id=<id>` public IDs remain unchanged. `/api/archive`, `/prompts`, Manage Archive and schemaVersion 3 fallback parsing support non-Telegram entries. Manage Archive deep-links now resolve by `public_id`, and Telegram actions render only when a Telegram URL actually exists.

Promotion behavior:

```text
source Draft must be public, active and non-deleted
prompt output compiled from stored Draft
Admin supplies EN + FA title
Telegram message ID optional
new Archive item starts as draft
preview media copied through authorized source-image proxy
media re-prepared with Archive full/thumbnail WebP contract
copied media stored under Archive-owned archive/... keys
duplicate promotion prevented by source provenance uniqueness
```

The snapshot exporter emits public IDs and nullable Telegram URLs. The bootstrap importer restores public IDs and advances the high sequence namespace so a fresh installation cannot collide with sequence-backed IDs already present in a generated snapshot.

Moderation behavior:

```text
Super Admin drafts.delete_any
central confirmation UI
soft delete via prompt_drafts.deleted_at
draft.moderation_delete audit event
normal owner/public reads exclude tombstone
promoted Archive item remains independent
```

Phase 20C remains open until migration 019, compatibility, promotion/media independence, permission boundaries, moderation/audit, Archive snapshot parity and `pnpm generate` are locally verified.

Detailed source:

```text
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
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
DELETE /api/drafts/:id        # owner soft-delete
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

Do not rewrite applied migrations. Migration 019 is the active unverified Phase 20C schema change.

## Current next step

Run the Phase 20C local acceptance pass from the Milestone 20 source: apply migration 019, verify old Archive compatibility, promote a public Draft without Telegram, confirm Archive-owned media independence, test Admin/Super Admin moderation boundaries, generate the Archive snapshot, then run `pnpm generate`.
