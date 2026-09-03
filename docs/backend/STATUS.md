# Backend / Docker Status

Last updated: 2026-09-04

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result. Code creation alone is never sufficient.

## Milestone 1 — COMPLETE

Verified local Nuxt -> Docker API connectivity and browser CORS behavior.

## Milestone 2 — COMPLETE

Verified JSON POST parsing, validation, CORS/preflight, temporary Wizard-run state, and browser read-back.

## Milestone 3 — COMPLETE

Replaced process memory with PostgreSQL + Docker named-volume persistence.

Verified end to end:

```text
HTTP POST
  -> API container
  -> parameterized PostgreSQL INSERT
  -> Docker named volume
  -> API + DB containers removed/recreated
  -> PostgreSQL SELECT
  -> HTTP GET
  -> same Wizard run
```

## Milestone 4 — COMPLETE: product integration and contract hardening

Durable Wizard-run persistence now belongs to the real Wizard success flow rather than the development Home learning hook.

Verified product behavior:

- server-owned `id` and `createdAt`;
- snapshot contract v1;
- configurable `NUXT_PUBLIC_API_BASE`;
- real Portrait Wizard persistence after successful `finish()`;
- failed persistence does not destroy a successfully generated artifact;
- Home page has no backend learning GET/POST side effects;
- product-created rows survive `docker compose down/up` through the PostgreSQL named volume;
- static generation remains supported.

Reference verified run:

```text
d409ec15-3c22-40f6-9fc8-bafcd38e555f
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
```

## Milestone 5 — IN PROGRESS: History / Read API + UX

Goal:

```text
durable successful Wizard runs
  -> production read contract
  -> paginated History collection
  -> full run detail
  -> typed frontend read boundary
  -> History UI
```

Architecture remains:

```text
static-generated Nuxt frontend
  -> direct browser calls
  -> independent Dockerized API :4000
  -> PostgreSQL
```

Authentication, ownership, and historical Wizard restore are not part of Milestone 5.

### Phase 0 — contract freeze: DONE

The user reviewed and approved the contract.

Frozen read contract:

```text
GET /api/wizard-runs
  -> summary records only
  -> newest first
  -> ORDER BY created_at DESC, id DESC
  -> limit: default 20, min 1, max 100
  -> opaque cursor based on createdAt + id
  -> optional wizardId filter in Phase 3
  -> pageInfo.nextCursor
  -> pageInfo.hasMore

GET /api/wizard-runs/:id
  -> full run
  -> output
  -> snapshot
```

List summary shape:

```text
id
createdAt
wizardId
wizardVersion
```

Full `output` and `snapshot` are intentionally excluded from collection rows.

Detail status semantics:

```text
existing UUID -> 200
valid missing UUID -> 404
malformed id -> 400
```

The old list `count` field is not promoted into an exact-total contract. Arbitrary sort/search/date/version filters remain deferred.

History detail is read-only. Stored snapshots are not restored/executed as current Wizard sessions during this milestone.

### Phase 1 — single-run detail API: DONE

Implemented:

```text
backend/src/database.mjs
  -> getWizardRunById(id)
  -> parameterized SELECT by UUID
  -> full run mapping
  -> null when no row exists

backend/src/index.mjs
  -> GET /api/wizard-runs/:id
  -> UUID validation before PostgreSQL
  -> 200 { ok: true, run }
  -> 404 { ok: false, message: "Wizard run not found" }
  -> 400 { ok: false, message: "Invalid Wizard run id" }
  -> 500 read failure boundary
```

User verification completed locally:

```text
existing run d409ec15-3c22-40f6-9fc8-bafcd38e555f
  -> 200
  -> full output + snapshot returned

00000000-0000-0000-0000-000000000000
  -> 404 Wizard run not found

not-a-uuid
  -> 400 Invalid Wizard run id

POST fresh verification run
  -> 201
  -> id 37e32eb8-7501-4f46-8c47-70520866e328

immediate detail GET of fresh run
  -> 200
  -> output = "Milestone 5 Phase 1 detail verification"
  -> same snapshot returned

collection regression check before Phase 2
  -> 200
  -> count = 7
  -> fresh run visible
  -> previous full-list behavior still intact
```

Phase 1 is therefore verified and complete.

### Phase 2 — cursor-paginated summary collection: AWAITING USER VERIFICATION

Implemented replacement for the old unbounded full-row collection.

Database behavior:

```text
listWizardRuns({ limit, cursor })
  -> summary projection only
  -> id, createdAt, wizardId, wizardVersion
  -> ORDER BY created_at DESC, id DESC
  -> keyset predicate when cursor exists:
       (created_at, id) < (cursor.createdAt, cursor.id)
  -> fetch limit + 1
  -> derive hasMore
  -> return at most limit rows
```

HTTP behavior:

```text
GET /api/wizard-runs
  -> default limit 20
  -> no count field
  -> no output field in collection rows
  -> no snapshot field in collection rows
  -> pageInfo.nextCursor
  -> pageInfo.hasMore

GET /api/wizard-runs?limit=N
  -> N must be integer 1..100

GET /api/wizard-runs?cursor=<opaque>
  -> cursor decodes to createdAt + id
  -> invalid cursor -> structured 400
```

Cursor encoding is backend-owned and uses an opaque base64url representation of the final returned ordering tuple. Frontend callers must not interpret it.

`wizardId` filtering is intentionally not implemented yet; it remains Phase 3.

Required local verification before Phase 2 can become `DONE`:

```text
1. pull latest branch and rebuild API
2. default GET -> 200 summary contract, newest first
3. confirm collection rows contain no output/snapshot
4. limit=2 -> exactly two summaries + hasMore=true + nextCursor
5. request next page with returned cursor
6. continue until final page -> hasMore=false + nextCursor=null
7. confirm no duplicate ids across pages
8. confirm all existing ids are eventually returned exactly once
9. invalid limits: 0, 101, abc -> structured 400
10. invalid cursor -> structured 400
11. detail GET still returns full output/snapshot
12. POST still returns 201 and a fresh run appears at the front of a new first-page request
```

Do not mark Phase 2 `DONE` until the user completes and confirms these checks locally.

### Phase 3 — wizardId filtering: NOT STARTED

Planned filter on the paginated collection. Pagination will operate inside the filtered result set.

### Phase 4 — typed frontend read boundary: NOT STARTED

Planned typed summary/detail contracts and browser API methods with static generation preserved.

### Phase 5 — History UI MVP: NOT STARTED

Target routes:

```text
/history
/history/:id
```

### Phase 6 — Milestone 5 product E2E: NOT STARTED

Will verify a real Wizard-created run through History list/detail and container recreation before marking the milestone complete.

## Current intentional debt / deferred work

- authentication and user ownership;
- Wizard restore/resume from historical snapshots;
- delete/rename/favorite History operations;
- arbitrary search/sorting/date/version filtering;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Locally verify Milestone 5 Phase 2 cursor-pagination and summary-list behavior.

Phase 3 must not start and Phase 2 must not be marked `DONE` until that verification is confirmed.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
