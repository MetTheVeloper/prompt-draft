# Output

[← Prompt Generator v2](../PromptGenerator%20v2.md)

The Output panel is where the structured setup and module state becomes something you can inspect, validate, copy, and send to an image-capable model.

## Output formats

### Modular

Keeps the system’s modular organization explicit. This is the clearest format for inspecting what each module contributes and for preserving the wiring between responsibilities.

Use it when you want the interpreter to see the prompt as a structured visual specification.

### Natural

Compiles the same intent into a more natural-language presentation. It is useful when you want a less visibly system-like prompt while retaining the content produced by Setup and Modules.

### JSON

Presents the compiled prompt state in a structured machine-readable form. This is useful for inspection, interchange, debugging workflows, or systems that prefer structured input.

## Validation states

The panel can be in four practical states:

- **Ready** — output exists and there are no blocking errors.
- **Warning** — output can still be useful, but the system found something worth reviewing.
- **Error** — a blocking issue prevents safe copy of the compiled output.
- **Empty** — there is not yet meaningful output to show.

Warnings are collapsed by default so common authoring-time notices do not dominate the workspace. Errors stay visible.

## What validation can catch

Current validation includes cases such as:

- No modules selected
- A full module Custom Override is enabled but empty
- Text-to-Image is missing enough core context
- Custom Subject is selected but not described
- Idea is empty where required
- A referenced variable is undefined
- A defined variable is currently unused
- Preserve Composition conflicts with Framing changes
- Preserve Materials conflicts with Texture/Material changes
- Preserve Pose conflicts with Pose changes

These checks do not try to judge whether your art direction is “good.” They catch structural contradictions and missing inputs that can make an otherwise good idea harder for a model to interpret.

## Copy behavior

The output can be copied directly from the panel. Copy is disabled when:

- there is no compiled output, or
- a blocking validation error exists.

That behavior is deliberate: warnings invite review, while errors indicate that the specification is structurally incomplete or contradictory.

## A recommended final check

Before copying:

1. Confirm the intended output format.
2. Expand warnings and decide whether each one is intentional.
3. Scan the final prompt for accidental global instructions that should have been scoped to a module or target.
4. Check Image Reference preservation rules against Pose, Framing, Material, and other transformation modules.
5. Copy only when the compiled prompt represents the visual brief you actually want—not merely when every field is filled.

---

**Back to:** [Prompt Generator v2](../PromptGenerator%20v2.md)