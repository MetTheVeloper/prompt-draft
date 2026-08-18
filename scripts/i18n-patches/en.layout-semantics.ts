export default {
  "modules.layout.description":
    "Define an exact multi-region canvas structure for artifacts such as posters, cards, collages, editorial pages, and presentation layouts.",

  "modules.layout.groups.structure.title": "Layout Structure",
  "modules.layout.groups.structure.description":
    "Optionally describe the artifact and start from a structural region template.",

  "modules.layout.fields.layoutType.description":
    "Optionally identify the kind of multi-region artifact being constructed. This does not change region geometry.",
  "modules.layout.fields.layoutType.placeholder": "Select an artifact type",

  "modules.layout.fields.density.description":
    "Optionally describe the overall visual density of the finished layout without changing its region geometry.",
  "modules.layout.fields.density.placeholder": "Select visual density",

  "modules.layout.presets.full_bleed.label": "Template · Full bleed",
  "modules.layout.presets.full_bleed.description":
    "Start with one region covering the entire canvas.",

  "modules.layout.presets.split_vertical.label": "Template · Vertical split",
  "modules.layout.presets.split_vertical.description":
    "Start with two equal side-by-side regions.",

  "modules.layout.presets.split_horizontal.label": "Template · Horizontal split",
  "modules.layout.presets.split_horizontal.description":
    "Start with two equal stacked regions.",

  "modules.layout.presets.side_panel.label": "Template · Side panel",
  "modules.layout.presets.side_panel.description":
    "Start with one large main region and a narrower side region.",

  "modules.layout.presets.bottom_panel.label": "Template · Bottom panel",
  "modules.layout.presets.bottom_panel.description":
    "Start with one large main region and a shorter bottom region.",

  "modules.layout.presets.modular_grid.label": "Template · Modular grid",
  "modules.layout.presets.modular_grid.description":
    "Start with a four-region two-by-two grid.",

  "modules.layout.presets.feature_support.label": "Template · Feature + support",
  "modules.layout.presets.feature_support.description":
    "Start with one large feature region and two smaller supporting regions.",

  "modules.layout.presets.centered_stack.label": "Template · Centered stack",
  "modules.layout.presets.centered_stack.description":
    "Start with top, center, and bottom regions with a dominant center area.",

  "modules.layout.presets.layered_overlap.label": "Template · Layered overlap",
  "modules.layout.presets.layered_overlap.description":
    "Start with three overlapping regions on separate layers.",
} as const;
