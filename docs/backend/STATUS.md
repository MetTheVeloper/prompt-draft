# Backend / Docker Status

Last updated: 2026-09-06

Branch: `feature/docker-local-api`
Final implementation checkpoint: `4c67b045abead7e2eb3d7cdc29865859a86ecf6b`

## Verification rule

A phase or milestone is marked `DONE` only after the user runs the relevant behavior locally and explicitly confirms it. `pnpm generate` remains a release invariant for frontend-affecting milestone work.

## Current checkpoint

```text
Milestones 1–16: COMPLETE / locally verified
Milestone 17 — Prompt Archive Platform: DONE / locally verified
Milestone 18 — User Avatar Foundation: DONE / locally verified
Milestone 19 — Public User Profiles + Cover Media: DONE / locally verified
Milestone 20 — Profile Showcase, Draft Media & Archive Promotion: DONE / locally verified
  Phase 20A — Profile UX polish + username profile alias: DONE / locally verified
  Phase 20B — Cloud Draft preview media + Draft workflow: DONE / locally verified
  Phase 20C — Moderation + Promote to Prompt Archive: DONE / locally verified
```

Milestone 20 closed on 2026-09-05 after local behavior verification, Archive snapshot parity and successful `pnpm generate`.

Primary Milestone 20 source:

```text
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
```

## Documentation closure audit — 2026-09-06

The canonical Docker/backend docs were re-read against the final branch state.

Result:

```text
No unfinished in-scope milestone remains.
No pending Phase 17/18/19/20 work remains.
Milestones 1–20 are the final verified Docker-branch implementation baseline.
```

Two canonical guides had stale historical wording even though implementation was complete, and were corrected during this audit:

```text
docs/backend/IMPLEMENTATION.md
  -> Milestones 1–20 complete (not 1–19)
  -> SQL history corrected through 019
  -> Draft media / soft-delete / promotion baseline recorded
  -> Archive deep-link identity corrected to publicId
  -> obsolete "Milestone 20 not selected" handoff removed

docs/backend/MANAGE_GUIDE.md
  -> /manage/archive added to the verified Manage baseline
  -> archive.view / archive.manage / drafts.delete_any integration recorded
  -> stable Archive publicId and promotion/moderation patterns recorded
  -> old Dashboard+Users-only closure wording replaced
```

`README.md`, `STATUS.md`, `API_GUIDE.md` and the Milestone 17–20 source documents were otherwise consistent with the completed branch. Historical milestone documents can still contain intentionally scoped "future/out-of-scope" notes; those are not unfinished work unless the relevant milestone status says otherwise.

The Docker branch is therefore documentation-closed as well as implementation-closed.

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

The established platform includes Docker/PostgreSQL backend foundation, Wizard run persistence + History, optional Auth + Cloud Draft sync, translation, roles/permissions, Manage shell + Users + Dashboard, progressive profile completion, XP/event ledger, referrals and product access gates.

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

Archive media contract:

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

`el-avatar` remains reusable; same-size FAB/avatar height remains the default invariant. Milestone 20 adds only opt-in Profile Menu visual adjustments.

## Milestone 19 — DONE: Public User Profiles + Cover Media

Public profile entry:

```text
/user?id=<USER_UUID>
/user?un=<username>
```

Privacy boundary:

```text
owner   -> active own public + private Cloud Draft summaries
visitor -> active public Draft summaries only
```

Cloud Draft default visibility remains `private`. Public profile responses do not expose email/private account data.

## Milestone 20 — DONE

### Phase 20A — verified

```text
centered/overlapping Profile Menu avatar
nested Global Menu support
surface50 + blur avatar fallback
compact XP/member-age presentation
compact Manage/View profile/Sign out row
shared portal-based tooltip fix
/user?un=<username> alias resolver
Draft-card normal15 -> normal50 border behavior
```

### Phase 20B — verified

Schema:

```text
017_cloud_draft_preview_media.sql
018_soft_delete_prompt_drafts.sql
```

Verified behavior:

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
```

### Phase 20C — verified

Schema:

```text
019_archive_user_draft_promotion.sql
```

Verified behavior:

```text
archive.manage promotion workflow
drafts.delete_any moderation workflow
stable public_id Archive routing
optional Telegram linkage
source_user_id + source_draft_id provenance
duplicate source promotion protection
Archive-owned copied media
promoted item starts as Archive draft
published promoted item appears in /prompts
source Draft moderation uses deleted_at tombstone
promotion + moderation audit events
promoted Archive item survives source moderation
```

Final local proof included:

```text
Archive user_draft item published successfully
source Draft soft-deleted and removed from normal profile reads
Archive image keys stored under archive/... independent namespace
admin_audit_log contains archive.promote_user_draft + draft.moderation_delete
pnpm archive:snapshot -> PARITY_OK
publishedItemCount = 102
snapshotItemCount = 102
mismatchCount = 0
schemaVersion = 3
pnpm generate -> success
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

Do not rewrite applied migration history. The next schema change must use `020_*.sql`.

## Known non-blocking build warnings

Accepted warnings remain:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

## Current next step

`feature/docker-local-api` is closed. No Milestone 21 is selected by this branch and no in-scope implementation task remains. Child branches may build on this checkpoint without reopening the completed Docker milestone program.

## New-chat handoff

Before new backend work, read:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`
5. `docs/backend/MANAGE_GUIDE.md`
6. `docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md`
7. relevant earlier milestone source documents when needed

Release invariant remains `pnpm generate`.
