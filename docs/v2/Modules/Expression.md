# Expression

[← Modules](./Modules.md)

## How this module thinks

Expression treats a face as a combination of **emotion + intensity + visible facial states**, and it can assign that expression to a specific semantic target.

This is more controllable than writing “looks happy” because a subtle smile, narrowed eyes, raised brows, and an exaggerated grin are different visual instructions.

## Assignment workflow

An Expression Assignment can select a preset, refine its axes, add details, and choose the subject/target it belongs to. Multiple target-aware assignments are useful when a scene contains more than one person or character.

## Presets

- Neutral Calm
- Gentle Smile
- Warm Smile
- Joyful
- Determined
- Furious
- Sad Soft
- Shocked
- Sleepy

## Fields inside an expression assignment

### Core Expression — **Custom supported**

- Neutral
- Happy
- Joyful
- Serious
- Determined
- Angry
- Sad
- Melancholic
- Fearful
- Surprised
- Confused
- Disgusted
- Smug
- Curious
- Sleepy
- Custom

### Intensity

- Subtle
- Moderate
- Pronounced
- Exaggerated

No field-level Custom entry.

### Eye State — **Custom supported**

- Relaxed
- Soft
- Narrowed
- Wide
- Squinting
- Closed
- Custom

### Brow State — **Custom supported**

- Relaxed
- Raised
- Furrowed
- Lowered
- Custom

### Mouth State — **Custom supported**

- Neutral
- Slight Smile
- Smile
- Broad Smile
- Smirk
- Frown
- Open
- Gritted Teeth
- Pursed Lips
- Custom

### Additional Details

Use this for small visible behavior such as “one corner of the mouth raised more than the other” or “eyes slightly watery without crying.”

### Target

Choose which semantic subject/entity receives the expression.

### Full Custom Override

Available at module level.

## Recipes

### Confident, not cartoonishly happy

**Use:**
- Core → Custom: “quiet self-assured confidence”
- Intensity → Subtle
- Eyes → Narrowed
- Brows → Relaxed
- Mouth → Slight Smile

**Why it works:** the emotion is custom, while the physical facial cues remain structured.

### Two-person reaction shot

**Person A:**
- Preset → Shocked
- Intensity → Pronounced

**Person B:**
- Core → Smug
- Eyes → Relaxed
- Mouth → Smirk

**Why it works:** target-aware assignments prevent both characters from inheriting the same expression.

### Sleep-deprived editorial portrait

**Use:**
- Core → Sleepy
- Intensity → Moderate
- Eyes → Custom: “heavy half-open eyelids with unfocused gaze”
- Mouth → Neutral
- Extra → “subtle under-eye tension; no smile”

**Why it works:** one custom axis adds specificity without discarding the rest of the facial structure.

---

**Next:** [Pose →](./Pose.md)