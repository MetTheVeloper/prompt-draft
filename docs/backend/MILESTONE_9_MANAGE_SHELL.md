# Milestone 9 — Manage Shell / Admin Workspace Foundation

Status: PHASES 1–2 IMPLEMENTED — AWAITING USER VERIFICATION

## Goal

Turn the temporary `/dashboard` authorization proof into a reusable permission-aware management workspace that can host future admin/system tools without scattering privileged pages across the product.

Target route family:

```text
/manage
/manage/dashboard
/manage/users
/manage/system
/manage/content
...
```

Milestone 9 implements only the reusable shell and migrates the existing Dashboard proof into it. Real user-management behavior such as ban/reset/role changes is intentionally a later feature.

## Product structure

`/manage` is a management workspace, not a public navigation section.

It provides persistent management navigation whose visible sections are derived from permissions.

Initial section:

```text
Dashboard
route: /manage/dashboard
permission: dashboard.view
```

Expected future sections include:

```text
Users
route: /manage/users
permission: users.view

System
route: /manage/system
permission: system.settings.manage or a future narrower permission

Content
route: /manage/content
permission: future content-management permission
```

Future sections must be added through one shared section configuration rather than hardcoded independently in multiple components.

## Permission-first contract

Navigation and routing remain permission-driven, not role-name-driven.

Runtime Manage access must use:

```text
auth.can(section.requiredPermission)
```

Roles remain permission bundles. Backend authorization remains the authoritative security boundary.

## Central Manage section configuration

Implemented in:

```text
app/config/manage.ts
```

Current shape:

```text
ManageSection
  key
  label
  icon
  route
  requiredPermission
```

The same configuration drives:

```text
Manage tabs
/manage default-route resolution
Profile Menu Manage visibility
future responsive Manage navigation
```

Adding `/manage/users` later should primarily mean adding one section definition plus its page/backend APIs, not rebuilding the shell.

## `/manage` behavior

Implemented resolver:

```text
app/middleware/manage-entry.ts
```

Exact `/manage` entry behavior:

```text
anonymous
  -> /login?next=/manage

authenticated + one or more Manage permissions
  -> first permitted configured section

authenticated + no permitted Manage section
  -> 403 Forbidden
```

The resolver never assumes that Dashboard will always be the first permitted section.

## Manage shell UI

Implemented parent shell:

```text
app/pages/manage.vue
```

The parent route owns:

```text
Manage heading/context
permission-filtered tab navigation
active-tab state from current route
nested child page rendering via NuxtPage
```

This keeps the normal application Header/default layout and avoids duplicating global layout wiring.

## Dashboard migration

The existing proof page has one canonical implementation at:

```text
/manage/dashboard
```

It continues to require:

```text
dashboard.view
```

and continues to verify backend authorization through:

```text
GET /api/admin/access-check
```

Real system metrics are not part of Milestone 9.

## Legacy `/dashboard` compatibility

`/dashboard` no longer contains a second Dashboard implementation.

It uses the existing authorization middleware first, then redirects permitted users to:

```text
/manage/dashboard
```

Therefore a normal user cannot use the legacy path to bypass authorization.

## Profile Menu entry

The previous `Dashboard` action has been replaced with:

```text
Manage
```

Visibility is derived from whether the current user can access at least one configured Manage section.

The action navigates to:

```text
/manage
```

so future roles can land on their first permitted section without Profile Menu changes.

## Security layers

The existing three-layer authorization model remains mandatory:

```text
1. UI visibility
   -> convenience/discoverability

2. frontend route authorization
   -> blocks unauthorized navigation

3. backend permission guard
   -> authoritative security boundary
```

Future `/manage/users` mutations such as ban, reset, or role changes must each have backend permission checks even if their buttons are hidden in the UI.

## Static-generation contract

Explicit static routes now include:

```text
/manage
/manage/dashboard
/dashboard
```

`pnpm generate` remains required before Milestone 9 can be marked complete.

## Deferred from Milestone 9

```text
/manage/users real UI
user list/search/pagination
ban/suspend state
role mutation API
user data reset API
delete-user flow
system metrics/dashboard analytics
page-view tracking
active-user analytics
admin audit log
/manage/system
/manage/content
```

## Implementation phases

```text
Phase 0 — contract/documentation: READY
Phase 1 — central Manage section config + parent shell: AWAITING USER VERIFICATION
Phase 2 — Dashboard migration + Profile Menu entry: AWAITING USER VERIFICATION
Phase 3 — privileged/normal-user authorization regression: NOT STARTED
Phase 4 — pnpm generate + static route verification: NOT STARTED
```

## Phase 1–2 local verification target

Verify with the existing `super_admin` account:

```text
Profile Menu shows Manage, not Dashboard
Manage -> /manage -> /manage/dashboard
Manage shell is visible with Dashboard tab active
Dashboard proof content still shows backend authorization Verified
legacy /dashboard redirects to /manage/dashboard
```

Then verify with a normal `user` account:

```text
Profile Menu does not show Manage
direct /manage returns 403
direct /manage/dashboard returns 403
direct /dashboard remains blocked and cannot bypass authorization
```

No implementation phase is `DONE` until the user verifies its behavior locally.
