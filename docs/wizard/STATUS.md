# Wizard Development Status

Last updated: **2026-09-02**

Status: **Phases 0–7 are implemented and functionally validated on `feature/wizard-figma`; Phase 8 (Direction Ready / explicit Create handoff) is the active functional slice. UI polish is intentionally deferred until the functional flow is complete.**

Working branch: `feature/wizard-figma`

Architecture source of truth: [`README.md`](./README.md)

Wizard UX source: [`UI.md`](./UI.md)

Production implementation plan: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)

Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)

Actions contract: `prompt-draft.actions.v1`

---

## 1. Validated production checkpoint

Latest locally validated checkpoint before Phase 8:

```text
d2119923f0553bfcb9713b6efc8d05eb4bca9906
Phase 7 editorial Review + branch-aware edit return
```

Validation reported on **2026-09-02**:

```text
pnpm test:wizard  → green
pnpm build        → green
manual flow       → functionally okay
```

Implemented and functionally validated through this checkpoint:

- Phase 0 regression baseline;
- Phase 1 Living shell, chapter navigation, Living Sentence and typographic primitives;
- Phase 2 Entry / People / Subject configuration / Portrait;
- Phase 3 Expression / Hair / Outfit shared-first flow and optional per-subject customization;
- Prompt Draft theme-token integration and Wizard i18n conventions;
- Phase 4 Framing visual selector, top-anchored crop, Headshot → Pose skip, shared-first Pose details and per-subject Pose overrides;
- Phase 5 Studio / Outdoors / Abstract Living Scene flow, persistent canonical Background refinement and Lighting;
- Phase 6 Final technical controls with branch-aware Create/Transform flow and canonical seven-ratio support;
- Phase 7 editorial Review with clickable Living Sentence tokens and compact Creative/Technical recap;
- direct return to Review after simple edits;
- targeted dependency resolution for Headshot/body Pose, One/Multiple People and Create/Transform branch changes;
- Review edit context persisted in `session.derived`.

Canonical Portrait mapping, isolated Wizard session semantics, validation/compile and explicit Create handoff remain authoritative.

---

## 2. Active phase — Phase 8 Direction Ready / Create handoff

Target experience:

```text
Review
  ↓
GENERATE PROMPT
  ↓
canonical validate + compile
  ↓
Your direction is ready
  ↓
OPEN IN CREATE →
```

Requirements:

- replace the old generic completed-Draft card with the editorial Direction Ready scene;
- use the real canonical `prompt.compile` output as the concise prompt preview;
- keep the Living Sentence as the creative-direction preview;
- `OPEN IN CREATE →` is the primary CTA;
- Save as Template is secondary;
- Start Another is tertiary and aligned with the main content;
- provide a subtle Edit Direction route back to Review;
- successful completion must not clear the Wizard session before explicit handoff;
- returning to Review keeps the current direction available for editing;
- `OPEN IN CREATE` creates and selects a brand-new Create Draft;
- the pre-existing Create collection/draft is not overwritten;
- successful handoff or Start Another may clear/restart the Wizard session;
- all new visible copy uses Wizard i18n and all new styling uses Prompt Draft theme tokens.

Phase 8 implementation currently includes:

- `WizardDirectionReady.vue` full-view completion surface;
- canonical compiled prompt preview exposed through `WizardRuntimeCompletion`;
- completion keeps the Review session persisted until explicit handoff/restart;
- Edit Direction returns to Review;
- `hostDraft` handoff core extracted into a pure-testable helper without changing the public `addWizardDraftToCreate()` behavior;
- focused Direction Ready / handoff regressions wired into `pnpm test:wizard`.

Phase 8 is **not locally validated yet**. Validate before beginning UI polish.

---

## 3. Figma Make reference

Reference:

```text
https://www.figma.com/make/jgi1MxTu7e16Dv7AFiRof2/Review-Instructions
```

The Make file is a visual/interaction reference only. Production remains Nuxt/Vue and uses Prompt Draft theme/i18n/domain conventions.

Accepted completion behavior:

- full-screen final scene rather than the old generic success card;
- `Your direction is ready.` semantics;
- concise prompt artifact preview;
- `OPEN IN CREATE →` as the dominant action;
- Save as Template secondary;
- Start Another tertiary;
- subtle Edit Direction path;
- explicit note that Create remains untouched until handoff.

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

Implemented and functionally validated through explicit persisted edit context and targeted dependency resolution.

### Completion / handoff

Active Phase 8. Production uses the canonical compiled output for preview and keeps Create isolated until explicit handoff.

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
app/wizard/completion.ts
app/wizard/entities.ts
app/wizard/portraitSubjectOverrides.ts
app/wizard/portraitBackgroundOptions.ts
app/wizard/portraitPoseOptions.ts
app/wizard/hostDraft.ts
```

Living presentation helpers/components may own presentation micro-state, chapter progress, display wording, Review edit context, Living Sentence tokens and completion presentation. They must not become a second mapping/compiler engine.

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
Phase 7  Review + branch-aware edit return                        validated (functional)
Phase 8  Direction Ready / Create handoff                         active
Phase 9  responsive / accessibility / motion / requested UI fixes pending
Phase 10 final regressions / build / generate / real generation   pending
```

Current product direction: finish Phase 8 functionally, then collect and apply the user's UI fixes before final regression/merge readiness.

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

### Living Sentence / completion

- creative sentence content remains derived presentation state;
- technical Final controls remain outside it;
- compiled prompt preview comes from canonical `prompt.compile` output;
- Create remains untouched until explicit handoff.

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
- Review exact-target edit navigation and branch dependency resolution;
- canonical compiled completion preview;
- Create handoff creates/selects a new Draft without overwriting the existing collection;
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

Wizard completion produces a validated `finalDraft` and canonical compiled preview through the existing mapping/validate/compile path.

Create remains untouched until explicit handoff:

```text
Wizard direction ready
  ↓
OPEN IN CREATE
  ↓
create a NEW Create Draft
  ↓
select that new Draft in Create
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
7. after Phase 8 functional validation, prioritize the user's collected UI fixes before Phase 10 final validation.
