// app/modules/typography.module.ts
import type {
  ModuleField,
  ModuleFieldOption,
  PromptKeyModule,
} from "./types";

const groupPurposeOptions: ModuleFieldOption[] = [
  {
    value: "poster_header",
    promptText: "serving as the poster header",
    tags: ["typography", "group", "poster", "header"],
  },
  {
    value: "poster_footer",
    promptText: "serving as the poster footer",
    tags: ["typography", "group", "poster", "footer"],
  },
  {
    value: "product_info",
    promptText: "serving as the product information area",
    tags: ["typography", "group", "product", "info"],
  },
  {
    value: "event_info",
    promptText: "serving as the event information area",
    tags: ["typography", "group", "event", "info"],
  },
  {
    value: "music_cover_info",
    promptText: "serving as the music cover information area",
    tags: ["typography", "group", "music", "cover"],
  },
  {
    value: "advertising_copy",
    promptText: "serving as the advertising copy area",
    tags: ["typography", "group", "advertising", "copy"],
  },
  {
    value: "badge_cluster",
    promptText: "serving as a badge or label cluster",
    tags: ["typography", "group", "badge", "label"],
  },
  {
    value: "side_caption",
    promptText: "serving as a side caption area",
    tags: ["typography", "group", "side", "caption"],
  },
  {
    value: "typographic_background",
    promptText: "serving as a typographic background element",
    tags: ["typography", "group", "background"],
  },
  {
    value: "credits_area",
    promptText: "serving as the credits area",
    tags: ["typography", "group", "credits"],
  },
  {
    value: "custom",
    promptText: "custom text group purpose",
    tags: ["typography", "group", "custom"],
  },
];

const positionPresetOptions: ModuleFieldOption[] = [
  {
    value: "top",
    promptText: "in the top area",
  },
  {
    value: "top_left",
    promptText: "in the top-left area",
  },
  {
    value: "top_center",
    promptText: "in the top-center area",
  },
  {
    value: "top_right",
    promptText: "in the top-right area",
  },
  {
    value: "center_left",
    promptText: "in the center-left area",
  },
  {
    value: "center",
    promptText: "in the center area",
  },
  {
    value: "center_right",
    promptText: "in the center-right area",
  },
  {
    value: "bottom_left",
    promptText: "in the bottom-left area",
  },
  {
    value: "bottom_center",
    promptText: "in the bottom-center area",
  },
  {
    value: "bottom_right",
    promptText: "in the bottom-right area",
  },
  {
    value: "bottom",
    promptText: "in the bottom area",
  },
  {
    value: "left_side",
    promptText: "along the left side",
  },
  {
    value: "right_side",
    promptText: "along the right side",
  },
  {
    value: "custom",
    promptText: "in a custom described position",
  },
];

const directionOptions: ModuleFieldOption[] = [
  {
    value: "row",
    promptText: "arranged in a horizontal row",
  },
  {
    value: "column",
    promptText: "arranged in a vertical column",
  },
];

const writingDirectionOptions: ModuleFieldOption[] = [
  {
    value: "ltr",
    promptText: "using left-to-right writing direction",
  },
  {
    value: "rtl",
    promptText: "using right-to-left writing direction",
  },
  {
    value: "vertical_ttb",
    promptText: "using vertical top-to-bottom writing direction",
  },
  {
    value: "vertical_btt",
    promptText: "using vertical bottom-to-top writing direction",
  },
];

const alignmentOptions: ModuleFieldOption[] = [
  {
    value: "start",
    promptText: "start aligned",
  },
  {
    value: "center",
    promptText: "center aligned",
  },
  {
    value: "end",
    promptText: "end aligned",
  },
  {
    value: "justify",
    promptText: "justified",
  },
];

const distributionOptions: ModuleFieldOption[] = [
  {
    value: "compact",
    promptText: "with compact spacing",
  },
  {
    value: "balanced",
    promptText: "with balanced spacing",
  },
  {
    value: "spaced",
    promptText: "with generous spacing",
  },
  {
    value: "scattered",
    promptText: "with intentionally scattered placement",
  },
];

const textPurposeOptions: ModuleFieldOption[] = [
  {
    value: "main_title",
    promptText: "as the main title",
  },
  {
    value: "subtitle",
    promptText: "as the subtitle",
  },
  {
    value: "slogan",
    promptText: "as the slogan",
  },
  {
    value: "artist_name",
    promptText: "as the artist name",
  },
  {
    value: "brand_name",
    promptText: "as the brand name",
  },
  {
    value: "product_name",
    promptText: "as the product name",
  },
  {
    value: "price",
    promptText: "as the price text",
  },
  {
    value: "discount",
    promptText: "as the discount text",
  },
  {
    value: "date",
    promptText: "as the date text",
  },
  {
    value: "time",
    promptText: "as the time text",
  },
  {
    value: "location",
    promptText: "as the location text",
  },
  {
    value: "caption",
    promptText: "as a caption",
  },
  {
    value: "warning_label",
    promptText: "as a warning label",
  },
  {
    value: "badge_text",
    promptText: "as badge text",
  },
  {
    value: "footer_note",
    promptText: "as a footer note",
  },
  {
    value: "credits",
    promptText: "as credits text",
  },
  {
    value: "call_to_action",
    promptText: "as the call-to-action text",
  },
  {
    value: "custom",
    promptText: "as a custom text purpose",
  },
];

const fontStyleOptions: ModuleFieldOption[] = [
  {
    value: "clean_sans",
    promptText: "clean sans-serif typography",
  },
  {
    value: "bold_display",
    promptText: "bold display typography",
  },
  {
    value: "elegant_serif",
    promptText: "elegant serif typography",
  },
  {
    value: "condensed_poster",
    promptText: "condensed poster typography",
  },
  {
    value: "handwritten",
    promptText: "handwritten lettering",
  },
  {
    value: "gothic_blackletter",
    promptText: "gothic blackletter typography",
  },
  {
    value: "monospaced",
    promptText: "monospaced typography",
  },
  {
    value: "graffiti",
    promptText: "graffiti lettering",
  },
  {
    value: "retro_script",
    promptText: "retro script lettering",
  },
  {
    value: "minimal_editorial",
    promptText: "minimal editorial typography",
  },
  {
    value: "custom",
    promptText: "custom font style",
  },
];

const fontSizeOptions: ModuleFieldOption[] = [
  {
    value: "tiny",
    promptText: "tiny text size",
  },
  {
    value: "small",
    promptText: "small text size",
  },
  {
    value: "medium",
    promptText: "medium text size",
  },
  {
    value: "large",
    promptText: "large text size",
  },
  {
    value: "huge",
    promptText: "huge text size",
  },
  {
    value: "hero",
    promptText: "hero-scale text size",
  },
  {
    value: "custom",
    promptText: "custom text size",
  },
];

const fontWeightOptions: ModuleFieldOption[] = [
  {
    value: "light",
    promptText: "light 300 font weight",
  },
  {
    value: "regular",
    promptText: "regular 400 font weight",
  },
  {
    value: "medium",
    promptText: "medium 500 font weight",
  },
  {
    value: "semibold",
    promptText: "semibold 600 font weight",
  },
  {
    value: "bold",
    promptText: "bold 700 font weight",
  },
  {
    value: "extrabold",
    promptText: "extra-bold 800 font weight",
  },
  {
    value: "black",
    promptText: "heavy 900 font weight",
  },
  {
    value: "custom",
    promptText: "custom font-weight description",
  },
];

const textAccuracyOptions: ModuleFieldOption[] = [
  {
    value: "flexible",
    promptText:
      "typography may be interpreted flexibly when exact lettering is not essential",
  },
  {
    value: "readable",
    promptText:
      "render all typography as clear readable text with intentional letterforms",
  },
  {
    value: "exact",
    promptText:
      "render all typography text exactly as written with correct spelling and no extra letters",
  },
];

const fields: Record<string, ModuleField> = {
  textGroups: {
    id: "textGroups",
    type: "textGroups",
    default: [],
    group: "core",
    order: 10,
    ui: {
      component: "textGroups",
      width: "full",
    },
    config: {
      groupPurposeOptions,
      positionPresetOptions,
      directionOptions,
      writingDirectionOptions,
      alignmentOptions,
      distributionOptions,
      textPurposeOptions,
      fontStyleOptions,
      fontSizeOptions,
      fontWeightOptions,
    },
  },
  textAccuracy: {
    id: "textAccuracy",
    type: "select",
    default: "",
    group: "advanced",
    order: 20,
    options: textAccuracyOptions,
    ui: {
      component: "select",
      width: "half",
      clearable: true,
    },
  },
  extraDetails: {
    id: "extraDetails",
    type: "textarea",
    group: "advanced",
    order: 30,
    promptText: "",
    ui: {
      placeholder: "Add optional typography details...",
      rows: 2,
      width: "full",
    },
  },
  customText: {
    id: "customText",
    type: "textarea",
    group: "override",
    order: 40,
    isOverride: true,
    promptText: "",
    ui: {
      placeholder: "Replace generated typography output...",
      rows: 3,
      width: "full",
    },
  },
};

export const TypographyModule: PromptKeyModule = {
  key: "typography",
  icon: "text",
  groups: {
    core: { id: "core", order: 1, defaultOpen: true },
    advanced: { id: "advanced", order: 2, defaultOpen: false },
    override: { id: "override", order: 3, defaultOpen: false },
  },
  fields,
  compile: {
    separator: ". ",
    removeDuplicates: true,
    overrideField: "customText",
  },
};