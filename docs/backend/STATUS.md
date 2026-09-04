# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Current checkpoint

```text
Milestones 1–12: COMPLETE
Manage track: CLOSED FOR NOW
final Manage localization: COMPLETE
final pnpm generate: VERIFIED
```

The branch is ready for the user to choose and continue a different backend/product feature in a new chat.

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

Current registry rule:

```text
app/config/manage.ts
  -> key / icon / route / requiredPermission only

i18n/locales/manage.en.ts
  -> English Manage copy

i18n/locales/manage.fa.ts
  -> Persian Manage copy
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

Mutation API:

```text
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
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

Current time semantics:

```text
Today = 00:00 UTC -> generatedAt
```

Dashboard uses only trustworthy persisted data. Site visits, page views, behavioral DAU, and translation request counts remain deferred until event tracking exists.

Detailed milestone:

```text
docs/backend/MILESTONE_12_MANAGE_DASHBOARD_SUMMARY.md
```

## Final Manage localization — COMPLETE

The user explicitly confirmed the final Manage localization pass works correctly.

All current Manage UI copy was moved to:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

Covered surfaces include:

```text
Manage shell
Dashboard cards/status/loading/error fallbacks
Users search/filter/table states
roles/statuses
context menu
Information modal
Role Change modal
mutation confirmations
success/error copy
self-management safety explanation
Profile Menu Manage entry
Manage entry guard copy
```

A final source scan found no remaining hardcoded Manage user-facing English copy in the migrated Manage surfaces. Technical literals such as routes, icon names, permission ids, colors, and raw API enum values remain intentionally untranslated.

## Final static-generation verification — COMPLETE

User command:

```text
pnpm generate
```

Result on 2026-09-04:

```text
SUCCESS
16 initial routes prerendered
/manage present
/manage/dashboard present
/manage/users present
.output/public generated
offline manifest generated
225 files / 62.8 MB
```

Known non-blocking warnings remain:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

These warnings did not block generation and are not part of the closed Manage scope.

## Manage track closure

The current Manage foundation is considered complete and closed for now:

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

Future Manage features such as `/manage/system`, `/manage/content`, audit-log UI, or analytics should extend this architecture rather than refactor the verified baseline without a concrete need.

## Deferred work

Examples currently deferred:

```text
account deletion / full destructive account lifecycle
admin audit-log UI
/manage/system
/manage/content
analytics/event tracking
site visits/page views/behavioral DAU
translation request/success/failure metrics
convert Wizard-run /history to Draft History
move relevant History access into the Drafts menu
stronger Cloud Draft conflict handling
production auth/translation rate limiting
email verification/password recovery/OAuth
production migration framework
production deployment/secrets/domain/HTTPS
Redis
```

The temporary `persistence_probe` table remains non-product learning data and can be removed during a later cleanup step.

## Next action

No Manage action is pending.

The next product/backend feature should be selected by the user in a new chat. Do not automatically reopen Manage or start a deferred item.

## New-chat handoff

Always read first:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`

If the next feature touches Manage/admin work, also read:

5. `docs/backend/MANAGE_GUIDE.md`
6. the relevant `MILESTONE_9` through `MILESTONE_12` document

Current verified branch checkpoint before the documentation-closing commits was based on the completed Manage implementation at `feature/docker-local-api`; fetch the latest branch head before making any new change.
