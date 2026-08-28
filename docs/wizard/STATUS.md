# Wizard Development Status

Last updated: **2026-08-28**

Status: **Portrait mapper + Review + Completion accepted; Wizard UI + host integration next**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Wizard UI architecture source of truth: [`UI.md`](./UI.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

The deterministic Portrait backend flow is now accepted through the real project checkout:

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

Accepted Wizard validation on 2026-08-28:

```text
pnpm test:wizard
23/23 passed
```

The next active phase is the first real Wizard presentation/host integration. No new Actions API capability is currently required.

The accepted presentation/routing baseline for that phase is documented in [`UI.md`](./UI.md): shared Wizard shell/renderers, independent guided UX over shared design primitives, `/wizard/[wizardId]` + registry initialization, static prerendering for supported Wizard URLs, and success-only handoff of `finalDraft` to the existing host.

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

- `app/wizard/portraitReview.ts`

`buildPortraitWizardReview(...)` produces a renderer-neutral semantic review model containing:

- step identity;
- user-facing label;
- user-facing resolved value;
- answer source (`default | user`, or derived fallback);
- answer identity for later edit/navigation wiring.

The Review intentionally does **not** expose Action IDs, module keys, field IDs, preset IDs, or other implementation vocabulary.

Rules are resolved before Review, so recommendations/defaults shown to the user match the state that mapping consumes. Explicit user overrides remain visible and sticky.

---

## Accepted Completion orchestration

Implemented in:

- `app/wizard/completion.ts`
- `app/wizard/portraitCompletion.ts`

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
- host/Create-page application of `finalDraft` remains a separate success-only responsibility;
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
- Phase 9 compiler: **9/9** accepted baseline;
- production build successful at the previous accepted full gate.

---

## Next active phase — Wizard UI + host integration

Implement the first real presentation/host boundary while preserving all accepted backend invariants and following [`UI.md`](./UI.md):

1. inspect the current Create-page persistence/session ownership and reusable UI primitives;
2. add the shared `/wizard/[wizardId]` route + minimum Wizard Registry required by Portrait;
3. ensure supported Wizard URLs are included in static generation/prerendering;
4. build a small reusable Wizard shell/renderer for the current definition types only;
5. render `singleChoice`, `text`, and `variablePicker` questions;
6. use existing Variable Picker behavior for Subject selection;
7. wire Back/Next to the existing `WizardSession` navigation;
8. render the structured Portrait Review model;
9. invoke `completePortraitWizard(...)` on Finish;
10. only after successful completion, hand `finalDraft` to the Create-page host for Active Draft replacement/persistence;
11. keep Cancel destructive to nothing outside the Wizard Session;
12. expose validation/completion issues in Wizard-facing context rather than raw domain jargon where practical.

The UI phase should reuse existing design-system primitives, but it should not embed or recreate the full Expert UI panels.

---

## Still not implemented

- Wizard registry + shared dynamic route;
- static Wizard route prerender registration;
- Wizard shell/question renderer;
- Review UI;
- Create-page host adapter for success-only `finalDraft` application;
- user-facing completion/validation state UI;
- in-progress Wizard persistence;
- `requiredWhen`;
- `in` / `notIn` conditions unless a real flow proves they are needed.

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

Inspect the current Create-page host/persistence boundary, Nuxt prerender configuration, and existing reusable UI primitives before writing Wizard UI. Then implement the smallest end-to-end `/wizard/portrait` flow through the shared route/registry/shell defined in [`UI.md`](./UI.md).

After the first UI/host checkpoint is stable, run the full regression/build gate again.

---

## Documentation discipline

- [`README.md`](./README.md) remains the core Wizard architectural source of truth.
- [`UI.md`](./UI.md) is the scoped source of truth for Wizard presentation, routing, static generation, and host-integration decisions.
- This file is the operational checkpoint for resuming work.
- `docs/actions-api/STATUS.md` remains the operational source for the accepted Actions surface.
- Update status documents after meaningful implementation/test checkpoints.
