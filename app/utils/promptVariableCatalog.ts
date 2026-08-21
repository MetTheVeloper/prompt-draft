import type {
  ModuleOutputMap,
  ModuleOutputValue,
} from "./compilePrompt"
import type {
  ModuleValues,
  PromptKeyModule,
  PromptVariable,
  PromptVariableGroup,
  TypographyTextBlock,
  TypographyTextGroup,
} from "../modules/types"
import type { OutfitItem, OutfitSet } from "../modules/outfit.types"
import { outfitItemTypeMap } from "../modules/outfit.catalog"
import type { HairComponent, HairStyle } from "../modules/hair.types"
import { hairComponentTypeMap } from "../modules/hair.catalog"
import type { LayoutRegion } from "../modules/layout.types"
import { normalizeLayoutRegionsState } from "./layoutRegions"
import { normalizeTypographyGroups } from "./typography"
import { normalizeOutfitSets } from "./compileOutfit"
import { normalizeHairStyles } from "./compileHair"
import {
  getLayoutRegionVariableKey,
  getTypographyGroupVariableKey,
  getTypographyTextVariableKey,
} from "./structuralVariables"
import {
  getOutfitItemVariableKey,
  getOutfitItemVariableToken,
  getOutfitSetVariableKey,
  getOutfitSetVariableToken,
} from "./outfitVariables"
import {
  getHairComponentVariableKey,
  getHairComponentVariableToken,
  getHairStyleVariableKey,
  getHairStyleVariableToken,
} from "./hairVariables"

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

function serializeValue(value: unknown) {
  if (typeof value === "string") return value.trim()

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value ?? "")
  }
}

function hasOutput(value: ModuleOutputValue | undefined) {
  if (value === undefined || value === null) return false
  if (typeof value === "string") return Boolean(value.trim())
  return Object.keys(value).length > 0
}

function createModuleVariable(
  module: PromptKeyModule,
  output: ModuleOutputValue,
): PromptVariable {
  const semanticCapabilities =
    module.semanticTargets?.exposeOutput === true
      ? [...module.semanticTargets.capabilities]
      : undefined

  return {
    id: `module:${module.key}`,
    key: module.key,
    label: module.key,
    value: serializeValue(output),
    description: `Compiled output of the ${module.key} module.`,
    type: "system",
    enabled: true,
    source: "module",
    moduleKey: module.key,
    entityType: "module",
    entityId: module.key,
    semanticCapabilities,
  }
}

function roundCoordinate(value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.round((number + Number.EPSILON) * 100) / 100
}

function getLayoutRegionRole(region: LayoutRegion) {
  if (region.role === "none") return ""

  if (region.role === "custom") {
    return cleanText(region.customRole)
  }

  return region.role.replace(/_/g, " ")
}

function createLayoutRegionVariable(
  region: LayoutRegion,
  index: number,
): PromptVariable {
  const key = getLayoutRegionVariableKey(region.id)
  const label = cleanText(region.name) || `Region ${index + 1}`
  const name = cleanText(region.name) || `region_${index + 1}`
  const role = getLayoutRegionRole(region)

  return {
    id: `layout:${region.id}`,
    key,
    label,
    value: serializeValue({
      id: region.id,
      key: `{${key}}`,
      name,
      role: role || undefined,
      contentKey: cleanText(region.contentKey) || undefined,
      bounds: {
        x: roundCoordinate(region.x),
        y: roundCoordinate(region.y),
        width: roundCoordinate(region.width),
        height: roundCoordinate(region.height),
      },
      layer: Number.isFinite(Number(region.layer))
        ? Number(region.layer)
        : index,
    }),
    description: `Layout region: ${label}.`,
    type: "reference",
    enabled: true,
    source: "module",
    moduleKey: "layout",
    entityType: "region",
    entityId: region.id,
  }
}

function createTypographyGroupVariable(
  group: TypographyTextGroup,
  index: number,
): PromptVariable {
  const key = getTypographyGroupVariableKey(group)
  const label = cleanText(group.groupName) || `Text Group ${index + 1}`

  return {
    id: `typography:${group.id || key}`,
    key,
    label,
    value: serializeValue({
      id: group.id,
      key: `{${key}}`,
      purpose: group.groupPurpose || undefined,
      positionSource: group.positionSource || undefined,
      positionPreset: group.positionPreset || undefined,
      layoutRegionId: group.layoutRegionId || undefined,
      texts: (group.texts || []).map((block) => {
        return `{${getTypographyTextVariableKey(block)}}`
      }),
    }),
    description: `Typography text group: ${label}.`,
    type: "reference",
    enabled: true,
    source: "module",
    moduleKey: "typography",
    entityType: "text_group",
    entityId: group.id || key,
  }
}

function createTypographyTextVariable(
  block: TypographyTextBlock,
  group: TypographyTextGroup,
  groupIndex: number,
  blockIndex: number,
): PromptVariable {
  const key = getTypographyTextVariableKey(block)
  const content = cleanText(block.text)
  const label = cleanText(block.layerName) || `Text ${blockIndex + 1}`

  return {
    id: `typography:${group.id || groupIndex}:${block.id || key}`,
    key,
    label,
    value: serializeValue({
      id: block.id,
      key: `{${key}}`,
      content,
      purpose: block.purpose || undefined,
      fontStyle: block.fontStyle || undefined,
      fontSize: block.fontSize || undefined,
      fontWeight: block.fontWeight || undefined,
      parent: `{${getTypographyGroupVariableKey(group)}}`,
    }),
    description: content
      ? `Typography text: ${content}.`
      : `Typography text item ${blockIndex + 1}.`,
    type: "text",
    enabled: Boolean(content),
    source: "module",
    moduleKey: "typography",
    entityType: "text",
    entityId: block.id || key,
    parentId: group.id || String(groupIndex),
  }
}

function createOutfitSetVariable(set: OutfitSet, index: number): PromptVariable {
  const key = getOutfitSetVariableKey(set)
  const token = getOutfitSetVariableToken(set)
  const label = cleanText(set.name) || `Outfit Set ${index + 1}`

  return {
    id: `outfit:${set.id}`,
    key,
    label,
    value: serializeValue({
      id: set.id,
      semanticKey: set.key,
      key: token,
      name: label,
      targets: set.targets.map((target) => target.token || target.value),
      items: set.items.map((item) => getOutfitItemVariableToken(set, item)),
    }),
    description: `Outfit set: ${label}.`,
    type: "reference",
    enabled: set.items.length > 0,
    source: "module",
    moduleKey: "outfit",
    entityType: "outfit_set",
    entityId: set.id,
    semanticCapabilities: ["color", "material"],
  }
}

function createOutfitItemVariable(
  item: OutfitItem,
  set: OutfitSet,
  setIndex: number,
  itemIndex: number,
): PromptVariable {
  const key = getOutfitItemVariableKey(set, item)
  const token = getOutfitItemVariableToken(set, item)
  const definition = outfitItemTypeMap.get(item.type)
  const label =
    cleanText(item.name) ||
    cleanText(item.customType) ||
    definition?.label ||
    `Outfit Item ${itemIndex + 1}`
  const parentLabel = cleanText(set.name) || `Outfit Set ${setIndex + 1}`

  return {
    id: `outfit:${set.id}:${item.id}`,
    key,
    label,
    value: serializeValue({
      id: item.id,
      semanticKey: item.key,
      key: token,
      type: item.type,
      customType: cleanText(item.customType) || undefined,
      parent: getOutfitSetVariableToken(set),
      source: item.source,
      properties: item.properties,
    }),
    description: `${label} · ${parentLabel}`,
    type: "reference",
    enabled: true,
    source: "module",
    moduleKey: "outfit",
    entityType: "outfit_item",
    entityId: item.id,
    parentId: set.id,
    semanticCapabilities: definition?.semanticCapabilities?.length
      ? [...definition.semanticCapabilities]
      : ["color", "material"],
  }
}

function createHairStyleVariable(style: HairStyle, index: number): PromptVariable {
  const key = getHairStyleVariableKey(style)
  const token = getHairStyleVariableToken(style)
  const label = cleanText(style.name) || `Hairstyle ${index + 1}`

  return {
    id: `hair:${style.id}`,
    key,
    label,
    value: serializeValue({
      id: style.id,
      semanticKey: style.key,
      key: token,
      name: label,
      targets: style.targets.map((target) => target.token || target.value),
      source: style.source,
      properties: style.properties,
      components: style.components.map((component) =>
        getHairComponentVariableToken(style, component),
      ),
    }),
    description: `Hairstyle: ${label}.`,
    type: "reference",
    enabled: true,
    source: "module",
    moduleKey: "hair",
    entityType: "hair_style",
    entityId: style.id,
    semanticCapabilities: ["color", "material"],
  }
}

function createHairComponentVariable(
  component: HairComponent,
  style: HairStyle,
  styleIndex: number,
  componentIndex: number,
): PromptVariable {
  const key = getHairComponentVariableKey(style, component)
  const token = getHairComponentVariableToken(style, component)
  const definition = hairComponentTypeMap.get(component.type)
  const label =
    cleanText(component.name) ||
    cleanText(component.customType) ||
    definition?.label ||
    `Hair Component ${componentIndex + 1}`
  const parentLabel = cleanText(style.name) || `Hairstyle ${styleIndex + 1}`

  return {
    id: `hair:${style.id}:${component.id}`,
    key,
    label,
    value: serializeValue({
      id: component.id,
      semanticKey: component.key,
      key: token,
      type: component.type,
      customType: cleanText(component.customType) || undefined,
      parent: getHairStyleVariableToken(style),
      properties: component.properties,
    }),
    description: `${label} · ${parentLabel}`,
    type: "reference",
    enabled: true,
    source: "module",
    moduleKey: "hair",
    entityType: "hair_component",
    entityId: component.id,
    parentId: style.id,
    semanticCapabilities: definition?.semanticCapabilities?.length
      ? [...definition.semanticCapabilities]
      : ["color", "material"],
  }
}

function moduleChildren(
  module: PromptKeyModule,
  values: ModuleValues,
): PromptVariable[] {
  if (module.key === "layout") {
    return normalizeLayoutRegionsState(values.regions).regions.map(
      createLayoutRegionVariable,
    )
  }

  if (module.key === "typography") {
    return normalizeTypographyGroups(values.textGroups).flatMap(
      (group, groupIndex) => {
        return [
          createTypographyGroupVariable(group, groupIndex),
          ...(group.texts || []).map((block, blockIndex) => {
            return createTypographyTextVariable(
              block,
              group,
              groupIndex,
              blockIndex,
            )
          }),
        ]
      },
    )
  }

  if (module.key === "outfit") {
    return normalizeOutfitSets(values.outfitSets).flatMap((set, setIndex) => {
      return [
        createOutfitSetVariable(set, setIndex),
        ...set.items.map((item, itemIndex) =>
          createOutfitItemVariable(item, set, setIndex, itemIndex),
        ),
      ]
    })
  }

  if (module.key === "hair") {
    return normalizeHairStyles(values.hairStyles).flatMap((style, styleIndex) => {
      return [
        createHairStyleVariable(style, styleIndex),
        ...style.components.map((component, componentIndex) =>
          createHairComponentVariable(
            component,
            style,
            styleIndex,
            componentIndex,
          ),
        ),
      ]
    })
  }

  return []
}

export function buildModuleVariableGroups(
  modules: PromptKeyModule[],
  moduleValues: Record<string, ModuleValues>,
  outputs: ModuleOutputMap,
): PromptVariableGroup[] {
  return modules
    .filter((module) => module.key !== "variables")
    .map((module, moduleIndex) => {
      const output = outputs[module.key]
      const variables: PromptVariable[] = []

      if (hasOutput(output)) {
        variables.push(createModuleVariable(module, output))
      }

      variables.push(
        ...moduleChildren(module, moduleValues[module.key] || {}),
      )

      return {
        id: module.key,
        labelKey: `modules.${module.key}.title`,
        label: module.key,
        icon: module.icon,
        order: 20 + moduleIndex,
        source: "module" as const,
        variables,
      }
    })
    .filter((group) => group.variables.length > 0)
}
