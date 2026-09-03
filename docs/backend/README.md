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

## Still deferred

- authentication;
- users/user ownership;
- production Wizard history/list/restore UI;
- production migrations strategy;
- Redis;
- VPS deployment;
- production domain/HTTPS;
- production secrets/configuration.

A temporary `persistence_probe` table remains from the volume-learning phase and can be removed during a later cleanup step.

## Next milestone

Milestone 5 has not been chosen yet. Select one coherent next product/backend goal before implementation. Reasonable directions include history/read UX and API querying, authentication/user ownership, or production migration/config/deployment hardening.

## Documentation workflow

`README.md` explains purpose, boundaries, and milestone scope.

`IMPLEMENTATION.md` contains implementation sequence, verified architecture, and technical decisions/debt.

`STATUS.md` records what has actually been verified and what should happen next.

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

For a new chat, read these three files before making backend changes:

- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
