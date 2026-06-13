import type { PromptKeyModule } from "./types";

const hairStyleOptions = [
  // General Hair
  {
    value: "short_clean_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must be short, clean, and naturally readable. Keep the silhouette tidy, the shape simple, and the overall hairstyle balanced without excessive styling or dramatic volume.",
    tags: ["hair", "general", "short", "clean"],
  },
  {
    value: "medium_natural_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must be medium length and natural-looking. Use balanced volume, relaxed shape, and believable everyday styling that supports the subject without dominating the image.",
    tags: ["hair", "general", "medium", "natural"],
  },
  {
    value: "long_flowing_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must be long and flowing. Create soft length, graceful movement, readable strands or grouped shapes, and a natural sense of motion or elegance around the subject.",
    tags: ["hair", "general", "long", "flowing"],
  },
  {
    value: "messy_casual_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must feel messy and casual. Use relaxed uneven shape, loose strands, informal styling, and a natural lived-in look while keeping the hairstyle visually readable.",
    tags: ["hair", "general", "messy", "casual"],
  },
  {
    value: "slicked_back_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must be slicked back. Keep the hair swept away from the face, controlled in shape, polished in styling, and visually clean with a confident refined appearance.",
    tags: ["hair", "general", "slicked-back", "polished"],
  },
  {
    value: "curly_voluminous_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must be curly and voluminous. Use rich curl structure, visible volume, rounded movement, and expressive natural texture while preserving a clear readable silhouette.",
    tags: ["hair", "general", "curly", "voluminous"],
  },
  {
    value: "wavy_soft_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must be softly wavy. Use gentle wave patterns, smooth flowing shape, natural volume, and a relaxed elegant hairstyle with soft visual rhythm.",
    tags: ["hair", "general", "wavy", "soft"],
  },
  {
    value: "straight_smooth_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must be straight and smooth. Use clean directional flow, minimal frizz, controlled shape, and a sleek readable hairstyle with polished simplicity.",
    tags: ["hair", "general", "straight", "smooth"],
  },
  {
    value: "shaved_or_buzz_cut",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must be shaved or buzz-cut. Keep the hairstyle very short, close to the scalp, clean in outline, and minimal in visual complexity.",
    tags: ["hair", "general", "buzz-cut", "shaved"],
  },
  {
    value: "wind_blown_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must appear wind-blown. Use directional flow, lifted strands or grouped hair shapes, and a sense of environmental motion while keeping the face and silhouette readable.",
    tags: ["hair", "general", "wind-blown", "motion"],
  },
  {
    value: "wet_look_hair",
    category: "general",
    categoryLabel: "General Hair",
    promptText:
      "the hair must have a wet-look style. Use sleek damp grouping, controlled shine or surface definition, close-to-head shaping, and a polished dramatic appearance.",
    tags: ["hair", "general", "wet-look", "sleek"],
  },

  // Boys / Masculine Hair
  {
    value: "classic_short_boys_haircut",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must follow a classic short boys haircut. Keep the sides and top neat, the shape practical, and the overall hairstyle clean, youthful, and naturally readable.",
    tags: ["hair", "boys", "masculine", "short"],
  },
  {
    value: "textured_crop_hairstyle",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must use a textured crop hairstyle. Keep the top slightly textured, the silhouette compact, and the overall look modern, casual, and masculine.",
    tags: ["hair", "boys", "masculine", "textured-crop"],
  },
  {
    value: "messy_boyish_hair",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must feel messy and boyish. Use playful uneven styling, relaxed volume, loose direction, and a casual energetic appearance without losing readability.",
    tags: ["hair", "boys", "masculine", "messy"],
  },
  {
    value: "side_part_hairstyle",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must use a side-part hairstyle. Create a clean parted structure, controlled shape, and a polished masculine appearance suitable for casual, formal, or classic looks.",
    tags: ["hair", "boys", "masculine", "side-part"],
  },
  {
    value: "undercut_hairstyle",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must use an undercut hairstyle. Keep the sides shorter, the top more prominent, and the silhouette modern, sharp, and clearly structured.",
    tags: ["hair", "boys", "masculine", "undercut"],
  },
  {
    value: "modern_fade_haircut",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must use a modern fade haircut. Create clean fading on the sides, controlled upper volume, and a sharp contemporary masculine hairstyle.",
    tags: ["hair", "boys", "masculine", "fade"],
  },
  {
    value: "spiky_hair",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must be spiky. Use upward or outward pointed hair shapes, energetic styling, and a bold youthful silhouette while keeping the hairstyle readable.",
    tags: ["hair", "boys", "masculine", "spiky"],
  },
  {
    value: "curly_boys_hairstyle",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must use a curly boys hairstyle. Keep the curls expressive but controlled, with natural volume, youthful texture, and a readable masculine silhouette.",
    tags: ["hair", "boys", "masculine", "curly"],
  },
  {
    value: "long_masculine_hair",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must be long with a masculine feel. Use relaxed length, natural movement, slightly rugged styling, and a confident readable hair silhouette.",
    tags: ["hair", "boys", "masculine", "long"],
  },
  {
    value: "rockstar_messy_hair",
    category: "boys_masculine",
    categoryLabel: "Boys / Masculine Hair",
    promptText:
      "the hair must feel like messy rockstar hair. Use expressive volume, uneven layers, casual dramatic movement, and a rebellious performance-oriented hairstyle.",
    tags: ["hair", "boys", "masculine", "rockstar"],
  },

  // Girls / Feminine Hair
  {
    value: "long_elegant_hair",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must be long and elegant. Use graceful length, polished flow, soft visual rhythm, and a refined feminine hairstyle with clear silhouette readability.",
    tags: ["hair", "girls", "feminine", "long"],
  },
  {
    value: "soft_layered_hair",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must use soft layered styling. Create gentle layered volume, natural movement, face-framing shape, and a polished feminine appearance.",
    tags: ["hair", "girls", "feminine", "layered"],
  },
  {
    value: "bob_haircut",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must use a bob haircut. Keep the shape clean, the length compact, the edges readable, and the overall hairstyle stylish and feminine.",
    tags: ["hair", "girls", "feminine", "bob"],
  },
  {
    value: "pixie_cut",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must use a pixie cut. Keep the hairstyle short, stylish, expressive, and cleanly shaped with a confident feminine presence.",
    tags: ["hair", "girls", "feminine", "pixie"],
  },
  {
    value: "braided_hairstyle",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must use a braided hairstyle. Include clear braid structure, organized hair sections, and a decorative but readable feminine hairstyle.",
    tags: ["hair", "girls", "feminine", "braided"],
  },
  {
    value: "twin_tails",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must be styled into twin tails. Use two clearly separated tied sections, playful symmetry, and a cute energetic feminine silhouette.",
    tags: ["hair", "girls", "feminine", "twin-tails"],
  },
  {
    value: "high_ponytail",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must be styled into a high ponytail. Keep the tied hair lifted, energetic, cleanly gathered, and clearly readable in silhouette.",
    tags: ["hair", "girls", "feminine", "ponytail"],
  },
  {
    value: "low_ponytail",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must be styled into a low ponytail. Use a calm gathered shape, elegant restraint, and clean readable styling near the back or lower head.",
    tags: ["hair", "girls", "feminine", "low-ponytail"],
  },
  {
    value: "curly_feminine_hair",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must be curly and feminine. Use soft curl volume, graceful shape, expressive texture, and a polished readable hairstyle.",
    tags: ["hair", "girls", "feminine", "curly"],
  },
  {
    value: "glamorous_waves",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must use glamorous waves. Create polished wave structure, elegant volume, refined shine or softness, and a high-style feminine appearance.",
    tags: ["hair", "girls", "feminine", "glamorous"],
  },
  {
    value: "princess_like_hair",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must feel princess-like. Use soft graceful length, romantic styling, delicate volume, and an elegant fairytale-inspired feminine hairstyle.",
    tags: ["hair", "girls", "feminine", "princess"],
  },
  {
    value: "fashion_editorial_hair",
    category: "girls_feminine",
    categoryLabel: "Girls / Feminine Hair",
    promptText:
      "the hair must feel fashion editorial. Use intentional styling, refined silhouette, polished shape, and a visually designed high-fashion hair presence.",
    tags: ["hair", "girls", "feminine", "editorial"],
  },

  // Iconic / Celebrity-Inspired Hair
  {
    value: "classic_rockabilly_pompadour",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must resemble a classic rockabilly pompadour. Use lifted front volume, slick structured sides, retro performance energy, and a bold iconic silhouette.",
    tags: ["hair", "iconic", "rockabilly", "pompadour"],
  },
  {
    value: "old_hollywood_blonde_waves",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must evoke old Hollywood blonde waves. Use soft glamorous wave structure, polished vintage styling, elegant volume, and a classic cinema-inspired presence.",
    tags: ["hair", "iconic", "old-hollywood", "waves"],
  },
  {
    value: "glam_rock_layered_hair",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must feel like glam rock layered hair. Use dramatic layers, expressive volume, performance-ready styling, and a bold retro stage-inspired silhouette.",
    tags: ["hair", "iconic", "glam-rock", "layered"],
  },
  {
    value: "retro_beehive_hairstyle",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must use a retro beehive hairstyle. Create tall rounded volume, structured vintage shape, polished styling, and a distinctive iconic profile.",
    tags: ["hair", "iconic", "retro", "beehive"],
  },
  {
    value: "punk_mohawk",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must use a punk mohawk. Keep the central strip bold and elevated, with rebellious styling, sharp silhouette, and strong alternative visual identity.",
    tags: ["hair", "iconic", "punk", "mohawk"],
  },
  {
    value: "pop_star_wet_look_hair",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must feel like pop-star wet-look styling. Use sleek damp texture, polished performance energy, face-framing shape, and a modern stage-ready appearance.",
    tags: ["hair", "iconic", "pop-star", "wet-look"],
  },
  {
    value: "nineties_boyband_curtain_hair",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must resemble 90s boyband curtain hair. Use center-parted front sections, soft face-framing layers, youthful retro styling, and a clean nostalgic silhouette.",
    tags: ["hair", "iconic", "90s", "curtain-hair"],
  },
  {
    value: "k_pop_idol_hairstyle",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must feel like a K-pop idol hairstyle. Use polished modern styling, clean volume, fashionable shape, and a highly styled performance-ready appearance.",
    tags: ["hair", "iconic", "k-pop", "idol"],
  },
  {
    value: "rock_singer_shag_haircut",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must use a rock singer shag haircut. Use layered messy length, expressive volume, casual stage energy, and a bold music-inspired silhouette.",
    tags: ["hair", "iconic", "rock", "shag"],
  },
  {
    value: "vintage_cinema_star_waves",
    category: "iconic_celebrity_inspired",
    categoryLabel: "Iconic / Celebrity-Inspired Hair",
    promptText:
      "the hair must evoke vintage cinema star waves. Use sculpted wave patterns, polished classic glamour, elegant shape, and timeless movie-star styling.",
    tags: ["hair", "iconic", "vintage", "cinema"],
  },

  // Fantasy / Stylized Hair
  {
    value: "anime_spiky_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must be anime-inspired and spiky. Use exaggerated pointed shapes, bold silhouette rhythm, clean stylized structure, and energetic character-driven hair design.",
    tags: ["hair", "fantasy", "stylized", "anime"],
  },
  {
    value: "magical_glowing_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must feel magical and glowing. Use luminous hair edges or strands, ethereal color energy, soft radiance, and a fantasy-inspired supernatural presence.",
    tags: ["hair", "fantasy", "stylized", "glowing"],
  },
  {
    value: "floating_gravity_defying_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must appear floating or gravity-defying. Let the hair lift, drift, or flow unnaturally around the subject with surreal readable movement.",
    tags: ["hair", "fantasy", "stylized", "gravity-defying"],
  },
  {
    value: "fantasy_warrior_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must feel like fantasy warrior hair. Use practical yet dramatic styling, battle-ready shape, strong silhouette, and a heroic or mythic character presence.",
    tags: ["hair", "fantasy", "stylized", "warrior"],
  },
  {
    value: "elf_like_long_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must feel elf-like and long. Use elegant length, refined smooth flow, delicate fantasy styling, and a graceful otherworldly silhouette.",
    tags: ["hair", "fantasy", "stylized", "elf-like"],
  },
  {
    value: "mermaid_flowing_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must feel like mermaid flowing hair. Use long fluid movement, soft aquatic rhythm, graceful volume, and an enchanting fantasy-inspired shape.",
    tags: ["hair", "fantasy", "stylized", "mermaid"],
  },
  {
    value: "fire_like_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must resemble fire-like hair. Use flame-shaped movement, energetic upward flow, warm visual intensity, and a stylized elemental silhouette.",
    tags: ["hair", "fantasy", "stylized", "fire"],
  },
  {
    value: "ice_like_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must resemble ice-like hair. Use sharp crystalline flow, cool visual character, clean sculptural shape, and a frozen magical appearance.",
    tags: ["hair", "fantasy", "stylized", "ice"],
  },
  {
    value: "cloud_like_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must feel cloud-like. Use soft puffy volume, airy rounded shapes, lightweight silhouette, and a dreamy stylized hair presence.",
    tags: ["hair", "fantasy", "stylized", "cloud"],
  },
  {
    value: "sculptural_stylized_hair",
    category: "fantasy_stylized",
    categoryLabel: "Fantasy / Stylized Hair",
    promptText:
      "the hair must be sculptural and stylized. Use clean designed masses, simplified shape language, strong silhouette control, and an art-directed hair structure.",
    tags: ["hair", "fantasy", "stylized", "sculptural"],
  },

  // Hair Styling / Accessories
  {
    value: "hair_with_headband",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must include a headband. Keep the accessory clearly visible, integrated with the hairstyle, and supportive of the subject's overall visual style.",
    tags: ["hair", "accessory", "headband"],
  },
  {
    value: "hair_with_bow",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must include a bow. Use a visible decorative bow integrated into the hairstyle, adding a cute, playful, elegant, or stylized accent depending on the subject.",
    tags: ["hair", "accessory", "bow"],
  },
  {
    value: "hair_with_clips",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must include hair clips. Keep the clips readable, decorative or functional, and integrated naturally into the hairstyle.",
    tags: ["hair", "accessory", "clips"],
  },
  {
    value: "hair_under_hat",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must be styled under a hat. Let the hairstyle remain partially visible and believable while interacting naturally with the hat shape.",
    tags: ["hair", "accessory", "hat"],
  },
  {
    value: "covered_hair_or_scarf",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must be covered or partially covered with a scarf or fabric wrap. Keep the head covering visually clear, respectful, and integrated into the overall outfit or character design.",
    tags: ["hair", "accessory", "scarf", "covered"],
  },
  {
    value: "braided_crown",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must use a braided crown style. Arrange braids around the head with decorative structure, elegant symmetry, and a polished ornamental appearance.",
    tags: ["hair", "accessory", "braided-crown"],
  },
  {
    value: "decorative_hair_ornaments",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must include decorative ornaments. Use visible hair jewelry, pins, beads, flowers, or stylized accessories that enhance the hairstyle without cluttering the face.",
    tags: ["hair", "accessory", "ornaments"],
  },
  {
    value: "messy_festival_hair",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must feel like messy festival hair. Use playful texture, loose styling, decorative accents if appropriate, and a lively expressive event-ready appearance.",
    tags: ["hair", "accessory", "festival", "messy"],
  },
  {
    value: "sports_tied_back_hair",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must be tied back for sports or active movement. Keep the hair secured, practical, cleanly readable, and suitable for athletic or performance activity.",
    tags: ["hair", "accessory", "sports", "tied-back"],
  },
  {
    value: "formal_styled_hair",
    category: "hair_styling_accessories",
    categoryLabel: "Hair Styling / Accessories",
    promptText:
      "the hair must be formally styled. Use polished arrangement, controlled shape, elegant finish, and a refined appearance suitable for formal, ceremonial, or premium contexts.",
    tags: ["hair", "accessory", "formal", "styled"],
  },
];

const hairTextureOptions = [
  "straight",
  "wavy",
  "curly",
  "coily",
  "fluffy",
  "silky",
  "thick",
  "fine",
  "coarse",
  "glossy",
  "matte",
  "sculpted",
].map((v) => ({
  value: v,
  promptText: `${v} hair texture`,
  tags: ["hair", "texture"],
}));

export const HairModule: PromptKeyModule = {
  key: "hair",
  icon: "wind-2",

  groups: {
    core: { id: "core", order: 10, defaultOpen: true },
    advanced: { id: "advanced", order: 20, defaultOpen: false },
    override: { id: "override", order: 30, defaultOpen: false },
  },

  fields: {
    hairStyle: {
      id: "hairStyle",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: hairStyleOptions,
      ui: {
        component: "select",
        optionLayout: "categorized",
        searchable: true,
        clearable: true,
        width: "full",
      },
    },
    hairColor: {
      id: "hairColor",
      type: "color",
      default: "",
      group: "core",
      order: 20,
      ui: {
        component: "color",
        width: "half",
      },
    },
    hairTexture: {
      id: "hairTexture",
      type: "select",
      default: "",
      group: "core",
      order: 30,
      options: hairTextureOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },
    extraDetails: {
      id: "extraDetails",
      type: "textarea",
      default: "",
      group: "advanced",
      order: 10,
      ui: { component: "textarea", rows: 3, width: "full" },
    },
    customText: {
      id: "customText",
      type: "textarea",
      default: "",
      group: "override",
      order: 10,
      isOverride: true,
      ui: { component: "textarea", rows: 4, width: "full" },
    },
  },

  compile: {
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
};
