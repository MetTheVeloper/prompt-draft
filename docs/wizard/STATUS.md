# Wizard Development Status

Last updated: **2026-08-30**

Status: **Subject Definition accepted; Lighting gap fixed; per-subject Pose implemented; manual Pose validation next**

Working branch: `feature/wizard`

Development branch only: continue implementation/testing from `feature/wizard`, not `main`.

Architecture source of truth: [`README.md`](./README.md)

Wizard UX source: [`UI.md`](./UI.md)

Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)

Actions contract: `prompt-draft.actions.v1`

---

## 1. Current branch checkpoint

Latest code checkpoint before this documentation refresh:

```text
feature/wizard@bbf38a18597756c6280fac0c5bc4f5eb93fb8095
```

Important recent commits leading into this checkpoint include:

```text
ba4da32e5444f7e9ab663c2ada321cffcc53fddf
→ per-subject Pose / intent-only subject override review support

0034e455659e404b322a862737b102f9b0df1bb4
→ explicit useScreen import in variable-fab

bbf38a18597756c6280fac0c5bc4f5eb93fb8095
→ declare @vueuse/core explicitly in package.json
```

The latest documentation commits come after this checkpoint and do not change runtime behavior.

---

## 2. Immediate next-chat objective

Do **not** return to Template development.

Do **not** re-design Subject Definition again unless a concrete bug is found.

Immediate continuation:

1. confirm local project remains healthy after frozen install/dev startup;
2. manually test **Shared + per-subject Pose** with at least two Subjects;
3. inspect resulting Expert UI Pose assignments/targets;
4. inspect compiled prompt;
5. run a real image-generation test and judge whether the distinct Poses materially improve the result;
6. only then decide the next Wizard capability/gap.

Recommended first Pose test:

```text
2 Subjects
Framing: Half body or Full body
Shared Pose: Natural
Subject 1: Shared
Subject 2: Customize → Dynamic
```

Expected canonical result:

- Subject 1 remains targeted by the shared Natural Pose assignment;
- Subject 2 is removed from the shared target set;
- Subject 2 gets its own Dynamic/action-ready Pose assignment;
- compiled prompt names the two Subject targets separately.

---

## 3. Latest automated regression checkpoint

The user locally ran:

```text
pnpm test:wizard
```

Latest displayed result:

```text
46 tests
46 passed
0 failed
```

The suite now includes coverage for:

- Portrait Wizard definition/session/completion;
- Subject Definition semantics;
- unnamed Subject display/key uniqueness;
- image semantic Subject definitions;
- custom Subject descriptions;
- text-to-image Subject definitions;
- blank Custom rejection;
- backward compatibility for older Subject sessions;
- Environment/Lighting regression;
- shared/per-subject Expression/Hair/Outfit;
- shared/per-subject Pose.

Latest relevant passing test name:

```text
Portrait v2 splits shared Look and Pose settings into per-subject canonical assignments/configurations
```

---

## 4. Runtime/dev issue — resolved checkpoint

A local dev failure appeared after Create refreshed and remained on the boot loader.

Initial browser error:

```text
GET /_nuxt/composables/useScreen.ts 404
Failed to fetch dynamically imported module
```

Further Vite output exposed the real root cause:

```text
Failed to resolve import "@vueuse/core" from "app/composables/useScreen.ts"
```

### Root cause

`useScreen.ts` directly imports:

```ts
import { useWindowSize, useDevicePixelRatio } from "@vueuse/core"
```

but `@vueuse/core` was missing from the root `package.json` even though the lockfile already contained it. The project had effectively depended on a previously available/transitive node_modules layout.

### Fixes

- `variable-fab.vue` now explicitly imports `useScreen` instead of relying on the problematic auto-import path;
- stale Prompt Draft Service Workers/caches are cleaned in local development;
- `@vueuse/core` is now an explicit root dependency:

```text
@vueuse/core ^14.3.0
```

- accepted branch state requires `package.json` and `pnpm-lock.yaml` to remain synchronized;
- frozen install should be used rather than masking drift with `--no-frozen-lockfile`.

The user's local lockfile had stale working-tree state during recovery; restoring the tracked lockfile and reinstalling brought the project back up successfully.

If this issue reappears, inspect actual package/lock state and running dev ports/processes before changing Wizard code.

---

## 5. Prompt Templates — accepted and frozen

Template acceptance is complete.

Accepted flows include:

- Start from Template;
- no page reload during activation;
- always creates a NEW Draft;
- previous Draft remains unchanged;
- Save as Template from Create;
- Save as Template from Wizard success;
- My Templates persistence;
- instantiation preserves canonical state;
- source/Create isolation.

Template invariant:

```text
Template = versioned PromptDraftState snapshot
Template ≠ compiled prompt string
```

First built-in:

```text
LinkedIn Profile Portrait
```

Do not expand Template management unless a concrete bug or a proven reusable Wizard recipe justifies it.

---

## 6. Portrait Wizard current flow

Current Stages:

```text
Start
Subjects
Portrait
Appearance / Look
Composition
Scene
Final
Review
```

### Start

Only asks:

- Start from an image;
- Start from a description.

Idea is generated near Final, not asked at Start.

### Subjects

Current accepted Subject foundation:

- one to four Person Subjects;
- optional names;
- stable entity identity;
- unique canonical keys;
- indexed fallback labels for unnamed multi-subject flows;
- separate Subject Definition semantic.

Unnamed display example:

```text
Person 1
Person 2
```

Canonical keys may remain:

```text
{person}
{person_2}
```

#### Image-to-image Subject Definition

Current choices:

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

A real generation test showed a major improvement in identity reliability compared with sequence-only definitions.

Custom image definition example:

```text
woman with a short black bob and pearl choker in {reference}
```

#### Text-to-image Subject Definition

Current choices:

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
{met} = an adult man
{zahra} = an adult woman
{subject} = a black Persian cat with green eyes
```

The optional variable/name label does not define the Subject description.

Blank Custom definitions are rejected before mapping.

### Portrait intent

- Professional;
- Cinematic;
- Fashion;
- Fantasy.

### Appearance / Look

Quick + More Options exist for:

- Expression;
- Hair;
- Outfit.

Per-subject support is accepted for all three.

### Composition

Framing:

- Headshot;
- Head & shoulders;
- Half body;
- Full body.

Pose quick intents:

- Natural;
- Formal;
- Dynamic.

**Per-subject Pose is now implemented.**

Behavior:

```text
multiple Subjects
→ shared Pose by default
→ Customize pose per subject
→ overridden Subject removed from shared Pose targets
→ own canonical PoseAssignment/preset
```

Pose override currently needs only intent selection; it reuses the generic Subject Overrides UI without requiring a fake More Options record.

Headshot continues to hide/disable Pose semantics.

Manual real-generation acceptance for per-subject Pose is still pending and is the next task.

### Scene / Background

Background More Options currently covers:

- setting;
- spatial structure;
- visible material;
- detail density;
- one key element.

Current depth remains sufficient until a new real test shows otherwise.

### Lighting

Lighting remains **shared scene-level state**.

Per-subject Lighting is explicitly not an accepted requirement.

A real Outdoor + Moody use case exposed the old mismatch:

```text
Outdoor scene
+
controlled studio-light source
```

The generic Moody preset was made environment-neutral while preserving its hard side / low ambient / high contrast character.

Current compiled example:

```text
focused spotlight source from camera-left
hard directional light
low/minimal ambient
high contrast
```

The user repeated the same real use case and considered the Lighting fix successful.

### Final

- generated editable Idea;
- Aspect Ratio;
- Reference Usage when relevant;
- Transformation Strength when relevant.

Multi-subject Idea includes explicit `together`.

### Completion

Wizard maps through canonical Actions, validates, compiles, and produces `finalDraft`.

Create remains untouched until explicit `Continue editing in Create`, which creates a NEW Draft.

---

## 7. Multi-subject targeting status

Currently implemented:

```text
Expression  shared + per-subject
Hair        shared + per-subject
Outfit      shared + per-subject
Pose        shared + per-subject
```

Currently shared-only:

```text
Framing
Background
Lighting
```

Do not add per-subject Lighting.

Do not add per-subject Framing unless a concrete use case proves it makes semantic/compositional sense.

Do not automatically convert every targetable Expert capability into Wizard per-subject UI.

---

## 8. Real generation validation completed in this phase

### A. Multi-subject Look separation

Two-person cinematic/fashion tests confirmed:

- co-presence;
- independent Expression;
- independent Hair;
- independent Outfit;
- shared Framing;
- shared Pose was usable but motivated testing individualized Pose;
- shared Lighting is the correct scene-level model.

### B. Environment/Lighting

Outdoor brutalist architecture + Moody Lighting produced a useful result after removing the studio-specific source wording.

### C. Subject Definition

Replacing fragile sequence-only identification with:

```text
male person in {reference}
female person in {reference}
```

produced a notably cleaner and more reliable two-person result using the same reference set.

This Subject model is accepted as the current foundation.

### D. Generation misses vs architecture bugs

Some models may under-follow Hair or fine Expression details even when the compiled prompt is structurally correct.

Do not change Wizard architecture solely because one generation under-executes a correctly compiled semantic instruction.

---

## 9. Preserve policy — fixed

Wizard must keep all Setup Preserve flags false:

```text
preserveMainSubject
preserveIdentity
preservePose
preserveOutfit
preserveComposition
preserveColors
preserveMaterials
preserveLighting
```

Keep-reference behavior belongs to the relevant domain, not hidden Preserve toggles.

---

## 10. Conversation/workflow preference

Do not force command-by-command interaction unless the result of one command materially determines the next action.

When commands are independent, group them to reduce chat overhead.

Do not claim work is continuing in the background after sending a completed response. If repository work is not actually finished, keep working before replying.

---

## 11. Deferred work

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

## 12. Documentation discipline

- [`README.md`](./README.md) — Wizard architecture source of truth.
- [`UI.md`](./UI.md) — presentation/UX source of truth.
- [`TEMPLATES.md`](./TEMPLATES.md) — Template architecture/status.
- This file — exact operational checkpoint and next task.
- `docs/actions-api/STATUS.md` — accepted Actions API status.

A new chat should read these files first, then resume from **manual per-subject Pose validation**.
