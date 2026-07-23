import type {
  TypographyTextBlock,
  TypographyTextGroup,
} from "../modules/types"
import {
  getTypographyGroupVariableToken,
  getTypographyTextVariableToken,
} from "./structuralVariables"

const TYPOGRAPHY_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"
const TYPOGRAPHY_ID_LENGTH = 3

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function randomSuffix() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = crypto.getRandomValues(
      new Uint8Array(TYPOGRAPHY_ID_LENGTH),
    )

    return Array.from(bytes, (byte) => {
      return TYPOGRAPHY_ID_ALPHABET[
        byte % TYPOGRAPHY_ID_ALPHABET.length
      ]
    }).join("")
  }

  return Array.from({ length: TYPOGRAPHY_ID_LENGTH }, () => {
    const index = Math.floor(Math.random() * TYPOGRAPHY_ID_ALPHABET.length)
    return TYPOGRAPHY_ID_ALPHABET[index]
  }).join("")
}

export function createTypographyEntityId(prefix: "text-group" | "text") {
  return `${prefix}-${randomSuffix()}`
}

export function cloneTypographyTextBlock(block: TypographyTextBlock) {
  return JSON.parse(JSON.stringify(block)) as TypographyTextBlock
}

export function cloneTypographyTextGroup(group: TypographyTextGroup) {
  return JSON.parse(JSON.stringify(group)) as TypographyTextGroup
}

export function createTypographyTextBlock(): TypographyTextBlock {
  const block: TypographyTextBlock = {
    id: createTypographyEntityId("text"),
    layerName: "",
    text: "",
    purpose: "",
    customPurpose: "",
    fontStyle: "",
    customFontStyle: "",
    fontSize: "",
    customFontSize: "",
    fontWeight: "regular",
    customFontWeight: "",
    additionalDescription: "",
  }

  block.layerName = getTypographyTextVariableToken(block)
  return block
}

export function createTypographyTextGroup(): TypographyTextGroup {
  const group: TypographyTextGroup = {
    id: createTypographyEntityId("text-group"),
    groupName: "",
    groupPurpose: "",
    customGroupPurpose: "",
    positionSource: "preset",
    positionPreset: "",
    layoutRegionId: "",
    customPositionDescription: "",
    direction: "column",
    writingDirection: undefined,
    alignment: "center",
    distribution: "compact",
    texts: [],
    additionalDescription: "",
  }

  group.groupName = getTypographyGroupVariableToken(group)
  return group
}

export function normalizeTypographyTextBlock(
  value: unknown,
): TypographyTextBlock {
  const source = isRecord(value) ? value : {}
  const block: TypographyTextBlock = {
    id:
      typeof source.id === "string" && source.id.trim()
        ? source.id.trim()
        : createTypographyEntityId("text"),
    layerName:
      typeof source.layerName === "string" ? source.layerName.trim() : "",
    text: typeof source.text === "string" ? source.text : "",
    purpose: typeof source.purpose === "string" ? source.purpose : "",
    customPurpose:
      typeof source.customPurpose === "string" ? source.customPurpose : "",
    fontStyle:
      typeof source.fontStyle === "string" ? source.fontStyle : "",
    customFontStyle:
      typeof source.customFontStyle === "string"
        ? source.customFontStyle
        : "",
    fontSize: typeof source.fontSize === "string" ? source.fontSize : "",
    customFontSize:
      typeof source.customFontSize === "string" ? source.customFontSize : "",
    fontWeight:
      typeof source.fontWeight === "string" && source.fontWeight.trim()
        ? source.fontWeight
        : "regular",
    customFontWeight:
      typeof source.customFontWeight === "string"
        ? source.customFontWeight
        : "",
    additionalDescription:
      typeof source.additionalDescription === "string"
        ? source.additionalDescription
        : "",
  }

  if (!block.layerName) {
    block.layerName = getTypographyTextVariableToken(block)
  }

  return block
}

export function normalizeTypographyTextGroup(
  value: unknown,
): TypographyTextGroup {
  const source = isRecord(value) ? value : {}
  const rawTexts = Array.isArray(source.texts) ? source.texts : []
  const layoutRegionId =
    typeof source.layoutRegionId === "string" ? source.layoutRegionId : ""
  const positionPreset =
    typeof source.positionPreset === "string" ? source.positionPreset : ""

  const inferredPositionSource = layoutRegionId
    ? "layout_region"
    : positionPreset === "custom"
      ? "custom"
      : "preset"

  const positionSource =
    source.positionSource === "layout_region" ||
    source.positionSource === "custom" ||
    source.positionSource === "preset"
      ? source.positionSource
      : inferredPositionSource

  const group: TypographyTextGroup = {
    id:
      typeof source.id === "string" && source.id.trim()
        ? source.id.trim()
        : createTypographyEntityId("text-group"),
    groupName:
      typeof source.groupName === "string" ? source.groupName.trim() : "",
    groupPurpose:
      typeof source.groupPurpose === "string" ? source.groupPurpose : "",
    customGroupPurpose:
      typeof source.customGroupPurpose === "string"
        ? source.customGroupPurpose
        : "",
    positionSource,
    positionPreset,
    layoutRegionId,
    customPositionDescription:
      typeof source.customPositionDescription === "string"
        ? source.customPositionDescription
        : "",
    direction: source.direction === "row" ? "row" : "column",
    writingDirection:
      source.writingDirection === "ltr" ||
      source.writingDirection === "rtl" ||
      source.writingDirection === "vertical_ttb" ||
      source.writingDirection === "vertical_btt"
        ? source.writingDirection
        : undefined,
    alignment:
      source.alignment === "start" ||
      source.alignment === "end" ||
      source.alignment === "justify"
        ? source.alignment
        : "center",
    distribution:
      source.distribution === "balanced" ||
      source.distribution === "spaced" ||
      source.distribution === "scattered"
        ? source.distribution
        : "compact",
    texts: rawTexts.map(normalizeTypographyTextBlock),
    additionalDescription:
      typeof source.additionalDescription === "string"
        ? source.additionalDescription
        : "",
  }

  if (!group.groupName) {
    group.groupName = getTypographyGroupVariableToken(group)
  }

  return group
}

export function normalizeTypographyGroups(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(normalizeTypographyTextGroup)
}

export function cloneTypographyGroups(value: unknown) {
  return normalizeTypographyGroups(value).map(cloneTypographyTextGroup)
}
