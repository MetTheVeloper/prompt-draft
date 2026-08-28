# Wizard Development Status

Last updated: **2026-08-28**

Status: **Portrait v2 rewrite implemented; local automated/build validation pending**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Wizard UI architecture source of truth: [`UI.md`](./UI.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

The first Portrait UI proved the route/registry/completion integration, then manual UX testing exposed the need for a different product model. The accepted rewrite is now implemented around the architecture recorded in [`UI.md`](./UI.md).

The standard Wizard flow no longer depends on a Create-page Active Draft:

```text
/wizard/portrait
  ↓
Create or restore independent Wizard Session
  ↓
fresh isolated Working Draft
  ↓
Stage → Step → Question flow
  ↓
Wizard-owned Subjects / semantic answers
  ↓
canonical Actions mapping
  ↓
prompt.validate
  ↓
prompt.compile
  ↓
completed finalDraft
```

A completed Wizard does **not** mutate Create automatically. Only the explicit user action **Continue editing in Create** appends the completed result as a **new Create Draft** and makes that new Draft active.

This checkpoint is implemented in source but has not yet been accepted by local `pnpm test:wizard`, `pnpm generate`, and browser testing after the rewrite.

---

## Portrait v2 definition

The runtime Registry now resolves Portrait to `portraitWizardV2Definition`.

The accepted v1 definition remains in source for regression coverage of the previously accepted backend behavior.

Portrait v2 uses the lightweight model:

```text
Stage = high-level UX orientation / progress
Step = flat execution + navigation unit
Question = answer unit
```

Stages:

```text
Start
Subjects
Portrait
Appearance
Composition
Scene
Final settings
Review
```

Current Steps remain a flat ordered list and reference their parent Stage through `stageId`. No nested flow tree or general workflow DSL was introduced.

---

## Start Stage

The first Step asks for both high-level inputs agreed in the UI architecture:

- optional Idea;
- starting point:
  - Start from an image;
  - Start from a description.

Semantic Wizard values map to canonical Setup values only during mapping:

```text
from_image       → image_to_image
from_description → text_to_image
```

Idea does not control Wizard branching.

If Idea is empty, Portrait v2 derives a deterministic fallback near finalization using Wizard-owned Subject tokens and Portrait intent, for example:

```text
Create a professional portrait featuring {sarah_Connor}
```

or for image-to-image:

```text
Transform {sarah_Connor} into a professional portrait
```

---

## Wizard-owned Subjects

The previous Subject-variable picker is no longer the Portrait v2 entry flow.

Implemented semantic entity foundation:

```text
WizardEntityAnswer
  id     = stable internal identity
  kind   = semantic entity kind
  label  = user-facing name
  key    = canonical variable key
```

Portrait currently allows Person entities, starts with one Person, and allows adding up to four people through visible entity cards.

The name is optional. If omitted, the UI uses the semantic fallback `Person` rather than `Subject 1`.

Entity labels and canonical variable keys are intentionally separate. Renaming preserves the entity ID while recalculating a canonical unique key.

At completion/mapping time, Portrait v2 creates its Subject variables through the existing public `variable.create` Action. There is no Wizard-side direct Variables-module mutation.

For the current first v2 checkpoint, Appearance/Pose shared choices target all Portrait Subjects. Per-subject customization through Named Configurations is the next domain expansion after this baseline is validated.

---

## Independent Wizard persistence / resume

Implemented in:

- `app/wizard/sessionPersistence.ts`.

Storage key:

```text
prompt-draft:wizard:sessions:v1
```

Unfinished Wizard sessions persist independently from Create Drafts.

The session persists:

- Wizard ID/version;
- current Step;
- answers;
- derived state;
- isolated Working Draft.

Opening the Wizard with a compatible unfinished session shows a resume choice:

```text
Continue previous Wizard
or
Start over
```

The persisted unit is `currentStepId`; Stage is derived from the Step definition and is not separately persisted.

---

## Stage progress / shell rewrite

The old raw percentage UI has been replaced by Stage-level progress.

Desktop presents the high-level Stage sequence with completed/current/pending states.

Mobile presents:

```text
Current Stage
x of y
progress line
```

The rebuilt shell separates:

```text
Header
  Exit · Wizard identity/save state · Start over
  Stage progress

Scrollable centered Stage content

Footer
  Back · Continue/Create prompt
```

Core work remains on the page surface rather than being moved into modals.

---

## Question presentation

Current renderer types are:

- `singleChoice`;
- `text`;
- `entityCollection`;
- legacy-compatible `variablePicker`.

`entityCollection` is the new semantic Subject-building primitive.

Choice rendering now uses only valid project button modes. The previous invalid selected state (`solid`) was removed; selected choice cards use the supported normal mode and unselected cards use outline mode.

Text questions disable Expert text-field actions by default inside the Wizard.

---

## Final settings

Portrait v2 moves technical Setup choices toward the end of the flow.

Current first-pass controls:

- Aspect Ratio;
- reference usage for image-to-image;
- transformation strength for image-to-image.

Wizard-friendly Aspect Ratio values are mapped to canonical Setup IDs during mapping, for example:

```text
1:1  → common_square
4:5  → common_portrait_4_5
3:4  → common_portrait_3_4
9:16 → common_vertical_9_16
16:9 → common_widescreen_16_9
```

Reference-only questions are hidden for text-to-image.

The fuller preserve-control UX discussed in [`UI.md`](./UI.md) remains a follow-up after this rewrite baseline is accepted.

---

## Review

Portrait Review remains semantic and renderer-neutral.

The UI now groups review rows by Stage rather than exposing raw implementation/module organization.

Portrait v2 Review includes:

- Idea, including deterministic fallback when the user left it blank;
- starting point;
- Subjects;
- Portrait/Appearance/Composition/Scene choices;
- Final settings.

Image-reference-only settings are omitted from Review when the selected mode is text-to-image.

Edit currently jumps back to the corresponding Step. A dedicated edit-return-to-Review shortcut can be added after baseline browser acceptance if it proves useful.

---

## Completion and Create handoff

The accepted completion pipeline is unchanged in principle:

```text
answers / rules
  ↓
canonical mapping
  ↓
prompt.validate
  ↓
prompt.compile
  ↓
finalDraft
```

Portrait v2 adds canonical Subject creation and Setup mapping before the existing domain mapping.

After successful completion the Wizard shows a result state. Create remains unchanged until the user explicitly chooses:

```text
Continue editing in Create
```

That handoff appends a new Draft record to the existing Create collection and selects it. Existing Create Drafts are not overwritten.

Exit, abandonment, refresh, and Start over never mutate Create Draft state.

---

## Regression strategy

The accepted Portrait v1 backend definition and tests are intentionally retained while Portrait v2 becomes the product/runtime definition.

New coverage has been added for:

- Stage validation and Stage references;
- Portrait v2 definition shape;
- fresh independent Wizard Session creation;
- current Stage derivation from current Step;
- Wizard-owned Subject identity;
- deterministic v2 Idea fallback;
- friendly → canonical Aspect Ratio mapping;
- canonical `variable.create` Subject creation in the isolated Working Draft;
- semantic assignment identity targeting the created Subject.

`package.json` now includes `scripts/wizard-portrait-v2.test.ts` in `pnpm test:wizard`.

**These new tests have not yet been run on the user's local checkout.** The previous accepted gate before this rewrite was **23/23**.

---

## Static generation baseline

Before the v2 rewrite, `pnpm generate` completed successfully and explicitly prerendered:

```text
/wizard/portrait
```

The route and public prerender registration remain shared/dynamic. Generation must be rerun after this rewrite before acceptance.

---

## Still to validate manually

After automated tests/build pass, verify in the browser:

1. `/wizard/portrait` works even when Create has no Drafts;
2. Start shows optional Idea + image/description starting point;
3. Subjects starts with one Person and does not open a Variable Picker;
4. Subject name is optional and readable fallback naming works;
5. adding/removing a second Person works;
6. refresh or leaving mid-flow offers Resume on return;
7. Stage progress stays high-level while Scene contains multiple Steps;
8. conditional Pose/Environment questions still behave correctly;
9. text-to-image hides reference-only Final Settings;
10. Review is grouped by Stage;
11. successful Finish does not change Create;
12. Continue editing in Create creates a new Draft instead of overwriting an existing Draft;
13. Exit leaves Create unchanged;
14. desktop/mobile shell layout is usable and visually coherent.

---

## Next expansions after baseline acceptance

Do not mix these into the first rewrite validation unless a blocking issue requires them:

- shared vs per-Subject Appearance strategy;
- per-Subject Outfit/Hair/Pose via existing Named Configuration/assignment capabilities;
- additional entity kinds for other Wizard definitions;
- fuller image-to-image preserve controls in Final Settings;
- edit-from-Review return behavior;
- optional persistence of the completed result screen across refresh;
- localization/copy pass for Wizard v2;
- additional Wizard definitions.

---

## Explicitly deferred

Do not implement without a real requirement:

- universal Wizard DSL;
- arbitrary rule scripting/expression language;
- generalized nested/repeatable flow tree;
- Actions batch/transaction/dry-run;
- AI-generated Wizard definitions/UI;
- broad Expert UI rewrite;
- Wizard-specific compiler/validator;
- direct arbitrary Draft/path mutation;
- one Vue page per Wizard while the shared route/registry model remains sufficient.

---

## Immediate next step

Pull the current `feature/wizard` rewrite and run the focused Wizard regression gate. Fix any TypeScript/runtime regressions before production generation or manual UX acceptance.

---

## Documentation discipline

- [`README.md`](./README.md) remains the core Wizard architectural source of truth.
- [`UI.md`](./UI.md) is the accepted source of truth for Wizard UX, Stage/Step presentation, independent session ownership, routing, static generation, and Create handoff.
- This file is the operational checkpoint for resuming implementation/testing.
- `docs/actions-api/STATUS.md` remains the operational source for the accepted Actions surface.
- Update this file after each meaningful validated checkpoint.
