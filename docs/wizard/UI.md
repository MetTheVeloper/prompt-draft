# Wizard UI Architecture

Status: **Accepted UI architecture baseline**

Working branch: `feature/wizard`

Parent architecture source of truth: [`README.md`](./README.md)

Operational checkpoint: [`STATUS.md`](./STATUS.md)

This document is the **source of truth for Wizard presentation, routing, and host-integration decisions**. It complements the core Wizard architecture in `README.md` and should be updated only when an accepted UI/routing invariant changes.

---

## 1. UI product principle

The Wizard is not a reduced copy of the Expert UI.

The two surfaces share the same canonical Draft/domain/Actions foundation, but serve different interaction goals:

```text
Expert UI = power, detail, direct control
Wizard UI = guidance, clarity, intent-driven decisions
```

The Wizard should feel like a focused creative flow where the user communicates what they want and the system translates that intent into canonical Prompt Draft state.

The Wizard must not expose module implementation vocabulary merely because the Expert UI does.

---

## 2. Reuse boundary

Wizard UI should reuse the project's existing design-system primitives and genuinely reusable pickers/components where they fit.

Examples of expected reuse include primitives such as:

- `el-flex`;
- `el-grid`;
- `el-text`;
- `el-button`;
- `el-text-field`;
- existing modal/picker infrastructure where semantically appropriate.

The Wizard should **not** embed or reuse the complete Expert UI domain panels such as Hair, Outfit, Pose, Lighting, Framing, etc. merely to avoid writing presentation code.

Canonical boundary:

```text
Shared design primitives / reusable pickers   ✅
Expert workflow/domain panels                 ❌
Canonical domain + Actions behavior           ✅
Duplicated Wizard-side domain mutation        ❌
```

---

## 3. Presentation model

The first Wizard UI should use a reusable shell around the already accepted data-driven Definition and Session models.

Conceptually:

```text
Wizard Route
   ↓
Wizard Registry entry
   ↓
Wizard Definition + adapters
   ↓
Wizard Shell
   ├── Header / progress
   ├── current Step
   ├── Question renderer
   ├── Review renderer
   └── Back / Next / Finish / Cancel
```

A Step should behave like a focused page or decision group rather than an Expert-style collapsible settings panel.

The UI should show only the questions relevant to the current step and current `visibleWhen` state.

---

## 4. Generic question rendering

Portrait must not become a Vue component containing question-ID-specific rendering branches.

Use a generic Question Renderer driven by `question.type`.

Initial mapping for the currently implemented definition types:

```text
singleChoice   → Wizard choice/card group
text           → Wizard text question
variablePicker → Wizard variable/subject picker
```

Only add new renderer types when a real Wizard definition requires them.

Wizard-specific semantic behavior belongs in Definition/rules/review/completion adapters, not in a collection of `if question.id === ...` branches inside the generic renderer.

---

## 5. Choice interaction

For small intent-oriented option sets, prefer visible cards/tiles/segments over dropdowns.

Examples include Portrait intent, Expression, Hair direction, Outfit direction, Framing, Environment, and Lighting.

Desktop may present choices in a responsive grid; mobile should naturally collapse to fewer columns or one item per row.

Options may display:

- label;
- short user-facing description when useful;
- selected/default state.

Do not expose Action IDs, module keys, preset IDs, field IDs, or other implementation identifiers in option presentation.

---

## 6. Conditional questions

Conditional questions should appear naturally inside the current step when their accepted Definition conditions become true.

Example:

```text
Environment = Outdoor
   ↓
show: Outdoor setting
```

The first UI should consume the existing `visibleWhen`/Session behavior rather than creating a second visibility engine in Vue.

Conditional follow-up fields should not require separate routes or hardcoded page transitions unless a future real Wizard proves that necessary.

---

## 7. Navigation and progress

The Wizard shell owns predictable Back / Next behavior, while actual step ordering/visibility remains Definition + Session driven.

Preferred presentation:

- Wizard title;
- current step title/description;
- lightweight progress indication;
- Back and Continue actions in a predictable footer;
- Finish action on Review;
- explicit Cancel/close path.

Avoid an enterprise-style complex stepper unless real UX testing proves it useful. A simple progress indicator plus current step context is preferred initially.

On mobile, navigation controls may be sticky so the user does not need to search for Continue after long content.

---

## 8. Review presentation

Review is not another editable Expert form.

The UI should render the already accepted structured semantic Review model produced by `buildPortraitWizardReview(...)`.

Review should present user-facing decisions grouped by their semantic steps, for example:

```text
Subject
Portrait intent
Appearance
Composition
Environment
Lighting
```

Where useful, each group may offer an Edit action that returns the Session to the corresponding Wizard step.

Review must not expose mapper implementation details.

---

## 9. Completion presentation

Finish invokes the already accepted `completePortraitWizard(...)` pipeline.

Conceptual flow:

```text
Finish
  ↓
completePortraitWizard(...)
  ↓
map → validate → compile
  ↓
Success: finalDraft + compiled output
Failure: Wizard-facing issue state
```

The UI should distinguish completing/loading, success, validation failure, mapping/action failure, and other recoverable issue states where practical.

Raw internal codes should not be the primary user-facing message when a Wizard-context explanation or navigation target can be provided.

---

## 10. Host ownership

Wizard UI/session code must not directly own Create-page persistence or overwrite the Active Draft during the guided flow.

On successful completion only:

```text
Wizard finalDraft
   ↓
Host/Create-page adapter
   ↓
Active Draft replacement/persistence
   ↓
Expert UI
```

Canceling or abandoning the Wizard changes nothing outside the isolated Wizard Session.

The exact Create-page adapter should be implemented against the real current persistence/session ownership rather than introducing a parallel Draft store.

---

## 11. Routing model

Use one shared dynamic Wizard page rather than one page implementation per Wizard.

Preferred Nuxt route:

```text
/wizard/[wizardId]
```

Examples:

```text
/wizard/portrait
/wizard/anime
/wizard/product
/wizard/comic
```

The route exists to identify and initialize the requested Wizard. It should not contain goal-specific mutation/business logic.

Conceptually:

```text
route.params.wizardId
   ↓
Wizard Registry
   ↓
Wizard runtime entry
   ├── definition
   ├── review adapter
   └── completion adapter
   ↓
shared Wizard Shell / renderer
```

This avoids creating wrapper pages such as `portrait.vue`, `anime.vue`, etc. for every Wizard and keeps route-layer duplication close to zero.

---

## 12. Wizard Registry

Introduce the smallest registry required to resolve a route ID to a supported Wizard runtime entry.

Conceptual shape only:

```ts
{
  id: "portrait",
  definition: portraitWizardV1Definition,
  buildReview: buildPortraitWizardReview,
  complete: completePortraitWizard,
}
```

The exact TypeScript contract should be extracted from the real Portrait UI implementation rather than generalized in advance.

The Registry answers which Wizard implementation a route represents; it is not a universal plugin/DSL system.

Unknown `wizardId` values should fail gracefully instead of silently initializing another Wizard.

---

## 13. Static generation / deployment

The application is built and deployed statically with `pnpm generate`.

Using a dynamic Nuxt route does **not** mean Wizard pages require runtime server rendering. Supported Wizard URLs should be prerendered as static routes during generation.

The build should deterministically expose all registered public Wizard URLs required for static deployment, for example:

```text
/wizard/portrait
/wizard/anime
...
```

Do not rely solely on accidental crawler discovery for essential Wizard entry points. The implementation should keep the list of prerendered Wizard routes aligned with the supported Wizard Registry using the smallest maintainable mechanism available in the current Nuxt configuration.

A future `/wizard` catalog page may list available Wizards, but it is not required for the first Portrait UI unless useful to the product flow.

---

## 14. Initial component direction

Likely reusable presentation components, subject to refinement while implementing Portrait:

```text
app/components/wizard/
  WizardShell.vue
  WizardHeader.vue
  WizardProgress.vue
  WizardStep.vue
  WizardQuestionRenderer.vue
  WizardChoiceGroup.vue
  WizardTextQuestion.vue
  WizardVariableQuestion.vue
  WizardReview.vue
  WizardFooter.vue
```

Portrait-specific UI components should be added only where the generic semantic models genuinely cannot express the required presentation.

Do not freeze this exact file list as a public contract. The accepted invariant is the separation of shared Wizard presentation from goal-specific semantic adapters.

---

## 15. First Portrait UI acceptance criteria

The first real Portrait Wizard presentation should demonstrate:

1. `/wizard/portrait` resolves through the shared Wizard routing/registry model;
2. the page renders the accepted Portrait Definition without duplicating question semantics;
3. `singleChoice`, `text`, and `variablePicker` work through reusable renderers;
4. Back/Next and conditional questions consume the existing Session behavior;
5. Review renders the accepted semantic Review model;
6. Finish consumes `completePortraitWizard(...)`;
7. Active Draft remains untouched before successful Finish;
8. successful `finalDraft` is handed to the existing host/Create-page ownership boundary;
9. Cancel leaves the original Active Draft unchanged;
10. the generated deployment includes the supported Wizard route as static output;
11. no Expert domain panel is embedded merely to implement Wizard UI;
12. no new parallel domain mutation path is introduced.

---

## 16. Deferred UI concerns

Do not implement until a concrete Wizard/product requirement justifies them:

- universal theme/layout DSL for Wizards;
- per-question arbitrary rendering scripts;
- generalized nested/repeatable UI engine;
- complex visual stepper/navigation framework;
- in-progress Wizard persistence;
- AI-generated UI/flows;
- one Vue page per Wizard when the shared route/registry model is sufficient;
- broad Expert UI component refactor purely for Wizard reuse.

---

## 17. Update rule

Update this document when an accepted decision changes around:

- Wizard vs Expert presentation boundaries;
- generic renderer/component responsibilities;
- Review or completion presentation semantics;
- routing/registry structure;
- static-generation strategy;
- host/Create-page ownership;
- reusable UI architecture proven by implemented Wizards.

Use `STATUS.md` for temporary implementation progress and current test checkpoints rather than turning this document into a development diary.
