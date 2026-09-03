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

### Phase 4 — POST CORS/preflight verification: DONE

The user simulated the browser preflight for a JSON POST from Prompt Draft:

```text
Origin: http://localhost:3030
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

The API returned:

```text
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3030
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

No backend code change was required for this phase; the existing CORS implementation already supported the required POST preflight contract.

### Phase 5 — Nuxt POST integration: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Updated:

```text
app/pages/index.vue
```

The existing Milestone-1 dev-only GET remains in place.

A second independent dev-only request now sends:

```http
POST http://127.0.0.1:4000/api/wizard-runs
Content-Type: application/json
```

with a provisional Wizard-shaped body and logs the result as:

```text
[Prompt Draft API POST] ...
```

No page UI was changed. The request is inside `onMounted()` and guarded by `import.meta.dev`, so static/production generation does not POST to localhost.

Phase 5 is not `DONE` until the user runs Prompt Draft at `http://localhost:3030`, confirms the browser request succeeds, and sees the `201` run response in DevTools.

### Phase 6 — browser end-to-end verification: NOT STARTED

Final verification should confirm the real browser path:

```text
Nuxt :3030
  -> OPTIONS preflight
  -> POST /api/wizard-runs
  -> validation
  -> in-memory store
  -> 201 JSON
  -> browser console
```

## Next action

Sync the branch, keep/restart the Docker API, run Nuxt dev, and refresh the home page. Verify the POST in DevTools Console and optionally Network. Then use `GET /api/wizard-runs` to confirm the browser-created run exists in process memory.

PostgreSQL, authentication, and durable Wizard persistence are not implemented yet.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
