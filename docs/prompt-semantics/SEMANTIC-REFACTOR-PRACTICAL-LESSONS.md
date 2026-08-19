# Semantic Refactor — Practical Lessons Addendum

This addendum records reusable lessons discovered after the original semantic refactor guide was written. These rules apply to all remaining Prompt Draft modules and should be treated as part of the operating contract.

## 1. Prefer orthogonal axes over mega-selects

A single select must not mix independent decisions merely because they are conceptually related.

If valid outputs can combine several choices at the same time, those choices probably belong to separate fields or to a multi-select feature axis.

Example discovered in Framing:

```text
shot size
+ subject placement
+ frame balance
+ composition features
+ view angle
+ view direction
+ crop safety
```

These cannot be represented correctly by one `framingStyle` select.

Use a single-select when sibling values are mutually exclusive versions of the same axis. Use a multi-select when features can meaningfully coexist.

## 2. Test semantic independence by combination, not only isolation

A field can look correct by itself and still be architecturally wrong.

Ask:

> Can this value combine with another value that currently lives in the same field?

If yes, the field may contain several axes.

Examples:

- `symmetrical` / `asymmetrical` belong to a balance axis.
- `negative space`, `layered depth`, and `isolated subject` can coexist and therefore belong to composition features rather than the same exclusive select.

## 3. Structured module output requires an explicit Natural strategy

If a module compiles to a structured object, do not assume the generic Natural pipeline can serialize it safely.

Every structured-object module must either:

1. provide an explicit Natural serializer, or
2. explicitly declare that it has no Natural representation.

Structured semantic blocks that contain coordinates, tokens, bullets, exact text, or nested relationships may need to bypass generic Natural optimization entirely.

Layout and Typography demonstrated this requirement.

## 4. The Natural optimizer must never silently lose semantics

Any optimizer that classifies, deduplicates, groups, limits, or rewrites semantic parts can become a semantic-loss boundary.

For every refactored module, test:

- the maximum realistic number of simultaneous semantic parts,
- classifier ownership,
- grouping order,
- dedupe behavior,
- punctuation rewriting,
- numeric/token preservation.

Never use a hidden group limit that can truncate valid selected semantics.

The canonical test is:

> Every meaningful semantic item present in Modular output must still be represented in Natural output unless the Natural serializer intentionally transforms it.

## 5. Cross-module conflicts belong at prompt level

Do not solve a cross-module contradiction by silently changing another module's visible state.

Example:

```text
Setup: preserve original composition
Framing: rule of thirds + low angle + new placement
```

The correct default behavior is a prompt-level compatibility warning, not silently disabling either instruction.

Module-local compatibility handles conflicts inside one module. Prompt-level validation handles conflicts between modules.

## 6. Structural identity must be separate from human labels

When modules expose reusable structural entities such as Layout regions or Typography groups:

- stable identity should come from IDs,
- human-facing names should remain editable labels,
- references should bind to stable IDs/tokens rather than display names,
- generated structural namespaces must be reserved against user-variable collisions.

Renaming a region or group must not break references.

## 7. Expose structural tokens in Natural output only when useful

A structural key can be necessary in Modular/JSON while being noise in Natural prose.

For human-readable output, surface structural tokens only when another semantic block actually references them.

This preserves traceability without flooding Natural output with implementation detail.

## 8. Do not confuse prompt precision with generation determinism

A precise prompt does not guarantee a deterministic image.

Generative image models introduce sampling variance and model-dependent interpretation. Therefore spatial and relational controls should be evaluated by **reliability class**, not by a single successful render.

For controls such as Layout:

```text
exact renderer constraint  ≠ realistic expectation
strong directional guidance = realistic expectation
```

When evaluating a semantic control, repeat the same prompt multiple times before calling it reliable.

One unusually accurate generation is evidence of capability, not evidence of determinism.

## 9. Use repeated identical-prompt tests for spatial claims

When a module claims control over placement, geometry, text position, or other spatial behavior:

1. generate more than once with the identical prompt,
2. compare the variance,
3. classify the control as exact, strong, approximate, or weak,
4. set product expectations accordingly.

Do not keep adding prompt verbosity in an attempt to force deterministic geometry if repeated tests show the model itself is the limiting factor.

## 10. Separate semantic correctness from model compliance

Two questions must remain distinct:

1. Did Prompt Draft express the user's selected semantics correctly?
2. Did the image model obey those semantics consistently?

A module can be semantically correct even when a generative model treats its instruction probabilistically.

Refactor the prompt system when the first answer is no. Reconsider product expectations when the second answer is no.

## 11. Track deferred findings explicitly

Not every discovered problem should interrupt the current module.

Use the semantic review backlog for issues that are real but belong to another module or a later architectural stage.

Each backlog item should include:

- symptom,
- semantic ownership,
- why it is deferred,
- preferred resolution direction,
- removal after verification.

## 12. Schema refactors require an explicit legacy-state decision

When replacing or splitting old fields, old drafts may still contain stale keys.

Before declaring the overall refactor migration-safe, decide explicitly whether each old value should:

- migrate exactly,
- move to another module,
- be preserved as legacy data,
- or be discarded.

Do not invent cross-module migrations merely to preserve old text if doing so corrupts semantic ownership.

## 13. Translation changes need a persistent ledger

English semantic patches remain the source of truth during refactor work.

Every semantic English patch must also be registered in:

```text
scripts/i18n-patches/fa.semantic-refactor.todo.ts
```

The ledger intentionally keeps English source values during the refactor. It must not be merged into `fa.ts` until a final Persian translation pass replaces those values.

This prevents new and rewritten UI copy from being scattered across many stages and makes the final Persian synchronization a single controlled operation.
