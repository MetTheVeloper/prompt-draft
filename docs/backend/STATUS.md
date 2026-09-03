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

The snapshot schema remains intentionally flexible/provisional during this milestone.

### Phase 1 — PostgreSQL Compose service: DONE

Added `db` service using `postgres:17-alpine`.

The user locally verified:

```text
docker compose ps
```

showed both `api` and `db` running, with PostgreSQL exposed only inside the Compose network as `5432/tcp`.

The user also confirmed:

```powershell
docker compose exec db pg_isready -U prompt_draft -d prompt_draft
```

returned `accepting connections`, and:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT current_database(), current_user;"
```

returned:

```text
prompt_draft | prompt_draft
```

This proves the PostgreSQL container starts correctly and accepts a real SQL session.

### Phase 2 — named volume/persistence proof: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Updated `compose.yaml` with a named volume:

```yaml
db:
  volumes:
    - prompt_draft_pgdata:/var/lib/postgresql/data

volumes:
  prompt_draft_pgdata:
```

The volume is intentionally attached before any real `wizard_runs` table exists. Phase 2 should prove the storage primitive itself first.

Important behavior to verify:

```text
create a small probe row in PostgreSQL
  -> docker compose down
  -> containers removed
  -> named volume remains
  -> docker compose up
  -> probe row still exists
```

Do NOT use `docker compose down -v` during the persistence proof because `-v` explicitly deletes named volumes.

### Phase 3 — API -> PostgreSQL connectivity: NOT STARTED

Will add a minimal Node PostgreSQL client and verify API-container -> `db:5432` networking before changing endpoints.

### Phase 4 — first `wizard_runs` table: NOT STARTED

### Phase 5 — replace POST memory insert with SQL INSERT: NOT STARTED

### Phase 6 — replace GET memory list with SQL SELECT: NOT STARTED

### Phase 7 — durable end-to-end verification: NOT STARTED

## Next action

Sync the branch, recreate the Compose project with the new named volume, create a small persistence probe, remove/recreate the containers without deleting volumes, and confirm the probe remains.

PostgreSQL is not yet connected to the Node API. The current Wizard endpoints still use the in-memory `wizardRuns` array.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
