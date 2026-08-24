# Pose

[← Modules](./Modules.md)

## How this module thinks

Pose describes **body configuration and action**, not merely a named gesture. It can combine base posture, torso behavior, weight distribution, tension, locomotion, gestures, and interaction details, then assign that package to a specific target.

## Presets

- Neutral Standing
- Relaxed Standing
- Arms-Crossed Standing
- Hand on Hip
- Relaxed Seated
- Forward Seated
- Walking
- Running
- Action Ready

## Fields inside a pose assignment

Every axis below has a field-level **Custom** entry in v2.

### Base Posture — **Custom supported**

- Standing
- Seated
- Kneeling
- Crouching
- Reclining
- Lying Down
- Custom

### Torso Posture — **Custom supported**

- Upright
- Leaning Forward
- Leaning Backward
- Leaning Sideways
- Hunched
- Twisted
- Arched
- Custom

### Weight Balance — **Custom supported**

- Even
- Shifted
- Single-Side Support
- Off-Balance
- Custom

### Body Tension — **Custom supported**

- Relaxed
- Engaged
- Tense
- Rigid
- Loose
- Custom

### Locomotion — **Custom supported**

- Walking
- Running
- Jumping
- Custom

### Gestures — multi-select, **Custom supported**

- Arms Crossed
- Hands at Sides
- Hand on Hip
- Hands in Pockets
- Open Arms
- Pointing
- Reaching
- Raised Arms
- Hands on Knees
- Hands Clasped
- Custom

### Interaction Details

Describe what the body is doing *with something else*: “left hand gripping the bicycle handlebar,” “shoulder leaning against the wall,” “both hands supporting the box from below.”

### Additional Details

For pose nuance outside the normal axes.

### Target

Choose which semantic subject/entity receives the pose.

### Full Custom Override

Available at module level.

## Reference-image warning

When Image Reference Settings says **Preserve Pose**, a contradictory Pose assignment can be flagged. That is intentional: the system asks you to choose whether the reference pose or the new pose should win.

## Recipes

### Fashion stance with believable asymmetry

**Use:**
- Base → Standing
- Torso → Custom: “subtle S-curve through shoulders and hips”
- Weight → Shifted
- Tension → Relaxed
- Gesture → Hand on Hip

**Why it works:** one custom posture nuance sits inside a predictable body-state structure.

### Mid-air cartoon action

**Use:**
- Base → Custom: “airborne with knees pulled unevenly toward the torso”
- Torso → Twisted
- Weight → Off-Balance
- Tension → Engaged
- Locomotion → Jumping
- Gesture → Raised Arms

**Why it works:** the system can express an unusual action without requiring a monolithic pose paragraph.

### Person interacting with a product

**Use:**
- Base → Seated
- Torso → Leaning Forward
- Tension → Engaged
- Interaction Details → “right hand pinching the product by its top edge; left forearm resting on the knee”

**Why it works:** generic posture and precise contact behavior are separated.

---

**Next:** [Hair →](./Hair.md)