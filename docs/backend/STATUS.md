# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

Base: stable `main` at Prompt Draft v2.0.0 release line.

## Current milestone

Milestone 1: run an independent local backend in Docker, expose one GET API, call that endpoint from the Prompt Draft home page, and verify the response in the browser console.

## Verification rule

A phase is marked `DONE` only after the user has run the relevant commands or behavior locally and confirmed the result. Code creation alone is not sufficient.

## Progress

### Phase 0 — prerequisites: DONE

User confirmed Docker Desktop/daemon, Docker CLI, Docker Compose, image pulling, and container execution.

Confirmed versions:

```text
Docker version 29.7.2, build a7dcaa6
Docker Compose version v5.4.0
```

`docker run hello-world` completed successfully.

### Phase 1 — minimal backend source: DONE

Created:

```text
backend/package.json
backend/src/index.mjs
```

Implementation uses Node built-in `node:http`, binds to `0.0.0.0:4000`, exposes `GET /api/hello`, and returns JSON `404` for unmatched routes.

User verified directly on the host:

```powershell
pnpm --dir backend start
curl.exe http://localhost:4000/api/hello
```

Expected response was confirmed:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

### Phase 2 — Dockerfile: DONE

Created:

```text
backend/Dockerfile
```

Image uses `node:24-alpine` and starts `node src/index.mjs`.

User verified the manual Docker flow:

```powershell
docker build -t prompt-draft-api ./backend
docker run --rm -p 4000:4000 prompt-draft-api
curl.exe http://localhost:4000/api/hello
```

The API returned the expected JSON through the host-to-container port mapping.

### Phase 3 — Docker Compose service: DONE

Created:

```text
compose.yaml
```

Configured service:

```yaml
services:
  api:
    build:
      context: ./backend
    ports:
      - "4000:4000"
    environment:
      HOST: 0.0.0.0
      PORT: 4000
```

The first Compose attempt exposed a useful runtime issue: the earlier manually started Phase 2 container still owned host port `4000`. After that container was stopped, one stale Compose container instance still lacked the expected published port. The project was fully removed and the resolved configuration was checked with `docker compose config`, which correctly showed target/published port `4000`.

The user then performed a clean recreation:

```powershell
docker compose up --build --force-recreate
```

and confirmed the service started successfully. `docker compose ps` showed:

```text
0.0.0.0:4000->4000/tcp, [::]:4000->4000/tcp
```

The user also confirmed:

```powershell
docker compose port api 4000
```

returned:

```text
0.0.0.0:4000
```

This verifies Docker Compose is now correctly building, creating, networking, and publishing the Prompt Draft API service.

### Phase 4 — direct host/API test: DONE

While the clean Compose service was running, the user called from Windows:

```powershell
curl.exe http://127.0.0.1:4000/api/hello
```

and confirmed:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

This proves the full local path works:

```text
Windows host -> published Docker port 4000 -> Compose API container -> Node HTTP server -> JSON response
```

### Phase 5 — development CORS: NOT STARTED

Next task.

The Nuxt dev frontend and local API use different origins (`localhost:3000` and port `4000`), so the browser-facing API request needs an explicit development CORS policy before frontend integration is considered complete.

### Phase 6 — Nuxt home-page GET integration: NOT STARTED

### Phase 7 — browser console end-to-end verification: NOT STARTED

## Next action

Implement Phase 5 only first: add a small, explicit development CORS policy to the independent backend while preserving the existing `/api/hello` behavior.

After rebuilding/restarting the Compose service and confirming the API still works, proceed to the minimal `app/pages/index.vue` GET call and browser-console test.

Do not add PostgreSQL, authentication, Wizard persistence, or unrelated backend features during this milestone.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
