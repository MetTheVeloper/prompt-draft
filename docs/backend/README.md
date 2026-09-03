# Prompt Draft Backend

This directory is the source of truth for backend and Docker integration work in Prompt Draft.

## Current branch

`feature/docker-local-api`

The backend remains intentionally independent from Nuxt server routes. Prompt Draft can continue to use its static-generation frontend workflow while the backend is developed and deployed separately.

## Milestone 1 — complete

Milestone 1 established the local backend path end to end:

```text
Nuxt frontend (localhost:3030)
  -> browser CORS
  -> host port 4000
  -> Docker Compose API container
  -> Node HTTP server
  -> JSON response
  -> browser console
```

## Milestone 2 — complete

Milestone 2 established the inbound request path and temporary application state:

```text
Nuxt :3030
  -> JSON POST
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node request stream
  -> JSON parse
  -> validation
  -> in-memory Wizard run
  -> 201 response
  -> GET read-back
```

Locally verified capabilities now include:

- `GET /api/hello`;
- `POST /api/wizard-runs`;
- `GET /api/wizard-runs`;
- JSON body parsing;
- structured validation errors;
- `201`, `400`, `404`, and `415` response behavior;
- UUID/timestamp generation;
- POST CORS/preflight;
- browser POST integration from Nuxt;
- process-local storage that disappears after container/process recreation.

The Wizard-run payload remains provisional and intentionally points toward future Wizard history without locking the final production snapshot format.

## Current goal — Milestone 3

Add PostgreSQL as a second Docker Compose service and replace temporary in-memory Wizard-run storage with durable database persistence.

The key learning contrast is:

```text
Node process RAM
  -> disappears when the process/container is recreated
```

versus:

```text
PostgreSQL + Docker named volume
  -> data should survive container recreation
```

Recommended provisional database fields:

```text
id              UUID primary key
created_at      timestamp with time zone
wizard_id       text
wizard_version  integer
output           text
snapshot         jsonb
```

Milestone 3 should be implemented incrementally: first start PostgreSQL, then prove volume persistence, then connect the API, then create the table, and only then replace the current in-memory POST/GET behavior.

## Still deferred

- authentication
- users/user ownership
- production Wizard history UI
- final Wizard snapshot schema
- production migrations strategy
- Redis
- VPS deployment
- production domain/HTTPS
- production secrets/configuration

The current home-page GET/POST calls are development learning hooks. They should not become the final product integration point. After durable persistence is established, the test POST should be replaced by a real successful Wizard completion/copy event.

## Documentation workflow

`README.md` explains purpose, boundaries, and milestone scope.

`IMPLEMENTATION.md` contains implementation sequence and technical decisions.

`STATUS.md` records what has actually been verified and what should happen next.

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

For a new chat, read these three files before making backend changes:

- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
