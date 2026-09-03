# Backend Implementation Plan

## Architecture baseline

Milestones 1, 2, 3, and 4 are complete and locally verified.

Current verified product/backend path:

```text
Nuxt frontend :3030
  -> real Portrait Wizard finish()
  -> browser CORS/preflight
  -> Docker API :4000
  -> Node HTTP server
  -> request parsing + validation
  -> PostgreSQL client/pool
  -> db:5432
  -> wizard_runs
  -> Docker named volume
```

The backend remains independent from Nuxt server routes, so the frontend can continue to use static generation.

## Milestone 4 — COMPLETE: real Wizard integration

Milestone 4 moved persistence from a development Home learning hook into the actual Wizard success flow and hardened the client/server contract.

### Phase 0 — server-owned field hardening: DONE

The API constructs an allowlisted run shape. Server-generated `id` and `createdAt` cannot be overridden by request fields, `wizardId` is normalized, and unknown request keys are excluded.

### Phase 1 — snapshot contract v1: DONE

Successful-run snapshot:

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

`wizardId`, `wizardVersion`, `output`, `id`, and `createdAt` remain first-class run fields outside the snapshot.

`answers` and `derived` capture Wizard decision state. `finalDraft` captures the exact successful product artifact. Intermediate `workingDraft` is intentionally excluded from successful-run history.

The backend validates the snapshot envelope without duplicating every nested frontend domain validator.

### Phase 2 — frontend API boundary/configuration: DONE

Nuxt public runtime config:

```text
NUXT_PUBLIC_API_BASE
  -> runtimeConfig.public.apiBase
```

Reusable frontend boundary:

```text
app/composables/usePromptDraftApi.ts
```

Typed contracts:

```text
app/types/wizardRunApi.ts
```

The browser client exposes `hello()`, `createWizardRun(input)`, and `listWizardRuns()` while product code avoids duplicated local URLs.

Static generation remains supported and no Nuxt server routes are introduced.

### Phase 3 — persist on successful Wizard completion: DONE

The canonical persistence event is successful `finish()` in:

```text
app/pages/wizard/[wizardId].vue
```

Flow:

```text
runtime.complete(session)
  -> if failure: existing Wizard error, no history row
  -> finalDraft + promptPreview
  -> preserve completed artifact locally
  -> save local Wizard session
  -> createWizardRun(snapshot v1)
```

The user verified the real Portrait Wizard creates a PostgreSQL row with Wizard version 2, snapshot version 1, `review` step, finalDraft version 1, and the actual compiled prompt output.

Persistence failure semantics are intentionally weaker than prompt-generation semantics:

```text
compile success + persistence failure
  -> completed Ready artifact remains usable
  -> persistence warning shown
  -> no new history row
```

That failure behavior was locally verified by stopping only the API container during a successful completion attempt.

### Phase 4 — remove development Home API hooks: DONE

`app/pages/index.vue` is free of backend learning side effects.

Removed:

```text
Home GET /api/hello diagnostic
Home legacy POST /api/wizard-runs
hardcoded local Wizard-run URL
Home onMounted backend learning block
```

Home was locally verified with DevTools: it produces no backend Fetch/XHR side effects of its own.

### Phase 5 — final product-only E2E verification: DONE

A fresh real Wizard run with UUID:

```text
d409ec15-3c22-40f6-9fc8-bafcd38e555f
```

was tracked through the complete lifecycle:

```text
Portrait Wizard finish
  -> POST /api/wizard-runs
  -> PostgreSQL INSERT
  -> GET /api/wizard-runs read-back
  -> direct DB lookup
  -> docker compose down
  -> docker compose up -d
  -> PostgreSQL readiness
  -> GET read-back again
  -> direct DB lookup again
  -> same UUID and original row survive
```

The final row was verified as:

```text
wizard_id        = portrait
wizard_version   = 2
snapshot_version = 1
```

This proves the product-created run survives full API + DB container recreation through the named PostgreSQL volume.

## Current implementation boundaries

### Schema workflow

The current schema uses one explicit SQL file plus `npm run db:schema`. A production migration framework remains deferred.

### Temporary database artifact

`persistence_probe` remains from the named-volume learning phase and can be dropped during cleanup.

### Deferred product/platform work

- authentication and user ownership;
- Wizard history/list/restore UI;
- production migration workflow;
- production secrets/configuration;
- deployment/domain/HTTPS;
- Redis.

## Milestone 5 — not started

Do not choose Milestone 5 implicitly. Before implementation, select one coherent next scope and define its runtime verification sequence.

Reasonable next directions are:

```text
A) history/read UX + API querying/pagination
B) authentication + user ownership
C) production migration/config/deployment hardening
```

The choice should be made based on the next product goal rather than simply adding infrastructure for its own sake.
