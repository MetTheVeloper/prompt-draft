# Prompt Draft — Execution Layer Concept V1

Status: **Strategic product concept; partial future implementation**

---

# 1. Definition

Prompt Draft does not execute the final AI workload.

It should, however, own the finalization step between discovering reusable knowledge and handing the instruction to an external AI tool.

This layer is called the **Execution Layer** in strategy documentation.

```text
Discover knowledge product
  -> unlock/access
  -> provide user-specific values
  -> apply controlled customization
  -> finalize structured instruction
  -> copy/export/handoff
  -> external AI tool executes
```

---

# 2. Why it matters

A plain prompt marketplace leaves the buyer with manual work:

- find placeholders;
- edit text correctly;
- know which settings may change;
- avoid breaking prompt structure;
- understand tool-specific details.

Prompt Draft's Execution Layer removes that human cost.

This is a major part of the value the user can reasonably pay for.

---

# 3. Prompt example

A structured image prompt already contains an aspect-ratio concept.

Instead of forcing the buyer to edit the text manually, the product page may expose:

```text
Aspect ratio
[ 1:1 ] [ 4:5 ] [ 16:9 ] ...
```

The final copied prompt is generated from the selected value through normal Prompt Draft semantics.

---

# 4. Template example

```text
Event Poster Template

Title:       [              ]
Description: [              ]
Date:        [              ]
Time:        [              ]
Brand:       [              ]
Ratio:       [ 4:5         ]

[Finalize / Copy]
```

The user never needs to open the full Expert editor or manually replace variables.

---

# 5. Workflow example

A Workflow may guide the user through a sequence of knowledge components.

The Execution Layer may eventually:

- collect required inputs once;
- feed those inputs to relevant Templates/Prompts;
- show step-specific finalized instructions;
- preserve progress;
- explain which external tool to use at each step.

Prompt Draft still does not execute the external model call unless a later strategy explicitly changes this boundary.

---

# 6. Engineering principles

Execution must preserve the same architectural philosophy as the current `/create` engine:

- structured fields instead of arbitrary string replacement where practical;
- explicit types/validation;
- deterministic compilation;
- semantic modules remain authoritative;
- AI suggestions may populate valid structure but must not bypass it;
- product page customization should reuse existing compiler/actions when semantics match.

Do not implement a second prompt compiler inside Marketplace pages.

---

# 7. Economy implications

Founder direction distinguishes free discovery from meaningful value extraction.

Examples of potentially chargeable value extraction:

- first unlock/copy of a paid Prompt;
- using a Template's personalization/finalization capability;
- repeated new personalization sessions where product economics justify it;
- future advanced Execution Layer actions.

Repeated copying of a product the user already unlocked should not automatically re-charge the same purchase cost.

Exact economy rules are defined later in commercial milestones and `PRICING_AND_INTERNAL_ECONOMY_V1.md`.

---

# 8. External tool handoff

Execution Layer may understand target-tool compatibility and provide appropriate handoff information, for example:

- intended model/tool;
- parameter hints;
- prompt syntax variant;
- usage instructions.

This is orchestration/preparation, not model execution.

---

# 9. Consumer abstraction

A consumer should interact with the intent and variables they understand.

The internal module graph may remain hidden unless the user intentionally enters an expert surface.

Conceptually:

```text
Consumer view: “What do you want?”
Internal system: semantic modules + wiring + compile rules
External output: finalized AI instruction
```

---

# 10. Reuse requirement

Before implementing an Execution Layer feature, audit:

- existing module definitions;
- compiler/output paths;
- centralized action system;
- Wizard action/state architecture;
- current `/create` variable/edit patterns;
- Global Menu/Modal UI systems;
- existing profile/product content APIs.

The Execution Layer must be an alternate use surface for the same engineering engine, not a parallel engine.
