# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestones 1–5 — COMPLETE

The Docker/PostgreSQL backend foundation and Wizard-run reference implementation are complete and locally verified.

Verified platform path:

```text
static Nuxt frontend
  -> direct browser CORS
  -> Docker Node API :4000
  -> PostgreSQL
  -> named-volume durability
```

Milestone 5 History / Read API + UX is closed.

## Reusable API playbook — ADDED

Reusable API implementation guidance lives in:

```text
docs/backend/API_GUIDE.md
```

It captures resource-first API design, numbered SQL schema files, parameterized DB access, CORS, typed frontend boundaries, local-first failure semantics, direct UI verification, and `pnpm generate` as a release invariant.

## Milestone 6 — IN PROGRESS: Cloud Draft Sync

Goal:

```text
existing /create local drafts
  -> remain local-first
  -> dirty-aware server sync
  -> manual FAB + 2-minute autosync
  -> durable PostgreSQL prompt_drafts rows
  -> account-scoped cloud ownership
  -> multi-device recovery
```

Existing local source remains:

```text
prompt-draft:create-editor:drafts:v1
```

Cloud sync metadata is account-scoped and kept separate from canonical draft JSON.

Implemented:

```text
backend/sql/002_create_prompt_drafts.sql
backend/sql/004_scope_prompt_drafts_to_users.sql
PUT /api/drafts/:id
GET /api/drafts/:id
GET /api/drafts
app/types/draftSyncApi.ts
app/components/create/DraftCloudSyncButton.vue
manual save FAB beside Drafts
dirty/syncing/synced/failed states
2-minute dirty-aware autosync
account ownership via user_id
account-scoped cloud list
cloud/local merge on /create
```

Locally verified:

```text
Cloud Save writes successfully
Cloud Save FAB placement beside Drafts
prompt_drafts.user_id matches the authenticated users.id
same-account draft writes from incognito reach PostgreSQL
revision increments correctly on repeated writes
logged-in /create issues GET /api/drafts on entry/refresh
Cloud Drafts created/synced in one browser context appear in the other same-account context
local-only drafts are preserved during Cloud merge
```

### Drafts menu Cloud status — AWAITING USER VERIFICATION

Draft entries in the existing Drafts dropdown now derive their icon/color from account-scoped sync metadata when the menu opens:

```text
cloud_done / green
  -> current local draft fingerprint matches the saved Cloud version

cloud_upload / orange
  -> this account has a Cloud version, but the local draft has unsynced changes

cloud_off / normal
  -> the draft is local-only for the current account (or the user is anonymous)
```

This is presentation-only and does not add extra API requests; the menu reads the same per-account local sync metadata already maintained by Cloud Save/restore.

Do not mark this final Cloud Draft UI polish verified until the user confirms the icons change as expected for local-only, synced, and dirty-after-sync drafts.

## Auth Foundation — RUNTIME VERIFIED / STATIC CHECK PENDING

Authentication remains optional at the product level. Anonymous users can continue to use Prompt Draft normally. Signing in enables account-bound capabilities such as Cloud Draft ownership and multi-device recovery.

Runtime behavior locally confirmed by the user:

```text
account registration
logout
existing-account login
header auth controls/profile behavior
```

Auth security contract:

```text
password hashing     -> Node scrypt + random salt
raw password         -> never stored
session token        -> random 32-byte bearer token
browser token store  -> localStorage (explicit product decision)
DB session storage   -> SHA-256 hash of bearer token only
session lifetime     -> 30 days
```

MD5 and IP-based identity are not used.

Auth API:

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

`pnpm generate` verification for the Auth/Cloud Draft changes remains pending before closing the foundation completely.

## Current intentional debt / deferred work

- final Drafts-menu Cloud-status icon verification;
- convert `/history` from Wizard runs to Draft History;
- remove History from primary header navigation and add it to Drafts menu;
- production auth rate limiting / abuse controls;
- email verification;
- password reset/recovery;
- OAuth/social login;
- advanced multi-device conflict resolution beyond deterministic `updatedAt` merge;
- optimistic revision conflict enforcement;
- server-side draft delete semantics;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Locally verify the three Drafts-menu Cloud status states, then run `pnpm generate`. After that, close the Auth/Cloud Draft foundation and continue with converting `/history` from Wizard runs to Draft History and moving the History entry from the primary header into the Drafts menu.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
