# Prompt Draft Backend

This directory is the source of truth for backend and Docker integration work in Prompt Draft.

## Current branch

`feature/docker-local-api`

The backend remains intentionally independent from Nuxt server routes. Prompt Draft can continue to use its static-generation frontend workflow while the backend is developed and deployed separately.

## Milestone 1 — complete

Established the local Dockerized Node API path from Nuxt development frontend to `:4000`.

## Milestone 2 — complete

Established JSON POST parsing, validation, CORS/preflight, temporary Wizard-run state, and browser integration.

## Milestone 3 — complete

Replaced temporary Wizard-run memory with durable PostgreSQL persistence.

Verified architecture:

```text
Nuxt/client
  -> Docker API :4000
  -> Node HTTP server
  -> pg connection pool
  -> Compose service db:5432
  -> PostgreSQL wizard_runs
  -> /var/lib/postgresql/data
  -> Docker named volume prompt_draft_pgdata
```

## Milestone 4 — complete

Persistence is integrated with the real Wizard success flow rather than a development Home hook.

Verified product path:

```text
Portrait Wizard finish()
  -> runtime.complete(session)
  -> successful finalDraft + promptPreview
  -> typed frontend API client
  -> POST /api/wizard-runs
  -> PostgreSQL
  -> named volume
```

The production snapshot contract is versioned as v1:

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

`wizardId`, `wizardVersion`, compiled `output`, run `id`, and `createdAt` remain first-class run fields outside the snapshot.

The frontend API base is configurable through:

```text
NUXT_PUBLIC_API_BASE
  -> runtimeConfig.public.apiBase
  -> usePromptDraftApi()
```

Static generation remains supported. The real Wizard persistence path was verified in the browser and directly in PostgreSQL, including Docker named-volume durability.

Persistence failure is intentionally non-destructive: if prompt generation succeeds but history storage is unavailable, the Ready artifact remains usable and the user sees a persistence warning.

## Milestone 5 — complete: History / Read API + UX

Stored successful Wizard runs now have a real read-only History product surface.

Verified product path:

```text
successful Wizard runs
  -> durable PostgreSQL records
  -> paginated summary collection API
  -> full run detail API
  -> typed frontend read boundary
  -> static-compatible History UI
```

Current API surface:

```text
GET /api/wizard-runs
  -> newest-first paginated summaries
  -> limit
  -> opaque cursor
  -> optional wizardId filter

GET /api/wizard-runs/:id
  -> one full historical run
  -> output + snapshot
```

Canonical list ordering is stable newest-first ordering by both timestamp and id:

```text
created_at DESC, id DESC
```

Pagination uses opaque keyset cursors. Collection rows are summary-only; full `output` and `snapshot` are returned only by the detail endpoint.

The frontend typed read boundary exposes:

```text
listWizardRuns(params)
getWizardRun(id)
```

with separate summary and full-record TypeScript contracts.

The History UI uses one static route shell:

```text
/history
/history?run=<uuid>
```

The query-based detail state is intentional. Arbitrary future UUIDs are unknown at `pnpm generate` time, so the product does not depend on a dynamic `/history/:id` static route or on deployment-specific SPA fallback behavior.

Verified History behavior includes:

- History navigation entry;
- newest-first persisted summaries;
- full historical detail;
- compiled prompt display;
- Copy prompt clipboard action;
- read-only stored snapshot disclosure;
- graceful API-down error state;
- retry recovery after API restart;
- English/Persian localization;
- successful `pnpm generate` with `/history` included in generated routes.

History detail is intentionally not Wizard restore. Stored snapshots are displayed read-only and are not executed/restored into the current Wizard runtime.

Authentication and user ownership remain deferred.

### Milestone 5 phases

```text
Phase 0  contract freeze                         DONE
Phase 1  GET /api/wizard-runs/:id               DONE
Phase 2  cursor-paginated summary collection    DONE
Phase 3  wizardId filtering                     DONE
Phase 4  typed frontend read client             DONE
Phase 5  /history + query-based detail UX       DONE
Phase 6  full local E2E + documentation         DONE
```

Milestone 5 is COMPLETE.

## Still deferred

- authentication;
- users/user ownership;
- Wizard restore/resume from historical runs;
- delete/rename/favorite history features;
- product-level Wizard filter UI/catalog;
- arbitrary history search/sorting/date filtering;
- production migrations strategy;
- Redis;
- VPS deployment;
- production domain/HTTPS;
- production secrets/configuration.

A temporary `persistence_probe` table remains from the volume-learning phase and can be removed during a later cleanup step.

## Documentation workflow

`README.md` explains purpose, boundaries, and completed milestone scope.

`IMPLEMENTATION.md` contains implementation sequence, verified architecture, API contracts, and technical decisions/debt.

`STATUS.md` records what has actually been verified and what should happen next.

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

## Next action

Milestone 5 is closed. Await the user's explicit next milestone scope before making further backend/product changes.

For a new chat, read these three files before making backend changes:

- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
