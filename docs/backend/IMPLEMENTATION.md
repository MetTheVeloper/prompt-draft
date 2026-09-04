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
- product-level Wizard filter UI/catalog;
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
  -> /history?run=<uuid>
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

Supported backend filter:

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

The initial History UI intentionally does not expose a free-text Wizard-id filter. The API capability remains ready for a future product-level Wizard catalog/filter control.

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

### Static History routing decision

Nuxt is configured with:

```text
ssr: false
Nitro preset: static
pnpm generate
```

Future historical UUIDs are unknown at generation time. A dynamic route such as:

```text
/history/:id
```

cannot be relied on as a standalone prerendered file for arbitrary future ids on pure static hosting without an SPA fallback.

Milestone 5 therefore uses one static shell:

```text
/history
```

and client-side detail state in the query string:

```text
/history?run=<uuid>
```

This preserves direct-linkable detail state without requiring one generated route per historical UUID. It also follows the existing product pattern used by `/prompts?id=...`.

## Milestone 5 phases

### Phase 0 — contract freeze: DONE

The user reviewed and approved collection/detail separation, pagination semantics, stable ordering, limit rules, `wizardId` filtering, and restore/auth boundaries.

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

Implemented and locally verified:

```text
GET /api/wizard-runs?wizardId=<id>
trim at HTTP boundary
empty -> structured 400
unknown -> 200 empty collection
parameterized wizard_id equality
limit + cursor compose with filter
pagination remains inside filtered result set
```

Verification probe:

```text
wizardId = phase3-probe
id = b7e47e39-4eb9-4333-b891-e42d34d25bd1
```

The user verified the probe, unknown/empty semantics, and filtered `portrait + limit + cursor` continuation with no cross-filter row or duplicate.

### Phase 4 — typed frontend read boundary: DONE

Implemented in:

```text
app/types/wizardRunApi.ts
app/composables/usePromptDraftApi.ts
```

Types separate collection summaries from full detail records:

```text
WizardRunSummary
WizardRunRecord
WizardRunPageInfo
ListWizardRunsParams
ListWizardRunsResponse
GetWizardRunResponse
```

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

`createWizardRun()` and API-base normalization remain unchanged.

The user ran `pnpm generate` locally after pulling Phase 4. Static generation completed successfully, `/wizard/portrait` remained prerendered, and Nuxt reported `.output/public` ready for static hosting.

### Phase 5 — History UI MVP: AWAITING USER VERIFICATION

Implemented:

```text
app/pages/history.vue
```

Runtime behavior:

```text
/history
  -> listWizardRuns({ limit: 20 })
  -> loading / empty / error / retry
  -> newest-first summary cards
  -> cursor-based Load more

/history?run=<uuid>
  -> getWizardRun(uuid)
  -> full historical record
  -> compiled output
  -> copy prompt
  -> read-only stored snapshot disclosure
  -> back to /history
```

Navigation/localization:

```text
app/config/navigation.ts
  -> History primary/mobile navigation item

i18n/locales/history.en.ts
i18n/locales/history.fa.ts
i18n/i18n.config.ts
  -> localized History labels and messages
```

The first page deliberately lists all Wizard ids newest-first. The backend `wizardId` filter remains available but is not surfaced as a technical free-text UI control in this MVP.

Verification required before `DONE`:

```text
pull latest branch
run backend + pnpm dev
open /history
History nav visible
real persisted summaries load
open a row -> /history?run=<uuid>
exact full output loads
back works
copy works
API-down error/retry works
restart API and retry recovers
pnpm generate succeeds
/history appears in generated routes/output
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
