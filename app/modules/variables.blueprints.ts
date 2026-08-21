import type { PromptVariableType } from "./types"

export type VariableBlueprintCategory = "profiles" | "content" | "utilities"

export type VariableBlueprintSlot = {
  id: string
  key: string
  type: PromptVariableType
  value?: string
  description?: string
  optional?: boolean
  typeEditable?: boolean
}

export type VariableBlueprintGroupSlot = {
  id: string
  /**
   * Repeatable profile key template. `#` marks the semantic index position.
   * Example: `person#Name` -> `person1Name`, `person2Name`, ...
   */
  keyPattern: string
  type: PromptVariableType
  /**
   * Optional value template. `#` is optional here; when present it is replaced
   * with the same semantic index used by the generated key.
   */
  valuePattern?: string
  descriptionPattern?: string
  optional?: boolean
  typeEditable?: boolean
}

export type VariableBlueprintRepeatableGroup = {
  id: string
  label: string
  description?: string
  min: number
  max: number
  defaultCount: number
  slots: VariableBlueprintGroupSlot[]
}

export type VariableBlueprintCustomSet = {
  min: number
  max: number
  defaultCount: number
  keyPattern: string
  defaultType: PromptVariableType
}

export type VariableBlueprint = {
  id: string
  label: string
  description: string
  icon?: string
  category: VariableBlueprintCategory
  categoryLabel: string
  slots?: VariableBlueprintSlot[]
  groups?: VariableBlueprintRepeatableGroup[]
  customSet?: VariableBlueprintCustomSet
}

function entityProfile(
  id: string,
  label: string,
  entityLabel: string,
  keyBase: string,
  entityType: PromptVariableType,
  icon: string,
): VariableBlueprint {
  return {
    id,
    label,
    description: `Create one or more ${entityLabel.toLowerCase()} profiles with a primary semantic handle and optional reusable metadata.`,
    icon,
    category: "profiles",
    categoryLabel: "Entity Profiles",
    groups: [
      {
        id: keyBase,
        label: entityLabel,
        description: `Edit one ${entityLabel.toLowerCase()} template, then create as many indexed profiles as needed.`,
        min: 1,
        max: 12,
        defaultCount: 1,
        slots: [
          {
            id: "entity",
            keyPattern: `${keyBase}#`,
            type: entityType,
            descriptionPattern: `${entityLabel} #`,
          },
          {
            id: "name",
            keyPattern: `${keyBase}#Name`,
            type: "text",
            descriptionPattern: `${entityLabel} # name or reusable label`,
            optional: true,
          },
          {
            id: "reference",
            keyPattern: `${keyBase}#Reference`,
            type: "reference",
            descriptionPattern: `${entityLabel} # auxiliary reference image`,
            optional: true,
          },
        ],
      },
    ],
  }
}

export const variableBlueprints: VariableBlueprint[] = [
  entityProfile("personProfile", "Person Profile", "Person", "person", "subject", "person"),
  entityProfile("animalProfile", "Animal Profile", "Animal", "animal", "subject", "pets"),
  entityProfile("buildingProfile", "Building Profile", "Building", "building", "object", "apartment"),
  entityProfile("productProfile", "Product Profile", "Product", "product", "object", "inventory_2"),
  entityProfile("vehicleProfile", "Vehicle Profile", "Vehicle", "vehicle", "object", "directions_car"),
  {
    id: "multiSubject",
    label: "Subject Set",
    description: "Create a lightweight configurable set of independently targetable subject variables.",
    icon: "groups",
    category: "profiles",
    categoryLabel: "Entity Profiles",
    groups: [
      {
        id: "subjects",
        label: "Subject",
        description: "Edit one subject template and expand it into indexed subject variables.",
        min: 1,
        max: 12,
        defaultCount: 3,
        slots: [
          {
            id: "subject",
            keyPattern: "subject#",
            type: "subject",
            descriptionPattern: "Subject #",
          },
        ],
      },
    ],
  },
  {
    id: "customVariableSet",
    label: "Custom Variable Set",
    description: "Build an open-ended set of variables with editable keys, values and semantic types.",
    icon: "tune",
    category: "utilities",
    categoryLabel: "Utilities",
    customSet: {
      min: 1,
      max: 24,
      defaultCount: 3,
      keyPattern: "variable{index}",
      defaultType: "text",
    },
  },
  {
    id: "posterContent",
    label: "Poster Content",
    description: "Create reusable content handles for a typical promotional or artistic poster.",
    icon: "campaign",
    category: "content",
    categoryLabel: "Content Recipes",
    slots: [
      { id: "brandName", key: "brandName", type: "text", description: "Brand or organizer name", optional: true },
      { id: "headline", key: "headline", type: "text", description: "Main headline" },
      { id: "subheadline", key: "subheadline", type: "text", description: "Supporting headline", optional: true },
      { id: "product", key: "product", type: "object", description: "Main promoted product or object", optional: true },
      { id: "price", key: "price", type: "text", description: "Price text", optional: true },
      { id: "discount", key: "discount", type: "text", description: "Discount or offer text", optional: true },
      { id: "callToAction", key: "callToAction", type: "text", description: "Call to action", optional: true },
      { id: "primaryColor", key: "primaryColor", type: "color", description: "Primary reusable color", optional: true },
      { id: "secondaryColor", key: "secondaryColor", type: "color", description: "Secondary reusable color", optional: true },
    ],
  },
  {
    id: "businessCard",
    label: "Business Card",
    description: "Create common identity and contact variables for business-card typography.",
    icon: "badge",
    category: "content",
    categoryLabel: "Content Recipes",
    slots: [
      { id: "personName", key: "personName", type: "text", description: "Displayed person name" },
      { id: "jobTitle", key: "jobTitle", type: "text", description: "Job title or role", optional: true },
      { id: "companyName", key: "companyName", type: "text", description: "Company or studio name", optional: true },
      { id: "phone", key: "phone", type: "text", description: "Phone number", optional: true },
      { id: "email", key: "email", type: "text", description: "Email address", optional: true },
      { id: "website", key: "website", type: "text", description: "Website", optional: true },
      { id: "address", key: "address", type: "text", description: "Address", optional: true },
      { id: "brandColor", key: "brandColor", type: "color", description: "Primary brand color", optional: true },
      { id: "brandFont", key: "brandFont", type: "font", description: "Brand font or lettering reference", optional: true },
    ],
  },
  {
    id: "garmentPrint",
    label: "Garment Print",
    description: "Create a semantic reference handle and optional print instructions for artwork applied to a garment.",
    icon: "texture",
    category: "utilities",
    categoryLabel: "Utilities",
    slots: [
      {
        id: "printArtwork",
        key: "printArtwork",
        type: "reference",
        value: "attached artwork reference image",
        description: "Artwork source to reproduce on the garment",
      },
      { id: "printPlacement", key: "printPlacement", type: "text", value: "front center of the t-shirt", description: "Print placement", optional: true },
      { id: "printMethod", key: "printMethod", type: "text", value: "natural DTF garment print", description: "Printing method and physical integration", optional: true },
      { id: "printScale", key: "printScale", type: "text", description: "Relative print size", optional: true },
    ],
  },
]
