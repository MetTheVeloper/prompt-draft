# Prompt Draft — Architecture & UX Tracker

## Purpose

This is the living engineering tracker for Prompt Draft after the semantic-refactor project.

Use it to record, investigate, implement, verify, and close concrete product-development findings such as:

- UX problems discovered during testing,
- reproducible current-schema bugs,
- repeated implementation patterns that may deserve centralization,
- architecture improvements that preserve or strengthen modularity,
- developer-experience friction that makes future changes unnecessarily expensive,
- performance or maintainability problems with concrete evidence.

This file is intentionally separate from `docs/prompt-semantics/SEMANTIC-REFACTOR-CHECKPOINT.md`.

The semantic checkpoint is a closed architecture contract/history. This tracker is an open, evolving work record for post-refactor engineering.

---

# Working rules

1. **Capture before refactoring.** A visible UX symptom or duplicated pattern should be recorded before deciding that a new abstraction is required.
2. **Evidence before architecture.** Do not centralize code merely because two blocks look similar. Confirm shared behavior, shared lifecycle, or a real divergence risk first.
3. **Prefer narrow reusable primitives.** Centralization should reduce repeated decisions and maintenance cost without creating a global god-layer.
4. **Preserve module ownership.** Shared infrastructure may centralize mechanics, but semantic responsibility must remain with the owning module.
5. **Current behavior is the baseline.** Legacy draft/schema compatibility is not a requirement unless explicitly reopened as a product goal.
6. **Do not erase history.** Completed cases remain in this document with their resolution, verification, and commit references.
7. **One case may reveal another.** A UX case can link to a separate Architecture or Duplication case when the symptom exposes a broader structural problem.
8. **Close only after verification.** Implementation alone is not completion; record the actual test/build/smoke-test result used to accept the change.

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

| Status | Meaning |
| --- | --- |
| `Open` | Captured but not yet investigated enough to choose a direction. |
| `Investigating` | Evidence, affected code, or root cause is being inspected. |
| `Planned` | Direction is accepted but implementation has not started. |
| `In Progress` | Implementation is underway. |
| `Blocked` | Cannot proceed because of a concrete dependency or unresolved constraint. |
| `Completed` | Implemented and verified; resolution and commit are recorded. |
| `Won't Fix` | Intentionally declined; reason must be recorded. |

Priority may use `P0`–`P3`:

- `P0` — blocks core use/release or risks data loss.
- `P1` — major product/architecture problem with high user or development cost.
- `P2` — meaningful improvement, normal priority.
- `P3` — polish, low-risk cleanup, or opportunistic improvement.

---

# Active case index

Keep this table synchronized whenever a case is created, reclassified, started, blocked, or completed.

| ID | Title | Type | Priority | Area | Status |
| --- | --- | --- | --- | --- | --- |
| `BUG-001` | Module context menu is not available on all module cards | BUG | P2 | Module cards / Context menu | Investigating |

---

# Architecture / centralization decision test

Before creating a shared abstraction, answer these questions in the relevant case:

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

For each new finding:

```text
Observe
  ↓
Create case + index row
  ↓
Inspect affected code and behavior
  ↓
Record evidence + root cause
  ↓
Decide local fix vs shared refactor
  ↓
Implement
  ↓
Run targeted verification
  ↓
Record resolution + commit
  ↓
Mark Completed
```

If implementation reveals a separate reusable structural concern, create a linked `ARC-xxx` or `DUP-xxx` case instead of silently expanding the original scope.

---

# Case template

Copy this section for each new case.

```md
## UX-001 — Short descriptive title

**Status:** Open  
**Priority:** P2  
**Area:** Module Panel / Modal / Variables / Create / etc.  
**Type:** UX  
**Found:** YYYY-MM-DD  
**Related cases:** —

### Problem

What was observed during real use or testing?

### Expected behavior

What should happen instead?

### Evidence / reproduction

- reproduction steps,
- screenshots/logs/output when relevant,
- concrete examples,
- frequency or scope.

### Affected code / surfaces

- `path/to/file`
- component/composable/module names

### Root cause

Fill after investigation. Distinguish the visible symptom from the actual implementation cause.

### Architecture signal

Does this expose duplication, coupling, inconsistent lifecycle, repeated metadata, or another centralization opportunity?

If yes, explain whether it belongs in this case or should become a linked `ARC-xxx` / `DUP-xxx` case.

### Decision

Record the accepted direction and why it is preferable to the alternatives.

### Implementation

Record the concrete implementation after the change is made.

### Verification

- targeted behavior test,
- relevant smoke tests,
- `pnpm locale:consolidate` when localization boundaries are touched,
- `pnpm generate` / `pnpm build` when appropriate.

### Resolution

Fill only when closed.

**Completed:** YYYY-MM-DD  
**Commit:** `...`
```

---

# Cases

## BUG-001 — Module context menu is not available on all module cards

**Status:** Investigating  
**Priority:** P2  
**Area:** Module cards / Context menu  
**Type:** BUG  
**Found:** 2026-08-23  
**Related cases:** —

### Problem

The module-specific context menu is available on some module cards, such as Variables and Layout, but not consistently across all modules. Right-clicking an affected module such as Effects falls through to the page-level/default Draft context menu instead of opening the context menu for that module.

### Expected behavior

Right-clicking any current or future module card should resolve to that module's context menu. Shared module actions should be available through the common module-card mechanism, while module-specific actions should remain owned/configured by the module that supports them. A newly added module should not require an unrelated hardcoded allow-list entry merely to receive the common module context menu.

### Evidence / reproduction

- Right-click Variables: the Variables module menu opens with module actions such as Expand, Copy output, and Remove from key modules.
- Right-click Layout: the Layout module menu opens and includes both common actions and Layout-specific actions such as Copy/Download.
- Right-click Effects: the page-level/default Draft context menu opens instead of an Effects/module context menu.
- User-provided screenshots on 2026-08-23 demonstrate all three behaviors.
- The user reports the same missing module-menu behavior on multiple modules, so the scope is broader than Effects alone.

### Affected code / surfaces

Under investigation. Inspect the module-card rendering path, context-menu event wiring, module action/menu configuration, and the page-level context-menu fallback on current `main`.

### Root cause

Under investigation.

### Architecture signal

There is a likely centralization signal because a behavior that should belong to the generic module-card interaction appears to be available only to a subset of modules. Before introducing or changing a shared abstraction, inspect whether this is caused by a hardcoded module list, per-module event wiring, capability metadata, or intentional semantic differences.

### Decision

Pending root-cause investigation. Prefer a local fix if the common mechanism already exists and the defect is isolated wiring. Prefer a narrow shared refactor if module-menu eligibility or registration is hardcoded in a way that excludes current/future modules.

### Implementation

Not started.

### Verification

Pending. Verification must cover at least Variables, Layout, Effects, another previously affected module, and a module without extra module-specific actions to confirm the common menu is inherited correctly without breaking specialized actions.

### Resolution

Open.

**Completed:** —  
**Commit:** —

---

# Cross-case architecture candidates

Use this section only for patterns that are visible across multiple cases but are not yet mature enough to become their own `ARC-` or `DUP-` case.

| Candidate | Evidence from cases | Decision |
| --- | --- | --- |
| — | — | — |

Once evidence is sufficient, create a real case and replace the candidate with its case ID.

---

# Completed-work ledger

This is a compact historical view. Detailed resolution stays inside each case.

| ID | Resolution | Commit | Verified |
| --- | --- | --- | --- |
| — | No completed post-refactor cases yet | — | — |

---

# New-chat handoff rule

When continuing this work in another ChatGPT project conversation:

1. Read this file first.
2. Read `docs/prompt-semantics/SEMANTIC-REFACTOR-CHECKPOINT.md` only when the issue touches semantic ownership or a previously closed architecture contract.
3. Inspect the current `main` implementation before proposing or applying a fix.
4. Update this tracker when a case is created or materially changes state.
5. When work is completed, record the resolution, verification result, completion date, and commit before closing the case.

A new conversation should treat this tracker as the canonical state of post-refactor UX and architecture work rather than relying on chat history.

---

# Scope boundary

This tracker does **not** reopen the completed semantic refactor by default.

A case may modify a closed semantic architecture only if current-schema evidence proves that the existing contract is wrong or loses required prompt meaning/state. Cosmetic UX changes, shared UI mechanics, code centralization, performance work, ordinary bugs, and developer-experience improvements should stay in this post-refactor track.
