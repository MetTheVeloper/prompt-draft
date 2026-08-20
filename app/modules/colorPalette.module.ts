// app/modules/colorPalette.module.ts
import type { ModuleField, ModuleFieldOption, PromptKeyModule } from "./types";

function palette(
  value: string,
  category: string,
  categoryLabel: string,
  promptText: string,
  colors: string[],
  tags: string[] = [],
): ModuleFieldOption {
  return {
    value,
    category,
    categoryLabel,
    promptText,
    colors,
    tags: ["palette", ...tags],
  };
}

const colorPaletteAssignmentsOptions: ModuleFieldOption[] = [
  // General / Balanced
  palette(
    "monochrome_black_and_white",
    "general",
    "General / Balanced",
    "black-and-white monochrome palette",
    ["#0B0B0B", "#F5F5F5", "#8A8A8A"],
    ["general", "monochrome", "black-and-white"],
  ),
  palette(
    "grayscale_neutral_palette",
    "general",
    "General / Balanced",
    "neutral grayscale palette",
    ["#242424", "#666666", "#A8A8A8", "#E6E6E6"],
    ["general", "grayscale", "neutral"],
  ),
  palette(
    "soft_pastel_palette",
    "general",
    "General / Balanced",
    "soft pastel palette",
    ["#F6C7D0", "#F5D6A4", "#C9E4DE", "#C7D7F2", "#D8C8EA"],
    ["general", "pastel", "soft"],
  ),
  palette(
    "warm_earthy_palette",
    "general",
    "General / Balanced",
    "warm earthy palette",
    ["#6B4F3A", "#A66A3F", "#C98B5A", "#D8B08C", "#E7D7C5"],
    ["general", "warm", "earthy"],
  ),
  palette(
    "cool_muted_palette",
    "general",
    "General / Balanced",
    "cool muted palette",
    ["#40556A", "#6F8493", "#9AA9B3", "#C4CDD2"],
    ["general", "cool", "muted"],
  ),

  // Cinematic — category is for discovery only; prompt semantics remain color-only.
  palette(
    "teal_and_orange_palette",
    "cinematic",
    "Cinematic",
    "teal-and-orange palette",
    ["#0F6B78", "#2D8C91", "#D9792B", "#F2B36D"],
    ["cinematic", "teal", "orange"],
  ),
  palette(
    "desaturated_cinematic_palette",
    "cinematic",
    "Cinematic",
    "desaturated neutral color palette",
    ["#4E5860", "#73786F", "#9B8E7E", "#C1B6A5"],
    ["cinematic", "desaturated", "muted"],
  ),
  palette(
    "moody_blue_gray_palette",
    "cinematic",
    "Cinematic",
    "deep blue-gray palette",
    ["#1F2D3A", "#3E5265", "#6D7F8E", "#A9B4BC"],
    ["cinematic", "blue-gray"],
  ),
  palette(
    "golden_sunset_palette",
    "cinematic",
    "Cinematic",
    "golden amber-and-orange palette",
    ["#7C3F24", "#C96A2B", "#E8A23A", "#F2C879"],
    ["cinematic", "golden", "orange"],
  ),

  // Neon / Stylized
  palette(
    "neon_purple_and_yellow",
    "neon_stylized",
    "Neon / Stylized",
    "neon purple-and-yellow palette",
    ["#7A24FF", "#B238FF", "#F4FF3A", "#FFF36A"],
    ["neon", "purple", "yellow"],
  ),
  palette(
    "cyber_blue_and_magenta",
    "neon_stylized",
    "Neon / Stylized",
    "electric blue-and-magenta palette",
    ["#00A8FF", "#176BFF", "#D200FF", "#FF2FB3"],
    ["neon", "blue", "magenta"],
  ),
  palette(
    "electric_green_and_black",
    "neon_stylized",
    "Neon / Stylized",
    "electric green-and-black palette",
    ["#0A0A0A", "#1B1B1B", "#42FF47", "#B8FF2C"],
    ["neon", "green", "black"],
  ),
  palette(
    "vivid_pop_palette",
    "neon_stylized",
    "Neon / Stylized",
    "vivid saturated pop palette",
    ["#FF3B5C", "#FF9F1C", "#FFD93D", "#38D9A9", "#4D7CFE"],
    ["stylized", "vivid", "pop"],
  ),

  // Luxury / Elegant — category names are UI discovery metadata only.
  palette(
    "gold_and_black_luxury_palette",
    "luxury",
    "Luxury / Elegant",
    "gold-and-black palette",
    ["#0B0B0B", "#2A2418", "#C7A64A", "#F0D37A"],
    ["gold", "black"],
  ),
  palette(
    "ivory_and_champagne_palette",
    "luxury",
    "Luxury / Elegant",
    "ivory-and-champagne palette",
    ["#FFF8E7", "#EAD8B0", "#D7BD8C", "#B99865"],
    ["ivory", "champagne"],
  ),
  palette(
    "emerald_and_gold_palette",
    "luxury",
    "Luxury / Elegant",
    "emerald-and-gold palette",
    ["#0B3D2E", "#146B4A", "#C6A15B", "#F0D58A"],
    ["emerald", "gold"],
  ),
  palette(
    "deep_burgundy_luxury_palette",
    "luxury",
    "Luxury / Elegant",
    "deep burgundy palette",
    ["#3D0E1B", "#6E1F32", "#9A4351", "#C9898F"],
    ["burgundy", "deep"],
  ),

  // Nature
  palette(
    "forest_green_and_earth_tones",
    "nature",
    "Nature",
    "forest green-and-earth palette",
    ["#213B2B", "#496342", "#6F5A3A", "#9A7B55", "#C4B08A"],
    ["nature", "forest", "earth"],
  ),
  palette(
    "ocean_blue_palette",
    "nature",
    "Nature",
    "ocean-blue palette",
    ["#123B5D", "#1D6A8D", "#38A1C4", "#8FD3E8"],
    ["nature", "ocean", "blue"],
  ),
  palette(
    "desert_sand_palette",
    "nature",
    "Nature",
    "desert-sand palette",
    ["#8A6847", "#B99265", "#D7B98E", "#E9D8BC"],
    ["nature", "desert", "sand"],
  ),
  palette(
    "autumn_foliage_palette",
    "nature",
    "Nature",
    "autumn foliage palette",
    ["#7A2E1F", "#B34A24", "#D77A24", "#E5B33F", "#6A4A2F"],
    ["nature", "autumn", "foliage"],
  ),

  // Candy / Playful
  palette(
    "candy_pastel_palette",
    "candy_playful",
    "Candy / Playful",
    "candy pastel palette",
    ["#FFB7D5", "#FFD7A8", "#FFF2A8", "#BDEBD7", "#BFD7FF", "#D7C3FF"],
    ["candy", "pastel"],
  ),
  palette(
    "toy_like_primary_colors",
    "candy_playful",
    "Candy / Playful",
    "primary red-blue-yellow palette",
    ["#E63946", "#F2C94C", "#2F6BFF", "#F8F8F5"],
    ["primary-colors"],
  ),
  palette(
    "bubblegum_pink_palette",
    "candy_playful",
    "Candy / Playful",
    "bubblegum-pink palette",
    ["#FF4FA3", "#FF80BE", "#FFB3D5", "#FFE1EF"],
    ["pink", "bubblegum"],
  ),
  palette(
    "rainbow_playful_palette",
    "candy_playful",
    "Candy / Playful",
    "bright rainbow palette",
    ["#F94144", "#F8961E", "#F9C74F", "#43AA8B", "#4D90FE", "#8E5AD7"],
    ["rainbow", "colorful"],
  ),
];

const fields: Record<string, ModuleField> = {
  paletteAssignments: {
    id: "paletteAssignments",
    type: "colorAssignments",
    default: [],
    group: "core",
    order: 10,
    options: colorPaletteAssignmentsOptions,
    ui: {
      component: "colorAssignments",
      width: "full",
    },
  },
  extraDetails: {
    id: "extraDetails",
    type: "textarea",
    default: "",
    group: "advanced",
    order: 20,
    promptText: "",
    ui: {
      placeholder: "Add optional color details...",
      rows: 2,
      width: "full",
    },
  },
  customText: {
    id: "customText",
    type: "textarea",
    default: "",
    group: "override",
    order: 30,
    isOverride: true,
    promptText: "",
    ui: {
      placeholder: "Replace generated color palette output...",
      rows: 2,
      width: "full",
    },
  },
};

export const ColorPaletteModule: PromptKeyModule = {
  key: "colorPalette",
  icon: "palette",
  groups: {
    core: { id: "core", order: 1, defaultOpen: true },
    advanced: { id: "advanced", order: 2, defaultOpen: false },
    override: { id: "override", order: 3, defaultOpen: false },
  },
  fields,
  compile: {
    separator: ", ",
    removeDuplicates: true,
    overrideField: "customText",
    fieldOrder: ["paletteAssignments", "extraDetails"],
  },
};
