# Stage 09 — Lighting Semantics

## Status
Implemented on `refactor/prompt-semantics`; pending local build and compiled-output validation before semantic closure.

## Product intent
Lighting is a broadly applicable module rather than a realism-only control. It should work for photographic, cinematic, product, stylized, cartoon, illustrated, clay/miniature, abstract, and other image-generation workflows whenever illumination is meaningful.

Lighting defines how the scene is illuminated. It does not decide how the result is captured by a camera or what visual style the scene uses.

Canonical boundary:

```text
Camera   → how an already-lit view is recorded
Lighting → how the scene itself is illuminated
```

## Ownership
Lighting owns:

- explicit light sources,
- source role,
- source type,
- light direction,
- light quality / softness-hardness,
- source intensity,
- illumination color,
- lighting-native features such as patterned shadows and visible volumetric beams,
- global ambient-fill level,
- global light-shadow contrast.

Lighting does not own:

- camera body, sensor/film response, lens behavior, or capture stability — Camera,
- view angle, view direction, crop, subject placement, or composition — Framing,
- the base color palette of objects/surfaces/image — Color Palette,
- material gloss, roughness, reflectivity, or surface identity — Texture,
- fog/smoke/dust/rain as scene content — Background / Effects,
- bloom, post-process glow, lens flare, or photographic overlays — Effects,
- artistic medium/style such as anime, claymation, painterly, or comic-book rendering — Style,
- scene/environment content — Background / Setup.

## Why the old schema was replaced
The old `lightingStyle` field was a mega-select that mixed independent axes:

```text
source
+ direction
+ quality
+ intensity
+ contrast
+ color
+ shadow behavior
+ subject separation
+ atmosphere
+ environment
+ artistic style
+ mood
+ post effects
```

Many old options were mini-prompts rather than one semantic choice. This prevented combinations such as a blue camera-right light plus a red camera-left light without inventing another bundled preset.

## Multi-source model
Lighting now supports up to three independent light sources.

The cap is intentional. It covers common key/fill/rim, dual-color, practical-plus-key, and three-light studio setups without turning Prompt Draft into an unrestricted lighting-rig simulator.

Each source keeps its own semantic relationship intact:

```text
Light Source
├─ Role
├─ Source Type
├─ Direction
├─ Quality
├─ Intensity
├─ Light Color
└─ Lighting Features
```

Example:

```text
Source 1
Role       → Accent
Type       → Studio Light
Direction  → Camera Left
Quality    → Soft
Intensity  → Balanced
Color      → Red

Source 2
Role       → Accent
Type       → Studio Light
Direction  → Camera Right
Quality    → Soft
Intensity  → Balanced
Color      → Blue
```

The compiler keeps the properties of each source in a self-contained clause and separates light sources with semicolons so color/direction relationships are not flattened into an ambiguous global list.

## Global lighting controls
Two controls intentionally remain scene-global rather than being repeated inside every source:

### Ambient Level
Defines broad scene fill independent from explicit source intensity.

### Overall Contrast
Defines the scene-wide relationship between lit and shadow regions.

This keeps per-source configuration focused on source properties and avoids pretending that overall contrast is an independent property of each lamp.

## Light source axes

### Role
Current roles:

```text
Key
Fill
Rim
Accent
Background
Practical
Environment
```

Role describes what the source contributes to the lighting setup. It does not imply subject pose or composition.

### Source Type
Includes generic and practical illumination sources such as:

```text
Area Light
Point Light
Daylight
Direct Sunlight
Overcast Sky
Window Light
Studio Light
Softbox
Spotlight
Direct Flash
Streetlight
Candlelight
Firelight
Screen Light
Fluorescent Light
Neon Light
Stage Light
```

Flash is Lighting-owned. Camera owns capture behavior; the flash is an illumination source.

### Direction
Direction is relative to the camera/frame where useful:

```text
Front
Camera Left
Camera Right
Three-Quarter Left / Right
Back
Back Left / Right
Top
Below
Surrounding / Ambient
```

Lighting direction is independent from Framing viewpoint. The camera may see the subject from one direction while illumination arrives from another.

### Quality

```text
Very Soft / Diffused
Soft
Moderately Defined
Hard / Directional
Very Hard / Crisp
```

### Intensity

```text
Dim
Low
Balanced
Bright
Intense
```

Source intensity does not equal camera exposure and does not silently change Camera settings.

### Light Color
Lighting color defines illumination color rather than the object's or image's base palette.

Structured values include neutral, warm, cool, amber, blue, red, magenta, cyan, green, purple, pastel, plus a custom color value.

### Lighting Features
Current source-local features are intentionally limited to illumination-native behavior:

```text
Patterned Shadows
Volumetric Light Beams
Backlight Halo
Silhouette Emphasis
```

Visible beams are Lighting-owned; the fog/smoke/dust that could make beams visible is not automatically created.

## Preset model
Old useful lighting concepts were preserved primarily as editable state recipes rather than mega-select prose bundles.

Examples include:

```text
Soft Diffused
Natural Window Light
Overcast Daylight
Golden Hour
Clean Studio
Beauty Studio
High Key
Low Key
Chiaroscuro
Direct Flash
Backlit Silhouette
Warm / Cool Split
Blue / Red Split
Neon Split
Volumetric Spotlight
Key + Rim Separation
Streetlight
Candlelight
Screen Light
Firelight
Fluorescent Interior
Stage Lighting
Warm Key + Cool Rim
```

Presets populate source arrays and global controls. Every source remains editable afterward, and manual edits detach the active preset through the normal preset lifecycle.

## Removed semantic pollution
The refactor intentionally removes or relocates old wording that injected:

- `professional`, `premium`, `commercial`, `cinematic`, `dramatic`, or mood filler when not itself a selected lighting decision,
- portrait/product use-case assumptions,
- anime/comic/claymation/painterly style ownership,
- glossy or reflective surface assumptions,
- rain/wet-surface scene content,
- fog/mist/smoke/dust as automatically created environmental content,
- bloom/post-processing behavior,
- poster-like or graphic-purpose language.

Useful lighting mechanics inside those old options were retained through source/global fields or presets.

## Neighbor-module findings

### Color Palette
Color Palette currently contains some wording such as warm highlights, cool shadows, or amber light. Lighting now owns illumination color. Color Palette should be cleaned during the upcoming Color Palette + Texture stage rather than compensating inside Lighting.

### Texture
Lighting may reveal glossy or reflective material behavior, but it does not define the material as glossy/reflective. Surface behavior remains Texture-owned.

### Effects / Background
Bloom, fog, mist, dust, rain, and similar scene/post-process concepts were not carried into Lighting merely because old lighting presets mentioned them. Their ownership will be audited during the Background + Effects stage.

## Compiler strategy
Lighting has a dedicated semantic compiler in:

```text
app/utils/compileLighting.ts
```

Light-source clauses are compiled independently and joined with semicolons, followed by global ambient, contrast, and optional extra details.

The dedicated Lighting panel calls this compiler directly so the structured source array never needs to be flattened into editor-only strings.

## UI strategy
Lighting uses a dedicated panel editor because the generic module panel currently has no repeated structured `lightSources` field renderer.

The panel preserves the existing module workflow:

- presets,
- editable module state,
- active-preset detachment after manual edits,
- collapsed module preview,
- compiled output preview/copy,
- clear/remove actions,
- custom full override.

`LightSourcesField.vue` provides the repeatable source cards with a hard maximum of three sources.

## Translation workflow
English semantic copy is maintained in:

```text
scripts/i18n-patches/en.lighting-semantics.ts
```

The patch is registered in:

```text
scripts/i18n-patches/fa.semantic-refactor.todo.ts
```

## Legacy state
Older drafts can contain:

```text
lightingStyle
```

No automatic migration is performed in this stage. The old values contain both clean lighting concepts and cross-module pollution, so migration requires an explicit mapping policy.

This is tracked in the semantic review backlog.

## Validation required before closure

1. Apply the English i18n patch.
2. Run `pnpm generate`.
3. Verify neutral Lighting emits no Lighting output.
4. Verify one manually created source compiles all selected source properties together.
5. Verify two-source red/blue split keeps red associated with camera-left and blue with camera-right in Modular output.
6. Verify the same red/blue relationships survive Natural optimization.
7. Verify three-source High Key remains complete in Modular and Natural output.
8. Verify source add/remove is capped at three and preserves remaining source state.
9. Verify preset selection populates source cards and global controls.
10. Verify manual source edits detach the active preset.
11. Verify switching presets does not leave stale sources from the previous preset.
12. Verify custom light color compiles without changing Color Palette state.
13. Verify Direct Flash does not introduce Camera capture semantics.
14. Verify Volumetric Spotlight does not automatically add fog/smoke/dust scene content.
15. Verify Lighting + Camera produces no duplicate capture/illumination ownership.
16. Verify Lighting + Framing allows independent camera viewpoint and light direction.
17. Verify Lighting + Texture does not redefine material gloss/reflectivity.
18. Verify Lighting + Color Palette keeps illumination color and base palette independently understandable.

## Closure
Do not mark Lighting semantically closed until the validation list and `pnpm generate` pass.
