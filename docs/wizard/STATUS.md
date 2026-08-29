# Wizard Development Status

Last updated: **2026-08-29**

Status: **Portrait v2 + multi-subject Look + Background depth + Prompt Templates implemented; local acceptance of latest Template checkpoint pending**

Working branch: `feature/wizard`

Development branch only: continue all implementation/testing from `feature/wizard`, not `main`.

Architecture source of truth: [`README.md`](./README.md)

Wizard UX baseline: [`UI.md`](./UI.md)

Prompt Template architecture/test plan: [`TEMPLATES.md`](./TEMPLATES.md)

Actions contract: `prompt-draft.actions.v1`

---

## 1. Branch / deployment checkpoint

The last code checkpoint before this documentation refresh was:

```text
feature/wizard@6f6bdb9f1bb4c5f18198979edec0767b20de5a3f
```

That commit fixed the package manifest / lockfile mismatch that had blocked GitHub Actions at `pnpm install --frozen-lockfile`.

For temporary remote testing, the Wizard branch was moved onto `main`, then the user requested `main` be moved back one commit after local power returned.

Current requested `main` position:

```text
main@85c88867b8f5ded558011ac5366721e49062cea3
```

Do **not** continue feature work from `main`. The complete current implementation, including the CI dependency fix and these docs, lives on `feature/wizard`.

---

## 2. Immediate next-chat objective

The next chat should do two things in order:

1. **accept/fix the Prompt Template system locally**;
2. **return immediately to Portrait Wizard development and real-use-case testing**.

Do not branch into unrelated product work after Template acceptance.

---

## 3. First commands/tests to run locally

After switching to and pulling `feature/wizard`, validate the newest checkpoint in this order:

```bash
pnpm install --frozen-lockfile
```

Then:

```bash
pnpm test:templates
```

Then:

```bash
pnpm test:wizard
```

Then:

```bash
pnpm generate
```

Important conversation workflow preference: when validating interactively, give the user **one terminal command at a time** and wait for its result when the result matters.

The user does not want unnecessary `git pull` output unless a specific verification is required.

---

## 4. Prompt Template system — implemented scope

Prompt Templates are versioned structured Draft snapshots, not raw prompt strings.

Core invariant:

```text
Template = PromptDraftState snapshot + metadata
```

Implemented foundation:

```text
app/templates/
  types.ts
  validation.ts
  registry.ts
  instantiate.ts
  storage.ts
  createHost.ts
  builtins/linkedin-profile.ts
```

Implemented UI/integration:

```text
app/composables/usePromptTemplateUi.ts
app/components/templates/PromptTemplatePickerModal.vue
app/components/templates/SavePromptTemplateModal.vue
app/components/Header.vue
app/pages/wizard/[wizardId].vue
```

Implemented user flows:

- Create → `Start from a template`;
- Start from Template always creates a **new Draft**;
- no `Apply Template to Current Draft` feature;
- Create → `Save as template`;
- Wizard success → `Save as template`;
- built-ins and user Templates appear separately;
- user Templates persist locally;
- Template instantiation deep-clones the stored Draft.

User Template storage key:

```text
prompt-draft:prompt-templates:v1
```

Focused test command:

```bash
pnpm test:templates
```

Detailed architecture and manual acceptance checklist are in [`TEMPLATES.md`](./TEMPLATES.md).

---

## 5. First built-in Template — LinkedIn Profile Portrait

The first curated built-in came directly from a successful real Portrait Wizard use-case test.

Accepted recipe:

```text
{person} = person in {reference}

mode                     image-to-image
idea                     professional portrait
reference usage          strict
transformation strength  subtle
aspect                   4:5
framing                  head-and-shoulders
expression               subtle + relaxed eyes/brows + slight smile + confident
pose                     relaxed standing / shifted weight
hair                     controlled styling
outfit                   professional attire
background               seamless light-gray studio
lighting                 broad, very soft, front, balanced, low contrast
preserve flags           all false
```

The user generated several professional portrait outputs from this recipe and considered the LinkedIn test successful.

This successful use case is the product reason the Template system exists.

---

## 6. Manual Template acceptance still required

### Start from Template

Verify:

1. Create exposes Templates.
2. `LinkedIn Profile Portrait` appears under built-ins.
3. `Use template` creates and activates a **new** Draft.
4. the previous Draft remains unchanged in the Draft list.
5. LinkedIn Setup/module values appear in Expert UI and remain editable.
6. compiled output matches the expected recipe.

### Save from Create

Verify:

1. modify a Draft;
2. Save as template;
3. reopen Start from Template;
4. user Template appears under `My templates`;
5. instantiate it;
6. saved values are preserved;
7. source Draft remains unchanged.

### Save from Wizard

Verify:

1. finish Portrait Wizard;
2. Save as template from the success screen;
3. open Create → Start from Template;
4. saved Wizard Template appears under My templates;
5. instantiate and inspect it;
6. merely saving the Template must not mutate Create.

If Template acceptance passes, **stop Template feature expansion** and return to Wizard.

---

## 7. Portrait Wizard — current implemented flow

Current high-level stages:

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

Current Portrait no longer asks for free-form Idea at the beginning.

It asks only:

- Start from an image;
- Start from a description.

### Subjects

- one required Person initialized by the Session;
- up to four Persons;
- optional names;
- stable entity IDs separate from display labels/canonical keys;
- Variables created through canonical `variable.create` during mapping.

Image-to-image Subject values use reference position where needed:

```text
single:
{person} = person in {reference}

multiple:
{met} = first person in {reference}
{zahra} = second person in {reference}
```

This improved multi-person co-presence substantially in real generation tests.

### Portrait intent

Current quick intents:

- Professional;
- Cinematic;
- Fashion;
- Fantasy.

### Appearance / Look

Quick choices exist for:

- Expression;
- Hair;
- Outfit.

Optional More Options exist for each domain.

Expression More Options:

- intensity;
- eyes;
- brows;
- mouth.

Hair More Options:

- length;
- curl pattern;
- volume;
- parting.

Outfit More Options:

- fit;
- accessories;
- additional details.

### Multi-subject shared/per-subject controls

Implemented for:

- Expression;
- Hair;
- Outfit.

Behavior:

```text
one Subject
→ current shared UI only

multiple Subjects
→ shared choice by default
→ optional Customize per subject
→ overridden Subject removed from shared target set
→ own canonical assignment/style/set created as needed
```

Per-subject values inherit shared values for fields not explicitly overridden.

A previous Vue `structuredClone(reactiveProxy)` bug in the per-subject modal caused `DataCloneError` and lost settings. It was fixed by serializing a plain snapshot instead of cloning the Vue Proxy directly.

The user confirmed after the fix that Apply Subject Settings persists correctly.

### Composition

Current simplified shared controls:

- Framing;
- Pose.

Framing includes:

- Headshot;
- Head & shoulders;
- Half body;
- Full body.

Pose remains shared; per-subject Pose is intentionally not implemented yet.

### Scene / Background

Environment quick direction plus relevant text detail exists.

Background More Options currently exposes a curated canonical subset:

- setting;
- spatial structure;
- visible material;
- detail density;
- one key background element.

The user tested a studio/industrial/concrete-style Background result and considered current Background depth sufficient for now.

### Lighting

Current quick choices remain shared and use canonical Lighting presets/semantics.

### Final

Final contains:

- system-generated editable Idea;
- Aspect Ratio;
- reference usage for image-to-image;
- transformation strength for image-to-image.

Idea is generated after semantic context is known, for example:

```text
A fashion portrait of {person} with the following settings
A fashion portrait of {met} and {zahra} together, with the following settings
```

The explicit `together` wording is important for multi-person co-presence.

Once the user edits generated Idea, it becomes user-owned and is not overwritten by later default recomputation.

### Review / completion

Review is grouped by Stage.

Finish maps through canonical Actions, validates, compiles, and produces `finalDraft`.

Create remains untouched until explicit `Continue editing in Create`, which creates a **new** Create Draft.

The Wizard success screen now also includes `Save as template`.

---

## 8. Preserve policy — fixed decision

Wizard must not enable Setup Preserve flags implicitly.

All of these remain false:

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

Even Hair/Outfit `Keep reference` choices must not toggle these Setup flags.

Preserve emphasis is an Expert UI concern unless a future explicit Wizard requirement changes this decision.

---

## 9. Real generation tests already considered successful

### Multi-person Portrait

Semantic Subject Variables + explicit generated Idea with `together` successfully produced both referenced people in one image rather than separate images.

### Look depth

Expression/Hair/Outfit More Options produced visibly strong, domain-specific transformations in a single-person fantasy/fashion test.

### Background depth

The curated Background More Options successfully controlled visible environment/material/detail semantics.

### LinkedIn/profile use case

The professional Portrait recipe produced multiple useful clean profile/headshot outputs and led directly to the Prompt Template feature.

These tests validate the current general direction; they do not remove the need for regression tests after code changes.

---

## 10. Current known scope boundaries

Per-subject controls currently exist only for Expression/Hair/Outfit.

Do not automatically expand per-subject support to:

- Pose;
- Framing;
- Background;
- Lighting;

until a real use case demonstrates value.

Background current depth is explicitly considered sufficient for now.

Reference Usage / transformation behavior is also considered reasonable based on current tests: photorealistic inputs may show modest differences while more stylized prompts allow larger transformation. Do not change those semantics without new evidence.

---

## 11. After Template acceptance — resume Wizard here

Once Template tests pass, return to Portrait Wizard rather than expanding Template management.

Immediate Wizard continuation should be:

1. run/confirm the complete latest Wizard regression gate after multi-subject + Background + Template integration;
2. manually retest at least one multi-subject Portrait using independent Expression/Hair/Outfit overrides;
3. inspect the resulting Expert UI assignments/styles/sets, not only the compiled prompt;
4. continue real use-case-driven Portrait testing;
5. only add the next Wizard capability when those tests reveal a concrete gap.

There is currently no accepted requirement to immediately add per-subject Pose/Framing or more Background controls.

Good next use cases should pressure-test the remaining shared Composition/Lighting semantics and general Portrait usability rather than adding complexity by default.

---

## 12. Template development rule from now on

Do not create a large speculative Template catalog.

During Wizard testing, after a successful scenario ask:

> Is this a stable, useful, reusable starting point for a meaningful user goal?

If yes, normalize the successful Draft and add it as a curated built-in with regression coverage.

If no, keep it only as a test example.

This keeps Template growth tied directly to real Wizard validation.

---

## 13. Deferred work

Do not implement without a real requirement:

- universal Wizard DSL;
- arbitrary rule scripting/expression language;
- generalized nested/repeatable flow tree;
- Actions batch/transaction/dry-run solely for Wizard orchestration;
- AI-generated Wizard definitions/UI;
- broad Expert UI rewrite;
- Wizard-specific compiler/validator;
- direct arbitrary Draft/path mutation;
- one Vue page per Wizard while shared route/registry is sufficient;
- Apply Template to Current Draft;
- Template marketplace/cloud sync/sharing/catalog infrastructure;
- automatic per-subject targeting for every domain.

---

## 14. Documentation discipline

- [`README.md`](./README.md) — Wizard architecture source of truth.
- [`UI.md`](./UI.md) — detailed presentation/UX baseline; when an older example conflicts with later accepted decisions, follow `README.md` + this current status.
- [`TEMPLATES.md`](./TEMPLATES.md) — Prompt Template architecture and acceptance checklist.
- This file — operational checkpoint for resuming work in a new chat.
- `docs/actions-api/STATUS.md` — accepted Actions operational status.

Update this file after every meaningful validated checkpoint so a fresh chat can resume without reconstructing conversation history.
