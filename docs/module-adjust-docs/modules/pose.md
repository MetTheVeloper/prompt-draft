# Pose module

Module key: `pose`
Sources: `app/modules/pose.freeform.ts`, `app/modules/pose.semantic.ts`

## Real top-level fields

### `poseAssignments`
Structured assignment editor. Each assignment targets semantic subjects and supports:

- `basePosture`: `standing`, `seated`, `kneeling`, `crouching`, `reclining`, `lying`.
- `torsoPosture`: `upright`, `leaning_forward`, `leaning_backward`, `leaning_sideways`, `hunched`, `twisted`, `arched`.
- `weightBalance`: `even`, `shifted`, `single_side_support`, `off_balance`.
- `bodyTension`: `relaxed`, `engaged`, `tense`, `rigid`, `loose`.
- `locomotion`: `walking`, `running`, `jumping`.
- `gestures` (multi): `arms_crossed`, `hands_at_sides`, `hand_on_hip`, `hands_in_pockets`, `open_arms`, `pointing`, `reaching`, `raised_arms`, `hands_on_knees`, `hands_clasped`.
- `interactionDetails`: free/additive interaction description.
- `additionalDetails`: additive pose description supported by the assignment contract.
- `targets`: semantic target refs.

Current preset ids: `neutral_standing`, `relaxed_standing`, `arms_crossed_standing`, `hand_on_hip`, `relaxed_seated`, `forward_seated`, `walking`, `running`, `action_ready`.

### `customText`
Global override (`isOverride: true`), discouraged.

## Recommendation rules

Prefer real assignment subfields. Use interaction/additional details for a missing nuance when available. Do not recommend a global override merely because the exact named pose is not a preset.