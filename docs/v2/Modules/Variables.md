# Variables

[← Modules](./Modules.md)

## How this module thinks

Variables is the reusable naming layer of the system. It lets you define a value once and reference it from places that support variables, instead of copying the same description into several fields.

Think of it like naming swatches, assets, or reusable art-direction notes in a design file.

## Variable editor

Each user variable has a type so the system and UI can treat it appropriately.

### Type options

- **Text** — general text value.
- **Subject** — a subject reference or description.
- **Reference** — an attached/reference asset.
- **Object** — an object reference.
- **Color** — a color value that can participate in color-aware controls.
- **Font** — a font or lettering-style reference.
- **Custom** — a value that does not fit the standard types.

The system also has **system/module-generated variables**. User variables and generated variables can be selected from variable-aware fields without forcing you to manually copy their content.

## Reserved names

Some variable patterns are reserved because the system generates semantic entities from other modules:

- `text_*`
- `text_group_*`
- `layout_region_*`

Avoid creating user variables that collide with those patterns.

## Full Custom Override

Variables does **not** use the usual module-level Custom Override. The value of this module is the structured variable list itself.

## Recipes

### Brand campaign

**Goal:** reuse the same brand color and product name across several modules.

**Use:**
- Color variable → `brandBlue`
- Text variable → `productName`
- Reference them from color, typography, or variable-aware description fields.

**Why it works:** one edit updates the conceptual value everywhere it is referenced.

### Reusable reference identity

**Goal:** use one attached character reference in more than one scoped designer.

**Use:**
- Create a Reference variable for the attachment.
- Use it from reference-aware Hair/Outfit properties where appropriate.

**Why it works:** the reference becomes a named asset rather than an ambiguous “the image above.”

---

**Next:** [Layout →](./Layout.md)