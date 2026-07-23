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
import type { LayoutRegion } from "../modules/layout.types"
import { normalizeLayoutRegionsState } from "./layoutRegions"
import { normalizeTypographyGroups } from "./typography"
import {
  getLayoutRegionVariableKey,
  getTypographyGroupVariableKey,
  getTypographyTextVariableKey,
} from "./structuralVariables"

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
  }
}

function roundCoordinate(value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.round((number + Number.EPSILON) * 100) / 100
}

function createLayoutRegionVariable(
  region: LayoutRegion,
  index: number,
): PromptVariable {
  const key = getLayoutRegionVariableKey(region.id)
  const label = cleanText(region.name) || `Region ${index + 1}`

  return {
    id: `layout:${region.id}`,
    key,
    label,
    value: serializeValue({
      id: region.id,
      key: `{${key}}`,
      name: label,
      role: region.role !== "none" ? region.role : undefined,
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
