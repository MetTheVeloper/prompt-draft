# Milestone 8 — Authorization / Roles Foundation

Status: AWAITING USER VERIFICATION

## Goal

Add a reusable authorization layer on top of optional authentication.

```text
authenticated user
  -> persisted role
  -> backend-authoritative permissions
  -> frontend permission helpers
  -> permission-gated UI
  -> permission-gated routes
  -> permission-gated backend APIs
```

## Roles

```text
user
admin
super_admin
```

## Initial permissions

```text
dashboard.view
system.metrics.view
users.view
users.manage
drafts.view_all
drafts.delete_any
system.settings.manage
```

Backend mapping is authoritative. `super_admin` receives wildcard `*`.

## Implemented vertical slice

- `backend/sql/005_add_user_roles.sql`
- `backend/src/authorization.mjs`
- `users.role` defaults to `user`
- one-time migration bootstrap promotes the existing `grass` account to `super_admin`
- runtime authorization never checks usernames
- auth login/register/me responses include role and resolved permissions
- `GET /api/admin/access-check` requires `dashboard.view`
- frontend permission constants in `app/config/authorization.ts`
- `useAuth()` exposes `role`, `permissions`, `isAdmin`, `isSuperAdmin`, `can`, `canAny`, `canAll`
- reusable `app/middleware/authorization.ts`
- `/dashboard` proof route requires `dashboard.view`
- Profile Menu shows Dashboard only when permission is granted
- `/dashboard` is explicitly prerendered for the static build

## Verification rule

Do not mark this milestone complete until the user verifies both privileged access and normal-user denial locally, plus `pnpm generate`.
