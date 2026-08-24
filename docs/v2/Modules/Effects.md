# Effects

[← Modules](./Modules.md)

## How this module thinks

Effects adds **post-processing, signal artifacts, overlays, motion graphics, and scene VFX** as explicit layers. This keeps effects separate from capture mechanics and from the base visual style.

For example, Camera can say the image was captured digitally while Effects adds synthetic film grain. That distinction is intentional.

## Presets

- Subtle Post Finish
- Analog Damage
- Digital Glitch
- VHS Signal
- Degraded Digital
- Motion Graphic
- Magical VFX
- HUD Interface

A preset creates editable effect layers.

## Effect Layers

Up to **8 layers** can be combined. Each layer has an Effect Type, Intensity, and optional details.

### Effect Type

**Post Processing**
- Vignette
- Highlight Bloom
- Added Film Grain
- Synthetic Chromatic Fringing

**Analog Damage**
- Light Leak Overlay
- Dust and Scratches Overlay
- Film Burn Overlay

**Digital Signal**
- Glitch Displacement
- RGB Channel Split
- Datamosh Artifacts
- Pixel Sorting
- Scanlines
- Digital Noise
- VHS Signal Artifacts
- Signal Warping

**Degradation**
- JPEG Compression
- Pixelation
- Color Banding

**Motion Graphic**
- Speed Lines
- Motion Trails

**Scene VFX**
- Floating Particles
- Magical Particles
- Sparkle Overlay
- Energy Aura

**Interface Overlay**
- HUD Overlay
- Data Readout Overlay

**Custom**
- Custom Effect — opens a scoped custom effect description for that layer.

### Intensity

- Subtle
- Restrained
- Balanced
- Strong
- Extreme

### Layer Details

Use for effect-specific direction such as where the effect appears, how irregular it should be, or whether it should avoid a face/product label.

## Extra Details

Module-wide effects guidance.

## Full Custom Override

Available.

## Recipes

### “Bad JPEG” as an intentional design layer

**Use:**
- Layer 1 → JPEG Compression / Strong
- Layer 2 → Color Banding / Restrained
- Layer 3 → Custom: “occasional corrupted thumbnail blocks near the frame edge only”

**Why it works:** the underlying image can remain cleanly photographed while degradation is explicitly composited afterward.

### Manga-speed product ad

**Use:**
- Speed Lines → Strong
- Motion Trails → Restrained
- Extra Details → “effects radiate behind the product and never cross the logo area”

**Why it works:** graphic motion is treated as an overlay, not confused with actual camera motion.

### Quiet analog imperfection

**Use:**
- Vignette → Subtle
- Added Film Grain → Restrained
- Light Leak → Subtle
- Camera → choose any capture system you actually want

**Why it works:** the finishing layer can evoke analog artifacts without falsely redefining the camera.

---

**Next:** [Texture / Material →](./Texture.md)