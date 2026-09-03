# Backend Local API Implementation Plan

## Objective

Create the smallest useful independent backend for Prompt Draft and run it in Docker locally.

The milestone is deliberately limited to one GET request from the existing Nuxt home page. This keeps the learning path clear and avoids mixing Docker, databases, authentication, and product features at the same time.

## Architecture for milestone 1

```text
Nuxt frontend (host)
localhost:3000
       |
       | GET http://localhost:4000/api/hello
       v
Backend service (Docker container)
localhost:4000 -> container port
```

No database is required for this milestone.

## Planned repository shape

The exact implementation may be adjusted if repository constraints require it, but the intended separation is:

```text
prompt-draft/
├── app/
├── docs/
│   └── backend/
├── backend/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── Dockerfile
├── compose.yaml
└── ...existing Prompt Draft files
```

The backend should remain independent from Nuxt server routes. This matters because Prompt Draft currently supports a static generation workflow and the future backend should be deployable separately.

## Step sequence

### Phase 0 — prerequisites

Verify locally:

```bash
docker --version
docker compose version
docker run hello-world
```

Success condition: Docker daemon is reachable, Compose is installed, and the `hello-world` container completes successfully.

### Phase 1 — minimal backend source

Create an independent backend package with one HTTP server.

Initial API contract:

```http
GET /api/hello
```

Expected response shape:

```json
{
  "ok": true,
  "message": "Hello from Prompt Draft API"
}
```

The first implementation should favor clarity over framework complexity.

### Phase 2 — containerize backend

Create a `Dockerfile` that:

1. starts from an appropriate Node image;
2. installs backend dependencies;
3. copies the backend source;
4. exposes/runs the backend server.

Success condition: the backend can run inside a Docker container rather than relying on a host-installed backend runtime.

### Phase 3 — Docker Compose

Add `compose.yaml` so the local backend can be started with a simple project-level command:

```bash
docker compose up
```

The backend should be exposed on a clear host port, initially planned as `4000`.

Success condition:

```text
http://localhost:4000/api/hello
```

returns the expected JSON from the host machine.

### Phase 4 — independent API verification

Before touching the Nuxt home page, test the backend directly using a browser, PowerShell, or `curl`.

Example:

```bash
curl http://localhost:4000/api/hello
```

This isolates backend problems from frontend integration problems.

### Phase 5 — CORS

If the frontend runs at `localhost:3000` and the API at `localhost:4000`, configure development CORS explicitly if required.

Development access should be narrow enough to remain understandable; production CORS policy is out of scope for this milestone.

### Phase 6 — Nuxt home-page GET test

Modify `app/pages/index.vue` minimally so the page requests the local API and logs the result.

No product UI should be redesigned for this test.

Conceptual example:

```ts
onMounted(async () => {
  const result = await $fetch('http://localhost:4000/api/hello')
  console.log(result)
})
```

The exact implementation should respect the current project conventions.

### Phase 7 — end-to-end verification

Run both sides:

```text
Nuxt frontend -> local Docker API -> JSON response -> browser console
```

Milestone 1 is complete only after the user confirms the result locally.

## Follow-up milestones — not part of current implementation

After milestone 1 is understood and stable, suitable next learning steps are:

1. add a health endpoint;
2. learn POST requests and request bodies;
3. add PostgreSQL as a second Docker Compose service;
4. learn persistence with Docker volumes;
5. introduce validation and error handling;
6. eventually implement authenticated Wizard run snapshots/history.

## Product direction preserved for later

A future backend feature may persist a successful Wizard run when a user copies a completed Wizard output. A saved run may include a versioned Wizard configuration snapshot and generated output so it can later be listed or restored.

That feature is intentionally deferred until the base backend, API, and persistence concepts have been established.
