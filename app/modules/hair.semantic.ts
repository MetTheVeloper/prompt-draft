import type { PromptKeyModule } from "./types";

export const HairModule: PromptKeyModule = {
  key: "hair",
  icon: "face_retouching_natural",

  groups: {
    designer: {
      id: "designer",
      order: 10,
      defaultOpen: true,
    },
    override: {
      id: "override",
      order: 20,
      defaultOpen: false,
    },
  },

  fields: {
    hairStyles: {
      id: "hairStyles",
      type: "hairStyles",
      default: [],
      group: "designer",
      order: 10,
      ui: {
        component: "hairStyles",
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
    overrideField: "customText",
  },

  semanticTargets: {
    exposeOutput: true,
    capabilities: ["color", "material"],
  },
};
