# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestones 1–5 — COMPLETE

The Docker/PostgreSQL backend foundation and Wizard-run reference implementation are complete and locally verified.

## Reusable API playbook — COMPLETE

Reusable guidance lives in:

```text
docs/backend/API_GUIDE.md
```

It covers resource-first API design, numbered SQL, typed frontend boundaries, local-first failure semantics, static generation, and three-layer authorization.

## Milestone 6 — COMPLETE: Auth Foundation + Account-aware Cloud Draft Sync

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

## Milestone 8 — COMPLETE: Authorization / Roles Foundation

Current roles:

```text
user
admin
super_admin
```

Authorization is enforced at three layers:

```text
UI visibility
frontend route guard
backend permission guard (authoritative)
```

Verified:

```text
super_admin Dashboard access
normal user UI denial
normal user /dashboard 403
normal user /api/admin/access-check 403
pnpm generate
```

## Milestone 9 — COMPLETE: Manage Shell / Admin Workspace Foundation

Verified management workspace:

```text
/manage
/manage/dashboard
/dashboard compatibility redirect
permission-aware Manage section navigation
pnpm generate
```

Source-of-truth milestone record:

```text
docs/backend/MILESTONE_9_MANAGE_SHELL.md
```

## Milestone 10 — COMPLETE: Manage Users Foundation

Verified:

```text
/manage/users
users.view
server-side search/filter
cursor pagination
admin user detail API
read-model counts
EL design-system normalization
normal-user denial
pnpm generate
```

Source-of-truth milestone record:

```text
docs/backend/MILESTONE_10_MANAGE_USERS.md
```

## Milestone 11 — COMPLETE: User Administration Actions

Backend:

```text
users.status -> active | suspended
admin_audit_log

POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

Verified safety/runtime behavior:

```text
users.manage authorization
self mutation blocked
super-admin protections
Change role
Suspend / Unsuspend
suspended-account login denial
Revoke sessions
Reset Cloud data
Information central modal
admin audit rows
Profile Menu follow-up UI
pnpm generate
```

Source-of-truth milestone record:

```text
docs/backend/MILESTONE_11_USER_ADMIN_ACTIONS.md
```

## Milestone 12 — IN PROGRESS: Manage Dashboard Summary

Source-of-truth contract:

```text
docs/backend/MILESTONE_12_MANAGE_DASHBOARD_SUMMARY.md
```

Goal:

```text
replace the temporary authorization-proof Dashboard
with trustworthy live aggregate metrics from existing server data
```

Implemented endpoint:

```text
GET /api/admin/dashboard/summary
requires: system.metrics.view
```

Implemented metrics:

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

Metric boundaries:

```text
Today = 00:00 UTC -> generatedAt
active account = users.status = active
active session = unexpired session belonging to an active account
Drafts updated today = prompt_drafts.server_updated_at since 00:00 UTC
Admin actions today = admin_audit_log rows since 00:00 UTC
```

The Dashboard intentionally does not expose these yet because Prompt Draft does not currently persist the necessary events:

```text
site visits
page views
behavioral daily active users
translation request count
translation success/failure count
```

Implemented files:

```text
backend/src/adminDashboard.mjs
backend/src/auth.mjs
app/types/adminDashboardApi.ts
app/composables/usePromptDraftApi.ts
app/components/manage/ManageMetricCard.vue
app/pages/manage/dashboard.vue
app/config/manage.ts
```

Database migration:

```text
none required
```

Milestone 12 state:

```text
contract/documentation: IMPLEMENTED
backend summary API: IMPLEMENTED
typed frontend boundary: IMPLEMENTED
Dashboard live cards: IMPLEMENTED
local runtime verification: PENDING
normal-user API denial verification: PENDING
static generation: PENDING
```

No Milestone 12 phase is DONE until the user verifies the relevant behavior locally.

## Deferred work

- account deletion and destructive full-account lifecycle;
- admin audit-log UI;
- analytics/page-view/activity/translation usage tracking;
- `/manage/system` and `/manage/content`;
- convert Wizard-run `/history` to Draft History;
- move History into the Drafts menu;
- stronger Cloud Draft conflict handling;
- production auth/translation rate limiting;
- email verification/password recovery/OAuth;
- production migration framework;
- production deployment/secrets/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Rebuild the API and locally verify Milestone 12 summary values and Dashboard rendering.

After runtime verification, run the final static generation check and close Milestone 12.

## New-chat handoff

Read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
5. `docs/backend/MILESTONE_9_MANAGE_SHELL.md`
6. `docs/backend/MILESTONE_10_MANAGE_USERS.md`
7. `docs/backend/MILESTONE_11_USER_ADMIN_ACTIONS.md`
8. `docs/backend/MILESTONE_12_MANAGE_DASHBOARD_SUMMARY.md`
