# Stage 16 — Typography Semantics

## Status

**Semantically closed and revalidated by `refactor/module-wording`.**

Stage 16 preserves the structured Typography model while final prompt-facing output now follows the shared semantic identity and wording contracts defined in `PROMPT-FACING-IDENTITY-REFERENCE.md`.

Reopen Typography only if concrete later evidence reveals a real ownership defect, graph loss, serializer regression, target-identity failure, variable-reference failure, or meaningful output-semantic regression.

---

# Ownership

User Variables and Typography remain cleanly separated:

```text
Variables  -> what reusable visible text says
Typography -> how that text is organized and rendered
Layout     -> where the Typography group is placed when explicit spatial layout is used
```

Canonical user-variable example:

```text
{title} = "PROMPT DRAFT"
{slogan} = "Creative Tools for Image Generation"
```

Typography consumes those user-variable handles and owns:

- text grouping
- group purpose
- group arrangement
- writing direction
- alignment and distribution
- Layout-region binding
- per-text purpose
- font style
- font size
- font weight
- text/group additional instructions
- visible-text accuracy policy

Typography does not own reusable text values, Layout geometry, Color assignments, or material/surface semantics.

---

# Stable identity and variable binding

`TypographyTextGroup` and `TypographyTextBlock` retain stable internal identity.

A Typography text block may reference a user Text variable by stable variable ID in addition to its current token. This means renaming:

```text
{t1} -> {mainTitle}
```

updates the prompt-facing Typography relationship without requiring the group to be deleted and recreated.

Legacy token-only blocks backfill stable variable identity when the current variable can still be resolved.

Internal runtime IDs remain persistence/compiler concerns and do not belong in ordinary prompt-facing text.

---

# Prompt-facing group identity

Typography Groups currently do not expose a user-authored semantic name suitable for global prompt identity.

Therefore compiler-owned group aliases remain:

```text
{tg_1}
{tg_2}
```

These aliases are deterministic within one compile and are the semantic handles used by Layout when binding regions to Typography content.

Example:

```text
{layout} =
...
• {topLeft} (content: {tg_1}; ...)
• {bottomRight} (content: {tg_2}; ...)
```

The `tg_*` namespace remains reserved from user variables.

---

# Prompt-facing text identity

Ordinary Typography styling targets the user Text variable directly.

Preferred:

```text
Style {title} as the main title, using huge retro script lettering, with heavy 900 weight.
```

Avoid redundant structural wrappers such as:

```text
{text_abc} ({title})
```

A compact compiler-owned `{tt_n}` alias is emitted only when another semantic relationship genuinely targets the Typography text entity itself rather than merely its content variable.

The `tt_*` namespace remains reserved from user variables.

---

# Compact group serialization

Modular and Natural share the same semantic Typography serializer.

Each group is represented as one compact bullet containing group behavior and all meaningful text-style instructions.

Canonical form:

```text
{typography} =
• {tg_1}: arrange {title} and {slogan} vertically, center aligned, with compact spacing, as the product information area. Style {title} as the main title, using huge retro script lettering, with heavy 900 weight. Style {slogan} as the slogan, using medium retro script lettering.
• {tg_2}: arrange {address} vertically, center aligned, with compact spacing, as the credits area. Style {address} as a credits text, using small elegant serif typography, with medium 500 weight.
```

When a group is explicitly bound to a Layout Region, the relationship may be stated in the group instruction while the same Region identity is used by Layout.

Meaningless default/no-op styling remains omitted.

Visible text accuracy is represented once, for example:

```text
Render listed text values exactly as defined.
```

---

# Output formats

## JSON

JSON remains the canonical structured representation.

It may retain:

- stable internal IDs
- canonical structural tokens
- group/text object structure
- normalized metadata

Prompt-facing aliases are not written back into JSON merely for readability.

## Modular

Modular no longer emits raw Typography group objects as JSON-like prompt text.

It uses the dedicated semantic block while preserving the explicit module definition:

```text
{typography} =
• {tg_1}: arrange {title} and {slogan} ... Style {title} ... Style {slogan} ...
```

## Natural

Natural uses the same semantic group/text identities and wording, with a readable heading:

```text
Typography:
• {tg_1}: arrange {title} and {slogan} ... Style {title} ... Style {slogan} ...
```

Natural and Modular must not disagree about the identity of the same Layout Region, Typography Group, or Text variable within one compile.

---

# Preview contract

Collapsed Typography module preview and final Output use the same prompt-facing serializer and identity registry.

The module card must not expose old forms such as:

```text
{text_group_abc}
{text_xyz}
{"groups":[...]}
```

when final Modular/Natural output uses `{tg_n}` and direct user Text-variable references.

---

# Layout integration

Layout owns region geometry; Typography may bind a group to one Region.

Stable internal references remain the canonical wiring mechanism. Prompt-facing presentation uses semantic aliases:

```text
internal Layout Region -> {layout_region_abc}
prompt-facing Region   -> {topLeft}
internal Text Group     -> {text_group_xyz}
prompt-facing Group     -> {tg_1}
```

Example final graph:

```text
{topLeft} -> {tg_1} -> {title}, {slogan}
{bottomRight} -> {tg_2} -> {address}
```

This is the intended minimum sufficient graph for image-generation models.

---

# Validation and closure evidence

Final `refactor/module-wording` validation confirmed:

1. Internal Typography IDs do not leak into ordinary Modular/Natural output.
2. Layout and Typography share the same Region identities.
3. Typography Groups use compact `{tg_n}` identities.
4. Ordinary Text styling targets user Text variables directly.
5. `{tt_n}` remains available only for genuine external text-entity references.
6. One bullet per group preserves group arrangement and per-text styling.
7. Default/no-op styling remains omitted.
8. Exact visible-text policy remains one concise instruction.
9. Text-variable rename follows stable variable identity.
10. Legacy token-only blocks can backfill stable identity when resolvable.
11. Module-card preview matches final Output.
12. JSON remains canonical and structured.

Regression validation:

```text
pnpm test:module-wording
13 passed / 0 failed

pnpm test:actions-api
176 passed / 0 failed
```

Manual application validation also confirmed successful Layout/Typography output and stable reference behavior after variable renaming.

---

# Closure contract

1. **Reusable visible text content belongs to typed user Variables.**
2. **Typography owns organization and rendering semantics, not reusable content values.**
3. **Layout owns Region geometry; Typography may bind Groups to Regions without duplicating geometry.**
4. **Internal Typography identities remain distinct from prompt-facing aliases.**
5. **Prompt-facing Groups use `{tg_n}` until a real user-authored semantic group name exists.**
6. **Prompt-facing Text styling targets user Text variables directly.**
7. **`{tt_n}` is exceptional and exists only for real text-entity references.**
8. **Stable variable identity protects Typography from user-variable key renames.**
9. **Internal runtime IDs do not belong in prompt semantics.**
10. **Modular/Natural share the same semantic serializer and identity registry.**
11. **JSON remains canonical.**
12. **Module preview and final Output must agree.**

> **Stage 16 — Typography Semantics: closed and revalidated.**
