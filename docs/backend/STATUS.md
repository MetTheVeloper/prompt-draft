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

### Phase 3 — Docker Compose service: CONFIG VERIFIED, FRESH RUNTIME TEST PENDING

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

History of the current diagnostic:

1. The first Compose run hit a host-port conflict because the Phase 2 container still owned port `4000`.
2. User identified and stopped container `ad1c110cd65c` and confirmed no running container still published port `4000`.
3. A subsequent Compose container started and the API was healthy inside the container, but `docker compose ps` showed only `4000/tcp` rather than a host mapping.
4. Host access failed, while an in-container request succeeded, proving the Node server itself was healthy.
5. The Compose project was then fully stopped and removed. `docker compose ps -a` returned no containers.
6. User ran `docker compose config`; the resolved configuration correctly includes:

```text
mode: ingress
target: 4000
published: "4000"
protocol: tcp
```

This confirms `compose.yaml` itself is correct and explicitly requests host port `4000` publication.

The previous non-published container was therefore stale/invalid runtime state rather than a Compose-file configuration error.

Phase 3 is not yet `DONE`; it now needs one clean container recreation and host verification.

### Phase 4 — direct host/API test: NOT YET VERIFIED FOR CLEAN COMPOSE RUN

Manual Docker host connectivity was already verified in Phase 2. This phase will be completed together with Phase 3 after the fresh Compose container is reachable from Windows.

### Phase 5 — development CORS: NOT STARTED

### Phase 6 — Nuxt home-page GET integration: NOT STARTED

### Phase 7 — browser console end-to-end verification: NOT STARTED

## Next action

The Compose project is currently down and its resolved port configuration is confirmed correct.

Create a completely fresh service container:

```powershell
docker compose up --build --force-recreate
```

Keep that terminal attached. In a second PowerShell window run:

```powershell
docker compose ps
```

Expected `PORTS` output should include a host mapping such as:

```text
0.0.0.0:4000->4000/tcp
```

Optionally confirm the resolved published endpoint:

```powershell
docker compose port api 4000
```

Then test from Windows:

```powershell
curl.exe http://127.0.0.1:4000/api/hello
```

Expected response:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

If these succeed, mark Phase 3 and Phase 4 `DONE` and proceed to CORS/frontend integration.

Do not modify CORS, Nuxt, backend code, or `compose.yaml` before this verification.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
