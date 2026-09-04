# Prompt Draft Backend

This directory is the source of truth for backend, Docker, authorization, Cloud, translation, and Manage integration work in Prompt Draft.

## Current branch

`feature/docker-local-api`

The backend remains intentionally independent from Nuxt server routes. Prompt Draft keeps its static-generation frontend workflow while the backend runs separately and can later deploy independently.

## Current verified architecture

```text
static Nuxt frontend
  -> direct browser HTTP
  -> Docker API :4000
  -> Node HTTP server
  -> validation / auth / authorization
  -> PostgreSQL
  -> optional private backend services
  -> Docker named volumes
```

Important invariants:

```text
pnpm generate must keep working
browser CORS is part of the API contract
backend authorization is authoritative
local product state must not be destroyed by backend failure
new schema changes use numbered SQL files
```

## Reusable development guides

General API work:

```text
docs/backend/API_GUIDE.md
```

Manage/admin workspace work:

```text
docs/backend/MANAGE_GUIDE.md
```

The Manage guide captures the verified shell, permission, route, API, EL UI, Global Menu/Modal, mutation safety, audit, localization, and static-generation patterns learned from Milestones 9–12.

## Milestones 1–5 — COMPLETE: Backend / Wizard-run reference path

The initial backend learning path established Docker networking, browser CORS, PostgreSQL persistence, named-volume durability, typed frontend contracts, Wizard-run persistence, cursor pagination, static-safe History UI, and recoverable failure semantics.

Reference flow:

```text
Portrait Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> paginated History API
  -> /history
  -> /history?run=<uuid>
```

## Milestone 6 — COMPLETE: Auth Foundation + Cloud Draft Sync

Optional authentication and account-owned Cloud Drafts are verified.

```text
anonymous
  -> local Draft workflow remains available

logged in
  -> local-first Draft workflow
  -> manual Cloud Save
  -> dirty-aware autosync
  -> account-owned Cloud collection
  -> same-account multi-device recovery
```

Auth API:

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

Cloud Draft API:

```text
PUT /api/drafts/:id
GET /api/drafts/:id
GET /api/drafts
```

Passwords use Node `scrypt` with a random salt. Raw passwords are never stored. Browser sessions use random bearer tokens and PostgreSQL stores only their SHA-256 hashes.

## Milestone 7 — COMPLETE: Server-side Translation

Translation is a backend capability:

```text
static Nuxt TextField
  -> Prompt Draft API :4000
  -> Docker-private LibreTranslate :5000
```

API:

```text
GET /api/translate/status
POST /api/translate
```

The backend owns validation, dependency health, timeout/error behavior, and stable failure semantics. Variable tokens such as `{person}` are protected across translation.

## Milestone 8 — COMPLETE: Authorization / Roles Foundation

Persisted roles:

```text
user
admin
super_admin
```

Current backend permission mapping:

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

Authorization is enforced at three layers:

```text
UI visibility
frontend route guard
backend permission guard (authoritative)
```

## Milestone 9 — COMPLETE: Manage Shell

Canonical management workspace:

```text
/manage
/manage/dashboard
/manage/users
```

The shared shell provides permission-filtered section navigation and nested child rendering.

`app/config/manage.ts` stores only structural section identity:

```text
key
icon
route
requiredPermission
```

User-facing section labels/descriptions are localized through `manage.*` i18n keys and are not stored in the config.

The Profile Menu exposes one permission-aware `Manage` entry that navigates to `/manage`, and `manage-entry` resolves the first permitted section.

## Milestone 10 — COMPLETE: Manage Users Read Foundation

Verified `/manage/users` behavior includes:

```text
users.view authorization
server-side username/email search
role filter
cursor pagination
admin user detail API
Cloud Draft count
active-session count
EL component-system UI
static generation
```

Backend collection/detail APIs expose only the admin read model and never expose password hashes, bearer tokens, token hashes, or session identifiers.

## Milestone 11 — COMPLETE: User Administration Actions

Current mutation endpoints:

```text
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

Current backend safety rules include self-mutation protection, super-admin protections, and last-active-super-admin safeguards.

Successful mutations are recorded in:

```text
admin_audit_log
```

The Manage Users UI uses the shared Global Menu and Global Modal systems for contextual actions, confirmation, and user information.

## Milestone 12 — COMPLETE: Manage Dashboard Summary

The temporary authorization-proof Dashboard has been replaced by real persisted-data metrics.

API:

```text
GET /api/admin/dashboard/summary
requires: system.metrics.view
```

Current metrics:

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

`Today` currently means:

```text
00:00 UTC -> generatedAt
```

The Dashboard intentionally does not invent analytics that Prompt Draft does not persist. Site visits, page views, behavioral DAU, and translation request counts remain deferred until a real event-tracking foundation exists.

## Manage localization closure — COMPLETE

All current Manage user-facing copy is centralized under:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

This includes shell copy, section labels/descriptions, Dashboard cards, Users fields, role/status labels, placeholders, menu actions, modal copy, safety explanations, and Manage entry-guard copy.

Raw API enum values such as `super_admin` and `suspended` remain technical values for logic; displayed labels are translated explicitly.

## Final verified static checkpoint — 2026-09-04

The user verified the current Manage behavior and then ran a successful final:

```text
pnpm generate
```

The build prerendered 16 initial routes, including:

```text
/manage
/manage/dashboard
/manage/users
```

It produced:

```text
.output/public
offline manifest: 225 files / 62.8 MB
```

Existing duplicated-import, sourcemap, unresolved Nitro cache-driver, and large-chunk warnings remain known non-blocking build warnings.

The current Manage track is closed for now.

## Current SQL history

Development schema files currently run in lexical order:

```text
001_create_wizard_runs.sql
002_create_prompt_drafts.sql
003_create_auth.sql
004_scope_prompt_drafts_to_users.sql
005_add_user_roles.sql
006_add_admin_user_indexes.sql
007_add_user_status_and_admin_audit.sql
```

New development schema changes should use a new numbered file rather than rewriting applied history. A production-grade migration framework remains deferred.

## Deferred platform/product work

Examples currently deferred:

```text
account deletion / full destructive account lifecycle
admin audit-log UI
/manage/system
/manage/content
analytics/event tracking
site/page-view/behavioral activity metrics
translation usage metrics
convert Wizard-run History to Draft History
move relevant History access into the Drafts menu
stronger Cloud Draft conflict handling
production auth/translation rate limiting
email verification/password recovery/OAuth
production migration framework
production deployment/secrets/domain/HTTPS
Redis
```

Do not start deferred work automatically. The user chooses the next feature.

## Documentation workflow

```text
README.md
  -> current architecture and milestone overview

IMPLEMENTATION.md
  -> concrete implementation baseline and extension rules

STATUS.md
  -> verified current state and next-chat handoff

API_GUIDE.md
  -> reusable backend/API vertical-slice playbook

MANAGE_GUIDE.md
  -> reusable Manage/admin workspace playbook

MILESTONE_*.md
  -> detailed source-of-truth record for each completed feature milestone
```

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms it. Code creation alone is not sufficient.

For a new chat, start with:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`
5. `docs/backend/MANAGE_GUIDE.md` only if the next feature touches Manage/admin work
