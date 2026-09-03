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

### Phase 5 — replace POST memory insert with SQL INSERT: IMPLEMENTED, AWAITING LOCAL VERIFICATION

`backend/src/database.mjs` exposes `insertWizardRun(run)` using a parameterized PostgreSQL INSERT with placeholders and separate values.

`POST /api/wizard-runs` now follows:

```text
parse JSON
  -> validate
  -> create UUID/timestamp
  -> INSERT into PostgreSQL
  -> RETURNING saved row
  -> 201 JSON response
```

The old `wizardRuns.push(run)` has been removed from POST. `GET /api/wizard-runs` still reads process memory until Phase 6.

The first Phase-5 verification attempt was sent from `cmd.exe` using a PowerShell-style single-quoted JSON body. In Windows CMD, single quotes are literal characters rather than string delimiters, so the API correctly received invalid JSON and returned `400 Request body must contain valid JSON`. PostgreSQL contained no inserted row. This is a shell-quoting issue, not evidence of an INSERT/database failure.

Phase 5 remains incomplete until a correctly quoted CMD request returns `201 Created` and the row is confirmed directly in PostgreSQL.

### Phase 6 — replace GET memory list with SQL SELECT: NOT STARTED

### Phase 7 — durable end-to-end verification: NOT STARTED

## Next action

From Windows CMD, send the JSON body with escaped double quotes, confirm `201 Created`, then query `wizard_runs` directly for the inserted output. After user confirmation, mark Phase 5 `DONE` and begin Phase 6 only.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
