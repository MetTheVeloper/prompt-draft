# Stage 08 — Camera Semantics

## Status
Implemented on `refactor/prompt-semantics`; pending local build and compiled-output validation before semantic closure.

## Ownership
Camera defines how an otherwise unchanged realistic or photographic scene is recorded through the selected capture system.

Camera owns:

- capture system / camera body or integrated recording device,
- sensor / film capture-response character,
- lens optical profile,
- focus and depth-of-field behavior,
- physical capture behavior such as stable or handheld recording.

Camera does not own:

- shot size or crop — Framing
- subject placement or frame composition — Framing
- view angle or view direction — Framing
- lighting direction, quality, color, or mood — Lighting
- body pose or gesture — Pose
- scene content — Background / Setup
- general visual or artistic style — Style

Canonical boundary:

```text
Framing → where/how the camera sees the subject
Camera  → how that view is recorded
```

## Field model

```text
Camera
├─ Capture System
│  ├─ Capture System
│  └─ Capture Response
├─ Optics & Focus
│  ├─ Lens Profile
│  └─ Focus & Depth
├─ Capture Behavior
│  └─ Capture Behavior
├─ Advanced Details
│  └─ Extra Camera Details
└─ Custom Override
   └─ Custom Camera Text
```

All structured fields are neutral by default.

## Preset model

Specific camera names are no longer prose choices inside one mega-select. They are state recipes that populate the structured Camera fields.

Preset lifecycle follows the generic module preset system:

- selecting a camera applies its field recipe,
- all populated fields remain editable,
- a manual field edit detaches the active preset,
- switching presets replaces all five structured Camera fields so stale state does not leak from the previous preset,
- choosing no preset resets the preset-controlled fields.

### Fixed vs interchangeable optics

A camera preset only populates Lens Profile when the optical system is intrinsic to that camera/device recipe.

Examples of integrated/fixed-system presets may set a lens profile. Interchangeable-lens camera-body presets intentionally leave Lens Profile neutral so the user can choose optics independently.

This prevents a camera-body preset from silently inventing a lens.

## Taxonomy decisions

### Capture System
Defines the recording platform itself, including generic digital/film systems, integrated devices, and specific camera models.

It does not imply viewpoint or composition. For example, security-camera or aerial-drone capture systems no longer inject top-down or sweeping-perspective instructions.

### Capture Response
Defines image-recording response rather than scene lighting:

- sensor/film tonal behavior,
- grain/noise character,
- dynamic-range behavior,
- image-response character.

A high-sensitivity camera response does not require the scene to be low-lit. Lighting remains independently controlled.

### Lens Profile
Defines optical behavior such as field of view, perspective compression, close-focus capability, or optical distortion.

It does not define shot size. Macro optics therefore do not automatically request close-up framing.

### Focus & Depth
Depth-of-field behavior is independent from Lens Profile and Framing.

The user can combine a chosen lens with shallow, moderate, deep, fixed-focus, or critical-focus behavior where appropriate.

### Capture Behavior
Defines physical recording stability/handling.

Handheld options describe restrained camera instability rather than dynamic composition, realism, or cinematic style. Handheld is not automatically attached to disposable/compact-film presets merely because those cameras are commonly used casually.

## Removed semantic pollution

The old `cameraStyle` catalog mixed:

```text
camera body/device
lens behavior
depth of field
capture behavior
viewpoint
composition
aesthetic language
generic quality language
```

The refactor removes Camera-owned wording such as:

- top-down or frontal viewpoint assumptions,
- sweeping perspective as a device assumption,
- dramatic composition,
- casual / professional / premium / realistic filler,
- low-light scene assumptions from high-sensitivity camera bodies,
- close-up framing from macro optics.

Useful capture concepts were preserved in their proper axes.

## Compile behavior

Camera remains a string-output module with explicit order:

```text
capture system
→ capture response
→ lens profile
→ focus/depth
→ capture behavior
→ extra details
```

Custom Camera Text remains the full override.

## Natural output protection

Camera can legitimately use words that the generic Natural optimizer also associates with other semantic groups, including:

```text
distortion
grain
detail
tonal response
```

The optimizer now recognizes explicit Camera capture/optics phrases before generic Transformation, Texture, or Lighting classification.

The Camera Natural group limit was increased from 5 to 12 so a fully configured Camera module plus advanced details is not silently truncated.

## Realism applicability

Camera is primarily meaningful for photographic, photorealistic, or otherwise physically captured output.

No automatic Style → Camera enable/disable coupling was added in this stage. The user remains free to combine modules intentionally, and future applicability guidance should prefer warnings/hints over silent state mutation.

## Translation workflow

English semantic copy is maintained in:

```text
scripts/i18n-patches/en.camera-semantics.ts
```

The patch is registered in:

```text
scripts/i18n-patches/fa.semantic-refactor.todo.ts
```

The Persian ledger still intentionally contains English source values until the final Persian translation pass.

## Legacy state

Older drafts can contain:

```text
cameraStyle
```

No automatic migration is performed in this stage. Exact and polluted legacy values require an explicit migration table before hydration logic is changed.

This work is tracked in:

```text
docs/prompt-semantics/review-backlog/README.md
```

## Validation required before closure

1. Apply the English i18n patch.
2. Run `pnpm generate`.
3. Verify neutral Camera emits no Camera output.
4. Verify each structured axis in isolation.
5. Verify a maximum Camera combination preserves all semantics in Modular and Natural output.
6. Verify fisheye optical distortion remains Camera rather than Transformation in Natural output.
7. Verify film grain / sensor detail remain Camera rather than Texture in Natural output.
8. Verify camera presets populate fields correctly and manual edits detach the active preset.
9. Verify switching presets clears stale fields from the previous preset.
10. Verify fixed-lens presets set intrinsic Lens Profile while interchangeable-lens body presets leave it neutral.
11. Verify Camera + Framing combinations contain no competing view-angle, view-direction, shot-size, or composition instructions.
12. Verify Camera + Lighting combinations contain no scene-lighting instructions introduced by Camera.

## Closure

Do not mark Camera semantically closed until the validation list above and `pnpm generate` pass.
