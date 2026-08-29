# Prompt Templates

Status: **Foundation + Create/Wizard integration implemented; local acceptance pending**

Working branch: `feature/wizard`

Related Wizard architecture: [`README.md`](./README.md)

Operational checkpoint: [`STATUS.md`](./STATUS.md)

---

## 1. Purpose

Prompt Templates are reusable, structured starting points for real use cases that have already produced useful Prompt Draft results.

The feature was introduced while validating the Portrait Wizard because successful Wizard recipes naturally become good reusable starters. The first example is the tested **LinkedIn Profile Portrait** recipe.

The intended development loop is:

```text
Real Wizard use case
  ↓
Build + test a useful Draft
  ↓
Confirm that the recipe is broadly reusable
  ↓
Normalize it into a curated built-in Template
  ↓
Users start a NEW Draft from that Template
  ↓
Expert UI remains fully editable
```

Template development must not become a parallel product track while the Portrait Wizard is still being developed. Build the infrastructure once, then add curated built-ins only when real Wizard/use-case testing justifies them.

---

## 2. Canonical definition

A Prompt Template is **not** a precompiled prompt string.

A Prompt Template is a versioned snapshot of canonical `PromptDraftState` plus small metadata:

```ts
PromptTemplate {
  schemaVersion
  id
  title
  description?
  origin
  source?
  draft: PromptDraftState
  createdAt?
  updatedAt?
}
```

The important invariant is:

```text
Template = structured editable Draft state
Template ≠ raw prompt text
```

This keeps Templates compatible with the Expert UI, module state, Variables, named configurations/assignments, Setup settings, validation, and normal compilation.

---

## 3. Why Templates store Draft snapshots instead of Action history

Wizard construction uses canonical Actions because the Wizard translates intent into domain mutations.

Templates represent the **accepted result** of that process, not the historical path used to reach it:

```text
Wizard answers
  ↓
Canonical Actions
  ↓
finalDraft
  ↓
Template snapshot
```

This is also required for `Save as template` from Create, where a valid current Draft exists but no useful Action history needs to be reconstructed.

Instantiation deep-clones the Template Draft so editing a created Draft never mutates the stored Template.

---

## 4. Built-in vs user Templates

### Built-in Templates

Built-ins are curated product recipes stored in source control.

They should only be added after a real use case has been tested and accepted. Before promotion, normalize personal details into reusable semantics such as `{person}` rather than preserving one-off user names.

Built-ins may keep provenance metadata, for example:

```ts
source: {
  kind: "wizard",
  wizardId: "portrait",
  wizardVersion: 2,
}
```

This metadata is for maintenance/provenance; the Template does not depend on a live Wizard Session at runtime.

### User Templates

User Templates are exact reusable snapshots created by the user from either:

- a completed Wizard result;
- the current Draft in Create.

They are local to the device in the current implementation and may preserve personal Variables/configuration because they are the user's own reusable starter.

---

## 5. Storage

User Template storage is separate from both Create Draft persistence and Wizard Session persistence.

Storage key:

```text
prompt-draft:prompt-templates:v1
```

Create Drafts continue to use their existing collection key.

Wizard Sessions continue to use their existing independent Wizard-session key.

Do not merge these persistence concerns.

---

## 6. Start from a template

The accepted UX is **new Draft only**.

```text
Start from a template
  ↓
Choose Template
  ↓
instantiate / deep clone
  ↓
Create NEW Draft record
  ↓
Make it active in Create
  ↓
User edits anything in Expert UI
```

There is intentionally **no** `Apply template to current Draft` feature.

That avoids ambiguous merge/overwrite rules for existing Variables, module values, assignments, named configurations, Scenes, Layout, etc.

Existing Drafts must remain untouched when starting from a Template.

---

## 7. Save as template

The same user-template creation path is exposed from two places:

### Create

The current active Draft can be saved as a user Template.

The Create Draft must be flushed/persisted before the snapshot is taken so pending debounced edits are not lost.

### Wizard success screen

After successful Wizard completion, the `finalDraft` can be saved directly as a user Template without first creating a Create Draft.

This is intentionally adjacent to the existing `Continue editing in Create` action.

Both entry points use the same Template storage model.

---

## 8. Current implementation map

Core Template files:

```text
app/templates/
  types.ts
  validation.ts
  registry.ts
  instantiate.ts
  storage.ts
  createHost.ts
  builtins/
    linkedin-profile.ts
```

UI/integration:

```text
app/composables/usePromptTemplateUi.ts
app/components/templates/PromptTemplatePickerModal.vue
app/components/templates/SavePromptTemplateModal.vue
app/components/Header.vue
app/pages/wizard/[wizardId].vue
```

Focused regression test:

```text
scripts/prompt-templates.test.ts
```

Command:

```bash
pnpm test:templates
```

---

## 9. Built-in #1 — LinkedIn Profile Portrait

The first built-in is based on the successful Portrait Wizard LinkedIn/profile test.

Accepted recipe:

```text
mode                     image-to-image
subject                  {person} = person in {reference}
idea                     professional portrait
reference usage          strict
transformation strength  subtle
aspect                   4:5
framing                  head-and-shoulders
expression               subtle + relaxed + slight smile + confident
pose                     relaxed standing / shifted weight
hair                     controlled styling
outfit                   professional attire
background               light-gray seamless studio
lighting                 broad, very soft, front, balanced, low contrast
preserve flags           all false
```

The built-in stores the canonical Draft state that compiles to those semantics.

Do not casually change this recipe merely because the Template exists. Update it only after additional tests justify a product-level revision.

---

## 10. Acceptance tests for the next chat

### Automated

Run in this order on `feature/wizard`:

```bash
pnpm install --frozen-lockfile
pnpm test:templates
pnpm test:wizard
pnpm generate
```

The `package.json` / `pnpm-lock.yaml` CI mismatch that previously blocked GitHub Actions was fixed on `feature/wizard` before this documentation checkpoint.

### Manual — Start from Template

1. Open Create.
2. Open Templates → `Start from a template`.
3. Confirm `LinkedIn Profile Portrait` appears under built-ins.
4. Use it.
5. Confirm a **new** Draft is created and selected.
6. Confirm previous Drafts still exist unchanged.
7. Inspect Setup + Expert modules and confirm the LinkedIn recipe is editable.
8. Compile/output-check that the expected LinkedIn semantics are present.

### Manual — Save from Create

1. Change several values in the active Draft.
2. Choose `Save as template`.
3. Give it a name.
4. Reopen `Start from a template`.
5. Confirm it appears under `My templates`.
6. Instantiate it and verify the saved edits are present.
7. Confirm the source Draft was not overwritten.

### Manual — Save from Wizard

1. Complete Portrait Wizard successfully.
2. On the success screen choose `Save as template`.
3. Name and save it.
4. Open Create → Start from a template.
5. Confirm it appears under `My templates` and instantiates correctly.
6. Confirm saving the Template itself does not mutate Create.

---

## 11. Deferred Template work

Do not expand these until a real requirement appears:

- Apply/merge Template into current Draft;
- template marketplace/library service;
- cloud sync;
- sharing/publishing;
- ratings;
- large category/taxonomy system;
- arbitrary template composition;
- user-facing template version management;
- automatic promotion of every Wizard result to a built-in.

Potential future work such as deleting/renaming user Templates can be added when the basic flow has passed manual acceptance and there is a concrete UX need.

---

## 12. Product rule for adding future built-ins

During Wizard development, ask one question after a successful real-world test:

> Is this result a stable, reusable starting point for a meaningful user goal?

If no, keep it only as a test/example.

If yes:

```text
normalize personal details
  ↓
add curated built-in snapshot
  ↓
compile/regression test
  ↓
keep Expert UI editable
```

This is the intended connection between ongoing Wizard validation and the Template catalog.
