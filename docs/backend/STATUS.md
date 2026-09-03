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

## Milestone 2 — IN PROGRESS

Goal: learn JSON POST requests, request-body parsing, validation, status codes, temporary application memory, and browser POST/preflight behavior before PostgreSQL is introduced.

Product direction: use a Wizard-run-shaped resource so the learning work points toward future Wizard snapshots/history.

### Phase 0 — API contract: DONE

Endpoint:

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

### Phase 1 — POST happy path: DONE

Implemented in `backend/src/index.mjs`:

- Node request stream reading;
- JSON parsing;
- `POST /api/wizard-runs`;
- generated UUID with `randomUUID()`;
- generated ISO `createdAt` timestamp;
- `201 Created` response;
- reusable `sendJson()` helper.

The first local attempt used PowerShell backtick continuation syntax inside `cmd.exe`, so the request body was not sent correctly. This was a shell-command issue rather than a backend issue.

The user then ran a correct single-line CMD request and confirmed:

```text
HTTP/1.1 201 Created
```

with a response containing generated `id`, `createdAt`, and the submitted Wizard-run-shaped payload.

`GET /api/hello` remained healthy during the regression check.

Important: accepted runs are still not stored. Phase 3 introduces temporary in-memory storage.

### Phase 2 — validation and useful 4xx errors: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Updated `backend/src/index.mjs` with explicit request validation.

Current rules:

- request `Content-Type` must resolve to `application/json`;
- invalid/missing JSON media type returns `415 Unsupported Media Type`;
- malformed JSON returns `400 Bad Request`;
- JSON body must be an object;
- `wizardId` must be a non-empty string;
- `wizardVersion` must be a positive integer;
- `output` must be a non-empty string;
- `snapshot` must be an object;
- invalid fields return `400 Bad Request` with a structured `errors` array;
- valid requests still return `201 Created`.

Phase 2 is not `DONE` until the user rebuilds/recreates the API container and locally verifies valid and invalid requests.

### Phase 3 — temporary in-memory storage/read-back: NOT STARTED

Planned process-local run collection plus a GET read-back endpoint. Container restart/recreation will intentionally erase it.

### Phase 4 — POST CORS/preflight verification: NOT STARTED

### Phase 5 — Nuxt POST integration: NOT STARTED

### Phase 6 — browser end-to-end verification: NOT STARTED

## Next action

Sync and rebuild the API:

```powershell
git pull
docker compose up --build --force-recreate
```

Then verify Phase 2 with:

1. one valid request returning `201`;
2. one invalid field payload returning `400` with field errors;
3. one request with a non-JSON `Content-Type` returning `415`;
4. optionally one malformed JSON body returning `400`.

After user confirmation, mark Phase 2 `DONE` and begin Phase 3 in-memory storage/read-back.

PostgreSQL, authentication, and durable Wizard persistence are not implemented yet.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
