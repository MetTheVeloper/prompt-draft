import type { PromptTemplate } from "../types";

const PERSON_VARIABLE_ID = "template-linkedin-person";
const PERSON_TARGET = {
  kind: "user_variable" as const,
  value: "{person}",
  variableId: PERSON_VARIABLE_ID,
  token: "{person}",
  label: "Person",
};

/**
 * Curated from the successful Portrait Wizard LinkedIn/profile test pass.
 * This is a canonical Draft snapshot, not a precompiled prompt string.
 */
export const linkedinProfileTemplate: PromptTemplate = {
  schemaVersion: 1,
  id: "linkedin-profile",
  title: "LinkedIn Profile Portrait",
  description:
    "A clean professional head-and-shoulders portrait with subtle transformation, professional attire, a light gray studio background, and soft balanced lighting.",
  origin: "builtin",
  source: {
    kind: "wizard",
    wizardId: "portrait",
    wizardVersion: 2,
  },
  draft: {
    version: 1,
    selectedModuleKeys: [
      "variables",
      "framing",
      "expression",
      "pose",
      "hair",
      "outfit",
      "background",
      "lighting",
    ],
    moduleValues: {
      variables: {
        variables: [
          {
            id: PERSON_VARIABLE_ID,
            key: "person",
            value: "person in {reference}",
            label: "Person",
            description: "Person portrait subject",
            type: "subject",
            enabled: true,
            source: "user",
          },
        ],
      },
      framing: {
        shotSize: "head_and_shoulders",
        subjectPlacement: "",
        balance: "",
        compositionFeatures: [],
        viewAngle: "",
        viewDirection: "",
        cropSafety: [],
        extraDetails: "",
        customText: "",
      },
      expression: {
        expressionAssignments: [
          {
            id: "template-linkedin-expression",
            targets: [PERSON_TARGET],
            intensity: "subtle",
            eyeState: "relaxed",
            browState: "relaxed",
            mouthState: "slight_smile",
            additionalDetails: "confident expression",
          },
        ],
        customText: "",
      },
      pose: {
        poseAssignments: [
          {
            id: "template-linkedin-pose",
            presetId: "relaxed_standing",
            basePosture: "standing",
            torsoPosture: "",
            weightBalance: "shifted",
            bodyTension: "relaxed",
            locomotion: "",
            gestures: [],
            interactionDetails: "",
            additionalDetails: "",
            targets: [PERSON_TARGET],
          },
        ],
        customText: "",
      },
      hair: {
        hairStyles: [
          {
            id: "template-linkedin-hair",
            key: "portraitHair",
            name: "Portrait Hair",
            targets: [PERSON_TARGET],
            source: { mode: "defined" },
            properties: {
              stylingState: {
                mode: "option",
                value: "controlled",
              },
            },
            components: [],
          },
        ],
        customText: "",
      },
      outfit: {
        outfitSets: [
          {
            id: "template-linkedin-outfit",
            key: "portraitOutfit",
            name: "Portrait Outfit",
            targets: [PERSON_TARGET],
            items: [
              {
                id: "template-linkedin-outfit-item",
                key: "item1",
                name: "Professional Attire",
                type: "custom",
                customType: "professional attire",
                customCategory: "custom",
                source: { mode: "defined" },
                properties: {},
              },
            ],
            relations: [],
          },
        ],
        customText: "",
      },
      background: {
        backgroundConcept: "studio_background",
        backgroundType: "studio",
        setting: "indoor",
        spatialStructure: "seamless",
        backgroundMaterial: "seamless_paper",
        detailDensity: "restrained",
        backgroundElements: [],
        extraDetails: "plain light gray studio backdrop.",
        customText: "",
      },
      lighting: {
        lightSources: [
          {
            id: "soft-key",
            role: "key",
            sourceType: "area_light",
            direction: "front",
            quality: "very_soft",
            intensity: "balanced",
            color: "neutral",
            customColor: "",
            features: [],
          },
        ],
        ambientLevel: "balanced",
        overallContrast: "low",
        customText: "",
      },
    },
    modulePanelStates: {
      background: { activePresetId: "studio_background" },
      lighting: { activePresetId: "soft_diffused" },
    },
    promptSettings: {
      mode: "image_to_image",
      idea: "A professional portrait of {person} with the following settings",
      subject: "{person}",
      subjectType: "person",
      aspectRatio: "common_portrait_4_5",
      globalRules: "",
      imageToImage: {
        referenceUsage: "strict",
        transformationStrength: "subtle",
        preserveMainSubject: false,
        preserveIdentity: false,
        preservePose: false,
        preserveOutfit: false,
        preserveComposition: false,
        preserveColors: false,
        preserveMaterials: false,
        preserveLighting: false,
      },
    },
    outputFormat: "modular",
  },
};
