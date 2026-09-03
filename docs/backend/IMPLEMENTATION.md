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
  -> temporary process memory
  -> JSON response
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

PostgreSQL is intentionally not published to the Windows host. Inside Compose its address is:

```text
db:5432
```

The user verified both services run, `pg_isready` reports `accepting connections`, and `psql` reports database/user `prompt_draft`.

### Phase 2 — named volume and persistence proof: DONE

PostgreSQL data is backed by:

```text
prompt_draft_pgdata:/var/lib/postgresql/data
```

The user created a temporary `persistence_probe` row, ran `docker compose down`, recreated the containers, and confirmed the same row remained.

This proves container lifecycle and data lifecycle are now separate.

### Phase 3 — API database connectivity: DONE

The backend now depends on:

```text
pg 8.16.3
```

`backend/src/database.mjs` owns the PostgreSQL pool. Compose supplies:

```text
DB_HOST=db
DB_PORT=5432
DB_NAME=prompt_draft
DB_USER=prompt_draft
DB_PASSWORD=prompt_draft_dev
```

The diagnostic endpoint:

```http
GET /api/db-check
```

performs a SELECT through the API process.

The user verified `HTTP/1.1 200 OK` and a response identifying database/user `prompt_draft`. This proves:

```text
API container
  -> pg client
  -> Compose DNS hostname db
  -> PostgreSQL 5432
  -> successful query
```

The Wizard endpoints remain in-memory during this phase.

### Phase 4 — first `wizard_runs` table: IMPLEMENTED, AWAITING LOCAL VERIFICATION

The explicit schema source is now versioned in:

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

The backend package exposes:

```text
npm run db:schema
```

`backend/src/create-schema.mjs` reads that SQL file and executes it through the same PostgreSQL pool/configuration already proven in Phase 3. It then closes the pool explicitly so the one-shot command exits cleanly.

The Docker image copies both:

```text
src/
sql/
```

No migrations framework is introduced yet. This keeps the first schema step transparent: inspect SQL, execute SQL, inspect resulting table.

Local verification should:

```text
rebuild API image
  -> docker compose exec api npm run db:schema
  -> verify wizard_runs exists in PostgreSQL
  -> inspect its columns/types/constraints
```

### Phase 5 — replace POST memory insert with database INSERT

Keep current parsing, validation, CORS, UUID/timestamp semantics, and `201 Created`, but replace:

```text
wizardRuns.push(run)
```

with a parameterized SQL `INSERT` into `wizard_runs`.

Do not switch GET during the same phase; POST persistence should be verified independently first.

### Phase 6 — replace GET memory list with database SELECT

Keep:

```http
GET /api/wizard-runs
```

but query PostgreSQL and map snake_case database columns back to the existing camelCase API shape.

### Phase 7 — durability verification

Create a run through the API, read it back, remove/recreate API and PostgreSQL containers without deleting volumes, then read the same run again.

Milestone 3 is complete only after the user confirms that the run survives container recreation because PostgreSQL data lives in the named volume.

## After Milestone 3

Only after persistence is understood should the project move toward product semantics:

- tighten/version the Wizard snapshot contract;
- remove the home-page test POST;
- connect persistence to a real successful Wizard completion/copy event;
- later add authentication and user ownership;
- later build history/list/restore UI;
- later introduce production-grade migrations and secret management.
