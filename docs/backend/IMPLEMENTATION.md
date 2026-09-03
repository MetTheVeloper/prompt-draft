# Backend Local API Implementation Plan

## Objective

Create the smallest useful independent backend for Prompt Draft and run it in Docker locally.

The milestone is deliberately limited to one GET request from the existing Nuxt home page. This keeps the learning path clear and avoids mixing Docker, databases, authentication, and product features at the same time.

## Architecture for milestone 1

```text
Nuxt frontend (host)
localhost:3000
       |
       | GET http://127.0.0.1:4000/api/hello
       v
Backend service (Docker container)
localhost:4000 -> container port 4000
```

No database is required for this milestone.

## Current repository shape

```text
prompt-draft/
├── app/
│   └── pages/
│       └── index.vue
├── docs/
│   └── backend/
├── backend/
│   ├── src/
│   │   └── index.mjs
│   ├── package.json
│   └── Dockerfile
├── compose.yaml
└── ...existing Prompt Draft files
```

The backend remains independent from Nuxt server routes so Prompt Draft can keep its static-generation frontend workflow while the backend stays independently deployable.

## Phase 1 technical decision

The first backend server uses Node's built-in `node:http` module rather than Express, Fastify, or another framework.

Reasons:

- no external dependency is required;
- the HTTP request/response lifecycle stays visible while learning;
- Docker concepts are not mixed with framework concepts;
- a framework can be introduced later when its benefits are easier to understand.

The backend package provides:

```text
pnpm --dir backend start
```

and:

```text
pnpm --dir backend dev
```

The server binds to `0.0.0.0` by default and uses port `4000`. Both can be overridden with `HOST` and `PORT` environment variables.

## Phase 2 Dockerfile decision

The image uses `node:24-alpine`, copies the minimal backend source into `/app`, exposes port `4000`, and starts `node src/index.mjs`.

Manual verification command:

```bash
docker run --rm -p 4000:4000 prompt-draft-api
```

The mapping means host port `4000` forwards traffic to container port `4000`.

## Phase 3 Docker Compose decision

A root-level `compose.yaml` defines the local backend service:

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

Compose can build and run the service from the repository root with:

```bash
docker compose up --build
```

The service name is `api`. Compose manages the container lifecycle and the host-to-container `4000:4000` port mapping.

## Phase 5 CORS decision

The browser frontend runs on a different origin from the local API because the ports differ. The backend therefore applies an explicit development CORS allowlist rather than using `Access-Control-Allow-Origin: *`.

Default allowed origins:

```text
http://localhost:3000
http://127.0.0.1:3000
```

The allowlist can later be overridden with the comma-separated `CORS_ORIGINS` environment variable.

For an allowed request origin, the backend returns:

```text
Access-Control-Allow-Origin: <matching origin>
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

The backend handles `OPTIONS` with a `204` response. Origins outside the allowlist receive no `Access-Control-Allow-Origin` header.

The user locally verified all three behaviors:

1. allowed origin receives the expected CORS headers and the JSON body;
2. `http://example.com` receives the JSON response but no allow-origin header;
3. an `OPTIONS` request from `http://localhost:3000` returns `204 No Content` with the expected CORS headers.

## Phase 6 frontend integration decision

`app/pages/index.vue` now performs one development-only request when the home page mounts:

```ts
onMounted(async () => {
  if (!import.meta.dev) return

  try {
    const result = await $fetch<{ ok: boolean, message: string }>('http://127.0.0.1:4000/api/hello')
    console.log('[Prompt Draft API]', result)
  } catch (error) {
    console.error('[Prompt Draft API] request failed', error)
  }
})
```

Important boundaries:

- no home-page UI is changed;
- the request runs only in Nuxt development mode;
- production/static generation does not attempt to call localhost;
- the goal is only to verify browser-to-Docker API connectivity and log the response.

## Step sequence

### Phase 0 — prerequisites

Verified locally.

### Phase 1 — minimal backend source

Implemented and locally verified.

### Phase 2 — containerize backend

Implemented and locally verified.

### Phase 3 — Docker Compose

Implemented and locally verified.

### Phase 4 — independent API verification

Implemented and locally verified from Windows.

### Phase 5 — CORS

Implemented and locally verified.

### Phase 6 — Nuxt home-page GET test

Implemented. Browser verification is still required.

### Phase 7 — end-to-end verification

Run:

```text
Nuxt frontend -> local Docker API -> JSON response -> browser console
```

Milestone 1 is complete only after the user confirms the browser console output locally.

## Follow-up milestones — not part of current implementation

After milestone 1 is stable:

1. add a health endpoint;
2. learn POST requests and request bodies;
3. add PostgreSQL as a second Docker Compose service;
4. learn persistence with Docker volumes;
5. introduce validation and error handling;
6. eventually implement authenticated Wizard run snapshots/history.

## Product direction preserved for later

A future backend feature may persist a successful Wizard run when a user copies a completed Wizard output. A saved run may include a versioned Wizard configuration snapshot and generated output so it can later be listed or restored.

That feature is intentionally deferred until the base backend, API, and persistence concepts have been established.
