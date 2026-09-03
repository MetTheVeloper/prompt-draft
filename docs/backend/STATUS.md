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

### Phase 3 — Docker Compose service: IMPLEMENTED, AWAITING LOCAL VERIFICATION

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

The service is named `api` and builds from `backend/Dockerfile`.

Local verification still required before Phase 3 is marked `DONE`.

### Phase 4 — direct host/API test: NOT STARTED

This phase will be verified immediately after the Compose service is running by calling `/api/hello` from the host.

### Phase 5 — development CORS: NOT STARTED

### Phase 6 — Nuxt home-page GET integration: NOT STARTED

### Phase 7 — browser console end-to-end verification: NOT STARTED

## Next action

1. Sync the branch:

```bash
git pull
```

2. Stop the current manually started Docker container with `Ctrl+C` if it is still running so host port `4000` is free.

3. From the repository root run:

```bash
docker compose up --build
```

Expected behavior: Compose builds if necessary, creates/starts the `api` service, and the backend logs that it is listening on `0.0.0.0:4000`.

4. In another PowerShell window run:

```bash
curl.exe http://localhost:4000/api/hello
```

Expected response:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

If both are user-confirmed, Phase 3 and Phase 4 can be marked `DONE` together.

Do not add CORS or modify the Nuxt home page before this verification.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
