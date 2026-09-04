# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestones 1–5 — COMPLETE

The Docker/PostgreSQL backend foundation, durable Wizard runs, History read API/UX, and static-generation path are complete and locally verified.

Reusable API implementation guidance lives in:

```text
docs/backend/API_GUIDE.md
```

## Milestone 6 — IN PROGRESS: Account-aware Cloud Drafts

Product rule:

```text
login is optional
anonymous editing/local drafts remain available
account-bound Cloud Draft capabilities require login
```

Canonical local draft source remains:

```text
prompt-draft:create-editor:drafts:v1
```

### Auth Foundation — RUNTIME VERIFIED / STATIC CHECK PENDING

Implemented:

```text
backend/sql/003_create_auth.sql
backend/src/auth.mjs
app/types/auth.ts
app/composables/useAuth.ts
app/pages/login.vue
app/components/auth/AuthProfileMenu.vue
app/components/Header.vue
i18n/locales/auth.en.ts
i18n/locales/auth.fa.ts
```

Security contract:

```text
password hashing     -> Node scrypt + random salt
raw password         -> never stored
session token        -> random 32-byte bearer token
browser token store  -> localStorage
DB session storage   -> SHA-256 hash of bearer token only
session lifetime     -> 30 days
```

User-confirmed local runtime behavior:

```text
account creation works
logout works
existing-account login works again
no reported runtime errors
```

Still required before marking the whole Auth Foundation `DONE`:

```text
pnpm generate
confirm /login is included in the generated static build
```

## Cloud Draft ownership + recovery — AWAITING USER VERIFICATION

Goal:

```text
local-first /create drafts
  -> explicit account association through Cloud Save
  -> account-scoped server rows
  -> account-scoped autosync
  -> GET /api/drafts for the current user
  -> merge Cloud drafts back into localStorage on /create
  -> multi-device recovery without deleting local-only drafts
```

### Database ownership migration

Implemented:

```text
backend/sql/004_scope_prompt_drafts_to_users.sql
```

Behavior:

```text
prompt_drafts.user_id -> FK users(id), ON DELETE CASCADE
primary key            -> (user_id, draft_id)
user/update index      -> (user_id, client_updated_at DESC, draft_id DESC)
```

Pre-auth Cloud Draft rows have no trustworthy owner. Migration 004 deletes only those unowned server rows before making `user_id` mandatory.

Important:

```text
localStorage drafts are not deleted by the migration
```

A local draft can be uploaded again under the correct account with Manual Cloud Save.

### Protected Cloud Draft API

Implemented through:

```text
backend/src/cloudDrafts.mjs
backend/src/auth.mjs
backend/src/database.mjs
```

Account-scoped endpoints:

```text
GET /api/drafts
GET /api/drafts/:id
PUT /api/drafts/:id
```

All three require a valid bearer session.

Unauthorized request:

```text
401 Authentication required
```

Detail reads are scoped by both:

```text
user_id + draft_id
```

so another account's draft is not exposed by id.

`GET /api/drafts` uses keyset pagination:

```text
default limit 50
min 1
max 100
ordering client_updated_at DESC, draft_id DESC
opaque cursor updatedAt + id
```

The list intentionally returns full draft snapshots because the current consumer is recovery/rehydration.

### Frontend account-scoped sync metadata

Implemented:

```text
app/utils/draftCloudSync.ts
prompt-draft:create-editor:cloud-sync:v2
```

Metadata is separated by account id.

This prevents this unsafe behavior:

```text
user A syncs local drafts
logout
user B logs in on the same browser
old local drafts auto-upload to user B
```

New rule:

```text
Manual Cloud Save
  -> may associate the active local draft with the current account

Autosync
  -> only processes drafts already associated with the current account
```

Legacy v1 sync metadata is not trusted for an account and is removed when v2 metadata is written.

### Cloud recovery bridge

Implemented:

```text
app/components/create/DraftCloudRestoreBridge.vue
app/layouts/default.vue
app/composables/usePromptDraftApi.ts
app/types/draftSyncApi.ts
```

On `/create` while logged in:

```text
initialize auth
fetch all current-user Cloud Draft pages
merge into prompt-draft:create-editor:drafts:v1
preserve local-only drafts
same id -> newest updatedAt wins
preserve active local draft when possible
write account-scoped sync metadata
emit prompt-draft:create-editor:collection-refresh
```

Cloud read failure does not overwrite or remove the local collection.

### Cloud Save button behavior

`DraftCloudSyncButton.vue` is now account-aware.

Anonymous:

```text
Cloud control behaves as a Login action
no autosync requests are sent
```

Logged in:

```text
manual save -> authenticated PUT + account association
autosync -> current account's associated dirty drafts only
status -> dirty / syncing / synced / failed
```

## Required local verification for this phase

Do not mark Cloud Draft ownership/recovery `DONE` until the user confirms:

```text
1. docker compose rebuild succeeds
2. db:schema applies 004_scope_prompt_drafts_to_users.sql
3. app works anonymously without Cloud API spam
4. anonymous Cloud control sends user to /login
5. logged-in Manual Cloud Save succeeds
6. prompt_drafts row has the current user's user_id
7. GET /api/drafts with the current bearer token returns only that account's drafts
8. edit a synced draft -> autosync updates the same account row/revision
9. logout -> autosync stops
10. login again -> Cloud draft is restored/merged into /create
11. local-only draft is not deleted by recovery
12. second account does not automatically receive first account's local drafts
13. pnpm generate succeeds
```

## Next product work after verification

Planned direction:

```text
convert /history from Wizard-run history to Draft History
remove History from primary header navigation
add History inside the Drafts menu
consider server-side delete semantics
then address real multi-device conflict policy beyond newest-updatedAt
```

## Deferred / intentional debt

- production auth rate limiting / abuse controls;
- email verification;
- password reset/recovery;
- OAuth/social login;
- true multi-device conflict resolution;
- optimistic revision conflict enforcement;
- server-side draft delete semantics;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Locally verify the account-scoped Cloud Draft vertical slice from migration 004 -> authenticated Cloud Save -> account list -> logout/login recovery -> static generation.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
