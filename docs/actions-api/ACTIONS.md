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
| Subject assignment target resolver | foundation | internal exact-ref resolver shared by Pose/Expression; preserves exact persisted orphan refs without fuzzy recovery |
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
| `variable.create` | implemented | Create user variable with canonical unique key and stable ID. |
| `variable.update` | implemented | Update variable while preserving stable ID. |
| `variable.duplicate` | implemented | Duplicate with new ID/key and adjacent placement. |
| `variable.delete` | implemented | Remove exact stable variable; references are not retargeted. |
| `variable.setEnabled` | implemented | Toggle one exact variable. |

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
- legacy assignment shapes normalize before exact mutation.

### Texture Material assignments

| Action ID | Status | Intent |
|---|---|---|
| `texture.assignment.create` | implemented | Create stable material assignment with canonical `all_surfaces` scope. |
| `texture.assignment.delete` | implemented | Delete one exact material assignment by stable ID. |
| `texture.assignment.scope.set` | implemented | Set targets/exceptions through shared material-capability scope rules. |
| `texture.assignment.applyPreset` | implemented | Apply/clear material preset while preserving semantic scope. |
| `texture.assignment.property.set` | implemented | Set one material property axis and detach active preset. |
| `texture.assignment.conditions.set` | implemented | Set authored condition list and detach active preset. |

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

Expression implementation and isolated tests are present on `refactor/actions-api`, but public status remains `planned` until the real checkout suite passes.

| Action ID | Status | Intent |
|---|---|---|
| `expression.assignment.create` | planned | Create expression assignment with stable ID and first explicit available subject target when supplied. |
| `expression.assignment.update` | planned | Update only known Expression payload/targets; payload edits detach preset while target-only edits preserve it. |
| `expression.assignment.delete` | planned | Delete one exact expression assignment by stable ID. |
| `expression.assignment.applyPreset` | planned | Apply/clear expression preset while preserving exact targets and authored additional details. |

Expression pending-validation invariants:

- reuses the same exact subject-target resolver validated by Pose; no second resolver exists;
- known payload axes are `coreExpression`, `intensity`, `eyeState`, `browState`, `mouthState`, and `additionalDetails`;
- authored strings are preserved instead of being silently coerced to catalog values;
- payload edits detach `presetId`; target-only changes preserve it;
- preset application replaces only preset-owned expression axes while preserving targets and `additionalDetails`;
- legacy assignments without IDs normalize to deterministic `expression-assignment-{index}` compatibility identity before exact mutation;
- no arbitrary structured Expression patch surface;
- compiler and Expert UI remain unchanged.

Pending suite: `scripts/actions-expression-assignments.test.ts`; when included, `pnpm test:actions-api` should execute **105 tests**.

## Lighting / Effects

| Action ID | Status | Intent |
|---|---|---|
| `lighting.source.create` | planned | Create source respecting max-source constraints. |
| `lighting.source.update` | planned | Update source including custom-color transition rules. |
| `lighting.source.delete` | planned | Delete source. |
| `effects.layer.create` | planned | Create layer respecting max-layer constraints. |
| `effects.layer.update` | planned | Update layer including custom-effect transition rules. |
| `effects.layer.delete` | planned | Delete layer. |

## Hair

| Action ID | Status | Intent |
|---|---|---|
| `hair.style.create` | planned | Create style with stable ID/key. |
| `hair.style.update` | planned | Update style metadata/targets/details. |
| `hair.style.duplicate` | planned | Duplicate style and nested components with new IDs. |
| `hair.style.delete` | planned | Delete style. |
| `hair.style.setSource` | planned | Set defined/reference source using canonical reference rules. |
| `hair.style.setProperty` | planned | Update typed property state. |
| `hair.component.create` | planned | Create component from type/starter/custom choice. |
| `hair.component.update` | planned | Update component. |
| `hair.component.duplicate` | planned | Duplicate component with new stable ID/key. |
| `hair.component.delete` | planned | Delete component. |

## Outfit

| Action ID | Status | Intent |
|---|---|---|
| `outfit.set.create` | planned | Create outfit set with stable ID/key. |
| `outfit.set.update` | planned | Update set metadata/targets/details. |
| `outfit.set.duplicate` | planned | Duplicate set and remap nested IDs/relation endpoints. |
| `outfit.set.delete` | planned | Delete set. |
| `outfit.item.create` | planned | Create wearable item. |
| `outfit.item.update` | planned | Update item with unique key rules. |
| `outfit.item.duplicate` | planned | Duplicate item with new stable ID/key. |
| `outfit.item.delete` | planned | Delete item and connected relations. |
| `outfit.relation.create` | planned | Create relation between valid item IDs. |
| `outfit.relation.update` | planned | Update relation while validating endpoints. |
| `outfit.relation.delete` | planned | Delete relation. |

## Prompt read operations

| Action ID | Status | Intent |
|---|---|---|
| `prompt.validate` | planned | Headless validation from canonical draft context. |
| `prompt.compile` | planned | Headless compile from canonical draft context/output format. |

## Registration rule

An action may be marked `implemented` only when:

1. its domain mutation is implemented outside Vue components;
2. expected rejection returns structured issues rather than relying on UI behavior;
3. isolated tests cover success and important invariant failures;
4. its ID/input/result shape is documented here;
5. it does not introduce a second implementation of an existing mutation;
6. the corresponding Actions API suite passes in the real project checkout.

An action may be marked `migrated` only after the existing Expert UI path uses the same canonical domain service and regression behavior is checked.
