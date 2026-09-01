import type { ModuleValues, PromptKeyModule } from "../modules/types"
import { compileLayoutNaturalBlock } from "./compileLayoutNatural"
import { compileTypographyNaturalBlock } from "./compileTypographyNatural"
import { formatHairOutputForReferences } from "./compileHair"
import { formatOutfitOutputForReferences } from "./compileOutfit"
import {
  formatHairOutputWithPromptAliases,
  formatOutfitOutputWithPromptAliases,
} from "./specializedEntityAliases"
import type {
  ModuleOutputMap,
  ModuleOutputValue,
  PromptOutputFormat,
} from "./compilePromptCore"
import type { PromptIdentityRegistry } from "./promptIdentity"
import { createPromptFacingIdentityRegistry } from "./promptFacingIdentity"

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

function getExternalModuleReferenceText(
  moduleKey: string,
  outputs: ModuleOutputMap,
  extraReferenceText: string,
) {
  return [
    extraReferenceText,
    ...Object.entries(outputs)
      .filter(([key]) => key !== moduleKey)
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

function createRegistry(
  moduleOutputs: ModuleOutputMap,
  context: PromptFacingRewriteContext,
) {
  return context.registry || createPromptFacingIdentityRegistry({
    modules: context.modules,
    moduleValues: context.moduleValues,
    outputs: moduleOutputs,
    reservedKeys: context.reservedKeys,
  })
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

function replaceExactBlock(output: string, currentBlock: string, nextBlock: string) {
  if (!currentBlock || !nextBlock || currentBlock === nextBlock) return output
  return output.split(currentBlock).join(nextBlock)
}

function replaceSpecializedEntityBlocks(
  output: string,
  moduleOutputs: ModuleOutputMap,
  extraReferenceText: string,
  registry: PromptIdentityRegistry,
) {
  let nextOutput = output

  const hairOutput = moduleOutputs.hair
  if (typeof hairOutput === "string" && hairOutput.trim()) {
    const external = getExternalModuleReferenceText(
      "hair",
      moduleOutputs,
      extraReferenceText,
    )
    nextOutput = replaceExactBlock(
      nextOutput,
      formatHairOutputForReferences(hairOutput, external),
      formatHairOutputWithPromptAliases(hairOutput, external, registry.aliases),
    )
  }

  const outfitOutput = moduleOutputs.outfit
  if (typeof outfitOutput === "string" && outfitOutput.trim()) {
    const external = getExternalModuleReferenceText(
      "outfit",
      moduleOutputs,
      extraReferenceText,
    )
    nextOutput = replaceExactBlock(
      nextOutput,
      formatOutfitOutputForReferences(outfitOutput, external),
      formatOutfitOutputWithPromptAliases(outfitOutput, external, registry.aliases),
    )
  }

  return nextOutput
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

/** Display-only structured module formatter shared by module cards. */
export function formatPromptFacingStructuredModuleOutput(
  moduleKey: string,
  value: ModuleOutputValue,
  format: PromptOutputFormat,
  moduleOutputs: ModuleOutputMap,
  context: PromptFacingRewriteContext = {},
) {
  if (format === "json" || !isRecord(value)) return ""
  if (moduleKey !== "layout" && moduleKey !== "typography") return ""

  const registry = createRegistry(moduleOutputs, context)

  if (moduleKey === "layout") {
    const block = registry.rewrite(compileLayoutNaturalBlock(value))
    if (!block) return ""
    return format === "modular" ? `{layout} =\n${block}` : block
  }

  const referencedTextKeys = getReferencedTypographyTextKeys(
    value,
    getExternalModuleReferenceText("typography", moduleOutputs, ""),
  )
  const block = registry.rewrite(
    compileTypographyNaturalBlock(value, {
      referencedTextKeys,
      includeHeading: format === "natural",
    }),
  )
  if (!block) return ""
  return format === "modular" ? `{typography} =\n${block}` : block
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

  const registry = createRegistry(moduleOutputs, context)
  const externalTypographyReferenceText = getExternalModuleReferenceText(
    "typography",
    moduleOutputs,
    extraReferenceText,
  )

  let nextOutput = replaceSpecializedEntityBlocks(
    output,
    moduleOutputs,
    extraReferenceText,
    registry,
  )
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
