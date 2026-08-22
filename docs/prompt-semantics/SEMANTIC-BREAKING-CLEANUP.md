# Prompt Draft — Semantic Breaking Cleanup

## Status

Active cleanup policy for `refactor/prompt-semantics` after semantic closure.

The project intentionally does **not** guarantee backward compatibility with drafts or importable JSON produced by the pre-refactor semantic schemas.

This is a product decision, not a missing migration task. The previous schemas contained ownership and architecture problems that should not be reintroduced through compatibility code.

---

## 1. Compatibility policy

The current registered schema is the only authoritative schema.

We will not add automatic migration for removed legacy fields such as:

- `framingStyle`
- `cameraStyle`
- `lightingStyle`
- legacy global Texture / Material fields
- `poseStyle`
- `expressionStyle`
- legacy Background / Effects mega-select fields
- legacy Hair / Outfit flat fields

Old local-storage drafts and old JSON exports may therefore fail validation, lose obsolete fields, or require manual recreation in the current editor. That behavior is acceptable for this cleanup stage.

Do not add cross-module guesses merely to preserve old prose.

---

## 2. What should be deleted

Delete code or documentation when all of the following are true:

1. it exists only for an obsolete pre-refactor schema or migration plan,
2. it is not registered by `app/modules/registry.ts`,
3. no current semantic module, editor component, compiler, serializer, catalog, or target system imports it,
4. removing it does not change the behavior of the current schema.

Typical delete candidates:

- unregistered legacy module implementations replaced by standalone semantic modules,
- migration-only backlog documents,
- compatibility helpers that are not used by the current schema,
- stale comments that describe future legacy migration as required work.

---

## 3. What should be kept

Keep anything that is part of the current runtime or still supplies current semantic data.

This includes:

- every module registered in `app/modules/registry.ts`,
- semantic module implementations,
- current catalogs and catalog validation,
- current types and assignment infrastructure,
- compiler and Natural serializers,
- stable identity / semantic target infrastructure,
- localization required by current UI,
- old-origin files that are still an active dependency of current code.

A file must not be deleted merely because it originated before the refactor.

### Dependencies present at the start of cleanup

At the start of this cleanup:

- `style.semantic.ts` built on `style.module.ts`,
- `form.semantic.ts` built on `form.module.ts`,
- `texture.semantic.ts` read catalog data from `texture.module.ts`.

### Texture dependency — resolved

The Texture dependency was removed without reopening semantic design:

- the current Material catalog and condition compatibility metadata live in `app/modules/texture.catalog.ts`,
- `texture.semantic.ts` imports that neutral catalog directly,
- the compound legacy material values intentionally excluded during Stage 11 remain excluded,
- the unregistered legacy `app/modules/texture.module.ts` implementation has been deleted.

Texture / Material now has no runtime dependency on its pre-refactor global-field module.

### Style dependency — resolved

The Style dependency was removed without changing the accepted semantic schema:

- `style.semantic.ts` now declares its own module key, icon, groups, field metadata, presets, and compile configuration,
- the existing semantic Aesthetic, Medium, Stylization, Linework, Visual Treatment, Detail Level, Finish, `extraDetails`, and override behavior are preserved,
- no `BaseStyleModule` inheritance remains,
- the unregistered legacy `app/modules/style.module.ts` implementation has been deleted.

Style now has no runtime dependency on its pre-refactor module implementation.

### Form dependency — resolved

The final known base-module dependency has now been removed:

- the complete current Form catalog now lives directly in `form.semantic.ts`, including subject applicability, categories, compatibility metadata, transformation strength, and UI field contracts,
- the accepted semantic wording corrections previously layered by the wrapper are merged directly into their canonical options,
- Form keeps the same groups, defaults, field order, compatibility behavior, `extraDetails`, and override contract,
- no `BaseFormModule` inheritance remains,
- the unregistered legacy `app/modules/form.module.ts` implementation has been deleted.

Form is now standalone and the three known live legacy dependencies present at the start of this cleanup — Texture, Style, and Form — are all resolved.

---

## 4. Cleanup order

### Phase A — close migration scope

- Treat legacy draft/JSON migration as intentionally unsupported.
- Remove migration-only backlog items.
- Keep the review backlog available for concrete reproducible defects discovered during testing.

### Phase B — remove dead legacy implementations

- Delete unregistered legacy modules only after confirming the current registry and semantic modules do not depend on them.
- Prefer small, reviewable removals over broad filename-based deletion.

### Phase C — remove live legacy dependencies conservatively

Completed precedents:

- Texture catalog extraction,
- Style standalone consolidation,
- Form standalone consolidation.

No known live base-module dependency remains from the semantic refactor cleanup list.

### Phase D — reference audit

After deletions, check for:

- broken imports,
- stale module names,
- references to deleted migration docs,
- obsolete comments that promise legacy migration,
- current components importing removed legacy implementations directly.

### Phase E — validation

Run the normal current-project validation path:

```bash
pnpm locale:consolidate
pnpm generate
pnpm build
```

Then smoke-test the current schema only:

- create a new draft,
- edit representative modules,
- verify Modular and Natural output,
- save/reload a current draft,
- export/import a newly created JSON,
- verify EN/FA rendering,
- verify important Color/Material semantic targets,
- verify Hair/Outfit/Pose/Expression structured editors.

Old draft compatibility is not an exit criterion.

---

## 5. Backlog rule after cleanup

`docs/prompt-semantics/review-backlog/` is reserved for concrete defects that are reproducible on the current schema.

Good backlog items include:

- broken prompt-graph identity,
- target persistence failures,
- compiler or Natural serialization regressions,
- current-schema save/import round-trip defects,
- real ownership defects demonstrated by current behavior.

Do not add speculative legacy migration work unless backward compatibility becomes an explicit product requirement again.

---

## 6. Exit criteria

This cleanup is complete when:

- migration-only work is no longer presented as required before integration,
- dead unregistered legacy modules are removed,
- no known live semantic base-module dependency remains,
- current imports resolve cleanly,
- localization consolidation passes,
- generate/build pass,
- current-schema smoke tests pass.

At that point the branch can proceed toward integration with `main` without carrying a compatibility architecture for the abandoned schemas.
