# Prompt Draft — Manage Development Guide

This document is the reusable source of truth for extending the Prompt Draft management workspace after Milestones 9–12.

The goal is simple: future Manage work should build on the verified architecture instead of rediscovering shell, permission, API, UI, localization, and static-generation decisions.

## Verified baseline

Current canonical routes:

```text
/manage
/manage/dashboard
/manage/users
```

Current section registry:

```text
app/config/manage.ts
```

Current sections:

```text
dashboard -> /manage/dashboard -> dashboard.view
users     -> /manage/users     -> users.view
```

The current role policy is backend-owned:

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

`users.manage` is therefore currently available through the super-admin wildcard only.

## Core architecture

Manage is one permission-aware workspace, not a collection of unrelated admin pages.

```text
Profile Menu
  -> canAccessManage(auth.can)
  -> /manage
  -> manage-entry middleware
  -> first permitted MANAGE_SECTIONS entry
  -> app/pages/manage.vue shell
  -> permission-filtered section navigation
  -> nested child page
  -> typed frontend API boundary
  -> independently protected backend API
```

Security is always enforced at three layers:

```text
1. UI visibility
2. frontend route guard
3. backend permission guard (authoritative)
```

Never treat a hidden button, hidden tab, or disabled action as security.

## Manage section registry rule

`app/config/manage.ts` stores only structural identity:

```text
key
icon
route
requiredPermission
```

It must not store user-facing `label` or `description` copy.

Section copy is localized through:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

The shell resolves:

```text
manage.sections.<key>.label
manage.sections.<key>.description
```

This avoids duplicating copy in configuration and keeps runtime language switching correct.

When adding a new section, extend the typed section key union deliberately rather than weakening the registry to an arbitrary string.

## `/manage` entry behavior

`app/middleware/manage-entry.ts` handles only the exact `/manage` route.

Expected behavior:

```text
anonymous
  -> /login?next=/manage

authenticated + at least one permitted section
  -> first permitted section from MANAGE_SECTIONS

authenticated + no permitted section
  -> 403
```

Do not hardcode Dashboard as the fallback destination. The first permitted configured section is the contract.

## Child-page route contract

Every privileged child page should declare its own permission:

```ts
definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.SOME_PERMISSION,
});
```

The shared `authorization` middleware initializes auth, redirects anonymous users to login, and blocks authenticated users without the required permission.

The matching backend resource must still independently require the corresponding permission.

## How to add a new Manage section

Use this sequence.

### 1. Define permission semantics first

Before UI work, decide:

```text
what capability is being granted?
read or mutation?
which backend endpoint owns the authority?
which roles currently receive the permission?
```

Add the backend permission identifier and role mapping first, then expose the shared frontend permission constant.

Avoid direct `role === "admin"` UI rules. Pages and actions should ask for permissions.

### 2. Add one registry entry

Add the section to `MANAGE_SECTIONS`:

```text
key
icon
route
requiredPermission
```

That one entry should drive shell visibility, `/manage` resolution, and Profile Menu Manage availability.

Do not duplicate section visibility logic in Header/Profile Menu/page code.

### 3. Add English and Persian section copy

Add matching keys to both:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

At minimum:

```text
manage.sections.<key>.label
manage.sections.<key>.description
```

Do not add English UI labels directly to `app/config/manage.ts`.

### 4. Create the child page with the EL system

Prefer the existing EL component system:

```text
el-flex
el-grid
el-text
el-button
el-text-field
el-dropdown
el-divider
```

Avoid one-off native controls and page-specific CSS when the shared system already expresses the layout.

The shared `app/pages/manage.vue` owns:

```text
Manage title/context
section tabs
active section title
active section description
NuxtPage child rendering
```

Child pages should not repeat the same section heading block.

### 5. Build the backend as a separate protected resource

Follow `docs/backend/API_GUIDE.md` for storage/API implementation.

For admin resources:

```text
authenticate first
check backend permission
validate route/query/body input
use parameterized database functions
return only fields needed by the admin read model
never expose credential/session secrets
```

### 6. Keep a typed frontend boundary

Add dedicated response/request types under `app/types` and expose calls through `usePromptDraftApi()`.

Pages should not hand-build backend URL/query/body contracts repeatedly.

### 7. Add static route coverage

Prompt Draft uses `ssr: false` with static generation.

Canonical Manage routes must be present in the Nuxt prerender list when crawler discovery is not sufficient:

```text
/manage
/manage/dashboard
/manage/users
...new static Manage route
```

Avoid arbitrary dynamic admin detail routes such as `/manage/users/:id` unless the deployment contract changes.

Prefer a static parent route plus modal/query/state-driven detail when appropriate.

## Users page patterns that worked well

The verified `/manage/users` implementation established reusable patterns for data-heavy Manage pages.

### Server-side list behavior

```text
server-side username/email search
350ms debounce
role filter
20-row initial page
cursor/keyset pagination
manual Refresh
```

Do not load an unbounded collection and filter it only in the browser.

### Read models instead of raw tables

The user list/detail APIs expose an admin read model:

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

Derived counts are computed server-side. Secret auth fields never enter the response.

### Row actions use the Global Menu

The trailing action button and right-click context menu both open the shared Global Menu.

This produced a consistent interaction model without inventing another menu system.

Current action vocabulary:

```text
Change role
Suspend / Unsuspend
Revoke sessions
Reset Cloud data
Information
```

View-only callers see only read actions. Mutation actions are included only when `users.manage` is available.

### Detail uses the central modal

User Information fetches the detail API and renders in the central Global Modal.

This replaced the earlier inline/query detail panel and kept the list page focused.

For future admin detail surfaces, prefer the central modal when the information is contextual and does not require its own static route.

## Mutation pattern that worked well

Administrative mutations use explicit action endpoints rather than one ambiguous generic patch contract:

```text
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

Each mutation follows the same UX flow:

```text
row/context action
  -> Global Modal confirmation
  -> backend mutation
  -> close confirmation
  -> refresh list
  -> success message
```

Errors use one shared extraction path plus localized frontend fallbacks.

### Safety rules belong on the backend

Current verified backend safety rules include:

```text
self-mutation blocked
non-super-admin cannot manage a super-admin
non-super-admin cannot promote to super_admin
last active super_admin cannot be downgraded
last active super_admin cannot be suspended
```

The UI can disable obviously invalid actions for clarity, but backend enforcement is mandatory.

### Audit successful mutations

Successful privileged mutations write to `admin_audit_log` with actor, target, action, metadata, and timestamp.

If a future Manage feature changes privileged server state, decide its audit event contract as part of the feature design rather than after the UI is finished.

## Dashboard patterns that worked well

The verified Dashboard intentionally reports only trustworthy values already persisted by the product.

Current API:

```text
GET /api/admin/dashboard/summary
requires system.metrics.view
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

The important design rule is: do not invent analytics from data that is not actually persisted.

For example, site visits, page views, behavioral DAU, and translation request counts remain unavailable until real event tracking exists.

The API returns explicit time semantics:

```text
Today = 00:00 UTC -> generatedAt
```

The UI shows a generated-at value and a manual Refresh action.

`ManageMetricCard.vue` is the reusable visual unit for current metric cards.

## Localization contract

All Manage user-facing copy belongs under the `manage.*` namespace.

Files:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

This includes more than visible table headings:

```text
workspace title/subtitle
section names/descriptions
button labels
placeholders
table headers
loading/empty/error fallbacks
role labels
status labels
context-menu items
modal titles/descriptions/actions
success messages
safety explanations
Manage entry guard copy
```

Do not render raw API role values with transformations such as `replaceAll("_", " ")`.

Translate semantic values explicitly:

```text
user
admin
super_admin

active
suspended
```

Technical literals are not translation copy:

```text
route names
permission ids
icon names
color tokens
raw API enum values used for logic
```

When adding Manage UI, first add English keys, migrate the UI completely, scan for remaining hardcoded user-facing English, then add matching Persian keys and verify EN/FA parity.

## Verification checklist for every future Manage feature

A feature is not complete from code creation alone.

Verify locally:

```text
authorized account sees the section/action
view-only account sees only allowed read behavior
normal user does not see privileged navigation
anonymous user is redirected to login
protected frontend route cannot be bypassed
protected backend API cannot be bypassed
self/super-admin safety rules behave correctly where relevant
loading/error/empty states render correctly
English UI contains no hardcoded Manage copy
Persian UI resolves the same key set
RTL/LTR layouts remain usable
Refresh/search/filter/pagination behavior remains stable
pnpm generate succeeds
new static route is present in prerender output
```

Known duplicated-import, sourcemap, and large-chunk warnings are existing non-blocking build warnings unless their behavior changes.

## Current verified closure — 2026-09-04

The user locally verified the complete current Manage surface and then ran a successful final static generation.

Verified current routes:

```text
/manage
/manage/dashboard
/manage/users
```

The final `pnpm generate` prerendered 16 initial routes, including all three Manage routes, produced `.output/public`, and generated the offline manifest successfully.

The current Manage implementation is therefore considered closed for now. New Manage work should start from this guide plus the relevant milestone document instead of reopening the original shell/users/dashboard learning process.

## Related source-of-truth documents

```text
docs/backend/API_GUIDE.md
docs/backend/MILESTONE_9_MANAGE_SHELL.md
docs/backend/MILESTONE_10_MANAGE_USERS.md
docs/backend/MILESTONE_11_USER_ADMIN_ACTIONS.md
docs/backend/MILESTONE_12_MANAGE_DASHBOARD_SUMMARY.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/STATUS.md
```
