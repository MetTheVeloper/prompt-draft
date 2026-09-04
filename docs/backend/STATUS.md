# Backend / Docker Status

Last updated: 2026-09-05

Branch: `feature/docker-local-api`

## Verification rule

A phase or milestone is marked `DONE` only after the user runs the relevant behavior locally and explicitly confirms it. Code creation alone is never sufficient. `pnpm generate` remains a release invariant for frontend-affecting work.

## Current checkpoint

```text
Milestones 1–16: COMPLETE / locally verified
Milestone 17 — Prompt Archive Platform: DONE / locally verified
Milestone 18 — User Avatar Foundation: DONE / locally verified
Milestone 19 — Public User Profiles + Cover Media: DONE / locally verified
```

The user explicitly confirmed the final Milestone 19 UX/polish behavior and a successful `pnpm generate` on 2026-09-05.

No next milestone is selected yet. The next chat should start from the verified platform below and wait for the user's next product direction before changing code.

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

The established platform before Archive/profile-media work includes:

```text
Docker/PostgreSQL backend foundation
Wizard run persistence + History
optional Auth + Cloud Draft sync
server-side translation
roles/permissions
Manage shell + Users + Dashboard
progressive username/email profile completion
append-only XP/event ledger
referral foundation
Prompt/Collage access gates and dedicated 403/404 surfaces
```

Detailed milestone records remain in `docs/backend/MILESTONE_*.md`.

## Milestone 17 — DONE: Prompt Archive Platform

Prompt Archive is now a complete subsystem rather than a static JSON-only feature.

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

Verified Manage behavior includes:

```text
create/edit Drafts
explicit publish/archive state changes
EN/FA titles stored with dynamic content
canonical tags
browser image preparation
full + thumbnail WebP upload
reorder/delete persisted media
audit events
/manage/archive?edit=<telegram-id> deep links
Admin/Super Admin edit FAB on /prompts
server-side cursor pagination
```

Archive image preparation:

```text
input: jpg/jpeg/png/webp
full: max edge 2048, WebP quality 0.60, no upscale
thumbnail: max edge 640, WebP quality 0.72, no upscale
```

Storage capability was locally verified against the real Arvan bucket with:

```text
HeadBucket
PutObject
HeadObject
signed GetObject
anonymous PublicGet
DeleteObject
```

Snapshot closure:

```text
pnpm archive:snapshot
-> public/data/prompts.json schemaVersion 3
-> localized title.en/title.fa
-> published DB parity
-> managed media mirrored to public/prompts/_snapshot/...
-> legacy media retained under existing local paths
```

The user verified `PARITY_OK`, API-off fallback mode, local mirrored managed media, and final static generation.

Primary docs:

```text
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
docs/backend/MILESTONE_17_PHASE_17A.md
docs/backend/MILESTONE_17_PHASE_17B.md
docs/backend/MILESTONE_17_PHASE_17C.md
docs/backend/MILESTONE_17_PHASE_17D.md
docs/backend/MILESTONE_17_PHASE_17E.md
```

## Milestone 18 — DONE: User Avatar Foundation

Users now have an optional avatar. No stored default avatar is created.

Verified contract:

```text
JPEG/PNG/WebP input
center crop
exact 400x400 WebP
quality 0.60
backend validates WebP dimensions
Arvan storage under avatars/<user-uuid>/<immutable-uuid>.webp
replace/remove support
Header uses reusable el-avatar
Profile Menu uses reusable el-avatar
Manage user information can render the same component
initials -> person icon fallback when no image exists
```

API:

```text
GET    /api/profile/avatar
POST   /api/profile/avatar
DELETE /api/profile/avatar
```

Detailed source:

```text
docs/backend/MILESTONE_18_USER_AVATAR.md
```

## Milestone 19 — DONE: Public User Profiles + Cover Media

Public profile route:

```text
/user?id=<USER_UUID>
```

Public profile privacy boundary:

```text
owner   -> all own Cloud Draft summaries
visitor -> public Draft summaries only
```

Existing and newly-created Cloud Drafts default to:

```text
visibility = private
```

Draft publication is explicit through the owner-only visibility mutation. Visitor filtering is enforced in backend/PostgreSQL queries, not by frontend hiding.

Public profile responses do not expose account email. When a user has no username, public UI uses a generic localized fallback name instead of the email.

Cover contract:

```text
optional cover
full WebP: max edge 2048, quality 0.60, no upscale
thumbnail WebP: max edge 640, quality 0.72, no upscale
aspect ratio preserved
Arvan storage under covers/<user-uuid>/<immutable-cover-uuid>/...
```

Verified Profile Menu composition:

```text
cover thumbnail
avatar overlapping cover edge
independent avatar/cover choose/save/remove flows
compact size=12 Save buttons
FAB Cancel actions
View profile action
```

Verified `/user` presentation:

```text
Awwwards-like full-screen cover hero
large centered el-avatar focal point
centered identity hierarchy
creator/member-since metadata
XP/public/total Draft stats
Saved Draft cards
owner-only public/private controls
no Draft UUID exposed in card UI
```

The shared canvas slider now has intentional single-source behavior:

```text
pan start -> ease to end -> ease back to start -> repeat
```

Multi-source transition behavior remains unchanged.

No XP is awarded for public/private visibility toggles. A future Share Draft reward must use a separate idempotent event rather than a farmable toggle.

Detailed source:

```text
docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md
```

## Current SQL history

Development migrations run lexically:

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

## Reusable guides

General backend/API work:

```text
docs/backend/API_GUIDE.md
```

Manage/admin work:

```text
docs/backend/MANAGE_GUIDE.md
```

Current architecture/implementation references:

```text
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
```

## Known non-blocking build warnings

These existing warnings remain accepted unless their behavior changes:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

## Deferred product/platform queue

Examples still intentionally deferred unless the user selects them:

```text
referral links / richer invite UI / anti-abuse eligibility
user_events behavioral analytics
site visits / page views / activity metrics
translation metrics
consent foundation
phone/contact model + verification
email verification / password recovery / OAuth
leaderboards / levels / badges / streaks
additional meaningful XP events
score history / admin score adjustments
account deletion lifecycle
admin audit-log UI
/manage/system
stronger Cloud Draft conflict handling
production auth/translation rate limiting
production migration framework
production backend deployment / domain / HTTPS
Redis
```

## New-chat handoff

No next milestone is preselected.

Before changing code in the next chat, read:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`
5. `docs/backend/MANAGE_GUIDE.md`
6. `docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md`
7. `docs/backend/MILESTONE_18_USER_AVATAR.md`
8. `docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md`

Then inspect the current implementation relevant to the user's new request. Do not reopen completed milestones unless the new work intentionally extends them.
