import type { PromptVariableType } from "./types"

export type VariableBlueprintSlot = {
  id: string
  key: string
  type: PromptVariableType
  value?: string
  description?: string
  optional?: boolean
}

export type VariableBlueprintRepeatableSlot = {
  id: string
  keyPattern: string
  type: PromptVariableType
  valuePattern?: string
  descriptionPattern?: string
  min: number
  max: number
  defaultCount: number
}

export type VariableBlueprint = {
  id: string
  label: string
  description: string
  icon?: string
  slots?: VariableBlueprintSlot[]
  repeatable?: VariableBlueprintRepeatableSlot
}

export const variableBlueprints: VariableBlueprint[] = [
  {
    id: "multiSubject",
    label: "Multiple Subjects",
    description: "Create a configurable set of independently targetable subject variables.",
    icon: "groups",
    repeatable: {
      id: "subjects",
      keyPattern: "subject{index}",
      type: "subject",
      descriptionPattern: "Subject {index}",
      min: 1,
      max: 12,
      defaultCount: 3,
    },
  },
  {
    id: "posterContent",
    label: "Poster Content",
    description: "Create reusable content handles for a typical promotional or artistic poster.",
    icon: "campaign",
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
    slots: [
      {
        id: "printArtwork",
        key: "printArtwork",
        type: "reference",
        value: "attached artwork reference image",
        description: "Artwork source to reproduce on the garment",
      },
      { id: "printPlacement", key: "printPlacement", type: "text", value: "front of the garment", description: "Print placement", optional: true },
      { id: "printMethod", key: "printMethod", type: "text", value: "natural DTF garment print", description: "Printing method and physical integration", optional: true },
      { id: "printScale", key: "printScale", type: "text", description: "Relative print size", optional: true },
    ],
  },
]
