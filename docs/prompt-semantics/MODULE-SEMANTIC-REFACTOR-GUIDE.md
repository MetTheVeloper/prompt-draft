# Prompt Draft — Semantic Module Refactor Guide

## Purpose

This document defines the reusable process for semantically refactoring Prompt Draft's remaining key modules.

The goal is **not** to make prompts shorter for the sake of brevity. The goal is to remove semantic pollution, define clean ownership boundaries, improve composability, and make every module emit the minimum sufficient semantic signal that belongs to it.

Use this guide as the operating contract for future module-by-module refactors.

---

# 1. Core Mental Model: The Circuit Board

Treat Prompt Draft like an electronic circuit board.

- The full prompt is the board.
- Every key module is a component.
- Every field inside a module is a smaller component.
- Each component should perform its own job precisely.
- A component must not guess what the rest of the board is trying to do.
- A component must not silently perform the responsibility of another component.
- Components may intentionally combine, but they should remain independently understandable and replaceable.

A good module should be able to say:

> "This is the semantic signal I own. Nothing more."

For example:

- Style owns visual aesthetic and rendering language.
- Form owns form language, proportions, and structural transformation.
- Setup owns core prompt context and reference-level controls.
- Camera should not secretly decide lighting.
- Lighting should not secretly decide mood unless mood is explicitly part of Lighting's contract.
- Framing should not silently define camera lens behavior.
- Texture should not redefine material construction if another module owns material semantics.

The module system becomes reliable only when these boundaries are explicit.

---

# 2. Primary Goal: Minimum Sufficient Prompt Semantics

The target is **minimum sufficient prompt semantics**.

This does **not** mean "shortest possible prompt."

Keep a phrase when it contributes a real, independent, useful semantic signal.

Remove a phrase when it:

- repeats another selected field,
- assumes an unstated purpose,
- introduces a subject the user did not choose,
- adds generic quality language,
- leaks another module's responsibility,
- over-specifies details that are not intrinsic to the selected option,
- or merely explains the option instead of instructing the generation model.

A long output can be correct if every phrase earns its place.

A short output can still be bad if it contains the wrong assumptions.

---

# 3. The Five Mandatory Semantic Questions

For every field, option, preset, promptText, generated fallback, or compiler phrase, ask all five questions.

## Question 1 — Is this phrase directly implied by the user's selection?

If the user selected `Pixel Art`, then `pixel-art aesthetic` is directly implied.

But `minimal detail`, `block-built volumetric forms`, or `game asset` are not necessarily implied.

Only emit what the selection actually guarantees.

## Question 2 — Does this assume an output purpose or use case the user did not select?

Common semantic pollution includes phrases such as:

- poster layout,
- social media post,
- game asset,
- product advertising,
- document design,
- cinematic title card,
- professional portrait,
- studio photography,
- mobile content.

A format, style, medium, ratio, or technique must not infer a purpose merely because that purpose is common.

## Question 3 — Does this decide something owned by another field or module?

Examples:

- Aspect ratio should not decide layout composition.
- Style should not decide subject form.
- Form should not decide texture or material unless explicitly part of Form's contract.
- Camera should not decide lighting.
- Lighting should not decide camera position.
- Framing should not decide subject pose.
- Color Palette should not decide lighting mood.

If another module can reasonably own the concept, stop and define the boundary before coding.

## Question 4 — Does this contain generic noise?

Be suspicious of phrases such as:

- high quality,
- premium,
- professional,
- beautiful,
- visually appealing,
- detailed,
- polished,
- cinematic,
- dramatic,
- masterpiece,

unless the option specifically and intentionally represents that semantic dimension.

Generic positive adjectives usually reduce control rather than improve it.

## Question 5 — If this phrase is removed, does the model still understand the intended effect?

If yes, the phrase may be redundant.

This is especially useful when multiple selected fields repeat the same concept with different wording.

Example:

```text
serpentine form language,
elongated body proportions,
serpentine anatomical elongation
```

These can all coexist only if each contributes a distinct axis:

- overall form language,
- proportion relationship,
- transformation behavior.

If two phrases do the same job, rewrite or remove one.

---

# 4. Refactor Workflow for Every Module

Do not start by rewriting option text.

Follow this order.

## Step 1 — Read the Current Module Completely

Inspect:

- module definition,
- fields,
- groups,
- defaults,
- options,
- `promptText`,
- presets,
- compatibility rules,
- compiler configuration,
- custom/override behavior,
- related UI components,
- translation keys,
- system-variable exposure if applicable.

Also inspect adjacent modules that may overlap conceptually.

The first task is understanding, not editing.

## Step 2 — Write the Module's One-Sentence Responsibility

Before changing code, define the module in one sentence.

Example:

> Form controls form language, proportions, and intentional structural transformation without defining visual style.

If the sentence contains several unrelated responsibilities, the module may need to be split.

If another module could reasonably use the same sentence, there is probably an ownership collision.

## Step 3 — Define Explicit Non-Responsibilities

Write what the module **must not** own.

Example for Form:

```text
Does not own:
- aesthetic
- medium
- color palette
- texture
- lighting
- camera
- composition
```

This negative contract is as important as the positive contract.

## Step 4 — Audit Every Existing Field

For each field, classify it as one of:

1. **Keep** — correct independent semantic axis.
2. **Rewrite** — valid axis, polluted wording.
3. **Move** — valid concept, wrong module.
4. **Split** — field currently mixes multiple independent axes.
5. **Merge** — duplicate semantic responsibility.
6. **Remove** — no useful independent control.
7. **Add** — a real semantic axis is missing.

Do not preserve bad schema purely for backward compatibility if project versioning can handle migration.

## Step 5 — Audit Options Within Each Field

Each option must:

- represent one clear concept,
- be subject-neutral unless intentionally subject-specific,
- avoid purpose assumptions,
- avoid duplicating sibling fields,
- have concise but sufficient `promptText`,
- combine meaningfully with other options.

Do not expand catalogs just to make them large.

Add options only when they create a genuinely new useful combination.

## Step 6 — Audit Defaults

Defaults are semantic output.

A non-empty default silently makes a decision for the user.

Ask:

> If the user activates this module but never touches this field, is this semantic choice truly justified?

If not, prefer an empty default.

A default such as `controlled stylization` may look harmless but still inject an assumption into every prompt.

## Step 7 — Audit Presets

A preset is a state recipe, not a prose paragraph.

A good preset should set only the minimum fields required to establish its identity.

Do not use presets to over-configure the prompt.

Example philosophy:

```text
Pixel Art preset
→ pixel-art aesthetic
→ digital pixel art medium
```

Do not automatically add strong stylization, blocky form, minimal detail, or graphic finish unless those are intrinsic and necessary.

When switching presets, stale semantic state must not survive unintentionally.

When the user manually edits a preset-owned field, the preset should detach according to the generic preset lifecycle.

Cross-module preset coupling should be avoided unless testing proves it necessary.

## Step 8 — Define Compile Order Separately From UI Order

UI order and semantic prompt order are different concerns.

If semantic readability requires a specific field sequence, use compile configuration rather than rearranging the UI solely for output order.

A typical module output should move from broad identity to specific modification:

```text
identity / base language
→ medium or mechanism
→ structural modifiers
→ treatments
→ detail/finish
→ extra details
```

But every module should define its own appropriate order.

## Step 9 — Add Compatibility Only for Real Conflicts

Compatibility rules should help, not police creativity.

Prefer warnings over blocking.

Add a compatibility warning when two selections have a high-confidence semantic tension that may produce unpredictable results.

Do not warn merely because a combination is unusual.

Creative tension can be intentional.

A warning should communicate:

- what is conflicting,
- that the combination is still allowed,
- and that output may become less predictable.

## Step 10 — Support Subject-Aware Options When Useful

Some semantic controls are universal; others only make sense for particular subject types.

Use subject applicability metadata rather than hardcoding separate module implementations.

Conceptually:

```ts
appliesTo: ["person"]
```

or:

```ts
appliesTo: ["person", "animal"]
```

Universal options remain available everywhere.

Subject-specific options should appear only in relevant contexts.

If a user selects a subject-specific option and later changes Subject Type, preserve the existing value and warn rather than silently deleting user state.

Subject Type is **editor context metadata**. It should not be injected into prompt text merely because it is selected.

---

# 5. Semantic Data vs Context Metadata vs Application State

Every value in the system should be classified.

## Semantic Prompt Data

Values that belong in the generated prompt and may be useful as reusable nested variables.

Examples:

```text
{idea}
{subject}
{reference}
{aspect}
```

## Context Metadata

Values used to guide the editor or modules but not directly emitted.

Example:

```text
subjectType = person
```

This can change available Form/Pose/Hair/etc. controls without producing:

```text
{subject_type} = person
```

## Application State

Values needed by the UI/editor but not meaningful prompt semantics.

Do not expose application state as prompt tokens just because it exists in settings.

For System Variables, distinguish between:

- values that are active/resolvable,
- values that are useful and explicitly insertable.

Not every generated setup key belongs in the Variable Picker.

---

# 6. Nested Variable Principle

Prompt Draft supports reusable nested semantic tokens.

Prefer existing semantic handles instead of repeating their literal definitions.

Example:

```text
{reference} = attached reference image
{subject} = scene or environment in {reference}
```

is better than:

```text
{subject} = scene or environment in the attached reference image
```

when `{reference}` already exists.

Likewise, modules and user-authored text may reference:

```text
{subject}
{reference}
{idea}
```

when doing so improves modularity and avoids duplicated definitions.

Do not introduce nested variables merely for cleverness. Use them when a semantic concept is already a stable first-class key.

---

# 7. Subject-Agnostic First, Subject-Specific Second

Whenever possible, design the universal semantic vocabulary first.

Then add subject-specific vocabulary only where it provides genuinely useful precision.

Example from Form:

Universal transformations:

```text
stretch
squash
inflate
compress
twist
warp
fold
fragment
```

Person-specific transformations can then add anatomy-related controls.

Typography-specific controls can add letterform transformations.

Scene-specific controls can add terrain/environment transformations.

Animal-specific controls can add anatomy appropriate to animals.

Do not contaminate universal options with `body`, `face`, `limbs`, `character`, `poster`, `product`, etc.

---

# 8. Wording Rules for `promptText`

Good `promptText` should be:

- model-readable,
- direct,
- semantically focused,
- composable,
- subject-neutral unless intentionally specialized,
- free from marketing language,
- free from unnecessary explanation.

Prefer:

```text
bold contour linework
```

over:

```text
beautiful bold professional contour lines that create a striking visual appearance
```

Prefer:

```text
faceted planar form language with distinct angular breaks
```

over:

```text
a highly stylized low-poly-like structure that makes the subject look like a 3D game asset
```

The prompt text is not UI documentation. It is generation semantics.

---

# 9. Avoid Semantic Smuggling

Semantic smuggling happens when an option is missing a proper independent field, so its semantics get hidden inside another field.

Examples:

- Linework hidden inside Aesthetic.
- Detail density hidden inside Visual Treatment.
- Shape Language hidden inside Style.
- Camera viewpoint hidden inside Composition.

When this happens repeatedly, ask whether an independent field or module is missing.

Do not keep expanding a field's `promptText` to compensate for missing architecture.

---

# 10. Testing Process

Refactor is iterative. Code is not considered complete immediately after implementation.

For every module:

## Phase A — Isolated Output Tests

Select individual options and inspect the module's compiled output.

Check:

- Does each field contribute an independent signal?
- Is anything repeated?
- Is anything assumed?
- Is the wording too verbose?
- Is the wording too vague?

## Phase B — Combination Tests

Test realistic combinations of multiple fields.

Look for:

- semantic overlap,
- contradictions,
- wording repetition,
- accidental over-configuration.

## Phase C — Cross-Module Tests

Combine the module with already-refactored modules.

Verify ownership boundaries.

Example:

```text
Style + Form
Camera + Framing
Lighting + Color Palette
```

A module may look clean alone but collide with another module in full prompt output.

## Phase D — Subject Diversity Tests

When applicable, test across several subject types:

```text
Person
Object
Animal
Scene / Environment
Typography
Architecture
Abstract
```

A supposedly universal option should not leak anatomy or use-case assumptions.

## Phase E — Full Prompt Tests

Inspect the complete Modular output.

The whole prompt should feel like independent semantic components assembled intentionally, not several authors repeating instructions.

## Phase F — Image Generation Tests

Where possible, generate real images.

Image tests outrank purely theoretical wording preferences.

If a phrase that seems redundant consistently improves desired behavior without harmful bias, keep it.

If a semantically elegant phrase performs poorly, investigate and revise it.

The goal is useful semantic control, not linguistic purity.

---

# 11. User Feedback Loop

The refactor is collaborative and iterative.

After each meaningful patch:

1. Build the project.
2. User tests UI behavior.
3. User sends compiled outputs and, when useful, image-generation observations.
4. Analyze the outputs together.
5. Identify actual issues rather than hypothetical perfection problems.
6. Patch again.
7. Repeat until the module is reliable.

Do not declare a module finished merely because the code looks clean.

Do not continue micro-polishing forever after outputs are already reliable.

---

# 12. Closure Criteria

A module can be considered semantically closed when:

- its responsibility is clear,
- its non-responsibilities are clear,
- fields represent independent semantic axes,
- defaults do not inject unjustified assumptions,
- option wording is clean and composable,
- presets are minimum-sufficient,
- subject-specific behavior is appropriately scoped,
- high-confidence conflicts are handled predictably,
- system-variable exposure is intentional,
- isolated tests pass,
- combination tests pass,
- full prompt tests look coherent,
- real image tests do not expose a meaningful unresolved flaw,
- `pnpm generate` passes.

Once closed, stop theoretical micro-optimization.

Reopen the module only when a concrete test reveals a real problem or a later module exposes an ownership conflict.

Create a checkpoint commit when a major module/stage is closed.

---

# 13. Translation Workflow During Semantic Refactor

Do **not** directly edit locale files on the semantic-refactor branch unless explicitly requested.

When labels/descriptions change, create or update a flat English patch under:

```text
scripts/i18n-patches/
```

Example command:

```powershell
pnpm tsx scripts/merge-i18n.ts --locale en --patch scripts/i18n-patches/<patch-file>.ts --write --overwrite
```

Do not add Chinese, Russian, Arabic, Persian, or other locale translations as part of this semantic-refactor workflow unless specifically requested.

This keeps semantic architecture changes separate from locale maintenance.

---

# 14. Git / Checkpoint Workflow

Work on:

```text
refactor/prompt-semantics
```

After remote changes are made, the local user normally only needs:

```powershell
git pull
```

Then apply any required English i18n patch and run:

```powershell
pnpm generate
```

At the end of a major completed stage, create a clearly named checkpoint commit.

Examples:

```text
chore(prompt-semantics): checkpoint style and form
chore(prompt-semantics): checkpoint setup refactor
```

Checkpoint commits are semantic milestones, not substitutes for the implementation commits that precede them.

---

# 15. What We Learned From Style

Style established several reusable principles:

- broad aesthetic identity and concrete medium are separate axes,
- linework deserves its own axis,
- detail density deserves its own axis,
- visual treatment should describe rendering/mark-making, not steal texture/detail responsibilities,
- finish should describe finish, not generic quality,
- Style should not own form geometry,
- preset recipes should be minimum-sufficient,
- a module default should remain semantically empty unless a choice is justified.

The important lesson is not the exact Style fields. The lesson is how to discover independent axes and remove hidden assumptions.

---

# 16. What We Learned From Form

Form demonstrated how to resolve a module-boundary collision.

The old Deformation module mixed:

- subject anatomy,
- form language,
- proportions,
- transformations,
- material assumptions,
- style assumptions,
- motion assumptions,
- fashion context.

Instead of merely renaming it, the module was redesigned around clear ownership:

```text
Form Language
Proportions
Transformation
Form Transformation Strength
Extra Details
```

Universal vocabulary was separated from subject-specific vocabulary.

Subject applicability metadata was introduced.

Compatibility warnings were added only for strong conflicts.

The key lesson:

> If a module's useful options are mixed with bad architecture, preserve the useful semantic ideas but redesign the ownership model instead of blindly preserving the old schema.

---

# 17. What We Learned From Setup

Setup demonstrated the difference between semantic prompt data and editor context.

Canonical examples:

```text
idea
→ semantic prompt value

subject
→ semantic prompt value
→ reusable nested variable

subjectType
→ editor/module context metadata
→ not emitted by itself

reference
→ semantic handle for the input image

aspect
→ only the raw width:height ratio in prompt output
```

It also demonstrated semantic nesting:

```text
{reference} = attached reference image
{subject} = scene or environment in {reference}
```

And it clarified three distinct image-to-image controls:

```text
Reference Usage
→ fidelity to the reference

Reference Transformation Strength
→ overall degree of image-to-image transformation

Form Transformation Strength
→ strength of structural Form transformation

Preserve
→ declarative list of properties that must remain stable
```

The key lesson:

> Similar words do not necessarily mean duplicate controls. Determine the scope of the semantic axis before merging or deleting anything.

---

# 18. Recommended Order for Remaining Modules

Do not treat this as immutable. Re-evaluate when ownership collisions are discovered.

A reasonable next sequence is:

```text
Layout + Framing
Camera
Lighting
Color Palette + Texture
Pose / Expression
Hair / Outfit
Effects / Background
other remaining modules
```

Closely related modules should sometimes be audited together when their ownership boundary is the main problem.

For example, Layout and Framing should likely be reviewed together because both participate in spatial organization but should not own the same decisions.

---

# 19. Operating Instructions for the Next Chat

When starting work on a new module, follow this conversation pattern.

## First response / audit

1. Read the target module's current implementation.
2. Read compiler behavior relevant to it.
3. Read neighboring modules that may overlap.
4. Explain the module's current responsibility in plain language.
5. Identify semantic pollution, duplicated ownership, missing independent axes, problematic defaults, and subject-specific leakage.
6. Propose the clean ownership model before making broad changes.

Do not reflexively agree with every existing design or every user suggestion.

Challenge a proposal when another architecture would produce cleaner semantic output.

## Implementation

Once direction is agreed:

1. Implement the structural refactor.
2. Keep useful existing ideas where they belong.
3. Remove semantic pollution.
4. Add missing independent controls only when justified.
5. Add translation patch keys without editing locale files directly.
6. Document the semantic stage.
7. Give concise test instructions.

## Test review

When the user returns compiled outputs:

- review each phrase for semantic ownership,
- detect overlap between fields,
- detect conflict between modules,
- distinguish real problems from harmless intentional reinforcement,
- use real image-generation results as evidence,
- patch only what testing justifies.

## Final polish

Near completion:

- perform one focused wording-consistency pass,
- avoid architecture churn if the structure is already reliable,
- run/recommend `pnpm generate`,
- declare the module closed only after tests pass,
- create a checkpoint before starting the next major stage.

---

# 20. The Refactor Standard

The final question for every module is:

> If a user combines this module with every other module, will each phrase still have one clear reason to exist?

A successful Prompt Draft module should behave like a good circuit-board component:

- precise,
- independent,
- composable,
- predictable,
- powerful when combined,
- silent about decisions it does not own.

That is the standard for the remaining semantic refactor.
