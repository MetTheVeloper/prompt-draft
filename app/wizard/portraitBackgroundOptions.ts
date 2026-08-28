import type { WizardModalOptionsQuestionDefinition } from "./definition";

export const PORTRAIT_BACKGROUND_SETTINGS = [
  "indoor",
  "outdoor",
  "natural",
  "urban",
  "architectural",
  "industrial",
  "futuristic",
] as const;

export const PORTRAIT_BACKGROUND_STRUCTURES = [
  "seamless",
  "flat",
  "open",
  "layered",
  "enclosed",
  "expansive",
  "framed",
  "structured",
  "asymmetrical",
] as const;

export const PORTRAIT_BACKGROUND_MATERIALS = [
  "seamless_paper",
  "fabric",
  "concrete",
  "stone",
  "wood",
  "metal",
  "glass",
  "plaster",
  "painted_wall",
] as const;

export const PORTRAIT_BACKGROUND_DETAIL_DENSITIES = [
  "minimal",
  "restrained",
  "balanced",
  "detailed",
  "dense",
] as const;

export const PORTRAIT_BACKGROUND_ELEMENTS = [
  "vegetation",
  "architecture",
  "furniture",
  "crowd",
  "signage",
  "skyline",
  "mountains",
  "water",
  "clouds",
  "windows",
  "machinery",
  "horizon",
  "contextual_props",
] as const;

export type PortraitBackgroundOptions = Partial<{
  setting: (typeof PORTRAIT_BACKGROUND_SETTINGS)[number];
  spatialStructure: (typeof PORTRAIT_BACKGROUND_STRUCTURES)[number];
  backgroundMaterial: (typeof PORTRAIT_BACKGROUND_MATERIALS)[number];
  detailDensity: (typeof PORTRAIT_BACKGROUND_DETAIL_DENSITIES)[number];
  backgroundElement: (typeof PORTRAIT_BACKGROUND_ELEMENTS)[number];
}>;

export type PortraitBackgroundFieldUpdate = {
  fieldId:
    | "setting"
    | "spatialStructure"
    | "backgroundMaterial"
    | "detailDensity"
    | "backgroundElements";
  value: string | string[];
};

const SETTING_SET = new Set<string>(PORTRAIT_BACKGROUND_SETTINGS);
const STRUCTURE_SET = new Set<string>(PORTRAIT_BACKGROUND_STRUCTURES);
const MATERIAL_SET = new Set<string>(PORTRAIT_BACKGROUND_MATERIALS);
const DETAIL_DENSITY_SET = new Set<string>(PORTRAIT_BACKGROUND_DETAIL_DENSITIES);
const ELEMENT_SET = new Set<string>(PORTRAIT_BACKGROUND_ELEMENTS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedValue<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: ReadonlySet<string>,
): T | undefined {
  const value = record[key];
  return typeof value === "string" && allowed.has(value)
    ? (value as T)
    : undefined;
}

export function normalizePortraitBackgroundOptions(
  value: unknown,
): PortraitBackgroundOptions {
  if (!isRecord(value)) return {};

  return {
    setting: normalizedValue(value, "setting", SETTING_SET),
    spatialStructure: normalizedValue(value, "spatialStructure", STRUCTURE_SET),
    backgroundMaterial: normalizedValue(value, "backgroundMaterial", MATERIAL_SET),
    detailDensity: normalizedValue(value, "detailDensity", DETAIL_DENSITY_SET),
    backgroundElement: normalizedValue(value, "backgroundElement", ELEMENT_SET),
  };
}

export function portraitBackgroundFieldUpdates(
  options: PortraitBackgroundOptions,
): PortraitBackgroundFieldUpdate[] {
  const updates: PortraitBackgroundFieldUpdate[] = [];

  if (options.setting) {
    updates.push({ fieldId: "setting", value: options.setting });
  }
  if (options.spatialStructure) {
    updates.push({
      fieldId: "spatialStructure",
      value: options.spatialStructure,
    });
  }
  if (options.backgroundMaterial) {
    updates.push({
      fieldId: "backgroundMaterial",
      value: options.backgroundMaterial,
    });
  }
  if (options.detailDensity) {
    updates.push({ fieldId: "detailDensity", value: options.detailDensity });
  }
  if (options.backgroundElement) {
    updates.push({
      fieldId: "backgroundElements",
      value: [options.backgroundElement],
    });
  }

  return updates;
}

export const portraitBackgroundOptionsQuestion = {
  id: "backgroundOptions",
  type: "modalOptions",
  title: "Background details",
  buttonLabel: "More background options",
  modalTitle: "Fine-tune background",
  description:
    "Optional background structure and content. Leave fields on default to keep the selected environment preset unchanged.",
  fields: [
    {
      id: "setting",
      type: "singleChoice",
      title: "Setting",
      description: "Refine the kind of place without changing the main Scene choice.",
      options: [
        { value: "indoor", label: "Indoor" },
        { value: "outdoor", label: "Outdoor" },
        { value: "natural", label: "Natural" },
        { value: "urban", label: "Urban" },
        { value: "architectural", label: "Architectural" },
        { value: "industrial", label: "Industrial" },
        { value: "futuristic", label: "Futuristic" },
      ],
    },
    {
      id: "spatialStructure",
      type: "singleChoice",
      title: "Spatial structure",
      description: "Control how the background space is arranged around and behind the subject.",
      options: [
        { value: "seamless", label: "Seamless" },
        { value: "flat", label: "Flat" },
        { value: "open", label: "Open" },
        { value: "layered", label: "Layered" },
        { value: "enclosed", label: "Enclosed" },
        { value: "expansive", label: "Expansive" },
        { value: "framed", label: "Framed around subject" },
        { value: "structured", label: "Structured" },
        { value: "asymmetrical", label: "Asymmetrical" },
      ],
    },
    {
      id: "backgroundMaterial",
      type: "singleChoice",
      title: "Background material",
      description: "Use this when a visible backdrop or surface material matters.",
      options: [
        { value: "seamless_paper", label: "Seamless paper" },
        { value: "fabric", label: "Fabric" },
        { value: "concrete", label: "Concrete" },
        { value: "stone", label: "Stone" },
        { value: "wood", label: "Wood" },
        { value: "metal", label: "Metal" },
        { value: "glass", label: "Glass" },
        { value: "plaster", label: "Plaster" },
        { value: "painted_wall", label: "Painted wall" },
      ],
    },
    {
      id: "detailDensity",
      type: "singleChoice",
      title: "Detail amount",
      description: "Choose how visually busy or restrained the background should feel.",
      options: [
        { value: "minimal", label: "Minimal" },
        { value: "restrained", label: "Restrained" },
        { value: "balanced", label: "Balanced" },
        { value: "detailed", label: "Detailed" },
        { value: "dense", label: "Dense" },
      ],
    },
    {
      id: "backgroundElement",
      type: "singleChoice",
      title: "Key background element",
      description: "Optionally request one prominent contextual element; Expert UI can add more later.",
      options: [
        { value: "vegetation", label: "Vegetation" },
        { value: "architecture", label: "Architecture" },
        { value: "furniture", label: "Furniture" },
        { value: "crowd", label: "Distant people / crowd" },
        { value: "signage", label: "Signage" },
        { value: "skyline", label: "Skyline" },
        { value: "mountains", label: "Mountains" },
        { value: "water", label: "Water" },
        { value: "clouds", label: "Clouds" },
        { value: "windows", label: "Windows" },
        { value: "machinery", label: "Machinery" },
        { value: "horizon", label: "Visible horizon" },
        { value: "contextual_props", label: "Contextual props" },
      ],
    },
  ],
} as const satisfies WizardModalOptionsQuestionDefinition;
