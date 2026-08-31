# Wizard UI Architecture

Status: **Living Sentence / Figma Make direction accepted; current Nuxt Wizard UI is a functional baseline pending redesign implementation**

Working branch: `feature/wizard`

Parent architecture source of truth: [`README.md`](./README.md)

Operational checkpoint: [`STATUS.md`](./STATUS.md)

This document is the source of truth for Wizard presentation, interaction model, flow pacing, routing/persistence UX, and the accepted Living Sentence redesign.

---

## 1. Core product principle

The Wizard is not a reduced copy of Expert UI and must not feel like a conventional SaaS wizard.

```text
Expert UI = power, detail, direct control
Wizard UI = guided creative intent, clarity, momentum
```

The accepted signature interaction is **Living Sentence**:

> The user gradually shapes a natural-language creative intention. Important choices become part of an evolving sentence that remains visually present, intelligently recomposes itself, and can later be edited by interacting with its semantic tokens.

The user should feel like they are **creating a thought**, not completing a questionnaire.

Do not expose module keys, Action IDs, variable IDs, assignment records, configuration IDs, schema field IDs, or other internal system vocabulary merely because Expert UI uses them.

---

## 2. Figma Make reference

Accepted prototype:

```text
https://www.figma.com/make/jgi1MxTu7e16Dv7AFiRof2/Review-Instructions
```

The Make prototype is a functional React/Vite/Tailwind implementation containing a state engine, Living Sentence component, branching, review/edit behavior, scene refinement, and final prompt-ready state.

It is **not production source code**.

Production implementation remains Nuxt/Vue and should combine:

```text
Figma visual + interaction intent
        +
existing Prompt Draft Wizard/domain logic
        ↓
production implementation
```

Do not port React code mechanically. Inspect it for behavior, pacing, composition, and interaction patterns, then implement those intentionally in the existing project architecture.

---

## 3. Visual stance

Target feel:

- dark;
- editorial;
- cinematic;
- typography-first;
- immersive;
- premium creative-tool oriented;
- generous negative space;
- controlled asymmetry;
- sophisticated but purposeful motion.

Typography carries most of the interface. Ambient graphics/light should support state and intent rather than become decoration for its own sake.

The Figma prototype currently uses a display serif + humanist sans + mono metadata language. Exact production fonts/tokens should be reconciled with Prompt Draft's existing design system during implementation rather than copied blindly.

---

## 4. Anti-patterns

The redesigned Wizard must avoid drifting back toward:

- numbered step circles;
- traditional progress bars;
- radio/checkbox layouts for primary intent;
- stacks of rounded option cards;
- generic onboarding screens;
- repeated `Continue` buttons after simple choices;
- long control-heavy pages;
- exposed advanced options by default;
- permanently exposed per-subject controls;
- large generic success modals;
- three equally weighted completion CTAs;
- dashboard/form visual language.

Whenever possible:

```text
CHOOSING AN ANSWER = MOVING FORWARD
```

A separate Continue action is only justified when the state contains free text, multiple edits, or refinement that genuinely requires confirmation.

---

## 5. Living Sentence behavior

The sentence is not a concatenated answer log.

It should intelligently recompose into natural English as semantic state changes.

Example progression:

```text
I want to...

I want to transform my image...

I want to transform my image into a cinematic portrait...

I want to transform my image into a cinematic half-body portrait of two people...
```

The exact order of the final sentence may differ from the chronological order in which choices were made.

Important tokens should retain semantic ownership so they can navigate back to their corresponding state at Review or other suitable moments.

Technical metadata such as Aspect Ratio, Reference Fidelity, and Transformation Strength should not be forced into the creative sentence.

---

## 6. Motion semantics

Motion should communicate meaning.

When a primary answer is selected:

1. selected text/phrase gains focus;
2. alternatives recede/fade;
3. the chosen phrase resolves or visually relates to the Living Sentence;
4. the next question/state emerges without a harsh page cut.

Useful techniques include:

- typography morph/reflow;
- opacity;
- restrained translation;
- scale;
- blur;
- spatial expansion/contraction;
- ambient light changes;
- camera-distance metaphors;
- smooth sentence re-layout.

Avoid gratuitous animation. Motion must preserve responsiveness, accessibility, and `prefers-reduced-motion` support.

---

## 7. Progressive disclosure

Core rule:

```text
Simple intentions stay simple.
Complexity reveals only when needed.
```

Primary flow asks for intent.

Refinement asks for specification.

Advanced controls should appear as optional secondary layers, not permanent clutter.

For multi-subject domains:

```text
shared intent first
  ↓
optional “change it for someone”
  ↓
choose subject
  ↓
subject-specific override
```

Do not show all per-subject rows by default.

---

## 8. Component-system boundary

Use the existing Prompt Draft design system as the foundation, but introduce a Wizard-specific interaction layer where needed.

Reuse shared foundations for:

- design tokens;
- spacing;
- typography foundations where compatible;
- accessibility/focus behavior;
- text inputs;
- modal/drawer infrastructure where appropriate;
- responsive primitives;
- generic low-level layout primitives.

Create dedicated Wizard components for concepts such as:

- `LivingSentence`;
- sentence tokens/edit links;
- cinematic Wizard shell;
- typographic choice/gateway primitive;
- ambient state feedback;
- proportion-frame selector;
- Wizard-specific transition primitives;
- environment refinement palette.

If one of these later proves generally reusable, deliberately promote it into the shared component system.

Do not compromise the Figma interaction model merely to fit every state into an existing generic card/button component.

---

## 9. Session, routing, and persistence

Starting a Wizard remains independent from the current `/create` Active Draft.

```text
Open Wizard
  ↓
Create/restore Wizard Session
  ↓
Fresh isolated Working Draft
  ↓
Wizard answers + canonical Actions
  ↓
Completion
  ↓
finalDraft
```

Only an explicit final handoff creates a **new** Create Draft from `finalDraft`.

Persistence remains based on stable Wizard session state and `currentStepId`.

Route remains conceptually:

```text
/wizard/[wizardId]
```

The redesigned experience may visually feel continuous even though the runtime maintains discrete semantic Steps/micro-states.

---

## 10. Progress and navigation

Do not use a conventional stepper as the primary progress mechanism.

A subtle chapter indicator may exist, for example:

```text
BEGIN · PEOPLE · PORTRAIT · LOOK · COMPOSITION · SCENE · FINAL · REVIEW
```

It should read as editorial orientation, not a clickable enterprise workflow tracker.

Back/reset/exit remain available but visually secondary.

Primary choice states usually advance immediately on selection.

---

## 11. Portrait flow — State 00: Entry

Hero phrase:

```text
I want to...
```

Two large typographic gateways:

```text
TRANSFORM MY OWN IMAGE(S)
CREATE A PHOTO
```

These are competing full-view zones/phrases, not cards.

Hover/focus may shift spatial balance and ambient mood:

- Transform → source/reference/material feeling;
- Create → imagination/emergence feeling.

Selection advances directly.

---

## 12. State 01: People

Prompt:

```text
In the final image, I want to see...
```

Primary choices:

```text
ONE PERSON
MULTIPLE PEOPLE
```

### One person

Apply the sensible single-subject default silently and continue. Do not force configuration when nothing needs clarification.

### Multiple people

Reveal a small follow-up state:

```text
How many?
02 / 03 / 04
```

Large typographic numbers, not a form control.

#### Transform path

Default identification may use position-in-reference semantics, with optional refinement:

- Position in reference;
- Male person;
- Female person;
- Describe them myself.

Optional name remains secondary.

#### Create path

Conversational subject definition:

```text
PERSON 01 IS...
A PERSON / A MAN / A WOMAN / A BOY / A GIRL / SOMETHING ELSE
```

Repeat only as needed. Optional name remains secondary.

Avoid user-facing `Subject` jargon when natural language can communicate the intent.

---

## 13. Portrait direction

Sentence concept:

```text
I want to [transform/create] ... into a...
```

Choices:

- Professional portrait;
- Cinematic portrait;
- Fashion portrait;
- Fantasy portrait.

The raw selection should resolve into grammatical sentence phrasing such as `a cinematic portrait`.

---

## 14. Look chapter

Look is a sequence of lightweight micro-states, not one long form page.

### Expression

Single person:

```text
I want their expression to feel...
NATURAL / CONFIDENT / WARM / SERIOUS
```

Multiple:

```text
I want everyone’s expression to feel...
```

After shared choice, optionally expose:

```text
Change it for someone
```

Advanced/detail refinement stays secondary.

### Hair

```text
For their hair, I want...
KEEP REFERENCE / NATURAL / POLISHED / EDITORIAL
```

Multiple follows the same shared-first override pattern.

### Outfit

```text
For the outfit, I want...
KEEP REFERENCE / PROFESSIONAL / FASHION / FANTASY
```

Multiple follows the same shared-first override pattern.

Do not permanently expose advanced fields or all subject overrides.

---

## 15. Composition chapter

### Framing

Prompt:

```text
I want the portrait framed as...
```

Choices:

- Headshot;
- Head & Shoulders;
- Half Body;
- Full Body.

Prefer a crop/silhouette/camera-distance metaphor that changes meaningfully on hover/focus. Do not build a literal fake camera UI.

### Pose

If Framing is `Headshot`, skip Pose entirely.

Otherwise:

```text
I want the pose to feel...
NATURAL / FORMAL / DYNAMIC
```

For multiple people, use shared intent first and expose individual overrides only on request.

---

## 16. Scene chapter

Prompt:

```text
I want to place the portrait...
```

Choices:

```text
IN A STUDIO
OUTDOORS
IN AN ABSTRACT SPACE
```

Hover/focus should alter surrounding spatial/ambient feel rather than merely highlighting a button.

After selection, optional free-text micro-state:

- Studio → `Anything specific about the studio?`
- Outdoor → `Where outdoors?`
- Abstract → `What should the space feel like?`

A quiet Skip is appropriate.

### Environment refinement

Advanced refinement should be a palette/side-layer rather than a heavy settings modal.

Rephrase internal dimensions as human prompts:

```text
THE SETTING FEELS...
THE SPACE FEELS...
THE BACKDROP IS...
KEEP THE BACKGROUND...
INCLUDE...
```

Selections should update a small natural-language preview live.

Changes may save immediately; close/`Done refining` is preferable to a heavy `Apply options` interaction.

---

## 17. Lighting

Prompt:

```text
I want the lighting to feel...
```

Choices:

```text
SOFT / DRAMATIC / MOODY / CLEAN
```

Use ambient interface lighting as subtle preview feedback:

- Soft → diffuse;
- Dramatic → directional/high contrast;
- Moody → localized/deeper shadows;
- Clean → crisp/balanced.

No advanced Lighting panel is currently required.

---

## 18. Final touches

This chapter should feel like a restrained technical outro, not another creative form.

Small heading:

```text
One last thing...
```

### Aspect Ratio

Prompt:

```text
I want the final image in...
```

Choices:

- 1:1 Square;
- 4:5 Portrait;
- 3:4 Portrait;
- 9:16 Vertical;
- 16:9 Landscape.

Represent ratios with actual proportion frames rather than pills.

Aspect Ratio is technical metadata and should not be appended to the creative Living Sentence.

### Create path

After Aspect Ratio → Review.

### Transform path

Continue with two distinct concepts:

#### Reference Fidelity

```text
How much should the reference lead?
STAY CLOSE / KEEP A BALANCE / USE IT LOOSELY
```

#### Transformation Strength

```text
I want the transformation to be...
SUBTLE / BALANCED / STRONG / EXTREME
```

Do not collapse these into a confusing XY control.

Technical recap may read like:

```text
4:5 Portrait · Balanced reference · Strong transformation
```

The existing generated Idea textarea is intentionally not a major part of this redesigned final flow. A future Living Sentence → Idea mapping is deferred pending explicit validation.

---

## 19. Review

Review is the payoff, not a stack of cards.

Title:

```text
This is what you’ve built
```

Subcopy:

```text
Edit any part before generating the final prompt.
```

Main content is the polished final Living Sentence in large editorial multiline typography.

Example:

```text
You’re about to transform your image into a cinematic half-body portrait of two people,
with serious expressions, polished hair, fashion-forward outfits,
set in a studio with dramatic lighting.
```

Important semantic tokens should be hoverable/focusable/clickable and return to the corresponding micro-state.

Below the sentence, keep recap compact:

Creative:

- Mode;
- People;
- Portrait;
- Look;
- Composition;
- Scene.

Technical:

- Aspect Ratio;
- Reference Fidelity when Transform;
- Transformation Strength when Transform.

Primary CTA:

```text
GENERATE PROMPT
```

Avoid heavy cards and repeated large Edit controls.

---

## 20. Prompt Ready

Do not use the old generic success modal as the final experience.

Use a full-screen final scene representing the transformation:

```text
LIVING SENTENCE
      ↓
resolving / reorganizing
      ↓
FINAL PROMPT
```

Eyebrow:

```text
FROM IDEA TO PROMPT
```

Hero:

```text
Your prompt is ready.
```

Show a concise prompt artifact preview rather than a huge textarea.

Action hierarchy:

```text
Primary:   OPEN IN CREATE →
Secondary: Save as template
Tertiary:  Start another
```

If Save as Template needs a name, prefer an inline naming state over a heavy modal.

A subtle note may explain that the existing Create draft remains untouched until the user opens the generated prompt.

---

## 21. Responsive and accessibility requirements

Desktop-first visual drama must not become desktop-only usability.

Requirements:

- keyboard-focusable choices;
- strong visible focus states;
- semantic buttons/inputs under experimental visuals;
- reduced-motion fallback;
- readable sentence wrapping at narrow widths;
- options stack/reflow without becoming ordinary card lists;
- chapter/navigation remains understandable on mobile;
- touch targets remain practical even when text itself is the visible control.

---

## 22. Implementation strategy

Do not rewrite production logic just because the Figma prototype uses a different framework.

Implementation order after design is locked:

1. preserve existing domain/actions/session behavior;
2. establish Wizard-specific shell and Living Sentence primitives;
3. migrate Portrait states incrementally;
4. preserve/expand automated semantic regression tests;
5. add interaction/component tests where useful;
6. verify responsive/accessibility behavior;
7. run real end-to-end generation tests again.

Avoid large UI polish work on the current legacy Wizard before this migration.

---

## 23. Reuse across future Wizard use cases

Living Sentence is a reusable **experience pattern**, not a Portrait-specific sentence template.

Future use cases should reuse:

- continuous state transitions;
- sentence-token interaction;
- progressive disclosure;
- shared/override patterns where semantically relevant;
- creative-vs-technical separation;
- review/edit payoff;
- Wizard shell and motion primitives.

Each use case must define its own grammar and semantic sequence.

Examples could naturally produce different sentence structures for Product Photography, Architecture, or other future goals.

Do not hard-code Portrait grammar into the generic Living Sentence component.

---

## 24. Current design QA target

Before production implementation, audit the Figma prototype end-to-end through at least:

1. Transform → one person;
2. Transform → multiple people + overrides;
3. Create → one person;
4. Create → multiple people;
5. Headshot → verify Pose skip;
6. environment refinement;
7. Review token editing;
8. Prompt Ready.

Review each state for:

- natural sentence wording;
- pacing;
- whether any screen feels too SaaS-like;
- whether motion communicates state change;
- hierarchy/typography;
- branch correctness;
- unnecessary steps;
- responsive risks;
- accessibility risks.

Record findings as `KEEP / CHANGE / REMOVE / BUG / POLISH`, then perform a focused Figma refinement pass rather than scattered micro-edits.
