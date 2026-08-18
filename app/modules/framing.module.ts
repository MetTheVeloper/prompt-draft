import type { ModuleFieldOption, PromptKeyModule } from "./types"

const shotSizeOptions: ModuleFieldOption[] = [
  {
    value: "detail",
    promptText: "detail-focused framing",
    tags: ["framing", "detail", "close", "tight-crop"],
  },
  {
    value: "extreme_close_up",
    promptText: "extreme close-up framing",
    tags: ["framing", "extreme-close-up", "detail", "tight-crop"],
  },
  {
    value: "close_up",
    promptText: "close-up framing",
    tags: ["framing", "close-up", "tight-crop"],
  },
  {
    value: "head_and_shoulders",
    promptText: "head-and-shoulders framing",
    tags: ["framing", "portrait", "head", "shoulders", "portrait-crop"],
    appliesTo: ["person"],
  },
  {
    value: "bust",
    promptText: "bust framing",
    tags: ["framing", "portrait", "bust", "upper-body-crop"],
    appliesTo: ["person"],
  },
  {
    value: "medium_subject",
    promptText: "medium subject framing",
    tags: ["framing", "medium", "subject", "partial-crop"],
  },
  {
    value: "three_quarter_subject",
    promptText: "most of the subject visible within the frame",
    tags: ["framing", "subject", "mostly-visible"],
  },
  {
    value: "full_subject",
    promptText: "full-subject framing",
    tags: ["framing", "full-subject", "complete", "full-visible"],
  },
  {
    value: "wide_full_subject",
    promptText: "wide full-subject framing with surrounding space",
    tags: ["framing", "full-subject", "wide", "space", "full-visible", "safe-space"],
  },
]

const subjectPlacementOptions: ModuleFieldOption[] = [
  {
    value: "centered",
    promptText: "centered subject placement",
    tags: ["framing", "centered", "placement"],
  },
  {
    value: "off_center",
    promptText: "off-center subject placement",
    tags: ["framing", "off-center", "placement"],
  },
  {
    value: "rule_of_thirds",
    promptText: "rule-of-thirds subject placement",
    tags: ["framing", "rule-of-thirds", "placement"],
  },
  {
    value: "upper_frame",
    promptText: "subject placed toward the upper frame",
    tags: ["framing", "upper-frame", "placement"],
  },
  {
    value: "lower_frame",
    promptText: "subject placed toward the lower frame",
    tags: ["framing", "lower-frame", "placement"],
  },
  {
    value: "edge_weighted",
    promptText: "edge-weighted subject placement",
    tags: ["framing", "edge", "asymmetry", "placement"],
  },
]

const balanceOptions: ModuleFieldOption[] = [
  {
    value: "symmetrical",
    promptText: "symmetrical frame balance",
    tags: ["framing", "symmetrical", "balance"],
  },
  {
    value: "asymmetrical",
    promptText: "asymmetrical frame balance",
    tags: ["framing", "asymmetrical", "balance"],
  },
]

const compositionFeatureOptions: ModuleFieldOption[] = [
  {
    value: "negative_space",
    promptText: "intentional negative space around the subject",
    tags: ["framing", "negative-space", "composition"],
  },
  {
    value: "dynamic_diagonal",
    promptText: "dynamic diagonal frame composition",
    tags: ["framing", "diagonal", "dynamic", "composition"],
  },
  {
    value: "layered_depth",
    promptText: "layered foreground-midground-background composition",
    tags: ["framing", "layered", "depth", "composition"],
  },
  {
    value: "isolated_subject",
    promptText: "isolated-subject composition with minimal competing elements",
    tags: ["framing", "isolated", "subject", "composition"],
  },
]

const viewAngleOptions: ModuleFieldOption[] = [
  {
    value: "eye_level",
    promptText: "eye-level view",
    tags: ["framing", "eye-level", "angle"],
  },
  {
    value: "low_angle",
    promptText: "low-angle view",
    tags: ["framing", "low-angle", "angle"],
  },
  {
    value: "high_angle",
    promptText: "high-angle view",
    tags: ["framing", "high-angle", "angle"],
  },
  {
    value: "top_down",
    promptText: "direct top-down view",
    tags: ["framing", "top-down", "overhead", "angle"],
  },
  {
    value: "worms_eye",
    promptText: "extreme worm's-eye view",
    tags: ["framing", "worms-eye", "low-angle", "angle"],
  },
  {
    value: "birds_eye",
    promptText: "elevated bird's-eye view",
    tags: ["framing", "birds-eye", "overhead", "angle"],
  },
]

const viewDirectionOptions: ModuleFieldOption[] = [
  {
    value: "frontal",
    promptText: "front view of the subject",
    tags: ["framing", "front", "direction"],
  },
  {
    value: "three_quarter",
    promptText: "three-quarter view of the subject",
    tags: ["framing", "three-quarter", "direction"],
  },
  {
    value: "profile",
    promptText: "side view of the subject",
    tags: ["framing", "side-view", "direction"],
  },
  {
    value: "rear",
    promptText: "rear view of the subject",
    tags: ["framing", "rear", "back-view", "direction"],
  },
]

const cropSafetyOptions: ModuleFieldOption[] = [
  {
    value: "important_details",
    promptText: "preserve important subject details within the frame",
    tags: ["framing", "crop", "details", "safe"],
  },
  {
    value: "face",
    promptText: "preserve the face fully within the frame",
    tags: ["framing", "crop", "face", "safe"],
    appliesTo: ["person", "animal"],
    compatibility: {
      preferredTags: ["tight-crop", "portrait-crop", "upper-body-crop"],
    },
  },
  {
    value: "hands",
    promptText: "preserve the hands fully within the frame",
    tags: ["framing", "crop", "hands", "safe"],
    appliesTo: ["person"],
    compatibility: {
      preferredTags: ["partial-crop", "mostly-visible", "full-visible"],
      discouragedTags: ["tight-crop", "portrait-crop"],
      warningKey:
        "modules.framing.fields.cropSafety.compatibilityWarnings.handsNeedMoreCoverage",
    },
  },
  {
    value: "silhouette",
    promptText: "preserve the complete readable silhouette within the frame",
    tags: ["framing", "crop", "silhouette", "safe"],
    compatibility: {
      preferredTags: ["full-visible"],
      discouragedTags: [
        "tight-crop",
        "portrait-crop",
        "upper-body-crop",
        "partial-crop",
        "mostly-visible",
      ],
      warningKey:
        "modules.framing.fields.cropSafety.compatibilityWarnings.silhouetteNeedsFullSubject",
    },
  },
  {
    value: "safe_margin",
    promptText: "keep additional margin around the visible subject area",
    tags: ["framing", "crop", "margin", "safe"],
    compatibility: {
      preferredTags: ["safe-space", "full-visible"],
    },
  },
]

export const FramingModule = {
  key: "framing",
  icon: "crop",

  groups: {
    composition: {
      id: "composition",
      order: 10,
      defaultOpen: true,
    },
    view: {
      id: "view",
      order: 20,
      defaultOpen: true,
    },
    crop: {
      id: "crop",
      order: 30,
      defaultOpen: false,
    },
    advanced: {
      id: "advanced",
      order: 40,
      defaultOpen: false,
    },
    override: {
      id: "override",
      order: 50,
      defaultOpen: false,
    },
  },

  fields: {
    shotSize: {
      id: "shotSize",
      type: "select",
      default: "",
      group: "composition",
      order: 10,
      options: shotSizeOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },

    subjectPlacement: {
      id: "subjectPlacement",
      type: "select",
      default: "",
      group: "composition",
      order: 20,
      options: subjectPlacementOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },

    balance: {
      id: "balance",
      type: "select",
      default: "",
      group: "composition",
      order: 30,
      options: balanceOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },

    compositionFeatures: {
      id: "compositionFeatures",
      type: "multiSelect",
      default: [],
      group: "composition",
      order: 40,
      options: compositionFeatureOptions,
      ui: {
        component: "multiSelect",
        clearable: true,
        width: "full",
      },
    },

    viewAngle: {
      id: "viewAngle",
      type: "select",
      default: "",
      group: "view",
      order: 10,
      options: viewAngleOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },

    viewDirection: {
      id: "viewDirection",
      type: "select",
      default: "",
      group: "view",
      order: 20,
      options: viewDirectionOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },

    cropSafety: {
      id: "cropSafety",
      type: "multiSelect",
      default: [],
      group: "crop",
      order: 10,
      options: cropSafetyOptions,
      ui: {
        component: "multiSelect",
        clearable: true,
        width: "full",
        compatibility: {
          dependsOn: "shotSize",
          mode: "sort-and-hint",
        },
      },
    },

    extraDetails: {
      id: "extraDetails",
      type: "textarea",
      default: "",
      group: "advanced",
      order: 10,
      ui: {
        component: "textarea",
        rows: 3,
        width: "full",
      },
    },

    customText: {
      id: "customText",
      type: "textarea",
      default: "",
      group: "override",
      order: 10,
      isOverride: true,
      ui: {
        component: "textarea",
        rows: 4,
        width: "full",
      },
    },
  },

  compile: {
    fieldOrder: [
      "shotSize",
      "subjectPlacement",
      "balance",
      "compositionFeatures",
      "viewAngle",
      "viewDirection",
      "cropSafety",
      "extraDetails",
    ],
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
} satisfies PromptKeyModule
