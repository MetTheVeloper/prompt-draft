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

The current milestone shape is:

```text
prompt-draft/
├── app/
├── docs/
│   └── backend/
├── backend/
│   ├── src/
│   │   └── index.mjs
│   ├── package.json
│   └── Dockerfile
├── compose.yaml            # phase 3
└── ...existing Prompt Draft files
```

The backend remains independent from Nuxt server routes. This matters because Prompt Draft currently supports a static generation workflow and the future backend should be deployable separately.

## Phase 1 technical decision

For the first backend server, use Node's built-in `node:http` module rather than Express, Fastify, or another framework.

Reasons:

- no external dependency is required;
- the HTTP request/response lifecycle stays visible while learning;
- Docker concepts are not mixed with framework concepts;
- a framework can be introduced later when its benefits are easier to understand;
- the implementation remains a real independent HTTP server, not a mock.

The backend package currently provides:

```text
pnpm --dir backend start
```

for a normal run, and:

```text
pnpm --dir backend dev
```

for Node watch mode during development.

The server binds to `0.0.0.0` by default so it can be reached through a Docker port mapping. The default port is `4000`. Both can be overridden with `HOST` and `PORT` environment variables.

## Phase 2 Dockerfile decision

The first image deliberately stays minimal:

```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src

ENV HOST=0.0.0.0
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/index.mjs"]
```

Important details:

- `node:24-alpine` provides a small Linux environment with Node already installed;
- the Docker build context will be `backend/`;
- there are currently no external backend dependencies, so no package-install step is needed in the image yet;
- `WORKDIR /app` sets the container's application directory;
- `COPY` puts the backend files into the image;
- `ENV` supplies the default bind host and port;
- `EXPOSE 4000` documents the container port but does not by itself publish it to Windows;
- `CMD` is the process Docker starts when a container is created from the image.

For manual Phase 2 verification, publish the container port with:

```bash
docker run --rm -p 4000:4000 prompt-draft-api
```

The mapping means host port `4000` forwards traffic to container port `4000`.

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

Current implementation:

- `backend/package.json`
- `backend/src/index.mjs`
- Node built-in HTTP server
- no external backend dependencies
- default host `0.0.0.0`
- default port `4000`
- unmatched routes return a JSON `404`

Phase 1 was locally verified by the user using `pnpm --dir backend start` and `curl.exe http://localhost:4000/api/hello`.

### Phase 2 — containerize backend

`backend/Dockerfile` now exists.

Build the image from the repository root:

```bash
docker build -t prompt-draft-api ./backend
```

Then run it with a host-to-container port mapping:

```bash
docker run --rm -p 4000:4000 prompt-draft-api
```

Success condition: the same API response is reachable while the host-started Node process is stopped and the backend is running only inside Docker.

### Phase 3 — Docker Compose

Add `compose.yaml` so the local backend can be started with a simple project-level command:

```bash
docker compose up
```

The backend should be exposed on host port `4000`.

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
