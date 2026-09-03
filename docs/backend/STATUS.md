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

User-confirmed local environment:

```text
Docker version 29.7.2, build a7dcaa6
Docker Compose version v5.4.0
```

`docker run hello-world` completed successfully and printed `Hello from Docker!`.

This confirms that Docker CLI, Docker Desktop/daemon, image pulling, container execution, and Docker Compose are working locally.

The local repository was also confirmed to be on `feature/docker-local-api` with a clean working tree.

### Phase 1 — minimal backend source: DONE

Created:

```text
backend/package.json
backend/src/index.mjs
```

Implementation:

- independent backend package;
- Node built-in `node:http` server;
- no Express/Fastify or external backend dependency;
- default bind address `0.0.0.0`;
- default port `4000`;
- `GET /api/hello` returns the milestone JSON response;
- unmatched routes return JSON `404`.

User locally ran:

```bash
pnpm --dir backend start
```

and confirmed the server logged:

```text
Prompt Draft API listening on http://0.0.0.0:4000
```

The user then confirmed:

```bash
curl.exe http://localhost:4000/api/hello
```

returned:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

This verifies the backend itself works correctly before Docker is introduced.

### Phase 2 — Dockerfile: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Created:

```text
backend/Dockerfile
```

Current image design:

- base image: `node:24-alpine`;
- working directory: `/app`;
- copies `package.json` and `src/`;
- default `HOST=0.0.0.0`;
- default `PORT=4000`;
- documents container port `4000` with `EXPOSE`;
- starts `node src/index.mjs` as the container process.

No dependency-install layer is currently needed because the backend has no external dependencies.

Local verification still required before marking Phase 2 `DONE`.

### Phase 3 — Docker Compose service: NOT STARTED

### Phase 4 — direct host/API test: NOT STARTED

### Phase 5 — development CORS: NOT STARTED

### Phase 6 — Nuxt home-page GET integration: NOT STARTED

### Phase 7 — browser console end-to-end verification: NOT STARTED

## Next action

1. Sync the feature branch locally:

```bash
git pull
```

2. Stop the host-started backend first with `Ctrl+C` if it is still running. Host port `4000` must be free before Docker can publish that same port.

3. Build the backend image from the repository root:

```bash
docker build -t prompt-draft-api ./backend
```

4. Run a container from the image:

```bash
docker run --rm -p 4000:4000 prompt-draft-api
```

5. In a second PowerShell window, verify:

```bash
curl.exe http://localhost:4000/api/hello
```

Expected result:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

Phase 2 becomes `DONE` only after the user confirms that this response is coming while the host Node process is stopped and the Docker container is running.

Do not add Docker Compose, PostgreSQL, authentication, Wizard persistence, or other backend services before that verification.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
