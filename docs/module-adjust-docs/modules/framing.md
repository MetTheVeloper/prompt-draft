# Framing module

Module key: `framing`
Source: `app/modules/framing.module.ts`

## Real fields and built-ins

### `shotSize`
`detail`, `extreme_close_up`, `close_up`, `head_and_shoulders`, `bust`, `medium_subject`, `three_quarter_subject`, `full_subject`, `wide_full_subject`.

### `subjectPlacement`
`centered`, `off_center`, `rule_of_thirds`, `upper_frame`, `lower_frame`, `edge_weighted`.

### `balance`
`symmetrical`, `asymmetrical`.

### `compositionFeatures` (multi-select)
`negative_space`, `dynamic_diagonal`, `layered_depth`, `isolated_subject`.

### `viewAngle`
`eye_level`, `low_angle`, `high_angle`, `top_down`, `worms_eye`, `birds_eye`.

### `viewDirection`
`frontal`, `three_quarter`, `profile`, `rear`.

### `cropSafety` (multi-select)
`important_details`, `face`, `hands`, `silhouette`, `safe_margin`.

Applicability/compatibility matters: e.g. portrait-only shot sizes and crop-safety choices are tagged in source, and `cropSafety` depends on `shotSize` in `sort-and-hint` mode. Inspect current metadata before recommending a combination.

### `extraDetails`
Additive free textarea.

### `customText`
Global override (`isOverride: true`), discouraged.

## Custom policy

Current ordinary select/multi-select fields do not declare `customInput`. Do not invent Custom by field for Framing. Use real built-ins plus `extraDetails` for a missing compositional nuance. Use `customText` only as a last resort.