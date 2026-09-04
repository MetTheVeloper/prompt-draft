# Backend Implementation Plan

## Architecture baseline

Milestones 1 through 8 are complete and locally verified.

Current verified platform path:

```text
static Nuxt frontend :3030
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> validation / auth / authorization
  -> PostgreSQL and private backend services
  -> Docker named volumes
```

The backend remains independent from Nuxt server routes so static generation remains supported.

Reusable implementation conventions live in:

```text
docs/backend/API_GUIDE.md
```

## Schema workflow

The development schema runner discovers all files matching:

```text
backend/sql/NNN_*.sql
```

and applies them in lexical order.

Current schema files:

```text
001_create_wizard_runs.sql
002_create_prompt_drafts.sql
003_create_auth.sql
004_scope_prompt_drafts_to_users.sql
005_add_user_roles.sql
```

New development schema changes should use new numbered files rather than rewriting applied schema history. A production-grade migration framework remains deferred.

# Completed reference implementation — Wizard runs

The Wizard-run flow remains the first fully verified append-only backend example:

```text
real Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> cursor-paginated summary API
  -> full detail API
  -> typed frontend boundary
  -> /history + query-based detail
```

It proved Docker networking, CORS, validation, PostgreSQL persistence, named-volume durability, client/server contracts, static routing, and UI recovery behavior.

# Milestone 6 — COMPLETE: Auth Foundation + Account-aware Cloud Draft Sync

## Product contract

The `/create` page remains local-first. Authentication is optional and only enables account-bound Cloud behavior.

```text
anonymous user
  -> local draft system continues normally

logged-in user
  -> same local draft system
  -> optional/manual Cloud Save
  -> dirty-aware autosync
  -> account-owned Cloud collection
  -> recovery across browser/device contexts
```

## Authentication architecture

Auth uses persisted `users` and `auth_sessions` tables.

Security contract:

```text
password hashing     -> Node scrypt + random salt
raw password         -> never stored
session token        -> random 32-byte bearer token
browser token store  -> localStorage (current explicit product decision)
DB session storage   -> SHA-256 hash of bearer token only
session lifetime     -> 30 days
```

Auth API:

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

`useAuth()` is the shared frontend authentication boundary.

## Cloud Draft ownership and API

Cloud Drafts are account-scoped by authenticated `user_id`. The client never supplies trusted ownership.

```text
PUT /api/drafts/:id
GET /api/drafts/:id
GET /api/drafts
```

Repeated writes to one account + draft id update the same resource and increment `revision`.

The frontend keeps canonical draft JSON local-first and stores Cloud metadata separately under account-scoped localStorage state.

Multi-device recovery lifecycle:

```text
/create mount
  -> auth.initialize()
  -> GET /api/drafts
  -> merge Cloud collection with local collection by stable draft id
  -> newer updatedAt wins for matching ids
  -> preserve local-only drafts
  -> persist merged collection
  -> refresh editor/menu collection
```

Draft menu Cloud states:

```text
cloud_done / green
  -> local fingerprint matches Cloud

cloud_upload / orange
  -> Cloud exists but local content is dirty

cloud_off / normal
  -> local-only for current account or anonymous mode
```

The user locally verified registration/login/logout, ownership, revisions, bidirectional recovery across normal/Incognito contexts, local-only preservation, Cloud state UI, and static generation.

# Milestone 7 — COMPLETE: Server-side Translation

Translation is a backend capability and remains usable without authentication.

```text
static Nuxt TextField
  -> Prompt Draft API :4000
  -> Docker-private LibreTranslate :5000
  -> translation result
```

Compose contract:

```text
translator image       -> libretranslate/libretranslate:v1.9.6
loaded languages       -> en,fa
model volume           -> prompt_draft_translation_models
internal service URL   -> http://translator:5000
backend env            -> TRANSLATION_BASE_URL
```

Backend API:

```text
GET /api/translate/status
POST /api/translate
```

The backend owns validation, timeout/error handling, health, and stable `503` dependency failure semantics.

The frontend calls the backend through typed `usePromptDraftApi()` methods. The old Nuxt `/api/translate` proxy was removed.

`usePromptTranslation()` keeps variable-token protection/restoration and the existing alternatives modal. TextField Translate availability follows real translator health and recovers after translator restart without a page refresh.

The user locally verified Persian-to-English translation, alternatives, `{person}` preservation, Docker stop/start health behavior, anonymous availability, and static generation.

# Milestone 8 — COMPLETE: Authorization / Roles Foundation

## Goal

Add a reusable authorization layer on top of optional authentication so future product/admin capabilities can be granted by permission rather than scattered role checks.

```text
authenticated account
  -> persisted role
  -> backend-resolved permissions
  -> typed auth session response
  -> frontend can(...)
  -> permission-gated UI / routes
  -> permission-gated backend APIs
```

Authentication remains optional for the product. Authorization only applies where a capability explicitly requires it.

## Persisted roles

`005_add_user_roles.sql` adds `users.role` with the supported values:

```text
user
admin
super_admin
```

New accounts default to `user`.

The existing `grass` account is promoted once by migration to `super_admin`. Runtime code never checks usernames for privilege; all later access comes from persisted role state.

## Backend-authoritative permission mapping

Role-to-permission mapping lives in the backend authorization module.

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

Current semantics:

```text
user
  -> no privileged permissions

admin
  -> selected administrative permissions

super_admin
  -> wildcard *
```

The frontend receives the resolved permission set from auth responses; it does not duplicate the role-to-permission mapping.

## Auth response extension

Login/register/me user payloads now include persisted role and resolved permissions.

Conceptually:

```text
user
  id
  username/email
  createdAt
  role

permissions[]
```

Session refresh through `/api/auth/me` therefore refreshes authorization state too.

## Frontend authorization boundary

`useAuth()` now exposes:

```text
role
permissions
isAdmin
isSuperAdmin
can(permission)
canAny(...permissions)
canAll(...permissions)
```

Permission identifiers live in `app/config/authorization.ts` so callers use shared constants while authority remains backend-side.

## Three-layer enforcement model

Authorization is intentionally enforced at three independent layers:

```text
1. UI visibility
   -> useAuth().can(...)

2. route access
   -> app/middleware/authorization.ts

3. backend resource access
   -> authenticated backend permission guard
```

Hiding a button is never treated as security.

## Dashboard proof route

`/dashboard` is a deliberately minimal proof route requiring:

```text
dashboard.view
```

The Profile Menu shows Dashboard only when `can(dashboard.view)` is true.

Direct route access is guarded by the reusable authorization middleware.

The backend proof endpoint:

```text
GET /api/admin/access-check
```

also requires `dashboard.view` and independently returns `403 Forbidden` for an authenticated normal user.

No real analytics/admin product scope is implied by this proof page; future Dashboard and Admin Panel work can reuse this foundation.

## Local verification

The user verified the complete authorization path:

```text
super_admin account shows role in Profile Menu
super_admin sees Dashboard action
super_admin opens /dashboard successfully
/dashboard reports backend authorization Verified
normal user role remains user
normal user does not see Dashboard action
normal user direct /dashboard access returns 403
normal user direct /api/admin/access-check call returns 403
```

Final static release verification also passed:

```text
pnpm generate
13 routes prerendered
/dashboard included in prerender route set
.output/public generated successfully
```

Existing duplicated-import, sourcemap, and chunk-size warnings remain non-blocking known build warnings.

# Milestone 8 phases — ALL DONE

```text
Phase 1 — persisted roles + backend permission resolver: DONE
Phase 2 — typed frontend authorization helpers: DONE
Phase 3 — protected Dashboard proof route and conditional Profile UI: DONE
Phase 4 — normal-user denial + backend bypass test + static generation: DONE
```

# Deferred follow-up work

These are intentionally not required for completed Milestones 6–8:

```text
real Dashboard metrics
admin panel / user-management UI
analytics/page-view event tracking
convert current Wizard-run /history to Draft History
move the relevant History entry into the Drafts menu
server-side Cloud Draft delete semantics
advanced multi-device conflict UI/policy
optimistic revision rejection
production auth rate limiting / abuse controls
translation rate limiting / abuse controls
email verification
password reset/recovery
OAuth/social login
production migration framework
production deployment/secrets/domain/HTTPS
Redis
```

Do not start any deferred item automatically. The next product feature is chosen by the user.
