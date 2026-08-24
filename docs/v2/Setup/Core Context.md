# Core Context

[← Setup](./Setup.md)

Core Context tells the system **what the image is fundamentally about** before individual modules start art-directing it.

## Idea

**Idea** is the broad creative instruction. Write it the way you would brief another visual artist: concrete enough to establish the concept, but do not cram every camera, lighting, material, or typography decision into it if dedicated modules will handle those decisions.

### Good examples

- “Turn the input person into a collectible desk toy while preserving their recognizable identity.”
- “A surreal editorial image of a chair growing like a coral organism.”
- “A typographic event poster where the title behaves like inflated architecture.”

## Subject Type

Subject Type helps the system understand what kind of thing it is dealing with. Some module options are subject-aware, so this choice can improve relevance and compatibility hints.

### Options

- Unspecified
- Person
- Object
- Animal
- Building
- Product
- Vehicle
- Scene
- Typography
- Abstract
- Custom

Choose **Unspecified** when the idea is mixed or the type does not materially help. Choose **Custom** when none of the standard types describes the subject well enough.

## Subject / Subject Description

The Subject field gives the primary subject a direct description or reference. It can be short—`a ceramic espresso maker`—or specific—`a compact two-person lunar rover with exposed suspension and a transparent cabin`.

When the interface can infer a generated subject context, that fallback can participate in the prompt instead of forcing you to repeat the same information manually.

## Idea vs. Subject

A useful distinction:

- **Subject:** what the central thing *is*.
- **Idea:** what you want to *do with it* or what concept the image should communicate.

### Example

**Subject:** “a black domestic cat”  
**Idea:** “reimagine the cat as the stern captain of a tiny retro-futurist submarine.”

Form, Outfit, Background, Lighting, Camera, and other modules can then elaborate without forcing the Idea field to become a full prompt.

## Custom Subject

If Subject Type is **Custom**, make sure the accompanying description actually says what the custom subject is. An empty custom subject cannot give downstream modules useful semantic context.

---

**Next:** [Image Reference Settings →](./Image%20Reference%20Settings.md)