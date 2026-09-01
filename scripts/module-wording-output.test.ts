import assert from "node:assert/strict"
import test from "node:test"
import type {
  PromptKeyModule,
  PromptVariable,
  TypographyTextGroup,
} from "../app/modules/types.ts"
import { withModuleEntityConfig } from "../app/modules/entityContracts.ts"
import {
  formatPromptFacingStructuredModuleOutput,
  rewritePromptFacingStructuredOutput,
} from "../app/utils/promptOutputAliases.ts"
import {
  createTypographyTextBlock,
  resolveTypographyTextVariableReferences,
} from "../app/utils/typography.ts"
import { isReservedVariableKey } from "../app/utils/promptVariables.ts"
import { createPromptFacingIdentityRegistry } from "../app/utils/promptFacingIdentity.ts"
import { getHairComponentVariableToken } from "../app/utils/hairVariables.ts"
import {
  createDefaultPromptSettings,
} from "../app/utils/compilePromptCore.ts"
import { compilePromptOutputPure } from "../app/utils/compilePromptPure.ts"

const layoutOutput = {
  type: "poster layout",
  density: "balanced visual density",
  coordinateSystem: "normalized values from 0 to 1",
  regions: [
    {
      id: "region-oeo",
      key: "{layout_region_oeo}",
      name: "top left",
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
      name: "bottom right",
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

function namedModule(key: string): PromptKeyModule {
  return withModuleEntityConfig(
    {
      key,
      fields: {},
    },
    {
      enabled: true,
      sceneExposable: true,
    },
  )
}

test("modular Layout uses semantic region names and percentage prose", () => {
  const raw = `{layout} = ${JSON.stringify(layoutOutput)}`
  const output = rewritePromptFacingStructuredOutput(
    raw,
    { layout: layoutOutput },
    "modular",
  )

  assert.match(output, /^\{layout\} =\nUse a poster layout with balanced visual density\./m)
  assert.match(output, /Interpret all region bounds as percentages from 0% to 100%\./)
  assert.match(output, /• \{topLeft\} \(role: text;/)
  assert.match(output, /bounds: x: 0%, y: 0%, width: 100%, height: 83%/)
  assert.match(output, /• \{bottomRight\} \(role: text;/)
  assert.doesNotMatch(output, /coordinateSystem/)
  assert.doesNotMatch(output, /region-oeo/)
  assert.doesNotMatch(output, /layout_region_oeo/)
  assert.doesNotMatch(output, /\{r_[0-9]+\}/)
})

test("Layout and Typography share semantic region names, short group aliases, and direct user Text references", () => {
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
    /• \{tg_1\}: In \{topLeft\}, arrange \{mainTitle\} and \{description\} vertically, center aligned, with compact spacing, as the product information area\./,
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
    /• \{tg_2\}: In \{bottomRight\}, arrange \{address\} vertically, center aligned, with compact spacing, as the credits area\./,
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

test("structured module previews use the same semantic identities as final modular output", () => {
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
  assert.match(layoutPreview, /• \{topLeft\}/)
  assert.match(layoutPreview, /content: \{tg_1\}/)
  assert.doesNotMatch(layoutPreview, /\{layout_region_/)

  assert.match(typographyPreview, /^\{typography\} =\n• \{tg_1\}:/m)
  assert.match(typographyPreview, /In \{topLeft\}/)
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
  assert.match(preview, /In \{topLeft\}/)
  assert.match(preview, /Style \{mainTitle\} as the main title/)
  assert.doesNotMatch(preview, /\{text_group_/)
  assert.doesNotMatch(preview, /\{text_[a-z0-9]+\}/)
  assert.doesNotMatch(preview, /\{tt_[0-9]+\}/)
})

test("named configurations across Scene, Style, Form, and Effects use semantic prompt identities", () => {
  const modules: PromptKeyModule[] = [
    { key: "layout", fields: {} },
    { key: "scene", fields: {} },
    namedModule("style"),
    namedModule("form"),
    namedModule("effects"),
  ]
  const outputs = {
    layout: {
      regions: [
        {
          key: "{layout_region_top}",
          name: "top left",
          contentKey: "{scene_scene1}",
          bounds: { x: 0, y: 0, width: 1, height: 1 },
        },
      ],
    },
    scene: "• {scene_scene1} = show {subject}. Use {style_clay} as this scene's visual style. Apply {form_form1} to this scene. Apply {effects_effects1} as this scene's effects.",
    style: "• {style_clay} = claymation aesthetic",
    form: "• {form_form1} = Independent form for {subject}: rounded geometry",
    effects: "• {effects_effects1} = Effects: subtle film grain",
  }
  const result = compilePromptOutputPure(
    modules,
    outputs,
    {
      ...createDefaultPromptSettings(),
      mode: "text_to_image",
      idea: "identity test",
      subject: "person",
    },
    "modular",
  )

  assert.match(result.output, /• \{topLeft\} \(content: \{scene1\};/)
  assert.match(result.output, /^\{scenes\} =\n• \{scene1\} =/m)
  assert.match(result.output, /Use \{clay\} as this scene's visual style/)
  assert.match(result.output, /Apply \{form1\} to this scene/)
  assert.match(result.output, /Apply \{effects1\} as this scene's effects/)
  assert.match(result.output, /^\{style\} =\n• \{clay\} = claymation aesthetic$/m)
  assert.match(result.output, /^\{form\} =\n• \{form1\} =/m)
  assert.match(result.output, /^\{effects\} =\n• \{effects1\} =/m)
  assert.doesNotMatch(result.output, /\{scene_scene1\}/)
  assert.doesNotMatch(result.output, /\{style_clay\}/)
  assert.doesNotMatch(result.output, /\{form_form1\}/)
  assert.doesNotMatch(result.output, /\{effects_effects1\}/)
})

test("prompt identity collisions are minimally qualified by semantic owner", () => {
  const style = namedModule("style")
  const effects = namedModule("effects")
  const registry = createPromptFacingIdentityRegistry({
    modules: [style, effects],
    outputs: {
      style: "• {style_main} = primary style",
      effects: "• {effects_main} = primary effects",
    },
  })

  assert.equal(registry.aliasForToken("{style_main}"), "{styleMain}")
  assert.equal(registry.aliasForToken("{effects_main}"), "{effectsMain}")
})

test("user variables win semantic names and named configurations qualify around them", () => {
  const style = namedModule("style")
  const registry = createPromptFacingIdentityRegistry({
    modules: [style],
    outputs: {
      variables: "{main} = \"User-authored value\"",
      style: "• {style_main} = primary style",
    },
  })

  assert.equal(registry.aliasForToken("{style_main}"), "{styleMain}")
  assert.equal(registry.rewrite("{main} + {style_main}"), "{main} + {styleMain}")
})

test("specialized Hair child collisions qualify with their semantic parent", () => {
  const registry = createPromptFacingIdentityRegistry({
    moduleValues: {
      hair: {
        hairStyles: [
          {
            id: "hair-style-a",
            key: "curlyUpdo",
            name: "Curly Updo",
            targets: [],
            properties: {},
            components: [
              {
                id: "hair-component-a",
                key: "bangs",
                name: "Bangs",
                type: "custom",
                customType: "bangs",
                properties: {},
              },
            ],
          },
          {
            id: "hair-style-b",
            key: "sleekBob",
            name: "Sleek Bob",
            targets: [],
            properties: {},
            components: [
              {
                id: "hair-component-b",
                key: "bangs",
                name: "Bangs",
                type: "custom",
                customType: "bangs",
                properties: {},
              },
            ],
          },
        ],
      },
    },
  })

  assert.equal(
    registry.aliasForToken(getHairComponentVariableToken("curlyUpdo", "bangs")),
    "{curlyUpdoBangs}",
  )
  assert.equal(
    registry.aliasForToken(getHairComponentVariableToken("sleekBob", "bangs")),
    "{sleekBobBangs}",
  )
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

test("only active compiler-owned short namespaces remain reserved from user variables", () => {
  assert.equal(isReservedVariableKey("r_1"), false)
  assert.equal(isReservedVariableKey("tg_1"), true)
  assert.equal(isReservedVariableKey("tt_1"), true)
  assert.equal(isReservedVariableKey("mainTitle"), false)
})
