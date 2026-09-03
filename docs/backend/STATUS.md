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

## Milestone 4 — COMPLETE: product integration and contract hardening

Durable Wizard-run persistence now belongs to the real Wizard success flow rather than the development Home learning hook.

### Phase 0 — harden server-owned fields: DONE

The API creates an explicit allowlisted run object. Client-supplied `id`/`createdAt` values are ignored, `wizardId` is normalized, and unknown request fields do not become stored run fields.

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

After `runtime.complete(session)` succeeds, the page preserves the final artifact locally and posts snapshot v1 through `createWizardRun()`.

Failed mapping/compile attempts return before persistence.

The real Portrait Wizard success path was locally verified. Browser DevTools showed the product `/api/wizard-runs` POST and PostgreSQL stored Wizard version 2, snapshot version 1, `review` step, finalDraft version 1, and the real compiled output.

The non-destructive persistence-failure path was also verified. With only the API container stopped, generation still completed, the Ready artifact remained usable, the persistence warning appeared, no new row was created, and the API recovered after restart.

### Phase 4 — remove Home learning hooks: DONE

`app/pages/index.vue` no longer contains the development backend learning GET/POST hooks or the hardcoded local Wizard-run POST.

The user verified Home with DevTools open: no `/api/hello` or `/api/wizard-runs` Fetch/XHR requests were produced by Home itself.

### Phase 5 — final product end-to-end verification: DONE

A fresh real Portrait Wizard run was created with server-generated UUID:

```text
d409ec15-3c22-40f6-9fc8-bafcd38e555f
```

Before container recreation, both `GET /api/wizard-runs` and direct PostgreSQL lookup returned the run with:

```text
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
```

The user then ran:

```text
docker compose down
docker compose up -d
```

without `-v`.

After both API and DB containers were recreated, the API still returned the same UUID and PostgreSQL still returned the exact row with the original `created_at` value.

Verified final product path:

```text
Home -> no backend learning side effects
Portrait Wizard finish
  -> runtime completion success
  -> POST /api/wizard-runs
  -> PostgreSQL row
  -> GET read-back
  -> API + DB containers removed/recreated
  -> named volume survives
  -> same product-created UUID returned by API and DB
```

Milestone 4 is therefore complete.

## Current intentional debt / deferred work

- authentication and user ownership;
- Wizard history/list/restore UI;
- production migration framework;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

The temporary `persistence_probe` table remains non-product learning data and can be removed during cleanup.

## Next action

Do not start another backend milestone implicitly. Before new code changes, choose the Milestone 5 scope from the remaining product/backend needs and document its contract and verification sequence first.

Likely directions include:

```text
history/read UX + API querying
or
authentication + user ownership
or
production migration/config/deployment hardening
```

## New-chat handoff

Before continuing backend work in another chat, read:

1. `docs/backend/README.md`
2. `docs/backend/IMPLEMENTATION.md`
3. `docs/backend/STATUS.md`
