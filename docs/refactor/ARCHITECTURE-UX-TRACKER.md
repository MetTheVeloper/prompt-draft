# Prompt Draft — Architecture & UX Tracker

## Purpose

This is the living engineering tracker for Prompt Draft after the semantic-refactor project.

Use it to preserve the **final engineering record** of concrete product-development findings such as:

- UX problems discovered during testing,
- reproducible current-schema bugs,
- repeated implementation patterns that may deserve centralization,
- architecture improvements that preserve or strengthen modularity,
- developer-experience friction that makes future changes unnecessarily expensive,
- performance or maintainability problems with concrete evidence.

This file is intentionally separate from `docs/prompt-semantics/SEMANTIC-REFACTOR-CHECKPOINT.md`.

The semantic checkpoint is a closed architecture contract/history. This tracker is the compact post-refactor record of work that has been resolved, plus any exceptional work that must intentionally remain open across sessions.

---

# Working rules

1. **Work first, record after closure.** Do not create, rewrite, or advance a tracker case for the request currently being investigated, implemented, or tested. Use the active conversation and code diff as the temporary working state.
2. **One final tracker update per ordinary task.** After the user confirms that the requested change/problem is resolved, update this tracker once with a short final report containing what changed, how it was verified, and the relevant commit(s).
3. **Do not journal intermediate attempts.** Failed approaches, provisional root causes, temporary patches, and in-progress status changes do not belong in the tracker unless they materially explain the final architecture decision.
4. **Persist unfinished work only when necessary.** A task may be entered before completion only when it is intentionally being parked across sessions because it is `Blocked`, explicitly deferred, or the user asks for it to be persisted. In that case, keep the entry minimal.
5. **Evidence before architecture.** Do not centralize code merely because two blocks look similar. Confirm shared behavior, shared lifecycle, or a real divergence risk first.
6. **Prefer narrow reusable primitives.** Centralization should reduce repeated decisions and maintenance cost without creating a global god-layer.
7. **Preserve module ownership.** Shared infrastructure may centralize mechanics, but semantic responsibility must remain with the owning module.
8. **Current behavior is the baseline.** Legacy draft/schema compatibility is not a requirement unless explicitly reopened as a product goal.
9. **Do not erase completed history.** Completed cases remain in this document as concise final records.
10. **Close only after verification.** Implementation alone is not completion. User confirmation, a targeted smoke test, build/generate result, or another appropriate acceptance signal must exist before an ordinary task is recorded as completed.

---

# Case IDs

Use the smallest category that accurately describes the primary problem:

| Prefix | Meaning | Use when |
| --- | --- | --- |
| `UX-` | User experience | The primary problem is interaction, discoverability, feedback, flow, responsiveness, or visual behavior. |
| `BUG-` | Product defect | Current behavior is reproducibly incorrect. |
| `ARC-` | Architecture | The main issue is responsibility, coupling, extensibility, lifecycle, or structural design. |
| `DUP-` | Duplication / centralization | Repeated mechanics or configuration create divergence and maintenance risk. |
| `DX-` | Developer experience | The code is unnecessarily difficult to extend, understand, test, or configure. |
| `PERF-` | Performance | There is measurable or clearly reproducible runtime/build performance cost. |

IDs are monotonic inside each prefix, for example `UX-001`, `UX-002`, `ARC-001`.

Do not renumber completed cases.

---

# Status model

Statuses are mainly for work intentionally persisted across sessions. Ordinary live tasks should normally appear in this file only once they are `Completed`.

| Status | Meaning |
| --- | --- |
| `Open` | Persisted for later work but not yet investigated enough to choose a direction. |
| `Investigating` | Persisted investigation is still active across sessions. |
| `Planned` | Direction is accepted but implementation is intentionally deferred. |
| `In Progress` | Work must remain persisted across sessions while implementation continues. |
| `Blocked` | Cannot proceed because of a concrete dependency or unresolved constraint. |
| `Completed` | Implemented and verified; concise resolution and commit references are recorded. |
| `Won't Fix` | Intentionally declined; reason must be recorded. |

Priority may use `P0`–`P3`:

- `P0` — blocks core use/release or risks data loss.
- `P1` — major product/architecture problem with high user or development cost.
- `P2` — meaningful improvement, normal priority.
- `P3` — polish, low-risk cleanup, or opportunistic improvement.

---

# Persisted active case index

This table is **not** a live mirror of the current chat. Add rows only for unfinished work that must intentionally survive into a later session (`Blocked`, deferred, or explicitly requested persistence).

| ID | Title | Type | Priority | Area | Status |
| --- | --- | --- | --- | --- | --- |
| — | No persisted active cases | — | — | — | — |

---

# Architecture / centralization decision test

Before creating a shared abstraction, answer these questions during implementation. Record only the conclusion in the final case unless the reasoning is important for future architecture work.

1. Is the repeated code implementing the **same behavior**, or does it only look visually similar?
2. Do at least two real consumers need the same lifecycle/configuration rules?
3. Is there already evidence of divergence, inconsistent fixes, or repeated bugs?
4. Can the shared layer expose a small stable API while letting modules keep their semantic policy?
5. Will adding another consumer become simpler after the abstraction?
6. Is the abstraction easier to understand than the duplicated code it replaces?
7. Can the change be verified without relying on legacy-schema compatibility?

If the answer is mostly no, keep the implementations local.

A useful target shape is usually:

```text
module-specific policy/data
        ↓
small shared mechanic / primitive
        ↓
existing design-system components
```

Avoid turning this into:

```text
all module behavior
        ↓
one global mega abstraction
```

---

# Case workflow

For an ordinary request handled in one continuous work cycle:

```text
Observe request/problem
  ↓
Inspect current implementation
  ↓
Decide + implement
  ↓
Targeted verification / user test
  ↓
User confirms resolved
  ↓
Update tracker once with short final report
```

Do **not** create or repeatedly edit the case between those steps.

If the work must be intentionally parked across sessions, create a minimal persisted case and index row. When that work is eventually completed, replace the provisional details with the concise final record.

If implementation reveals a separate reusable structural concern, add it to `Cross-case architecture candidates` after the current task closes. Promote it to a real `ARC-xxx` or `DUP-xxx` only when it becomes an actual piece of work.

---

# Completed-case template

Use this compact format after a normal task has been verified and closed:

```md
## BUG-001 — Short descriptive title

**Status:** Completed  
**Priority:** P2  
**Area:** Module Panel / Modal / Variables / Create / etc.  
**Type:** BUG  
**Found:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

### Final report

- What changed.
- Any important architecture boundary/policy that was preserved.
- Any small implementation caveat worth remembering.

### Verification

- The acceptance signal that confirmed the task is resolved.

**Commits:** `...`
```

For intentionally persisted unfinished work, keep only the minimum needed to resume: problem, current blocker/state, relevant files, and next step. Do not turn the tracker into a chronological debugging log.

---

# Cases

## BUG-001 — Module context menu is not available on all module cards

**Status:** Completed  
**Priority:** P2  
**Area:** Module cards / Context menu  
**Type:** BUG  
**Found:** 2026-08-23  
**Completed:** 2026-08-23

### Final report

- Added the shared `useModulePanelContextMenu` primitive and wired it to every bespoke module panel (`Background`, `Effects`, `Lighting`, `Texture`, `Hair`, `Outfit`, and the shared `Pose`/`Expression` panel), so right-click no longer falls through to the Draft page menu.
- Existing Base/Variables behavior and Layout-specific context-menu actions were preserved; module-specific semantic state remains owned by each panel.
- A blank-page `ReferenceError` seen immediately after pulling the new composable was caused by the running Nuxt dev server not refreshing its auto-import state. Restarting the dev server was sufficient; explicit imports were also retained as a small hardening change.

### Verification

- User confirmed the updated UI works correctly after restarting the dev server and the module context menus now behave as expected.

**Commits:** `774b287` (shared context-menu implementation), `fb74c4a` (explicit-import hardening)

---

## UX-001 — Module previews are inconsistent and guidance consumes excessive card space

**Status:** Completed  
**Priority:** P2  
**Area:** Module cards / Output preview / Help text  
**Type:** UX  
**Found:** 2026-08-23  
**Completed:** 2026-08-23

### Final report

- Added the shared `ModuleOutputText` renderer and applied it across every module-panel render path so multiline output and bullet lists preserve their intended line breaks, wrapping, and normal design-system typography instead of falling back to inconsistent raw/preformatted rendering.
- Added the reusable `el-help` click/tap popover and moved recurring module/group/field guidance out of the permanent card layout where appropriate. Schema-driven modules such as Camera and Typography, plus bespoke panels such as Background and Effects, now keep guidance available without paying the previous vertical-space cost.
- Added shared output-format state and the display-only `formatModuleOutputPreview` pipeline so each module card follows the active `Modular`, `Natural`, or `JSON` selection. Canonical module outputs continue to be emitted unchanged, keeping compiler/schema semantics outside the UI layer.
- Preserved Hair/Outfit reference-aware preview aliases by moving their display preparation into the shared preview formatter instead of feeding preview-only state back into canonical module output.

### Verification

- User tested the updated module UI and confirmed the preview rendering, compact help behavior, and format-aware module previews all work correctly.

**Commits:** `cb6c6f7` (shared preview/help refactor), `5dc2c07` (reference-aware preview preservation)

---

# Cross-case architecture candidates

Use this section only for patterns that are visible across completed cases but are not yet mature enough to become their own `ARC-` or `DUP-` case.

| Candidate | Evidence from cases | Decision |
| --- | --- | --- |
| Shared module-panel shell/action contract | `BUG-001` and `UX-001` both show that Base plus bespoke panels independently own recurring shell/display mechanics. Shared context-menu, output-rendering, help, and preview-format primitives reduced real divergence without centralizing module semantics. | Evidence is stronger, but keep this as a candidate until broader shell extraction becomes an explicitly selected task. A future shell-level discrepancy should trigger a dedicated `ARC-`/`DUP-` case rather than another isolated copy of the mechanic. |

Once evidence is sufficient and the work is actually selected, create a real case ID.

---

# Completed-work ledger

This is the compact historical view. Keep each row short.

| ID | Resolution | Commit | Verified |
| --- | --- | --- | --- |
| `BUG-001` | Shared module context-menu mechanics across bespoke panels; preserved specialized module policy. | `774b287`, `fb74c4a` | User UI confirmation, 2026-08-23 |
| `UX-001` | Unified multiline module previews, compact click/tap guidance, and format-aware per-module display while preserving canonical outputs. | `cb6c6f7`, `5dc2c07` | User UI confirmation, 2026-08-23 |

---

# New-chat handoff rule

When continuing this work in another ChatGPT project conversation:

1. Read this file first.
2. Read `docs/prompt-semantics/SEMANTIC-REFACTOR-CHECKPOINT.md` only when the issue touches semantic ownership or a previously closed architecture contract.
3. Inspect the current `main` implementation before proposing or applying a fix.
4. Do **not** update this tracker while the currently discussed task is still being investigated, implemented, or tested.
5. After the user confirms the task is resolved, add one concise final record and update the completed-work ledger.
6. Only persist unfinished work when it must intentionally continue across sessions because it is blocked/deferred or the user explicitly asks for persistence.

A new conversation should treat this tracker as the canonical record of **closed work and intentionally persisted unfinished work**, not as a substitute for the active conversation's scratch state.

---

# Scope boundary

This tracker does **not** reopen the completed semantic refactor by default.

A case may modify a closed semantic architecture only if current-schema evidence proves that the existing contract is wrong or loses required prompt meaning/state. Cosmetic UX changes, shared UI mechanics, code centralization, performance work, ordinary bugs, and developer-experience improvements should stay in this post-refactor track.
