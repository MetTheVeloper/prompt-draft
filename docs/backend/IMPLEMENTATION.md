# Backend Implementation Plan

## Architecture baseline

Milestone 1 and Milestone 2 are complete and locally verified.

Current verified path:

```text
Nuxt frontend :3030
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> request parsing + validation
  -> temporary process memory
  -> JSON response
```

The backend stays independent from Nuxt server routes so the frontend can continue to be statically generated.

Current backend files:

```text
backend/
├── src/
│   └── index.mjs
├── package.json
└── Dockerfile

compose.yaml
```

## Milestone 2 — COMPLETE

Milestone 2 used a Wizard-shaped resource rather than a Todo/demo resource:

```http
POST /api/wizard-runs
GET /api/wizard-runs
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

This shape deliberately points toward future Wizard history while remaining provisional.

### Phase 0 — API contract: DONE

Defined the learning endpoint, payload direction, boundaries, and phased implementation.

### Phase 1 — POST happy path: DONE

The Node request body is read as a stream:

```text
request chunks
  -> Buffer
  -> UTF-8 string
  -> JSON.parse
```

A successful request returns `201 Created` with generated `id` and `createdAt` fields.

### Phase 2 — validation and client errors: DONE

Current rules:

- `Content-Type` must resolve to `application/json`;
- malformed JSON -> `400 Bad Request`;
- `wizardId`: non-empty string;
- `wizardVersion`: positive integer;
- `output`: non-empty string;
- `snapshot`: JSON object;
- invalid contract data -> `400 Bad Request` with structured field errors;
- unsupported media type -> `415 Unsupported Media Type`.

All behaviors were locally verified.

### Phase 3 — temporary in-memory storage: DONE

The backend owns a process-local `wizardRuns` array.

A successfully validated POST inserts into that array, while:

```http
GET /api/wizard-runs
```

returns `{ ok, count, runs }`.

The user verified data is present during the current Node process lifetime and disappears after recreating the container/process.

### Phase 4 — POST CORS/preflight verification: DONE

The API advertises:

```text
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

The user verified a simulated browser preflight from `http://localhost:3030` returns `204 No Content` with the expected CORS headers.

### Phase 5 — Nuxt POST integration: DONE

The Prompt Draft home page sends one development-only Wizard-shaped JSON POST to the local API and logs the result.

No page UI was changed, and the request remains guarded by `import.meta.dev` so production/static generation does not call localhost.

### Phase 6 — browser end-to-end verification: DONE

The user verified the real browser path:

```text
Nuxt :3030
  -> CORS/preflight contract
  -> POST /api/wizard-runs
  -> validation
  -> in-memory insert
  -> 201 JSON
  -> browser console
```

DevTools showed `POST /api/wizard-runs -> 201`, and a later `GET /api/wizard-runs` confirmed the browser-created run exists in backend process memory.

## Milestone 3 objective — PostgreSQL persistence

Replace temporary process memory with durable PostgreSQL storage while preserving the current API concepts.

The main learning goal is to understand the difference between:

```text
container filesystem / process RAM
```

and:

```text
PostgreSQL data directory backed by a Docker named volume
```

The first persistence milestone should stay deliberately small. No authentication, user ownership, migrations framework, production deployment, or polished history UI should be mixed into the first database step.

## Proposed Milestone 3 phases

### Phase 0 — persistence contract and schema direction

Agree on the first provisional `wizard_runs` table and decide what should be relational columns versus JSON.

Recommended initial fields:

```text
id              UUID primary key
created_at      timestamp with time zone
wizard_id       text
wizard_version  integer
output           text
snapshot         jsonb
```

This matches the current API closely while leaving the snapshot flexible.

### Phase 1 — PostgreSQL Compose service

Add a second service to `compose.yaml` using an official PostgreSQL image.

Learn:

- service-to-service networking;
- database environment variables;
- internal PostgreSQL port `5432`;
- why the API should connect to host `db` inside Compose rather than `localhost`.

Do not integrate the Node API yet; first prove the database container itself starts successfully.

### Phase 2 — named volume and persistence proof

Attach a named Docker volume to PostgreSQL's data directory.

Create a small test artifact/database object, recreate the PostgreSQL container, and prove the data remains.

This is the direct contrast to Milestone-2 in-memory loss.

### Phase 3 — API database connectivity

Add the minimal PostgreSQL Node client dependency and connection configuration through environment variables.

Verify:

```text
API container -> Compose DNS/service name -> PostgreSQL container
```

before changing the Wizard endpoints.

### Phase 4 — first table/schema

Create the first `wizard_runs` table with the provisional schema.

For this learning milestone, prefer an explicit/simple schema-creation step before introducing a migrations framework.

### Phase 5 — replace POST memory insert with database INSERT

Keep validation and `201 Created` behavior, but write accepted runs to PostgreSQL instead of `wizardRuns.push()`.

### Phase 6 — replace GET memory listing with database SELECT

Return durable rows from PostgreSQL through the existing `GET /api/wizard-runs` endpoint.

### Phase 7 — durability verification

Create a run, verify it through GET, recreate the API and PostgreSQL containers, then verify the same run still exists.

Milestone 3 is complete only after user-confirmed local persistence survives container recreation.

## After Milestone 3

Only after database persistence is understood should the project move toward production product semantics:

- tighten/version the Wizard snapshot contract;
- remove the home-page test POST and connect persistence to a real successful Wizard completion/copy event;
- later add authentication and user ownership;
- later build Wizard history/list/restore UI;
- later introduce a migrations workflow suitable for production deployments.
