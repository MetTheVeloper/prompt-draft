# Expression module

Module key: `expression`
Sources: `app/modules/expression.freeform.ts`, `app/modules/expression.semantic.ts`

## Real top-level fields

### `expressionAssignments`
Structured assignment editor. Each assignment targets one or more semantic subjects and supports the real nested fields below.

- `coreExpression`: `neutral`, `happy`, `joyful`, `serious`, `determined`, `angry`, `sad`, `melancholic`, `fearful`, `surprised`, `confused`, `disgusted`, `smug`, `curious`, `sleepy`.
- `intensity`: `subtle`, `moderate`, `pronounced`, `exaggerated`.
- `eyeState`: `relaxed`, `soft`, `narrowed`, `wide`, `squinting`, `closed`.
- `browState`: `relaxed`, `raised`, `furrowed`, `lowered`.
- `mouthState`: `neutral`, `slight_smile`, `smile`, `broad_smile`, `smirk`, `frown`, `open`, `gritted_teeth`, `pursed_lips`.
- `additionalDetails`: free/additive description inside an assignment when supported by the editor contract.
- `targets`: semantic target refs; never invent target ids.

Current preset ids: `neutral_calm`, `gentle_smile`, `warm_smile`, `joyful`, `determined`, `furious`, `sad_soft`, `shocked`, `sleepy`.

### `customText`
Global override (`isOverride: true`), discouraged.

## Recommendation rules

Prefer a preset only when it matches closely; otherwise configure assignment subfields directly. Use `additionalDetails` for a missing nuance rather than replacing the whole module. Read the registered freeform wrapper before claiming any additional field-level custom capability.