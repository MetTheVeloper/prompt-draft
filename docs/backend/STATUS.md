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

Provisional table direction:

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

The backend now includes `pg 8.16.3`, environment-driven DB settings, a connection pool in `backend/src/database.mjs`, and diagnostic endpoint:

```http
GET /api/db-check
```

The user rebuilt/recreated Compose and verified:

```text
pg_isready -> accepting connections
```

Then called through the API and received:

```text
HTTP/1.1 200 OK
```

with:

```json
{
  "ok": true,
  "database": "prompt_draft",
  "user": "prompt_draft",
  "serverTime": "..."
}
```

`GET /api/hello` also remained healthy.

This proves the real network path:

```text
Windows host
  -> API :4000
  -> pg client inside API container
  -> Compose DNS hostname db
  -> PostgreSQL :5432
  -> SELECT
  -> JSON response
```

Wizard endpoints still intentionally use the in-memory `wizardRuns` array.

### Phase 4 — first `wizard_runs` table: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Added versioned SQL source:

```text
backend/sql/001_create_wizard_runs.sql
```

Schema:

```sql
CREATE TABLE IF NOT EXISTS wizard_runs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  wizard_id TEXT NOT NULL,
  wizard_version INTEGER NOT NULL CHECK (wizard_version > 0),
  output TEXT NOT NULL,
  snapshot JSONB NOT NULL
);
```

Added explicit schema command:

```text
npm run db:schema
```

implemented by `backend/src/create-schema.mjs`. The API image now copies the `sql` directory so the command can run inside the API container using the same database connection configuration already verified in Phase 3.

No migrations framework has been introduced yet. This explicit SQL file is the current schema source for the learning milestone.

Phase 4 is not `DONE` until the user rebuilds the API image, runs the schema command, and verifies the table/columns from PostgreSQL.

### Phase 5 — replace POST memory insert with SQL INSERT: NOT STARTED

### Phase 6 — replace GET memory list with SQL SELECT: NOT STARTED

### Phase 7 — durable end-to-end verification: NOT STARTED

## Next action

Sync and rebuild because the Docker image now needs the SQL directory:

```powershell
git pull
docker compose up -d --build --force-recreate
```

Apply the schema through the API container:

```powershell
docker compose exec api npm run db:schema
```

Then verify PostgreSQL sees the table:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d wizard_runs"
```

After user confirmation, mark Phase 4 `DONE` and begin Phase 5 only.

PostgreSQL persistence exists, but the Wizard POST/GET endpoints have not yet been switched from RAM to SQL.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
