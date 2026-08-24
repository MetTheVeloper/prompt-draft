# Prompt Type

[← Setup](./Setup.md)

Prompt Type tells the compiler what kind of relationship the generated prompt has with source imagery.

## Options

- **Text to Image (`text_to_image`)** — the image is built primarily from written context and module instructions.
- **Image to Image (`image_to_image`)** — an input image is part of the job, so the prompt can also describe how that reference should be used, preserved, or transformed.

## Text to Image

Use this when the idea should be generated from description alone.

A good Text-to-Image setup normally has enough context in **Idea**, **Subject**, or both for the system to understand what should exist in the image.

### Example

**Idea:** “A tiny brutalist perfume bottle presented like a monumental architectural object.”

Then Style, Form, Material, Lighting, Camera, and Framing can decide *how* that object should look.

## Image to Image

Use this when an attached image matters to the final result. Selecting it unlocks [Image Reference Settings](./Image%20Reference%20Settings.md).

The reference does not automatically mean “copy everything.” You can choose whether the model should strongly respect the source, reinterpret it, or preserve only selected traits.

### Example

You upload a portrait and want a vinyl-toy version:

- Prompt Type → **Image to Image**
- Reference Usage → **Balanced**
- Preserve → **Main Subject + Identity**
- Do not preserve → Materials / Lighting if you want those rebuilt
- Style → vinyl-toy direction
- Form → stylized proportions
- Texture → vinyl material assignment

The important idea is that **reference behavior and creative modules are separate controls**. That separation prevents “use this image” from becoming an undefined instruction.

---

**Next:** [Core Context →](./Core%20Context.md)