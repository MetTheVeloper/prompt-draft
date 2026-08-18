import type { LayoutRegion, LayoutRegionsState } from "./layout.types"
import type { ModulePreset } from "./types"
import { DEFAULT_LAYOUT_GRID_SIZE } from "../utils/layoutRegions"

function createRegion(
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  layer = 0,
): LayoutRegion {
  return {
    id: `region-${id}`,
    name,
    role: "none",
    contentKey: "",
    x,
    y,
    width,
    height,
    layer,
  }
}

function createTemplateState(regions: LayoutRegion[]): LayoutRegionsState {
  return {
    grid: {
      columns: DEFAULT_LAYOUT_GRID_SIZE,
      rows: DEFAULT_LAYOUT_GRID_SIZE,
    },
    regions,
  }
}

export const layoutTemplates = {
  full_bleed: {
    id: "full_bleed",
    order: 10,
    values: {
      regions: createTemplateState([
        createRegion("main", "main", 0, 0, 1, 1),
      ]),
    },
  },

  split_vertical: {
    id: "split_vertical",
    order: 20,
    values: {
      regions: createTemplateState([
        createRegion("left", "left", 0, 0, 0.5, 1),
        createRegion("right", "right", 0.5, 0, 0.5, 1),
      ]),
    },
  },

  split_horizontal: {
    id: "split_horizontal",
    order: 30,
    values: {
      regions: createTemplateState([
        createRegion("top", "top", 0, 0, 1, 0.5),
        createRegion("bottom", "bottom", 0, 0.5, 1, 0.5),
      ]),
    },
  },

  side_panel: {
    id: "side_panel",
    order: 40,
    values: {
      regions: createTemplateState([
        createRegion("main", "main", 0, 0, 0.72, 1),
        createRegion("side-panel", "side panel", 0.72, 0, 0.28, 1),
      ]),
    },
  },

  bottom_panel: {
    id: "bottom_panel",
    order: 50,
    values: {
      regions: createTemplateState([
        createRegion("main", "main", 0, 0, 1, 0.72),
        createRegion("bottom-panel", "bottom panel", 0, 0.72, 1, 0.28),
      ]),
    },
  },

  modular_grid: {
    id: "modular_grid",
    order: 60,
    values: {
      regions: createTemplateState([
        createRegion("top-left", "top left", 0, 0, 0.5, 0.5),
        createRegion("top-right", "top right", 0.5, 0, 0.5, 0.5),
        createRegion("bottom-left", "bottom left", 0, 0.5, 0.5, 0.5),
        createRegion("bottom-right", "bottom right", 0.5, 0.5, 0.5, 0.5),
      ]),
    },
  },

  feature_support: {
    id: "feature_support",
    order: 70,
    values: {
      regions: createTemplateState([
        createRegion("feature", "feature", 0, 0, 0.64, 1),
        createRegion("support-top", "support top", 0.64, 0, 0.36, 0.5),
        createRegion("support-bottom", "support bottom", 0.64, 0.5, 0.36, 0.5),
      ]),
    },
  },

  centered_stack: {
    id: "centered_stack",
    order: 80,
    values: {
      regions: createTemplateState([
        createRegion("top", "top", 0, 0, 1, 0.2),
        createRegion("center", "center", 0, 0.2, 1, 0.6),
        createRegion("bottom", "bottom", 0, 0.8, 1, 0.2),
      ]),
    },
  },

  layered_overlap: {
    id: "layered_overlap",
    order: 90,
    values: {
      regions: createTemplateState([
        createRegion("back", "back", 0.08, 0.08, 0.58, 0.72, 0),
        createRegion("middle", "middle", 0.24, 0.16, 0.58, 0.72, 1),
        createRegion("front", "front", 0.38, 0.28, 0.54, 0.64, 2),
      ]),
    },
  },
} satisfies Record<string, ModulePreset>
