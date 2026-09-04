# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestones 1–5 — COMPLETE

The Docker/PostgreSQL backend foundation and Wizard-run reference implementation are complete and locally verified.

Verified platform/product capabilities include:

```text
static Nuxt frontend
  -> direct browser CORS
  -> Docker Node API :4000
  -> PostgreSQL
  -> named-volume durability
```

and:

```text
real Portrait Wizard finish
  -> durable wizard_run
  -> paginated History list
  -> full History detail
  -> failure/retry behavior
  -> successful pnpm generate
```

Milestone 5 is closed.

## Reusable API playbook — ADDED

New product APIs now have a reusable implementation guide:

```text
docs/backend/API_GUIDE.md
```

It records the conventions learned from the completed backend path:

- resource-first design;
- server-owned vs client-owned ids;
- POST vs idempotent PUT semantics;
- numbered SQL schema files;
- parameterized DB functions;
- HTTP validation and stable errors;
- CORS method updates;
- typed frontend boundaries;
- local-first sync/failure semantics;
- direct UI verification;
- `pnpm generate` as a release invariant.

## Milestone 6 — IN PROGRESS: Cloud Draft Sync

Goal:

```text
existing /create local drafts
  -> remain local-first
  -> dirty-aware server sync
  -> manual FAB + 2-minute autosync
  -> durable PostgreSQL prompt_drafts rows
```

### Existing local source

`/create` already persists:

```text
prompt-draft:create-editor:drafts:v1
```

with stable `PromptDraftRecord` ids, titles, timestamps, canonical prompt state, and debounced local saving.

Milestone 6 does not replace that system.

### Cloud Draft contract

Client-owned stable resource id:

```text
draft-<timestamp>-<random>
```

API:

```text
PUT /api/drafts/:id
  -> create/update same logical draft

GET /api/drafts/:id
  -> full server copy
```

Server record:

```text
id
 title
 createdAt
 updatedAt          # client content timestamp
 serverUpdatedAt
 revision
 snapshot
```

Server table:

```text
prompt_drafts
```

Cloud sync metadata remains separate from canonical local draft JSON:

```text
prompt-draft:create-editor:cloud-sync:v1
```

### Phase 0 — reusable API guide + contract: AWAITING USER VERIFICATION

Implemented:

```text
docs/backend/API_GUIDE.md
Milestone 6 resource/write/failure boundaries
```

### Phase 1 — schema + backend PUT/GET: AWAITING USER VERIFICATION

Implemented:

```text
backend/src/create-schema.mjs
  -> applies all numbered NNN_*.sql files in lexical order

backend/sql/002_create_prompt_drafts.sql
  -> prompt_drafts table
  -> client_updated ordering index

backend/src/database.mjs
  -> upsertPromptDraft()
  -> getPromptDraftById()

backend/src/index.mjs
  -> PUT /api/drafts/:id
  -> GET /api/drafts/:id
  -> draft validation/normalization
  -> CORS adds PUT
```

No direct SQL/backend verification has yet been accepted for this phase. The intended acceptance path is the real `/create` UI plus DB/read-back checks.

### Phase 2 — typed client + manual sync FAB: AWAITING USER VERIFICATION

Implemented:

```text
app/types/draftSyncApi.ts
app/composables/usePromptDraftApi.ts
app/components/create/DraftCloudSyncButton.vue
app/layouts/default.vue
```

Behavior:

```text
/create only
  -> FAB appears adjacent to Drafts
  -> click waits for current local debounce to settle
  -> PUT active draft
  -> dirty / syncing / synced / failed status via icon/color/tooltip
```

English/Persian sync labels are registered through dedicated locale fragments.

### Phase 3 — dirty-aware two-minute autosync: AWAITING USER VERIFICATION

Implemented:

```text
content fingerprint excludes incidental timestamps
separate per-draft sync metadata
scan local collection every 120 seconds
sync only dirty drafts
skip unchanged drafts
stop the scan after a failed server write to avoid request spam
```

The scan covers all dirty locally saved drafts, not only whichever draft happens to be active at the two-minute boundary.

Failure semantics:

```text
server failure
  -> localStorage draft remains intact
  -> editing/local autosave continues
  -> cloud status becomes failed
  -> later manual/autosync can retry
```

### Phase 4 — final product E2E/static/durability: NOT STARTED

Required final verification:

```text
1. pull latest branch
2. rebuild API image
3. apply numbered DB schema
4. run frontend
5. edit /create draft
6. manual FAB sends browser PUT successfully
7. PostgreSQL has one row for that draft id
8. edit again + save -> same row, higher revision
9. dirty state returns after content change
10. autosync uploads dirty content without duplicate draft rows
11. API down -> local draft still saves, cloud state fails gracefully
12. API back -> retry succeeds
13. GET /api/drafts/:id matches server copy
14. container recreation preserves row
15. pnpm generate succeeds
```

Do not mark any Milestone 6 phase `DONE` until the user confirms the relevant local behavior.

## Current intentional debt / deferred work

- authentication and user ownership;
- multi-device merge/conflict resolution;
- optimistic revision conflict enforcement;
- remote draft list/restore UI;
- server-side draft delete semantics;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Locally verify the first Cloud Draft vertical slice from `/create` through browser PUT and PostgreSQL persistence.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/API_GUIDE.md`
2. `docs/backend/README.md`
3. `docs/backend/IMPLEMENTATION.md`
4. `docs/backend/STATUS.md`
