# Prompt Semantics Review Backlog

This folder tracks issues discovered during semantic refactors and testing that should not be solved with module-local workarounds.

Items should be removed after they are resolved and verified.

## Framing — legacy draft migration

### Status
Open

### Problem
Older saved/imported drafts may still contain the previous Framing field:

```text
framingStyle
```

The refactored Framing module now uses independent fields such as shot size, placement, balance, composition features, view angle, view direction, and crop safety. Unknown legacy keys can remain in persisted draft module values but no longer contribute to compiled Framing output.

### Why this is not being auto-migrated yet
Some old values map cleanly to the new Framing axes, but others intentionally moved out of Framing ownership:

- Camera-distance / lens-feel values belong to Camera.
- Format / layout-intent values belong to Setup or Layout.
- Cinematic / editorial / graphic composition intent belongs to Style or other visual modules.

Silently guessing cross-module migrations could preserve text while corrupting semantic ownership.

### Required follow-up
Before the semantic-refactor branch is treated as migration-safe for existing user drafts:

1. Define an explicit legacy migration table for values with exact Framing equivalents.
2. Define a preservation policy for removed cross-module values.
3. Run migration when hydrating both local-storage drafts and imported draft JSON.
4. Remove stale `framingStyle` after successful migration.
5. Test old draft round-trip save/export/import behavior.

---

## Camera ↔ Framing — viewpoint semantics embedded in camera presets

### Status
Open

### Problem
The current Camera module still mixes capture-device/lens semantics with framing and viewpoint instructions. Examples include camera presets that imply top-down, frontal, sweeping perspective, close-up capture, or dramatic composition.

The refactored Framing module now owns:

- shot size,
- subject placement,
- frame balance and composition features,
- view angle,
- view direction,
- crop safety.

Camera should not silently redefine those axes.

### Required follow-up
During the Camera semantic refactor:

1. Separate camera body/device intent from lens and depth-of-field behavior.
2. Remove framing/view-angle/view-direction instructions from camera prompt text unless they are intrinsic and unavoidable to the capture device.
3. Avoid composition or aesthetic wording such as `dramatic composition` inside Camera.
4. Test Camera + Framing together to ensure the two modules combine without competing viewpoint instructions.

---

## Module panel — native multi-select UI

### Status
Open

### Problem
Generic `multiSelect` fields currently render with a native HTML `<select multiple>` control. Framing now uses multi-select for Composition Features and Crop Safety, which makes the visual inconsistency more noticeable next to the project component system.

### Required follow-up
Replace the native control with the project dropdown/menu component while preserving:

- multi-value selection,
- subject applicability filtering,
- compatibility sorting and warnings,
- clear/remove behavior,
- mobile behavior,
- existing module field API.
