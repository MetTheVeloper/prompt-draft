# Backend Implementation Plan

## Architecture baseline

Milestone 1 is complete and verified:

```text
Nuxt frontend :3030
  -> Docker API :4000
  -> Node HTTP server
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

## Milestone 2 objective

Learn the inbound HTTP request path before adding PostgreSQL.

The milestone uses a Wizard-shaped API rather than a Todo/demo resource:

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

This shape deliberately points toward future Wizard history while remaining provisional. Durable storage and the final production snapshot schema are not part of Milestone 2.

## Milestone 2 phases

### Phase 0 — API contract: DONE

Define the learning endpoint, payload direction, boundaries, and phased implementation.

### Phase 1 — POST happy path: DONE

`POST /api/wizard-runs` reads the Node request body as a stream:

```text
request chunks
  -> Buffer
  -> UTF-8 string
  -> JSON.parse
```

A successful request returns:

```http
201 Created
```

with generated `id` and `createdAt` fields.

The user locally verified a correct POST from Windows CMD and received the expected `201` response.

Important: this phase does **not** store the returned run. The record currently exists only as the response object for that request.

Implementation remains dependency-free and uses Node built-ins:

- `node:http`;
- `node:crypto` `randomUUID()`.

### Phase 2 — validation and client errors: IMPLEMENTED, AWAITING LOCAL VERIFICATION

The API now distinguishes parsing/contract problems before creating a run.

Content type:

```text
Content-Type: application/json
```

is required. Parameters such as `application/json; charset=utf-8` are accepted because validation compares the media type portion.

Unsupported/missing JSON media type returns:

```http
415 Unsupported Media Type
```

Malformed JSON returns:

```http
400 Bad Request
```

Required field rules:

- `wizardId`: non-empty string;
- `wizardVersion`: positive integer;
- `output`: non-empty string;
- `snapshot`: JSON object, not an array/null/primitive.

Invalid contract data returns:

```http
400 Bad Request
```

with a structured body such as:

```json
{
  "ok": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "wizardVersion",
      "message": "wizardVersion must be a positive integer"
    }
  ]
}
```

A valid request must continue returning `201 Created` after validation is introduced.

### Phase 3 — temporary in-memory storage

Add a process-local collection of accepted runs and a read-back endpoint:

```http
GET /api/wizard-runs
```

This teaches the difference between application memory and durable storage.

Restarting/recreating the container will intentionally erase the list.

### Phase 4 — POST CORS/preflight verification

Verify the real browser preflight requirements for a JSON POST from Prompt Draft `localhost:3030`.

The current CORS advertisement already includes:

```text
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

but browser POST/preflight verification remains a separate user-confirmed phase.

### Phase 5 — Nuxt POST integration

Send one development-only Wizard-shaped request from Prompt Draft. Do not redesign product UI during this learning milestone.

### Phase 6 — browser end-to-end verification

Confirm:

```text
Nuxt :3030
  -> OPTIONS preflight
  -> POST /api/wizard-runs
  -> Docker API
  -> validation
  -> 201 JSON
  -> browser console
```

Milestone 2 is complete only after user-confirmed local browser verification.

## Milestone 3 direction

After Milestone 2, add PostgreSQL as another Compose service, introduce a Docker volume, create the first durable Wizard-run table, and replace temporary in-memory behavior with database persistence.

Authentication and production Wizard history UI remain later work.
