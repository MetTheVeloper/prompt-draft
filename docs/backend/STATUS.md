# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result.

## Milestone 1 — COMPLETE

Verified end to end: Nuxt `localhost:3030` -> Docker API `:4000` -> Node HTTP server -> browser console.

## Milestone 2 — IN PROGRESS

Goal: learn POST bodies, validation, status codes, temporary process memory, CORS/preflight, and frontend POST integration before PostgreSQL.

### Phase 0 — API contract: DONE

Endpoint: `POST /api/wizard-runs`.

### Phase 1 — POST happy path: DONE

User verified a valid request returns `201 Created` with generated `id` and `createdAt`.

### Phase 2 — validation and useful 4xx errors: DONE

User verified:

- valid request -> `201`;
- invalid fields -> `400` with field errors;
- unsupported content type -> `415`;
- malformed JSON -> `400`.

### Phase 3 — temporary in-memory storage/read-back: DONE

Implemented process-local `wizardRuns` storage and `GET /api/wizard-runs`.

User verified:

1. fresh process returned `count: 0`;
2. POST created one run;
3. GET returned `count: 1` with that run;
4. after container recreation, GET returned `count: 0` again.

This confirms the data exists only in the current Node process RAM and is not durable.

### Phase 4 — POST CORS/preflight verification: READY FOR LOCAL VERIFICATION

No code change is required. The API already allows the Prompt Draft dev origin and advertises `POST`, `OPTIONS`, and `Content-Type` for CORS.

Next test should simulate a browser preflight for a JSON POST from `http://localhost:3030` to `/api/wizard-runs` and verify a `204` response with the expected CORS headers.

### Phase 5 — Nuxt POST integration: NOT STARTED

### Phase 6 — browser end-to-end verification: NOT STARTED

## Next action

Verify Phase 4 preflight, then proceed to Nuxt POST integration.

PostgreSQL, authentication, and durable Wizard persistence are not implemented yet.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
