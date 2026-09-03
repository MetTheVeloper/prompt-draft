# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

Base: stable `main` at Prompt Draft v2.0.0 release line.

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is not sufficient.

## Milestone 1 — COMPLETE

Locally verified end to end:

```text
Nuxt frontend (localhost:3030)
  -> browser CORS
  -> host port 4000
  -> Docker Compose API container
  -> Node HTTP server
  -> JSON response
  -> browser console
```

Established capabilities:

- independent backend package;
- Node HTTP server;
- `GET /api/hello`;
- Dockerfile;
- Docker Compose;
- host/container networking;
- explicit local CORS;
- verified Nuxt-to-backend browser request;
- static frontend/backend deployment separation preserved.

## Milestone 2 — IN PROGRESS

Goal: learn JSON POST requests, request-body parsing, validation, status codes, temporary application memory, and browser POST/preflight behavior before PostgreSQL is introduced.

Product direction: use a Wizard-run-shaped resource so the learning work points toward future Wizard snapshots/history.

### Phase 0 — API contract: DONE

Initial endpoint:

```http
POST /api/wizard-runs
```

Conceptual payload:

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

The final production snapshot schema is intentionally not locked yet.

### Phase 1 — POST happy path: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Updated:

```text
backend/src/index.mjs
```

New implementation:

- imports `randomUUID` from `node:crypto`;
- adds reusable `sendJson()` response helper;
- adds `readJsonBody()` using async iteration over the Node request stream;
- adds `POST /api/wizard-runs`;
- parsed JSON object is returned as a transient run record;
- generated fields: `id` and `createdAt`;
- successful status: `201 Created`;
- malformed JSON returns a basic `400` response;
- non-object JSON returns a basic `400` response;
- CORS method advertisement now includes `POST`.

Important: accepted runs are **not stored yet**. Phase 3 will introduce temporary in-memory storage.

First local POST attempt used PowerShell backtick line continuations inside `cmd.exe`. Command Prompt treated each line as a separate command, so the first request reached the API without a JSON body and correctly returned `400`, while later `-H` and `--data-raw` lines were interpreted as separate shell commands. This does not indicate a backend failure. `GET /api/hello` remained successful.

Phase 1 remains incomplete until a correctly formed POST request returns `201` with generated `id` and `createdAt`.

### Phase 2 — validation and useful 4xx errors: NOT STARTED

Planned validation:

- non-empty `wizardId` string;
- positive integer `wizardVersion`;
- non-empty `output` string;
- plain-object `snapshot`;
- explicit content-type/error behavior.

### Phase 3 — temporary in-memory storage/read-back: NOT STARTED

Planned process-local run collection plus a GET read-back endpoint. Container restart/recreation will intentionally erase it.

### Phase 4 — POST CORS/preflight verification: NOT STARTED

### Phase 5 — Nuxt POST integration: NOT STARTED

### Phase 6 — browser end-to-end verification: NOT STARTED

## Next action

The Docker API is running and `GET /api/hello` is healthy. Re-run the Phase 1 POST with syntax appropriate to the active shell. In `cmd.exe`, use a single-line command (or CMD caret continuations); in PowerShell, backtick continuations are valid.

After the user confirms `201 Created`, mark Phase 1 `DONE` and begin Phase 2 validation.

PostgreSQL, authentication, and durable Wizard persistence are not implemented yet.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
