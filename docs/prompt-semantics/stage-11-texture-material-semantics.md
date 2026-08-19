# Stage 11 — Texture / Material Semantics

Status: **Implementation ready for validation**

## Original product intent

The old Texture module attempted to define one texture for the output image, but the global model was not practically useful.

Stage 11 reframes the module around a more concrete task:

> Define what selected scene entities are made of and how their surfaces behave.

The module now uses the same relational assignment pattern proven by Color Palette while keeping material/surface semantics independent from color, lighting and style.

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
│   ├── Material
│   ├── Finish
│   ├── Surface Texture
│   ├── Optical Character
│   ├── Texture Prominence
│   └── Condition / Imperfections[]
├── Extra Details
└── Custom Override
```

Each assignment is a self-contained relational unit. Properties must remain associated with the assignment's targets through Modular and Natural output.

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

Selecting a preset populates material/surface properties but does not define the assignment target. Editing any preset-controlled material property detaches the assignment from that preset while preserving the resulting state.

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

Dynamic targets reuse the stable reference model established by Color Palette:

- Typography Groups
- Typography Texts
- enabled user Subject variables
- enabled user Object variables
- custom targets

Layout Regions remain excluded because a spatial region is not an unambiguous material-bearing entity.

`All Scene Surfaces` is exclusive only inside the same assignment. A later specific assignment may intentionally override or add material behavior for one target.

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

## Compile contract

Every assignment compiles as one self-contained relational clause. Properties are chained without comma-separated flattening so the Natural optimizer cannot detach them from their targets.

Conceptual example:

```text
aluminum material with satin finish with brushed directional surface texture with opaque material behavior with clearly visible surface texture with clean surface condition assigned to user target "car" ({car})
```

Multiple assignments are separated by semicolons.

Assignments compile broad-to-specific:

1. All Scene Surfaces
2. built-in scoped targets
3. dynamic/custom targets

The Natural optimizer recognizes relational material clauses before target words such as `background` or `outfit` can misclassify them.

## Structural reference preservation

Stage 11 exposed a cross-module Natural-output gap: Typography structural keys were hidden even when another module referenced them.

The Typography Natural serializer is now reference-aware. `compilePrompt` scans all other module outputs and exposes only the referenced Typography group/text keys.

This is deliberately module-agnostic, so Color Palette, Texture / Material and future modules can reuse the same structural-reference contract.

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

Before closing Stage 11, test at least:

1. Brushed Aluminum preset → user Object variable
2. Weathered Leather preset → Outfit
3. Clear Glass → Main Subject
4. Frosted Glass → custom target
5. manual finish-only assignment with no Material selected
6. manual Condition-only assignment
7. `Clean` exclusivity against scratches/weathering
8. `All Scene Surfaces` exclusivity inside one assignment
9. All Scene Surfaces assignment + later specific assignment
10. two different materials intentionally targeting the same entity
11. unusual material/property combination shows advisory warning without blocking
12. Typography Group target
13. individual Typography Text target and Natural key preservation
14. deleted user/Typography reference remains preserved as Missing Reference
15. custom target add/remove behavior
16. preset property edit detaches preset without changing targets
17. Modular and Natural preserve material properties ↔ target relationships
18. Color Palette + Texture target the same entity without semantic leakage
19. Lighting + Texture combine without finish/illumination ownership collision
20. `pnpm generate` succeeds

## Files introduced/changed

- `app/modules/texture.semantic.ts`
- `app/modules/types.ts`
- `app/components/modules/texture/MaterialAssignmentsField.vue`
- `app/components/modules/panel/texture.vue`
- `app/components/prompt/editor.vue`
- `app/modules/registry.ts`
- `app/utils/compileTexture.ts`
- `app/utils/compileModules.ts`
- `app/utils/optimizeNaturalPrompt.ts`
- `app/utils/compileTypographyNatural.ts`
- `app/utils/compilePrompt.ts`
- `scripts/i18n-patches/en.texture-semantics.ts`
- `scripts/i18n-patches/fa.semantic-refactor.todo.ts`
- `docs/prompt-semantics/review-backlog/README.md`

Stage 11 remains open until the validation checklist is exercised with real editor behavior plus Modular/Natural output.
