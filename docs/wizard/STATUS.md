# Wizard Development Status

Last updated: **2026-08-28**

Status: **Wizard foundation complete; Actions API Phase 10 accepted; Portrait mapping resumed**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

The canonical Setup/Output mutation gap discovered during Wizard source inspection is now closed and fully validated. Wizard development is unblocked and resumes at the exact Portrait module/action mapping stage.

### Wizard foundation already complete

Foundation implementation commit:

- `51699c6dd61688f17fdde15210eb4e21a6df211f` — `feat(wizard): add definition and session foundation`

Implemented foundation:

- minimal `WizardDefinition` contracts;
- first semantic Portrait v1 definition;
- `WizardSession` with separate `answers`, `derived`, and `workingDraft`;
- explicit answer provenance `default | user`;
- defaults cannot overwrite explicit user answers;
- Working Draft cloned from Active Draft;
- ordered navigation;
- minimal `equals` / `notEquals` visibility conditions;
- canonical single-Action execution through `invokePublicAction(...)`;
- failed Actions preserve the current Wizard session/Working Draft;
- no Active Draft persistence mutation inside `WizardSession`.

No Expert UI/Create-page rewrite has been performed.

---

## Actions API Phase 10 — accepted

Implementation commit:

- `1e3bd96a9119210805eebc3db7ae00008502a110` — `feat(actions): add prompt settings and output mutations`

New accepted canonical public Actions:

- `prompt.settings.update`;
- `prompt.outputFormat.set`.

The Setup module selector remains covered by existing `module.activate` / `module.deactivate` Actions.

The public surface is now **101 Actions** under the unchanged additive contract `prompt-draft.actions.v1`.

### Accepted validation gate — 2026-08-28

| Gate | Result |
|---|---:|
| Actions API | **176/176** |
| Wizard | **9/9** |
| Reference Catalog | **15/15** |
| Phase 8 UX | **5/5** |
| Phase 9 compiler | **9/9** |
| Production build | **successful** |

Phase 10 is no longer validation-pending. For operational details see `docs/actions-api/STATUS.md`.

---

## Accepted architecture decisions

These remain unchanged:

1. Wizard is a guided goal-oriented layer over canonical Draft/domain/Actions.
2. Wizard produces a normal editable `PromptDraftState`, not only a prompt string.
3. Wizard mutations use canonical public Actions; no parallel mutation implementation.
4. Expert UI and Wizard are separate presentation layers.
5. Reuse existing UI primitives/pickers only where they genuinely fit guided UX.
6. First concrete Wizard is Portrait.
7. Build abstractions from real Wizard requirements, not a speculative universal DSL.
8. Session state separates direct `answers`, deterministic `derived`, and `workingDraft`.
9. Defaults/recommendations never silently overwrite explicit user choices.
10. Portrait v1 uses only the minimum conditional flow required now.
11. Working Draft isolates cancel/failure from Active Draft.
12. Completion reuses `prompt.validate` and `prompt.compile`.
13. Active Draft replacement happens only after successful completion and stays host-owned.
14. Batch/transaction/dry-run remains deferred until a real orchestration need proves it necessary.
15. AI planning/generated Wizard flows remain deferred.
16. Wizard never directly mutates arbitrary Draft paths, including Setup/Output state.

---

## Portrait Wizard conceptual flow

Current first-pass flow:

1. Subject
2. Portrait intent/type
3. Appearance — Expression, Hair, Outfit
4. Composition — Framing/Camera, Pose where useful
5. Environment — conditional studio/outdoor/abstract follow-up
6. Lighting & mood
7. Review
8. Completion — derive → plan Actions → execute on Working Draft → validate → compile → host applies final Draft

The checked-in `portraitWizardV1Definition` remains an implementation-discovery definition, not a frozen public schema.

---

## Implementation component status

### Complete

- minimum `WizardDefinition` contracts;
- first Portrait semantic definition;
- minimum `WizardSession` runtime;
- provenance;
- Working Draft isolation;
- ordered navigation;
- `equals` / `notEquals` visibility;
- canonical single-Action bridge;
- Setup mutation capability in canonical Actions API;
- Output mutation capability in canonical Actions API;
- accepted regression/build gate for all above.

### In progress now

- exact Portrait module/preset/field inspection;
- exact Portrait specialized Action-input inspection;
- semantic answer → derived intent → public Action mapping design.

### Not implemented yet

- deterministic rule/derived-intent evaluator beyond explicit default setters;
- `requiredWhen`;
- `in` / `notIn` conditions unless Portrait actually needs them;
- Portrait Action Planner/Mapper;
- Review renderer/UI;
- completion state machine;
- completion `prompt.validate` gate;
- completion `prompt.compile` output;
- host adapter that replaces Active Draft after successful completion;
- full Wizard page/renderer.

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
- direct arbitrary Draft/path mutation.

---

## Immediate next step

Resume in this exact order:

1. inspect exact current source for Portrait-targeted modules and their presets/fields;
2. inspect the corresponding public Action schemas and specialized structured mutations;
3. map semantic Wizard answers to derived intent without leaking module/action IDs into the Wizard definition;
4. add only the smallest deterministic rule layer proven necessary by those mappings;
5. implement the first Portrait Action Planner/Mapper as `PublicActionInvocation[]`;
6. execute only through the canonical Actions bridge against Working Draft;
7. then add Review/completion orchestration using canonical `prompt.validate` and `prompt.compile`;
8. keep Active Draft replacement host-owned and success-only;
9. build UI only after mapper/completion semantics are stable.

Do not start nested/repeatable flow, AI, batch Actions, or a Wizard-specific mutation layer.

---

## Documentation discipline

- [`README.md`](./README.md) is the Wizard architectural source of truth.
- This file is the operational checkpoint for resuming work.
- `docs/actions-api/STATUS.md` is the operational source for the accepted Actions surface.
- Update status documents after meaningful implementation/test checkpoints.
