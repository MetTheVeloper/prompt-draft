# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result.

## Milestone 1 — COMPLETE

Verified end to end: Nuxt `localhost:3030` -> Docker API `:4000` -> Node HTTP server -> browser console.

## Milestone 2 — COMPLETE

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

This proves the data existed only in the current Node process RAM and was not durable.

### Phase 4 — POST CORS/preflight verification: DONE

User verified a simulated browser preflight from `http://localhost:3030` with requested method `POST` and requested header `content-type`.

The API returned:

```text
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3030
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

### Phase 5 — Nuxt POST integration: DONE

`app/pages/index.vue` sends a development-only Wizard-shaped POST to:

```http
POST http://127.0.0.1:4000/api/wizard-runs
```

No page UI was changed. The test request remains guarded by `import.meta.dev`, so static/production generation does not POST to localhost.

The user verified the browser console displays a successful `[Prompt Draft API POST]` response containing a generated Wizard run.

### Phase 6 — browser end-to-end verification: DONE

The user verified the real browser request path. DevTools Network showed:

```text
GET  /api/hello        -> 200
POST /api/wizard-runs  -> 201
```

The browser console showed the successful POST response, including a generated run id and timestamp.

A direct backend read-back then confirmed the Nuxt-created run exists in current process memory:

```json
{
  "ok": true,
  "count": 1,
  "runs": [
    {
      "wizardId": "portrait",
      "wizardVersion": 1,
      "output": "Created from Prompt Draft Nuxt dev client"
    }
  ]
}
```

This verifies the complete Milestone-2 path:

```text
Nuxt frontend :3030
  -> browser CORS/preflight contract
  -> POST /api/wizard-runs
  -> Docker API :4000
  -> JSON parsing
  -> validation
  -> in-memory insert
  -> 201 JSON response
  -> browser console
  -> GET read-back
```

## Milestone 2 result

Milestone 2 is complete and locally verified end to end.

Established capabilities now include:

- GET and POST HTTP methods;
- Node request-stream body reading;
- JSON parsing;
- explicit request validation;
- meaningful `201`, `400`, `404`, and `415` behavior;
- generated UUIDs and timestamps;
- POST CORS/preflight behavior;
- temporary process-local storage;
- browser POST integration from Nuxt;
- a concrete demonstration that container/process recreation destroys in-memory data.

## Next milestone — Milestone 3: PostgreSQL persistence

Milestone 3 should replace the temporary `wizardRuns` array with durable database storage while keeping the existing API contract recognizable.

Recommended learning sequence:

1. add PostgreSQL as a second Docker Compose service;
2. add a named Docker volume and understand container storage vs volume storage;
3. verify API-container -> PostgreSQL-container networking through the Compose service name;
4. add a minimal Node PostgreSQL client dependency and environment-based connection configuration;
5. create the first `wizard_runs` table/schema;
6. replace in-memory POST storage with an INSERT;
7. replace in-memory GET listing with a SELECT;
8. recreate the API and PostgreSQL containers and prove the run still exists because the volume persists data;
9. only after persistence is understood, tighten the provisional Wizard snapshot schema and connect the API to a real Wizard completion/copy event instead of the home-page test payload.

Authentication, users, production Wizard-history UI, and deployment are still deferred.

## Next action

Before implementing Milestone 3, review and agree on its phases and PostgreSQL data shape. Do not add database code merely because Milestone 2 is complete.

Because this status file changed remotely, sync the branch before continuing locally:

```powershell
git pull
```

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
