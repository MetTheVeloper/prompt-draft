# Prompt Semantics Status

Branch: `refactor/module-wording`

Last checkpoint: 2026-09-01

Status: **VALIDATED / COMPLETE**

## Closure summary

The prompt-facing wording and identity refactor is complete.

This branch established a stable separation between canonical/internal module identity and the semantic tokens shown to image-generation models. It also completed the Layout/Typography prompt-facing simplification, stable Text-variable reference handling, shared module-card/final-output presentation, and a global collision-aware identity policy for named configurations and specialized entities.

No further semantic or compiler work is required for this branch before integration into `main`.

UI redesign was intentionally out of scope except for minimal data wiring required to keep references stable and previews consistent with final output.

## Accepted decisions

- Modular/Natural output optimizes for model-readable semantic prompt text rather than mirroring internal JS/state structure.
- JSON remains the canonical structured/internal output.
- Internal persistence IDs and canonical structural tokens remain stable and are not renamed merely to improve prompt wording.
- Prompt-facing identity is allocated globally per compile and must preserve the same reference graph as canonical state.
- Blind prefix deletion is forbidden; complete known tokens are rewritten through an identity-aware registry.
- User variable keys have priority over generated aliases.
- Collisions are minimally qualified and deterministic.
- Module-card previews and final Output use the same prompt-facing identity policy.

## Final prompt-facing identity policy

Canonical/internal examples:

```text
{layout_region_abc}
{scene_scene1}
{style_clay}
{form_form1}
{effects_effects1}
```

Preferred Modular/Natural form:

```text
{topLeft}
{scene1}
{clay}
{form1}
{effects1}
```

When semantic names collide, qualify only as much as needed:

```text
{styleMain}
{effectsMain}
```

### Layout Regions

Layout Region identity uses the user-authored Region name normalized to lowerCamelCase:

```text
top left     -> {topLeft}
top right    -> {topRight}
bottom left  -> {bottomLeft}
bottom right -> {bottomRight}
```

The previous `{r_n}` prompt alias scheme is obsolete and `r_*` is no longer reserved from user variables.

Canonical Layout geometry remains normalized `0..1` in JSON/state. Modular/Natural present bounds as percentages from `0%` to `100%`.

### Scene/Layout exactness rule

The automatic Scene/Layout rule remains intentionally:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

This wording is retained because repeated generation tests produced acceptable near-exact Layout adherence. Do not weaken or remove `exactly` without new empirical evidence showing a regression or a clearly better formulation.

### Typography

Typography Group identity remains compiler-owned `{tg_n}` because groups currently do not expose a user-authored semantic name suitable for prompt identity.

Typography text styling normally targets the user Text variable directly:

```text
Style {title} as the main title ...
```

`{tt_n}` is emitted only when another semantic relationship genuinely targets a Typography text entity.

Text-variable relationships use stable variable IDs internally, so changing `{t1}` to `{mainTitle}` no longer requires rebuilding Typography groups. Legacy token-only blocks backfill stable variable identity when the current variable can still be resolved.

### Named configurations

The same semantic identity rule applies to every generic named-configuration module:

- Form
- Camera
- Framing
- Background
- Lighting
- Style
- Effects
- Texture

Scene uses the same policy for Scene identity.

Hair and Outfit specialized nested entities also participate in the same global collision policy, using parent semantic qualification when needed.

### Effects wording

Named Effects definitions no longer repeat the redundant `Effects:` label inside the `{effects}` module block.

Final form:

```text
{effects} =
• {effects1} = subtle composited light-leak overlay; balanced dust-and-scratch film-damage overlay.
```

Not:

```text
• {effects1} = Effects: subtle composited light-leak overlay ...
```

## Implemented architecture

Primary implementation layers:

- `app/utils/promptIdentity.ts` — state-backed identity registry and global collision allocation.
- `app/utils/promptFacingIdentity.ts` — trusted output-backed fallback for callers that only expose canonical outputs.
- `app/utils/promptOutputAliases.ts` — final structured-module formatting and semantic rewrite boundary.
- `app/utils/specializedEntityAliases.ts` — Hair/Outfit specialized alias promotion.
- `app/utils/moduleOutputPreview.ts` — module-card preview using the same identity policy.
- `app/utils/compileLayoutNatural.ts` — prompt-facing Layout serialization.
- `app/utils/compileTypographyNatural.ts` — prompt-facing Typography serialization.
- `app/utils/typography.ts` — stable user Text-variable binding and rename resolution.
- `app/utils/compileEffects.ts` — concise Effects wording without redundant `Effects:` prefix.

## Registered-module audit

All registered modules were reviewed against the prompt-facing identity contract:

- Variables
- Layout
- Scene
- Style
- Form
- Framing
- Expression
- Pose
- Hair
- Outfit
- Background
- Lighting
- Camera
- ColorPalette
- Typography
- Effects
- Texture

Modules that own named/structural entities participate directly in alias allocation. Assignment-oriented modules such as Expression, Pose, and ColorPalette do not invent local alias schemes; references inside their output are rewritten by the global registry.

## Validation completed

### Dedicated prompt-wording regression suite

Command:

```text
pnpm test:module-wording
```

Final result:

```text
13 tests
13 passed
0 failed
```

Coverage includes:

- semantic Layout percentage output
- named Layout Region aliases
- Layout <-> Typography identity consistency
- selective Typography text aliases
- module-card/final-output consistency
- Scene/Style/Form/Effects named-configuration simplification
- cross-module alias collisions
- user-variable precedence
- Hair child collision qualification
- unchanged JSON semantics
- Text-variable rename integrity
- active compiler-owned variable reservations

### Full public Actions/API regression suite

Command:

```text
pnpm test:actions-api
```

Final result:

```text
176 tests
176 passed
0 failed
```

Two stale expectations discovered during the first run were corrected without changing runtime behavior:

- `attached reference image` -> canonical `attached reference image(s)` wording.
- partial image-to-image settings merge now asserts preservation of the current canonical previous value instead of assuming an obsolete default.

### Manual application validation

The dev application was run successfully after restoring `@vueuse/core` through `pnpm` so `package.json` and `pnpm-lock.yaml` remained package-manager generated.

Manual checks confirmed:

- module-card previews match final Output semantics
- Modular and Natural Layout/Typography output use the intended semantic wording
- JSON remains canonical
- Text-variable rename wiring remains stable
- a four-Scene prompt correctly resolves:
  - `{topLeft}`, `{topRight}`, `{bottomLeft}`, `{bottomRight}`
  - `{scene1}` ... `{scene4}`
  - semantic Style identities such as `{clay}` and `{childlikeDrawing}`
  - `{form1}` ... `{form4}`
  - `{effects1}` ... `{effects4}`
- downstream Expression/Hair references follow the rewritten Scene identities
- Layout generation behavior remained acceptably near-exact under the retained `exactly` rule
- Effects definitions render without the redundant `Effects:` prefix

## Completion criteria

All closure criteria are satisfied:

1. Prompt-facing Modular/Natural semantics are concise and model-readable.
2. Canonical JSON/state identity is preserved.
3. Cross-module references remain stable.
4. Named configuration identity follows one global rule.
5. Collision handling is deterministic and tested.
6. Module previews and final Output agree.
7. Layout and Typography output match the intended semantic design.
8. Variable rename behavior is stable.
9. Dedicated regression suite is fully green.
10. Full Actions/API suite is fully green.
11. Manual multi-module application output is verified.

## Branch disposition

`refactor/module-wording` is **formally complete and approved for integration into `main`**.

This checkpoint is the closure record for the branch. After integration, future changes should be treated as new work rather than unfinished work from this refactor, unless a concrete regression is found against the contracts documented here.

## Source of truth

Prompt-facing identity and aliasing:

- `docs/prompt-semantics/PROMPT-FACING-IDENTITY-REFERENCE.md`

Layout semantics:

- `docs/prompt-semantics/stage-06-layout-semantics.md`

Typography semantics:

- `docs/prompt-semantics/stage-16-typography-semantics.md`

Broader module semantic principles:

- `docs/prompt-semantics/SEMANTIC-REFACTOR-REFERENCE.md`
