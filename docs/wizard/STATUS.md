# Wizard Development Status

Last updated: **2026-08-28**

Status: **First Portrait Wizard UI + host integration implemented; manual UI acceptance pending**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Wizard UI architecture source of truth: [`UI.md`](./UI.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

The deterministic Portrait backend remains accepted through the complete canonical flow:

```text
Answers
  ↓
Rules / derived intent
  ↓
Portrait Action Mapper
  ↓
Working Draft
  ↓
prompt.validate
  ↓
prompt.compile
  ↓
completed finalDraft + output
```

The first real Wizard presentation/host layer is now implemented on top of that backend:

```text
Create host
  ↓ launch
/wizard/portrait
  ↓
Wizard Registry
  ↓
shared Wizard Shell + Question Renderer
  ↓
Wizard Session
  ↓
semantic Review
  ↓ Finish
completePortraitWizard(...)
  ↓ success only
hostDraft commit
  ↓
/create
```

Current automated validation on 2026-08-28:

```text
pnpm test:wizard
23/23 passed
```

Current static production generation on 2026-08-28:

```text
pnpm generate
success
```

The generation log explicitly includes:

```text
/wizard/portrait
```

among the initial prerender routes, so the supported Portrait Wizard URL is not dependent on accidental crawler discovery.

The next checkpoint is manual UI/host acceptance against the real browser flow before calling this phase accepted.

---

## Implemented Wizard UI / routing

Implemented shared presentation pieces:

```text
app/components/wizard/
  WizardShell.vue
  WizardQuestionRenderer.vue
  WizardChoiceGroup.vue
  WizardTextQuestion.vue
  WizardVariableQuestion.vue
  WizardReview.vue
```

Implemented shared route:

```text
app/pages/wizard/[wizardId].vue
```

The route resolves the requested Wizard through the Registry and contains no Portrait-specific rendering branches.

Current real question types:

- `singleChoice`;
- `text`;
- `variablePicker`.

Back/Next uses the existing Wizard Session navigation and visible-question behavior. Review consumes the renderer-neutral semantic Review model rather than rebuilding Portrait semantics in Vue.

---

## Wizard Registry

Implemented in:

- `app/wizard/registry.ts`;
- `app/wizard/publicRoutes.ts`.

The Registry currently exposes the Portrait runtime entry and owns the Portrait-specific adapters behind a shared runtime boundary:

- Definition;
- Review adapter;
- completion adapter;
- canonical Action host context construction.

The shared route consumes only the runtime contract. Adding the next Wizard should not require a copied page implementation.

Public Wizard route metadata is kept separate/lightweight so Nuxt static generation can consume the same supported route list without importing browser/domain runtime code into configuration.

---

## Static generation

`nuxt.config.ts` now adds registered public Wizard routes to Nitro prerender configuration.

Accepted build observation from `pnpm generate`:

```text
Prerendering 10 initial routes with crawler
...
├─ /wizard/portrait
...
Generated public .output/public
```

The app remains `ssr: false`; this checkpoint concerns deterministic static route generation rather than SSR HTML rendering.

---

## Host / Active Draft boundary

Implemented in:

- `app/wizard/hostDraft.ts`.

The real Create page remains the owner of Draft collection persistence and Active Draft identity.

Wizard host behavior is intentionally narrow:

1. Create persists its current Active Draft before route teardown through its existing synchronous `saveDraft()` lifecycle;
2. Wizard reads the persisted Active Draft and clones it into `WizardSession.workingDraft`;
3. Wizard interaction changes only Session state / Working Draft;
4. Cancel navigates back without committing Wizard state;
5. Finish invokes the canonical Portrait completion pipeline;
6. only a successful completion passes `finalDraft` to the host adapter;
7. the adapter replaces only the current Active Draft state while preserving its host-owned identity/title/created metadata;
8. returning to `/create` lets the existing Create restoration path consume the committed record.

No parallel Draft store has been introduced.

---

## Create host launcher

The first discoverable host entry is implemented through the existing shared Header surface.

When the active route is `/create`:

- desktop shows a `Portrait Wizard` action;
- mobile exposes the same action in the existing drawer menu.

The launcher navigates to:

```text
/wizard/portrait
```

It does not mutate Draft state itself. Create's existing teardown persistence remains the host boundary before the Wizard initializes.

This is intentionally a first-Portrait launcher, not a generalized Wizard catalog UI.

---

## Accepted Portrait mapper

Implementation commit:

- `4818fdf1e12f1338678589af3bf69894a3cf2dab` — `feat(wizard): add portrait action mapper`

Accepted behaviors include:

- stable Subject normalization;
- deterministic Portrait defaults and derived intent;
- explicit user overrides preserved over changing defaults;
- canonical Expression/Hair/Outfit/Framing/Pose/Background/Lighting Actions;
- canonical Setup mutation;
- no direct Draft/path mutation;
- rollback to the pre-mapping Working Draft when a later mapping Action fails.

---

## Accepted Review model

Implemented in:

- `app/wizard/portraitReview.ts`.

`buildPortraitWizardReview(...)` produces a renderer-neutral semantic review model containing:

- step identity;
- user-facing label;
- user-facing resolved value;
- answer source (`default | user`, or derived fallback);
- answer identity for edit/navigation wiring.

The Review intentionally does **not** expose Action IDs, module keys, field IDs, preset IDs, or other implementation vocabulary.

Rules are resolved before Review, so recommendations/defaults shown to the user match the state that mapping consumes. Explicit user overrides remain visible and sticky.

---

## Accepted Completion orchestration

Implemented in:

- `app/wizard/completion.ts`;
- `app/wizard/portraitCompletion.ts`.

Generic completion runs canonical read Actions in this exact order:

```text
Wizard Working Draft
  ↓
prompt.validate
  ↓ only if valid
prompt.compile
  ↓
clone final Draft + compiled output
```

Accepted invariants:

- validation/compile use only the public Actions API;
- validation errors stop completion before compile;
- read-action failures are surfaced separately from validation failures;
- completion does not mutate the Wizard Session while reading;
- successful `finalDraft` is cloned from the completed Working Draft;
- no Active Draft reference is accepted or replaced by the completion layer;
- persisted `outputFormat` is unchanged when compile uses a one-off format override;
- host application of `finalDraft` remains a separate success-only responsibility;
- mapping failure never enters validation/compile.

---

## Accepted Wizard tests

Current `pnpm test:wizard` gate: **23/23**.

Coverage includes:

1. Wizard definition validation;
2. Session isolation, defaults, navigation and canonical Action execution;
3. Subject normalization;
4. deterministic rule/default behavior;
5. Portrait derived-state mapping;
6. complete Professional/Cinematic mappings;
7. keep-reference Hair/Outfit semantics;
8. sequence rollback on mapping failure;
9. missing Subject rejection before mutation;
10. semantic Review output and explicit override preservation;
11. validation stopping before compile;
12. end-to-end map → validate → compile with the original Active Draft untouched;
13. compile format override remaining read-only;
14. mapping failure preventing completion reads.

---

## Accepted foundation remains unchanged

- Actions API Phase 10: **176/176** accepted;
- public Actions surface: **101** under `prompt-draft.actions.v1`;
- Wizard foundation: **9/9** accepted;
- Wizard + mapper: **17/17** accepted;
- Wizard + Review/Completion: **23/23** accepted;
- Reference Catalog: **15/15** accepted baseline;
- Phase 8 UX: **5/5** accepted baseline;
- Phase 9 compiler: **9/9** accepted baseline.

---

## Manual acceptance still required

Before accepting the first UI/host phase, verify in the real app:

1. Create shows the Portrait Wizard launcher on desktop;
2. mobile menu exposes the same launcher;
3. launch opens `/wizard/portrait` with the current Active Draft isolated into the Wizard Session;
4. Subject picker exposes valid user Subject variables;
5. all three real question renderers behave correctly;
6. conditional Pose and Environment questions update correctly;
7. Back/Next progression is correct;
8. Review groups semantic values and Edit returns to the expected step;
9. Cancel leaves the persisted Active Draft unchanged;
10. Finish succeeds for a valid Portrait flow;
11. successful Finish updates only the existing Active Draft and returns to Create;
12. the resulting Draft is editable normally in Expert UI;
13. failed completion does not overwrite the Active Draft;
14. desktop/mobile visual layout is usable enough for the first baseline.

---

## Still not implemented

- in-progress Wizard persistence;
- `requiredWhen`;
- `in` / `notIn` conditions unless a real flow proves they are needed;
- generalized Wizard catalog/launcher UI;
- translated/localized Wizard Definition content and first-pass Wizard UI copy cleanup;
- additional Wizard definitions.

---

## Explicitly deferred

Do not implement without a real requirement:

- universal Wizard DSL;
- arbitrary rule scripting/expression language;
- generalized repeat/nested/collection flow engine;
- Actions batch/transaction/dry-run;
- AI-assisted planning or AI-generated Wizard definitions;
- broad Expert UI migration/rewrite;
- universal capability/catalog adapter;
- Wizard-specific compiler/validator;
- direct arbitrary Draft/path mutation;
- one Vue page per Wizard while the shared route/registry model remains sufficient.

---

## Immediate next step

Pull the latest `feature/wizard`, rerun the focused automated gate after the Header launcher change, then manually exercise `/create → /wizard/portrait → Cancel/Finish → /create` and report UI/runtime issues.

Do not accept the UI phase until the browser-level isolation and success-only host commit behavior have been observed directly.

---

## Documentation discipline

- [`README.md`](./README.md) remains the core Wizard architectural source of truth.
- [`UI.md`](./UI.md) is the scoped source of truth for Wizard presentation, routing, static generation, and host-integration decisions.
- This file is the operational checkpoint for resuming work.
- `docs/actions-api/STATUS.md` remains the operational source for the accepted Actions surface.
- Update this file after meaningful implementation/test checkpoints.
