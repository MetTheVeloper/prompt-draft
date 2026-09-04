# Milestone 9 — Manage Shell / Admin Workspace Foundation

Status: COMPLETE

## Goal

Turn the temporary `/dashboard` authorization proof into a reusable permission-aware management workspace that can host future admin/system tools without scattering privileged pages across the product.

Canonical route family:

```text
/manage
/manage/dashboard
/manage/users
```

Future routes such as `/manage/system` and `/manage/content` should extend this shell rather than create a separate admin architecture.

## Permission-first contract

Navigation and routing remain permission-driven, not role-name-driven.

Runtime Manage access uses:

```text
auth.can(section.requiredPermission)
```

Roles remain permission bundles. Backend authorization remains the authoritative security boundary.

## Manage section configuration

```text
app/config/manage.ts
```

Current verified shape:

```text
ManageSection
  key
  icon
  route
  requiredPermission
```

Current entries:

```text
dashboard
  -> /manage/dashboard
  -> dashboard.view

users
  -> /manage/users
  -> users.view
```

The registry contains structural identity only.

User-facing labels and descriptions must not be stored in `app/config/manage.ts`. The shell resolves localized copy from:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts

manage.sections.<key>.label
manage.sections.<key>.description
```

The same structural registry drives:

```text
Manage tabs
/manage default-route resolution
Profile Menu Manage visibility
future responsive Manage navigation
```

Adding a future section should primarily mean adding one typed section definition plus its permission/API/page/i18n vertical slice, not rebuilding the shell.

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
  -> 403
```

The resolver never assumes Dashboard will always be the first permitted section.

The Manage-specific guard copy is localized under the `manage.*` namespace.

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
localized active section heading/description
nested child page rendering via NuxtPage
```

Child pages do not repeat the shared section heading block.

## Profile Menu entry

The Profile Menu exposes one permission-aware:

```text
Manage
```

entry only when the current user can access at least one configured Manage section.

It navigates to:

```text
/manage
```

so the entry does not need to know which section the user can access.

The label is localized through `manage.title`.

## Legacy `/dashboard` compatibility

`/dashboard` remains a compatibility route. Authorization is evaluated first and permitted users are redirected to:

```text
/manage/dashboard
```

A normal user cannot use the legacy path to bypass authorization.

## Security layers

The three-layer model remains mandatory:

```text
1. UI visibility
2. frontend route authorization
3. backend permission guard
```

Future Manage mutations must each have backend permission checks even when their UI actions are hidden or disabled.

## Local verification

Verified by the user on 2026-09-04.

Super admin:

```text
Profile Menu shows Manage
/manage resolves to /manage/dashboard
Manage shell renders permitted tabs
Dashboard route works
legacy /dashboard redirects correctly
```

Normal user:

```text
Profile Menu does not show Manage
/manage is blocked
/manage/dashboard is blocked
/dashboard remains blocked
```

The user explicitly confirmed the functional shell behavior succeeded.

## Final localization verification

The later Manage localization closure moved all shell/section copy into the English/Persian Manage locale files.

The user confirmed the final English and Persian Manage shell works correctly.

## Static-generation verification

Final branch-level release check passed after the full Manage implementation and localization closure:

```text
pnpm generate succeeds
16 initial routes prerendered
/manage present
/manage/dashboard present
/manage/users present
/dashboard compatibility route present
.output/public generated
offline manifest generated
```

Known duplicated-import, sourcemap, Nitro cache-driver, and large-chunk warnings remain non-blocking existing build warnings.

## Milestone 9 phases — ALL DONE

```text
Phase 0 — contract/documentation: DONE
Phase 1 — central Manage section config + parent shell: DONE
Phase 2 — Dashboard migration + Profile Menu entry: DONE
Phase 3 — privileged/normal-user authorization regression: DONE
Phase 4 — static generation: DONE
Phase 5 — final shell/section localization follow-up: DONE
```

## Later work built on this milestone

```text
Milestone 10 -> Manage Users read foundation
Milestone 11 -> user administration mutations + audit
Milestone 12 -> live Dashboard summary
```

Reusable future guidance now lives in:

```text
docs/backend/MANAGE_GUIDE.md
```
