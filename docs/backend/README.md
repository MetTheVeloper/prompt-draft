# Prompt Draft Backend

This directory is the source of truth for backend and Docker integration work in Prompt Draft.

## Current branch

`feature/docker-local-api`

The backend remains intentionally independent from Nuxt server routes. Prompt Draft can continue to use its static-generation frontend workflow while the backend is developed and deployed separately.

## Milestone 1 — complete

Established the local backend path:

```text
Nuxt frontend (localhost:3030)
  -> browser CORS
  -> host port 4000
  -> Docker Compose API container
  -> Node HTTP server
  -> JSON response
```

## Milestone 2 — complete

Established the inbound HTTP/request path:

```text
Nuxt :3030
  -> JSON POST
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node request stream
  -> JSON parse
  -> validation
  -> temporary in-memory Wizard run
  -> 201 response
  -> GET read-back
```

The user also verified that process-local data disappears after container/process recreation.

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

Locally verified capabilities now include:

- `GET /api/hello`;
- `GET /api/db-check`;
- `POST /api/wizard-runs`;
- `GET /api/wizard-runs`;
- JSON body parsing and validation;
- structured client errors;
- UUID/timestamp generation;
- browser CORS/preflight;
- PostgreSQL service-to-service networking;
- PostgreSQL connection pooling;
- versioned SQL schema source;
- parameterized SQL INSERT;
- SQL SELECT read-back;
- Docker named-volume persistence;
- Wizard-run rows that survive full API + DB container removal/recreation.

Current provisional database shape:

```text
id              UUID primary key
created_at      timestamp with time zone
wizard_id       text
wizard_version  integer
output           text
snapshot         jsonb
```

The exact production Wizard snapshot semantics are still intentionally provisional.

## Next direction — product integration and contract hardening

Milestone 3 proved persistence. The next work should make that persistence belong to the actual product rather than the development learning hook.

Before real Wizard integration:

- harden server-owned fields so clients cannot override generated `id`/`createdAt`;
- explicitly allowlist fields stored from the POST body;
- inspect the real Wizard success/completion/copy path;
- decide the correct persistence event;
- tighten/version snapshot semantics;
- remove the home-page development POST after the real integration is verified.

The current home-page API calls are development learning hooks, not the final product integration point.

## Still deferred

- authentication;
- users/user ownership;
- production Wizard history/restore UI;
- production migrations strategy;
- Redis;
- VPS deployment;
- production domain/HTTPS;
- production secrets/configuration.

A temporary `persistence_probe` table also remains from the volume-learning phase and can be removed during a later cleanup step.

## Documentation workflow

`README.md` explains purpose, boundaries, and milestone scope.

`IMPLEMENTATION.md` contains implementation sequence, verified architecture, and technical decisions/debt.

`STATUS.md` records what has actually been verified and what should happen next.

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

For a new chat, read these three files before making backend changes:

- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
