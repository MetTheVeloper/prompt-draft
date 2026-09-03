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

## Milestone 4 objective — real Wizard integration

Move persistence from the Home learning hook into the actual Wizard success flow while keeping the API contract explicit and failure behavior non-destructive.

This milestone does not add authentication, history UI, production migrations, or deployment concerns.

## Milestone 4 phases

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

The user verified this by stopping only the API container, generating again from Review, seeing the Ready artifact plus warning, confirming no new row was added, then restarting the API successfully.

### Phase 4 — remove development Home API hooks: IMPLEMENTED, AWAITING LOCAL VERIFICATION

`app/pages/index.vue` has been cleaned of all backend learning side effects.

Removed:

```text
usePromptDraftApi() Home diagnostic instance
onMounted() backend learning block
GET /api/hello from Home
legacy POST /api/wizard-runs from Home
hardcoded http://127.0.0.1:4000 learning POST
```

The Home template and offline-package status UI are unchanged.

Verification requirement:

```text
load http://localhost:3030/
open DevTools Fetch/XHR + Console
refresh Home
confirm no /api/hello request
confirm no /api/wizard-runs request
confirm no [Prompt Draft API] learning logs
```

### Phase 5 — final product-only E2E verification

After Phase 4 passes, perform one final proof that the only product persistence source is Wizard completion:

```text
Home refresh -> no backend request
Portrait Wizard finish -> POST /api/wizard-runs
GET /api/wizard-runs -> product-created row visible
docker compose down
docker compose up -d
GET /api/wizard-runs -> same row still visible
```

Milestone 4 is complete after this final proof.

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
