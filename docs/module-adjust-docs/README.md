# Prompt Draft — Module Adjustment Reference

This directory is the authoritative AI-facing guide for recommending Prompt Draft module settings from a natural-language idea.

Repository: https://github.com/MetTheVeloper/prompt-draft
Branch: `main`
Runtime source of truth: `app/modules/registry.ts` and the module source files under `app/modules/`.

## Goal

Given an idea such as:

> Configure the Style module for “a photographed image of an ancient clay sculpture”.

an assistant must return settings using **real Prompt Draft module fields and real selectable values only**. It must not invent field ids, presets, option values, or capabilities.

## Mandatory workflow for an assistant

1. Read this file.
2. Read the relevant file under `docs/module-adjust-docs/modules/`.
3. Read the referenced current source file(s) on `main` before giving a recommendation whenever exact built-in choices matter.
4. Translate the user's creative intent into the smallest useful set of real field assignments.
5. Prefer a built-in option when it accurately expresses the intent.
6. When no suitable built-in option exists and that field supports field-level custom input, use **Custom by field** and provide the exact custom value/text for that field.
7. Do **not** use a module-wide/global custom override by default. A module override (`isOverride: true`, normally compiled via `overrideField`) replaces the normal structured output and is therefore a last resort.
8. Never recommend custom-by-field on a field that does not support it in the current module implementation.
9. Never infer an option merely because it sounds plausible. If it is not in the current code/catalog, it is not a built-in Prompt Draft option.
10. If docs and code differ, current code on `main` wins; mention the mismatch and follow the code.

## Custom policy

### Preferred order

1. **Built-in option** — first choice when semantically correct.
2. **Custom by field** — strongly preferred when the needed value is absent from built-ins and the field supports a custom/freeform value.
3. **Global custom override** — discouraged; use only when the module cannot represent the requested concept through its structured fields.

### What counts as field-level custom

The implementation may expose field-level custom in different ways, including:

- a `customInput` declaration on a normal field;
- a `custom` / freeform option injected by a `*.freeform.ts` wrapper;
- a structured editor with companion custom fields (for example typography text groups);
- a catalog/editor that explicitly supports custom values.

Always inspect the referenced source before assuming support.

### Custom text style

All assistant-written values for custom/freeform inputs must be **as short, direct, and information-dense as possible**.

- Prefer compact prompt phrases and high-signal keywords over explanatory prose.
- Remove repetition, rationale, filler, and concepts already expressed by other fields/modules.
- Preserve only details that materially constrain the generated result.
- Nested structure is fine when it improves clarity, but each nested item must remain brief and direct.
- Do not turn a custom field value into a paragraph when a concise phrase or short clause can express the same intent.

## Required response format

For a request to configure a module, answer field-by-field:

| Field | Value | Mode | Why |
| --- | --- | --- | --- |
| `<real field id>` | `<real option value or exact custom text>` | `Built-in` / `Custom by field` | concise reason tied to the idea |

Then add only when useful:

- **Leave unset:** real fields that should intentionally remain empty/default.
- **Compatibility note:** conflicts, applicability constraints, or dependencies encoded in module metadata.
- **Override:** normally `Do not use`.

Do not output imaginary UI labels as if they were persisted values. When a built-in choice is used, prefer the actual option `value` defined in code; a human-friendly label/prompt meaning may be added in parentheses.

## Registered modules

Current registry order:

1. `variables`
2. `layout`
3. `scene`
4. `style`
5. `form`
6. `framing`
7. `expression`
8. `pose`
9. `hair`
10. `outfit`
11. `background`
12. `lighting`
13. `camera`
14. `colorPalette`
15. `typography`
16. `effects`
17. `texture`

Corresponding reference files live in `docs/module-adjust-docs/modules/`.

## Source rule

These docs are guidance and a navigation layer, not a replacement for the executable definitions. The exact current option inventory, defaults, custom behavior, compatibility metadata, structured-editor config, presets, and compile order are defined by the referenced `app/modules/*` files on `main`.

When answering a user, accuracy is more important than filling every field. Configure only fields that materially help express the idea.