# Prompt Draft — Manage Development Guide

Last updated: 2026-09-06
Branch baseline: `feature/docker-local-api`

This document is the reusable source of truth for extending the Prompt Draft management workspace after the verified Manage, Prompt Archive and Milestone 20 work.

Future Manage work must build on the existing shell, permission, API, Global Menu/Modal, localization and static-generation architecture rather than creating a second admin system.

## Verified baseline

Current canonical routes:

```text
/manage
/manage/dashboard
/manage/users
/manage/archive
```

Current section registry:

```text
app/config/manage.ts
```

Verified sections:

```text
dashboard -> /manage/dashboard -> dashboard.view
users     -> /manage/users     -> users.view
archive   -> /manage/archive   -> archive.view
```

Mutation permissions are separate from view permissions. Relevant privileged capabilities include:

```text
users.manage
archive.manage
drafts.delete_any
```

Backend authorization remains authoritative.

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

Never treat a hidden button, hidden tab or disabled action as security.

## Manage section registry rule

`app/config/manage.ts` stores structural identity:

```text
key
icon
route
requiredPermission
```

User-facing labels/descriptions belong under:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

The shell resolves:

```text
manage.sections.<key>.label
manage.sections.<key>.description
```

When adding a section, extend the typed section key union deliberately rather than weakening it to arbitrary strings.

## `/manage` entry behavior

`app/middleware/manage-entry.ts` handles the exact `/manage` route.

Expected behavior:

```text
anonymous
  -> /login?next=/manage

authenticated + at least one permitted section
  -> first permitted section from MANAGE_SECTIONS

authenticated + no permitted section
  -> 403
```

Do not hardcode Dashboard as the fallback destination.

## Child-page route contract

Every privileged child page declares its own permission:

```ts
definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.SOME_PERMISSION,
});
```

The matching backend resource must independently enforce the corresponding permission.

## How to add a new Manage section

Use this sequence:

```text
1. define read/mutation permission semantics
2. add backend permission and role mapping
3. add one MANAGE_SECTIONS registry entry
4. add EN/FA section/user-facing copy
5. create the static child page using the EL system
6. build a separately protected backend resource
7. add typed frontend request/response contracts
8. expose calls through usePromptDraftApi
9. verify static route generation and authorization behavior
```

Avoid direct role-name checks in product UI when a permission expresses the capability.

## UI system rule

Prefer the shared EL/project systems:

```text
el-flex
el-grid
el-text
el-button
el-text-field
el-dropdown
el-divider
el-avatar
Global Menu
Global Modal
```

Do not create page-specific menu/modal systems when the central implementations already satisfy the interaction.

The shared `app/pages/manage.vue` owns the workspace shell and navigation. Child pages should not duplicate the shell heading/navigation.

## Static route rule

Prompt Draft uses `ssr: false` with static generation.

Canonical Manage routes must remain discoverable/prerendered:

```text
/manage
/manage/dashboard
/manage/users
/manage/archive
```

Avoid arbitrary dynamic admin detail pages when a static parent plus modal/query state is sufficient.

## Users page patterns

Verified server-side list behavior:

```text
username/email search
350ms debounce
role filter
20-row initial page
cursor/keyset pagination
manual Refresh
```

Do not load an unbounded collection and filter it only in the browser.

### Read models instead of raw tables

The admin Users API exposes purpose-built summary/detail projections rather than raw `users`/session rows.

The verified Docker-branch summary fields include:

```text
id
username
email
avatarUrl
role
status
createdAt
cloudDraftCount
activeSessionCount
```

Derived counts are computed server-side. Password hashes, bearer/session token material and other secrets never enter the response.

### Row actions use the Global Menu

The trailing action button and right-click context menu both use the shared Global Menu.

Action vocabulary includes:

```text
Change role
Suspend / Unsuspend
Revoke sessions
Reset Cloud data
Information
```

Mutation actions are shown only when the caller has `users.manage`.

### Detail uses the central modal

User Information fetches the admin detail endpoint and renders in the central Global Modal.

For future contextual admin details, prefer the central modal unless a dedicated static route is genuinely required.

## User mutation pattern

Administrative user mutations use explicit action endpoints:

```text
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

UX pattern:

```text
row/context action
  -> Global Modal confirmation
  -> backend mutation
  -> close confirmation
  -> refresh list
  -> success/error message
```

### Backend safety rules

Verified safety rules include:

```text
self-mutation blocked
non-super-admin cannot manage a super-admin
non-super-admin cannot promote to super_admin
last active super_admin cannot be downgraded
last active super_admin cannot be suspended
```

UI disabling is presentation only; backend enforcement is mandatory.

### Audit privileged mutations

Successful privileged changes write to `admin_audit_log` with actor, target/action/metadata/timestamp where relevant.

Future privileged mutations should define their audit event contract during design.

## Dashboard patterns

Current API:

```text
GET /api/admin/dashboard/summary
requires system.metrics.view
```

Verified metrics:

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

Do not invent analytics from data the product does not persist.

The API uses explicit UTC-day semantics and the UI exposes generated-at + manual Refresh.

## Prompt Archive Manage patterns

Canonical route:

```text
/manage/archive
```

Permissions:

```text
archive.view   -> read/list/detail access
archive.manage -> create/update/media/status/promotion capabilities
```

Verified collection behavior includes:

```text
server-side search
status filter
model filter
cursor pagination
manual Refresh
stable public Archive ID
```

Archive content management includes:

```text
create managed Draft
edit metadata
EN/FA titles
canonical tags
preview model / optimized models
full + thumbnail prepared WebP media
reorder/delete persisted media
publish
move back to Draft
archive/restore
```

Media/content mutations that can change public output return the item to Draft when required; publishing remains a separate explicit action.

### Archive identity after Milestone 20

Manage deep links use stable `public_id`, not Telegram message ID:

```text
/manage/archive?edit=<publicId>
GET /api/admin/archive/public/:publicId
```

Telegram linkage is optional source metadata.

### Promotion/moderation integration

Milestone 20 adds public user-Draft promotion and moderation integration:

```text
archive.manage
  -> promote eligible public Draft into Prompt Archive

drafts.delete_any
  -> moderation soft-delete another user's Draft
```

Promotion creates a new Archive item in Draft state, preserves source provenance, prevents duplicate source promotion and copies/re-prepares preview media into independent Archive-owned storage.

Do not make promotion auto-publish content.

## API projection rules

Use list and detail read models intentionally.

```text
collection endpoint -> only fields needed to render/search/page list
single detail endpoint -> richer fields needed by contextual editor/modal
```

Do not return raw DB rows. Do not issue per-row detail requests unless there is no reasonable collection projection.

This rule is extended further by the child `feature/create-ui-consolidation` branch, which documents small list preview projections explicitly.

## Localization contract

All Manage user-facing copy belongs under `manage.*` in both:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

This includes navigation, headings, placeholders, filters, table labels, statuses, menu actions, modal copy and error/success fallbacks.

Do not display raw role/status enum strings as user-facing copy.

Technical literals such as routes, permission IDs, icon names and API enum values used only for logic are not translation copy.

## Verification checklist

A future Manage feature is not complete from code creation alone.

Verify locally:

```text
authorized account sees the permitted section/action
view-only account sees only read behavior
normal user does not see privileged navigation
anonymous user is redirected to login
frontend route guard cannot be bypassed
backend permission guard cannot be bypassed
safety rules behave correctly where relevant
loading/error/empty states work
EN/FA key parity remains correct
RTL/LTR layouts remain usable
search/filter/pagination/Refresh remain stable
media persistence/read-back works where relevant
pnpm generate succeeds for milestone/release closure
new static route is present in prerender output when applicable
```

Known duplicated-import, sourcemap, Nitro-resolution and large-chunk warnings remain existing non-blocking build warnings unless their behavior changes.

## Verified closure of `feature/docker-local-api`

By 2026-09-05 the Manage workspace included Dashboard, Users and Prompt Archive, and Milestone 20 integration was locally verified.

There is no unfinished Manage milestone in the Docker branch scope.

Historical milestone sources:

```text
docs/backend/MILESTONE_9_MANAGE_SHELL.md
docs/backend/MILESTONE_10_MANAGE_USERS.md
docs/backend/MILESTONE_11_USER_ADMIN_ACTIONS.md
docs/backend/MILESTONE_12_MANAGE_DASHBOARD_SUMMARY.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
```

Current handoff sources:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
```
