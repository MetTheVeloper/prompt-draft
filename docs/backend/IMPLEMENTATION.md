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
  -> History UI
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

### Stable ordering and cursor pagination

Canonical ordering:

```sql
ORDER BY created_at DESC, id DESC
```

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

The DB fetches `limit + 1` rows to derive `hasMore`, then exposes at most `limit` summaries.

Cursor condition:

```sql
(created_at, id) < (cursor.createdAt, cursor.id)
```

### Filtering

Supported filter:

```text
wizardId=<trimmed non-empty wizard id>
```

Semantics:

```text
known wizardId -> only matching summaries
unknown non-empty wizardId -> 200 empty collection
empty/whitespace wizardId -> structured 400
pagination -> operates inside the filtered set
```

Runtime filter/cursor values remain PostgreSQL parameters. SQL clause fragments are server-owned.

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

Restore remains outside Milestone 5 because it needs an explicit compatibility policy across `wizardVersion`, `snapshot.schemaVersion`, available Wizard runtimes, and future migrations.

### Ownership boundary

Milestone 5 remains unauthenticated and unowned, matching the current schema. No `userId`, auth token, or ownership filter is added now.

## Milestone 5 phases

### Phase 0 — contract freeze: DONE

The user reviewed and approved collection/detail separation, pagination semantics, stable ordering, limit rules, `wizardId` filtering, and the restore/auth boundaries.

### Phase 1 — single-run detail API: DONE

Implemented and locally verified:

```text
database.getWizardRunById(id)
GET /api/wizard-runs/:id
existing -> 200 full run
missing valid UUID -> 404
malformed id -> 400
fresh POST -> immediate detail read-back
```

Fresh verification run:

```text
37e32eb8-7501-4f46-8c47-70520866e328
output = Milestone 5 Phase 1 detail verification
```

### Phase 2 — cursor-paginated summary collection: DONE

Implemented and locally verified:

```text
summary-only SELECT
created_at DESC, id DESC
keyset cursor predicate
limit + 1 fetch
hasMore + nextCursor
structured invalid-query 400
no output/snapshot in list rows
```

The user verified seven pre-existing rows across four `limit=2` pages as `2 + 2 + 2 + 1`, with no duplicates, final `hasMore=false`, `nextCursor=null`, invalid limit/cursor errors, detail regression, and POST regression.

Phase 2 regression POST created:

```text
534068a7-b518-4cb2-a155-f61dcdea181f
```

### Phase 3 — wizardId filtering: DONE

Implemented:

```text
GET /api/wizard-runs?wizardId=<id>
trim at HTTP boundary
empty -> structured 400
unknown -> 200 empty collection
parameterized wizard_id equality
limit + cursor compose with filter
pagination remains inside filtered result set
```

Local user verification:

```text
phase3-probe POST -> 201
id = b7e47e39-4eb9-4333-b891-e42d34d25bd1

wizardId=phase3-probe
  -> only the probe summary

wizardId=does-not-exist
  -> 200, runs=[]

wizardId=
  -> structured 400

wizardId=portrait&limit=2
  -> first two portrait summaries
  -> hasMore=true
  -> nextCursor present

same portrait filter + returned cursor
  -> next portrait page
  -> no phase3-probe row
  -> no duplicate from prior page
```

Phase 3 is therefore verified and complete.

### Phase 4 — typed frontend read boundary: AWAITING USER VERIFICATION

Implemented in:

```text
app/types/wizardRunApi.ts
app/composables/usePromptDraftApi.ts
```

Types now separate collection summaries from full detail records:

```text
WizardRunSummary
WizardRunRecord
WizardRunPageInfo
ListWizardRunsParams
ListWizardRunsResponse
GetWizardRunResponse
```

`ListWizardRunsResponse` now matches the production collection contract:

```text
runs: WizardRunSummary[]
pageInfo: { nextCursor, hasMore }
```

The old frontend `count` and `WizardRunRecord[]` list shape are removed.

Client methods:

```text
listWizardRuns(params = {})
  -> serializes optional limit, cursor, wizardId
  -> treats cursor as opaque
  -> calls runtime-configured /api/wizard-runs

getWizardRun(id)
  -> URL-encodes id path segment
  -> calls runtime-configured /api/wizard-runs/:id
```

`createWizardRun()` and the existing API-base normalization remain unchanged.

Phase 4 introduces no page, Nuxt server route, or backend dependency into static generation.

Verification boundary for this phase:

```text
pnpm generate -> succeeds
existing Wizard compile/persistence code still builds
no Nuxt server API route added
```

The first real browser consumer of `listWizardRuns(params)` and `getWizardRun(id)` will be the History UI in Phase 5. Runtime browser behavior of those methods is therefore verified as part of Phase 5 rather than by adding a temporary diagnostic page solely for Phase 4.

Do not mark Phase 4 `DONE` until the user confirms the local static build.

### Phase 5 — History UI MVP: NOT STARTED

History UI will become the first real browser consumer of the Phase 4 typed read client.

Before choosing the final detail-route shape, re-check the static-hosting constraint: arbitrary historical UUIDs are not known at generate time. A dynamic `/history/:id` route is only safe for direct navigation if deployment provides an SPA fallback or equivalent routing support. Otherwise prefer a static `/history` shell with client-side selection/query state.

MVP concerns:

```text
loading
empty state
error/retry
newest-first list
load-more pagination
wizard filter
timestamp
open full run detail
```

### Phase 6 — final Milestone 5 E2E + docs: NOT STARTED

Final verification path:

```text
real Wizard finish
  -> POST run
  -> run appears in History
  -> collection pagination works
  -> detail opens exact run
  -> API + DB containers recreated
  -> same historical run remains readable
  -> pnpm generate still succeeds
```

Only after the user completes and confirms this verification may Milestone 5 be marked complete.
