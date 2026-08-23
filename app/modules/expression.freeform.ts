import type { PromptKeyModule } from "./types";
import { ExpressionModule as SemanticExpressionModule } from "./expression.semantic";
import { appendFreeformConfigOption } from "./freeformOptions";

const assignmentsField = SemanticExpressionModule.fields.expressionAssignments;
const assignmentsConfig = assignmentsField.config || {};

export const ExpressionModule = {
  ...SemanticExpressionModule,
  fields: {
    ...SemanticExpressionModule.fields,
    expressionAssignments: {
      ...assignmentsField,
      config: {
        ...assignmentsConfig,
        coreExpressionOptions: appendFreeformConfigOption(
          assignmentsConfig.coreExpressionOptions,
        ),
        eyeStateOptions: appendFreeformConfigOption(
          assignmentsConfig.eyeStateOptions,
        ),
        browStateOptions: appendFreeformConfigOption(
          assignmentsConfig.browStateOptions,
        ),
        mouthStateOptions: appendFreeformConfigOption(
          assignmentsConfig.mouthStateOptions,
        ),
      },
    },
  },
} satisfies PromptKeyModule;
