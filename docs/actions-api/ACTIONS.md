# Actions API Registry

This file is the canonical inventory of public Actions API operations.

Status values:

- `planned` — accepted scope, not yet validated as a public action;
- `foundation` — runtime/support primitive, not normally called by product consumers;
- `implemented` — action exists with isolated tests and has passed the Actions API suite;
- `migrated` — action exists and the current Expert UI uses the same canonical service.

Once an action is marked `implemented`, its ID is a compatibility surface. Renaming/removing it requires an explicit compatibility decision.

## Foundation

| Action / primitive | Status | Notes |
|---|---|---|
| Action registry discovery | foundation | `get`, `has`, `list` |
| Single action execution | foundation | atomic success/failure result |
| Input schema validation | foundation | small repository-owned schema |
| Deterministic test ID injection | foundation | domain-specific factory injection |
| Explicit runtime environment | foundation | ambient facts passed through `ActionContext.environment` |
| Semantic assignment scope service | foundation | internal exact-ref normalization/recovery/exclusivity primitive; not public cross-domain mutation |
| Capability-scoped semantic sources | foundation | `ActionEnvironment.semanticTargetSources` supplies dynamic `color` / `material` refs without Vue coupling |
| Subject assignment target resolver | foundation | internal exact-ref resolver shared by Pose/Expression/Hair/Outfit; preserves exact persisted orphan refs without fuzzy recovery |
| Batch execution | planned | deferred until Wizard use-cases justify it |
| Dry run | planned | deferred with batch design |

## Draft / modules

| Action ID | Status | Intent |
|---|---|---|
| `module.activate` | implemented | Activate registered module; preserve inactive state or initialize missing defaults/panel state. |
| `module.deactivate` | implemented | Deactivate non-destructively. |
| `module.field.set` | implemented | Set a simple schema-backed field; structured fields reject. |
| `module.preset.apply` | implemented | Overlay a registered preset using canonical field/custom-sidecar semantics. |
| `module.customMode.set` | implemented | Toggle module-level Custom Override where supported. |
| `module.reset` | planned | Deferred until generic/specialized Clear semantics are canonicalized. |

## Variables

| Action ID | Status | Intent |
|---|---|---|
| `variable.create` | migrated | Create user variable with canonical unique key and stable ID. |
| `variable.update` | migrated | Update variable while preserving stable ID. |
| `variable.duplicate` | migrated | Duplicate with new ID/key and adjacent placement. |
| `variable.delete` | migrated | Remove exact stable variable; references are not retargeted. |
| `variable.setEnabled` | implemented | Toggle one exact variable. |

Variables became the first validated Expert UI migration on 2026-08-27. `VariablesField.vue` routes persisted create/update/duplicate/delete and Blueprint insertion through `app/domain/variables.ts`; the real checkout passed **107/107**, production build completed, and manual Expert UI regression covered create, edit including Enabled, duplicate, delete and Blueprint insertion. `variable.setEnabled` stays `implemented` because the current UI changes Enabled through the general `updatePromptVariable` form path rather than the dedicated `setPromptVariableEnabled` mutation.

## Generic named module entities

| Action ID | Status | Intent |
|---|---|---|
| `moduleEntity.create` | implemented | Create empty-payload named configuration with new stable ID and unique key. |
| `moduleEntity.update` | implemented | Update editable metadata while preserving stable ID. |
| `moduleEntity.duplicate` | implemented | Duplicate adjacent with deep-copied payload and new stable identity. |
| `moduleEntity.delete` | implemented | Remove exact entity; external refs remain missing rather than retargeting. |
| `moduleEntity.setEnabled` | implemented | Toggle availability without changing identity. |
| `moduleEntity.setInheritance` | implemented | Toggle global inheritance where capability permits. |
| `moduleEntity.field.set` | implemented | Set one simple local payload override. |
| `moduleEntity.field.clear` | implemented | Remove one local override + sidecar to resume inherited/unset semantics. |
| `moduleEntity.preset.apply` | implemented | Overlay eligible non-override fields into one entity payload. |

Generic lifecycle/field actions do not accept arbitrary structured payload patches.

## Typography

| Action ID | Status | Intent |
|---|---|---|
| `typography.group.create` | implemented | Create stable text group and structural token. |
| `typography.group.update` | implemented | Update metadata/position while preserving identity/token. |
| `typography.group.delete` | implemented | Delete exact group and contained blocks. |
| `typography.group.move` | implemented | Reorder exact group by explicit index. |
| `typography.text.create` | implemented | Add non-empty stable text block with structural layer token. |
| `typography.text.update` | implemented | Update block content/style while preserving identity/token. |
| `typography.text.delete` | implemented | Remove exact block from exact group. |
| `typography.text.move` | implemented | Reorder exact block inside its group. |

## Scene

| Action ID | Status | Intent |
|---|---|---|
| `scene.create` | implemented | Create Scene with stable ID and unique semantic key. |
| `scene.update` | implemented | Update Scene metadata while preserving stable ID/component refs. |
| `scene.duplicate` | implemented | Duplicate adjacent with new stable ID/key and copied explicit refs. |
| `scene.delete` | implemented | Delete Scene while leaving Layout refs missing until explicit repair/removal. |
| `scene.setEnabled` | implemented | Toggle Scene availability. |
| `scene.component.attach` | implemented | Attach exact available module entity respecting cardinality. |
| `scene.component.detach` | implemented | Remove exact module-entity ref, including missing/orphan refs. |
| `scene.component.replace` | implemented | Explicitly replace exact ref with another available entity from same module. |

## Layout

| Action ID | Status | Intent |
|---|---|---|
| `layout.region.create` | implemented | Create normalized Region with new stable ID. |
| `layout.region.update` | implemented | Update exact Region metadata/geometry; direct `contentRef` patch forbidden. |
| `layout.region.duplicate` | implemented | Duplicate with new stable ID, offset geometry, preserved binding semantics. |
| `layout.region.delete` | implemented | Delete exact Region without rewriting external refs. |
| `layout.region.move` | implemented | Reorder exact Region without silently changing authored layer. |
| `layout.grid.update` | implemented | Update normalized grid dimensions. |
| `layout.region.assignScene` | implemented | Bind exact active Scene and sync cached metadata/contentKey. |
| `layout.region.clearScene` | implemented | Clear Scene binding while preserving unrelated manual content. |

## Color / Material scopes

Shared scope ownership is an internal foundation service, not a public `assignment.*` mutation namespace. Public consumers call specialized domain actions so scope rules cannot bypass payload semantics.

Internal scope invariants:

- exact identity via `semanticTargetIdentity`;
- dynamic refs through shared reference catalog, never fuzzy token/name lookup;
- new missing/unavailable refs reject;
- exact persisted missing/unavailable refs may survive unrelated edits and remain removable;
- target/exception conflicts resolve directionally;
- exclusive builtins (`overall`, `all_surfaces`) collapse target scope and cannot be exceptions;
- dynamic sources supplied through `ActionEnvironment.semanticTargetSources` by capability.

### Color Palette

| Action ID | Status | Intent |
|---|---|---|
| `colorPalette.assignment.create` | implemented | Create stable color assignment with canonical `overall` scope. |
| `colorPalette.assignment.delete` | implemented | Delete one exact color assignment by stable ID. |
| `colorPalette.assignment.scope.set` | implemented | Set targets/exceptions through shared semantic scope rules. |
| `colorPalette.assignment.applyPreset` | implemented | Apply/clear palette preset while preserving semantic scope. |
| `colorPalette.swatch.add` | implemented | Add literal swatch and detach active preset. |
| `colorPalette.swatch.setLiteral` | implemented | Set exact swatch to authored literal value and detach preset. |
| `colorPalette.swatch.setVariable` | implemented | Bind exact swatch to exact enabled user Color variable. |
| `colorPalette.swatch.delete` | implemented | Delete exact swatch and detach preset. |

Color invariants:

- no broad arbitrary `colorPalette.assignment.update` public patch;
- assignment/swatch mutations use stable IDs;
- preset replaces colors only and preserves scope;
- variable source is exact enabled user `type="color"` variable;
- legacy assignment shapes normalize before stable-ID mutation.

### Texture Material assignments

| Action ID | Status | Intent |
|---|---|---|
| `texture.assignment.create` | implemented | Create stable material assignment with canonical `all_surfaces` scope. |
| `texture.assignment.delete` | implemented | Delete one exact material assignment by stable ID. |
| `texture.assignment.scope.set` | implemented | Set targets/exceptions through shared material-capability scope rules. |
| `texture.assignment.applyPreset` | implemented | Apply/clear material preset while preserving semantic scope. |
| `texture.assignment.property.set` | implemented | Set one material property axis and detach active preset. |
| `texture.assignment.conditions.set` | implemented | Set authored condition list and detach preset. |

Texture invariants:

- no broad arbitrary `texture.assignment.update` public patch;
- assignment mutations use exact stable IDs;
- preset replaces material/finish/surface/optical/prominence/conditions payload while preserving scope;
- property and conditions mutations detach preset;
- freeform authored strings are preserved;
- compatibility metadata is warning-only, not mutation-blocking;
- legacy material assignment shapes normalize before exact mutation.

Validation checkpoint before Pose: `pnpm test:actions-api` passed **89/89** on 2026-08-27 with Foundation + Variables + Modules + ModuleEntity + Typography + Scene + Layout + semantic scopes + Color Palette + Texture Material suites.

The generic public actions `assignment.targets.set` and `assignment.exceptions.set` are deliberately **not** part of the API.

## Pose / Expression

Pose and Expression share only the headless exact subject-target resolver. Each domain owns its own assignment lifecycle, payload, preset semantics, action namespace and validation.

### Pose

| Action ID | Status | Intent |
|---|---|---|
| `pose.assignment.create` | implemented | Create pose assignment with a stable ID and first explicit available subject target when supplied. |
| `pose.assignment.update` | implemented | Update only known Pose payload/targets; payload edits detach preset while target-only edits preserve it. |
| `pose.assignment.delete` | implemented | Delete one exact pose assignment by stable ID. |
| `pose.assignment.applyPreset` | implemented | Apply/clear pose preset while preserving exact targets and authored additional details. |

Pose validation checkpoint: `pnpm test:actions-api` passed **97/97** on 2026-08-27 in the real user checkout.

Pose invariants:

- Pose has a target list, not Color/Texture builtin target+exception scope;
- available subject refs are supplied headlessly through `ActionEnvironment.subjectAssignmentTargets`;
- target identity resolves exactly through the shared semantic reference catalog;
- new missing/unavailable refs reject;
- an exact persisted missing/unavailable ref may be retained or explicitly removed;
- `user_variable` and `system_variable` identities remain distinct even with the same `variableId`;
- no token/name fuzzy retargeting;
- no arbitrary structured Pose patch surface;
- preset-owned payload replacement preserves targets and authored `additionalDetails`.

### Expression

| Action ID | Status | Intent |
|---|---|---|
| `expression.assignment.create` | implemented | Create expression assignment with stable ID and first explicit available subject target when supplied. |
| `expression.assignment.update` | implemented | Update only known Expression payload/targets; payload edits detach preset while target-only changes preserve it. |
| `expression.assignment.delete` | implemented | Delete one exact expression assignment by stable ID. |
| `expression.assignment.applyPreset` | implemented | Apply/clear expression preset while preserving exact targets and authored additional details. |

Expression invariants:

- reuses the same exact subject-target resolver validated by Pose; no second resolver exists;
- known payload axes are `coreExpression`, `intensity`, `eyeState`, `browState`, `mouthState`, and `additionalDetails`;
- authored strings are preserved instead of being silently coerced to catalog values;
- payload edits detach `presetId`; target-only changes preserve it;
- preset application replaces only preset-owned expression axes while preserving targets and `additionalDetails`;
- legacy assignments without IDs normalize to deterministic `expression-assignment-{index}` compatibility identity before exact mutation;
- no arbitrary structured Expression patch surface;
- compiler and Expert UI remain unchanged.

Expression validation checkpoint: `pnpm test:actions-api` passed **105/105** on 2026-08-27 in the real user checkout.

## Lighting / Effects

| Action ID | Status | Intent |
|---|---|---|
| `lighting.source.create` | implemented | Create source respecting max-source constraints. |
| `lighting.source.update` | implemented | Update exact source including catalog validation and custom-color transition rules. |
| `lighting.source.delete` | implemented | Delete exact source by stable ID. |
| `effects.layer.create` | implemented | Create layer respecting max-layer constraints. |
| `effects.layer.update` | implemented | Update exact layer including catalog validation and custom-effect transition rules. |
| `effects.layer.delete` | implemented | Delete exact layer by stable ID. |

Validated invariants:

- source/layer identity is exact stable ID; role/type/name never retarget a mutation;
- legacy missing IDs receive deterministic compatibility IDs matching current Expert UI fallback identity (`light-{index}` / `effect-{index}`);
- create respects `maxSources` / `maxLayers` from the module field schema;
- known dropdown/multi-select values are validated against the module's configured option catalogs;
- Lighting transition to a non-custom color clears `customColor`; entering custom color normalizes missing/invalid hex to `#ffffff` like the current UI;
- Effects transition to a non-custom type clears `customEffect`; custom authored effect/details remain strings;
- structured mutation clears the module-level active preset only when resulting module values no longer match that preset;
- Effects preset equality is canonical/object-key-order-insensitive, matching current Expert UI signature semantics;
- no generic structured patch surface was introduced;
- compiler and Expert UI remain unchanged.

Validation history: the first real checkout ran **119/118/1** and exposed an order-sensitive Effects preset-comparison bug; the domain equality was corrected without changing UI/compiler/action schemas, then the corrected checkout passed **119/119** and the production build succeeded on 2026-08-27.

## Hair

| Action ID | Status | Intent |
|---|---|---|
| `hair.style.create` | implemented | Create style with stable ID/key and first explicit subject target. |
| `hair.style.update` | implemented | Update exact style metadata/targets/details without broad structured patching. |
| `hair.style.duplicate` | implemented | Duplicate style and remap nested component IDs. |
| `hair.style.delete` | implemented | Delete exact style. |
| `hair.style.setSource` | implemented | Set defined/reference source using exact reference identity rules. |
| `hair.style.setProperty` | implemented | Update one typed base property state. |
| `hair.style.applyPreset` | implemented | Apply/clear a Hair recipe while preserving source/targets and allocating fresh component IDs. |
| `hair.component.create` | implemented | Create component from exact type/starter/custom choice. |
| `hair.component.update` | implemented | Update exact component metadata/type; type transition resets properties. |
| `hair.component.setProperty` | implemented | Update one property declared by the exact component type. |
| `hair.component.duplicate` | implemented | Duplicate exact component with new stable ID/key. |
| `hair.component.delete` | implemented | Delete exact nested component. |

Validated invariants:

- style identity is exact stable `style.id`; component identity is exact `style.id + component.id` ownership;
- editable keys remain canonical/unique presentation tokens and never replace stable identity;
- legacy missing IDs normalize through the same deterministic compatibility IDs already used by Hair normalization;
- style duplication remaps every nested component ID and clears the copied preset ID;
- subject targets reuse the canonical exact subject-target resolver already validated by Pose/Expression;
- Hair reference variables are explicit runtime facts via `ActionEnvironment.hairReferenceSources`; `{reference}` remains the builtin fallback;
- new missing/unavailable variable-backed Hair references reject; an exact persisted orphan can be retained without fuzzy token/name recovery;
- base/component property states validate catalog option/custom/reference/absent capabilities;
- base property and component mutations detach the style preset, while metadata/targets/source edits preserve it like the current UI;
- preset recipes replace recipe-owned properties/components, preserve targets/source, and allocate new component IDs;
- public actions stay granular; source, properties, presets and nested component structure are not writable through a broad style patch;
- compiler and Expert UI remained unchanged in the validated checkpoint.

Hair validation checkpoint: `pnpm test:actions-api` passed **131/131** on 2026-08-27 in the real user checkout. Hair public actions are promoted to `implemented`.

## Outfit

| Action ID | Status | Intent |
|---|---|---|
| `outfit.set.create` | implemented | Create Outfit Set with stable ID/key and first explicit subject target. |
| `outfit.set.update` | implemented | Update exact set metadata/targets/details without broad nested patching. |
| `outfit.set.duplicate` | implemented | Duplicate set with fresh set/item/relation IDs and remap known relation endpoints. |
| `outfit.set.delete` | implemented | Delete one exact Outfit Set. |
| `outfit.set.applyPreset` | implemented | Apply/clear a recipe while preserving set targets/details and rebuilding preset-owned items/relations. |
| `outfit.item.create` | implemented | Create one wearable from exact type/starter/custom choice. |
| `outfit.item.update` | implemented | Update exact item metadata/type with canonical unique-key and type-transition rules. |
| `outfit.item.setSource` | implemented | Set defined/reference source through exact reference identity rules. |
| `outfit.item.setProperty` | implemented | Update one property declared by the exact item type/profile. |
| `outfit.item.duplicate` | implemented | Duplicate exact item with new stable ID/key without cloning relation edges. |
| `outfit.item.delete` | implemented | Delete exact item and remove only connected relations. |
| `outfit.relation.create` | implemented | Create relation between exact current item IDs. |
| `outfit.relation.update` | implemented | Update exact relation while validating changed endpoints. |
| `outfit.relation.delete` | implemented | Delete exact relation, including an orphan relation. |

Validated invariants:

- set identity is exact stable `set.id`; item and relation identity are scoped by exact owning `set.id` plus their own stable IDs;
- editable set/item keys remain canonical unique presentation/reference tokens and never replace stable identity;
- legacy missing IDs normalize through the existing deterministic Outfit compatibility IDs (`outfit-set-{index}`, `outfit-item-{index}`, `outfit-relation-{index}`) before exact mutation;
- set duplication creates fresh nested item/relation IDs and remaps relation endpoints only through the exact old-item-ID → new-item-ID map;
- a duplicated relation endpoint that was already orphaned remains orphaned rather than being repaired by key/name/type lookup;
- item deletion removes only relations whose exact endpoint equals the deleted item ID; unrelated/orphan relations otherwise remain untouched;
- relation create requires exact current item endpoints; relation update validates only changed endpoints so an unchanged persisted orphan may survive and can be explicitly repaired/deleted;
- subject targets reuse the same exact subject-target resolver validated by Pose/Expression/Hair;
- Outfit item reference variables are explicit runtime facts via `ActionEnvironment.outfitReferenceSources`; `{reference}` remains the builtin fallback and no token/name fuzzy rescue is performed;
- item property mutation validates the current item type/profile, option-set membership, single vs multi-select shape, and custom/reference/absent capabilities;
- item/source/property/relation mutations detach the active set preset; set metadata/target edits preserve it while authored set details detach it, matching current Expert UI ownership;
- preset application rebuilds preset-owned `items + relations` with fresh stable IDs while preserving set targets and authored set details; clearing a preset only removes `presetId`;
- public actions stay granular: source/property/preset/relation structure cannot be changed through a broad arbitrary object/path patch;
- compiler and Expert UI remained unchanged.

Outfit validation history on 2026-08-27:

- first real-checkout run: **147 tests / 146 passed / 1 failed**; every Outfit domain/graph test passed and the sole failure was a discovery assertion that assumed alphabetical registry order;
- an intermediate test-only patch accidentally rewrote too much of `scripts/actions-outfit.test.ts`, producing two false relation failures; that rewrite was fully reverted to the original 718-line regression suite;
- the only retained test change was the same order-insensitive `.sort()` discovery pattern already used by Hair; no Outfit domain/action/compiler/UI behavior was changed by the test fix;
- final real-checkout run: `pnpm test:actions-api` => **147 tests / 147 passed / 0 failed**.

All fourteen Outfit actions are promoted to `implemented`.

## Prompt read operations

| Action ID | Status | Intent |
|---|---|---|
| `prompt.validate` | planned | Headless validation from canonical draft context; implementation is present and awaiting the 153-test real-checkout checkpoint. |
| `prompt.compile` | planned | Headless compile from canonical draft context/output format; deferred until the current compiler's Vue/composable side effects are extracted into a pure adapter rather than duplicated. |

`prompt.validate` now uses `app/domain/promptRead.ts` to rebuild active module outputs headlessly from canonical draft state before calling the existing prompt validation rules. The read model mirrors current custom-mode, Scene, Scene-resource, Form, Camera, entity-reference and module-output ownership without importing Vue components/composables. Validation issues are returned as read data; a draft that contains validation errors does not make Action execution itself fail. Six regression tests are included in `scripts/actions-prompt-read.test.ts`, bringing the expected Actions API total to **153 tests**. The action remains `planned` until that suite passes in the real checkout.

## Registration rule

An action may be marked `implemented` only when:

1. its canonical domain operation is implemented outside Vue components;
2. expected rejection or read-result semantics are structured rather than relying on UI behavior;
3. isolated tests cover success and important invariant failures/read cases;
4. its ID/input/result shape is documented here;
5. it does not introduce a second implementation of existing domain/compiler behavior;
6. the corresponding Actions API suite passes in the real project checkout.

An action may be marked `migrated` only after the existing Expert UI path uses the same canonical domain service and regression behavior is checked.
