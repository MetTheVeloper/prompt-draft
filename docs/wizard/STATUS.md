# Wizard Development Status

Last updated: **2026-08-31**

Status: **Portrait logic/domain foundation is healthy; Living Sentence Figma prototype is built and accepted as the future UI direction; production UI migration is intentionally paused until Figma refinement is complete**

Working branch: `feature/wizard`

Architecture source of truth: [`README.md`](./README.md)

Wizard UX / Living Sentence source: [`UI.md`](./UI.md)

Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)

Actions contract: `prompt-draft.actions.v1`

---

## 1. Current branch checkpoint

Latest runtime checkpoint before this documentation refresh:

```text
feature/wizard@998afb15cbf6510004387e0de16049534cecc88c
```

Latest runtime commit message:

```text
fix(wizard-ui): use normal text token for selected choices
```

Documentation updates after that checkpoint record the accepted Figma/Living Sentence direction and do not intentionally alter runtime behavior.

The user is currently running a fresh local project/build health check. Do **not** claim that this final check has passed until the user confirms it.

---

## 2. Major accepted direction change

The previous functional Portrait Wizard UI is no longer considered the target visual implementation.

The accepted future experience is **Living Sentence**:

```text
User intent
  ↓
choice becomes language
  ↓
evolving natural-language sentence
  ↓
review/edit semantic tokens
  ↓
canonical mapping / compile
```

The existing Nuxt Wizard remains valuable as the domain/runtime foundation. The redesign should replace/refactor presentation without discarding canonical Actions, session semantics, subject targeting, branching, validation, or compile behavior.

See [`UI.md`](./UI.md) for the complete accepted design direction.

---

## 3. Figma Make checkpoint

Current Make prototype:

```text
https://www.figma.com/make/jgi1MxTu7e16Dv7AFiRof2/Review-Instructions
```

The prototype is substantially more than a static skeleton. It currently contains a React/Vite/Tailwind implementation with:

- central Wizard state engine;
- Entry;
- People / People Count;
- Subject configuration;
- Portrait direction;
- Expression;
- Hair;
- Outfit;
- Framing;
- Pose;
- Scene + environment refinement;
- Lighting;
- Aspect Ratio;
- Reference Fidelity;
- Transformation Strength;
- Review;
- Prompt Ready;
- Living Sentence composition/navigation.

Important: this React code is **reference implementation/prototype code only**. Production remains Nuxt/Vue.

Figma AI refinement is currently paused because the user's daily Figma AI credits are exhausted. Resume the design/refinement pass after credits refresh.

---

## 4. Accepted Figma design concepts

The prototype direction is strongly accepted, including:

- dark editorial/cinematic visual language;
- large expressive typography;
- two typographic Entry gateways instead of cards;
- `CHOOSING AN ANSWER = MOVING FORWARD` for simple choices;
- Living Sentence remaining present and recomposing naturally;
- progressive disclosure;
- shared-first multi-person settings;
- per-person overrides only on demand;
- framing/crop visual metaphor;
- ambient Scene/Lighting feedback;
- proportion-based Aspect Ratio selector;
- creative sentence separated from technical metadata;
- editorial Review with clickable semantic sentence tokens;
- full-screen Prompt Ready scene instead of generic success modal.

The prototype still requires QA/refinement before production implementation. Do not assume every current Figma detail is final merely because the overall direction is accepted.

---

## 5. Next Figma session objective

When Figma AI credits are available again, do **not** restart the design from scratch.

First audit the existing prototype end-to-end and classify findings:

```text
KEEP
CHANGE
REMOVE
BUG
POLISH
```

Test at least:

1. Transform → one person;
2. Transform → multiple people;
3. multi-person shared + individual overrides;
4. Create → one person;
5. Create → multiple people;
6. Headshot → Pose skip;
7. Scene free text + environment refinement;
8. Lighting ambient behavior;
9. Aspect Ratio;
10. Transform-only Reference Fidelity + Transformation Strength;
11. Review token editing;
12. Generate → Prompt Ready.

Focus review on:

- sentence grammar/naturalness;
- state pacing;
- unnecessary micro-states;
- anything that reverted to SaaS/form patterns;
- typography/hierarchy;
- motion meaning;
- branch correctness;
- responsive behavior;
- accessibility.

Then perform one focused refinement pass instead of scattered small prompts.

---

## 6. Production implementation strategy after Figma is locked

Do not port the Figma React project wholesale.

Target architecture:

```text
existing Prompt Draft design system
        +
Wizard-specific interaction layer
        +
existing canonical Wizard/domain logic
        ↓
Nuxt/Vue Living Sentence Wizard
```

Reuse existing shared components/tokens where they fit.

Create dedicated Wizard primitives where the interaction genuinely requires them, for example:

- Living Sentence;
- semantic sentence tokens;
- cinematic shell;
- typographic gateway/choice;
- ambient feedback;
- proportion selector;
- Wizard transitions;
- refinement palette.

Do not rewrite the whole component system for the Wizard. Promote Wizard-specific primitives into the shared system only after they prove broadly reusable.

---

## 7. Reuse across future Wizard use cases

Portrait is the first use case, not the final architecture.

The following should be reusable across future Wizards:

- session/lifecycle;
- deterministic branching;
- Living Sentence interaction model;
- progressive disclosure;
- creative vs technical separation;
- review/edit semantic tokens;
- shared + override mechanics where relevant;
- canonical mapping boundary.

Each use case should provide its own:

- semantic questions;
- choices;
- branch rules;
- sentence grammar/composition;
- canonical mappings.

Do **not** hard-code Portrait sentence grammar into the generic Wizard experience layer.

---

## 8. Existing Portrait semantic foundation remains accepted

Current accepted domain capabilities include:

### Subjects

- one to four people;
- optional names;
- stable identities;
- semantic Subject Definition;
- unique canonical keys.

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

### Look / targeting

Implemented:

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

Do not add per-subject Lighting.

### Composition / Scene

- Headshot suppresses Pose;
- Background refinement currently has sufficient canonical depth;
- Lighting remains scene-level;
- the Outdoor + Moody preset mismatch was already corrected.

### Completion

Wizard still maps through canonical Actions, validates, compiles, and produces `finalDraft`.

Create remains untouched until explicit handoff, which creates a NEW Draft.

---

## 9. Existing automated validation checkpoint

Latest previously reported Wizard suite:

```text
pnpm test:wizard
46 tests
46 passed
0 failed
```

Coverage includes:

- Portrait definition/session/completion;
- Subject Definition semantics;
- unnamed Subject behavior;
- image/text custom definitions;
- Environment/Lighting regression;
- shared/per-subject Expression/Hair/Outfit;
- shared/per-subject Pose.

This remains useful domain regression protection during the future UI migration.

---

## 10. Immediate branch/merge plan

### A. Right now

- documentation has been updated on `feature/wizard`;
- user runs local build/project health check;
- do not make further runtime/UI changes until the result is known.

### B. If the user confirms the build is healthy

Before merging the current Wizard foundation to `main`:

1. temporarily hide/remove the **Wizard** and **Template** entry buttons from the main header/navigation;
2. keep all Wizard/Template implementation code intact;
3. run final build/tests;
4. merge the accepted `feature/wizard` foundation into `main`.

Prefer a small feature/config visibility gate over deleting feature code.

### C. Wording/compiler work

After that merge, create a fresh branch from latest `main`, recommended name:

```text
refactor/module-wording
```

Use that branch for:

- module output wording cleanup;
- compile-output concision;
- removal of internal/system-only identifiers from user-facing compiled prompt text;
- Layout/Typography wording improvements;
- redundancy cleanup.

This work is expected to be largely independent from Wizard presentation code.

Merge the completed wording work back to `main` after validation.

### D. Final Living Sentence implementation

Do **not** return to a stale `feature/wizard` branch after `main` has advanced.

After Figma direction is locked and wording work is merged, create a fresh implementation branch from the latest `main`, recommended:

```text
feature/wizard-figma
```

Implement the final Living Sentence Nuxt/Vue presentation there.

This sequencing minimizes drift/conflicts:

```text
Wizard foundation → main
Module wording     → main
latest main        → feature/wizard-figma
```

---

## 11. Work that is safe while Figma design is pending

Safe/valuable:

- domain/state architecture;
- branching/validation;
- reusable use-case architecture;
- sentence composition semantics;
- canonical mapping;
- shared/per-subject behavior;
- tests;
- module wording/compiler cleanup on its own branch.

Avoid for now:

- polishing current Wizard layout;
- final Wizard typography;
- final animation/motion;
- detailed spacing/styling of the legacy Wizard UI.

Those areas are expected to change during the Living Sentence migration.

---

## 12. Prompt Templates — accepted and frozen

Template behavior remains accepted:

- Start from Template;
- always creates a NEW Draft;
- previous Draft remains unchanged;
- Save as Template from Create;
- Save as Template from Wizard completion;
- local user Templates;
- first built-in: `LinkedIn Profile Portrait`.

Invariant:

```text
Template = versioned PromptDraftState snapshot
Template ≠ compiled prompt string
```

Do not expand Template functionality without a concrete requirement.

The header entry may be temporarily hidden while the feature is not ready for public-facing use; hiding the entry must not remove the implementation.

---

## 13. Deferred work

Do not implement without a concrete requirement:

- universal Wizard DSL;
- arbitrary rule scripting;
- generalized nested workflow tree;
- Wizard-specific compiler/validator;
- direct arbitrary Draft mutation;
- broad Expert UI rewrite;
- per-subject Lighting;
- automatic per-subject support for every domain;
- Apply Template to Current Draft;
- Template marketplace/cloud sync;
- generalized per-reference asset binding before reference architecture is designed.

---

## 14. New-chat continuation instructions

A new Wizard chat should first read:

1. [`README.md`](./README.md)
2. [`UI.md`](./UI.md)
3. this `STATUS.md`
4. [`TEMPLATES.md`](./TEMPLATES.md) only if Template behavior is relevant.

Then determine which phase is current:

- if Figma credits are available and Figma refinement is not finished → continue the Figma QA/refinement pass;
- if Figma is locked and latest `main` contains wording changes → create/resume the fresh Living Sentence implementation branch from latest `main`;
- do not spend time polishing the legacy Wizard UI unless fixing a blocking bug.

Before any merge/runtime change, confirm the latest local build/test result with the user if it has not already been reported.
