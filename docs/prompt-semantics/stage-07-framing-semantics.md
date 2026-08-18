# Stage 07 — Framing Semantics

## Status
Closed after semantic, taxonomy, natural-output, compatibility, and cross-module validation tests.

## Ownership
Framing owns how a subject is covered, placed, viewed, composed, and safely cropped inside an image frame.

Framing does not own:

- camera/lens capture characteristics — Camera
- artifact/page structure — Layout
- aspect ratio and reference-preservation settings — Setup
- body posture, gesture, limb placement, and body language — Pose
- visual/aesthetic treatment — Style

## Final field model

```text
Framing
├─ Frame Composition
│  ├─ Shot Size
│  ├─ Subject Placement
│  ├─ Frame Balance
│  └─ Composition Features [multi-select]
├─ View
│  ├─ View Angle
│  └─ View Direction
├─ Crop Safety
│  └─ Protected Crop Areas [multi-select]
├─ Advanced Details
│  └─ Extra Framing Details
└─ Custom Override
   └─ Custom Framing Text
```

All structured fields are neutral by default.

## Taxonomy decisions

### Shot Size
Represents how much of the subject is visible in the frame. Person-specific options use subject applicability; universal options remain available for other subject types.

### Subject Placement
Represents the subject's position in the frame. Negative Space was removed from this axis because it can coexist with placement choices such as Rule of Thirds.

### Frame Balance
Symmetrical and Asymmetrical are a dedicated exclusive balance axis rather than composition-feature choices.

### Composition Features
Composition features are independently combinable and therefore use multi-select:

- intentional negative space
- dynamic diagonal composition
- layered depth
- isolated subject

### View Angle
Represents vertical/overhead viewpoint and remains independent from lens behavior.

### View Direction
Represents the direction from which the subject is seen, not a body-pose instruction. It is universal rather than restricted to a fixed list of subject types.

### Crop Safety
Represents visibility constraints, not shot-size selection. It supports multiple simultaneous protections.

## Compatibility behavior

Crop-safety options use the generic field compatibility system against Shot Size.

Examples verified:

- Close-Up + Complete Silhouette → warning
- Full Subject + Complete Silhouette → no warning
- Head & Shoulders + Hands → warning
- Full Subject + Hands → no warning

Warnings are advisory; selected values are not silently removed.

## Compile behavior

Framing remains a string-output module. No structured-object compiler is required.

Explicit field order:

```text
shot size
→ subject placement
→ frame balance
→ composition features
→ view angle
→ view direction
→ crop safety
→ extra details
```

The modular output remains compact and faithful.

Example:

```text
{framing} = full-subject framing, rule-of-thirds subject placement, asymmetrical frame balance, intentional negative space around the subject, layered foreground-midground-background composition, isolated-subject composition with minimal competing elements, low-angle view, side view of the subject, preserve the complete readable silhouette within the frame, keep additional margin around the visible subject area, preserve important subject details within the frame
```

## Natural output

The generic Natural optimizer was updated so Framing's new multi-axis wording is classified as one Framing group instead of being split into Pose, Background, Camera, or Other groups.

The Framing group limit was increased to 20 to prevent semantic loss in fully populated Framing configurations.

Verified Natural output preserves the same semantic set as Modular without artificial internal semicolon grouping.

## Subject applicability

Verified behavior:

- Person-only options such as Head & Shoulders, Bust, and Hands are filtered for incompatible subject types.
- Face is limited to subjects for which the control is meaningful.
- Universal framing options remain available across subject types.
- Previously selected subject-specific values remain visible so applicability warnings can be surfaced rather than silently deleting state.

## Cross-module boundaries

### Framing ↔ Pose
Boundary is considered healthy:

- Framing owns viewpoint, crop, placement, and frame geometry.
- Pose owns posture, gesture, limbs, body direction mechanics, and body language.

No Pose patch was required during this stage.

### Framing ↔ Camera
The new Framing taxonomy no longer contains lens/camera-distance semantics.

Legacy Camera options still contain some viewpoint/composition wording (for example top-down, frontal, or dramatic-composition implications). These overlaps belong to the future Camera semantic refactor and are tracked in the review backlog rather than worked around inside Framing.

### Framing ↔ Setup
Image-to-image Setup can preserve the original composition while Framing requests a new composition/viewpoint. This is now handled as explicit prompt-level validation.

A warning is produced when:

- mode is image-to-image,
- Preserve Composition is enabled,
- and Framing contains composition-changing fields.

Crop-safety-only Framing does not trigger the warning.

No setting is silently disabled or overridden.

## Validation verified

Verified tests:

1. Neutral Framing produces no Framing output.
2. Multiple Framing axes compile simultaneously.
3. Natural output preserves more than five simultaneous Framing semantics.
4. Subject applicability works for Person vs non-Person subjects.
5. Composition Balance and Composition Features combine independently.
6. Crop compatibility warnings appear and clear correctly.
7. Natural optimizer keeps all Framing semantics in one group.
8. Preserve Composition + composition-changing Framing produces a prompt-level warning.
9. Disabling Preserve Composition clears that warning.
10. Preserve Composition + crop-safety-only Framing does not warn.

## Remaining review backlog

Framing-local semantics are closed. Remaining related work is intentionally tracked outside this stage:

- legacy `framingStyle` draft migration
- Camera options that embed viewpoint/composition semantics
- replacing the generic native multi-select UI with the project component system

See:

```text
docs/prompt-semantics/review-backlog/README.md
```

## Closure

Framing is considered semantically closed for the current architecture.

Future changes should preserve these ownership boundaries and should not reintroduce camera optics, artifact layout intent, body-pose mechanics, or visual-style semantics into Framing.
