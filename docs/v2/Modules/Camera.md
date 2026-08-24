# Camera

[← Modules](./Modules.md)

## How this module thinks

Camera describes **capture character**, not composition. Framing decides where the subject sits; Camera decides what kind of imaging system sees it, how that system responds, what optical profile it uses, how deep focus feels, and whether the capture is stable or handheld.

## Camera presets

- Polaroid SX-70
- Kodak Disposable
- Canon AE-1
- Nikon F3
- Pentax K1000
- Leica M6
- Hasselblad 500C/M
- Rolleiflex
- Contax T2
- Lomography
- Canon EOS R5
- Nikon Z8
- Sony A7R IV
- Sony A7S III
- Fujifilm X100V
- Fujifilm GFX 100S
- Leica Q2
- Leica SL2
- Hasselblad X2D
- RED Komodo
- ARRI Alexa
- Blackmagic Pocket Cinema Camera

## Fields

### Capture System

**Generic Digital**
- Full-Frame Digital
- APS-C Digital
- Medium-Format Digital
- Digital Cinema

**Generic Film**
- 35mm Film
- Medium-Format Film
- Instant Film

**Integrated / Fixed Systems**
- Smartphone
- Webcam
- Security Camera
- Action Camera
- Aerial Drone

**Analog Models**
- Polaroid SX-70
- Kodak Disposable
- Canon AE-1
- Nikon F3
- Pentax K1000
- Leica M6
- Hasselblad 500C/M
- Rolleiflex
- Contax T2
- Lomography Compact Film Camera

**Digital Models**
- Canon EOS R5
- Nikon Z8
- Sony A7R IV
- Sony A7S III
- Fujifilm X100V
- Fujifilm GFX 100S
- Leica Q2
- Leica SL2
- Hasselblad X2D
- RED Komodo
- ARRI Alexa
- Blackmagic Pocket Cinema Camera

### Capture Response

- Neutral Digital
- High-Resolution Digital
- Low-Light Digital
- Fujifilm X-Trans Digital
- Medium-Format Digital
- Cinema Digital
- 35mm Film
- Consumer Film
- Medium-Format Film
- Instant Film
- Experimental Film
- Compressed Digital

Capture Response is compatibility-aware relative to Capture System. The system can hint when, for example, a film response is paired with an obviously digital integrated camera.

### Lens Profile

- Macro
- Fisheye
- Ultra Wide
- Wide Angle
- Standard
- Short Telephoto
- Telephoto
- Fixed 23mm Wide-Normal
- Fixed 28mm Wide
- Fixed 38mm
- Simple Fixed Wide
- Integral Instant-Camera Lens
- Twin-Lens Medium-Format Character

Lens Profile also understands obvious fixed-lens/system pairings and can surface mismatch hints.

### Focus Depth

- Shallow
- Moderate
- Deep
- Fixed-Focus Deep
- Critical Focus

### Capture Behavior

- Tripod Stable
- Handheld Subtle
- Handheld Active
- Stabilized
- Fixed Mounted

### Extra Details

For camera-specific nuances not represented by a field.

### Field-level Custom

The current Camera dropdowns do **not** expose field-level Custom entries. Use Extra Details for additive nuance or the module override for a complete replacement.

### Full Custom Override

Available.

## Recipes

### Cheap flash snapshot without calling it “retro”

**Use:**
- Preset → Kodak Disposable
- Capture Response → Consumer Film
- Lens → Simple Fixed Wide
- Focus → Fixed-Focus Deep
- Capture Behavior → Handheld Active
- Lighting → Direct Flash

**Why it works:** the look comes from capture mechanics rather than a vague style adjective.

### Controlled product macro

**Use:**
- Capture System → Medium-Format Digital
- Response → Medium-Format Digital
- Lens → Macro
- Focus → Critical Focus
- Behavior → Tripod Stable

**Why it works:** Camera establishes a believable precision-capture language while Framing and Lighting remain independently editable.

### Security-camera fashion image

**Use:**
- Capture System → Security Camera
- Response → Compressed Digital
- Lens → Wide Angle
- Focus → Deep
- Behavior → Fixed Mounted
- Effects → optional digital noise / scanline layers

**Why it works:** the camera explains the image grammar; Effects can add post/signal artifacts without pretending they came from the lens.

---

**Next:** [Color Palette →](./Color%20Palette.md)