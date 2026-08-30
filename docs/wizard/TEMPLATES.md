# Prompt Templates

Status: **Accepted; infrastructure complete and feature expansion frozen**

Working branch: `feature/wizard`

Related Wizard architecture: [`README.md`](./README.md)

Operational checkpoint: [`STATUS.md`](./STATUS.md)

---

## 1. Purpose

Prompt Templates are reusable structured starting points extracted from real Prompt Draft use cases that have already produced useful results.

The first Template came directly from Portrait Wizard validation: **LinkedIn Profile Portrait**.

Development rule:

```text
Real Wizard use case
  ↓
Build + test useful Draft
  ↓
Confirm recipe is reusable
  ↓
Normalize into curated Template
```

Do not grow a speculative Template catalog independently from real Wizard validation.

---

## 2. Canonical definition

A Template is not a compiled prompt string.

```text
Template = versioned PromptDraftState snapshot + metadata
```

Conceptual shape:

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

The snapshot remains editable through normal Expert UI after instantiation.

---

## 3. New-Draft-only semantics

Starting from a Template always creates a **NEW Draft**.

Accepted rule:

```text
Template
  ↓
instantiate deep clone
  ↓
Create NEW Draft
  ↓
make new Draft active
```

Do not add:

```text
Apply Template to Current Draft
```

unless a future explicit product requirement changes this decision.

The previous Create Draft must remain untouched.

---

## 4. Built-in vs user Templates

### Built-in

Curated, source-controlled, normalized snapshots for proven reusable use cases.

### User Templates

Exact local snapshots saved by the user from Create or Wizard success.

User Templates may preserve personal Variables/configuration because they represent the user's own reusable Draft state.

User Template storage is separate from Create Draft persistence and Wizard Session persistence.

Storage key:

```text
prompt-draft:prompt-templates:v1
```

---

## 5. Accepted user flows

### Start from Template

Create exposes Template picking with separate built-in and My Templates sections.

Using a Template:

- deep-clones the stored Draft;
- creates a NEW Create Draft;
- activates it in place;
- does not reload the page;
- does not mutate the previous Draft.

### Save as Template from Create

Before snapshotting, pending Create state must be flushed/persisted so debounced edits are not lost.

Saving the Template must not otherwise change the source Draft.

### Save as Template from Wizard

Wizard success may save `finalDraft` directly as a Template without first handing it to Create.

Merely saving a Wizard Template must not create or mutate a Create Draft.

---

## 6. Accepted implementation

Foundation:

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

UI/integration:

```text
app/composables/usePromptTemplateUi.ts
app/components/templates/PromptTemplatePickerModal.vue
app/components/templates/SavePromptTemplateModal.vue
app/components/Header.vue
app/pages/wizard/[wizardId].vue
```

Focused regression:

```bash
pnpm test:templates
```

Latest accepted local Template suite:

```text
7/7 passed
```

---

## 7. First built-in — LinkedIn Profile Portrait

The first built-in is a normalized structured snapshot of the successful professional Portrait recipe.

Core recipe:

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

The Template stores canonical Draft state, not these literal compiled lines.

The compiler may add context-specific wording such as:

```text
replace the source/reference facial expression with ...
replace the source/reference pose with ...
```

without changing the Template snapshot contract.

---

## 8. Acceptance status

Manual acceptance is complete for:

- Start from built-in Template;
- new Draft creation;
- no page reload;
- previous Draft preservation;
- editable Expert UI state;
- compiled output;
- Save as Template from Create;
- My Templates persistence;
- user Template instantiation;
- Save as Template from Wizard success;
- Create/Wizard isolation.

Template system is therefore **accepted**.

---

## 9. Current development rule

Template feature expansion is stopped while Portrait Wizard development continues.

When a future real Wizard scenario succeeds, ask:

> Is this a stable, reusable starting point for a meaningful user goal?

If yes, it may become a curated built-in with regression coverage.

If no, keep it as a test/use-case example only.

---

## 10. Deferred Template work

Do not implement without a concrete requirement:

- Apply/merge into current Draft;
- Template composition;
- cloud sync;
- marketplace/library infrastructure;
- sharing/publishing;
- ratings;
- large taxonomy/catalog work;
- user-facing Template version management;
- automatic promotion of arbitrary Wizard results.
