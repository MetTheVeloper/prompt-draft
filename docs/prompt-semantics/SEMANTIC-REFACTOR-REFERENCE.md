# Prompt Draft — Canonical Semantic Refactor Reference

## Status and purpose

This is the canonical operating reference for semantic refactoring of Prompt Draft modules.

Use this file when starting or continuing a semantic-refactor conversation. It consolidates the original module refactor guide and the practical lessons learned from the completed Style, Form, Setup, Layout, Typography-output, Framing, Camera, Lighting, Color Palette, Texture / Material, and Pose + Expression work.

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
- Expression does not own body pose or visual style.
- Color Palette does not own lighting behavior.
- Texture / Material does not own base color or illumination.

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

When a named preset represents a real system with replaceable parts, populate only the components intrinsic to that preset. Leave replaceable components neutral rather than inventing them.

Example principle from Camera:

```text
fixed-lens camera preset         → may populate Lens Profile
interchangeable-lens body preset → should leave Lens Profile neutral
```

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

## Typed semantic references

Variable and structural-reference types are semantic contracts, not merely UI labels.

Only expose a dynamic reference in a field when its type is meaningful for that role.

Examples from Color Palette / Texture / Pose / Expression:

```text
Color variable          → reusable palette value
Subject/Object variable → reusable color/material target when supported
Typography Group/Text   → structural semantic target
Outfit/Hair module      → target only when capability-compatible
Layout Region           → not automatically a color/material target
Subject variable        → Pose/Expression recipient
Object variable         → may participate inside Pose details, but is not a Pose recipient
```

Do not make every variable selectable everywhere merely because a token exists. Filter reference catalogs by semantic compatibility.

Store stable IDs alongside token/label snapshots so missing references can remain visible instead of silently deleting user intent.

## Capability-driven module targets

When module outputs themselves can be targeted by another semantic system, consumers should request a capability rather than hard-code module names.

Example:

```text
Color Palette asks for targets supporting: color
Texture asks for targets supporting: material
```

A module such as Outfit or Hair may expose its output for one or more capabilities. The same semantic slot should upgrade from a generic built-in target to a linked module-output target without creating a duplicate option.

Keep target identity stable across that upgrade. Compare semantic target state canonically rather than relying on object serialization or property order.

## Target policy is separate from assignment infrastructure

Shared assignment mechanics do not imply a universal target catalog.

Color Palette and Texture / Material legitimately use broad semantic target policies. Pose and Expression reuse the same stable relational identity concepts while intentionally accepting only pose/expression-capable semantic subjects.

Ask two separate questions:

1. Does this module use the shared assignment mechanism?
2. Which entities are valid recipients for this particular semantic payload?

Do not answer the second question globally merely because the first is shared.

---

# 13. Structural tokens and prompt-graph preservation

Natural output is a human-readable serialization of the same prompt graph, not permission to flatten that graph.

User variables, nested system variables and linked module-output tokens remain useful in Natural when another part of the prompt references them.

Canonical example:

```text
{reference} = attached reference image
{subject} = person in {reference}

Create a surreal image of {subject}.
```

Do not replace `{subject}` with repeated prose merely to make the output look more conversational. Doing so destroys reuse and makes nested-variable composition meaningless.

Recommended behavior:

- User variables remain defined and referenced in Natural.
- Referenced nested system variables preserve the dependency chain required to resolve them.
- Linked module outputs such as `{outfit}` / `{hair}` preserve their definition when another block uses the token.
- Structured keys such as Layout regions or Typography text/group keys appear in Natural when another semantic block actually references them or traceability genuinely benefits the reader.
- Unreferenced structural implementation keys may remain hidden.

The key rule is:

> If a token is used in final Natural output, the prompt must preserve enough definition/context for that token to remain meaningful.

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
- placement features hidden inside one composition select,
- fashion/editorial/personality interpretation hidden inside Pose,
- cinematic/professional/style assumptions hidden inside Expression.

When an option keeps growing to express unrelated behavior, stop expanding the wording and inspect the architecture.

A system capability also must not silently imply the conditions under which that capability is commonly used.

Example:

```text
high-sensitivity camera response
```

must not automatically become:

```text
low-light scene
```

unless low-light illumination is independently selected. Capability and operating context are separate semantic decisions.

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

For relational assignment systems, broad-to-specific ordering can also be useful when later assignments intentionally specialize a broader rule.

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

## Repeated relational entities

A module may keep structured/repeated state even when its final module output is a string.

When several repeated entities each have properties that must remain associated, preserve each entity boundary through compilation rather than flattening all properties into global lists.

Example principle from Lighting:

```text
red + camera-left   → one light-source relationship
blue + camera-right → another light-source relationship
```

Flattening this into independent global lists of colors and directions would lose meaning.

Also distinguish properties that belong to each repeated entity from properties that are genuinely global to the whole module. A bounded repeated-entity model is preferable when it materially improves prompt control without turning the editor into an unrestricted simulator.

## Relational assignment rules

When a module assigns a value set to one or more semantic targets, the assignment itself is the semantic unit.

Examples:

```text
palette A → outfit + accents
palette B → {hero}

clay material → all scene surfaces except {car}
cotton material → {car}

pose A → {hero}
pose B → {villain}

expression A → {hero}
expression B → {villain}
```

Do not flatten payloads and targets into separate global lists. Preserve every assignment as a self-contained relation through compilation.

A useful relational-assignment model should:

- keep payload data and target references together,
- allow first-class scope appropriate to the domain,
- keep custom targets distinct from selecting existing targets when custom targets are valid,
- allow broad-to-specific ordering where the domain supports specialization,
- preserve missing target references instead of silently mutating state,
- keep warnings advisory unless a combination is genuinely impossible,
- distinguish shared scope infrastructure from module-specific payload semantics,
- distinguish assignment recipients from entities that merely participate inside payload details.

## Reuse the assignment mechanism, not the domain payload or target policy

When two modules share the same targeting interaction, extract the shared layer before a third copy appears.

The shared layer may own:

```text
target identity
capability/filter primitives
selection
missing references
scope summaries
scope serialization helpers
```

Broader domains may additionally reuse:

```text
Apply To
Exceptions
custom targets/exceptions
```

The module must continue to own what is being assigned and who can receive it:

```text
Color Palette → colors / swatches → broad compatible targets
Texture       → material / finish / surface / optical / condition → broad material targets
Pose          → body configuration / gesture / motion → subject recipients only
Expression    → facial affect / mechanics → subject recipients only
```

Do not build a generic mega-editor that knows every domain.

## Assignment recipient vs payload participant

An entity referenced inside assignment details is not automatically a valid recipient.

Example:

```text
{hero}: holding {sword}
```

`{hero}` receives the Pose. `{sword}` participates in the interaction. The sword should not become pose-targetable merely because it appears in the payload.

This distinction is especially important for typed variable systems.

---

# 18. Every structured or protected module needs an explicit Natural strategy

A structured-object module must either:

1. provide an explicit Natural serializer, or
2. explicitly declare that it has no Natural representation.

Repeated relational modules may also need protected text blocks even when their compiled value is a string.

Do not assume the generic Natural pipeline can safely split or regroup content containing:

- coordinates,
- exact text,
- structural tokens,
- nested relationships,
- bullet hierarchies,
- relational assignment clauses,
- keyword lists whose commas belong inside one semantic unit.

Layout and Typography require dedicated serializers. Color Palette, Texture / Material, Pose, and Expression use protected bullet blocks so the generic optimizer cannot detach payload properties from their targets.

The protection mechanism should be reusable for future modules that emit relationship-safe blocks.

---

# 19. The Natural optimizer is a semantic boundary

An optimizer can accidentally corrupt otherwise correct module output through:

- classification,
- regrouping,
- deduplication,
- punctuation rewriting,
- numeric processing,
- token processing,
- hidden item limits,
- variable-definition removal.

For every refactored module, test the optimizer explicitly.

Canonical invariants:

> Every meaningful semantic item present in Modular output must still be represented in Natural output unless an intentional serializer transformation exists.

> Natural may rewrite prose, but it must not destroy the reusable prompt graph.

Never silently truncate valid semantics or leave a referenced token without the definition/context required to interpret it.

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

For material systems, warn only on high-confidence tensions such as obviously unusual material/property combinations. Do not warn merely because multiple materials target the same entity; multi-material designs can be intentional.

For subject assignment systems such as Pose/Expression, overlapping assignments to the same subject may deserve an advisory warning when they can conflict, but the editor should not silently merge or delete the user's state.

## Cross-module conflicts

Handle conflicts between modules at prompt validation level.

Example:

```text
Setup: Preserve Composition
Framing: Rule of Thirds + Low Angle
```

or:

```text
Setup: Preserve Materials
Texture: assign new material properties
```

or:

```text
Setup: Preserve Pose
Pose: assign a new pose to a subject
```

Do not silently disable either module.

A useful warning explains that the selected instructions may compete while preserving the user's state.

Do not warn merely because a combination is unusual. Creative tension can be intentional.

For real-world system/configuration modules, restrict compatibility hints to high-confidence physical mismatches. Do not turn the editor into a strict hardware configurator when intentional simulation or creative borrowing remains useful.

---

# 21. Semantic correctness is not generation determinism

Always separate two questions:

1. Did Prompt Draft correctly express what the user selected?
2. Did the image model obey those instructions consistently?

Prompt Draft directly controls the first. Image generation is probabilistic and model-dependent.

A module can be semantically correct while model compliance remains approximate.

This distinction is especially important for spatial constraints, but it also applies to material, camera, lighting, pose, expression and other visual semantics.

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

Verify that Natural preserves the semantic set and prompt graph.

Check:

- classifier grouping,
- limits,
- punctuation,
- numeric/token preservation,
- referenced variable definitions,
- linked module definitions,
- structured/protected serializer behavior.

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

For subject-only modules, also verify that ineligible target types never appear merely because they exist as variables.

## Phase E — cross-module audit

Audit neighboring semantic owners.

Examples:

```text
Style ↔ Form ↔ Texture
Framing ↔ Camera ↔ Pose ↔ Setup
Pose ↔ Expression ↔ Framing ↔ Setup
Lighting ↔ Color Palette ↔ Texture ↔ Camera
Background ↔ Layout ↔ Effects
```

## Phase F — full prompt tests

The final prompt should feel like independent components assembled intentionally rather than several authors repeating instructions.

## Phase G — real image tests

Generate actual images when useful.

Image tests outrank purely theoretical wording preferences.

However, diagnose failures correctly:

- wrong semantic expression → refactor Prompt Draft,
- correct expression but stochastic model compliance → adjust expectations or reliability classification,
- selected framing/context hides the property being tested → redesign the test before blaming the semantic schema.

Real-image tests can also reveal that wording which looks equivalent to humans is not equally strong for an image model. When this happens, prefer the shortest wording that materially improves instruction clarity instead of adding decorative verbosity.

For spatial claims, repeat identical prompts.

For Pose/Expression-like controls, ensure the chosen framing actually exposes the body/facial state being evaluated. A close-up cannot meaningfully validate full-body pose, and strong action context can legitimately compete with a static-pose instruction without proving an ownership defect.

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

A module's new semantic schema may be closed while legacy migration remains an explicitly deferred backlog task. Do not confuse migration debt with an unresolved semantic design.

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
- assignment target policy is intentional where relational state exists,
- module-local conflicts are handled predictably,
- cross-module boundaries have been audited,
- structured/relational outputs have an explicit Natural strategy,
- Natural does not silently lose Modular semantics or referenced graph structure,
- isolated tests pass,
- combination tests pass,
- subject-diversity tests pass where applicable,
- full prompt output is coherent,
- real image tests do not expose a semantic flaw,
- stochastic model limitations are not mistaken for prompt bugs,
- editor summaries/state representations remain correct for repeated relational entities,
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

## Camera

Camera established a clean boundary between how a view is composed and how that unchanged view is physically recorded.

Final conceptual axes:

```text
Capture System
Capture Response
Lens Profile
Focus & Depth
Capture Behavior
```

Key lessons:

- named hardware/device choices work best as editable state recipes rather than prose bundles,
- presets should populate only intrinsic components; replaceable components remain neutral,
- capture-system capability must not imply scene conditions such as lighting,
- optical behavior belongs to Camera while viewpoint/composition belongs to Framing,
- high-confidence physical mismatches can use advisory compatibility hints without blocking creative combinations,
- Natural classification must protect legitimate Camera words such as distortion, grain, detail and tonal response from being reassigned to other semantic groups.

## Lighting

Lighting established a clean universal illumination model that works across realistic and stylized outputs without owning the visual style itself.

Final conceptual model:

```text
Global Lighting
├─ Ambient Level
└─ Overall Contrast

Light Sources [max 3]
├─ Role
├─ Source Type
├─ Direction
├─ Quality
├─ Intensity
├─ Light Color
└─ Lighting Features
```

Key lessons:

- repeated semantic entities should remain bounded when their properties must stay associated,
- source-local properties and scene-global properties should not be duplicated across the same axis,
- a bounded repeated-entity model can add substantial expressive power without becoming an unrestricted simulator,
- illumination color belongs to Lighting while base object/image palette belongs to Color Palette,
- flash is an illumination source and therefore Lighting-owned rather than Camera-owned,
- visible volumetric beams can be Lighting-owned without automatically creating fog/smoke/dust scene content,
- presets can be multi-entity state recipes as long as each source remains editable and relationships remain explicit,
- dedicated editors should still follow generic field-type conventions where practical so later component-system upgrades remain straightforward,
- Natural/Modular testing must verify relationships, not only the presence of individual words.

## Color Palette

Color Palette preserved its original useful product idea while turning it into a reference-aware relational system.

Final conceptual model:

```text
Palette Rules[]
├─ Preset → editable swatches
├─ Colors[]
│  ├─ Literal Color
│  └─ User Color Variable
├─ Apply To[]
├─ Custom Targets[]
├─ Except[]
└─ Custom Exceptions[]
```

Key lessons:

- a preset can populate editable literal state instead of compiling a prose bundle,
- variable types should be treated as semantic contracts when building dynamic reference catalogs,
- structural/user references should store stable identity plus token/label snapshots so missing references remain recoverable,
- relational assignment rules must keep values and targets linked through Modular and Natural compilation,
- broad-to-specific rule ordering is useful when intentional overrides are part of the domain,
- dynamic target selection should expose only semantically compatible entities rather than every available variable,
- creation actions such as Custom Target should remain distinct from selecting an existing target,
- a reusable component-system control should replace native UI when multiple modules share the same semantic interaction pattern.

## Texture / Material

Texture / Material replaced a weak global-image texture concept with target-specific material assignments.

Final conceptual model:

```text
Material Assignments[]
├─ Preset
├─ Apply To[] / Exceptions[]
├─ Material
├─ Finish
├─ Surface Texture
├─ Optical Character
├─ Texture Prominence
└─ Conditions[]
```

Key lessons:

- material identity, finish, micro/surface texture, optical behavior, prominence and condition are independent axes,
- a material module should describe what an entity is made of and how its surface behaves, not the style of the whole image,
- Color owns base palette while Texture owns material/surface behavior and Lighting owns illumination,
- when two modules repeat the same relational targeting pattern, extract shared target/scope infrastructure but keep domain payload semantics local,
- semantic targets should be capability-driven so future modules can expose targetable outputs without consumers hard-coding module names,
- `Apply To` and `Except` are first-class relational scope, not text-field decoration,
- stable target identity must survive generic-target → linked-module-output upgrades,
- native multi-select became insufficient once grouped dynamic targets and reusable relational scope were required; `el-multi-select` now provides the shared interaction pattern,
- protected bullet blocks are appropriate for compact relational output whose commas belong inside one semantic unit,
- preset names should not compile when explicit semantic properties already encode the instruction,
- real-image testing showed that explicitly separating `cotton material; matte, woven...` communicates material identity more strongly than a flat keyword list while remaining concise,
- Natural must preserve reusable user/system/module references and their dependency graph rather than replacing them with repeated prose,
- substantial stylization can emerge from Form + Color + Material + other independent modules without Style being selected; Style remains a high-level aesthetic owner, not a mandatory stylization switch,
- once real tests show the semantic system is working, stop micro-polishing unless later evidence reveals a concrete defect.

## Pose + Expression

Pose and Expression replaced global prose-heavy mega-selects with subject-scoped relational assignments while preserving a strict body-vs-face ownership boundary.

Final conceptual models:

```text
Pose Assignments[]
├─ Preset
├─ Apply To[] → subject recipients only
├─ Base Posture
├─ Torso Posture
├─ Weight / Balance
├─ Body Tension
├─ Locomotion
├─ Gestures[]
├─ Interaction / Action Details
└─ Additional Details

Expression Assignments[]
├─ Preset
├─ Apply To[] → subject recipients only
├─ Core Expression
├─ Intensity
├─ Eye State
├─ Brow State
├─ Mouth State
└─ Additional Details
```

Key lessons:

- Pose owns visible physical body configuration, gesture, movement and interaction but not viewpoint, framing, personality, fashion/editorial style or facial affect,
- Expression owns visible facial affect and mechanics but not body pose, cinematic/editorial/cute/fantasy style, professional/commercial purpose or narrative role,
- a shared assignment mechanism must not force every assignment-driven module to share the same target eligibility policy,
- system `{subject}` and user variables with `type: "subject"` are valid Pose/Expression recipients while object/reference/text variables are not,
- an object can still participate inside a Pose payload (`{hero}: holding {sword}`) without becoming a Pose recipient,
- source/reference replacement semantics belong to compiler context: image-to-image assignments explicitly replace source pose/expression while text-to-image output does not emit replacement wording,
- overlapping subject assignments should warn rather than silently merge/delete user intent,
- per-assignment additional details are necessary once different subjects can receive different semantic states; a global `extraDetails` field loses ownership,
- protected bullet blocks preserve subject-to-payload identity through Modular and Natural output,
- real multi-subject image tests confirmed that opposite poses/expressions can remain independently targetable alongside subject-specific Color Palette and object-specific Texture assignments,
- prompt tension must be distinguished from schema failure: close-up framing may hide body pose, action-heavy context may compete with a static pose, and subtle facial mechanics remain model-dependent,
- repeated assignment cards need reactive semantic summaries; content-dependent render keys are a proven fallback when nested state changes do not refresh component-system text nodes reliably,
- once the relational schema, compiler identity, target policy, UI summaries and representative image tests all pass, ordinary model variance is not a reason to reopen the stage.

---

# 30. Recommended remaining module order

Re-evaluate when new ownership collisions appear, but the current preferred sequence is:

```text
1. Background + Effects
2. Hair + Outfit
3. remaining smaller modules / final cross-module audit
```

Why Background + Effects are next:

- Lighting, Color Palette and Texture / Material are already closed, so illumination, base color and surface/material ownership are stable,
- Layout is closed, so structural/spatial region ownership is stable,
- current Background/Effects catalogs are likely to contain the next major ownership collision between scene content, environment/atmosphere, weather/particles, overlays, post-processing and decorative visual treatment,
- auditing them together can reveal which atmospheric concepts belong to depicted scene content versus image-space effects without forcing the two modules to merge.

Hair + Outfit are lower-risk subject-detail modules and should follow after the remaining global scene/effect boundary is stable. They already participate in capability-driven Color/Material targeting, which must be preserved during their own semantic refactors.

Texture / Material and Pose / Expression legacy migrations remain backlog work and do not block the next semantic stage.

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

For the next planned stage, read both Background and Effects implementations and their compiler paths before proposing changes, but do not assume they should become one module.

Also read Stage 12 (`stage-12-pose-expression-semantics.md`) as the most recent closure precedent, especially its distinction between shared relational mechanics and domain-specific eligibility policy.

## First response / audit

1. Ask the mandatory original-intent discovery question for the new key module(s).
2. State each module's current responsibility.
3. State the proposed responsibility and non-responsibilities.
4. Identify semantic pollution and ownership collisions.
5. Identify mega-fields that should be split into orthogonal axes.
6. Decide single-select vs multi-select from semantics.
7. Audit defaults and presets.
8. Propose the clean field model before broad implementation.

Do not reflexively preserve existing design.

Challenge architecture when a cleaner ownership model exists.

## Implementation

Once direction is agreed:

1. implement structural changes,
2. keep useful ideas in the correct owner,
3. remove semantic pollution,
4. define explicit compile order,
5. add compatibility only for high-confidence conflicts,
6. reuse existing shared infrastructure when the semantic interaction truly matches,
7. add/update English flat i18n patch,
8. update the Persian translation ledger,
9. protect structured/relational Natural output when required,
10. preserve referenced variable/module graph structure,
11. avoid silent optimizer loss,
12. document the stage.

## Test review

When compiled outputs are returned:

- compare Modular vs Natural semantic parity,
- audit each phrase for ownership,
- test maximum realistic combinations,
- test subject applicability,
- test module-local conflicts,
- test neighboring modules,
- test variable/reference preservation when the module can be referenced elsewhere,
- ensure the chosen real-image test makes the target semantic observable,
- distinguish prompt bugs from model stochasticity or prompt tension.

## Final closure

Before checkpoint:

- run one focused taxonomy/edge-case audit,
- perform one cross-module boundary audit,
- update backlog for deliberately deferred work,
- run `pnpm generate`,
- perform real-image validation when it can expose practical semantic ambiguity,
- update the canonical reference with genuinely reusable lessons,
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

---

# 33. Mandatory module-intent discovery question

Before auditing a new key module in a new conversation, ask the user one explicit discovery question before proposing the refactor architecture:

> What was your original goal and idea when you created this module? What problem did you want it to solve for the user?

Treat the answer as first-class design context alongside the current code, compiler behavior and neighboring module boundaries.

The existing implementation shows what the module became; the user's answer explains what the module was intended to achieve. Both are needed before deciding what should be preserved, split, moved or removed.

When a stage intentionally audits a related pair, ask for the original intent of both before freezing either architecture.

Do not skip this question merely because the current schema appears understandable. It is especially valuable when old implementations contain semantic pollution that hides the original product intent.

---

# 34. The canonical reference must improve after every closed module

After a module is fully tested, approved by the user and closed with its semantic checkpoint, automatically perform a short lessons audit before moving to the next module.

Ask internally:

> Did this module teach us a reusable semantic, compiler, validation, migration, testing, translation, UX or architectural lesson that is not already captured in this canonical reference?

If yes:

1. add the reusable lesson to `docs/prompt-semantics/SEMANTIC-REFACTOR-REFERENCE.md`,
2. keep it general enough to guide future modules rather than documenting only one implementation detail,
3. update the completed-stage lessons when the module establishes an important precedent,
4. avoid duplicating guidance that the reference already contains,
5. make this reference update part of the module's closure workflow, immediately after or alongside the checkpoint.

If the module teaches nothing materially new, do not add filler merely to make the document longer.
