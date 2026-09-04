# Prompt Draft Backend

This directory is the source of truth for backend and Docker integration work in Prompt Draft.

## Current branch

`feature/docker-local-api`

The backend remains intentionally independent from Nuxt server routes. Prompt Draft can continue to use its static-generation frontend workflow while the backend is developed and deployed separately.

## Reusable API guide

New backend features should follow:

```text
docs/backend/API_GUIDE.md
```

That guide captures the reusable implementation path learned from the Docker/PostgreSQL and Wizard-run milestones: resource design, numbered SQL files, parameterized DB functions, HTTP validation/CORS, typed frontend clients, local-first failure semantics, direct UI verification, and the static-generation invariant.

## Milestones 1–5 — complete

The completed backend learning/product path established:

```text
Nuxt/client
  -> Docker API :4000
  -> Node HTTP server
  -> pg connection pool
  -> PostgreSQL
  -> Docker named volume prompt_draft_pgdata
```

It also verified a real product vertical slice:

```text
Portrait Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> paginated History API
  -> /history
  -> /history?run=<uuid>
```

Verified capabilities include:

- direct browser CORS/preflight;
- structured JSON validation/errors;
- server-owned historical UUIDs;
- PostgreSQL named-volume durability;
- parameterized SQL;
- typed frontend API contracts;
- cursor pagination;
- summary/detail separation;
- graceful backend failure states;
- English/Persian History UI;
- static generation with `pnpm generate`.

Wizard-run History remains available as a verified example, but it is not the model for every product resource. Editable resources should use stable identities and update/sync semantics rather than append a new historical row for every save.

## Milestone 6 — in progress: Cloud Draft Sync

Milestone 6 applies the reusable API guide to a product-useful resource: the drafts already edited and stored locally by `/create`.

Current local behavior already provides:

```text
prompt-draft:create-editor:drafts:v1
  -> activeDraftId
  -> PromptDraftRecord[]
  -> stable draft-* ids
  -> createdAt / updatedAt
  -> debounced local autosave
```

Milestone 6 keeps that local persistence as the working source of truth and adds a durable server mirror.

Target behavior:

```text
/create edit
  -> existing fast local save
  -> draft becomes dirty for cloud sync
  -> manual FAB or two-minute autosync
  -> PUT /api/drafts/:draftId
  -> PostgreSQL prompt_drafts
  -> same draft id updates the same row
```

Current API contract:

```text
PUT /api/drafts/:id
  -> idempotent create/update of one stable local draft

GET /api/drafts/:id
  -> read back the stored server copy
```

The server stores queryable metadata separately from the canonical draft snapshot:

```text
draft_id
 title
 created_at
 client_updated_at
 server_updated_at
 revision
 snapshot JSONB
```

The browser keeps cloud-sync metadata in a separate localStorage key so server metadata does not pollute the existing draft JSON export/import contract.

Autosync is dirty-aware rather than a blind interval write. A content fingerprint is compared with the last successful sync; unchanged drafts are skipped. Every two minutes the client scans locally saved drafts and uploads only dirty records. The FAB next to Drafts forces an immediate save of the active draft.

If the API is unavailable, existing local draft saving remains usable. Server sync failure is surfaced as sync state and can be retried.

### Intentionally deferred from Milestone 6 MVP

- authentication and user ownership;
- multi-device merge/conflict resolution;
- enforcing optimistic revision conflicts;
- server-to-local restore/import;
- server-side delete semantics;
- remote draft collection/list UI.

The server already returns a monotonically increasing `revision` so a later conflict policy can build on the contract without changing the local draft state shape.

## Still deferred platform work

- authentication;
- users/user ownership;
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
