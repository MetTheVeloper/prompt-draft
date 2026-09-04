# Milestone 11 — User Administration Actions

Status: IMPLEMENTED — AWAITING USER VERIFICATION

## Goal

Turn the verified read-only `/manage/users` foundation into a real permission-gated administration surface while keeping backend authorization authoritative, protecting critical accounts, recording every successful mutation, and reusing the project Global Menu / Global Modal systems.

## Account status

Users now have an explicit status:

```text
active
suspended
```

A suspended account:

```text
cannot create new sessions
cannot authenticate existing bearer sessions
has all sessions revoked when suspension occurs
```

Unsuspending the account allows future login again but does not restore revoked sessions.

## Audit log

Successful admin mutations are written to:

```text
admin_audit_log
```

Each record stores:

```text
actor_user_id
target_user_id
action
metadata
created_at
```

Current actions:

```text
user.role_changed
user.suspended
user.unsuspended
user.sessions_revoked
user.cloud_data_reset
```

## Mutation permission

All mutation endpoints require:

```text
users.manage
```

The current role mapping grants this through the `super_admin` wildcard. `admin` remains read-only for Manage Users until the role-permission policy is deliberately expanded.

## Mutation endpoints

All actions use explicit POST endpoints:

```text
POST /api/admin/users/:id/role
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/unsuspend
POST /api/admin/users/:id/revoke-sessions
POST /api/admin/users/:id/reset-cloud-data
```

Role body:

```json
{
  "role": "user | admin | super_admin"
}
```

`reset-cloud-data` currently means exactly:

```text
delete all prompt_drafts owned by the target account
```

It does not delete the account, password, Wizard-run learning data, or unrelated system data.

Account deletion remains deferred.

## Safety rules

Backend rules are authoritative:

```text
self-mutation through these admin actions -> blocked
non-super-admin managing a super-admin -> blocked
non-super-admin promoting to super_admin -> blocked
last active super_admin downgrade -> blocked
last active super_admin suspension -> blocked
```

The UI also disables self-management actions, but that is only convenience. Backend checks remain mandatory.

## Manage Users UI

Each user row now has a trailing `...` action button using the project Global Menu.

For accounts visible to a caller with `users.manage`:

```text
Change role
Suspend account / Unsuspend account
Revoke sessions
Reset Cloud data
---
Information
```

For callers with only `users.view`, only `Information` is shown.

All mutations use the central Global Modal confirmation flow before calling the backend.

`Information` uses the existing detail API inside a central modal. The old query-based detail box below the user table is removed from the UI.

## Shared Manage section header

Section title/description metadata now lives in:

```text
app/config/manage.ts
```

The shared `/manage` shell renders the active section heading and description. Child pages no longer repeat their own heading blocks.

This keeps future sections consistent and removes duplicate page-header layout code.

## UI consistency changes

```text
Users search input size: 13 -> 15
Dashboard/Users section heading: shared full-width shell heading
Manage UI: EL component system only for new layout/actions/modal content
```

## Verification requirements

Do not mark this milestone DONE until the user verifies locally:

```text
migration 007 applies
normal read/list behavior still works
Information opens central modal and no detail box appears below table
self admin actions are disabled in UI
change role succeeds for another account
suspend revokes sessions and blocks login
unsuspend restores ability to log in
revoke sessions invalidates existing sessions
reset Cloud data deletes only target Cloud Drafts
admin audit rows are created
users without users.manage cannot call mutation APIs
last-active-super-admin protection works
pnpm generate succeeds
```
