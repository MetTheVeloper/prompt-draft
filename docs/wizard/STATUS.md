# Wizard Development Status

Last updated: **2026-08-28**

Status: **Portrait mapper implemented; validation pending**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

The Actions API foundation required by Portrait is accepted, the exact Portrait-targeted module/action contracts have been inspected, and the first deterministic Portrait answer → derived intent → canonical Action mapper is now implemented.

Portrait mapper implementation commit:

- `4818fdf1e12f1338678589af3bf69894a3cf2dab` — `feat(wizard): add portrait action mapper`

This checkpoint is **implementation-complete but runtime-validation-pending**. The new mapper/tests have passed parser/transpile checks in the assistant environment; the real repository `pnpm` gate still needs to run in the user's checkout.

---

## Accepted validation baseline before mapper

Actions API Phase 10 remains accepted:

- `1e3bd96a9119210805eebc3db7ae00008502a110` — `feat(actions): add prompt settings and output mutations`

Accepted gate from 2026-08-28:

| Gate | Result |
|---|---:|
| Actions API | **176/176** |
| Wizard | **9/9** |
| Reference Catalog | **15/15** |
| Phase 8 UX | **5/5** |
| Phase 9 compiler | **9/9** |
| Production build | **successful** |

Public Actions surface remains **101 Actions** under `prompt-draft.actions.v1`.

---

## Portrait mapper implemented

New implementation:

- `app/wizard/portrait.ts`
- `scripts/wizard-portrait.test.ts`
- `package.json` now includes the Portrait test file in `test:wizard`

### Subject normalization

The Variable Picker returns a complete `PromptVariable`, while structured domains use stable `SemanticTargetRef` identities.

Portrait now normalizes selected user/system variables into canonical subject targets:

```text
PromptVariable
  ↓
{ kind, value/token, variableId, label }
  ↓
SemanticTargetRef
```

Module-owned variables are not silently reclassified as user subjects.

### Minimum proven rule layer

The first real deterministic rule from the architecture source of truth is implemented:

- `Cinematic` recommends/defaults Lighting to `Dramatic`;
- changing away from Cinematic replaces that stale default with the normal `Soft` default;
- an explicit user Lighting choice is never overwritten.

No generalized rule DSL was added.

### Derived mappings

Current deterministic mappings include:

- Framing:
  - `headshot` → `close_up`
  - `head_shoulders` → `head_and_shoulders`
  - `half_body` → `medium_subject`
  - `full_body` → `full_subject`
- Pose:
  - `natural` → `relaxed_standing`
  - `formal` → `neutral_standing`
  - `dynamic` → `action_ready`
- Background:
  - `studio` → `studio_background`
  - `outdoor` → `outdoor_environment`
  - `abstract` → `abstract_background`
- Lighting:
  - `soft` → `soft_diffused`
  - `dramatic` → `low_key`
  - `moody` → `moody_side`
  - `clean` → `clean_studio`

Environment follow-up text maps to Background `extraDetails` rather than module Custom Override.

### Conservative appearance mappings

Expression:

- `natural` → `neutral_calm` preset
- `warm` → `warm_smile` preset
- `serious` → minimal structured `coreExpression: serious`
- `confident` → authored assignment detail `confident expression`

The mapper intentionally avoids substituting a more specific expression preset when the Wizard intent is broader than that preset.

Hair:

- `natural` → `stylingState: natural`
- `polished` → `stylingState: controlled`
- `editorial` → custom `stylingState: editorial styling`
- `keep_reference` → canonical Hair source `{reference}`

This avoids using haircut presets that would invent a physical hairstyle the user did not request.

Outfit:

- `professional`, `fashion`, and `fantasy` create a real Outfit Set plus one broad custom wearable item, so the result actually compiles;
- `keep_reference` uses canonical image-to-image `preserveOutfit: true` and does not create a fake Outfit item.

The mapper does not rely on Outfit Set `additionalDetails` alone because an Outfit Set with zero items is intentionally omitted by the compiler.

### Prompt Setup consistency

Portrait updates Setup through `prompt.settings.update` only.

It sets:

- Portrait idea;
- selected Subject token;
- `subjectType: person`;
- `preserveComposition: false` because Wizard Framing is explicit;
- `preserveLighting: false` because Wizard Lighting is explicit;
- `preservePose: false` when Wizard Pose is explicit;
- `preserveOutfit` according to the Outfit choice when present.

The mapper does **not** force prompt mode, aspect ratio, reference usage, transformation strength, colors, materials, or unrelated Setup state.

### Action orchestration

All mutation remains canonical:

- no direct Draft/path patching;
- no Wizard-owned Hair/Outfit/Pose/Expression mutation implementation;
- all changes execute through `executeWizardAction(...)` → `invokePublicAction(...)`;
- generated stable IDs are read from successful Action results before dependent Actions run;
- Camera remains untouched because Portrait v1 currently asks no camera-specific question.

If a later Action in the Portrait sequence fails, intermediate Wizard Working Drafts are discarded and the mapper returns the pre-mapping Working Draft plus the derived state/issues. This provides Wizard-sequence isolation without adding an Actions batch/transaction API.

---

## New mapper tests

`wizard-portrait.test.ts` adds **8** focused tests for:

1. PromptVariable → stable `SemanticTargetRef` normalization;
2. default-rule replacement vs explicit user override;
3. semantic derived-state mapping;
4. complete Professional Portrait mapping through real public Actions;
5. Cinematic Outdoor mapping and keep-reference Outfit behavior;
6. keep-reference Hair using canonical `{reference}` source;
7. rollback to the pre-mapping Working Draft on a late Action failure;
8. rejecting a missing Subject before mutation planning.

If all existing Wizard tests remain unchanged, `pnpm test:wizard` is expected to report **17 tests** after this commit. This number is pending real checkout validation and must not be treated as accepted until the command runs successfully.

---

## Still not implemented

- `requiredWhen`;
- `in` / `notIn` conditions unless a real Portrait need appears;
- Review renderer/UI;
- completion state machine;
- canonical completion `prompt.validate` gate;
- canonical completion `prompt.compile` output;
- host adapter that replaces Active Draft after successful completion;
- full Wizard page/renderer;
- in-progress Wizard persistence.

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

1. Pull `feature/wizard` in a real project checkout.
2. Run `pnpm test:wizard` first.
3. If green, run the accepted Actions/reference/compiler regression gates and production build.
4. Fix any mapper/runtime issue before moving on.
5. Once this mapper checkpoint is accepted, implement Review/completion orchestration in this order:
   - resolve/rerun mapper;
   - `prompt.validate`;
   - on success `prompt.compile`;
   - expose successful completed Working Draft/result;
   - host-owned replacement of Active Draft only after success.
6. Build the Wizard renderer/page only after completion semantics are stable.

---

## Documentation discipline

- [`README.md`](./README.md) remains the Wizard architectural source of truth.
- This file is the operational checkpoint for resuming work.
- `docs/actions-api/STATUS.md` remains the operational source for the accepted Actions surface.
- Update status documents after meaningful implementation/test checkpoints.
