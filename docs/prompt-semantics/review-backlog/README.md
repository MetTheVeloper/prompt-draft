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

## Camera — legacy `cameraStyle` migration

### Status
Open

### Problem
The Camera semantic refactor replaced the old `cameraStyle` mega-select with independent fields:

```text
captureSystem
captureResponse
lensProfile
focusDepth
captureBehavior
```

Specific camera names now act as editable state presets rather than prose options. Older saved/imported drafts may still contain only `cameraStyle`, which no longer contributes to compiled Camera output.

### Exact legacy concepts that can be migrated later
Several old values have direct semantic destinations, for example:

- macro / fisheye / wide / ultra-wide / telephoto values → `lensProfile`
- shallow DOF / deep focus → `focusDepth`
- handheld camera → `captureBehavior`
- specific analog/digital camera models → the corresponding Camera preset / capture system

### Values requiring explicit policy
Some legacy values bundled Camera semantics with Framing, Style, or contextual assumptions, including documentary/cinematic camera, security camera, webcam, smartphone, action camera, and aerial drone wording.

The new Camera module intentionally does not restore old top-down, frontal, dramatic-composition, or generic aesthetic assumptions merely to preserve text.

### Required follow-up
Before the semantic-refactor branch is treated as migration-safe for existing user drafts:

1. Define a legacy `cameraStyle` migration table for exact one-axis mappings.
2. Decide how to preserve or discard polluted legacy semantics without silently changing Framing or Style.
3. Run migration during both local-storage hydration and imported JSON hydration.
4. Remove stale `cameraStyle` after successful migration.
5. Test old Camera drafts across save/export/import round trips.

---

## Lighting — legacy `lightingStyle` migration

### Status
Open — deferred migration task; the new Lighting semantic schema itself is closed.

### Problem
The Lighting semantic refactor replaced the old `lightingStyle` mega-select with a structured multi-source rig:

```text
lightSources[]
ambientLevel
overallContrast
```

Each source independently stores role, source type, direction, quality, intensity, light color, and lighting-native features. Older drafts can still contain only `lightingStyle`, which no longer maps one-to-one to the new schema.

### Exact concepts that can be migrated later
Several old values have clean Lighting destinations or preset equivalents, for example:

- soft diffused / window / overcast / studio / softbox lighting → Lighting presets,
- top light / underlight / side light / backlight → source direction,
- hard / soft lighting → source quality,
- direct flash → source type + direction + quality/intensity recipe,
- warm / cool / neon / dual-tone lighting → source color recipes,
- rim / edge / separation lighting → source role / source-local features,
- high-key / low-key / chiaroscuro → global contrast + source recipes.

### Values requiring explicit policy
Several old Lighting values bundled illumination with concepts now owned elsewhere:

- fog / mist / smoke / dust / rain content → Background / Effects,
- bloom and post-process glow → Effects,
- glossy / reflective surface assumptions → Texture,
- cinematic / anime / comic / painterly / claymation style assumptions → Style,
- product / commercial / portrait use-case wording → purpose/context rather than Lighting.

Automatic migration must not reintroduce these removed assumptions merely to preserve old prose.

### Required follow-up
Before the semantic-refactor branch is treated as migration-safe for existing user drafts:

1. Define a legacy `lightingStyle` → preset/field migration table for clean values.
2. Define an explicit discard/preservation policy for cross-module pollution.
3. Run migration during local-storage and imported JSON hydration.
4. Remove stale `lightingStyle` after successful migration.
5. Test old Lighting drafts across save/export/import round trips.

---

## Module panel — native multi-select UI

### Status
Open

### Problem
Generic `multiSelect` fields currently render with a native HTML `<select multiple>` control. Framing now uses multi-select for Composition Features and Crop Safety, and Lighting source features intentionally follow the same convention so all of them can migrate together when the project gets a custom multi-select component.

### Required follow-up
Replace the native control with the project dropdown/menu component while preserving:

- multi-value selection,
- subject applicability filtering,
- compatibility sorting and warnings,
- clear/remove behavior,
- mobile behavior,
- existing module field API.
