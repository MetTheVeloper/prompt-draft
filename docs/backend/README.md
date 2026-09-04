# Prompt Draft Backend

This directory is the source of truth for backend, Docker, authorization, Cloud, translation, History, progressive profile, and Manage integration work in Prompt Draft.

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

## Milestones 9–12 — COMPLETE: Manage Foundation

Canonical management workspace:

```text
/manage
/manage/dashboard
/manage/users
```

The verified Manage foundation includes:

```text
permission-aware shell and section registry
users.view read model
server-side user search/filter/cursor pagination
users.manage mutations
self/super-admin mutation safety
admin_audit_log
Dashboard persisted-data metrics
Global Menu + Global Modal patterns
EN/FA localization
static generation
```

Manage is **CLOSED FOR NOW**. Future Manage work starts from `docs/backend/MANAGE_GUIDE.md` and the relevant Milestone 9–12 document.

## Milestone 13 — COMPLETE: History Workflow

History access and presentation were reworked after the original Wizard-run persistence milestones.

Verified current behavior:

```text
History removed from global Header navigation
Drafts menu is the product entry to /history
History list/detail use the EL component system
History compiled prompt works in light/dark themes
Stored Snapshot remains persisted but is not exposed in the product UI
Edit in Create creates a new editable local Draft from snapshot.finalDraft
Wizard-run historical rows remain immutable
```

The user locally verified this behavior and ran a successful final `pnpm generate` with `/history` included in the 16 prerendered routes.

Detailed milestone:

```text
docs/backend/MILESTONE_13_HISTORY_WORKFLOW.md
```

## Milestone 14 — IN PROGRESS: Progressive User Profile Foundation

The active foundation allows a low-friction account to grow additional identity data later.

New schema migration:

```text
008_progressive_user_profile.sql
```

New account invariant:

```text
username only   -> valid
email only      -> valid
username+email  -> valid
neither         -> invalid
```

New API:

```text
POST /api/auth/profile/complete
```

This endpoint:

```text
requires authentication
fills only currently-missing username/email fields
never silently replaces an existing identity value
reuses the existing case-insensitive unique indexes
returns refreshed user + profile + permissions
```

Auth responses now expose a reusable profile-state contract:

```text
profile.supportedFields
profile.completedFields
profile.missingFields
```

Reusable requirement layers:

```text
backend/src/profileRequirements.mjs
app/composables/useProfileRequirements.ts
app/components/auth/ProfileRequirementModal.vue
```

The Profile Menu exposes `Complete profile` only while a currently-supported identity field is missing.

Milestone 14 is **not DONE** until the user locally verifies completion, login through both identities, error behavior, persistence, EN/FA UI, and a final `pnpm generate`.

Detailed milestone:

```text
docs/backend/MILESTONE_14_PROGRESSIVE_USER_PROFILE.md
```

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
008_progressive_user_profile.sql
```

New development schema changes should use a new numbered file rather than rewriting applied history. A production-grade migration framework remains deferred.

## Deferred platform/product work

Examples currently deferred:

```text
phone/contact model and verification
email verification/password recovery/OAuth
user consent foundation (marketing / analytics / model training)
XP / score ledger and gamification
leaderboards
referral relationships / referral codes
analytics/event tracking
site/page-view/behavioral activity metrics
translation usage metrics
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
  -> detailed source-of-truth record for each completed/in-progress feature milestone
```

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms it. Code creation alone is not sufficient.

For a new chat, start with:

1. `docs/backend/STATUS.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/API_GUIDE.md`
5. `docs/backend/MANAGE_GUIDE.md` only if the next feature touches Manage/admin work
