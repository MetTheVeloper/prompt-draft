# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestones 1–5 — COMPLETE

The Docker/PostgreSQL backend foundation and Wizard-run reference implementation are complete and locally verified.

Verified platform path:

```text
static Nuxt frontend
  -> direct browser CORS
  -> Docker Node API :4000
  -> PostgreSQL
  -> named-volume durability
```

Milestone 5 History / Read API + UX remains available as the completed reference implementation.

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

## Milestone 9 — IN PROGRESS: Manage Shell / Admin Workspace Foundation

Source-of-truth contract:

```text
docs/backend/MILESTONE_9_MANAGE_SHELL.md
```

Selected route family:

```text
/manage
/manage/dashboard
/manage/users       # future feature
/manage/system      # future feature
/manage/content     # future feature
```

Current implementation now includes:

```text
app/config/manage.ts
  -> one central permission-aware Manage section registry

app/middleware/manage-entry.ts
  -> exact /manage resolves first permitted section
  -> anonymous -> /login?next=/manage
  -> authenticated with no Manage section -> 403

app/pages/manage.vue
  -> shared Manage parent shell
  -> permission-filtered tab navigation
  -> nested child rendering

app/pages/manage/dashboard.vue
  -> canonical Dashboard proof route
  -> requires dashboard.view

/dashboard
  -> protected compatibility redirect to /manage/dashboard

Profile Menu
  -> Dashboard action replaced by Manage
  -> visible only when any configured Manage section is permitted

static prerender config
  -> /manage
  -> /manage/dashboard
  -> /dashboard compatibility path
```

Permission-first rule remains mandatory:

```text
Manage visibility/routing -> auth.can(requiredPermission)
never role-name checks
backend authorization remains authoritative
```

### Milestone 9 phases

```text
Phase 0 — contract/documentation: READY
Phase 1 — central Manage section config + parent shell: AWAITING USER VERIFICATION
Phase 2 — Dashboard migration + Profile Menu entry: AWAITING USER VERIFICATION
Phase 3 — privileged/normal-user authorization regression: NOT STARTED
Phase 4 — pnpm generate + static route verification: NOT STARTED
```

### Phase 1–2 verification target

Super admin:

```text
Profile Menu shows Manage, not Dashboard
Manage entry lands on /manage/dashboard
Manage shell/tab is visible
Dashboard backend proof remains Verified
legacy /dashboard redirects to /manage/dashboard
```

Normal user:

```text
Profile Menu does not show Manage
/manage -> 403
/manage/dashboard -> 403
/dashboard remains blocked
```

No Phase 1/2 status becomes `DONE` before explicit user confirmation.

## Deferred work

- real Dashboard metrics;
- `/manage/users` user-management implementation;
- ban/suspend/role mutation/reset/delete flows;
- analytics/page-view tracking;
- Admin audit log;
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

User locally verifies Milestone 9 Phases 1–2. If confirmed, mark them `DONE` and proceed to authorization regression/static release checks.

## New-chat handoff

Read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
5. `docs/backend/MILESTONE_9_MANAGE_SHELL.md`
