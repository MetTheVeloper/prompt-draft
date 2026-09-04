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

## Milestone 10 — IN PROGRESS: Manage Users Foundation

Source-of-truth contract:

```text
docs/backend/MILESTONE_10_MANAGE_USERS.md
```

Selected read-only product path:

```text
/manage/users
  -> users.view
  -> server-side search/filter
  -> cursor pagination
  -> static-safe query-based detail
```

Backend implementation:

```text
backend/sql/006_add_admin_user_indexes.sql
backend/src/adminUsers.mjs
listAdminUsers(...)
getAdminUserById(id)

GET /api/admin/users
GET /api/admin/users/:id
```

Collection contract:

```text
limit   default 20 / max 100
cursor  opaque keyset cursor
query   literal username/email substring
role    user | admin | super_admin
ordering: created_at DESC, id DESC
```

Admin user read model:

```text
id
username
email
role
createdAt
cloudDraftCount
activeSessionCount
```

Credential/session secrets are never returned.

Frontend implementation:

```text
app/types/adminUsersApi.ts
usePromptDraftApi().listAdminUsers(...)
usePromptDraftApi().getAdminUser(id)
app/config/manage.ts -> Users section
app/pages/manage/users.vue
nuxt prerender -> /manage/users
```

Functional behavior:

```text
350ms debounced search
role filter
20-row initial read
Load more cursor pagination
Refresh
query-based detail: /manage/users?user=<uuid>
```

The user locally confirmed the Manage Users functionality works without functional issues.

### EL design-system normalization

A follow-up UI baseline refactor replaced the page-specific native/CSS implementation in `app/pages/manage/users.vue` with the project's reusable component system:

```text
el-text-field
el-dropdown
el-grid
el-flex
el-button
el-text
el-divider
```

The Manage Users page now has no scoped CSS block for its layout/table/detail UI.

`app/pages/manage.vue` and `app/pages/manage/dashboard.vue` were reviewed and were already predominantly EL-system-based with no page-specific CSS needing replacement.

Final visual polish remains deferred; current goal is reusable layout behavior and zero/near-zero page-specific CSS.

### Milestone 10 phases

```text
Phase 0 — contract/documentation: DONE
Phase 1 — database read model + indexes: DONE
Phase 2 — GET collection + detail APIs: DONE
Phase 3 — typed frontend API boundary: DONE
Phase 4 — Manage Users list/search/filter/pagination UI: DONE
Phase 5 — query-based user detail: DONE
Phase 6 — authorization regression + static generation: AUTHORIZATION VERIFIED / STATIC CHECK PENDING
```

Milestone 10 remains open until `pnpm generate` passes after the EL design-system refactor and `/manage/users` is present in the generated route set.

## Deferred work

- Manage Users mutations: audit log, role changes, suspend/ban, revoke sessions, reset/delete data;
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

Run final static generation after the EL design-system refactor. If it passes and `/manage/users` is prerendered, mark Milestone 10 COMPLETE.

## New-chat handoff

Read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
5. `docs/backend/MILESTONE_9_MANAGE_SHELL.md`
6. `docs/backend/MILESTONE_10_MANAGE_USERS.md`
