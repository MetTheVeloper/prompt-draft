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
  -> optional private backend services
  -> Docker named volumes
```

Important consequences:

- do not add Nuxt server API routes for product persistence/capabilities;
- browser CORS is part of every new API contract;
- `NUXT_PUBLIC_API_BASE` remains the frontend API boundary;
- PostgreSQL is the durable server store;
- `pnpm generate` must continue to succeed;
- backend failure must not silently destroy valid local/product state;
- authenticated privilege is enforced by backend permissions, never by hidden UI alone.

## 1. Start from the product resource, not the HTTP route

Before writing code, define the resource in product terms:

```text
What is being stored?
What is its stable identity?
Who owns the identity: client or server?
Who owns/accesses the resource?
Which fields are first-class/queryable?
Which fields belong in JSONB?
Is the operation create-only, updateable, or idempotent sync?
What should happen if the backend is unavailable?
```

Do not model a temporary UI event if the product actually cares about a durable resource.

Examples:

```text
Wizard completion event -> wizard_runs (append-only historical record)
Editable local prompt   -> draft resource (stable id, updateable/syncable)
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

## 5. Keep database code behind a database boundary

HTTP handlers should not contain ad-hoc unsafe SQL.

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
5. call the backend/data function
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
401 authentication required
403 authenticated but not authorized
404 valid resource id not found
409 explicit version/conflict condition
415 wrong Content-Type
500 unexpected backend failure
503 dependency unavailable when that distinction is useful
```

Do not expose PostgreSQL/internal dependency error text to the browser.

## 7. Keep CORS in sync with new HTTP methods/headers

The API is called directly by the browser.

When adding methods such as `PUT`, `PATCH`, or `DELETE`, update:

```text
Access-Control-Allow-Methods
```

When adding bearer-authenticated endpoints, ensure the authorization header is allowed.

Test the browser preflight, not only command-line `curl`.

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

## 12. Add authorization as a permission contract, not scattered role checks

When a capability is not public, define its permission before wiring UI.

Current reusable model:

```text
users.role
  -> backend role-to-permission resolver
  -> resolved permissions returned with auth session
  -> frontend can(permission)
```

Supported foundation roles are currently:

```text
user
admin
super_admin
```

`super_admin` may resolve wildcard `*`, but runtime business code should still ask for a permission rather than checking usernames or special account ids.

Prefer:

```text
can('dashboard.view')
```

over:

```text
role === 'admin' || role === 'super_admin'
```

except for convenience presentation helpers such as `isAdmin`/`isSuperAdmin`.

### Three-layer authorization rule

Protected product/admin features should normally enforce the same permission in three places:

```text
1. UI visibility
   -> hide/disable unavailable actions for clarity

2. route middleware
   -> block unauthorized client navigation

3. backend guard
   -> authoritative security boundary
```

The backend check is mandatory. Hidden UI and route middleware are not security controls by themselves.

Use response semantics consistently:

```text
missing/invalid session -> 401
valid session without permission -> 403
```

The frontend should consume resolved permissions returned by Auth rather than duplicating the backend role-to-permission mapping.

## 13. Static generation is a release invariant

Every frontend-integrated API feature must preserve:

```text
pnpm generate
```

Do not rely on arbitrary dynamic server-rendered routes for persisted resource ids. For pure static hosting, prefer a generated static shell plus client-side query state where appropriate.

If a new protected static route is introduced, explicitly verify that it appears in the prerender output while runtime middleware still controls client access.

## 14. Verification order for a new API

The default fast path is now:

```text
A. schema
  -> apply numbered SQL files

B. backend
  -> write/read contract exists
  -> invalid input is structured
  -> auth/permission guard exists when required

C. frontend boundary
  -> typed API client compiles
  -> auth permission helper is used when required

D. real UI
  -> perform the behavior from the product UI
  -> inspect browser Network request/response
  -> verify read-back from the UI/API

E. authorization (when protected)
  -> permitted account succeeds
  -> normal account cannot see privileged UI
  -> direct route access fails
  -> direct backend call fails with 403

F. failure semantics
  -> stop API/dependency when relevant
  -> local/product state remains usable where applicable
  -> retry/recovery works

G. durability
  -> recreate API + DB containers when persistence durability matters
  -> same resource remains readable

H. static build
  -> pnpm generate succeeds
  -> new static route is included when applicable
```

`curl`, Console fetches, and direct SQL remain useful diagnostics/security verification, but once the reusable backend pattern is established the primary product acceptance path should be real UI verification.

## 15. Documentation/status rule

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
[ ] parameterized database/data functions added
[ ] HTTP validation/normalization added
[ ] CORS methods/headers updated
[ ] stable success/error response types defined
[ ] authentication requirement defined
[ ] permission contract defined when protected
[ ] backend permission guard added when protected
[ ] frontend TypeScript contract added
[ ] frontend API composable method added
[ ] permission-gated UI/route behavior added when protected
[ ] real UI uses the API
[ ] local-first failure semantics preserved where applicable
[ ] browser preflight/request tested
[ ] persistence/read-back tested
[ ] permitted account behavior tested when protected
[ ] unauthorized direct route/API access tested when protected
[ ] `pnpm generate` tested
[ ] new static route appears in prerender output when applicable
[ ] milestone docs/status updated
```
