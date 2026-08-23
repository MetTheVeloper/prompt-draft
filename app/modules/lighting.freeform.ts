import type { PromptKeyModule } from "./types";
import { LightingModule as SemanticLightingModule } from "./lighting.module";
import { appendFreeformConfigOption } from "./freeformOptions";

const sourcesField = SemanticLightingModule.fields.lightSources;
const sourcesConfig = sourcesField.config || {};

export const LightingModule = {
  ...SemanticLightingModule,
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
