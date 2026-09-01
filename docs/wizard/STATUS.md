# Wizard Development Status

Last updated: **2026-09-01**

Status: **Living Sentence Figma reference is sufficiently complete; production Nuxt/Vue implementation begins now on `feature/wizard-figma`**

Working branch: `feature/wizard-figma`

Architecture source of truth: [`README.md`](./README.md)

Wizard UX source: [`UI.md`](./UI.md)

Production implementation plan: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)

Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)

Actions contract: `prompt-draft.actions.v1`

---

## 1. Branch checkpoint

`feature/wizard-figma` was created fresh from the latest `main` after the module-wording work was merged.

Before Wizard documentation work, the branch and `main` were identical at:

```text
38fe94513b2b869a720b1595a915711289040fcf
```

The first branch-only change is the production implementation documentation.

No production Wizard runtime/UI migration has been started yet in this branch at the time of this checkpoint.

---

## 2. Current phase decision

Do **not** wait for another Figma AI refinement cycle.

The current Figma Make prototype is accepted as sufficiently complete to begin implementation. The remaining gaps are understood and are documented in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) so they can be corrected directly in production.

Figma AI credits are not expected to refresh until **2026-10-01**. This is not a blocker.

The project now moves from:

```text
Figma audit / refinement
```

to:

```text
Nuxt/Vue production implementation
```

---

## 3. Figma Make reference checkpoint

Reference:

```text
https://www.figma.com/make/jgi1MxTu7e16Dv7AFiRof2/Review-Instructions
```

The latest Make pass successfully implemented most accepted polish items, including:

- smooth variable-font weight transitions;
- symmetric Entry split;
- centered `or` inside the divider;
- subtle active-chapter progress line;
- one-line `MULTIPLE PEOPLE` desktop behavior;
- corrected top-anchored framing/crop visualization;
- additional `5:4` and `4:3` aspect ratios;
- custom person-description input concept;
- `Your direction is ready` completion semantics;
- left-aligned `Start another`;
- subtle return from completion to edit direction;
- simple Review edit → direct Review return behavior.

The current Make file should be treated as the visual/interaction reference, not production source.

---

## 4. Known Make gaps to fix directly in production

These are explicitly accepted implementation tasks:

### PEOPLE progress

Multi-person progress in Make is not calculated consistently.

Production must derive progress from the relevant micro-states for the current branch.

### SCENE progress / refinement continuity

Environment refinement should remain inside the Wizard experience and must participate correctly in Scene progression/orientation.

### Environment refinement persistence

Make keeps refinement selections locally in the panel. Production must persist them into the canonical Wizard `backgroundOptions` answer/state and map them through the existing Background implementation.

### Per-subject override usability

Make contains the override concept but auto-advance makes the path incomplete/unreliable.

Production must implement shared-first progressive disclosure for:

```text
Expression
Hair
Outfit
Pose
```

Any relevant Subject must be selectable. Lighting and Framing remain shared-only.

### Review branch-changing edits

Simple edits can return directly to Review, but branch-changing edits need dependency resolution.

Examples:

```text
Headshot → Half Body → ask Pose only → Review
One Person → Multiple → ask count/config only → Review
Transform ↔ Create → add/remove only mode-specific required states → Review
```

Do not replay the entire Wizard after a one-field Review edit.

---

## 5. Accepted UX details from final manual audit

Keep:

- Entry composition and both gateway concepts;
- Portrait selection;
- Expression/Hair/Outfit visual language;
- framing silhouette/crop concept;
- Headshot → Pose skip;
- Pose screen;
- Scene choice/context input;
- Environment refinement concept;
- Lighting screen;
- Reference Fidelity;
- Transformation Strength;
- editorial Review;
- clickable Living Sentence/recap edit affordances;
- final cinematic completion scene.

Additional accepted rules:

- active multi-step chapters use a subtle under-label progress line;
- progress must adapt to branch-relevant micro-states;
- `MULTIPLE PEOPLE` should not wrap unnecessarily at normal desktop/laptop widths;
- aspect ratios include `1:1`, `4:5`, `5:4`, `3:4`, `4:3`, `9:16`, `16:9`;
- custom Subject description is separate from optional Name;
- completion explains that Create is the place to refine/tune the final prompt;
- completion offers a subtle return to Review/Edit Direction.

---

## 6. Production architecture direction

Do not port Make React code wholesale.

Target:

```text
existing canonical Wizard/domain runtime
        +
existing Prompt Draft design-system foundations
        +
new Wizard-specific Living Sentence presentation layer
        ↓
production Nuxt/Vue Wizard
```

Important production foundation already exists in:

```text
app/pages/wizard/[wizardId].vue
app/wizard/definition.ts
app/wizard/session.ts
app/wizard/portrait.ts
app/wizard/portraitReview.ts
app/wizard/portraitSubjectOverrides.ts
app/wizard/portraitBackgroundOptions.ts
app/wizard/completion.ts
```

Preserve canonical Actions mapping, independent session semantics, validation/compile, Subject identity, and Create handoff invariants.

See [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) for the file-level/phase plan.

---

## 7. Implementation phases

Current sequence:

```text
Phase 0  regression baseline
Phase 1  Living shell / chapter nav / Living Sentence / typography primitives
Phase 2  Entry / People / Portrait
Phase 3  Look + per-subject progressive disclosure
Phase 4  Composition
Phase 5  Scene + persistent environment refinement + Lighting
Phase 6  Final technical controls
Phase 7  Review + branch-aware edit return
Phase 8  Direction Ready / Create handoff
Phase 9  responsive / accessibility / motion polish
Phase 10 final regressions / build / generate / real generation
```

The recommended first coding slice is:

```text
WizardLivingShell
+ WizardChapterNav
+ LivingSentence token/composer foundation
+ typographic choice primitive
+ Entry
+ People one/multiple
```

Do not replace the entire Wizard in one commit.

---

## 8. Existing domain regression protection

Current Wizard script:

```text
pnpm test:wizard
```

Existing package coverage includes:

```text
scripts/wizard-definition.test.ts
scripts/wizard-session.test.ts
scripts/wizard-portrait.test.ts
scripts/wizard-portrait-v2.test.ts
scripts/wizard-subject-overrides.test.ts
scripts/wizard-completion.test.ts
scripts/wizard-lighting-environment.test.ts
scripts/wizard-subject-definitions.test.ts
```

Previously reported baseline:

```text
46 tests
46 passed
0 failed
```

Run a fresh local baseline before/at the start of runtime migration and report the actual result; do not assume the old count remains current after later repository changes.

New tests are required for adaptive chapter progress, branch-aware Review editing, environment-refinement persistence, and the new per-subject UX/navigation behavior.

---

## 9. Existing semantic foundation remains accepted

### Subjects

- one to four people;
- stable identities;
- optional names;
- semantic Subject Definition;
- custom definition text when required.

Image-to-image definitions:

```text
By position in reference
Male person in reference
Female person in reference
Custom reference description
```

Text-to-image definitions:

```text
Person
Man
Woman
Boy
Girl
Custom subject
```

### Shared/per-subject

Supported:

```text
Expression  shared + per-subject
Hair        shared + per-subject
Outfit      shared + per-subject
Pose        shared + per-subject
```

Shared-only:

```text
Framing
Background
Lighting
```

### Branching

- Headshot suppresses Pose;
- Create skips transform-only final controls;
- Transform includes Reference Fidelity and Transformation Strength.

Do not weaken these semantics while migrating the presentation.

---

## 10. Completion/handoff invariant

Wizard completion still produces a validated `finalDraft` through the canonical mapping/compile path.

Create must remain untouched until explicit handoff.

```text
Wizard direction ready
  ↓
OPEN IN CREATE
  ↓
create a NEW Create Draft
```

The new completion UI wording should not imply that the Wizard's direction preview is already the fully tuned final Create prompt experience.

---

## 11. Work intentionally out of scope

Do not expand this branch into:

- universal Wizard DSL;
- arbitrary graph/rule scripting engine;
- AI-generated Wizard definitions;
- per-subject Lighting;
- per-subject Framing;
- broad Expert UI rewrite;
- automatic Living Sentence → Idea architecture change;
- Template feature expansion;
- generalized reference-asset binding.

---

## 12. New-chat continuation instructions

A new chat continuing `feature/wizard-figma` should:

1. verify the local branch is `feature/wizard-figma`;
2. inspect the latest branch diff;
3. read [`README.md`](./README.md);
4. read [`UI.md`](./UI.md);
5. read [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) completely;
6. read this `STATUS.md`;
7. run/confirm the current local `pnpm test:wizard` baseline before risky runtime changes if it has not already been reported;
8. start from the first incomplete implementation phase;
9. use the current Figma Make code/screens as reference only;
10. when Make behavior conflicts with a known gap documented in `IMPLEMENTATION.md`, implement the corrected production behavior.

Do **not** return to Figma refinement as the default next step. Production implementation is now the active phase.
