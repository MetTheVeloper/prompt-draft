# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

Base: stable `main` at Prompt Draft v2.0.0 release line.

## Current milestone

Milestone 1: run an independent local backend in Docker, expose one GET API, call that endpoint from the Prompt Draft home page, and verify the response in the browser console.

## Verification rule

A phase is marked `DONE` only after the user has run the relevant commands or behavior locally and confirmed the result.

Code creation alone is not sufficient to mark a runtime phase complete.

## Progress

### Phase 0 — prerequisites: DONE

User confirmed Docker CLI, Docker Desktop/daemon, Docker Compose, image pulling, and container execution by successfully running `docker run hello-world`.

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

The user locally ran:

```bash
pnpm --dir backend start
```

and confirmed:

```text
Prompt Draft API listening on http://0.0.0.0:4000
```

Then:

```bash
curl.exe http://localhost:4000/api/hello
```

returned:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

This verified the backend itself before Docker was introduced.

### Phase 2 — Dockerfile: DONE

Created:

```text
backend/Dockerfile
```

Image design:

- base image `node:24-alpine`;
- working directory `/app`;
- backend source copied into the image;
- default host `0.0.0.0`;
- default port `4000`;
- Node server is the container process.

The user confirmed the full manual Docker flow:

```bash
docker build -t prompt-draft-api ./backend
docker run --rm -p 4000:4000 prompt-draft-api
```

The container logged:

```text
Prompt Draft API listening on http://0.0.0.0:4000
```

while the previous host-started Node process had been stopped.

The user then confirmed from a separate PowerShell window:

```bash
curl.exe http://localhost:4000/api/hello
```

returned:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

This confirms the API was running inside Docker and was reachable through the host-to-container port mapping.

### Phase 3 — Docker Compose service: RUNNING, HOST CONNECTIVITY NOT YET VERIFIED

Created:

```text
compose.yaml
```

Current Compose service:

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

The first Compose attempt successfully built the image but could not start because host port `4000` was already owned by the Phase 2 container.

The user identified that container with:

```powershell
docker ps --filter "publish=4000"
```

and stopped container `ad1c110cd65c`. A follow-up `docker ps --filter "publish=4000"` showed no container using the port.

The user then ran:

```powershell
docker compose up --build
```

and Compose successfully started the service. The attached log showed:

```text
api-1  | Prompt Draft API listening on http://0.0.0.0:4000
```

However, a host-side request immediately afterward failed:

```powershell
curl.exe http://localhost:4000/api/hello
```

with:

```text
curl: (7) Failed to connect to localhost port 4000: Could not connect to server
```

Therefore the application process appears to be running inside the Compose container, but host-to-container connectivity has not yet been verified. Do not mark Phase 3 complete yet.

### Phase 4 — direct host/API test: NOT YET VERIFIED FOR COMPOSE

Manual Docker host connectivity was previously verified in Phase 2. The current unresolved issue is specifically the Compose-created service.

### Phase 5 — development CORS: NOT STARTED

### Phase 6 — Nuxt home-page GET integration: NOT STARTED

### Phase 7 — browser console end-to-end verification: NOT STARTED

## Next diagnostic action

Keep `docker compose up --build` running in the first terminal.

In a second PowerShell window run:

```powershell
docker compose ps
```

Then:

```powershell
docker compose port api 4000
```

Then try IPv4 explicitly:

```powershell
curl.exe http://127.0.0.1:4000/api/hello
```

If host access still fails, verify the API from inside the running container:

```powershell
docker compose exec api node -e "fetch('http://127.0.0.1:4000/api/hello').then(r=>r.text()).then(console.log)"
```

These results will distinguish among:

1. the Compose container not actually remaining running;
2. the host port not being published as expected;
3. a localhost/IPv6 resolution issue on Windows;
4. a Docker Desktop host-forwarding issue despite the application being healthy inside the container.

Do not modify CORS, Nuxt, or backend code until this host connectivity issue is understood.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
