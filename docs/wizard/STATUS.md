# Wizard Development Status

Last updated: **2026-09-02**

Status: **Phases 0–3 are implemented and locally validated on `feature/wizard-figma`; Phase 4 (Composition) is the active production slice.**

Working branch: `feature/wizard-figma`

Architecture source of truth: [`README.md`](./README.md)

Wizard UX source: [`UI.md`](./UI.md)

Production implementation plan: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)

Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)

Actions contract: `prompt-draft.actions.v1`

---

## 1. Validated production checkpoint

Latest locally validated checkpoint before Phase 4:

```text
71a47574b85d1d7e4d4c54254086e5573e022d89
refactor(wizard): align living UI with app theme and i18n
```

Validation reported on **2026-09-02**:

```text
pnpm test:wizard  → green
pnpm build        → green
manual output     → okay
```

Do not infer an exact current test count from the historical pre-migration baseline. Focused Living tests have been added during the migration.

Implemented and validated through this checkpoint:

- Phase 0 regression baseline;
- Phase 1 Living shell, chapter navigation, Living Sentence and typographic primitives;
- Phase 2 Entry / People / Subject configuration / Portrait;
- Phase 3 Expression / Hair / Outfit shared-first flow and optional per-subject customization;
- Prompt Draft theme-token integration for the Living UI built so far;
- English Wizard copy routed through the project i18n system;
- Living Sentence wording localized through a presentation localizer.

Canonical Portrait mapping, isolated Wizard session semantics, validation/compile and explicit Create handoff remain authoritative.

---

## 2. Active phase — Phase 4 Composition

Target flow:

```text
Framing
  ↓
Headshot ───────────────→ Scene
  ↓ other framing
Pose shared direction
  ↓
optional Pose details / optional per-subject overrides
  ↓
Scene
```

Requirements:

- Framing uses the accepted visual selector and top-anchored crop metaphor;
- Headshot suppresses Pose;
- selecting Headshot removes stale Pose answers so a later branch change cannot silently reuse old Pose state;
- Pose remains shared-first;
- optional detailed Pose controls use the existing `poseOptions` answer architecture;
- optional per-subject Pose customization uses the existing `poseSubjectOverrides` architecture;
- any relevant Subject can be selected for override;
- Composition progress derives from branch-relevant presentation micro-states;
- Living Sentence includes Pose only when the active Framing branch permits it;
- canonical mapping is not duplicated in presentation code.

After Phase 4 validates locally, continue with **Phase 5 — Scene + persistent environment refinement + Lighting**.

---

## 3. Figma Make reference

Reference:

```text
https://www.figma.com/make/jgi1MxTu7e16Dv7AFiRof2/Review-Instructions
```

The Make file is a **visual and interaction reference only**. Production remains Nuxt/Vue and must use the existing Prompt Draft architecture and design-system tokens.

Accepted reference behavior includes:

- typography-first interaction;
- symmetric Entry split and centered `or`;
- subtle active-chapter progress line;
- Living Sentence throughout the flow;
- one-line `MULTIPLE PEOPLE` at normal desktop/laptop widths;
- top-anchored Framing/crop visualization;
- Headshot → Pose skip;
- shared-first Look and Pose intent;
- Scene contextual refinement;
- ambient Lighting feedback;
- editorial Review;
- `Your direction is ready` completion semantics.

Production must correct documented Make logic gaps rather than reproduce them.

---

## 4. Known Make gaps / production corrections

### PEOPLE progress

Production derives People progress from its relevant micro-states. Implemented in the Living presentation layer.

### SCENE progress / refinement continuity

Pending Phase 5. Environment refinement must remain inside the Wizard shell and preserve Living Sentence/chapter context.

### Environment refinement persistence

Pending Phase 5. Refinement must write canonical `backgroundOptions` and map through the existing Background architecture; local-only panel state is not acceptable.

### Per-subject override usability

Production uses shared-first progressive disclosure for:

```text
Expression
Hair
Outfit
Pose
```

Expression/Hair/Outfit are implemented. Pose is Phase 4. Lighting and Framing remain shared-only.

### Review branch-changing edits

Pending Phase 7.

Examples:

```text
Headshot → Half Body → ask Pose only → Review
One Person → Multiple → ask count/config only → Review
Transform ↔ Create → add/remove only mode-specific required states → Review
```

Do not replay the whole Wizard after a one-field Review edit.

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

Important foundation remains in:

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

Living presentation helpers may own presentation micro-state, chapter progress, display wording and Living Sentence tokens. They must **not** become a second mapping engine.

---

## 6. Phase status

```text
Phase 0  regression baseline                                      validated
Phase 1  Living foundation                                       validated
Phase 2  Entry / People / Portrait                                validated
Phase 3  Look + per-subject progressive disclosure               validated
Phase 4  Composition                                              active
Phase 5  Scene + persistent environment refinement + Lighting    pending
Phase 6  Final technical controls                                 pending
Phase 7  Review + branch-aware edit return                        pending
Phase 8  Direction Ready / Create handoff                         pending
Phase 9  responsive / accessibility / motion polish              pending
Phase 10 final regressions / build / generate / real generation   pending
```

Keep production slices reviewable; do not replace several pending phases in one large migration commit.

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
- Create skips transform-only final controls;
- Transform includes Reference Fidelity and Transformation Strength.

Do not weaken these semantics while migrating presentation.

---

## 8. Regression protection

Primary Wizard command:

```text
pnpm test:wizard
```

Historical pre-migration baseline:

```text
46 tests
46 passed
0 failed
```

That number is historical only; new Living tests have been added since then.

Coverage required as migration continues:

- adaptive People / Look / Composition / Scene / Final progress;
- Headshot excludes Pose and invalidates stale Pose presentation answers;
- shared and per-subject Expression/Hair/Outfit/Pose behavior;
- environment refinement persistence and canonical mapping;
- Review edit dependency resolution;
- completion does not mutate Create before explicit handoff.

After every risky production slice validate locally with at least:

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

The final Wizard UI must not imply that its direction preview is already the fully tuned Create experience.

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

Do **not** return to Figma refinement as the default next step. Production implementation is the active phase.
