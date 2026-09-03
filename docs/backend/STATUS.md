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

The user then confirmed from a separate PowerShell window:

```bash
curl.exe http://localhost:4000/api/hello
```

returned:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

This confirms the API was running inside Docker and was reachable through the host-to-container port mapping.

### Phase 3 — Docker Compose service: CONTAINER HEALTHY, HOST PORT NOT PUBLISHED

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

The initial Compose run hit a host-port conflict because the Phase 2 container was still publishing port `4000`. The user identified and stopped container `ad1c110cd65c`, then confirmed no running container still published port `4000`.

A subsequent:

```powershell
docker compose up --build
```

started the Compose service and the backend logged:

```text
api-1  | Prompt Draft API listening on http://0.0.0.0:4000
```

Further diagnostics showed:

```powershell
docker compose ps
```

reported the service as running but its `PORTS` column showed only:

```text
4000/tcp
```

rather than a host mapping such as:

```text
0.0.0.0:4000->4000/tcp
```

Also:

```powershell
docker compose port api 4000
```

returned:

```text
invalid IP:0
```

and host access failed for both `localhost` and explicit IPv4 `127.0.0.1`.

However, the user verified the API from inside the running Compose container with:

```powershell
docker compose exec api node -e "fetch('http://127.0.0.1:4000/api/hello').then(r=>r.text()).then(console.log)"
```

which returned:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

This proves the Node server and container networking are healthy. The unresolved issue is specifically that the current Compose container does not have the expected host port publication.

The most likely explanation is that the Compose container created during the earlier failed port-bind attempt was later reused rather than cleanly recreated after the conflicting container was stopped.

Phase 3 remains incomplete until a freshly recreated Compose container exposes host port `4000` correctly.

### Phase 4 — direct host/API test: NOT YET VERIFIED FOR COMPOSE

Manual Docker host connectivity was previously verified in Phase 2. Current failure is isolated to the Compose-created service's host port publication.

### Phase 5 — development CORS: NOT STARTED

### Phase 6 — Nuxt home-page GET integration: NOT STARTED

### Phase 7 — browser console end-to-end verification: NOT STARTED

## Next diagnostic action

Stop the attached Compose process if necessary, then fully remove the current Compose container/network state:

```powershell
docker compose down
```

Confirm no Compose container remains:

```powershell
docker compose ps -a
```

Inspect the resolved Compose configuration:

```powershell
docker compose config
```

The resolved `api` service should still contain a published port mapping for host `4000` to container `4000`.

Then force creation of a fresh container:

```powershell
docker compose up --build --force-recreate
```

In another PowerShell window verify:

```powershell
docker compose ps
```

Expected `PORTS` shape:

```text
0.0.0.0:4000->4000/tcp
```

Then test:

```powershell
curl.exe http://127.0.0.1:4000/api/hello
```

Expected response:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

Do not modify CORS, Nuxt, backend code, or `compose.yaml` until this clean recreate test is completed.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
