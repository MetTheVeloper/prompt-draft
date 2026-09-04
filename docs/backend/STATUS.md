# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Current checkpoint

```text
Milestones 1–16: COMPLETE / locally verified
Prompt/Collage access gates + 403/404 error surfaces: COMPLETE / locally verified
Milestone 17 — Prompt Archive Platform: PLANNED / NOT STARTED
```

The current verified frontend access baseline includes:

```text
/prompts Header entry remains visible to everyone
/prompts archive content requires logged-in account + email
missing access -> promptArchive Email Requirement modal + blocked state
Prompt Draft on Telegram action is available from blocked state
/collage is visible/accessible only with collage.view
403 and 404 render the dedicated EL-system error page
```

The user explicitly verified these behaviors and a successful `pnpm generate` on 2026-09-04.

Milestone 17 has now been explicitly selected by the user. It reopens Manage only for the new permission-aware `/manage/archive` section and moves Prompt Archive data toward PostgreSQL/API source of truth with local JSON/images retained as a fallback snapshot.

Detailed plan:

```text
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

## Reusable guides

General API/backend work:

```text
docs/backend/API_GUIDE.md
```

Manage/admin workspace work:

```text
docs/backend/MANAGE_GUIDE.md
```

Do not rediscover the Manage shell/users/dashboard architecture when adding `/manage/archive`. Start from `MANAGE_GUIDE.md`.

## Milestones 1–5 — COMPLETE

Verified Docker/PostgreSQL foundation and Wizard-run reference implementation:

```text
independent Docker API :4000
browser CORS
PostgreSQL + named-volume persistence
Wizard-run durable writes
cursor-paginated History reads
typed frontend API boundary
static-safe History UI
```

## Milestone 6 — COMPLETE: Auth + Cloud Draft Sync

Verified:

```text
optional auth
account-owned Cloud Drafts
dirty-aware autosync
GET /api/drafts recovery
same-account multi-device merge
Drafts-menu Cloud state UI
pnpm generate
```

## Milestone 7 — COMPLETE: Server-side Translation

Verified:

```text
Docker-private LibreTranslate
backend translation/status API
real TextField translation through :4000
{person} token preservation
translator stop/start health UX
anonymous availability
pnpm generate
```

## Milestone 8 — COMPLETE: Authorization / Roles

Roles:

```text
user
admin
super_admin
```

Current backend permission policy includes:

```text
user
  -> no privileged permissions

admin
  -> dashboard.view
  -> system.metrics.view
  -> users.view
  -> collage.view

super_admin
  -> *
```

Authorization remains enforced at:

```text
UI visibility
frontend route guard
backend permission guard (authoritative)
```

## Milestone 9 — COMPLETE: Manage Shell

Verified:

```text
/manage
/manage/dashboard
/dashboard compatibility redirect
permission-aware Manage section navigation
Profile Menu Manage entry
normal-user denial
pnpm generate
```

Detailed milestone:

```text
docs/backend/MILESTONE_9_MANAGE_SHELL.md
```

## Milestone 10 — COMPLETE: Manage Users Read Foundation

Verified:

```text
/manage/users
users.view
server-side search/filter
cursor pagination
admin user detail API
read-model counts
EL design-system UI
normal-user denial
static generation
```

Detailed milestone:

```text
docs/backend/MILESTONE_10_MANAGE_USERS.md
```

## Milestone 11 — COMPLETE: User Administration Actions

Verified:

```text
users.status -> active | suspended
admin_audit_log
Change role
Suspend / Unsuspend
suspended-account login denial
Revoke sessions
Reset Cloud data
Information central modal
self-management UI protection
backend self/super-admin safety rules
admin audit rows
Profile Menu follow-up UI
pnpm generate
```

Detailed milestone:

```text
docs/backend/MILESTONE_11_USER_ADMIN_ACTIONS.md
```

## Milestone 12 — COMPLETE: Manage Dashboard Summary

Verified Dashboard API:

```text
GET /api/admin/dashboard/summary
requires: system.metrics.view
```

Verified metric set:

```text
Total users
Active accounts
Suspended accounts
New users today
Active sessions
Cloud drafts
Drafts updated today
Admin actions today
```

Detailed milestone:

```text
docs/backend/MILESTONE_12_MANAGE_DASHBOARD_SUMMARY.md
```

## Milestone 13 — COMPLETE: History Workflow

Verified behavior:

```text
History removed from global Header navigation
History entry moved into Drafts menu
/history list rebuilt with EL component system
/history?run=<id> detail rebuilt with EL component system
light/dark compiled-prompt text fixed
Stored Snapshot removed from product UI
Edit in Create available from list and detail
Wizard run finalDraft restores as a new editable local Draft
historical Wizard run remains immutable
```

Detailed milestone:

```text
docs/backend/MILESTONE_13_HISTORY_WORKFLOW.md
```

## Milestone 14 — COMPLETE: Progressive User Profile Foundation

Verified foundation:

```text
008_progressive_user_profile.sql
users may hold username only / email only / both
at least one identity remains required
users.updated_at added
POST /api/auth/profile/complete
Auth responses expose profile supported/completed/missing fields
existing identity values are immutable through completion endpoint
case-insensitive uniqueness remains authoritative
reusable backend profile-requirement helpers
reusable frontend useProfileRequirements()
Global Modal progressive-completion form
Profile Menu Complete profile entry when fields are missing
EN/FA completion UI
```

Verified reusable email gate:

```text
useEmailRequirement()
EmailRequirementModal.vue
Global Output Copy requires email
missing email -> modal -> complete profile -> copy continuation
existing email -> direct copy
anonymous -> sign-in/account requirement UI
```

Detailed milestone:

```text
docs/backend/MILESTONE_14_PROGRESSIVE_USER_PROFILE.md
```

## Milestone 15 — COMPLETE: XP / Score Event Ledger Foundation

Verified implementation:

```text
009_user_score_events.sql
010_score_identity_triggers.sql
011_score_cloud_draft_creation.sql
append-only user_score_events ledger
per-user idempotency keys
existing-user XP backfill
existing-Cloud-Draft XP backfill
account created -> +1000 XP
email added -> +1000 XP
Cloud Draft created -> +50 XP exactly once per Draft
backend userScore.mjs reusable award/read service
Auth responses expose score.totalXp + score.eventCount
Cloud Draft save response can expose refreshed score
useAuth exposes score + totalXp + refresh/apply score helpers
Profile Menu refreshes authoritative Auth score when opened
unknown score state does not render a false zero
```

Current score semantics:

```text
username-only account -> 1000 XP
account with email -> 2000 XP
adding email later -> +1000 exactly once
first server save of each distinct Cloud Draft -> +50 exactly once
later saves/retries/autosaves of the same Draft -> no additional creation XP
```

Product decision:

```text
draft changed/saved +10 -> DROPPED
```

Routine Draft edits/autosaves will not award XP. Future rewards should be attached to more meaningful milestones with clear anti-farming/idempotency semantics.

Detailed milestone:

```text
docs/backend/MILESTONE_15_SCORE_LEDGER.md
```

## Milestone 16 — COMPLETE: Referral Foundation

Verified implementation:

```text
012_create_referrals.sql
referrals table with user-id relationships
username acts as the referral input/code
one referrer per referred account
DB-level no-self-referral constraint
active referrer required
POST /api/auth/register accepts optional referralUsername
invalid / missing / direct self referral aborts registration
referral-aware user + relation creation uses one PostgreSQL write statement
referral relation trigger awards XP through user_score_events
referred user -> +500 XP
referrer -> +1000 XP
registration UI adds optional referral field after Repeat Password
EN/FA referral registration copy and error handling
backend referrals read model exposes referrals.referredCount
Profile Menu shows localized Invited users count
Profile Menu refreshes the authoritative count through /api/auth/me
final pnpm generate succeeds
```

Current semantics:

```text
username-only signup + referral -> 1500 XP
email signup + referral         -> 2500 XP
accepted referral               -> referrer +1000 XP
```

The username entered during signup is retained as `referral_username_used`, but the authoritative referral relationship uses `referrer_user_id` and `referred_user_id` UUIDs.

Detailed milestone:

```text
docs/backend/MILESTONE_16_REFERRAL_FOUNDATION.md
```

## Milestone 17 — PLANNED: Prompt Archive Platform

Selected direction:

```text
PostgreSQL becomes the authoritative Prompt Archive data source
/prompts becomes server-first with local JSON/images fallback
list/detail API split + server-side search/filter/pagination
localized titles stored with Archive content, not runtime i18n keys
current JSON + EN/FA locale titles imported automatically
canonical tag catalog seeded from all current JSON tags
/manage/archive added through existing Manage architecture
archive.view / archive.manage permission model
admin audit for privileged Archive mutations
local Archive image preparation before cloud upload
jpg/jpeg/png/webp input only
file picker + multi-file drag/drop + clipboard paste
full WebP output with mandatory quality 0.6
thumbnail WebP generation
preview/remove/reorder
future ArvanCloud/Object Storage adapter with backend-only credentials
existing local JSON/images retained as deploy fallback snapshot
```

Implementation is phase-based. Start with data/import parity; do not jump directly to Object Storage.

Detailed source of truth:

```text
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
```

## Manage baseline and Milestone 17 reopening

The verified Manage foundation remains complete:

```text
shell
permission-aware sections
Users read model
Users administration actions
mutation safety
audit logging
Dashboard persisted-data metrics
EL component-system UI
Global Menu/Modal integration
English/Persian localization
static generation
```

Milestone 17 explicitly reopens Manage for `/manage/archive`. Future Archive Manage work must follow `MANAGE_GUIDE.md`; do not redesign the shell.

## Known non-blocking build warnings

Existing warnings remain accepted unless their behavior changes:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

## Deferred platform/product queue

Current deferred candidates include:

```text
referral links / invite-list UI / anti-abuse eligibility rules
user_events behavioral analytics foundation
site visits / page views / activity metrics
translation request/success/failure metrics
user consent foundation (marketing / analytics / model training)
phone/contact model + verification
email verification / password recovery / OAuth
leaderboards / levels / badges / streaks / additional meaningful XP events
score history / admin score adjustment tooling
account deletion / full destructive account lifecycle
admin audit-log UI
/manage/system
/manage/content beyond the selected Archive section
stronger Cloud Draft conflict handling
production auth/translation rate limiting
production migration framework
production deployment / secrets / domain / HTTPS
Redis
Email Requirement modal visual polish
```

The temporary `persistence_probe` table remains non-product learning data and can be removed during a later cleanup step.

## Next action

Start Milestone 17 in a new chat with **Phase 17A — Archive data foundation + import**.

Before changing code, read the six handoff documents below and inspect the current JSON/archive/converter/multi-select/Manage implementation. Confirm schema/import semantics before implementation.

Do not start cloud storage first.

## New-chat handoff

Always read first:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`
5. `docs/backend/MANAGE_GUIDE.md`
6. `docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md`

Then inspect at minimum:

```text
public/data/prompts.json
public/prompts/
app/types/promptArchive.ts
app/composables/usePromptArchive.ts
app/pages/prompts.vue
app/components/prompts/PromptItem.vue
app/components/prompts/PromptDetail.vue
app/components/tools/ImageBatchConverter.vue
app/components/el/multi-select.vue
app/config/manage.ts
backend authorization/admin patterns
```
