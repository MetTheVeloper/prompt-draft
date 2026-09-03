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
localhost:4000 -> container port 4000
```

No database is required for this milestone.

## Current repository shape

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

- `node:24-alpine` provides a small Linux environment with Node installed;
- the Docker build context is `backend/`;
- there are currently no external backend dependencies, so no package-install step is needed;
- `WORKDIR /app` sets the container application directory;
- `COPY` puts the backend files into the image;
- `ENV` supplies the default host and port;
- `EXPOSE 4000` documents the container port but does not publish it to Windows;
- `CMD` starts the Node server.

Manual verification command:

```bash
docker run --rm -p 4000:4000 prompt-draft-api
```

The mapping means host port `4000` forwards traffic to container port `4000`.

## Phase 3 Docker Compose decision

A root-level `compose.yaml` now defines the local backend service:

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

Conceptually this replaces the manual build/run workflow with a declarative service definition.

Instead of remembering both:

```bash
docker build -t prompt-draft-api ./backend
docker run --rm -p 4000:4000 prompt-draft-api
```

Compose can build and run the service from the repository root with:

```bash
docker compose up --build
```

After an image already exists and no rebuild is needed, the normal start command can be:

```bash
docker compose up
```

The service name is `api`. Compose manages the container lifecycle and the host-to-container `4000:4000` port mapping.

## Step sequence

### Phase 0 — prerequisites

Verified locally:

```bash
docker --version
docker compose version
docker run hello-world
```

### Phase 1 — minimal backend source

Implemented and locally verified:

```http
GET /api/hello
```

Expected response:

```json
{
  "ok": true,
  "message": "Hello from Prompt Draft API"
}
```

### Phase 2 — containerize backend

Implemented and locally verified by building `prompt-draft-api`, stopping the host Node process, running the Docker container, and calling the API through host port `4000`.

### Phase 3 — Docker Compose

`compose.yaml` is implemented.

Local verification command:

```bash
docker compose up --build
```

Success condition: Compose builds/starts the `api` service and the server logs that it is listening on port `4000`.

### Phase 4 — independent API verification

While the Compose service is running, call:

```bash
curl.exe http://localhost:4000/api/hello
```

Success condition:

```json
{"ok":true,"message":"Hello from Prompt Draft API"}
```

This verifies that the host can reach the backend through the Compose-managed port mapping before the frontend is changed.

### Phase 5 — CORS

If the frontend runs at `localhost:3000` and the API at `localhost:4000`, configure development CORS explicitly before the browser integration if required.

### Phase 6 — Nuxt home-page GET test

Modify `app/pages/index.vue` minimally so the page requests the local API and logs the result. No product UI redesign is part of this test.

### Phase 7 — end-to-end verification

Run:

```text
Nuxt frontend -> local Docker API -> JSON response -> browser console
```

Milestone 1 is complete only after the user confirms the result locally.

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
