import type { PromptKeyModule } from "./types"
import { DEFAULT_LAYOUT_GRID_SIZE } from "../utils/layoutRegions"
import { layoutTemplates } from "./layout.templates"

export const LayoutModule = {
  key: "layout",
  icon: "grid_view",

  groups: {
    structure: {
      id: "structure",
      order: 10,
      defaultOpen: true,
    },
    regions: {
      id: "regions",
      order: 20,
      defaultOpen: true,
    },
    advanced: {
      id: "advanced",
      order: 30,
      defaultOpen: false,
    },
    override: {
      id: "override",
      order: 40,
      defaultOpen: false,
    },
  },

  fields: {
    layoutType: {
      id: "layoutType",
      type: "select",
      group: "structure",
      order: 10,
      default: "",
      options: [
        { value: "poster", promptText: "poster layout" },
        { value: "banner", promptText: "banner layout" },
        { value: "business_card", promptText: "business card layout" },
        { value: "social_post", promptText: "social media post layout" },
        { value: "cover", promptText: "cover layout" },
        { value: "editorial_page", promptText: "editorial page layout" },
        { value: "collage", promptText: "collage layout" },
        { value: "comic_page", promptText: "comic-book page layout" },
        { value: "product_sheet", promptText: "product sheet layout" },
        { value: "presentation_slide", promptText: "presentation slide layout" },
        { value: "custom", promptText: "custom layout" },
      ],
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },

    density: {
      id: "density",
      type: "select",
      group: "structure",
      order: 20,
      default: "",
      options: [
        { value: "sparse", promptText: "sparse visual density" },
        { value: "balanced", promptText: "balanced visual density" },
        { value: "dense", promptText: "dense visual density" },
        { value: "maximal", promptText: "maximal visual density" },
      ],
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },

    regions: {
      id: "regions",
      type: "layoutRegions",
      group: "regions",
      order: 10,
      default: {
        grid: {
          columns: DEFAULT_LAYOUT_GRID_SIZE,
          rows: DEFAULT_LAYOUT_GRID_SIZE,
        },
        regions: [],
      },
      ui: {
        component: "layoutRegions",
        width: "full",
      },
    },

    extraDetails: {
      id: "extraDetails",
      type: "textarea",
      group: "advanced",
      order: 10,
      default: "",
      ui: {
        component: "textarea",
        rows: 4,
        width: "full",
      },
    },

    customText: {
      id: "customText",
      type: "textarea",
      group: "override",
      order: 10,
      default: "",
      isOverride: true,
      ui: {
        component: "textarea",
        rows: 5,
        width: "full",
      },
    },
  },

  presets: layoutTemplates,

  presetUi: {
    component: "select",
    group: "structure",
    allowNone: true,
    resetOnNone: false,
  },

  compile: {
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
} satisfies PromptKeyModule
