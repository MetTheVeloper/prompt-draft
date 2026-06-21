# Texture Module

## Purpose

The Texture module defines the material, surface quality, tactile detail, and visible imperfections of the subject or object. It is responsible for describing what the surface appears to be made of, how it reflects or absorbs light, how much fine detail it has, and whether the surface is clean, handmade, aged, damaged, polished, rough, or worn.

This module should answer questions like:

- What material should the subject or object appear to be made from?
- Should the surface feel smooth, matte, glossy, rough, porous, fibrous, woven, translucent, frosted, or brushed?
- How much tactile detail should be visible?
- Should the surface look clean, handmade, scratched, cracked, dusty, weathered, chipped, wrinkled, peeling, or corroded?
- Should material and surface choices stay physically compatible, or intentionally create a creative mismatch?

The Texture module should describe material and surface behavior only. It should not replace the Style, Color Palette, Lighting, Outfit, Hair, Background, or Deformation modules.

---

## Source File

```txt
app/modules/texture.module.ts
```

Recommended documentation location:

```txt
docs/modules/texture.md
```

---

## Module Identity

```ts
key: "texture"
icon: "brush-2"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents brush-like surface treatment, tactile detail, and material rendering in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const TextureModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  presets,
  compile,
}
```

The Texture module is more structured than many other modules. Instead of relying on one main selector, it separates texture into multiple related controls:

1. Material
2. Surface finish
3. Detail level
4. Imperfections
5. Extra details
6. Override text

This makes it possible to build a material system such as “clay + porous + visible handmade detail + small imperfections” or “metal + glossy + subtle detail + clean finish”.

---

## Groups

The Texture module uses four UI groups:

| Group | Role |
|---|---|
| `material` | Primary material selection. |
| `surface` | Surface finish and visible detail controls. |
| `advanced` | Optional imperfections and custom texture details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `material` defines what the surface is made of.
- `surface` defines how that material looks or feels.
- `advanced` adds imperfections and extra texture notes.
- `override` allows a fully custom texture instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `material` | select | `material` | Main categorized material choice. |
| `surface` | select | `surface` | Surface finish or tactile behavior. |
| `detailLevel` | select | `surface` | Amount and visibility of surface detail. |
| `imperfections` | multiSelect | `advanced` | Optional surface flaws, handmade marks, aging, or damage. |
| `extraDetails` | textarea | `advanced` | Adds custom texture-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `material`

`material` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. It has a default value of `vinyl`, which gives the module an immediate usable texture direction when enabled.

This field should describe the base material of the subject or object.

Good material-level directions include:

- vinyl
- resin
- clay
- porcelain
- steel
- gold
- walnut wood
- marble
- glass
- silk
- leather
- paper
- rubber
- wax

Avoid using this field for color palette, lighting, camera behavior, outfit style, pose, scene, or global art direction.

### `surface`

`surface` defines the visible finish or tactile behavior of the selected material.

It uses compatibility logic that depends on `material`. The UI can sort or hint options based on whether a surface finish fits the selected material.

Good surface-level directions include:

- smooth clean surface
- matte non-reflective surface
- glossy reflective surface
- high-gloss mirror-like surface
- brushed directional surface texture
- rough tactile surface
- porous surface
- grainy surface
- fibrous surface
- woven surface
- translucent surface
- frosted surface

This field should describe the surface behavior, not the base material itself.

### `detailLevel`

`detailLevel` controls how much texture detail is visible.

It also uses compatibility logic that depends on `material`.

Current detail levels include:

| Value | Purpose |
|---|---|
| `minimal` | Very reduced surface detail. |
| `subtle` | Light visible texture. |
| `visible` | Clear handcrafted or material detail. |
| `rich` | Strong texture variation. |
| `highly_detailed` | High tactile detail and surface readability. |
| `intricate` | Fine-grained detailed surface complexity. |
| `coarse` | Rough, heavy, coarse texture presence. |

Use this field to control intensity of surface information without changing the material or finish.

### `imperfections`

`imperfections` is a multi-select field.

It allows the user to add multiple surface irregularities at the same time. It uses compatibility logic that depends on `material`, so the UI can hint whether an imperfection fits the selected material.

Good imperfection-level directions include:

- flawless clean finish
- handmade imperfections
- fine surface grain
- visible brush marks
- scratches
- cracks
- dents
- chipped edges
- dust and dirt
- weathered aged surface
- stains
- faded color
- wrinkles or creases
- peeling or flaking
- corrosion or oxidation

Because this field is a multi-select, each option should describe one imperfection clearly and avoid becoming a full material description.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific texture note that does not need a dedicated structured option yet.

Examples:

- “keep the texture visible only on close inspection”
- “make the material feel handcrafted but not dirty”
- “avoid scratches on the face”
- “use roughness mostly on the edges”
- “keep the surface premium and clean despite the handmade marks”

This field should refine the selected material, surface, detail level, or imperfections rather than replace them.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the texture system needs a very specific custom instruction that cannot be built from the structured fields.

---

## Options Strategy

The module uses four external option arrays:

```ts
const materialOptions = [...]
const surfaceOptions = [...]
const detailLevelOptions = [...]
const imperfectionOptions = [...]
```

### `materialOptions`

Each material option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `categoryLabelKey` | i18n key for the category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags used for search, filtering, and compatibility logic. |

### `surfaceOptions`

Each surface option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search and compatibility. |
| `compatibility` | Metadata that compares the option against the selected material. |

### `detailLevelOptions`

Each detail-level option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search and compatibility. |
| `compatibility` | Metadata that compares the option against the selected material. |

### `imperfectionOptions`

Each imperfection option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search and compatibility. |
| `compatibility` | Metadata that compares the option against the selected material. |

This structure makes Texture one of the best examples of a compatibility-aware module.

---

## Material Categories

The `materialOptions` list is organized into broad material families.

| Category | Purpose |
|---|---|
| `vinyl_plastic` | Synthetic, molded, smooth-friendly, toy-like, resin, acrylic, PVC, silicone, and plastic materials. |
| `clay_ceramic` | Clay, terracotta, porcelain, stoneware, earthenware, handmade, porous, and ceramic materials. |
| `metal` | Generic and specific metals such as steel, iron, aluminum, copper, brass, bronze, silver, gold, titanium, and chrome. |
| `wood` | Natural wood materials such as oak, walnut, maple, pine, birch, cedar, mahogany, and bamboo. |
| `stone_mineral` | Stone and mineral surfaces such as marble, granite, limestone, sandstone, slate, and concrete. |
| `glass_crystal` | Transparent, translucent, reflective, frosted, stained, crystal, and quartz-like materials. |
| `fabric_textile` | Soft textile materials such as cotton, linen, silk, velvet, wool, denim, felt, canvas, plush, and lace. |
| `leather_hide` | Leather, suede, and faux leather materials. |
| `paper_cardboard` | Paper, cardboard, kraft paper, and parchment materials. |
| `rubber` | Rubber, latex, neoprene, soft, flexible, or elastic material behavior. |
| `organic_natural` | Natural hard or organic materials such as bone, ivory, shell, coral, and wax. |

When adding a new material option, place it inside an existing material category whenever possible. Add a new category only when the material family represents a reusable material logic that does not fit the current structure.

---

## Compatibility Pattern

The Texture module uses compatibility metadata heavily.

Surface, detail level, and imperfection options can include:

```ts
compatibility: {
  preferredTags: [...],
  supportedTags: [...],
  discouragedTags: [...],
  warningKey: "..."
}
```

This lets the UI guide the user without blocking unusual creative combinations.

Recommended behavior:

- Use `preferredTags` when the option naturally fits the material.
- Use `supportedTags` when the option can work but is not the strongest match.
- Use `discouragedTags` when the option is unlikely or physically inconsistent.
- Use `warningKey` for i18n-friendly user-facing hints.
- Prefer sort-and-hint behavior instead of hard validation, because creative mismatches can be useful.

Examples:

- `corrosion` should strongly prefer metals and discourage wood, fabric, glass, paper, rubber, and similar materials.
- `woven` should strongly prefer fabric or textile materials.
- `high_gloss` should prefer glass, polished metal, resin, acrylic, ceramic, or similar reflective materials.
- `porous` should prefer clay, stone, concrete, paper, or natural materials.

---

## Presets

The Texture module includes a small set of reusable presets.

| Preset | Purpose |
|---|---|
| `smooth_vinyl` | Clean toy-like vinyl surface with subtle detail and clean finish. |
| `handmade_clay` | Clay material with porous surface, visible handmade detail, and handmade imperfections. |
| `polished_metal` | Metal material with glossy surface, subtle detail, and clean finish. |
| `painterly_surface` | Plastic base with matte surface, rich texture, brush marks, and paint splatter. |

A good Texture preset should fill multiple related fields at once:

```ts
{
  material,
  surface,
  detailLevel,
  imperfections
}
```

Presets should represent useful material combinations, not every possible option.

---

## Compile Behavior

The compile section is:

```ts
compile: {
  separator: ", ",
  removeDuplicates: true,
  ignoreEmpty: true,
  overrideField: "customText",
}
```

Meaning:

- Selected prompt fragments are joined with `, `.
- Duplicate fragments are removed.
- Empty fields are ignored.
- `customText` overrides the structured output when filled.

Because the compiler combines selected field output directly, every material, surface, detail, and imperfection `promptText` should be concise and modular.

This matters especially for `imperfections`, because it can contain multiple selected values.

---

## Writing New Material Options

When adding a new material option:

1. Add it to `materialOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel` and `categoryLabelKey`.
5. Write a concise `promptText`.
6. Add useful semantic `tags`.
7. Add tags that help compatibility logic, such as `rigid`, `soft`, `opaque`, `transparent-friendly`, `gloss-friendly`, `matte-friendly`, `grainable`, `handmade-friendly`, `corrosion-friendly`, or similar.
8. Add i18n keys if the UI expects translated labels and descriptions.
9. Check surface, detail-level, and imperfection compatibility rules to see whether the new material needs new tags.

Recommended `promptText` style:

- Describe the base material directly.
- Keep it short and reusable.
- Avoid color unless the material name itself implies it.
- Avoid subject, camera, pose, lighting, or background instructions.
- Avoid mixing material with surface finish unless the option specifically requires it.

---

## Writing New Surface Options

When adding a new surface option:

1. Add it to `surfaceOptions`.
2. Use a stable snake_case `value`.
3. Write a clear `promptText`.
4. Add useful `tags`.
5. Add compatibility metadata based on material tags.
6. Add a warning key if the option can be discouraged for some materials.
7. Check that it combines cleanly with all detail levels and imperfections.

A surface option should describe finish or tactile surface behavior, not material identity.

---

## Writing New Detail-Level Options

When adding a new detail-level option:

1. Add it to `detailLevelOptions`.
2. Use a stable snake_case `value`.
3. Write a concise `promptText`.
4. Add tags that represent intensity and surface readability.
5. Add compatibility metadata when the detail level depends on material behavior.
6. Avoid values that duplicate surface finish or imperfection options.

Detail level should control how much texture is visible, not what the texture is made from.

---

## Writing New Imperfection Options

When adding a new imperfection option:

1. Add it to `imperfectionOptions`.
2. Use a stable snake_case `value`.
3. Write a concise `promptText`.
4. Add tags that describe the imperfection type.
5. Add compatibility metadata based on material tags.
6. Add a warning key if the imperfection may be physically inconsistent with some materials.
7. Make sure the option can combine with other imperfections without producing awkward output.

An imperfection option should describe one flaw, aging behavior, handmade mark, or surface irregularity.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another material, surface finish, detail amount, or imperfection.

Add a new field only when the idea represents a reusable independent axis of material control.

A new Texture field may be justified for controls such as:

- material strictness
- roughness amount
- reflectivity amount
- transparency amount
- aging intensity
- imperfection density
- edge wear amount
- preserve original material
- handmade versus industrial finish
- realism versus stylized material behavior

However, avoid overcomplicating the module unless the UI needs more granular control. The current module already has a strong material system with compatibility-aware surface, detail, and imperfection controls.

---

## Relationship With Other Modules

The Texture module should focus on material and surface behavior only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Global art direction | Style |
| Color system | Color Palette |
| Light setup and illumination | Lighting |
| Clothing type and costume direction | Outfit |
| Hair style, hair color, and hair texture | Hair |
| Scene or environment | Background |
| Camera/lens/capture behavior | Camera |
| Crop and composition | Framing |
| Body pose or gesture | Pose |
| Facial emotion | Expression |
| Shape or anatomy distortion | Deformation |
| Post-processing or overlays | Effects |

Some overlap is natural. For example, glossy surfaces interact with lighting, clothing can have fabric textures, and hair can have strand texture. Still, this module should describe material behavior broadly, while other modules describe subject styling, scene, rendering language, and composition.

---

## Texture vs Style

The Style module defines the global visual language.

The Texture module defines material and tactile surface behavior.

For example:

```txt
Style: claymation-inspired 3D character style
Texture: clay material, subtly porous tactile surface, visible handmade surface detail
```

The style controls the overall rendering language. The texture controls the material feel.

---

## Texture vs Color Palette

The Color Palette module defines the color system.

The Texture module defines surface material, even when the material has natural color associations.

For example:

```txt
Color Palette: black and gold luxury palette
Texture: polished metal material, high-gloss mirror-like surface
```

The palette controls color logic. The texture controls material and reflectivity.

---

## Texture vs Outfit

The Outfit module defines what the subject wears.

The Texture module can define what the clothing surface is made of.

For example:

```txt
Outfit: formal elegant outfit with structured clothing
Texture: velvet fabric material, soft matte textile surface
```

The outfit defines garment concept. The texture defines material behavior.

---

## Texture vs Hair

The Hair module defines hairstyle and hair-specific texture.

The Texture module should handle broader material surfaces.

For example:

```txt
Hair: wavy hair texture with long flowing hairstyle
Texture: porcelain ceramic material with glossy smooth surface
```

Use Hair for hair-specific strand texture. Use Texture for overall object, subject, or material surfaces.

---

## Texture vs Lighting

The Lighting module defines illumination.

The Texture module defines how the surface appears before it is lit.

For example:

```txt
Texture: high-gloss mirror-like surface
Lighting: softbox studio lighting with controlled reflections
```

The texture creates reflectivity. The lighting controls how reflections appear.

---

## i18n Notes

The module key is `texture`, so related labels usually follow a pattern like:

```txt
modules.texture.*
```

Common i18n areas:

```txt
modules.texture.title
modules.texture.description
modules.texture.groups.*
modules.texture.fields.*
modules.texture.options.*
modules.texture.categories.*
modules.texture.warnings.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels, descriptions, categories, or compatibility warnings are translated in the UI.

Because this module uses compatibility warnings, always check both locale files when adding or changing `warningKey` values.

---

## Design Rule of Thumb

The Texture module defines what the surface is made of and how it feels visually.

A good Texture module output sounds like:

```txt
clay material, subtly porous tactile surface, visible handcrafted surface detail, small handmade imperfections
```

or:

```txt
polished metal material, glossy reflective surface, subtle surface detail, flawless clean finish
```

A bad Texture module output sounds like:

```txt
a person standing in a neon city, wearing a leather jacket, smiling, shot with an 85mm lens and dramatic blue lighting
```

That belongs to subject, background, outfit, expression, camera, and lighting modules, not Texture.

---

## Checklist for Future Texture Module Changes

Before committing changes, check:

- The new material belongs to the correct category.
- The `value` is stable and snake_case.
- The `category`, `categoryLabel`, and `categoryLabelKey` are consistent.
- The `promptText` describes material, surface, detail, or imperfection only.
- Tags are useful for search and compatibility.
- Compatibility metadata is added or updated when needed.
- Similar existing options were checked to avoid duplication.
- Multi-selected imperfections combine cleanly.
- Presets remain coherent and not too specific.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
