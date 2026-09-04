# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestone 1 — COMPLETE

Verified local Nuxt -> Docker API connectivity and browser CORS behavior.

## Milestone 2 — COMPLETE

Verified JSON POST parsing, validation, CORS/preflight, temporary Wizard-run state, and browser read-back.

## Milestone 3 — COMPLETE

Replaced process memory with PostgreSQL + Docker named-volume persistence.

Verified end to end:

```text
HTTP POST
  -> API container
  -> parameterized PostgreSQL INSERT
  -> Docker named volume
  -> API + DB containers removed/recreated
  -> PostgreSQL SELECT
  -> HTTP GET
  -> same Wizard run
```

## Milestone 4 — COMPLETE: product integration and contract hardening

Verified product behavior:

- server-owned `id` and `createdAt`;
- snapshot contract v1;
- configurable `NUXT_PUBLIC_API_BASE`;
- real Portrait Wizard persistence after successful `finish()`;
- failed persistence does not destroy a successfully generated artifact;
- Home page has no backend learning GET/POST side effects;
- product-created rows survive Docker container recreation through the PostgreSQL named volume;
- static generation remains supported.

Reference verified run:

```text
d409ec15-3c22-40f6-9fc8-bafcd38e555f
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
```

## Milestone 5 — COMPLETE: History / Read API + UX

Milestone 5 turned durable successful Wizard runs into a real read-only History product surface while preserving the static-generated Nuxt frontend and independent Dockerized backend.

Verified product path:

```text
real Portrait Wizard finish
  -> POST /api/wizard-runs
  -> PostgreSQL wizard_runs
  -> paginated summary History list
  -> full run detail
  -> compiled prompt + stored snapshot
  -> static-compatible /history shell
```

Architecture remains:

```text
static-generated Nuxt frontend
  -> direct browser calls
  -> independent Dockerized API :4000
  -> PostgreSQL
```

Authentication, ownership, and historical Wizard restore remain outside this milestone.

### Phase 0 — contract freeze: DONE

Frozen read contract:

```text
GET /api/wizard-runs
  -> summary records only
  -> newest first
  -> ORDER BY created_at DESC, id DESC
  -> limit: default 20, min 1, max 100
  -> opaque cursor based on createdAt + id
  -> optional wizardId filter
  -> pageInfo.nextCursor
  -> pageInfo.hasMore

GET /api/wizard-runs/:id
  -> full run
  -> output
  -> snapshot
```

List summary fields:

```text
id
createdAt
wizardId
wizardVersion
```

History detail is read-only. Restore/auth/ownership remain deferred.

### Phase 1 — single-run detail API: DONE

Locally verified:

```text
existing UUID -> 200 full record
valid missing UUID -> 404
malformed id -> 400
fresh POST -> immediate detail read-back
```

Fresh verification run:

```text
37e32eb8-7501-4f46-8c47-70520866e328
output = Milestone 5 Phase 1 detail verification
```

### Phase 2 — cursor-paginated summary collection: DONE

Locally verified:

```text
summary-only collection
ORDER BY created_at DESC, id DESC
keyset cursor pagination
limit + 1 fetch
hasMore + nextCursor
no count
no output/snapshot in list rows
structured invalid limit/cursor 400
```

The user verified seven existing rows across four `limit=2` pages as `2 + 2 + 2 + 1`, with all ids returned exactly once and final:

```text
hasMore=false
nextCursor=null
```

Regression checks also passed for detail and POST.

### Phase 3 — wizardId filtering: DONE

Locally verified:

```text
wizardId=<trimmed non-empty id>
known id -> only matching summaries
unknown id -> 200 empty collection
empty id -> structured 400
filter + limit + cursor -> composable
pagination remains inside filtered result set
```

Verification probe:

```text
wizardId = phase3-probe
id = b7e47e39-4eb9-4333-b891-e42d34d25bd1
```

The user verified the probe, unknown/empty filter semantics, and `portrait + limit + cursor` pagination with no cross-filter rows or duplicates.

### Phase 4 — typed frontend read boundary: DONE

Implemented and build-verified:

```text
app/types/wizardRunApi.ts
  -> WizardRunSummary
  -> WizardRunRecord
  -> WizardRunPageInfo
  -> ListWizardRunsParams
  -> ListWizardRunsResponse
  -> GetWizardRunResponse

app/composables/usePromptDraftApi.ts
  -> listWizardRuns(params = {})
  -> getWizardRun(id)
```

Collection and detail are typed separately:

```text
list -> WizardRunSummary[] + pageInfo
get  -> full WizardRunRecord
```

`pnpm generate` completed successfully and `/wizard/portrait` remained prerendered.

### Phase 5 — History UI MVP: DONE

Implemented and locally verified:

```text
/history
  -> real persisted summaries newest-first
  -> loading / empty / error / retry states
  -> cursor-based Load more

/history?run=<uuid>
  -> exact full run detail
  -> compiled prompt
  -> Copy prompt
  -> read-only stored snapshot disclosure
  -> Back to history
```

Verified UX/runtime behavior:

- History appears in primary/mobile navigation;
- persisted runs load from the backend;
- list rows remain summary-only;
- opening a row uses query-based detail state;
- full output and stored snapshot are readable;
- Copy prompt writes the exact compiled prompt to the clipboard;
- stopping the API shows a graceful History-unavailable state;
- restarting the API and retrying recovers the list without an app crash;
- Persian localization renders correctly;
- `pnpm generate` succeeds with `/history` included in generated routes.

Static-hosting route decision:

```text
/history
/history?run=<uuid>
```

A dynamic `/history/:id` route is intentionally not required because arbitrary future UUIDs are unknown at generation time and pure static hosting must remain supported.

### Phase 6 — final Milestone 5 product E2E + docs: DONE

The user completed and confirmed the final product-level verification locally.

Verified final flow:

```text
real Wizard-created run
  -> persistence succeeds
  -> run appears in History
  -> full detail opens
  -> compiled output matches the saved run
  -> stored snapshot remains readable
  -> History read/recovery behavior works
  -> static generation still succeeds
```

Durability across Docker API/DB recreation is covered by the named-volume persistence verification established in the backend path and retained through the Milestone 5 read surface.

Milestone 5 is therefore COMPLETE.

## Current intentional debt / deferred work

- authentication and user ownership;
- Wizard restore/resume from historical snapshots;
- delete/rename/favorite History operations;
- product-level Wizard filter UI/catalog;
- arbitrary search/sorting/date/version filtering;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Milestone 5 is closed. Await the user's next milestone scope before making further backend/product changes.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
