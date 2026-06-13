import type { PromptKeyModule } from "./types";

const backgroundStyleOptions = [
  // Clean / Minimal Background
  {
    value: "plain_seamless_backdrop",
    category: "clean_minimal",
    categoryLabel: "Clean / Minimal Background",
    promptText:
      "the background must be a clean seamless surface with no visible clutter. Smooth uninterrupted color, minimal spatial detail, soft tonal variation, and a simple studio-like emptiness that keeps full attention on the main subject.",
    tags: ["clean", "minimal", "seamless", "studio"],
  },
  {
    value: "soft_neutral_background",
    category: "clean_minimal",
    categoryLabel: "Clean / Minimal Background",
    promptText:
      "the background must remain calm and unobtrusive. Neutral tones, subtle gradient transitions, very low visual noise, gentle depth, and a polished minimal atmosphere that supports the subject without competing for attention.",
    tags: ["clean", "neutral", "minimal", "soft"],
  },
  {
    value: "airy_white_space_composition",
    category: "clean_minimal",
    categoryLabel: "Clean / Minimal Background",
    promptText:
      "the background must feel open and breathable. Large areas of negative space, restrained visual content, soft clean edges, and a lightweight uncluttered environment suitable for modern editorial or product-focused imagery.",
    tags: ["white-space", "negative-space", "minimal", "editorial"],
  },
  {
    value: "subtle_tonal_gradient",
    category: "clean_minimal",
    categoryLabel: "Clean / Minimal Background",
    promptText:
      "the background must be built around a soft tonal gradient rather than a detailed environment. Smooth color blending, low contrast, minimal texture, and a clean controlled visual field with elegant simplicity.",
    tags: ["gradient", "minimal", "soft", "tonal"],
  },

  // Studio Background
  {
    value: "classic_studio_paper_backdrop",
    category: "studio",
    categoryLabel: "Studio Background",
    promptText:
      "the background must resemble a professional studio setup. Seamless paper backdrop, controlled smooth surface, soft shadow falloff, balanced lighting behavior, and a clean portrait-ready environment with no distracting elements.",
    tags: ["studio", "paper-backdrop", "portrait", "clean"],
  },
  {
    value: "premium_portrait_studio",
    category: "studio",
    categoryLabel: "Studio Background",
    promptText:
      "the background must feel like a high-end portrait studio. Controlled depth, elegant tonal separation, refined light-to-shadow transitions, subtle spatial softness, and a polished professional atmosphere.",
    tags: ["studio", "premium", "portrait", "professional"],
  },
  {
    value: "commercial_product_studio",
    category: "studio",
    categoryLabel: "Studio Background",
    promptText:
      "the background must be optimized for commercial presentation. Clean surface continuity, well-managed reflections or shadows, a precise controlled environment, and a professional visual structure suitable for advertising or catalog imagery.",
    tags: ["studio", "commercial", "product", "advertising"],
  },
  {
    value: "dramatic_dark_studio",
    category: "studio",
    categoryLabel: "Studio Background",
    promptText:
      "the background must feel like a moody studio scene. Dark controlled tones, soft falloff into shadow, selective illumination, and a minimal but cinematic professional setting that frames the subject with depth.",
    tags: ["studio", "dark", "dramatic", "cinematic"],
  },

  // Environmental Background
  {
    value: "everyday_indoor_environment",
    category: "environmental",
    categoryLabel: "Environmental Background",
    promptText:
      "the background must place the subject in a believable indoor setting. Natural room structure, contextual objects kept secondary, realistic depth, and a lived-in but visually controlled environment that supports the scene.",
    tags: ["environment", "indoor", "realistic", "lifestyle"],
  },
  {
    value: "realistic_outdoor_setting",
    category: "environmental",
    categoryLabel: "Environmental Background",
    promptText:
      "the background must place the subject in a grounded outdoor space. Natural perspective, contextual location details, believable lighting behavior, and a clear sense of place without overwhelming the subject.",
    tags: ["environment", "outdoor", "realistic", "location"],
  },
  {
    value: "work_or_lifestyle_environment",
    category: "environmental",
    categoryLabel: "Environmental Background",
    promptText:
      "the background must feel connected to a real activity or lifestyle. Relevant environmental cues, subtle supporting objects, a practical spatial layout, and realistic contextual storytelling.",
    tags: ["environment", "work", "lifestyle", "storytelling"],
  },
  {
    value: "public_place_atmosphere",
    category: "environmental",
    categoryLabel: "Environmental Background",
    promptText:
      "the background must feel like a real shared environment. Layered background depth, subtle crowd or spatial hints, recognizable but non-dominant context, and believable location-driven visual realism.",
    tags: ["environment", "public", "crowd", "realistic"],
  },

  // Cinematic Background
  {
    value: "moody_cinematic_depth",
    category: "cinematic",
    categoryLabel: "Cinematic Background",
    promptText:
      "the background must feel cinematic and story-driven. Layered depth, atmospheric shadow, dramatic tonal separation, selective detail, and a visually rich environment that suggests narrative tension or emotion.",
    tags: ["cinematic", "moody", "depth", "story"],
  },
  {
    value: "dramatic_storytelling_backdrop",
    category: "cinematic",
    categoryLabel: "Cinematic Background",
    promptText:
      "the background must support a narrative moment. Strong spatial mood, controlled environmental detail, visual tension, and a composition that feels like a frame from a film rather than a simple location shot.",
    tags: ["cinematic", "storytelling", "dramatic", "film"],
  },
  {
    value: "atmospheric_haze_scene",
    category: "cinematic",
    categoryLabel: "Cinematic Background",
    promptText:
      "the background must include atmospheric depth. Haze, mist, smoke, or suspended particles can soften distance, separate layers, and create a cinematic sense of scale and emotional tone.",
    tags: ["cinematic", "haze", "mist", "atmosphere"],
  },
  {
    value: "night_scene_cinematic_setting",
    category: "cinematic",
    categoryLabel: "Cinematic Background",
    promptText:
      "the background must feel like a stylized cinematic night environment. Deep shadows, pools of light, glowing highlights, dramatic contrast, and a film-like mood with visual richness and depth.",
    tags: ["cinematic", "night", "dark", "dramatic"],
  },

  // Abstract Background
  {
    value: "fluid_abstract_forms",
    category: "abstract",
    categoryLabel: "Abstract Background",
    promptText:
      "the background must be built from abstract flowing shapes rather than a literal environment. Soft motion-like forms, layered curves, clean visual rhythm, and a stylized non-representational atmosphere.",
    tags: ["abstract", "fluid", "flowing", "non-representational"],
  },
  {
    value: "geometric_abstract_structure",
    category: "abstract",
    categoryLabel: "Abstract Background",
    promptText:
      "the background must use abstract geometry. Layered shapes, structured spatial design, controlled edges, balanced composition, and a clean graphic feel with no literal environmental realism.",
    tags: ["abstract", "geometric", "graphic", "structured"],
  },
  {
    value: "color_field_abstraction",
    category: "abstract",
    categoryLabel: "Abstract Background",
    promptText:
      "the background must rely on pure color relationships. Broad color areas, soft transitions or bold blocks, minimal representational detail, and a visually intentional abstract atmosphere.",
    tags: ["abstract", "color-field", "color", "minimal"],
  },
  {
    value: "expressive_abstract_energy",
    category: "abstract",
    categoryLabel: "Abstract Background",
    promptText:
      "the background must feel visually energetic and artistic. Dynamic shape movement, layered abstract marks, compositional tension, and a non-literal expressive field that enhances mood.",
    tags: ["abstract", "expressive", "energy", "artistic"],
  },

  // Graphic / Poster Background
  {
    value: "bold_poster_composition",
    category: "graphic_poster",
    categoryLabel: "Graphic / Poster Background",
    promptText:
      "the background must support a strong poster-like layout. Clear graphic hierarchy, simplified structure, bold visual impact, and an intentionally designed backdrop suitable for key art, covers, or promos.",
    tags: ["graphic", "poster", "bold", "layout"],
  },
  {
    value: "editorial_graphic_layout",
    category: "graphic_poster",
    categoryLabel: "Graphic / Poster Background",
    promptText:
      "the background must feel like a designed editorial page. Clean compositional blocks, refined visual balance, strong framing areas, and a sophisticated graphic system that complements the subject.",
    tags: ["graphic", "editorial", "layout", "design"],
  },
  {
    value: "promotional_campaign_backdrop",
    category: "graphic_poster",
    categoryLabel: "Graphic / Poster Background",
    promptText:
      "the background must feel made for advertising. High readability, impactful visual arrangement, controlled supporting elements, and a strong commercial design language that enhances the main subject.",
    tags: ["graphic", "campaign", "advertising", "commercial"],
  },
  {
    value: "thumbnail_friendly_graphic_scene",
    category: "graphic_poster",
    categoryLabel: "Graphic / Poster Background",
    promptText:
      "the background must remain bold and readable even at small size. Strong shapes, clean separation, simplified detail, and high visual clarity suitable for social media, covers, and thumbnails.",
    tags: ["graphic", "thumbnail", "readable", "social-media"],
  },

  // Fantasy / Surreal Background
  {
    value: "dreamlike_fantasy_environment",
    category: "fantasy_surreal",
    categoryLabel: "Fantasy / Surreal Background",
    promptText:
      "the background must feel magical and unreal. Imaginative space design, poetic atmosphere, stylized depth, and a sense of wonder that goes beyond ordinary environmental realism.",
    tags: ["fantasy", "dreamlike", "magical", "surreal"],
  },
  {
    value: "surreal_spatial_distortion",
    category: "fantasy_surreal",
    categoryLabel: "Fantasy / Surreal Background",
    promptText:
      "the background must ignore normal visual logic. Warped space, unusual scale relationships, impossible perspective or floating structures, and a dreamlike non-rational environment.",
    tags: ["surreal", "distortion", "impossible", "space"],
  },
  {
    value: "enchanted_world_backdrop",
    category: "fantasy_surreal",
    categoryLabel: "Fantasy / Surreal Background",
    promptText:
      "the background must suggest a fantasy world. Mystical atmosphere, magical environmental cues, elegant visual richness, and a setting that feels immersive, imaginative, and storybook-like.",
    tags: ["fantasy", "enchanted", "mystical", "storybook"],
  },
  {
    value: "symbolic_surreal_scene",
    category: "fantasy_surreal",
    categoryLabel: "Fantasy / Surreal Background",
    promptText:
      "the background must feel conceptual and surreal rather than literal. Unusual objects, symbolic space, poetic visual logic, and a strange but emotionally readable dream-state environment.",
    tags: ["surreal", "symbolic", "conceptual", "dream-state"],
  },

  // Nature Background
  {
    value: "lush_natural_landscape",
    category: "nature",
    categoryLabel: "Nature Background",
    promptText:
      "the background must feel rich, natural, and alive. Organic vegetation, layered environmental depth, natural color variation, and a believable outdoor atmosphere with strong scenic presence.",
    tags: ["nature", "landscape", "vegetation", "outdoor"],
  },
  {
    value: "open_sky_and_horizon",
    category: "nature",
    categoryLabel: "Nature Background",
    promptText:
      "the background must emphasize openness and natural scale. Wide sky presence, visible horizon line, clean atmospheric depth, and a calm expansive feeling that supports the subject elegantly.",
    tags: ["nature", "sky", "horizon", "open"],
  },
  {
    value: "forest_or_woodland_setting",
    category: "nature",
    categoryLabel: "Nature Background",
    promptText:
      "the background must place the subject in a wooded natural environment. Layered foliage, filtered light behavior, soft organic depth, and a grounded immersive atmosphere.",
    tags: ["nature", "forest", "woodland", "foliage"],
  },
  {
    value: "coastal_or_waterside_scene",
    category: "nature",
    categoryLabel: "Nature Background",
    promptText:
      "the background must feel connected to water and open air. Natural horizon cues, soft reflective light, atmospheric clarity, and a scenic environment shaped by sea, lake, or river presence.",
    tags: ["nature", "coastal", "water", "waterside"],
  },

  // Urban Background
  {
    value: "modern_city_backdrop",
    category: "urban",
    categoryLabel: "Urban Background",
    promptText:
      "the background must feel urban and contemporary. Architectural context, structured depth, subtle city texture, and a recognizable metropolitan atmosphere without overwhelming the subject.",
    tags: ["urban", "city", "modern", "architecture"],
  },
  {
    value: "street_level_urban_scene",
    category: "urban",
    categoryLabel: "Urban Background",
    promptText:
      "the background must place the subject in a grounded street environment. Pavement, walls, signs, urban surfaces, and a realistic city-life backdrop with layered spatial context.",
    tags: ["urban", "street", "city-life", "realistic"],
  },
  {
    value: "neon_lit_urban_night",
    category: "urban",
    categoryLabel: "Urban Background",
    promptText:
      "the background must feel vibrant and city-driven after dark. Glowing signage, reflective surfaces, layered light sources, and an energetic urban mood with cinematic night depth.",
    tags: ["urban", "neon", "night", "cinematic"],
  },
  {
    value: "industrial_urban_texture",
    category: "urban",
    categoryLabel: "Urban Background",
    promptText:
      "the background must include raw city materiality. Concrete, metal, exposed structures, weathered surfaces, and a harder more physical urban environment with visual grit.",
    tags: ["urban", "industrial", "concrete", "grit"],
  },

  // Luxury / Premium Background
  {
    value: "elegant_premium_setting",
    category: "luxury_premium",
    categoryLabel: "Luxury / Premium Background",
    promptText:
      "the background must feel refined and upscale. Controlled detail, polished visual language, restrained sophistication, and a premium atmosphere that elevates the subject.",
    tags: ["luxury", "premium", "elegant", "upscale"],
  },
  {
    value: "luxury_interior_ambiance",
    category: "luxury_premium",
    categoryLabel: "Luxury / Premium Background",
    promptText:
      "the background must suggest a high-end interior environment. Sophisticated materials, tasteful depth, calm spatial richness, and a clean upscale mood with strong design awareness.",
    tags: ["luxury", "interior", "premium", "upscale"],
  },
  {
    value: "polished_brand_aesthetic",
    category: "luxury_premium",
    categoryLabel: "Luxury / Premium Background",
    promptText:
      "the background must feel aligned with premium branding. Minimal but luxurious visual cues, smooth compositional control, elegant material impression, and a refined commercial atmosphere.",
    tags: ["luxury", "brand", "polished", "commercial"],
  },
  {
    value: "opulent_dramatic_backdrop",
    category: "luxury_premium",
    categoryLabel: "Luxury / Premium Background",
    promptText:
      "the background must feel luxurious but visually rich. Elevated material quality, deeper tonal layering, graceful sophistication, and a high-status atmosphere without unnecessary clutter.",
    tags: ["luxury", "opulent", "dramatic", "rich"],
  },

  // Sports / Stadium Background
  {
    value: "stadium_spotlight_environment",
    category: "sports_stadium",
    categoryLabel: "Sports / Stadium Background",
    promptText:
      "the background must place the subject in a professional sports atmosphere. Stadium scale, bright field or arena lighting, crowd or seating cues kept secondary, and energetic competitive presence.",
    tags: ["sports", "stadium", "spotlight", "competition"],
  },
  {
    value: "action_field_setting",
    category: "sports_stadium",
    categoryLabel: "Sports / Stadium Background",
    promptText:
      "the background must feel connected to the field of play. Surface context, boundary markings or sport-specific spatial cues, depth toward the arena, and a dynamic athletic atmosphere.",
    tags: ["sports", "field", "arena", "athletic"],
  },
  {
    value: "arena_crowd_atmosphere",
    category: "sports_stadium",
    categoryLabel: "Sports / Stadium Background",
    promptText:
      "the background must suggest a live event environment. Layered audience presence, lighting drama, spatial scale, and the emotional energy of a major competition setting.",
    tags: ["sports", "arena", "crowd", "live-event"],
  },
  {
    value: "training_or_performance_backdrop",
    category: "sports_stadium",
    categoryLabel: "Sports / Stadium Background",
    promptText:
      "the background must feel sports-related but more focused and controlled. Practice environment, sport-specific space cues, clean athletic context, and a functional competitive mood.",
    tags: ["sports", "training", "performance", "athletic"],
  },

  // Sci-Fi / Futuristic Background
  {
    value: "futuristic_architectural_space",
    category: "sci_fi_futuristic",
    categoryLabel: "Sci-Fi / Futuristic Background",
    promptText:
      "the background must feel advanced and forward-looking. Sleek structures, clean technological geometry, controlled lighting, and a believable futuristic environment.",
    tags: ["sci-fi", "futuristic", "architecture", "technology"],
  },
  {
    value: "holographic_tech_environment",
    category: "sci_fi_futuristic",
    categoryLabel: "Sci-Fi / Futuristic Background",
    promptText:
      "the background must suggest digital and interactive space. Luminous interface-like elements, layered glow, advanced visual systems, and a high-tech immersive atmosphere.",
    tags: ["sci-fi", "holographic", "tech", "glow"],
  },
  {
    value: "cyber_inspired_setting",
    category: "sci_fi_futuristic",
    categoryLabel: "Sci-Fi / Futuristic Background",
    promptText:
      "the background must feel dense, technological, and visually charged. Layered light sources, digital mood, sleek surfaces, and a stylized future-facing environment with strong atmosphere.",
    tags: ["sci-fi", "cyber", "technology", "digital"],
  },
  {
    value: "space_age_minimal_future",
    category: "sci_fi_futuristic",
    categoryLabel: "Sci-Fi / Futuristic Background",
    promptText:
      "the background must feel futuristic in a restrained way. Clean advanced surfaces, elegant minimal geometry, subtle luminous detail, and a refined vision of the near future.",
    tags: ["sci-fi", "minimal", "future", "clean"],
  },

  // Vintage / Retro Background
  {
    value: "nostalgic_retro_setting",
    category: "vintage_retro",
    categoryLabel: "Vintage / Retro Background",
    promptText:
      "the background must feel emotionally nostalgic. Period-inspired visual cues, softened atmosphere, restrained aging or wear, and a time-rooted environment with charming character.",
    tags: ["vintage", "retro", "nostalgic", "period"],
  },
  {
    value: "analog_film_era_backdrop",
    category: "vintage_retro",
    categoryLabel: "Vintage / Retro Background",
    promptText:
      "the background must evoke an older visual era. Slight visual softness, period atmosphere, subtle aging cues, and a classic scene structure inspired by analog image culture.",
    tags: ["vintage", "analog", "film", "classic"],
  },
  {
    value: "retro_graphic_environment",
    category: "vintage_retro",
    categoryLabel: "Vintage / Retro Background",
    promptText:
      "the background must feel stylized and era-specific. Vintage-inspired shapes, old-school design energy, simplified period cues, and a visually intentional throwback atmosphere.",
    tags: ["vintage", "retro", "graphic", "old-school"],
  },
  {
    value: "worn_old_world_ambiance",
    category: "vintage_retro",
    categoryLabel: "Vintage / Retro Background",
    promptText:
      "the background must suggest age and history. Gentle wear, muted tonal richness, layered texture, and a lived-in vintage mood with quiet atmospheric depth.",
    tags: ["vintage", "old-world", "worn", "historic"],
  },

  // Texture / Material Background
  {
    value: "concrete_or_stone_surface",
    category: "texture_material",
    categoryLabel: "Texture / Material Background",
    promptText:
      "the background must be driven by material texture rather than location. Raw mineral surface character, subtle imperfections, tactile depth, and a physically grounded backdrop with visual solidity.",
    tags: ["texture", "concrete", "stone", "material"],
  },
  {
    value: "paper_or_handmade_texture",
    category: "texture_material",
    categoryLabel: "Texture / Material Background",
    promptText:
      "the background must feel paper-based or handcrafted. Fine surface grain, soft tactile irregularities, visible material presence, and a warm crafted visual foundation.",
    tags: ["texture", "paper", "handmade", "crafted"],
  },
  {
    value: "metal_or_industrial_material",
    category: "texture_material",
    categoryLabel: "Texture / Material Background",
    promptText:
      "the background must emphasize material toughness and structure. Metallic surface cues, controlled texture variation, subtle wear or polish, and a strong physical presence.",
    tags: ["texture", "metal", "industrial", "material"],
  },
  {
    value: "fabric_or_soft_material_backdrop",
    category: "texture_material",
    categoryLabel: "Texture / Material Background",
    promptText:
      "the background must use soft textile-like material qualities. Gentle folds, tactile softness, surface richness, and a calm material-driven atmosphere with depth.",
    tags: ["texture", "fabric", "soft", "textile"],
  },

  // Transparent / Cutout Background
  {
    value: "pure_transparent_cutout",
    category: "transparent_cutout",
    categoryLabel: "Transparent / Cutout Background",
    promptText:
      "the background must be fully transparent with zero alpha. No visible backdrop elements, no fake environmental fill, and a clean isolated subject suitable for PNG, stickers, or assets.",
    tags: ["transparent", "cutout", "png", "asset"],
  },
  {
    value: "isolated_subject_extraction",
    category: "transparent_cutout",
    categoryLabel: "Transparent / Cutout Background",
    promptText:
      "the background must be completely removed while preserving clean subject edges. No environmental distractions, no added scene elements, and a precise cutout-ready presentation.",
    tags: ["transparent", "extraction", "isolation", "cutout"],
  },
  {
    value: "asset_ready_transparent_space",
    category: "transparent_cutout",
    categoryLabel: "Transparent / Cutout Background",
    promptText:
      "the background must remain fully transparent and production-friendly. The subject should read clearly as a standalone asset with no visible backdrop contamination.",
    tags: ["transparent", "asset", "production", "clean"],
  },
  {
    value: "clean_sticker_style_isolation",
    category: "transparent_cutout",
    categoryLabel: "Transparent / Cutout Background",
    promptText:
      "the background must be fully transparent and visually clean for sticker or sprite use. The subject should remain isolated, readable, and free from environmental residue or noise.",
    tags: ["transparent", "sticker", "sprite", "isolation"],
  },

  // Depth / Blurred Background
  {
    value: "shallow_depth_portrait_blur",
    category: "depth_blurred",
    categoryLabel: "Depth / Blurred Background",
    promptText:
      "the background must be softly out of focus. Clear subject separation, smooth blur falloff, reduced environmental detail, and a portrait-friendly sense of depth.",
    tags: ["depth", "blur", "portrait", "bokeh"],
  },
  {
    value: "creamy_bokeh_atmosphere",
    category: "depth_blurred",
    categoryLabel: "Depth / Blurred Background",
    promptText:
      "the background must emphasize soft bokeh and luminous blur. Gentle highlight diffusion, elegant depth separation, and a polished photographic atmosphere that keeps the subject dominant.",
    tags: ["depth", "bokeh", "blur", "photographic"],
  },
  {
    value: "distant_environmental_blur",
    category: "depth_blurred",
    categoryLabel: "Depth / Blurred Background",
    promptText:
      "the background must remain contextual but visually soft. Hinted location detail, strong subject isolation, atmospheric perspective, and clean depth-based hierarchy.",
    tags: ["depth", "blur", "environment", "isolation"],
  },
  {
    value: "cinematic_defocused_backdrop",
    category: "depth_blurred",
    categoryLabel: "Depth / Blurred Background",
    promptText:
      "the background must feel cinematic through controlled defocus. Layered blur, soft light bloom, minimal distraction, and emotionally rich visual depth.",
    tags: ["depth", "cinematic", "defocus", "blur"],
  },

  // Thematic Background
  {
    value: "music_themed_environment",
    category: "thematic",
    categoryLabel: "Thematic Background",
    promptText:
      "the background must reflect a music-related theme. Supportive visual cues, mood-driven atmosphere, stage or studio implications, and theme-appropriate context without clutter.",
    tags: ["thematic", "music", "stage", "studio"],
  },
  {
    value: "sports_themed_context",
    category: "thematic",
    categoryLabel: "Thematic Background",
    promptText:
      "the background must visually support an athletic or competition theme. Relevant cues, energetic atmosphere, and a context that strengthens the subject's role in a sports-focused composition.",
    tags: ["thematic", "sports", "athletic", "competition"],
  },
  {
    value: "technology_themed_scene",
    category: "thematic",
    categoryLabel: "Thematic Background",
    promptText:
      "the background must support a technology-oriented theme. Modern visual cues, sleek detail, and a context suggesting innovation, digital culture, or advanced tools.",
    tags: ["thematic", "technology", "digital", "innovation"],
  },
  {
    value: "fashion_themed_setting",
    category: "thematic",
    categoryLabel: "Thematic Background",
    promptText:
      "the background must support a fashion-oriented visual narrative. Editorial mood, refined atmosphere, industry-relevant context, and an aesthetically polished environment.",
    tags: ["thematic", "fashion", "editorial", "polished"],
  },

  // Pattern Background
  {
    value: "repeating_geometric_pattern",
    category: "pattern",
    categoryLabel: "Pattern Background",
    promptText:
      "the background must be built from a clean repeating pattern. Consistent visual rhythm, controlled spacing, and a decorative but non-distracting structure suitable for branding or graphic design.",
    tags: ["pattern", "geometric", "repeating", "branding"],
  },
  {
    value: "organic_decorative_pattern",
    category: "pattern",
    categoryLabel: "Pattern Background",
    promptText:
      "the background must use a softer more natural repeating motif. Flowing repetition, decorative harmony, and a stylized visual texture that remains supportive rather than dominant.",
    tags: ["pattern", "organic", "decorative", "motif"],
  },
  {
    value: "branded_motif_repetition",
    category: "pattern",
    categoryLabel: "Pattern Background",
    promptText:
      "the background must feel like a designed branded pattern system. Controlled repetition, visual identity consistency, and a polished decorative field suitable for commercial use.",
    tags: ["pattern", "branded", "motif", "commercial"],
  },
  {
    value: "minimal_micro_pattern_texture",
    category: "pattern",
    categoryLabel: "Pattern Background",
    promptText:
      "the background must use subtle repeating detail at low intensity. Fine patterning, restrained contrast, and soft decorative support that adds interest without stealing focus.",
    tags: ["pattern", "micro-pattern", "subtle", "minimal"],
  },

  // Collage / Mixed Media Background
  {
    value: "paper_collage_composition",
    category: "collage_mixed_media",
    categoryLabel: "Collage / Mixed Media Background",
    promptText:
      "the background must look assembled from layered paper elements. Overlapping shapes, cut edges, tactile layering, and a handmade editorial collage atmosphere.",
    tags: ["collage", "paper", "layered", "handmade"],
  },
  {
    value: "mixed_media_art_backdrop",
    category: "collage_mixed_media",
    categoryLabel: "Collage / Mixed Media Background",
    promptText:
      "the background must combine multiple visual materials and techniques. Layered marks, diverse textures, assembled composition, and an intentionally artistic mixed-media feel.",
    tags: ["collage", "mixed-media", "art", "texture"],
  },
  {
    value: "scrapbook_style_arrangement",
    category: "collage_mixed_media",
    categoryLabel: "Collage / Mixed Media Background",
    promptText:
      "the background must feel curated and layered. Paper fragments, visual notes, overlapping elements, and a personal handcrafted atmosphere with organized creative density.",
    tags: ["collage", "scrapbook", "layered", "handcrafted"],
  },
  {
    value: "poster_collage_energy",
    category: "collage_mixed_media",
    categoryLabel: "Collage / Mixed Media Background",
    promptText:
      "the background must feel bold and layered like a designed collage poster. Torn elements, stacked visual fragments, graphic rhythm, and expressive compositional texture.",
    tags: ["collage", "poster", "bold", "graphic"],
  },

  // Dynamic / Action Background
  {
    value: "speed_line_action_field",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Background",
    promptText:
      "the background must amplify motion and action. Directional visual flow, dynamic line energy, strong movement cues, and a sense of acceleration behind the main subject.",
    tags: ["dynamic", "action", "speed-lines", "motion"],
  },
  {
    value: "explosion_of_visual_energy",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Background",
    promptText:
      "the background must feel intense and high-impact. Radiating energy, dramatic action cues, forceful directional composition, and an emotionally charged visual environment.",
    tags: ["dynamic", "action", "explosion", "energy"],
  },
  {
    value: "wind_and_motion_atmosphere",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Background",
    promptText:
      "the background must support movement through flowing environmental cues. Directional particles, trailing shapes, soft turbulence, and an active scene structure that enhances dynamism.",
    tags: ["dynamic", "wind", "motion", "particles"],
  },
  {
    value: "high_intensity_action_backdrop",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Background",
    promptText:
      "the background must feel physically active and energetic. Strong directional composition, vivid motion cues, dramatic depth, and a visually forceful environment built to support action-oriented imagery.",
    tags: ["dynamic", "action", "high-intensity", "dramatic"],
  },
];

export const BackgroundModule: PromptKeyModule = {
  key: "background",
  icon: "image",

  groups: {
    core: {
      id: "core",
      order: 10,
      defaultOpen: true,
    },
    advanced: {
      id: "advanced",
      order: 20,
      defaultOpen: false,
    },
    override: {
      id: "override",
      order: 30,
      defaultOpen: false,
    },
  },

  fields: {
    backgroundStyle: {
      id: "backgroundStyle",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: backgroundStyleOptions,
      ui: {
        component: "select",
        optionLayout: "categorized",
        searchable: true,
        clearable: true,
        width: "full",
      },
    },

    extraDetails: {
      id: "extraDetails",
      type: "textarea",
      default: "",
      group: "advanced",
      order: 10,
      ui: {
        component: "textarea",
        rows: 3,
        width: "full",
      },
    },

    customText: {
      id: "customText",
      type: "textarea",
      default: "",
      group: "override",
      order: 10,
      isOverride: true,
      ui: {
        component: "textarea",
        rows: 4,
        width: "full",
      },
    },
  },

  compile: {
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
};