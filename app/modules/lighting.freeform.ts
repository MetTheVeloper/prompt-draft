import type { LightingSource, PromptKeyModule } from "./types";
import { LightingModule as SemanticLightingModule } from "./lighting.module";
import { appendFreeformConfigOption } from "./freeformOptions";

const sourcesField = SemanticLightingModule.fields.lightSources;
const sourcesConfig = sourcesField.config || {};
const semanticPresets = SemanticLightingModule.presets || {};
const moodySidePreset = semanticPresets.moody_side;

const lightingPresets = moodySidePreset
  ? {
      ...semanticPresets,
      moody_side: {
        ...moodySidePreset,
        values: {
          ...moodySidePreset.values,
          lightSources: Array.isArray(moodySidePreset.values.lightSources)
            ? (moodySidePreset.values.lightSources as LightingSource[]).map(
                (source) =>
                  source.sourceType === "studio"
                    ? { ...source, sourceType: "spotlight" }
                    : source,
              )
            : moodySidePreset.values.lightSources,
        },
      },
    }
  : semanticPresets;

export const LightingModule = {
  ...SemanticLightingModule,
  presets: lightingPresets,
  fields: {
    ...SemanticLightingModule.fields,
    lightSources: {
      ...sourcesField,
      config: {
        ...sourcesConfig,
        roleOptions: appendFreeformConfigOption(sourcesConfig.roleOptions),
        sourceTypeOptions: appendFreeformConfigOption(
          sourcesConfig.sourceTypeOptions,
        ),
        directionOptions: appendFreeformConfigOption(
          sourcesConfig.directionOptions,
        ),
        qualityOptions: appendFreeformConfigOption(
          sourcesConfig.qualityOptions,
        ),
        featureOptions: appendFreeformConfigOption(
          sourcesConfig.featureOptions,
        ),
      },
    },
  },
} satisfies PromptKeyModule;
