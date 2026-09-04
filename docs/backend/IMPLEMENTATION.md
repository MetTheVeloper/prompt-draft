# Backend Implementation Plan

## Architecture baseline

Milestones 1 through 5 are complete and locally verified.

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
  -> read-only History UI
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

## Milestone 5 — COMPLETE: History / Read API + UX

### Goal achieved

Durable successful Wizard runs are now exposed through a real read-only History product surface while preserving the static-generated frontend and independent backend boundary.

Final path:

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

Supported query contract:

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

The History MVP intentionally does not expose a free-text Wizard-id filter. The API capability remains available for a future product-level Wizard catalog/filter control.

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

Future historical UUIDs are unknown at generation time. A dynamic route such as `/history/:id` cannot be relied on as a standalone prerendered file for arbitrary future ids on pure static hosting without an SPA fallback.

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

The user verified pagination over existing rows with no duplicates, final `hasMore=false`, `nextCursor=null`, invalid-query errors, detail regression, and POST regression.

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
getWizardRun(id)
```

`createWizardRun()` and API-base normalization remain unchanged.

Static generation was locally verified after this phase.

### Phase 5 — History UI MVP: DONE

Implemented and locally verified:

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

The user verified list/detail behavior, clipboard copy, Persian UI, API-down graceful failure, retry recovery after API restart, and successful static generation with `/history` included.

### Phase 6 — final Milestone 5 E2E + docs: DONE

The user confirmed the final product flow locally:

```text
real Wizard-created run
  -> persistence succeeds
  -> run appears in History
  -> detail opens exact saved artifact
  -> compiled output and snapshot remain readable
  -> History recovery behavior works
  -> pnpm generate still succeeds
```

Named-volume durability across API/DB recreation remains part of the verified persistence baseline and is compatible with the completed History read surface.

Milestone 5 is therefore complete.

## Next milestone

Do not infer the next backend/product milestone. Await the user's explicit scope before making further changes.
