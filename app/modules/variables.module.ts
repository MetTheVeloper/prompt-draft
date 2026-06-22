import type { PromptKeyModule } from "./types";

const variableTypeOptions = [
  {
    value: "text",
    promptText: "text value",
    tags: ["variable", "text"],
  },
  {
    value: "subject",
    promptText: "subject reference",
    tags: ["variable", "subject"],
  },
  {
    value: "reference",
    promptText: "attached reference",
    tags: ["variable", "reference"],
  },
  {
    value: "object",
    promptText: "object reference",
    tags: ["variable", "object"],
  },
  {
    value: "color",
    promptText: "color value",
    tags: ["variable", "color"],
  },
  {
    value: "custom",
    promptText: "custom value",
    tags: ["variable", "custom"],
  },
];

export const VariablesModule: PromptKeyModule = {
  key: "variables",
  icon: "code",

  groups: {
    core: { id: "core", order: 10, defaultOpen: true },
  },

  fields: {
    variables: {
      id: "variables",
      type: "variables",
      default: [],
      group: "core",
      order: 10,
      ui: {
        component: "variables",
        width: "full",
      },
      config: {
        typeOptions: variableTypeOptions,
        reservedPatterns: ["text_*", "text_group_*"],
        supportVariables: false,
      },
    },
  },

  compile: {
    separator: "\n",
    removeDuplicates: false,
    ignoreEmpty: true,
  },
};
