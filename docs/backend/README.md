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
- server-generated UUID/timestamp concepts;
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

## Milestone 4 — in progress

Goal: move persistence from the development home-page learning hook into the real Wizard success flow and make the API contract safe enough for product use.

The real Wizard completion event has now been identified in `app/pages/wizard/[wizardId].vue`:

```text
finish()
  -> runtime.complete(session)
  -> successful finalDraft + promptPreview
  -> completed Ready state
```

The current Ready UI does not expose a copy action, so the current persistence event is successful completion rather than clipboard interaction.

Milestone 4 sequence:

```text
server-owned field hardening
  -> snapshot contract v1
  -> configurable frontend API client/base
  -> persist successful Wizard finish
  -> remove home-page learning hooks
  -> browser E2E verification
```

Phase 0 hardening is implemented but must still be locally verified before being marked complete.

## Snapshot direction

The exact production snapshot is still provisional. Current recommended v1 direction is:

```json
{
  "schemaVersion": 1,
  "session": {
    "currentStepId": "review",
    "answers": {},
    "derived": {}
  },
  "finalDraft": {}
}
```

The relational/API fields already carry `wizardId`, `wizardVersion`, compiled `output`, run `id`, and `createdAt`.

## Frontend integration boundary

The current home-page learning requests hardcode `http://127.0.0.1:4000` and are guarded by `import.meta.dev`.

Before real Wizard integration, use a configurable public API base/helper so product code does not embed a local-only URL and static generation remains supported.

The home-page requests must be removed after the real Wizard path is verified.

## Still deferred

- authentication;
- users/user ownership;
- production Wizard history/restore UI;
- production migrations strategy;
- Redis;
- VPS deployment;
- production domain/HTTPS;
- production secrets/configuration.

A temporary `persistence_probe` table remains from the volume-learning phase and can be removed during a later cleanup step.

## Documentation workflow

`README.md` explains purpose, boundaries, and milestone scope.

`IMPLEMENTATION.md` contains implementation sequence, verified architecture, and technical decisions/debt.

`STATUS.md` records what has actually been verified and what should happen next.

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

For a new chat, read these three files before making backend changes:

- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
