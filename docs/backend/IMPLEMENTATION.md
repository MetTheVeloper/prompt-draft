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

The learning goal is to move through these layers separately:

```text
Node process RAM
  -> PostgreSQL container
  -> PostgreSQL data directory
  -> Docker named volume
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

`compose.yaml` has a second service using:

```yaml
db:
  image: postgres:17-alpine
  environment:
    POSTGRES_DB: prompt_draft
    POSTGRES_USER: prompt_draft
    POSTGRES_PASSWORD: prompt_draft_dev
```

The user locally verified both Compose services are running, `pg_isready` reports `accepting connections`, and a real `psql` query returns database/user `prompt_draft`.

PostgreSQL is intentionally not published to the Windows host. Inside Compose, its future network address is:

```text
db:5432
```

### Phase 2 — named volume and persistence proof: IMPLEMENTED, AWAITING LOCAL VERIFICATION

A named volume is attached to PostgreSQL's standard data directory:

```yaml
db:
  volumes:
    - prompt_draft_pgdata:/var/lib/postgresql/data

volumes:
  prompt_draft_pgdata:
```

Conceptually:

```text
PostgreSQL process/container
        |
        v
/var/lib/postgresql/data
        |
        v
Docker named volume: prompt_draft_pgdata
```

The container is disposable; the named volume has a separate lifecycle.

The persistence proof deliberately uses a small temporary `persistence_probe` table rather than creating the real `wizard_runs` table early. The test should:

1. recreate Compose so PostgreSQL initializes with the named volume;
2. create `persistence_probe` and insert one row;
3. confirm the row exists;
4. run `docker compose down` to remove containers while retaining the named volume;
5. run `docker compose up` again;
6. confirm the same row/table still exists.

Important distinction:

```text
docker compose down
```

removes containers/network but normally keeps named volumes.

```text
docker compose down -v
```

also removes declared named volumes and must not be used during the persistence proof.

### Phase 3 — API database connectivity

Add a minimal Node PostgreSQL client dependency and environment-based connection configuration.

Verify the network path before changing Wizard endpoint behavior:

```text
API container
  -> Compose DNS hostname `db`
  -> PostgreSQL port 5432
  -> successful query
```

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
