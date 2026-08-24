# Key Modules

[← Setup](./Setup.md)

Key Modules decides which visual systems participate in the compiled prompt.

This is not a checklist of features you are supposed to turn on. It is closer to choosing which departments are needed on a production. If the idea does not care about typography, Typography does not need a seat at the table. If the image depends heavily on a particular material transformation, Texture/Material absolutely does.

## Available modules

- Variables
- Layout
- Style
- Form
- Framing
- Expression
- Pose
- Hair
- Outfit
- Background
- Lighting
- Camera
- Color Palette
- Typography
- Effects
- Texture / Material

See [Modules](../Modules/Modules.md) for the full guide.

## How to choose

Choose a module when at least one of these is true:

- The idea depends on that visual decision.
- You want repeatable control over that decision instead of leaving it to the model.
- Another module needs to target an entity exposed by it—for example, assigning material/color to a specific outfit or hair component.
- You expect to iterate on that decision independently later.

## Examples

### Clean product hero image

A useful stack might be:

- Form
- Framing
- Background
- Lighting
- Camera
- Color Palette
- Texture

You probably do not need Pose, Hair, or Typography unless the concept calls for them.

### Illustrated fashion poster

A useful stack might be:

- Layout
- Style
- Form
- Pose
- Hair
- Outfit
- Color Palette
- Typography
- Effects

### Reference-based portrait transformation

A useful stack might be:

- Style
- Form
- Framing
- Expression
- Pose
- Hair
- Outfit
- Lighting
- Camera

Then use **Image Reference Settings** to decide whether identity, pose, outfit, composition, or other source-image traits must survive.

## Practical rule

Select modules because they add **intent**, not because they add length. The system is modular so you can be precise without making every prompt maximal.

---

**Next:** [Prompt Type →](./Prompt%20Type.md)