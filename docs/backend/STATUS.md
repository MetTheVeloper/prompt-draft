# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Current checkpoint

```text
Milestones 1–13: COMPLETE / locally verified
Manage track: CLOSED FOR NOW
Milestone 14: Progressive User Profile Foundation
  -> IMPLEMENTED
  -> LOCAL VERIFICATION PENDING
```

The latest completed product change is the History workflow redesign/restore flow. The active work is now the progressive user-profile foundation.

## Reusable guides

General API/backend work:

```text
docs/backend/API_GUIDE.md
```

Manage/admin workspace work:

```text
docs/backend/MANAGE_GUIDE.md
```

Do not rediscover the Manage shell/users/dashboard architecture when adding future Manage sections. Start from `MANAGE_GUIDE.md`.

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

Current backend permission policy:

```text
user
  -> no privileged permissions

admin
  -> dashboard.view
  -> system.metrics.view
  -> users.view

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

The user locally verified the History redesign and then ran a successful `pnpm generate`.

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

Final static verification:

```text
pnpm generate SUCCESS
16 initial routes prerendered
/history present
.output/public generated
offline manifest generated: 225 files / 62.8 MB
```

Detailed milestone:

```text
docs/backend/MILESTONE_13_HISTORY_WORKFLOW.md
```

## Milestone 14 — IN PROGRESS: Progressive User Profile Foundation

Implementation is present; local verification is still required.

Current implementation:

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
Profile Menu "Complete profile" entry when fields are missing
EN/FA completion UI
```

Current supported progressive fields:

```text
username
email
```

Explicitly not yet part of Milestone 14:

```text
phone
verification
consents
XP / score
leaderboards
referrals
behavioral analytics/events
```

Detailed milestone:

```text
docs/backend/MILESTONE_14_PROGRESSIVE_USER_PROFILE.md
```

## Manage track closure

The current Manage foundation remains complete and closed for now:

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

Do not reopen Manage automatically for Milestone 14.

## Known non-blocking build warnings

Existing warnings remain accepted unless their behavior changes:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

## Deferred work

Examples currently deferred:

```text
phone/contact model + verification
email verification/password recovery/OAuth
user consent foundation (marketing / analytics / model training)
XP / score ledger and gamification
referral relationships and referral codes
analytics/event tracking
site visits/page views/behavioral DAU
translation request/success/failure metrics
account deletion / full destructive account lifecycle
admin audit-log UI
/manage/system
/manage/content
stronger Cloud Draft conflict handling
production auth/translation rate limiting
production migration framework
production deployment/secrets/domain/HTTPS
Redis
```

The temporary `persistence_probe` table remains non-product learning data and can be removed during a later cleanup step.

## Next action

Milestone 14 must be locally verified before it can be marked DONE.

Primary product acceptance path:

```text
Profile Menu -> Complete profile -> add missing email/username -> save
```

Then verify logout/login through both identities and run final `pnpm generate`.

## New-chat handoff

Always read first:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`

If future work touches Manage/admin workspace, also read:

5. `docs/backend/MANAGE_GUIDE.md`
6. the relevant `MILESTONE_9` through `MILESTONE_12` document
