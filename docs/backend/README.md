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

Verified capabilities include:

- `GET /api/hello`;
- `GET /api/db-check`;
- `POST /api/wizard-runs`;
- `GET /api/wizard-runs`;
- JSON body parsing and validation;
- structured client errors;
- server-generated UUID/timestamps;
- browser CORS/preflight;
- PostgreSQL service-to-service networking;
- PostgreSQL connection pooling;
- versioned SQL schema source;
- parameterized SQL INSERT;
- SQL SELECT read-back;
- Docker named-volume persistence;
- Wizard-run rows that survive full API + DB container removal/recreation.

Current database shape:

```text
id              UUID primary key
created_at      timestamp with time zone
wizard_id       text
wizard_version  integer
output           text
snapshot         jsonb
```

## Milestone 4 — complete

Persistence is now integrated with the real Wizard success flow rather than a development Home hook.

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

Static generation remains supported. The user verified `pnpm generate` succeeds and `/wizard/portrait` is prerendered.

The real Wizard persistence path was verified in the browser and directly in PostgreSQL. A product-created run survived full API + DB container recreation and was returned afterward with the same UUID.

Persistence failure is intentionally non-destructive: if prompt generation succeeds but history storage is unavailable, the Ready artifact remains usable and the user sees a persistence warning.

The Home page no longer performs backend learning GET/POST requests.

## Milestone 5 — selected: History / Read API + UX

Milestone 5 will turn stored successful Wizard runs into a real read-only History product surface.

Goal:

```text
successful Wizard runs
  -> durable PostgreSQL records
  -> paginated summary collection API
  -> full run detail API
  -> typed frontend read boundary
  -> static-compatible History UI
```

The milestone intentionally separates collection reads from detail reads. The list endpoint should return lightweight run summaries rather than every historical `output` and `snapshot`; full historical data belongs to the detail endpoint.

Planned API surface:

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

Canonical list ordering will be stable newest-first ordering by both timestamp and id:

```text
created_at DESC, id DESC
```

Pagination will use an opaque cursor derived from the ordering tuple rather than public page-number/offset semantics.

History detail is intentionally not the same as Wizard restore. Milestone 5 may read historical snapshots, but it will not execute or restore them into the current Wizard runtime. Restore requires an explicit compatibility policy across `wizardVersion`, `snapshot.schemaVersion`, and future runtime changes and remains deferred.

Authentication and user ownership are also deferred. Milestone 5 designs a read contract that can later be scoped by ownership without adding ownership now.

### Milestone 5 phases

```text
Phase 0  contract freeze
Phase 1  GET /api/wizard-runs/:id
Phase 2  cursor-paginated summary collection
Phase 3  wizardId filtering
Phase 4  typed frontend read client
Phase 5  /history + /history/:id UX
Phase 6  full local E2E + documentation
```

No phase is complete merely because code or documentation exists. Each phase is marked `DONE` only after the user locally verifies the relevant behavior and confirms it.

## Still deferred

- authentication;
- users/user ownership;
- Wizard restore/resume from historical runs;
- delete/rename/favorite history features;
- arbitrary history search/sorting/date filtering;
- production migrations strategy;
- Redis;
- VPS deployment;
- production domain/HTTPS;
- production secrets/configuration.

A temporary `persistence_probe` table remains from the volume-learning phase and can be removed during a later cleanup step.

## Documentation workflow

`README.md` explains purpose, boundaries, and milestone scope.

`IMPLEMENTATION.md` contains implementation sequence, verified architecture, API contracts, and technical decisions/debt.

`STATUS.md` records what has actually been verified and what should happen next.

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

For a new chat, read these three files before making backend changes:

- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
