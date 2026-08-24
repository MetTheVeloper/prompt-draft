import type { PromptKeyModule } from "./types";

export const SceneModule = {
  key: "scene",
  icon: "layers",

  groups: {
    scenes: { id: "scenes", order: 10, defaultOpen: true },
  },

  fields: {
    scenes: {
      id: "scenes",
      type: "sceneEntities",
      default: [],
      group: "scenes",
      order: 10,
    },
  },
} satisfies PromptKeyModule;
