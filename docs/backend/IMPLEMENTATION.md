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

The learning path is deliberately separated:

```text
Node process RAM
  -> PostgreSQL container
  -> PostgreSQL data directory
  -> Docker named volume
  -> API-to-database network connection
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

`compose.yaml` has a second service using `postgres:17-alpine`.

The user locally verified both Compose services are running, `pg_isready` reports `accepting connections`, and a real `psql` query returns database/user `prompt_draft`.

PostgreSQL is intentionally not published to the Windows host. Inside Compose its address is:

```text
db:5432
```

### Phase 2 — named volume and persistence proof: DONE

A named volume is attached to PostgreSQL's standard data directory:

```yaml
db:
  volumes:
    - prompt_draft_pgdata:/var/lib/postgresql/data

volumes:
  prompt_draft_pgdata:
```

The user verified Docker created:

```text
prompt-draft_prompt_draft_pgdata
```

A temporary SQL probe was created:

```text
persistence_probe
```

with one row:

```text
1 | survives container recreation
```

After `docker compose down`, the PostgreSQL container was removed. After `docker compose up -d`, a new container mounted the same named volume and the same probe row was still present.

This proves the named volume lifecycle is separate from the PostgreSQL container lifecycle.

Important distinction:

```text
docker compose down
```

removes containers/network but retains the named volume.

```text
docker compose down -v
```

also removes declared named volumes and therefore destroys this local database data.

### Phase 3 — API database connectivity: IMPLEMENTED, AWAITING LOCAL VERIFICATION

The backend now has its first external runtime dependency:

```text
pg 8.16.3
```

`backend/Dockerfile` now installs production dependencies inside the API image before copying the source.

A dedicated connection helper was added:

```text
backend/src/database.mjs
```

It creates a PostgreSQL connection pool from explicit environment configuration:

```text
DB_HOST=db
DB_PORT=5432
DB_NAME=prompt_draft
DB_USER=prompt_draft
DB_PASSWORD=prompt_draft_dev
```

These are local-development values only; production secret management is deferred.

A temporary diagnostic endpoint was added without changing Wizard endpoint storage behavior:

```http
GET /api/db-check
```

The endpoint asks PostgreSQL for:

```sql
SELECT current_database(), current_user, NOW();
```

Successful path:

```text
Windows/browser request
  -> API host port 4000
  -> API container
  -> pg Pool
  -> Compose DNS hostname `db`
  -> PostgreSQL port 5432
  -> SELECT
  -> JSON response
```

Expected success response is conceptually:

```json
{
  "ok": true,
  "database": "prompt_draft",
  "user": "prompt_draft",
  "serverTime": "..."
}
```

A failed database query returns `503 Database unavailable` rather than altering the existing Wizard API behavior.

Important boundary: `POST /api/wizard-runs` and `GET /api/wizard-runs` still use the process-local `wizardRuns` array. Phase 3 proves connection only.

### Phase 4 — first `wizard_runs` table

Create the provisional table explicitly.

For this learning milestone, prefer a transparent schema-creation step before introducing a migrations framework.

### Phase 5 — replace POST memory insert with database INSERT

Keep the existing parsing, validation, CORS, and `201 Created` contract, but write accepted runs to PostgreSQL instead of `wizardRuns.push()`.

### Phase 6 — replace GET memory listing with database SELECT

Keep `GET /api/wizard-runs`, but source its rows from PostgreSQL instead of process memory.

### Phase 7 — durability verification

Create a run, read it back, recreate the API and PostgreSQL containers, then read the same run again.

Milestone 3 is complete only after the user confirms that the row survives container recreation because PostgreSQL data lives in the named volume.

## After Milestone 3

Only after persistence is understood should the project move toward product semantics:

- tighten/version the Wizard snapshot contract;
- remove the home-page test POST;
- connect persistence to a real successful Wizard completion/copy event;
- later add authentication and user ownership;
- later build history/list/restore UI;
- later introduce production-grade migrations and secret management.
