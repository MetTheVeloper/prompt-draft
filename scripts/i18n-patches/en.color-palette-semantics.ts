export default {
  "modules.colorPalette.title": "Color Palette",
  "modules.colorPalette.description":
    "Define editable color palettes and assign them to broad image areas, specific typography entities, or user-defined subject and object variables. Color Palette controls base colors only; illumination color belongs to Lighting and material appearance belongs to Texture.",

  "modules.colorPalette.groups.core.title": "Palette Rules",
  "modules.colorPalette.groups.core.description":
    "Create one or more palette rules. Each rule keeps its colors and semantic targets linked together.",
  "modules.colorPalette.groups.advanced.title": "Advanced Details",
  "modules.colorPalette.groups.advanced.description":
    "Add optional color-specific instructions not covered by palette rules.",
  "modules.colorPalette.groups.override.title": "Custom Override",
  "modules.colorPalette.groups.override.description":
    "Replace the generated Color Palette output with your own color instruction.",

  "modules.colorPalette.fields.paletteAssignments.label": "Palette Rules",
  "modules.colorPalette.fields.paletteAssignments.description":
    "Choose a palette preset or build colors manually, then assign that palette to one or more semantic targets.",
  "modules.colorPalette.fields.paletteAssignments.ruleTitle": "Palette Rule {index}",
  "modules.colorPalette.fields.paletteAssignments.ruleSummary":
    "{colors} colors · {targets} targets",
  "modules.colorPalette.fields.paletteAssignments.preset.label": "Palette Preset",
  "modules.colorPalette.fields.paletteAssignments.actions.addAssignment": "Add palette rule",
  "modules.colorPalette.fields.paletteAssignments.actions.remove": "Remove",
  "modules.colorPalette.fields.paletteAssignments.actions.addColor": "Add color",

  "modules.colorPalette.fields.paletteAssignments.colors.label": "Palette Colors",
  "modules.colorPalette.fields.paletteAssignments.colors.description":
    "Preset colors stay editable. Any swatch can use a literal color or an enabled user Color variable.",
  "modules.colorPalette.fields.paletteAssignments.colors.literal": "Custom Color",
  "modules.colorPalette.fields.paletteAssignments.colors.groups.manual": "Manual",
  "modules.colorPalette.fields.paletteAssignments.colors.groups.variables": "Color Variables",
  "modules.colorPalette.fields.paletteAssignments.controls.color.placeholder":
    "Color value, for example #3366ff or deep navy",

  "modules.colorPalette.fields.paletteAssignments.targets.label": "Apply To",
  "modules.colorPalette.fields.paletteAssignments.targets.groups.general": "General",
  "modules.colorPalette.fields.paletteAssignments.targets.groups.typographyGroups": "Typography Groups",
  "modules.colorPalette.fields.paletteAssignments.targets.groups.typographyTexts": "Typography Texts",
  "modules.colorPalette.fields.paletteAssignments.targets.groups.userVariables": "User Subject / Object Variables",
  "modules.colorPalette.fields.paletteAssignments.targets.groups.missing": "Missing References",
  "modules.colorPalette.fields.paletteAssignments.targets.groups.custom": "Custom",
  "modules.colorPalette.fields.paletteAssignments.targets.builtin.overall": "Overall Image",
  "modules.colorPalette.fields.paletteAssignments.targets.builtin.background": "Background",
  "modules.colorPalette.fields.paletteAssignments.targets.builtin.subject": "Main Subject",
  "modules.colorPalette.fields.paletteAssignments.targets.builtin.outfit": "Outfit",
  "modules.colorPalette.fields.paletteAssignments.targets.builtin.hair": "Hair",
  "modules.colorPalette.fields.paletteAssignments.targets.builtin.typography": "Typography",
  "modules.colorPalette.fields.paletteAssignments.targets.builtin.accents": "Accent Elements",
  "modules.colorPalette.fields.paletteAssignments.targets.custom": "Custom Target",
  "modules.colorPalette.fields.paletteAssignments.targets.customLabel": "Custom target",
  "modules.colorPalette.fields.paletteAssignments.targets.customPlaceholder":
    "Example: dragon costume scales",

  "modules.colorPalette.fields.paletteAssignments.missing": "Missing",
  "modules.colorPalette.fields.paletteAssignments.warnings.duplicateTarget":
    "Another palette rule also targets at least one of these exact elements. Both rules are kept.",

  "modules.colorPalette.fields.extraDetails.label": "Extra Color Details",
  "modules.colorPalette.fields.extraDetails.description":
    "Add optional color instructions that do not redefine lighting, material, or visual style.",
  "modules.colorPalette.fields.extraDetails.placeholder":
    "Add optional color details...",
  "modules.colorPalette.fields.customText.label": "Custom Color Override",
  "modules.colorPalette.fields.customText.description":
    "Replace all structured Color Palette output with a custom instruction.",
  "modules.colorPalette.fields.customText.placeholder":
    "Replace generated color palette output...",
} as const;
