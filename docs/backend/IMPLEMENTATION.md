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

Verified decisions:

```text
server-owned id + createdAt
snapshot schemaVersion = 1
configurable public API base
persist after successful runtime.complete(session)
persistence failure does not destroy successful prompt output
Home has no backend learning side effects
PostgreSQL named-volume durability
static generation preserved
```

Reference verified product run:

```text
d409ec15-3c22-40f6-9fc8-bafcd38e555f
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
```

## Current implementation boundaries

### Schema workflow

The current schema uses one explicit SQL file plus `npm run db:schema`. A production migration framework remains deferred.

### Temporary database artifact

`persistence_probe` remains from the named-volume learning phase and can be dropped during cleanup.

### Deferred platform work

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

Turn durable successful Wizard runs into a real read-only History product surface while preserving the static-generated frontend and independent backend boundary.

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

### Collection vs detail contract

Collection reads are lightweight summaries:

```json
{
  "id": "uuid",
  "createdAt": "ISO-8601 timestamp",
  "wizardId": "portrait",
  "wizardVersion": 2
}
```

Detail reads are complete historical records:

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

Full `output` and `snapshot` do not belong in collection rows.

### Detail endpoint

```text
GET /api/wizard-runs/:id
```

Semantics:

```text
existing valid UUID -> 200 { ok: true, run }
valid missing UUID -> 404 { ok: false, message: "Wizard run not found" }
malformed id -> 400 { ok: false, message: "Invalid Wizard run id" }
unexpected DB/read failure -> 500
```

UUID validation occurs at the HTTP boundary before PostgreSQL receives the id.

### Collection endpoint

```text
GET /api/wizard-runs
```

Milestone 5 query contract:

```text
limit
cursor
wizardId
```

Phase 2 implements `limit` and `cursor`. Phase 3 adds `wizardId`.

Collection response:

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

The old `count` field is not retained as a total-count contract.

### Stable ordering

Canonical collection ordering:

```sql
ORDER BY created_at DESC, id DESC
```

Both fields participate so equal timestamps still have deterministic order and page boundaries.

### Cursor pagination

Use keyset pagination rather than page-number/offset pagination.

Cursor represents the last returned ordering tuple:

```text
createdAt + id
```

The public cursor is opaque. Current backend serialization uses base64url-encoded JSON, but callers must not depend on that encoding.

Limit rules:

```text
default = 20
minimum = 1
maximum = 100
```

Invalid limit or cursor values return structured `400` responses.

The DB fetches `limit + 1` rows to derive `hasMore`, then exposes at most `limit` summaries.

Cursor query behavior:

```sql
WHERE (created_at, id) < ($cursorCreatedAt, $cursorId)
ORDER BY created_at DESC, id DESC
```

### Filtering

Phase 3 will add:

```text
wizardId=<normalized wizard id>
```

An unknown but syntactically valid Wizard id will return an empty collection. Pagination must operate inside the filtered set.

Deferred collection query features:

```text
wizardVersion
schemaVersion
search
dateFrom
dateTo
sort
direction
```

### Detail vs restore boundary

History detail means reading and displaying the exact historical artifact.

Restore means converting a stored historical snapshot into a currently executable Wizard session.

Restore remains outside Milestone 5 because it needs an explicit compatibility policy across:

```text
wizardVersion
snapshot.schemaVersion
available Wizard runtimes
future snapshot/session migrations
```

### Ownership boundary

Milestone 5 remains unauthenticated and unowned, matching the current schema. The read contract should remain compatible with future ownership scoping, but no `userId`, auth token, or ownership filter is added now.

## Milestone 5 phases

### Phase 0 — contract freeze: DONE

The user reviewed and approved collection/detail separation, pagination semantics, stable ordering, limit rules, future `wizardId` filtering, and the restore/auth boundaries.

### Phase 1 — single-run detail API: DONE

Implemented:

```text
database.getWizardRunById(id)
GET /api/wizard-runs/:id
```

Local verification completed by the user:

```text
existing product UUID -> 200 full run
valid missing UUID -> 404
malformed id -> 400
fresh POST -> 201
immediate detail GET of fresh UUID -> 200 same data
pre-Phase-2 collection regression -> old list still worked
```

Fresh verification run:

```text
37e32eb8-7501-4f46-8c47-70520866e328
output = Milestone 5 Phase 1 detail verification
```

### Phase 2 — cursor-paginated summary collection: AWAITING USER VERIFICATION

Implemented backend behavior:

```text
listWizardRuns({ limit, cursor })
summary-only SELECT
created_at DESC, id DESC
keyset cursor predicate
limit + 1 fetch
hasMore derivation
opaque nextCursor
structured invalid-query 400
```

HTTP collection behavior now intentionally changes from the old learning response:

```text
old:
{ ok, count, runs:[full records] }

new:
{ ok, runs:[summaries], pageInfo:{ nextCursor, hasMore } }
```

Phase 2 does not implement `wizardId` yet.

Required local verification:

```text
default list -> summary shape and newest-first
no output/snapshot in collection rows
limit=2 -> two rows, hasMore true, nextCursor present
follow nextCursor through subsequent pages
final page -> hasMore false, nextCursor null
no duplicate ids across pages
all existing ids returned exactly once
limit=0 -> 400
limit=101 -> 400
limit=abc -> 400
invalid cursor -> 400
detail endpoint still returns full records
POST still returns 201 and fresh run appears on a new first page
```

Phase 2 is not `DONE` until the user confirms these behaviors locally.

### Phase 3 — wizardId filtering: NOT STARTED

Add `wizardId` filtering to the paginated collection and verify filtering plus page boundaries inside the filtered set.

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

### Phase 6 — final Milestone 5 E2E + docs: NOT STARTED

Final verification path:

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
