# Prompt Draft — Semantic Breaking Cleanup

## Status

**Closed — 2026-08-22**

Branch:

```text
refactor/prompt-semantics
```

This cleanup intentionally removes obsolete pre-refactor compatibility and implementation debt while preserving the behavior of the current semantic schema.

---

# Product decision

The current registered schema is the only authoritative Draft/JSON contract.

Backward compatibility with pre-refactor saved drafts and importable JSON is intentionally unsupported. Automatic migration for removed legacy fields is not a release requirement.

Do not reintroduce cross-module guesses merely to preserve old state or prose.

---

# Cleanup rule

A legacy artifact is removable when:

1. it belongs only to an obsolete schema, migration, backup, or one-off refactor process,
2. it is not part of the current registry/runtime,
3. no current compiler, serializer, editor, catalog, target system, release script, or maintained tool depends on it,
4. removing it does not change current-schema behavior.

Current code is retained based on runtime purpose, not filename age.

---

# Completed cleanup

## Dead legacy module implementations

Removed:

```text
app/modules/deformation.module.ts
app/modules/pose.module.ts
app/modules/expression.module.ts
app/modules/hair.module.ts
app/modules/outfit.module.ts
```

Their current implementations/contracts are provided by the accepted semantic architecture.

## Texture — resolved

The previous semantic module temporarily consumed catalog data from `texture.module.ts`.

Completed state:

```text
texture.catalog.ts
        ↓
texture.semantic.ts
        ↓
registry
```

The current material catalog and condition compatibility metadata are independent, compound values intentionally rejected by the accepted semantic design remain rejected, and the old `texture.module.ts` implementation is removed.

## Style — resolved

`style.semantic.ts` is now a complete standalone module containing its current module metadata, fields, UI contracts, semantic option catalogs, presets, `extraDetails`, override field, and compile configuration.

`style.module.ts` and `BaseStyleModule` inheritance are removed.

## Form — resolved

The full accepted Form catalog now lives directly in `form.semantic.ts`, including:

- subject applicability,
- option categories,
- compatibility metadata,
- Form Language,
- Proportions,
- Transformation,
- Transformation Strength,
- UI contracts,
- `extraDetails`,
- override behavior,
- compile order.

The semantic wording fixes previously applied by a wrapper are now canonical option text.

`form.module.ts` and `BaseFormModule` inheritance are removed.

## Migration backlog — closed

Migration-only Background/Effects and Hair/Outfit backlog documents were removed.

`docs/prompt-semantics/review-backlog/` now exists only for reproducible current-schema defects.

## Layout refactor artifacts — removed

Tracked stage snapshots/payloads were deleted:

```text
.layout-stage1-backup/
.layout-stage2-backup/
_layout-stage2-payload/
```

Matching temporary paths are ignored by `.gitignore` to prevent accidental recommit.

## Localization migration artifacts — removed

The maintained release tools are:

```text
scripts/localization-audit.mjs
scripts/localization-review.mjs
scripts/localization-consolidate.mjs
```

Completed one-off migration machinery was removed:

```text
scripts/apply-hardcoded-batch-*.mjs
scripts/i18n-patches/
scripts/merge-i18n.ts
```

These files were not part of the release-facing `package.json` localization commands.

---

# Preserved current infrastructure

The cleanup does **not** remove current runtime/release infrastructure such as:

- all modules registered by `app/modules/registry.ts`,
- current semantic module implementations and catalogs,
- current compiler and Natural serializers,
- stable semantic target/identity infrastructure,
- current EN/FA localization files and verification scripts,
- offline/PWA build tooling,
- general project utilities unrelated to the completed migration.

---

# Final audit result

The final integration audit found no remaining known live semantic base-module dependency from the refactor cleanup list.

At audit time the branch was ahead of `main` and not behind it; the compare diff was limited to intentional cleanup/consolidation changes and removal of obsolete tracked artifacts.

Canonical acceptance criteria are now current-schema behavior only.

---

# Final validation gate

After pulling the latest branch, run:

```bash
pnpm locale:consolidate
pnpm generate
pnpm build
```

Then smoke-test current behavior:

- create/edit a current draft,
- Modular output,
- Natural output,
- save/reload,
- export/import a newly generated JSON,
- EN/FA rendering,
- Color/Material targets,
- Hair/Outfit/Pose/Expression structured editors,
- Style/Form/Texture selections and presets.

Old Draft/JSON compatibility is not an exit criterion.

---

# Exit rule

> **Semantic breaking cleanup is complete. No known legacy compatibility layer, base-module dependency, refactor backup/payload, or one-off localization migration pipeline remains as required product infrastructure.**

After final validation passes, proceed to integrate `refactor/prompt-semantics` into `main`.
