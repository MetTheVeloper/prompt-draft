# Backend Implementation Plan

## Architecture baseline

Milestones 1 through 5 are complete and locally verified.

Current verified platform path:

```text
static Nuxt frontend :3030
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> validation + normalization
  -> PostgreSQL client/pool
  -> db:5432
  -> Docker named volume
```

The backend remains independent from Nuxt server routes so static generation remains supported.

Reusable implementation conventions now live in:

```text
docs/backend/API_GUIDE.md
```

## Completed reference implementation — Wizard runs

The Wizard-run flow remains the first fully verified backend example:

```text
real Wizard finish
  -> POST /api/wizard-runs
  -> durable PostgreSQL row
  -> cursor-paginated summary API
  -> full detail API
  -> typed frontend boundary
  -> /history + query-based detail
```

It proved Docker networking, CORS, validation, PostgreSQL persistence, named-volume durability, client/server contracts, static routing, and UI recovery behavior.

Wizard runs are append-only historical resources. Milestone 6 intentionally uses different write semantics because editable drafts are stable resources rather than completion events.

## Schema workflow

The development schema runner now discovers all files matching:

```text
backend/sql/NNN_*.sql
```

and applies them in lexical order.

Current files:

```text
001_create_wizard_runs.sql
002_create_prompt_drafts.sql
```

This removes the previous one-file hardcoding and makes new development API resources repeatable.

A production-grade migration framework remains deferred. New development schema changes should still use new numbered files rather than rewriting already-applied schema history.

## Milestone 6 — Cloud Draft Sync

### Product goal

The `/create` page already has a useful local draft system. Milestone 6 makes those editable drafts durable on the backend without replacing local-first behavior.

Existing local contract:

```text
PromptDraftCollection version 1
  activeDraftId
  drafts: PromptDraftRecord[]

PromptDraftRecord
  id
  title
  createdAt
  updatedAt
  PromptDraftState fields
```

The current editor saves locally with a short debounce. That remains the fast working-state persistence layer.

New target path:

```text
editor change
  -> existing localStorage save
  -> content differs from last successful cloud fingerprint
  -> dirty
  -> manual FAB or two-minute autosync
  -> PUT /api/drafts/:id
  -> prompt_drafts
```

### Resource identity decision

Draft ids are client-owned because `/create` already assigns a stable local id:

```text
draft-<timestamp>-<random>
```

That same id identifies the server resource.

This is important: repeated autosaves of one draft must update one row rather than create a new historical record.

### Server schema

`prompt_drafts`:

```text
draft_id          TEXT primary key
 title             TEXT
 created_at        TIMESTAMPTZ
 client_updated_at TIMESTAMPTZ
 server_updated_at TIMESTAMPTZ
 revision          BIGINT
 snapshot          JSONB
```

`revision` increments on each successful PUT. It is returned now as future-compatible metadata; Milestone 6 MVP does not yet reject writes based on revision conflicts.

An index supports newest client-updated ordering for a later server collection endpoint:

```text
(client_updated_at DESC, draft_id DESC)
```

### API write contract

```text
PUT /api/drafts/:id
```

Request:

```json
{
  "title": "Portrait draft",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "snapshot": {
    "version": 1,
    "selectedModuleKeys": [],
    "moduleValues": {},
    "modulePanelStates": {},
    "promptSettings": {},
    "outputFormat": "modular"
  }
}
```

Response:

```json
{
  "ok": true,
  "draft": {
    "id": "draft-...",
    "title": "Portrait draft",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "serverUpdatedAt": "ISO timestamp",
    "revision": 1,
    "snapshot": {}
  }
}
```

Semantics:

```text
first PUT for id      -> INSERT
later PUT for same id -> UPDATE same row + revision increment
```

The endpoint is idempotent at the resource-identity level: retrying does not create another logical draft.

### API detail contract

```text
GET /api/drafts/:id
```

Semantics:

```text
existing id -> 200 full server draft
missing id  -> 404
invalid id  -> 400
```

### Validation boundary

The HTTP API validates:

```text
id -> non-empty decoded path id, max 200, no control chars
title -> non-empty, max 500
createdAt / updatedAt -> valid timestamps
snapshot.version -> 1
selectedModuleKeys -> string[]
moduleValues -> object
modulePanelStates -> object
promptSettings -> object
outputFormat -> modular | natural | json
```

Only the known snapshot envelope survives normalization.

### CORS

Direct browser sync adds `PUT`, so allowed methods now include:

```text
GET, POST, PUT, OPTIONS
```

Browser preflight is part of final UI acceptance.

### Frontend typed boundary

Added:

```text
app/types/draftSyncApi.ts
```

Types:

```text
UpsertPromptDraftInput
SyncedPromptDraftRecord
UpsertPromptDraftResponse
GetPromptDraftResponse
```

`usePromptDraftApi()` now exposes:

```text
upsertPromptDraft(id, input)
getPromptDraft(id)
```

The UI does not construct API URLs directly.

### Sync metadata boundary

Canonical local draft JSON remains unchanged.

Cloud metadata is stored separately under:

```text
prompt-draft:create-editor:cloud-sync:v1
```

Per-draft sync metadata contains:

```text
fingerprint
syncedAt
revision
```

This keeps backend metadata out of existing draft export/import JSON.

### Dirty detection

The sync fingerprint is based on content:

```text
id
 title
 PromptDraftState
```

It deliberately excludes `createdAt` / `updatedAt` so incidental local save timestamps do not trigger unnecessary server writes.

Autosync scans the local draft collection every two minutes and uploads only records whose fingerprint differs from the last successful server sync.

If multiple local drafts became dirty before the interval, the scan can persist each dirty draft rather than only the currently active one.

### Manual FAB

A cloud-save FAB is mounted only on `/create` and placed adjacent to the existing Drafts control.

States:

```text
dirty   -> cloud upload
syncing -> sync
synced  -> cloud done
failed  -> cloud off / retry by click
```

Manual click forces the active draft to sync even if its fingerprint already matches the previous successful write.

The control waits briefly for the editor's existing debounced local save to settle before reading the active local draft.

### Failure semantics

Cloud persistence does not replace the local save path.

If backend sync fails:

```text
local draft remains intact and editable
cloud status becomes failed
manual click can retry
future autosync can retry dirty drafts
```

No local draft is removed because of a server error.

### MVP boundaries

Not part of this milestone's first slice:

```text
authentication / ownership
remote collection UI
server -> local restore
server-side delete
multi-device merge
revision conflict enforcement
```

Those capabilities require explicit product semantics rather than being inferred from local save behavior.

## Milestone 6 phases

### Phase 0 — reusable API playbook + Cloud Draft contract: IMPLEMENTED, AWAITING USER VERIFICATION

Implemented:

```text
docs/backend/API_GUIDE.md
resource/id/write/failure semantics documented
```

### Phase 1 — schema + backend PUT/GET: IMPLEMENTED, AWAITING USER VERIFICATION

Implemented:

```text
generic numbered schema runner
002_create_prompt_drafts.sql
upsertPromptDraft()
getPromptDraftById()
PUT /api/drafts/:id
GET /api/drafts/:id
PUT CORS support
```

### Phase 2 — typed client + manual `/create` sync: IMPLEMENTED, AWAITING USER VERIFICATION

Implemented:

```text
draftSyncApi.ts
usePromptDraftApi draft methods
cloud-save FAB and localized status
```

### Phase 3 — dirty-aware autosync: IMPLEMENTED, AWAITING USER VERIFICATION

Implemented:

```text
content fingerprints
separate sync metadata
2-minute dirty scan
skip unchanged drafts
local-first error behavior
```

### Phase 4 — final product E2E/static/durability: NOT STARTED

Required before Milestone 6 can be complete:

```text
apply schema
open /create with API running
edit active draft
manual FAB -> browser PUT succeeds
same draft id -> repeated save updates same PostgreSQL row
change content -> dirty state returns
autosync persists dirty content without duplicate logical rows
API down -> local draft continues saving + cloud status fails gracefully
API restart -> manual/autosync retry succeeds
GET read-back matches local saved content
container recreation retains server copy
pnpm generate succeeds
```

No Milestone 6 phase is `DONE` until the user locally verifies and confirms the relevant behavior.
