# Prompt Draft Backend

This directory is the source of truth for backend and Docker integration work in Prompt Draft.

## Current branch

`feature/docker-local-api`

The backend remains intentionally independent from Nuxt server routes. Prompt Draft keeps its static-generation frontend workflow while the backend runs and can later deploy separately.

## Reusable API guide

New backend features should follow:

```text
docs/backend/API_GUIDE.md
```

That guide captures the reusable implementation path learned from the Docker/PostgreSQL, Wizard-run, Auth, and Cloud Draft work: resource design, numbered SQL files, parameterized DB functions, HTTP validation/CORS, typed frontend clients, local-first failure semantics, direct UI verification, and the static-generation invariant.

## Milestones 1–5 — complete

The completed backend learning/reference path established:

```text
Nuxt/client
  -> Docker API :4000
  -> Node HTTP server
  -> PostgreSQL
  -> Docker named volume prompt_draft_pgdata
```

The Wizard-run implementation remains the first fully verified historical-resource example:

```text
Portrait Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> paginated History API
  -> /history
  -> /history?run=<uuid>
```

It proved Docker networking, browser CORS, validation, durable PostgreSQL persistence, cursor pagination, typed client contracts, static routing, and UI recovery behavior.

## Milestone 6 — complete: Auth Foundation + Cloud Draft Sync

Milestone 6 applies the reusable API pattern to a product-useful editable resource: the drafts already maintained by `/create`.

The local editor remains the fast working source:

```text
prompt-draft:create-editor:drafts:v1
  -> activeDraftId
  -> PromptDraftRecord[]
  -> stable draft-* ids
  -> createdAt / updatedAt
  -> debounced local autosave
```

Cloud behavior now layers on top:

```text
/create local draft
  -> local save always remains available
  -> optional authenticated account
  -> manual Cloud Save or dirty-aware autosync
  -> PUT /api/drafts/:id
  -> account-owned PostgreSQL row
  -> GET /api/drafts on logged-in /create entry
  -> merge Cloud drafts with localStorage
  -> same-account multi-device recovery
```

Authentication is optional. Anonymous users can keep using Prompt Draft without an account. Signing in enables account-bound capabilities.

### Auth API

```text
POST /api/auth/identify
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

The first login screen step accepts username or email and identifies whether the account already exists. Existing users proceed to password entry; new users proceed to password + confirmation registration.

Current password policy is intentionally simple:

```text
minimum 8 characters
at least one English letter
at least one number
```

Passwords are hashed with Node `scrypt` plus a random salt. Raw passwords are never stored. Browser sessions use a random bearer token; only the SHA-256 token hash is stored in PostgreSQL.

### Cloud Draft API

```text
PUT /api/drafts/:id
  -> create/update one stable account-owned draft

GET /api/drafts/:id
  -> read one account-owned draft

GET /api/drafts
  -> paginated account-owned draft collection
```

Repeated saves for one `draft-*` id update the same logical resource and increment its server `revision`.

Cloud sync metadata is stored separately from canonical draft JSON under an account-scoped localStorage contract (`cloud-sync:v2`). This preserves the existing draft JSON import/export shape.

Autosync is dirty-aware rather than a blind timer write. A content fingerprint is compared with the last successful sync; unchanged drafts are skipped. A manual FAB beside Drafts performs immediate Cloud Save for the active draft.

On logged-in `/create` entry/refresh, the client fetches the account's Cloud Drafts and merges them into the local collection. Local-only drafts are preserved. Newly discovered same-account drafts from another browser/device become available in the Drafts menu.

Draft menu icons expose Cloud state without extra API requests:

```text
cloud_done / green  -> current local version matches Cloud
cloud_upload / orange -> Cloud exists but local changes are dirty
cloud_off / normal -> local-only for this account or anonymous
```

If the API is unavailable, local draft saving remains usable. Cloud failure is surfaced as sync state and can be retried later.

### Verified release invariants

The user locally verified registration, logout/login, account ownership, repeated draft updates/revisions, bidirectional same-account recovery between normal/Incognito browser contexts, preservation of local-only drafts, sync-state presentation, and successful `pnpm generate`.

`/login`, `/create`, `/history`, and the rest of the current static routes are included in the successful generated output.

## Still deferred platform/product work

- convert current Wizard-run `/history` to Draft History when selected;
- move the relevant History entry from the primary header into the Drafts menu as previously agreed;
- server-side Cloud Draft delete semantics;
- stronger multi-device conflict handling / optimistic revision enforcement;
- production auth rate limiting / abuse controls;
- email verification and password recovery;
- OAuth/social login;
- production migration framework;
- Redis;
- VPS deployment;
- production domain/HTTPS;
- production secrets/configuration.

A temporary `persistence_probe` table remains from the volume-learning phase and can be removed during a later cleanup step.

## Documentation workflow

`README.md` explains purpose, boundaries, and milestone scope.

`IMPLEMENTATION.md` contains concrete implementation decisions and verification sequence.

`STATUS.md` records what has actually been verified and what should happen next.

`API_GUIDE.md` is the reusable playbook for building future APIs without repeating the learning process.

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

For a new chat, read:

- `docs/backend/API_GUIDE.md`
- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
