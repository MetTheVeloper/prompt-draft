import type { ModuleFieldOption, PromptKeyModule } from "./types";
import { FormModule as BaseFormModule } from "./form.module";

type PromptTextOverrides = Record<string, string>;

function overrideOptions(
  options: ModuleFieldOption[] | undefined,
  overrides: PromptTextOverrides,
) {
  return (options || []).map((option) => ({
    ...option,
    promptText: overrides[option.value] ?? option.promptText,
  }));
}

const formLanguagePromptText: PromptTextOverrides = {
  stratified_environment:
    "stratified environmental form language with clearly separated structural layers",
  serpentine_animal:
    "serpentine animal form language with sinuous continuous body flow",
};

const proportionPromptText: PromptTextOverrides = {
  scene_towering:
    "towering environmental proportions with dominant vertical masses",
  animal_long_body_short_limbs:
    "long-bodied animal proportions with comparatively short limbs",
};

const transformationPromptText: PromptTextOverrides = {
  elegant_caricature:
    "elegant anatomical exaggeration with sharpened facial planes and controlled proportional distortion",
  alien_elongation:
    "alien-like anatomical restructuring with unfamiliar nonhuman body ratios",
  distorted_elegance:
    "elegant anatomical distortion with controlled uncanny imbalance",
  radical_silhouette:
    "radically altered body silhouette with redistributed width, length, and mass",

  type_wave:
    "letterforms warped into repeating wave curvature",

  scene_terrain_fold:
    "environmental masses folded into broad ridge formations",
  scene_strata_shift:
    "environmental strata offset into displaced terraces",

  animal_serpentine_elongation:
    "serpentine anatomical restructuring with pronounced winding curvature",
};

export const FormModule = {
  ...BaseFormModule,
  fields: {
    ...BaseFormModule.fields,
    formLanguage: {
      ...BaseFormModule.fields.formLanguage,
      options: overrideOptions(
        BaseFormModule.fields.formLanguage.options,
        formLanguagePromptText,
      ),
    },
    proportions: {
      ...BaseFormModule.fields.proportions,
      options: overrideOptions(
        BaseFormModule.fields.proportions.options,
        proportionPromptText,
      ),
    },
    transformation: {
      ...BaseFormModule.fields.transformation,
      options: overrideOptions(
        BaseFormModule.fields.transformation.options,
        transformationPromptText,
      ),
    },
  },
} satisfies PromptKeyModule;
