# Image Reference Settings

[← Setup](./Setup.md)

Image Reference Settings appears when Prompt Type is **Image to Image**. Its job is to separate two questions that are often accidentally mixed together:

1. **How strongly should the source image influence the result?**
2. **Which traits must specifically survive the transformation?**

## Reference Usage

- **Strict** — treat the reference as a strong structural source. Useful when recognizability and source fidelity matter more than radical reinvention.
- **Balanced** — preserve the useful identity/context of the reference while allowing meaningful module-driven changes.
- **Loose** — use the reference as inspiration rather than a rigid template.

## Transformation Strength

- **Subtle** — restrained changes; source appearance remains dominant.
- **Balanced** — noticeable transformation while retaining important reference cues.
- **Strong** — major visual reinterpretation.
- **Extreme** — aggressive transformation where only explicitly preserved traits should be expected to remain stable.

Reference Usage and Transformation Strength are related but not identical: one describes **how the source is treated**, the other describes **how far the result is allowed to move away from it**.

## Preserve controls

You can explicitly preserve:

- **Main Subject** — keep the central subject from the input.
- **Identity** — preserve recognizable identity. Available when the subject is a person.
- **Pose** — retain the source body pose.
- **Outfit** — retain the source clothing. Available when the subject is a person.
- **Composition** — preserve the source composition/framing logic.
- **Colors** — retain source colors.
- **Materials** — retain material/surface character.
- **Lighting** — retain the source lighting character.

## Why preservation matters

Preservation choices participate in validation. If you say **Preserve Pose** and then build a strongly different Pose module, the system can flag that conflict instead of silently generating contradictory instructions. The same principle applies to Composition vs. Framing and Materials vs. Texture.

## Recipes

### Identity-preserving clay figure

- Reference Usage → Balanced
- Transformation Strength → Strong
- Preserve → Main Subject, Identity
- Do not preserve → Materials, Lighting
- Style → handmade clay
- Texture → clay + porous + handmade

The person remains recognizable, but the surface/material system is free to become clay.

### Re-light the exact product shot

- Reference Usage → Strict
- Transformation Strength → Subtle
- Preserve → Main Subject, Composition, Materials, Colors
- Do not preserve → Lighting
- Lighting → build the new rig

### Use a photo only as loose composition inspiration

- Reference Usage → Loose
- Transformation Strength → Extreme
- Preserve → Composition only, if that layout is what you actually want
- Let Style/Form/Material rebuild everything else

---

**Next:** [Output Constraints →](./Output%20Constraints.md)