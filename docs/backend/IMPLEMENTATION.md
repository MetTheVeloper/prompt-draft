# Backend Implementation Plan

## Architecture baseline

Milestones 1, 2, and 3 are complete and locally verified.

Current verified backend path:

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

Milestone 3 replaced temporary process memory with durable PostgreSQL storage.

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

This milestone does not add authentication, history UI, production migrations, or deployment concerns.

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

The API creates a strict allowlisted run object. The user verified fake client `id`/`createdAt` values are ignored, `wizardId` is trimmed, and unknown top-level request keys are not promoted into the stored run.

### Phase 1 — snapshot contract v1: DONE

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

Successful completion validates and compiles against `session.workingDraft` and returns a cloned `finalDraft`. The page does not replace its current session with the completion pipeline's returned session before entering the Ready state.

Therefore the successful-run snapshot stores decision state plus the final artifact rather than an ambiguous intermediate `workingDraft`:

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

First-class run fields remain outside the snapshot:

```text
run id
createdAt
wizardId
wizardVersion
compiled output
```

`answers` and `derived` capture Wizard decision/configuration state under `wizardVersion`. `finalDraft` is the exact successful product artifact and is already a versioned serializable `PromptDraftState` contract.

#### Backend envelope validation

The backend requires:

```text
snapshot.schemaVersion === 1
snapshot.session.currentStepId = non-empty string
snapshot.session.answers       = plain object
snapshot.session.derived       = plain object
snapshot.finalDraft            = plain object
snapshot.finalDraft.version === 1
```

After validation the stored snapshot is normalized to the versioned envelope. Unknown snapshot-envelope keys are dropped.

The backend intentionally does not reimplement every nested Wizard-answer or PromptDraft validator. The snapshot is a frontend/domain-owned versioned JSON document inside a strict backend envelope.

#### Local verification

The user verified:

```text
valid snapshot v1 -> 201 + normalized stored snapshot
invalid/legacy snapshot -> 400 + snapshot-specific validation errors
```

Injected envelope noise was absent from the stored JSONB row. The legacy shape produced field errors for `snapshot.schemaVersion`, `snapshot.session`, and `snapshot.finalDraft`.

### Phase 2 — frontend API boundary/configuration: DONE

Nuxt exposes:

```text
runtimeConfig.public.apiBase
```

configured by:

```text
NUXT_PUBLIC_API_BASE
```

with local default:

```text
http://127.0.0.1:4000
```

Typed API contracts live in:

```text
app/types/wizardRunApi.ts
```

The reusable client boundary is:

```text
app/composables/usePromptDraftApi.ts
```

It normalizes the configured base URL and exposes:

```text
hello()
createWizardRun(input)
listWizardRuns()
```

No Nuxt server routes are introduced. Requests remain browser -> external API, preserving the static frontend architecture.

The user verified that a PowerShell `NUXT_PUBLIC_API_BASE=http://localhost:4000` override is reflected by the browser client and that `hello()` succeeds through that configured base.

The user also verified the normal `pnpm generate` workflow still succeeds and prerenders `/wizard/portrait`.

### Phase 3 — persist on successful Wizard completion: IMPLEMENTED, AWAITING LOCAL VERIFICATION

`finish()` now calls the shared `createWizardRun()` client only after `runtime.complete(session)` succeeds.

The payload is built directly from the successful product result and current Wizard decision state:

```text
wizardId      = session.wizardId
wizardVersion = session.wizardVersion
output        = result.promptPreview

snapshot.schemaVersion          = 1
snapshot.session.currentStepId  = session.currentStepId
snapshot.session.answers        = session.answers
snapshot.session.derived        = session.derived
snapshot.finalDraft             = result.finalDraft
```

The local successful artifact is established before waiting on history persistence:

```text
completedDraft = result.finalDraft
completedPromptPreview = result.promptPreview
saveWizardSession(session)
```

Then the history POST runs.

This intentionally gives persistence weaker failure semantics than prompt generation:

```text
mapping/compile failure
  -> no completed artifact
  -> no Wizard-run POST

mapping/compile success + persistence success
  -> Ready artifact
  -> durable Wizard-run row

mapping/compile success + persistence failure
  -> Ready artifact remains available
  -> API failure logged
  -> locale-aware warning shown in existing Ready issue area
```

This avoids destroying a successfully generated product artifact merely because history storage is unavailable.

Local verification for Phase 3 should test both the positive product path and the non-destructive persistence-failure path.

### Phase 4 — remove development home-page API hooks

After the real Wizard path is verified:

```text
remove learning GET
remove learning POST
keep Home free of backend side effects
```

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
