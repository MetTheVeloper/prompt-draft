# Output Constraints

[← Setup](./Setup.md)

Output Constraints defines requirements that should apply to the **final image as a whole**, rather than to one visual module.

## Aspect Ratio

Aspect Ratio is organized by use case so you can choose by destination instead of memorizing numbers.

### Common

- Square — 1:1
- Portrait — 4:5
- Landscape — 5:4
- Portrait — 3:4
- Classic landscape — 4:3
- Photo landscape — 3:2
- Photo portrait — 2:3
- Vertical mobile — 9:16
- Widescreen — 16:9
- Cinematic ultra-wide — 21:9

### Social

- Instagram square post — 1:1
- Instagram portrait feed post — 4:5
- Instagram photo post — 3:4
- Instagram landscape post — 1.91:1
- Instagram Story / Reel — 9:16
- TikTok / YouTube Shorts / Reels — 9:16

### Social Banners

- YouTube thumbnail — 16:9
- YouTube channel banner — 16:9, with central safe-area guidance
- X / Twitter header — 3:1
- Facebook page cover — wide banner composition with responsive safe margins
- LinkedIn cover — 4:1

### ISO Print

Each ISO size is available in portrait (`1:1.414`) and landscape (`1.414:1`):

- A6
- A5
- A4
- A3
- A2
- A1
- A0

### Cards

- Horizontal business card — 7:4
- Vertical business card — 4:7
- Square business card — 1:1
- Horizontal postcard — 3:2
- Vertical postcard — 2:3
- Portrait invitation — 5:7
- Landscape invitation — 7:5
- Square greeting card — 1:1

### Posters / Covers

- Portrait poster — 2:3
- Landscape poster — 3:2
- Portrait poster — 3:4
- Landscape poster — 4:3
- Portrait poster — 4:5
- Landscape poster — 5:4
- Movie poster — 2:3
- Album cover — 1:1
- Book cover — 2:3
- Magazine cover — 3:4

### Web / UI / Ads

- Website hero wide — 16:9
- Website hero ultra-wide — 21:9
- Web banner — 3:1
- Leaderboard ad — 8:1
- Medium rectangle ad — 6:5
- Square ad — 1:1
- App splash portrait — 9:16
- App splash landscape — 16:9

The selected entry contributes not only a numerical ratio but also a useful layout hint—for example, safe-area guidance for a banner or a mobile-oriented description for 9:16.

## Global Rules

Global Rules is for constraints that genuinely belong everywhere in the image and do not have a more specific home.

Useful examples:

- “No logos or watermarks.”
- “Keep all critical content inside a mobile-safe center area.”
- “The final image must be suitable for a clean product catalog.”
- “Do not introduce additional characters.”

Avoid using Global Rules as a second Idea field. If a rule is really a lighting, camera, material, layout, or style decision, the corresponding module gives it a clearer semantic home.

## Example: social campaign poster

- Aspect Ratio → Instagram portrait, 4:5
- Global Rules → “Keep the main title and face inside a center-safe region; no watermarks.”
- Layout → build regions
- Typography → assign title/caption content to those regions
- Framing → choose subject placement independently

This is the key distinction: **Output Constraints defines the canvas-level contract; modules design what happens inside it.**

---

**Next:** [Modules →](../Modules/Modules.md)