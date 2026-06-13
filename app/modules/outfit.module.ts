import type { PromptKeyModule } from "./types";

const outfitStyleOptions = [
  // General
  {
    value: "casual_outfit",
    category: "general",
    categoryLabel: "General",
    promptText:
      "the outfit must be casual and everyday-appropriate. Simple clothes, comfortable fit, neutral style, and visually readable without excessive details.",
    tags: ["outfit", "general", "casual"],
  },
  {
    value: "sporty_outfit",
    category: "general",
    categoryLabel: "General",
    promptText:
      "the outfit must feel sporty and active. Use athletic-inspired clothing, flexible materials, and practical functional style suitable for movement.",
    tags: ["outfit", "general", "sporty"],
  },
  {
    value: "formal_outfit",
    category: "general",
    categoryLabel: "General",
    promptText:
      "the outfit must feel formal and elegant. Use structured clothing, polished details, and clean readable style suitable for professional or ceremonial purposes.",
    tags: ["outfit", "general", "formal"],
  },
  {
    value: "luxury_outfit",
    category: "general",
    categoryLabel: "General",
    promptText:
      "the outfit must feel luxurious and high-end. Use refined fabrics, stylish design, and polished visual appearance that suggests premium quality.",
    tags: ["outfit", "general", "luxury"],
  },
  {
    value: "festive_outfit",
    category: "general",
    categoryLabel: "General",
    promptText:
      "the outfit must be festive or holiday-themed. Include seasonal cues, decorative details, and joyful celebratory design suitable for parties or events.",
    tags: ["outfit", "general", "festive"],
  },
  {
    value: "traditional_ethnic_outfit",
    category: "general",
    categoryLabel: "General",
    promptText:
      "the outfit must be inspired by traditional or ethnic clothing. Use recognizable cultural patterns, textures, and structured wearable design appropriate for identity and context.",
    tags: ["outfit", "general", "traditional"],
  },

  // Boys
  {
    value: "boyish_casual_outfit",
    category: "boys",
    categoryLabel: "Boys",
    promptText:
      "the outfit must feel boyish and casual. Use relaxed clothing, neutral or playful colors, simple style, and readable silhouette suitable for boys.",
    tags: ["outfit", "boys", "casual"],
  },
  {
    value: "formal_boys_outfit",
    category: "boys",
    categoryLabel: "Boys",
    promptText:
      "the outfit must be formal and structured for boys. Include suit-like or neat clothing, clean readable lines, and appropriate proportions.",
    tags: ["outfit", "boys", "formal"],
  },
  {
    value: "sporty_boys_outfit",
    category: "boys",
    categoryLabel: "Boys",
    promptText:
      "the outfit must feel sporty for boys. Use athletic clothing, flexible design, and action-friendly style.",
    tags: ["outfit", "boys", "sporty"],
  },
  {
    value: "hoodie_and_jeans_outfit",
    category: "boys",
    categoryLabel: "Boys",
    promptText:
      "the outfit must include a hoodie and jeans. Keep casual proportions, readable silhouette, and boyish style.",
    tags: ["outfit", "boys", "casual"],
  },

  // Girls
  {
    value: "girlish_casual_outfit",
    category: "girls",
    categoryLabel: "Girls",
    promptText:
      "the outfit must feel casual and girlish. Use soft fabrics, readable proportions, comfortable style, and age-neutral design.",
    tags: ["outfit", "girls", "casual"],
  },
  {
    value: "elegant_girls_outfit",
    category: "girls",
    categoryLabel: "Girls",
    promptText:
      "the outfit must be elegant for girls. Include refined clothing, soft readable lines, and a stylish polished appearance.",
    tags: ["outfit", "girls", "elegant"],
  },
  {
    value: "cute_dress_outfit",
    category: "girls",
    categoryLabel: "Girls",
    promptText:
      "the outfit must be a cute dress. Use playful style, readable silhouette, and visually appealing feminine clothing.",
    tags: ["outfit", "girls", "dress", "cute"],
  },
  {
    value: "party_dress_outfit",
    category: "girls",
    categoryLabel: "Girls",
    promptText:
      "the outfit must be a party dress. Include festive styling, elegant proportioning, and clear visual readability.",
    tags: ["outfit", "girls", "party", "dress"],
  },

  // Costume
  {
    value: "superhero_costume",
    category: "costume",
    categoryLabel: "Costume",
    promptText:
      "the outfit must be a superhero costume. Use bold colors, readable silhouette, iconic stylistic elements, and visually striking heroic design.",
    tags: ["outfit", "costume", "superhero"],
  },
  {
    value: "fantasy_warrior_costume",
    category: "costume",
    categoryLabel: "Costume",
    promptText:
      "the outfit must feel like a fantasy warrior costume. Include armor or stylized battle clothing, readable silhouette, and heroic visual energy.",
    tags: ["outfit", "costume", "fantasy", "warrior"],
  },
  {
    value: "magical_wizard_costume",
    category: "costume",
    categoryLabel: "Costume",
    promptText:
      "the outfit must resemble a magical wizard costume. Include robes, mystical details, readable silhouette, and fantasy-inspired styling.",
    tags: ["outfit", "costume", "wizard", "magical"],
  },
  {
    value: "princess_costume",
    category: "costume",
    categoryLabel: "Costume",
    promptText:
      "the outfit must feel like a princess costume. Include elegant gown, soft proportions, readable silhouette, and royal styling.",
    tags: ["outfit", "costume", "princess", "fantasy"],
  },
  {
    value: "sci_fi_space_suit",
    category: "costume",
    categoryLabel: "Costume",
    promptText:
      "the outfit must resemble a sci-fi space suit. Use futuristic design, readable proportions, and visually strong silhouette.",
    tags: ["outfit", "costume", "sci-fi", "space"],
  },
  {
    value: "medieval_knight_costume",
    category: "costume",
    categoryLabel: "Costume",
    promptText:
      "the outfit must be a medieval knight costume. Include armor, stylized medieval design, readable silhouette, and heroic presence.",
    tags: ["outfit", "costume", "medieval", "knight"],
  },
];

export const OutfitModule: PromptKeyModule = {
  key: "outfit",
  icon: "clipboard",

  groups: {
    core: {
      id: "core",
      order: 10,
      defaultOpen: true,
    },
    advanced: {
      id: "advanced",
      order: 20,
      defaultOpen: false,
    },
    override: {
      id: "override",
      order: 30,
      defaultOpen: false,
    },
  },

  fields: {
    outfitStyle: {
      id: "outfitStyle",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: outfitStyleOptions,
      ui: {
        component: "select",
        optionLayout: "categorized",
        searchable: true,
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
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
};