# Backend / Docker Status

Last updated: 2026-09-05

Branch: `feature/docker-local-api`

## Verification rule

A phase or milestone is marked `DONE` only after the user runs the relevant behavior locally and explicitly confirms it. Code creation alone is not sufficient. `pnpm generate` remains a release invariant for frontend-affecting work.

## Current checkpoint

```text
Milestones 1–16: COMPLETE / locally verified
Milestone 17 — Prompt Archive Platform: DONE / locally verified
Milestone 18 — User Avatar Foundation: DONE / locally verified
Milestone 19 — Public User Profiles + Cover Media: DONE / locally verified
Milestone 20 — Profile Showcase, Draft Media & Archive Promotion: IN PROGRESS
  Phase 20A — Profile UX polish + username profile alias: DONE / locally verified
  Phase 20B — Cloud Draft preview media + Draft workflow: DONE / locally verified
  Phase 20C — Moderation + Promote to Prompt Archive: IMPLEMENTED / PENDING LOCAL VERIFICATION
```

The user explicitly confirmed Phase 20B functionality, soft-delete persistence, final square showcase-card design and a successful `pnpm generate` on 2026-09-05.

Phase 20C implementation is now complete on the branch. Migration 019 has not yet been locally accepted; Phase 20C remains open until local migration/behavior tests, Archive snapshot parity and `pnpm generate` succeed.

Primary Milestone 20 source:

```text
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
```

## Current verified platform

```text
static Nuxt frontend
  -> browser HTTP/CORS
  -> independent Node API :4000
  -> auth / authorization / validation
  -> PostgreSQL
  -> Arvan Object Storage for managed media
  -> static/local fallback where explicitly designed
```

Important invariants:

```text
Nuxt static generation remains supported
backend authorization is authoritative
Cloud Drafts remain account-owned/private unless explicitly published
public profile APIs never expose email/private Drafts to visitors
storage credentials remain backend-only
new schema changes use new numbered SQL files
important XP/reward events require idempotency semantics
```

## Milestones 1–16 — verified foundation

The established platform before Archive/profile-media work includes Docker/PostgreSQL backend foundation, Wizard run persistence + History, optional Auth + Cloud Draft sync, translation, roles/permissions, Manage shell + Users + Dashboard, progressive profile completion, XP/event ledger, referrals and product access gates.

Detailed milestone records remain in `docs/backend/MILESTONE_*.md`.

## Milestone 17 — DONE: Prompt Archive Platform

Verified architecture:

```text
PostgreSQL = authoritative Archive source
/api/archive = server-side list/detail/search/filter/pagination
/prompts = API-first repository
public/data/prompts.json = generated fallback snapshot
/manage/archive = permission-aware content management
Arvan Object Storage = managed Archive media
```

Archive permissions:

```text
archive.view
archive.manage
```

Verified Manage behavior includes create/edit Drafts, explicit publish/archive state, EN/FA titles, canonical tags, browser image preparation, full + thumbnail WebP upload, reorder/delete, audit events, Manage deep links and Admin/Super Admin edit access from `/prompts`.

Archive image preparation:

```text
full: max edge 2048, WebP quality 0.60, no upscale
thumbnail: max edge 640, WebP quality 0.72, no upscale
```

Snapshot closure remains:

```text
pnpm archive:snapshot
-> public/data/prompts.json schemaVersion 3
-> managed media mirrored under public/prompts/_snapshot/...
```

## Milestone 18 — DONE: User Avatar Foundation

Verified avatar contract:

```text
optional
JPEG/PNG/WebP input
center crop
400x400 WebP
quality 0.60
backend WebP/dimension validation
Arvan immutable storage
image -> initials -> person icon fallback
```

`el-avatar` remains the reusable component and same-size FAB/avatar height remains the default invariant. Milestone 20 adds only an opt-in pixel offset for the Profile Menu visual.

## Milestone 19 — DONE: Public User Profiles + Cover Media

Public profile:

```text
/user?id=<USER_UUID>
```

Privacy boundary:

```text
owner   -> active own public + private Cloud Draft summaries
visitor -> active public Draft summaries only
```

Cloud Draft default visibility remains `private`. Public profile responses do not expose email/private account data.

Cover contract remains optional full + thumbnail WebP on Arvan. Single-source `visual-slider` behavior remains eased start/end pan looping without changing multi-source behavior.

## Milestone 20 — IN PROGRESS

### Phase 20A — DONE / verified

Verified additions:

```text
centered/overlapping Profile Menu avatar
nested child Global Menu for avatar actions
surface50 + backdrop-blur avatar fallback
compact XP + member-age presentation
compact Manage/View profile/Sign out row
shared portal-based tooltip fix
/user?un=<username> alias resolver
Draft-card EL border colors normal15 -> normal50
```

### Phase 20B — DONE / verified

Schema:

```text
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
```

Verified additions:

```text
multi-image Draft preview media
Arvan draft-media namespace
WebP 60% without crop/resize
Preview Manager central modal
arbitrary primary-image selection
stacked image-delete confirmation
three-dot Draft action menu
Edit Draft -> /create?draft=<id>
Copy Output
Download JSON
Show/Hide profile
soft Delete Draft via deleted_at tombstone
stale clients cannot resurrect tombstones
Saved drafts (N) heading
square image-first showcase cards
second-image hover crossfade
successful pnpm generate
```

Soft-delete proof was locally confirmed: the deleted Draft remained in `prompt_drafts` with a populated `deleted_at` while disappearing from normal read models/UI.

### Phase 20C — IMPLEMENTED / pending local verification

Permission contract:

```text
archive.manage     -> promote public user Draft to Prompt Archive
drafts.delete_any -> moderate-delete another user's Draft
```

Current role behavior:

```text
Admin       -> promotion
Super Admin -> promotion + moderation delete
```

Schema:

```text
019_archive_user_draft_promotion.sql
```

Implemented Archive identity strategy:

```text
public_id = stable numeric Archive route identity
existing rows: public_id = telegram_message_id
non-Telegram rows: sequence-backed public_id >= 1,000,000,000
telegram_message_id nullable
telegram_url nullable
source_kind += user_draft
source_user_id + source_draft_id provenance
unique source Draft promotion
```

Compatibility work now covers:

```text
/api/archive routes by public_id
old Telegram-backed public IDs remain unchanged
/manage/archive deep-links by public_id
optional Telegram field in Manage Archive
/prompts hides Telegram actions when telegram_url is null
API and schemaVersion 3 fallback parsers accept telegramUrl = null
snapshot exporter uses public_id
snapshot importer restores public IDs and advances the high public-id sequence
```

Promotion flow now covers:

```text
public source Draft read under archive.manage
same compiler used for Draft prompt output
manual EN + FA Archive title
optional Telegram ID
Archive item created as draft only
source provenance persisted
source preview images re-prepared with Archive image contract
Archive-owned archive/... object-storage keys
duplicate source promotion blocked
```

Moderation flow now covers:

```text
Super Admin-only drafts.delete_any enforcement
central confirmation UI
prompt_drafts.deleted_at tombstone
server_updated_at refresh
draft.moderation_delete audit event
normal owner/public read models automatically exclude the tombstone
```

Phase 20C is not `DONE` yet. The local acceptance pass must verify migration 019, old Archive URLs, promotion with and without Telegram, media independence, duplicate prevention, Admin/Super Admin permission boundaries, moderation tombstones/audit, Archive snapshot parity and `pnpm generate`.

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

Do not rewrite applied migration history. Migration 019 is the active Phase 20C schema change and remains unverified until the local pass.

## Reusable guides

```text
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
```

## Known non-blocking build warnings

Existing accepted warnings remain unless their behavior changes:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

## New-chat handoff

Milestone 20 is selected and in progress. Phases 20A and 20B are closed and locally verified. Phase 20C is implemented and awaiting local verification.

Before continuing, read:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`
5. `docs/backend/MANAGE_GUIDE.md`
6. `docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md`
7. `docs/backend/MILESTONE_18_USER_AVATAR.md`
8. `docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md`
9. `docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md`

Do not mark Phase 20C or Milestone 20 complete until local behavior is verified, Archive snapshot parity succeeds and `pnpm generate` succeeds.
