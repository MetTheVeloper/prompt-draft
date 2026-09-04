# Milestone 10 — Manage Users Foundation

Status: COMPLETE

## Goal

Add the first real product feature on top of the verified Manage shell: a permission-gated user-management read workspace that scales into later administration without exposing credential data or coupling UI access to role names.

Target route:

```text
/manage/users
permission: users.view
```

Milestone 11 later added the mutation actions; this document remains the read-foundation source of truth.

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

Response exposes an admin read model only.

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

The current detail read model intentionally matches the main account metadata used by Manage.

## Database/read model

Database helpers:

```text
listAdminUsers(...)
getAdminUserById(id)
```

Current account read-model fields include:

```text
id
username
email
role
status
createdAt
cloudDraftCount
activeSessionCount
```

Derived counts:

```text
cloudDraftCount
  -> prompt_drafts owned by the account

activeSessionCount
  -> unexpired auth_sessions for the account
```

Pagination-supporting indexes live in:

```text
backend/sql/006_add_admin_user_indexes.sql
```

## Frontend contract

Typed API boundary:

```text
app/types/adminUsersApi.ts
usePromptDraftApi().listAdminUsers(...)
usePromptDraftApi().getAdminUser(id)
```

Manage registry entry:

```text
key: users
route: /manage/users
permission: users.view
```

The registry no longer stores display labels/descriptions. The shell resolves them from `manage.sections.users.*` locale keys.

## `/manage/users` behavior

Verified list behavior:

```text
server-side username/email search with 350ms debounce
role filter
20-row initial page
cursor-based Load more
account / role / status / Cloud draft count / active session count / joined metadata
Refresh action
```

User information is now displayed through the central Information modal added in Milestone 11. The earlier inline/query detail presentation is no longer the final UX.

No arbitrary dynamic `/manage/users/:id` frontend route is required, preserving the static-hosting model.

## EL design-system baseline

The final page uses the shared EL component system:

```text
el-text-field
el-dropdown
el-grid
el-flex
el-button
el-text
el-divider
```

The page does not carry a dedicated scoped CSS table/layout implementation.

## Localization closure

All current user-facing Users copy is under:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

Covered read surfaces include:

```text
search placeholder
role filter labels
Refresh
column headers
role labels
status labels
loading state
empty state
Load more
Information modal labels/loading/error fallback
row action tooltip
```

Raw API enum values remain technical values for logic; displayed role/status labels are translated explicitly.

## Authorization contract

All three layers remain active:

```text
Manage tab visibility -> users.view
/manage/users route   -> users.view
/api/admin/users*     -> backend users.view guard
```

Backend authorization is authoritative.

Current backend role policy grants `users.view` to `admin` and wildcard access to `super_admin`; normal `user` accounts receive neither.

## Verification

The user locally confirmed the real `/manage/users` functionality and later confirmed the final localized UI worked correctly.

Final branch-level static release verification on 2026-09-04 passed after the full Manage/localization work:

```text
pnpm generate succeeds
16 initial routes prerendered
/manage/users present
.output/public generated
offline manifest generated
```

Known duplicated-import, sourcemap, Nitro cache-driver, and large-chunk warnings remain non-blocking existing build warnings.

## Implementation phases — ALL DONE

```text
Phase 0 — contract/documentation: DONE
Phase 1 — database read model + indexes: DONE
Phase 2 — GET collection + detail admin APIs: DONE
Phase 3 — typed frontend API boundary: DONE
Phase 4 — Manage Users list/search/filter/pagination UI: DONE
Phase 5 — user detail read integration: DONE
Phase 6 — authorization regression + static generation: DONE
Phase 7 — final Manage Users EN/FA localization follow-up: DONE
```

## Later work built on this milestone

Milestone 11 adds explicit administrative mutations, safety rules, audit logging, Global Menu actions, and central confirmation/information modals.

Reusable future Manage guidance now lives in:

```text
docs/backend/MANAGE_GUIDE.md
```
