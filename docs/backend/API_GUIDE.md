# Prompt Draft — New API Implementation Guide

This document is the reusable source of truth for adding product APIs to Prompt Draft after the Docker/PostgreSQL learning milestones.

The goal is to avoid rediscovering backend integration details for every feature. New APIs should normally be implemented as one vertical slice from storage to UI, using the conventions below.

## Architecture baseline

Prompt Draft currently uses:

```text
static-generated Nuxt frontend
  -> direct browser HTTP calls
  -> independent Dockerized Node API :4000
  -> PostgreSQL service db:5432
  -> Docker named volume
```

Important consequences:

- do not add Nuxt server API routes for product persistence;
- browser CORS is part of every new API contract;
- `NUXT_PUBLIC_API_BASE` remains the frontend API boundary;
- PostgreSQL is the durable server store;
- `pnpm generate` must continue to succeed;
- backend failure must not silently destroy valid local/product state.

## 1. Start from the product resource, not the HTTP route

Before writing code, define the resource in product terms:

```text
What is being stored?
What is its stable identity?
Who owns the identity: client or server?
Which fields are first-class/queryable?
Which fields belong in JSONB?
Is the operation create-only, updateable, or idempotent sync?
What should happen if the backend is unavailable?
```

Do not model a temporary UI event if the product actually cares about a durable resource.

Examples:

```text
Wizard completion event -> wizard_runs (append-only historical record)
Editable local prompt      -> draft resource (stable id, updateable/syncable)
```

## 2. Choose write semantics deliberately

Use HTTP semantics that match the resource:

```text
POST /api/resources
  -> create a new server-owned resource

PUT /api/resources/:id
  -> create-or-replace/upsert a resource with a stable known id
  -> preferred for idempotent client/server sync

PATCH /api/resources/:id
  -> partial mutation only when partial-update semantics are genuinely needed

DELETE /api/resources/:id
  -> explicit deletion contract; do not infer delete from local disappearance
```

For local-first sync, prefer an idempotent `PUT` so retrying the same request does not create duplicate rows.

## 3. Decide identifier ownership

### Server-owned id

Use when the server creates a new historical resource:

```text
POST
server randomUUID()
201 Created
```

### Client-owned stable id

Use when the browser already has a durable local identity that must map to the same server resource across repeated syncs:

```text
PUT /api/resources/:localId
same local id -> same server row
```

Do not generate a fresh server resource for every autosave of the same logical item.

## 4. Add schema as a numbered SQL file

Schema files live under:

```text
backend/sql/
```

Use lexical numbering:

```text
001_create_wizard_runs.sql
002_create_prompt_drafts.sql
003_...
```

Rules:

- new schema work gets a new numbered file;
- SQL should be safe to apply to an existing development database;
- prefer explicit constraints (`NOT NULL`, checks, PK/unique constraints);
- queryable metadata should be first-class columns;
- large structured application state can be JSONB;
- do not rewrite an already-applied schema file to represent a new change;
- a production-grade migration framework is still a separate future concern.

The development schema runner must apply all numbered SQL files in lexical order.

## 5. Keep database code behind `database.mjs`

HTTP handlers should not contain raw SQL.

Database functions should:

- use parameterized SQL for every runtime value;
- map PostgreSQL timestamps to ISO strings before returning API records;
- serialize JSON values explicitly when writing JSONB;
- return `null` for a missing single resource rather than throwing;
- expose collection pagination semantics rather than leaking raw `pg` results.

Example shape:

```text
upsertResource(resource)
getResourceById(id)
listResources(params)
```

Never interpolate user/client input directly into SQL fragments.

## 6. Validate at the HTTP boundary

For every write endpoint:

```text
1. verify Content-Type when JSON is required
2. parse JSON
3. validate body shape
4. normalize strings/timestamps/known versions
5. call database function
6. return a stable response shape
```

Prefer structured client errors:

```json
{
  "ok": false,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "title must be a non-empty string" }
  ]
}
```

Common status semantics:

```text
200 successful read/update
201 successful create
400 malformed input/query/id
404 valid resource id not found
409 explicit version/conflict condition
415 wrong Content-Type
500 unexpected backend failure
503 dependency unavailable when that distinction is useful
```

Do not expose PostgreSQL error text to the browser.

## 7. Keep CORS in sync with new HTTP methods

The API is called directly by the browser.

When adding methods such as `PUT`, `PATCH`, or `DELETE`, update:

```text
Access-Control-Allow-Methods
```

and test the browser preflight, not only command-line `curl`.

## 8. Separate collection and detail contracts when records are large

If a resource contains large JSON/output data, collection endpoints should return summaries and detail endpoints should return the full record.

Example:

```text
GET /api/resources
  -> id, title, updatedAt

GET /api/resources/:id
  -> id, title, updatedAt, large state/json
```

Do not make every list request transfer full historical/application state unless the UI genuinely needs it.

For growing collections use stable keyset/cursor pagination rather than unbounded reads or public offset pagination.

## 9. Add frontend types before UI wiring

Frontend API contracts live in typed files under `app/types/`.

Define explicit input/response types rather than using domain state directly by accident.

Then expose the HTTP call through the shared frontend API composable (`usePromptDraftApi`) or a focused composable when the resource warrants it.

The UI should not construct backend URLs or `$fetch` calls ad hoc.

## 10. Preserve local-first behavior where local state already exists

When a feature already has valid local persistence:

```text
local state = working state
server      = durable synced copy
```

A failed server sync must not erase or block valid local work.

Recommended sync behavior:

```text
local change
  -> save locally immediately/debounced
  -> mark resource dirty
  -> sync later/manual
  -> success: mark synced
  -> failure: keep local state + expose retry/error status
```

Avoid blind interval writes. Autosync should compare a content fingerprint/version and skip unchanged resources.

## 11. UI sync status should be observable

For user-triggered or background writes, expose useful states such as:

```text
dirty
syncing
synced
failed
```

A manual Save/Sync action should use the same write path as autosync rather than duplicate persistence logic.

## 12. Static generation is a release invariant

Every frontend-integrated API feature must preserve:

```text
pnpm generate
```

Do not rely on arbitrary dynamic server-rendered routes for persisted resource ids. For pure static hosting, prefer a generated static shell plus client-side query state where appropriate.

## 13. Verification order for a new API

The default fast path is now:

```text
A. schema
  -> apply numbered SQL files

B. backend
  -> write/read contract exists
  -> invalid input is structured

C. frontend boundary
  -> typed API client compiles

D. real UI
  -> perform the write from the product UI
  -> inspect browser Network request/response
  -> verify read-back from the UI/API

E. failure semantics
  -> stop API when relevant
  -> local/product state remains usable
  -> retry recovers after API returns

F. durability
  -> recreate API + DB containers when persistence durability matters
  -> same resource remains readable

G. static build
  -> pnpm generate succeeds
```

`curl` and direct SQL remain useful diagnostics, but once the reusable backend pattern is established they are not the primary product acceptance path. Prefer real UI verification for the final contract.

## 14. Documentation/status rule

For backend milestones maintain:

```text
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/STATUS.md
```

`API_GUIDE.md` is the reusable implementation playbook; milestone docs record the concrete feature decisions and verified state.

A phase is marked `DONE` only after the user performs the relevant local/product verification and explicitly confirms the result.

## New API checklist

Use this checklist before calling a feature complete:

```text
[ ] resource and ownership semantics defined
[ ] stable id strategy defined
[ ] write method chosen intentionally (POST/PUT/PATCH)
[ ] numbered SQL file added
[ ] development schema runner applies it
[ ] parameterized database functions added
[ ] HTTP validation/normalization added
[ ] CORS methods updated
[ ] stable success/error response types defined
[ ] frontend TypeScript contract added
[ ] frontend API composable method added
[ ] real UI uses the API
[ ] local-first failure semantics preserved where applicable
[ ] browser preflight/request tested
[ ] persistence/read-back tested
[ ] `pnpm generate` tested
[ ] milestone docs/status updated
```
