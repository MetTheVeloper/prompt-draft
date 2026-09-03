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

### Phase 3 — Docker Compose service: IMPLEMENTED, RUNTIME BLOCKED BY PORT CONFLICT

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

The user ran:

```bash
docker compose up --build
```

Compose successfully:

- loaded the Dockerfile;
- reused/built the backend image;
- created the `prompt-draft_default` network;
- created the `prompt-draft-api-1` container.

Runtime startup then failed with:

```text
Bind for 0.0.0.0:4000 failed: port is already allocated
```

This means host port `4000` was still owned by another running process/container, most likely the manually started Phase 2 Docker container.

A simultaneous call to:

```bash
curl.exe http://localhost:4000/api/hello
```

still returned the expected JSON, which confirms something else was already listening on port `4000`; it does NOT yet verify the Compose-created container.

Phase 3 therefore remains incomplete until the existing owner of port `4000` is stopped and `docker compose up` starts successfully.

### Phase 4 — direct host/API test: NOT YET VERIFIED FOR COMPOSE

The host API response currently works, but because Compose failed to bind port `4000`, the successful response cannot yet be attributed to the Compose service.

### Phase 5 — development CORS: NOT STARTED

### Phase 6 — Nuxt home-page GET integration: NOT STARTED

### Phase 7 — browser console end-to-end verification: NOT STARTED

## Next action

Identify the Docker container currently publishing host port `4000`:

```powershell
docker ps --filter "publish=4000"
```

If a container appears, stop it using its container ID or name:

```powershell
docker stop <container-id-or-name>
```

Then confirm port `4000` is no longer owned by a running Docker container:

```powershell
docker ps --filter "publish=4000"
```

After the port is free, start Compose again from the repository root:

```powershell
docker compose up --build
```

Expected successful backend log:

```text
Prompt Draft API listening on http://0.0.0.0:4000
```

Then, in a second PowerShell window:

```powershell
curl.exe http://localhost:4000/api/hello
```

Expected response:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

Only after that user-confirmed run should Phase 3 and Phase 4 be marked `DONE`.

Do not add CORS or modify the Nuxt home page before this verification.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
