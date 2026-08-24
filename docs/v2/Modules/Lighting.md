# Lighting

[← Modules](./Modules.md)

## How this module thinks

Lighting builds a **lighting rig**. Instead of choosing one vague mood, you can create up to three independent light sources, give each a role, source type, direction, quality, intensity, color, and features, then control ambient fill and global contrast.

This is the gaffer’s module.

## Presets

- Soft Diffused
- Natural Window
- Overcast Daylight
- Golden Hour
- Clean Studio
- Beauty Studio
- Softbox Studio
- High Key
- Low Key
- Chiaroscuro
- Moody Side
- Backlit Silhouette
- Spotlight
- Film Noir
- Hard Direct
- Direct Flash
- Top Hard
- Underlight
- Warm / Cool Split
- Blue / Red Split
- Neon Split
- Pastel Soft
- Volumetric Spotlight
- Rim Separation
- Streetlight Night
- Candlelight
- Screen Light
- Firelight
- Fluorescent Interior
- Stage Lighting
- Warm Key + Cool Rim

Applying a preset creates an editable rig.

## Light Source fields

### Role — **Custom supported**

- Key
- Fill
- Rim
- Accent
- Background
- Practical
- Environment
- Custom

### Source Type — **Custom supported**

- Area Light
- Point Light
- Daylight
- Direct Sun
- Overcast Sky
- Window
- Studio Light
- Softbox
- Spotlight
- Direct Flash
- Streetlight
- Candle
- Fire
- Screen
- Fluorescent
- Neon
- Stage Light
- Custom

### Direction — **Custom supported**

- Omnidirectional / Surrounding
- Front
- Camera Left
- Camera Right
- Three-Quarter Left
- Three-Quarter Right
- Back
- Back Left
- Back Right
- Top
- Below
- Custom

### Quality — **Custom supported**

- Very Soft
- Soft
- Balanced / Moderately Defined
- Hard
- Very Hard
- Custom

### Intensity

- Dim
- Low
- Balanced
- Bright
- Intense

### Color

- Neutral
- Warm
- Cool
- Amber
- Blue
- Red
- Magenta
- Cyan
- Green
- Purple
- Pastel
- Custom Color

The Custom Color path is specifically for defining the illumination color, not for replacing the rest of the light source.

### Features — multi-select, **Custom supported**

- Patterned Shadows
- Volumetric Beams
- Halo Backlight
- Silhouette Emphasis
- Custom

## Global Lighting fields

### Ambient Level

- None
- Minimal
- Low
- Balanced
- Bright

### Overall Contrast

- Low
- Balanced
- High
- Extreme

### Extra Details

For rig behavior that does not map cleanly to one source.

### Full Custom Override

Available.

## Recipes

### Ceramic toy with premium edge separation

**Use:**
- Key → Softbox / Three-Quarter Left / Soft / Bright / Neutral
- Fill → Area Light / Camera Right / Very Soft / Low
- Rim → Studio / Back Right / Hard / Balanced
- Ambient → Low
- Contrast → Balanced

**Why it works:** three sources have independent jobs, so the glossy/ceramic surface can read without flattening the form.

### Supermarket horror frame

**Use:**
- Source 1 → Environment / Fluorescent / Top / Hard / Balanced / Cool
- Source 2 → Custom role “failing practical” / Custom source “flickering fluorescent tube at frame rear”
- Ambient → Low
- Contrast → High

**Why it works:** the normal rig remains structured while one custom source provides the story-specific imperfection.

### Neon portrait without a “cyberpunk” style preset

**Use:**
- Accent left → Neon / Camera Left / Hard / Bright / Magenta
- Accent right → Neon / Camera Right / Hard / Bright / Cyan
- Key → Softbox / Front / Soft / Low / Neutral
- Style → choose whatever aesthetic you actually want

**Why it works:** neon becomes a lighting fact, not an accidental global aesthetic.

---

**Next:** [Camera →](./Camera.md)