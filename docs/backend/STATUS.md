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
- product-created rows survive `docker compose down/up` through the PostgreSQL named volume;
- static generation remains supported.

Reference verified run:

```text
d409ec15-3c22-40f6-9fc8-bafcd38e555f
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
```

## Milestone 5 — IN PROGRESS: History / Read API + UX

Goal:

```text
durable successful Wizard runs
  -> production read contract
  -> paginated History collection
  -> full run detail
  -> typed frontend read boundary
  -> History UI
```

Architecture remains:

```text
static-generated Nuxt frontend
  -> direct browser calls
  -> independent Dockerized API :4000
  -> PostgreSQL
```

Authentication, ownership, and historical Wizard restore are not part of Milestone 5.

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

Implemented and locally verified:

```text
GET /api/wizard-runs/:id
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

Implemented and locally verified:

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

User verified seven existing rows across four `limit=2` pages as `2 + 2 + 2 + 1`, with all ids returned exactly once and final:

```text
hasMore=false
nextCursor=null
```

Regression checks also passed for detail and POST.

Phase 2 regression POST id:

```text
534068a7-b518-4cb2-a155-f61dcdea181f
```

### Phase 3 — wizardId filtering: DONE

Implemented and locally verified:

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

Implemented:

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

The user locally ran:

```text
git pull --ff-only
pnpm generate
```

and Nuxt static generation completed successfully. `/wizard/portrait` still prerendered and Nuxt reported `.output/public` ready for static hosting.

Existing non-blocking build warnings remain unrelated to Milestone 5:

```text
duplicate compilePromptOutput import warning
sourcemap warning
large chunk warning
Nitro cache-driver external warning
```

Phase 4 is therefore verified and complete.

### Phase 5 — History UI MVP: AWAITING USER VERIFICATION

Implemented first real browser consumer of the typed read API:

```text
app/pages/history.vue
  -> GET summary list on load
  -> newest-first History cards
  -> loading / empty / error / retry states
  -> cursor-based Load more
  -> open one run detail
  -> GET full run detail
  -> compiled output display
  -> copy prompt action
  -> read-only stored snapshot disclosure

app/config/navigation.ts
  -> History entry in primary/mobile navigation

i18n/locales/history.en.ts
i18n/locales/history.fa.ts
  -> History UI localization
```

Static-hosting route decision:

```text
/history
/history?run=<uuid>
```

A dynamic `/history/:id` route was intentionally not used because arbitrary future UUIDs are unknown at `pnpm generate` time and the current product must remain safe for pure static hosting without depending on an SPA fallback.

The query-based detail pattern also matches the existing `/prompts?id=...` product pattern.

The backend `wizardId` filter remains available, but the initial History UI does not expose a technical free-text Wizard-id filter. That control is deferred until a real multi-Wizard product catalog makes the UX meaningful.

Required local verification before Phase 5 can become `DONE`:

```text
1. git pull --ff-only
2. pnpm dev (with Docker API running)
3. open /history
4. History navigation item is visible
5. list loads real persisted summaries newest-first
6. list rows do not expose full snapshot/output
7. open a row -> URL becomes /history?run=<uuid>
8. detail loads the exact full run/output
9. Back to history returns to /history
10. copy prompt works
11. stop API -> History shows graceful error/retry behavior
12. restart API -> retry succeeds
13. pnpm generate succeeds and /history is generated
```

Do not mark Phase 5 `DONE` until the user confirms these behaviors locally.

### Phase 6 — Milestone 5 product E2E: NOT STARTED

Will verify a fresh real Wizard-created run through History list/detail and container recreation before marking the milestone complete.

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

Locally verify Milestone 5 Phase 5 History UI behavior and static generation.

Do not mark Phase 5 `DONE` until the user confirms the browser/runtime checks above.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
