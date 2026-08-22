export default {
  app: {
    title: "Prompt Draft",
    navigation: {
      create: "Create",
      collage: "Collage",
      guide: "Guides",
      vectorizer: "Vectorizer",
      prompts: "Prompts",
    },
    switchTheme: "Switch Theme",
    switchLang: "Switch Language",
    tools: {
      menu: "More tools",
      convert: "Convert",
      about: "About",
    },
    loading: "Loading application",
  },
  pwa: {
    offline: {
      prompt: {
        title: "Use Prompt Draft offline",
        updateTitle: "Update offline version",
        subtitle: "Offline package",
        description:
          "Download all required app files ({size}) so Prompt Draft can work without an internet connection.",
        updateDescription:
          "A new offline version is available ({size}). Download it to keep offline mode up to date.",
        backgroundHint:
          "The download runs in the background, and you can keep using the app while it finishes.",
        action: "Download for offline use",
        updateAction: "Update offline version",
        later: "Not now",
      },
      status: {
        downloading: "Offline download · {progress}%",
        offlineMode: "You are using offline mode.",
        ready: "Ready for offline use",
        failed: "Offline download failed",
        failedDescription:
          "Some files could not be downloaded. Check your connection and try again.",
        retry: "Try again",
      },
    },
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
      panel: {
        toggle: "Toggle Panel",
        close: "Close",
        dock: "Dock Panel",
      },
      pip: {
        select: "Select PIP",
        replace: "Replace PIP",
        remove: "Remove PIP",
        selected: "PIP: {name}",
        description: "Small image overlay for this cell",
        position: "PIP position",
        size: "PIP size",
        positions: {
          topLeft: "Top left",
          topCenter: "Top center",
          topRight: "Top right",
          centerLeft: "Center left",
          centerRight: "Center right",
          bottomLeft: "Bottom left",
          bottomCenter: "Bottom center",
          bottomRight: "Bottom right",
        },
        sizes: {
          small: "Small",
          medium: "Medium",
          large: "Large",
        },
      },
      imageFit: {
        mode: "Image display mode",
        cover: "Cover",
        detail: "Detail",
        resetPosition: "Reset position",
      },
      title: "Collage Builder",
      description: "Select, paste, or drag images and export the final result from the canvas.",
      rotateYourPhone: "Rotate Your Phone",
      dropzone: {
        title: "Add image",
        description: "Click / Paste / Drag & Drop",
      },
      images: {
        title: "Images",
        empty: "No images have been added yet.",
      },
      brand: {
        mode: "Brand mode",
        modes: {
          overlay: "Overlay",
          footer: "Footer",
        },
        footerAlign: "Footer alignment",
        footerPadding: "Footer padding: {value}px",
        footerAligns: {
          left: "Left",
          center: "Center",
          right: "Right",
        },
        panelTitle: "Brand",
        groups: {
          mode: "Mode and placement",
          text: "Text",
          logo: "Logo and QR",
        },
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
        exportQuality: "Export Quality",
        decorationsEnabled: "Padding & Borders",
        cellRadius: "Cell corner radius: {value}px",
        outputSize: "Output size",
        outputSizes: {
          small: "Small",
          medium: "Medium",
          large: "Large",
        },
      },
      preview: {
        grid: "Grid: {columns}×{rows}",
        rendering: "Rendering...",
        videoMeta: "{title} · {width}×{height} · {duration} · {fps}fps · {repeat}×{loop}",
        loopSuffix: " · loop",
        recordingVideo: "Recording video...",
        selectedCell: "{name}",
      },
      actions: {
        save: "Save",
        copy: "Copy",
        clear: "Clear",
        remove: "Remove",
        recording: "Recording...",
        exportWebm: "Export WebM",
        exportingMp4: "Exporting MP4...",
        exportMp4: "Export MP4",
        replaceImage: "Replace image",
        removeImage: "Remove image",
        refreshPage: "Refresh page",
      },
      emptyCanvas: {
        title: "Add images to start",
        description: "Drag and drop images here, paste from clipboard, or choose files below.",
        pasteHint: "You can paste copied images directly with Ctrl/⌘ + V.",
        action: "Add images",
      },
      outputMode: {
        title: "Output Mode",
        mode: "Mode",
        modes: {
          image: "Image Collage",
          video: "Video Slider",
        },
      },
      textOverlay: {
        enabled: "Text overlay",
        font: "Text font",
        text: "Overlay text",
        placeholder: "e.g. Turn the Photo into a watercolor painting style",
        size: "Text size",
        color: "Text color",
        gap: "Text / brand gap",
      },
      safeArea: {
        title: "Safe area",
      },
      video: {
        title: "Video Slider",
        quality: "MP4 Quality",
        qualityPresets: {
          compact: "Compact — smaller file",
          balanced: "Balanced — recommended",
          high: "High — larger file",
        },
        backgroundMusic: "Background Music",
        removeAudio: "Remove audio",
        preset: "Preset",
        presets: {
          storyReel: "Story / Reel — 1080×1920",
          portraitPost: "Portrait Post — 1080×1350",
          squarePost: "Square Post — 1080×1080",
          landscape: "Landscape — 1920×1080",
        },
        width: "Width",
        height: "Height",
        calculatedDuration: "Calculated Duration",
        durationMeta: "{slides} slide views · {transitions} transitions",
        loop: "Loop",
        repeat: "Repeat: {value}×",
        fps: "FPS: {value}",
        imageInterval: "Image Interval: {value}ms",
        transition: "Transition: {value}ms",
        edgeBlur: "Edge Blur: {value}",
        randomOrder: "Random order",
        musicVisualizationSoftWave: "Enable soft wave music visualization",
        musicVisualizationHeight: "Soft wave height: {value}%",
        randomOrderDisabled:
          "Random order is disabled for loop/repeat so the sequence can stay seamless.",
      },
      zoom: {
        fit: "Fit",
        actual: "Actual",
        panTool: "Pan tool",
      },
      layoutTools: {
        aspectRatioOrientations: {
          vertical: "Vertical",
          horizontal: "Horizontal",
        },
        title: "Layout Tools",
        shuffleSimilar: "Shuffle Similar Images",
        shuffleLayout: "Shuffle Layout",
        constraintMode: "Constraint Mode",
        constraintModes: {
          controlled: "Controlled",
          free: "Free",
        },
        canvasRatio: "Canvas Ratio",
        canvasRatios: {
          auto: "Auto",
        },
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
            cgi: "CGI",
            digital_painting: "Digital Painting",
            game_asset_render: "Game Asset Render",
            low_poly_render: "Low Poly Render",
            pixel_art_digital: "Pixel Art Digital",
            vector_illustration: "Vector Illustration",
            acrylic_painting: "Acrylic Painting",
            ceramic_sculpture: "Ceramic Sculpture",
            charcoal_drawing: "Charcoal Drawing",
            cinematic_photo: "Cinematic Photo",
            clay_sculpture: "Clay Sculpture",
            collectible_figure: "Collectible Figure",
            colored_pencil_drawing: "Colored Pencil Drawing",
            etching_print: "Etching Print",
            fabric_doll: "Fabric Doll",
            felt_craft: "Felt Craft",
            gouache_painting: "Gouache Painting",
            handmade_model: "Handmade Model",
            ink_and_wash: "Ink and Wash",
            ink_drawing: "Ink Drawing",
            linocut_print: "Linocut Print",
            macro_photography: "Macro Photography",
            marker_render: "Marker Render",
            mixed_media_collage: "Mixed Media Collage",
            oil_painting: "Oil Painting",
            origami_art: "Origami Art",
            outdoor_photography: "Outdoor Photography",
            paper_collage: "Paper Collage",
            paper_craft: "Paper Craft",
            paper_cutout: "Paper Cutout",
            paper_mache_sculpture: "Paper Mache Sculpture",
            pastel_drawing: "Pastel Drawing",
            pen_and_ink: "Pen and Ink",
            pencil_drawing: "Pencil Drawing",
            photography: "Photography",
            photomontage: "Photomontage",
            plasticine_sculpture: "Plasticine Sculpture",
            plush_toy: "Plush Toy",
            risograph_print: "Risograph Print",
            screen_print: "Screen Print",
            stitched_textile_art: "Stitched Textile Art",
            studio_photography: "Studio Photography",
            vinyl_toy_model: "Vinyl Toy Model",
            watercolor_painting: "Watercolor Painting",
            woodcut_print: "Woodcut Print",
            woodblock_print: "Woodblock Print",
            clay_modeling: "Clay Modeling",
            ceramic_art: "Ceramic Art",
            plasticine_modeling: "Plasticine Modeling",
            papier_mache_craft: "Papier-Mâché Craft",
            textile_craft: "Textile Craft",
            plush_textile_craft: "Plush Textile Craft",
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
            irregular: "Irregular / Asymmetric",
            faceted: "Faceted / Planar",
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
            halftone_comic: "Halftone",
            hand_painted: "Hand Painted",
            ink_watercolor: "Ink + Watercolor",
            minimalist: "Minimalist",
            paper_cutout: "Layered Cut Paper",
            textured: "Textured",
            painterly: "Painterly",
            layered_collage: "Layered Collage",
            soft_blended: "Soft Blended",
            stippled: "Stippled",
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
            refined: "Refined",
            satin: "Satin",
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
        aesthetic: {
          label: "Aesthetic",
          description:
            "Choose the core visual aesthetic without defining the subject or output purpose.",
          placeholder: "Select an aesthetic",
          options: {
            "3d_cartoon": "3D Cartoon",
            anime: "Anime",
            cinematic_realism: "Cinematic Realism",
            claymation: "Claymation",
            vinyl_toy: "Vinyl Toy",
            geometric_illustration: "Geometric Illustration",
            cut_paper: "Cut Paper",
            retro_comic: "Retro Comic",
            caricature_sketch: "Caricature Sketch",
            angular_animation: "Angular 2D Animation",
            childlike_drawing: "Childlike Drawing",
            low_poly: "Low-Poly",
            watercolor_illustration: "Watercolor Illustration",
            paper_collage: "Paper Collage",
            pixel_art: "Pixel Art",
            risograph: "Risograph",
            ink_sketch: "Ink Sketch",
            cinematic_cgi: "Cinematic CGI",
            photo_realism: "Photo Realism",
            papier_mache: "Papier-Mâché",
            plush_textile: "Plush Textile",
            woodcut: "Woodcut",
            marker_illustration: "Marker Illustration",
            art_deco: "Art Deco",
            art_nouveau: "Art Nouveau",
            bauhaus: "Bauhaus",
            swiss_international: "Swiss International Style",
            mid_century_modern: "Mid-Century Modern",
            constructivist: "Constructivist",
            memphis: "Memphis Design",
            retro_futurist: "Retro-Futurist",
            brutalist_graphic: "Brutalist Graphic",
            minimal_geometric: "Minimal Geometric",
            pop_art: "Pop Art",
            op_art: "Op Art",
            psychedelic: "Psychedelic",
            surrealist: "Surrealist",
            cubist: "Cubist",
            expressionist: "Expressionist",
            impressionist: "Impressionist",
            fauvist: "Fauvist",
            pointillist: "Pointillist",
            ukiyo_e: "Ukiyo-e",
            folk_art: "Folk Art",
            storybook: "Storybook Illustration",
            gothic_illustration: "Gothic Illustration",
            vintage_scientific: "Vintage Scientific Illustration",
            screenprint_graphic: "Screen-Print Graphic",
            linocut: "Linocut",
            etching: "Etching",
          },
        },
        linework: {
          label: "Linework",
          description:
            "Control the visual character of drawn or defined lines without changing the subject.",
          placeholder: "Select linework",
          options: {
            clean_fine: "Clean Fine",
            clean_contour: "Clean Contour",
            bold_contour: "Bold Contour",
            expressive_ink: "Expressive Ink",
            loose_sketch: "Loose Sketch",
            calligraphic: "Calligraphic",
            technical: "Technical",
            engraved_hatch: "Engraved Hatch",
            relief_cut: "Relief-Cut",
          },
        },
        detailLevel: {
          label: "Detail Level",
          description:
            "Control visual detail density independently from the aesthetic, medium, and composition.",
          placeholder: "Select detail level",
          options: {
            minimal: "Minimal",
            simplified: "Simplified",
            balanced: "Balanced",
            intricate: "Intricate",
            dense: "Dense",
          },
        },
      },
      presets: {
        soft_3d_cartoon: {
          label: "Soft 3D Cartoon",
          description: "3D cartoon styling with cel-shaded rendering.",
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
          description: "Paper collage with layered fragments and a handcrafted finish.",
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
        premium_vinyl: {
          label: "Premium Vinyl",
          description: "Vinyl-toy aesthetic rendered in 3D with a refined finish.",
        },
        handmade_clay: {
          label: "Handmade Clay",
          description: "Claymation aesthetic using hand-modeled clay with a handcrafted finish.",
        },
        cinematic_realism: {
          label: "Cinematic Realism",
          description: "Cinematic realism anchored in photographic rendering.",
        },
        geometric_flat: {
          label: "Geometric Flat Illustration",
          description: "Geometric vector illustration with flat graphic rendering.",
        },
        retro_comic_pop: {
          label: "Retro Comic Pop",
          description: "Retro comic illustration with bold contours and halftone treatment.",
        },
        expressive_caricature_ink: {
          label: "Expressive Caricature Ink",
          description: "Caricature sketch aesthetic with expressive ink linework.",
        },
        primitive_cut_paper: {
          label: "Primitive Cut Paper",
          description:
            "Layered cut-paper construction with simplified geometric forms and handcrafted finish.",
        },
        angular_2d: {
          label: "Angular 2D Animation",
          description: "Angular 2D styling with flat graphic rendering.",
        },
        naive_childlike: {
          label: "Naive Childlike",
          description: "Childlike colored-pencil drawing with loose lines and simplified detail.",
        },
        watercolor_ink: {
          label: "Watercolor & Ink",
          description: "Watercolor illustration with expressive variable-width ink linework.",
        },
        low_poly: {
          label: "Low-Poly",
          description:
            "Low-poly aesthetic using low-poly 3D rendering without forcing a form language.",
        },
        pixel_art: {
          label: "Pixel Art",
          description:
            "Pixel-art aesthetic using digital pixel-art rendering without forced detail or form assumptions.",
        },
        risograph_graphic: {
          label: "Risograph Graphic",
          description: "Risograph aesthetic using risograph print as the production medium.",
        },
        expressive_ink_sketch: {
          label: "Expressive Ink Sketch",
          description: "Ink-sketch aesthetic with loose sketch linework.",
        },
        cinematic_cgi: {
          label: "Cinematic CGI",
          description:
            "Cinematic CGI aesthetic using CGI rendering without forced form or finish choices.",
        },
        photo_realism: {
          label: "Photo Realism",
          description:
            "Photorealistic aesthetic using photography with no automatic stylization, form, or finish assumptions.",
        },
        papier_mache: {
          label: "Papier-Mâché",
          description: "Papier-mâché aesthetic using papier-mâché craft with a handcrafted finish.",
        },
        plush_textile: {
          label: "Plush Textile",
          description:
            "Plush textile aesthetic using plush textile craft with a handcrafted finish.",
        },
        woodcut_graphic: {
          label: "Woodcut Graphic",
          description: "Woodcut aesthetic using woodcut printing and bold relief-cut linework.",
        },
        marker_illustration: {
          label: "Marker Illustration",
          description:
            "Marker illustration aesthetic using marker rendering without extra structural assumptions.",
        },
        art_deco_graphic: {
          label: "Art Deco Graphic",
          description:
            "Art Deco aesthetic rendered as vector illustration without forcing a form language.",
        },
        bauhaus_graphic: {
          label: "Bauhaus Graphic",
          description: "Bauhaus vector styling with flat graphic rendering.",
        },
        mid_century_graphic: {
          label: "Mid-Century Graphic",
          description: "Mid-century modern illustration with flat graphic rendering.",
        },
        storybook_watercolor: {
          label: "Storybook Watercolor",
          description:
            "Storybook illustration aesthetic rendered in watercolor without forced form assumptions.",
        },
        ukiyo_e_print: {
          label: "Ukiyo-e Print",
          description: "Ukiyo-e aesthetic using woodblock printing with clean contour linework.",
        },
        handmade_cut_paper: {
          label: "Handmade Cut Paper",
          description:
            "Cut-paper aesthetic using paper cutout construction and a handcrafted finish.",
        },
      },
      ui: {
        legacy: {
          presetsHint: "Choose a base style quickly",
          customOutput: {
            label: "Custom Style Output",
            hint: "Overrides all selected fields when filled",
            placeholder: "Write a complete custom style phrase...",
            activeNotice: "Custom override is active. Form options are ignored in compiled output.",
          },
          advancedOptions: "Advanced Options",
          compiledTitle: "Compiled Style",
          empty: "No style selected yet.",
        },
      },
    },
    texture: {
      title: "Texture / Material",
      description: "Define material and surface properties, then assign them to semantic targets.",
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
        finish_semi_gloss:
          "Semi-gloss is unusual for the selected material, but the choice is preserved.",
        finish_glossy:
          "A glossy finish is unusual for the selected material, but the choice is preserved.",
        finish_high_gloss:
          "A high-gloss finish is unusual for the selected material, but the choice is preserved.",
        finish_mirror:
          "A mirror-like polished finish is unusual for the selected material, but the choice is preserved.",
        surface_hammered:
          "A hammered texture is unusual for the selected material, but the choice is preserved.",
        surface_ridged:
          "A ridged texture is unusual for the selected material, but the choice is preserved.",
        surface_brush_marks:
          "Visible brush marks are unusual for the selected material, but the choice is preserved.",
        surface_coarse:
          "A coarse texture is unusual for the selected material, but the choice is preserved.",
        optical_opaque:
          "Opaque behavior is unusual for the selected material, but the choice is preserved.",
        optical_translucent:
          "Translucent behavior is unusual for the selected material, but the choice is preserved.",
        optical_transparent:
          "Transparent behavior is unusual for the selected material, but the choice is preserved.",
        optical_frosted:
          "Frosted light-passing behavior is unusual for the selected material, but the choice is preserved.",
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
          description:
            "Add material or surface instructions that do not fit the structured controls.",
          placeholder: "Add optional material or surface details...",
        },
        customText: {
          label: "Custom Override",
          description:
            "Replace structured material assignments with your own texture/material instruction.",
          placeholder: "Describe the material and surface behavior...",
        },
        materialAssignments: {
          label: "Material Assignments",
          description:
            "Build reusable material and surface specifications and assign each one to the scene entities it should affect.",
          assignmentTitle: "Material Assignment {index}",
          summary: {
            noMaterial: "No material properties",
          },
          actions: {
            add: "Add Material / Texture",
            remove: "Remove",
          },
          preset: {
            label: "Material Preset",
          },
          material: {
            label: "Material",
          },
          finish: {
            label: "Finish",
            options: {
              matte: "Matte",
              satin: "Satin",
              semi_gloss: "Semi-gloss",
              glossy: "Glossy",
              high_gloss: "High Gloss",
              mirror: "Mirror-like / Polished",
            },
          },
          surfaceTexture: {
            label: "Surface Texture",
            options: {
              smooth: "Smooth",
              brushed: "Brushed",
              rough: "Rough",
              porous: "Porous",
              grainy: "Fine Grain",
              fibrous: "Fibrous",
              woven: "Woven",
              hammered: "Hammered",
              ridged: "Ridged",
              brush_marks: "Brush Marks",
              coarse: "Coarse",
            },
          },
          opticalCharacter: {
            label: "Optical Character",
            options: {
              opaque: "Opaque",
              translucent: "Translucent",
              transparent: "Transparent",
              frosted: "Frosted / Diffused",
            },
          },
          textureProminence: {
            label: "Texture Prominence",
            options: {
              subtle: "Subtle",
              visible: "Visible",
              pronounced: "Pronounced",
            },
          },
          conditions: {
            label: "Condition / Imperfections",
            placeholder: "Select surface conditions",
            options: {
              clean: "Clean",
              handmade: "Handmade Irregularities",
              scratches: "Scratches",
              cracks: "Cracks",
              dents: "Dents / Bumps",
              chips: "Chipped Areas",
              dust: "Dust / Dirt",
              weathered: "Weathered",
              stains: "Stains",
              fading: "Fading",
              wrinkles: "Wrinkles / Creases",
              peeling: "Peeling / Flaking",
              corrosion: "Corrosion / Oxidation",
            },
          },
          targets: {
            label: "Apply To",
            placeholder: "Select material targets",
            groups: {
              general: "General",
              typographyGroups: "Typography Groups",
              typographyTexts: "Typography Texts",
              userVariables: "User Subject / Object Variables",
              missing: "Missing References",
            },
            builtin: {
              all_surfaces: "All Scene Surfaces",
              background: "Background Surface",
              subject: "Main Subject",
              outfit: "Outfit",
              hair: "Hair",
              typography: "Typography",
              accents: "Accent Elements",
            },
            typographyGroupFallback: "Text Group",
            typographyTextFallback: "Text",
            customLabel: "Custom Targets",
            customPlaceholder: "Example: dragon costume scales",
            addCustom: "Add custom target",
            missing: "Missing",
            missingHelp:
              "Some referenced targets no longer exist. They remain preserved until you remove them.",
          },
          warnings: {
            unusualCombination:
              "This property is unusual for the selected material, but it is kept as an intentional creative choice.",
          },
        },
      },
      presets: {
        smooth_vinyl: {
          label: "Smooth Vinyl",
          description: "Clean satin vinyl with a smooth, subtle surface.",
        },
        handmade_clay: {
          label: "Handmade Clay",
          description: "Matte porous clay with visible handmade irregularities.",
        },
        polished_metal: {
          label: "Polished Metal",
          description: "Clean high-gloss metal with a smooth surface.",
        },
        painterly_surface: {
          label: "Painterly Surface",
          description: "A matte stylized surface with brush marks and paint details.",
        },
        brushed_aluminum: {
          label: "Brushed Aluminum",
          description: "Satin aluminum with visible directional brushing.",
        },
        clear_glass: {
          label: "Clear Glass",
          description: "Clean transparent glass with a smooth glossy finish.",
        },
        frosted_glass: {
          label: "Frosted Glass",
          description: "Diffused frosted glass with a smooth matte surface.",
        },
        clean_porcelain: {
          label: "Clean Porcelain",
          description: "Smooth glossy porcelain with a clean opaque surface.",
        },
        weathered_leather: {
          label: "Weathered Leather",
          description: "Matte grainy leather with visible wear and scratches.",
        },
        woven_cotton: {
          label: "Woven Cotton",
          description: "Matte cotton with a clearly visible woven texture.",
        },
        aged_wood: {
          label: "Aged Wood",
          description: "Pronounced oak grain with weathering and scratches.",
        },
        polished_marble: {
          label: "Polished Marble",
          description: "Smooth high-gloss marble with visible surface character.",
        },
        matte_rubber: {
          label: "Matte Rubber",
          description: "Clean opaque rubber with a smooth matte surface.",
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
      description:
        "Build the illumination of the scene from up to three independent light sources plus global ambient and contrast controls. Lighting does not define camera capture, scene content, surface material, the image palette, or post-processing effects.",
      groups: {
        core: {
          title: "Lighting",
          description: "Choose the exact lighting style.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional illumination-specific instructions not covered by the structured controls.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated Lighting output with your own lighting instruction.",
        },
        sources: {
          title: "Light Sources",
          description:
            "Add up to three independently configurable lights. Each source keeps its role, type, direction, quality, intensity, color, and lighting-only features together.",
        },
        global: {
          title: "Global Lighting",
          description:
            "Control scene-wide ambient fill and overall light-shadow contrast without changing the individual source recipes.",
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
          label: "Extra Lighting Details",
          description:
            "Add only illumination-specific instructions that are not already expressed by the structured lighting controls.",
          placeholder: "Add optional lighting details...",
        },
        customText: {
          label: "Custom Lighting Text",
          description:
            "Write your own lighting instruction and replace the generated Lighting output.",
          placeholder: "Write your custom lighting instruction...",
        },
        lightSources: {
          label: "Light Sources",
          description:
            "Define one to three independent sources while preserving the relationship between each light's direction, color, intensity, and other properties.",
          editorTitle: "Lighting Rig",
          editorDescription:
            "Add up to {max} light sources. Multiple sources are compiled as separate linked lighting clauses.",
          emptyTitle: "No light source defined",
          emptyDescription: "Add a source manually or choose a preset to build the lighting setup.",
          sourceTitle: "Light Source {index}",
          actions: {
            add: "Add light",
            remove: "Remove light",
          },
          role: {
            label: "Role",
            options: {
              key: "Key Light",
              fill: "Fill Light",
              rim: "Rim Light",
              accent: "Accent Light",
              background: "Background Light",
              practical: "Practical Light",
              environment: "Environment Light",
            },
          },
          sourceType: {
            label: "Source Type",
            options: {
              area_light: "Area Light",
              point_light: "Point Light",
              daylight: "Natural Daylight",
              direct_sun: "Direct Sunlight",
              overcast_sky: "Overcast Sky",
              window: "Window Light",
              studio: "Studio Light",
              softbox: "Softbox",
              spotlight: "Spotlight",
              direct_flash: "Direct Flash",
              streetlight: "Streetlight",
              candle: "Candlelight",
              fire: "Firelight",
              screen: "Screen Light",
              fluorescent: "Fluorescent Light",
              neon: "Neon Light",
              stage: "Stage Light",
            },
          },
          direction: {
            label: "Direction",
            options: {
              omnidirectional: "Surrounding / Ambient",
              front: "Front",
              camera_left: "Camera Left",
              camera_right: "Camera Right",
              three_quarter_left: "Three-Quarter Left",
              three_quarter_right: "Three-Quarter Right",
              back: "Back",
              back_left: "Back Left",
              back_right: "Back Right",
              top: "Top",
              below: "Below",
            },
          },
          quality: {
            label: "Quality",
            options: {
              very_soft: "Very Soft / Diffused",
              soft: "Soft",
              balanced: "Moderately Defined",
              hard: "Hard / Directional",
              very_hard: "Very Hard / Crisp",
            },
          },
          intensity: {
            label: "Intensity",
            options: {
              dim: "Dim",
              low: "Low",
              balanced: "Balanced",
              bright: "Bright",
              intense: "Intense",
            },
          },
          color: {
            label: "Light Color",
            options: {
              neutral: "Neutral",
              warm: "Warm",
              cool: "Cool",
              amber: "Golden / Amber",
              blue: "Blue",
              red: "Red",
              magenta: "Magenta",
              cyan: "Cyan",
              green: "Green",
              purple: "Purple",
              pastel: "Pastel Colored",
              custom: "Custom Color",
            },
            customLabel: "Custom light color",
            customPlaceholder: "Example: deep turquoise, #36d8ff, pale warm pink...",
          },
          features: {
            label: "Lighting Features",
            options: {
              patterned_shadows: "Patterned Shadows",
              volumetric_beams: "Volumetric Beams",
              halo_backlight: "Backlight Halo",
              silhouette_emphasis: "Silhouette Emphasis",
            },
          },
        },
        ambientLevel: {
          label: "Ambient Level",
          description:
            "Set the scene-wide ambient fill independently from the intensity of each explicit light source.",
          placeholder: "Select ambient level",
          options: {
            none: "No Additional Ambient Fill",
            minimal: "Minimal",
            low: "Low",
            balanced: "Balanced",
            bright: "Bright",
          },
        },
        overallContrast: {
          label: "Overall Contrast",
          description:
            "Control the scene-wide relationship between illuminated and shadow areas without changing individual source intensity.",
          placeholder: "Select overall contrast",
          options: {
            low: "Low Contrast",
            balanced: "Balanced Contrast",
            high: "High Contrast",
            extreme: "Extreme Light-Shadow Contrast",
          },
        },
      },
      presetsDescription:
        "Choose a lighting recipe, then edit any individual source or global control.",
      presets: {
        soft_diffused: {
          label: "Soft Diffused",
          description: "Broad soft illumination with low scene contrast.",
        },
        natural_window: {
          label: "Natural Window Light",
          description:
            "A soft window-source recipe with independent direction left open for customization.",
        },
        overcast_daylight: {
          label: "Overcast Daylight",
          description: "Broad overcast-sky illumination with bright ambient fill and low contrast.",
        },
        golden_hour: {
          label: "Golden Hour",
          description:
            "Warm golden sunlight recipe without imposing scene content or camera style.",
        },
        clean_studio: {
          label: "Clean Studio",
          description: "Two-light studio recipe with a soft key and restrained fill.",
        },
        beauty_studio: {
          label: "Beauty Studio",
          description: "Very soft frontal key and fill lighting with low overall contrast.",
        },
        softbox_studio: {
          label: "Softbox Studio",
          description: "Single softbox key recipe ready for manual fill or rim additions.",
        },
        high_key: {
          label: "High Key",
          description: "Three-source bright studio recipe with strong fill and low contrast.",
        },
        low_key: {
          label: "Low Key",
          description: "Selective hard key lighting with minimal ambient fill and high contrast.",
        },
        chiaroscuro: {
          label: "Chiaroscuro",
          description: "Hard selective side illumination with extreme light-shadow contrast.",
        },
        moody_side: {
          label: "Hard Side Light",
          description: "Hard side-key recipe with low ambient fill and strong contrast.",
        },
        backlit_silhouette: {
          label: "Backlit Silhouette",
          description: "Strong backlight recipe designed to emphasize the subject silhouette.",
        },
        spotlight: {
          label: "Spotlight",
          description: "Focused hard key illumination with dark surrounding fill.",
        },
        film_noir: {
          label: "Film Noir Lighting",
          description: "Hard side spotlight with patterned shadows and extreme contrast.",
        },
        hard_direct: {
          label: "Hard Direct Light",
        },
        direct_flash: {
          label: "Direct Flash",
          description: "Hard intense frontal flash illumination without camera-style assumptions.",
        },
        top_hard: {
          label: "Hard Top Light",
        },
        underlight: {
          label: "Underlight",
        },
        warm_cool_split: {
          label: "Warm / Cool Split",
          description: "Two opposing colored studio lights with independent warm and cool sources.",
        },
        blue_red_split: {
          label: "Blue / Red Split",
          description:
            "Red light from camera-left and blue light from camera-right as two linked sources.",
        },
        neon_split: {
          label: "Magenta / Cyan Neon Split",
          description: "Opposing magenta and cyan neon sources for a vivid dual-light setup.",
        },
        pastel_soft: {
          label: "Soft Pastel Lighting",
        },
        volumetric_spotlight: {
          label: "Volumetric Spotlight",
          description:
            "Focused directional light with visible volumetric beams but without inventing fog or smoke content.",
        },
        rim_separation: {
          label: "Key + Rim Separation",
          description: "Soft key plus a separate rear rim source for subject separation.",
        },
        streetlight_night: {
          label: "Streetlight",
          description:
            "Low amber streetlight illumination; the environment itself remains owned by Background.",
        },
        candlelight: {
          label: "Candlelight",
          description: "Low soft amber practical light with minimal ambient fill.",
        },
        screen_light: {
          label: "Screen Light",
          description: "Low soft blue frontal illumination from a digital screen.",
        },
        firelight: {
          label: "Firelight",
          description:
            "Warm low practical fire illumination without adding flames as scene content.",
        },
        fluorescent_interior: {
          label: "Fluorescent Interior",
          description: "Cool overhead fluorescent illumination with balanced ambient fill.",
        },
        stage_lighting: {
          label: "Stage Lighting",
          description: "Hard stage key plus an independent colored accent source.",
        },
        warm_key_cool_rim: {
          label: "Warm Key + Cool Rim",
          description: "Soft warm key light paired with a harder cool rear rim source.",
        },
      },
    },
    framing: {
      title: "Framing",
      description:
        "Control how the subject is covered, placed, viewed, composed, and safely cropped inside the image frame. Camera optics, artifact layout, body pose, and visual style are handled by their own modules.",
      groups: {
        core: {
          title: "Framing",
          description: "Choose the exact framing and composition style.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional framing instructions that are not covered by the structured controls.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated framing output with your own framing text.",
        },
        composition: {
          title: "Frame Composition",
          description:
            "Define subject coverage, placement, balance, and compositional features inside the frame.",
        },
        view: {
          title: "View",
          description:
            "Define the viewing angle and the direction from which the subject is seen, without changing lens characteristics or body pose.",
        },
        crop: {
          title: "Crop Safety",
          description: "Protect important subject areas from unintended cropping.",
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
          label: "Extra Framing Details",
          description:
            "Add only framing-specific instructions that are not already expressed by the controls above.",
          placeholder: "Add optional framing details...",
        },
        customText: {
          label: "Custom Framing Text",
          description: "Write your own framing text and replace the generated framing output.",
          placeholder: "Write your custom framing text...",
        },
        shotSize: {
          label: "Shot Size",
          description: "Choose how much of the subject should be visible inside the frame.",
          placeholder: "Select shot size",
          options: {
            detail: "Detail",
            extreme_close_up: "Extreme Close-Up",
            close_up: "Close-Up",
            head_and_shoulders: "Head & Shoulders",
            bust: "Bust",
            medium_subject: "Medium Subject",
            three_quarter_subject: "Most of Subject",
            full_subject: "Full Subject",
            wide_full_subject: "Wide Full Subject",
          },
        },
        subjectPlacement: {
          label: "Subject Placement",
          description:
            "Choose the primary placement strategy for the subject or focal subject inside the frame.",
          placeholder: "Select subject placement",
          options: {
            centered: "Centered",
            off_center: "Off Center",
            rule_of_thirds: "Rule of Thirds",
            upper_frame: "Upper Frame",
            lower_frame: "Lower Frame",
            edge_weighted: "Edge Weighted",
            negative_space: "Negative Space",
          },
        },
        composition: {
          label: "Composition Structure",
          description:
            "Choose the dominant geometric organization of the frame without applying an aesthetic style.",
          placeholder: "Select composition structure",
          options: {
            symmetrical: "Symmetrical",
            asymmetrical: "Asymmetrical",
            dynamic_diagonal: "Dynamic Diagonal",
            layered_depth: "Layered Depth",
            isolated_subject: "Isolated Subject",
          },
        },
        viewAngle: {
          label: "View Angle",
          description:
            "Choose the vertical or overhead angle from which the subject is viewed. Lens and camera characteristics remain separate.",
          placeholder: "Select view angle",
          options: {
            eye_level: "Eye Level",
            low_angle: "Low Angle",
            high_angle: "High Angle",
            top_down: "Top Down",
            worms_eye: "Worm's-Eye",
            birds_eye: "Bird's-Eye",
          },
        },
        viewDirection: {
          label: "View Direction",
          description:
            "Choose the direction from which the subject is seen. This describes viewpoint rather than forcing a body pose.",
          placeholder: "Select view direction",
          options: {
            frontal: "Front",
            three_quarter: "Three-Quarter",
            profile: "Side",
            rear: "Rear",
          },
        },
        cropSafety: {
          label: "Protected Crop Areas",
          description:
            "Select subject areas that should remain fully visible and protected from unintended cropping.",
          placeholder: "Select protected areas",
          options: {
            important_details: "Important Details",
            face: "Face",
            hands: "Hands",
            silhouette: "Complete Silhouette",
            safe_margin: "Safe Margin",
          },
          compatibilityWarnings: {
            handsNeedMoreCoverage:
              "This crop is usually too tight to keep the hands fully visible. Choose a wider shot or remove Hands from crop safety.",
            silhouetteNeedsFullSubject:
              "Complete Silhouette conflicts with a partial or close crop. Use Full Subject or Wide Full Subject if the whole silhouette must remain visible.",
          },
        },
        balance: {
          label: "Frame Balance",
          description: "Choose whether the overall frame balance is symmetrical or asymmetrical.",
          placeholder: "Select frame balance",
          options: {
            symmetrical: "Symmetrical",
            asymmetrical: "Asymmetrical",
          },
        },
        compositionFeatures: {
          label: "Composition Features",
          description:
            "Add compatible compositional features that can coexist with the selected placement and balance.",
          placeholder: "Select composition features",
          options: {
            negative_space: "Negative Space",
            dynamic_diagonal: "Dynamic Diagonal",
            layered_depth: "Layered Depth",
            isolated_subject: "Isolated Subject",
          },
        },
      },
    },
    pose: {
      title: "Pose",
      description:
        "Define physical body configurations, movement, gestures, and interactions, then assign each pose to semantic subjects.",
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
          description: "Replace structured pose assignments with your own pose instruction.",
          placeholder: "Describe the complete pose instruction...",
        },
        assignments: {
          label: "Pose Assignments",
          description:
            "Build independent pose specifications and assign each one to the subjects it should control.",
          countLabel: "assignments",
          actions: {
            add: "Add Pose Assignment",
            remove: "Remove",
          },
          preset: {
            label: "Pose Preset",
          },
          targets: {
            label: "Apply To",
            placeholder: "Select subject targets",
          },
          warnings: {
            duplicateTarget:
              "One or more subjects are already targeted by another pose assignment and may receive conflicting instructions.",
          },
          summary: {
            empty: "No pose properties",
          },
          basePosture: {
            label: "Base Posture",
            options: {
              standing: "Standing",
              seated: "Seated",
              kneeling: "Kneeling",
              crouching: "Crouching",
              reclining: "Reclining",
              lying: "Lying Down",
            },
          },
          torsoPosture: {
            label: "Torso Posture",
            options: {
              upright: "Upright",
              leaning_forward: "Leaning Forward",
              leaning_backward: "Leaning Backward",
              leaning_sideways: "Leaning Sideways",
              hunched: "Hunched",
              twisted: "Twisted",
              arched: "Arched",
            },
          },
          weightBalance: {
            label: "Weight / Balance",
            options: {
              even: "Evenly Balanced",
              shifted: "Weight Shifted",
              single_side_support: "Single-side Support",
              off_balance: "Off-balance",
            },
          },
          bodyTension: {
            label: "Body Tension",
            options: {
              relaxed: "Relaxed",
              engaged: "Engaged",
              tense: "Tense",
              rigid: "Rigid",
              loose: "Loose",
            },
          },
          locomotion: {
            label: "Locomotion",
            options: {
              walking: "Walking",
              running: "Running",
              jumping: "Jumping",
            },
          },
          gestures: {
            label: "Gestures",
            placeholder: "Select gestures",
            options: {
              arms_crossed: "Arms Crossed",
              hands_at_sides: "Hands at Sides",
              hand_on_hip: "Hand on Hip",
              hands_in_pockets: "Hands in Pockets",
              open_arms: "Open Arms",
              pointing: "Pointing",
              reaching: "Reaching",
              raised_arms: "Raised Arms",
              hands_on_knees: "Hands on Knees",
              hands_clasped: "Hands Clasped",
            },
          },
          interactionDetails: {
            label: "Interaction / Action Details",
            placeholder: "Example: holding {sword}, leaning against {car}",
          },
          additionalDetails: {
            label: "Additional Details",
            placeholder: "Add subject-specific pose details...",
          },
        },
      },
      presets: {
        neutral_standing: {
          label: "Neutral Standing",
          description: "Balanced standing posture with an upright torso and relaxed hands.",
        },
        relaxed_standing: {
          label: "Relaxed Standing",
          description: "Relaxed standing with a natural weight shift.",
        },
        arms_crossed_standing: {
          label: "Arms Crossed",
          description: "Upright standing pose with crossed arms.",
        },
        hand_on_hip: {
          label: "Hand on Hip",
          description: "Standing pose with shifted weight and one hand on the hip.",
        },
        relaxed_seated: {
          label: "Relaxed Seated",
          description: "Comfortable seated posture with relaxed body tension.",
        },
        forward_seated: {
          label: "Forward Seated",
          description: "Seated pose leaning forward with hands on the knees.",
        },
        walking: {
          label: "Walking",
          description: "Engaged standing body configuration in walking motion.",
        },
        running: {
          label: "Running",
          description: "Engaged standing body configuration in running motion.",
        },
        action_ready: {
          label: "Action Ready",
          description: "Balanced standing posture with visible body tension before action.",
        },
      },
    },
    expression: {
      title: "Expression",
      description:
        "Define visible facial expressions and their physical facial features, then assign each expression to semantic subjects.",
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
          description:
            "Replace structured expression assignments with your own facial-expression instruction.",
          placeholder: "Describe the complete facial-expression instruction...",
        },
        assignments: {
          label: "Expression Assignments",
          description:
            "Build independent facial-expression specifications and assign each one to the subjects it should control.",
          countLabel: "assignments",
          actions: {
            add: "Add Expression Assignment",
            remove: "Remove",
          },
          preset: {
            label: "Expression Preset",
          },
          targets: {
            label: "Apply To",
            placeholder: "Select subject targets",
          },
          warnings: {
            duplicateTarget:
              "One or more subjects are already targeted by another expression assignment and may receive conflicting instructions.",
          },
          summary: {
            empty: "No expression properties",
          },
          coreExpression: {
            label: "Core Expression",
            options: {
              neutral: "Neutral",
              happy: "Happy",
              joyful: "Joyful",
              serious: "Serious",
              determined: "Determined",
              angry: "Angry",
              sad: "Sad",
              melancholic: "Melancholic",
              fearful: "Fearful",
              surprised: "Surprised",
              confused: "Confused",
              disgusted: "Disgusted",
              smug: "Smug",
              curious: "Curious",
              sleepy: "Sleepy",
            },
          },
          intensity: {
            label: "Intensity",
            options: {
              subtle: "Subtle",
              moderate: "Moderate",
              pronounced: "Pronounced",
              exaggerated: "Exaggerated",
            },
          },
          eyeState: {
            label: "Eye State",
            options: {
              relaxed: "Relaxed",
              soft: "Soft",
              narrowed: "Narrowed",
              wide: "Wide",
              squinting: "Squinting",
              closed: "Closed",
            },
          },
          browState: {
            label: "Brow State",
            options: {
              relaxed: "Relaxed",
              raised: "Raised",
              furrowed: "Furrowed",
              lowered: "Lowered",
            },
          },
          mouthState: {
            label: "Mouth State",
            options: {
              neutral: "Neutral",
              slight_smile: "Slight Smile",
              smile: "Smile",
              broad_smile: "Broad Smile",
              smirk: "Smirk",
              frown: "Frown",
              open: "Open Mouth",
              gritted_teeth: "Gritted Teeth",
              pursed_lips: "Pursed Lips",
            },
          },
          additionalDetails: {
            label: "Additional Details",
            placeholder: "Add subject-specific expression details...",
          },
        },
      },
      presets: {
        neutral_calm: {
          label: "Neutral Calm",
          description: "Subtle neutral expression with relaxed facial features.",
        },
        gentle_smile: {
          label: "Gentle Smile",
          description: "Subtle happy expression with relaxed eyes and a slight smile.",
        },
        warm_smile: {
          label: "Warm Smile",
          description: "Moderate happy expression with soft eyes and a clear smile.",
        },
        joyful: {
          label: "Joyful",
          description: "Pronounced joyful expression with soft eyes and a broad smile.",
        },
        determined: {
          label: "Determined",
          description: "Focused determined expression with narrowed eyes and furrowed brows.",
        },
        furious: {
          label: "Furious",
          description:
            "Pronounced angry expression with narrowed eyes, furrowed brows, and gritted teeth.",
        },
        sad_soft: {
          label: "Soft Sadness",
          description: "Subtle sad expression with soft eyes and a frown.",
        },
        shocked: {
          label: "Shocked",
          description: "Pronounced surprise with wide eyes, raised brows, and an open mouth.",
        },
        sleepy: {
          label: "Sleepy",
          description: "Subtle sleepy expression with relaxed facial features.",
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
      ui: {
        designer: {
          title: "Outfit Designer",
          description:
            "Build one or more wearable sets, assign each set to subjects, then configure every item independently.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the structured Outfit Designer output with your own instruction.",
          placeholder: "Describe the complete outfit instruction...",
        },
        sets: {
          actions: {
            duplicate: "Duplicate set",
            remove: "Remove set",
            add: "Add Outfit Set",
          },
          fields: {
            name: {
              label: "Set name",
              placeholder: "Outfit set name",
            },
            key: {
              label: "Semantic key",
              hint: "lowerCamelCase · auto-unique",
            },
            preset: {
              label: "Starter preset",
              placeholder: "No preset",
            },
            targets: {
              label: "Who wears this set?",
              placeholder: "Select subject targets",
            },
            additionalDetails: {
              label: "Additional set details",
              placeholder: "Optional instructions for the whole outfit set...",
            },
          },
          sections: {
            items: {
              title: "Add wearable items",
              description: "Choose canonical items, prepared starters, or a custom wearable.",
              addSelected: "Add selected",
              placeholder: "Select clothes and wearable items...",
              empty: "This set has no wearable items yet.",
            },
          },
          footer: {
            description: "Create separate outfit sets for different subjects or alternate looks.",
          },
        },
        item: {
          actions: {
            duplicate: "Duplicate item",
            remove: "Remove item",
          },
          fields: {
            name: {
              label: "Item name",
              placeholder: "Display name",
            },
            key: {
              label: "Semantic key",
              hint: "Unique inside this set",
            },
            type: {
              label: "Wearable type",
            },
            customType: {
              label: "Custom wearable",
              placeholder: "Describe the wearable item...",
            },
            propertyFamily: {
              label: "Property family",
            },
            source: {
              label: "Baseline source",
            },
            referenceHint: {
              label: "Reference item hint",
              placeholder: "e.g. the blouse worn by the person on the left",
            },
            additionalDetails: {
              label: "Additional item details",
              placeholder: "Optional construction or wearing details...",
            },
          },
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
      ui: {
        designer: {
          title: "Hairstyle Designer",
          description:
            "Build one or more subject-scoped hairstyles, then assign color and material externally when needed.",
        },
        override: {
          title: "Custom Override",
          description:
            "Replace the structured Hairstyle Designer output with your own instruction.",
          placeholder: "Describe the complete hairstyle instruction...",
        },
        styles: {
          actions: {
            duplicate: "Duplicate hairstyle",
            remove: "Remove hairstyle",
            add: "Add Hairstyle",
          },
          fields: {
            name: {
              label: "Hairstyle name",
              placeholder: "Hairstyle name",
            },
            key: {
              label: "Semantic key",
              hint: "lowerCamelCase · auto-unique",
            },
            preset: {
              label: "Starter preset",
              placeholder: "No preset",
            },
            targets: {
              label: "Whose hair is this?",
              placeholder: "Select subject targets",
            },
            source: {
              label: "Baseline source",
            },
            referenceHint: {
              label: "Reference hair hint",
              placeholder: "e.g. the hairstyle of the person on the left",
            },
            additionalDetails: {
              label: "Additional hairstyle details",
              placeholder: "Optional structural or styling instructions...",
            },
          },
          sections: {
            base: {
              title: "Base Hair Structure",
              description: "Color and material are intentionally assigned from their own modules.",
            },
            components: {
              title: "Add hairstyle components",
              description:
                "Add bangs, braids, buns, ponytails, hair accessories, or custom elements.",
              addSelected: "Add selected",
              placeholder: "Select hairstyle components...",
              empty: "No extra hairstyle components. Base hair structure can stand on its own.",
            },
          },
          footer: {
            description: "Create separate hairstyles for different subjects or alternate looks.",
          },
        },
        component: {
          actions: {
            duplicate: "Duplicate component",
            remove: "Remove component",
          },
          fields: {
            name: {
              label: "Component name",
              placeholder: "Display name",
            },
            key: {
              label: "Semantic key",
              hint: "Unique inside this hairstyle",
            },
            type: {
              label: "Component type",
            },
            customType: {
              label: "Custom component",
              placeholder: "Describe the hair component...",
            },
            additionalDetails: {
              label: "Additional component details",
              placeholder: "Optional structural or styling details...",
            },
          },
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
        "Control how an otherwise unchanged realistic scene is recorded: capture system, image response, lens behavior, focus/depth behavior, and physical capture behavior. Framing, viewpoint, composition, lighting, pose, and visual style remain independent.",
      groups: {
        core: {
          title: "Camera",
          description: "Select camera style and model.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Add optional camera-specific instructions not covered by the structured controls.",
        },
        override: {
          title: "Custom Override",
          description: "Replace the generated camera output with your own camera instruction.",
        },
        capture: {
          title: "Capture System",
          description:
            "Choose the camera or recording system and its image-response character without changing framing or lighting.",
        },
        optics: {
          title: "Optics & Focus",
          description:
            "Control lens behavior and depth-of-field independently from the selected camera body or device.",
        },
        behavior: {
          title: "Capture Behavior",
          description:
            "Describe physical camera handling or recording stability without changing subject placement or composition.",
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
          label: "Extra Camera Details",
          description:
            "Add only camera/capture-specific instructions that are not already expressed by the controls above.",
          placeholder: "Add optional camera details...",
        },
        customText: {
          label: "Custom Camera Text",
          description: "Write your own camera instruction and replace the generated Camera output.",
          placeholder: "Write your custom camera text...",
        },
        captureSystem: {
          label: "Capture System",
          description:
            "Choose the recording system or specific camera body. This defines the capture platform, not angle, framing, composition, or lighting.",
          placeholder: "Select capture system",
          categories: {
            genericDigital: "Generic Digital",
            genericFilm: "Generic Film",
            integrated: "Integrated / Fixed Systems",
            analogModels: "Analog Camera Models",
            digitalModels: "Digital Camera Models",
          },
          options: {
            digital_full_frame: "Full-Frame Digital",
            digital_aps_c: "APS-C Digital",
            digital_medium_format: "Medium-Format Digital",
            digital_cinema: "Digital Cinema",
            film_35mm: "35mm Film",
            film_medium_format: "Medium-Format Film",
            instant_film: "Instant Film",
            smartphone: "Smartphone Camera",
            webcam: "Webcam",
            security_camera: "Security Camera",
            action_camera: "Action Camera",
            aerial_drone: "Aerial Drone Camera",
            polaroid_sx70: "Polaroid SX-70",
            kodak_disposable: "Kodak Disposable",
            canon_ae1: "Canon AE-1",
            nikon_f3: "Nikon F3",
            pentax_k1000: "Pentax K1000",
            leica_m6: "Leica M6",
            hasselblad_500c: "Hasselblad 500C/M",
            rolleiflex: "Rolleiflex",
            contax_t2: "Contax T2",
            lomography: "Lomography Camera",
            canon_eos_r5: "Canon EOS R5",
            nikon_z8: "Nikon Z8",
            sony_a7r_iv: "Sony A7R IV",
            sony_a7s_iii: "Sony A7S III",
            fujifilm_x100v: "Fujifilm X100V",
            fujifilm_gfx_100s: "Fujifilm GFX 100S",
            leica_q2: "Leica Q2",
            leica_sl2: "Leica SL2",
            hasselblad_x2d: "Hasselblad X2D",
            red_komodo: "RED Komodo",
            arri_alexa: "ARRI Alexa",
            blackmagic_pocket: "Blackmagic Pocket Cinema Camera",
          },
        },
        captureResponse: {
          label: "Capture Response",
          description:
            "Control sensor or film response such as tonal roll-off, grain/noise character, dynamic-range behavior, and image-response character without changing scene lighting.",
          placeholder: "Select capture response",
          options: {
            neutral_digital: "Neutral Digital",
            high_resolution_digital: "High-Resolution Digital",
            low_light_digital: "High-Sensitivity Digital",
            xtrans_digital: "Fujifilm X-Trans",
            medium_format_digital: "Medium-Format Digital",
            cinema_digital: "Digital Cinema",
            film_35mm: "35mm Film",
            consumer_film: "Consumer 35mm Film",
            medium_format_film: "Medium-Format Film",
            instant_film: "Instant Film",
            experimental_film: "Experimental Film",
            compressed_digital: "Compressed Digital",
          },
          compatibilityWarnings: {
            systemMismatch:
              "This capture response is not a typical physical match for the selected capture system. The combination is still allowed for intentional creative use.",
          },
        },
        lensProfile: {
          label: "Lens Profile",
          description:
            "Choose optical field-of-view, compression, and distortion behavior. This does not control shot size or viewpoint.",
          placeholder: "Select lens profile",
          options: {
            macro: "Macro",
            fisheye: "Fisheye",
            ultra_wide: "Ultra Wide",
            wide_angle: "Wide Angle",
            standard: "Standard",
            short_telephoto: "Short Telephoto",
            telephoto: "Telephoto",
            fixed_23mm_wide: "Fixed 23mm Wide-Normal",
            fixed_28mm_wide: "Fixed 28mm Wide",
            simple_fixed_wide: "Simple Fixed Wide",
            integral_instant_lens: "Integral Instant-Camera Lens",
            twin_lens_medium_format: "Medium-Format Twin-Lens",
            fixed_38mm: "Fixed 38mm",
          },
          compatibilityWarnings: {
            systemMismatch:
              "This lens profile is not a typical physical match for the selected capture system. The combination is still allowed for intentional creative use.",
          },
        },
        focusDepth: {
          label: "Focus & Depth",
          description:
            "Choose the depth-of-field behavior independently from lens profile and framing.",
          placeholder: "Select focus and depth behavior",
          options: {
            shallow: "Shallow Depth of Field",
            moderate: "Moderate Depth of Field",
            deep: "Deep Depth of Field",
            fixed_focus_deep: "Fixed Focus / Deep",
            critical_focus: "Critical Focus",
          },
        },
        captureBehavior: {
          label: "Capture Behavior",
          description:
            "Choose physical recording behavior such as tripod stability or subtle handheld instability without forcing composition or motion effects.",
          placeholder: "Select capture behavior",
          options: {
            tripod_stable: "Tripod Stable",
            handheld_subtle: "Subtle Handheld",
            handheld_active: "Active Handheld",
            stabilized: "Stabilized",
            fixed_mounted: "Fixed Mounted",
          },
        },
      },
      presets: {
        polaroid_sx70: {
          label: "Polaroid SX-70",
          description:
            "Instant-film capture recipe with the SX-70 system's integral optical and response character.",
        },
        kodak_disposable: {
          label: "Kodak Disposable",
          description: "Simple fixed-lens consumer 35mm film capture recipe.",
        },
        canon_ae1: {
          label: "Canon AE-1",
          description:
            "Canon AE-1 35mm film-body recipe; lens and focus remain independently editable.",
        },
        nikon_f3: {
          label: "Nikon F3",
          description:
            "Nikon F3 35mm film-body recipe; lens and focus remain independently editable.",
        },
        pentax_k1000: {
          label: "Pentax K1000",
          description:
            "Pentax K1000 35mm film-body recipe; lens and focus remain independently editable.",
        },
        leica_m6: {
          label: "Leica M6",
          description:
            "Leica M6 35mm rangefinder-body recipe; lens and focus remain independently editable.",
        },
        hasselblad_500c: {
          label: "Hasselblad 500C/M",
          description: "Hasselblad 500C/M medium-format film capture recipe.",
        },
        rolleiflex: {
          label: "Rolleiflex",
          description:
            "Rolleiflex medium-format twin-lens-reflex capture recipe with fixed-system optical character.",
        },
        contax_t2: {
          label: "Contax T2",
          description:
            "Contax T2 compact 35mm film capture recipe with its fixed 38mm optical character.",
        },
        lomography: {
          label: "Lomography Camera",
          description:
            "Experimental compact-film capture recipe without imposing viewpoint or composition.",
        },
        canon_eos_r5: {
          label: "Canon EOS R5",
          description:
            "Canon EOS R5 full-frame digital capture recipe; lens and focus remain independently editable.",
        },
        nikon_z8: {
          label: "Nikon Z8",
          description:
            "Nikon Z8 full-frame digital capture recipe; lens and focus remain independently editable.",
        },
        sony_a7r_iv: {
          label: "Sony A7R IV",
          description: "Sony A7R IV high-resolution full-frame digital capture recipe.",
        },
        sony_a7s_iii: {
          label: "Sony A7S III",
          description:
            "Sony A7S III high-sensitivity full-frame digital capture recipe without forcing low-light scene lighting.",
        },
        fujifilm_x100v: {
          label: "Fujifilm X100V",
          description:
            "Fujifilm X100V APS-C fixed-lens capture recipe with integrated optical character.",
        },
        fujifilm_gfx_100s: {
          label: "Fujifilm GFX 100S",
          description:
            "Fujifilm GFX 100S medium-format digital capture recipe; lens and focus remain independently editable.",
        },
        leica_q2: {
          label: "Leica Q2",
          description:
            "Leica Q2 full-frame fixed-lens capture recipe with integrated 28mm-class optics.",
        },
        leica_sl2: {
          label: "Leica SL2",
          description:
            "Leica SL2 full-frame digital capture recipe; lens and focus remain independently editable.",
        },
        hasselblad_x2d: {
          label: "Hasselblad X2D",
          description:
            "Hasselblad X2D medium-format digital capture recipe; lens and focus remain independently editable.",
        },
        red_komodo: {
          label: "RED Komodo",
          description:
            "RED Komodo digital-cinema capture recipe without cinematic composition or lighting assumptions.",
        },
        arri_alexa: {
          label: "ARRI Alexa",
          description:
            "ARRI Alexa digital-cinema capture recipe focused on capture response rather than cinematic styling.",
        },
        blackmagic_pocket: {
          label: "Blackmagic Pocket Cinema Camera",
          description:
            "Blackmagic Pocket Cinema Camera digital-cinema capture recipe without composition assumptions.",
        },
      },
    },
    colorPalette: {
      title: "Color Palette",
      description:
        "Define editable color palettes and assign them to broad image areas, specific typography entities, or user-defined subject and object variables. Color Palette controls base colors only; illumination color belongs to Lighting and material appearance belongs to Texture.",
      groups: {
        core: {
          title: "Palette Rules",
          description:
            "Create one or more palette rules. Each rule keeps its colors and semantic targets linked together.",
        },
        advanced: {
          title: "Advanced Details",
          description: "Add optional color-specific instructions not covered by palette rules.",
        },
        override: {
          title: "Custom Override",
          description:
            "Replace the generated Color Palette output with your own color instruction.",
        },
      },
      fields: {
        paletteAssignments: {
          label: "Palette Rules",
          description:
            "Choose a palette preset or build colors manually, then assign that palette to one or more semantic targets.",
          placeholder: "Select palette assignments",
          actions: {
            addAssignment: "Add palette rule",
            remove: "Remove",
            addColor: "Add color",
          },
          modes: {
            custom: "Custom",
            preset: "Preset",
          },
          ruleTitle: "Palette Rule {index}",
          usages: {
            accents: "Accents",
            background: "Background",
            hair: "Hair",
            lighting: "Lighting",
            outfit: "Outfit",
            overall: "Overall",
            subject: "Subject",
          },
          controls: {
            color: {
              placeholder: "Color value, for example #3366ff or deep navy",
            },
          },
          ruleSummary: "{colors} colors · {targets} targets",
          preset: {
            label: "Palette Preset",
          },
          colors: {
            label: "Palette Colors",
            description:
              "Preset colors stay editable. Any swatch can use a literal color or an enabled user Color variable.",
            literal: "Custom Color",
            groups: {
              manual: "Manual",
              variables: "Color Variables",
            },
          },
          targets: {
            label: "Apply To",
            groups: {
              general: "General",
              typographyGroups: "Typography Groups",
              typographyTexts: "Typography Texts",
              userVariables: "User Subject / Object Variables",
              missing: "Missing References",
              custom: "Custom",
            },
            builtin: {
              overall: "Overall Image",
              background: "Background",
              subject: "Main Subject",
              outfit: "Outfit",
              hair: "Hair",
              typography: "Typography",
              accents: "Accent Elements",
            },
            custom: "Custom Target",
            customLabel: "Custom target",
            customPlaceholder: "Example: dragon costume scales",
          },
          missing: "Missing",
          warnings: {
            duplicateTarget:
              "Another palette rule also targets at least one of these exact elements. Both rules are kept.",
          },
        },
        extraDetails: {
          label: "Extra Color Details",
          description:
            "Add optional color instructions that do not redefine lighting, material, or visual style.",
          placeholder: "Add optional color details...",
        },
        customText: {
          description: "Replace all structured Color Palette output with a custom instruction.",
          label: "Custom Color Override",
          placeholder: "Replace generated color palette output...",
        },
      },
    },
    typography: {
      description:
        "Create structured typography instructions with reusable text groups, layout, hierarchy, and styling details.",
      fields: {
        textGroups: {
          description:
            "Define typography groups, text content, placement, hierarchy, and visual styling.",
          label: "Text Groups",
          actions: {
            addGroup: "Add Group",
            cancel: "Cancel",
            create: "Create",
            save: "Save",
            confirmDelete: "Delete",
          },
          block: {
            actions: {
              remove: "Remove Text",
              edit: "Edit text",
              moveUp: "Move up",
              moveDown: "Move down",
            },
            controls: {
              additionalDescription: {
                label: "Additional Description",
                placeholder: "Add extra styling, layout, readability, or visual behavior notes...",
              },
              fontSize: {
                label: "Font Size",
              },
              fontStyle: {
                label: "Font Style",
                groups: {
                  presets: "Font presets",
                  variables: "Font variables",
                },
              },
              fontWeight: {
                label: "Font Weight",
              },
              purpose: {
                label: "Text Purpose",
              },
              text: {
                label: "Text",
                placeholder: "Write the text content...",
              },
              customFontStyle: {
                label: "Custom Font Style",
                placeholder:
                  "Describe a custom font style, lettering mood, or typography behavior...",
              },
              customFontSize: {
                label: "Custom Font Size",
                placeholder:
                  "Describe a custom size such as oversized headline, tiny caption, massive 3D letters, or balanced body text...",
              },
              customFontWeight: {
                label: "Custom Font Weight",
                placeholder:
                  "Describe a custom weight such as ultra bold, thin, heavy, light, chunky, or delicate...",
              },
              customPurpose: {
                label: "Custom Purpose",
                placeholder:
                  "Describe the custom role of this text, such as brand name, orbiting label, callout, title, subtitle, or decorative type...",
              },
            },
            validation: {
              requiredTextEmpty: "Text content is required.",
            },
            modal: {
              createTitle: "Create text",
              editTitle: "Edit text",
              stableKey: "Stable typography text key",
            },
          },
          count: "{count} text groups",
          group: {
            actions: {
              addText: "Add Text",
              remove: "Remove Group",
              edit: "Edit group",
            },
            controls: {
              additionalDescription: {
                label: "Additional Description",
                placeholder:
                  "Describe spacing, orbit behavior, depth, readability, or custom layout details...",
              },
              alignment: {
                label: "Alignment",
              },
              direction: {
                label: "Direction",
              },
              distribution: {
                label: "Distribution",
              },
              groupPurpose: {
                label: "Group Purpose",
              },
              positionPreset: {
                label: "Position Preset",
                groups: {
                  presets: "Preset positions",
                  layout: "Layout regions",
                  custom: "Custom",
                },
                custom: "Custom position",
                missingRegion: "Missing layout region",
              },
              writingDirection: {
                label: "Writing Direction",
              },
              customPositionDescription: {
                label: "Custom Position Description",
                placeholder:
                  "Describe the custom position, placement logic, orbit path, spacing, or layout behavior for this text group...",
              },
              customGroupPurpose: {
                label: "Custom group purpose",
                placeholder: "Describe the typography group's purpose...",
              },
              textVariables: {
                clear: "Clear text variable selection",
                description:
                  "Each selected variable becomes a normal typography text item whose content is the variable token.",
                empty:
                  "No active user Text variables are available yet. Create them in Variables first.",
                label: "Text variables",
                placeholder: "Select user Text variables",
              },
            },
            textBlocksTitle: "Text Blocks",
            list: {
              textCount: "{count} texts",
              customPosition: "Custom position",
            },
            emptyTexts: "No text has been added to this group yet.",
            modal: {
              createTitle: "Create text group",
              editTitle: "Edit text group",
              deleteTitle: "Delete text group",
              deleteDescription: "The text group and all of its text items will be removed.",
              stableKey: "Stable typography group key",
            },
          },
          title: "Typography Groups",
          empty: {
            description: "Create at least one typography group, then add text blocks inside it.",
            title: "No typography groups yet",
          },
          variablePicker: {
            addSelected: "Add selected",
            clear: "Clear text variable selection",
            description: "Select one or more user Text variables to add as typography text items.",
            empty: "No active user Text variables are available. Create them in Variables first.",
            modalTitle: "Add text variables",
            placeholder: "Select Text variables",
            title: "Text variables",
          },
        },
        extraDetails: {
          description:
            "Add global typography notes that apply across all text groups, such as readability, layout behavior, material, or visual mood.",
          label: "Extra Details",
          placeholder:
            "Describe any global typography rules, readability notes, material details, or custom layout behavior...",
        },
        textAccuracy: {
          description:
            "Control how strictly the generated result should preserve the written text.",
          label: "Text Accuracy",
          options: {
            exact: "Exact",
            flexible: "Flexible",
            readable: "Readable",
          },
        },
      },
      groups: {
        advanced: {
          description:
            "Fine-tune typography details such as spacing, material, readability, depth, and layout behavior.",
          title: "Advanced Typography",
        },
        core: {
          description:
            "Define the main typography structure, text groups, content, hierarchy, and placement.",
          title: "Core Typography",
        },
      },
      title: "Typography",
    },
    variables: {
      description:
        "Create reusable prompt variables that can be inserted into prompt fields and reused across modules.",
      fields: {
        variables: {
          description:
            "Define named variables for text, subjects, colors, references, objects, or custom prompt values.",
          label: "Variables",
          types: {
            color: "Color",
            custom: "Custom",
            object: "Object",
            reference: "Reference",
            subject: "Subject",
            text: "Text",
            font: "Font",
          },
          actions: {
            add: "Add Variable",
            duplicate: "Duplicate",
            remove: "Remove",
            edit: "Edit Variable",
            save: "Save Changes",
            create: "Create Variable",
            cancel: "Cancel",
            delete: "Delete Variable",
            confirmDelete: "Delete Variable",
          },
          controls: {
            description: {
              label: "Description",
              placeholder: "Optional internal note",
            },
            key: {
              label: "Key",
              placeholder: "variable_name",
            },
            type: {
              label: "Type",
            },
            value: {
              label: "Value",
              placeholder: "Write the variable value...",
            },
            enabled: {
              label: "Variable is enabled",
            },
          },
          outputToken: "Output Token",
          picker: {
            search: {
              placeholder: "Search variables...",
            },
            empty: {
              description:
                "Create at least one variable first, then you can insert it into prompt fields.",
              title: "No variables found",
            },
            systemVariables: {
              label: "System Variables",
            },
            sources: {
              user: "User",
              system: "System",
            },
            tabs: {
              user: "User",
              system: "System",
            },
          },
          empty: {
            title: "No variables yet",
            description: "Add your first variable, then insert it into any prompt field.",
          },
          list: {
            count: "{count} variables",
            hint: "Click a variable to edit it.",
            emptyValue: "No value",
            disabled: "Disabled",
          },
          modal: {
            createTitle: "Add Variable",
            editTitle: "Edit {token}",
            editorSubtitle: "Define the variable once, then reuse it across prompt fields.",
            deleteTitle: "Delete Variable",
            deleteDescription: "Are you sure you want to delete {token}?",
            deleteWarning:
              "If this token is used in other prompt fields, it will no longer be replaced with a value.",
          },
          validation: {
            invalidKey: "Invalid variable key.",
            reservedKey: "This key is reserved for internal typography tokens.",
            duplicateKey: "Duplicate variable key.",
            systemKey: "This key is reserved by an active system variable.",
          },
          blueprints: {
            modal: {
              repeatable: {
                description:
                  "Configure one template and choose how many indexed profiles to create.",
                indexHint:
                  "Use exactly one # in every enabled key. A # in the value is optional and receives the same index.",
              },
              custom: {
                title: "Custom variables",
                description:
                  "Add any semantic handles you need and choose each variable type independently.",
                add: "Add variable",
              },
              creationCount: "{count} will be created",
            },
          },
        },
      },
      groups: {
        core: {
          description:
            "Manage the main list of reusable variables available inside the prompt editor.",
          title: "Core Variables",
        },
      },
      title: "Variables",
    },
    layout: {
      description:
        "Define an exact multi-region canvas structure for artifacts such as posters, cards, collages, editorial pages, and presentation layouts.",
      fields: {
        composition: {
          description: "Choose how the main visual areas are arranged inside the canvas.",
          label: "Composition",
          options: {
            asymmetric_editorial: "Asymmetric Editorial",
            centered_stack: "Centered Stack",
            comic_panels: "Comic Panels",
            freeform: "Freeform",
            full_bleed: "Full Bleed",
            image_with_bottom_panel: "Image with Bottom Panel",
            image_with_side_panel: "Image with Side Panel",
            layered_collage: "Layered Collage",
            modular_grid: "Modular Grid",
            single_focal: "Single Focal",
            split_horizontal: "Split Horizontal",
            split_vertical: "Split Vertical",
          },
        },
        density: {
          description:
            "Optionally describe the overall visual density of the finished layout without changing its region geometry.",
          label: "Density",
          options: {
            balanced: "Balanced",
            dense: "Dense",
            maximal: "Maximal",
            sparse: "Sparse",
          },
          placeholder: "Select visual density",
        },
        hierarchy: {
          description:
            "Define which content type should feel most important in the final composition.",
          label: "Hierarchy",
          options: {
            balanced: "Balanced",
            image_dominant: "Image Dominant",
            information_dominant: "Information Dominant",
            product_dominant: "Product Dominant",
            text_dominant: "Text Dominant",
          },
        },
        layoutType: {
          description:
            "Optionally identify the kind of multi-region artifact being constructed. This does not change region geometry.",
          label: "Layout Type",
          options: {
            banner: "Banner",
            business_card: "Business Card",
            collage: "Collage",
            comic_page: "Comic Page",
            cover: "Cover",
            custom: "Custom",
            editorial_page: "Editorial Page",
            poster: "Poster",
            presentation_slide: "Presentation Slide",
            product_sheet: "Product Sheet",
            social_post: "Social Post",
          },
          placeholder: "Select an artifact type",
        },
        regions: {
          actions: {
            add: "Add Region",
            moveDown: "Move Down",
            moveUp: "Move Up",
            remove: "Remove",
            apply: "Apply",
            cancel: "Cancel",
            delete: "Delete",
            duplicate: "Duplicate",
            edit: "Edit",
            visualBuilder: "Visual Builder",
            confirmDelete: "Delete Region",
            create: "Create Region",
            save: "Save",
          },
          builderDescription:
            "Add and arrange layout regions with roles, coordinates, layers, alignment, and fit behavior.",
          builderTitle: "Region Builder",
          contentKey: "Content Key",
          coordinates: {
            height: "Height",
            width: "Width",
            x: "X",
            y: "Y",
          },
          defaultName: "Region",
          description:
            "Define exact canvas regions, content bindings, and optional container behavior.",
          empty: {
            description:
              "Create layout regions to define where text, images, logos, backgrounds, and other content should appear.",
            title: "No layout regions yet",
          },
          fit: {
            contain: "Contain",
            cover: "Cover",
            fill: "Stretch to fill",
            natural: "Intrinsic size",
            none: "None",
          },
          horizontalAlign: {
            center: "Center",
            end: "End",
            start: "Start",
            stretch: "Stretch",
            none: "None",
          },
          label: "Regions",
          layer: "Layer",
          name: "Name",
          overflow: {
            hidden: "Clip at region bounds",
            visible: "Allow overflow",
            none: "None",
          },
          roles: {
            background: "Background",
            badge: "Badge",
            cta: "CTA",
            custom: "Custom",
            decoration: "Decoration",
            empty_space: "Empty Space",
            hero_image: "Hero Image",
            logo: "Logo",
            metadata: "Metadata",
            supporting_image: "Supporting Image",
            text: "Text",
            none: "None",
          },
          verticalAlign: {
            center: "Center",
            end: "End",
            start: "Start",
            stretch: "Stretch",
            none: "None",
          },
          list: {
            title: "Region List",
            description: "Review, edit, duplicate, reorder, or remove layout regions.",
            layer: "Layer {layer}",
            bounds: "x {x} · y {y} · w {width} · h {height}",
            contentKey: "{key}",
            contentKeyEmpty: "No content key assigned",
          },
          visualBuilder: {
            grid: {
              apply: "Apply Grid",
              columns: "Columns",
              description: "Set the grid size used for drawing and snapping visual layout regions.",
              rows: "Rows",
              title: "Builder Grid",
              pendingChange: "Grid changes are pending",
            },
            hint: "Draw or select cells on the grid to define a layout region visually.",
            modal: {
              subtitle: "Create and adjust layout regions directly on a visual grid.",
              title: "Visual Region Builder",
            },
            regionCount: "{count} regions",
            selectionSummary: "{count} cells selected",
            tools: {
              draw: "Draw",
              select: "Select",
            },
            gridReset: {
              confirm: "Apply Grid Reset",
              description:
                "Changing the grid size will reset the current visual builder selection and may affect existing region placement.",
              subtitle: "Review the new grid size before applying it.",
              title: "Reset Builder Grid?",
            },
            contentKey: {
              empty: "Empty",
              select: "Select content variable",
            },
          },
          controls: {
            contentKey: {
              label: "Content binding",
              placeholder: "Insert a variable or content token",
            },
            description: {
              label: "Region instructions",
              placeholder: "Optional region-specific layout instructions",
            },
            fit: {
              label: "Content fit",
            },
            geometry: {
              description:
                "Use normalized geometry from 0 to 1. Layer order only affects regions that overlap.",
              height: "Height",
              layer: "Layer order",
              title: "Geometry",
              width: "Width",
              x: "X",
              y: "Y",
            },
            horizontalAlign: {
              label: "Horizontal content alignment",
            },
            name: {
              label: "Name",
              placeholder: "Region name...",
            },
            overflow: {
              label: "Content overflow",
            },
            role: {
              label: "Region role",
            },
            verticalAlign: {
              label: "Vertical content alignment",
            },
            customRole: {
              label: "Custom Role",
              placeholder: "Describe the custom role of this region...",
            },
          },
          modal: {
            createTitle: "Create Region",
            deleteDescription:
              "This region will be removed from the layout. This action cannot be undone.",
            deleteTitle: "Delete Region",
            editorSubtitle:
              "Configure the region role, content, geometry, alignment, fit, and overflow behavior.",
            editTitle: "Edit Region",
          },
          validation: {
            invalidGeometry:
              "Region geometry is invalid. Check the X, Y, width, and height values.",
            customRoleRequired: "Custom role is required when the region role is set to custom.",
          },
        },
        extraDetails: {
          description:
            "Add global layout notes such as spacing, visual flow, composition rules, margins, safe areas, or custom placement behavior.",
          label: "Extra Details",
          placeholder:
            "Describe any global layout rules, spacing notes, safe areas, margins, visual flow, or custom placement behavior...",
        },
      },
      groups: {
        advanced: {
          description: "Fine-tune density, hierarchy, and advanced layout behavior.",
          title: "Advanced Layout",
        },
        regions: {
          description:
            "Create custom regions for text, images, logos, backgrounds, and other layout elements.",
          title: "Layout Regions",
        },
        structure: {
          description:
            "Optionally describe the artifact and start from a structural region template.",
          title: "Layout Structure",
        },
      },
      title: "Layout",
      schema: {
        actions: {
          copied: "Copied",
          copy: "Copy",
          copyJson: "Copy JSON",
          close: "Close",
          download: "Download",
        },
        errors: {
          render: "Could not render the layout schema image.",
        },
        preview: {
          alt: "Generated layout schema preview",
          subtitle: "Preview or download the generated layout schema image.",
          title: "Layout schema preview",
        },
      },
      presets: {
        full_bleed: {
          label: "Template · Full bleed",
          description: "Start with one region covering the entire canvas.",
        },
        split_vertical: {
          label: "Template · Vertical split",
          description: "Start with two equal side-by-side regions.",
        },
        split_horizontal: {
          label: "Template · Horizontal split",
          description: "Start with two equal stacked regions.",
        },
        side_panel: {
          label: "Template · Side panel",
          description: "Start with one large main region and a narrower side region.",
        },
        bottom_panel: {
          label: "Template · Bottom panel",
          description: "Start with one large main region and a shorter bottom region.",
        },
        modular_grid: {
          label: "Template · Modular grid",
          description: "Start with a four-region two-by-two grid.",
        },
        feature_support: {
          label: "Template · Feature + support",
          description: "Start with one large feature region and two smaller supporting regions.",
        },
        centered_stack: {
          label: "Template · Centered stack",
          description: "Start with top, center, and bottom regions with a dominant center area.",
        },
        layered_overlap: {
          label: "Template · Layered overlap",
          description: "Start with three overlapping regions on separate layers.",
        },
      },
    },
    form: {
      title: "Form",
      description:
        "Controls form language, proportions, and intentional geometric transformation without defining the visual style.",
      groups: {
        core: {
          title: "Core Form",
          description: "Define the structural language and proportional behavior of visible forms.",
        },
        transformation: {
          title: "Form Transformation",
          description:
            "Apply an intentional structural transformation only when the default form needs to be overridden.",
        },
        advanced: {
          title: "Advanced Details",
          description:
            "Optional form-specific instructions that do not fit the structured controls.",
        },
        override: {
          title: "Custom Form",
          description: "Replace the compiled Form output with a complete custom form instruction.",
        },
      },
      fields: {
        formLanguage: {
          label: "Form Language",
          description:
            "Control geometry, contour behavior, and structural character without defining visual style.",
          placeholder: "Select a form language",
          options: {
            soft_rounded: "Soft Rounded",
            geometric: "Geometric",
            fluid_organic: "Fluid Organic",
            blocky: "Blocky",
            angular: "Angular",
            irregular: "Irregular / Asymmetric",
            faceted: "Faceted / Planar",
            biomorphic: "Biomorphic",
            monolithic: "Monolithic",
            branching: "Branching",
            ribbon_like: "Ribbon-Like",
            crystalline: "Crystalline",
            layered: "Layered",
            cellular: "Cellular",
            radial: "Radial",
            modular_letterforms: "Modular Letterforms",
            ribbon_letterforms: "Ribbon Letterforms",
            inflated_letterforms: "Inflated Letterforms",
            interlocking_letterforms: "Interlocking Letterforms",
            terraced_environment: "Terraced Environment",
            stratified_environment: "Stratified Environment",
            eroded_environment: "Eroded Environment",
            dendritic_environment: "Dendritic Environment",
            streamlined_animal: "Streamlined Animal",
            segmented_animal: "Segmented Animal",
            armored_animal: "Armored Animal",
            serpentine_animal: "Serpentine Animal",
          },
        },
        proportions: {
          label: "Proportions",
          description:
            "Control relative scale and mass distribution without changing the subject identity.",
          placeholder: "Select proportions",
          categories: {
            general: "General Proportions",
            person: "Person Proportions",
            typography: "Typography Proportions",
            scene: "Scene / Environment Proportions",
            animal: "Animal Proportions",
          },
          options: {
            balanced: "Balanced",
            elongated: "Elongated",
            compact: "Compact",
            wide: "Wide",
            tapered: "Tapered",
            top_heavy: "Top Heavy",
            bottom_heavy: "Bottom Heavy",
            asymmetric: "Asymmetric",
            oversized_elements: "Oversized Elements",
            chibi: "Chibi",
            fashion_elongated: "Fashion Elongated",
            oversized_head: "Oversized Head",
            compact_mascot: "Compact Mascot",
            long_limb_narrow_torso: "Long Limbs / Narrow Torso",
            graduated_scale: "Graduated Scale",
            nested_scale: "Nested Scale",
            slender_elongated: "Slender Elongated",
            compact_short_limb: "Compact / Short Limb",
            long_torso_short_legs: "Long Torso / Short Legs",
            short_torso_long_legs: "Short Torso / Long Legs",
            broad_shoulders_narrow_hips: "Broad Shoulders / Narrow Hips",
            narrow_shoulders_wide_hips: "Narrow Shoulders / Wide Hips",
            oversized_hands_feet: "Oversized Hands / Feet",
            type_condensed: "Condensed Letterforms",
            type_expanded: "Expanded Letterforms",
            type_tall_narrow: "Tall / Narrow Letterforms",
            type_squat_wide: "Squat / Wide Letterforms",
            type_variable_scale: "Variable Letterform Scale",
            scene_towering: "Towering Masses",
            scene_low_spreading: "Low / Spreading Masses",
            scene_narrow_vertical: "Narrow / Vertical Forms",
            scene_broad_horizontal: "Broad / Horizontal Forms",
            scene_scale_gradient: "Environmental Scale Gradient",
            animal_long_body_short_limbs: "Long Body / Short Limbs",
            animal_long_legged: "Long-Legged",
            animal_compact_stocky: "Compact / Stocky",
            animal_large_head_small_body: "Large Head / Small Body",
            animal_long_neck: "Long Neck",
            animal_tapered_body: "Tapered Body",
          },
        },
        transformation: {
          label: "Transformation",
          description:
            "Apply a deliberate form transformation. General options work across subjects; specialized options appear for the active subject type.",
          placeholder: "Select a transformation",
          categories: {
            elastic: "Elastic / Squash & Stretch",
            volume: "Volume / Compression",
            warp: "Warp / Flow",
            structural: "Structural",
            surreal: "Surreal / Experimental",
            personCaricature: "Person / Caricature",
            personElastic: "Person / Elastic Anatomy",
            personConstructed: "Person / Constructed Anatomy",
            personCreature: "Creature / Hybrid Anatomy",
            personGrotesque: "Person / Grotesque",
            typography: "Typography / Letterform",
            scene: "Scene / Environment",
            animal: "Animal / Anatomy",
          },
          options: {
            stretch: "Stretch",
            squash: "Squash",
            elastic_bend: "Elastic Bend",
            compress: "Compress",
            inflate: "Inflate",
            flatten: "Flatten",
            twist: "Twist",
            warp: "Warp",
            melt: "Melt / Droop",
            fold: "Fold",
            fragment: "Fragment",
            offset_segments: "Offset Segments",
            fractured_planes: "Fractured Planes",
            directional_smear: "Directional Smear",
            impossible_geometry: "Impossible Geometry",
            biomorphic_growth: "Biomorphic Growth",
            grotesque_caricature: "Grotesque Caricature",
            fashion_caricature: "Fashion Caricature",
            facial_exaggeration: "Facial Exaggeration",
            personality_asymmetry: "Personality Asymmetry",
            rubber_hose_anatomy: "Rubber-Hose Anatomy",
            spring_loaded_anatomy: "Spring-Loaded Anatomy",
            balloon_anatomy: "Balloon Anatomy",
            squashed_compact_anatomy: "Squashed Compact Anatomy",
            marionette_anatomy: "Marionette Anatomy",
            mannequin_anatomy: "Mannequin Anatomy",
            cuboid_anatomy: "Cuboid Anatomy",
            faceted_anatomy: "Faceted Anatomy",
            insectoid_anatomy: "Insectoid Anatomy",
            creature_hybrid: "Creature Hybrid",
            alien_elongation: "Alien Elongation",
            grotesque_misshapen: "Grotesque Misshapen",
            distorted_elegance: "Distorted Elegance",
            radical_silhouette: "Radical Silhouette",
            pinch: "Pinch",
            bulge: "Bulge",
            ripple: "Ripple",
            spiral: "Spiral",
            perforate: "Perforate",
            interweave: "Interweave",
            elegant_caricature: "Elegant Caricature",
            anatomical_asymmetry: "Anatomical Asymmetry",
            pinched_torso: "Pinched Torso",
            limb_taper: "Limb Taper",
            type_arc_bend: "Arc-Bent Letterforms",
            type_wave: "Wave Letterforms",
            type_inflate: "Inflated Letterforms",
            type_pinch: "Pinched Letterforms",
            type_fold: "Folded Letterforms",
            type_interlock: "Interlocking Letterforms",
            type_fragment: "Fragmented Letterforms",
            type_twist: "Twisted Letterforms",
            scene_terrain_fold: "Terrain Fold",
            scene_sweeping_warp: "Sweeping Environmental Warp",
            scene_floating_masses: "Floating Land Masses",
            scene_strata_shift: "Strata Shift",
            scene_crystalline_growth: "Crystalline Growth",
            scene_erosion_cut: "Erosion Cut",
            scene_gravity_droop: "Gravity Droop",
            scene_inverted_landform: "Inverted Landform",
            animal_serpentine_elongation: "Serpentine Elongation",
            animal_multi_limb: "Multi-Limb",
            animal_armored_segmentation: "Armored Segmentation",
            animal_spine_growth: "Spine Growth",
            animal_limb_reduction: "Limb Reduction",
            animal_appendage_expansion: "Appendage Expansion",
          },
        },
        transformationStrength: {
          label: "Form Transformation Strength",
          description:
            "Control how strongly the selected Form transformation changes the subject's structure.",
          placeholder: "Select form transformation strength",
          options: {
            subtle: "Subtle",
            moderate: "Moderate",
            strong: "Strong",
            extreme: "Extreme",
          },
        },
        extraDetails: {
          label: "Extra Form Details",
          description:
            "Add optional form-specific instructions that are not covered by the structured fields.",
          placeholder: "Add optional form details...",
        },
        customText: {
          label: "Custom Form Output",
          description: "Overrides all Form fields when Custom mode is active.",
          placeholder: "Write a complete custom form instruction...",
        },
      },
      compatibility: {
        transformationProportionConflict:
          "This transformation pulls against the selected proportions. The combination is allowed, but may produce a less predictable hybrid form.",
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
    subjectOptionMismatch:
      "This selection is specialized for another subject type. It is preserved until you change or clear it.",
  },
  home: {
    eyebrow: "Prompt Generator",
    title: "Prompt Draft",
    description: "Build modular, schema-driven prompts using reusable key modules.",
    createPrompt: "Create Prompt",
  },
  create: {
    draft: {
      download: "Download draft",
      share: "Share draft",
      shareText: "Prompt Draft JSON export",
      importJson: "Import JSON",
      exportJson: "Export JSON",
      importModal: {
        errorTitle: "Import failed",
        errorDescription:
          "The selected JSON file is not a valid Prompt Draft export. Please choose a draft or draft collection JSON file.",
      },
      titlePlaceholder: "Draft title...",
      menu: "Drafts",
      createNew: "Create new draft",
      defaultTitle: "Draft {index}",
      delete: "Delete draft",
      deleteModal: {
        title: "Delete draft?",
        description: 'Delete "{title}" permanently? This action cannot be undone.',
        lastDraftDescription:
          'Delete "{title}" permanently? This is your only saved draft, so an empty draft will be created after deletion.',
        confirm: "Delete draft",
      },
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
    emptyOutputDescription:
      "Select modules and complete the required setup fields to generate output.",
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
      groups: {
        common: {
          label: "Common Ratios",
        },
        printCards: {
          label: "Print Cards",
        },
        printIso: {
          label: "ISO Paper Sizes",
        },
        printPosters: {
          label: "Print Posters",
        },
        social: {
          label: "Social Media",
        },
        socialBanners: {
          label: "Social Banners",
        },
        webUiAds: {
          label: "Web, UI & Ads",
        },
      },
      options: {
        a0Landscape: {
          label: "A0 Landscape",
          description:
            "Large horizontal ISO print format, suitable for oversized posters, banners, exhibition graphics, and wide display layouts.",
        },
        a0Portrait: {
          label: "A0 Portrait",
          description:
            "Large vertical ISO print format, suitable for oversized posters, signage, exhibition graphics, and premium print layouts.",
        },
        a1Landscape: {
          label: "A1 Landscape",
          description:
            "Wide A1 print format, useful for posters, presentation boards, event graphics, and large horizontal layouts.",
        },
        a1Portrait: {
          label: "A1 Portrait",
          description:
            "Vertical A1 print format, suitable for posters, announcement boards, event designs, and large promotional prints.",
        },
        a2Landscape: {
          label: "A2 Landscape",
          description:
            "Horizontal A2 print format, useful for medium-large posters, boards, menus, and promotional layouts.",
        },
        a2Portrait: {
          label: "A2 Portrait",
          description:
            "Vertical A2 print format, suitable for posters, art prints, event notices, and medium-large promotional designs.",
        },
        a3Landscape: {
          label: "A3 Landscape",
          description:
            "Horizontal A3 format, useful for posters, presentation sheets, menus, and compact display graphics.",
        },
        a3Portrait: {
          label: "A3 Portrait",
          description:
            "Vertical A3 format, suitable for posters, flyers, presentation sheets, and compact print layouts.",
        },
        a4Landscape: {
          label: "A4 Landscape",
          description:
            "Standard horizontal document format, useful for reports, sheets, presentations, and print-ready layouts.",
        },
        a4Portrait: {
          label: "A4 Portrait",
          description:
            "Standard vertical document format, suitable for documents, flyers, worksheets, and everyday print designs.",
        },
        a5Landscape: {
          label: "A5 Landscape",
          description:
            "Compact horizontal print format, useful for small cards, leaflets, invitations, and folded print designs.",
        },
        a5Portrait: {
          label: "A5 Portrait",
          description:
            "Compact vertical print format, suitable for flyers, small posters, booklet covers, and handheld print designs.",
        },
        a6Landscape: {
          label: "A6 Landscape",
          description:
            "Small horizontal print format, useful for postcards, compact flyers, coupons, and small promotional cards.",
        },
        a6Portrait: {
          description:
            "Small vertical print format, suitable for compact cards, flyers, and handheld designs.",
          label: "A6 Portrait",
        },
        albumCover: {
          label: "Album Cover",
          description:
            "Square cover format, suitable for music albums, playlist artwork, podcast covers, and visual identity graphics.",
        },
        appSplashLandscape: {
          label: "App Splash Screen Landscape",
          description:
            "Horizontal app splash screen format, useful for landscape mobile or tablet startup screens.",
        },
        appSplashPortrait: {
          label: "App Splash Screen Portrait",
          description:
            "Vertical app splash screen format, suitable for mobile startup screens, onboarding visuals, and app launch graphics.",
        },
        bookCover: {
          label: "Book Cover",
          description:
            "Vertical book cover format, suitable for novels, guides, ebooks, and editorial cover designs.",
        },
        businessCardHorizontal: {
          description:
            "Standard horizontal business card format, suitable for print-ready identity designs.",
          label: "Business Card Horizontal",
        },
        businessCardVertical: {
          label: "Business Card Vertical",
          description:
            "Vertical business card format, suitable for modern identity cards, personal branding, and compact contact layouts.",
        },
        commonCinematicWide: {
          label: "Cinematic Wide",
          description:
            "Extra-wide cinematic ratio, useful for dramatic scenes, film frames, trailers, and panoramic compositions.",
        },
        commonLandscapeFiveFour: {
          label: "Landscape 5:4",
          description:
            "Balanced 5:4 landscape ratio, suitable for editorial layouts, framed prints, and controlled horizontal compositions.",
        },
        commonLandscapeFourThree: {
          description:
            "Classic 4:3 landscape ratio, useful for presentations, editorial layouts, and general image compositions.",
          label: "Landscape 4:3",
        },
        commonPhotoLandscape: {
          label: "Photo Landscape",
          description:
            "Classic landscape photo ratio, useful for photography, product shots, travel scenes, and horizontal image layouts.",
        },
        commonPhotoPortrait: {
          label: "Photo Portrait",
          description:
            "Classic portrait photo ratio, suitable for portraits, fashion shots, product images, and vertical compositions.",
        },
        commonPortraitFourFive: {
          label: "Portrait 4:5",
          description:
            "Popular vertical 4:5 ratio, useful for social posts, portraits, product showcases, and feed-friendly layouts.",
        },
        commonPortraitThreeFour: {
          label: "Portrait 3:4",
          description:
            "Classic vertical 3:4 ratio, suitable for portraits, posters, cards, and balanced vertical designs.",
        },
        commonSquare: {
          label: "Square 1:1",
          description:
            "Simple square ratio, suitable for icons, covers, product shots, social posts, and balanced centered compositions.",
        },
        commonVertical: {
          label: "Vertical 9:16",
          description:
            "Tall vertical ratio, suitable for stories, reels, mobile-first posters, and full-screen social media layouts.",
        },
        commonWidescreen: {
          label: "Widescreen 16:9",
          description:
            "Standard widescreen ratio, useful for videos, thumbnails, presentations, banners, and horizontal compositions.",
        },
        facebookPageCover: {
          label: "Facebook Page Cover",
          description:
            "Wide Facebook page cover format, suitable for brand headers, campaign visuals, and social profile banners.",
        },
        greetingCardSquare: {
          label: "Greeting Card Square",
          description:
            "Square greeting card format, useful for celebration cards, invitations, gift notes, and social greetings.",
        },
        instagramLandscapePost: {
          label: "Instagram Landscape Post",
          description:
            "Horizontal Instagram post format, suitable for wide product shots, photography, announcements, and feed content.",
        },
        instagramPhotoPost: {
          label: "Instagram Photo Post",
          description:
            "Standard Instagram photo format, useful for clean photo posts, lifestyle images, and visual feed content.",
        },
        instagramPortraitPost: {
          label: "Instagram Portrait Post",
          description:
            "Vertical Instagram feed format, suitable for product showcases, portraits, posters, and high-impact posts.",
        },
        instagramSquarePost: {
          description:
            "Classic square Instagram post format, suitable for feed posts, product shots, and clean social layouts.",
          label: "Instagram Square Post",
        },
        instagramStoryReel: {
          label: "Instagram Story / Reel",
          description:
            "Full-screen vertical Instagram format, suitable for stories, reels, short videos, and mobile-first posters.",
        },
        invitationLandscape: {
          label: "Invitation Landscape",
          description:
            "Horizontal invitation format, useful for event cards, wedding invitations, announcements, and elegant print layouts.",
        },
        invitationPortrait: {
          label: "Invitation Portrait",
          description:
            "Vertical invitation format, suitable for event cards, wedding invitations, announcements, and formal layouts.",
        },
        leaderboardAd: {
          label: "Leaderboard Ad",
          description:
            "Wide horizontal ad format, suitable for website headers, display ads, campaign banners, and promotional placements.",
        },
        linkedinCover: {
          label: "LinkedIn Cover",
          description:
            "Wide LinkedIn cover format, useful for professional profiles, company pages, personal branding, and career visuals.",
        },
        magazineCover: {
          label: "Magazine Cover",
          description:
            "Vertical magazine cover format, suitable for editorial design, fashion covers, feature stories, and publication layouts.",
        },
        mediumRectangleAd: {
          label: "Medium Rectangle Ad",
          description:
            "Standard medium rectangle ad format, useful for web advertising, sidebar placements, and campaign creatives.",
        },
        moviePoster: {
          label: "Movie Poster",
          description:
            "Vertical movie poster format, suitable for cinematic posters, key art, event promos, and dramatic compositions.",
        },
        postcardHorizontal: {
          label: "Postcard Horizontal",
          description:
            "Horizontal postcard format, useful for travel cards, promotional mailers, greetings, and compact print designs.",
        },
        postcardVertical: {
          label: "Postcard Vertical",
          description:
            "Vertical postcard format, suitable for promotional cards, greetings, travel visuals, and compact print layouts.",
        },
        posterLandscapeFiveFour: {
          label: "Poster Landscape 5:4",
          description:
            "Landscape poster ratio with a balanced frame, suitable for art prints, announcements, and horizontal poster designs.",
        },
        posterLandscapeFourThree: {
          label: "Poster Landscape 4:3",
          description:
            "Classic landscape poster ratio, useful for event posters, presentation visuals, and wide promotional layouts.",
        },
        posterLandscapeThreeTwo: {
          label: "Poster Landscape 3:2",
          description:
            "Wide landscape poster ratio, suitable for cinematic posters, photography prints, and horizontal campaign graphics.",
        },
        posterPortraitFourFive: {
          label: "Poster Portrait 4:5",
          description:
            "Vertical poster ratio, useful for social posters, product showcases, portraits, and clean promotional layouts.",
        },
        posterPortraitThreeFour: {
          label: "Poster Portrait 3:4",
          description:
            "Balanced vertical poster ratio, suitable for event posters, editorial graphics, and print-ready compositions.",
        },
        posterPortraitTwoThree: {
          description:
            "Classic vertical poster ratio, suitable for movie posters, event posters, and printed promotional designs.",
          label: "Poster Portrait 2:3",
        },
        squareAd: {
          label: "Square Ad",
          description:
            "Square advertising format, useful for social ads, product promotions, campaign visuals, and compact ad placements.",
        },
        squareBusinessCard: {
          label: "Square Business Card",
          description:
            "Square business card format, suitable for creative identity cards, modern branding, and compact contact designs.",
        },
        tiktokShortsReels: {
          label: "TikTok / Shorts / Reels",
          description:
            "Full-screen vertical short-video format, suitable for TikTok, YouTube Shorts, Reels, and mobile-first content.",
        },
        webBannerWide: {
          label: "Wide Web Banner",
          description:
            "Wide web banner format, useful for website headers, landing sections, campaign banners, and digital promotions.",
        },
        websiteHeroUltraWide: {
          label: "Website Hero Ultra Wide",
          description:
            "Ultra-wide website hero format, suitable for immersive landing pages, large headers, and cinematic web visuals.",
        },
        websiteHeroWide: {
          description:
            "Wide website hero format, useful for landing pages, headers, and large web banners.",
          label: "Website Hero Wide",
        },
        xTwitterHeader: {
          label: "X / Twitter Header",
          description:
            "Wide X / Twitter header format, useful for profile branding, campaign headers, and social banner designs.",
        },
        youtubeChannelBanner: {
          label: "YouTube Channel Banner",
          description:
            "Wide YouTube channel banner format, suitable for channel branding, creator identity, and header artwork.",
        },
        youtubeThumbnail: {
          description:
            "Standard YouTube thumbnail format, suitable for video previews and clickable cover images.",
          label: "YouTube Thumbnail",
        },
      },
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
        description: "Control how closely the output should follow the reference image overall.",
        options: {
          strict: "Strict Reference",
          balanced: "Balanced Reference",
          loose: "Loose Inspiration",
        },
      },
      transformationStrength: {
        label: "Reference Transformation Strength",
        description:
          "Control how strongly the overall result may transform away from the reference image. This is separate from Form Transformation Strength.",
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
    subjectType: {
      label: "Subject Type",
      description:
        "Optional context used to surface relevant module controls. It is not injected into the prompt by itself.",
      options: {
        unspecified: "General / Unspecified",
        person: "Person",
        object: "Object",
        animal: "Animal",
        building: "Building / Architecture",
        product: "Product",
        vehicle: "Vehicle",
        scene: "Scene / Environment",
        typography: "Typography",
        abstract: "Abstract",
        custom: "Custom",
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
    framingPreserveCompositionConflict:
      "Framing requests a new composition or viewpoint while Setup is preserving the original composition. Review one of these settings to avoid conflicting instructions.",
    undefinedVariableReference:
      "{token} is referenced in the prompt but is not defined as an active user variable.",
    unusedVariable:
      "{token} is defined but is not currently referenced by the active prompt output.",
    texturePreserveMaterialsConflict:
      "Texture / Material requests material or surface changes while Setup is preserving the original materials and surface details. Review one of these settings to avoid conflicting instructions.",
    posePreservePoseConflict:
      "Pose requests a new body configuration while Setup is preserving the original pose. Review one of these settings to avoid conflicting instructions.",
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
  tools: {
    imageVectorizer: {
      title: "Image Vectorizer",
      subtitle:
        "Convert simple flat logos and low-color images into editable SVG paths directly in your browser.",
      empty: {
        title: "Drop a simple image here",
        description:
          "Choose a flat PNG, JPG, or WebP logo with a simple background and a limited number of colors.",
        action: "Choose image",
      },
      selected: {
        details: "{width} × {height}px · {size}",
      },
      palettePicker: {
        presets: "Current palette",
        confirm: "Apply color",
        cancel: "Cancel",
      },
      actions: {
        replace: "Replace image",
        clear: "Remove image",
        pickBackground: "Pick background",
        cancelPicker: "Cancel picker",
        autoBackground: "Use automatic color",
        download: "Download SVG",
        processing: "Building SVG...",
        editPaletteColor: "Change {color}",
        keepCurrentImage: "Keep current image",
        replaceWithClipboard: "Replace with clipboard",
        processingImage: "Building PNG...",
        downloadPng: "Download PNG",
      },
      contextMenu: {
        downloadSvg: "Download SVG",
        copySvg: "Copy SVG code",
        downloadPng: "Download reduced-color PNG",
        copyPng: "Copy reduced-color PNG",
        pasteImage: "Paste image",
        removeImage: "Remove image",
        copyConfig: "Copy configuration",
        pasteConfig: "Paste configuration",
      },
      controls: {
        maxColors: "Maximum colors",
        maxColorsHint:
          "The output palette is reduced to this number unless strict mode is enabled.",
        colorTolerance: "Color tolerance",
        colorToleranceHint:
          "Higher values merge nearby JPEG and anti-aliasing colors more aggressively.",
        strictColorLimit: "Reject images above the color limit",
        strictColorLimitHint:
          "When enabled, processing stops instead of reducing an image with too many detected colors.",
        removeBackground: "Remove background",
        trimCanvas: "Trim canvas to content",
        trimCanvasHint: "Disable this option to preserve the original canvas dimensions.",
        padding: "Output padding",
        minRegionSize: "Minimum region size",
        minRegionSizeHint:
          "Small isolated regions below this scale are treated as compression noise.",
        smooth: "Path smoothness",
        smoothHint:
          "Analyzes straight lines, curves, and protected corners separately. Higher values clean curves and stair-step edges without rounding intentional breaks.",
        edgeCleanup: "Edge Cleanup",
        edgeCleanupHint: "Clean thin leftover pixels and light halos around traced edges.",
        removeEnclosedBackground: "Remove Enclosed Background",
        removeEnclosedBackgroundHint:
          "Remove background-colored areas trapped inside shapes, such as holes, gaps, and enclosed regions.",
        refineSvg: "Refine SVG",
        refineSvgHint:
          "Apply an extra SVG-level refinement pass to reduce tiny gaps between traced regions. This can be slower on complex images.",
        enhanceLowRes: "Enhance Low-Res Images",
        enhanceLowResHint:
          "Improve small or low-resolution images before vectorization to recover cleaner shapes and edges.",
        lowResRecovery: "Low-Res Recovery",
        lowResRecoveryHint:
          "Control how strongly the tool tries to rebuild lost detail before tracing the image.",
        lowResScale: "Low-Res Scale",
        lowResScaleHint:
          "Upscale low-resolution input before tracing. Higher values may improve shape recovery but can be slower.",
        smoothMode: "Smooth stage",
        smoothModeHint:
          "Choose whether smoothing runs before downscaling, after downscaling, or in both stages when low-res enhancement is enabled.",
        mode: "Tool mode",
        refineImage: "Refine image",
        refineImageHint:
          "Fill narrow raster gaps and attach isolated seam pixels to their dominant neighboring regions.",
        edgeSmooth: "Edge smoothness",
        edgeSmoothHint:
          "Smooth stair-step raster boundaries without blending the indexed colors together.",
      },
      values: {
        colors: "{count} colors",
        auto: "Auto",
        smoothMode: {
          pre: "Pre smooth",
          post: "Post smooth",
          both: "Both",
        },
        mode: {
          vectorize: "Vectorize",
          upscale: "Upscale",
        },
      },
      preview: {
        original: "Original",
        quantized: "Reduced-color preview",
        vector: "SVG preview",
        empty: "No image selected",
        pending: "The preview will appear after processing.",
        pickHint: "Click the background color in the original image.",
        upscaled: "Upscaled preview",
      },
      result: {
        palette: "Detected palette",
        details: "SVG: {width} × {height}px · {colors} colors · {regions} regions",
        optimization: "Path points reduced from {before} to {after} ({percent}%).",
        upscaleDetails: "PNG: {width} × {height}px · {colors} colors · {regions} regions",
        outputColors: "{count} output colors",
      },
      status: {
        loading: "Loading image...",
        processing: "Analyzing colors and tracing paths...",
        ready: "SVG preview is ready.",
        svgCopied: "SVG code copied to the clipboard.",
        pngCopied: "Reduced-color PNG copied to the clipboard.",
        configCopied: "Vectorizer configuration copied to the clipboard.",
        configPasted: "Vectorizer configuration applied.",
        upscaleReady: "The upscaled PNG is ready.",
      },
      messages: {
        unsupportedFile: "Choose a supported PNG, JPG, WebP, GIF, BMP, or AVIF image.",
        colorLimitTitle: "Too many colors detected",
        colorLimitExceeded:
          "This image contains about {detected} color groups, above the selected limit of {max}. Increase color tolerance or the maximum color count, disable strict mode, or choose a simpler image.",
        processingFailed:
          "The image could not be vectorized. Try a simpler image, increase color tolerance, or reduce the input dimensions.",
        clipboardUnavailable: "Clipboard access for this action is not supported by this browser.",
        clipboardPermissionDenied:
          "Clipboard permission was denied. Allow clipboard access and try again.",
        clipboardWriteFailed: "The output could not be copied to the clipboard.",
        clipboardReadFailed: "The clipboard could not be read.",
        noClipboardImage: "The clipboard does not contain an image.",
        invalidConfig: "The clipboard does not contain a valid Image Vectorizer configuration.",
        replaceClipboardImageTitle: "Replace current image?",
        replaceClipboardImageConfirm:
          "Pasting a new clipboard image will replace the current source image and its current result.",
      },
      progress: {
        preparing: "Preparing...",
        enhancing: "Enhancing image...",
        quantizing: "Quantizing colors...",
        background: "Detecting background...",
        regions: "Building regions...",
        tracing: "Tracing shapes...",
        svg: "Generating SVG...",
        preview: "Rendering preview...",
        finalizing: "Finalizing...",
        refiningImage: "Refining raster regions...",
        smoothingEdges: "Smoothing raster edges...",
      },
    },
    imageConverter: {
      title: "Image Converter",
      subtitle: "Upload images, choose output settings, and download all converted files as a ZIP.",
      empty: {
        title: "Drop images here",
        description: "Drag and drop images into this area, or choose files from your device.",
        action: "Choose images",
      },
      selected: {
        count: "{count} selected files",
        totalSize: "Total size: {size}",
      },
      actions: {
        addMore: "Add more files",
        clearAll: "Remove all",
        viewFiles: "View files",
        download: "Download ZIP",
        downloading: "Preparing ZIP...",
      },
      controls: {
        format: "Output format",
        quality: "Output quality",
      },
      formats: {
        jpg: "JPG",
        webp: "WebP",
      },
      qualityPercent: "{quality}%",
      status: {
        converting: "Converting images...",
        zipping: "Building ZIP file...",
        completed: "Done. Your ZIP download has started.",
        completedWithErrors: "Done, but {count} file(s) could not be converted.",
      },
      messages: {
        noFiles: "Choose at least one image first.",
        noImageFiles: "No supported image files were selected.",
        exportFailed:
          "Could not convert the selected images. Try different files or a lower batch size.",
      },
      preview: {
        title: "Selected images",
        subtitle: "Remove any image you do not want to include in the conversion.",
        empty: "No selected images left.",
        remove: "Remove image",
      },
      optimization: {
        increased: "Size increased by {percent}% · {inputSize} → {outputSize}",
        reduced: "Size reduced by {percent}% · {inputSize} → {outputSize}",
        unchanged: "Output size is nearly unchanged · {inputSize} → {outputSize}",
      },
    },
    about: {
      title: "About Prompt Draft",
      subtitle: "A compact overview of this app.",
      version: "Version {version}",
      description:
        "Prompt Draft is a modular prompt-building workspace for creating structured image-generation prompts with reusable modules, variables, draft management, and small utility tools for daily creative workflows.",
    },
  },
  components: {
    contextMenu: {
      groups: {
        draft: "Draft",
        copy: "Copy",
        variables: "Variables",
      },
      actions: {
        expand: "Expand",
        collapse: "Collapse",
        resetSettings: "Reset settings",
        enableCustomize: "Customize",
        disableCustomize: "Disable customize",
        copyOutput: "Copy output",
        removeFromKeyModules: "Remove from key modules",
        showVariables: "Show variables",
        refreshPage: "Refresh page",
        reset: "Reset",
      },
    },
    modal: {
      insertVariable: "Insert variable",
      actions: {
        close: "Close",
        cancel: "Cancel",
      },
      title: {
        insertVariable: "Insert Variable",
        insertVariableSubtitle: "Choose a variable and insert it into the active prompt field.",
      },
    },
    assignmentScope: {
      groups: {
        general: "General",
        moduleOutputs: "Linked Module Outputs",
        typographyGroups: "Typography Groups",
        typographyTexts: "Typography Texts",
        userVariables: "User Subject / Object Variables",
        missing: "Missing References",
        moduleEntities: "Linked Module Entities",
      },
      linkedModuleDescription: "Linked module output",
      missing: "Missing",
      applyTo: "Apply To",
      applyPlaceholder: "Select targets",
      customTargets: "Custom Targets",
      customTargetPlaceholder: "Example: dragon costume scales",
      addTarget: "Add custom target",
      except: "Except",
      exceptionPlaceholder: "Select exceptions",
      customExceptions: "Custom Exceptions",
      customExceptionPlaceholder: "Example: buttons or shoe laces",
      addException: "Add exception",
      remove: "Remove",
      missingHelp:
        "Some referenced targets no longer exist. They remain preserved until you remove them.",
      missingExceptionHelp:
        "Some referenced exceptions no longer exist. They remain preserved until you remove them.",
    },
    subjectAssignmentTargets: {
      groups: {
        systemSubject: "Main Subject",
        userSubjects: "User Subject Variables",
        missing: "Missing References",
      },
      mainSubject: "Main Subject",
      missing: "Missing",
    },
    colorPicker: {
      aria: {
        saturationBrightness: "Color saturation and brightness",
      },
    },
  },
  prompts: {
    title: "Prompt archive",
    description: "Browse prompts published on the Prompt Draft Telegram channel.",
    total: "{count} prompts",
    results: "{count} results",
    loading: "Loading prompt archive...",
    search: {
      placeholder: "Search title, prompt, tag or ID...",
    },
    filters: {
      model: "Model",
      tag: "Tag",
      sort: "Sort",
      allModels: "All models",
      allTags: "All tags",
      clear: "Clear filters",
    },
    sort: {
      newest: "Newest first",
      oldest: "Oldest first",
    },
    models: {
      dallE: "DALL·E",
      gptImage1: "GPT-Image-1",
    },
    card: {
      noPreview: "No preview",
      imageCount: "{count} images",
    },
    actions: {
      telegram: "View on Telegram",
      view: "View prompt",
    },
    empty: {
      title: "No prompts found",
      description: "Try a different search term or clear the active filters.",
    },
    error: {
      title: "Could not load the prompt archive",
      retry: "Try again",
    },
    loadMore: "Load more ({count} remaining)",
    view: {
      grid: "Grid view",
      list: "List view",
    },
    items: {
      "6": {
        title: "Melancholic Expressionist Portrait",
      },
      "14": {
        title: "Childlike Hand-Drawn Troll Meme",
      },
      "20": {
        title: "Pop-Surreal Sculpture Portrait",
      },
      "26": {
        title: "3D Gothic Character",
      },
      "31": {
        title: "Retro-Futurist Resin Sculpture",
      },
      "39": {
        title: "Graffiti Copper Sculpture",
      },
      "51": {
        title: "Surreal Fashion Art Doll",
      },
      "60": {
        title: "Gothic 2D Animation",
      },
      "66": {
        title: "Fashion Plaster Bust",
      },
      "70": {
        title: "Cinematic Painted 3D Character",
      },
      "83": {
        title: "Coraline-Style Stop-Motion",
      },
      "90": {
        title: "Colorful Resin Sculpture",
      },
      "96": {
        title: "Gothic Raven Portrait",
      },
      "104": {
        title: "3D Minecraft Character",
      },
      "115": {
        title: "1950s Advertising Poster",
      },
      "120": {
        title: "1950s Magazine Portrait",
      },
      "130": {
        title: "Dystopian Anime Portrait",
      },
      "137": {
        title: "Neon Cyberpunk Man",
      },
      "143": {
        title: "Neon Cyberpunk Woman",
      },
      "149": {
        title: "3D LEGO World",
      },
      "156": {
        title: "Mysterious Horned Character",
      },
      "165": {
        title: "The Rings of Power Poster",
      },
      "172": {
        title: "Victorian Gothic Portrait",
      },
      "177": {
        title: "Male Victorian Gothic Portrait",
      },
      "182": {
        title: "Family Guy Portrait",
      },
      "189": {
        title: "South Park Paper Character",
      },
      "197": {
        title: "Rick and Morty Character",
      },
      "203": {
        title: "Clash Royale Archer Queen",
      },
      "208": {
        title: "Realistic Archer Queen",
      },
      "217": {
        title: "Cinematic 3D Gothic Character",
      },
      "224": {
        title: "GeoToon Geometric Character",
      },
      "230": {
        title: "Pastel Fantasy 3D Character",
      },
      "238": {
        title: "3D Medusa Character",
      },
      "244": {
        title: "Spirited Away Anime Style",
      },
      "249": {
        title: "GTA San Andreas Poster",
      },
      "254": {
        title: "Imam Reza Shrine Souvenir Portrait",
      },
      "260": {
        title: "GTA VI Poster",
      },
      "265": {
        title: "Full-Body Wolfwalkers Character",
      },
      "271": {
        title: "Wolfwalkers Portrait",
      },
      "277": {
        title: "Red Dead Redemption Poster",
      },
      "284": {
        title: "Red Dead Redemption II Character",
      },
      "291": {
        title: "Studio Pet Portrait",
      },
      "299": {
        title: "Cartoon Resin Sculpture",
      },
      "307": {
        title: "Neon Graffiti Avatar",
      },
      "313": {
        title: "Iranian 3×4 ID Photo",
      },
      "321": {
        title: "64-Bit Pixel Avatar",
      },
      "328": {
        title: "Full-Body 32-Bit Pixel Character",
      },
      "333": {
        title: "Studio Passport Photo",
      },
      "341": {
        title: "Pastel Flat Avatar",
      },
      "351": {
        title: "Elongated Clay Figurine",
      },
      "357": {
        title: "Resin Sculpture Close-Up",
      },
      "371": {
        title: "Style-Matched Santa Hat",
      },
      "378": {
        title: "Full Santa Makeover",
      },
      "386": {
        title: "Ceramic Object from a Child's Sketch",
      },
      "387": {
        title: "Add a Partner to Photo",
      },
      "401": {
        title: "Custom Realistic Scene",
      },
      "409": {
        title: "Live-Action Vintage Cartoon Character",
      },
      "413": {
        title: "Live-Action Tom & Jerry Style",
      },
      "416": {
        title: "Professional LinkedIn Headshot",
      },
      "419": {
        title: "Professional YouTube Thumbnail",
      },
      "426": {
        title: "3D Punk Character",
      },
      "429": {
        title: "Distorted Geometric 2D Character",
      },
      "430": {
        title: "Grotesque Caricature Sculpture",
      },
      "434": {
        title: "Geometric Pen-and-Ink Illustration",
      },
      "435": {
        title: "Surreal Childlike Drawing",
      },
      "439": {
        title: "Realistic Organic Surreal Portrait",
      },
      "441": {
        title: "Vogue Magazine Cover",
      },
      "443": {
        title: "Extreme Bodybuilder Portrait",
      },
      "445": {
        title: "E-Commerce Product Photo",
      },
      "449": {
        title: "Product Advertising Poster",
      },
      "451": {
        title: "Felt Marionette Doll",
      },
      "452": {
        title: "Virtual Clothing Try-On",
      },
      "457": {
        title: "Personalized Cinematic Poster",
      },
      "461": {
        title: "3D Fashion Caricature",
      },
      "465": {
        title: "Crouching 2D Pixel Character",
      },
      "466": {
        title: "Cinematic CGI Portrait",
      },
      "467": {
        title: "Book Cover from Text",
      },
      "468": {
        title: "Japanese Street-Art Poster",
      },
      "473": {
        title: "Handcrafted Bamboo Sculpture",
      },
      "474": {
        title: "Watercolor Cartoon Character",
      },
      "475": {
        title: "Studio 3D Cartoon Character",
      },
      "476": {
        title: "Wallace & Gromit Claymation Character",
      },
      "477": {
        title: "Claymation Mirror Selfie",
      },
      "478": {
        title: "Overhead Candid Portrait",
      },
      "479": {
        title: "Aluminum One Piece Character",
      },
      "481": {
        title: "One Piece Magic Fruit Poster",
      },
      "482": {
        title: "Elongated Pop-Art Character",
      },
      "485": {
        title: "Selfie in a Reference Location",
      },
      "486": {
        title: "Object-Filled Pool Fashion Editorial",
      },
      "487": {
        title: "Paparazzi Window Portrait",
      },
      "490": {
        title: "3×3 Expression Test Grid",
      },
      "492": {
        title: "3×3 Expression & Hairstyle Grid",
      },
      "497": {
        title: "Everyday Life in a Historical Era",
      },
      "501": {
        title: "Couple Walking Through Flowers",
      },
      "502": {
        title: "Classic 80s–90s Anime",
      },
      "503": {
        title: "Persian Miniature Poster",
      },
      "506": {
        title: "Fine-Art Butterfly Portrait",
      },
      "507": {
        title: "Personalized Tarot Card",
      },
      "510": {
        title: "Casual Two-Person Portrait",
      },
      "511": {
        title: "Natural LinkedIn Portrait",
      },
    },
    detail: {
      back: "Back to prompts",
      primaryVersion: "Main prompt",
      previewCount: "{count} previews",
      readyToUse: "Ready to use",
      copyPrompt: "Copy prompt",
      copied: "Copied",
      openTelegram: "Open in Telegram",
      explorePrompt: "Explore prompt",
      promptEyebrow: "PROMPT DNA",
      promptTitle: "The prompt, ready to use",
      promptDescription:
        "Copy the prompt as-is, switch between available versions, or use it as a starting point for your own variation.",
      promptLabel: "PROMPT",
      modelNote: "Preview generated with {model}",
      previous: "Previous prompt",
      next: "Next prompt",
      notFoundTitle: "Prompt not found",
      notFoundDescription: "This prompt ID does not exist in the current archive.",
    },
  },
}
