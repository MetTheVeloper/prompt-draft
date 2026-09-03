# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result.

## Milestone 1 — COMPLETE

Verified end to end: Nuxt `localhost:3030` -> Docker API `:4000` -> Node HTTP server -> browser console.

## Milestone 2 — COMPLETE

Verified end to end:

```text
Nuxt frontend :3030
  -> browser CORS/preflight
  -> POST /api/wizard-runs
  -> Docker API :4000
  -> JSON parsing
  -> validation
  -> in-memory insert
  -> 201 JSON response
  -> browser console
  -> GET read-back
```

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

The snapshot schema remains intentionally flexible/provisional during this milestone.

### Phase 1 — PostgreSQL Compose service: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Updated:

```text
compose.yaml
```

Added service:

```yaml
db:
  image: postgres:17-alpine
  environment:
    POSTGRES_DB: prompt_draft
    POSTGRES_USER: prompt_draft
    POSTGRES_PASSWORD: prompt_draft_dev
```

Current intentional boundaries:

- no named volume yet;
- no host port publication for PostgreSQL;
- no Node PostgreSQL dependency;
- API still uses in-memory `wizardRuns`;
- API does not connect to `db` yet;
- no `wizard_runs` SQL table exists yet.

The future Compose-internal database address is:

```text
db:5432
```

The local password in Compose is a development-only value and is not a production secret-management design.

Phase 1 is not `DONE` until the user locally confirms the PostgreSQL container starts and accepts a database session.

### Phase 2 — named volume/persistence proof: NOT STARTED

Will attach a named Docker volume and explicitly prove that a database artifact survives PostgreSQL container recreation.

### Phase 3 — API -> PostgreSQL connectivity: NOT STARTED

Will add a minimal Node PostgreSQL client and verify API-container -> `db:5432` networking before changing endpoints.

### Phase 4 — first `wizard_runs` table: NOT STARTED

### Phase 5 — replace POST memory insert with SQL INSERT: NOT STARTED

### Phase 6 — replace GET memory list with SQL SELECT: NOT STARTED

### Phase 7 — durable end-to-end verification: NOT STARTED

## Next action

Sync the branch and start the updated Compose project:

```powershell
git pull
docker compose up
```

The first run may pull the `postgres:17-alpine` image.

In another terminal verify both services are running:

```powershell
docker compose ps
```

Then verify PostgreSQL itself is accepting connections:

```powershell
docker compose exec db pg_isready -U prompt_draft -d prompt_draft
```

Expected result includes:

```text
accepting connections
```

Finally open a real SQL session non-interactively and ask PostgreSQL which database/user are active:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT current_database(), current_user;"
```

Expected row:

```text
prompt_draft | prompt_draft
```

After the user confirms these results, mark Phase 1 `DONE` and implement Phase 2 only.

PostgreSQL is not persistent yet because no named volume is attached.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
