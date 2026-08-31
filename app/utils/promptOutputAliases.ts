import { compileLayoutNaturalBlock } from "./compileLayoutNatural"
import { compileTypographyNaturalBlock } from "./compileTypographyNatural"
import type {
  ModuleOutputMap,
  ModuleOutputValue,
  PromptOutputFormat,
} from "./compilePromptCore"

type AliasEntry = {
  source: string
  alias: string
}

type PromptOutputAliasContext = {
  replacements: Map<string, string>
  typographyTextAliases: AliasEntry[]
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

function addAlias(
  context: PromptOutputAliasContext,
  source: unknown,
  alias: string,
  kind?: "typography_text",
) {
  const sourceToken = cleanToken(source)
  if (!sourceToken || context.replacements.has(sourceToken)) return

  context.replacements.set(sourceToken, alias)

  if (kind === "typography_text") {
    context.typographyTextAliases.push({ source: sourceToken, alias })
  }
}

function createPromptOutputAliasContext(outputs: ModuleOutputMap) {
  const context: PromptOutputAliasContext = {
    replacements: new Map(),
    typographyTextAliases: [],
  }

  const layoutOutput = outputs.layout
  if (isRecord(layoutOutput) && Array.isArray(layoutOutput.regions)) {
    layoutOutput.regions.forEach((region, index) => {
      if (!isRecord(region)) return
      addAlias(context, region.key, `{r_${index + 1}}`)
    })
  }

  const typographyOutput = outputs.typography
  if (isRecord(typographyOutput) && Array.isArray(typographyOutput.groups)) {
    let textIndex = 0

    typographyOutput.groups.forEach((group, groupIndex) => {
      if (!isRecord(group)) return

      addAlias(context, group.key, `{tg_${groupIndex + 1}}`)

      const texts = Array.isArray(group.texts) ? group.texts : []
      texts.forEach((text) => {
        textIndex += 1
        if (!isRecord(text)) return
        addAlias(context, text.key, `{tt_${textIndex}}`, "typography_text")
      })
    })
  }

  return context
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
  context: PromptOutputAliasContext,
  externalReferenceText: string,
) {
  return new Set(
    context.typographyTextAliases
      .filter((entry) => externalReferenceText.includes(entry.source))
      .map((entry) => entry.source),
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

function replaceAliases(
  output: string,
  context: PromptOutputAliasContext,
) {
  let nextOutput = output

  context.replacements.forEach((alias, source) => {
    nextOutput = nextOutput.split(source).join(alias)
  })

  return nextOutput
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function stripUnneededTypographyTextAliases(
  output: string,
  context: PromptOutputAliasContext,
  referencedTextKeys: ReadonlySet<string>,
) {
  let nextOutput = output

  context.typographyTextAliases.forEach((entry) => {
    if (referencedTextKeys.has(entry.source)) return

    const pattern = new RegExp(
      `${escapeRegExp(entry.alias)}\\s*\\(([^()\\n]+)\\)`,
      "g",
    )
    nextOutput = nextOutput.replace(pattern, "$1")
  })

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

export function rewritePromptFacingStructuredOutput(
  output: string,
  moduleOutputs: ModuleOutputMap,
  format: PromptOutputFormat,
  extraReferenceText = "",
) {
  if (!output || format === "json") return output

  const context = createPromptOutputAliasContext(moduleOutputs)
  const externalTypographyReferenceText = getExternalTypographyReferenceText(
    moduleOutputs,
    extraReferenceText,
  )
  const referencedTypographyTextKeys = getReferencedTypographyTextKeys(
    context,
    externalTypographyReferenceText,
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

  nextOutput = replaceAliases(nextOutput, context)
  nextOutput = stripUnneededTypographyTextAliases(
    nextOutput,
    context,
    referencedTypographyTextKeys,
  )

  if (format === "natural") {
    const aliasedLayoutBlock = stripUnneededTypographyTextAliases(
      replaceAliases(layoutBlock, context),
      context,
      referencedTypographyTextKeys,
    )
    const aliasedTypographyBlock = stripUnneededTypographyTextAliases(
      replaceAliases(typographyDefinitionBlock, context),
      context,
      referencedTypographyTextKeys,
    )

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
