export default {
  living: {
    wizardTitle: "Portrait Wizard",
    values: {
      creationMode: {
        from_image: "Start from an image",
        from_description: "Start from a description",
      },
      portrait: {
        professional: "Professional",
        cinematic: "Cinematic",
        fashion: "Fashion",
        fantasy: "Fantasy",
      },
      expression: {
        natural: "Natural",
        confident: "Confident",
        warm: "Warm",
        serious: "Serious",
      },
      hair: {
        keep_reference: "Keep reference",
        natural: "Natural",
        polished: "Polished",
        editorial: "Editorial",
      },
      outfit: {
        keep_reference: "Keep reference",
        professional: "Professional",
        fashion: "Fashion",
        fantasy: "Fantasy",
      },
      framing: {
        headshot: "Headshot",
        head_shoulders: "Head and shoulders",
        half_body: "Half body",
        full_body: "Full body",
      },
      pose: {
        natural: "Natural",
        formal: "Formal",
        dynamic: "Dynamic",
      },
      environment: {
        studio: "Studio",
        outdoor: "Outdoor",
        abstract: "Abstract",
      },
      lighting: {
        soft: "Soft",
        dramatic: "Dramatic",
        moody: "Moody",
        clean: "Clean",
      },
      referenceUsage: {
        strict: "Stay close",
        balanced: "Balanced",
        loose: "Use it loosely",
      },
      transformationStrength: {
        subtle: "Subtle",
        balanced: "Balanced",
        strong: "Strong",
        extreme: "Extreme",
      },
      domains: {
        expression: "expression",
        hair: "hair",
        outfit: "outfit",
        pose: "pose",
      },
    },
    review: {
      generate: "Generate prompt",
      aspectRatioValue: "{label} · {value}",
    },
    errors: {
      required: "Please answer the required question before continuing.",
      mapping: "Some choices could not be applied. Review your answers and try again.",
      compile: "The generated prompt could not be validated or compiled. Review the Wizard choices and try again.",
      handoff: "The finished prompt could not be added to Create.",
      unknownWizard: "Unknown Wizard: {id}",
      missingReview: "Some required Wizard information is still missing.",
    },
    fallback: {
      unavailable: "Wizard unavailable",
      loading: "Loading Wizard…",
      backToCreate: "Back to Create",
      savedFrom: "Saved from {title}.",
    },
  },
};
