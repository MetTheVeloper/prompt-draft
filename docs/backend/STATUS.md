# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result.

## Milestone 1 — COMPLETE

Verified end to end: Nuxt `localhost:3030` -> Docker API `:4000` -> Node HTTP server -> browser console.

## Milestone 2 — COMPLETE

Verified end to end: JSON POST -> validation -> CORS/preflight -> temporary in-memory storage -> browser response/read-back.

The user also verified that recreating the API container destroys process-local Wizard-run data.

## Milestone 3 — COMPLETE

Goal: replace temporary process memory with durable PostgreSQL storage while preserving the existing Wizard-run API concepts.

### Phase 0 — persistence contract/schema direction: DONE

Current provisional table:

```text
wizard_runs

id              UUID primary key
created_at      timestamp with time zone
wizard_id       text
wizard_version  integer
output           text
snapshot         jsonb
```

### Phase 1 — PostgreSQL Compose service: DONE

The user verified the `db` service runs on PostgreSQL 17, accepts connections, and exposes database/user `prompt_draft` inside the Compose network.

### Phase 2 — named volume/persistence proof: DONE

PostgreSQL data is backed by the Compose named volume `prompt_draft_pgdata`.

The user created a temporary `persistence_probe` row, removed/recreated the containers, and confirmed the row remained. This proved container lifecycle and database-data lifecycle are separate.

### Phase 3 — API -> PostgreSQL connectivity: DONE

The API uses `pg 8.16.3`, environment-driven database settings, and a connection pool in `backend/src/database.mjs`.

The user verified `GET /api/db-check -> 200` through this path:

```text
Windows host
  -> API :4000
  -> pg client inside API container
  -> Compose DNS hostname db
  -> PostgreSQL :5432
  -> SELECT
  -> JSON response
```

### Phase 4 — first `wizard_runs` table: DONE

Versioned SQL source:

```text
backend/sql/001_create_wizard_runs.sql
```

PostgreSQL confirmed the expected columns, UUID primary key, and `wizard_version > 0` check constraint.

### Phase 5 — POST uses SQL INSERT: DONE

`POST /api/wizard-runs` now validates input and executes a parameterized PostgreSQL INSERT.

The user verified `201 Created` and then directly queried PostgreSQL to confirm the same UUID/output row existed in `wizard_runs`.

### Phase 6 — GET uses SQL SELECT: DONE

`GET /api/wizard-runs` now executes `SELECT ... FROM wizard_runs ORDER BY created_at DESC` and maps database snake_case columns back to the existing camelCase API shape.

The old process-local `wizardRuns` array has been removed entirely.

The first GET verification briefly showed `count: 0` because the running API container still had the older Phase-5 image. Direct PostgreSQL inspection proved the row had never been lost. After rebuilding with Phase-6 code, GET returned the persisted row.

### Phase 7 — durable end-to-end verification: DONE

The user created a fresh run through the API:

```text
id     = 52d74cf9-d462-4cae-b647-a6ac6ebe2715
output = Phase 7 survives recreate
```

Before recreation, `GET /api/wizard-runs` returned both persisted runs.

The user then ran:

```text
docker compose down

docker compose up -d
```

This removed both API and PostgreSQL containers and the Compose network while retaining the named volume.

After PostgreSQL reported `accepting connections`, `GET /api/wizard-runs` again returned both rows, including the exact Phase-7 UUID and output.

This proves the full durable path:

```text
HTTP POST
  -> API container
  -> parameterized PostgreSQL INSERT
  -> PostgreSQL data directory
  -> Docker named volume
  -> API + DB containers removed
  -> new API + DB containers
  -> same named volume
  -> PostgreSQL SELECT
  -> HTTP GET
  -> same Wizard run
```

## Milestone 3 result

Milestone 3 is complete and locally verified end to end.

Current backend capabilities now include:

- Docker Compose API + PostgreSQL services;
- Compose service-name networking (`db:5432`);
- PostgreSQL connection pooling;
- Docker named-volume persistence;
- explicit versioned SQL schema source;
- parameterized SQL INSERT;
- SQL SELECT list/read-back;
- durable Wizard-run rows that survive full container recreation.

## Next milestone direction — product integration and contract hardening

Do not start automatically. Review the direction first.

Before connecting persistence to the real Wizard flow, address these items:

1. harden server-owned fields: current run construction places `...body` after generated `id`/`createdAt`, so a client can currently override those values; switch to an explicit allowlisted run shape;
2. inspect the real Wizard success/completion/copy flow and choose the correct persistence event instead of the home-page learning POST;
3. tighten/version the production snapshot contract without prematurely flattening evolving Wizard state;
4. remove the home-page development POST once real Wizard integration is verified;
5. clean up the temporary `persistence_probe` artifact when appropriate.

Authentication, user ownership, history/restore UI, production migrations, secret management, and deployment remain deferred.

## Next action

Review and agree on the next milestone scope before making more backend/product changes.

Because this status update is remote, sync the branch before future local work:

```cmd
git pull
```

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
