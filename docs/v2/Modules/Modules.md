# Modules

[← Prompt Generator v2](../PromptGenerator%20v2.md)

Modules are the visual departments of Prompt Generator v2. Each one owns a limited responsibility so the final prompt can stay precise even when the idea becomes complex.

If Setup is the production brief, modules are the specialists you bring onto the job:

- **Style** — art director: aesthetic language, medium, linework, treatment, finish.
- **Form** — sculptor / industrial designer: shape grammar, proportions, deformation.
- **Framing + Layout** — composition department: what fits where, what is cropped, and how regions are organized.
- **Lighting** — gaffer: sources, direction, quality, color, contrast.
- **Camera** — cinematographer / photographer: capture system, lens character, focus, capture behavior.
- **Hair + Outfit** — character styling departments: structured, component-level design rather than one vague sentence.
- **Color Palette + Texture** — look-development artists: assign colors and materials to the right things.
- **Typography** — type and information-design department.
- **Effects** — finishing/VFX department.

## Why modules instead of one long prompt?

Because visual instructions have **scope**.

“Glossy” could mean a glossy ceramic cup, glossy hair, a glossy magazine print treatment, or glossy lighting highlights. In a flat paragraph, the model has to guess. In a modular system, the instruction lives where it belongs.

The same applies to pose, color, material, typography, and reference-image constraints.

## Wiring and semantic targets

Some v2 modules can do more than describe the whole image. They can address specific semantic targets such as a subject, an outfit item, a hair component, a typography group, a variable, or another exposed module entity.

For example:

1. Outfit defines a jacket and boots.
2. Texture assigns brushed aluminum to the jacket only.
3. Color Palette assigns red to the boots and excludes the jacket.
4. Pose targets the person, not every entity in the scene.

That is **wiring**: modules are independent, but they can refer to the same meaningful parts of the design.

## Three levels of control

### 1. Presets

Presets are coherent starting recipes. A preset can fill several axes at once, but it does not lock them. Apply one, then edit the fields that matter.

### 2. Field-level Custom

Many v2 fields include a **Custom** entry. Choosing it opens a freeform value *for that one field*. This is the preferred escape hatch when the catalog does not contain the exact thing you need.

Example: Style has a Medium catalog, but your idea calls for “UV-printed translucent acetate with hand-cut registration errors.” Put that description in **Medium → Custom** rather than replacing the entire Style module.

### 3. Full Custom Override

Most modules also have a module-level override. When enabled, it replaces the structured generated output of that module.

Use it when the module’s normal grammar cannot express the idea at all—not simply because one dropdown is missing a value.

> “A custom field bends one axis. A full override replaces the department.”

## Compatibility hints

Some fields understand relationships between their own choices. Examples include:

- Camera capture system ↔ capture response / lens profile
- Form proportions ↔ transformations
- Framing shot size ↔ crop-safety choices
- Texture material ↔ finish / surface / optical behavior / conditions

These hints help you notice strange pairings without forbidding deliberate surreal choices.

## Module guide

1. [Variables](./Variables.md)
2. [Layout](./Layout.md)
3. [Style](./Style.md)
4. [Form](./Form.md)
5. [Framing](./Framing.md)
6. [Expression](./Expression.md)
7. [Pose](./Pose.md)
8. [Hair](./Hair.md)
9. [Outfit](./Outfit.md)
10. [Background](./Background.md)
11. [Lighting](./Lighting.md)
12. [Camera](./Camera.md)
13. [Color Palette](./Color%20Palette.md)
14. [Typography](./Typography.md)
15. [Effects](./Effects.md)
16. [Texture / Material](./Texture.md)

## A real-world example

Imagine a campaign image of a person transformed into a porcelain collectible:

- **Form** changes proportions without redefining who the person is.
- **Style** sets the broader visual language.
- **Texture** assigns porcelain specifically to the figure.
- **Hair** can remain hair-shaped while receiving its own material assignment.
- **Outfit** can define a separate sculpted costume.
- **Lighting** makes the ceramic/glaze readable.
- **Camera + Framing** decide how we encounter the object.
- **Color Palette** directs color to the figure, outfit, or background independently.

The power is not any single dropdown. The power is that each decision has a home, and the homes can talk to each other.

---

**Next:** [Variables →](./Variables.md)