export default {
  "modules.framing.description":
    "Control how the subject is covered, placed, viewed, composed, and safely cropped inside the image frame. Camera optics, artifact layout, body pose, and visual style are handled by their own modules.",

  "modules.framing.groups.composition.title": "Frame Composition",
  "modules.framing.groups.composition.description":
    "Define subject coverage, placement, balance, and compositional features inside the frame.",

  "modules.framing.groups.view.title": "View",
  "modules.framing.groups.view.description":
    "Define the viewing angle and the direction from which the subject is seen, without changing lens characteristics or body pose.",

  "modules.framing.groups.crop.title": "Crop Safety",
  "modules.framing.groups.crop.description":
    "Protect important subject areas from unintended cropping.",

  "modules.framing.groups.advanced.title": "Advanced Details",
  "modules.framing.groups.advanced.description":
    "Add optional framing instructions that are not covered by the structured controls.",

  "modules.framing.groups.override.title": "Custom Override",
  "modules.framing.groups.override.description":
    "Replace the generated framing output with your own framing text.",

  "modules.framing.fields.shotSize.label": "Shot Size",
  "modules.framing.fields.shotSize.description":
    "Choose how much of the subject should be visible inside the frame.",
  "modules.framing.fields.shotSize.placeholder": "Select shot size",
  "modules.framing.fields.shotSize.options.detail": "Detail",
  "modules.framing.fields.shotSize.options.extreme_close_up": "Extreme Close-Up",
  "modules.framing.fields.shotSize.options.close_up": "Close-Up",
  "modules.framing.fields.shotSize.options.head_and_shoulders": "Head & Shoulders",
  "modules.framing.fields.shotSize.options.bust": "Bust",
  "modules.framing.fields.shotSize.options.medium_subject": "Medium Subject",
  "modules.framing.fields.shotSize.options.three_quarter_subject": "Most of Subject",
  "modules.framing.fields.shotSize.options.full_subject": "Full Subject",
  "modules.framing.fields.shotSize.options.wide_full_subject": "Wide Full Subject",

  "modules.framing.fields.subjectPlacement.label": "Subject Placement",
  "modules.framing.fields.subjectPlacement.description":
    "Choose the primary placement strategy for the subject or focal subject inside the frame.",
  "modules.framing.fields.subjectPlacement.placeholder": "Select subject placement",
  "modules.framing.fields.subjectPlacement.options.centered": "Centered",
  "modules.framing.fields.subjectPlacement.options.off_center": "Off Center",
  "modules.framing.fields.subjectPlacement.options.rule_of_thirds": "Rule of Thirds",
  "modules.framing.fields.subjectPlacement.options.upper_frame": "Upper Frame",
  "modules.framing.fields.subjectPlacement.options.lower_frame": "Lower Frame",
  "modules.framing.fields.subjectPlacement.options.edge_weighted": "Edge Weighted",

  "modules.framing.fields.balance.label": "Frame Balance",
  "modules.framing.fields.balance.description":
    "Choose whether the overall frame balance is symmetrical or asymmetrical.",
  "modules.framing.fields.balance.placeholder": "Select frame balance",
  "modules.framing.fields.balance.options.symmetrical": "Symmetrical",
  "modules.framing.fields.balance.options.asymmetrical": "Asymmetrical",

  "modules.framing.fields.compositionFeatures.label": "Composition Features",
  "modules.framing.fields.compositionFeatures.description":
    "Add compatible compositional features that can coexist with the selected placement and balance.",
  "modules.framing.fields.compositionFeatures.placeholder": "Select composition features",
  "modules.framing.fields.compositionFeatures.options.negative_space": "Negative Space",
  "modules.framing.fields.compositionFeatures.options.dynamic_diagonal": "Dynamic Diagonal",
  "modules.framing.fields.compositionFeatures.options.layered_depth": "Layered Depth",
  "modules.framing.fields.compositionFeatures.options.isolated_subject": "Isolated Subject",

  "modules.framing.fields.viewAngle.label": "View Angle",
  "modules.framing.fields.viewAngle.description":
    "Choose the vertical or overhead angle from which the subject is viewed. Lens and camera characteristics remain separate.",
  "modules.framing.fields.viewAngle.placeholder": "Select view angle",
  "modules.framing.fields.viewAngle.options.eye_level": "Eye Level",
  "modules.framing.fields.viewAngle.options.low_angle": "Low Angle",
  "modules.framing.fields.viewAngle.options.high_angle": "High Angle",
  "modules.framing.fields.viewAngle.options.top_down": "Top Down",
  "modules.framing.fields.viewAngle.options.worms_eye": "Worm's-Eye",
  "modules.framing.fields.viewAngle.options.birds_eye": "Bird's-Eye",

  "modules.framing.fields.viewDirection.label": "View Direction",
  "modules.framing.fields.viewDirection.description":
    "Choose the direction from which the subject is seen. This describes viewpoint rather than forcing a body pose.",
  "modules.framing.fields.viewDirection.placeholder": "Select view direction",
  "modules.framing.fields.viewDirection.options.frontal": "Front",
  "modules.framing.fields.viewDirection.options.three_quarter": "Three-Quarter",
  "modules.framing.fields.viewDirection.options.profile": "Side",
  "modules.framing.fields.viewDirection.options.rear": "Rear",

  "modules.framing.fields.cropSafety.label": "Protected Crop Areas",
  "modules.framing.fields.cropSafety.description":
    "Select subject areas that should remain fully visible and protected from unintended cropping.",
  "modules.framing.fields.cropSafety.placeholder": "Select protected areas",
  "modules.framing.fields.cropSafety.options.important_details": "Important Details",
  "modules.framing.fields.cropSafety.options.face": "Face",
  "modules.framing.fields.cropSafety.options.hands": "Hands",
  "modules.framing.fields.cropSafety.options.silhouette": "Complete Silhouette",
  "modules.framing.fields.cropSafety.options.safe_margin": "Safe Margin",
  "modules.framing.fields.cropSafety.compatibilityWarnings.handsNeedMoreCoverage":
    "This crop is usually too tight to keep the hands fully visible. Choose a wider shot or remove Hands from crop safety.",
  "modules.framing.fields.cropSafety.compatibilityWarnings.silhouetteNeedsFullSubject":
    "Complete Silhouette conflicts with a partial or close crop. Use Full Subject or Wide Full Subject if the whole silhouette must remain visible.",

  "modules.framing.fields.extraDetails.label": "Extra Framing Details",
  "modules.framing.fields.extraDetails.description":
    "Add only framing-specific instructions that are not already expressed by the controls above.",
  "modules.framing.fields.extraDetails.placeholder": "Add optional framing details...",

  "modules.framing.fields.customText.label": "Custom Framing Text",
  "modules.framing.fields.customText.description":
    "Write your own framing text and replace the generated framing output.",
  "modules.framing.fields.customText.placeholder": "Write your custom framing text...",
} as const
