# Milestone 8 — Authorization / Roles Foundation

Status: RUNTIME VERIFIED — STATIC CHECK PENDING

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

## Locally verified runtime behavior

Verified by the user on 2026-09-04:

```text
grass account resolves as super_admin
super_admin Profile Menu shows Dashboard
super_admin can enter /dashboard
super_admin dashboard backend authorization reports Verified
normal newly-created account resolves as user
normal user does not see Dashboard in Profile Menu
direct /dashboard navigation as normal user renders 403 Forbidden
direct authenticated GET /api/admin/access-check as normal user returns HTTP 403
```

This verifies all three authorization layers independently:

```text
conditional UI visibility
frontend route guard
backend API permission guard
```

## Remaining release check

Before marking Milestone 8 complete, run:

```text
pnpm generate
```

The generated static output must include `/dashboard` successfully. After that check passes, fold this milestone into the main backend README / IMPLEMENTATION / STATUS documents and mark it COMPLETE.
