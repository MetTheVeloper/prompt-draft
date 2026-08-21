# Stage 16 — Typography Semantics

## Status

**Implementation in progress — variable-first UI validated; simplified compiler pending final user/output validation.**

Stage 16 begins from an already successful structured Typography implementation. The goal is not to replace the current group/text schema, but to clarify content ownership and reduce compiler noise without losing the text-rendering accuracy established by prior Layout/Typography tests.

---

# Original product intent recovered during discovery

Typography exists to add visible text to generated imagery in any relevant context, including:

- print and publishing work,
- digital posters and advertising,
- covers and graphic artifacts,
- signage and labels,
- text integrated into realistic scenes such as writing or signage on a wall.

The existing text-group and text-block model has already proven useful and reasonably accurate in real generation tests.

---

# Ownership

Stage 15 established user Variables as reusable typed semantic handles. Stage 16 adopts this boundary:

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

This distinction preserves the ability for other semantic systems to address the Typography entity independently of the content value.

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

No destructive schema rewrite is required.

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

The following behaviors were manually confirmed by the user:

- Text variables appear in the group editor as expected,
- multi-selection creates one Typography text block per selected user variable,
- the block content remains the exact variable token,
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

Typography compiler output is intentionally compact.

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

The compiler no longer emits nested verbose typography wording when a shorter semantic value carries the same meaning.

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

The default `regular` / `400` font weight is omitted from text items because it adds noise without representing a meaningful override.

Visible text accuracy is represented once as:

```text
textAccuracy: exact | readable | flexible
```

rather than the previous multi-flag `renderRules` object.

Legacy compiled Typography objects using the previous nested shape remain supported by the Natural serializer during the transition.

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

Target form:

```text
Typography:
• In {layout_region_middle}, arrange {name1}, {name2}, and {name3} horizontally, center aligned, with balanced spacing, as a typographic background element.
• Style {name2} as the slogan, using huge bold display typography, with bold 700 weight.

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

# Current validation checkpoint

Variable-first authoring is validated.

The simplified compiler now requires user validation against the same known-good Typography state, checking:

1. Modular output contains no internal Typography `id` values.
2. Unreferenced `{text_group_*}` / `{text_*}` tokens are absent.
3. Referenced structural Typography tokens remain present when another prompt-graph node uses them.
4. User Text-variable tokens remain unchanged as `content` references.
5. Default regular/400 weight is omitted.
6. Meaningful purpose/style/size/weight overrides remain present.
7. Layout-region binding remains explicit.
8. Natural token-only content is unquoted.
9. Literal legacy text is still quoted.
10. Exact/readable/flexible text policy produces one concise instruction.
11. Real image generation remains at least as accurate as the prior compiler on a representative Typography test.

Stage 16 remains open until this simplified compiler pass is validated.
