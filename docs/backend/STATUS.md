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

Reusable API implementation guidance lives in:

```text
docs/backend/API_GUIDE.md
```

It captures resource-first API design, numbered SQL schema files, parameterized DB access, HTTP validation/CORS, typed frontend boundaries, local-first failure semantics, direct UI verification, static generation, and the current three-layer authorization model.

## Milestone 6 — COMPLETE: Auth Foundation + Account-aware Cloud Draft Sync

Verified product path:

```text
optional account
  -> local-first /create drafts
  -> manual Cloud Save + dirty-aware autosync
  -> account-owned prompt_drafts rows
  -> GET /api/drafts recovery
  -> same-account multi-device merge
  -> per-draft Cloud state UI
```

Locally verified by the user:

```text
registration
logout and existing-account login
header profile behavior
Cloud Save ownership and revision updates
normal/Incognito same-account recovery
preservation of local-only drafts
Drafts-menu synced/dirty/offline states
pnpm generate
```

## Milestone 7 — COMPLETE: Server-side Translation

Verified product path:

```text
static TextField action
  -> Prompt Draft API :4000
  -> Docker-private LibreTranslate :5000
  -> Persian/English translation
```

Locally verified by the user:

```text
translator image and health lifecycle
en/fa model availability
backend status + translation endpoints
stable 503 while translator unavailable
real TextField translation via backend :4000
translation alternatives
{person} token preservation
translator stop disables Translate
translator restart re-enables Translate without page refresh
anonymous translation remains available
pnpm generate
```

## Milestone 8 — COMPLETE: Authorization / Roles Foundation

Verified authorization path:

```text
authenticated account
  -> persisted role
  -> backend-authoritative permission resolution
  -> frontend authorization helpers
  -> permission-gated UI
  -> permission-gated routes
  -> permission-gated backend APIs
```

Current roles:

```text
user
admin
super_admin
```

Initial permission vocabulary:

```text
dashboard.view
system.metrics.view
users.view
users.manage
drafts.view_all
drafts.delete_any
system.settings.manage
```

`super_admin` receives wildcard `*`.

Local verification completed by the user:

```text
super_admin sees Dashboard and can open /dashboard
/dashboard backend authorization reports Verified
normal user does not see Dashboard
normal user direct /dashboard access returns 403
normal user direct GET /api/admin/access-check returns 403
pnpm generate succeeds
13 routes prerender successfully including /dashboard
```

Authorization remains three-layered:

```text
UI visibility
frontend route guard
backend permission guard (authoritative)
```

## Milestone 9 — IN PROGRESS: Manage Shell / Admin Workspace Foundation

Selected direction:

```text
/manage
  -> permission-aware management workspace
  -> first permitted management section

/manage/dashboard
  -> migrated Dashboard proof

/manage/users
  -> future user-management feature, not part of Milestone 9 implementation
```

Source-of-truth contract for this milestone:

```text
docs/backend/MILESTONE_9_MANAGE_SHELL.md
```

Core design decisions:

```text
one central Manage section configuration
section visibility based on permissions, never role-name checks
/manage resolves the first section the current account can access
Manage shell owns tab-based navigation
/manage/dashboard requires dashboard.view
Profile Menu exposes a single Manage entry when any Manage section is allowed
legacy /dashboard becomes a compatibility path to /manage/dashboard
backend permission checks remain authoritative
static generation must include /manage and /manage/dashboard
```

Future sections such as `/manage/users`, `/manage/system`, and `/manage/content` should plug into the same shell/configuration rather than creating independent admin navigation patterns.

### Milestone 9 scope boundary

Milestone 9 builds the workspace foundation only.

Explicitly deferred to later vertical slices:

```text
real /manage/users implementation
user list/search/pagination
ban/suspend user
change user role
reset/delete user data
real Dashboard metrics
analytics/page-view tracking
audit log
/manage/system
/manage/content
```

### Milestone 9 phases

```text
Phase 0 — contract/documentation: READY
Phase 1 — central Manage section config + parent shell: NOT STARTED
Phase 2 — Dashboard migration + Profile Menu entry: NOT STARTED
Phase 3 — privileged/normal-user authorization regression: NOT STARTED
Phase 4 — pnpm generate + static route verification: NOT STARTED
```

No implementation phase is `DONE` until locally verified by the user.

## Current intentional debt / deferred work

- real Dashboard metrics;
- `/manage/users` and future Admin Panel features;
- analytics/page-view event tracking for metrics such as visits and active users;
- convert `/history` from Wizard-run History to Draft History when selected;
- remove History from primary header navigation and add the relevant History entry to the Drafts menu as previously agreed;
- server-side Cloud Draft delete semantics;
- advanced multi-device conflict resolution beyond deterministic `updatedAt` merge;
- optimistic revision conflict enforcement;
- production auth rate limiting / abuse controls;
- translation rate limiting / abuse controls before public production exposure;
- email verification;
- password reset/recovery;
- OAuth/social login;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Start Milestone 9 Phase 1 only after the Manage-shell contract is accepted as the implementation direction.

## New-chat handoff

Before continuing backend/admin work in another chat, read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
5. `docs/backend/MILESTONE_9_MANAGE_SHELL.md`
