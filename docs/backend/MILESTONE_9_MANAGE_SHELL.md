# Milestone 9 — Manage Shell / Admin Workspace Foundation

Status: CONTRACT READY — IMPLEMENTATION NOT STARTED

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

It should provide a persistent tab-based management navigation whose visible sections are derived from permissions.

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

Navigation and routing must remain permission-driven, not role-name-driven.

Do not write runtime checks such as:

```text
role === admin || role === super_admin
```

for Manage section access.

Instead:

```text
auth.can(section.requiredPermission)
```

Roles remain permission bundles. Backend authorization remains the authoritative security boundary.

## Central Manage section configuration

Create one reusable frontend configuration conceptually shaped like:

```text
ManageSection
  key
  label
  icon
  route
  requiredPermission
```

This configuration drives:

```text
Manage tabs
/manage default-route resolution
Profile Menu Manage visibility
future responsive Manage navigation
```

Adding `/manage/users` later should primarily mean adding a new section definition plus the page/backend APIs, not rebuilding the shell.

## `/manage` behavior

`/manage` should resolve the first Manage section the authenticated user is permitted to access.

Example today:

```text
super_admin
  -> /manage
  -> /manage/dashboard
```

Future example:

```text
support role
permissions: users.view
  -> /manage
  -> /manage/users
```

If the user is not authenticated:

```text
/manage
  -> /login?next=/manage
```

If authenticated but no Manage section is permitted:

```text
/manage
  -> 403 Forbidden
```

Do not assume Dashboard is always the first permitted section forever.

## Manage shell UI

The shell should contain:

```text
Manage heading/context
permission-filtered tab navigation
active-tab state from current route
child page content
```

Desktop target: horizontal tab-style navigation.

Responsive/mobile behavior may adapt to the existing UI system, but it must use the same central section configuration and permission filtering.

The shell should be reusable by every `/manage/*` page.

## Dashboard migration

Move the existing authorization proof from:

```text
/dashboard
```

to:

```text
/manage/dashboard
```

The page continues to require:

```text
dashboard.view
```

The existing backend proof endpoint may remain during this milestone:

```text
GET /api/admin/access-check
```

The Dashboard remains a foundation/proof page in Milestone 9. Real system metrics are not part of this milestone.

## Legacy `/dashboard` compatibility

Do not leave two independent Dashboard implementations.

`/dashboard` becomes a compatibility route that redirects/replaces navigation to:

```text
/manage/dashboard
```

Authorization must still be enforced. A normal user must not gain access through the legacy path.

The legacy route may be removed in a later cleanup after the Manage route family is established.

## Profile Menu entry

Replace the current Profile Menu `Dashboard` action with a higher-level action such as:

```text
Manage
```

The action is visible only when the current user can access at least one configured Manage section.

It navigates to:

```text
/manage
```

rather than directly hardcoding `/manage/dashboard`.

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

Prompt Draft remains a static-generated Nuxt frontend.

Milestone 9 must explicitly include the static Manage shells/routes required for navigation:

```text
/manage
/manage/dashboard
/dashboard  # temporary compatibility path while retained
```

`pnpm generate` must succeed before Milestone 9 is marked complete.

Arbitrary user/resource identifiers should still use client-side route/query patterns compatible with static hosting when future Manage detail views are designed.

## Deferred from Milestone 9

The following are intentionally not implemented as part of the shell foundation:

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

These become later vertical-slice features on top of the Manage shell.

## Proposed implementation phases

```text
Phase 0 — contract/documentation
  -> this document + STATUS direction

Phase 1 — central Manage section config + parent shell
  -> permission-filtered tabs
  -> /manage first-permitted-section resolution

Phase 2 — Dashboard migration
  -> /manage/dashboard
  -> legacy /dashboard compatibility redirect
  -> Profile Menu Dashboard -> Manage

Phase 3 — authorization regression
  -> super_admin allowed
  -> normal user hidden/403
  -> backend proof still enforced

Phase 4 — static release verification
  -> pnpm generate
  -> /manage and /manage/dashboard present in generated route set
```

## Completion rule

No implementation phase is `DONE` until the user verifies its behavior locally.

Milestone 9 is complete only after privileged access, normal-user denial, legacy-route behavior, Manage navigation, and static generation are verified.