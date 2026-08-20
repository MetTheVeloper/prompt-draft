# Stage 12 — Pose + Expression Semantics

## Status

**Semantically closed.**

The structured editors, relational compilers, subject-only assignment targeting, multi-subject behavior, Modular/Natural output preservation, and representative real image-generation scenarios have been validated successfully.

The final assignment-card reactivity issue was closed by using the same dynamic title/summary render-key pattern already used by Color Palette and Texture / Material assignment cards. Pose and Expression summaries now also cover all structured axes rather than only a partial subset.

Legacy migration remains deferred to the semantic review backlog and does not keep this schema open.

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

`SemanticTargetKind` supports `system_variable`, allowing `{subject}` to be represented as a stable relational target.

Missing subject targets remain preserved in saved assignment state and can be removed by the user.

## Duplicate target behavior

The same subject may technically appear in multiple Pose or Expression assignments, but the editor displays a warning because overlapping assignments may conflict.

The editor does not silently merge or delete assignments.

## Assignment-card summaries

Card titles summarize assignment recipients and react immediately when `Apply To` changes.

Card subtitles summarize the structured state for fast scanning:

### Pose summary sources

- base posture,
- torso posture,
- weight/balance,
- body tension,
- locomotion,
- gestures,
- interaction details,
- additional details.

### Expression summary sources

- core expression,
- intensity,
- eye state,
- brow state,
- mouth state,
- additional details.

Title and subtitle nodes use content-dependent render keys, matching the proven Color Palette and Texture / Material assignment-card reactivity pattern.

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

## Validation evidence

Stage 12 was validated with representative single- and multi-subject image-to-image prompts covering:

- distinct Pose assignments for multiple referenced subjects,
- distinct and strongly contrasting Expression assignments for multiple referenced subjects,
- subject-specific Color Palette assignments alongside Pose/Expression,
- object-specific Texture / Material assignments in the same prompts,
- reference-pose and reference-expression replacement semantics,
- structured sports/editorial scenes with competing context pressure,
- preservation of relational subject identity in compiled output.

The tests showed that remaining deviations such as action-context pressure, framing hiding body pose, or image-model interpretation of subtle facial mechanics are model/prompt-tension behavior rather than schema ownership defects.

## Legacy migration

Legacy `poseStyle`, `expressionStyle`, and global `extraDetails` migration is deferred to the semantic review backlog.

The new schema must not be polluted with old fashion/editorial/cinematic/character/use-case assumptions solely to preserve legacy prose.

## Closure rule

Stage 12 should not be reopened for wording micro-polish or ordinary image-model variance.

Reopen only if later testing reveals a concrete semantic ownership defect, relational target failure, compiler identity loss, or a reproducible structured-editor state bug.
