# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result.

## Milestone 1 — COMPLETE

Verified Nuxt -> Docker API local connectivity and browser CORS behavior.

## Milestone 2 — COMPLETE

Verified JSON POST, validation, CORS/preflight, temporary process memory, and browser read-back.

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

## Milestone 4 — IN PROGRESS: product integration and contract hardening

Goal: make durable Wizard-run persistence belong to the real Wizard product flow instead of the development home-page hook.

### Product-flow analysis

The real Wizard completion point is `finish()` in:

```text
app/pages/wizard/[wizardId].vue
```

Current flow:

```text
runtime.complete(session)
  -> result.ok
  -> finalDraft + promptPreview
  -> Ready screen
```

`WizardDirectionReady.vue` currently has no copy action, so successful Wizard completion is the current persistence event rather than clipboard/copy behavior.

### Phase 0 — harden server-owned fields: DONE

The API creates an explicit allowlisted run object rather than spreading the request body after generated fields.

The user locally verified a payload containing fake `id`, fake `createdAt`, whitespace around `wizardId`, and an unknown field.

Observed result:

```text
client id        -> ignored
client createdAt -> ignored
wizardId         -> normalized to portrait
unknown field    -> not returned/stored as a run field
```

The database row used server-generated UUID/timestamp values.

### Phase 1 — production snapshot contract v1: DONE

Successful-run snapshot contract:

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

Semantics:

- `wizardId` and `wizardVersion` remain first-class run fields and are not duplicated inside the snapshot;
- compiled prompt text remains the first-class `output` field;
- session `answers` and `derived` capture Wizard decision/configuration state;
- `finalDraft` stores the exact successful artifact;
- intermediate `workingDraft` is intentionally not duplicated in the snapshot.

Backend validation requires:

```text
snapshot.schemaVersion === 1
snapshot.session.currentStepId = non-empty string
snapshot.session.answers       = object
snapshot.session.derived       = object
snapshot.finalDraft            = object
snapshot.finalDraft.version === 1
```

The backend normalizes the snapshot to the versioned envelope before storing it.

The user locally verified:

```text
valid snapshot v1  -> 201 Created
legacy snapshot    -> 400 Validation failed
```

The valid row stored only `schemaVersion`, `session`, and `finalDraft`; injected envelope noise was removed. The legacy request returned field errors for `snapshot.schemaVersion`, `snapshot.session`, and `snapshot.finalDraft`.

### Phase 2 — configurable frontend API client/base: DONE

Public Nuxt runtime configuration:

```text
NUXT_PUBLIC_API_BASE
  -> runtimeConfig.public.apiBase
```

Local default:

```text
http://127.0.0.1:4000
```

Typed frontend contract:

```text
app/types/wizardRunApi.ts
```

Reusable API composable:

```text
app/composables/usePromptDraftApi.ts
```

It owns API-base normalization and exposes:

```text
hello()
createWizardRun(input)
listWizardRuns()
```

The user locally verified a PowerShell override:

```text
NUXT_PUBLIC_API_BASE=http://localhost:4000
```

and the browser console showed the shared API client resolving `http://localhost:4000` and successfully calling `/api/hello`.

The user also ran the normal static-generation workflow. `pnpm generate` completed successfully and prerendered `/wizard/portrait`, proving the frontend API boundary does not break the static build path.

### Phase 3 — persist successful Wizard completion: SUCCESS PATH VERIFIED, FAILURE PATH AWAITING

`finish()` uses `createWizardRun()` only after `runtime.complete(session)` returns success.

Successful completion follows:

```text
runtime.complete(session)
  -> result.ok
  -> finalDraft + promptPreview
  -> keep completed artifact locally
  -> save local Wizard session
  -> POST Wizard run snapshot v1
```

The POST uses:

```text
wizardId      = session.wizardId
wizardVersion = session.wizardVersion
output        = result.promptPreview
snapshot.session.currentStepId = session.currentStepId
snapshot.session.answers       = session.answers
snapshot.session.derived       = session.derived
snapshot.finalDraft            = result.finalDraft
```

Failed mapping/compile attempts return before the persistence call and therefore do not create successful-run rows.

Persistence failure semantics are intentionally non-destructive: a successful generated artifact remains on the Ready screen even if history storage fails. The page logs the API failure and surfaces a locale-aware persistence warning through the existing Ready-screen issue area.

The real Portrait Wizard success path is now locally verified. The user completed the Wizard in the browser and DevTools showed a real `/api/wizard-runs` request/response with server-generated run id. PostgreSQL then showed the product-created row:

```text
id               = 0f5068e4-9987-46f3-8ef3-c890cd5ff820
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
step             = review
draft_version    = 1
```

The stored output preview begins with the real compiled Wizard prompt, and the request/response snapshot contains the completed `finalDraft` plus session decision state.

Phase 3 is not `DONE` until the non-destructive persistence-failure path is also verified by making the API unavailable during a successful completion and confirming:

```text
compile succeeds
Ready artifact remains visible
persistence warning is shown
no new database row is created
```

### Phase 4 — remove home-page learning hooks: NOT STARTED

Remove the development-only GET/POST calls from `app/pages/index.vue` after the real Wizard integration is verified.

### Phase 5 — browser end-to-end verification: NOT STARTED

Complete a real Wizard locally and prove:

```text
Wizard finish
  -> successful runtime completion
  -> POST /api/wizard-runs
  -> PostgreSQL INSERT
  -> GET/read-back
  -> expected snapshot v1 + output
```

Milestone 4 is complete only after the home-page hook is removed and the real Wizard completion path is the verified persistence source.

## Still deferred

- authentication and user ownership;
- Wizard history/restore UI;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table also remains as non-product learning data and can be removed during cleanup.

## Next action

Verify the Phase-3 failure path without changing code: return the completed Wizard to Review, record the current `wizard_runs` count, stop only the API container, generate the prompt again, confirm the Ready artifact remains visible with the persistence warning, confirm the database count did not increase, then restart the API container.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
