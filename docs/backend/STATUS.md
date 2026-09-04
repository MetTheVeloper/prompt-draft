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
  -> central Manage section registry

app/middleware/manage-entry.ts
  -> auth + first-permitted-section resolution

app/pages/manage.vue
  -> shared Manage shell
  -> permission-filtered tab navigation
  -> nested child rendering

Profile Menu
  -> one Manage entry when any section is available
```

Permission-first rule remains mandatory:

```text
Manage visibility/routing -> auth.can(requiredPermission)
never role-name checks
backend authorization remains authoritative
```

Locally verified by the user on 2026-09-04:

```text
super_admin sees Manage
/manage resolves to /manage/dashboard
Dashboard tab/shell render correctly
backend authorization remains Verified
legacy /dashboard redirects correctly
normal user does not see Manage
normal user cannot access /manage
normal user cannot access /manage/dashboard
normal user cannot bypass through /dashboard
```

Final static release verification:

```text
pnpm generate succeeds
15 initial routes prerender successfully
/manage present
/manage/dashboard present
/dashboard compatibility route present
.output/public generated successfully
offline manifest generated successfully
```

Known duplicated-import, sourcemap, and large-chunk warnings remain non-blocking existing build warnings.

### Milestone 9 phases — ALL DONE

```text
Phase 0 — contract/documentation: DONE
Phase 1 — central Manage section config + parent shell: DONE
Phase 2 — Dashboard migration + Profile Menu entry: DONE
Phase 3 — privileged/normal-user authorization regression: DONE
Phase 4 — pnpm generate + static route verification: DONE
```

## Recommended next product direction

Prefer `/manage/users` before real Dashboard analytics.

Reason:

```text
users + roles + sessions + Cloud Draft ownership already exist
/manage shell already exists
users.view and users.manage permissions already exist
```

A user-management vertical slice can therefore become immediately useful without inventing new telemetry.

By contrast, several desired Dashboard metrics do not yet have a trustworthy data source:

```text
total users          -> available now
Cloud Draft totals   -> available now
new drafts today     -> available now
active users         -> needs activity definition/tracking
translations count   -> not currently persisted
site visits          -> not currently tracked
```

Recommended sequence:

```text
Milestone 10 — /manage/users read/list foundation
  -> paginated/searchable user list
  -> role/status/account metadata
  -> static-safe detail selection

then admin mutation foundation
  -> audit logging first
  -> role changes
  -> suspend/ban + session invalidation
  -> reset/delete data only with explicit destructive contracts

then analytics/event tracking
  -> visits
  -> user activity
  -> translation usage

then real /manage/dashboard summary
  -> metrics backed by trustworthy stored data
```

## Deferred work

- real Dashboard metrics;
- `/manage/users` mutation features;
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

Wait for the user's choice of the next vertical slice. Recommended: start `/manage/users` with read-only list/search/pagination before adding destructive admin actions.

## New-chat handoff

Read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
5. `docs/backend/MILESTONE_9_MANAGE_SHELL.md`
