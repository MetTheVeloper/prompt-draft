import { findAspectRatioOption } from "../constants/aspectRatios";
import type { PromptDraftState } from "../modules/promptDraft.types";
import type {
  ImageToImageSettings,
  PromptOutputFormat,
  PromptSettings,
} from "../utils/compilePromptCore";
import {
  clonePromptDraftState,
  isPromptOutputFormat,
} from "../utils/promptDraftState";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type PromptSettingsUpdateInput = Partial<
  Pick<
    PromptSettings,
    "mode" | "idea" | "subject" | "subjectType" | "aspectRatio" | "globalRules"
  >
> & {
  imageToImage?: Partial<ImageToImageSettings>;
};

export type PromptSettingsMutation = {
  draft: PromptDraftState;
  promptSettings: PromptSettings;
};

export type PromptOutputFormatMutation = {
  draft: PromptDraftState;
  outputFormat: PromptOutputFormat;
};

function clonePromptSettings(settings: PromptSettings): PromptSettings {
  return {
    ...settings,
    imageToImage: {
      ...settings.imageToImage,
    },
  };
}

function hasImageToImageUpdate(
  input: Partial<ImageToImageSettings> | undefined,
) {
  if (!input) return false;

  return (
    input.referenceUsage !== undefined ||
    input.transformationStrength !== undefined ||
    input.preserveMainSubject !== undefined ||
    input.preserveIdentity !== undefined ||
    input.preservePose !== undefined ||
    input.preserveOutfit !== undefined ||
    input.preserveComposition !== undefined ||
    input.preserveColors !== undefined ||
    input.preserveMaterials !== undefined ||
    input.preserveLighting !== undefined
  );
}

function hasPromptSettingsUpdate(input: PromptSettingsUpdateInput) {
  return (
    input.mode !== undefined ||
    input.idea !== undefined ||
    input.subject !== undefined ||
    input.subjectType !== undefined ||
    input.aspectRatio !== undefined ||
    input.globalRules !== undefined ||
    hasImageToImageUpdate(input.imageToImage)
  );
}

export function updatePromptSettings(
  draft: PromptDraftState,
  input: PromptSettingsUpdateInput,
): DomainResult<PromptSettingsMutation> {
  if (!hasPromptSettingsUpdate(input)) {
    return domainFailure({
      code: "prompt_settings_update_empty",
    });
  }

  if (
    input.aspectRatio !== undefined &&
    !findAspectRatioOption(input.aspectRatio)
  ) {
    return domainFailure({
      code: "prompt_aspect_ratio_not_found",
      path: "aspectRatio",
      details: { aspectRatio: input.aspectRatio },
    });
  }

  const nextDraft = clonePromptDraftState(draft);
  const nextSettings = clonePromptSettings(nextDraft.promptSettings);

  if (input.mode !== undefined) nextSettings.mode = input.mode;
  if (input.idea !== undefined) nextSettings.idea = input.idea;
  if (input.subject !== undefined) nextSettings.subject = input.subject;
  if (input.subjectType !== undefined) nextSettings.subjectType = input.subjectType;
  if (input.aspectRatio !== undefined) nextSettings.aspectRatio = input.aspectRatio;
  if (input.globalRules !== undefined) nextSettings.globalRules = input.globalRules;

  const imageToImage = input.imageToImage;
  if (imageToImage) {
    if (imageToImage.referenceUsage !== undefined) {
      nextSettings.imageToImage.referenceUsage = imageToImage.referenceUsage;
    }
    if (imageToImage.transformationStrength !== undefined) {
      nextSettings.imageToImage.transformationStrength =
        imageToImage.transformationStrength;
    }
    if (imageToImage.preserveMainSubject !== undefined) {
      nextSettings.imageToImage.preserveMainSubject =
        imageToImage.preserveMainSubject;
    }
    if (imageToImage.preserveIdentity !== undefined) {
      nextSettings.imageToImage.preserveIdentity = imageToImage.preserveIdentity;
    }
    if (imageToImage.preservePose !== undefined) {
      nextSettings.imageToImage.preservePose = imageToImage.preservePose;
    }
    if (imageToImage.preserveOutfit !== undefined) {
      nextSettings.imageToImage.preserveOutfit = imageToImage.preserveOutfit;
    }
    if (imageToImage.preserveComposition !== undefined) {
      nextSettings.imageToImage.preserveComposition =
        imageToImage.preserveComposition;
    }
    if (imageToImage.preserveColors !== undefined) {
      nextSettings.imageToImage.preserveColors = imageToImage.preserveColors;
    }
    if (imageToImage.preserveMaterials !== undefined) {
      nextSettings.imageToImage.preserveMaterials =
        imageToImage.preserveMaterials;
    }
    if (imageToImage.preserveLighting !== undefined) {
      nextSettings.imageToImage.preserveLighting = imageToImage.preserveLighting;
    }
  }

  nextDraft.promptSettings = nextSettings;

  return domainSuccess({
    draft: nextDraft,
    promptSettings: clonePromptSettings(nextSettings),
  });
}

export function setPromptOutputFormat(
  draft: PromptDraftState,
  outputFormat: PromptOutputFormat,
): DomainResult<PromptOutputFormatMutation> {
  if (!isPromptOutputFormat(outputFormat)) {
    return domainFailure({
      code: "prompt_output_format_invalid",
      path: "outputFormat",
      details: { outputFormat },
    });
  }

  const nextDraft = clonePromptDraftState(draft);
  nextDraft.outputFormat = outputFormat;

  return domainSuccess({
    draft: nextDraft,
    outputFormat,
  });
}
