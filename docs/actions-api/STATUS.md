# Actions API Status

## Current checkpoint

Phase: **2 — Core write services**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Latest validated Actions API checkpoint: **131/131 passed** on 2026-08-27.

The latest separately confirmed production build remains the **119/119 Lighting / Effects** checkpoint. Hair validation supplied a green Actions API test run; no separate Hair build result has been recorded yet.

`main` remains untouched by Actions API development.

## Validation history

| Boundary | Result | Status |
|---|---:|---|
| Foundation | 18/18 | validated |
| Simple modules / presets | 27/27 | validated |
| ModuleEntity lifecycle | 35/35 | validated |
| ModuleEntity fields / presets | 41/41 | validated |
| Typography | 49/49 | validated |
| Scene | 57/57 | validated |
| Layout | 65/65 | validated |
| Semantic assignment scopes | 73/73 | validated |
| Color Palette | 81/81 | validated |
| Texture / Material | 89/89 | validated |
| Pose | 97/97 | validated |
| Expression | 105/105 | validated |
| Variables Expert UI migration | 107/107 | validated + build + manual UI |
| Lighting / Effects | 119/119 | validated + build |
| Hair | 131/131 | validated |
| Outfit | expected 147 | awaiting real-checkout validation |

Detailed public action status and domain invariants live in `docs/actions-api/ACTIONS.md`; this file tracks phase/checkpoint state and migration readiness.

## Completed foundations

- [x] Canonical `PromptDraftState` boundary and helpers.
- [x] Headless Action registry, input validation, structured issues/results, discovery.
- [x] Explicit `ActionEnvironment` for runtime facts.
- [x] Deterministic `ActionIdFactory` injection.
- [x] Atomic failure / caller-draft isolation.
- [x] Exact semantic reference catalogs; no fuzzy stable-reference rescue.
- [x] Shared exact subject-target resolver for Pose / Expression / Hair / Outfit.
- [x] Compiler behavior kept unchanged throughout Phase 2 unless an intentional fix is explicitly documented.

## Validated Phase 2 write domains

The following boundaries are implemented and validated in the real project checkout:

- Variables
- Modules / presets / Custom Mode
- Generic ModuleEntity lifecycle and simple fields
- Typography
- Scene
- Layout
- Semantic assignment scope foundation
- Color Palette
- Texture / Material
- Pose
- Expression
- Lighting / Effects
- Hair

### Variables Expert UI migration — COMPLETE + VALIDATED

`VariablesField.vue` is still the first deliberately migrated Expert UI boundary. Persisted create/update/duplicate/delete and Blueprint insertion route through `app/domain/variables.ts`; UI-only form/modal/translation concerns remain local to the component.

Accepted validation:

- `pnpm test:actions-api` => **107/107**
- `pnpm build` => successful
- manual UI regression => create, edit including Enabled, duplicate, delete, Blueprint insertion

`variable.create`, `variable.update`, `variable.duplicate`, and `variable.delete` are `migrated`; `variable.setEnabled` remains `implemented` because the UI still changes Enabled through the general update path.

### Lighting / Effects — IMPLEMENTED + VALIDATED

Services:

- `app/domain/lightingSources.ts`
- `app/domain/effectLayers.ts`

The first 119-test checkout exposed one Effects preset-equality bug: raw nested-object serialization was order-sensitive. The domain comparison was changed to recursive object-key-order-insensitive equality, matching current Expert UI behavior. No compiler/UI/action-schema change was required.

Final accepted checkpoint:

- `pnpm test:actions-api` => **119/119**
- `pnpm build` => successful

### Hair — IMPLEMENTED + VALIDATED

Services:

- `app/domain/hairStyles.ts`
- `app/actions/hairStyles.ts`

Public Hair actions:

- `hair.style.create`
- `hair.style.update`
- `hair.style.duplicate`
- `hair.style.delete`
- `hair.style.setSource`
- `hair.style.setProperty`
- `hair.style.applyPreset`
- `hair.component.create`
- `hair.component.update`
- `hair.component.setProperty`
- `hair.component.duplicate`
- `hair.component.delete`

Validated contract highlights:

- exact stable style/component IDs own mutation identity;
- keys remain canonical unique presentation/reference tokens only;
- legacy missing IDs normalize through current Hair compatibility behavior;
- style duplication remaps all nested component IDs and clears copied preset identity;
- exact subject-target resolver is reused; no second resolver exists;
- reference variables resolve through `ActionEnvironment.hairReferenceSources`, with domain-owned `{reference}` fallback;
- missing/unavailable new references reject; exact persisted orphans may be retained without fuzzy recovery;
- typed property states validate catalog capabilities;
- specialized property/source/preset/component actions prevent broad nested patching;
- compiler and Expert UI were unchanged for this checkpoint.

Accepted real-checkout validation on 2026-08-27:

- `pnpm test:actions-api` => **131 tests / 131 passed / 0 failed**
- Hair actions are promoted to `implemented` in `ACTIONS.md`.

## Current work

### Outfit — IMPLEMENTED, AWAITING USER VALIDATION

Services/actions now present on `refactor/actions-api`:

- `app/domain/outfitSets.ts`
- `app/actions/outfitSets.ts`
- `outfit.set.create`
- `outfit.set.update`
- `outfit.set.duplicate`
- `outfit.set.delete`
- `outfit.set.applyPreset`
- `outfit.item.create`
- `outfit.item.update`
- `outfit.item.setSource`
- `outfit.item.setProperty`
- `outfit.item.duplicate`
- `outfit.item.delete`
- `outfit.relation.create`
- `outfit.relation.update`
- `outfit.relation.delete`

Contract decisions:

- canonical set identity is exact `set.id`;
- item identity is exact owning `set.id + item.id`;
- relation identity is exact owning `set.id + relation.id`;
- editable set/item keys stay unique canonical presentation/reference tokens and never replace stable identity;
- legacy missing IDs normalize through current Outfit compatibility IDs before exact mutation;
- Set duplication allocates fresh set/item/relation IDs, then remaps relation endpoints only through an exact old-item-ID → new-item-ID map;
- a relation endpoint already orphaned before duplication remains orphaned instead of being repaired from key/name/type metadata;
- Item duplication creates a new item but deliberately does not clone relation edges;
- Item deletion removes only relations whose exact source/target endpoint equals the deleted item ID;
- relation creation requires exact current item endpoints;
- relation update validates endpoints only when that endpoint changes, so an unchanged persisted orphan may survive unrelated relation edits and can later be explicitly repaired or deleted;
- relation deletion works by exact stable relation ID even when its endpoints are orphaned;
- set target edits reuse the exact subject-target resolver already validated by Pose / Expression / Hair;
- Outfit item references are supplied headlessly via `ActionEnvironment.outfitReferenceSources`; `{reference}` remains a domain-owned builtin fallback;
- new missing/unavailable references reject; exact persisted orphan references can be retained without token/name fuzzy rescue;
- item property mutation validates the exact current type/profile, option-set membership, select vs multi-select shape, and custom/reference/absent capabilities;
- item/source/property/relation structural mutations detach the active Outfit preset;
- set metadata/target edits preserve the preset, while authored set details detach it, matching current Expert UI ownership;
- preset application rebuilds recipe-owned `items + relations` with fresh IDs while preserving set targets and authored set details; clearing only removes `presetId`;
- no broad arbitrary nested object/path patch was introduced;
- compiler and Expert UI remain unchanged in this checkpoint.

Regression coverage:

- `scripts/actions-outfit.test.ts`
- **16 new tests** cover Set lifecycle, exact targets, presets, item type/starter/custom creation, exact reference source behavior, profile/option-set property validation, Set duplication endpoint remapping, Item deletion relation cleanup, unchanged orphan preservation, explicit relation repair, legacy compatibility IDs, identity conflicts, registry discovery and atomic failure.
- `pnpm test:actions-api` now includes the Outfit suite.
- expected total: **147 tests**.

Validation status:

- Outfit public actions remain `planned` in `ACTIONS.md` until the real checkout suite passes.
- No Expert UI or compiler migration is included in this checkpoint.

## Next

1. Pull the current `refactor/actions-api` checkpoint.
2. Run `pnpm test:actions-api`; expected result is **147/147**.
3. Run `pnpm build` for TypeScript/Nuxt integration validation.
4. If green, promote all Outfit actions from `planned` to `implemented` and record the 147-test/build checkpoint.
5. Re-evaluate the next low-risk boundary only after Outfit validation; do not perform a broad Expert UI migration automatically.

## Known deferred decisions

- `module.reset` contract — defer until Clear semantics are canonicalized.
- Batch/transaction API — defer until real multi-step Wizard flows justify it.
- Dry-run semantics — defer with batch design.
- Third-party schema validator — avoid until action input complexity justifies dependency cost.
- Headless semantic source builder from canonical draft/compiler outputs — defer until specialized consumers establish exact runtime needs.
- `prompt.validate` / `prompt.compile` read operations — design after write-domain stabilization and Outfit validation.
- AI-facing tool schema/export format — design after internal registry contract stabilizes.
- Wizard UI — out of scope until core actions and relational/assignment paths are stable.

## Regression guardrails

Every implementation phase must preserve:

- stable identity semantics;
- missing/unavailable reference behavior;
- current draft import/export compatibility;
- prompt compiler behavior unless an intentional fix is documented;
- current Expert UI behavior until that UI path is deliberately migrated;
- one canonical implementation for every domain mutation.

## Main branch rule

Do not update or move `main` as part of Actions API development without explicit approval. Development checkpoints remain on `refactor/actions-api` until a merge/readiness decision is made.
