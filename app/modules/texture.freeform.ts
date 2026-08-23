import type { PromptKeyModule } from "./types";
import { TextureModule as SemanticTextureModule } from "./texture.semantic";
import { appendFreeformConfigOption } from "./freeformOptions";

const assignmentsField = SemanticTextureModule.fields.materialAssignments;
const assignmentsConfig = assignmentsField.config || {};

export const TextureModule = {
  ...SemanticTextureModule,
  fields: {
    ...SemanticTextureModule.fields,
    materialAssignments: {
      ...assignmentsField,
      config: {
        ...assignmentsConfig,
        materialOptions: appendFreeformConfigOption(
          assignmentsConfig.materialOptions,
        ),
        finishOptions: appendFreeformConfigOption(
          assignmentsConfig.finishOptions,
        ),
        surfaceTextureOptions: appendFreeformConfigOption(
          assignmentsConfig.surfaceTextureOptions,
        ),
        opticalCharacterOptions: appendFreeformConfigOption(
          assignmentsConfig.opticalCharacterOptions,
        ),
        conditionOptions: appendFreeformConfigOption(
          assignmentsConfig.conditionOptions,
        ),
      },
    },
  },
} satisfies PromptKeyModule;
