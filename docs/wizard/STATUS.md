# Wizard Development Status

Last updated: **2026-09-02**

Status: **Phases 0–6 are implemented and locally validated on `feature/wizard-figma`; Phase 7 (editorial Review + branch-aware edit return) is the active production slice.**

Working branch: `feature/wizard-figma`

Architecture source of truth: [`README.md`](./README.md)

Wizard UX source: [`UI.md`](./UI.md)

Production implementation plan: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)

Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)

Actions contract: `prompt-draft.actions.v1`

---

## 1. Validated production checkpoint

Latest locally validated checkpoint before Phase 7:

```text
a957ac360d1c4b8424e3573d17853def6ea837f2
Phase 6 Final technical controls
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
- Phase 5 Studio / Outdoors / Abstract Living Scene flow, persistent canonical Background refinement and Lighting;
- Phase 6 Final technical controls with branch-aware Create/Transform flow;
- accepted Aspect Ratio set `1:1 / 4:5 / 5:4 / 3:4 / 4:3 / 9:16 / 16:9`;
- canonical `5:4 → common_landscape_5_4` and `4:3 → common_landscape_4_3` mapping;
- technical Final controls remain outside the creative Living Sentence.

Canonical Portrait mapping, isolated Wizard session semantics, validation/compile and explicit Create handoff remain authoritative.

---

## 2. Active phase — Phase 7 Review + branch-aware edits

Target experience:

```text
Review
  ↓
large editable Living Sentence
  +
compact Creative recap
  +
compact Technical recap
```

Simple edit behavior:

```text
Review → edit value → Review
```

Branch-changing edits resolve only newly relevant dependencies:

```text
Headshot → Half Body
  ↓
Pose only
  ↓
Review
```

```text
One Person → Multiple
  ↓
count + person configuration only
  ↓
Review
```

```text
Create → Transform
  ↓
Reference Fidelity → Transformation Strength
  ↓
Review
```

```text
Transform → Create
  ↓
remove transform-only answer ownership
  ↓
Review
```

Phase 7 implementation currently includes:

- `WizardLivingReview.vue` editorial Review surface;
- editable semantic Living Sentence tokens;
- Creative recap rows for Mode / People / Portrait / Look / Composition / Scene;
- Technical recap rows for Aspect Ratio and transform-only controls when relevant;
- persisted Review edit context in `session.derived`;
- exact answer → presentation micro-state targeting;
- direct Review return after simple choice edits;
- Headshot/body Pose dependency resolution;
- One/Multiple People dependency resolution while preserving existing Subject identity where possible;
- Create/Transform dependency and invalidation resolution;
- contextual Scene detail confirmation before Review return;
- focused Phase 7 regressions wired into `pnpm test:wizard`.

Phase 7 is **not locally validated yet**. Validate before starting Phase 8.

---

## 3. Figma Make reference

Reference:

```text
https://www.figma.com/make/jgi1MxTu7e16Dv7AFiRof2/Review-Instructions
```

The Make file is a visual/interaction reference only. Production remains Nuxt/Vue and uses Prompt Draft theme/i18n/domain conventions.

Accepted Review behavior:

- Review is editorial, not a stack of settings cards;
- final Living Sentence is the visual payoff;
- semantic phrases are clickable/focusable edit targets;
- recap remains compact;
- technical controls remain separate from the creative sentence;
- branch-changing edits must not replay the whole Wizard.

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

Implemented and validated with the accepted seven-ratio set and canonical Prompt Draft mappings.

### Review branch-changing edits

Active Phase 7. Production uses explicit persisted edit context and targeted dependency resolution instead of replaying downstream steps.

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

Living presentation helpers may own presentation micro-state, chapter progress, display wording, Review edit context and Living Sentence tokens. They must not become a second mapping engine.

---

## 6. Phase status

```text
Phase 0  regression baseline                                      validated
Phase 1  Living foundation                                       validated
Phase 2  Entry / People / Portrait                                validated
Phase 3  Look + per-subject progressive disclosure               validated
Phase 4  Composition                                              validated
Phase 5  Scene + persistent environment refinement + Lighting    validated
Phase 6  Final technical controls                                 validated
Phase 7  Review + branch-aware edit return                        active
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

- Headshot suppresses Pose and clears stale Pose answers;
- Create skips transform-only Final controls;
- Transform includes Reference Fidelity and Transformation Strength;
- Review edits resolve only newly relevant branch dependencies.

### Living Sentence

Creative sentence content remains derived presentation state. Technical Final controls remain outside it.

---

## 8. Regression protection

Primary Wizard command:

```text
pnpm test:wizard
```

Historical pre-migration baseline was 46/46. That count is historical only; focused Living tests are added as phases land.

Coverage now includes:

- adaptive People / Look / Composition / Scene / Final progress;
- Headshot excludes Pose and invalidates stale Pose answers;
- shared and per-subject Expression/Hair/Outfit/Pose behavior;
- environment refinement persistence and canonical Background mapping;
- mode-specific Final flow and canonical Aspect Ratio mapping;
- Review exact-target edit navigation;
- Review Headshot → body Pose dependency;
- Review Create ↔ Transform dependency/invalidation behavior;
- Review One → Multiple configuration dependency;
- Review Scene contextual confirmation;
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
