export default {
  app: {
    title: "Prompt Draft",
    navigation: {
      create: "Create Prompt",
      collage: "Collage Artworks",
      guide: "Guides",
    },
    switchTheme: 'Switch Theme',
    switchLang: 'Switch Language',
  },
  pwa: {
    install: {
      android: {
        title: "Install app",
        description: "You can install Prompt Draft on your device and use it like a regular app.",
        action: "Install app",
      },
      ios: {
        title: "Install on iOS device",
        description:
          "To install on iPhone or iPad, use the browser Share button and choose Add to Home Screen.",
        action: "Got it",
        steps: {
          share: "1. Tap the Share button in Safari.",
          addToHomeScreen: "2. Choose Add to Home Screen.",
          confirm: "3. Tap Add on the next screen.",
        },
      },
      actions: {
        close: "Close",
      },
    },
  },
  pages: {
    collage: {
      title: "Collage Builder",
      description: "Select, paste, or drag images and export the final result from the canvas.",
      rotateYourPhone: 'Rotate Your Phone',
      dropzone: {
        title: "Add image",
        description: "Click / Paste / Drag & Drop",
      },
      images: {
        title: "Images",
        empty: "No images have been added yet.",
      },
      brand: {
        title: "Brand Overlay",
        telegramPostId: "Telegram post ID",
        telegramPostIdPlaceholder: "e.g. 450",
        logoColor: "Logo color",
        logoThemes: {
          white: "White",
          black: "Black",
        },
        position: "Brand position",
        positions: {
          "top-left": "Top left",
          "top-center": "Top center",
          "top-right": "Top right",
          "center-left": "Center left",
          center: "Center",
          "center-right": "Center right",
          "bottom-left": "Bottom left",
          "bottom-center": "Bottom center",
          "bottom-right": "Bottom right",
        },
        height: "Brand height: {value}px",
        opacity: "Opacity: {value}%",
        gap: "Logo and QR gap: {value}px",
        help: "If the post ID is empty, only the logo will be displayed.",
      },
      canvas: {
        title: "Canvas",
        padding: "Inner padding: {value}px",
        gap: "Image gap: {value}px",
        backgroundColor: "Background color",
      },
      preview: {
        grid: "Grid: {columns}×{rows}",
        rendering: "Rendering...",
      },
      actions: {
        save: "Save",
        copy: "Copy",
        clear: "Clear",
        remove: "Remove",
      },
    },
  },
  modules: {
    style: {
      title: "Style",
      description: "Controls the visual and artistic direction of the prompt.",
      groups: {
        core: {
          title: "Core Style",
          description: "Main style identity and rendering medium.",
        },
        modifiers: {
          title: "Style Modifiers",
          description: "Fine-tune the visual language and stylization behavior.",
        },
        advanced: {
          title: "Advanced Details",
          description: "Optional extra details added to the generated style text.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated style output with your own text.",
        },
      },
      fields: {
        preset: {
          label: "Style Preset",
          description: "Choose the main artistic style.",
          placeholder: "Select a style preset",
          options: {
            "3d_cartoon": "3D Cartoon",
            anime_cover: "Anime Cover",
            cinematic_realism: "Cinematic Realism",
            clay_sculpture: "Clay Sculpture",
            vinyl_toy: "Vinyl Toy",
            angular_animation: "Angular Animation",
            childlike_drawing: "Childlike Drawing",
            cinematic_cgi_character: "Cinematic CGI Character",
            crafted_paper_collage: "Crafted Paper Collage",
            fashion_caricature_sketch: "Fashion Caricature Sketch",
            geometric_editorial: "Geometric Editorial",
            ink_character_sketch: "Ink Character Sketch",
            low_poly_3d: "Low-Poly 3D",
            low_poly_character: "Low-Poly Character",
            marker_concept_art: "Marker Concept Art",
            papier_mache_character: "Papier-Mâché Character",
            pixel_art_game_character: "Pixel Art Game Character",
            plush_toy_character: "Plush Toy Character",
            primitive_cut_paper: "Primitive Cut Paper",
            retro_comic: "Retro Comic",
            risograph_poster_art: "Risograph Poster Art",
            studio_photo_realism: "Studio Photo Realism",
            watercolor_editorial: "Watercolor Editorial",
            woodcut_editorial: "Woodcut Editorial",
          },
        },
        medium: {
          label: "Medium",
          description: "Choose the base visual medium.",
          placeholder: "Select a medium",
          categories: {
            digital_cg: "Digital / CG",
            drawing: "Drawing",
            painting: "Painting",
            paper_craft: "Paper / Craft",
            photography: "Photography",
            printmaking: "Printmaking",
            sculpture_object: "Sculpture / Object",
            textile_handmade: "Textile / Handmade",
          },
          options: {
            three_d_render: "3D Render",
            digital_illustration: "Digital Illustration",
            photo_real: "Photo Real",
            painterly: "Painterly",
          },
        },
        stylizationLevel: {
          label: "Stylization Level",
          description: "Control how far the style moves away from realism.",
          placeholder: "Select stylization level",
          options: {
            subtle: "Subtle",
            controlled: "Controlled",
            strong: "Strong",
            extreme: "Extreme",
            abstract: "Abstract",
          },
        },
        shapeLanguage: {
          label: "Shape Language",
          description: "Define the dominant form and silhouette behavior.",
          placeholder: "Select shape language",
          options: {
            soft_rounded: "Soft Rounded",
            geometric: "Geometric",
            fluid: "Fluid",
            blocky: "Blocky",
            angular: "Angular",
            elongated: "Elongated",
          },
        },
        visualTreatment: {
          label: "Visual Treatment",
          description: "Define the rendering treatment and surface behavior.",
          compatibilityWarnings: {
            mediumMismatch:
              "This option may not be the most natural match for the selected medium.",
          },
          options: {
            cel_shaded: "Cel Shaded",
            flat_graphic: "Flat Graphic",
            halftone_comic: "Halftone Comic",
            hand_painted: "Hand Painted",
            ink_watercolor: "Ink & Watercolor",
            minimalist: "Minimalist",
            paper_cutout: "Paper Cutout",
            textured: "Textured",
          },
          placeholder: "Select visual treatment",
        },
        finish: {
          label: "Finish",
          description: "Define the final visual polish and surface impression.",
          placeholder: "Select finish",
          compatibilityWarnings: {
            mediumMismatch:
              "This option may not be the most natural match for the selected medium.",
          },
          options: {
            clean: "Clean",
            premium: "Premium",
            handcrafted: "Handcrafted",
            graphic: "Graphic",
            glossy: "Glossy",
            matte: "Matte",
            rough: "Rough",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description: "Add optional style details without replacing the generated output.",
          placeholder: "Add extra style details...",
        },
        customText: {
          label: "Custom Style Override",
          description:
            "If filled, this text becomes the final style output and all other fields are ignored.",
          placeholder: "Write a complete custom style description...",
        },
      },
      presets: {
        soft_3d_cartoon: {
          label: "Soft 3D Cartoon",
          description: "A polished stylized 3D cartoon look with soft rounded forms.",
        },
        premium_vinyl_character: {
          label: "Premium Vinyl Character",
          description: "A collectible vinyl toy style with a luxury polished finish.",
        },
        handmade_clay_artwork: {
          label: "Handmade Clay Artwork",
          description: "A tactile handcrafted clay sculpture style.",
        },
        cinematic_realistic_image: {
          label: "Cinematic Realistic Image",
          description: "A clean cinematic realism setup with subtle stylization.",
        },
        angular_2d_animation: {
          label: "Angular 2D Animation",
          description:
            "A minimalist angular 2D animation style with bold graphic silhouettes and sharp geometric forms.",
        },
        cinematic_cgi_character: {
          label: "Cinematic CGI Character",
          description:
            "A cinematic CGI character style with soft rounded forms, painted treatment, and a premium polished finish.",
        },
        crafted_paper_collage: {
          label: "Crafted Paper Collage",
          description:
            "A handcrafted paper collage style with layered construction, blocky forms, and a tactile finish.",
        },
        geometric_editorial_portrait: {
          label: "Geometric Editorial Portrait",
          description:
            "A bold geometric editorial portrait style with simplified angular shapes and flat graphic treatment.",
        },
        ink_character_sketch: {
          label: "Ink Character Sketch",
          description:
            "An expressive ink character sketch with organic forms, watercolor texture, and a rough artistic finish.",
        },
        low_poly_character: {
          label: "Low-Poly Character",
          description:
            "A low-poly character style with simplified geometric forms and a clean minimalist finish.",
        },
        marker_concept_art: {
          label: "Marker Concept Art",
          description:
            "A stylized marker concept art look with structured forms, hand-painted treatment, and a clean visual finish.",
        },
        messy_fashion_caricature: {
          label: "Messy Fashion Caricature",
          description:
            "A grotesque fashion caricature style with exaggerated anatomy, messy ink-and-watercolor treatment, and satirical editorial energy.",
        },
        naive_childlike_artwork: {
          label: "Naive Childlike Artwork",
          description:
            "A naive childlike artwork style with simplified forms, playful imperfection, and handcrafted charm.",
        },
        papier_mache_character: {
          label: "Papier-Mâché Character",
          description:
            "A handcrafted papier-mâché character style with angular simplified forms and a tactile artistic finish.",
        },
        pixel_art_game_character: {
          label: "Pixel Art Game Character",
          description:
            "A pixel-art game character style with blocky simplified forms, strong stylization, and bold graphic clarity.",
        },
        plush_toy_character: {
          label: "Plush Toy Character",
          description:
            "A plush toy character style with soft rounded forms, strong stylization, and a handcrafted tactile finish.",
        },
        primitive_cut_paper_portrait: {
          label: "Primitive Cut Paper Portrait",
          description:
            "A primitive cut-paper portrait style built from simple oversized layered shapes with bold flat construction.",
        },
        retro_comic_pop_art: {
          label: "Retro Comic Pop Art",
          description:
            "A retro comic pop-art style with bold black outlines, graphic contrast, and energetic halftone treatment.",
        },
        risograph_poster_art: {
          label: "Risograph Poster Art",
          description:
            "A risograph poster art style with structured forms, controlled stylization, and bold graphic finish.",
        },
        studio_photo_realism: {
          label: "Studio Photo Realism",
          description:
            "A studio photo realism setup with subtle stylization, natural forms, and a clean polished finish.",
        },
        watercolor_editorial: {
          label: "Watercolor Editorial",
          description:
            "A watercolor editorial illustration style with fluid organic forms and expressive ink-and-watercolor treatment.",
        },
        woodcut_editorial: {
          label: "Woodcut Editorial",
          description:
            "A woodcut editorial style with angular graphic forms, strong stylization, and a rough print-like finish.",
        },
      },
    },
    texture: {
      title: "Texture",
      description: "Controls material, surface quality, and tactile details of the prompt.",
      categories: {
        vinyl_plastic: "Vinyl / Plastic",
        clay_ceramic: "Clay / Ceramic",
        metal: "Metal",
        wood: "Wood",
        stone_mineral: "Stone / Mineral",
        glass_crystal: "Glass / Crystal",
        fabric_textile: "Fabric / Textile",
        leather_hide: "Leather / Hide",
        paper_cardboard: "Paper / Cardboard",
        rubber: "Rubber",
        organic_natural: "Organic / Natural",
      },
      warnings: {
        surface_smooth:
          "This surface is usually more suitable for clean, polished, or manufactured materials.",
        surface_matte:
          "Matte surfaces usually work best with paper, fabric, clay, wood, rubber, or non-reflective materials.",
        surface_glossy:
          "Glossy surfaces are less natural for fabric or highly porous materials unless they are coated, laminated, or treated.",
        surface_high_gloss:
          "High-gloss mirror-like finish is usually better for glass, metal, ceramic, resin, or coated plastic.",
        surface_brushed:
          "Brushed surface texture is most suitable for metal, and only sometimes works on wood or treated plastic.",
        surface_rough:
          "Rough tactile surfaces usually work better on wood, stone, clay, paper, or naturally textured materials.",
        surface_porous:
          "Porous surfaces are usually less suitable for glass or clean metal materials.",
        surface_grainy:
          "Fine grain usually works better on wood, clay, stone, paper, or organic materials.",
        surface_fibrous:
          "Fibrous texture is more natural for fabric, paper, wood, or organic materials.",
        surface_woven: "Woven texture is mostly suitable for fabric or textile-based materials.",
        surface_translucent:
          "Translucent surfaces are usually suitable for glass, crystal, resin, wax, or some plastics.",
        surface_frosted: "Frosted surfaces work best on glass, crystal, resin, or treated plastic.",
        detail_intricate:
          "Intricate fine detail is usually less suitable for very soft or rubber-like materials.",
        detail_coarse:
          "Coarse texture is usually less suitable for glass, crystal, silk, velvet, or highly polished materials.",
        imperfection_grain:
          "Fine grain usually works better on wood, clay, stone, paper, or porous organic materials.",
        imperfection_brush_marks:
          "Brush marks usually make more sense on painted, handmade, paper, wood, clay, or ceramic surfaces.",
        imperfection_paint_splatter:
          "Paint splatter usually works better on painted, paper, canvas, wood, plastic, resin, or toy-like materials.",
        imperfection_scratches:
          "Scratches are usually clearer on hard materials like metal, plastic, glass, wood, or leather.",
        imperfection_cracks:
          "Cracks are usually more natural on clay, ceramic, stone, wood, paint, glass, or brittle materials.",
        imperfection_dents:
          "Dents usually work better on metal, plastic, rubber, leather, clay, or flexible materials.",
        imperfection_chips: "Chipped edges usually work better on hard or brittle materials.",
        imperfection_stains:
          "Stains are usually more natural on fabric, paper, wood, leather, stone, clay, ceramic, or porous materials.",
        imperfection_roughness:
          "Rough uneven texture is usually less suitable for glass, crystal, silk, velvet, or very smooth materials.",
        imperfection_fading:
          "Faded color usually works better on fabric, paper, leather, wood, plastic, or painted materials.",
        imperfection_wrinkles:
          "Wrinkles and creases are usually suitable for fabric, leather, paper, rubber, or flexible materials.",
        imperfection_peeling:
          "Peeling or flaking works best on painted, coated, aged, or layered surfaces.",
        imperfection_corrosion: "Corrosion and oxidation are mostly suitable for metal materials.",
      },
      groups: {
        material: {
          title: "Material",
          description: "Define the main material identity.",
        },
        surface: {
          title: "Surface Quality",
          description: "Control the surface finish and level of texture detail.",
        },
        advanced: {
          title: "Advanced Texture Details",
          description: "Add optional imperfections and extra texture descriptions.",
        },
      },
      fields: {
        material: {
          label: "Material",
          description: "Choose the base material type.",
          placeholder: "Select a material",
          options: {
            vinyl: "Vinyl",
            clay: "Clay",
            plastic: "Plastic",
            metal: "Metal",
            fabric: "Fabric",
            acrylic_plastic: "Acrylic Plastic",
            molded_plastic: "Molded Plastic",
            pvc: "PVC",
            resin: "Resin",
            silicone: "Silicone",
            aluminum: "Aluminum",
            bamboo: "Bamboo",
            birch: "Birch",
            bone: "Bone",
            brass: "Brass",
            bronze: "Bronze",
            canvas: "Canvas",
            cardboard: "Cardboard",
            cedar: "Cedar",
            chrome: "Chrome",
            concrete: "Concrete",
            copper: "Copper",
            coral: "Coral",
            cotton: "Cotton",
            crystal: "Crystal",
            denim: "Denim",
            earthenware: "Earthenware",
            faux_leather: "Faux Leather",
            felt: "Felt",
            frosted_glass: "Frosted Glass",
            glass: "Glass",
            gold: "Gold",
            granite: "Granite",
            iron: "Iron",
            ivory: "Ivory",
            kraft_paper: "Kraft Paper",
            lace: "Lace",
            latex: "Latex",
            leather: "Leather",
            limestone: "Limestone",
            linen: "Linen",
            mahogany: "Mahogany",
            maple: "Maple",
            marble: "Marble",
            neoprene: "Neoprene",
            oak: "Oak",
            paper: "Paper",
            parchment: "Parchment",
            pine: "Pine",
            plush: "Plush",
            porcelain: "Porcelain",
            quartz: "Quartz",
            rubber: "Rubber",
            sandstone: "Sandstone",
            shell: "Shell",
            silk: "Silk",
            silver: "Silver",
            slate: "Slate",
            stained_glass: "Stained Glass",
            stainless_steel: "Stainless Steel",
            steel: "Steel",
            stoneware: "Stoneware",
            suede: "Suede",
            terracotta: "Terracotta",
            titanium: "Titanium",
            velvet: "Velvet",
            walnut: "Walnut",
            wax: "Wax",
            wool: "Wool",
          },
        },
        surface: {
          label: "Surface",
          description: "Choose the surface finish.",
          placeholder: "Select a surface finish",
          options: {
            smooth: "Smooth",
            matte: "Matte",
            glossy: "Glossy",
            porous: "Porous",
            brushed: "Brushed",
            fibrous: "Fibrous",
            frosted: "Frosted",
            grainy: "Grainy",
            high_gloss: "High Gloss",
            rough: "Rough",
            translucent: "Translucent",
            woven: "Woven",
          },
        },
        detailLevel: {
          label: "Detail Level",
          description: "Control how much surface detail is visible.",
          placeholder: "Select detail level",
          options: {
            minimal: "Minimal",
            subtle: "Subtle",
            visible: "Visible",
            rich: "Rich",
            coarse: "Coarse",
            highly_detailed: "Highly Detailed",
            intricate: "Intricate",
          },
        },
        imperfections: {
          label: "Imperfections",
          description: "Add realistic or stylized surface imperfections.",
          placeholder: "Select imperfections",
          options: {
            clean: "Clean",
            handmade: "Handmade Imperfections",
            grain: "Fine Grain",
            brush_marks: "Brush Marks",
            paint_splatter: "Paint Splatter",
            chips: "Chips",
            corrosion: "Corrosion",
            cracks: "Cracks",
            dents: "Dents",
            dust: "Dust",
            fading: "Fading",
            peeling: "Peeling",
            roughness: "Roughness",
            scratches: "Scratches",
            stains: "Stains",
            weathered: "Weathered",
            wrinkles: "Wrinkles",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description: "Add optional texture details without replacing the generated output.",
          placeholder: "Add extra texture details...",
        },
        customText: {
          label: "Custom Texture Override",
          description:
            "If filled, this text becomes the final texture output and all other fields are ignored.",
          placeholder: "Write a complete custom texture description...",
        },
      },
      presets: {
        smooth_vinyl: {
          label: "Smooth Vinyl",
          description: "A clean smooth vinyl-like material setup.",
        },
        handmade_clay: {
          label: "Handmade Clay",
          description: "A tactile handmade clay surface with subtle imperfections.",
        },
        polished_metal: {
          label: "Polished Metal",
          description: "A glossy polished metallic material.",
        },
        painterly_surface: {
          label: "Painterly Surface",
          description: "A matte stylized surface with brush marks and paint details.",
        },
      },
    },
    deformation: {
      title: "Deformation",
      description: "Controls how the subject is distorted, exaggerated, or transformed.",
      groups: {
        core: {
          title: "Deformation",
          description: "Choose the exact deformation style.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional extra deformation details without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated deformation output with your own text.",
        },
      },
      fields: {
        deformationStyle: {
          label: "Deformation Style",
          description: "Select the desired deformation style from the categorized list.",
          placeholder: "Select a deformation style",
          categories: {
            brutalist: "Brutalist",
            caricature: "Caricature",
            compressed: "Compressed",
            cute_chibi: "Cute / Chibi",
            elastic: "Elastic",
            extreme_stylized: "Extreme / Stylized",
            fashion_editorial: "Fashion / Editorial",
            geometric: "Geometric",
            grotesque: "Grotesque",
            inflated: "Inflated",
            insectoid_creature: "Insectoid / Creature",
            liquid: "Liquid",
            material_driven: "Material Driven",
            minimal: "Minimal",
            motion_driven: "Motion Driven",
            organic: "Organic",
            paper_cutout: "Paper Cutout",
            puppet_doll: "Puppet / Doll",
            sculptural: "Sculptural",
            surreal: "Surreal",
          },
          options: {
            abstract_human_hybrid: "Abstract Human Hybrid",
            abstract_statue_deformation: "Abstract Statue Deformation",
            absurd_misshapen_anatomy: "Absurd Misshapen Anatomy",
            action_arc_distortion: "Action Arc Distortion",
            alien_elongated_structure: "Alien Elongated Structure",
            angular_faceted_anatomy: "Angular Faceted Anatomy",
            asymmetric_natural_growth: "Asymmetric Natural Growth",
            asymmetrical_body_imbalance: "Asymmetrical Body Imbalance",
            avant_garde_pose_distortion: "Avant Garde Pose Distortion",
            awkward_personality_distortion: "Awkward Personality Distortion",
            baby_like_proportion_shift: "Baby Like Proportion Shift",
            balloon_like_anatomy: "Balloon Like Anatomy",
            chiseled_stone_like_planes: "Chiseled Stone Like Planes",
            clay_built_body_distortion: "Clay Built Body Distortion",
            comedic_face_heavy_exaggeration: "Comedic Face Heavy Exaggeration",
            compact_toy_cuteness: "Compact Toy Cuteness",
            creature_hybrid_distortion: "Creature Hybrid Distortion",
            cuboid_block_deformation: "Cuboid Block Deformation",
            distorted_elegance: "Distorted Elegance",
            dramatic_silhouette_exaggeration: "Dramatic Silhouette Exaggeration",
            dreamlike_proportion_shift: "Dreamlike Proportion Shift",
            exoskeleton_body_logic: "Exoskeleton Body Logic",
            experimental_art_deformation: "Experimental Art Deformation",
            extreme_limb_flexibility: "Extreme Limb Flexibility",
            fabric_fold_deformation: "Fabric Fold Deformation",
            fashion_caricature_distortion: "Fashion Caricature Distortion",
            flat_graphic_figure: "Flat Graphic Figure",
            flattened_body_distortion: "Flattened Body Distortion",
            floating_inflated_figure: "Floating Inflated Figure",
            fluid_smear_transformation: "Fluid Smear Transformation",
            fractured_plane_structure: "Fractured Plane Structure",
            full_abstraction_distortion: "Full Abstraction Distortion",
            gentle_posture_redesign: "Gentle Posture Redesign",
            gravity_defying_figure: "Gravity Defying Figure",
            grotesque_humorous_exaggeration: "Grotesque Humorous Exaggeration",
            harsh_angular_compression: "Harsh Angular Compression",
            heavy_block_anatomy: "Heavy Block Anatomy",
            heavy_downward_compression: "Heavy Downward Compression",
            impact_squash_and_stretch: "Impact Squash and Stretch",
            impossible_body_geometry: "Impossible Body Geometry",
            insectoid_segmented_anatomy: "Insectoid Segmented Anatomy",
            latex_stretch_distortion: "Latex Stretch Distortion",
            layered_paper_body: "Layered Paper Body",
            liquid_stretch_distortion: "Liquid Stretch Distortion",
            low_intensity_proportion_shift: "Low Intensity Proportion Shift",
            luxury_sculptural_body: "Luxury Sculptural Body",
            mannequin_body_structure: "Mannequin Body Structure",
            marionette_jointed_body: "Marionette Jointed Body",
            melting_body_collapse: "Melting Body Collapse",
            miniature_handmade_model: "Miniature Handmade Model",
            monumental_rough_figure: "Monumental Rough Figure",
            oversized_head_tiny_body: "Oversized Head Tiny Body",
            overstuffed_soft_proportions: "Overstuffed Soft Proportions",
            porcelain_doll_proportions: "Porcelain Doll Proportions",
            primitive_block_distortion: "Primitive Block Distortion",
            puppet_cutout_pose: "Puppet Cutout Pose",
            radical_silhouette_transformation: "Radical Silhouette Transformation",
            restrained_facial_stylization: "Restrained Facial Stylization",
            root_like_body_flow: "Root Like Body Flow",
            rubber_hose_body_stretch: "Rubber Hose Body Stretch",
            runway_elongation: "Runway Elongation",
            soft_bendable_figure: "Soft Bendable Figure",
            soft_biomorphic_distortion: "Soft Biomorphic Distortion",
            soft_rounded_mascot_body: "Soft Rounded Mascot Body",
            soft_warped_anatomy: "Soft Warped Anatomy",
            speed_smear_body: "Speed Smear Body",
            spring_loaded_anatomy: "Spring Loaded Anatomy",
            squashed_compact_anatomy: "Squashed Compact Anatomy",
            squeezed_facial_features: "Squeezed Facial Features",
            strange_theatrical_distortion: "Strange Theatrical Distortion",
            subtle_body_elongation: "Subtle Body Elongation",
            swollen_facial_structure: "Swollen Facial Structure",
            torn_collage_distortion: "Torn Collage Distortion",
            triangular_silhouette_distortion: "Triangular Silhouette Distortion",
            twisted_organic_anatomy: "Twisted Organic Anatomy",
            warped_wood_volume: "Warped Wood Volume",
            wax_droop_distortion: "Wax Droop Distortion",
            wild_expressive_anatomy: "Wild Expressive Anatomy",
            wind_pulled_anatomy: "Wind Pulled Anatomy",
            wooden_doll_distortion: "Wooden Doll Distortion",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional extra deformation details without replacing the generated output.",
          placeholder: "Add extra deformation details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own deformation text and replace the generated output.",
          placeholder: "Write your custom deformation text...",
        },
      },
    },
    background: {
      title: "Background",
      description: "Controls the visual setting or backdrop behind the subject.",
      groups: {
        core: {
          title: "Background",
          description: "Choose the exact background style.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional extra background details without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated background output with your own text.",
        },
      },
      fields: {
        backgroundStyle: {
          label: "Background Style",
          description: "Select the desired background style from the categorized list.",
          placeholder: "Select a background style",
          categories: {
            abstract: "Abstract",
            cinematic: "Cinematic",
            clean_minimal: "Clean / Minimal",
            collage_mixed_media: "Collage / Mixed Media",
            depth_blurred: "Depth / Blurred",
            dynamic_action: "Dynamic / Action",
            environmental: "Environmental",
            fantasy_surreal: "Fantasy / Surreal",
            graphic_poster: "Graphic / Poster",
            luxury_premium: "Luxury / Premium",
            nature: "Nature",
            pattern: "Pattern",
            sci_fi_futuristic: "Sci-Fi / Futuristic",
            sports_stadium: "Sports / Stadium",
            studio: "Studio",
            texture_material: "Texture / Material",
            thematic: "Thematic",
            transparent_cutout: "Transparent / Cutout",
            urban: "Urban",
            vintage_retro: "Vintage / Retro",
          },
          options: {
            action_field_setting: "Action Field Setting",
            airy_white_space_composition: "Airy White Space Composition",
            analog_film_era_backdrop: "Analog Film Era Backdrop",
            arena_crowd_atmosphere: "Arena Crowd Atmosphere",
            atmospheric_haze_scene: "Atmospheric Haze Scene",
            bold_poster_composition: "Bold Poster Composition",
            classic_studio_paper_backdrop: "Classic Studio Paper Backdrop",
            coastal_or_waterside_scene: "Coastal or Waterside Scene",
            color_field_abstraction: "Color Field Abstraction",
            commercial_product_studio: "Commercial Product Studio",
            concrete_or_stone_surface: "Concrete or Stone Surface",
            cyber_inspired_setting: "Cyber-Inspired Setting",
            dramatic_dark_studio: "Dramatic Dark Studio",
            dramatic_storytelling_backdrop: "Dramatic Storytelling Backdrop",
            dreamlike_fantasy_environment: "Dreamlike Fantasy Environment",
            editorial_graphic_layout: "Editorial Graphic Layout",
            elegant_premium_setting: "Elegant Premium Setting",
            enchanted_world_backdrop: "Enchanted World Backdrop",
            everyday_indoor_environment: "Everyday Indoor Environment",
            expressive_abstract_energy: "Expressive Abstract Energy",
            fabric_or_soft_material_backdrop: "Fabric or Soft Material Backdrop",
            fluid_abstract_forms: "Fluid Abstract Forms",
            forest_or_woodland_setting: "Forest or Woodland Setting",
            futuristic_architectural_space: "Futuristic Architectural Space",
            geometric_abstract_structure: "Geometric Abstract Structure",
            holographic_tech_environment: "Holographic Tech Environment",
            industrial_urban_texture: "Industrial Urban Texture",
            lush_natural_landscape: "Lush Natural Landscape",
            luxury_interior_ambiance: "Luxury Interior Ambiance",
            metal_or_industrial_material: "Metal or Industrial Material",
            modern_city_backdrop: "Modern City Backdrop",
            moody_cinematic_depth: "Moody Cinematic Depth",
            neon_lit_urban_night: "Neon Lit Urban Night",
            night_scene_cinematic_setting: "Night Scene Cinematic Setting",
            nostalgic_retro_setting: "Nostalgic Retro Setting",
            open_sky_and_horizon: "Open Sky and Horizon",
            opulent_dramatic_backdrop: "Opulent Dramatic Backdrop",
            paper_or_handmade_texture: "Paper or Handmade Texture",
            plain_seamless_backdrop: "Plain Seamless Backdrop",
            polished_brand_aesthetic: "Polished Brand Aesthetic",
            premium_portrait_studio: "Premium Portrait Studio",
            promotional_campaign_backdrop: "Promotional Campaign Backdrop",
            public_place_atmosphere: "Public Place Atmosphere",
            realistic_outdoor_setting: "Realistic Outdoor Setting",
            retro_graphic_environment: "Retro Graphic Environment",
            soft_neutral_background: "Soft Neutral Background",
            space_age_minimal_future: "Space Age Minimal Future",
            stadium_spotlight_environment: "Stadium Spotlight Environment",
            street_level_urban_scene: "Street Level Urban Scene",
            subtle_tonal_gradient: "Subtle Tonal Gradient",
            surreal_spatial_distortion: "Surreal Spatial Distortion",
            symbolic_surreal_scene: "Symbolic Surreal Scene",
            thumbnail_friendly_graphic_scene: "Thumbnail-Friendly Graphic Scene",
            training_or_performance_backdrop: "Training or Performance Backdrop",
            work_or_lifestyle_environment: "Work or Lifestyle Environment",
            worn_old_world_ambiance: "Worn Old World Ambiance",
            asset_ready_transparent_space: "Asset Ready Transparent Space",
            branded_motif_repetition: "Branded Motif Repetition",
            cinematic_defocused_backdrop: "Cinematic Defocused Backdrop",
            clean_sticker_style_isolation: "Clean Sticker Style Isolation",
            creamy_bokeh_atmosphere: "Creamy Bokeh Atmosphere",
            distant_environmental_blur: "Distant Environmental Blur",
            explosion_of_visual_energy: "Explosion Of Visual Energy",
            fashion_themed_setting: "Fashion Themed Setting",
            high_intensity_action_backdrop: "High Intensity Action Backdrop",
            isolated_subject_extraction: "Isolated Subject Extraction",
            minimal_micro_pattern_texture: "Minimal Micro Pattern Texture",
            mixed_media_art_backdrop: "Mixed Media Art Backdrop",
            music_themed_environment: "Music Themed Environment",
            organic_decorative_pattern: "Organic Decorative Pattern",
            paper_collage_composition: "Paper Collage Composition",
            poster_collage_energy: "Poster Collage Energy",
            pure_transparent_cutout: "Pure Transparent Cutout",
            repeating_geometric_pattern: "Repeating Geometric Pattern",
            scrapbook_style_arrangement: "Scrapbook Style Arrangement",
            shallow_depth_portrait_blur: "Shallow Depth Portrait Blur",
            speed_line_action_field: "Speed Line Action Field",
            sports_themed_context: "Sports Themed Context",
            technology_themed_scene: "Technology Themed Scene",
            wind_and_motion_atmosphere: "Wind And Motion Atmosphere",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional extra background details without replacing the generated output.",
          placeholder: "Add extra background details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own background description and replace the generated output.",
          placeholder: "Write your custom background text...",
        },
      },
    },
    lighting: {
      title: "Lighting",
      description: "Controls the lighting setup or mood of illumination in the scene.",
      groups: {
        core: {
          title: "Lighting",
          description: "Choose the exact lighting style.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional extra lighting details without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated lighting output with your own text.",
        },
      },
      fields: {
        lightingStyle: {
          label: "Lighting Style",
          description: "Select the desired lighting style from the categorized list.",
          placeholder: "Select a lighting style",
          categories: {
            atmospheric: "Atmospheric",
            cinematic: "Cinematic",
            color_mood: "Color / Mood",
            hard_graphic: "Hard / Graphic",
            practical_environmental: "Practical / Environmental",
            soft_natural: "Soft / Natural",
            studio: "Studio",
            stylized_artistic: "Stylized / Artistic",
            subject_separation: "Subject Separation",
          },
          options: {
            anime_style_dramatic_lighting: "Anime Style Dramatic Lighting",
            background_separation_light: "Background Separation Light",
            backlit_silhouette: "Backlit Silhouette",
            beauty_lighting: "Beauty Lighting",
            bloom_heavy_glow: "Bloom Heavy Glow",
            candlelight_glow: "Candlelight Glow",
            chiaroscuro_lighting: "Chiaroscuro Lighting",
            claymation_lighting: "Claymation Lighting",
            clean_studio_lighting: "Clean Studio Lighting",
            comic_book_lighting: "Comic Book Lighting",
            cool_blue_mood_light: "Cool Blue Mood Light",
            cool_natural_light: "Cool Natural Light",
            dramatic_cinematic_lighting: "Dramatic Cinematic Lighting",
            dual_tone_lighting: "Dual Tone Lighting",
            dusty_light_rays: "Dusty Light Rays",
            edge_highlight: "Edge Highlight",
            film_noir_lighting: "Film Noir Lighting",
            firelight: "Firelight",
            fluorescent_indoor_light: "Fluorescent Indoor Light",
            gentle_ambient_light: "Gentle Ambient Light",
            golden_hour_cinematic_light: "Golden Hour Cinematic Light",
            halo_backlight: "Halo Backlight",
            hard_direct_light: "Hard Direct Light",
            harsh_flash_lighting: "Harsh Flash Lighting",
            hazy_volumetric_light: "Hazy Volumetric Light",
            high_contrast_graphic_lighting: "High Contrast Graphic Lighting",
            high_key_studio_lighting: "High Key Studio Lighting",
            iridescent_lighting: "Iridescent Lighting",
            low_key_studio_lighting: "Low Key Studio Lighting",
            misty_soft_glow: "Misty Soft Glow",
            monochromatic_lighting: "Monochromatic Lighting",
            moody_side_lighting: "Moody Side Lighting",
            natural_window_light: "Natural Window Light",
            neon_color_lighting: "Neon Color Lighting",
            overcast_daylight: "Overcast Daylight",
            painterly_lighting: "Painterly Lighting",
            pastel_lighting: "Pastel Lighting",
            rainy_reflective_lighting: "Rainy Reflective Lighting",
            rim_light: "Rim Light",
            rim_lit_studio_setup: "Rim Lit Studio Setup",
            screen_light: "Screen Light",
            silhouette_emphasis: "Silhouette Emphasis",
            smoky_stage_light: "Smoky Stage Light",
            soft_diffused_light: "Soft Diffused Light",
            softbox_lighting: "Softbox Lighting",
            spotlight_lighting: "Spotlight Lighting",
            stage_lighting: "Stage Lighting",
            streetlight_illumination: "Streetlight Illumination",
            strong_shadow_pattern: "Strong Shadow Pattern",
            subject_focused_light: "Subject Focused Light",
            surreal_dream_lighting: "Surreal Dream Lighting",
            top_hard_light: "Top Hard Light",
            toy_render_lighting: "Toy Render Lighting",
            underlighting: "Underlighting",
            warm_cinematic_glow: "Warm Cinematic Glow",
            warm_natural_light: "Warm Natural Light",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional extra lighting details without replacing the generated output.",
          placeholder: "Add extra lighting details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own lighting text and replace the generated output.",
          placeholder: "Write your custom lighting text...",
        },
      },
    },
    framing: {
      title: "Framing",
      description:
        "Controls shot size, subject placement, camera angle, composition, crop rules, and layout intent.",
      groups: {
        core: {
          title: "Framing",
          description: "Choose the exact framing and composition style.",
        },
        advanced: {
          title: "Advanced Details",
          description: "Add optional extra framing details without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated framing output with your own text.",
        },
      },
      fields: {
        framingStyle: {
          label: "Framing Style",
          description: "Select the desired framing style from the categorized list.",
          placeholder: "Select a framing style",
          categories: {
            camera_distance_lens_feel: "Camera Distance / Lens Feel",
            composition_style: "Composition Style",
            cropping_rules: "Cropping Rules",
            format_layout_intent: "Format / Layout Intent",
            perspective_angle: "Perspective / Angle",
            shot_size_crop: "Shot Size / Crop",
            subject_placement: "Subject Placement",
          },
          options: {
            asset_safe_margin: "Asset-Safe Margin",
            asymmetrical_composition: "Asymmetrical Composition",
            birds_eye_view: "Bird’s-Eye View",
            bust_shot: "Bust Shot",
            centered_composition: "Centered Composition",
            cinematic_composition: "Cinematic Composition",
            cinematic_widescreen_framing: "Cinematic Widescreen Framing",
            close_up: "Close Up",
            distant_observational_frame: "Distant Observational Frame",
            dramatic_wide_angle_frame: "Dramatic Wide Angle Frame",
            dynamic_diagonal_composition: "Dynamic Diagonal Composition",
            edge_weighted_composition: "Edge Weighted Composition",
            editorial_composition: "Editorial Composition",
            extreme_close_up: "Extreme Close Up",
            eye_level_angle: "Eye Level Angle",
            face_safe_crop: "Face-Safe Crop",
            frontal_view: "Frontal View",
            full_body: "Full Body",
            graphic_composition: "Graphic Composition",
            hands_safe_crop: "Hands-Safe Crop",
            head_and_shoulders: "Head and Shoulders",
            high_angle_view: "High Angle View",
            intimate_portrait_distance: "Intimate Portrait Distance",
            isolated_subject_composition: "Isolated Subject Composition",
            layered_depth_composition: "Layered Depth Composition",
            low_angle_view: "Low Angle View",
            lower_frame_placement: "Lower Frame Placement",
            medium_shot: "Medium Shot",
            natural_portrait_distance: "Natural Portrait Distance",
            negative_space_composition: "Negative Space Composition",
            no_crop_safe_frame: "No-Crop Safe Frame",
            off_center_composition: "Off Center Composition",
            poster_framing: "Poster Framing",
            poster_safe_composition: "Poster-Safe Composition",
            product_style_framing: "Product Style Framing",
            profile_view: "Profile View",
            rule_of_thirds_placement: "Rule of Thirds Placement",
            silhouette_safe_crop: "Silhouette-Safe Crop",
            social_portrait_framing: "Social Portrait Framing",
            square_icon_framing: "Square Icon Framing",
            symmetrical_composition: "Symmetrical Composition",
            telephoto_compressed_frame: "Telephoto Compressed Frame",
            three_quarter_angle: "Three-Quarter Angle",
            three_quarter_shot: "Three-Quarter Shot",
            thumbnail_framing: "Thumbnail Framing",
            tight_intentional_crop: "Tight Intentional Crop",
            top_down_view: "Top Down View",
            upper_frame_placement: "Upper Frame Placement",
            wide_angle_environmental_frame: "Wide Angle Environmental Frame",
            wide_full_body_frame: "Wide Full Body Frame",
            worms_eye_view: "Worm’s-Eye View",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description: "Add optional extra framing details without replacing the generated output.",
          placeholder: "Add extra framing details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own framing instructions and replace the generated output.",
          placeholder: "Write your custom framing text...",
        },
      },
    },
    pose: {
      title: "Pose",
      description:
        "Controls the subject’s body posture, gestures, and dynamic or static positioning in the scene.",
      groups: {
        core: {
          title: "Pose",
          description: "Choose the exact pose and body positioning for the subject.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional extra pose instructions without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated pose output with your own text.",
        },
      },
      fields: {
        poseStyle: {
          label: "Pose Style",
          description: "Select the desired pose style from the categorized list.",
          placeholder: "Select a pose style",
          categories: {
            character_emotional: "Character / Emotional",
            dynamic_action: "Dynamic / Action",
            editorial_fashion: "Editorial / Fashion",
            gesture_hand_based: "Gesture / Hand Based",
            interaction_object: "Interaction / Object",
            neutral_basic: "Neutral / Basic",
            seated_resting: "Seated / Resting",
            sports_athletic: "Sports / Athletic",
          },
          options: {
            action_ready_stance: "Action-Ready Stance",
            arms_crossed_pose: "Arms Crossed Pose",
            athlete_ready_stance: "Athlete-Ready Stance",
            awkward_off_balance_pose: "Awkward Off Balance Pose",
            casual_weight_shift_pose: "Casual Weight Shift Pose",
            celebration_pose: "Celebration Pose",
            confident_upright_pose: "Confident Upright Pose",
            contemplative_pose: "Contemplative Pose",
            crouching_pose: "Crouching Pose",
            dramatic_asymmetrical_fashion_pose: "Dramatic Asymmetrical Fashion Pose",
            elongated_elegant_pose: "Elongated Elegant Pose",
            expressive_hand_pose: "Expressive Hand Pose",
            fashion_editorial_stance: "Fashion Editorial Stance",
            hand_on_hip_pose: "Hand on Hip Pose",
            hands_at_sides_pose: "Hands at Sides Pose",
            hands_in_pockets_pose: "Hands in Pockets Pose",
            heroic_pose: "Heroic Pose",
            holding_object_pose: "Holding Object Pose",
            interacting_with_environment_pose: "Interacting with Environment Pose",
            jumping_pose: "Jumping Pose",
            kneeling_pose: "Kneeling Pose",
            leaning_on_surface_pose: "Leaning on Surface Pose",
            leaning_seated_pose: "Leaning Seated Pose",
            looking_at_object_pose: "Looking at Object Pose",
            mid_performance_pose: "Mid Performance Pose",
            mysterious_guarded_pose: "Mysterious Guarded Pose",
            open_arm_welcoming_pose: "Open Arm Welcoming Pose",
            over_the_shoulder_pose: "Over-the-Shoulder Pose",
            phone_or_device_interaction_pose: "Phone or Device Interaction Pose",
            playful_character_pose: "Playful Character Pose",
            playful_hand_gesture_pose: "Playful Hand Gesture Pose",
            pointing_gesture_pose: "Pointing Gesture Pose",
            power_stance_pose: "Power Stance Pose",
            presenting_object_pose: "Presenting Object Pose",
            reaching_pose: "Reaching Pose",
            reclining_pose: "Reclining Pose",
            relaxed_seated_pose: "Relaxed Seated Pose",
            relaxed_standing_pose: "Relaxed Standing Pose",
            running_action_pose: "Running Action Pose",
            runway_inspired_pose: "Runway Inspired Pose",
            seated_upright_pose: "Seated Upright Pose",
            shy_inward_pose: "Shy Inward Pose",
            sport_specific_action_pose: "Sport Specific Action Pose",
            standing_neutral_pose: "Standing Neutral Pose",
            symmetrical_formal_pose: "Symmetrical Formal Pose",
            training_action_pose: "Training Action Pose",
            turning_in_motion_pose: "Turning in Motion Pose",
            walking_motion_pose: "Walking Motion Pose",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional extra pose instructions without replacing the generated output.",
          placeholder: "Add extra pose details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own pose instructions and replace the generated output.",
          placeholder: "Write your custom pose text...",
        },
      },
    },
    expression: {
      title: "Expression",
      description:
        "Controls the subject’s facial expression, emotional tone, and overall facial mood.",
      groups: {
        core: {
          title: "Expression",
          description: "Choose the exact facial expression and emotional style.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional extra expression instructions without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated expression output with your own text.",
        },
      },
      fields: {
        expressionStyle: {
          label: "Expression Style",
          description: "Select the desired expression style from the categorized list.",
          placeholder: "Select an expression style",
          categories: {
            angry_aggressive: "Angry / Aggressive",
            comic_grotesque: "Comic / Grotesque",
            cute_chibi: "Cute / Chibi",
            dramatic_serious: "Dramatic / Serious",
            editorial_fashion: "Editorial / Fashion",
            fantasy_creature: "Fantasy / Creature",
            neutral_controlled: "Neutral / Controlled",
            positive_friendly: "Positive / Friendly",
            sad_vulnerable: "Sad / Vulnerable",
            surprised_shocked: "Surprised / Shocked",
          },
          options: {
            absurd_caricature_expression: "Absurd Caricature Expression",
            adorable_happy_face: "Adorable Happy Face",
            aggressive_confrontational_face: "Aggressive Confrontational Face",
            alien_unreadable_face: "Alien Unreadable Face",
            aloof_fashion_expression: "Aloof Fashion Expression",
            ancient_wise_expression: "Ancient Wise Expression",
            angry_intense_expression: "Angry Intense Expression",
            awkward_humorous_expression: "Awkward Humorous Expression",
            battle_ready_expression: "Battle-Ready Expression",
            cheerful_approachable_expression: "Cheerful Approachable Expression",
            comic_disbelief_expression: "Comic Disbelief Expression",
            confident_editorial_stare: "Confident Editorial Stare",
            confident_smile: "Confident Smile",
            confused_startled_expression: "Confused Startled Expression",
            controlled_professional_expression: "Controlled Professional Expression",
            cool_detached_gaze: "Cool Detached Gaze",
            curious_nonhuman_expression: "Curious Nonhuman Expression",
            cute_excited_expression: "Cute Excited Expression",
            distorted_theatrical_expression: "Distorted Theatrical Expression",
            dramatic_cinematic_gaze: "Dramatic Cinematic Gaze",
            dramatic_gasp_expression: "Dramatic Gasp Expression",
            dramatic_model_face: "Dramatic Model Face",
            elegant_subtle_expression: "Elegant Subtle Expression",
            exaggerated_goofy_face: "Exaggerated Goofy Face",
            focused_determined_expression: "Focused Determined Expression",
            furious_shouting_expression: "Furious Shouting Expression",
            gentle_smile: "Gentle Smile",
            gritted_teeth_expression: "Gritted Teeth Expression",
            grotesque_comic_grin: "Grotesque Comic Grin",
            heartbroken_expression: "Heartbroken Expression",
            innocent_wide_eyed_expression: "Innocent Wide Eyed Expression",
            intense_serious_stare: "Intense Serious Stare",
            joyful_expression: "Joyful Expression",
            lonely_distant_gaze: "Lonely Distant Gaze",
            luxury_calm_expression: "Luxury Calm Expression",
            magical_calm_expression: "Magical Calm Expression",
            mascot_friendly_expression: "Mascot Friendly Expression",
            melancholic_serious_face: "Melancholic Serious Face",
            minimal_emotional_expression: "Minimal Emotional Expression",
            mysterious_creature_gaze: "Mysterious Creature Gaze",
            mysterious_restrained_expression: "Mysterious Restrained Expression",
            neutral_calm_expression: "Neutral Calm Expression",
            outraged_protest_expression: "Outraged Protest Expression",
            overwhelmed_reaction_face: "Overwhelmed Reaction Face",
            playful_smile: "Playful Smile",
            predatory_focused_expression: "Predatory Focused Expression",
            quiet_melancholic_expression: "Quiet Melancholic Expression",
            relaxed_subtle_expression: "Relaxed Subtle Expression",
            sad_emotional_expression: "Sad Emotional Expression",
            satirical_smug_expression: "Satirical Smug Expression",
            serious_neutral_face: "Serious Neutral Face",
            shocked_exaggerated_face: "Shocked Exaggerated Face",
            soft_natural_expression: "Soft Natural Expression",
            soft_sleepy_expression: "Soft Sleepy Expression",
            stern_powerful_expression: "Stern Powerful Expression",
            surprised_wide_eyed_expression: "Surprised Wide Eyed Expression",
            tearful_emotional_face: "Tearful Emotional Face",
            tiny_shy_smile: "Tiny Shy Smile",
            vulnerable_soft_expression: "Vulnerable Soft Expression",
            warm_friendly_smile: "Warm Friendly Smile",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional extra expression instructions without replacing the generated output.",
          placeholder: "Add extra expression details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own expression instructions and replace the generated output.",
          placeholder: "Write your custom expression text...",
        },
      },
    },
    outfit: {
      title: "Outfit",
      description:
        "Controls the clothing, costume, and outfit style for the subject, regardless of age or species.",
      groups: {
        core: {
          title: "Outfit",
          description: "Choose the subject’s outfit style from the categorized list.",
        },
        advanced: {
          title: "Advanced Details",
          description: "Add optional extra outfit details without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated outfit output with your own text.",
        },
      },
      fields: {
        outfitStyle: {
          label: "Outfit Style",
          description: "Select the desired outfit style from the categorized list.",
          placeholder: "Select an outfit style",
          categories: {
            boys: "Boys",
            costume: "Costume",
            general: "General",
            girls: "Girls",
          },
          options: {
            boyish_casual_outfit: "Boyish Casual Outfit",
            casual_outfit: "Casual Outfit",
            cute_dress_outfit: "Cute Dress Outfit",
            elegant_girls_outfit: "Elegant Girls Outfit",
            fantasy_warrior_costume: "Fantasy Warrior Costume",
            festive_outfit: "Festive Outfit",
            formal_boys_outfit: "Formal Boys Outfit",
            formal_outfit: "Formal Outfit",
            girlish_casual_outfit: "Girlish Casual Outfit",
            hoodie_and_jeans_outfit: "Hoodie and Jeans Outfit",
            luxury_outfit: "Luxury Outfit",
            magical_wizard_costume: "Magical Wizard Costume",
            medieval_knight_costume: "Medieval Knight Costume",
            party_dress_outfit: "Party Dress Outfit",
            princess_costume: "Princess Costume",
            sci_fi_space_suit: "Sci-Fi Space Suit",
            sporty_boys_outfit: "Sporty Boys Outfit",
            sporty_outfit: "Sporty Outfit",
            superhero_costume: "Superhero Costume",
            traditional_ethnic_outfit: "Traditional Ethnic Outfit",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description: "Add optional extra outfit details without replacing the generated output.",
          placeholder: "Add extra outfit details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own outfit instructions and replace the generated output.",
          placeholder: "Write your custom outfit text...",
        },
      },
    },
    hair: {
      title: "Hair",
      description: "Controls the subject’s hair style, color, texture, and decorative styling.",
      groups: {
        core: {
          title: "Hair",
          description: "Select hair style, color, and texture.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional extra hair instructions without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated hair output with your own text.",
        },
      },
      fields: {
        hairStyle: {
          label: "Hair Style",
          description: "Select the hair style from the categorized list.",
          placeholder: "Select a hair style",
          categories: {
            boys_masculine: "Boys / Masculine",
            fantasy_stylized: "Fantasy / Stylized",
            general: "General",
            girls_feminine: "Girls / Feminine",
            hair_styling_accessories: "Hair Styling / Accessories",
            iconic_celebrity_inspired: "Iconic / Celebrity Inspired",
          },
          options: {
            anime_spiky_hair: "Anime Spiky Hair",
            bob_haircut: "Bob Haircut",
            braided_crown: "Braided Crown",
            braided_hairstyle: "Braided Hairstyle",
            classic_rockabilly_pompadour: "Classic Rockabilly Pompadour",
            classic_short_boys_haircut: "Classic Short Boys Haircut",
            cloud_like_hair: "Cloud Like Hair",
            covered_hair_or_scarf: "Covered Hair or Scarf",
            curly_boys_hairstyle: "Curly Boys Hairstyle",
            curly_feminine_hair: "Curly Feminine Hair",
            curly_voluminous_hair: "Curly Voluminous Hair",
            decorative_hair_ornaments: "Decorative Hair Ornaments",
            elf_like_long_hair: "Elf Like Long Hair",
            fantasy_warrior_hair: "Fantasy Warrior Hair",
            fashion_editorial_hair: "Fashion Editorial Hair",
            fire_like_hair: "Fire Like Hair",
            floating_gravity_defying_hair: "Floating Gravity Defying Hair",
            formal_styled_hair: "Formal Styled Hair",
            glam_rock_layered_hair: "Glam Rock Layered Hair",
            glamorous_waves: "Glamorous Waves",
            hair_under_hat: "Hair Under Hat",
            hair_with_bow: "Hair with Bow",
            hair_with_clips: "Hair with Clips",
            hair_with_headband: "Hair with Headband",
            high_ponytail: "High Ponytail",
            ice_like_hair: "Ice Like Hair",
            k_pop_idol_hairstyle: "K-Pop Idol Hairstyle",
            long_elegant_hair: "Long Elegant Hair",
            long_flowing_hair: "Long Flowing Hair",
            long_masculine_hair: "Long Masculine Hair",
            low_ponytail: "Low Ponytail",
            magical_glowing_hair: "Magical Glowing Hair",
            medium_natural_hair: "Medium Natural Hair",
            mermaid_flowing_hair: "Mermaid Flowing Hair",
            messy_boyish_hair: "Messy Boyish Hair",
            messy_casual_hair: "Messy Casual Hair",
            messy_festival_hair: "Messy Festival Hair",
            modern_fade_haircut: "Modern Fade Haircut",
            nineties_boyband_curtain_hair: "Nineties Boy Band Curtain Hair",
            old_hollywood_blonde_waves: "Old Hollywood Blonde Waves",
            pixie_cut: "Pixie Cut",
            pop_star_wet_look_hair: "Pop Star Wet-Look Hair",
            princess_like_hair: "Princess Like Hair",
            punk_mohawk: "Punk Mohawk",
            retro_beehive_hairstyle: "Retro Beehive Hairstyle",
            rock_singer_shag_haircut: "Rock Singer Shag Haircut",
            rockstar_messy_hair: "Rockstar Messy Hair",
            sculptural_stylized_hair: "Sculptural Stylized Hair",
            shaved_or_buzz_cut: "Shaved or Buzz Cut",
            short_clean_hair: "Short Clean Hair",
            side_part_hairstyle: "Side Part Hairstyle",
            slicked_back_hair: "Slicked Back Hair",
            soft_layered_hair: "Soft Layered Hair",
            spiky_hair: "Spiky Hair",
            sports_tied_back_hair: "Sports Tied Back Hair",
            straight_smooth_hair: "Straight Smooth Hair",
            textured_crop_hairstyle: "Textured Crop Hairstyle",
            twin_tails: "Twin Tails",
            undercut_hairstyle: "Undercut Hairstyle",
            vintage_cinema_star_waves: "Vintage Cinema Star Waves",
            wavy_soft_hair: "Wavy Soft Hair",
            wet_look_hair: "Wet-Look Hair",
            wind_blown_hair: "Wind-Blown Hair",
          },
        },
        hairColor: {
          label: "Hair Color",
          description: "Pick the hair color for the subject.",
          placeholder: "Select hair color",
        },
        hairTexture: {
          label: "Hair Texture",
          description: "Select the hair texture or type from the list.",
          placeholder: "Select hair texture",
          options: {
            coarse: "Coarse",
            coily: "Coily",
            curly: "Curly",
            fine: "Fine",
            fluffy: "Fluffy",
            glossy: "Glossy",
            matte: "Matte",
            sculpted: "Sculpted",
            silky: "Silky",
            straight: "Straight",
            thick: "Thick",
            wavy: "Wavy",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional extra hair instructions without replacing the generated output.",
          placeholder: "Add extra hair details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own hair instructions and replace the generated output.",
          placeholder: "Write your custom hair text...",
        },
      },
    },
    effects: {
      title: "Effects",
      description:
        "Controls visual and stylistic effects applied to the image, such as photographic, glitch, or magical effects.",
      groups: {
        core: {
          title: "Effects",
          description: "Select effect style and intensity.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional extra effect instructions without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated effect output with your own text.",
        },
      },
      fields: {
        effectStyle: {
          label: "Effect Style",
          description: "Select one or more effects from the categorized list.",
          placeholder: "Choose effect style(s)...",
          categories: {
            atmospheric: "Atmospheric",
            digital_glitch: "Digital / Glitch",
            film_analog: "Film / Analog",
            light_glow: "Light / Glow",
            motion_energy: "Motion / Energy",
            photographic: "Photographic",
            print_poster: "Print / Poster",
            quality_degradation: "Quality Degradation",
            surreal_magical: "Surreal / Magical",
            ui_graphic: "UI / Graphic",
          },
          options: {
            "35mm_film_effect": "35mm Film Effect",
            analog_film_grain: "Analog Film Grain",
            bloom_glow: "Bloom Glow",
            chromatic_aberration: "Chromatic Aberration",
            comic_dot_shading: "Comic Dot Shading",
            comic_speech_bubble: "Comic Speech Bubble",
            datamosh_artifact: "Datamosh Artifact",
            depth_haze: "Depth Haze",
            digital_noise: "Digital Noise",
            dust_and_scratches: "Dust And Scratches",
            dust_particles: "Dust Particles",
            energy_aura: "Energy Aura",
            ethereal_aura: "Ethereal Aura",
            film_grain: "Film Grain",
            floating_sparkles: "Floating Sparkles",
            fog_overlay: "Fog Overlay",
            glitch_distortion: "Glitch Distortion",
            halftone_effect: "Halftone Effect",
            hud_overlay: "HUD Overlay",
            jpeg_artifacts: "JPEG Artifacts",
            lens_flare: "Lens Flare",
            light_leak_effect: "Light Leak Effect",
            low_quality: "Low Quality",
            lowres_artifact: "Lowres Artifact",
            magical_particles: "Magical Particles",
            misty_glow: "Misty Glow",
            motion_blur: "Motion Blur",
            motion_trails: "Motion Trails",
            neon_glow: "Neon Glow",
            pixel_sorting: "Pixel Sorting",
            pixelated_image: "Pixelated Image",
            rain_droplets: "Rain Droplets",
            rgb_split_effect: "RGB Split Effect",
            risograph_misregistration: "Risograph Misregistration",
            scanline_effect: "Scanline Effect",
            screen_distortion: "Screen Distortion",
            screen_print_texture: "Screen Print Texture",
            shallow_bloom: "Shallow Bloom",
            soft_focus: "Soft Focus",
            soft_halo: "Soft Halo",
            sparkle_highlights: "Sparkle Highlights",
            speed_lines: "Speed Lines",
            subtle_vignette: "Subtle Vignette",
            vhs_tape_effect: "VHS Tape Effect",
            vintage_film_look: "Vintage Film Look",
          },
        },
        effectIntensity: {
          label: "Effect Intensity",
          description: "Select how strong the effect should appear.",
          placeholder: "Select effect intensity...",
          options: {
            balanced: "Balanced",
            extreme: "Extreme",
            strong: "Strong",
            subtle: "Subtle",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional instructions or clarifications for the effects without replacing the generated output.",
          placeholder: "Add extra effect details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own instructions to override the generated effect output.",
          placeholder: "Write your custom effect text...",
        },
      },
    },
    camera: {
      title: "Camera",
      description:
        "Controls camera type and lens perspective for the image, including general lens styles or specific camera models.",
      groups: {
        core: {
          title: "Camera",
          description: "Select camera style and model.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional extra camera instructions without replacing the generated output.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated camera output with your own text.",
        },
      },
      fields: {
        cameraStyle: {
          label: "Camera Style",
          description: "Select a camera style or specific camera model from the categorized list.",
          placeholder: "Choose a camera style...",
          categories: {
            analog: "Analog",
            digital: "Digital",
            general: "General",
          },
          options: {
            canon_ae1: "Canon AE-1",
            contax_t2: "Contax T2",
            hasselblad_500c: "Hasselblad 500C",
            kodak_disposable: "Kodak Disposable",
            leica_m6: "Leica M6",
            lomography: "Lomography",
            nikon_f3: "Nikon F3",
            pentax_k1000: "Pentax K1000",
            polaroid_sx70: "Polaroid SX-70",
            rolleiflex: "Rolleiflex",
            action_camera: "Action Camera",
            aerial_drone: "Aerial Drone",
            arri_alexa: "ARRI Alexa",
            blackmagic_pocket: "Blackmagic Pocket",
            canon_eos_r5: "Canon EOS R5",
            cinematic_camera: "Cinematic Camera",
            deep_focus: "Deep Focus",
            documentary_camera: "Documentary Camera",
            fisheye_lens: "Fisheye Lens",
            fujifilm_gfx_100s: "Fujifilm GFX 100S",
            fujifilm_x100v: "Fujifilm X100V",
            handheld_camera: "Handheld Camera",
            hasselblad_x2d: "Hasselblad X2D",
            leica_q2: "Leica Q2",
            leica_sl2: "Leica SL2",
            macro_lens: "Macro Lens",
            nikon_z8: "Nikon Z8",
            portrait_lens: "Portrait Lens",
            red_komodo: "RED Komodo",
            security_camera: "Security Camera",
            shallow_dof: "Shallow DOF",
            smartphone_camera: "Smartphone Camera",
            sony_a7r_iv: "Sony A7R IV",
            sony_a7s_iii: "Sony A7S III",
            telephoto_compression: "Telephoto Compression",
            ultra_wide_angle: "Ultra Wide Angle",
            webcam_camera: "Webcam Camera",
            wide_angle_lens: "Wide Angle Lens",
          },
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional instructions or clarifications for the camera without replacing the generated output.",
          placeholder: "Add extra camera details...",
        },
        customText: {
          label: "Custom Override",
          description: "Write your own instructions to override the generated camera output.",
          placeholder: "Write your custom camera text...",
        },
      },
    },
    colorPalette: {
      title: "Color Palette",
      description:
        "Control the color theme of the image using custom colors or predefined palettes.",
      groups: {
        core: {
          title: "Core",
          description:
            "Assign palettes or custom colors to specific parts of the image such as background, outfit, lighting, etc.",
        },
        advanced: {
          title: "Advanced",
          description:
            "Add optional notes about color usage without replacing the generated palette.",
        },
      },
      fields: {
        paletteAssignments: {
          label: "Color Assignments",
          description:
            "Assign palettes or custom colors to specific parts of the image such as background, outfit, lighting, etc.",
          placeholder: "Select palette assignments",
        },
        extraDetails: {
          label: "Extra Details",
          description:
            "Add optional notes about color usage without replacing the generated palette.",
          placeholder: "Add extra color palette details...",
        },
        customText: {
          description:
            "If filled, this text becomes the final color palette output and all other color palette fields are ignored.",
          label: "Custom Color Palette Override",
          placeholder: "Write a complete custom color palette description...",
        },
      },
    },
  },
  panel: {
    keyModule: "Key Module",
    customMode: "Custom",
    clear: "Clear",
    clearCustom: "Clear custom",
    copy: "Copy",
    copied: "Copied",
    none: "None",
    presets: "Presets",
    presetsDescription: "Choose a base option quickly",
    presetSelected: "Preset selected",
    compiledOutput: "Output",
    emptyOutput: "No output yet",
    emptyOutputTitle: "Nothing generated yet",
    emptyOutputDescription: "Choose a preset or fill one of the fields above.",
    emptyCustomOutputDescription: "Write a custom description to generate this module output.",
    customOverrideActive: "Custom override active",
    customOverrideEmpty: "Custom mode is active, but the custom output is empty.",
    fieldsFilled: "filled",
    multiSelectHint: "Hold Ctrl/Cmd to select multiple options.",
    emptyModuleTitle: "No configurable fields",
    emptyModuleDescription: "This module does not have any visible fields yet.",
    expand: "Expand",
    collapse: "Collapse",
    statusEmpty: "Empty",
    statusPartiallyFilled: "Partially filled",
    statusPreset: "Preset applied",
    statusCustom: "Custom override",
    statusCustomEmpty: "Custom empty",
  },
  home: {
    eyebrow: "Prompt Generator",
    title: "Prompt Draft",
    description: "Build modular, schema-driven prompts using reusable key modules.",
    createPrompt: "Create Prompt",
  },
  create: {
    draft: {
      restoring: "Restoring draft...",
      saving: "Saving...",
      savedAt: "Saved at {time}",
      newDraft: "New draft",
      clear: "Clear draft",
      clearConfirm: "Clear the entire draft? This action cannot be undone.",
    },
    tabs: {
      setup: "Setup",
      editor: "Editor",
      output: "Output",
    },
    eyebrow: "Prompt Builder",
    title: "Create Prompt",
    description: "Select key modules, edit their values, and generate a combined prompt output.",
    backHome: "Back Home",
    modulesTitle: "Key Modules",
    modulesDescription: "Choose which modules should be included in this prompt.",
    outputTitle: "Global Output",
    outputDescription: "Combined output generated from the selected modules.",
    emptyOutput: "No compiled prompt yet.",
    outputFormats: {
      modular: "Modular",
      natural: "Natural",
      json: "JSON",
    },
  },
  promptSetup: {
    title: "Prompt Setup",
    description: "Define the global structure and context of your prompt.",
    mode: {
      title: "Prompt Type",
      description: "Choose how the prompt should be interpreted.",
      options: {
        text_to_image: {
          label: "Text to Image",
          description: "Generate an image from a text-only prompt.",
        },
        image_to_image: {
          label: "Image to Image",
          description: "Transform an attached reference image.",
        },
      },
    },
    idea: {
      label: "Idea",
      description: "Describe the main concept or transformation goal.",
      placeholder: "Example: transform the input portrait into a stylized 3D character...",
    },
    core: {
      title: "Core Context",
      label: "Define the main idea and subject of the generated prompt",
    },
    output: {
      title: "Output Contraints",
      label: "Control framin, aspect ratio and global prompt rules",
    },
    subject: {
      label: "Subject",
      description: "Define the main subject of the prompt.",
      placeholder: "Example: person in the attached reference image",
    },
    aspectRatio: {
      label: "Aspect Ratio",
      description: "Choose the final image aspect ratio.",
    },
    globalRules: {
      label: "Global Rules",
      description: "Add rules that should affect the whole prompt.",
      placeholder:
        "Example: preserve identity, keep the subject centered, avoid cropped body parts...",
    },
    imageToImage: {
      title: "Image-to-Image Settings",
      description: "Define how the attached reference image should be interpreted.",
      referenceSubjectType: {
        label: "Reference Subject Type",
        description: "Choose what the attached reference image mainly contains.",
        options: {
          person: "Person",
          object: "Object",
          animal: "Animal",
          building: "Building / Architecture",
          product: "Product",
          vehicle: "Vehicle",
          scene: "Scene / Environment",
          custom: "Custom",
        },
      },
      customSubject: {
        label: "Custom Subject",
        description: "Write a custom subject type for the reference image.",
        placeholder: "Example: handmade ceramic mask, fantasy creature, abstract sculpture...",
      },
      subjectDescription: {
        label: "Subject Description",
        description: "Add optional details about the subject inside the reference image.",
        placeholder: "Example: young man with curly hair and black hoodie...",
      },
      generatedSubject: {
        label: "Generated Subject",
        empty: "No subject generated yet.",
      },
      referenceUsage: {
        label: "Reference Usage",
        description: "Control how strongly the output should follow the reference image.",
        options: {
          strict: "Strict Reference",
          balanced: "Balanced Reference",
          loose: "Loose Inspiration",
        },
      },
      transformationStrength: {
        label: "Transformation Strength",
        description: "Control how far the result can move away from the reference image.",
        options: {
          subtle: "Subtle",
          balanced: "Balanced",
          strong: "Strong",
          extreme: "Extreme",
        },
      },
      preserve: {
        title: "Preserve Options",
        description: "Choose which parts of the reference should remain recognizable.",
        options: {
          mainSubject: "Preserve main subject",
          identity: "Preserve person identity",
          pose: "Preserve pose",
          outfit: "Preserve outfit and visible accessories",
          composition: "Preserve composition",
          colors: "Preserve main color impression",
          materials: "Preserve materials and surface details",
          lighting: "Preserve lighting and mood",
        },
      },
    },
  },
  promptEditor: {
    emptyTitle: "No modules selected",
    emptyDescription: "Select at least one key module to start building your prompt.",
  },
  validation: {
    title: "Needs attention",
    level: {
      error: "Error",
      warning: "Warning",
    },
    noModulesSelected: "Select at least one key module from Prompt Setup.",
    customOverrideEmpty:
      "Custom mode is enabled for {module}, but the custom text is empty. Add custom text or turn Custom off.",
    textToImageMissingContext:
      "For Text to Image prompts, add at least an idea or a subject in Prompt Setup.",
    customSubjectEmpty:
      "Reference Subject Type is set to Custom, but Custom Subject is empty. Add a custom subject or choose another subject type.",
    ideaEmpty: "Add an idea to make the prompt more specific and easier to control.",
    unknown: "Something needs to be fixed before copying the output.",
  },
  guide: {
    title: "Module Guide",
    description: "Learn how each registered prompt module affects the final image prompt.",
    common: {
      fields: "Fields",
      overview: "Overview",
      whenToUse: "When to use",
      recommendedWorkflow: "Recommended workflow",
      fieldGuide: "Guide",
      tip: "Tip",
      options: "{d} options",
      categories: "{d} categories",
      override: "override",
      optional: "optional",
      placeholder: "Placeholder",
      backToModules: "Back to modules",
      customTextNote:
        "When this field is filled, it replaces the generated module output and all other fields in this module are ignored.",
      extraDetailsNote:
        "This field adds extra instructions without replacing the generated module output.",
    },
    modules: {
      style: {
        overview:
          "The Style module defines the overall artistic language of the image. It controls whether the output feels like a 3D render, illustration, painting, toy design, editorial artwork, photo-real studio image, or another visual direction.",
        whenToUse:
          "Use this module when you want to set the main visual identity of the image before adjusting details like texture, lighting, camera, pose, outfit, or background.",
        workflow:
          "Start with a Style Preset when you want a fast and coherent direction. Then refine the result with Medium, Stylization Level, Shape Language, Visual Treatment, and Finish. Use Extra Details for small additions, and Custom Override only when you want to write the full style instruction yourself.",
        fields: {
          preset: {
            guide:
              "The preset is the fastest way to define a complete style direction. It usually combines art medium, rendering mood, visual identity, and overall aesthetic into one choice.",
            tip: "Use a preset first while exploring. Then make the result more specific with medium, shape language, and finish.",
          },
          medium: {
            guide:
              "Medium defines the base production method of the image, such as 3D render, digital illustration, painting, photography, paper craft, printmaking, or sculpture.",
            tip: "Choose the medium before texture and finish, because many visual details should feel compatible with the selected medium.",
          },
          stylizationLevel: {
            guide:
              "Stylization Level controls how far the image should move away from realism. Lower values keep the result more natural, while stronger values allow more exaggeration and abstraction.",
            tip: "Use subtle or controlled for realistic prompts. Use strong, extreme, or abstract when you want a more creative transformation.",
          },
          shapeLanguage: {
            guide:
              "Shape Language defines the dominant form behavior of the subject and image. It can make the result feel soft, geometric, angular, blocky, fluid, elongated, or more structured.",
            tip: "This field is especially useful for character design, stylized portraits, toys, editorial artwork, and deformation-heavy prompts.",
          },
          visualTreatment: {
            guide:
              "Visual Treatment controls the rendering behavior on top of the medium. It describes how the image is visually processed, such as cel-shaded, flat graphic, halftone, hand-painted, textured, or minimalist.",
            tip: "Use this field to make the style more recognizable without changing the whole medium.",
          },
          finish: {
            guide:
              "Finish defines the final polish and surface impression of the image. It can make the result feel clean, premium, handcrafted, graphic, glossy, matte, or rough.",
            tip: "Use finish as the final visual refinement after choosing preset, medium, and visual treatment.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small style instructions that should be appended to the generated style output.",
            tip: "Use this for small additions like 'soft matte finish', 'editorial poster feeling', or 'more handcrafted surface variation'.",
          },
          customText: {
            guide:
              "Custom Override lets you replace the entire generated style output with your own complete style instruction.",
            tip: "Use this only when the generated combination is not enough and you want full manual control.",
          },
        },
      },
      hair: {
        overview:
          "The Hair module controls the subject's hairstyle, hair color, hair texture, and decorative hair styling. It helps keep hair direction separate from outfit, pose, expression, and overall style.",
        whenToUse:
          "Use this module when hair is visually important to the subject identity, character design, fashion direction, portrait readability, or transformation accuracy.",
        workflow:
          "Start with Hair Style to define the main silhouette. Then choose Hair Color and Hair Texture. Use Extra Details for accessories, hair decorations, special styling notes, or small refinements. Use Custom Override only when you want to write the full hair description manually.",
        fields: {
          hairStyle: {
            guide:
              "Hair Style defines the main hairstyle silhouette, length, structure, and recognizable styling direction. It can strongly affect the subject's identity and character design.",
            tip: "Choose this before color and texture. The hairstyle usually has the biggest impact on the subject's visual readability.",
          },
          hairColor: {
            guide:
              "Hair Color defines the dominant color of the subject's hair. It can be natural, stylized, fantasy-based, or matched to the overall color palette.",
            tip: "For realistic prompts, use natural colors. For stylized or fantasy prompts, use color to support the visual concept.",
          },
          hairTexture: {
            guide:
              "Hair Texture defines the physical behavior of the hair strands, such as straight, wavy, curly, coily, braided, layered, messy, or smooth.",
            tip: "Use texture to make the hairstyle feel more specific and believable.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small hair-related instructions without replacing the generated hair output.",
            tip: "Use this for details like ribbons, clips, wet hair, wind-swept strands, loose bangs, flyaway hair, or decorative styling.",
          },
          customText: {
            guide:
              "Custom Override lets you replace the entire generated hair output with your own complete hair instruction.",
            tip: "Use this when the hairstyle needs a very specific description that cannot be built from the available fields.",
          },
        },
      },
      deformation: {
        overview:
          "The Deformation module controls how the subject's body, face, proportions, volume, and structure are creatively transformed. It is useful for stylized portraits, character design, exaggerated transformations, surreal figures, toy-like forms, geometric reinterpretations, and image-to-image edits that need controlled distortion.",
        whenToUse:
          "Use this module when the subject should not stay fully realistic. It is especially useful when you want exaggeration, abstraction, cubist planes, block-based bodies, low-poly geometry, gravity-defying forms, grotesque humor, fashion caricature, or other visible structural changes.",
        workflow:
          "Start by choosing the deformation category, then select the specific deformation item. Use Extra Details to describe how strong, clean, chaotic, humorous, editorial, or surreal the deformation should feel. Use Custom Override only when you want to fully write the deformation instruction yourself.",
        fields: {
          category: {
            guide:
              "The category defines the general deformation family, such as geometric, surreal, caricature, block-based, low-poly, childlike, editorial, or material-driven transformation.",
            tip: "Choose the category first to keep the deformation direction coherent before selecting a more specific item.",
          },
          item: {
            guide:
              "The item defines the exact deformation behavior that will be applied to the subject, such as shifted planes, cuboid body parts, stretched forms, floating limbs, exaggerated proportions, or simplified toy-like anatomy.",
            tip: "Use this field to control the visible transformation. If the result becomes too chaotic, keep the item specific and reduce extra details.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small deformation instructions without replacing the generated deformation output.",
            tip: "Use this for strength, direction, body areas, symmetry, readability, or notes like 'keep the face recognizable' or 'avoid losing the subject silhouette'.",
          },
          customText: {
            guide:
              "Custom Override replaces the entire generated deformation output with your own manual deformation instruction.",
            tip: "Use this when the deformation idea is very specific or does not fit the available category and item options.",
          },
          deformationStyle: {
            guide:
              "Deformation Style defines the specific transformation behavior applied to the subject, such as exaggerated proportions, shifted geometric planes, cuboid forms, surreal anatomy, floating limbs, or stylized structural distortion.",
            tip: "Use this field to control how visibly the subject changes. Keep the deformation readable if preserving identity or subject clarity is important.",
          },
        },
      },
      framing: {
        overview:
          "The Framing module controls how the subject is placed inside the image. It defines shot size, crop, camera distance, angle, composition, balance, and how much of the body or environment should be visible.",
        whenToUse:
          "Use this module whenever composition matters. It is especially important for portraits, product-like characters, full-body transformations, editorial layouts, symmetrical compositions, and prompts that need a specific crop such as head-and-shoulders, bust shot, medium shot, or full body.",
        workflow:
          "Start by selecting the framing category, then choose the specific framing item. Use Extra Details to clarify crop, balance, negative space, subject position, or whether the composition should feel formal, dynamic, cinematic, centered, or editorial.",
        fields: {
          category: {
            guide:
              "The category defines the main framing family, such as portrait crop, body crop, camera angle, composition layout, or spatial balance.",
            tip: "Choose the category based on what matters most: how close the camera is, how much body is visible, or how the subject is arranged.",
          },
          item: {
            guide:
              "The item defines the exact framing instruction, such as close-up, head-and-shoulders, bust shot, full body, low angle, centered portrait, symmetrical layout, or off-center negative space.",
            tip: "This field is one of the best ways to prevent unwanted crops. Be specific when the final image must show a certain body range.",
          },
          extraDetails: {
            guide:
              "Extra Details adds composition instructions without replacing the generated framing output.",
            tip: "Use this for notes like 'keep the full head visible', 'leave space around the subject', 'balanced portrait frame', or 'avoid cutting off hands'.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated framing output with a fully manual framing instruction.",
            tip: "Use this when the composition needs very exact control, especially for image-to-image prompts or strict portrait crops.",
          },
          framingStyle: {
            guide:
              "Framing Style defines the exact crop, shot size, camera distance, composition, and subject placement inside the image.",
            tip: "Use this field to prevent unwanted cropping. Be specific when the image must show the head, shoulders, upper chest, full body, or a balanced portrait frame.",
          },
        },
      },
      expression: {
        overview:
          "The Expression module controls the subject's facial emotion, attitude, and readable mood. It helps separate facial performance from pose, style, lighting, and deformation.",
        whenToUse:
          "Use this module when the face should communicate a specific feeling, personality, reaction, or character attitude. It is useful for portraits, character sheets, fashion caricature, cinematic images, expressive stylization, and transformation prompts where the face must remain readable.",
        workflow:
          "Start by choosing the expression category, then select the specific expression item. Use Extra Details to control intensity, subtlety, eye behavior, mouth shape, emotional tone, or whether the expression should feel natural, theatrical, strange, calm, or exaggerated.",
        fields: {
          category: {
            guide:
              "The category defines the broad emotional family, such as calm, confident, playful, shocked, serious, intense, strange, or theatrical.",
            tip: "Choose the emotional direction before selecting the exact expression so the face stays consistent with the concept.",
          },
          item: {
            guide:
              "The item defines the exact facial performance, such as neutral calm, stern powerful, playful light, shocked exaggerated, gritted-teeth intensity, confident, alien unreadable, or mask-like expression.",
            tip: "Use subtle expressions for realistic portraits and stronger expressions for stylized, comedic, surreal, or character-driven prompts.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small facial performance notes without replacing the generated expression output.",
            tip: "Use this for details like eye contact, eyebrow tension, mouth shape, asymmetry, emotional restraint, or exaggerated theatrical energy.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated expression output with your own complete expression instruction.",
            tip: "Use this when the face needs a very specific emotional performance or mixed expression.",
          },
          expressionStyle: {
            guide:
              "Expression Style defines the subject's facial performance and emotional tone, such as calm, confident, playful, shocked, stern, strange, theatrical, mask-like, or exaggerated.",
            tip: "Use this field to make the face communicate a clear attitude. For realistic portraits, keep the expression controlled. For stylized prompts, stronger expressions can work better.",
          },
        },
      },
      pose: {
        overview:
          "The Pose module controls the subject's body position, gesture, posture, balance, and movement. It helps define whether the subject feels relaxed, formal, dynamic, powerful, symmetrical, twisted, seated, walking, or editorial.",
        whenToUse:
          "Use this module when body language matters. It is especially useful for full-body prompts, fashion poses, character design, dynamic action, editorial portraits, image-to-image transformations, and prompts where the subject's posture must stay readable.",
        workflow:
          "Start with the pose category, then choose the specific pose item. Use Extra Details to control gesture, weight distribution, hand position, motion, stiffness, elegance, balance, or how much the pose should deviate from the reference.",
        fields: {
          category: {
            guide:
              "The category defines the broad body-language family, such as casual, symmetrical, dynamic, seated, editorial, powerful, twisting, or motion-based posture.",
            tip: "Choose the category based on the energy you want the subject to communicate.",
          },
          item: {
            guide:
              "The item defines the exact pose behavior, such as casual weight shift, frontal symmetrical stance, contrapposto, dynamic asymmetry, editorial tilt, seated lean, twisting motion, or power pose.",
            tip: "For image-to-image prompts, keep the pose instruction compatible with the reference if identity and composition preservation are important.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small pose notes without replacing the generated pose output.",
            tip: "Use this for hand placement, shoulder angle, posture stiffness, movement direction, balance, or notes like 'keep the pose readable'.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated pose output with a complete manual pose instruction.",
            tip: "Use this when the subject needs a very specific physical position or gesture.",
          },
          poseStyle: {
            guide:
              "Pose Style defines the subject's body posture, gesture, balance, movement, stance, and overall body language.",
            tip: "Use this field to control the subject's physical energy. Keep the pose compatible with the framing, especially in portraits and image-to-image prompts.",
          },
        },
      },
      outfit: {
        overview:
          "The Outfit module controls clothing, costume, uniform, fashion direction, and wearable styling. It keeps wardrobe decisions separate from pose, hair, texture, and overall image style.",
        whenToUse:
          "Use this module when clothing affects the subject's identity, character role, era, mood, profession, fashion category, or visual theme. It is useful for portraits, character design, fashion prompts, costumes, uniforms, and themed transformations.",
        workflow:
          "Start by choosing the outfit category, then select the specific outfit item. Use Extra Details for fabric notes, accessories, layering, fit, cultural styling, era, color, or small wardrobe refinements. Use Custom Override for fully manual outfit descriptions.",
        fields: {
          category: {
            guide:
              "The category defines the broad wardrobe family, such as casual, formal, sporty, streetwear, vintage, uniform, ethnic, costume, masculine, feminine, or themed clothing.",
            tip: "Choose the category based on the subject role and visual story before selecting the exact outfit.",
          },
          item: {
            guide:
              "The item defines the exact clothing direction, such as hoodie, denim jacket, business suit, school uniform, gown, princess costume, superhero outfit, medieval armor, or sci-fi clothing.",
            tip: "Use the item to make the wardrobe specific enough for the model to understand the subject's role.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small clothing instructions without replacing the generated outfit output.",
            tip: "Use this for accessories, fit, fabric, layering, color accents, footwear, jewelry, or weather-based clothing notes.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated outfit output with your own complete outfit instruction.",
            tip: "Use this when the wardrobe needs very specific styling that cannot be built from the available options.",
          },
          outfitStyle: {
            guide:
              "Outfit Style defines the subject's clothing direction, costume, uniform, fashion category, wardrobe identity, and wearable visual story.",
            tip: "Use this field when clothing affects the role, era, personality, or theme of the subject.",
          },
        },
      },
      background: {
        overview:
          "The Background module controls the environment, backdrop, atmosphere, surrounding space, and visual context behind the subject. It helps define whether the image feels like a clean studio portrait, natural outdoor scene, abstract poster, editorial setup, interior space, or atmospheric world.",
        whenToUse:
          "Use this module when the subject needs a clear setting or when the background should support the story, mood, color palette, lighting, or composition. It is especially useful for portraits, character images, product-like renders, editorial posters, and cinematic scenes.",
        workflow:
          "Start with the background category, then select the specific background item. Use Extra Details to control depth, simplicity, atmosphere, pattern, texture, environmental props, or how much attention the background should receive.",
        fields: {
          category: {
            guide:
              "The category defines the broad background family, such as clean studio, gradient, natural environment, interior, abstract pattern, night sky, paper texture, or cinematic atmosphere.",
            tip: "Choose a simple category when the subject should be the main focus. Choose a richer category when the environment is part of the concept.",
          },
          item: {
            guide:
              "The item defines the exact background treatment, such as seamless studio backdrop, soft neutral background, gradient ambient field, ocean horizon, modern studio interior, repeating pattern, textured paper, or night sky.",
            tip: "Keep the background compatible with framing and lighting so the final image feels intentional.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small background instructions without replacing the generated background output.",
            tip: "Use this for depth, blur, props, color mood, simplicity, texture, scale, atmosphere, or notes like 'do not distract from the subject'.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated background output with a complete manual background instruction.",
            tip: "Use this when the environment has a very specific scene, location, or art direction.",
          },
          backgroundStyle: {
            guide:
              "Background Style defines the specific visual treatment of the environment behind the subject, such as a clean studio backdrop, gradient field, textured paper, natural scene, interior space, abstract pattern, or atmospheric setting.",
            tip: "Use this field to control the background direction without overloading the prompt. Keep it simple when the subject should remain the main focus.",
          },
        },
      },
      lighting: {
        overview:
          "The Lighting module controls illumination, shadow behavior, mood, contrast, glow, direction, and visual drama. It strongly affects realism, atmosphere, material readability, and the emotional tone of the image.",
        whenToUse:
          "Use this module when the image needs a specific mood or professional lighting setup. It is useful for studio portraits, cinematic scenes, product-like renders, dramatic transformations, soft editorial images, neon looks, and images where shape or texture must be clearly readable.",
        workflow:
          "Start by choosing the lighting category, then select the specific lighting item. Use Extra Details to clarify direction, softness, contrast, color temperature, rim light, volumetric effects, shadow intensity, or whether the lighting should feel natural, cinematic, or graphic.",
        fields: {
          category: {
            guide:
              "The category defines the broad lighting family, such as natural light, studio light, cinematic light, high-key, low-key, rim light, neon, volumetric, or dramatic spotlight.",
            tip: "Choose the category based on mood first, then refine the exact light behavior with the item.",
          },
          item: {
            guide:
              "The item defines the exact lighting setup, such as soft diffused light, window light, beauty dish, three-point lighting, backlit silhouette, teal-orange cinematic light, neon edge light, or volumetric beams.",
            tip: "Lighting should support the material and style. For example, glossy surfaces need different light behavior than matte or paper-like surfaces.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small lighting instructions without replacing the generated lighting output.",
            tip: "Use this for shadow softness, highlight placement, light direction, color temperature, glow intensity, or atmosphere.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated lighting output with your own complete lighting instruction.",
            tip: "Use this when you need a very specific lighting setup or cinematic mood.",
          },
          lightingStyle: {
            guide:
              "Lighting Style defines the main illumination setup, including softness, contrast, direction, mood, shadow behavior, glow, rim light, studio lighting, natural lighting, or cinematic lighting.",
            tip: "Use this field to shape the emotional mood and material readability of the image. Lighting should support the selected style and texture.",
          },
        },
      },
      camera: {
        overview:
          "The Camera module controls camera type, lens behavior, optical perspective, depth of field, and photographic capture language. It helps make the image feel like a specific camera setup rather than only a visual style.",
        whenToUse:
          "Use this module when perspective, lens compression, field of view, blur, realism, or photographic feeling matters. It is useful for portraits, product renders, cinematic scenes, macro shots, wide-angle distortion, film looks, and professional studio-style prompts.",
        workflow:
          "Start by choosing the camera category, then select the specific camera or lens item. Use Extra Details to describe depth of field, focus behavior, focal length feeling, film grain, sensor style, or whether the image should feel photographic, cinematic, macro, distorted, or clean.",
        fields: {
          category: {
            guide:
              "The category defines the broad camera or lens family, such as portrait lens, wide-angle, macro, fisheye, tilt-shift, DSLR, mirrorless, film camera, or vintage photographic look.",
            tip: "Choose the category based on perspective and capture feeling, not only image quality.",
          },
          item: {
            guide:
              "The item defines the exact camera or lens behavior, such as 50mm lens, 85mm portrait lens, macro lens, fisheye, 35mm film look, shallow depth of field, or disposable camera style.",
            tip: "Use longer portrait lenses for flattering compression. Use wide-angle or fisheye when you intentionally want distortion or a more dynamic perspective.",
          },
          extraDetails: {
            guide:
              "Extra Details adds camera-specific notes without replacing the generated camera output.",
            tip: "Use this for focus, depth of field, bokeh, film grain, lens distortion, sharpness, sensor feel, or camera distance.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated camera output with a complete manual camera instruction.",
            tip: "Use this when the camera setup must be described with exact photographic language.",
          },
          cameraStyle: {
            guide:
              "Camera Style defines the photographic or optical behavior of the image, including lens type, capture style, perspective, depth of field, and camera-like visual language.",
            tip: "Use this field when lens perspective matters. Portrait lenses create cleaner subject focus, while wide-angle, macro, fisheye, or film styles create more specific visual character.",
          },
        },
      },
      colorPalette: {
        overview:
          "The Color Palette module controls the dominant color system, harmony, temperature, contrast, and how colors are assigned across the subject, background, clothing, lighting, and visual accents.",
        whenToUse:
          "Use this module when the image needs a controlled color identity. It is especially useful for editorial images, brand-like visuals, stylized portraits, toy designs, fashion prompts, posters, cinematic moods, and any prompt where random color choices should be avoided.",
        workflow:
          "Start by selecting the main palette direction or harmony. Then refine the palette behavior with assignments, temperature, contrast, or extra color notes if those fields are available. Use Extra Details to describe accent colors, background color behavior, or color restrictions.",
        fields: {
          colorPalette: {
            guide:
              "Color Palette defines the overall color identity of the image, such as monochrome, pastel, earthy, vibrant, muted, cinematic, complementary, analogous, or other palette systems.",
            tip: "Use this field to keep the image visually unified before adjusting background, outfit, lighting, or texture.",
          },
          palette: {
            guide:
              "Palette defines the overall color identity of the image, such as monochrome, pastel, earthy, vibrant, muted, cinematic, complementary, analogous, or other palette systems.",
            tip: "Use this field to keep the image visually unified before adjusting background, outfit, lighting, or texture.",
          },
          assignment: {
            guide:
              "Assignment controls how the selected colors should be distributed across the image, such as subject, clothing, background, highlights, shadows, or accent areas.",
            tip: "Use assignments when the color palette is good but the model needs clearer instructions about where each color should appear.",
          },
          colorPaletteAssignment: {
            guide:
              "Color Palette Assignment controls how the selected colors should be distributed across the image, such as subject, clothing, background, highlights, shadows, or accent areas.",
            tip: "Use assignments when the color palette is good but the model needs clearer instructions about where each color should appear.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small color instructions without replacing the generated color palette output.",
            tip: "Use this for accent colors, avoid colors, background color notes, contrast level, saturation level, or palette restrictions.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated color palette output with your own complete color instruction.",
            tip: "Use this when you want exact manual control over the image colors.",
          },
          paletteAssignments: {
            guide:
              "Palette Assignments define how the selected colors should be distributed across the image, such as subject, clothing, background, shadows, highlights, or accent areas.",
            tip: "Use this field when the palette is correct but the model needs clearer instructions about where each color should appear.",
          },
        },
      },
      effects: {
        overview:
          "The Effects module controls additional visual effects, overlays, atmospheric treatments, graphic enhancements, glow, particles, distortion, motion, lens artifacts, and other finishing effects that sit on top of the main image.",
        whenToUse:
          "Use this module when the image needs extra atmosphere, motion, magic, energy, editorial impact, cinematic polish, or graphic treatment. It should support the image rather than replace the core style, lighting, or background.",
        workflow:
          "Start by choosing the effects category, then select the specific effect item. Use Extra Details to control intensity, placement, subtlety, direction, scale, opacity, or whether the effect should feel realistic, graphic, magical, cinematic, or experimental.",
        fields: {
          category: {
            guide:
              "The category defines the broad effects family, such as atmosphere, particles, glow, motion, distortion, lens effects, graphic overlays, texture overlays, or magical energy.",
            tip: "Choose the category based on what the effect should add to the image: mood, movement, polish, abstraction, or visual drama.",
          },
          item: {
            guide:
              "The item defines the exact effect behavior, such as dust particles, bloom glow, chromatic aberration, halftone overlay, motion blur, smoke, sparkles, light leaks, or abstract energy.",
            tip: "Keep effects controlled. Too many strong effects can reduce subject readability.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small effect instructions without replacing the generated effects output.",
            tip: "Use this for intensity, position, opacity, color, direction, scale, or notes like 'subtle only' and 'do not cover the face'.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated effects output with a complete manual effects instruction.",
            tip: "Use this when the effect needs a very specific visual behavior.",
          },
          effectIntensity: {
            guide:
              "Effect Intensity controls how strong or subtle the selected visual effect should appear in the final image.",
            tip: "Use subtle intensity for polished or realistic outputs. Use stronger intensity only when the effect is meant to become a major part of the visual identity.",
          },
          effectStyle: {
            guide:
              "Effect Style defines the type of additional visual effect applied on top of the main image, such as glow, particles, smoke, motion, distortion, overlays, lens artifacts, or atmospheric enhancements.",
            tip: "Use effects to support the image mood, not to replace the core style, lighting, or background.",
          },
        },
      },
      texture: {
        overview:
          "The Texture module controls material, surface quality, detail level, imperfections, and tactile visual behavior. It helps the image feel like vinyl, clay, metal, wood, fabric, paper, ceramic, glass, rubber, stone, or another physical material.",
        whenToUse:
          "Use this module when the surface of the subject or object matters. It is especially useful for toy designs, 3D renders, sculptures, clay characters, product-like visuals, handmade styles, material studies, and prompts where tactile detail should be visible.",
        workflow:
          "Start by choosing the base material. Then refine it with surface, detail level, and imperfections. Use Extra Details to clarify where the texture should appear, how strong it should be, and whether it should feel clean, handmade, aged, polished, rough, or worn.",
        fields: {
          material: {
            guide:
              "Material defines the physical substance of the subject or object, such as vinyl, clay, ceramic, metal, wood, stone, glass, fabric, leather, paper, rubber, or organic material.",
            tip: "Choose material before surface and imperfections, because the other texture settings should feel compatible with the material.",
          },
          surface: {
            guide:
              "Surface defines the outer tactile quality of the material, such as smooth, matte, glossy, satin, rough, porous, brushed, hammered, frosted, polished, cracked, wrinkled, or creased.",
            tip: "Surface has a strong effect on how light interacts with the object. Match it with your lighting and style choices.",
          },
          detailLevel: {
            guide:
              "Detail Level controls how visible and intense the texture information should be, from subtle surface behavior to heavy tactile detail.",
            tip: "Use subtle detail for clean premium renders. Use stronger detail for handmade, aged, rough, or expressive material treatments.",
          },
          imperfections: {
            guide:
              "Imperfections add realistic or handcrafted irregularities such as brush marks, chips, patina, scratches, peeling, oxidation, cracks, or small handmade flaws.",
            tip: "Imperfections make materials feel more believable, but too many can make the image look dirty or visually noisy.",
          },
          extraDetails: {
            guide:
              "Extra Details adds small texture instructions without replacing the generated texture output.",
            tip: "Use this for notes like 'only on clothing', 'visible on the face', 'soft matte finish', 'subtle handmade variation', or 'avoid reflective surfaces'.",
          },
          customText: {
            guide:
              "Custom Override replaces the generated texture output with your own complete texture instruction.",
            tip: "Use this when the material and surface behavior need a very specific manual description.",
          },
        },
      },
    },
  },
}
