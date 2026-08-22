# Prompt Semantics Review Backlog

This folder is reserved for **concrete, reproducible defects in the current semantic schema**.

The module-by-module semantic refactor is closed. Backward compatibility with pre-refactor drafts and importable JSON is intentionally **not** a release requirement.

## Backward-compatibility decision

Legacy migration work previously tracked here is closed by product decision.

We will not build automatic migration for removed pre-refactor fields such as old Framing, Camera, Lighting, Texture / Material, Pose, Expression, Background, Effects, Hair or Outfit mega-select/flat schemas.

Reason:

- the old schemas contained semantic ownership problems,
- preserving them would require ambiguous cross-module guesses,
- compatibility code would increase maintenance and regression surface,
- the current schema is the authoritative product contract.

Old saved drafts or old exported JSON may therefore require manual recreation. Do not reintroduce deprecated semantics merely to preserve old text.

See:

```text
docs/prompt-semantics/SEMANTIC-BREAKING-CLEANUP.md
```

## What belongs in this backlog now

Add an item only when current behavior exposes a real defect, for example:

- prompt-graph identity is lost,
- a stable target/reference breaks after save or rename,
- current JSON export/import does not round-trip,
- Modular or Natural compiler output regresses,
- a current module violates an accepted ownership boundary,
- a current editor state causes a reproducible runtime/integration failure.

Do not add:

- speculative legacy migration,
- catalog expansion requests,
- ordinary cosmetic polish,
- stochastic generation-model variance,
- theoretical semantic micro-polish without a reproducible contract failure.

## Item lifecycle

For every new backlog item:

1. describe a reproducible current-schema problem,
2. record the affected semantic/runtime contract,
3. avoid module-local workarounds when the defect is cross-cutting,
4. verify the fix against current save/compile/import behavior,
5. remove the item after resolution and verification.

At this checkpoint there are no legacy migration tasks that block branch integration.
