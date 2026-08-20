# Stage 12 — Pose + Expression Semantics

## Status

Implemented for structured editor and compiler review. Real UI/output/image-generation validation is still required before semantic closure.

## Responsibility contracts

### Pose

Pose defines the physical body configuration, movement, gestures, and physical interaction of semantic subjects.

Pose does not own:

- camera or subject viewpoint,
- framing or composition,
- facial expression,
- visual style or use-case,
- character archetype or narrative interpretation.

### Expression

Expression defines the visible facial expression of semantic subjects, including affect, intensity, and observable eye/brow/mouth state.

Expression does not own:

- body pose or gesture,
- cinematic/editorial/cute/fantasy style,
- commercial/professional purpose,
- character archetype,
- scene narrative or scenario assumptions.

## Relational assignment model

Both modules use repeated subject-scoped assignments rather than one global mega-select.

Eligible assignment recipients are intentionally narrow:

- system `{subject}` when Setup describes a pose/expression-capable subject,
- enabled user variables with `type: "subject"`.

Objects, references, typography, layout regions, module outputs, and arbitrary custom targets are not Pose/Expression recipients.

Objects and other variables can still participate inside payload details, for example:

```text
{hero}: holding {sword}
{hero}: leaning against {car}
```

Here `{hero}` is the assignment recipient while `{sword}` and `{car}` are interaction participants.

## Pose schema

```text
poseAssignments[]
├── presetId
├── targets[]
├── basePosture
├── torsoPosture
├── weightBalance
├── bodyTension
├── locomotion
├── gestures[]
├── interactionDetails
└── additionalDetails
```

The axes are intentionally orthogonal. A seated pose can also lean forward, use relaxed body tension, and place hands on the knees without requiring a prose bundle.

Pose presets are editable state recipes. Preset names are not emitted as prompt semantics.

## Expression schema

```text
expressionAssignments[]
├── presetId
├── targets[]
├── coreExpression
├── intensity
├── eyeState
├── browState
├── mouthState
└── additionalDetails
```

The schema separates affect from physical facial mechanics. For example, surprise can be subtle or pronounced and can independently specify wide eyes, raised brows, or an open mouth.

Expression presets are editable state recipes. Preset names are not emitted as prompt semantics.

## Source/reference replacement semantics

When the active prompt contains a system `{reference}` variable, structured Pose and Expression output explicitly replaces source/reference state:

```text
• {subject}: replace the source/reference pose with standing; relaxed body tension
• {subject}: replace the source/reference facial expression with happy expression; subtle intensity; slight smile
```

Without a reference, the replacement prefix is omitted.

This is compiler/context behavior rather than a user-selectable semantic field.

## Assignment target infrastructure

Stage 12 reuses the shared `SemanticTargetRef` identity model but introduces a dedicated subject-only target catalog instead of forcing Pose/Expression through the broad Color/Material target policy.

`SemanticTargetKind` now supports `system_variable`, allowing `{subject}` to be represented as a stable relational target.

Missing subject targets remain preserved in saved assignment state and can be removed by the user.

## Duplicate target behavior

The same subject may technically appear in multiple Pose or Expression assignments, but the editor displays a warning because overlapping assignments may conflict.

The editor does not silently merge or delete assignments.

## Custom override

Both modules retain module-level `customText` as an explicit escape hatch. Structured assignments are bypassed while custom mode is active.

The old global `extraDetails` field is not retained. Additional details now belong to individual assignments so they remain attached to the correct subject.

## Compiler output

Structured output is emitted as protected bullet blocks, preserving subject-to-payload relationships in Modular and Natural output.

Example:

```text
Pose:
• {hero}: standing; weight shifted to one side; one hand on the hip
• {villain}: seated; torso leaning forward; hands on knees

Expression:
• {hero}: happy expression; subtle intensity; relaxed eyes; slight smile
• {villain}: angry expression; pronounced intensity; narrowed eyes; furrowed brows; gritted teeth
```

Natural output keeps these blocks protected from comma-based flattening/optimization.

## Cross-module validation

In image-to-image mode:

```text
Setup: Preserve Pose = true
+
active Pose output
```

produces an advisory warning. Neither setting is silently mutated.

## Legacy migration

Legacy `poseStyle`, `expressionStyle`, and global `extraDetails` migration is deferred to the semantic review backlog.

The new schema must not be polluted with old fashion/editorial/cinematic/character/use-case assumptions solely to preserve legacy prose.

## Validation required before closure

1. Verify system `{subject}` appears for person/animal/custom-compatible Setup subjects and does not appear for object/product/vehicle/building/scene subjects.
2. Verify only user variables with `type: "subject"` appear as additional recipients.
3. Verify multiple Pose assignments can target different subjects and compile to separate bullet lines.
4. Verify multiple Expression assignments can target different subjects and compile to separate bullet lines.
5. Verify duplicate-target warnings are shown without blocking edits.
6. Verify deleted subject variables become removable Missing references rather than silently disappearing.
7. Verify Pose presets populate editable axes and detach after manual edits.
8. Verify Expression presets populate editable axes and detach after manual edits.
9. Verify Pose interaction/details fields support variable insertion.
10. Verify text-to-image output does not mention replacing a source/reference.
11. Verify image-to-image output explicitly replaces source/reference pose/expression.
12. Verify Preserve Pose + active Pose output shows the advisory validation warning.
13. Verify Modular output preserves target tokens and assignment identity.
14. Verify Natural output preserves Pose and Expression as protected bullet blocks.
15. Verify JSON output contains the compiled module blocks without losing target tokens.
16. Verify Custom Override replaces structured output and empty custom mode raises the existing blocking validation error.
17. Validate representative multi-subject prompts with real image generation before declaring Stage 12 semantically closed.
