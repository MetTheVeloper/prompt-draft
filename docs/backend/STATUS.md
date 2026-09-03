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

Confirmed response:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

### Phase 2 — Dockerfile: DONE

Created:

```text
backend/Dockerfile
```

User verified the manual Docker image/container flow and confirmed the API was reachable through `4000:4000`.

### Phase 3 — Docker Compose service: DONE

Created:

```text
compose.yaml
```

After resolving an earlier port conflict and stale container state, the user performed a clean recreation:

```powershell
docker compose up --build --force-recreate
```

and confirmed:

```text
0.0.0.0:4000->4000/tcp, [::]:4000->4000/tcp
```

`docker compose port api 4000` returned:

```text
0.0.0.0:4000
```

### Phase 4 — direct host/API test: DONE

While the clean Compose service was running, the user confirmed from Windows:

```powershell
curl.exe http://127.0.0.1:4000/api/hello
```

returned:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

This proves:

```text
Windows host -> published Docker port 4000 -> Compose API container -> Node HTTP server -> JSON response
```

### Phase 5 — development CORS: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Updated:

```text
backend/src/index.mjs
```

Current CORS behavior:

- no external CORS package;
- default allowlist contains `http://localhost:3000` and `http://127.0.0.1:3000`;
- the allowlist can later be overridden with comma-separated `CORS_ORIGINS`;
- allowed origins receive `Access-Control-Allow-Origin` matching the request origin;
- allowed responses advertise `GET, OPTIONS` and `Content-Type`;
- `Vary: Origin` is included;
- `OPTIONS` returns `204`;
- origins outside the allowlist receive no `Access-Control-Allow-Origin` header.

The existing `/api/hello` response and JSON `404` behavior are preserved.

Local container rebuild/header verification is required before Phase 5 becomes `DONE`.

### Phase 6 — Nuxt home-page GET integration: NOT STARTED

### Phase 7 — browser console end-to-end verification: NOT STARTED

## Next action

Sync the branch and rebuild/recreate the Compose API so the updated source is copied into a new image/container:

```powershell
git pull
docker compose up --build --force-recreate
```

Keep Compose running. In a second PowerShell window test an allowed origin:

```powershell
curl.exe -i -H "Origin: http://localhost:3000" http://127.0.0.1:4000/api/hello
```

Expected response includes:

```text
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

and the existing JSON body.

Also verify an origin outside the allowlist:

```powershell
curl.exe -i -H "Origin: http://example.com" http://127.0.0.1:4000/api/hello
```

The request may still receive the API JSON because curl does not enforce browser CORS, but the response must NOT contain `Access-Control-Allow-Origin: http://example.com`.

Optionally verify the preflight path:

```powershell
curl.exe -i -X OPTIONS -H "Origin: http://localhost:3000" http://127.0.0.1:4000/api/hello
```

Expected status: `204 No Content` with the allowed-origin CORS headers.

Only after user confirmation should Phase 5 be marked `DONE` and `app/pages/index.vue` be modified for Phase 6.

Do not add PostgreSQL, authentication, Wizard persistence, or unrelated backend features during this milestone.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
