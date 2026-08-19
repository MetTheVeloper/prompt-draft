# Stage 08 — Camera Semantics

## Status
Closed after semantic refactor, preset validation, Modular/Natural output validation, local build validation, and lightweight compatibility guidance.

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

## Final field model

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

Fixed/integrated examples include Polaroid SX-70, Fujifilm X100V, Leica Q2, Rolleiflex, Kodak Disposable and Contax T2. Interchangeable-lens camera-body presets intentionally leave Lens Profile neutral so the user can choose optics independently.

This prevents a camera-body preset from silently inventing a lens.

The Contax T2 preset was corrected to its fixed 38mm lens profile rather than the earlier incorrect 28mm profile.

## Taxonomy decisions

### Capture System
Defines the recording platform itself, including generic digital/film systems, integrated devices, and specific camera models.

It does not imply viewpoint or composition. Security-camera or aerial-drone capture systems therefore do not inject top-down, frontal, sweeping-perspective, or other Framing instructions.

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

## Compatibility guidance

Camera now uses the generic module `sort-and-hint` compatibility system. Warnings are advisory only:

- no option is blocked,
- no user state is removed,
- no compiled output is rewritten,
- unusual combinations remain available for intentional creative use.

### Capture System ↔ Capture Response

High-confidence physical mismatches are warned, including:

- digital system + film response,
- film system + digital response,
- 35mm film system + instant-film or medium-format-film response,
- medium-format film system + 35mm/instant-film response,
- non-medium-format systems + explicitly medium-format digital response where the system tags make the mismatch clear.

The warning intentionally does not attempt to police every sensor aesthetic or brand-specific response. Creative response borrowing remains possible.

### Capture System ↔ Lens Profile

Generic optical profiles such as Macro, Fisheye, Wide Angle, Standard and Telephoto remain broadly selectable without compatibility policing.

Warnings are reserved for profiles that claim an intrinsic/fixed optical system, including:

- fixed 23mm,
- fixed 28mm,
- fixed 38mm,
- simple fixed-wide optics,
- integral instant-camera optics,
- medium-format twin-lens optics.

Examples:

```text
Leica M6 + Fixed 23mm → warning, selection preserved
Leica M6 + Instant Film response → warning, selection preserved
Leica Q2 + Fixed 28mm → no warning
Fujifilm X100V + Fixed 23mm → no warning
Polaroid SX-70 + Integral Instant-Camera Lens → no warning
Contax T2 + Fixed 38mm → no warning
```

This keeps compatibility guidance useful without turning Camera into a restrictive hardware configurator.

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

The optimizer recognizes explicit Camera capture/optics phrases before generic Transformation, Texture, or Lighting classification.

The Camera Natural group limit was increased from 5 to 12 so a fully configured Camera module plus advanced details is not silently truncated.

## Validated outputs

Local `pnpm generate` passed after the main Camera refactor and UI integration.

The following representative output families were manually validated in both Modular and Natural formats:

### Polaroid SX-70 preset

Preserved the independent semantics of:

```text
instant-film capture system
instant-film response
integral instant-camera optics
moderate depth of field
```

No Framing, Lighting or Style assumptions were introduced.

### Leica Q2 preset

Preserved:

```text
full-frame fixed-lens capture system
neutral digital response
fixed 28mm optics
```

No unnecessary focus/depth or behavioral assumptions were added.

### Manual X-Trans + Fisheye + Critical Focus + Active Handheld

Verified that:

- X-Trans response remains Camera,
- fisheye distortion remains Camera rather than Transformation,
- focus remains independent,
- handheld behavior remains Camera,
- Natural output preserves the same semantic set.

### Deliberately unusual Leica M6 combination

A manual Leica M6 combination with instant-film response and fixed 23mm optics compiled exactly as selected. The final compatibility layer now warns about those physical mismatches while continuing to preserve and compile the user's selections.

## Cross-module boundary result

Camera ↔ Framing is considered healthy:

- Framing owns viewpoint, crop, placement and composition.
- Camera owns recording system, response, optics, focus/depth and physical recording behavior.

Camera no longer injects top-down, frontal, close-up or dramatic-composition instructions.

Camera ↔ Lighting is also intentionally separated: sensor response may describe tonal latitude or high-sensitivity behavior but must not request a scene-lighting setup.

## Realism applicability

Camera is primarily meaningful for photographic, photorealistic, or otherwise physically captured output.

No automatic Style → Camera enable/disable coupling was added. The user remains free to combine modules intentionally; future applicability guidance should prefer warnings/hints over silent state mutation.

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

No automatic migration is performed as part of semantic closure. Exact and polluted legacy values require an explicit migration table before hydration logic is changed.

This migration work remains tracked in:

```text
docs/prompt-semantics/review-backlog/README.md
```

Legacy migration is a persistence/backward-compatibility task and does not reopen Camera semantic ownership.

## Closure

Camera is semantically closed for the current architecture.

Future changes should preserve the central invariant:

> Camera changes how an otherwise unchanged view is recorded; it must not silently change where the camera looks, how the frame is composed, how the scene is lit, or what visual style the image uses.

The next recommended key-module semantic audit is Lighting.
