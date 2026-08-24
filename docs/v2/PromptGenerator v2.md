# Prompt Generator v2

Prompt Generator v2 is a visual prompt-building system for people who think in images, art direction, photography, illustration, 3D, typography, and graphic design—not in prompt syntax.

Instead of asking you to write one giant paragraph and hope every instruction lands in the right place, Prompt Generator separates an image idea into clear responsibilities: **Setup** defines the job, **Modules** describe the visual decisions, and **Output** compiles those decisions into a prompt that an image-capable model can interpret.

> “The presets are not the walls of the system. They are the fastest doors into it.”

## What v2 is designed to solve

Long image prompts often fail for a simple reason: unrelated decisions are mixed together. A camera instruction sits next to a material instruction; a pose is buried inside style language; a color request accidentally becomes global; or a reference-image constraint fights with a module later in the prompt.

Prompt Generator v2 treats these decisions as a **wired visual specification**. Each module owns a visual responsibility, and modules that need to affect a particular subject, item, region, or component can target it instead of spraying instructions across the whole image.

This makes the system useful for:

- Character and portrait art direction
- Product visualization and advertising
- Posters, covers, social graphics, banners, and editorial layouts
- Stylized illustration, 3D, toy-like, handcrafted, and mixed-media imagery
- Photography and cinematic scene design
- Typography-heavy graphics
- Multi-subject compositions where different subjects need different pose, expression, clothing, color, or material rules
- Iterative workflows where you want to change one visual decision without rewriting the whole prompt

## The four-step mental model

1. **Idea** — describe what you want to make.
2. **Setup** — define the prompt mode, subject context, selected modules, reference behavior, and output constraints.
3. **Modules** — art-direct the image through focused controls such as Style, Form, Lighting, Camera, Hair, Outfit, Material, and more.
4. **Output** — inspect validation, choose a compiled format, copy the result, and send it to the model you use for image generation.

## Tested prompt interpretation

Prompts produced by this system are tested with **ChatGPT** and **Gemini** image-generation workflows. In those tests, the prompt interpreter can understand the modular structure, the scoped responsibilities of the modules, and the wiring between related parts well enough to produce acceptable images.

That is not a guarantee that every model—or every future version of a model—will interpret the same prompt identically. Prompt Generator is deliberately explicit so capable interpreters have a strong chance of preserving the intended structure instead of flattening everything into an undifferentiated paragraph.

## The three parts of the system

### [Setup](./Setup/Setup.md)

Setup answers the questions that apply to the **whole job**: What kind of prompt is this? What is the subject? Is there a reference image? Which modules should participate? What aspect ratio or global rules must the final image obey?

### [Modules](./Modules/Modules.md)

Modules are the visual departments of the prompt. Style can define an aesthetic and medium; Form can reshape the physical logic; Lighting can build a multi-light rig; Outfit can construct clothing item by item; Color Palette and Material can assign values to specific targets rather than globally.

This is where most of the creative power lives.

### [Output](./Output/Output.md)

Output is the compiled result. It offers Modular, Natural, and JSON views, reports conflicts and validation issues, and controls whether the final result is ready to copy.

## Preset, field-level Custom, and full Custom Override

These three ideas are intentionally different:

- **Preset** — a fast recipe that fills several related fields with a coherent starting point. You can continue editing after applying it.
- **Field-level Custom** — a custom value inserted *inside one specific axis*. If `Style → Medium` does not contain the exact medium you need, a Custom value can describe it while the rest of Style remains structured.
- **Full Custom Override** — replaces the generated output of the entire module with your own text. It is powerful, but usually the last resort because the structured fields preserve clearer semantics and better wiring.

A good working rule is: **start with presets, refine with fields, use field-level Custom where the catalog stops, and reserve the module override for cases where the module’s normal grammar itself is not enough.**

## Documentation scope

These pages document the v2 interface and behavior represented by the current `main` branch at the time this guide was created. The documentation is versioned under `docs/v2` so future system changes can be documented without rewriting the history of this release.

---

**Next:** [Learn Setup →](./Setup/Setup.md)