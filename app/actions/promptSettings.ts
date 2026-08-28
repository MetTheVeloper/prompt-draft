import { ASPECT_RATIO_GROUPS } from "../constants/aspectRatios";
import {
  setPromptOutputFormat,
  updatePromptSettings,
  type PromptSettingsUpdateInput,
} from "../domain/promptSettings";
import type { DomainIssue } from "../domain/types";
import type {
  PromptOutputFormat,
  PromptSettings,
} from "../utils/compilePromptCore";
import { ActionRegistry } from "./registry";
import type {
  ActionDefinition,
  ActionIssue,
} from "./types";

const PROMPT_MODES = ["text_to_image", "image_to_image"] as const;
const PROMPT_SUBJECT_TYPES = [
  "unspecified",
  "person",
  "object",
  "animal",
  "building",
  "product",
  "vehicle",
  "scene",
  "typography",
  "abstract",
  "custom",
] as const;
const REFERENCE_USAGE_VALUES = ["strict", "balanced", "loose"] as const;
const TRANSFORMATION_STRENGTH_VALUES = [
  "subtle",
  "balanced",
  "strong",
  "extreme",
] as const;
const PROMPT_OUTPUT_FORMATS = ["modular", "natural", "json"] as const;
const PROMPT_ASPECT_RATIOS = ASPECT_RATIO_GROUPS.flatMap((group) =>
  group.options.map((option) => option.value),
);

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

type PromptSettingsData = {
  promptSettings: PromptSettings;
};

type PromptOutputFormatSetInput = {
  format: PromptOutputFormat;
};

type PromptOutputFormatData = {
  outputFormat: PromptOutputFormat;
};

export const promptSettingsUpdateAction: ActionDefinition<
  PromptSettingsUpdateInput,
  PromptSettingsData
> = {
  id: "prompt.settings.update",
  description:
    "Update the canonical Prompt Settings aggregate through a closed typed patch, including partial image-to-image reference settings, without arbitrary Draft/path mutation.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      mode: { type: "string", enum: PROMPT_MODES },
      idea: { type: "string" },
      subject: { type: "string" },
      subjectType: { type: "string", enum: PROMPT_SUBJECT_TYPES },
      aspectRatio: { type: "string", enum: PROMPT_ASPECT_RATIOS },
      globalRules: { type: "string" },
      imageToImage: {
        type: "object",
        additionalProperties: false,
        properties: {
          referenceUsage: { type: "string", enum: REFERENCE_USAGE_VALUES },
          transformationStrength: {
            type: "string",
            enum: TRANSFORMATION_STRENGTH_VALUES,
          },
          preserveMainSubject: { type: "boolean" },
          preserveIdentity: { type: "boolean" },
          preservePose: { type: "boolean" },
          preserveOutfit: { type: "boolean" },
          preserveComposition: { type: "boolean" },
          preserveColors: { type: "boolean" },
          preserveMaterials: { type: "boolean" },
          preserveLighting: { type: "boolean" },
        },
      },
    },
  },
  execute: (context, input) => {
    const result = updatePromptSettings(context.draft, input);

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: result.value.draft,
      data: {
        promptSettings: result.value.promptSettings,
      },
    };
  },
};

export const promptOutputFormatSetAction: ActionDefinition<
  PromptOutputFormatSetInput,
  PromptOutputFormatData
> = {
  id: "prompt.outputFormat.set",
  description:
    "Set the canonical persisted prompt output format used by prompt.compile when no read-only format override is supplied.",
  inputSchema: {
    type: "object",
    required: ["format"],
    additionalProperties: false,
    properties: {
      format: {
        type: "string",
        enum: PROMPT_OUTPUT_FORMATS,
      },
    },
  },
  execute: (context, input) => {
    const result = setPromptOutputFormat(context.draft, input.format);

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: result.value.draft,
      data: {
        outputFormat: result.value.outputFormat,
      },
    };
  },
};

export const promptSettingsActions = [
  promptSettingsUpdateAction,
  promptOutputFormatSetAction,
] as const;

export function registerPromptSettingsActions(registry: ActionRegistry) {
  promptSettingsActions.forEach((action) => registry.register(action as any));
  return registry;
}
