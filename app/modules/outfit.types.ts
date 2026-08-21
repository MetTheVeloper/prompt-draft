import type {
  ModuleFieldOption,
  SemanticTargetCapability,
  SemanticTargetRef,
} from "./types";

export type { SemanticTargetRef } from "./types";

export type OutfitItemCategory =
  | "tops"
  | "bottoms"
  | "one_piece"
  | "outerwear"
  | "legwear"
  | "footwear"
  | "headwear"
  | "neckwear"
  | "handwear"
  | "waistwear"
  | "jewelry"
  | "eyewear"
  | "wearable_accessories"
  | "specialty"
  | "protective_costume"
  | "custom";

export type OutfitWearSlot =
  | "upper_body"
  | "lower_body"
  | "full_body"
  | "legs"
  | "feet"
  | "head"
  | "neck"
  | "hands"
  | "waist"
  | "eyes"
  | "ears"
  | "wrists"
  | "accessory";

export type OutfitLayerClass =
  | "under"
  | "base"
  | "mid"
  | "outer"
  | "accessory";

export type PromptReferenceRef = {
  variableId?: string;
  token: string;
  label?: string;
  source?: "user" | "system";
};

export type OutfitItemSource =
  | {
      mode: "defined";
    }
  | {
      mode: "reference";
      reference: PromptReferenceRef;
      itemHint?: string;
    };

export type OutfitInheritedProperty = {
  mode: "inherit";
};

export type OutfitOptionProperty = {
  mode: "option";
  value: string | string[];
};

export type OutfitCustomProperty = {
  mode: "custom";
  value: string;
};

export type OutfitReferenceProperty = {
  mode: "reference";
  reference?: PromptReferenceRef;
};

export type OutfitAbsentProperty = {
  mode: "absent";
};

export type OutfitPropertyState =
  | OutfitInheritedProperty
  | OutfitOptionProperty
  | OutfitCustomProperty
  | OutfitReferenceProperty
  | OutfitAbsentProperty;

export type OutfitItem = {
  /** Stable persistence identity. Never serialize this into prompt prose. */
  id: string;

  /**
   * Human semantic key, unique inside its Outfit Set.
   * This becomes the local alias (`dress`) and the final path segment in
   * `{outfit_eveningSet_dress}`.
   */
  key: string;

  /** Editable display label. Identity must not depend on this value. */
  name: string;
  type: string;
  customType?: string;
  customCategory?: OutfitItemCategory;
  source: OutfitItemSource;
  properties: Record<string, OutfitPropertyState>;
  additionalDetails?: string;
};

export type OutfitItemRelationType =
  | "over"
  | "under"
  | "tucked_into"
  | "layered_with";

export type OutfitItemRelation = {
  id: string;
  type: OutfitItemRelationType;
  sourceItemId: string;
  targetItemId: string;
  details?: string;
};

export type OutfitSet = {
  /** Stable persistence identity. Never serialize this into prompt prose. */
  id: string;

  /**
   * Human semantic key, unique across all Outfit Sets.
   * Underscores are reserved for hierarchy boundaries, so this key is stored
   * as lower camelCase (for example `eveningSet`).
   */
  key: string;

  /** Editable display label. Identity must not depend on this value. */
  name: string;
  presetId?: string;
  targets: SemanticTargetRef[];
  items: OutfitItem[];
  relations?: OutfitItemRelation[];
  additionalDetails?: string;
};

export type OutfitPropertyNature = "intrinsic" | "optional";
export type OutfitPropertyControl = "select" | "multiSelect";
export type OutfitPropertyCompilePlacement = "modifier" | "detail";

export type OutfitPropertyDefinition = {
  id: string;
  label: string;
  labelKey?: string;
  nature: OutfitPropertyNature;
  control: OutfitPropertyControl;
  options?: ModuleFieldOption[];
  optionSets?: Record<string, ModuleFieldOption[]>;
  allowCustom?: boolean;
  allowReference?: boolean;
  allowAbsent?: boolean;
  absentPromptText?: string;
  compilePlacement: OutfitPropertyCompilePlacement;
  order?: number;
};

export type OutfitPropertyBinding = {
  propertyId: string;
  optionSet?: string;
  order?: number;
};

export type OutfitPropertyProfile = {
  id: string;
  properties: OutfitPropertyBinding[];
};

export type OutfitItemTypeDefinition = {
  value: string;
  label: string;
  labelKey?: string;
  category: OutfitItemCategory;
  categoryLabel?: string;
  categoryLabelKey?: string;
  promptText: string;
  profileId?: string;
  properties?: OutfitPropertyBinding[];
  semanticCapabilities: SemanticTargetCapability[];
  wearSlots: OutfitWearSlot[];
  layerClass?: OutfitLayerClass;
  tags?: string[];
};

export type OutfitItemStarter = {
  id: string;
  label: string;
  labelKey?: string;
  category: OutfitItemCategory;
  item: {
    type: string;
    customType?: string;
    customCategory?: OutfitItemCategory;
    properties?: Record<string, OutfitPropertyState>;
  };
};

export type OutfitPresetItemRecipe = {
  /** Recipe-local semantic key. Becomes the default item key when applied. */
  key: string;
  type: string;
  customType?: string;
  customCategory?: OutfitItemCategory;
  properties?: Record<string, OutfitPropertyState>;
  additionalDetails?: string;
};

export type OutfitPresetRelationRecipe = {
  type: OutfitItemRelationType;
  sourceKey: string;
  targetKey: string;
  details?: string;
};

export type OutfitPresetRecipe = {
  id: string;
  label: string;
  labelKey?: string;
  category?: string;
  categoryLabel?: string;
  categoryLabelKey?: string;
  name?: string;
  items: OutfitPresetItemRecipe[];
  relations?: OutfitPresetRelationRecipe[];
};
