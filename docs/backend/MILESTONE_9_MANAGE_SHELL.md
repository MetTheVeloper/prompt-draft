# Milestone 9 — Manage Shell / Admin Workspace Foundation

Status: COMPLETE

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

Milestone 9 implements only the reusable shell and migrates the existing Dashboard proof into it. Real user-management behavior such as ban/reset/role changes remains a later feature.

## Product structure

`/manage` is a management workspace, not a public navigation section.

It provides persistent management navigation whose visible sections are derived from permissions.

Current section:

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

Future sections must be added through the shared section configuration rather than hardcoded independently in multiple components.

## Permission-first contract

Navigation and routing remain permission-driven, not role-name-driven.

Runtime Manage access uses:

```text
auth.can(section.requiredPermission)
```

Roles remain permission bundles. Backend authorization remains the authoritative security boundary.

## Implemented Manage section configuration

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

The resolver never assumes Dashboard will always be the first permitted section.

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

The canonical Dashboard proof now lives at:

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

It uses authorization first, then redirects permitted users to:

```text
/manage/dashboard
```

A normal user cannot use the legacy path to bypass authorization.

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
2. frontend route authorization
3. backend permission guard
```

Future `/manage/users` mutations such as ban, reset, or role changes must each have backend permission checks even if their buttons are hidden in the UI.

## Local verification

Verified by the user on 2026-09-04.

Super admin:

```text
Profile Menu shows Manage, not Dashboard
/manage resolves to /manage/dashboard
Manage shell renders with Dashboard tab active
Dashboard backend authorization remains Verified
legacy /dashboard redirects to /manage/dashboard
```

Normal user:

```text
Profile Menu does not show Manage
/manage is blocked
/manage/dashboard is blocked
/dashboard remains blocked
```

The user explicitly confirmed all functional tests succeeded.

## Static-generation verification

Final release check also passed:

```text
pnpm generate succeeds
15 initial routes prerender successfully
/manage is present
/manage/dashboard is present
/dashboard compatibility route is present
.output/public generated successfully
offline manifest generated successfully
```

Known duplicated-import, sourcemap, and large-chunk warnings remain non-blocking existing build warnings.

## Milestone 9 phases — ALL DONE

```text
Phase 0 — contract/documentation: DONE
Phase 1 — central Manage section config + parent shell: DONE
Phase 2 — Dashboard migration + Profile Menu entry: DONE
Phase 3 — privileged/normal-user authorization regression: DONE
Phase 4 — pnpm generate + static route verification: DONE
```

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
translation usage analytics
admin audit log
/manage/system
/manage/content
```

These become later vertical-slice features on top of the verified Manage shell.