# Stage 11 — Texture / Material Semantics

Status: **Semantically closed**

## Original product intent

The old Texture module attempted to define one texture for the output image, but the global model was not practically useful.

Stage 11 reframed the module around a more concrete task:

> Define what selected scene entities are made of and how their surfaces behave.

The module now uses the same relational assignment pattern proven by Color Palette while keeping material/surface semantics independent from color, lighting and style.

During validation, Color Palette and Texture / Material also revealed that relational assignment itself is a reusable product capability. The shared part was extracted instead of allowing the two modules to grow parallel target/reference implementations.

## Responsibility

> Texture / Material defines material identity, surface finish, surface structure, optical surface behavior, texture prominence and surface condition, then assigns that specification to one or more semantic targets.

## Non-responsibilities

Texture / Material does not own:

- base colors or palette relationships → Color Palette
- illumination color, light direction or light-source behavior → Lighting
- artistic medium or global rendering aesthetic → Style
- post-processing overlays, bloom, decorative splatter or atmosphere → Effects / Background
- the semantic identity/content of the target entity itself

## Final schema

```text
Texture / Material
├── Material Assignments[]
│   ├── Material Preset → populates editable properties
│   ├── Apply To[]
│   ├── Custom Targets[]
│   ├── Except[]
│   ├── Custom Exceptions[]
│   ├── Material
│   ├── Finish
│   ├── Surface Texture
│   ├── Optical Character
│   ├── Texture Prominence
│   └── Condition / Imperfections[]
├── Extra Details
└── Custom Override
```

Each assignment is a self-contained relational unit. Properties, targets and exceptions remain associated through Modular and Natural output.

## Shared relational assignment foundation

Color Palette and Texture / Material share infrastructure for relational scope while keeping their payload semantics independent.

```text
Semantic assignment infrastructure
├── SemanticTargetRef
├── capability-aware module-output targets
├── useSemanticTargetCatalog()
├── AssignmentScopeEditor
│   ├── Apply To
│   ├── Custom Targets
│   ├── Except
│   └── Custom Exceptions
├── missing-reference preservation
├── target-aware card summaries
└── semantic scope compiler helpers
```

The shared layer knows **what is assigned where**. It does not know what a color palette, material, finish or future module-specific payload means.

This avoids a generic mega-editor while keeping target/reference behavior reusable for future assignment-driven modules.

## Target capability contract

Module outputs can opt into semantic targeting through capability metadata.

Current capabilities are:

```text
color
material
```

Hair and Outfit currently expose their module outputs for both capabilities through the semantic target capability registry. Consumers request a capability rather than hard-coding module keys.

When an applicable module has no compiled output, the generic built-in target remains available:

```text
Outfit
Hair
```

When the module has output, the same semantic slot upgrades to a linked module-output target:

```text
Outfit · {outfit}
Hair · {hair}
```

The slot identity remains stable while the semantic reference gains linked-module metadata. This avoids duplicate `Outfit` + `{outfit}` options and allows the selector state to survive the upgrade.

## Exceptions

Both Color Palette rules and Material Assignments support first-class exceptions.

Examples:

```text
Overall → except {outfit}
All Scene Surfaces → except {car}
```

Rules:

- the broad Apply target itself is not offered as its own exception
- an exact target cannot simultaneously exist in Apply To and Except
- selecting an exact target in one scope removes the exact counterpart from the other
- custom targets and custom exceptions are both supported
- exceptions do not silently remove a broader Apply target
- missing referenced exceptions are preserved until explicitly removed

## Axis decisions

### Material

Defines what the entity is made of, for example:

```text
aluminum
porcelain
oak
leather
glass
cotton
resin
clay
```

The useful legacy material catalog is preserved during Stage 11.

### Finish

Defines surface reflectance/finish rather than illumination:

```text
matte
satin
semi-gloss
glossy
high gloss
mirror-like / polished
```

Lighting may reveal the finish, but Lighting does not define it.

### Surface Texture

Defines visible/tactile surface structure:

```text
smooth
brushed
rough
porous
fine grain
fibrous
woven
hammered
ridged
brush marks
coarse
```

Legacy `grain`, `roughness` and `brush_marks` concepts move here rather than remaining imperfections.

### Optical Character

Defines how the material passes or blocks light:

```text
opaque
translucent
transparent
frosted / diffused
```

This is material behavior, not Lighting source color or direction.

### Texture Prominence

Defines how strongly the surface texture should read without using generic quality/detail language:

```text
subtle
visible
pronounced
```

Old `rich`, `highly_detailed`, `intricate` and `coarse` detail-level concepts are not preserved as generic quality tiers. Coarse belongs to Surface Texture.

### Condition / Imperfections

Multi-select conditions include:

```text
clean
handmade irregularities
scratches
cracks
dents / bumps
chips
dust / dirt
weathering
stains
fading
wrinkles / creases
peeling / flaking
corrosion / oxidation
```

`Clean` is exclusive with the other condition values inside one assignment.

`paint_splatter` is intentionally not retained as a material condition because it is closer to decorative treatment / Effects.

## Preset contract

Material presets are editable state recipes.

Selecting a preset populates material/surface properties but does not define the assignment target or exceptions. Editing any preset-controlled material property detaches the assignment from that preset while preserving the resulting state. Editing relational scope does not detach the preset.

Initial recipes include:

- Smooth Vinyl
- Handmade Clay
- Brushed Aluminum
- Polished Metal
- Clear Glass
- Frosted Glass
- Clean Porcelain
- Weathered Leather
- Woven Cotton
- Aged Wood
- Polished Marble
- Matte Rubber

The old `painterly_surface` preset is removed because it mixed Style semantics with arbitrary plastic/material assumptions.

## Dynamic targets

Built-in targets:

- All Scene Surfaces
- Background Surface
- Main Subject
- Outfit
- Hair
- Typography
- Accent Elements

Dynamic targets come through the shared semantic target catalog:

- linked capability-compatible module outputs such as `{outfit}` and `{hair}`
- Typography Groups
- Typography Texts
- enabled user Subject variables
- enabled user Object variables
- custom targets

Layout Regions remain excluded because a spatial region is not an unambiguous material-bearing entity.

`All Scene Surfaces` is exclusive only inside the same assignment. A later specific assignment may intentionally override or add material behavior for one target.

## Typography target presentation

Typography structural variables contain serialized state internally, but serialized JSON must never become a dropdown display label.

The shared semantic target catalog presents human-readable labels with structural tokens as secondary identity, for example:

```text
Text Group 1
{text_group_*} · optional purpose

Main Title
{text_*} · {content_variable} · parent group
```

Raw serialized group/text JSON remains internal metadata only.

## Target-aware card headers

Collapsed cards answer the most useful question first: **where does this assignment apply?**

Examples:

```text
{car}
Aluminum · Satin · Brushed

Overall · except {outfit}
5 colors
```

Color Palette and Texture / Material use the same target summary formatter. Material-specific and color-specific payload summaries remain local to their own components.

## Multiple assignments to the same target

Unlike Color Palette, duplicate target usage is not inherently a conflict.

Example:

```text
leather → outfit
metal → outfit
```

can intentionally describe a multi-material outfit.

Therefore Stage 11 does not warn merely because two Material Assignments share a target.

Compatibility warnings remain local to suspicious material/property combinations such as:

```text
fabric + corrosion
glass + woven texture
```

Warnings are advisory and never block creative choices.

## Compact compile contract

Preset names and descriptive UI prose are not emitted when explicit semantic values already carry the instruction.

Color Palette example:

```text
• Assign #D92626, #F5DBDB to {hero}
• Assign #213B2B, #496342, #6F5A3A to {car}
```

Texture / Material separates material identity from surface modifiers while remaining compact:

```text
• {car}: cotton material; matte, woven, opaque, visible texture, clean
• all scene surfaces except {car}: clay material; matte, porous, opaque, visible texture
```

This wording was refined after real-image testing. A flat list such as `cotton, matte, woven...` could be interpreted as surface adjectives without strongly replacing the object's material identity. Explicit `<material> material; <surface properties>` produced a clearer material signal without returning to verbose prose.

Assignments compile broad-to-specific:

1. broad built-in scope
2. scoped built-in targets
3. dynamic/custom targets

## Protected bullet blocks

Relational Color Palette and Texture / Material output does not pass through generic comma splitting in Natural output.

Bullet output is treated as a protected semantic block. Natural output therefore follows the same high-level pattern as Layout and Typography:

```text
Color Palette:
• Assign ...
• Assign ...

Texture / Material:
• ...
• ...
```

This protection is intentionally generic so a future assignment-style module can reuse it without another module-specific optimizer workaround.

In Modular output, multi-line module values render below the module variable assignment:

```text
{colorPalette} =
• Assign ...

{texture} =
• ...
```

## Natural output preserves the variable graph

Stage 11 established an important output contract:

> Natural is a human-readable serialization of the same prompt graph; it is not a flattened prompt with reusable tokens removed.

User variables remain defined and referenced by their tokens. Nested system references that are actually used are preserved recursively, for example:

```text
{reference} = attached reference image
{subject} = person in {reference}
```

Linked module-output targets such as `{outfit}` and `{hair}` also remain tokens when they are used by another semantic block. Their module definition is preserved in Natural output rather than replacing the token with vague prose such as `the configured outfit`.

This keeps nested-variable composition useful in both Modular and Natural formats while avoiding duplicate prose: a linked module whose definition is promoted to the definition section is excluded from the generic Natural module sentence.

Typography structural references follow the same principle: structural keys are exposed when another block actually references them.

## Cross-module preservation conflict

In image-to-image mode, enabling Setup `Preserve Materials` while Texture / Material actively requests material changes produces an advisory warning.

Neither setting is silently disabled or mutated.

## Real-image validation

Stage 11 was validated with a deliberately complex image-to-image prompt that used no Style module and combined:

- a realistic referenced person,
- Form-driven geometric/surreal transformation,
- a linked Outfit module,
- target-specific Color Palette rules,
- target-specific Material Assignments,
- broad exceptions for the person/car/outfit,
- camera and framing controls.

The test assigned:

```text
scene surfaces → clay
car            → cotton / woven
outfit         → silk / rough / wrinkled
```

and separate palettes to the overall scene, car and outfit.

Both Modular and Natural generations produced visible semantic separation between the scene, car, outfit and realistic person. The environment strongly adopted the clay/materialized treatment and the assigned palettes remained visually distinct. Making material identity explicit improved the cotton/woven reading of the car compared with the earlier flat-keyword compiler.

The two formats produced normal stochastic differences: the Modular sample followed some material assignments more strongly, while the Natural sample emphasized geometric Form semantics more strongly. This was treated as model variance rather than a prompt-architecture failure because both serializations preserved the intended semantic set.

A second important finding was that substantial visual style can emerge from Form + Color + Material + Outfit + Camera without selecting Style. This confirms the intended ownership model: Style is a high-level aesthetic owner, not a mandatory switch required for every stylized output.

## Validation outcome

The stage is accepted as successful based on focused editor tests, relational-scope tests, Modular/Natural parity checks and real image-generation tests.

Validated behaviors include:

- live target-aware card summaries,
- reusable `el-multi-select` behavior across assignment scopes,
- stable linked Outfit/Hair target upgrades without duplicate options,
- Typography Group/Text labels without serialized JSON,
- Apply/Except mutual exclusion,
- custom targets and custom exceptions,
- Color and Material protected bullet output,
- compact color serialization without preset-name noise,
- explicit material identity plus compact surface properties,
- preserved nested variables and linked module definitions in Natural output,
- target-specific Color and Material semantics coexisting without ownership leakage,
- real generated images showing practical material/palette separation.

Further micro-polishing is intentionally stopped under the canonical closure rule: reopen only if later concrete tests reveal a real semantic defect.

## Legacy state

The old global fields are not silently mapped:

```text
material
surface
detailLevel
imperfections
```

A migration task remains in the semantic review backlog. The old module implementation temporarily remains as the source of the large material catalog while the registered module uses `texture.semantic.ts`.

The old non-neutral default `material: vinyl` is not present in the new schema. Enabling the new Texture / Material module produces no material semantics until the user adds an assignment.

## Files introduced/changed

Stage 11 includes both Texture-specific work and the shared relational assignment extraction:

- `app/modules/texture.semantic.ts`
- `app/modules/types.ts`
- `app/modules/semanticTargetCapabilities.ts`
- `app/modules/registry.ts`
- `app/components/el/multi-select.vue`
- `app/components/modules/shared/AssignmentScopeEditor.vue`
- `app/components/modules/panel/ColorAssignmentsField.vue`
- `app/components/modules/texture/MaterialAssignmentsField.vue`
- `app/components/modules/panel/texture.vue`
- `app/composables/prompt/useSemanticTargetCatalog.ts`
- `app/utils/semanticTargets.ts`
- `app/utils/promptVariableCatalog.ts`
- `app/utils/compileColorPalette.ts`
- `app/utils/compileTexture.ts`
- `app/utils/compileModules.ts`
- `app/utils/compilePrompt.ts`
- `app/utils/compileTypographyNatural.ts`
- `app/utils/promptValidation.ts`
- `scripts/i18n-patches/en.texture-semantics.ts`
- `scripts/i18n-patches/en.semantic-assignment-scope.ts`
- `scripts/i18n-patches/fa.semantic-refactor.todo.ts`
- `docs/prompt-semantics/review-backlog/README.md`

## Closure

Stage 11 — Texture / Material is **semantically closed**.

Deferred legacy migration/catalog extraction remains tracked separately and does not keep the new semantic schema open.
