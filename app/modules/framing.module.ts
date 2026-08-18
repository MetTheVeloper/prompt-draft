import type { ModuleFieldOption, PromptKeyModule } from "./types"

const shotSizeOptions: ModuleFieldOption[] = [
  {
    value: "detail",
    promptText: "detail-focused framing",
    tags: ["framing", "detail", "close"],
  },
  {
    value: "extreme_close_up",
    promptText: "extreme close-up framing",
    tags: ["framing", "extreme-close-up", "detail"],
  },
  {
    value: "close_up",
    promptText: "close-up framing",
    tags: ["framing", "close-up"],
  },
  {
    value: "head_and_shoulders",
    promptText: "head-and-shoulders framing",
    tags: ["framing", "portrait", "head", "shoulders"],
    appliesTo: ["person"],
  },
  {
    value: "bust",
    promptText: "bust framing",
    tags: ["framing", "portrait", "bust"],
    appliesTo: ["person"],
  },
  {
    value: "medium_subject",
    promptText: "medium subject framing",
    tags: ["framing", "medium", "subject"],
  },
  {
    value: "three_quarter_subject",
    promptText: "three-quarter subject framing",
    tags: ["framing", "three-quarter", "subject"],
  },
  {
    value: "full_subject",
    promptText: "full-subject framing",
    tags: ["framing", "full-subject", "complete"],
  },
  {
    value: "wide_full_subject",
    promptText: "wide full-subject framing with surrounding space",
    tags: ["framing", "full-subject", "wide", "space"],
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
  {
    value: "negative_space",
    promptText: "subject placement with intentional negative space",
    tags: ["framing", "negative-space", "placement"],
  },
]

const compositionOptions: ModuleFieldOption[] = [
  {
    value: "symmetrical",
    promptText: "symmetrical frame composition",
    tags: ["framing", "symmetrical", "composition"],
  },
  {
    value: "asymmetrical",
    promptText: "asymmetrical frame composition",
    tags: ["framing", "asymmetrical", "composition"],
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
    promptText: "frontal view of the subject",
    tags: ["framing", "frontal", "direction"],
    appliesTo: ["person", "animal", "object", "product", "vehicle", "building"],
  },
  {
    value: "three_quarter",
    promptText: "three-quarter view of the subject",
    tags: ["framing", "three-quarter", "direction"],
    appliesTo: ["person", "animal", "object", "product", "vehicle", "building"],
  },
  {
    value: "profile",
    promptText: "side-profile view of the subject",
    tags: ["framing", "profile", "side-view", "direction"],
    appliesTo: ["person", "animal", "object", "product", "vehicle", "building"],
  },
  {
    value: "rear",
    promptText: "rear view of the subject",
    tags: ["framing", "rear", "back-view", "direction"],
    appliesTo: ["person", "animal", "object", "product", "vehicle", "building"],
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
  },
  {
    value: "hands",
    promptText: "preserve the hands fully within the frame",
    tags: ["framing", "crop", "hands", "safe"],
    appliesTo: ["person"],
  },
  {
    value: "silhouette",
    promptText: "preserve the complete readable silhouette within the frame",
    tags: ["framing", "crop", "silhouette", "safe"],
  },
  {
    value: "safe_margin",
    promptText: "keep additional safe margin around the subject",
    tags: ["framing", "crop", "margin", "safe"],
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

    composition: {
      id: "composition",
      type: "select",
      default: "",
      group: "composition",
      order: 30,
      options: compositionOptions,
      ui: {
        component: "select",
        searchable: true,
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
      "composition",
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
