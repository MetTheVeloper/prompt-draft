import type {
  ModuleFieldOption,
  SemanticTargetCapability,
  SemanticTargetRef,
} from "./types";

export type { SemanticTargetRef } from "./types";

export type HairReferenceRef = {
  variableId?: string;
  token: string;
  label?: string;
  source?: "user" | "system";
};

export type HairStyleSource =
  | { mode: "defined" }
  | {
      mode: "reference";
      reference: HairReferenceRef;
      hairHint?: string;
    };

export type HairPropertyState =
  | { mode: "inherit" }
  | { mode: "option"; value: string }
  | { mode: "custom"; value: string }
  | { mode: "reference"; reference?: HairReferenceRef }
  | { mode: "absent" };

export type HairComponentType =
  | "bangs"
  | "ponytail"
  | "bun"
  | "braid"
  | "twist"
  | "locs"
  | "face_framing_strands"
  | "shaved_section"
  | "hair_accessory"
  | "custom";

export type HairComponent = {
  /** Stable persistence identity. Never serialize this into prompt prose. */
  id: string;

  /** Human semantic key, unique inside the owning hairstyle. */
  key: string;

  /** Editable UI label; identity never depends on it. */
  name: string;

  type: HairComponentType;
  customType?: string;
  properties: Record<string, HairPropertyState>;
  additionalDetails?: string;
};

export type HairStyle = {
  /** Stable persistence identity. Never serialize this into prompt prose. */
  id: string;

  /** Human semantic key, unique across all hairstyles. */
  key: string;

  /** Editable UI label; identity never depends on it. */
  name: string;

  presetId?: string;
  targets: SemanticTargetRef[];
  source: HairStyleSource;

  /** Hair-owned structural semantics only. Color/material stay external. */
  properties: Record<string, HairPropertyState>;

  /** Optional structured sections/elements within the hairstyle. */
  components: HairComponent[];

  additionalDetails?: string;
};

export type HairPropertyNature = "intrinsic" | "optional";
export type HairPropertyCompilePlacement = "modifier" | "detail";

export type HairPropertyDefinition = {
  id: string;
  label: string;
  nature: HairPropertyNature;
  options: ModuleFieldOption[];
  allowCustom?: boolean;
  allowReference?: boolean;
  allowAbsent?: boolean;
  absentPromptText?: string;
  compilePlacement: HairPropertyCompilePlacement;
  order?: number;
};

export type HairComponentTypeDefinition = {
  value: HairComponentType;
  label: string;
  promptText: string;
  propertyIds: string[];
  semanticCapabilities: SemanticTargetCapability[];
  tags?: string[];
};

export type HairComponentStarter = {
  id: string;
  label: string;
  type: HairComponentType;
  properties?: Record<string, HairPropertyState>;
};

export type HairPresetComponentRecipe = {
  key: string;
  type: HairComponentType;
  name?: string;
  customType?: string;
  properties?: Record<string, HairPropertyState>;
  additionalDetails?: string;
};

export type HairPresetRecipe = {
  id: string;
  label: string;
  category: string;
  categoryLabel: string;
  name?: string;
  properties?: Record<string, HairPropertyState>;
  components?: HairPresetComponentRecipe[];
  additionalDetails?: string;
};
