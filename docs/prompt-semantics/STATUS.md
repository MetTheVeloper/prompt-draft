# Prompt Semantics Status

Branch: `refactor/module-wording`

Last checkpoint: 2026-09-01

## Current focus

Prompt-facing semantic quality, compile structure, and identity presentation. UI redesign is out of scope.

## Accepted decisions

- Modular/Natural output should optimize for model-readable semantic prompt text, not mirror internal JS/state structure.
- JSON remains the canonical structured/internal output.
- Layout and Typography use dedicated semantic serializers in prompt-facing output.
- Layout prompt-facing bounds use percentages.
- Layout Region identity uses the user-facing Region name normalized to lowerCamelCase (`top left` -> `{topLeft}`), not `{r_n}`.
- Typography Group identity remains compiler-owned `{tg_n}` because groups currently lack a user-authored semantic name.
- Typography text style normally targets the user Text variable directly; `{tt_n}` is reserved for genuine external text-entity references.
- Internal persistence IDs and structural tokens remain stable and are not replaced in saved state merely to improve prompt wording.
- Generic named configurations use semantic prompt-facing identities without redundant module prefixes when unambiguous.
- Prompt-facing identity allocation is global per compile and collision-aware.
- User variable keys have priority; generated aliases qualify around them.
- Hair/Outfit nested entities participate in the same collision policy.
- Module-card previews and final Output panel must use the same semantic identity rules.
- Variable-to-Typography relationships use stable variable identity so variable key renames do not require rebuilding groups.

## General prompt-facing identity rule

Canonical/internal:

```text
{scene_scene1}
{style_clay}
{form_form1}
{effects_effects1}
{layout_region_abc}
```

Preferred prompt-facing form:

```text
{scene1}
{clay}
{form1}
{effects1}
{topLeft}
```

When semantic names collide, minimally qualify:

```text
{styleMain}
{effectsMain}
```

Do not implement this as blind prefix removal. Use the identity registry documented in `PROMPT-FACING-IDENTITY-REFERENCE.md`.

## Implemented in this branch

### Layout / Typography semantic output

- Modular Layout no longer emits raw structured JSON as prompt wording.
- Layout Natural/Modular share semantic percentage prose.
- Modular Typography no longer emits raw group objects.
- Typography group instructions are compacted into one bullet per group.
- Internal Typography text IDs are hidden unless semantically required.
- Final output and module-card preview use the same structured semantic formatter.

### Reference integrity

- Typography text blocks can retain stable Text variable IDs.
- Current variable keys are resolved at compile time.
- Legacy token-only blocks can backfill stable variable identity when possible.

### Prompt-facing identity registry

- Added global state-backed alias registry.
- Added trusted output-backed fallback for final callers that only expose canonical outputs.
- Added lowerCamelCase semantic name normalization.
- Added global collision handling.
- Added user-variable collision protection.
- Added generic ModuleEntity support for Form, Camera, Framing, Background, Lighting, Style, Effects, and Texture.
- Added Scene alias simplification.
- Added named Layout Region aliases.
- Added Hair/Outfit nested alias handling.
- Kept Typography `tg_*` / `tt_*` compiler namespaces.
- Released obsolete `r_*` user-variable reservation.

### Regression coverage

`pnpm test:module-wording` now covers:

- Layout semantic percentage output.
- named Layout Region aliases.
- Layout <-> Typography alias consistency.
- selective Typography text aliases.
- module-card/final-output consistency.
- generic named configuration simplification across Scene/Style/Form/Effects.
- cross-module alias collisions.
- user-variable precedence on collisions.
- Hair child collision qualification.
- unchanged JSON semantics.
- Text variable rename integrity.
- active compiler-owned variable reservations.

The existing prompt-compile regression expectation for Modular Scene presentation was updated to semantic Scene identity. JSON retains the canonical Scene token.

## Files central to this checkpoint

- `app/utils/promptIdentity.ts`
- `app/utils/promptFacingIdentity.ts`
- `app/utils/promptOutputAliases.ts`
- `app/utils/specializedEntityAliases.ts`
- `app/utils/compileLayoutNatural.ts`
- `app/utils/compileTypographyNatural.ts`
- `app/utils/moduleOutputPreview.ts`
- `app/utils/compilePromptPure.ts`
- `app/utils/compilePrompt.ts`
- `app/components/prompt/editor.vue`
- `app/utils/typography.ts`
- `app/utils/promptVariables.ts`
- `scripts/module-wording-output.test.ts`

## Validation status

Previous Layout/Typography checkpoint was manually verified in the app and its dedicated tests passed.

The new global prompt-facing identity changes have been implemented and regression tests updated, but this checkpoint still requires a fresh local run after pulling the latest branch:

```text
pnpm test:module-wording
pnpm test:actions-api
pnpm dev
```

Manual verification should use a multi-scene prompt with named Layout Regions and multiple named configurations. Confirm that Modular/Natural show semantic aliases while JSON remains canonical.

## Next steps

1. Run the fresh regression suites above.
2. Verify the user's 4-scene sample produces semantic aliases such as `{topLeft}`, `{scene1}`, `{clay}`, `{form1}`, `{effects1}`.
3. Exercise at least one alias collision and confirm minimal qualification.
4. Fix any regression found by the wider action suite.
5. Once validation is green, update this status to `validated` and prepare the branch for merge/review.

## Source of truth

For prompt-facing identity and aliasing, use:

- `docs/prompt-semantics/PROMPT-FACING-IDENTITY-REFERENCE.md`

For broader semantic module principles, continue to use:

- `docs/prompt-semantics/SEMANTIC-REFACTOR-REFERENCE.md`
