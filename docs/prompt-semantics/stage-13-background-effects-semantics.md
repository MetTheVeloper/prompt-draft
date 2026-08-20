# Stage 13 — Background + Effects Semantics

## Status

**Semantically closed.**

Background and Effects have both been structurally refactored, tested in isolation and in combinations, approved by the user, and validated with representative compiled outputs. Background also passed a real image-to-image generation test in which a simple source backdrop was replaced by a constructed underwater research habitat while preserving the intended subject-focused edit.

This stage closes the major scene-content vs image-space-effect ownership collision that existed in the legacy catalogs.

## Responsibility contracts

### Background

Background defines what physically or structurally exists behind or around the subject: environment/setting, backdrop type, visible backdrop material, spatial organization, detail density, and secondary background elements.

Background does not own:

- camera focus, blur, bokeh, or depth-of-field behavior,
- illumination sources, glow, halo, or lighting treatment,
- overall visual aesthetic or medium,
- image-space artifacts or post-processing,
- global subject/material texture.

### Effects

Effects defines explicit image-space effects, overlays, signal/damage artifacts, composited VFX, and other added effect mechanisms that are applied independently of the scene's physical construction or capture system.

Effects does not own:

- camera optics, focus, or physical capture behavior,
- lighting sources or illumination design,
- visual medium/style identity,
- physical background/environment construction,
- material/surface properties.

## Background schema

Background replaced the old `backgroundStyle` mega-select with independent construction fields:

```text
Background Concept
Background Type
Setting
Spatial Structure
Background Material
Detail Density
Background Elements[]
Extra Details
Custom Override
```

Appropriate structured fields expose a `Custom` choice with a field-local companion text value. Multiple Custom fields may coexist in one Background state without sharing or overwriting one another.

Background presets are editable construction recipes rather than prose bundles. Manual edits detach preset state while preserving the actual structured values.

The dedicated compiler emits one coherent Background block while preserving field ownership. Example validated output:

```text
Background concept: underwater research habitat. Environmental backdrop, set in submerged interior environment, with a layered foreground-to-distance structure, balanced background detail, including machinery, windows, and marine life visible outside the windows as secondary background elements.
```

A state-echo issue discovered during multi-Custom testing was fixed by stabilizing the panel's parent/child model round-trip so locally emitted state is not immediately rehydrated from a stale parent snapshot.

## Effects schema

Effects replaced the old global `effectStyle[] + effectIntensity` model with repeated effect layers:

```text
Effect Layers[]
├── Type
├── Custom Type (when Type = Custom)
├── Intensity
└── Details
```

Each layer owns its own intensity and details. This is essential because independent effects can coexist with different modifiers, for example subtle grain plus strong glitch displacement.

The retained catalog is mechanism-oriented rather than aesthetic-oriented. It includes families such as:

- post-processing,
- analog/damage,
- digital/signal,
- degradation,
- motion/graphic overlays,
- composited scene VFX,
- interface overlays,
- custom effects.

Legacy items that actually belonged to Camera, Lighting, Style, or Background were removed from Effects ownership.

Validated outputs included:

```text
Effects: subtle vignette post-processing with gradual edge darkening; subtle post-processing bloom around bright highlights; restrained added film-grain overlay independent of capture medium.

Effects: strong VHS signal-tracking artifacts; balanced horizontal scanline overlay; balanced added digital signal noise.

Effects: subtle composited light-leak overlay; restrained dust-and-scratch film-damage overlay; balanced RGB channel-split displacement; subtle horizontal scanline overlay.

Effects: balanced HUD interface overlay, faint targeting marks and technical readouts.

Effects: balanced liquid glass distortion.
```

Custom effects use the same per-layer intensity path as built-in effects; no special wording exception is required.

## Boundary decisions

The following ownership decisions are now canonical:

- blur / soft focus / depth-of-field / camera motion behavior → Camera,
- neon illumination / light halo / lighting-native glow → Lighting,
- risograph / screen-print / halftone-as-medium-or-treatment → Style,
- depicted environment / setting / physical backdrop / background structure → Background,
- image-space vignette / signal corruption / added grain / compression artifact / overlay / composited VFX → Effects.

Atmospheric-looking concepts must be classified by mechanism, not by vocabulary alone. A physical/environmental phenomenon belongs to the scene owner; an explicitly composited or image-space overlay belongs to Effects.

## Reusable architecture lesson: repeated modifier-bearing layers

A multi-select plus one global modifier is insufficient when selected items can legitimately need different modifier values.

Canonical question:

> Can two selected items coexist while needing different intensity/details/scope?

If yes, consider repeated structured entities instead of a flat multi-select.

Effects is the canonical example:

```text
grain → subtle
JPEG artifacts → strong
HUD overlay → balanced + custom details
```

The same principle applies to future modules whenever per-item properties are semantically meaningful.

## Real image validation

Background was tested in an image-to-image workflow using a referenced subject and the instruction to replace the original background with the compiled Background module output.

The generated result successfully represented:

- an underwater research habitat,
- a submerged interior,
- layered spatial depth,
- machinery,
- windows,
- marine life beyond the windows.

The test provided practical evidence that the Background construction output is sufficiently explicit without absorbing Camera, Lighting, or Style responsibilities.

## Translation architecture

Background and Effects use module-scoped English and Persian locale fragments registered through `i18n/i18n.config.ts`. This keeps large root locale files from accumulating noisy semantic-module edits while allowing both languages to ship with the module refactor itself.

No translation merge command is required for these module-scoped locale fragments; they load through the normal i18n configuration.

## Legacy migration

Older drafts may still contain legacy keys such as:

```text
backgroundStyle
effectStyle
effectIntensity
```

Those values are not authoritative in the new schemas. Migration should be conservative because many legacy values bundled semantics now owned by Camera, Lighting, Style, Background, or Effects differently.

Legacy migration remains deferred cleanup and does not keep Stage 13 semantically open.

## Closure rule

Do not reopen Background or Effects for wording micro-polish or ordinary image-model variance.

Reopen only when later testing reveals a concrete ownership defect, a reproducible compiler/state failure, or evidence that a retained effect/background concept belongs to another semantic owner.
