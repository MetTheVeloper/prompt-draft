import type { ModuleValues, PromptKeyModule } from "../modules/types"
import { compileLayoutNaturalBlock } from "./compileLayoutNatural"
import { compileTypographyNaturalBlock } from "./compileTypographyNatural"
import type {
  ModuleOutputMap,
  ModuleOutputValue,
  PromptOutputFormat,
} from "./compilePromptCore"
import {
  createPromptIdentityRegistry,
  type PromptIdentityRegistry,
} from "./promptIdentity"

export type PromptFacingRewriteContext = {
  modules?: readonly PromptKeyModule[]
  moduleValues?: Record<string, ModuleValues>
  reservedKeys?: Iterable<string>
  registry?: PromptIdentityRegistry
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cleanToken(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function moduleOutputText(value: ModuleOutputValue) {
  return typeof value === "string" ? value : JSON.stringify(value)
}

function typographyTextKeys(output: Record<string, unknown>) {
  const keys: string[] = []
  const groups = Array.isArray(output.groups) ? output.groups : []

  groups.forEach((group) => {
    if (!isRecord(group)) return
    const texts = Array.isArray(group.texts) ? group.texts : []
    texts.forEach((text) => {
      if (!isRecord(text)) return
      const key = cleanToken(text.key)
      if (key) keys.push(key)
    })
  })

  return keys
}

function getExternalTypographyReferenceText(
  outputs: ModuleOutputMap,
  extraReferenceText: string,
) {
  return [
    extraReferenceText,
    ...Object.entries(outputs)
      .filter(([key]) => key !== "typography")
      .map(([, value]) => moduleOutputText(value)),
  ]
    .filter(Boolean)
    .join("\n")
}

function getReferencedTypographyTextKeys(
  output: Record<string, unknown>,
  externalReferenceText: string,
) {
  return new Set(
    typographyTextKeys(output).filter((key) => externalReferenceText.includes(key)),
  )
}

function replaceDefinition(
  output: string,
  moduleKey: string,
  block: string,
) {
  if (!block) return output

  const pattern = new RegExp(`^\\{${moduleKey}\\} = [^\\n]*$`, "m")
  if (!pattern.test(output)) return output

  return output.replace(pattern, `{${moduleKey}} =\n${block}`)
}

function removeDuplicateNaturalBlock(
  output: string,
  definition: string,
  standaloneBlock: string,
) {
  if (!definition || !standaloneBlock || !output.includes(definition)) {
    return output
  }

  const marker = `\n\n${standaloneBlock}`
  const definitionEnd = output.indexOf(definition) + definition.length
  const duplicateIndex = output.indexOf(marker, definitionEnd)

  if (duplicateIndex < 0) return output

  return (
    output.slice(0, duplicateIndex) +
    output.slice(duplicateIndex + marker.length)
  )
}

/**
 * Final prompt-facing semantic pass.
 *
 * Canonical module state/output keeps stable internal tokens. This pass formats
 * protected structured modules and then rewrites complete `{token}` references
 * through a registry built from stable entity state. No substring/prefix
 * stripping is used here; every alias has a known source identity.
 */
export function rewritePromptFacingStructuredOutput(
  output: string,
  moduleOutputs: ModuleOutputMap,
  format: PromptOutputFormat,
  extraReferenceText = "",
  context: PromptFacingRewriteContext = {},
) {
  if (!output || format === "json") return output

  const registry = context.registry || createPromptIdentityRegistry({
    modules: context.modules,
    moduleValues: context.moduleValues,
    outputs: moduleOutputs,
    reservedKeys: context.reservedKeys,
  })
  const externalTypographyReferenceText = getExternalTypographyReferenceText(
    moduleOutputs,
    extraReferenceText,
  )

  let nextOutput = output
  let layoutBlock = ""
  let typographyDefinitionBlock = ""

  const layoutOutput = moduleOutputs.layout
  if (isRecord(layoutOutput)) {
    layoutBlock = compileLayoutNaturalBlock(layoutOutput)
    nextOutput = replaceDefinition(nextOutput, "layout", layoutBlock)
  }

  const typographyOutput = moduleOutputs.typography
  if (isRecord(typographyOutput)) {
    const referencedTypographyTextKeys = getReferencedTypographyTextKeys(
      typographyOutput,
      externalTypographyReferenceText,
    )
    typographyDefinitionBlock = compileTypographyNaturalBlock(typographyOutput, {
      referencedTextKeys: referencedTypographyTextKeys,
      includeHeading: false,
    })
    nextOutput = replaceDefinition(
      nextOutput,
      "typography",
      typographyDefinitionBlock,
    )
  }

  nextOutput = registry.rewrite(nextOutput)

  if (format === "natural") {
    const aliasedLayoutBlock = registry.rewrite(layoutBlock)
    const aliasedTypographyBlock = registry.rewrite(typographyDefinitionBlock)

    if (aliasedLayoutBlock) {
      nextOutput = removeDuplicateNaturalBlock(
        nextOutput,
        `{layout} =\n${aliasedLayoutBlock}`,
        aliasedLayoutBlock,
      )
    }

    if (aliasedTypographyBlock) {
      nextOutput = removeDuplicateNaturalBlock(
        nextOutput,
        `{typography} =\n${aliasedTypographyBlock}`,
        `Typography:\n${aliasedTypographyBlock}`,
      )
    }
  }

  return nextOutput
}
