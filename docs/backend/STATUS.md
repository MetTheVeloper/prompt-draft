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

The API now creates an explicit allowlisted run object instead of spreading the request body after generated fields.

The user locally verified a malicious/test request containing fake `id`, fake `createdAt`, whitespace around `wizardId`, and an unknown field.

Observed result:

```text
client id        -> ignored
client createdAt -> ignored
wizardId         -> normalized to portrait
unknown field    -> not returned/stored as a run field
```

The database row used server-generated UUID/timestamp values.

### Phase 1 — production snapshot contract v1: IMPLEMENTED, AWAITING LOCAL VERIFICATION

The successful-run snapshot contract is now:

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

Backend validation now requires:

```text
snapshot.schemaVersion === 1
snapshot.session.currentStepId = non-empty string
snapshot.session.answers       = object
snapshot.session.derived       = object
snapshot.finalDraft            = object
snapshot.finalDraft.version === 1
```

After validation, the backend normalizes the snapshot to only the versioned envelope fields above before storing it.

The backend intentionally does not duplicate every nested frontend/domain validator. The versioned snapshot is treated as a frontend-owned serialized document inside a strictly validated envelope.

Phase 1 is not `DONE` until the user rebuilds the API and verifies both:

1. a valid v1 snapshot returns `201 Created` and is normalized;
2. an invalid/legacy snapshot returns `400 Validation failed` with snapshot-specific field errors.

Temporary development note: the old home-page learning POST still sends the pre-v1 snapshot shape, so it may log a `400` in dev until that learning hook is removed later in this milestone. It is not the final product integration path.

### Phase 2 — configurable frontend API client/base: NOT STARTED

Introduce one reusable frontend API boundary so Wizard code does not hardcode `http://127.0.0.1:4000`.

Static generation must remain supported and no Nuxt server routes should be introduced.

### Phase 3 — persist successful Wizard completion: NOT STARTED

After `runtime.complete(session)` succeeds, build snapshot v1 and POST the final prompt output + snapshot to `/api/wizard-runs`.

Failed mapping/compile attempts must not create successful-run rows.

Persistence failure semantics must be chosen explicitly before implementation.

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

Milestone 4 is complete only after the real Wizard path is locally verified and the home-page hook is no longer the integration point.

## Still deferred

- authentication and user ownership;
- Wizard history/restore UI;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table also remains as non-product learning data and can be removed during cleanup.

## Next action

Sync/rebuild and verify Phase 1 with one valid snapshot-v1 POST and one invalid/legacy snapshot POST.

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
