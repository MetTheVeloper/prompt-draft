# Setup

[← Prompt Generator v2](../PromptGenerator%20v2.md)

Setup defines the rules that sit **above individual modules**. Think of it as the production brief before the art departments start working.

A module can describe a camera, hairstyle, material, or lighting rig, but Setup decides the larger context: whether the prompt starts from text or an input image, what kind of subject is being described, what must be preserved from a reference, and what output shape the final image should use.

## Setup blocks

- [Key Modules](./Key%20Modules.md) — choose which visual departments are active.
- [Prompt Type](./Prompt%20Type.md) — choose Text-to-Image or Image-to-Image behavior.
- [Core Context](./Core%20Context.md) — define the idea, subject type, and subject description.
- [Image Reference Settings](./Image%20Reference%20Settings.md) — control how an input image may be reused or transformed. This block appears for Image-to-Image prompts.
- [Output Constraints](./Output%20Constraints.md) — set aspect ratio and prompt-wide rules.

## A useful order of operations

1. Write the **Idea** in plain visual language.
2. Choose the correct **Prompt Type**.
3. Set **Subject Type** when it helps the system understand which controls are relevant.
4. Select only the **Key Modules** that materially matter to the idea.
5. If using an input image, explicitly choose what should be preserved.
6. Finish with aspect ratio and any true global constraints.

You do not need to activate every module. A focused prompt with six meaningful modules is usually easier to control than a prompt with sixteen modules filled only because they exist.

## Setup vs. Modules

A simple test:

- If the instruction describes **the job as a whole**, it probably belongs in Setup.
- If it describes **one visual responsibility**, it probably belongs in a Module.

For example, `9:16 vertical mobile layout` is an output constraint. `low-angle view` belongs in Framing. `Polaroid SX-70` belongs in Camera. `preserve the original identity` belongs in Image Reference Settings.

## Reset and collapse actions

Setup blocks can be collapsed/expanded for a cleaner workspace. Each block also exposes a reset action so you can clear that block without manually undoing every field.

---

**Next:** [Key Modules →](./Key%20Modules.md)