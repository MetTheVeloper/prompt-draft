export default {
  title: "Effects",
  description: "Build an ordered stack of post-processing, signal, degradation, graphic-motion, VFX, and interface effects without taking over Camera, Lighting, Style, Texture, or Background semantics.",

  groups: {
    core: {
      title: "Effect Stack",
      description: "Add independent effect layers. Each layer owns its own mechanism, intensity, and optional local direction.",
    },
    advanced: {
      title: "Advanced Direction",
      description: "Add effect-wide notes that do not belong to one specific layer.",
    },
    override: {
      title: "Custom Override",
      description: "Replace the generated Effects output with custom text.",
    },
  },

  fields: {
    effectLayers: {
      label: "Effect Layers",
      description: "Ordered visual-effect mechanisms applied to the image. Use separate layers when effects need different intensities.",
      editorTitle: "Effect stack",
      editorDescription: "Add up to {max} independent effect layers.",
      emptyTitle: "No effects added",
      emptyDescription: "Add an effect layer or choose a preset to build the Effects output.",
      layerTitle: "Effect {index}",
      actions: {
        add: "Add effect",
        remove: "Remove effect",
      },
      categories: {
        post_processing: "Post Processing",
        analog_damage: "Analog / Damage",
        digital_signal: "Digital / Signal",
        degradation: "Degradation",
        motion_graphic: "Motion / Graphic",
        scene_vfx: "Scene VFX",
        interface_overlay: "Interface Overlay",
        custom: "Custom",
      },
      type: {
        label: "Effect type",
        options: {
          vignette: "Vignette",
          highlight_bloom: "Highlight Bloom",
          added_film_grain: "Added Film Grain",
          synthetic_chromatic_fringing: "Synthetic Chromatic Fringing",
          light_leak_overlay: "Light Leak Overlay",
          dust_scratches_overlay: "Dust & Scratches Overlay",
          film_burn_overlay: "Film Burn Overlay",
          glitch_displacement: "Glitch Displacement",
          rgb_channel_split: "RGB Channel Split",
          datamosh_artifacts: "Datamosh Artifacts",
          pixel_sorting: "Pixel Sorting",
          scanlines: "Scanlines",
          digital_noise: "Digital Signal Noise",
          vhs_signal_artifacts: "VHS Signal Artifacts",
          signal_warping: "Signal Warping",
          jpeg_compression: "JPEG Compression",
          pixelation: "Pixelation",
          color_banding: "Color Banding",
          speed_lines: "Speed Lines",
          motion_trails: "Motion Trails",
          floating_particles: "Floating Particle VFX",
          magical_particles: "Magical Particle VFX",
          sparkle_overlay: "Sparkle Overlay",
          energy_aura: "Energy Aura VFX",
          hud_overlay: "HUD Overlay",
          data_readout_overlay: "Data Readout Overlay",
          custom: "Custom",
        },
      },
      intensity: {
        label: "Intensity",
        options: {
          subtle: "Subtle",
          restrained: "Restrained",
          balanced: "Balanced",
          strong: "Strong",
          extreme: "Extreme",
        },
      },
      custom: {
        label: "Custom effect",
        placeholder: "Describe the effect mechanism, e.g. liquid-glass distortion",
      },
      details: {
        label: "Layer details",
        placeholder: "Optional local direction for this effect layer",
      },
    },
    extraDetails: {
      label: "Additional Effects Direction",
      description: "Global notes for the entire effect stack.",
      placeholder: "Add any effect-wide constraints or relationships",
    },
    customText: {
      label: "Custom Effects Output",
      description: "Fully replace the generated Effects section.",
      placeholder: "Write the complete Effects direction",
    },
  },

  presets: {
    subtle_post_finish: {
      label: "Subtle Post Finish",
      description: "A restrained vignette, bloom, and added grain finish.",
    },
    analog_damage: {
      label: "Analog Damage",
      description: "Composited light leaks plus dust-and-scratch film damage.",
    },
    digital_glitch: {
      label: "Digital Glitch",
      description: "Glitch displacement, RGB splitting, and light scanlines.",
    },
    vhs_signal: {
      label: "VHS Signal",
      description: "Tracking artifacts, scanlines, and digital signal noise.",
    },
    degraded_digital: {
      label: "Degraded Digital",
      description: "JPEG compression with restrained pixelation.",
    },
    motion_graphic: {
      label: "Motion Graphic",
      description: "Graphic speed lines and composited motion trails.",
    },
    magical_vfx: {
      label: "Magical VFX",
      description: "Particle, sparkle, and energy-aura compositing effects.",
    },
    hud_interface: {
      label: "HUD Interface",
      description: "HUD and data-readout graphics layered over the image.",
    },
  },
}
