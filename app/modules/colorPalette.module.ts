// app/modules/colorPalette.module.ts
import type { PromptKeyModule, ModuleField } from "./types";

const colorPaletteAssignmentsOptions = [
  // General / Balanced
  {
    value: "monochrome_black_and_white",
    category: "general",
    categoryLabel: "General / Balanced",
    promptText:
      "monochrome black and white palette with strong tonal contrast, clean grayscale structure, and a timeless graphic visual mood",
    tags: ["palette", "general", "monochrome", "black-and-white"],
  },
  {
    value: "grayscale_neutral_palette",
    category: "general",
    categoryLabel: "General / Balanced",
    promptText:
      "grayscale neutral palette with soft tonal variation, balanced contrast, and restrained colorless visual harmony",
    tags: ["palette", "general", "grayscale", "neutral"],
  },
  {
    value: "soft_pastel_palette",
    category: "general",
    categoryLabel: "General / Balanced",
    promptText:
      "soft pastel palette with gentle low-saturation colors, airy visual mood, and delicate harmonious color balance",
    tags: ["palette", "general", "pastel", "soft"],
  },
  {
    value: "warm_earthy_palette",
    category: "general",
    categoryLabel: "General / Balanced",
    promptText:
      "warm earthy palette with natural browns, muted oranges, soft beige tones, and grounded organic color harmony",
    tags: ["palette", "general", "warm", "earthy"],
  },
  {
    value: "cool_muted_palette",
    category: "general",
    categoryLabel: "General / Balanced",
    promptText:
      "cool muted palette with restrained blues, soft grays, desaturated tones, and calm understated color mood",
    tags: ["palette", "general", "cool", "muted"],
  },

  // Cinematic
  {
    value: "teal_and_orange_palette",
    category: "cinematic",
    categoryLabel: "Cinematic",
    promptText:
      "teal and orange cinematic palette with warm highlights, cool shadows, and strong film-like color contrast",
    tags: ["palette", "cinematic", "teal", "orange"],
  },
  {
    value: "desaturated_cinematic_palette",
    category: "cinematic",
    categoryLabel: "Cinematic",
    promptText:
      "desaturated cinematic palette with restrained color intensity, muted film tones, and serious atmospheric mood",
    tags: ["palette", "cinematic", "desaturated", "film"],
  },
  {
    value: "moody_blue_gray_palette",
    category: "cinematic",
    categoryLabel: "Cinematic",
    promptText:
      "moody blue-gray palette with cool shadow tones, subdued contrast, and dramatic cinematic atmosphere",
    tags: ["palette", "cinematic", "blue-gray", "moody"],
  },
  {
    value: "golden_sunset_palette",
    category: "cinematic",
    categoryLabel: "Cinematic",
    promptText:
      "golden sunset palette with warm amber light, soft orange highlights, and nostalgic cinematic warmth",
    tags: ["palette", "cinematic", "golden", "sunset"],
  },

  // Neon / Stylized
  {
    value: "neon_purple_and_yellow",
    category: "neon_stylized",
    categoryLabel: "Neon / Stylized",
    promptText:
      "neon purple and yellow palette with electric contrast, vibrant stylized energy, and bold futuristic color impact",
    tags: ["palette", "neon", "purple", "yellow"],
  },
  {
    value: "cyber_blue_and_magenta",
    category: "neon_stylized",
    categoryLabel: "Neon / Stylized",
    promptText:
      "cyber blue and magenta palette with intense digital contrast, futuristic glow, and high-energy cyberpunk color mood",
    tags: ["palette", "neon", "cyber", "blue", "magenta"],
  },
  {
    value: "electric_green_and_black",
    category: "neon_stylized",
    categoryLabel: "Neon / Stylized",
    promptText:
      "electric green and black palette with sharp luminous accents, dark contrast, and intense digital visual character",
    tags: ["palette", "neon", "green", "black"],
  },
  {
    value: "vivid_pop_palette",
    category: "neon_stylized",
    categoryLabel: "Neon / Stylized",
    promptText:
      "vivid pop palette with bright saturated colors, playful contrast, and bold graphic color presence",
    tags: ["palette", "stylized", "vivid", "pop"],
  },

  // Luxury / Elegant
  {
    value: "gold_and_black_luxury_palette",
    category: "luxury",
    categoryLabel: "Luxury / Elegant",
    promptText:
      "gold and black luxury palette with premium contrast, elegant dark grounding, and refined high-end visual mood",
    tags: ["palette", "luxury", "gold", "black"],
  },
  {
    value: "ivory_and_champagne_palette",
    category: "luxury",
    categoryLabel: "Luxury / Elegant",
    promptText:
      "ivory and champagne palette with soft premium warmth, elegant neutral brightness, and refined luxury atmosphere",
    tags: ["palette", "luxury", "ivory", "champagne"],
  },
  {
    value: "emerald_and_gold_palette",
    category: "luxury",
    categoryLabel: "Luxury / Elegant",
    promptText:
      "emerald and gold palette with rich jewel tones, elegant metallic warmth, and premium decorative color harmony",
    tags: ["palette", "luxury", "emerald", "gold"],
  },
  {
    value: "deep_burgundy_luxury_palette",
    category: "luxury",
    categoryLabel: "Luxury / Elegant",
    promptText:
      "deep burgundy luxury palette with rich red wine tones, dark elegant contrast, and sophisticated premium mood",
    tags: ["palette", "luxury", "burgundy", "deep"],
  },

  // Nature
  {
    value: "forest_green_and_earth_tones",
    category: "nature",
    categoryLabel: "Nature",
    promptText:
      "forest green and earth tone palette with natural greens, organic browns, muted botanical colors, and grounded nature-inspired harmony",
    tags: ["palette", "nature", "forest", "earth"],
  },
  {
    value: "ocean_blue_palette",
    category: "nature",
    categoryLabel: "Nature",
    promptText:
      "ocean blue palette with aquatic blues, soft cyan depth, calm coastal tones, and refreshing natural color atmosphere",
    tags: ["palette", "nature", "ocean", "blue"],
  },
  {
    value: "desert_sand_palette",
    category: "nature",
    categoryLabel: "Nature",
    promptText:
      "desert sand palette with warm beige, dusty tan, muted clay tones, and dry natural sunlit color harmony",
    tags: ["palette", "nature", "desert", "sand"],
  },
  {
    value: "autumn_foliage_palette",
    category: "nature",
    categoryLabel: "Nature",
    promptText:
      "autumn foliage palette with burnt orange, deep red, golden yellow, and earthy seasonal color warmth",
    tags: ["palette", "nature", "autumn", "foliage"],
  },

  // Candy / Playful
  {
    value: "candy_pastel_palette",
    category: "candy_playful",
    categoryLabel: "Candy / Playful",
    promptText:
      "candy pastel palette with sweet soft colors, playful brightness, and cheerful lighthearted visual charm",
    tags: ["palette", "candy", "pastel", "playful"],
  },
  {
    value: "toy_like_primary_colors",
    category: "candy_playful",
    categoryLabel: "Candy / Playful",
    promptText:
      "toy-like primary color palette with bold red, blue, yellow, and simple playful graphic color clarity",
    tags: ["palette", "toy", "primary-colors", "playful"],
  },
  {
    value: "bubblegum_pink_palette",
    category: "candy_playful",
    categoryLabel: "Candy / Playful",
    promptText:
      "bubblegum pink palette with bright sweet pink tones, cute playful energy, and cheerful pop color mood",
    tags: ["palette", "pink", "bubblegum", "playful"],
  },
  {
    value: "rainbow_playful_palette",
    category: "candy_playful",
    categoryLabel: "Candy / Playful",
    promptText:
      "rainbow playful palette with multiple bright colors, cheerful variety, and energetic joyful visual rhythm",
    tags: ["palette", "rainbow", "playful", "colorful"],
  },
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
  icon: "color-swatch",
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
  },
};
