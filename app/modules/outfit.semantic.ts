import type { PromptKeyModule } from "./types";

export const OutfitModule: PromptKeyModule = {
  key: "outfit",
  icon: "content_paste",

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
    outfitSets: {
      id: "outfitSets",
      type: "outfitSets",
      default: [],
      group: "designer",
      order: 10,
      ui: {
        component: "outfitSets",
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
