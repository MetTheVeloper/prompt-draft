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

The user locally confirmed a correct POST returns:

```text
HTTP/1.1 201 Created
```

with generated UUID `id`, ISO `createdAt`, and the submitted Wizard-run-shaped payload.

### Phase 2 — validation and useful 4xx errors: DONE

Current validation:

- `Content-Type` must resolve to `application/json`;
- malformed JSON -> `400 Bad Request`;
- non-empty `wizardId` string;
- positive integer `wizardVersion`;
- non-empty `output` string;
- plain-object `snapshot`;
- invalid fields -> `400 Bad Request` with structured `errors`;
- unsupported media type -> `415 Unsupported Media Type`.

The user locally verified:

1. valid request -> `201 Created`;
2. invalid fields -> `400 Bad Request` with all expected field errors;
3. `Content-Type: text/plain` -> `415 Unsupported Media Type`;
4. malformed JSON -> `400 Bad Request`.

### Phase 3 — temporary in-memory storage/read-back: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Updated `backend/src/index.mjs`:

- added process-local `wizardRuns` array;
- valid `POST /api/wizard-runs` now pushes the created run into memory;
- added `GET /api/wizard-runs`;
- GET returns `{ ok, count, runs }`;
- no database or volume is involved.

Important behavior to verify:

```text
POST run
  -> stored in current Node process RAM
  -> GET list returns it

container recreate/restart
  -> new Node process
  -> RAM list is empty again
```

Phase 3 is not `DONE` until the user verifies both read-back and data loss after container recreation.

### Phase 4 — POST CORS/preflight verification: NOT STARTED

### Phase 5 — Nuxt POST integration: NOT STARTED

### Phase 6 — browser end-to-end verification: NOT STARTED

## Next action

Sync the branch and recreate the API container:

```powershell
git pull
docker compose up --build --force-recreate
```

Then:

1. GET `/api/wizard-runs` and confirm the new process starts with `count: 0`;
2. POST a valid run;
3. GET `/api/wizard-runs` and confirm `count: 1` and the posted run is present;
4. recreate the API container again;
5. GET `/api/wizard-runs` and confirm the list has reset to `count: 0`.

After user confirmation, mark Phase 3 `DONE` and proceed to Phase 4 POST CORS/preflight verification.

PostgreSQL, authentication, and durable Wizard persistence are not implemented yet.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
