export default {
  "modules.layout.fields.regions.description":
    "Define exact canvas regions, content bindings, and optional container behavior.",

  "modules.layout.fields.regions.controls.role.label": "Region role",
  "modules.layout.fields.regions.controls.contentKey.label": "Content binding",
  "modules.layout.fields.regions.controls.contentKey.placeholder":
    "Insert a variable or content token",

  "modules.layout.fields.regions.controls.geometry.description":
    "Use normalized geometry from 0 to 1. Layer order only affects regions that overlap.",
  "modules.layout.fields.regions.controls.geometry.layer": "Layer order",

  "modules.layout.fields.regions.controls.horizontalAlign.label":
    "Horizontal content alignment",
  "modules.layout.fields.regions.controls.verticalAlign.label":
    "Vertical content alignment",
  "modules.layout.fields.regions.controls.fit.label": "Content fit",
  "modules.layout.fields.regions.controls.overflow.label": "Content overflow",

  "modules.layout.fields.regions.fit.fill": "Stretch to fill",
  "modules.layout.fields.regions.fit.natural": "Intrinsic size",
  "modules.layout.fields.regions.overflow.visible": "Allow overflow",
  "modules.layout.fields.regions.overflow.hidden": "Clip at region bounds",

  "modules.layout.fields.regions.controls.description.label":
    "Region instructions",
  "modules.layout.fields.regions.controls.description.placeholder":
    "Optional region-specific layout instructions",
} as const;
