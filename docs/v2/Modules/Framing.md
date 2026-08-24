# Framing

[← Modules](./Modules.md)

## How this module thinks

Framing decides **how the subject is encountered inside the frame**: how much is visible, where it sits, what angle we see it from, how the composition balances, and what must remain safely uncropped.

It does not choose a lens model—that is Camera—and it does not divide a poster into semantic regions—that is Layout.

## Fields and options

### Shot Size

- Detail
- Extreme Close-Up
- Close-Up
- Head and Shoulders *(person-aware)*
- Bust *(person-aware)*
- Medium Subject
- Three-Quarter Subject
- Full Subject
- Wide Full Subject

### Subject Placement

- Centered
- Off-Center
- Rule of Thirds
- Upper Frame
- Lower Frame
- Edge-Weighted

### Balance

- Symmetrical
- Asymmetrical

### Composition Features — multi-select

- Negative Space
- Dynamic Diagonal
- Layered Depth
- Isolated Subject

### View Angle

- Eye Level
- Low Angle
- High Angle
- Top Down
- Worm’s-Eye
- Bird’s-Eye

### View Direction

- Frontal
- Three-Quarter
- Profile
- Rear

### Crop Safety — multi-select

- Important Details
- Face
- Hands
- Silhouette
- Safe Margin

Crop Safety understands the current Shot Size and can warn when a request is awkward—for example, demanding complete hands inside a very tight portrait crop or preserving a full silhouette inside a close-up.

### Extra Details

For framing instructions outside the catalog.

### Field-level Custom

The current Framing dropdowns do **not** use field-level Custom entries. Use Extra Details for additive nuance or the full override when the entire framing description needs to be replaced.

### Full Custom Override

Available.

## Recipes

### Premium perfume ad with breathing room

**Use:**
- Shot Size → Wide Full Subject
- Placement → Off-Center
- Balance → Asymmetrical
- Features → Negative Space, Isolated Subject
- View Angle → Eye Level
- Crop Safety → Silhouette, Safe Margin

**Why it works:** the composition makes room for later typography without asking Layout to fake camera framing.

### Aggressive sneaker campaign

**Use:**
- Shot Size → Medium Subject
- Placement → Lower Frame
- Features → Dynamic Diagonal
- View Angle → Low Angle
- View Direction → Three-Quarter
- Crop Safety → Important Details

**Why it works:** the subject feels dominant before Camera even chooses optical character.

### Editorial portrait with hands

**Use:**
- Shot Size → Three-Quarter Subject
- Placement → Rule of Thirds
- Crop Safety → Face + Hands
- Extra Details → “leave intentional headroom for a small masthead”

**Why it works:** Crop Safety protects the storytelling details that are easy for generative framing to sacrifice.

---

**Next:** [Expression →](./Expression.md)