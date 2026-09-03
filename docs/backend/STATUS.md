# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

Base: stable `main` at Prompt Draft v2.0.0 release line.

## Current milestone

Milestone 1: COMPLETE.

Goal: run an independent local backend in Docker, expose one GET API, call that endpoint from the Prompt Draft home page, and verify the response in the browser console.

## Verification rule

A phase is marked `DONE` only after the user has run the relevant commands or behavior locally and confirmed the result. Code creation alone is not sufficient.

## Progress

### Phase 0 — prerequisites: DONE

Docker Desktop/daemon, Docker CLI, Docker Compose, image pulling, and container execution were locally verified.

Confirmed versions:

```text
Docker version 29.7.2, build a7dcaa6
Docker Compose version v5.4.0
```

### Phase 1 — minimal backend source: DONE

Created:

```text
backend/package.json
backend/src/index.mjs
```

User verified the Node HTTP server directly on the host and confirmed:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

### Phase 2 — Dockerfile: DONE

Created:

```text
backend/Dockerfile
```

User verified the manual Docker image/container flow and host-to-container `4000:4000` access.

### Phase 3 — Docker Compose service: DONE

Created:

```text
compose.yaml
```

After resolving an earlier port conflict and stale runtime state, the clean Compose service was locally verified with:

```text
0.0.0.0:4000->4000/tcp, [::]:4000->4000/tcp
```

### Phase 4 — direct host/API test: DONE

While the Compose service was running, the user confirmed from Windows:

```powershell
curl.exe http://127.0.0.1:4000/api/hello
```

returned:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

### Phase 5 — development CORS: DONE

The backend applies an explicit local-development CORS allowlist and supports `OPTIONS` preflight requests.

The actual Prompt Draft Nuxt development origin is:

```text
http://localhost:3030
```

The Docker environment now explicitly allows:

```text
http://localhost:3030
http://127.0.0.1:3030
```

The user first verified the CORS behavior with direct header tests, then verified the corrected `3030` origin through the real browser integration.

### Phase 6 — Nuxt home-page GET integration: DONE

Updated:

```text
app/pages/index.vue
```

The home page performs one development-only request on mount:

```text
GET http://127.0.0.1:4000/api/hello
```

The request is guarded by `import.meta.dev`, so production/static builds do not attempt to call the local API. No home-page UI was changed.

The user confirmed the request executes successfully from Prompt Draft running at `http://localhost:3030`.

### Phase 7 — browser console end-to-end verification: DONE

The user confirmed the browser console displays:

```text
[Prompt Draft API] { ok: true, message: 'Hello from Prompt Draft API' }
```

This verifies the complete local path:

```text
Nuxt frontend (localhost:3030)
  -> browser CORS check
  -> host port 4000
  -> Docker Compose API container
  -> Node HTTP server
  -> JSON response
  -> browser console
```

## Milestone 1 result

Milestone 1 is complete and locally verified end to end.

The project now has:

- an independent backend package;
- a real Node HTTP server;
- Docker image definition;
- Docker Compose service;
- host-to-container networking;
- explicit local CORS policy;
- a verified frontend-to-backend request;
- preserved static/frontend deployment separation.

## Recommended next milestone

Milestone 2 should introduce request data rather than a database immediately:

1. add a real `POST` endpoint;
2. learn JSON request bodies and HTTP status codes;
3. validate incoming data and return useful `4xx` errors;
4. call that POST endpoint from Prompt Draft;
5. keep storage temporary/in-memory only for this learning step;
6. after the request/validation flow is understood, add PostgreSQL as the next Compose service and replace temporary storage with persistence.

The POST shape should be chosen to point toward the future Wizard run/snapshot feature rather than using an unrelated Todo-style example.

PostgreSQL, authentication, and Wizard persistence have not been implemented yet.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
