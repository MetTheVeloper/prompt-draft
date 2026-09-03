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

Updated:

```text
backend/src/index.mjs
```

CORS policy:

- default allowed origins: `http://localhost:3000` and `http://127.0.0.1:3000`;
- optional comma-separated `CORS_ORIGINS` override;
- allowed origins receive matching `Access-Control-Allow-Origin`;
- allowed methods: `GET, OPTIONS`;
- allowed header: `Content-Type`;
- `Vary: Origin` is emitted;
- `OPTIONS` returns `204`;
- origins outside the allowlist receive no allow-origin header.

User locally verified:

1. an allowed `http://localhost:3000` request returned `200`, the expected CORS headers, and the API JSON;
2. `http://example.com` received no `Access-Control-Allow-Origin` header;
3. an allowed-origin `OPTIONS` request returned `204 No Content` with the expected CORS headers.

### Phase 6 — Nuxt home-page GET integration: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Updated:

```text
app/pages/index.vue
```

The home page now makes one development-only request on mount:

```text
GET http://127.0.0.1:4000/api/hello
```

and logs either:

```text
[Prompt Draft API] { ok: true, message: 'Hello from Prompt Draft API' }
```

or a labeled error.

The request is guarded by `import.meta.dev`, so production/static builds do not attempt to call the local API. No home-page UI was changed.

### Phase 7 — browser console end-to-end verification: NOT YET VERIFIED

This is now the only remaining milestone-1 verification.

## Next action

1. Sync the feature branch:

```powershell
git pull
```

2. Keep the Compose API running. If it is not running, start/rebuild it:

```powershell
docker compose up --build
```

3. In another terminal, run Prompt Draft in Nuxt development mode:

```powershell
pnpm dev
```

4. Confirm the Nuxt dev URL is `http://localhost:3000` (or `http://127.0.0.1:3000`). If Nuxt chooses another port, the current CORS allowlist will not match and should be adjusted rather than bypassed.

5. Open the home page, open browser DevTools -> Console, and verify a log like:

```text
[Prompt Draft API] { ok: true, message: 'Hello from Prompt Draft API' }
```

If that result is user-confirmed, mark Phase 6 and Phase 7 `DONE` and Milestone 1 complete.

Do not add PostgreSQL, authentication, Wizard persistence, or unrelated backend features during this milestone.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
