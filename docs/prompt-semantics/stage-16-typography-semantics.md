# Stage 16 — Typography Semantics

## Status

**Implementation in progress.**

Stage 16 begins from an already successful structured Typography implementation. The goal is not to replace the current group/text schema, but to clarify content ownership and then reduce compiler noise without losing the text-rendering accuracy established by prior Layout/Typography tests.

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

# Ownership direction

Stage 15 established user Variables as reusable typed semantic handles. Stage 16 therefore adopts this boundary:

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
  typography: large + bold
```

The structural Typography text entity remains distinct from its content variable:

```text
{text_abc} → Typography text entity identity
{headline} → reusable user Text variable / content source
```

This distinction preserves the ability for other semantic systems to address the Typography entity independently of the content value.

---

# Existing schema retained

No destructive schema rewrite is required for the first implementation pass.

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

Implemented on `refactor/prompt-semantics`:

## Create / Edit Text Group

The Text Group editor now exposes a multi-select containing only active user variables whose semantic type is `text`.

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

The group-level Add Text action now opens a Text Variable picker instead of creating a blank literal-text block.

The picker:

- shows active user `text` variables only,
- supports multi-selection,
- disables variables already present in the target group,
- creates ordinary Typography text blocks in selection order.

After creation, the existing Text Block editor remains authoritative for Typography-owned properties such as purpose, font style, size, weight, and additional description.

---

# Compiler strategy for this implementation pass

The compiler is intentionally unchanged during the variable-first authoring test.

This isolates two questions:

1. Is the Variables → Typography ownership boundary useful and ergonomic?
2. Does the existing structured compiler preserve the same successful image-generation behavior when text-block content is a user-variable token?

Only after this path is validated should Typography compiler noise be reduced.

---

# Natural strategy

The existing protected Typography Natural serializer remains unchanged for this first pass.

The established invariant still applies:

> Natural output must preserve exact visible text semantics and the reusable prompt graph rather than flattening referenced user variables into duplicated prose.

---

# Next validation

Before compiler simplification:

1. Create several user Variables of type `text`.
2. Create a Typography group and multi-select several of them during group creation.
3. Verify one normal Typography text block is created per selected variable.
4. Verify each block content is the exact variable token.
5. Edit per-block purpose/font/size/weight and confirm the existing UI remains intact.
6. Use Add Text on an existing group and verify multi-select insertion and duplicate prevention.
7. Verify Layout-region binding remains unchanged.
8. Compare Modular/Natural output with the previous structured Typography behavior.
9. Run at least one real poster/graphic generation test before changing compiler verbosity.

After these pass, proceed to the second Stage 16 task: **Typography compiler simplification / noise reduction**.
