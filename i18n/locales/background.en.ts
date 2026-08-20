export default {
  title: "Background",
  description:
    "Build the scene behind the subject from a conservative background concept and independent semantic controls.",
  groups: {
    core: {
      title: "Background Foundation",
      description:
        "Choose a preset or define the general background concept, structural type, and setting.",
    },
    construction: {
      title: "Background Construction",
      description:
        "Define spatial organization, visible backdrop material, and background detail density.",
    },
    content: {
      title: "Background Elements",
      description:
        "Add secondary elements that should visibly exist in the background without taking over the main subject.",
    },
    advanced: {
      title: "Advanced Details",
      description:
        "Add optional background-specific instructions that are not covered by the structured controls.",
    },
    override: {
      title: "Custom Override",
      description: "Replace the generated background output with your own text.",
    },
  },
  fields: {
    backgroundConcept: {
      label: "Background Concept",
      description:
        "A broad semantic anchor for the background. Presets populate this value, but you can change it independently.",
      placeholder: "Select a background concept",
      customPlaceholder: "Describe the background concept...",
      options: {
        clean_background: "Clean Background",
        studio_background: "Studio Background",
        indoor_environment: "Indoor Environment",
        outdoor_environment: "Outdoor Environment",
        natural_environment: "Natural Environment",
        urban_environment: "Urban Environment",
        architectural_environment: "Architectural Environment",
        material_background: "Material Background",
        abstract_background: "Abstract Background",
        graphic_background: "Graphic Background",
        pattern_background: "Pattern Background",
        mixed_media_background: "Mixed Media Background",
        transparent_background: "Transparent Background",
        custom: "Custom",
      },
    },
    backgroundType: {
      label: "Background Type",
      description:
        "Define what kind of backdrop is being constructed, independent of style, lighting, camera, or effects.",
      placeholder: "Select a background type",
      customPlaceholder: "Describe a custom background type...",
      options: {
        environment: "Environment",
        studio: "Studio",
        surface: "Surface",
        abstract: "Abstract",
        graphic: "Graphic",
        pattern: "Pattern",
        mixed_media: "Mixed Media",
        transparent: "Transparent",
        custom: "Custom",
      },
    },
    setting: {
      label: "Setting",
      description:
        "Define the physical or contextual setting without adding visual style or lighting treatment.",
      placeholder: "Select a setting",
      customPlaceholder: "Describe a custom setting...",
      options: {
        indoor: "Indoor",
        outdoor: "Outdoor",
        natural: "Natural",
        urban: "Urban",
        architectural: "Architectural",
        public: "Public Space",
        residential: "Residential",
        commercial: "Commercial",
        industrial: "Industrial",
        sports: "Sports",
        performance: "Performance / Stage",
        futuristic: "Futuristic Built Environment",
        custom: "Custom",
      },
    },
    spatialStructure: {
      label: "Spatial Structure",
      description:
        "Control how the background space is organized behind and around the subject.",
      placeholder: "Select a spatial structure",
      customPlaceholder: "Describe a custom spatial structure...",
      options: {
        seamless: "Seamless",
        flat: "Flat / Planar",
        open: "Open",
        layered: "Layered",
        enclosed: "Enclosed",
        expansive: "Expansive",
        horizon_based: "Horizon-Based",
        framed: "Framed Around Subject",
        repeating: "Repeating",
        structured: "Structured",
        asymmetrical: "Asymmetrical",
        custom: "Custom",
      },
    },
    backgroundMaterial: {
      label: "Background Material",
      description:
        "Define the material of the visible backdrop itself. Overall subject or image texture belongs in the Texture module.",
      placeholder: "Select a background material",
      customPlaceholder: "Describe a custom backdrop material...",
      options: {
        seamless_paper: "Seamless Paper",
        paper: "Paper",
        fabric: "Fabric",
        concrete: "Concrete",
        stone: "Stone",
        wood: "Wood",
        metal: "Metal",
        glass: "Glass",
        plaster: "Plaster",
        painted_wall: "Painted Wall",
        custom: "Custom",
      },
    },
    detailDensity: {
      label: "Detail Density",
      description:
        "Control how much visual information the background contains without changing the location itself.",
      placeholder: "Select background detail density",
      customPlaceholder: "Describe a custom background detail level...",
      options: {
        minimal: "Minimal",
        restrained: "Restrained",
        balanced: "Balanced",
        detailed: "Detailed",
        dense: "Dense",
        custom: "Custom",
      },
    },
    backgroundElements: {
      label: "Background Elements",
      description:
        "Select secondary objects or environmental cues that should visibly appear behind the subject.",
      placeholder: "Select background elements",
      customPlaceholder: "Describe additional custom background elements...",
      options: {
        vegetation: "Vegetation",
        architecture: "Architecture",
        furniture: "Furniture",
        crowd: "Distant People / Crowd",
        signage: "Signage",
        skyline: "Skyline",
        mountains: "Mountains",
        water: "Water",
        clouds: "Clouds",
        shelves: "Shelving",
        windows: "Windows",
        machinery: "Machinery",
        arena_seating: "Arena Seating",
        horizon: "Visible Horizon",
        contextual_props: "Contextual Props",
        custom: "Custom",
      },
    },
    extraDetails: {
      label: "Extra Background Details",
      description:
        "Add background-specific instructions that do not fit the structured semantic fields.",
      placeholder: "Add optional background details...",
    },
    customText: {
      label: "Custom Background Override",
      description:
        "When Custom mode is active, this text replaces the generated background output.",
      placeholder: "Write a complete custom background instruction...",
    },
  },
  presets: {
    clean_background: {
      label: "Clean Background",
      description: "A minimal seamless background with very low visual detail.",
    },
    studio_background: {
      label: "Studio Background",
      description: "A restrained indoor studio backdrop using seamless paper.",
    },
    indoor_environment: {
      label: "Indoor Environment",
      description: "A general layered indoor environment with balanced detail.",
    },
    outdoor_environment: {
      label: "Outdoor Environment",
      description: "A general open outdoor environment with balanced detail.",
    },
    natural_environment: {
      label: "Natural Environment",
      description: "A layered natural environment with vegetation as a secondary cue.",
    },
    urban_environment: {
      label: "Urban Environment",
      description: "A layered urban environment with architecture as a secondary cue.",
    },
    architectural_environment: {
      label: "Architectural Environment",
      description: "A structured architecture-focused environment with balanced detail.",
    },
    material_background: {
      label: "Material Background",
      description: "A restrained flat surface ready for a backdrop material selection.",
    },
    abstract_background: {
      label: "Abstract Background",
      description: "A general abstract backdrop without imposing a specific visual style.",
    },
    graphic_background: {
      label: "Graphic Background",
      description: "A flat graphic backdrop with balanced visual detail.",
    },
    pattern_background: {
      label: "Pattern Background",
      description: "A repeating pattern-based backdrop with balanced detail.",
    },
    mixed_media_background: {
      label: "Mixed Media Background",
      description: "A layered mixed-media backdrop with balanced detail.",
    },
    transparent_background: {
      label: "Transparent Background",
      description: "A transparent backdrop with no environmental content implied.",
    },
  },
};
