# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result.

## Milestone 1 — COMPLETE

Verified end to end: Nuxt `localhost:3030` -> Docker API `:4000` -> Node HTTP server -> browser console.

## Milestone 2 — COMPLETE

Verified end to end: JSON POST -> validation -> CORS/preflight -> temporary in-memory storage -> browser response/read-back.

The user also verified that recreating the API container resets the process-local `wizardRuns` array to empty.

## Milestone 3 — IN PROGRESS

Goal: replace temporary process memory with durable PostgreSQL storage while preserving the existing Wizard-run API concepts.

### Phase 0 — persistence contract/schema direction: DONE

Provisional table:

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

The user verified both `api` and `db` services run, PostgreSQL reports `accepting connections`, and a real `psql` session returns database/user `prompt_draft`.

### Phase 2 — named volume/persistence proof: DONE

The user verified `persistence_probe` survives `docker compose down` followed by `docker compose up -d` because PostgreSQL data is stored in the named volume `prompt-draft_prompt_draft_pgdata`.

### Phase 3 — API -> PostgreSQL connectivity: DONE

The backend includes `pg 8.16.3`, environment-driven DB settings, a connection pool in `backend/src/database.mjs`, and diagnostic endpoint `GET /api/db-check`.

The user verified `HTTP/1.1 200 OK` through the API with database/user `prompt_draft`, proving:

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

PostgreSQL confirmed the expected columns, primary key on `id`, and `wizard_version > 0` check constraint.

### Phase 5 — replace POST memory insert with SQL INSERT: DONE

`backend/src/database.mjs` exposes `insertWizardRun(run)` using a parameterized PostgreSQL INSERT with placeholders and separate values.

The user sent a correctly quoted Windows CMD request and verified:

```text
POST /api/wizard-runs -> HTTP/1.1 201 Created
```

The response returned run id:

```text
6651a8c6-0f79-47c6-84cd-3fbccfe567f3
```

A direct PostgreSQL query then returned the same id with:

```text
wizard_id      = portrait
wizard_version = 1
output          = Persisted in PostgreSQL
```

This proves the POST path now reaches a real parameterized SQL INSERT and stores the row in PostgreSQL.

### Phase 6 — replace GET memory list with SQL SELECT: DONE

`backend/src/database.mjs` exposes `listWizardRuns()` using:

```text
SELECT ... FROM wizard_runs ORDER BY created_at DESC
```

Database rows are mapped from snake_case columns back to the existing camelCase API shape.

The old process-local `wizardRuns` array has been removed entirely from runtime code.

During the first verification attempt, `GET /api/wizard-runs` returned `count: 0` because the running API container was still using the older Phase-5 image. A direct PostgreSQL query confirmed the Phase-5 row still existed in `wizard_runs`.

After the API was refreshed with the Phase-6 code, the user verified:

```text
GET /api/wizard-runs
```

returned:

```text
count: 1
```

and included the previously persisted row with id:

```text
6651a8c6-0f79-47c6-84cd-3fbccfe567f3
```

and output:

```text
Persisted in PostgreSQL
```

This proves GET now reads PostgreSQL rather than process memory.

### Phase 7 — durable end-to-end verification: READY FOR LOCAL VERIFICATION

No code change is required for this phase.

Final proof should exercise the complete persistence path:

```text
POST a new Wizard run
  -> GET confirms it
  -> docker compose down
  -> API and DB containers removed
  -> named volume retained
  -> docker compose up -d
  -> GET returns the same run
```

Do not use `docker compose down -v`, because `-v` intentionally deletes the named PostgreSQL volume.

Milestone 3 is complete only after the user confirms the same API-created run survives full container removal/recreation.

## Next action

Create a fresh run specifically for Phase 7, record its id, verify it through GET, run `docker compose down`, run `docker compose up -d`, and verify the same id is still returned by `GET /api/wizard-runs`.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
