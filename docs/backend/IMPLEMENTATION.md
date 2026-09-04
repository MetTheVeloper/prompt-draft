# Backend Implementation Baseline

## Architecture baseline

Milestones 1 through 12 are complete and locally verified.

Current verified platform path:

```text
static Nuxt frontend
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> validation / auth / authorization
  -> PostgreSQL and private backend services
  -> Docker named volumes
```

The backend remains independent from Nuxt server routes so static generation remains supported.

Reusable conventions:

```text
docs/backend/API_GUIDE.md
  -> general API/backend vertical slices

docs/backend/MANAGE_GUIDE.md
  -> permission-aware Manage/admin features
```

## Schema workflow

The development schema runner discovers files matching:

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
006_add_admin_user_indexes.sql
007_add_user_status_and_admin_audit.sql
```

New development schema changes use new numbered files rather than rewriting applied history. A production migration framework remains deferred.

# Completed platform references

## Milestones 1–5 — Docker/PostgreSQL + Wizard runs

Verified reference path:

```text
real Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> cursor-paginated summary API
  -> full detail API
  -> typed frontend boundary
  -> /history + query-based detail
```

This established Docker networking, CORS, validation, named-volume persistence, typed API contracts, keyset pagination, static-safe routing, and recoverable failure behavior.

## Milestone 6 — Auth + account-owned Cloud Drafts

Authentication remains optional.

```text
anonymous
  -> local Draft workflow

logged in
  -> local Draft workflow
  -> account-owned Cloud Save
  -> dirty-aware autosync
  -> Cloud recovery/merge
```

Security baseline:

```text
password hashing     -> Node scrypt + random salt
raw password         -> never stored
session token        -> random bearer token
DB session storage   -> SHA-256 token hash only
session lifetime     -> 30 days
```

Cloud Drafts remain local-first and use stable client-owned draft IDs.

## Milestone 7 — Server-side Translation

```text
static Nuxt TextField
  -> Prompt Draft API :4000
  -> Docker-private LibreTranslate :5000
```

The backend owns validation, dependency health, timeout/error semantics, and translation status. Variable tokens are protected/restored around translation.

## Milestone 8 — Authorization / Roles

Persisted roles:

```text
user
admin
super_admin
```

Current backend mapping:

```text
user
  -> []

admin
  -> dashboard.view
  -> system.metrics.view
  -> users.view

super_admin
  -> *
```

Frontend permission helpers come from the server-resolved permission payload and shared constants.

Three-layer enforcement remains mandatory:

```text
1. conditional UI
2. frontend route authorization
3. backend permission guard
```

# Completed Manage implementation

## Milestone 9 — Manage Shell / Admin Workspace

Canonical routes:

```text
/manage
/manage/dashboard
/manage/users
```

Main files:

```text
app/config/manage.ts
app/middleware/manage-entry.ts
app/pages/manage.vue
app/components/auth/AuthProfileMenu.vue
```

Current registry shape:

```text
ManageSection
  key
  icon
  route
  requiredPermission
```

User-facing section copy does not live in the registry. The shell resolves:

```text
manage.sections.<key>.label
manage.sections.<key>.description
```

from the locale files.

Exact `/manage` behavior:

```text
anonymous
  -> login with next=/manage

authenticated + permitted section
  -> first permitted MANAGE_SECTIONS route

authenticated + no permitted section
  -> 403
```

The Profile Menu exposes one Manage action only when `canAccessManage(auth.can)` is true.

## Milestone 10 — Manage Users Read Foundation

Backend APIs:

```text
GET /api/admin/users
GET /api/admin/users/:id
requires users.view
```

Collection contract:

```text
limit   default 20 / min 1 / max 100
cursor  opaque keyset cursor
query   username/email substring
role    user | admin | super_admin
order   created_at DESC, id DESC
```

Read model:

```text
id
username
email
role
status
createdAt
cloudDraftCount
activeSessionCount
```

Secret credential/session data never enters the admin response.

UI pattern:

```text
server-side search with 350ms debounce
role filter
cursor Load more
manual Refresh
EL component system
```

The earlier inline/query detail presentation was later replaced by the central Information modal in Milestone 11.

## Milestone 11 — User Administration Actions

Mutation APIs:

```text
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
requires users.manage
```

Current product meaning:

```text
suspended account
  -> cannot sign in
  -> existing bearer sessions are rejected
  -> sessions are revoked when suspension occurs

reset-cloud-data
  -> deletes target account prompt_drafts only
  -> does not delete account/password/unrelated data
```

Authoritative backend safety:

```text
self mutation blocked
non-super-admin cannot manage a super-admin
non-super-admin cannot promote to super_admin
last active super_admin downgrade blocked
last active super_admin suspension blocked
```

Successful mutations write to:

```text
admin_audit_log
```

Current UI interaction pattern:

```text
row action / right-click
  -> Global Menu
  -> Global Modal confirmation
  -> mutation
  -> list refresh
  -> success/error message
```

Information uses the central modal and the detail read API.

## Milestone 12 — Manage Dashboard Summary

API:

```text
GET /api/admin/dashboard/summary
requires system.metrics.view
```

Current metrics:

```text
accounts.total
accounts.active
accounts.suspended
accounts.newToday
sessions.active
cloudDrafts.total
cloudDrafts.updatedToday
adminActions.today
```

Metric semantics:

```text
Today
  -> 00:00 UTC through generatedAt

active account
  -> users.status = active

active session
  -> unexpired auth_session for active account

Drafts updated today
  -> prompt_drafts.server_updated_at since 00:00 UTC

Admin actions today
  -> admin_audit_log rows since 00:00 UTC
```

The Dashboard does not expose fake/inferred analytics. Site visits, page views, behavioral DAU, and translation request metrics require future event persistence.

Frontend:

```text
app/types/adminDashboardApi.ts
app/composables/usePromptDraftApi.ts
app/components/manage/ManageMetricCard.vue
app/pages/manage/dashboard.vue
```

No migration was required for Milestone 12.

# Manage localization closure

Current Manage copy lives under one namespace:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

The i18n registry merges both fragments into their respective language trees.

Localized surfaces include:

```text
Manage shell
section tabs/headings/descriptions
Dashboard cards/status/loading/error fallback
Users search/filter/table/loading/empty states
role labels
status labels
context-menu actions
confirmation/success/error copy
Information modal
Role Change modal
self-management safety text
Manage entry guard copy
Profile Menu Manage label
```

Technical values remain technical:

```text
permission IDs
route strings
icon names
color tokens
API enums such as super_admin / suspended
```

Display code translates semantic enums explicitly instead of deriving English labels with string transformations.

# Static-generation contract

Nuxt remains:

```text
ssr: false
Nitro preset: static
```

Canonical explicit prerender routes include:

```text
/login
/manage
/manage/dashboard
/manage/users
/dashboard
public Wizard routes
```

Dynamic arbitrary admin-ID pages are avoided unless deployment/static-routing assumptions deliberately change.

# Final Manage verification — COMPLETE

The user locally verified the current shell, Users, Dashboard, actions/modals, and English/Persian Manage presentation.

Final release verification on 2026-09-04:

```text
pnpm generate
16 initial routes prerendered
/manage included
/manage/dashboard included
/manage/users included
.output/public generated
offline manifest generated: 225 files / 62.8 MB
```

Known existing build warnings remained non-blocking:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

Milestones 9–12 and the current Manage track are complete and closed for now.

# How to extend Manage next time

Do not rebuild the architecture.

Start from `docs/backend/MANAGE_GUIDE.md` and implement one vertical slice:

```text
permission semantics
  -> backend permission mapping
  -> frontend shared permission id
  -> MANAGE_SECTIONS registry entry
  -> EN/FA section copy
  -> guarded child page
  -> protected backend API
  -> typed usePromptDraftApi boundary
  -> EL UI
  -> Global Menu/Modal for contextual actions when useful
  -> audit contract for privileged mutations
  -> authorization regressions
  -> EN/FA hardcoded-copy scan
  -> pnpm generate
```

# Deferred follow-up work

Current examples:

```text
account deletion / destructive full-account lifecycle
admin audit-log UI
/manage/system
/manage/content
analytics/event tracking
page-view / visit / behavioral DAU metrics
translation usage metrics
convert Wizard-run /history to Draft History
move relevant History access into Drafts menu
stronger Cloud Draft conflict policy
production auth/translation rate limiting
email verification/password recovery/OAuth
production migration framework
production deployment/secrets/domain/HTTPS
Redis
```

Do not start deferred work automatically. The next feature is selected by the user.
