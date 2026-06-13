import type { PromptKeyModule } from "./types";

const expressionStyleOptions = [
  // Neutral / Controlled Expression
  {
    value: "neutral_calm_expression",
    category: "neutral_controlled",
    categoryLabel: "Neutral / Controlled Expression",
    promptText:
      "the expression must remain calm and controlled. Neutral facial muscles, relaxed eyes, natural mouth position, and a clean identity-safe facial presence with no exaggerated emotion.",
    tags: ["expression", "neutral", "calm", "controlled"],
  },
  {
    value: "soft_natural_expression",
    category: "neutral_controlled",
    categoryLabel: "Neutral / Controlled Expression",
    promptText:
      "the expression must feel soft and natural. Keep the face relaxed, the mouth subtle, the eyes gentle, and the overall emotional tone understated and realistic.",
    tags: ["expression", "soft", "natural", "subtle"],
  },
  {
    value: "serious_neutral_face",
    category: "neutral_controlled",
    categoryLabel: "Neutral / Controlled Expression",
    promptText:
      "the expression must stay serious but neutral. Keep the mouth composed, the eyes focused, and the face emotionally restrained without becoming aggressive or overly dramatic.",
    tags: ["expression", "serious", "neutral", "restrained"],
  },
  {
    value: "relaxed_subtle_expression",
    category: "neutral_controlled",
    categoryLabel: "Neutral / Controlled Expression",
    promptText:
      "the expression must feel relaxed and subtle. Use minimal facial tension, soft eye behavior, and a quiet approachable presence with no exaggerated emotional display.",
    tags: ["expression", "relaxed", "subtle", "approachable"],
  },
  {
    value: "controlled_professional_expression",
    category: "neutral_controlled",
    categoryLabel: "Neutral / Controlled Expression",
    promptText:
      "the expression must feel professional and controlled. Keep the face composed, the emotion refined, and the overall expression polished, readable, and suitable for portrait or commercial presentation.",
    tags: ["expression", "professional", "controlled", "polished"],
  },
  {
    value: "minimal_emotional_expression",
    category: "neutral_controlled",
    categoryLabel: "Neutral / Controlled Expression",
    promptText:
      "the expression must show minimal emotion. Keep the face readable and stable, with restrained mouth movement, subtle eye behavior, and a low-intensity emotional presence.",
    tags: ["expression", "minimal", "restrained", "low-intensity"],
  },

  // Positive / Friendly Expression
  {
    value: "gentle_smile",
    category: "positive_friendly",
    categoryLabel: "Positive / Friendly Expression",
    promptText:
      "the expression must include a gentle smile. Keep the mouth soft and friendly, the eyes relaxed, and the overall emotional tone warm, approachable, and natural.",
    tags: ["expression", "smile", "gentle", "friendly"],
  },
  {
    value: "warm_friendly_smile",
    category: "positive_friendly",
    categoryLabel: "Positive / Friendly Expression",
    promptText:
      "the expression must feel warm and friendly. Use a welcoming smile, approachable eyes, pleasant facial energy, and an open emotional tone without becoming exaggerated.",
    tags: ["expression", "warm", "friendly", "smile"],
  },
  {
    value: "playful_smile",
    category: "positive_friendly",
    categoryLabel: "Positive / Friendly Expression",
    promptText:
      "the expression must feel playful and light. Use a lively smile, slightly mischievous or fun facial energy, and a cheerful approachable emotional tone.",
    tags: ["expression", "playful", "smile", "light"],
  },
  {
    value: "confident_smile",
    category: "positive_friendly",
    categoryLabel: "Positive / Friendly Expression",
    promptText:
      "the expression must feel confident and positive. Use a composed smile, self-assured eyes, and a clear friendly presence with polished emotional control.",
    tags: ["expression", "confident", "smile", "positive"],
  },
  {
    value: "joyful_expression",
    category: "positive_friendly",
    categoryLabel: "Positive / Friendly Expression",
    promptText:
      "the expression must feel joyful and emotionally bright. Show visible happiness through the eyes and mouth, while keeping the face readable and visually appealing.",
    tags: ["expression", "joyful", "happy", "bright"],
  },
  {
    value: "cheerful_approachable_expression",
    category: "positive_friendly",
    categoryLabel: "Positive / Friendly Expression",
    promptText:
      "the expression must feel cheerful and approachable. Use pleasant facial openness, positive mouth shape, and a friendly inviting emotional tone that feels socially warm.",
    tags: ["expression", "cheerful", "approachable", "friendly"],
  },

  // Dramatic / Serious Expression
  {
    value: "intense_serious_stare",
    category: "dramatic_serious",
    categoryLabel: "Dramatic / Serious Expression",
    promptText:
      "the expression must feel intense and serious. Use focused eyes, controlled mouth tension, and strong facial presence with a clear dramatic emotional weight.",
    tags: ["expression", "intense", "serious", "dramatic"],
  },
  {
    value: "focused_determined_expression",
    category: "dramatic_serious",
    categoryLabel: "Dramatic / Serious Expression",
    promptText:
      "the expression must feel focused and determined. Keep the eyes locked in, the mouth controlled, and the face emotionally committed to a clear goal or inner resolve.",
    tags: ["expression", "focused", "determined", "resolved"],
  },
  {
    value: "dramatic_cinematic_gaze",
    category: "dramatic_serious",
    categoryLabel: "Dramatic / Serious Expression",
    promptText:
      "the expression must feel cinematic and emotionally charged. Use strong eye focus, subtle dramatic facial tension, and a visually powerful serious mood.",
    tags: ["expression", "cinematic", "dramatic", "gaze"],
  },
  {
    value: "stern_powerful_expression",
    category: "dramatic_serious",
    categoryLabel: "Dramatic / Serious Expression",
    promptText:
      "the expression must feel stern and powerful. Keep the mouth firm, the eyes authoritative, and the overall face controlled with strong commanding presence.",
    tags: ["expression", "stern", "powerful", "authoritative"],
  },
  {
    value: "mysterious_restrained_expression",
    category: "dramatic_serious",
    categoryLabel: "Dramatic / Serious Expression",
    promptText:
      "the expression must feel mysterious and restrained. Use minimal overt emotion, controlled facial tension, unreadable calm, and a subtle sense of emotional distance.",
    tags: ["expression", "mysterious", "restrained", "calm"],
  },
  {
    value: "melancholic_serious_face",
    category: "dramatic_serious",
    categoryLabel: "Dramatic / Serious Expression",
    promptText:
      "the expression must feel serious with melancholic undertone. Keep the face calm but emotionally heavy, with thoughtful eyes and subtle sadness in the mouth and brows.",
    tags: ["expression", "melancholic", "serious", "emotional"],
  },

  // Angry / Aggressive Expression
  {
    value: "angry_intense_expression",
    category: "angry_aggressive",
    categoryLabel: "Angry / Aggressive Expression",
    promptText:
      "the expression must feel angry and intense. Use tensed facial muscles, focused eyes, strong brow pressure, and a confrontational emotional presence.",
    tags: ["expression", "angry", "intense", "confrontational"],
  },
  {
    value: "furious_shouting_expression",
    category: "angry_aggressive",
    categoryLabel: "Angry / Aggressive Expression",
    promptText:
      "the expression must feel furious and explosive. Use open-mouth shouting energy, highly active facial tension, aggressive eyes, and strong emotional force.",
    tags: ["expression", "furious", "shouting", "explosive"],
  },
  {
    value: "aggressive_confrontational_face",
    category: "angry_aggressive",
    categoryLabel: "Angry / Aggressive Expression",
    promptText:
      "the expression must feel aggressive and confrontational. Keep the face challenging, the eyes direct, the mouth tense, and the emotional tone clearly combative.",
    tags: ["expression", "aggressive", "confrontational", "challenging"],
  },
  {
    value: "gritted_teeth_expression",
    category: "angry_aggressive",
    categoryLabel: "Angry / Aggressive Expression",
    promptText:
      "the expression must emphasize gritted-teeth intensity. Use tight jaw tension, pressured facial muscles, and a forceful emotionally charged facial structure.",
    tags: ["expression", "gritted-teeth", "tense", "forceful"],
  },
  {
    value: "battle_ready_expression",
    category: "angry_aggressive",
    categoryLabel: "Angry / Aggressive Expression",
    promptText:
      "the expression must feel battle-ready and fierce. Keep the eyes alert, the face tense, and the emotional tone prepared for conflict or action.",
    tags: ["expression", "battle-ready", "fierce", "alert"],
  },
  {
    value: "outraged_protest_expression",
    category: "angry_aggressive",
    categoryLabel: "Angry / Aggressive Expression",
    promptText:
      "the expression must feel outraged and vocal. Use strong brows, emotionally charged mouth shape, and clear visible frustration or protest-driven anger.",
    tags: ["expression", "outraged", "protest", "frustration"],
  },

  // Sad / Vulnerable Expression
  {
    value: "sad_emotional_expression",
    category: "sad_vulnerable",
    categoryLabel: "Sad / Vulnerable Expression",
    promptText:
      "the expression must feel sad and emotionally affected. Use softened eyes, subtle downward mouth tension, and a visible melancholic emotional tone.",
    tags: ["expression", "sad", "emotional", "melancholic"],
  },
  {
    value: "quiet_melancholic_expression",
    category: "sad_vulnerable",
    categoryLabel: "Sad / Vulnerable Expression",
    promptText:
      "the expression must feel quiet and melancholic. Keep the face restrained, the eyes emotionally heavy, and the overall mood introspective and subdued.",
    tags: ["expression", "quiet", "melancholic", "subdued"],
  },
  {
    value: "vulnerable_soft_expression",
    category: "sad_vulnerable",
    categoryLabel: "Sad / Vulnerable Expression",
    promptText:
      "the expression must feel vulnerable and soft. Use gentle facial tension, emotional openness, and a delicate readable fragility in the eyes and mouth.",
    tags: ["expression", "vulnerable", "soft", "fragile"],
  },
  {
    value: "tearful_emotional_face",
    category: "sad_vulnerable",
    categoryLabel: "Sad / Vulnerable Expression",
    promptText:
      "the expression must feel tearful and emotionally overwhelmed. Use moist or tear-filled eyes, visible emotional strain, and a face that clearly communicates sadness.",
    tags: ["expression", "tearful", "emotional", "sad"],
  },
  {
    value: "lonely_distant_gaze",
    category: "sad_vulnerable",
    categoryLabel: "Sad / Vulnerable Expression",
    promptText:
      "the expression must feel lonely and distant. Keep the face quiet, the emotional tone withdrawn, and the eyes carrying a sense of separation or solitude.",
    tags: ["expression", "lonely", "distant", "withdrawn"],
  },
  {
    value: "heartbroken_expression",
    category: "sad_vulnerable",
    categoryLabel: "Sad / Vulnerable Expression",
    promptText:
      "the expression must feel heartbroken and deeply emotional. Use strong sadness in the eyes and mouth, visible emotional heaviness, and clear vulnerable facial storytelling.",
    tags: ["expression", "heartbroken", "emotional", "heavy"],
  },

  // Surprised / Shocked Expression
  {
    value: "surprised_wide_eyed_expression",
    category: "surprised_shocked",
    categoryLabel: "Surprised / Shocked Expression",
    promptText:
      "the expression must show surprise clearly. Use wide eyes, raised brows, and an alert facial reaction with high readability and emotional immediacy.",
    tags: ["expression", "surprised", "wide-eyed", "alert"],
  },
  {
    value: "shocked_exaggerated_face",
    category: "surprised_shocked",
    categoryLabel: "Surprised / Shocked Expression",
    promptText:
      "the expression must feel shocked and exaggerated. Use heightened facial tension, widened eyes, open mouth, and strong visible reaction energy.",
    tags: ["expression", "shocked", "exaggerated", "reaction"],
  },
  {
    value: "confused_startled_expression",
    category: "surprised_shocked",
    categoryLabel: "Surprised / Shocked Expression",
    promptText:
      "the expression must feel startled and confused. Use a mixed reaction of surprise and uncertainty, with readable eyes, brows, and mouth tension.",
    tags: ["expression", "confused", "startled", "uncertain"],
  },
  {
    value: "dramatic_gasp_expression",
    category: "surprised_shocked",
    categoryLabel: "Surprised / Shocked Expression",
    promptText:
      "the expression must feel like a dramatic gasp. Use open-mouth surprise, heightened eye visibility, and strong instant reaction energy with theatrical clarity.",
    tags: ["expression", "gasp", "dramatic", "surprise"],
  },
  {
    value: "comic_disbelief_expression",
    category: "surprised_shocked",
    categoryLabel: "Surprised / Shocked Expression",
    promptText:
      "the expression must show disbelief in a readable comic way. Use reactive brows, surprised eyes, and exaggerated facial questioning or astonishment.",
    tags: ["expression", "comic", "disbelief", "astonishment"],
  },
  {
    value: "overwhelmed_reaction_face",
    category: "surprised_shocked",
    categoryLabel: "Surprised / Shocked Expression",
    promptText:
      "the expression must feel emotionally overwhelmed. Use strong visible reaction, widened facial openness, and a heightened sense of surprise or overload.",
    tags: ["expression", "overwhelmed", "reaction", "heightened"],
  },

  // Comic / Grotesque Expression
  {
    value: "grotesque_comic_grin",
    category: "comic_grotesque",
    categoryLabel: "Comic / Grotesque Expression",
    promptText:
      "the expression must follow grotesque comic exaggeration. Use an overstated grin, exaggerated facial tension, humorous distortion, and a satirical personality-driven facial energy.",
    tags: ["expression", "grotesque", "comic", "grin"],
  },
  {
    value: "awkward_humorous_expression",
    category: "comic_grotesque",
    categoryLabel: "Comic / Grotesque Expression",
    promptText:
      "the expression must feel awkward and humorous. Use unusual facial balance, slightly uncomfortable emotional energy, and a clearly comedic personality-driven face.",
    tags: ["expression", "awkward", "humorous", "comic"],
  },
  {
    value: "exaggerated_goofy_face",
    category: "comic_grotesque",
    categoryLabel: "Comic / Grotesque Expression",
    promptText:
      "the expression must feel goofy and exaggerated. Use playful distortion, exaggerated mouth or eyes, and a strong silly visual personality.",
    tags: ["expression", "goofy", "exaggerated", "silly"],
  },
  {
    value: "satirical_smug_expression",
    category: "comic_grotesque",
    categoryLabel: "Comic / Grotesque Expression",
    promptText:
      "the expression must feel smug in a satirical way. Use asymmetrical mouth energy, knowing eyes, and a slightly mocking humorous emotional presence.",
    tags: ["expression", "satirical", "smug", "mocking"],
  },
  {
    value: "distorted_theatrical_expression",
    category: "comic_grotesque",
    categoryLabel: "Comic / Grotesque Expression",
    promptText:
      "the expression must feel theatrically distorted. Use strong visible exaggeration in the brows, eyes, or mouth, with stage-like emotional overstatement and graphic readability.",
    tags: ["expression", "distorted", "theatrical", "graphic"],
  },
  {
    value: "absurd_caricature_expression",
    category: "comic_grotesque",
    categoryLabel: "Comic / Grotesque Expression",
    promptText:
      "the expression must follow absurd caricature logic. Exaggerate key facial features, push emotional readability, and create a bizarre but recognizable humorous face.",
    tags: ["expression", "absurd", "caricature", "humorous"],
  },

  // Cute / Chibi Expression
  {
    value: "adorable_happy_face",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Expression",
    promptText:
      "the expression must feel adorable and happy. Use soft rounded facial energy, bright eyes, simple mouth shape, and a clearly lovable emotional tone.",
    tags: ["expression", "cute", "happy", "adorable"],
  },
  {
    value: "innocent_wide_eyed_expression",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Expression",
    promptText:
      "the expression must feel innocent and wide-eyed. Keep the eyes open and gentle, the face soft, and the emotional presence pure, simple, and approachable.",
    tags: ["expression", "cute", "innocent", "wide-eyed"],
  },
  {
    value: "tiny_shy_smile",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Expression",
    promptText:
      "the expression must feel shy and sweet. Use a very small smile, soft eye behavior, and gentle facial energy that feels delicate and endearing.",
    tags: ["expression", "cute", "shy", "sweet"],
  },
  {
    value: "cute_excited_expression",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Expression",
    promptText:
      "the expression must feel cute and excited. Use lively eyes, an enthusiastic small mouth shape, and an energetic but adorable facial mood.",
    tags: ["expression", "cute", "excited", "energetic"],
  },
  {
    value: "soft_sleepy_expression",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Expression",
    promptText:
      "the expression must feel soft and sleepy. Use relaxed eyes, low facial tension, and a gentle drowsy emotional tone with calm cute appeal.",
    tags: ["expression", "cute", "sleepy", "soft"],
  },
  {
    value: "mascot_friendly_expression",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Expression",
    promptText:
      "the expression must feel mascot-friendly and universally appealing. Use simple readable facial features, warm positivity, and a charming emotionally approachable face.",
    tags: ["expression", "cute", "mascot", "friendly"],
  },

  // Editorial / Fashion Expression
  {
    value: "cool_detached_gaze",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Expression",
    promptText:
      "the expression must feel cool and emotionally detached. Use controlled facial restraint, confident eyes, and a refined fashion-oriented attitude with minimal overt emotion.",
    tags: ["expression", "editorial", "cool", "detached"],
  },
  {
    value: "confident_editorial_stare",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Expression",
    promptText:
      "the expression must feel editorial and confident. Use strong eye presence, subtle mouth control, and a polished high-style emotional restraint suitable for fashion imagery.",
    tags: ["expression", "editorial", "confident", "fashion"],
  },
  {
    value: "elegant_subtle_expression",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Expression",
    promptText:
      "the expression must feel elegant and subtle. Keep emotion refined, the facial tension minimal but intentional, and the overall impression polished and sophisticated.",
    tags: ["expression", "editorial", "elegant", "subtle"],
  },
  {
    value: "aloof_fashion_expression",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Expression",
    promptText:
      "the expression must feel aloof and fashion-forward. Use emotional distance, poised facial control, and a composed high-style attitude with strong visual identity.",
    tags: ["expression", "editorial", "aloof", "fashion"],
  },
  {
    value: "luxury_calm_expression",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Expression",
    promptText:
      "the expression must feel calm, luxurious, and refined. Keep the face highly controlled, the emotion subtle, and the overall mood polished and upscale.",
    tags: ["expression", "luxury", "calm", "refined"],
  },
  {
    value: "dramatic_model_face",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Expression",
    promptText:
      "the expression must feel like a dramatic model face. Use strong visual presence, composed emotional restraint, and refined intensity suited for editorial portraiture.",
    tags: ["expression", "editorial", "model", "dramatic"],
  },

  // Fantasy / Creature Expression
  {
    value: "mysterious_creature_gaze",
    category: "fantasy_creature",
    categoryLabel: "Fantasy / Creature Expression",
    promptText:
      "the expression must feel mysterious and creature-like. Use unusual eye focus, subtle emotional ambiguity, and a strange but readable nonhuman facial presence.",
    tags: ["expression", "fantasy", "creature", "mysterious"],
  },
  {
    value: "predatory_focused_expression",
    category: "fantasy_creature",
    categoryLabel: "Fantasy / Creature Expression",
    promptText:
      "the expression must feel predatory and focused. Use intense eyes, alert facial tension, and a controlled nonhuman aggression with strong instinctive presence.",
    tags: ["expression", "fantasy", "predatory", "focused"],
  },
  {
    value: "ancient_wise_expression",
    category: "fantasy_creature",
    categoryLabel: "Fantasy / Creature Expression",
    promptText:
      "the expression must feel ancient and wise. Use calm but deep eye presence, restrained mouth tension, and a facial mood that suggests age, knowledge, and mythic awareness.",
    tags: ["expression", "fantasy", "wise", "ancient"],
  },
  {
    value: "magical_calm_expression",
    category: "fantasy_creature",
    categoryLabel: "Fantasy / Creature Expression",
    promptText:
      "the expression must feel magical and calm. Use soft mystical facial energy, serene emotional control, and a slightly otherworldly but approachable presence.",
    tags: ["expression", "fantasy", "magical", "calm"],
  },
  {
    value: "alien_unreadable_face",
    category: "fantasy_creature",
    categoryLabel: "Fantasy / Creature Expression",
    promptText:
      "the expression must feel alien and slightly unreadable. Keep the face emotionally ambiguous, subtly strange, and clearly nonhuman while remaining visually coherent.",
    tags: ["expression", "fantasy", "alien", "ambiguous"],
  },
  {
    value: "curious_nonhuman_expression",
    category: "fantasy_creature",
    categoryLabel: "Fantasy / Creature Expression",
    promptText:
      "the expression must feel curious in a nonhuman way. Use unusual but readable eye attention, subtle creature-like facial behavior, and a sense of strange intelligent interest.",
    tags: ["expression", "fantasy", "curious", "nonhuman"],
  },
];

export const ExpressionModule: PromptKeyModule = {
  key: "expression",
  icon: "smileys",

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
    expressionStyle: {
      id: "expressionStyle",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: expressionStyleOptions,
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