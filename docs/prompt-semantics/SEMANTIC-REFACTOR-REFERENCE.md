# Prompt Draft — Canonical Semantic Refactor Reference

## Status and purpose

This is the canonical operating reference for semantic refactoring of Prompt Draft modules.

Use this file when starting or continuing a semantic-refactor conversation. It consolidates the original module refactor guide and the practical lessons learned from the completed Style, Form, Setup, Layout, Typography-output, and Framing work.

The goal is not prompt brevity for its own sake. The goal is **minimum sufficient prompt semantics**: every emitted phrase should represent one useful decision that belongs to the correct semantic owner.

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

A long output can be correct when every phrase contributes an independent semantic axis.

A short output can still be wrong when it contains hidden assumptions.

---

# 3. Mandatory semantic questions

For every field, option, preset, compiler phrase, fallback, generated variable or serializer decision, ask:

## 3.1 Is the phrase directly implied by the user's selection?

Emit only what the selection guarantees.

Example:

```text
Pixel Art
→ pixel-art aesthetic
```

Do not automatically infer:

```text
game asset
minimal detail
block-built subject anatomy
```

unless those are independently selected or intrinsic to the option's contract.

## 3.2 Does it assume a use case the user did not select?

Watch for accidental purpose semantics such as:

```text
poster
social media post
game asset
product advertising
professional portrait
studio photography
mobile content
editorial cover
```

A ratio, style, medium or technique must not infer a use case merely because the use case is common.

## 3.3 Does it decide something owned by another module or field?

Examples:

- Aspect ratio does not own layout composition.
- Style does not own subject geometry.
- Form does not own material or texture.
- Camera does not own lighting.
- Framing does not own lens behavior.
- Framing does not own body pose.
- Pose does not own viewpoint.
- Color Palette does not own lighting behavior.

If another module can reasonably own the concept, define the boundary before coding.

## 3.4 Is it generic noise?

Be suspicious of generic positive words such as:

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

Keep them only when they intentionally represent the selected semantic dimension.

## 3.5 If the phrase is removed, does the intended semantic remain clear?

If yes, it may be redundant.

Similar wording may still coexist when each phrase represents a distinct axis, for example:

```text
serpentine form language
elongated proportions
strong form transformation
```

These are different decisions even though all affect form.

---

# 4. Define ownership before editing code

Before refactoring a module, write two contracts.

## 4.1 One-sentence responsibility

Example:

> Framing defines how the subject is covered, placed and viewed inside an image frame without defining camera optics or body pose.

If the sentence contains several unrelated responsibilities, the module may need to be split internally or redesigned.

## 4.2 Explicit non-responsibilities

Write what the module does **not** own.

Example:

```text
Framing does not own:
- lens characteristics
- focal length / optical compression
- artifact/page layout
- aspect ratio
- body gesture or posture
- visual aesthetic
```

The negative contract is as important as the positive contract.

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

Bad architecture should not survive merely because old values existed.

---

# 6. Orthogonal-axis rule

This is one of the most important lessons from Framing.

A single select must not mix independent decisions merely because they are related conceptually.

Ask:

> Can the user reasonably want two of these choices at the same time?

If yes, they probably do not belong to the same exclusive axis.

Example of the old Framing problem:

```text
Full Subject
Rule of Thirds
Low Angle
No Crop
```

These are not alternatives. They can coexist.

The correct model became:

```text
Shot Size
+ Subject Placement
+ Frame Balance
+ Composition Features
+ View Angle
+ View Direction
+ Crop Safety
```

## Single-select rule

Use a single select when sibling values are mutually exclusive versions of the same decision.

Example:

```text
Symmetrical
Asymmetrical
```

## Multi-select rule

Use multi-select when independent features can meaningfully coexist.

Example:

```text
Negative Space
Layered Depth
Isolated Subject
Dynamic Diagonal
```

Do not let UI convenience determine semantic structure.

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

Do not enlarge catalogs merely to increase option count.

Add options only when they create a genuinely new useful combination.

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

Do not use presets to inject unrelated assumptions.

Conceptually:

```text
Pixel Art preset
→ pixel-art aesthetic
→ pixel-art medium
```

Do not automatically add form, detail, composition or purpose semantics unless they are essential to that preset.

Preset lifecycle rules:

- switching presets must not leave unintended stale state,
- manual edits should detach a preset according to the generic preset lifecycle,
- cross-module preset coupling should be avoided unless real testing proves it necessary.

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

These may also become reusable variables when useful.

## 10.2 Context metadata

Values used to guide the editor without being emitted by themselves.

Example:

```text
subjectType = person
```

This can filter Form, Framing, Pose, Hair or other options without emitting:

```text
{subject_type} = person
```

## 10.3 Application state

UI/editor state with no prompt meaning.

Do not expose application state as prompt variables merely because it exists in settings.

---

# 11. Subject-agnostic first, subject-specific second

Design universal vocabulary first whenever possible.

Then add subject-specific precision through applicability metadata.

Example:

```ts
appliesTo: ["person"]
```

or:

```ts
appliesTo: ["person", "animal"]
```

Universal options should remain available broadly.

Use subject-specific restrictions only when the semantics truly depend on anatomy or subject type.

Do not apply `appliesTo` merely because an option is commonly used with one subject type.

If a previously selected value becomes contextually incompatible after Subject Type changes, prefer warning/preservation over silently deleting user state.

---

# 12. Nested variables and structural identity

Use stable semantic handles when they improve modularity.

Example:

```text
{reference} = attached reference image
{subject} = person in {reference}
```

is preferable to repeating the literal reference phrase everywhere.

Do not create nested variables merely for cleverness.

## Stable identity rule

For reusable structural entities:

```text
ID/token → stable identity
name     → editable human label
```

Renaming a Layout region or Typography group must not break references.

Generated structural namespaces must be reserved so user variables cannot collide with them.

---

# 13. Structural tokens in output

Structured keys may be necessary in JSON/Modular while being noise in Natural prose.

Recommended behavior:

- JSON/Modular may expose stable structural tokens consistently.
- Natural should expose a structural token only when another semantic block actually references it or when traceability genuinely benefits the reader.

This keeps Natural readable without losing relationship information when it matters.

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

over:

```text
beautiful professional bold lines that create a visually striking result
```

Prefer:

```text
low-angle view
```

over explaining that low angles make the subject feel heroic or powerful unless that emotional effect is itself selected elsewhere.

UI documentation can explain. `promptText` should instruct.

---

# 15. Avoid semantic smuggling

Semantic smuggling happens when a missing axis is hidden inside another option's wording.

Examples discovered during refactor work:

- linework hidden inside Aesthetic,
- detail density hidden inside Visual Treatment,
- shape/form language hidden inside Style,
- lens behavior hidden inside Framing,
- artifact intent hidden inside Framing,
- placement features hidden inside one composition select.

When an option keeps growing to express unrelated behavior, stop expanding the wording and inspect the architecture.

---

# 16. Compile order is separate from UI order

UI organization and semantic prompt order are separate concerns.

When ordering matters, configure compile order explicitly rather than rearranging UI solely to change output text.

A typical string module may move from broad identity to specific modifiers, but every module defines its own correct order.

Example from Framing:

```text
shot size
→ placement
→ balance
→ composition features
→ view angle
→ view direction
→ crop safety
→ extra details
```

---

# 17. String output vs structured-object output

Not every module should compile the same way.

## String modules

Use a compact string when the module is primarily a flat set of independent semantic descriptors.

Example: Framing.

## Structured-object modules

Use structured output when relationships themselves are semantic.

Examples:

- Layout regions and bounds,
- Typography groups, texts and region bindings.

Do not flatten meaningful relationships merely to make all modules look alike.

---

# 18. Every structured module needs an explicit Natural strategy

A structured-object module must either:

1. provide an explicit Natural serializer, or
2. explicitly declare that it has no Natural representation.

Do not assume the generic Natural pipeline can safely stringify structured data.

Blocks containing:

- coordinates,
- exact text,
- structural tokens,
- nested relationships,
- bullet hierarchies,

may need to bypass generic Natural optimization and be appended as protected blocks.

Layout and Typography demonstrated this requirement.

---

# 19. The Natural optimizer is a semantic boundary

An optimizer can accidentally corrupt otherwise correct module output through:

- classification,
- regrouping,
- deduplication,
- punctuation rewriting,
- numeric processing,
- token processing,
- hidden item limits.

For every refactored module, test the optimizer explicitly.

Canonical invariant:

> Every meaningful semantic item present in Modular output must still be represented in Natural output unless an intentional serializer transformation exists.

Never silently truncate valid semantics.

Test maximum realistic simultaneous selections, not only simple examples.

---

# 20. Compatibility rules

Compatibility should help rather than police creativity.

Prefer warnings over blocking or silent state mutation.

## Module-local conflicts

Use module compatibility when two fields inside one module have a high-confidence semantic tension.

Example:

```text
Close-Up + Preserve Complete Silhouette
```

## Cross-module conflicts

Handle conflicts between modules at prompt validation level.

Example:

```text
Setup: Preserve Composition
Framing: Rule of Thirds + Low Angle
```

Do not silently disable either module.

A useful warning explains that the selected instructions may compete while preserving the user's state.

Do not warn merely because a combination is unusual. Creative tension can be intentional.

---

# 21. Semantic correctness is not generation determinism

Always separate two questions:

1. Did Prompt Draft correctly express what the user selected?
2. Did the image model obey those instructions consistently?

Prompt Draft directly controls the first. Image generation is probabilistic and model-dependent.

A module can be semantically correct while model compliance remains approximate.

This distinction is especially important for spatial constraints.

---

# 22. Spatial controls require repeated identical-prompt tests

Do not classify a spatial feature as reliable based on one unusually accurate render.

For Layout, placement, geometry or other spatial claims:

1. run the identical prompt multiple times,
2. compare variance,
3. classify reliability,
4. set product expectations accordingly.

Useful reliability classes:

```text
Exact
Strong
Approximate
Weak
```

For current Layout behavior, the realistic product contract is structural/directional guidance rather than pixel-accurate deterministic rendering.

Do not keep adding prompt verbosity indefinitely when repeated tests show the image model is the limiting factor.

---

# 23. Testing workflow for every module

Refactor is iterative. Code cleanliness alone is not completion.

## Phase A — isolated output

Test individual options.

Check:

- ownership,
- redundancy,
- assumptions,
- wording clarity,
- default neutrality.

## Phase B — combination tests

Combine multiple fields within the module.

Look for:

- hidden non-orthogonal fields,
- contradictions,
- duplicated wording,
- accidental over-configuration,
- single-select values that should coexist.

## Phase C — Natural vs Modular parity

Verify that Natural preserves the semantic set.

Check:

- classifier grouping,
- limits,
- punctuation,
- numeric/token preservation,
- structured serializer behavior.

## Phase D — subject diversity

When applicable, test across:

```text
Person
Animal
Object
Product
Vehicle
Architecture
Scene / Environment
Typography
Custom
```

A supposedly universal option must not leak anatomy or use-case assumptions.

## Phase E — cross-module audit

Audit neighboring semantic owners.

Examples:

```text
Style ↔ Form ↔ Texture
Framing ↔ Camera ↔ Pose ↔ Setup
Lighting ↔ Color Palette ↔ Camera
Background ↔ Layout ↔ Effects
```

## Phase F — full prompt tests

The final prompt should feel like independent components assembled intentionally rather than several authors repeating instructions.

## Phase G — real image tests

Generate actual images when useful.

Image tests outrank purely theoretical wording preferences.

However, diagnose failures correctly:

- wrong semantic expression → refactor Prompt Draft,
- correct expression but stochastic model compliance → adjust expectations or reliability classification.

For spatial claims, repeat identical prompts.

---

# 24. Legacy state and migration

Schema refactors can leave old draft keys.

For every replaced/split field, explicitly decide whether legacy values should:

- migrate exactly,
- migrate to another module,
- remain preserved legacy data,
- or be discarded.

Do not invent cross-module migration merely to preserve old wording if it corrupts ownership.

Track unresolved migration work in the review backlog rather than hiding it.

---

# 25. Deferred issues and review backlog

Not every valid finding should interrupt the current module.

Use:

```text
docs/prompt-semantics/review-backlog/README.md
```

for real issues that belong to another module or later architectural stage.

A backlog item should record:

- symptom,
- semantic owner,
- why it is deferred,
- preferred resolution direction,
- verification/removal after fix.

Do not use the backlog as a graveyard for vague ideas.

---

# 26. Translation workflow

During semantic refactor, English is the working source of truth.

For every semantic UI-copy change:

1. create/update a flat English patch under `scripts/i18n-patches/`,
2. give the user the one-line merge command,
3. register the new/changed English keys in the persistent Persian ledger:

```text
scripts/i18n-patches/fa.semantic-refactor.todo.ts
```

The Persian ledger intentionally keeps English source values until the final Persian translation pass.

Do **not** merge the ledger into `fa.ts` before its values are actually translated.

At the final Persian pass, replace all ledger values with Persian and then apply it with the merge script.

English merge command format:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en --patch scripts/i18n-patches/<patch-file>.ts --write --overwrite
```

Keep commands single-line in user instructions.

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

After required translation patch application, run:

```bash
pnpm generate
```

Create a checkpoint commit when a major semantic stage is closed.

Checkpoint commits represent semantic milestones, not substitutes for implementation commits.

---

# 28. Closure criteria

A module can be considered semantically closed when:

- responsibility is clear,
- non-responsibilities are clear,
- fields represent independent axes,
- exclusive vs combinable features are modeled correctly,
- defaults do not inject unjustified assumptions,
- options are concise and composable,
- presets are minimum-sufficient,
- subject applicability is intentional,
- module-local conflicts are handled predictably,
- cross-module boundaries have been audited,
- structured outputs have an explicit Natural strategy,
- Natural does not silently lose Modular semantics,
- isolated tests pass,
- combination tests pass,
- subject-diversity tests pass where applicable,
- full prompt output is coherent,
- real image tests do not expose a semantic flaw,
- stochastic model limitations are not mistaken for prompt bugs,
- `pnpm generate` passes.

Once these conditions are met, stop theoretical micro-polishing.

Reopen a closed module only when concrete tests or later module work reveal a real issue.

---

# 29. Lessons from completed stages

## Style

Key lessons:

- aesthetic and medium are separate axes,
- linework deserves an independent axis,
- detail density deserves an independent axis,
- rendering treatment should not steal Texture responsibilities,
- finish should describe finish rather than generic quality,
- Style must not own Form geometry,
- presets should be minimum-sufficient,
- defaults should remain neutral unless justified.

## Form

The old Deformation model mixed anatomy, form language, proportions, style, material, motion and context.

Useful ideas were preserved, but ownership was redesigned around independent axes:

```text
Form Language
Proportions
Transformation
Form Transformation Strength
Extra Details
```

Key lesson:

> Preserve useful semantic ideas, not bad architecture.

## Setup

Setup clarified the difference between prompt semantics and editor context.

Canonical examples:

```text
idea        → semantic
subject     → semantic / reusable
reference   → semantic handle
aspect      → semantic raw ratio
subjectType → context metadata
```

It also separated:

```text
Reference Usage
Reference Transformation Strength
Form Transformation Strength
Preserve rules
```

Similar vocabulary does not mean duplicate scope.

## Layout

Layout became a structured spatial schema whose `regions` are authoritative.

Key lessons:

- structural identity must be stable,
- region labels are not IDs,
- structured output needs a protected Natural serializer,
- exact coordinates are a prompt specification but not a deterministic rendering guarantee,
- repeated identical-prompt tests are required before claiming spatial reliability,
- current Layout should be treated as approximate/strong structural guidance rather than a pixel renderer.

## Typography output

Typography showed that object-output modules can disappear from Natural output if the generic pipeline only understands strings.

Key lessons:

- structured modules need explicit Natural serialization,
- exact written text and hierarchy may need protected blocks,
- structural Layout bindings should remain traceable without flooding Natural output with unused keys.

## Framing

Framing showed why mega-selects fail when they contain independent decisions.

Final conceptual axes:

```text
Shot Size
Subject Placement
Frame Balance
Composition Features
View Angle
View Direction
Crop Safety
```

Key lessons:

- single vs multi-select must follow semantics,
- negative space is not the same axis as placement,
- lens/camera behavior belongs to Camera,
- body pose belongs to Pose,
- prompt-level conflicts should use validation rather than silent overrides,
- Natural optimizer classification and item limits must be tested explicitly.

---

# 30. Recommended remaining module order

Re-evaluate when new ownership collisions appear, but the current preferred sequence is:

```text
1. Camera
2. Lighting
3. Color Palette + Texture
4. Pose + Expression
5. Background + Effects
6. Hair + Outfit
7. remaining smaller modules / final cross-module audit
```

Why Camera is next:

- Framing is now clean and exposes the remaining Camera overlap clearly.
- Legacy Camera options still smuggle viewpoint/composition semantics such as top-down, frontal or dramatic-composition behavior.
- Cleaning Camera now stabilizes the Camera ↔ Framing ↔ Setup boundary before Lighting introduces another adjacent capture-related concern.

Why Lighting follows:

- Lighting has a strong boundary with Camera, Color Palette, Texture and Background.
- Refactoring it immediately after Camera prevents optical/capture semantics from being mixed with illumination semantics.

Why Color Palette + Texture should be audited together:

- both affect visible surface/color behavior,
- Texture interacts with material and light response,
- Color Palette interacts with lighting color/mood,
- their boundary is easier to define together than independently.

Pose + Expression are naturally related but should remain independent body-vs-face controls.

Background + Effects should be audited together because current catalogs contain atmosphere, poster/composition and overlay semantics that may overlap.

Hair + Outfit are lower-risk subject-detail modules and can follow after the major global semantic boundaries are stabilized.

---

# 31. Operating instructions for a new chat

When continuing this refactor in another conversation, first read this file:

```text
docs/prompt-semantics/SEMANTIC-REFACTOR-REFERENCE.md
```

Then read:

- the target module implementation,
- relevant compiler/Natural code,
- neighboring modules with likely ownership overlap,
- the semantic review backlog,
- the most recent completed stage docs when useful.

## First response / audit

1. State the module's current responsibility.
2. State its proposed responsibility and non-responsibilities.
3. Identify semantic pollution and ownership collisions.
4. Identify mega-fields that should be split into orthogonal axes.
5. Decide single-select vs multi-select from semantics.
6. Audit defaults and presets.
7. Propose the clean field model before broad implementation.

Do not reflexively preserve existing design.

Challenge architecture when a cleaner ownership model exists.

## Implementation

Once direction is agreed:

1. implement structural changes,
2. keep useful ideas in the correct owner,
3. remove semantic pollution,
4. define explicit compile order,
5. add compatibility only for high-confidence conflicts,
6. add/update English flat i18n patch,
7. update the Persian translation ledger,
8. protect structured Natural output when required,
9. avoid silent optimizer loss,
10. document the stage.

## Test review

When compiled outputs are returned:

- compare Modular vs Natural semantic parity,
- audit each phrase for ownership,
- test maximum realistic combinations,
- test subject applicability,
- test module-local conflicts,
- test neighboring modules,
- distinguish prompt bugs from model stochasticity.

## Final closure

Before checkpoint:

- run one focused taxonomy/edge-case audit,
- perform one cross-module boundary audit,
- update backlog for deliberately deferred work,
- run `pnpm generate`,
- create a semantic checkpoint only after tests pass.

---

# 32. Product constraint: do not overengineer the semantic engine

Prompt Draft can become architecturally sophisticated enough to hide its value from ordinary users.

The semantic engine should remain powerful, but future UX may expose that engine through simpler interfaces such as guided presets or a wizard that asks high-level questions and translates answers into the same module state.

Do not weaken the semantic architecture to make the current editor simpler.

Likewise, do not keep adding architectural machinery merely because it is technically interesting.

For every major addition ask:

> Does this materially improve a user's ability to create a better prompt, or does it mainly make the architecture more elaborate?

Prefer product value over architectural novelty.
