# Prompt Draft — Canonical Semantic Refactor Reference

## Status and purpose

This is the canonical operating reference for semantic refactoring of Prompt Draft modules.

Use this file when starting or continuing a semantic-refactor conversation. It consolidates the reusable rules and lessons established through the completed Style, Form, Setup, Layout, Typography-output, Framing, Camera, Lighting, Color Palette, Texture / Material, Pose + Expression, and Background + Effects stages.

The goal is not prompt brevity for its own sake. The goal is **minimum sufficient prompt semantics**: every emitted phrase should represent one useful decision that belongs to the correct semantic owner.

Detailed implementation history remains available in the numbered stage documents under `docs/prompt-semantics/`.

---

# 1. Core mental model: the circuit board

Treat Prompt Draft like an electronic circuit board.

- The full prompt is the board.
- Every key module is a component.
- Every field is a smaller component.
- A component should do its own job precisely.
- A component must not guess what unrelated components are trying to do.
- A component must not silently perform another module's responsibility.
- Components may combine, but they must remain independently understandable and replaceable.

A healthy module should be able to say:

> This is the semantic signal I own. Nothing more.

The final standard is:

> If a user combines this module with every other module, will each emitted phrase still have one clear reason to exist?

---

# 2. Minimum sufficient prompt semantics

A phrase earns its place when it contributes a real, independent and useful signal.

Remove or rewrite a phrase when it:

- repeats another selected field,
- assumes an output purpose the user did not select,
- introduces an unstated subject or context,
- leaks another module's responsibility,
- adds generic quality language,
- over-specifies details not intrinsic to the option,
- explains an option instead of instructing the generation model,
- or exists only because similar prompts commonly contain it.

A long output can be correct when every phrase contributes an independent semantic axis. A short output can still be wrong when it contains hidden assumptions.

---

# 3. Mandatory semantic questions

For every field, option, preset, compiler phrase, fallback, generated variable or serializer decision, ask:

1. **Is it directly implied by the user's selection?**
2. **Does it assume a use case the user did not select?**
3. **Does it decide something owned by another module or field?**
4. **Is it generic positive noise rather than a real semantic axis?**
5. **If removed, would the intended semantic remain clear?**

Examples of suspicious generic language:

```text
high quality
premium
professional
beautiful
masterpiece
polished
cinematic
dramatic
detailed
```

Keep such words only when they intentionally represent the selected semantic dimension.

---

# 4. Define ownership before editing code

Before refactoring a module, write two contracts.

## 4.1 One-sentence responsibility

State exactly what the module owns.

Example:

> Framing defines how the subject is covered, placed and viewed inside an image frame without defining camera optics or body pose.

## 4.2 Explicit non-responsibilities

State what the module does **not** own.

The negative contract is as important as the positive one. If another module can reasonably own a concept, define the boundary before coding.

---

# 5. Audit the existing schema before rewriting wording

Do not begin by polishing `promptText`.

For every existing field classify it as:

1. **Keep** — correct independent semantic axis.
2. **Rewrite** — valid axis, polluted wording.
3. **Move** — useful concept owned by another module.
4. **Split** — one field mixes independent decisions.
5. **Merge** — duplicate responsibility.
6. **Remove** — no independent useful control.
7. **Add** — a real useful semantic axis is missing.

Preserve useful ideas, not necessarily the old schema.

> Preserve useful semantic ideas, not bad architecture.

---

# 6. Orthogonal-axis rule

A single select must not mix independent decisions merely because they are related conceptually.

Ask:

> Can the user reasonably want two of these choices at the same time?

If yes, they probably do not belong to the same exclusive axis.

## Single-select rule

Use a single select when sibling values are mutually exclusive versions of the same decision.

## Multi-select rule

Use multi-select when independent features can meaningfully coexist and do not require independent per-item properties.

## Repeated-layer/entity rule

Do **not** use a flat multi-select plus one shared modifier when selected items can legitimately need different modifier values.

Ask:

> Can two selected items coexist while needing different intensity, details, scope, targets, or other properties?

If yes, model repeated structured entities instead.

Canonical examples:

```text
Lighting Sources[]
Material Assignments[]
Pose Assignments[]
Expression Assignments[]
Effect Layers[]
```

Effects established the clearest modifier example:

```text
grain → subtle
glitch → strong
HUD overlay → balanced + custom details
```

UI convenience must not determine semantic structure.

---

# 7. Audit every option

Each option should:

- represent one clear concept,
- avoid assuming unrelated purpose/context,
- avoid duplicating sibling fields,
- be subject-neutral unless intentionally subject-specific,
- combine coherently with other fields,
- have concise but sufficient `promptText`,
- avoid explaining causal effects unless the causal effect itself is required semantics.

Do not enlarge catalogs merely to increase option count. Add options only when they create a genuinely new useful combination.

---

# 8. Defaults are semantic output

A non-empty default silently makes a decision for the user.

Ask:

> If the user enables this module and changes nothing, is this semantic choice justified?

If not, prefer neutral defaults:

```text
""
[]
```

A module may exist in the editor while producing no output until the user actually chooses something.

---

# 9. Presets are state recipes, not prose bundles

A preset should set only the minimum fields required to establish its identity.

Preset rules:

- presets populate editable semantic state,
- preset names should not compile when explicit fields already encode the instruction,
- switching presets must not leave unintended stale state,
- manual edits should detach active preset state without destroying the actual values,
- replaceable components should remain neutral,
- cross-module preset coupling should be avoided unless real tests prove it necessary.

Named hardware, material, background, lighting, and effect recipes should remain inspectable and editable after selection.

---

# 10. Semantic data, context metadata and application state

Every value should belong to one of three categories.

## 10.1 Semantic prompt data

Values that belong in generated prompt semantics.

Examples:

```text
idea
subject
reference
aspect
```

## 10.2 Context metadata

Values used to guide the editor without being emitted by themselves.

Example:

```text
subjectType = person
```

## 10.3 Application state

UI/editor state with no prompt meaning.

Do not expose application state as prompt variables merely because it exists in settings.

---

# 11. Subject-agnostic first, subject-specific second

Design universal vocabulary first whenever possible.

Then add subject-specific precision through applicability metadata such as:

```ts
appliesTo: ["person"]
```

Use restrictions only when semantics truly depend on anatomy or subject type. Do not restrict an option merely because it is commonly used with one subject type.

If context changes make a selected value incompatible, prefer warning/preservation over silently deleting user state.

---

# 12. Stable identity, variables and typed semantic references

Use stable semantic handles when they improve modularity.

Canonical nested-variable example:

```text
{reference} = attached reference image
{subject} = person in {reference}
```

For reusable structural entities:

```text
ID/token → stable identity
name     → editable human label
```

Renaming a Layout region, Typography group, or other structural entity must not break references.

Variable and reference types are semantic contracts, not merely UI labels. Do not make every variable selectable everywhere merely because a token exists.

Examples:

```text
Color variable          → reusable palette value
Subject/Object variable → color/material target when compatible
Typography Group/Text   → structural semantic target
Subject variable        → Pose/Expression recipient
Object variable         → may participate in Pose details without becoming a Pose recipient
```

Store stable IDs alongside token/label snapshots so missing references can remain visible instead of silently deleting user intent.

## Capability-driven module targets

When module outputs can be targeted by another semantic system, consumers should request capabilities rather than hard-code module names.

Example:

```text
Color Palette asks for: color
Texture asks for: material
```

Target identity should survive a generic-target → linked-module-output upgrade without creating duplicates.

## Target policy is separate from shared assignment infrastructure

Shared assignment mechanics do not imply a universal target catalog.

Ask separately:

1. Does this module use shared assignment mechanics?
2. Which entities are valid recipients for this particular payload?

Color/Material may use broad target policies; Pose/Expression intentionally use subject-only recipients.

---

# 13. Structural tokens and prompt-graph preservation

Natural output is a human-readable serialization of the same prompt graph, not permission to flatten that graph.

If a token is used in final Natural output, preserve enough definition/context for the token to remain meaningful.

Recommended behavior:

- user variables remain defined and referenced,
- nested system variables preserve required dependency chains,
- linked module outputs preserve definitions when referenced,
- structural keys appear when referenced or when traceability materially helps,
- unreferenced implementation keys may remain hidden.

Do not replace reusable tokens with repeated prose merely to make Natural output look conversational.

---

# 14. Wording rules for `promptText`

Good `promptText` is:

- direct,
- model-readable,
- semantically focused,
- composable,
- concise but sufficient,
- subject-neutral unless intentionally specialized,
- free from marketing language,
- free from unnecessary explanations.

Prefer:

```text
bold contour linework
```

over explanatory or decorative prose.

UI documentation can explain. `promptText` should instruct.

---

# 15. Avoid semantic smuggling

Semantic smuggling happens when a missing axis is hidden inside another option's wording.

Examples discovered during completed stages:

- linework hidden inside Aesthetic,
- detail density hidden inside Visual Treatment,
- shape/form language hidden inside Style,
- lens behavior hidden inside Framing,
- purpose/style assumptions hidden inside Pose/Expression,
- material properties hidden inside global Texture prose,
- scene atmosphere hidden inside image-space Effects,
- post-processing hidden inside Background,
- lighting-native glow hidden inside Effects,
- Camera behavior hidden inside Effects.

When an option keeps growing to express unrelated behavior, stop expanding the wording and inspect the architecture.

Capability also must not imply operating context. For example, high-sensitivity capture response must not automatically imply a low-light scene.

---

# 16. Compile order is separate from UI order

UI organization and semantic prompt order are separate concerns.

When ordering matters, configure compile order explicitly rather than rearranging UI solely to change output text.

Each module defines its own correct order.

---

# 17. Choose output structure from semantic relationships

Not every module should compile the same way.

## Flat string modules

Use a compact string when the module is primarily a flat set of independent semantic descriptors.

## Structured-object modules

Use structured output when relationships themselves are semantic, such as Layout regions or Typography structures.

## Repeated relational entities

A module may keep repeated structured state while compiling to text. Preserve entity boundaries whenever properties must stay associated.

Examples:

```text
red + camera-left   → one light source
blue + camera-right → another light source

strong glitch + custom details → one effect layer
subtle grain                  → another effect layer
```

Do not flatten related properties into independent global lists.

## Relational assignment rules

When a module assigns payload to semantic targets, the whole assignment is the semantic unit.

The shared layer may own target identity, filtering, selection, missing references, scope summaries, and serialization helpers. The module must continue to own its payload semantics and recipient policy.

An entity referenced inside payload details is not automatically a valid assignment recipient.

---

# 18. Every structured or protected module needs an explicit Natural strategy

A structured-object module must either:

1. provide an explicit Natural serializer, or
2. explicitly declare that it has no Natural representation.

Repeated relational modules may require protected text blocks even when compiled output is a string.

Do not assume the generic Natural pipeline can safely split/regroup content containing coordinates, exact text, structural tokens, nested relationships, relational clauses, or keyword lists whose commas belong inside one semantic unit.

---

# 19. The Natural optimizer is a semantic boundary

An optimizer can corrupt otherwise correct module output through classification, regrouping, deduplication, punctuation rewriting, numeric/token handling, hidden limits, or variable-definition removal.

Canonical invariants:

> Every meaningful semantic item present in Modular output must still be represented in Natural output unless an intentional serializer transformation exists.

> Natural may rewrite prose, but it must not destroy the reusable prompt graph.

Test maximum realistic simultaneous selections, not only simple examples.

---

# 20. Compatibility rules

Compatibility should help rather than police creativity.

Prefer warnings over blocking or silent state mutation.

## Module-local conflicts

Warn only on high-confidence semantic tensions.

## Cross-module conflicts

Handle real cross-module contradictions at prompt-validation level. Do not silently disable either module.

Do not warn merely because a combination is unusual; creative tension can be intentional.

---

# 21. Semantic correctness is not generation determinism

Always separate two questions:

1. Did Prompt Draft correctly express what the user selected?
2. Did the image model obey those instructions consistently?

Prompt Draft directly controls the first. Image generation is probabilistic and model-dependent.

A semantically correct module may still have approximate model compliance.

---

# 22. Spatial controls require repeated identical-prompt tests

Do not classify a spatial feature as reliable based on one unusually accurate render.

For Layout, placement, geometry or other spatial claims:

1. run identical prompts multiple times,
2. compare variance,
3. classify reliability,
4. set product expectations accordingly.

Useful classes:

```text
Exact
Strong
Approximate
Weak
```

Do not keep adding prompt verbosity indefinitely when repeated tests show the image model is the limiting factor.

---

# 23. Testing workflow for every module

Refactor is iterative. Code cleanliness alone is not completion.

## Phase A — isolated output

Test individual options for ownership, redundancy, assumptions, wording clarity, and default neutrality.

## Phase B — combination tests

Combine fields/layers/assignments and look for non-orthogonal axes, contradictions, duplicated wording, stale preset state, and modifiers that should be per-item rather than global.

## Phase C — Natural vs Modular parity

Verify semantic-set and prompt-graph preservation.

## Phase D — subject diversity

When applicable, test Person, Animal, Object, Product, Vehicle, Architecture, Scene/Environment, Typography, and Custom contexts.

## Phase E — cross-module audit

Audit neighboring owners, for example:

```text
Style ↔ Form ↔ Texture
Framing ↔ Camera ↔ Pose ↔ Setup
Pose ↔ Expression ↔ Framing ↔ Setup
Lighting ↔ Color Palette ↔ Texture ↔ Camera
Background ↔ Layout ↔ Effects
Hair ↔ Outfit ↔ Color Palette ↔ Texture
```

## Phase F — full prompt tests

The final prompt should feel like independent components assembled intentionally rather than several authors repeating instructions.

## Phase G — real image tests

Generate actual images when useful. Image tests outrank purely theoretical wording preferences, but diagnose failure correctly:

- wrong semantic expression → refactor Prompt Draft,
- correct expression but stochastic compliance → adjust expectations,
- test framing/context hides the property → redesign the test.

---

# 24. Legacy state and migration

Schema refactors can leave old draft keys.

For every replaced/split field, explicitly decide whether legacy values should:

- migrate exactly,
- migrate to another module,
- remain preserved legacy data,
- or be discarded.

Do not invent cross-module migration merely to preserve old wording if it corrupts ownership.

A module may be semantically closed while migration remains deferred backlog work.

---

# 25. Deferred issues and review backlog

Use:

```text
docs/prompt-semantics/review-backlog/README.md
```

for real deferred issues.

A backlog item should record symptom, semantic owner, reason for deferral, preferred resolution direction, and verification/removal criteria.

Do not use the backlog as a graveyard for vague ideas.

---

# 26. Translation workflow

English remains the semantic source of truth for prompt meaning, but shipping semantic UI must keep English and Persian aligned.

Two workflows are supported:

## 26.1 Module-scoped locale fragments — preferred for major module rewrites

Background and Effects established this pattern:

```text
i18n/locales/<module>.en.ts
i18n/locales/<module>.fa.ts
```

Register both fragments in `i18n/i18n.config.ts` under the module key.

Use this approach when a module rewrite introduces a large, self-contained translation surface and editing giant root locale files would create unnecessary noise.

No merge command is required; the fragments load through normal i18n configuration.

## 26.2 Flat patch workflow — keep for broad or legacy locale edits

For existing root-locale changes that still use the patch system, keep the established `scripts/i18n-patches/` + `merge-i18n.ts` workflow.

Do not maintain the same keys simultaneously in both mechanisms.

Regardless of mechanism:

- English wording defines intended semantics,
- Persian should represent the same semantic distinction rather than merely literal word substitution,
- translation architecture must not change module ownership.

---

# 27. Git and checkpoint workflow

Primary semantic-refactor branch:

```text
refactor/prompt-semantics
```

Normal local sync instruction:

```bash
git pull
```

Create a checkpoint commit when a major semantic stage is closed. Checkpoint commits represent semantic milestones, not substitutes for implementation commits.

Do not force-update the branch when it has advanced; preserve concurrent commits and fast-forward safely.

---

# 28. Closure criteria

A module can be considered semantically closed when:

- responsibility and non-responsibilities are clear,
- fields/layers/assignments represent independent axes,
- exclusive vs combinable features are modeled correctly,
- per-item modifiers are local when required,
- defaults are neutral unless justified,
- options are concise and composable,
- presets are minimum-sufficient editable state recipes,
- subject applicability and target policy are intentional,
- module-local conflicts are predictable,
- cross-module boundaries have been audited,
- structured/relational output has an explicit Natural strategy when required,
- Natural does not silently lose Modular semantics or prompt-graph structure,
- isolated and combination tests pass,
- relevant subject-diversity tests pass,
- full prompt output is coherent,
- real image tests do not expose a semantic flaw,
- stochastic model limitations are not mistaken for prompt bugs,
- editor state/summaries remain correct for repeated entities,
- project generation/build validation passes before release integration.

Once these conditions are met, stop theoretical micro-polishing.

Reopen a closed module only when concrete later evidence reveals a real issue.

---

# 29. Lessons from completed stages

## Style

- aesthetic and medium are separate axes,
- linework and detail density deserve independent axes,
- Style must not own Form geometry or material surface behavior,
- presets should be minimum-sufficient and defaults neutral.

## Form

The old Deformation model mixed anatomy, form language, proportions, style, material, motion and context.

Final conceptual axes:

```text
Form Language
Proportions
Transformation
Form Transformation Strength
Extra Details
```

Key lesson: preserve useful semantic ideas, not bad architecture.

## Setup

Setup clarified semantic data vs context metadata and separated reference usage, reference transformation, form transformation, and preservation rules.

## Layout

Layout established stable structural identity, explicit structured output, protected Natural serialization, and realistic spatial-reliability expectations.

## Typography output

Typography proved that structured modules need explicit Natural serialization and that exact text/hierarchy may need protected blocks.

## Framing

Framing replaced a mega-select with orthogonal Shot Size, Subject Placement, Frame Balance, Composition Features, View Angle, View Direction, and Crop Safety axes.

## Camera

Camera separated capture system, capture response, lens profile, focus/depth, and capture behavior from Framing and Lighting. Named hardware works best as editable state recipes.

## Lighting

Lighting established bounded repeated sources with source-local role/type/direction/quality/intensity/color/features plus global ambient/contrast. Property relationships must remain associated.

## Color Palette

Color Palette established reference-aware relational assignments, stable semantic targets, capability-driven target selection, and editable literal/variable swatches.

## Texture / Material

Texture replaced a global image-texture concept with target-specific material assignments. Material identity, finish, surface texture, optical character, prominence, and condition are independent axes.

## Pose + Expression

Pose and Expression replaced global prose-heavy mega-selects with subject-scoped relational assignments while preserving strict body-vs-face ownership and subject-only recipient policy.

## Background + Effects

Stage 13 closed the scene-content vs image-space-effect boundary.

### Background owns

```text
background concept
depicted setting/environment
backdrop type
background material
spatial structure
detail density
secondary background elements
```

Background deliberately does not own Camera blur/DOF, Lighting behavior, Style identity, or image-space effects.

### Effects owns

```text
image-space post-processing
overlays
signal/damage artifacts
compression/degradation mechanisms
composited VFX
interface overlays
```

Effects deliberately does not own Camera behavior, Lighting sources, Style medium/treatment, physical Background construction, or material properties.

Key lessons:

- classify atmosphere-like concepts by **mechanism**, not vocabulary: depicted physical/environment content belongs to the scene owner; explicitly composited/image-space treatment belongs to Effects,
- `backgroundStyle` was better replaced by a semantic constructor than by another large style catalog,
- structured fields that can never have exhaustive taxonomies need field-local Custom escape hatches,
- multiple Custom fields must store independent companion state,
- `effectStyle[] + one global intensity` was structurally wrong because each effect can require its own modifier,
- Effect Layers establish a reusable repeated modifier-bearing entity pattern,
- mechanism-oriented effect names reduce ownership drift (`added film grain`, `composited motion trails`, `signal artifacts`) compared with aesthetic bundle names,
- real image-to-image testing confirmed that concise Background construction semantics can strongly replace a source backdrop without absorbing neighboring module responsibilities.

See `stage-13-background-effects-semantics.md` for closure evidence.

---

# 30. Recommended remaining module order

Re-evaluate when new ownership collisions appear, but the current preferred sequence is:

```text
1. Hair + Outfit
2. remaining smaller modules
3. final cross-module audit / migration planning
```

Background + Effects are closed in Stage 13 and should not be treated as the next open stage.

Hair + Outfit are next because:

- they are major remaining subject-detail owners,
- both already participate in capability-driven Color/Material targeting,
- their refactors must preserve those targetable module outputs,
- likely ownership boundaries include Hair ↔ Outfit ↔ Texture/Material ↔ Color Palette ↔ Style ↔ Form,
- existing catalogs may still mix physical garment/hair properties with aesthetic, material, color, pose, character archetype, or use-case assumptions.

Legacy migrations from prior closed stages remain backlog work and do not block the next semantic stage.

---

# 31. Operating instructions for a new chat

When continuing this refactor in another conversation, first read:

```text
docs/prompt-semantics/SEMANTIC-REFACTOR-REFERENCE.md
```

Then read:

- the target module implementation,
- relevant compiler/Natural code,
- neighboring modules with likely ownership overlap,
- the semantic review backlog,
- the most recent completed stage docs when useful.

For the next planned stage, inspect **Hair and Outfit together** before freezing either architecture, but do not assume they should merge.

Also read Stage 13 (`stage-13-background-effects-semantics.md`) as the most recent closure precedent, especially:

- constructor vs catalog decisions,
- scene-vs-effect mechanism ownership,
- field-local Custom values,
- repeated modifier-bearing layers,
- module-scoped locale fragments.

## First response / audit

1. Ask the mandatory original-intent discovery question for the new key module(s).
2. State each module's current responsibility.
3. State the proposed responsibility and non-responsibilities.
4. Identify semantic pollution and ownership collisions.
5. Identify mega-fields that should be split into orthogonal axes.
6. Decide single-select vs multi-select vs repeated entities from semantics.
7. Audit defaults and presets.
8. Propose the clean field model before broad implementation.

Do not reflexively preserve existing design. Challenge architecture when a cleaner ownership model exists.

## Implementation

Once direction is agreed:

1. implement structural changes,
2. preserve useful ideas in the correct owner,
3. remove semantic pollution,
4. define explicit compile behavior/order,
5. add compatibility only for high-confidence conflicts,
6. reuse shared infrastructure only when the semantic interaction truly matches,
7. keep English/Persian UI semantics aligned,
8. protect structured/relational Natural output when required,
9. preserve referenced variable/module graph structure,
10. avoid silent optimizer loss,
11. document the stage.

## Test review

When compiled outputs are returned:

- compare Modular vs Natural semantic parity,
- audit each phrase for ownership,
- test maximum realistic combinations,
- test subject applicability,
- test module-local conflicts,
- test neighboring modules,
- test variable/reference preservation,
- ensure real-image tests expose the intended semantic,
- distinguish prompt bugs from stochastic model behavior or prompt tension.

## Final closure

Before checkpoint:

- run one focused taxonomy/edge-case audit,
- perform one cross-module boundary audit,
- update backlog for deliberately deferred work,
- run project generation/build validation,
- perform real-image validation when useful,
- update this canonical reference with genuinely reusable lessons,
- create a semantic checkpoint only after tests pass.

---

# 32. Product constraint: do not overengineer the semantic engine

Prompt Draft can become architecturally sophisticated enough to hide its value from ordinary users.

The semantic engine should remain powerful, but future UX may expose it through simpler guided interfaces that translate high-level choices into the same module state.

Do not weaken semantic architecture merely to simplify the current editor. Likewise, do not add machinery merely because it is technically interesting.

For every major addition ask:

> Does this materially improve a user's ability to create a better prompt, or does it mainly make the architecture more elaborate?

Prefer product value over architectural novelty.

---

# 33. Mandatory module-intent discovery question

Before auditing a new key module in a new conversation, ask the user one explicit discovery question before proposing the refactor architecture:

> What was your original goal and idea when you created this module? What problem did you want it to solve for the user?

Treat the answer as first-class design context alongside current code, compiler behavior, test evidence, and neighboring module boundaries.

When a stage intentionally audits a related pair, ask for the original intent of both before freezing either architecture.

Do not skip this question merely because the current schema appears understandable.

---

# 34. The canonical reference must improve after every closed module

After a module is fully tested, approved by the user and closed with its semantic checkpoint, automatically perform a short lessons audit.

Ask internally:

> Did this module teach us a reusable semantic, compiler, validation, migration, testing, translation, UX or architectural lesson that is not already captured here?

If yes:

1. add the reusable lesson to this file,
2. keep it general enough to guide future modules,
3. update completed-stage lessons when the module establishes a useful precedent,
4. avoid duplicating guidance already captured,
5. make the reference update part of the closure/checkpoint workflow.

If the module teaches nothing materially new, do not add filler merely to make the document longer.
