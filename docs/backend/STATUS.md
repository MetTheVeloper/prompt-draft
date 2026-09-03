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

The user rebuilt the image and directly inspected PostgreSQL with:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d wizard_runs"
```

PostgreSQL confirmed:

```text
id              uuid                     NOT NULL
created_at      timestamp with time zone NOT NULL
wizard_id       text                     NOT NULL
wizard_version  integer                  NOT NULL
output           text                     NOT NULL
snapshot         jsonb                    NOT NULL
```

plus primary key `wizard_runs_pkey` on `id` and check constraint `wizard_version > 0`.

This is sufficient direct database verification that the Phase-4 schema exists as designed.

### Phase 5 — replace POST memory insert with SQL INSERT: IMPLEMENTED, AWAITING LOCAL VERIFICATION

`backend/src/database.mjs` now exposes `insertWizardRun(run)` using a parameterized PostgreSQL INSERT:

```text
INSERT INTO wizard_runs (...)
VALUES ($1, $2, $3, $4, $5, $6::jsonb)
RETURNING ...
```

The request values are passed separately from SQL text. The returned database row is mapped back to the existing camelCase API shape.

`POST /api/wizard-runs` now:

```text
parse JSON
  -> validate
  -> create UUID/timestamp
  -> INSERT into PostgreSQL
  -> RETURNING saved row
  -> 201 JSON response
```

The old `wizardRuns.push(run)` has been removed from POST.

Important temporary boundary: `GET /api/wizard-runs` still reads the old process-local array until Phase 6. Therefore Phase-5 verification must inspect PostgreSQL directly rather than expecting GET read-back to show the newly inserted row.

Database insert failures currently return `500 Failed to create Wizard run` and are logged by the API.

### Phase 6 — replace GET memory list with SQL SELECT: NOT STARTED

### Phase 7 — durable end-to-end verification: NOT STARTED

## Next action

Sync and rebuild the API image:

```powershell
git pull
docker compose up -d --build --force-recreate
```

Send one valid POST to `/api/wizard-runs` and confirm `201 Created`.

Then inspect PostgreSQL directly:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT id, wizard_id, wizard_version, output, created_at FROM wizard_runs ORDER BY created_at DESC LIMIT 5;"
```

The posted row must exist in PostgreSQL. After user confirmation, mark Phase 5 `DONE` and begin Phase 6 only.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
