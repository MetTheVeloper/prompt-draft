# Module Registry

## Purpose

`registry.ts` is the central registration point for all Prompt Draft modules.

It imports every module definition, stores them in a single ordered array, and provides a helper function for finding a module by its key.

This file should answer questions like:

- Which modules are currently active in the system?
- In what order are modules registered?
- Where should a new module be added after it is created?
- How does the app find a module by key?
- What is the connection between individual module files and the shared prompt system?

---

## Source File

```txt
app/modules/registry.ts
```

Recommended documentation location:

```txt
docs/modules/registry.md
```

---

## Role in the Module System

Each module file defines its own schema and behavior.

`registry.ts` connects those module files to the app.

Without being registered here, a module may exist in the codebase but will not be part of the main `promptModules` list.

The registry acts as the module system's index.

---

## Imports

The file imports the shared module type:

```ts
import type { PromptKeyModule } from './types'
```

Then it imports each module:

```ts
import { StyleModule } from './style.module'
import { TextureModule } from './texture.module'
import { DeformationModule } from './deformation.module'
import { BackgroundModule } from './background.module'
import { LightingModule } from './lighting.module'
import { FramingModule } from './framing.module'
import { PoseModule } from './pose.module'
import { HairModule } from './hair.module'
import { ExpressionModule } from './expression.module'
import { OutfitModule } from './outfit.module'
import { EffectsModule } from './effects.module'
import { CameraModule } from './camera.module'
import { ColorPaletteModule } from './colorPalette.module'
```

Every imported module is expected to satisfy the `PromptKeyModule` contract.

---

## Registered Modules

The current registered module list is:

```ts
export const promptModules = [
  StyleModule,
  DeformationModule,
  FramingModule,
  ExpressionModule,
  PoseModule,
  HairModule,
  OutfitModule,
  BackgroundModule,
  LightingModule,
  CameraModule,
  ColorPaletteModule,
  EffectsModule,
  TextureModule,
] satisfies PromptKeyModule[]
```

This list is the canonical module registry.

---

## Current Registry Order

The current module order is:

| Order | Module |
|---:|---|
| 1 | `StyleModule` |
| 2 | `DeformationModule` |
| 3 | `FramingModule` |
| 4 | `ExpressionModule` |
| 5 | `PoseModule` |
| 6 | `HairModule` |
| 7 | `OutfitModule` |
| 8 | `BackgroundModule` |
| 9 | `LightingModule` |
| 10 | `CameraModule` |
| 11 | `ColorPaletteModule` |
| 12 | `EffectsModule` |
| 13 | `TextureModule` |

This order may affect how modules appear in the UI, how users mentally move through prompt construction, and how documentation should discuss the system.

---

## Registry Order Strategy

The current order starts with global visual direction and subject transformation, then moves through subject presentation, character details, scene/capture controls, color/effects, and material surface.

A useful way to understand the current order:

| Stage | Modules |
|---|---|
| Global visual direction | Style |
| Form transformation | Deformation |
| Composition and face/body presentation | Framing, Expression, Pose |
| Character appearance | Hair, Outfit |
| Scene and illumination | Background, Lighting |
| Capture and color/effects | Camera, Color Palette, Effects |
| Material surface | Texture |

This order is not just technical. It creates a logical workflow for building prompts.

When adding a new module, place it where it makes sense in this flow.

---

## Type Safety

The registry uses:

```ts
satisfies PromptKeyModule[]
```

This is useful because it verifies that every registered item conforms to the expected module shape without losing the specific inferred type information of the array.

This helps catch mistakes such as:

- registering an object that is not a valid module
- forgetting required fields
- using an invalid field structure
- importing the wrong value

---

## Lookup Helper

The registry exports:

```ts
export function getPromptModuleByKey(key: string) {
  return promptModules.find((module) => module.key === key)
}
```

This helper searches the registered modules and returns the first module whose `key` matches the provided string.

Use this when another part of the app needs to resolve a module dynamically from a stored key, route value, UI selection, draft state, or compiled prompt state.

Example behavior:

```ts
getPromptModuleByKey("style")
```

returns `StyleModule`.

```ts
getPromptModuleByKey("camera")
```

returns `CameraModule`.

If no module matches, the function returns `undefined`.

---

## Key Rules

Every registered module must have a unique `key`.

The registry lookup depends on this rule.

Good module keys:

```txt
style
texture
background
colorPalette
```

Avoid duplicate keys. Duplicate keys would make `getPromptModuleByKey` return only the first matching module and could cause UI, state, validation, or compile bugs.

---

## Adding a New Module

When adding a new module to the system:

1. Create the module file in `app/modules`.
2. Make the module satisfy `PromptKeyModule`.
3. Export the module with a clear name, such as `NewModuleNameModule`.
4. Import the module in `registry.ts`.
5. Add it to the `promptModules` array in the correct order.
6. Add i18n keys for the module, groups, fields, options, and presets.
7. Add documentation in `docs/modules/{moduleKey}.md`.
8. Check that the module appears correctly in the UI.
9. Check that presets, draft state, validation, and compile output work as expected.

Example:

```ts
import { PropsModule } from './props.module'

export const promptModules = [
  StyleModule,
  DeformationModule,
  FramingModule,
  ExpressionModule,
  PoseModule,
  PropsModule,
  HairModule,
  OutfitModule,
  BackgroundModule,
  LightingModule,
  CameraModule,
  ColorPaletteModule,
  EffectsModule,
  TextureModule,
] satisfies PromptKeyModule[]
```

The exact position depends on the module's purpose.

---

## Where to Place New Modules in the Registry

Use the module's responsibility to decide where it belongs.

| New Module Type | Suggested Position |
|---|---|
| Global art direction | Near `StyleModule` |
| Shape/form transformation | Near `DeformationModule` |
| Composition or layout | Near `FramingModule` |
| Face or emotion | Near `ExpressionModule` |
| Body action or interaction | Near `PoseModule` |
| Character details | Near `HairModule` and `OutfitModule` |
| Props or held objects | Near `PoseModule`, `HairModule`, or `OutfitModule`, depending on behavior |
| Scene or environment | Near `BackgroundModule` |
| Light or atmosphere | Near `LightingModule` |
| Camera or capture | Near `CameraModule` |
| Color strategy | Near `ColorPaletteModule` |
| Visual effects | Near `EffectsModule` |
| Material or surface | Near `TextureModule` |

The goal is to preserve a natural prompt-building workflow.

---

## Registry vs Module Files

`registry.ts` should not define module internals.

It should not contain:

- field definitions
- option arrays
- presets
- compile config
- compatibility rules
- i18n labels
- UI field details

Those belong inside the module files.

`registry.ts` should only handle:

- imports
- the ordered module list
- module lookup helpers

Keeping the registry small makes the module system easier to maintain.

---

## Registry vs Types

`types.ts` defines the shape of modules.

`registry.ts` lists actual modules that use that shape.

For example:

```txt
types.ts     = What a module must look like.
registry.ts  = Which modules are active and in what order.
```

Both files are needed for the module system to stay understandable.

---

## Registry vs Documentation

The documentation files in `docs/modules` should mirror the registry and module files.

Recommended documentation structure:

```txt
docs/modules/
├─ types.md
├─ registry.md
├─ style.md
├─ deformation.md
├─ framing.md
├─ expression.md
├─ pose.md
├─ hair.md
├─ outfit.md
├─ background.md
├─ lighting.md
├─ camera.md
├─ colorPalette.md
├─ effects.md
└─ texture.md
```

This makes it easy to understand both the general system and each individual module.

---

## i18n Notes

The registry itself does not create i18n keys, but adding a module to the registry makes its i18n keys necessary for the UI.

When registering a new module, check for:

```txt
modules.{moduleKey}.title
modules.{moduleKey}.description
modules.{moduleKey}.groups.*
modules.{moduleKey}.fields.*
modules.{moduleKey}.options.*
modules.{moduleKey}.presets.*
```

If the module appears in the registry but lacks i18n labels, the app may show missing-key warnings or fallback strings.

---

## Design Rule of Thumb

`registry.ts` should stay boring.

It should be a clean, predictable index of active modules.

A good registry change adds an import and places the module in the correct array position.

A bad registry change adds module-specific behavior, special cases, or field logic that should live inside the module file or shared utilities.

---

## Checklist for Future Registry Changes

Before committing changes to `registry.ts`, check:

- The new module is imported correctly.
- The module is added to `promptModules`.
- The module order makes sense in the user workflow.
- The module satisfies `PromptKeyModule`.
- The module key is unique.
- `getPromptModuleByKey` resolves the new module.
- The UI displays the new module where expected.
- Compile output includes the module when enabled.
- Draft state and presets work correctly.
- i18n keys exist in both locale files.
- A matching documentation file exists in `docs/modules`.
