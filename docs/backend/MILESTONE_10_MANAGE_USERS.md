# Milestone 10 — Manage Users Foundation

Status: FUNCTIONALLY VERIFIED — EL DESIGN-SYSTEM REFACTOR IMPLEMENTED — STATIC CHECK PENDING

## Goal

Add the first real product feature on top of the verified Manage shell: a read-only, permission-gated user-management workspace that can scale into later administrative actions without exposing credential data or coupling UI access to role names.

Target route:

```text
/manage/users
permission: users.view
```

This milestone is read-only. Role changes, suspension/ban, session revocation, reset/delete flows, and audit logging remain a later mutation milestone.

## Backend contract

### Collection

```text
GET /api/admin/users
```

Required permission:

```text
users.view
```

Supported query parameters:

```text
limit   default 20, min 1, max 100
cursor  opaque keyset cursor
query   non-empty literal username/email substring, max 200 chars
role    user | admin | super_admin
```

Canonical ordering:

```text
created_at DESC, id DESC
```

Response shape:

```json
{
  "ok": true,
  "users": [
    {
      "id": "uuid",
      "username": "grass",
      "email": null,
      "role": "super_admin",
      "createdAt": "ISO timestamp",
      "cloudDraftCount": 2,
      "activeSessionCount": 1
    }
  ],
  "pageInfo": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

No password hash, raw password, bearer token, token hash, or session identifier is exposed.

### Detail

```text
GET /api/admin/users/:id
```

Required permission:

```text
users.view
```

Behavior:

```text
valid existing UUID -> 200 full admin read model
valid missing UUID  -> 404 User not found
malformed UUID      -> 400 Invalid user id
normal user         -> 403 Forbidden
anonymous           -> 401 Authentication required
```

The current detail read model intentionally matches the list item shape. Future admin metadata can extend detail without bloating the collection contract.

## Database/read model

New database helpers live behind `database.mjs`:

```text
listAdminUsers(...)
getAdminUserById(id)
```

Admin reads expose only non-secret account metadata plus derived counts:

```text
cloudDraftCount
  -> prompt_drafts rows owned by the account

activeSessionCount
  -> unexpired auth_sessions rows for the account
```

Pagination-supporting indexes are added in:

```text
backend/sql/006_add_admin_user_indexes.sql
```

Existing indexes already support draft/session counts by `user_id`.

## Frontend contract

Typed API boundary:

```text
app/types/adminUsersApi.ts
usePromptDraftApi().listAdminUsers(...)
usePromptDraftApi().getAdminUser(id)
```

Manage registry adds:

```text
Users
route: /manage/users
permission: users.view
```

The shared Manage shell therefore exposes the tab automatically only to permitted accounts.

## `/manage/users` behavior

The current UI provides:

```text
server-side username/email search with 350ms debounce
role filter
20-row initial page
cursor-based Load more
account / role / Cloud draft count / active session count / joined metadata
Refresh action
```

User detail selection remains static-hosting-safe:

```text
/manage/users?user=<uuid>
```

Selecting a user updates the query and fetches:

```text
GET /api/admin/users/:id
```

No dynamic `/manage/users/:id` route is introduced.

## EL design-system baseline

After functional verification, the first UI cleanup replaced the one-off native/CSS implementation with the project's reusable EL component system.

`app/pages/manage/users.vue` now uses:

```text
el-text-field  -> search
el-dropdown    -> role filter
el-grid        -> toolbar, user rows, detail layout
el-flex        -> containers and grouping
el-button      -> row/action controls
el-text        -> labels and values
el-divider     -> separators
```

The page no longer carries a scoped CSS block for its layout/table/detail implementation.

`app/pages/manage.vue` and `app/pages/manage/dashboard.vue` were reviewed in the same pass and were already built predominantly from EL system components with no page-specific CSS requiring replacement.

This is only the baseline UI normalization. Final visual polish remains intentionally deferred until Manage functionality is broader.

## Authorization contract

All three layers remain active:

```text
Manage tab visibility -> users.view
/manage/users route   -> users.view
/api/admin/users*     -> backend users.view guard
```

Backend authorization is authoritative.

Current role mapping already grants `users.view` to `admin` and wildcard access to `super_admin`; normal `user` accounts receive neither.

## Functional verification

The user locally confirmed on 2026-09-04 that the implemented Manage Users functionality works without functional issues, including the real `/manage/users` page and its read interactions.

The EL design-system refactor was implemented after that confirmation and must remain behavior-preserving through the final static/build check.

## Static-generation contract

`/manage/users` is explicitly added to Nuxt prerender routes.

Milestone completion requires:

```text
pnpm generate
/manage/users present in generated routes
```

## Implementation phases

```text
Phase 0 — contract/documentation: DONE
Phase 1 — database read model + indexes: DONE
Phase 2 — GET collection + detail admin APIs: DONE
Phase 3 — typed frontend API boundary: DONE
Phase 4 — Manage Users list/search/filter/pagination UI: DONE
Phase 5 — query-based user detail: DONE
Phase 6 — authorization regression + static generation: AUTHORIZATION VERIFIED / STATIC CHECK PENDING
```

Milestone 10 is not complete until the final static-generation check passes after the EL design-system refactor.

## Deferred mutation milestone

After this read foundation is complete, the recommended next administrative milestone starts with audit logging and then adds explicit action endpoints such as:

```text
PATCH /api/admin/users/:id/role
POST  /api/admin/users/:id/suspend
POST  /api/admin/users/:id/unsuspend
POST  /api/admin/users/:id/revoke-sessions
POST  /api/admin/users/:id/reset-data
```

Sensitive mutations will require stricter super-admin/self-protection rules and explicit audit records. They are not part of Milestone 10.
