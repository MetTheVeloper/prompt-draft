# Stage 16 — Typography Semantics

## Status

**Semantically closed.**

Stage 16 preserves the successful structured Typography model, clarifies content ownership around Stage 15 user Variables, and reduces compiler noise without sacrificing prompt-graph structure or real image-generation accuracy.

Ordinary localization, release/build verification, cosmetic editor polish, legacy migration, catalog growth, or later bug fixes do not keep this semantic stage open. Reopen Typography only if concrete later evidence reveals a real ownership defect, graph loss, serializer regression, target-identity failure, or meaningful output-semantic regression.

---

# Original product intent recovered during discovery

Typography exists to add visible text to generated imagery in any relevant context, including:

- print and publishing work,
- digital posters and advertising,
- covers and graphic artifacts,
- signage and labels,
- text integrated into realistic scenes such as writing or signage on a wall.

The existing text-group and text-block model had already proven useful and reasonably accurate in real generation tests before Stage 16.

---

# Ownership

Stage 15 established user Variables as reusable typed semantic handles. Stage 16 closes on this boundary:

```text
Variables  → what reusable text content says
Typography → how that text is organized and rendered
Layout     → where the typography group is placed when explicit spatial layout is used
```

Canonical example:

```text
{headline} = "Prompt Generator"
{price} = "$10/Month"
```

Typography consumes those handles as text-block content:

```text
{text_abc}
  content: {headline}
  purpose: main title
  style: bold display
  size: huge
```

The structural Typography text entity remains distinct from its content variable:

```text
{text_abc} → Typography text entity identity
{headline} → reusable user Text variable / content source
```

Typography owns:

- text grouping,
- group purpose,
- group arrangement,
- writing direction,
- alignment and distribution,
- typography position when expressed as a semantic preset or Layout-region binding,
- per-text purpose,
- font style,
- font size,
- font weight,
- text-level and group-level typography instructions,
- visible-text accuracy policy.

Typography does not own:

- reusable text values authored as user semantic handles,
- Layout region geometry,
- visual Color assignment,
- material/surface rendering.

---

# Existing schema retained

No destructive schema rewrite was required.

`TypographyTextGroup` continues to own:

- group purpose,
- position source / Layout-region binding,
- text arrangement direction,
- writing direction,
- alignment,
- distribution,
- group-level additional description,
- ordered text blocks.

`TypographyTextBlock` continues to own:

- stable Typography text identity,
- text content token/string,
- text purpose,
- font style,
- font size,
- font weight,
- text-level additional description.

Legacy text blocks containing literal text remain valid and editable. The new authoring path is variable-first rather than destructive migration of existing drafts.

---

# Variable-first authoring implementation

Implemented and manually validated on `refactor/prompt-semantics`.

## Create / Edit Text Group

The Text Group editor exposes a multi-select containing only active user variables whose semantic type is `text`.

Each selected variable becomes a normal `TypographyTextBlock` when the group is saved.

Example selection:

```text
{headline}
{price}
{callToAction}
```

creates ordinary text blocks whose `text` values are those exact tokens.

Already-used tokens inside the same group are disabled to avoid accidental duplicate blocks.

## Add Text to an existing group

The group-level Add Text action opens a Text Variable picker instead of creating a blank literal-text block.

The picker:

- shows active user `text` variables only,
- supports multi-selection,
- disables variables already present in the target group,
- creates ordinary Typography text blocks in selection order.

After creation, the existing Text Block editor remains authoritative for Typography-owned properties such as purpose, font style, size, weight, and additional description.

## UI validation completed

The following behaviors were manually confirmed:

- Text variables appear in the group editor as expected,
- multi-selection creates one Typography text block per selected user variable,
- block content remains the exact variable token,
- Add Text uses the same variable-first path,
- duplicate selection is prevented,
- existing block editing remains functional,
- Layout-region binding remains functional,
- no UI/runtime error was observed in the tested path.

---

# Simplified compiler strategy

The second Stage 16 pass simplifies Typography output while preserving the prompt graph.

## Structural identity emission

Internal entity `id` values are editor/runtime identity and never compile into prompt-facing Typography output.

Typography structural tokens remain available internally while compiling so cross-module references can be detected.

Before final prompt serialization:

- unused `{text_group_*}` keys are removed,
- unused `{text_*}` keys are removed,
- a structural key is preserved when it is referenced by external prompt graph content or by another semantic field inside Typography.

This follows the established selective structural-token precedent from Layout and later semantic modules.

## Compact structured output

A group may emit:

```text
purpose
position
layout
description
texts
```

A text item may emit:

```text
content
purpose
style
size
weight
description
```

The compiler no longer emits nested verbose wording when a shorter semantic value carries the same meaning.

Examples:

```text
serving as a typographic background element
→ typographic background element

arranged in a horizontal row
→ horizontal row

with balanced spacing
→ balanced spacing

as the slogan
→ slogan

huge text size
→ huge

bold 700 font weight
→ bold 700
```

The default `regular` / `400` font weight is omitted because it adds noise without representing a meaningful override.

Visible text accuracy is represented once as:

```text
textAccuracy: exact | readable | flexible
```

rather than the previous multi-flag `renderRules` object.

Legacy compiled Typography objects using the previous nested shape remain supported by the Natural serializer.

---

# Natural strategy

Typography remains a protected Natural block and is not flattened by the generic optimizer.

Token-only text content is semantic reference content and is not quoted:

```text
{headline}
```

Legacy literal visible text remains quoted:

```text
"Hello World"
```

Natural output summarizes common group behavior once, then emits separate text styling instructions only for blocks with meaningful per-text overrides.

Canonical form:

```text
Typography:
• In {layout_region_middle}, arrange {name1}, {name2}, and {name3} horizontally, center aligned, with balanced spacing, as the poster header.
• Style {name2} as the main title, using huge bold display typography, with bold 700 weight.

Render listed text values exactly as defined.
```

This preserves:

- user-variable references,
- Layout-region relationships,
- group semantics,
- meaningful per-text typography,
- exact visible-text requirements,

without repeating internal ids, unused structural keys, default font weight, or verbose render-rule prose.

---

# Validation and closure evidence

Stage 16 was validated in both editor flow and generated-image behavior.

## Structural/compiler validation

Confirmed in tested output:

1. Internal Typography `id` values no longer appear in prompt output.
2. Unreferenced `{text_group_*}` / `{text_*}` structural tokens are pruned.
3. User Text-variable tokens remain intact as content references.
4. Default regular/400 weight is omitted.
5. Meaningful purpose/style/size/weight overrides remain present.
6. Layout-region binding remains explicit when configured.
7. Natural token-only content is unquoted.
8. Exact text policy is emitted as one concise instruction.
9. Modular and Natural output preserve the same meaningful Typography graph.

Referenced structural-key preservation and literal legacy text support remain structural regression expectations; a later concrete failure may be fixed without reopening the semantic architecture unless it reveals a deeper contract defect.

## Real-image validation

Multiple real multi-subject collage tests were run after compiler simplification using the same Layout-region structure and Text-variable-driven Typography.

Observed behavior remained strong across realistic collage and heavily stylized pixel-art transformations:

- three independently referenced subjects remained compositionally distinct,
- generated name variables were rendered as visible text,
- the main-title text retained a clearly stronger hierarchy than secondary names,
- Layout and Typography continued to compose without destructive interference,
- reference-specific subject traits remained understandable after extreme transformation,
- exact text rendering remained useful,
- substantial prompt-noise reduction did not expose an image-quality or semantic-control regression.

Relative to the older Typography serialization, representative Typography-only prompt blocks were reduced substantially while retaining their useful decisions. The tested output showed that the simplification was not merely cosmetic: the same relationships remained understandable to the generation model with significantly less structural noise.

---

# Closure contract

Stage 16 closes on these rules:

1. **Reusable visible text content belongs to typed user Variables when authored through the current UI.**
2. **Typography owns organization and visual/textual rendering semantics, not the reusable content value itself.**
3. **Layout owns region geometry; Typography may bind a group to a Layout region without duplicating geometry.**
4. **Typography Text/Group identities remain structurally distinct from the user-variable content they consume.**
5. **Prompt-facing structural Typography keys are emitted selectively, not automatically.**
6. **Internal runtime IDs never belong in prompt semantics.**
7. **Default/no-op styling does not deserve compiler noise.**
8. **Natural output preserves the same reference graph while presenting group behavior compactly.**
9. **Legacy literal-text state remains compatible rather than requiring destructive migration.**
10. **Future cosmetic/catalog/localization work does not reopen this stage.**

> **Stage 16 — Typography Semantics: Semantically closed.**
