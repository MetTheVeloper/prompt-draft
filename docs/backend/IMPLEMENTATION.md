# Backend Implementation Plan

## Architecture baseline

Milestones 1, 2, and 3 are complete and locally verified.

Current verified path:

```text
Nuxt frontend :3030
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> request parsing + validation
  -> PostgreSQL client/pool
  -> db:5432
  -> wizard_runs
  -> Docker named volume
```

The backend remains independent from Nuxt server routes so the frontend can continue to be statically generated.

## Milestone 3 — COMPLETE: PostgreSQL persistence

Milestone 3 replaced temporary process memory with durable PostgreSQL storage while preserving the recognizable Wizard-run API contract.

The learning path was deliberately layered:

```text
Node process RAM
  -> PostgreSQL container
  -> PostgreSQL data directory
  -> Docker named volume
  -> API-to-DB network connection
  -> explicit SQL schema
  -> parameterized INSERT
  -> SELECT read-back
  -> full container recreation
```

### Phase 0 — persistence contract/schema direction: DONE

Current provisional relational shape:

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

- `id` preserves the API run identifier concept;
- `created_at` preserves creation time;
- `wizard_id` and `wizard_version` remain relational query/filter dimensions;
- `output` remains directly readable text;
- `snapshot` stays flexible as `jsonb` while Wizard state/schema evolves.

### Phase 1 — PostgreSQL Compose service: DONE

Compose runs PostgreSQL 17 as service `db`.

PostgreSQL is intentionally not published to the Windows host. Inside Compose its address is:

```text
db:5432
```

The user verified `pg_isready` and a real `psql` session.

### Phase 2 — named volume and persistence proof: DONE

PostgreSQL data is backed by:

```text
prompt_draft_pgdata:/var/lib/postgresql/data
```

A temporary `persistence_probe` row survived container removal/recreation, proving data lifecycle is separate from container lifecycle.

### Phase 3 — API database connectivity: DONE

The backend depends on:

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

`GET /api/db-check` performs a SELECT through the API process. The user verified `200 OK`, proving API -> Compose DNS -> PostgreSQL connectivity.

### Phase 4 — first `wizard_runs` table: DONE

Versioned schema source:

```text
backend/sql/001_create_wizard_runs.sql
```

SQL:

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

The package exposes `npm run db:schema` through `backend/src/create-schema.mjs`.

The user directly inspected `\d wizard_runs` and confirmed the expected columns and constraints.

### Phase 5 — POST uses database INSERT: DONE

`backend/src/database.mjs` provides `insertWizardRun(run)` using a parameterized query:

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

Request values remain separate from SQL structure.

The user verified a valid `POST /api/wizard-runs` returned `201 Created`, then directly queried PostgreSQL and found the same UUID/output row.

### Phase 6 — GET uses database SELECT: DONE

`backend/src/database.mjs` provides `listWizardRuns()`:

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

Database snake_case columns are mapped back to the existing camelCase API response shape.

`GET /api/wizard-runs` now queries PostgreSQL. The process-local `wizardRuns` array has been removed entirely.

A stale-container verification hiccup briefly returned `count: 0`; direct database inspection proved the row remained. After rebuilding with current code, GET returned the persisted row as expected.

### Phase 7 — full durability verification: DONE

The user created a fresh run through POST, verified it through GET, then ran:

```text
docker compose down

docker compose up -d
```

Both API and DB containers were removed and recreated while the named volume remained.

After PostgreSQL became ready, GET returned both prior rows, including the exact Phase-7 run:

```text
id     = 52d74cf9-d462-4cae-b647-a6ac6ebe2715
output = Phase 7 survives recreate
```

This verifies durable persistence end to end.

## Current technical debt / intentional learning shortcuts

### Server-owned field hardening

Current run construction in `backend/src/index.mjs` is:

```js
const run = {
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  ...body,
}
```

Because `...body` is last, a client can currently submit `id` or `createdAt` and override server-generated values.

Before real product integration, replace this with an explicit allowlisted object, for example conceptually:

```js
const run = {
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  wizardId: body.wizardId.trim(),
  wizardVersion: body.wizardVersion,
  output: body.output,
  snapshot: body.snapshot,
}
```

This also prevents unknown request fields from being stored accidentally.

### Schema workflow

The current schema is intentionally transparent and simple: one versioned SQL file plus a one-shot schema command. A production migration framework is deferred until the persistence fundamentals are understood.

### Temporary database artifact

`persistence_probe` was created manually as a learning artifact. It is not product data and can be removed during a later cleanup step.

## Proposed next milestone — product integration and contract hardening

Do not start automatically; agree on the scope first.

Recommended sequence:

1. harden the POST contract and server-owned fields;
2. inspect the actual Wizard completion/copy flow in production code;
3. decide exactly when a Wizard run counts as successfully persistable;
4. define/version the production snapshot semantics without prematurely flattening Wizard state;
5. add a small frontend API integration helper if useful;
6. connect persistence to the real Wizard success event;
7. remove the development-only home-page POST after the real path is locally verified.

Authentication, user ownership, history/restore UI, production migrations, secrets, and deployment remain later milestones.
