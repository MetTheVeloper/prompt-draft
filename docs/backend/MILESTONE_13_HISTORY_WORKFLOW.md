# Milestone 13 — History Workflow

Status: COMPLETE

Verified: 2026-09-04

## Scope

This milestone improved the existing Wizard-run History workflow without changing the independent backend architecture or the Wizard-run persistence/API contract.

## Verified product behavior

```text
History removed from global Header/mobile navigation
History entry moved into the Drafts menu
Drafts menu order:
  Create new draft
  Import JSON
  Export JSON
  divider
  History
  divider
  saved Drafts

/history list rewritten with the EL component system
/history?run=<uuid> detail rewritten with the EL component system
EN/FA History copy updated
Light/Dark compiled-prompt text follows the theme token
Stored snapshot removed from end-user History UI
Wizard-run snapshot remains persisted internally
Edit in Create available from History list and detail
Edit in Create creates a new editable local Draft from snapshot.finalDraft
historical Wizard run remains immutable
existing Draft collection is preserved
new restored Draft becomes active before navigation to /create
```

## Data / API contract

No new backend endpoint or schema change was required.

The existing Wizard-run detail contract already stores:

```text
snapshot.finalDraft -> PromptDraftState
```

That canonical state is used to create a new `PromptDraftRecord` in the browser Draft collection. The implementation does not attempt to reconstruct editable state from the compiled prompt text.

## Static-generation verification

The user explicitly verified the completed behavior locally and then ran:

```text
pnpm generate
```

Result:

```text
SUCCESS
16 initial routes prerendered
/history present
.output/public generated
offline manifest generated
225 files / 62.8 MB
```

Known existing warnings remained non-blocking:

```text
duplicated compilePromptOutput auto-import
module-preload sourcemap warning
Nitro cache-driver external-resolution warning
large client chunks
```

## Closure

Milestone 13 is complete and locally verified. Do not reopen it unless a concrete History/Draft-history requirement is selected later.
