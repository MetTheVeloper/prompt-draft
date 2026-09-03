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

Locally verified capabilities:

- independent backend package;
- Node HTTP server;
- `GET /api/hello`;
- Dockerfile;
- Docker Compose;
- host/container port mapping;
- explicit development CORS;
- Nuxt-to-backend browser request;
- no dependency on Nuxt server routes.

## Current goal — Milestone 2

Learn the inbound request path by adding a real POST endpoint that points toward future Wizard run/snapshot persistence.

Initial API:

```http
POST /api/wizard-runs
```

Initial conceptual request body:

```json
{
  "wizardId": "portrait",
  "wizardVersion": 1,
  "output": "generated prompt...",
  "snapshot": {
    "answers": {},
    "derived": {}
  }
}
```

The exact production snapshot shape is not being finalized yet. Milestone 2 is about HTTP request bodies, status codes, validation, CORS for POST, and temporary in-memory behavior before PostgreSQL is introduced.

## Milestone 2 phases

1. **POST happy path** — read a JSON request body and return a `201 Created` response.
2. **Validation/errors** — validate fields and return useful `4xx` responses for bad input.
3. **Temporary in-memory storage** — keep accepted Wizard runs only for the lifetime of the Node process and expose a simple read-back path.
4. **POST CORS verification** — support and verify the browser preflight path required by JSON POST requests.
5. **Nuxt POST integration** — send a development-only Wizard-shaped payload from Prompt Draft.
6. **Browser end-to-end verification** — confirm Nuxt -> Docker API -> POST response in the browser.

## Not included yet

- PostgreSQL
- durable persistence
- Redis
- authentication
- users
- production Wizard history UI
- VPS deployment
- production domain/HTTPS
- production secrets/configuration

PostgreSQL is intentionally the next milestone after the POST/request/validation flow is understood.

## Documentation workflow

`README.md` explains purpose, boundaries, and milestone scope.

`IMPLEMENTATION.md` contains implementation sequence and technical decisions.

`STATUS.md` records what has actually been verified and what should happen next.

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

For a new chat, read these three files before making backend changes:

- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
