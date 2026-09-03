# Backend Implementation Plan

## Architecture baseline

Milestones 1, 2, 3, and 4 are complete and locally verified.

Current verified product/backend path:

```text
Nuxt frontend :3030
  -> real Portrait Wizard finish()
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> request parsing + validation
  -> PostgreSQL client/pool
  -> db:5432
  -> wizard_runs
  -> Docker named volume
```

The backend remains independent from Nuxt server routes, so the frontend can continue to use static generation.

## Milestone 4 — COMPLETE: real Wizard integration

Milestone 4 moved persistence from a development Home learning hook into the actual Wizard success flow and hardened the client/server contract.

### Phase 0 — server-owned field hardening: DONE

The API constructs an allowlisted run shape. Server-generated `id` and `createdAt` cannot be overridden by request fields, `wizardId` is normalized, and unknown request keys are excluded.

### Phase 1 — snapshot contract v1: DONE

Successful-run snapshot:

```json
{
  "schemaVersion": 1,
  "session": {
    "currentStepId": "review",
    "answers": {},
    "derived": {}
  },
  "finalDraft": {
    "version": 1
  }
}
```

`wizardId`, `wizardVersion`, `output`, `id`, and `createdAt` remain first-class run fields outside the snapshot.

`answers` and `derived` capture Wizard decision state. `finalDraft` captures the exact successful product artifact. Intermediate `workingDraft` is intentionally excluded from successful-run history.

The backend validates the snapshot envelope without duplicating every nested frontend domain validator.

### Phase 2 — frontend API boundary/configuration: DONE

Nuxt public runtime config:

```text
NUXT_PUBLIC_API_BASE
  -> runtimeConfig.public.apiBase
```

Reusable frontend boundary:

```text
app/composables/usePromptDraftApi.ts
```

Typed contracts:

```text
app/types/wizardRunApi.ts
```

The browser client exposes `hello()`, `createWizardRun(input)`, and `listWizardRuns()` while product code avoids duplicated local URLs.

Static generation remains supported and no Nuxt server routes are introduced.

### Phase 3 — persist on successful Wizard completion: DONE

The canonical persistence event is successful `finish()` in:

```text
app/pages/wizard/[wizardId].vue
```

Flow:

```text
runtime.complete(session)
  -> if failure: existing Wizard error, no history row
  -> finalDraft + promptPreview
  -> preserve completed artifact locally
  -> save local Wizard session
  -> createWizardRun(snapshot v1)
```

The user verified the real Portrait Wizard creates a PostgreSQL row with Wizard version 2, snapshot version 1, `review` step, finalDraft version 1, and the actual compiled prompt output.

Persistence failure semantics are intentionally weaker than prompt-generation semantics:

```text
compile success + persistence failure
  -> completed Ready artifact remains usable
  -> persistence warning shown
  -> no new history row
```

That failure behavior was locally verified by stopping only the API container during a successful completion attempt.

### Phase 4 — remove development Home API hooks: DONE

`app/pages/index.vue` is free of backend learning side effects.

Removed:

```text
Home GET /api/hello diagnostic
Home legacy POST /api/wizard-runs
hardcoded local Wizard-run URL
Home onMounted backend learning block
```

Home was locally verified with DevTools: it produces no backend Fetch/XHR side effects of its own.

### Phase 5 — final product-only E2E verification: DONE

A fresh real Wizard run with UUID:

```text
d409ec15-3c22-40f6-9fc8-bafcd38e555f
```

was tracked through the complete lifecycle:

```text
Portrait Wizard finish
  -> POST /api/wizard-runs
  -> PostgreSQL INSERT
  -> GET /api/wizard-runs read-back
  -> direct DB lookup
  -> docker compose down
  -> docker compose up -d
  -> PostgreSQL readiness
  -> GET read-back again
  -> direct DB lookup again
  -> same UUID and original row survive
```

The final row was verified as:

```text
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
```

This proves the product-created run survives full API + DB container recreation through the named PostgreSQL volume.

## Current implementation boundaries

### Schema workflow

The current schema uses one explicit SQL file plus `npm run db:schema`. A production migration framework remains deferred.

### Temporary database artifact

`persistence_probe` remains from the named-volume learning phase and can be dropped during cleanup.

### Deferred product/platform work

- authentication and user ownership;
- Wizard restore/resume from historical runs;
- delete/rename/favorite history features;
- arbitrary history search/sorting/date filtering;
- production migration workflow;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

## Milestone 5 — History / Read API + UX

### Goal

Turn durable successful Wizard runs into a real read-only History product surface while preserving the current static-generation frontend and independent backend boundary.

Target path:

```text
successful Wizard run
  -> PostgreSQL wizard_runs
  -> paginated summary list API
  -> full run detail API
  -> typed frontend read client
  -> /history
  -> /history/:id
```

Milestone 5 does not add authentication, ownership, delete/update semantics, or historical Wizard restore.

### Contract principle: collection != resource detail

The current `GET /api/wizard-runs` returns every full row, including `output` and `snapshot`. That behavior is acceptable as a learning endpoint but is not the desired production History collection contract.

Milestone 5 separates:

```text
collection read
  -> lightweight summary records

detail read
  -> complete historical record
```

This prevents the History list from transferring every stored snapshot and compiled prompt merely to render a list.

### Full run record

A full run remains:

```json
{
  "id": "uuid",
  "createdAt": "ISO-8601 timestamp",
  "wizardId": "portrait",
  "wizardVersion": 2,
  "output": "compiled prompt",
  "snapshot": {
    "schemaVersion": 1,
    "session": {},
    "finalDraft": {}
  }
}
```

### Summary run record

The initial collection summary contract is intentionally minimal:

```json
{
  "id": "uuid",
  "createdAt": "ISO-8601 timestamp",
  "wizardId": "portrait",
  "wizardVersion": 2
}
```

Do not include full `output` or `snapshot` in collection rows.

If the actual History UX later proves that a prompt preview is necessary, add an explicit bounded preview field rather than exposing full `output` by accident.

### Detail endpoint

```text
GET /api/wizard-runs/:id
```

Success:

```http
200 OK
```

```json
{
  "ok": true,
  "run": {
    "id": "uuid",
    "createdAt": "ISO-8601 timestamp",
    "wizardId": "portrait",
    "wizardVersion": 2,
    "output": "compiled prompt",
    "snapshot": {}
  }
}
```

Valid UUID with no matching row:

```http
404 Not Found
```

```json
{
  "ok": false,
  "message": "Wizard run not found"
}
```

Malformed run id:

```http
400 Bad Request
```

with a structured client error rather than allowing PostgreSQL UUID parsing to become the public validation mechanism.

### Collection endpoint

```text
GET /api/wizard-runs
```

Supported query parameters in the Milestone 5 contract:

```text
limit
cursor
wizardId
```

No other query parameter is part of the initial contract.

### Collection response

```json
{
  "ok": true,
  "runs": [
    {
      "id": "uuid",
      "createdAt": "ISO-8601 timestamp",
      "wizardId": "portrait",
      "wizardVersion": 2
    }
  ],
  "pageInfo": {
    "nextCursor": "opaque-or-null",
    "hasMore": true
  }
}
```

The previous `count: runs.length` response shape is not retained as a total-count contract. A page-size count would add little value, while an exact total count would introduce separate query and semantic costs that the initial UX does not require.

### Stable ordering

Canonical collection order:

```sql
ORDER BY created_at DESC, id DESC
```

Both fields are part of ordering so equal timestamps cannot create ambiguous page boundaries.

The initial API does not expose arbitrary sort direction or ordering fields. History is newest-first.

### Pagination

Use keyset/cursor pagination rather than public page-number/offset pagination.

The cursor is opaque to frontend callers and represents the last ordering tuple:

```text
createdAt + id
```

The exact serialization/encoding is an implementation detail of the backend. Frontend code must treat it as an opaque string.

Initial limit rules:

```text
default limit = 20
maximum limit = 100
minimum limit = 1
```

Invalid `limit` or invalid cursor input returns a structured `400` response.

The database query may fetch `limit + 1` records to determine `hasMore`; only at most `limit` summaries are returned publicly.

### Filtering

Initial supported filter:

```text
wizardId=<normalized wizard id>
```

An unknown but syntactically valid `wizardId` is not an error. It returns an empty collection.

Pagination operates inside the filtered result set.

The initial contract does not include:

```text
wizardVersion
schemaVersion
search
dateFrom
dateTo
sort
direction
```

These remain deferred until real UX needs justify them.

### Detail vs restore boundary

History detail means:

```text
read and display the exact historical artifact
```

Restore means:

```text
convert a historical snapshot into a session executable by a Wizard runtime
```

Restore is explicitly outside Milestone 5. It requires a compatibility policy involving at least:

```text
wizardVersion
snapshot.schemaVersion
availability of the historical/current Wizard runtime
future snapshot/session migration rules
```

Milestone 5 may fetch and display snapshot-backed historical data but must not silently treat a stored snapshot as safe to execute in the current runtime.

### Ownership boundary

Milestone 5 remains unauthenticated and unowned, matching the current data model.

The read API should still be structured so future ownership can scope the same resource and collection operations rather than requiring a completely different product contract.

No `userId`, owner field, auth token, or ownership query parameter is added now.

## Milestone 5 phases

### Phase 0 — contract freeze: DONE

The user reviewed and approved:

- collection vs detail separation;
- full record and summary record shapes;
- detail endpoint status semantics;
- cursor pagination;
- stable ordering;
- `limit` rules;
- `wizardId` filtering;
- restore/auth/deferred boundaries.

No runtime behavior was changed in this phase.

### Phase 1 — single-run detail API: AWAITING USER VERIFICATION

Implemented:

```text
database.getWizardRunById(id)
GET /api/wizard-runs/:id
```

Database behavior:

```text
parameterized UUID lookup
full record projection
existing row -> mapped Wizard run
missing row -> null
```

HTTP behavior:

```text
existing valid UUID -> 200 { ok: true, run }
valid missing UUID -> 404 { ok: false, message: "Wizard run not found" }
malformed id -> 400 { ok: false, message: "Invalid Wizard run id" }
unexpected DB/read failure -> 500
```

UUID format validation happens in the HTTP boundary before PostgreSQL receives the identifier.

Phase 1 intentionally does not change the current collection behavior or frontend typed API boundary.

Verification required before `DONE`:

```text
existing UUID -> 200 exact full run
valid missing UUID -> 404
malformed id -> 400
newly POSTed run -> immediately readable by detail endpoint
GET /api/wizard-runs -> existing list behavior still works
```

### Phase 2 — cursor-paginated summary collection: NOT STARTED

Replace the unbounded full-record collection behavior with the production collection contract.

Implement:

```text
limit
opaque cursor
created_at DESC, id DESC
summary projection
pageInfo.nextCursor
pageInfo.hasMore
```

Verification includes multiple pages, no duplicate/omitted ids across boundaries, stable newest-first order, final-page semantics, invalid query handling, and confirmation that list records do not contain full `snapshot`/`output`.

### Phase 3 — wizardId filtering: NOT STARTED

Add `wizardId` filtering to the paginated collection.

Verification includes mixed Wizard ids, filtered empty state, and pagination within the filtered set.

### Phase 4 — typed frontend read boundary: NOT STARTED

Evolve:

```text
app/types/wizardRunApi.ts
app/composables/usePromptDraftApi.ts
```

Expected conceptual types/functions:

```text
WizardRunSummary
WizardRunRecord
WizardRunPageInfo
ListWizardRunsParams
ListWizardRunsResponse
GetWizardRunResponse

listWizardRuns(params)
getWizardRun(id)
```

Verification includes browser calls, API-base override behavior, and successful `pnpm generate` with no Nuxt server API routes.

### Phase 5 — History UI MVP: NOT STARTED

Target routes:

```text
/history
/history/:id
```

MVP concerns:

```text
loading
empty state
error/retry
newest-first list
load-more pagination
Wizard identity
timestamp
open full run detail
```

The UI remains a static-generated frontend shell whose runtime data comes directly from the independent backend.

### Phase 6 — final Milestone 5 E2E + docs: NOT STARTED

Verification path:

```text
real Wizard finish
  -> POST run
  -> run appears in /history
  -> collection pagination works
  -> detail opens exact run
  -> API + DB containers recreated
  -> same historical run remains readable
  -> pnpm generate still succeeds
```

Only after the user completes and confirms this verification may Milestone 5 be marked complete.
