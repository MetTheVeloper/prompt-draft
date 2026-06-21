# Prompt Draft

Prompt Draft is a modular prompt-building web app for creating structured prompts for text-to-image and image-to-image workflows.

The project is built around reusable **Key Modules**. Each module controls one part of a prompt, such as style, background, lighting, camera, color palette, pose, outfit, expression, texture, or visual effects. The app combines selected module values into clean prompt output formats such as modular, natural, and JSON-style prompt structures.

The goal of the project is to make prompt creation more consistent, editable, reusable, and easier to expand over time.

---

## Project Overview

Prompt Draft is designed for creative prompt workflows, including:

- AI image generation prompts
- image-to-image transformation prompts
- product poster prompts
- cinematic portrait prompts
- character and subject styling prompts
- structured visual concept generation
- collage and social-content layout tools

The system is schema-driven: modules define their own fields, options, presets, groups, and compile behavior. This makes it easier to add new prompt modules without rewriting the whole editor.

---

## Documentation Index

Documentation is stored inside the `docs` directory.

```txt
docs
├── modules
├── pages
└── scripts
```

---

## Module System Documentation

These files explain the core module architecture and each individual prompt module.

### Core Module System

| Document | Description |
|---|---|
| [Module Types](docs/modules/types.md) | Explains the shared TypeScript contracts used by all modules, including fields, options, presets, compile config, and compatibility metadata. |
| [Module Registry](docs/modules/registry.md) | Explains how modules are imported, ordered, registered, and resolved by key. |

### Prompt Modules

| Module | Description |
|---|---|
| [Style](docs/modules/style.md) | Global visual language, medium, stylization, shape language, treatment, and finish. |
| [Deformation](docs/modules/deformation.md) | Shape transformation, proportion changes, silhouette distortion, and structural form logic. |
| [Framing](docs/modules/framing.md) | Crop, subject placement, perspective angle, composition, safe margins, and layout intent. |
| [Expression](docs/modules/expression.md) | Facial emotion, facial attitude, eyes, mouth, brow behavior, and emotional readability. |
| [Pose](docs/modules/pose.md) | Body position, gesture, stance, action state, posture, and physical energy. |
| [Hair](docs/modules/hair.md) | Hairstyle, hair color, hair texture, hair movement, and hair-specific details. |
| [Outfit](docs/modules/outfit.md) | Clothing, costume, wearable styling, outfit direction, and major garment concepts. |
| [Background](docs/modules/background.md) | Scene, environment, backdrop, contextual space, abstract background, or transparent/cutout intent. |
| [Lighting](docs/modules/lighting.md) | Light setup, light quality, shadows, highlights, contrast, mood, and illumination behavior. |
| [Camera](docs/modules/camera.md) | Lens language, camera type, capture behavior, depth of field, and photographic/cinematic camera feel. |
| [Color Palette](docs/modules/colorPalette.md) | Color strategy, palette direction, color mood, and structured color assignments. |
| [Effects](docs/modules/effects.md) | Visual effects, overlays, post-processing, artifacts, particles, glow, motion, and degradation effects. |
| [Texture](docs/modules/texture.md) | Materials, surface finish, tactile detail, imperfections, aging, damage, and surface behavior. |

---

## Page Documentation

| Document | Description |
|---|---|
| [Collage Page](docs/pages/Collage.md) | Explains the collage page structure, related composables, utilities, constants, canvas behavior, overlay logic, waves, and export flow. |

---

## Script Documentation

| Document | Description |
|---|---|
| [i18n Patches Guide](docs/scripts/i18n-patches.md) | Explains the workflow for collecting missing i18n keys and generating patch files. |
| [راهنمای پچ‌های i18n فارسی](docs/scripts/i18n-patches-fa.md) | Persian version of the i18n patch workflow documentation. |

---

## Recommended Docs Structure

```txt
docs
├── modules
│   ├── background.md
│   ├── camera.md
│   ├── colorPalette.md
│   ├── deformation.md
│   ├── effects.md
│   ├── expression.md
│   ├── framing.md
│   ├── hair.md
│   ├── lighting.md
│   ├── outfit.md
│   ├── pose.md
│   ├── registry.md
│   ├── style.md
│   ├── texture.md
│   └── types.md
├── pages
│   └── Collage.md
└── scripts
    ├── i18n-patches-fa.md
    └── i18n-patches.md
```

---

## Working With Modules

When creating or editing a module, check these files first:

1. [Module Types](docs/modules/types.md)
2. [Module Registry](docs/modules/registry.md)
3. The documentation file for the closest existing module

A typical module lives in:

```txt
app/modules/[module-name].module.ts
```

A matching documentation file should live in:

```txt
docs/modules/[module-name].md
```

When adding a new module, remember to:

- create the module file
- follow the `PromptKeyModule` structure
- add fields, groups, options, presets, and compile config as needed
- register the module in `app/modules/registry.ts`
- add matching i18n keys
- create a matching documentation file in `docs/modules`
- test the module in the editor UI
- check the compiled prompt output

---

## Development Notes

The project uses a modular architecture so each prompt area can evolve independently.

Keep module responsibilities separated:

- use **Style** for global art direction
- use **Background** for scene and environment
- use **Lighting** for illumination
- use **Camera** for capture behavior
- use **Framing** for composition and crop
- use **Pose** for body position
- use **Expression** for facial emotion
- use **Outfit** for clothing
- use **Hair** for hairstyle and hair color
- use **Texture** for material and surface behavior
- use **Color Palette** for color strategy
- use **Effects** for overlays and post-processing
- use **Deformation** for form and proportion transformation

This separation keeps prompts cleaner and makes future modules easier to design.
