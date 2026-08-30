# Wizard UI Architecture

Status: **Accepted current Portrait UX baseline**

Working branch: `feature/wizard`

Parent architecture source of truth: [`README.md`](./README.md)

Operational checkpoint: [`STATUS.md`](./STATUS.md)

This document is the source of truth for Wizard presentation, flow structure, session ownership, routing, persistence, and Create handoff UX.

---

## 1. Product principle

The Wizard is not a reduced copy of Expert UI.

```text
Expert UI = power, detail, direct control
Wizard UI = guidance, clarity, intent-driven decisions
```

Wizard questions should describe user intent, not Prompt Draft implementation vocabulary.

Do not expose module keys, Action IDs, variable IDs, assignment records, named configurations, or schema field IDs merely because the Expert UI uses them internally.

---

## 2. Independent authoring surface

Starting a Wizard must not depend on the current `/create` Active Draft.

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

Completion does not overwrite Create.

Only explicit:

```text
Continue editing in Create
```

creates a **new** Create Draft from `finalDraft`.

---

## 3. Session and persistence

Persist one active resumable session per Wizard ID.

Storage key:

```text
prompt-draft:wizard:sessions:v1
```

Persist execution by stable `currentStepId` plus answers/derived state/Working Draft.

Current Stage is derived from the Step.

Resume UX may offer:

```text
Continue
Start over
```

---

## 4. Flow vocabulary

Use:

```text
Stage
  ↓
Step
  ↓
Question
```

Stages group Steps for progress and Review.

Steps remain a flat ordered executable sequence.

Do not introduce nested workflow trees or arbitrary graphs.

Current Portrait Stages:

```text
Start
Subjects
Portrait
Appearance
Composition
Scene
Final
Review
```

---

## 5. Navigation and progress

Progress is primarily Stage-level, not a fragile raw Step percentage.

Desktop may show the Stage sequence. Mobile may show current Stage + compact progress.

Footer should stay predictable:

```text
Back                                  Continue
```

Review uses the appropriate completion action.

Wizard-level exit belongs in the header/shell, not as a Step answer.

---

## 6. Reuse boundary

Reuse design-system primitives and global modal/menu infrastructure where appropriate.

Expected reusable primitives include:

- `el-flex`;
- `el-grid`;
- `el-text`;
- `el-button`;
- `el-text-field`;
- `el-dropdown`;
- global modal/menu infrastructure.

Do not embed full Expert domain panels inside the Wizard merely to expose all options.

Canonical boundary:

```text
Design primitives / infrastructure   ✅
Canonical domain + Actions           ✅
Expert workflow panels               ❌
Wizard-side duplicate domain logic   ❌
```

---

## 7. Choice interaction

For small intent-oriented sets, visible cards/segments are preferred over dropdowns.

Examples:

- starting point;
- Portrait intent;
- Expression/Hair/Outfit direction;
- Framing;
- Pose direction;
- Environment;
- Lighting;
- Aspect Ratio.

Dropdowns are appropriate for compact structured selectors inside entity cards, such as Subject Definition.

---

## 8. Start Stage

Current Portrait Start asks only:

```text
Start from an image
Start from a description
```

It does **not** ask for Idea.

Internal mapping:

```text
Start from an image       → image_to_image
Start from a description → text_to_image
```

Idea is generated later, after enough semantic context exists.

---

## 9. Subjects Stage

Subjects are constructed by the Wizard; the user does not need to manage Prompt Variables directly.

Current Portrait supports one to four Person Subjects.

Each Subject card separates:

```text
optional name
+
Subject Definition
```

The optional name is for readability/variable naming. It does not define what the Subject is.

### 9.1 Unnamed Subjects

A single unnamed Person may display `Person`.

Multiple unnamed Persons display indexed labels:

```text
Person 1
Person 2
Person 3
```

Canonical variable keys remain separately normalized/unique, e.g. `{person}`, `{person_2}`.

### 9.2 Image-to-image Subject Definition

Current selector options:

```text
By position in reference
Male person in reference
Female person in reference
Custom reference description
```

Examples:

```text
{met} = male person in {reference}
{zahra} = female person in {reference}
```

If Custom is selected, show a required description input in the same card.

Example:

```text
woman with a short black bob and pearl choker
```

maps to:

```text
woman with a short black bob and pearl choker in {reference}
```

### 9.3 Text-to-image Subject Definition

Current selector options:

```text
Person
Man
Woman
Boy
Girl
Custom subject
```

Examples:

```text
Man   → an adult man
Woman → an adult woman
Custom → exact user description
```

Custom may describe a non-human portrait subject when useful, even though Portrait currently exposes Person as the primary entity kind.

### 9.4 Why semantic definitions matter

Do not rely universally on attachment sequence such as `first person` / `second person`.

Sequence remains a fallback option, but semantic identification is safer when upload completion/order is unstable or when the user can identify people more explicitly.

---

## 10. Subject cards

Prefer direct cards over a separate mechanical subject-count page.

Conceptual card:

```text
Person 1

Name this subject
[ Optional — Person ]

Identify this subject
[ Female person in reference ▼ ]

[ Custom description — conditional ]
```

Add/remove Subjects directly in the Stage.

Do not expose Variable Blueprint terminology.

---

## 11. Shared + per-subject UX

For targetable domains, accepted UX is:

```text
Shared setting
  ↓
Customize per subject   (only when >1 Subject)
```

The user sees Subject labels and intent choices, not assignment/configuration internals.

Current Portrait domains using this pattern:

- Expression;
- Hair;
- Outfit;
- Pose.

The generic per-subject modal supports two forms:

1. intent + optional detail fields (Expression/Hair/Outfit);
2. intent-only override (Pose currently).

A Subject starts as `Shared`. Choosing `Customize` clones/inherits the shared semantic state, then the user changes only what should differ.

`Use shared` removes that Subject override.

---

## 12. Appearance Stage

Expression, Hair, and Outfit each use:

```text
Quick direction
+
More Options
+
Customize per subject (when multiple Subjects)
```

Expression details:

- intensity;
- eyes;
- brows;
- mouth.

Hair details:

- length;
- texture/curl pattern;
- volume;
- parting.

Outfit details:

- fit;
- accessories;
- additional details.

Keep-reference Outfit/Hair semantics must not silently toggle Setup Preserve flags.

---

## 13. Composition Stage

Framing remains shared for the portrait composition.

Current choices:

```text
Headshot
Head and shoulders
Half body
Full body
```

Pose quick choices:

```text
Natural
Formal
Dynamic
```

For multiple Subjects and non-Headshot framing, show:

```text
Customize pose per subject
```

Current Pose override is intent-only; it does not invent a fake More Options form.

Headshot suppresses Pose controls.

---

## 14. Scene Stage

Environment uses quick intent + relevant conditional text.

Background More Options is a secondary modal and currently includes:

- setting;
- spatial structure;
- background material;
- detail density;
- one key background element.

Lighting remains one shared scene-level choice.

Current Lighting choices:

```text
Soft
Dramatic
Moody
Clean
```

Do not add per-subject Lighting.

---

## 15. Final Stage and Idea

Final Settings appears after creative intent is established.

Current controls:

- generated/editable Idea;
- Aspect Ratio;
- Reference Usage for image-to-image;
- Transformation Strength for image-to-image.

Generated Idea is descriptive, not a hidden rule engine.

Example multi-subject output:

```text
A cinematic portrait of {met} and {zahra} together, with the following settings
```

The explicit `together` wording is important for co-presence.

If the user edits Idea, it becomes user-owned and later defaults must not overwrite it.

---

## 16. Review

Review is semantic and Stage-grouped, not an Expert form.

It should display user-facing labels and customized Subject names.

For subjectOverrides, Review should indicate which Subjects are customized without exposing assignment IDs.

Edit actions navigate to the relevant Step and support returning to Review.

---

## 17. Completion

Finish uses the accepted canonical pipeline:

```text
Wizard mapping
  ↓
prompt.validate
  ↓
prompt.compile
  ↓
Success: finalDraft + compiled output
```

Failure states should be translated into Wizard-facing context where practical.

After success, available product actions may include:

- copy/use result;
- Save as Template;
- Continue editing in Create as a NEW Draft.

---

## 18. Routing

Use one shared dynamic page:

```text
/wizard/[wizardId]
```

The route resolves a Wizard runtime/registry entry. Goal-specific mutation logic belongs in Wizard semantic/domain adapters, not in route branching.

---

## 19. Runtime/dev UX discipline

The Wizard UI should not depend on undeclared transitive packages.

`useScreen` is used across responsive UI and directly imports `@vueuse/core`; that package is an explicit project dependency.

Local development cleanup may unregister stale Prompt Draft Service Workers/caches so offline runtime state does not break Nuxt dev assets.

---

## 20. Current UI validation target

Next manual UX check is per-subject Pose:

```text
2 Subjects
Half body / Full body
Shared Pose: Natural
Subject 1: Shared
Subject 2: Dynamic
```

Validate:

- Customize Pose button only appears when relevant;
- Subject labels are clear;
- Shared/Custom state is understandable;
- Apply persists correctly;
- Review reflects customized Pose Subject;
- Expert UI receives correct separate Pose assignments.
