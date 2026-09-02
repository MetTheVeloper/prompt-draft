# Wizard Development Status

Last updated: **2026-09-02**

Status: **Phases 0–5 are implemented and locally validated on `feature/wizard-figma`; Phase 6 (Final technical controls) is the active production slice.**

Working branch: `feature/wizard-figma`

Architecture source of truth: [`README.md`](./README.md)

Wizard UX source: [`UI.md`](./UI.md)

Production implementation plan: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)

Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)

Actions contract: `prompt-draft.actions.v1`

---

## 1. Validated production checkpoint

Latest locally validated checkpoint before Phase 6:

```text
c30976b1f187b77407aaaee6b47f860dd3b0dd40
Phase 5 Scene + persistent environment refinement + Lighting
```

Validation reported on **2026-09-02**:

```text
pnpm test:wizard  → green
pnpm build        → green
manual flow       → okay
```

Implemented and validated through this checkpoint:

- Phase 0 regression baseline;
- Phase 1 Living shell, chapter navigation, Living Sentence and typographic primitives;
- Phase 2 Entry / People / Subject configuration / Portrait;
- Phase 3 Expression / Hair / Outfit shared-first flow and optional per-subject customization;
- Prompt Draft theme-token integration and Wizard i18n conventions;
- Phase 4 Framing visual selector, top-anchored crop, Headshot → Pose skip, shared-first Pose details and per-subject Pose overrides;
- Phase 5 Studio / Outdoors / Abstract Living Scene flow;
- contextual environment detail persisted directly in canonical answers;
- environment refinement persisted through canonical `backgroundOptions`;
- Lighting migrated into the Living Scene chapter;
- Scene Back/resume/progress behavior validated locally.

Canonical Portrait mapping, isolated Wizard session semantics, validation/compile and explicit Create handoff remain authoritative.

---

## 2. Active phase — Phase 6 Final technical controls

Target flow:

```text
Create
  Aspect Ratio
      ↓
    Review

Transform
  Aspect Ratio
      ↓
  Reference Fidelity
      ↓
  Transformation Strength
      ↓
    Review
```

Accepted Aspect Ratio set:

```text
1:1
4:5
5:4
3:4
4:3
9:16
16:9
```

Requirements:

- each ratio is represented by its actual proportion;
- `5:4` and `4:3` use the existing canonical Prompt Draft aspect-ratio catalog values;
- technical controls stay outside the creative Living Sentence;
- default answer ownership does not silently skip presentation states;
- Create sees only Aspect Ratio;
- Transform sees Aspect Ratio → Reference Fidelity → Transformation Strength;
- Back follows the inverse mode-relevant sequence;
- Final chapter progress adapts to the current branch;
- all new visible copy uses Wizard i18n;
- all new UI styling uses Prompt Draft theme tokens.

After Phase 6 validates locally, continue with **Phase 7 — editorial Review + branch-aware edit return**.

---

## 3. Figma Make reference

Reference:

```text
https://www.figma.com/make/jgi1MxTu7e16Dv7AFiRof2/Review-Instructions
```

The Make file is a visual/interaction reference only. Production remains Nuxt/Vue and uses Prompt Draft theme/i18n/domain conventions.

Accepted Final reference behavior includes:

- proportion-based Aspect Ratio selector;
- immediate selection/advance;
- Create → Review after Aspect Ratio;
- Transform → Reference Fidelity → Transformation Strength → Review;
- typography-first Reference Fidelity and Transformation Strength choices.

Production uses canonical values from the existing definition/mapping rather than Make-local aliases.

---

## 4. Known Make gaps / production corrections

### PEOPLE progress

Implemented and validated.

### SCENE progress / refinement continuity

Implemented and validated.

### Environment refinement persistence

Implemented and validated through canonical `backgroundOptions`.

### Per-subject override usability

Implemented and validated for Expression, Hair, Outfit and Pose. Lighting and Framing remain shared-only.

### Final ratios

Production must include `5:4` and `4:3` in addition to the older definition set and map them through the existing Prompt Draft aspect-ratio catalog.

### Review branch-changing edits

Pending Phase 7.

Examples:

```text
Headshot → Half Body → ask Pose only → Review
One Person → Multiple → ask count/config only → Review
Transform ↔ Create → add/remove only mode-specific required states → Review
```

---

## 5. Production architecture direction

Target:

```text
existing canonical Wizard/domain runtime
        +
existing Prompt Draft design-system foundations
        +
Wizard-specific Living Sentence presentation layer
        ↓
production Portrait Wizard
```

Important canonical files remain authoritative:

```text
app/pages/wizard/[wizardId].vue
app/wizard/definition.ts
app/wizard/session.ts
app/wizard/sessionPersistence.ts
app/wizard/registry.ts
app/wizard/portrait.ts
app/wizard/portraitReview.ts
app/wizard/portraitCompletion.ts
app/wizard/entities.ts
app/wizard/portraitSubjectOverrides.ts
app/wizard/portraitBackgroundOptions.ts
app/wizard/portraitPoseOptions.ts
app/wizard/hostDraft.ts
```

Living presentation helpers may own presentation micro-state, chapter progress, display wording and Living Sentence tokens. They must not become a second mapping engine.

---

## 6. Phase status

```text
Phase 0  regression baseline                                      validated
Phase 1  Living foundation                                       validated
Phase 2  Entry / People / Portrait                                validated
Phase 3  Look + per-subject progressive disclosure               validated
Phase 4  Composition                                              validated
Phase 5  Scene + persistent environment refinement + Lighting    validated
Phase 6  Final technical controls                                 active
Phase 7  Review + branch-aware edit return                        pending
Phase 8  Direction Ready / Create handoff                         pending
Phase 9  responsive / accessibility / motion polish              pending
Phase 10 final regressions / build / generate / real generation   pending
```

Keep production slices reviewable; do not combine pending phases into one migration commit.

---

## 7. Semantic invariants

### Subjects

- one to four people;
- stable identities;
- optional names;
- semantic Subject Definition;
- custom definition text when required.

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
- Create skips transform-only Final controls;
- Transform includes Reference Fidelity and Transformation Strength.

### Living Sentence

Creative sentence content remains derived presentation state. Technical Final controls remain outside it.

---

## 8. Regression protection

Primary Wizard command:

```text
pnpm test:wizard
```

Historical pre-migration baseline was 46/46. That count is historical only; focused Living tests are added as phases land.

Coverage required as migration continues:

- adaptive People / Look / Composition / Scene / Final progress;
- Headshot excludes Pose and invalidates stale Pose answers;
- shared and per-subject Expression/Hair/Outfit/Pose behavior;
- environment refinement persistence and canonical Background mapping;
- mode-specific Final flow and canonical Aspect Ratio mapping;
- Review edit dependency resolution;
- completion does not mutate Create before explicit handoff.

After every risky slice validate locally with at least:

```text
pnpm test:wizard
pnpm build
```

Final Phase 10 validation remains:

```text
pnpm test:wizard
pnpm test:module-wording
pnpm build
pnpm generate
```

---

## 9. Completion/handoff invariant

Wizard completion produces a validated `finalDraft` through the canonical mapping/compile path.

Create remains untouched until explicit handoff:

```text
Wizard direction ready
  ↓
OPEN IN CREATE
  ↓
create a NEW Create Draft
```

---

## 10. Out of scope

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

## 11. New-chat continuation

A new chat continuing `feature/wizard-figma` should:

1. verify the current branch and latest remote head;
2. inspect the latest branch diff;
3. read `README.md`, `UI.md`, `IMPLEMENTATION.md` and this `STATUS.md`;
4. trust only locally reported validation checkpoints, not historical test counts;
5. start from the first incomplete implementation phase;
6. use Figma Make as reference only;
7. implement corrected production behavior wherever Make conflicts with documented requirements.

Do not return to Figma refinement as the default next step. Production implementation is the active phase.
