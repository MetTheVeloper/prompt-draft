# Backend Implementation Plan

## Architecture baseline

Milestone 1 and Milestone 2 are complete and locally verified.

Current verified application path:

```text
Nuxt frontend :3030
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> request parsing + validation
  -> PostgreSQL connectivity
```

The backend remains independent from Nuxt server routes so the frontend can continue to be statically generated.

## Milestone 3 objective — PostgreSQL persistence

Replace temporary process memory with durable PostgreSQL storage while preserving the current API concepts.

The learning path is intentionally layered:

```text
Node process RAM
  -> PostgreSQL container
  -> PostgreSQL data directory
  -> Docker named volume
  -> API-to-DB network connection
  -> explicit SQL schema
  -> durable Wizard-run rows
```

Authentication, user ownership, migrations frameworks, production deployment, and polished Wizard-history UI remain outside this milestone.

## Milestone 3 phases

### Phase 0 — persistence contract and schema direction: DONE

The first provisional relational shape is:

```text
table: wizard_runs

id              UUID primary key
created_at      timestamp with time zone
wizard_id       text
wizard_version  integer
output           text
snapshot         jsonb
```

Rationale:

- `id` preserves the existing API run identifier concept;
- `created_at` preserves the existing creation timestamp concept;
- `wizard_id` and `wizard_version` remain relational columns because they are likely future filter/query dimensions;
- `output` remains directly readable/queryable text;
- `snapshot` stays flexible as `jsonb` while Wizard state/schema continues to evolve.

### Phase 1 — PostgreSQL Compose service: DONE

Compose has a `db` service using `postgres:17-alpine` with local-development database/user/password configuration.

PostgreSQL is intentionally not published to the Windows host. Inside Compose its address is `db:5432`.

The user verified both services run, `pg_isready` reports `accepting connections`, and `psql` reports database/user `prompt_draft`.

### Phase 2 — named volume and persistence proof: DONE

PostgreSQL data is backed by:

```text
prompt_draft_pgdata:/var/lib/postgresql/data
```

The user created a temporary `persistence_probe` row, ran `docker compose down`, recreated the containers, and confirmed the same row remained.

This proves container lifecycle and data lifecycle are separate.

### Phase 3 — API database connectivity: DONE

The backend depends on `pg 8.16.3`.

`backend/src/database.mjs` owns the PostgreSQL pool. Compose supplies:

```text
DB_HOST=db
DB_PORT=5432
DB_NAME=prompt_draft
DB_USER=prompt_draft
DB_PASSWORD=prompt_draft_dev
```

`GET /api/db-check` performs a SELECT through the API process. The user verified `HTTP/1.1 200 OK`, proving the API container can resolve `db` through Compose DNS and query PostgreSQL on port 5432.

### Phase 4 — first `wizard_runs` table: DONE

The explicit schema source is versioned in:

```text
backend/sql/001_create_wizard_runs.sql
```

Current SQL:

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

The backend package exposes `npm run db:schema` through `backend/src/create-schema.mjs`.

The user directly inspected `\d wizard_runs` in PostgreSQL and confirmed all columns, the UUID primary key, and the positive-version check constraint.

### Phase 5 — replace POST memory insert with database INSERT: DONE

`backend/src/database.mjs` provides `insertWizardRun(run)`.

It executes a parameterized statement rather than interpolating request values into SQL:

```sql
INSERT INTO wizard_runs (
  id,
  created_at,
  wizard_id,
  wizard_version,
  output,
  snapshot
)
VALUES ($1, $2, $3, $4, $5, $6::jsonb)
RETURNING
  id,
  created_at AS "createdAt",
  wizard_id AS "wizardId",
  wizard_version AS "wizardVersion",
  output,
  snapshot;
```

Parameterization keeps SQL structure separate from values and is the baseline for avoiding SQL-injection problems.

`POST /api/wizard-runs` preserves the existing request contract:

```text
JSON body
  -> parse
  -> validate
  -> randomUUID()
  -> ISO createdAt
  -> parameterized INSERT
  -> RETURNING stored row
  -> 201 Created
```

The user verified a valid POST returned `201 Created`, then queried PostgreSQL directly and found the same UUID and output in `wizard_runs`.

### Phase 6 — replace GET memory list with database SELECT: IMPLEMENTED, AWAITING LOCAL VERIFICATION

`backend/src/database.mjs` now provides:

```text
listWizardRuns()
```

It executes:

```sql
SELECT
  id,
  created_at AS "createdAt",
  wizard_id AS "wizardId",
  wizard_version AS "wizardVersion",
  output,
  snapshot
FROM wizard_runs
ORDER BY created_at DESC;
```

The same row-mapping helper is used for INSERT and SELECT so PostgreSQL timestamps become ISO strings and the public API remains camelCase.

`GET /api/wizard-runs` now queries PostgreSQL and returns:

```json
{
  "ok": true,
  "count": 1,
  "runs": []
}
```

with the real rows in `runs`.

The process-local `wizardRuns` array has been removed entirely. After this implementation both Wizard endpoints are database-backed:

```text
POST /api/wizard-runs -> PostgreSQL INSERT
GET  /api/wizard-runs -> PostgreSQL SELECT
```

Local verification should rebuild/recreate the API and then call GET. The row created during Phase 5 should still appear, proving the GET endpoint is reading PostgreSQL rather than fresh process memory.

### Phase 7 — durability verification

Create a new run through POST, read it back through GET, remove/recreate API and PostgreSQL containers without deleting volumes, then read the same run again.

Milestone 3 is complete only after the user confirms that the run survives container recreation because PostgreSQL data lives in the named volume.

## After Milestone 3

Only after persistence is understood should the project move toward product semantics:

- tighten/version the Wizard snapshot contract;
- remove the home-page test POST;
- connect persistence to a real successful Wizard completion/copy event;
- later add authentication and user ownership;
- later build history/list/restore UI;
- later introduce production-grade migrations and secret management.
