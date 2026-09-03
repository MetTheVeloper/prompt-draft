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

### Phase 5 — development CORS: CORRECTED FOR ACTUAL DEV ORIGIN, AWAITING RE-VERIFICATION

CORS was first implemented with a development allowlist for port `3000` and was successfully verified at the header level:

- allowed origin received matching `Access-Control-Allow-Origin`;
- disallowed `http://example.com` received no allow-origin header;
- `OPTIONS` returned `204 No Content` with expected headers.

The browser integration then revealed that Prompt Draft intentionally runs Nuxt on:

```text
http://localhost:3030
```

rather than port `3000`. The browser therefore correctly blocked the request because the API response did not allow origin `http://localhost:3030`.

The screenshot/user-confirmed browser error was:

```text
Access to fetch at 'http://127.0.0.1:4000/api/hello'
from origin 'http://localhost:3030'
has been blocked by CORS policy
```

The configuration has now been corrected:

- backend fallback origins: `http://localhost:3030` and `http://127.0.0.1:3030`;
- `compose.yaml` explicitly sets:

```text
CORS_ORIGINS=http://localhost:3030,http://127.0.0.1:3030
```

This keeps the actual local frontend origin explicit in the Docker environment configuration.

A fresh rebuild/recreate and browser verification are still required before Phase 5 is marked `DONE` again.

### Phase 6 — Nuxt home-page GET integration: IMPLEMENTED, FIRST BROWSER ATTEMPT EXPOSED CORS MISMATCH

Updated:

```text
app/pages/index.vue
```

The home page makes one development-only request on mount:

```text
GET http://127.0.0.1:4000/api/hello
```

and logs either the result or a labeled error.

The request is guarded by `import.meta.dev`, so production/static builds do not attempt to call the local API. No home-page UI was changed.

The first browser run used the real Nuxt origin `http://localhost:3030` and failed only because the CORS allowlist still targeted `3000`. The frontend request itself executed as intended.

### Phase 7 — browser console end-to-end verification: NOT YET VERIFIED

This remains the final milestone-1 verification.

## Next action

Sync the corrected CORS configuration:

```powershell
git pull
```

Rebuild/recreate the API container so both the backend fallback and Compose environment are current:

```powershell
docker compose up --build --force-recreate
```

Nuxt may remain running on:

```text
http://localhost:3030
```

Then refresh the Prompt Draft home page and inspect DevTools -> Console.

Expected result:

```text
[Prompt Draft API] { ok: true, message: 'Hello from Prompt Draft API' }
```

Optionally verify the corrected CORS header before the browser test:

```powershell
curl.exe -i -H "Origin: http://localhost:3030" http://127.0.0.1:4000/api/hello
```

Expected header:

```text
Access-Control-Allow-Origin: http://localhost:3030
```

If the browser console shows the successful API result, mark Phase 5, Phase 6, and Phase 7 `DONE` and Milestone 1 complete.

Do not add PostgreSQL, authentication, Wizard persistence, or unrelated backend features during this milestone.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`

Then inspect the current branch and diff before making changes.
