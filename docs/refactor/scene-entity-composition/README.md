# Scene & Entity Composition Refactor

> **Status:** Phase 10 — merge readiness is current; Phase 9 regression and migration is complete and accepted
> **Working branch:** `refactor/scene-entity-composition`
> **Baseline main commit:** `83ed3e6374f8fc85e8a3b48f822cb75a1c1f862c`
> **Deployment checkpoint:** `main` was explicitly fast-forwarded to `6fce091bc77a4c842005bb390f64af015cf94df8` for Phase 7 running-app testing. Phase 7 was accepted there. Phase 8 was completed and accepted after branch-only running-app, narrow-mobile, recovery, custom-input, and Custom Override UX validation. Phase 9 was completed and accepted after the 9/9 compiler-regression harness and full practical migration/output checks passed. Phase 10 remains on the working branch; do not move `main` again without explicit user approval.

## Source-of-truth rule

Every development session must:

1. inspect the latest working-branch history;
2. read this document before architectural changes;
3. continue from the first incomplete phase;
4. inspect current source before patching;
5. update this document when architecture, migration behavior, or phase status changes.

---

# Goal

Prompt Draft already supports semantic targets, user/system variables, Layout Regions, Typography entities, Hair entities, Outfit sets/items, and specialized assignment systems.

This refactor adds:

1. **Repeatable Module Entities** — named reusable configurations owned by modules.
2. **Scene Entities** — reusable nested scene definitions that reference named module configurations.
3. **Stable Region → Scene binding** — Layout Regions own Scene placement through stable references instead of fragile token strings.

Target architecture:

```text
Global Module Defaults
        ↓ optional inheritance
Repeatable Module Entities
        ↓ stable references
Scene Entities
        ↓ stable scene reference
Layout Regions
```

A Scene can reference reusable module configurations such as Form, Camera, Framing, Background, Lighting, Style, Effects, and Texture / Material.

---

# Final result

The Scene & Entity Composition refactor is complete and accepted through Phase 10.

- Phases 0–9 are complete and accepted.
- Phase 8 UX consolidation and Phase 9 migration/regression validation passed running-app and automated checks.
- `pnpm test:phase9-regression` passed 9/9.
- Final branch comparison showed the working branch ahead of `main` with `main` as the exact merge base and no rebase required.
- No unrelated changes were found in the final merge-readiness audit.
- Final user approval for synchronization to `main` was received on August 26, 2026.
- Final synchronization is a non-force fast-forward from `main@6fce091bc77a4c842005bb390f64af015cf94df8` to the accepted working-branch HEAD.

**Result:** complete and accepted.
