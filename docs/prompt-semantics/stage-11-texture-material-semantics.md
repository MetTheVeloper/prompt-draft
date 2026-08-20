# Stage 11 — Texture / Material Semantics

Status: **Implementation ready for validation**

## Original product intent

The old Texture module attempted to define one texture for the output image, but the global model was not practically useful.

Stage 11 reframes the module around a more concrete task:

> Define what selected scene entities are made of and how their surfaces behave.

The module now uses the same relational assignment pattern proven by Color Palette while keeping material/surface semantics independent from color, lighting and style.

During validation, Color Palette and Texture / Material revealed that relational assignment itself is a reusable product capability. The shared part has therefore been extracted instead of allowing the two modules to grow parallel target/reference implementations.

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

Each assignment is a self-contained relational unit. Properties, targets and exceptions must remain associated through Modular and Natural output.

## Shared relational assignment foundation

Color Palette and Texture / Material now share infrastructure for relational scope while keeping their payload semantics independent.

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

This replacement behavior avoids duplicate `Outfit` + `{outfit}` options.

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

The shared semantic target catalog presents:

```text
Text Group 1
{text_group_*} · optional purpose

Main Title
{text_*} · {content_variable} · parent group
```

Raw serialized group/text JSON remains internal metadata only.

## Target-aware card headers

Collapsed cards must answer the most useful question first: **where does this assignment apply?**

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

Texture / Material example:

```text
• Apply aluminum, satin, brushed, opaque, visible texture, clean to {car}
• Apply clay, matte, porous, opaque to all scene surfaces except {outfit}
```

Material properties use compact keywords because image-generation models already understand standard material vocabulary. Repetitive wording such as `material behavior`, `surface condition`, preset names and repeated `assigned to user target` phrases is intentionally removed.

Assignments still compile broad-to-specific:

1. broad built-in scope
2. scoped built-in targets
3. dynamic/custom targets

## Protected bullet blocks

Relational Color Palette and Texture / Material output no longer passes through generic comma splitting in Natural output.

Any module output emitted as a bullet block is treated as a protected semantic block. Current Natural output therefore follows the same high-level pattern as Layout and Typography:

```text
Color Palette:
• Assign ...
• Assign ...

Texture / Material:
• Apply ...
• Apply ...
```

This protection is intentionally generic so a future assignment-style module can reuse it without introducing another module-specific optimizer workaround.

In Modular output, multi-line module values render below the module variable assignment:

```text
{colorPalette} =
• Assign ...

{texture} =
• Apply ...
```

## Format-aware module-output references

Linked module-output targets use their token in Modular output:

```text
{outfit}
{hair}
```

In Natural protected blocks they are rendered as human-readable references:

```text
the configured outfit
the configured hair
```

User variables and Typography structural tokens remain explicit because those tokens are defined/preserved elsewhere in the prompt.

Prompt validation also recognizes active module-output keys as defined references, preventing false undefined-variable warnings for `{outfit}` / `{hair}`.

## Structural reference preservation

Stage 11 exposed a cross-module Natural-output gap: Typography structural keys were hidden even when another module referenced them.

The Typography Natural serializer is reference-aware. `compilePrompt` scans all other module outputs and exposes only the referenced Typography group/text keys.

This is deliberately module-agnostic, so Color Palette, Texture / Material and future modules can reuse the same structural-reference contract.

## Cross-module preservation conflict

In image-to-image mode, enabling Setup `Preserve Materials` while Texture / Material actively requests material changes produces an advisory warning.

Neither setting is silently disabled or mutated.

## Legacy state

The old global fields are not silently mapped during Stage 11 validation:

```text
material
surface
detailLevel
imperfections
```

A migration task is tracked in the semantic review backlog. The old module implementation temporarily remains as the source of the large material catalog while the registered module uses `texture.semantic.ts`.

The old non-neutral default `material: vinyl` is not present in the new schema. Enabling the new Texture / Material module produces no material semantics until the user adds an assignment.

## Validation checklist

Before closing Stage 11, validate the shared scope layer and both consumers:

1. collapsed Color and Material cards immediately show their live target scope and accurate payload summary
2. Brushed Aluminum preset → user Object variable
3. Weathered Leather preset → Outfit
4. `Clean` exclusivity against scratches/weathering
5. `Overall` / `All Scene Surfaces` exclusivity inside Apply To
6. broad Apply + specific Exception remains valid
7. exact target cannot stay in both Apply To and Except
8. custom target and custom exception add/remove behavior
9. inactive Outfit/Hair show generic targets; active modules with output upgrade the same options to `{outfit}` / `{hair}` without duplicate options
10. Typography Group/Text target labels never expose serialized JSON
11. deleted user/Typography references remain preserved as Missing References in Apply and Except
12. preset payload edit detaches preset without changing scope; scope edit does not detach preset
13. two different materials intentionally targeting the same entity remain allowed
14. unusual material/property combination shows advisory warning without blocking
15. Modular Color output is compact bullet syntax without preset names
16. Modular Material output is compact keyword bullet syntax without preset names
17. Natural output presents protected `Color Palette:` and `Texture / Material:` bullet blocks
18. Natural converts linked `{outfit}` / `{hair}` target tokens to configured-module wording
19. individual Typography Text target remains structurally identifiable in Natural output
20. Setup Preserve Materials + active Texture emits advisory conflict warning
21. Color Palette + Texture target the same entity without semantic leakage
22. Lighting + Texture combine without finish/illumination ownership collision
23. `pnpm generate` succeeds

## Files introduced/changed

Stage 11 now includes both Texture-specific work and the shared relational assignment extraction:

- `app/modules/texture.semantic.ts`
- `app/modules/types.ts`
- `app/modules/semanticTargetCapabilities.ts`
- `app/modules/registry.ts`
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

Stage 11 remains open until the validation checklist is exercised with real editor behavior plus Modular/Natural output.
