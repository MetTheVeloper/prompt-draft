# Prompt-Facing Identity Reference

Status: **canonical source of truth** for prompt-facing identity in Modular and Natural output.

Validated on `refactor/module-wording` on 2026-09-01. The branch completed with all dedicated and public Actions/API regression tests green and is approved for direct fast-forward integration into `main`.

This document defines how internal module/entity identity is translated into the tokens shown to image-generation models in Modular and Natural output.

It supersedes older prompt-facing identity examples that expose persistence-oriented prefixes such as `layout_region_*`, `scene_*`, `style_*`, `form_*`, `effects_*`, `hair_*`, or `outfit_*` when those prefixes are not semantically necessary.

## Core rule

> Internal structural identity must not automatically become prompt-facing identity.

Persistence and cross-module wiring use stable IDs and canonical structural tokens. Prompt-facing output uses the shortest unambiguous semantic identity that preserves the same graph.

The compiler must never obtain this result by blindly deleting string prefixes. Alias allocation is identity-aware and operates on complete `{token}` references whose owner is known.

## Identity layers

### 1. Persistence identity

Stable implementation identity used by saved drafts and cross-module references.

Examples:

- `region-abc123`
- `style-entity-...`
- `scene-...`
- Hair/Outfit child IDs

Editable names and prompt aliases must not be used as persistence identity.

### 2. Canonical structural token

Internal/compiler representation that can remain globally namespaced.

Examples:

- `{layout_region_abc123}`
- `{scene_scene1}`
- `{style_clay}`
- `{form_form1}`
- `{effects_effects1}`
- `{hair_curlyUpdo_bangs}`

These tokens are valid implementation metadata but are not automatically valid final prompt wording.

### 3. Prompt-facing semantic identity

The token emitted in Modular/Natural output.

Preferred examples:

- Layout region named `top left` -> `{topLeft}`
- Scene `scene1` -> `{scene1}`
- Style `clay` -> `{clay}`
- Form `form1` -> `{form1}`
- Effects `effects1` -> `{effects1}`
- Hair style `Curly Updo` -> `{curlyUpdo}`

Prompt-facing names are normalized to lowerCamelCase.

## Alias allocation

Alias allocation is global to one compiled prompt.

### Preferred case: semantic name is unique

```text
{style_clay} -> {clay}
{effects_glitch} -> {glitch}
{scene_scene1} -> {scene1}
```

### Collision between owners

If two entities want the same prompt-facing name, minimally qualify them with semantic ownership.

```text
{style_main}   -> {styleMain}
{effects_main} -> {effectsMain}
```

### Collision with a user variable

User-authored variables keep their authored key. The entity is qualified around them.

```text
{main} = "user value"
{style_main} -> {styleMain}
```

### Nested specialized entities

When child names collide, prefer parent semantic qualification before broader module qualification.

```text
hair style Curly Updo / Bangs -> {curlyUpdoBangs}
hair style Sleek Bob / Bangs  -> {sleekBobBangs}
```

The same principle applies to nested Outfit entities.

## Layout

Layout regions are named configurations and their user-facing region name is the preferred prompt identity.

Example:

```text
{layout} =
Use a structured layout.
Interpret all region bounds as percentages from 0% to 100%.

Regions:
• {topLeft} (content: {scene1}; bounds: x: 0%, y: 0%, width: 50%, height: 50%).
• {topRight} (content: {scene2}; bounds: x: 50%, y: 0%, width: 50%, height: 50%).
• {bottomLeft} (content: {scene3}; bounds: x: 0%, y: 50%, width: 50%, height: 50%).
• {bottomRight} (content: {scene4}; bounds: x: 50%, y: 50%, width: 50%, height: 50%).
```

Canonical structured geometry remains normalized `0..1`. Prompt-facing Modular/Natural output uses percentages for readability and direct spatial interpretation.

The automatic Scene/Layout rule intentionally remains:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

The word `exactly` is retained because repeated real generation tests produced acceptable near-exact Layout adherence. It should not be weakened solely on theoretical model limitations; change it only if new empirical evidence supports a better instruction.

The obsolete compiler alias namespace `{r_1}`, `{r_2}`, ... is no longer the preferred Layout identity and is no longer reserved from user variables.

## Typography

Typography is intentionally different from named Layout regions.

Typography groups currently do not expose a user-authored semantic name suitable for global prompt identity, while Layout needs a compact handle to bind content to a group. Therefore compiler-owned group aliases remain:

```text
{tg_1}
{tg_2}
```

Text items normally use their user Text variable directly:

```text
• {tg_1}: arrange {title} and {slogan} vertically ... Style {title} ... Style {slogan} ...
```

Internal Typography text entities are not exposed unless another semantic relationship genuinely targets that text entity. In that edge case a short compiler-owned `{tt_n}` alias may be emitted.

The `tg_*` and `tt_*` namespaces remain reserved from user variables.

Stable Text-variable identity is preserved internally. Renaming a user Text variable changes its prompt-facing token without requiring Typography groups to be recreated.

## Generic named-configuration modules

All modules registered through the generic `ModuleEntity` capability use the same prompt-facing identity rule:

- Form
- Camera
- Framing
- Background
- Lighting
- Style
- Effects
- Texture

A named configuration's internal token may remain `{moduleName_entityKey}` internally, but Modular/Natural output prefers the semantic entity key/name without the redundant module prefix when unambiguous.

Scene instructions and module definitions must resolve through the same alias registry, so references cannot drift from definitions.

### Effects wording

Because the module block already establishes the semantic owner, named Effects definitions do not repeat the label `Effects:` inside each configuration.

Preferred:

```text
{effects} =
• {effects1} = subtle composited light-leak overlay; balanced dust-and-scratch film-damage overlay.
```

Avoid:

```text
{effects} =
• {effects1} = Effects: subtle composited light-leak overlay ...
```

This is a wording simplification only; Effects identity and cross-module wiring remain unchanged.

## Specialized entity modules

### Scene

Scene persistence identity stays stable. Prompt output uses the Scene semantic name/key when unambiguous.

```text
{scene_scene1} -> {scene1}
```

The module presentation key remains `{scenes}` in Modular output.

### Hair

Hair style/component persistence and globally namespaced structural tokens remain unchanged. Prompt-facing aliases are semantic and participate in global collision resolution.

### Outfit

Outfit set/item persistence and structural tokens remain unchanged. Prompt-facing aliases are semantic and participate in global collision resolution.

### Layout / Typography

Covered by their dedicated rules above.

## Audit of registered modules

| Module | Owns named/structural child identity? | Prompt-facing identity policy |
| --- | --- | --- |
| Variables | User variables | User key wins; participates in collision reservation |
| Layout | Regions | Region name -> lowerCamelCase semantic alias |
| Scene | Scenes | Scene semantic key/name; remove redundant `scene_` namespace |
| Style | Generic named config | Semantic entity name/key; qualify only on collision |
| Form | Generic named config | Semantic entity name/key; qualify only on collision |
| Framing | Generic named config | Semantic entity name/key; qualify only on collision |
| Expression | No owned named config in this architecture | References to other entities are rewritten by global registry |
| Pose | No owned named config in this architecture | References to other entities are rewritten by global registry |
| Hair | Styles + components | Semantic aliases; parent qualification for child collisions |
| Outfit | Sets + items | Semantic aliases; parent qualification for child collisions |
| Background | Generic named config | Semantic entity name/key; qualify only on collision |
| Lighting | Generic named config | Semantic entity name/key; qualify only on collision |
| Camera | Generic named config | Semantic entity name/key; qualify only on collision |
| ColorPalette | Assignment rules, not named reusable configs | Any target tokens are rewritten by global registry |
| Typography | Groups + text entities | `{tg_n}` groups; user Text variables directly; `{tt_n}` only when necessary |
| Effects | Generic named config | Semantic entity name/key; qualify only on collision; no redundant `Effects:` label |
| Texture | Generic named config | Semantic entity name/key; qualify only on collision |

## Output-format contract

### Modular

Uses semantic prompt identities and keeps explicit module definitions/references.

Layout and Typography use dedicated semantic serializers rather than exposing raw structured objects.

### Natural

Uses the same semantic identity registry. Natural and Modular must not disagree about the identity of the same entity within a compile.

### JSON

JSON is the canonical structured representation and is not rewritten into prompt-facing aliases. Internal IDs, canonical keys, and normalized structured data may remain visible there.

## Preview contract

Collapsed module-card previews and final Output panel use the same prompt-facing identity registry.

A preview must not expose a different identity from the final prompt for the same active state.

## Implementation contract

Primary implementation layers:

- `app/utils/promptIdentity.ts`: state-backed identity registry and global collision allocation.
- `app/utils/promptFacingIdentity.ts`: trusted output-backed fallback for callers that only provide canonical module outputs.
- `app/utils/promptOutputAliases.ts`: final structured-module formatting + prompt-facing rewrite pass.
- `app/utils/specializedEntityAliases.ts`: Hair/Outfit block promotion using aliases allocated by the global registry.
- `app/utils/moduleOutputPreview.ts`: display-only preview using the same registry.
- `app/utils/compileLayoutNatural.ts`: prompt-facing Layout serializer.
- `app/utils/compileTypographyNatural.ts`: prompt-facing Typography serializer.
- `app/utils/compileEffects.ts`: concise Effects wording.

Canonical module compilers remain free to use stable internal tokens. Prompt-facing rewriting belongs at the final presentation boundary.

## Non-negotiable invariants

1. Never change persistence identity merely to shorten prompt text.
2. Never blindly remove `moduleName_` from arbitrary strings.
3. Rewrite complete known tokens only.
4. Definitions and every reference to them must receive the same alias.
5. User variable keys have priority over generated semantic aliases.
6. Collisions must be deterministic and unambiguous.
7. JSON stays canonical.
8. Module previews and final output must agree.
9. Typography group aliases stay compiler-owned until Typography gains a real user-authored semantic group name.
10. New named-configuration modules must join this registry rather than inventing a module-local alias scheme.
11. Layout Region names are prompt-facing semantic identity; stable Region IDs remain persistence identity.
12. The Scene/Layout `exactly` rule is an empirical generation contract and must not be weakened without new evidence.

## Validation record

Final validation on `refactor/module-wording`:

```text
pnpm test:module-wording
13 passed / 0 failed

pnpm test:actions-api
176 passed / 0 failed
```

Manual application validation also confirmed the intended four-Scene graph, named Layout Regions, semantic named-configuration aliases, downstream Scene references, matching module previews, and concise Effects definitions.

The refactor is considered complete.
