import type {
  TypographyTextBlock,
  TypographyTextGroup,
} from "../modules/types"

export function normalizeStructuralVariableKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^\{+|\}+$/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
}

export function formatStructuralVariableToken(value: unknown) {
  const key = normalizeStructuralVariableKey(value)
  return key ? `{${key}}` : ""
}

export function isStructuralVariableToken(value: unknown) {
  return /^\{[a-z0-9_]+\}$/i.test(String(value ?? "").trim())
}

function entitySuffix(value: unknown, removablePrefixes: string[]) {
  let result = String(value ?? "").trim().toLowerCase()

  for (const prefix of removablePrefixes) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length)
      break
    }
  }

  return normalizeStructuralVariableKey(result) || "item"
}

export function getLayoutRegionVariableKey(regionId: unknown) {
  return `layout_region_${entitySuffix(regionId, ["region-", "region_"])}`
}

export function getLayoutRegionVariableToken(regionId: unknown) {
  return formatStructuralVariableToken(getLayoutRegionVariableKey(regionId))
}

export function getTypographyGroupVariableKey(group: TypographyTextGroup) {
  const existing = normalizeStructuralVariableKey(group.groupName)

  if (existing) return existing

  return `text_group_${entitySuffix(group.id, ["text-group-", "text_group_"])}`
}

export function getTypographyGroupVariableToken(group: TypographyTextGroup) {
  return formatStructuralVariableToken(getTypographyGroupVariableKey(group))
}

export function getTypographyTextVariableKey(block: TypographyTextBlock) {
  const existing = normalizeStructuralVariableKey(block.layerName)

  if (existing) return existing

  return `text_${entitySuffix(block.id, ["text-", "text_"])}`
}

export function getTypographyTextVariableToken(block: TypographyTextBlock) {
  return formatStructuralVariableToken(getTypographyTextVariableKey(block))
}
