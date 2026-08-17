import type { PromptKeyModule } from "./types"
import { DEFAULT_LAYOUT_GRID_SIZE } from "../utils/layoutRegions"

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
      default: "poster",
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
        clearable: false,
        width: "half",
      },
    },

    composition: {
      id: "composition",
      type: "select",
      group: "structure",
      order: 20,
      default: "single_focal",
      options: [
        { value: "single_focal", promptText: "single focal composition" },
        { value: "centered_stack", promptText: "centered stacked composition" },
        { value: "split_vertical", promptText: "vertical split composition" },
        { value: "split_horizontal", promptText: "horizontal split composition" },
        { value: "image_with_side_panel", promptText: "image with side information panel" },
        { value: "image_with_bottom_panel", promptText: "image with bottom information panel" },
        { value: "modular_grid", promptText: "modular grid composition" },
        { value: "asymmetric_editorial", promptText: "asymmetric editorial composition" },
        { value: "layered_collage", promptText: "layered collage composition" },
        { value: "comic_panels", promptText: "multi-panel comic composition" },
        { value: "full_bleed", promptText: "full-bleed composition" },
        { value: "freeform", promptText: "freeform composition" },
      ],
      ui: {
        component: "select",
        clearable: false,
        width: "half",
      },
    },

    density: {
      id: "density",
      type: "select",
      group: "structure",
      order: 30,
      default: "balanced",
      options: [
        { value: "sparse", promptText: "sparse visual density" },
        { value: "balanced", promptText: "balanced visual density" },
        { value: "dense", promptText: "dense visual density" },
        { value: "maximal", promptText: "maximal visual density" },
      ],
      ui: {
        component: "select",
        clearable: false,
        width: "half",
      },
    },

    hierarchy: {
      id: "hierarchy",
      type: "select",
      group: "structure",
      order: 40,
      default: "balanced",
      options: [
        { value: "image_dominant", promptText: "image-dominant hierarchy" },
        { value: "text_dominant", promptText: "text-dominant hierarchy" },
        { value: "balanced", promptText: "balanced image and text hierarchy" },
        { value: "product_dominant", promptText: "product-dominant hierarchy" },
        { value: "information_dominant", promptText: "information-dominant hierarchy" },
      ],
      ui: {
        component: "select",
        clearable: false,
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

  compile: {
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
} satisfies PromptKeyModule
