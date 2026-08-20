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

## Texture / Material — legacy global field migration and catalog extraction

### Status
Open — migration/catalog cleanup only. Stage 11's new relational Texture / Material schema is semantically closed and validated.

### Problem
The previous Texture module stored one global material/surface description across fields such as:

```text
material
surface
detailLevel
imperfections
```

Stage 11 replaced that global model with repeated `materialAssignments[]`, where each assignment contains orthogonal material/surface properties plus semantic targets and exceptions. Existing saved/imported drafts may still contain only the old global fields.

The old `texture.module.ts` also contains a large useful material catalog. The refactored module temporarily imports that legacy module only as a catalog source while the registered implementation lives in `texture.semantic.ts`.

The new schema has already passed editor, Modular/Natural and real image-generation validation. This backlog item must not be interpreted as an open semantic-design question.

### Exact concepts that can migrate later
Several old values map cleanly:

- `material` → assignment `material`,
- matte / glossy / high-gloss surface values → `finish`,
- smooth / brushed / rough / porous / grainy / fibrous / woven → `surfaceTexture`,
- translucent / frosted → `opticalCharacter`,
- subtle / visible / rich / highly-detailed detail levels → `textureProminence` where a conservative mapping is justified,
- scratches / cracks / dents / chips / dust / weathering / stains / fading / wrinkles / peeling / corrosion → `conditions`.

A legacy global Texture description can generally migrate to one assignment targeting `All Scene Surfaces`, but the migration must be explicit and versioned rather than inferred ad hoc during normal editing.

### Values requiring policy
Some old values were semantically misplaced or bundled multiple axes:

- `brush_marks` belongs to Surface Texture / surface treatment,
- `roughness` belongs to Surface Texture rather than imperfections,
- `paint_splatter` is closer to Effects/decorative treatment than material condition,
- the old `painterly_surface` preset mixed Style semantics with plastic material assumptions,
- the old non-empty default `material: vinyl` must not be recreated in the new schema.

### Required follow-up

1. Define and test a legacy global-field → one-assignment migration table.
2. Apply migration during local-storage and imported JSON hydration.
3. Extract the material catalog from legacy `texture.module.ts` into a neutral catalog file.
4. Remove the legacy module implementation once catalog extraction and migration are verified.
5. Test legacy draft save/export/import round trips and remove this backlog item after migration is verified.

---

## Pose / Expression — legacy mega-select migration

### Status
Open — migration only. Stage 12's relational Pose / Expression schema should not be reopened to preserve polluted legacy prose.

### Problem
Older drafts can still contain the previous global fields:

```text
poseStyle
expressionStyle
extraDetails
```

Stage 12 replaces those global mega-selects with repeated subject-scoped `poseAssignments[]` and `expressionAssignments[]`. Each assignment targets the system `{subject}` or one or more user variables whose type is `subject`.

The old options frequently bundle several independent axes and cross-module assumptions. Examples include editorial/fashion pose, heroic or shy body-language interpretation, cinematic/editorial expression, cute/chibi styling, fantasy/creature styling, professional/commercial use cases, and scenario assumptions such as battle-ready or protest-driven expression.

### Exact concepts that can migrate later
Some legacy concepts have clean destinations when converted to state recipes rather than prose:

- standing / seated / kneeling / crouching / reclining → Pose `basePosture`,
- leaning / twisting / upright posture → Pose `torsoPosture`,
- weight shift / off-balance → Pose `weightBalance`,
- relaxed / tense physical state → Pose `bodyTension`,
- walking / running / jumping → Pose `locomotion`,
- arms crossed / hand on hip / hands in pockets / pointing / reaching → Pose `gestures`,
- neutral / happy / serious / angry / sad / surprised and similar affect → Expression `coreExpression`,
- subtle / pronounced / exaggerated → Expression `intensity`,
- wide / narrowed / relaxed eyes → Expression `eyeState`,
- raised / furrowed brows → Expression `browState`,
- smile / smirk / frown / open mouth / gritted teeth → Expression `mouthState`.

### Values requiring policy
Migration must not recreate removed semantic leakage:

- Pose does not own viewpoint, framing, fashion/editorial style, personality, or narrative role.
- Expression does not own cinematic/editorial/cute/fantasy style, commercial purpose, character archetype, or scene narrative.
- Legacy global `extraDetails` cannot be assigned safely to one subject when a new draft contains multiple subject assignments.

### Required follow-up

1. Define conservative `poseStyle` and `expressionStyle` → assignment recipe migration tables.
2. Decide whether a legacy global value should target only system `{subject}` or require user review when multiple subject variables exist.
3. Define an explicit policy for legacy global `extraDetails`.
4. Run migration during local-storage and imported JSON hydration.
5. Remove stale legacy keys after successful migration and test save/export/import round trips.
