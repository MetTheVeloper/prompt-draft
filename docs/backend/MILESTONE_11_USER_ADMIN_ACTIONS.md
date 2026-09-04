# Milestone 11 — User Administration Actions

Status: COMPLETE

## Goal

Turn the verified read-only `/manage/users` foundation into a real permission-gated administration surface while keeping backend authorization authoritative, protecting critical accounts, recording every successful mutation, and reusing the project Global Menu / Global Modal systems.

## Account status

Users have an explicit status:

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

Unsuspending allows future login again but does not restore revoked sessions.

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

The current backend role policy grants this through the `super_admin` wildcard only. `admin` remains read-only for Manage Users.

## Mutation endpoints

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

`reset-cloud-data` means exactly:

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

The UI also disables self-management actions, but that is only UX guidance. Backend checks remain mandatory.

## Manage Users UI

Each user row exposes the shared Global Menu through both the trailing action button and right-click context menu.

For callers with `users.manage`:

```text
Change role
Suspend account / Unsuspend account
Revoke sessions
Reset Cloud data
---
Information
```

For callers with only `users.view`, only read behavior is shown.

All mutations use the central Global Modal confirmation flow before calling the backend.

`Information` uses the existing detail API inside a central modal. The old inline/query detail box is not part of the final UX.

## Shared Manage section header

Structural section metadata lives in:

```text
app/config/manage.ts
```

Current structural fields:

```text
key
icon
route
requiredPermission
```

The shared `/manage` shell renders the active section heading and description using localized `manage.sections.<key>.*` keys. Child pages do not repeat their own heading blocks.

## Localization closure

All current action/menu/modal user-facing copy is localized through:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

Covered mutation surfaces include:

```text
Change role
Suspend / Unsuspend
Revoke sessions
Reset Cloud data
Information
Cancel / Close / Done
confirmation titles/descriptions
success messages
error fallbacks
self-management safety explanation
role labels
status labels
```

Raw API role/status values remain technical values for logic and are not used as display copy.

## UI consistency

The final Manage Users administration UI uses the project EL component system plus the shared Global Menu/Modal systems.

The mutation pattern is:

```text
row action / right-click
  -> Global Menu
  -> Global Modal confirmation
  -> backend mutation
  -> list refresh
  -> success/error message
```

This pattern is now documented for reuse in:

```text
docs/backend/MANAGE_GUIDE.md
```

## Local verification

The user locally confirmed:

```text
Information central modal
Change role
Suspend account
suspended-account login denial
Unsuspend account
Revoke sessions
Reset Cloud data
admin audit-log writes
Profile Menu follow-up UI
final English/Persian Manage action copy
```

The observed audit output included successful suspend, unsuspend, and Cloud-data reset records with expected actor/target metadata.

## Static-generation verification

Final branch-level static generation also passed after the Manage localization closure:

```text
pnpm generate succeeds
16 initial routes prerendered
/manage/users remains present
.output/public generated
offline manifest generated
```

Milestone 11 is complete.
