# Prompt Draft Backend

This directory is the source of truth for the first backend and Docker integration work in Prompt Draft.

## Current goal

Build a minimal backend service that runs locally in Docker, expose one GET API endpoint, call that endpoint from the Prompt Draft home page, and print the response in the browser console.

This phase is intentionally small. It is meant to establish and understand the development path before adding persistence, authentication, Wizard history, or production deployment.

## Current branch

`feature/docker-local-api`

The branch was created from the current stable `main` after the Prompt Draft v2.0.0 release.

## Target milestone

The first milestone is complete when all of the following are true:

1. Docker can run the Prompt Draft backend service locally.
2. A minimal GET endpoint such as `GET /api/hello` is reachable from the host machine.
3. The Nuxt home page calls the endpoint.
4. The returned result is visible in the browser console.
5. The existing static frontend workflow remains intact.

Expected development shape:

```text
Prompt Draft Nuxt frontend
        |
        | HTTP GET
        v
Local backend API
        |
        v
Docker container
```

The frontend and backend are intentionally separate. The Nuxt app may continue to be statically generated while the backend becomes an independently deployable service later.

## Scope of this phase

Included:

- local Docker environment
- independent backend service
- one minimal GET endpoint
- Dockerfile
- Docker Compose configuration
- localhost port exposure
- development CORS if required
- test call from `app/pages/index.vue`
- browser console verification

Not included yet:

- PostgreSQL
- Redis
- authentication
- users
- Wizard snapshots/history
- production domain or HTTPS
- VPS deployment
- production secrets/configuration

## Documentation workflow

`README.md` explains the purpose, boundaries, and architecture.

`IMPLEMENTATION.md` contains the planned implementation sequence and technical decisions.

`STATUS.md` records what has actually been verified and what should happen next.

A step must not be marked complete merely because code was written. It is marked complete only after the local result has been run and confirmed by the user.

For a new chat, read these three files before making backend changes:

- `docs/backend/README.md`
- `docs/backend/IMPLEMENTATION.md`
- `docs/backend/STATUS.md`
