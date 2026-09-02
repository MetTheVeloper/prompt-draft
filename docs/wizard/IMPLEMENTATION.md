# Living Sentence Wizard — Production Implementation Plan

Status: **approved implementation plan for `feature/wizard-figma`**

Branch: `feature/wizard-figma`

Last updated: **2026-09-01**

Primary architecture: [`README.md`](./README.md)

Accepted UX direction: [`UI.md`](./UI.md)

Operational checkpoint: [`STATUS.md`](./STATUS.md)

Figma Make reference:

```text
https://www.figma.com/make/jgi1MxTu7e16Dv7AFiRof2/Review-Instructions
```

This document is the implementation source of truth for migrating the accepted Figma Make Living Sentence experience into the real Prompt Draft Nuxt/Vue Wizard.

The Figma Make prototype is now sufficiently complete to begin production implementation. Do **not** block production work on further Figma AI refinement. Remaining prototype gaps are explicitly listed below and should be fixed directly in the production implementation.

---

## 1. Goal

Replace the current functional/legacy Wizard presentation with the accepted Living Sentence experience while preserving the existing canonical Wizard/domain architecture.

The target is:

```text
Figma Make visual + interaction reference
              +
existing Nuxt/Vue Wizard domain/runtime
              +
known prototype fixes
              ↓
production Portrait Living Sentence Wizard
```

This is **not** a React port and **not** a second Wizard runtime.

The current production foundation already owns the important semantics:

- independent Wizard sessions;
- persisted answers/default ownership;
- canonical Actions mapping;
- Subject identities and definitions;
- shared/per-subject overrides;
- branching such as Headshot → no Pose;
- Background refinement mapping;
- validation/compile/completion;
- explicit handoff to Create.

The new work should primarily replace presentation/orchestration behavior around that foundation.

---

## 2. Non-negotiable invariants

Do not break these during the migration.

### 2.1 Canonical domain remains authoritative

```text
Wizard UX
  ↓
Wizard semantic answers
  ↓
existing Portrait rules / canonical Actions
  ↓
PromptDraftState
  ↓
prompt.validate
  ↓
prompt.compile
```

Do not:

- create a Figma-style parallel compiler;
- map directly into arbitrary module state from presentation components;
- duplicate Prompt semantics inside visual components;
- make the Living Sentence the canonical state;
- mutate the current Create Draft before explicit handoff.

### 2.2 Figma code is reference code

The Make project is React/Vite/Tailwind. Production remains Nuxt/Vue.

Use the Make code to understand:

- screen composition;
- typography hierarchy;
- hover/focus behavior;
- pacing;
- branching intent;
- chapter progress;
- Living Sentence interaction;
- Review editing;
- completion hierarchy.

Do not mechanically convert TSX to Vue line-by-line.

### 2.3 Simple choice means forward momentum

For normal single-choice micro-states:

```text
choice → semantic answer → transition → next relevant state
```

Do not reintroduce a permanent Continue button after every choice.

Continue/Done is appropriate only for:

- Subject configuration;
- free text;
- optional environment refinement;
- individual Subject customization;
- Review completion.

### 2.4 Progressive disclosure stays intact

Per-subject customization and advanced environment controls remain optional.

The default experience must stay light.

---

## 3. Current production foundation to preserve

Important existing production files:

```text
app/pages/wizard/[wizardId].vue
app/wizard/definition.ts
app/wizard/session.ts
app/wizard/sessionPersistence.ts
app/wizard/registry.ts
app/wizard/portrait.ts
app/wizard/portraitReview.ts
app/wizard/portraitCompletion.ts
app/wizard/completion.ts
app/wizard/entities.ts
app/wizard/portraitSubjectOverrides.ts
app/wizard/portraitBackgroundOptions.ts
app/wizard/portraitPoseOptions.ts
app/wizard/hostDraft.ts
```

Existing Wizard UI components provide behavior worth preserving where useful, but their presentation is not the target:

```text
app/components/wizard/WizardShell.vue
app/components/wizard/WizardProgress.vue
app/components/wizard/WizardChoiceGroup.vue
app/components/wizard/WizardEntityQuestion.vue
app/components/wizard/WizardSubjectOverridesQuestion.vue
app/components/wizard/WizardSubjectOverridesModal.vue
app/components/wizard/WizardReview.vue
...
```

The current route already performs:

- session restore/fresh start;
- persisted save scheduling;
- question validation;
- review building;
- completion;
- Save as Template;
- explicit Create handoff.

Preserve those responsibilities unless a deliberate extraction improves clarity.

---

## 4. Accepted Figma reference checkpoint

The current Make prototype is accepted as the production visual/interaction reference for approximately the full Portrait flow.

Strongly accepted behavior includes:

- dark editorial/cinematic presentation;
- typography-first interaction;
- variable-font weight transitions;
- symmetric Entry split;
- centered `or` inside the vertical divider;
- Living Sentence throughout the flow;
- subtle chapter labels;
- inner-chapter progress line;
- large typographic choices;
- People count as `02 / 03 / 04`;
- Portrait/Look micro-states;
- framing silhouette/crop metaphor;
- Headshot → Pose skip;
- Scene contextual follow-up;
- optional environment refinement;
- ambient Lighting feedback;
- actual proportion frames for aspect ratio;
- transform-only Reference Fidelity and Transformation Strength;
- editorial Review with clickable sentence tokens and recap rows;
- completion screen with `OPEN IN CREATE` as the main CTA.

Further Figma AI work is not required before implementation.

---

## 5. Known prototype gaps — fix in production, do not copy

The Make prototype still contains several logic gaps. These are explicit implementation requirements, not reasons to wait for another design pass.

### 5.1 PEOPLE progress calculation

For multi-person paths the prototype progress is inconsistent.

Production rule:

```text
PEOPLE / choose one vs multiple
  one person → chapter complete
  multiple   → first relevant segment

MULTIPLE path:
choose multiple → 1/3
choose count    → 2/3
configure people→ 3/3
```

Exact fractions should be derived from the **currently relevant internal states**, not hard-coded globally.

### 5.2 SCENE progress and refinement shell

Scene is conceptually:

```text
scene choice
  ↓
optional detail / optional refinement
  ↓
lighting
```

The environment refinement layer must remain inside the Wizard experience and preserve chapter orientation/Living Sentence context where appropriate.

Do not make refinement feel like navigating to a disconnected application.

### 5.3 Environment refinement must persist

The Make prototype keeps refinement selections in local panel state only.

Production must persist the selected canonical Background options into the Wizard session/answers and map them using the existing Background architecture.

The refinement UI must be an interaction layer over existing `backgroundOptions`, not a new environment data model.

### 5.4 Per-subject customization must be usable

The Make prototype contains override UI concepts, but its immediate auto-advance can make them unreachable.

Production interaction:

```text
choose shared value
  ↓
brief resolved/shared state
  ├── continue naturally
  └── optional "Adjust individually" / "Change it for someone"
          ↓
      choose one or more people
          ↓
      set overrides
          ↓
      return to the chapter flow
```

Supported domains remain:

- Expression;
- Hair;
- Outfit;
- Pose.

Do not add per-subject Lighting or Framing.

The override UX must support **any relevant Subject**, not default silently to Subject 01.

### 5.5 Review edit must resolve branch dependencies

Simple edit behavior:

```text
Review → edit value → Review
```

But if an edit changes the branch, production must resolve only newly required/invalid states.

Examples:

```text
Headshot → Half Body
  ↓
Pose becomes required
  ↓
ask Pose only
  ↓
return Review
```

```text
One Person → Multiple People
  ↓
count + subject configuration become required
  ↓
resolve those missing states
  ↓
return Review
```

```text
Transform → Create
  ↓
Reference Fidelity / Transformation Strength become irrelevant
  ↓
remove/ignore invalid transform-only state
  ↓
return Review
```

Do not force the user through every downstream screen after a Review edit.

### 5.6 Completion semantics

The Wizard creates a structured creative direction/draft, not the final user-tuned Create experience.

Completion hero should communicate something equivalent to:

```text
Your direction is ready.
```

Supporting copy should explicitly say that opening in Create is the next step to refine details and build/tune the final prompt.

Primary:

```text
OPEN IN CREATE →
```

Secondary:

```text
Save as template
```

Tertiary:

```text
Start another
```

Also provide a subtle route back to Review/Edit Direction.

---

## 6. Accepted UX deltas from the final audit

These requirements override older prototype/UI examples where they conflict.

### Entry

- preserve the current two-way split;
- both sides equal in neutral state;
- divider exactly centered;
- `or` sits inside the divider;
- variable-font weight animation should remain smooth;
- avoid layout shift during hover.

### Primary choices

Important short labels should avoid accidental desktop wrapping.

In particular:

```text
MULTIPLE PEOPLE
```

should remain a single line at normal desktop/laptop widths.

### Chapter progress

Use a subtle line under the active chapter label.

Progress is derived from currently relevant internal micro-states.

This is a generic Wizard presentation capability, not Portrait-specific hard-coded percentages.

### Composition crop

The silhouette/crop visualization is anchored from the **top of the body**:

- Headshot → face/head;
- Head & Shoulders → head through shoulders;
- Half Body → head through waist;
- Full Body → complete figure.

### Aspect Ratio

Supported UI choices:

```text
1:1
4:5
5:4
3:4
4:3
9:16
16:9
```

Each is represented by its actual proportion.

### Custom person description

When the user selects the semantic equivalent of `Describe them myself` / custom Subject definition, reveal a description input separate from optional Name.

```text
Name        = user-facing label/identity aid
Description = semantic Subject definition
```

### Review

Keep the current Make Review concept strongly intact:

- large Living Sentence;
- clickable semantic tokens;
- compact creative recap;
- compact technical recap;
- all useful recap rows editable;
- branch-aware edit return behavior.

---

## 7. Proposed production component architecture

Do not force the redesign through the existing generic question renderer.

Keep semantic definitions/runtime, but introduce a dedicated Portrait/Living Sentence presentation layer.

Recommended structure:

```text
app/components/wizard/
  living/
    WizardLivingShell.vue
    WizardChapterNav.vue
    WizardLivingSentence.vue
    WizardSentenceToken.vue
    WizardTypographicChoice.vue
    WizardEntryGateway.vue
    WizardAspectRatioChoice.vue
    WizardFramingPreview.vue
    WizardAmbientScene.vue
    WizardEnvironmentRefinement.vue
    WizardSubjectPicker.vue
    WizardSubjectOverrideFlow.vue
    WizardLivingReview.vue
    WizardDirectionReady.vue
```

Names are recommendations, not rigid API requirements. Keep components cohesive; do not create tiny components merely to mirror every TSX file.

Existing shared design-system primitives should still be reused for semantic buttons, inputs, focus behavior, and low-level layout where compatible.

### Presentation adapter

Create a thin adapter/composable layer between generic Wizard session state and the Portrait Living Sentence UI.

Possible responsibilities:

- current semantic micro-state;
- current chapter;
- relevant chapter micro-states;
- chapter progress;
- answer labels;
- immediate-choice advance;
- Review edit context;
- pending dependency resolution after Review edits;
- Living Sentence token model.

Do not put canonical module mapping here.

---

## 8. Navigation model

The existing production runtime stores `currentStepId` and filters visible Steps.

Keep this semantic foundation, but the presentation may need a finer micro-state concept than the current large v2 Step grouping.

Preferred rule:

- do not introduce a universal workflow DSL;
- add the smallest explicit navigation metadata/helper needed for Portrait and proven reusable behaviors;
- distinguish semantic chapter from presentation micro-state.

Conceptually:

```text
Stage / Chapter
  ↓
semantic Step / question ownership
  ↓
presentation micro-state
```

For example, the existing `appearance` semantic Step can still own Expression/Hair/Outfit while the Living UI presents them sequentially.

Do not split canonical mappings only to imitate the number of Figma screens.

---

## 9. Review-edit navigation design

Add explicit edit context instead of relying only on ordinary Back/history.

Suggested conceptual state:

```ts
reviewEditContext = {
  returnTo: "review",
  originAnswerId,
  pendingRequiredStepIds: [],
}
```

The exact shape may differ.

Algorithm:

1. User clicks a sentence token or recap row.
2. Resolve token/row to semantic answer/question ownership.
3. Enter edit context.
4. Navigate to the relevant presentation micro-state.
5. Apply the edit.
6. Re-run Portrait rules/visibility/default repair.
7. Detect whether the edit created newly required unanswered states.
8. If none → return directly to Review.
9. If some → walk only those required states.
10. Return to Review when dependencies are resolved.

Tests must cover branch-changing edits.

---

## 10. Living Sentence architecture

Living Sentence is derived presentation state.

Do not store a final sentence string as the canonical answer.

Preferred model:

```ts
type LivingSentenceToken = {
  id: string
  text: string
  answerId?: string
  stepId?: string
  editable: boolean
}
```

Portrait supplies its own grammar/composer.

The generic component only renders/reflows tokens.

The composer should account for:

- Transform vs Create grammar;
- one vs multiple people;
- shared Look values;
- meaningful per-person overrides when sentence wording can remain concise;
- framing;
- Pose only when applicable;
- Scene and optional detail;
- Lighting.

Technical controls remain outside the main creative sentence:

- Aspect Ratio;
- Reference Fidelity;
- Transformation Strength.

Do not leak IDs or internal semantic keys into user-facing wording.

---

## 11. Typography and motion implementation

The Make prototype demonstrated that a variable font materially improves the signature hover interaction.

Production should preserve the effect, but reconcile fonts with the Prompt Draft asset/design system rather than blindly importing every Make dependency.

Requirements:

- continuous/smooth weight response where technically possible;
- no hover-induced layout jump;
- selected choices remain readable without relying only on color;
- motion supports `prefers-reduced-motion`;
- semantic focus state works with keyboard navigation;
- animation must not delay basic interaction unnecessarily.

Motion priority:

```text
state meaning > decoration
```

---

## 12. Implementation phases

### Phase 0 — lock references and regression baseline

Before large UI changes:

- keep current Make URL as visual reference;
- record known Make gaps from this document;
- run `pnpm test:wizard` locally;
- keep build/generate health visible during the migration;
- avoid changing canonical semantics merely for styling convenience.

Deliverable: known-good domain baseline.

### Phase 1 — Living foundation

Build the reusable presentation primitives first:

- cinematic shell;
- Entry gateway;
- chapter nav + adaptive inner progress;
- Living Sentence renderer/token model;
- typographic choice primitive;
- base transition/motion behavior;
- responsive foundations.

Wire them initially to existing session answers without changing completion mapping.

Deliverable: shell + sentence + navigation can render real Wizard state.

### Phase 2 — Entry / People / Portrait

Implement:

- Transform/Create Entry;
- One/Multiple people;
- 02/03/04;
- image-to-image Subject definition;
- text-to-image Subject definition;
- custom Subject description;
- optional Name;
- Portrait style.

Preserve canonical `WizardEntityAnswer` identity and definition semantics.

Deliverable: both creation modes reach Portrait with valid canonical subjects.

### Phase 3 — Look + per-subject progressive disclosure

Implement Expression → Hair → Outfit as micro-states.

For each:

- shared value first;
- optional advanced details where existing domain supports them;
- optional per-subject customization;
- subject picker supports any relevant Subject;
- overrides inherit shared values correctly.

Do not expose all override controls permanently.

Deliverable: existing shared/per-subject regression behavior survives the new UX.

### Phase 4 — Composition

Implement:

- Framing visual selector;
- top-anchored crop visualization;
- Headshot branch skip;
- Pose shared-first + optional per-subject override;
- adaptive Composition progress.

Deliverable: correct branch behavior and visualization.

### Phase 5 — Scene

Implement:

- Studio / Outdoors / Abstract;
- contextual optional text;
- optional environment refinement;
- existing canonical Background options persistence;
- natural-language refinement preview;
- Lighting ambient behavior;
- adaptive Scene progress.

Deliverable: refinement survives navigation/session restore and is included in canonical mapping.

### Phase 6 — Final technical controls

Implement proportion selector with:

```text
1:1 / 4:5 / 5:4 / 3:4 / 4:3 / 9:16 / 16:9
```

Create path:

```text
Aspect Ratio → Review
```

Transform path:

```text
Aspect Ratio → Reference Fidelity → Transformation Strength → Review
```

Deliverable: correct mode-specific Final flow and adaptive progress.

### Phase 7 — Review + branch-aware editing

Build the editorial Review.

Implement:

- Living Sentence token edit;
- recap edit;
- direct return after simple edits;
- pending dependency resolution after branch-changing edits;
- clearing/ignoring values that become semantically invalid;
- stable session persistence throughout edits.

Deliverable: no need to replay the whole Wizard for a one-field edit.

### Phase 8 — Direction Ready / handoff

Replace the old generic completed-Draft card with the accepted completion scene.

Implement:

- `Your direction is ready` semantics;
- concise direction preview;
- `OPEN IN CREATE →` primary CTA;
- Save as Template;
- Start another aligned with main content;
- subtle return to Review/Edit Direction;
- Create remains untouched until explicit handoff.

Deliverable: accepted final experience without changing handoff invariants.

### Phase 9 — responsive/accessibility/polish

Test at minimum:

- large desktop;
- normal laptop;
- narrow laptop/tablet;
- mobile/touch.

Verify:

- choice wrapping;
- Living Sentence wrapping;
- chapter nav overflow;
- inputs/refinement overflow;
- keyboard navigation;
- visible focus;
- contrast;
- reduced motion;
- no layout shift from variable-weight hover.

Deliverable: production-ready interaction behavior.

### Phase 10 — final regression and real generation

Run:

```text
pnpm test:wizard
pnpm test:module-wording
pnpm build
pnpm generate
```

Add/expand Wizard tests for new navigation behavior.

Then run real Portrait generation checks for representative paths.

Deliverable: validated implementation ready for review/merge.

---

## 13. Required automated regression additions

Keep the existing Wizard suite and add focused tests for behavior introduced by the Living Sentence migration.

Minimum new regression matrix:

### Navigation/progress

- one-person PEOPLE completes immediately;
- multiple PEOPLE progress resolves in relevant order;
- Headshot excludes Pose from Composition progress;
- Create excludes transform-only Final states;
- transform Final includes all three relevant micro-states.

### Review edit

- simple choice edit → Review directly;
- Headshot → Half Body asks Pose then Review;
- Half Body → Headshot clears/ignores Pose then Review;
- one → multiple resolves count/config only;
- Transform → Create removes transform-only requirements;
- Create → Transform resolves newly required reference controls.

### Environment refinement

- refinement choices persist in session;
- restore preserves refinement;
- completion maps refinement to canonical Background configuration.

### Per-subject overrides

For Expression/Hair/Outfit/Pose:

- shared only;
- one Subject overridden;
- multiple Subjects overridden;
- changing shared value does not erase explicit overrides;
- non-overridden Subjects inherit the new shared value.

### Completion

- finishing does not mutate existing Create Draft;
- Open in Create creates a new Draft;
- return to Review retains the completed Wizard direction until explicitly restarted/handed off as intended.

---

## 14. Suggested first coding slice

Do not start by replacing every state at once.

First implementation slice should be:

```text
WizardLivingShell
+ WizardChapterNav
+ LivingSentence token/composer foundation
+ typographic choice primitive
+ Entry
+ People one/multiple
```

Why:

- establishes the visual language;
- proves variable-font/motion behavior in the real app;
- proves adaptive chapter progress early;
- proves semantic state → Living Sentence mapping;
- limits risk before the more complex Subject/override/Review flows.

After this slice works, continue incrementally through the phase list.

---

## 15. Definition/runtime strategy

Do not immediately rewrite `portraitWizardV2Definition` into dozens of Figma-shaped Steps.

First determine whether the new presentation can sequence existing question ownership as micro-states through a presentation adapter.

Only change definition structure when it improves semantic ownership or branching, not merely because Figma has separate React components.

Preferred principle:

```text
semantic definition != number of rendered screens
```

If new reusable metadata is required for presentation order/chapter progress, add the smallest typed field/helper possible and cover it with definition/session tests.

---

## 16. Styling strategy

Use the existing design system for foundations, but Wizard-specific CSS is expected.

Prefer:

- scoped/component styles or a dedicated Wizard style layer;
- project tokens where visually compatible;
- explicit Wizard tokens only when the new experience genuinely needs them;
- CSS variables for recurring Wizard surfaces/typography/motion values.

Avoid:

- copying Tailwind utility strings from Make into production architecture;
- replacing the global design system;
- forcing all expressive Wizard interactions into generic `el-button` presentation.

Semantic HTML/buttons can still sit underneath custom visual styling.

---

## 17. Decisions intentionally deferred

Do not expand scope during this migration into:

- universal Wizard DSL;
- AI-generated Wizard definitions;
- general graph workflow engine;
- per-subject Lighting;
- per-subject Framing;
- redesign of Expert UI;
- automatic Living Sentence → generated Idea mapping;
- Template feature expansion;
- generalized external reference asset-binding system.

Fix concrete production issues only when they block the accepted Portrait experience or expose a proven reusable Wizard primitive.

---

## 18. Completion criteria for this branch

`feature/wizard-figma` is ready to merge only when:

- accepted Make visual direction is represented in the real Nuxt/Vue Wizard;
- known Make gaps in section 5 are fixed;
- canonical Actions/domain invariants remain intact;
- one/multiple and Create/Transform paths work;
- Headshot/Pose branching works;
- environment refinement persists and maps correctly;
- shared/per-subject overrides are usable through progressive disclosure;
- Review editing returns intelligently without replaying the full flow;
- completion messaging/handoff semantics are correct;
- responsive/accessibility pass is complete;
- Wizard tests pass;
- build/generate pass;
- representative real-generation checks are acceptable.

---

## 19. New-chat startup procedure

When continuing this branch in a new chat:

1. confirm branch is `feature/wizard-figma`;
2. read [`README.md`](./README.md);
3. read [`UI.md`](./UI.md);
4. read this `IMPLEMENTATION.md` completely;
5. read [`STATUS.md`](./STATUS.md);
6. inspect the latest branch diff before changing code;
7. continue from the first incomplete implementation phase in `STATUS.md`;
8. do not restart Figma design work unless a concrete implementation ambiguity cannot be resolved from the accepted prototype/screens/code.

The current Make file remains the visual reference, but production behavior and the fixes documented here are authoritative when Make contains a known prototype bug.
