# Prompt Draft — Manage Development Guide

Last updated: 2026-09-06
Current branch: `feature/create-ui-consolidation`
Backend/platform base: `feature/docker-local-api`

This document is the reusable source of truth for extending the Prompt Draft management workspace after the verified Dashboard, Users, Prompt Archive and post-Milestone-20 consolidation work.

Future Manage work must build on the existing shell, permission, API, Global Menu/Modal, localization and static-generation architecture rather than creating a second admin system.

## Verified baseline

Canonical routes:

```text
/manage
/manage/dashboard
/manage/users
/manage/archive
```

Section registry:

```text
app/config/manage.ts
```

Verified sections:

```text
dashboard -> /manage/dashboard -> dashboard.view
users     -> /manage/users     -> users.view
archive   -> /manage/archive   -> archive.view
```

Relevant mutation capabilities include:

```text
users.manage
archive.manage
drafts.delete_any
```

Backend authorization remains authoritative.

## Core architecture

Manage is one permission-aware workspace.

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

Security is enforced at three layers:

```text
1. UI visibility
2. frontend route guard
3. backend permission guard (authoritative)
```

Never treat hidden/disabled UI as security.

## Manage section registry rule

`app/config/manage.ts` stores structural identity only:

```text
key
icon
route
requiredPermission
```

User-facing copy belongs under:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

The shell resolves `manage.sections.<key>.label/description`.

When adding a section, extend the typed key union deliberately.

## `/manage` entry behavior

`app/middleware/manage-entry.ts` handles exact `/manage` navigation.

```text
anonymous
  -> /login?next=/manage

authenticated + permitted section
  -> first permitted MANAGE_SECTIONS entry

authenticated + no permitted section
  -> 403
```

Do not hardcode Dashboard as fallback.

## Child-page route contract

Every privileged child page declares its own permission:

```ts
definePageMeta({
  middleware: "authorization",
  requiredPermission: AUTH_PERMISSIONS.SOME_PERMISSION,
});
```

The matching backend resource independently enforces the same capability.

## How to add a Manage section

Use this order:

```text
1. define read/mutation permission semantics
2. add backend permission + role mapping
3. add MANAGE_SECTIONS entry
4. add EN/FA copy
5. create static child page with EL/project systems
6. build separately protected backend resource
7. add typed frontend API contracts
8. expose calls through usePromptDraftApi
9. verify authorization, product behavior and static generation
```

Avoid direct role-name checks when a permission expresses the capability.

## Shared UI systems

Prefer:

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

Do not create page-specific menu/modal systems when central systems already exist.

The shared `app/pages/manage.vue` owns workspace shell/navigation; child pages should not repeat it.

## Static route rule

Prompt Draft uses `ssr: false` with static generation.

Canonical Manage routes remain static/prerenderable:

```text
/manage
/manage/dashboard
/manage/users
/manage/archive
```

Prefer static parent routes plus modal/query state instead of arbitrary dynamic admin detail routes.

# Users patterns

## Server-side collection behavior

Verified `/manage/users` list behavior:

```text
username/email search
350ms debounce
role filter
20-row initial page
cursor/keyset pagination
manual Refresh
```

Do not load unbounded collections and filter only in the browser.

## Summary vs detail read models

The Users API deliberately separates lightweight collection data from richer modal detail.

Current list projection:

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

`/manage/users` renders `avatarUrl` with reusable `el-avatar` before account name/ID. The list does not issue a second profile/media request per row.

Current User Information detail projection additionally includes:

```text
cover
updatedAt
lastUpdatedAt
totalDraftCount
publicDraftCount
privateDraftCount
totalXp
```

Together with summary fields, the modal can show:

```text
avatar
cover
username
email
user id
role
status
total/public/private Draft counts
active sessions
XP
joined date
latest persisted update/activity
```

This is an authorized admin read model. It does not change the public `/api/users/:id/profile` privacy boundary.

### Projection rule

Do not bloat every row with detail-only data. Conversely, do not solve small list presentation needs with N per-row detail calls.

```text
list -> minimum render/search/pagination projection
detail -> richer contextual modal/editor projection
```

## User row actions

Trailing action button and right-click both use shared Global Menu.

```text
Change role
Suspend / Unsuspend
Revoke sessions
Reset Cloud data
Information
```

Mutation actions require `users.manage`.

## User detail modal

User Information uses the central Global Modal and fetches detail on demand.

Prefer this pattern for contextual admin details unless a dedicated static route is justified.

## User mutation pattern

Explicit action endpoints:

```text
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

UX:

```text
row/context action
  -> Global Modal confirmation
  -> backend mutation
  -> refresh list
  -> localized success/error feedback
```

Verified backend safety rules include self-mutation blocking, super-admin hierarchy checks and protection of the last active super admin.

Privileged mutations are audited where applicable.

# Dashboard patterns

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

Do not invent analytics from data that is not persisted.

# Prompt Archive Manage patterns

Canonical route:

```text
/manage/archive
```

Permissions:

```text
archive.view
archive.manage
```

Collection behavior:

```text
server-side search
status filter
model filter
cursor pagination
manual Refresh
stable public Archive ID
```

Management includes:

```text
create managed Draft
edit metadata
EN/FA titles
canonical tags
preview/optimized model settings
prepare/upload full + thumbnail WebP media
reorder/delete persisted media
publish
move to Draft
archive/restore
```

Publishing is explicit; content/media mutations return public items to Draft when required.

## Archive identity

Manage deep links use stable `public_id`:

```text
/manage/archive?edit=<publicId>
GET /api/admin/archive/public/:publicId
```

Telegram linkage is optional source metadata.

## Archive list preview projection

The post-M20 consolidation adds compact media directly to the collection read model.

Each Archive summary exposes:

```text
previewImageUrl
```

Backend selection rule:

```text
first prompt_archive_images row
ORDER BY position ASC, id ASC

URL fallback:
thumbnail_url
-> full_url
-> source_path
```

`/manage/archive` renders this through `el-avatar` beside the title.

This is intentionally one list query projection, not one media/detail request per Archive row.

## Promotion/moderation integration

```text
archive.manage
  -> promote eligible public Draft into Prompt Archive

drafts.delete_any
  -> moderation soft-delete another user's Draft
```

Promotion creates an Archive Draft, records source provenance, blocks duplicates and copies/re-prepares preview media into independent Archive-owned storage. It never auto-publishes.

# API projection rule established by consolidation

For data-heavy admin lists:

```text
return small presentation fields in collection response when every row needs them
return richer/less-common fields only in detail response
never create an N+1 pattern just to paint a list row
```

Current examples:

```text
Users list -> avatarUrl
User detail -> cover + visibility counts + XP + richer timestamps
Archive list -> previewImageUrl
```

This rule should be treated as a default architecture choice for future Manage features.

# Localization contract

All Manage user-facing copy belongs under `manage.*` in both EN/FA locale files.

Do not display raw role/status enum strings as user-facing copy.

Technical literals (routes, permissions, icon names, API enums used only for logic) are not translation copy.

# Verification checklist

A future Manage feature is not complete from code creation alone.

Verify locally:

```text
authorized account sees permitted section/action
view-only account sees only allowed read behavior
normal user does not see privileged navigation
anonymous user redirects to login
frontend route guard cannot be bypassed
backend permission guard cannot be bypassed
safety rules work where relevant
loading/error/empty states work
EN/FA parity remains correct
RTL/LTR remain usable
search/filter/pagination/Refresh stay stable
collection projection does not create N+1 behavior
media persistence/read-back works when relevant
pnpm generate succeeds for milestone/release closure
new static routes appear in prerender output when applicable
```

Known duplicated-import, sourcemap, Nitro-resolution and large-chunk warnings remain existing non-blocking build warnings unless behavior changes.

# Closure state

The Docker Manage foundation through Milestone 20 and the deferred `feature/create-ui-consolidation` Manage projection polish are locally verified and closed.

No in-scope Manage task remains open in the current branch.

Related source documents:

```text
docs/backend/API_GUIDE.md
docs/backend/MILESTONE_9_MANAGE_SHELL.md
docs/backend/MILESTONE_10_MANAGE_USERS.md
docs/backend/MILESTONE_11_USER_ADMIN_ACTIONS.md
docs/backend/MILESTONE_12_MANAGE_DASHBOARD_SUMMARY.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
docs/backend/BRANCH_CREATE_UI_CONSOLIDATION.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/STATUS.md
```
