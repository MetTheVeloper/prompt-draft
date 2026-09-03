# Backend / Docker Status

Last updated: 2026-09-03

Branch: `feature/docker-local-api`

## Verification rule

A phase is marked `DONE` only after the user runs the relevant behavior locally and confirms the result.

## Milestone 1 — COMPLETE

Verified end to end: Nuxt `localhost:3030` -> Docker API `:4000` -> Node HTTP server -> browser console.

## Milestone 2 — COMPLETE

Verified JSON POST, validation, CORS/preflight, temporary process memory, and browser read-back.

## Milestone 3 — COMPLETE

Replaced process memory with PostgreSQL + Docker named-volume persistence.

Verified end to end:

```text
HTTP POST
  -> API container
  -> parameterized PostgreSQL INSERT
  -> PostgreSQL data directory
  -> Docker named volume
  -> API + DB containers removed/recreated
  -> PostgreSQL SELECT
  -> HTTP GET
  -> same Wizard run
```

## Milestone 4 — IN PROGRESS: product integration and contract hardening

Goal: make durable Wizard-run persistence belong to the real Wizard product flow instead of the development home-page hook.

### Product-flow analysis

The current production Wizard page completes through `finish()` in:

```text
app/pages/wizard/[wizardId].vue
```

The sequence is:

```text
runtime.complete(session)
  -> result.ok
  -> finalDraft
  -> promptPreview
  -> completed Ready screen
```

This is the first point where the run is definitively successful and the final compiled output exists.

The current `WizardDirectionReady` UI has actions for Create handoff, save-template, start-another, and edit-direction. It does not currently expose a copy action. Therefore the current recommended persistence event is successful Wizard completion, not clipboard/copy interaction.

### Phase 0 — harden server-owned fields: IMPLEMENTED, AWAITING LOCAL VERIFICATION

Previously the API built a run with:

```js
{
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  ...body,
}
```

Because client fields were spread last, a request could override generated `id` and `createdAt`.

`backend/src/index.mjs` now creates an explicit allowlisted run shape:

```js
{
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  wizardId: body.wizardId.trim(),
  wizardVersion: body.wizardVersion,
  output: body.output,
  snapshot: body.snapshot,
}
```

Unknown body keys are not included in the run object and client-supplied `id`/`createdAt` cannot become stored server fields.

Phase 0 is not `DONE` until the user rebuilds the API and sends a malicious/test payload containing fake `id` and `createdAt`, then confirms the response/database row uses server-generated values instead.

### Phase 1 — production snapshot contract v1: NOT STARTED

Define the meaning of `snapshot` before sending real Wizard sessions to the backend.

Current recommended direction:

```json
{
  "schemaVersion": 1,
  "session": {
    "currentStepId": "review",
    "answers": {},
    "derived": {}
  },
  "finalDraft": {}
}
```

`wizardId`, `wizardVersion`, final compiled `output`, run `id`, and `createdAt` already have first-class columns/API fields and do not need duplication inside the snapshot.

The final successful Draft is a candidate for inclusion because it preserves the exact product artifact for future history/restore behavior, while intermediate `workingDraft` need not automatically be duplicated.

This contract is still provisional until Phase 1 is explicitly agreed and implemented.

### Phase 2 — configurable frontend API client/base: NOT STARTED

The current Nuxt config has no public API-base configuration, while the home learning hooks call `http://127.0.0.1:4000` directly.

Before real product integration, add one small client/config boundary so Wizard product code does not hardcode a local development address.

Static generation must remain supported.

### Phase 3 — persist successful Wizard completion: NOT STARTED

After `runtime.complete(session)` succeeds, POST the final versioned snapshot and compiled prompt output to `/api/wizard-runs`.

Do not persist failed mapping/compile attempts.

Persistence failure behavior must be explicitly decided before implementation rather than silently swallowing failures.

### Phase 4 — remove home-page learning hooks: NOT STARTED

After the real Wizard integration is verified, remove the development-only GET/POST learning calls from `app/pages/index.vue`.

### Phase 5 — browser end-to-end verification: NOT STARTED

Complete a real Wizard locally and prove:

```text
Wizard finish
  -> successful runtime completion
  -> POST /api/wizard-runs
  -> PostgreSQL INSERT
  -> GET/read-back
  -> expected versioned snapshot/output
```

Milestone 4 is complete only after the real Wizard path is locally verified and the home-page POST is no longer the product integration point.

## Still deferred

- authentication and user ownership;
- Wizard history/restore UI;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table also remains as non-product learning data and can be removed during cleanup.

## Next action

Sync/rebuild and verify Phase 0 with a client payload that tries to override server-owned fields.

Because this update is remote:

```cmd
git pull
```

Then rebuild the API image before testing backend behavior.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
