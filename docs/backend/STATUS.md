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
  -> permission-aware entry resolver
  -> first permitted configured section

/manage/dashboard
  -> canonical Dashboard proof
  -> dashboard.view

/dashboard
  -> protected compatibility redirect
```

Implemented reusable shell pieces:

```text
app/config/manage.ts
app/middleware/manage-entry.ts
app/pages/manage.vue
Profile Menu -> Manage
```

Locally verified by the user:

```text
super_admin sees Manage and reaches /manage/dashboard
Dashboard backend proof remains Verified
legacy /dashboard redirects correctly
normal user sees no Manage entry
normal user cannot access /manage, /manage/dashboard, or /dashboard
pnpm generate succeeds
15 initial routes include /manage and /manage/dashboard
```

Source-of-truth milestone record:

```text
docs/backend/MILESTONE_9_MANAGE_SHELL.md
```

## Milestone 10 — COMPLETE: Manage Users Foundation

Source-of-truth contract:

```text
docs/backend/MILESTONE_10_MANAGE_USERS.md
```

Verified read-only product path:

```text
/manage/users
  -> users.view
  -> server-side search/filter
  -> cursor pagination
  -> admin user detail API
```

Backend:

```text
backend/sql/006_add_admin_user_indexes.sql
backend/src/adminUsers.mjs
GET /api/admin/users
GET /api/admin/users/:id
```

Frontend:

```text
app/types/adminUsersApi.ts
usePromptDraftApi().listAdminUsers(...)
usePromptDraftApi().getAdminUser(id)
app/config/manage.ts -> Users section
app/pages/manage/users.vue
```

Locally verified:

```text
super_admin Users access
normal user denial
server-side search
role filter
read-model counts
user detail behavior
EL design-system normalization
no page-specific scoped CSS for Users layout/table/detail
pnpm generate succeeds
16 initial routes include /manage/users
```

Milestone 10 phases:

```text
Phase 0 — contract/documentation: DONE
Phase 1 — database read model + indexes: DONE
Phase 2 — GET collection + detail APIs: DONE
Phase 3 — typed frontend API boundary: DONE
Phase 4 — Manage Users list/search/filter/pagination UI: DONE
Phase 5 — user detail read flow: DONE
Phase 6 — authorization regression + static generation: DONE
```

## Milestone 11 — IN PROGRESS: User Administration Actions

Source-of-truth contract:

```text
docs/backend/MILESTONE_11_USER_ADMIN_ACTIONS.md
```

Implemented backend foundation:

```text
backend/sql/007_add_user_status_and_admin_audit.sql
users.status -> active | suspended
admin_audit_log

POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

Mutation authorization:

```text
users.manage required
backend guard authoritative
current admin role remains read-only
current super_admin wildcard grants management
```

Safety rules implemented:

```text
self mutation blocked
non-super-admin cannot manage super_admin
non-super-admin cannot promote to super_admin
last active super_admin cannot be downgraded
last active super_admin cannot be suspended
```

Suspension behavior implemented:

```text
suspend -> status suspended + revoke all sessions
suspended account -> existing bearer sessions rejected
suspended account -> new login rejected
unsuspend -> future login allowed, old sessions remain revoked
```

Successful mutations create audit records:

```text
user.role_changed
user.suspended
user.unsuspended
user.sessions_revoked
user.cloud_data_reset
```

Manage Users UI now includes:

```text
trailing three-dot Global Menu per row
Change role
Suspend / Unsuspend
Revoke sessions
Reset Cloud data
Information
central Global Modal confirmations
central Information modal
no detail box below the table
Status column
search input size 15
```

Manage section title/description metadata is centralized in `app/config/manage.ts` and rendered by the shared `/manage` shell. Dashboard and Users no longer duplicate child-page heading blocks.

Milestone 11 state:

```text
implementation: COMPLETE ENOUGH FOR LOCAL VERIFICATION
local verification: PENDING
static generation after this milestone: PENDING
```

No Milestone 11 phase is DONE until the user verifies the relevant action locally.

## Deferred work

- account deletion and destructive full-account lifecycle;
- admin audit-log UI;
- real Dashboard metrics;
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

Apply migration 007, rebuild the API, and locally verify Milestone 11 actions on a non-critical test account before running the final static generation check.

## New-chat handoff

Read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
5. `docs/backend/MILESTONE_9_MANAGE_SHELL.md`
6. `docs/backend/MILESTONE_10_MANAGE_USERS.md`
7. `docs/backend/MILESTONE_11_USER_ADMIN_ACTIONS.md`
