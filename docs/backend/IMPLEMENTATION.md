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

## Milestone 2 — COMPLETE

Milestone 2 established:

```http
POST /api/wizard-runs
GET /api/wizard-runs
```

with JSON parsing, validation, meaningful 4xx responses, browser POST/CORS behavior, and temporary process-local `wizardRuns` storage.

The user also verified that recreating the API container destroys that in-memory data.

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

The exact production snapshot contract is still provisional and is not being finalized during the first persistence pass.

### Phase 1 — PostgreSQL Compose service: IMPLEMENTED, AWAITING LOCAL VERIFICATION

`compose.yaml` now has a second service:

```yaml
db:
  image: postgres:17-alpine
  environment:
    POSTGRES_DB: prompt_draft
    POSTGRES_USER: prompt_draft
    POSTGRES_PASSWORD: prompt_draft_dev
```

Important boundaries for this phase:

- no Node PostgreSQL client has been added;
- the API does not connect to PostgreSQL yet;
- no `wizard_runs` table exists yet;
- no Docker volume is attached yet;
- PostgreSQL port `5432` is not published to the Windows host;
- the committed credentials are local-development-only values, not a production secrets strategy.

Inside the Compose network, the future API connection target will be:

```text
host: db
port: 5432
```

The hostname is the Compose service name. It is intentionally not `localhost`, because `localhost` inside the API container refers to that API container itself.

Local verification should prove only that PostgreSQL starts and accepts a local database session inside its container.

### Phase 2 — named volume and persistence proof

Attach a named Docker volume to PostgreSQL's standard data directory:

```text
/var/lib/postgresql/data
```

Then create a small database artifact, recreate the PostgreSQL container, and prove the artifact remains.

This phase is intentionally separate from Phase 1 so the persistence effect of the volume is observable rather than hidden inside the initial database setup.

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

Keep:

```http
GET /api/wizard-runs
```

but source its rows from PostgreSQL instead of process memory.

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
