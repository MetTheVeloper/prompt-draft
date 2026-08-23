import type { PromptKeyModule } from "./types";
import { PoseModule as SemanticPoseModule } from "./pose.semantic";
import { appendFreeformConfigOption } from "./freeformOptions";

const assignmentsField = SemanticPoseModule.fields.poseAssignments;
const assignmentsConfig = assignmentsField.config || {};

export const PoseModule = {
  ...SemanticPoseModule,
  fields: {
    ...SemanticPoseModule.fields,
    poseAssignments: {
      ...assignmentsField,
      config: {
        ...assignmentsConfig,
        basePostureOptions: appendFreeformConfigOption(
          assignmentsConfig.basePostureOptions,
        ),
        torsoPostureOptions: appendFreeformConfigOption(
          assignmentsConfig.torsoPostureOptions,
        ),
        weightBalanceOptions: appendFreeformConfigOption(
          assignmentsConfig.weightBalanceOptions,
        ),
        bodyTensionOptions: appendFreeformConfigOption(
          assignmentsConfig.bodyTensionOptions,
        ),
        locomotionOptions: appendFreeformConfigOption(
          assignmentsConfig.locomotionOptions,
        ),
        gestureOptions: appendFreeformConfigOption(
          assignmentsConfig.gestureOptions,
        ),
      },
    },
  },
} satisfies PromptKeyModule;
