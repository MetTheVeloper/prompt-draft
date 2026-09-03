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

### Phase 0 — harden server-owned fields: DONE

The API creates an explicit allowlisted run object. The user verified client-supplied `id`/`createdAt` values are ignored, `wizardId` is normalized, and unknown request fields do not become stored run fields.

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

The backend validates the versioned envelope and normalizes stored JSONB to `schemaVersion`, `session`, and `finalDraft`.

The user verified a valid v1 request returns `201 Created`, injected envelope noise is removed, and the legacy snapshot shape returns `400 Validation failed` with snapshot-specific errors.

### Phase 2 — configurable frontend API client/base: DONE

Nuxt exposes:

```text
NUXT_PUBLIC_API_BASE
  -> runtimeConfig.public.apiBase
```

with local default `http://127.0.0.1:4000`.

Typed API contracts live in `app/types/wizardRunApi.ts` and the reusable browser client is `app/composables/usePromptDraftApi.ts`.

The user verified a PowerShell override to `http://localhost:4000` is respected by the browser client and that `pnpm generate` still completes successfully with `/wizard/portrait` prerendered.

### Phase 3 — persist successful Wizard completion: DONE

The production Wizard completion point is `finish()` in `app/pages/wizard/[wizardId].vue`.

After `runtime.complete(session)` succeeds, the page keeps the final artifact locally and calls `createWizardRun()` with:

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

Failed mapping/compile attempts return before persistence.

The user locally verified the real Portrait Wizard success path. Browser DevTools showed the real `/api/wizard-runs` POST and PostgreSQL stored the product-created row with:

```text
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
step             = review
draft_version    = 1
```

The non-destructive persistence-failure path is also verified. With only the API container stopped, prompt generation still completed, the Ready screen remained available, the persistence warning appeared, no new Wizard-run row was created, and the API returned normally after restart.

### Phase 4 — remove home-page learning hooks: DONE

`app/pages/index.vue` no longer creates `usePromptDraftApi()` and no longer has the development-only `onMounted()` block.

Removed from Home:

```text
GET /api/hello learning diagnostic
POST /api/wizard-runs learning diagnostic
hardcoded http://127.0.0.1:4000 learning POST
```

The Home template and normal offline-status behavior are unchanged.

The user locally verified the Home page with DevTools open. Home produced no `/api/hello` or `/api/wizard-runs` Fetch/XHR requests and no backend learning side effects.

### Phase 5 — final product end-to-end verification: READY FOR LOCAL VERIFICATION

Perform one final product-only proof with a fresh real Wizard run and track its server-generated UUID through the complete lifecycle:

```text
Home has no backend learning side effects
Wizard finish
  -> successful runtime completion
  -> POST /api/wizard-runs
  -> PostgreSQL row
  -> GET /api/wizard-runs read-back
  -> docker compose down
  -> docker compose up -d
  -> same UUID survives through named-volume persistence
  -> GET /api/wizard-runs still returns the run
```

Do not use `docker compose down -v`; that intentionally deletes named volumes.

Milestone 4 is complete only after this final product path is locally verified.

## Still deferred

- authentication and user ownership;
- Wizard history/restore UI;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Run the Phase-5 product-only end-to-end proof, preserve the new run UUID, verify API read-back before and after API + DB container recreation, then mark Milestone 4 complete.

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
