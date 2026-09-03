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

Verified capabilities include:

```text
Docker Compose API + PostgreSQL
  -> service-name networking
  -> named-volume persistence
  -> explicit SQL schema
  -> parameterized INSERT
  -> SELECT read-back
  -> full API + DB container recreation
  -> same Wizard rows
```

Current relational shape:

```text
table: wizard_runs

id              UUID primary key
created_at      timestamp with time zone
wizard_id       text
wizard_version  integer
output           text
snapshot         jsonb
```

The backend uses `pg 8.16.3`, a pool in `backend/src/database.mjs`, and versioned schema source `backend/sql/001_create_wizard_runs.sql`.

## Milestone 4 objective — real Wizard integration

Move persistence from the home-page learning hook into the actual Wizard success flow while tightening the boundary between client-owned and server-owned data.

This milestone should not add authentication, history UI, production migrations, or deployment concerns.

## Real Wizard success event

The production Wizard page is:

```text
app/pages/wizard/[wizardId].vue
```

Its `finish()` function calls:

```text
runtime.complete(session)
```

A successful result supplies:

```text
result.finalDraft
result.promptPreview
```

Only after `result.ok` does the page enter the completed Ready state.

That makes successful `finish()` the current canonical persistence event:

```text
Wizard session
  -> runtime.complete(session)
  -> mapping/compile succeeds
  -> finalDraft + promptPreview exist
  -> persist Wizard run
  -> Ready UI
```

Failed mapping/compilation attempts must not create successful Wizard-run history rows.

`WizardDirectionReady.vue` currently has Create handoff, save-template, start-another, and edit-direction actions. There is no copy action in the current Ready UI, so persistence is not tied to clipboard behavior.

## Milestone 4 phases

### Phase 0 — server-owned field hardening: DONE

Previous code constructed runs as:

```js
const run = {
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  ...body,
}
```

This allowed client-provided `id` and `createdAt` fields to override generated values.

The API now creates a strict allowlisted object. The user verified fake client `id`/`createdAt` values are ignored, `wizardId` is trimmed, and unknown top-level request keys are not promoted into the stored run.

### Phase 1 — snapshot contract v1: IMPLEMENTED, AWAITING LOCAL VERIFICATION

#### Product/domain reasoning

`WizardSession` contains:

```text
wizardId
wizardVersion
currentStepId
answers
derived
workingDraft
```

The existing local Wizard persistence stores the whole `WizardSession`, proving it is serializable for resume purposes.

However, successful completion validates and compiles against `session.workingDraft` and returns a cloned `finalDraft`. The page does not replace its current session with the completion pipeline's returned session before entering the Ready state.

Therefore storing the page's entire `WizardSession` as a successful-run snapshot would make `workingDraft` ambiguous: it is intermediate execution state and is not the authoritative completed artifact.

The v1 successful-run snapshot deliberately stores decision state plus the final artifact instead:

```json
{
  "schemaVersion": 1,
  "session": {
    "currentStepId": "review",
    "answers": {},
    "derived": {}
  },
  "finalDraft": {
    "version": 1
  }
}
```

Keep outside the snapshot because they already have first-class run fields:

```text
run id
createdAt
wizardId
wizardVersion
compiled output
```

Why include `answers` and `derived`:

- they capture Wizard decision/configuration state;
- they remain naturally interpreted under the first-class `wizardVersion`;
- they avoid flattening Portrait-specific state into relational columns prematurely.

Why include `finalDraft`:

- `PromptDraftState` is already a versioned serializable application/domain contract;
- it is the exact successful product artifact produced by completion;
- it gives future history/restore work a stable artifact rather than requiring re-compilation through future code/definitions.

Why exclude `workingDraft`:

- it is intermediate Wizard execution state;
- it can be stale/ambiguous relative to the completed artifact at the page boundary;
- storing both would duplicate potentially large Draft state without a demonstrated product need.

#### Backend envelope validation

The backend now requires:

```text
snapshot.schemaVersion === 1
snapshot.session.currentStepId = non-empty string
snapshot.session.answers       = plain object
snapshot.session.derived       = plain object
snapshot.finalDraft            = plain object
snapshot.finalDraft.version === 1
```

After validation the backend normalizes the stored snapshot to:

```js
{
  schemaVersion: 1,
  session: {
    currentStepId,
    answers,
    derived,
  },
  finalDraft,
}
```

Unknown snapshot-envelope keys are dropped.

The backend intentionally does not reimplement every nested Wizard-answer or PromptDraft validator. The snapshot is a frontend/domain-owned versioned JSON document inside a strict backend envelope. This avoids creating a second divergent copy of the frontend domain model in the Node API.

#### Temporary dev-hook consequence

`app/pages/index.vue` still sends the older learning snapshot shape:

```json
{
  "answers": {},
  "derived": {}
}
```

After Phase 1 backend enforcement, that dev-only POST may return `400` until the learning hook is removed later in Milestone 4. This is acceptable transitional behavior because the home-page POST is explicitly not the product integration path.

Local Phase-1 verification should prove:

```text
valid snapshot v1 -> 201 + normalized stored snapshot
invalid/legacy snapshot -> 400 + snapshot-specific validation errors
```

### Phase 2 — frontend API boundary/configuration

Current home-page learning code directly calls:

```text
http://127.0.0.1:4000
```

`nuxt.config.ts` currently has no public API-base setting.

Before Wizard integration, introduce a small reusable client boundary, conceptually:

```text
NUXT_PUBLIC_API_BASE
  -> runtimeConfig.public.apiBase
  -> Wizard-run API helper
```

Requirements:

- local dev can target `http://127.0.0.1:4000`;
- product code must not duplicate local URLs;
- static generation must remain supported;
- no Nuxt server routes are introduced.

### Phase 3 — persist on successful Wizard completion

Inside `finish()`:

```text
runtime.complete(session)
  -> if !ok: current error behavior, no persistence
  -> build snapshot v1
  -> POST final prompt + snapshot
  -> completed Ready state
```

Persistence failure semantics must be chosen explicitly. Do not silently report history success if the database write failed.

Recommended first product rule: keep the successfully generated artifact available locally and surface a persistence warning/error rather than discarding a successful compile solely because history storage is unavailable. Confirm this rule before implementing Phase 3.

### Phase 4 — remove development home-page API hooks

`app/pages/index.vue` currently performs dev-only GET and POST calls on mount.

After the real Wizard path is verified:

- remove the learning GET;
- remove the learning POST;
- keep the home page free of backend side effects.

### Phase 5 — real browser E2E verification

Locally complete the actual Portrait Wizard and verify:

```text
Wizard finish
  -> runtime completion succeeds
  -> final prompt output exists
  -> POST /api/wizard-runs
  -> PostgreSQL row
  -> GET /api/wizard-runs
  -> exact wizardId/version/output/snapshot v1
```

Then recreate containers without deleting the volume and prove the product-created row survives.

Milestone 4 is complete only after the home-page hook is removed and the real Wizard completion path is the verified persistence source.

## Existing intentional learning shortcuts / later debt

### Schema workflow

The current schema uses one explicit SQL file plus `npm run db:schema`. A production migration framework remains deferred.

### Temporary database artifact

`persistence_probe` remains from the named-volume learning phase and can be dropped during cleanup.

### Deferred product/platform work

- authentication and user ownership;
- Wizard history/list/restore UI;
- production migration workflow;
- production secrets;
- deployment/domain/HTTPS;
- Redis.
