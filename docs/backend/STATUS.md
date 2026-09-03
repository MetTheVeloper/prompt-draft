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

Compose uses the named volume:

```text
prompt-draft_prompt_draft_pgdata
```

mounted to PostgreSQL's data directory.

The user created `persistence_probe` with:

```text
1 | survives container recreation
```

Then ran `docker compose down`, recreated the Compose project with `docker compose up -d`, and queried the table again without recreating the row. The same row remained.

This locally proves:

```text
PostgreSQL container removed/recreated
  -> named volume retained
  -> database files retained
  -> SQL data retained
```

Do not use `docker compose down -v` unless intentionally deleting the local database volume.

### Phase 3 — API -> PostgreSQL connectivity: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Changes now on the branch:

- `backend/package.json` adds exact dependency `pg 8.16.3`;
- `backend/Dockerfile` installs production dependencies with npm;
- added `backend/src/database.mjs` with a `pg` connection pool;
- `compose.yaml` passes explicit DB configuration to the API:

```text
DB_HOST=db
DB_PORT=5432
DB_NAME=prompt_draft
DB_USER=prompt_draft
DB_PASSWORD=prompt_draft_dev
```

- added diagnostic endpoint:

```http
GET /api/db-check
```

The endpoint performs a simple SELECT through the API process and should return database `prompt_draft`, user `prompt_draft`, and PostgreSQL server time.

The important path to verify is:

```text
host -> API :4000 -> API container -> pg client -> db:5432 -> PostgreSQL -> SELECT -> JSON
```

Wizard endpoints are intentionally unchanged and still use the in-memory `wizardRuns` array.

### Phase 4 — first `wizard_runs` table: NOT STARTED

### Phase 5 — replace POST memory insert with SQL INSERT: NOT STARTED

### Phase 6 — replace GET memory list with SQL SELECT: NOT STARTED

### Phase 7 — durable end-to-end verification: NOT STARTED

## Next action

Sync the Phase-3 code and rebuild the API image because it now has an external dependency:

```powershell
git pull
docker compose up -d --build --force-recreate
```

Wait until PostgreSQL is ready if necessary, then verify the database itself:

```powershell
docker compose exec db pg_isready -U prompt_draft -d prompt_draft
```

Finally call through the API:

```powershell
curl.exe -i http://127.0.0.1:4000/api/db-check
```

Expected status:

```text
HTTP/1.1 200 OK
```

Expected JSON includes:

```json
{
  "ok": true,
  "database": "prompt_draft",
  "user": "prompt_draft"
}
```

Also regression-check the existing endpoint:

```powershell
curl.exe http://127.0.0.1:4000/api/hello
```

After user confirmation, mark Phase 3 `DONE` and begin Phase 4 only.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
