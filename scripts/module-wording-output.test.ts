import assert from "node:assert/strict"
import test from "node:test"
import {
  formatPromptFacingStructuredModuleOutput,
  rewritePromptFacingStructuredOutput,
} from "../app/utils/promptOutputAliases.ts"
import {
  createTypographyTextBlock,
  resolveTypographyTextVariableReferences,
} from "../app/utils/typography.ts"
import { isReservedVariableKey } from "../app/utils/promptVariables.ts"
import type {
  PromptVariable,
  TypographyTextGroup,
} from "../app/modules/types.ts"

const layoutOutput = {
  type: "poster layout",
  density: "balanced visual density",
  coordinateSystem: "normalized values from 0 to 1",
  regions: [
    {
      id: "region-oeo",
      key: "{layout_region_oeo}",
      name: "region_1",
      role: "text",
      contentKey: "{text_group_fij}",
      bounds: {
        x: 0,
        y: 0,
        width: 1,
        height: 0.83,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      fit: "contain",
      overflow: "clip",
    },
    {
      id: "region-4l6",
      key: "{layout_region_4l6}",
      name: "region_2",
      role: "text",
      contentKey: "{text_group_3yr}",
      bounds: {
        x: 0,
        y: 0.83,
        width: 1,
        height: 0.17,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      fit: "contain",
    },
  ],
}

const typographyOutput = {
  groups: [
    {
      key: "{text_group_fij}",
      purpose: "product information area",
      position: "{layout_region_oeo}",
      layout: "vertical column, center aligned, compact spacing",
      texts: [
        {
          key: "{text_23u}",
          content: "{mainTitle}",
          purpose: "main title",
          style: "retro script lettering",
          size: "large",
          weight: "extra-bold 800",
        },
        {
          key: "{text_yy0}",
          content: "{description}",
          purpose: "slogan",
          style: "retro script lettering",
          size: "medium",
        },
      ],
    },
    {
      key: "{text_group_3yr}",
      purpose: "credits area",
      position: "{layout_region_4l6}",
      layout: "vertical column, center aligned, compact spacing",
      texts: [
        {
          key: "{text_f0s}",
          content: "{address}",
          purpose: "credits text",
          style: "handwritten lettering",
          size: "small",
        },
      ],
    },
  ],
  textAccuracy: "exact",
}

test("modular Layout uses semantic percentage prose instead of structured JSON noise", () => {
  const raw = `{layout} = ${JSON.stringify(layoutOutput)}`
  const output = rewritePromptFacingStructuredOutput(
    raw,
    { layout: layoutOutput },
    "modular",
  )

  assert.match(output, /^\{layout\} =\nUse a poster layout with balanced visual density\./m)
  assert.match(output, /Interpret all region bounds as percentages from 0% to 100%\./)
  assert.match(output, /• \{r_1\} \(role: text;/)
  assert.match(output, /bounds: x: 0%, y: 0%, width: 100%, height: 83%/)
  assert.match(output, /• \{r_2\} \(role: text;/)
  assert.doesNotMatch(output, /coordinateSystem/)
  assert.doesNotMatch(output, /region-oeo/)
  assert.doesNotMatch(output, /layout_region_oeo/)
})

test("Layout and Typography share short prompt aliases and direct user Text references", () => {
  const raw = [
    `{layout} = ${JSON.stringify(layoutOutput)}`,
    `{typography} = ${JSON.stringify(typographyOutput)}`,
  ].join("\n")
  const output = rewritePromptFacingStructuredOutput(
    raw,
    {
      layout: layoutOutput,
      typography: typographyOutput,
    },
    "modular",
  )

  assert.match(output, /content: \{tg_1\}/)
  assert.match(output, /content: \{tg_2\}/)
  assert.match(
    output,
    /• \{tg_1\}: In \{r_1\}, arrange \{mainTitle\} and \{description\} vertically, center aligned, with compact spacing, as the product information area\./,
  )
  assert.match(
    output,
    /Style \{mainTitle\} as the main title, using large retro script lettering, with extra-bold 800 weight\./,
  )
  assert.match(
    output,
    /Style \{description\} as the slogan, using medium retro script lettering\./,
  )
  assert.match(
    output,
    /• \{tg_2\}: In \{r_2\}, arrange \{address\} vertically, center aligned, with compact spacing, as the credits area\./,
  )
  assert.doesNotMatch(output, /\{text_group_/)
  assert.doesNotMatch(output, /\{text_[a-z0-9]+\}/)
  assert.doesNotMatch(output, /"groups"/)
})

test("Typography keeps a short text alias only when another module references that text entity", () => {
  const raw = [
    `{typography} = ${JSON.stringify(typographyOutput)}`,
    "{rules} = apply emphasis to {text_23u}",
  ].join("\n")
  const output = rewritePromptFacingStructuredOutput(
    raw,
    {
      typography: typographyOutput,
      style: "apply emphasis to {text_23u}",
    },
    "modular",
  )

  assert.match(output, /\{tt_1\} \(\{mainTitle\}\)/)
  assert.match(output, /apply emphasis to \{tt_1\}/)
  assert.doesNotMatch(output, /\{text_23u\}/)
  assert.doesNotMatch(output, /\{tt_2\} \(\{description\}\)/)
})

test("structured module previews use the same prompt-facing aliases as final modular output", () => {
  const outputs = {
    layout: layoutOutput,
    typography: typographyOutput,
  }
  const layoutPreview = formatPromptFacingStructuredModuleOutput(
    "layout",
    layoutOutput,
    "modular",
    outputs,
  )
  const typographyPreview = formatPromptFacingStructuredModuleOutput(
    "typography",
    typographyOutput,
    "modular",
    outputs,
  )

  assert.match(layoutPreview, /^\{layout\} =\nUse a poster layout/m)
  assert.match(layoutPreview, /content: \{tg_1\}/)
  assert.doesNotMatch(layoutPreview, /\{text_group_/)

  assert.match(typographyPreview, /^\{typography\} =\n• \{tg_1\}:/m)
  assert.match(typographyPreview, /arrange \{mainTitle\} and \{description\}/)
  assert.doesNotMatch(typographyPreview, /\{text_group_/)
  assert.doesNotMatch(typographyPreview, /\{text_[a-z0-9]+\}/)
  assert.doesNotMatch(typographyPreview, /\{tt_[0-9]+\}/)
})

test("natural Typography preview does not expose text aliases unless externally referenced", () => {
  const preview = formatPromptFacingStructuredModuleOutput(
    "typography",
    typographyOutput,
    "natural",
    {
      layout: layoutOutput,
      typography: typographyOutput,
    },
  )

  assert.match(preview, /^Typography:\n• \{tg_1\}:/m)
  assert.match(preview, /In \{r_1\}/)
  assert.match(preview, /Style \{mainTitle\} as the main title/)
  assert.doesNotMatch(preview, /\{text_group_/)
  assert.doesNotMatch(preview, /\{text_[a-z0-9]+\}/)
  assert.doesNotMatch(preview, /\{tt_[0-9]+\}/)
})

test("JSON output is not rewritten into prompt-facing aliases", () => {
  const raw = JSON.stringify({
    modules: {
      layout: layoutOutput,
      typography: typographyOutput,
    },
  }, null, 2)

  assert.equal(
    rewritePromptFacingStructuredOutput(
      raw,
      {
        layout: layoutOutput,
        typography: typographyOutput,
      },
      "json",
    ),
    raw,
  )
})

test("Typography follows a renamed Text variable through its stable variable id", () => {
  const block = createTypographyTextBlock({
    id: "variable-title",
    key: "t1",
  })
  const groups: TypographyTextGroup[] = [
    {
      id: "text-group-demo",
      groupName: "{text_group_demo}",
      texts: [block],
    },
  ]
  const variables: PromptVariable[] = [
    {
      id: "variable-title",
      key: "mainTitle",
      value: "Prompt Draft",
      type: "text",
      source: "user",
      enabled: true,
    },
  ]

  const resolved = resolveTypographyTextVariableReferences(groups, variables)
  const resolvedBlock = resolved[0]?.texts[0] as (
    | (typeof block & { textVariableId?: string })
    | undefined
  )

  assert.equal(resolvedBlock?.text, "{mainTitle}")
  assert.equal(resolvedBlock?.textVariableId, "variable-title")
})

test("legacy Typography blocks backfill stable Text variable identity when possible", () => {
  const groups: TypographyTextGroup[] = [
    {
      id: "text-group-demo",
      groupName: "{text_group_demo}",
      texts: [
        {
          id: "text-demo",
          layerName: "{text_demo}",
          text: "{mainTitle}",
        },
      ],
    },
  ]
  const variables: PromptVariable[] = [
    {
      id: "variable-title",
      key: "mainTitle",
      value: "Prompt Draft",
      type: "text",
      source: "user",
      enabled: true,
    },
  ]

  const resolved = resolveTypographyTextVariableReferences(groups, variables)
  const resolvedBlock = resolved[0]?.texts[0] as (
    | ({ text: string } & { textVariableId?: string })
    | undefined
  )

  assert.equal(resolvedBlock?.text, "{mainTitle}")
  assert.equal(resolvedBlock?.textVariableId, "variable-title")
})

test("short prompt alias namespaces are reserved from user variables", () => {
  assert.equal(isReservedVariableKey("r_1"), true)
  assert.equal(isReservedVariableKey("tg_1"), true)
  assert.equal(isReservedVariableKey("tt_1"), true)
  assert.equal(isReservedVariableKey("mainTitle"), false)
})
