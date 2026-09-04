# Milestone 10 — Manage Users Foundation

Status: IMPLEMENTED — AWAITING USER VERIFICATION

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

The initial UI is deliberately functional rather than polished.

It provides:

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

Selecting a row updates the query and fetches:

```text
GET /api/admin/users/:id
```

No dynamic `/manage/users/:id` route is introduced.

## Authorization contract

All three layers remain active:

```text
Manage tab visibility -> users.view
/manage/users route   -> users.view
/api/admin/users*     -> backend users.view guard
```

Backend authorization is authoritative.

Current role mapping already grants `users.view` to `admin` and wildcard access to `super_admin`; normal `user` accounts receive neither.

## Static-generation contract

`/manage/users` is explicitly added to Nuxt prerender routes.

Milestone completion requires:

```text
pnpm generate
/manage/users present in generated routes
```

## Implementation phases

```text
Phase 0 — contract/documentation: IMPLEMENTED — AWAITING USER VERIFICATION
Phase 1 — database read model + indexes: IMPLEMENTED — AWAITING USER VERIFICATION
Phase 2 — GET collection + detail admin APIs: IMPLEMENTED — AWAITING USER VERIFICATION
Phase 3 — typed frontend API boundary: IMPLEMENTED — AWAITING USER VERIFICATION
Phase 4 — Manage Users list/search/filter/pagination UI: IMPLEMENTED — AWAITING USER VERIFICATION
Phase 5 — query-based user detail: IMPLEMENTED — AWAITING USER VERIFICATION
Phase 6 — authorization regression + static generation: NOT STARTED
```

No phase is `DONE` until the user verifies the relevant behavior locally.

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
